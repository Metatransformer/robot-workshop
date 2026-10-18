import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  access,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rmdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { ProjectSchema, type FileContent, type Project, type ProjectFile } from "./contracts";
import {
  getTemplateFiles,
  getTemplateModel,
  getTemplateParameters,
  getTemplatePartIds,
  seedCatalog,
  templates,
} from "./seeds";

const MAX_FILE_COUNT = 2_000;
const MAX_SNAPSHOT_BYTES = 32 * 1024 * 1024;
const MAX_READ_BYTES = 2 * 1024 * 1024;
const IGNORED_DIRECTORIES = new Set([".git", "node_modules", ".workshop", ".next"]);

type CollectedFile = ProjectFile & { absolutePath: string };
type OwnedFile = { path: string; dev: number; ino: number };

function hashBytes(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

function normalizedRelativePath(input: string): string {
  if (!input || input.includes("\0") || input.includes("\\") || path.posix.isAbsolute(input)) {
    throw new Error("File path must be a non-empty relative POSIX path");
  }
  const normalized = path.posix.normalize(input);
  if (normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    throw new Error("File path escapes the project directory");
  }
  return normalized;
}

function isIgnoredName(name: string, isDirectory: boolean): boolean {
  if (name.startsWith(".env")) return true;
  if (name.startsWith(".")) return true;
  return isDirectory && IGNORED_DIRECTORIES.has(name);
}

function classifyFile(filePath: string): ProjectFile["kind"] {
  const extension = path.extname(filePath).toLowerCase();
  if ([".md", ".mdx", ".txt", ".pdf", ".rst"].includes(extension)) return "document";
  if ([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py", ".c", ".h", ".cpp", ".hpp", ".rs", ".go", ".java", ".ino", ".sh", ".css", ".html"].includes(extension)) return "code";
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"].includes(extension)) return "image";
  if ([".json", ".csv", ".yaml", ".yml", ".toml", ".xml"].includes(extension)) return "data";
  if ([".stl", ".step", ".stp", ".obj", ".gltf", ".glb", ".3mf", ".fcstd", ".scad"].includes(extension)) return "model";
  return "other";
}

function isWithin(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function assertNoSymlinkAncestors(target: string): Promise<void> {
  const absolute = path.resolve(target);
  const parsed = path.parse(absolute);
  let current = parsed.root;
  const parts = absolute.slice(parsed.root.length).split(path.sep).filter(Boolean);
  for (const [index, part] of parts.entries()) {
    current = path.join(current, part);
    try {
      const details = await lstat(current);
      // macOS exposes /tmp and /var through root-owned top-level aliases. Allow
      // that OS boundary, but reject symlinks anywhere beneath it.
      if (details.isSymbolicLink() && index > 0) throw new Error(`Symlink path component is not allowed: ${current}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
  }
}

async function canonicalizeProspectivePath(target: string): Promise<string> {
  let existing = path.resolve(target);
  const missing: string[] = [];
  while (!(await pathExists(existing))) {
    const parent = path.dirname(existing);
    if (parent === existing) throw new Error(`Cannot resolve a parent directory for ${target}`);
    missing.unshift(path.basename(existing));
    existing = parent;
  }
  const details = await lstat(existing);
  if (!details.isDirectory() || details.isSymbolicLink()) throw new Error(`Destination ancestor is not a real directory: ${existing}`);
  return path.join(await realpath(existing), ...missing);
}

async function resolveProjectRoot(directory: string): Promise<string> {
  await assertNoSymlinkAncestors(directory);
  const root = await realpath(path.resolve(directory));
  const details = await lstat(root);
  if (!details.isDirectory() || details.isSymbolicLink()) throw new Error("Project root must be a real directory");
  return root;
}

async function resolveSafeExistingFile(directory: string, relativeInput: string): Promise<{ root: string; relative: string; absolute: string }> {
  const root = await resolveProjectRoot(directory);
  const relative = normalizedRelativePath(relativeInput);
  const candidate = path.join(root, ...relative.split("/"));
  let current = root;
  for (const segment of relative.split("/")) {
    current = path.join(current, segment);
    const details = await lstat(current);
    if (details.isSymbolicLink()) throw new Error(`Symlinks are not allowed in project paths: ${relative}`);
  }
  const resolved = await realpath(candidate);
  if (!isWithin(root, resolved)) throw new Error("Resolved path escapes the project directory");
  const details = await stat(resolved);
  if (!details.isFile()) throw new Error("Project path is not a regular file");
  return { root, relative, absolute: resolved };
}

async function collectProjectFiles(directory: string): Promise<CollectedFile[]> {
  const root = await resolveProjectRoot(directory);
  const files: CollectedFile[] = [];
  let totalBytes = 0;

  const visit = async (absoluteDirectory: string, relativeDirectory: string): Promise<void> => {
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const relative = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name;
      const absolute = path.join(absoluteDirectory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Snapshot and project reads refuse symlinks: ${relative}`);
      if (isIgnoredName(entry.name, entry.isDirectory())) continue;
      if (entry.isDirectory()) {
        await visit(absolute, relative);
        continue;
      }
      if (!entry.isFile()) throw new Error(`Unsupported filesystem entry: ${relative}`);
      const details = await stat(absolute);
      totalBytes += details.size;
      if (files.length + 1 > MAX_FILE_COUNT) throw new Error(`Project exceeds the ${MAX_FILE_COUNT} file limit`);
      if (totalBytes > MAX_SNAPSHOT_BYTES) throw new Error(`Project exceeds the ${MAX_SNAPSHOT_BYTES} byte snapshot limit`);
      const content = await readFile(absolute);
      files.push({ path: relative, size: content.byteLength, hash: hashBytes(content), kind: classifyFile(relative), absolutePath: absolute });
    }
  };

  await visit(root, "");
  return files;
}

async function createDirectoryTracked(directory: string, createdDirectories: string[]): Promise<void> {
  if (await pathExists(directory)) {
    const details = await lstat(directory);
    if (!details.isDirectory() || details.isSymbolicLink()) throw new Error(`Required directory path is not a real directory: ${directory}`);
    return;
  }
  const parent = path.dirname(directory);
  if (parent !== directory) await createDirectoryTracked(parent, createdDirectories);
  try {
    await mkdir(directory, { mode: 0o700 });
    createdDirectories.push(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const details = await lstat(directory);
    if (!details.isDirectory() || details.isSymbolicLink()) throw new Error(`Required directory path is not a real directory: ${directory}`);
  }
}

async function writeExclusiveTracked(filePath: string, content: string | Uint8Array, ownedFiles: OwnedFile[]): Promise<void> {
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

async function cleanupOwned(ownedFiles: OwnedFile[], createdDirectories: string[]): Promise<void> {
  for (const owned of [...ownedFiles].reverse()) {
    try {
      const details = await lstat(owned.path);
      if (details.dev === owned.dev && details.ino === owned.ino) await unlink(owned.path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        // A concurrent replacement or filesystem error is not ours to remove.
      }
    }
  }
  for (const directory of [...createdDirectories].reverse()) {
    try {
      await rmdir(directory);
    } catch (error) {
      if (!["ENOENT", "ENOTEMPTY", "EEXIST"].includes((error as NodeJS.ErrnoException).code ?? "")) {
        // Cleanup is best-effort and never recursive.
      }
    }
  }
}

function sameFileSet(left: CollectedFile[], right: CollectedFile[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((file, index) => file.path === right[index]?.path && file.size === right[index]?.size && file.hash === right[index]?.hash);
}

function snapshotRevision(files: CollectedFile[]): string {
  const digest = createHash("sha256");
  for (const file of files) digest.update(`${file.path}\0${file.size}\0${file.hash}\n`);
  return digest.digest("hex");
}

async function atomicWriteExisting(filePath: string, content: string): Promise<void> {
  const temporary = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(content);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temporary, filePath);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

export async function scaffoldProject(directory: string, input: { title: string; templateId: string }): Promise<Project> {
  const template = templates.find((entry) => entry.id === input.templateId);
  if (!template) throw new Error(`Unknown template: ${input.templateId}`);
  const destination = path.resolve(directory);
  await assertNoSymlinkAncestors(destination);

  const now = new Date().toISOString();
  const partIds = getTemplatePartIds(input.templateId);
  const project = ProjectSchema.parse({
    schemaVersion: 1,
    id: randomUUID(),
    title: input.title,
    description: template.description,
    templateId: template.id,
    model: getTemplateModel(template.id),
    createdAt: now,
    updatedAt: now,
    parameters: getTemplateParameters(template.id),
    bom: partIds.map((itemId) => {
      const item = seedCatalog.find((candidate) => candidate.id === itemId);
      if (!item) throw new Error(`Template ${template.id} references missing catalog item ${itemId}`);
      return {
        itemId,
        quantity: 1,
        role: item.kind === "tool" ? "tool" : "component",
        snapshot: structuredClone({ ...item, ownedQuantity: 0, notes: "" }),
      };
    }),
  });
  const planned: Record<string, string> = {
    ...getTemplateFiles(template.id),
    "project.json": `${JSON.stringify(project, null, 2)}\n`,
  };

  for (const relativeInput of Object.keys(planned)) {
    const relative = normalizedRelativePath(relativeInput);
    const target = path.join(destination, ...relative.split("/"));
    if (await pathExists(target)) throw new Error(`Scaffold collision: ${relative}`);
    let parent = path.dirname(target);
    while (isWithin(destination, parent) && parent !== path.dirname(destination)) {
      if (await pathExists(parent)) {
        const details = await lstat(parent);
        if (!details.isDirectory() || details.isSymbolicLink()) throw new Error(`Scaffold path collision: ${path.relative(destination, parent)}`);
      }
      if (parent === destination) break;
      parent = path.dirname(parent);
    }
  }

  const createdDirectories: string[] = [];
  const ownedFiles: OwnedFile[] = [];
  try {
    await createDirectoryTracked(destination, createdDirectories);
    for (const [relativeInput, content] of Object.entries(planned).sort(([left], [right]) => left.localeCompare(right))) {
      const relative = normalizedRelativePath(relativeInput);
      const target = path.join(destination, ...relative.split("/"));
      await createDirectoryTracked(path.dirname(target), createdDirectories);
      await writeExclusiveTracked(target, content, ownedFiles);
    }
    return project;
  } catch (error) {
    await cleanupOwned(ownedFiles, createdDirectories);
    throw error;
  }
}

export async function validateProject(directory: string): Promise<{ valid: boolean; issues: string[]; project?: Project }> {
  const issues: string[] = [];
  let project: Project | undefined;
  try {
    const manifest = await resolveSafeExistingFile(directory, "project.json");
    const details = await stat(manifest.absolute);
    if (details.size > MAX_READ_BYTES) throw new Error("project.json exceeds the manifest size limit");
    const parsed = JSON.parse(await readFile(manifest.absolute, "utf8")) as unknown;
    const result = ProjectSchema.safeParse(parsed);
    if (!result.success) {
      for (const issue of result.error.issues) issues.push(`${issue.path.join(".") || "project.json"}: ${issue.message}`);
    } else {
      project = result.data;
    }
  } catch (error) {
    issues.push(`project.json: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    await collectProjectFiles(directory);
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }
  return project && issues.length === 0 ? { valid: true, issues, project } : { valid: false, issues };
}

export async function listProjectFiles(directory: string): Promise<ProjectFile[]> {
  return (await collectProjectFiles(directory)).map(({ absolutePath: _absolutePath, ...file }) => file);
}

export async function readSafeFile(directory: string, filePath: string): Promise<FileContent> {
  const resolved = await resolveSafeExistingFile(directory, filePath);
  const details = await stat(resolved.absolute);
  if (details.size > MAX_READ_BYTES) throw new Error(`File exceeds the ${MAX_READ_BYTES} byte read limit`);
  const content = await readFile(resolved.absolute);
  if (content.includes(0)) throw new Error("Binary files cannot be opened as editable text");
  return { path: resolved.relative, content: content.toString("utf8"), hash: hashBytes(content) };
}

export async function snapshotProject(source: string, destination: string): Promise<{ revision: string }> {
  const sourceInput = path.resolve(source);
  const destinationInput = path.resolve(destination);
  await assertNoSymlinkAncestors(sourceInput);
  await assertNoSymlinkAncestors(destinationInput);
  const destinationRoot = await canonicalizeProspectivePath(destinationInput);
  if (await pathExists(destinationRoot)) throw new Error("Snapshot destination already exists");

  const sourceRoot = await resolveProjectRoot(sourceInput);
  if (isWithin(sourceRoot, destinationRoot) || isWithin(destinationRoot, sourceRoot)) {
    throw new Error("Snapshot source and destination must not overlap");
  }

  const before = await collectProjectFiles(sourceRoot);
  const revision = snapshotRevision(before);
  const createdDirectories: string[] = [];
  const ownedFiles: OwnedFile[] = [];
  try {
    await createDirectoryTracked(path.dirname(destinationRoot), createdDirectories);
    await mkdir(destinationRoot, { mode: 0o700 });
    createdDirectories.push(destinationRoot);
    for (const sourceFile of before) {
      const target = path.join(destinationRoot, ...sourceFile.path.split("/"));
      await createDirectoryTracked(path.dirname(target), createdDirectories);
      const content = await readFile(sourceFile.absolutePath);
      if (content.byteLength !== sourceFile.size || hashBytes(content) !== sourceFile.hash) {
        throw new Error(`Source changed while snapshotting: ${sourceFile.path}`);
      }
      await writeExclusiveTracked(target, content, ownedFiles);
      const copied = await readFile(target);
      if (copied.byteLength !== sourceFile.size || hashBytes(copied) !== sourceFile.hash) {
        throw new Error(`Copied file verification failed: ${sourceFile.path}`);
      }
    }
    const after = await collectProjectFiles(sourceRoot);
    if (!sameFileSet(before, after)) throw new Error("Source changed while the snapshot was being created");
    const copiedFiles = await collectProjectFiles(destinationRoot);
    if (!sameFileSet(before, copiedFiles)) throw new Error("Snapshot content does not match its source");
    return { revision };
  } catch (error) {
    await cleanupOwned(ownedFiles, createdDirectories);
    throw error;
  }
}

export async function writeProjectManifest(directory: string, project: Project): Promise<void> {
  const parsed = ProjectSchema.parse(project);
  const manifest = await resolveSafeExistingFile(directory, "project.json");
  await atomicWriteExisting(manifest.absolute, `${JSON.stringify(parsed, null, 2)}\n`);
}
