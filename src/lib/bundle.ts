import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, rmdir, unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { ProjectSchema, type Project } from "./contracts";

const MAX_ENCODED_BYTES = 32 * 1024 * 1024;
const MAX_RAW_BYTES = 16 * 1024 * 1024;
const MAX_FILE_COUNT = 2_000;

const BundleFileSchema = z.object({
  path: z.string(),
  kind: z.enum(["document", "code", "image", "data", "model", "other"]),
  size: z.number().int().nonnegative().max(MAX_RAW_BYTES),
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  encoding: z.literal("base64"),
  content: z.string(),
}).strict();

const SourceBundleSchema = z.object({
  format: z.literal("metatransformer-source-bundle"),
  version: z.literal(1),
  project: ProjectSchema,
  files: z.array(BundleFileSchema).max(MAX_FILE_COUNT),
}).strict();

type OwnedFile = { path: string; dev: number; ino: number };
type OwnedDirectory = { path: string; dev: number; ino: number };
type ValidatedFile = z.infer<typeof BundleFileSchema> & { bytes: Buffer };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function hashBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function normalizedBundlePath(input: string): string {
  if (!input || input.includes("\0") || input.includes("\\") || path.posix.isAbsolute(input) || /^[a-zA-Z]:/.test(input)) {
    throw new Error(`Bundle file path must be a non-empty relative POSIX path: ${JSON.stringify(input)}`);
  }
  const normalized = path.posix.normalize(input);
  if (normalized !== input || normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`Bundle file path is not canonical or escapes the destination: ${input}`);
  }
  const segments = normalized.split("/");
  if (segments.some((segment) => segment.startsWith("."))) {
    throw new Error(`Hidden paths are not allowed in source bundles: ${input}`);
  }
  if (segments[0]?.toLowerCase() === "project.json") {
    throw new Error(`project.json is reserved for the imported manifest: ${input}`);
  }
  if (isSensitivePath(segments)) {
    throw new Error(`Secrets, credentials, and transcripts are not allowed in source bundles: ${input}`);
  }
  return normalized;
}

function isSensitivePath(segments: string[]): boolean {
  const lowered = segments.map((segment) => segment.toLowerCase());
  const name = lowered.at(-1) ?? "";
  const sensitiveDirectories = new Set([
    "secrets",
    "credentials",
    "transcripts",
    "agent-transcripts",
    "agent_transcripts",
    ".codex",
    ".claude",
    ".agents",
  ]);
  return lowered.some((segment) => sensitiveDirectories.has(segment))
    || name.startsWith(".env")
    || name.startsWith("secret.")
    || name.startsWith("secrets.")
    || name.startsWith("credential.")
    || name.startsWith("credentials.")
    || name === "id_rsa"
    || name.startsWith("id_rsa.")
    || name === "id_ed25519"
    || name.startsWith("id_ed25519.")
    || name.endsWith(".pem")
    || name.endsWith(".key")
    || name.includes("transcript");
}

function filesystemCollisionKey(filePath: string): string {
  return filePath.normalize("NFC").toLocaleLowerCase("en-US");
}

function decodeBase64Strict(content: string, filePath: string): Buffer {
  if (content.length % 4 !== 0 || (content.length > 0 && !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content))) {
    throw new Error(`Malformed base64 content for ${filePath}`);
  }
  const bytes = Buffer.from(content, "base64");
  if (bytes.toString("base64") !== content) throw new Error(`Malformed base64 content for ${filePath}`);
  return bytes;
}

async function readBundleFile(bundleFile: string): Promise<Buffer> {
  const handle = await open(path.resolve(bundleFile), constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = await handle.stat();
    if (!before.isFile()) throw new Error("Source bundle must be a regular file");
    if (before.size > MAX_ENCODED_BYTES) throw new Error(`Source bundle exceeds the ${MAX_ENCODED_BYTES} byte encoded input limit`);
    const bytes = await handle.readFile();
    const after = await handle.stat();
    if (bytes.byteLength > MAX_ENCODED_BYTES) throw new Error(`Source bundle exceeds the ${MAX_ENCODED_BYTES} byte encoded input limit`);
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || bytes.byteLength !== after.size) {
      throw new Error("Source bundle changed while it was being read");
    }
    return bytes;
  } finally {
    await handle.close();
  }
}

async function validateBundle(bundleFile: string): Promise<{ project: Project; files: ValidatedFile[] }> {
  const encoded = await readBundleFile(bundleFile);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(encoded.toString("utf8")) as unknown;
  } catch (error) {
    throw new Error(`Source bundle is not valid JSON: ${errorMessage(error)}`);
  }

  const parsed = SourceBundleSchema.safeParse(parsedJson);
  if (!parsed.success) throw new Error(`Source bundle schema is invalid: ${parsed.error.message}`);

  let rawBytes = 0;
  const seen = new Set<string>();
  const files: ValidatedFile[] = parsed.data.files.map((file) => {
    const normalizedPath = normalizedBundlePath(file.path);
    const collisionKey = filesystemCollisionKey(normalizedPath);
    if (seen.has(collisionKey)) throw new Error(`Duplicate bundle file path: ${normalizedPath}`);
    seen.add(collisionKey);

    const bytes = decodeBase64Strict(file.content, normalizedPath);
    rawBytes += bytes.byteLength;
    if (rawBytes > MAX_RAW_BYTES) throw new Error(`Source bundle exceeds the ${MAX_RAW_BYTES} byte raw content limit`);
    if (bytes.byteLength !== file.size) throw new Error(`Source bundle size mismatch for ${normalizedPath}`);
    if (hashBytes(bytes) !== file.hash) throw new Error(`Source bundle SHA256 hash mismatch for ${normalizedPath}`);
    return { ...file, path: normalizedPath, bytes };
  });

  for (const key of seen) {
    const segments = key.split("/");
    for (let index = 1; index < segments.length; index += 1) {
      if (seen.has(segments.slice(0, index).join("/"))) {
        throw new Error(`Bundle paths collide as a file and directory: ${key}`);
      }
    }
  }

  const now = new Date().toISOString();
  let importedId = randomUUID();
  while (importedId === parsed.data.project.id) importedId = randomUUID();
  const project = ProjectSchema.parse({
    ...parsed.data.project,
    id: importedId,
    createdAt: now,
    updatedAt: now,
    provenance: { sourceProjectId: parsed.data.project.id },
    bom: parsed.data.project.bom.map((entry) => ({
      ...entry,
      snapshot: { ...entry.snapshot, ownedQuantity: 0, notes: "" },
    })),
  });
  return { project, files };
}

