import { createHash, randomUUID } from "node:crypto";
import { chmod, link, mkdir, open, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { Worker } from "node:worker_threads";
import { z } from "zod";
import {
  CatalogItemSchema,
  Id,
  SourceSchema,
  SpecSchema,
  type CatalogItem,
  type IngestionDraft,
  type Specification,
} from "../lib/contracts";
import { saveCatalogItem } from "./store";

const MAX_FILE_BYTES = 24 * 1024 * 1024;
const MAX_TEXT_CHARACTERS = 250_000;
const MAX_PAGES = 100;
const PDF_TIMEOUT_MS = 12_000;

const DraftSchema = z.object({
  id: Id,
  name: z.string(),
  manufacturer: z.string(),
  category: z.string(),
  description: z.string(),
  source: SourceSchema,
  specifications: z.array(SpecSchema),
  warnings: z.array(z.string()),
  pageCount: z.number().int().positive().optional(),
});

const StoredDraftSchema = z.object({
  draft: DraftSchema,
  originalBase64: z.string(),
  mediaType: z.enum(["application/pdf", "text/plain", "text/markdown", "text/csv"]),
});

type ExtractInput = { text?: string; base64?: string; fileName?: string; sourceUrl?: string };

function ingestionDirectory(): string {
  const home = path.resolve(/* turbopackIgnore: true */ process.env.METATRANSFORMER_HOME || path.join(process.cwd(), ".workshop"));
  return path.join(home, "ingestion");
}

async function ensurePrivateDirectory(directory: string): Promise<void> {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
}

async function atomicCreateJson(filePath: string, value: unknown): Promise<void> {
  await ensurePrivateDirectory(path.dirname(filePath));
  const temporary = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await link(temporary, filePath);
    await unlink(temporary);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

function validateSourceUrl(sourceUrl?: string): string | undefined {
  if (!sourceUrl) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new Error("Source URL must be a valid HTTP or HTTPS URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Source URL must use HTTP or HTTPS");
  return parsed.toString();
}

function decodeBase64(input: string): Buffer {
  const compact = input.replace(/\s/g, "");
  if (!compact || compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    throw new Error("Uploaded content is not valid base64");
  }
  const decoded = Buffer.from(compact, "base64");
  const canonical = decoded.toString("base64").replace(/=+$/, "");
  if (canonical !== compact.replace(/=+$/, "")) throw new Error("Uploaded content is not valid base64");
  return decoded;
}

function mediaTypeFor(fileName: string | undefined, bytes: Buffer, suppliedAsText: boolean): "application/pdf" | "text/plain" | "text/markdown" | "text/csv" {
  const extension = path.extname(fileName ?? "").toLowerCase();
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-" || extension === ".pdf") return "application/pdf";
  if (extension === ".md" || extension === ".markdown") return "text/markdown";
  if (extension === ".csv") return "text/csv";
  if (suppliedAsText || !extension || extension === ".txt") return "text/plain";
  throw new Error("Supported document types are PDF, TXT, Markdown, and CSV");
}

async function extractPdfBounded(bytes: Buffer): Promise<{ totalPages: number; text: string[] }> {
  const workerSource = `
    const { parentPort, workerData } = require("node:worker_threads");
    const { extractText } = require("unpdf");
    extractText(new Uint8Array(Buffer.from(workerData, "base64")), { mergePages: false })
      .then((result) => parentPort.postMessage({ ok: true, result }))
      .catch((error) => parentPort.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) }));
  `;
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerSource, { eval: true, workerData: bytes.toString("base64") });
    let settled = false;
    const finish = (operation: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      operation();
    };
    const timer = setTimeout(() => {
      finish(() => {
        void worker.terminate();
        reject(new Error(`PDF extraction exceeded the ${PDF_TIMEOUT_MS} ms time limit`));
      });
    }, PDF_TIMEOUT_MS);
    worker.once("message", (message: { ok: boolean; result?: { totalPages: number; text: string[] }; error?: string }) => {
      finish(() => {
        void worker.terminate();
        if (message.ok && message.result) resolve(message.result);
        else reject(new Error(message.error || "PDF extraction failed"));
      });
    });
    worker.once("error", (error) => finish(() => reject(error)));
    worker.once("exit", (code) => {
      if (code !== 0) finish(() => reject(new Error(`PDF extraction worker exited with code ${code}`)));
    });
  });
}

function splitValueAndUnit(raw: string): { value: string; unit?: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:\s*(?:to|–|-|±)\s*[+-]?\d+(?:\.\d+)?)?)\s*([A-Za-z°µμ%Ω/][A-Za-z0-9°µμ%Ω/·^.-]*)?$/u);
  if (!match) return { value: trimmed };
  return { value: match[1].replace(/\s+/g, " "), ...(match[2] ? { unit: match[2] } : {}) };
}

