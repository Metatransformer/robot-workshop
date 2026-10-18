import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CatalogItem, IngestionDraft } from "../src/lib/contracts";
import { extractDocument, saveReviewedIngestion } from "../src/server/ingestion";

const temporaryDirectories: string[] = [];

beforeEach(async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "workshop-ingestion-"));
  temporaryDirectories.push(directory);
  process.env.METATRANSFORMER_HOME = path.join(directory, "home");
});

afterEach(async () => {
  delete process.env.METATRANSFORMER_HOME;
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function reviewedItem(draft: IngestionDraft, specs = draft.specifications): CatalogItem {
  const now = new Date().toISOString();
  return {
    id: "reviewed-sensor",
    name: draft.name,
    kind: "part",
    category: draft.category,
    description: draft.description,
    manufacturer: draft.manufacturer || undefined,
    tags: [],
    specs,
    sources: [draft.source],
    ownedQuantity: 0,
    notes: "",
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

function minimalPdf(text: string): Buffer {
  const escaped = text.replace(/([\\()])/g, "\\$1");
  const stream = `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "binary");
}

describe("document ingestion", () => {
  it("extracts exact labelled and simple table claims without fetching a metadata URL", async () => {
    const draft = await extractDocument({
      text: "Product: Room Sensor\nManufacturer: Example Lab\nVoltage: 3.3 V\nRange | 0 to 50 | C\n",
      fileName: "sensor.md",
      sourceUrl: "https://example.com/reference",
    });

    expect(draft.name).toBe("Room Sensor");
    expect(draft.manufacturer).toBe("Example Lab");
    expect(draft.specifications).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Voltage", value: "3.3", unit: "V", evidence: "document", quote: "Voltage: 3.3 V" }),
      expect.objectContaining({ label: "Range", value: "0 to 50", unit: "C", evidence: "document" }),
    ]));
    expect(draft.source.url).toBe("https://example.com/reference");
    expect(draft.source.hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("extracts text from a real minimal PDF and retains the page number", async () => {
    const pdf = minimalPdf("Voltage: 3.3 V");
    const draft = await extractDocument({ base64: pdf.toString("base64"), fileName: "spec.pdf" });

    expect(draft.pageCount).toBe(1);
    expect(draft.source.text).toContain("Voltage: 3.3 V");
    expect(draft.specifications).toContainEqual(expect.objectContaining({ label: "Voltage", value: "3.3", unit: "V", page: 1 }));
  });

  it("rejects malformed PDFs and unsafe source URL schemes visibly", async () => {
    await expect(extractDocument({ base64: Buffer.from("%PDF-not-valid").toString("base64"), fileName: "bad.pdf" })).rejects.toThrow(/malformed|encrypted|could not be extracted/i);
    await expect(extractDocument({ text: "Voltage: 3.3 V", sourceUrl: "file:///etc/passwd" })).rejects.toThrow(/HTTP or HTTPS/i);
  });

  it("reclassifies edited or unsupported document claims as manual and preserves the immutable source", async () => {
    const draft = await extractDocument({ text: "Product: Sensor\nVoltage: 3.3 V\nCurrent: 2 mA\n", fileName: "claims.txt" });
    const voltage = draft.specifications.find((specification) => specification.label === "Voltage")!;
    const saved = await saveReviewedIngestion({
      draftId: draft.id,
      item: reviewedItem(draft, [
        { ...voltage, value: "5", evidence: "document", quote: voltage.quote, sourceId: voltage.sourceId },
        { label: "Color", value: "blue", evidence: "document", quote: "not in source", sourceId: draft.source.id },
      ]),
    });

    expect(saved.specs).toEqual([
      { label: "Voltage", value: "5", unit: "V", evidence: "manual" },
      { label: "Color", value: "blue", evidence: "manual" },
    ]);
    expect(saved.sources[0]).toEqual(draft.source);
    expect(saved.sources[0].text).toContain("Voltage: 3.3 V");
  });

  it("keeps unchanged selected evidence and excludes unselected rows", async () => {
    const draft = await extractDocument({ text: "Voltage: 3.3 V\nCurrent: 2 mA\n" });
    const selected = draft.specifications.find((specification) => specification.label === "Voltage")!;
    const saved = await saveReviewedIngestion({ draftId: draft.id, item: reviewedItem(draft, [selected]) });

    expect(saved.specs).toHaveLength(1);
    expect(saved.specs[0]).toEqual(selected);
  });
});

it("does not mistake legal prose or PDF running headers for engineering specs", async () => {
  const draft = await extractDocument({ text: "Raspberry Pi | Raspberry Pi Pico Datasheet Datasheet\nINCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES\nTO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA\nVoltage,3.3,V\n" });
  expect(draft.specifications).toHaveLength(1);
  expect(draft.specifications[0]).toMatchObject({ label: "Voltage", value: "3.3", unit: "V" });
});

it("keeps numeric datasheet feature bullets verbatim instead of inventing ratings", async () => {
  const draft = await extractDocument({ text: "• RP2040 microcontroller with 2 MB Flash\n• High quality and low cost\n" });
  expect(draft.specifications).toHaveLength(1);
  expect(draft.specifications[0]).toMatchObject({ label: "Document feature", value: "RP2040 microcontroller with 2 MB Flash", quote: "• RP2040 microcontroller with 2 MB Flash" });
});