async function inspectDestination(destination: string): Promise<string> {
  const absolute = path.resolve(destination);
  const parsed = path.parse(absolute);
  const segments = absolute.slice(parsed.root.length).split(path.sep).filter(Boolean);
  if (segments.length === 0) throw new Error(`Import destination already exists: ${absolute}`);
  let current = parsed.root;
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    try {
      const details = await lstat(current);
      if (details.isSymbolicLink()) throw new Error(`Symlink destination ancestor is not allowed: ${current}`);
      if (index === segments.length - 1) throw new Error(`Import destination already exists: ${absolute}`);
      if (!details.isDirectory()) throw new Error(`Import destination ancestor is not a directory: ${current}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") break;
      throw error;
    }
  }
  return absolute;
}

async function createDirectoryExclusive(directory: string, ownedDirectories: OwnedDirectory[]): Promise<void> {
  await mkdir(directory, { mode: 0o700 });
  const details = await lstat(directory);
  if (!details.isDirectory() || details.isSymbolicLink()) throw new Error(`Created path is not a real directory: ${directory}`);
  ownedDirectories.push({ path: directory, dev: details.dev, ino: details.ino });
}

async function createDestination(destination: string, ownedDirectories: OwnedDirectory[]): Promise<void> {
  const parsed = path.parse(destination);
  const segments = destination.slice(parsed.root.length).split(path.sep).filter(Boolean);
  let current = parsed.root;
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    try {
      const details = await lstat(current);
      if (details.isSymbolicLink() || !details.isDirectory()) throw new Error(`Import destination ancestor is not a real directory: ${current}`);
      if (index === segments.length - 1) throw new Error(`Import destination already exists: ${destination}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await createDirectoryExclusive(current, ownedDirectories);
    }
  }
}

async function ensureOwnedDirectory(directory: string, destination: string, ownedDirectories: OwnedDirectory[]): Promise<void> {
  if (directory === destination) return;
  const parent = path.dirname(directory);
  if (parent !== directory) await ensureOwnedDirectory(parent, destination, ownedDirectories);
  try {
    const details = await lstat(directory);
    if (!details.isDirectory() || details.isSymbolicLink()) throw new Error(`Import path is not a real directory: ${directory}`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await createDirectoryExclusive(directory, ownedDirectories);
  }
}

async function writeExclusive(filePath: string, content: Uint8Array | string, ownedFiles: OwnedFile[]): Promise<void> {
  const handle = await open(filePath, "wx", 0o600);
  try {
    const details = await handle.stat();
    ownedFiles.push({ path: filePath, dev: details.dev, ino: details.ino });
    await handle.writeFile(content);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function cleanupOwned(ownedFiles: OwnedFile[], ownedDirectories: OwnedDirectory[]): Promise<void> {
  for (const owned of [...ownedFiles].reverse()) {
    try {
      const details = await lstat(owned.path);
      if (details.dev === owned.dev && details.ino === owned.ino) await unlink(owned.path);
    } catch {
      // Cleanup is best-effort and never removes an entry whose inode we do not own.
    }
  }
  for (const owned of [...ownedDirectories].reverse()) {
    try {
      const details = await lstat(owned.path);
      if (details.dev === owned.dev && details.ino === owned.ino) await rmdir(owned.path);
    } catch {
      // rmdir only removes empty directories; concurrent or replacement data is preserved.
    }
  }
}

/**
 * Imports a validated source bundle into a new, unregistered project directory.
 * This function only writes inert source bytes and a sanitized project manifest;
 * callers must explicitly register or execute the project in a separate step.
 */
export async function importSourceBundle(bundleFile: string, destination: string): Promise<Project> {
  const validated = await validateBundle(bundleFile);
  const destinationRoot = await inspectDestination(destination);
  const ownedFiles: OwnedFile[] = [];
  const ownedDirectories: OwnedDirectory[] = [];
  try {
    await createDestination(destinationRoot, ownedDirectories);
    for (const file of [...validated.files].sort((left, right) => left.path.localeCompare(right.path))) {
      const target = path.join(destinationRoot, ...file.path.split("/"));
      await ensureOwnedDirectory(path.dirname(target), destinationRoot, ownedDirectories);
      await writeExclusive(target, file.bytes, ownedFiles);
    }
    const manifest = `${JSON.stringify(validated.project, null, 2)}\n`;
    await writeExclusive(path.join(destinationRoot, "project.json"), manifest, ownedFiles);
    return validated.project;
  } catch (error) {
    await cleanupOwned(ownedFiles, ownedDirectories);
    throw error;
  }
}