function candidateSpec(label: string, rawValue: string, quote: string, sourceId: string, page?: number): Specification | undefined {
  const cleanLabel = label.trim().replace(/^[-*#\s]+/, "").replace(/\s+/g, " ");
  const cleanValue = rawValue.trim().replace(/\s+/g, " ");
  if (!cleanLabel || cleanLabel.length > 64 || cleanLabel.split(" ").length > 8 || !cleanValue || cleanValue.length > 160) return undefined;
  if (/^(including|to|note|notes|warning|copyright|license|figure|table|page|http|https)\b/i.test(cleanLabel)) return undefined;
  if (/^(description|manufacturer|product|product name|part name|name|category|title)$/i.test(cleanLabel)) return undefined;
  const value = splitValueAndUnit(cleanValue);
  return SpecSchema.parse({
    label: cleanLabel,
    value: value.value,
    ...(value.unit ? { unit: value.unit } : {}),
    evidence: "document",
    sourceId,
    quote: quote.slice(0, 2000),
    ...(page ? { page } : {}),
  });
}

function parseSpecifications(pages: string[], sourceId: string): Specification[] {
  const found: Specification[] = [];
  const seen = new Set<string>();
  const add = (candidate: Specification | undefined) => {
    if (!candidate) return;
    const key = `${candidate.label.toLowerCase()}\0${candidate.value}\0${candidate.unit ?? ""}\0${candidate.page ?? ""}`;
    if (!seen.has(key) && found.length < 100) {
      seen.add(key);
      found.push(candidate);
    }
  };

  pages.forEach((pageText, pageIndex) => {
    for (const originalLine of pageText.split(/\r?\n/)) {
      const line = originalLine.trim();
      if (!line || line.length > 2_000) continue;
      // Preserve concise numeric feature bullets verbatim. These are deliberately
      // not converted into inferred ratings or component compatibility claims.
      const feature = line.match(/^[•◦●▪]\s+(.{1,160})$/);
      if (feature && /\d/.test(feature[1]) && /\b(flash|gpio|adc|mhz|khz|sram|ram|voltage|current|mm|pcb|pins?|usb|torque|rpm)\b/i.test(feature[1])) {
        add(candidateSpec("Document feature", feature[1], line, sourceId, pageIndex + 1));
        continue;
      }
      const labelled = line.match(/^[-*]?\s*([A-Za-z][A-Za-z0-9 ()/_-]{0,158})\s*:\s*(\S.+)$/);
      if (labelled) {
        add(candidateSpec(labelled[1], labelled[2], line, sourceId, pageIndex + 1));
        continue;
      }
      const delimiter = line.includes("|") ? "|" : line.includes("\t") ? "\t" : line.includes(",") ? "," : undefined;
      if (!delimiter) continue;
      const columns = line.split(delimiter).map((column) => column.trim()).filter(Boolean);
      if (columns.length < 2 || columns.length > 4) continue;
      if (delimiter === "," && !/^(?:[+\-]?\d+(?:\.\d+)?(?:\s*(?:to|±|-|–)\s*\d+(?:\.\d+)?)?(?:\s*[A-Za-z°µμ%Ω/]+)?|I2C|SPI|UART|USB|CAN|PWM)$/i.test(columns[1])) continue;
      // Delimiters also occur in prose, legal notices and page headers. Only
      // engineering-property rows are candidates; keep all other source text
      // available for manual review rather than inventing a table structure.
      if (!/\b(voltage|current|power|frequency|clock|memory|flash|ram|sram|rom|range|resolution|accuracy|interface|protocol|bus|gpio|pin|pins|weight|mass|length|width|height|diameter|torque|speed|temperature|humidity|pressure|supply|input|output|capacity|resistance|inductance|capacitance|material|connector|dimensions|vdd|vddio|vcc|vin|vsys|usb|cpu|processor)\b/i.test(columns[0])) continue;
      if (/^(parameter|specification|label|name)$/i.test(columns[0]) && /^(value|rating)$/i.test(columns[1])) continue;
      const value = columns.length >= 3 && /^[A-Za-z°µμ%Ω/][A-Za-z0-9°µμ%Ω/·^.-]*$/u.test(columns[2])
        ? `${columns[1]} ${columns[2]}`
        : columns[1];
      add(candidateSpec(columns[0], value, line, sourceId, pageIndex + 1));
    }
  });
  return found;
}

function labelledCandidate(text: string, labels: string[]): string {
  const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const match = text.match(new RegExp(`^(?:${escaped})\\s*:\\s*(.+)$`, "im"));
  return match?.[1]?.trim().slice(0, 160) ?? "";
}

function nameCandidate(text: string, fileName?: string): string {
  const labelled = labelledCandidate(text, ["product name", "part name", "product", "name", "title"]);
  if (labelled) return labelled;
  const heading = text.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading.slice(0, 160);
  if (fileName) return path.basename(fileName, path.extname(fileName)).replace(/[-_]+/g, " ").slice(0, 160) || "Untitled item";
  return "Untitled item";
}

export async function extractDocument(input: ExtractInput): Promise<IngestionDraft> {
  const hasText = input.text !== undefined;
  const hasBase64 = input.base64 !== undefined;
  if (hasText === hasBase64) throw new Error("Provide exactly one of text or base64 document content");
  if (input.fileName && (path.basename(input.fileName) !== input.fileName || Buffer.byteLength(input.fileName, "utf8") > 300)) {
    throw new Error("File name must be a short base name without path components");
  }
  const sourceUrl = validateSourceUrl(input.sourceUrl);
  const original = hasText ? Buffer.from(input.text ?? "", "utf8") : decodeBase64(input.base64 ?? "");
  if (original.byteLength > MAX_FILE_BYTES) throw new Error(`Document exceeds the ${MAX_FILE_BYTES} byte limit`);
  const mediaType = mediaTypeFor(input.fileName, original, hasText);

  let pages: string[];
  let pageCount: number | undefined;
  if (mediaType === "application/pdf") {
    if (!/^%PDF-\d\.\d/.test(original.subarray(0, 8).toString("ascii"))) throw new Error("Malformed PDF: missing or invalid PDF header");
    try {
      const extracted = await extractPdfBounded(original);
      if (extracted.totalPages > MAX_PAGES) throw new Error(`PDF exceeds the ${MAX_PAGES} page limit`);
      pageCount = extracted.totalPages;
      pages = extracted.text;
    } catch (error) {
      if (error instanceof Error && (error.message.includes("page limit") || error.message.includes("time limit"))) throw error;
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(`PDF could not be extracted (it may be malformed or encrypted): ${detail}`);
    }
  } else {
    pages = [original.toString("utf8")];
  }

  const combinedText = pageCount
    ? pages.map((pageText, index) => `[Page ${index + 1}]\n${pageText.trim()}`).join("\n\n")
    : pages[0];
  if (combinedText.length > MAX_TEXT_CHARACTERS) throw new Error(`Extracted text exceeds the ${MAX_TEXT_CHARACTERS} character limit`);
  const id = randomUUID();
  const capturedAt = new Date().toISOString();
  const source = SourceSchema.parse({
    id: `source-${id}`,
    title: input.fileName ? `Imported from ${input.fileName}` : sourceUrl ? `Imported from ${sourceUrl}` : "Pasted source text",
    ...(sourceUrl ? { url: sourceUrl } : {}),
    ...(input.fileName ? { fileName: input.fileName } : {}),
    hash: createHash("sha256").update(original).digest("hex"),
    capturedAt,
    text: combinedText,
  });
  const noText = !pages.some((pageText) => pageText.trim().length > 0);
  const specifications = noText ? [] : parseSpecifications(pages, source.id);
  const description = labelledCandidate(combinedText, ["description"]);
  const draft: IngestionDraft = {
    id,
    name: nameCandidate(combinedText, input.fileName),
    manufacturer: labelledCandidate(combinedText, ["manufacturer", "maker"]),
    category: labelledCandidate(combinedText, ["category"]) || "uncategorized",
    description,
    source,
    specifications,
    warnings: noText
      ? ["No extractable text was found. This may be a scanned document; use OCR or enter reviewed specifications manually while retaining this original source."]
      : specifications.length === 0
        ? ["No simple labelled or tabular specifications were found. Review the source and enter supported values manually."]
        : ["Extracted fields are document claims and require review; compatibility and physical performance are not verified."],
    ...(pageCount ? { pageCount } : {}),
  };
  const parsedDraft = DraftSchema.parse(draft) as IngestionDraft;
  await atomicCreateJson(path.join(ingestionDirectory(), `${id}.json`), {
    draft: parsedDraft,
    originalBase64: original.toString("base64"),
    mediaType,
  });
  return parsedDraft;
}

function sameExtractedSpec(left: Specification, right: Specification): boolean {
  return left.label === right.label && left.value === right.value && (left.unit ?? "") === (right.unit ?? "");
}

export async function saveReviewedIngestion(input: { draftId: string; item: CatalogItem }): Promise<CatalogItem> {
  const draftId = Id.parse(input.draftId);
  let stored: z.infer<typeof StoredDraftSchema>;
  try {
    stored = StoredDraftSchema.parse(JSON.parse(await readFile(path.join(ingestionDirectory(), `${draftId}.json`), "utf8")) as unknown);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw new Error(`Ingestion draft not found: ${draftId}`);
    throw new Error(`Ingestion draft is corrupt or unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }
  const submitted = CatalogItemSchema.parse(input.item);
  const specifications = submitted.specs.map((specification) => {
    const extracted = stored.draft.specifications.find((candidate) => sameExtractedSpec(candidate, specification));
    if (extracted && specification.evidence === "document") return structuredClone(extracted);
    return SpecSchema.parse({
      label: specification.label,
      value: specification.value,
      ...(specification.unit ? { unit: specification.unit } : {}),
      evidence: "manual",
    });
  });
  const originalSource = stored.draft.source;
  const sources = submitted.sources.filter((candidate) => candidate.id !== originalSource.id);
  sources.unshift(originalSource);
  const reviewed = CatalogItemSchema.parse({ ...submitted, specifications: undefined, specs: specifications, sources });
  return saveCatalogItem(reviewed);
}
