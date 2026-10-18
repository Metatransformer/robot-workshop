import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { chmod, link, mkdir, mkdtemp, open, readFile, realpath, rename, rm, rmdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";
import {
  CatalogItemSchema,
  Id,
  ProjectSchema,
  type Bootstrap,
  type CatalogItem,
  type FileContent,
  type Project,
  type ProjectDetail,
  type ProjectRecord,
} from "../lib/contracts";
import {
  listProjectFiles,
  readSafeFile,
  scaffoldProject,
  snapshotProject,
  validateProject,
  writeProjectManifest,
} from "../lib/project-format";
import { seedCatalog, templates } from "../lib/seeds";

const RegistryEntrySchema = ProjectSchema.extend({
  directory: z.string().min(1),
  isExample: z.boolean().optional(),
});
const RegistrySchema = z.array(RegistryEntrySchema);
const CatalogSchema = z.array(CatalogItemSchema);
const MAX_EDIT_BYTES = 2 * 1024 * 1024;
const MAX_EXPORT_BYTES = 16 * 1024 * 1024;
const MAX_EXPORT_FILES = 500;
const LOCK_ACQUISITION_TIMEOUT_MS = 15_000;
const LOCK_RETRY_MS = 25;

let mutationTail: Promise<unknown> = Promise.resolve();
const initializationByHome = new Map<string, Promise<void>>();

function workshopHome(): string {
  return path.resolve(/* turbopackIgnore: true */ process.env.METATRANSFORMER_HOME || path.join(process.cwd(), ".workshop"));
}

function registryPath(home = workshopHome()): string {
  return path.join(home, "projects.json");
}

function catalogPath(home = workshopHome()): string {
  return path.join(home, "catalog.json");
}

async function ensurePrivateDirectory(directory: string): Promise<void> {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
}

type LockOwner = { pid: number; token: string };

function lockPath(home: string): string {
  return path.join(home, ".storage.lock");
}

function lockOwnerPath(directory: string): string {
  return path.join(directory, "owner.json");
}

async function readOwnerFile(filePath: string): Promise<LockOwner | undefined> {
  try {
    const value = JSON.parse(await readFile(filePath, "utf8")) as Partial<LockOwner>;
    if (Number.isInteger(value.pid) && Number(value.pid) > 0 && typeof value.token === "string" && value.token.length > 0) {
      return { pid: Number(value.pid), token: value.token };
    }
  } catch (error) {
    if (error instanceof SyntaxError) return undefined;
    if (!(["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? ""))) throw error;
  }
  return undefined;
}

async function readLockOwner(directory: string): Promise<LockOwner | undefined> {
  return readOwnerFile(lockOwnerPath(directory));
}

function ownerIsPositivelyDead(owner: LockOwner): boolean {
  try {
    process.kill(owner.pid, 0);
    return false;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ESRCH";
  }
}

async function removeDeadLock(home: string, observed: LockOwner): Promise<boolean> {
  const directory = lockPath(home);
  const current = await readLockOwner(directory);
  if (!current || current.pid !== observed.pid || current.token !== observed.token || !ownerIsPositivelyDead(current)) return false;
  const ownerFile = lockOwnerPath(directory);
  const staleOwnerFile = path.join(home, `.storage.lock.owner.stale.${process.pid}.${randomUUID()}`);
  try {
    // Moving the owner file elects exactly one stale-lock cleaner while the lock
    // directory itself continues to exclude new owners until rmdir succeeds.
    await rename(ownerFile, staleOwnerFile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
  const moved = await readOwnerFile(staleOwnerFile);
  if (!moved || moved.pid !== observed.pid || moved.token !== observed.token || !ownerIsPositivelyDead(moved)) {
    await rename(staleOwnerFile, ownerFile);
    return false;
  }
  try {
    await rmdir(directory);
  } catch (error) {
    await rename(staleOwnerFile, ownerFile).catch(() => undefined);
    throw error;
  }
  await unlink(staleOwnerFile);
  return true;
}

async function acquireStorageLock(home: string): Promise<() => Promise<void>> {
  await ensurePrivateDirectory(home);
  const directory = lockPath(home);
  const owner: LockOwner = { pid: process.pid, token: randomUUID() };
  const deadline = Date.now() + LOCK_ACQUISITION_TIMEOUT_MS;
  while (true) {
    try {
      await mkdir(directory, { mode: 0o700 });
      try {
        await writeFile(lockOwnerPath(directory), `${JSON.stringify(owner)}\n`, { flag: "wx", mode: 0o600 });
      } catch (error) {
        await rmdir(directory).catch(() => undefined);
        throw error;
      }
      return async () => {
        const current = await readLockOwner(directory);
        if (!current || current.pid !== owner.pid || current.token !== owner.token) return;
        await unlink(lockOwnerPath(directory)).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
        });
        await rmdir(directory).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
        });
      };
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST") {
        if (code === "ENOENT") continue;
        throw error;
      }
      const observed = await readLockOwner(directory);
      if (observed && ownerIsPositivelyDead(observed) && await removeDeadLock(home, observed)) continue;
      if (Date.now() >= deadline) {
        const ownerDescription = observed ? `process ${observed.pid}` : "an owner that could not be verified";
        throw new Error(`Timed out acquiring workshop storage lock held by ${ownerDescription}`);
      }
      await delay(LOCK_RETRY_MS);
    }
  }
}

async function withMutation<T>(operation: () => Promise<T>): Promise<T> {
  const home = workshopHome();
  const lockedOperation = async () => {
    const release = await acquireStorageLock(home);
    try {
      return await operation();
    } finally {
      await release();
    }
  };
  const running = mutationTail.then(lockedOperation, lockedOperation);
  mutationTail = running.then(() => undefined, () => undefined);
  return running;
}

async function atomicWrite(filePath: string, content: string, createOnly = false): Promise<void> {
  await ensurePrivateDirectory(path.dirname(filePath));
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`);
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(content);
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    if (createOnly) {
      await link(temporary, filePath);
      await unlink(temporary);
    } else {
      await rename(temporary, filePath);
    }
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

async function writeJson(filePath: string, value: unknown, createOnly = false): Promise<void> {
  await atomicWrite(filePath, `${JSON.stringify(value, null, 2)}\n`, createOnly);
}

async function readJson(filePath: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as unknown;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") throw error;
    throw new Error(`Storage is corrupt or unreadable at ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function readRegistry(home = workshopHome()): Promise<ProjectRecord[]> {
  const raw = await readJson(registryPath(home));
  const parsed = RegistrySchema.safeParse(raw);
  if (!parsed.success) throw new Error(`Storage is corrupt at ${registryPath(home)}: ${parsed.error.message}`);
  return parsed.data;
}

async function readCatalog(home = workshopHome()): Promise<CatalogItem[]> {
  const raw = await readJson(catalogPath(home));
  const parsed = CatalogSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`Storage is corrupt at ${catalogPath(home)}: ${parsed.error.message}`);
  return parsed.data;
}

async function initializeHome(home: string): Promise<void> {
  await ensurePrivateDirectory(home);
  for (const child of ["examples", "projects", "copies", "candidates", "ingestion"]) {
    await ensurePrivateDirectory(path.join(/* turbopackIgnore: true */ home, child));
  }

  try {
    await readCatalog(home);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await writeJson(catalogPath(home), structuredClone(seedCatalog), true);
  }

  try {
    await readRegistry(home);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const registry: ProjectRecord[] = [];
    for (const template of templates) {
      const directory = path.join(home, "examples", template.id);
      let project: Project;
      const validation: Awaited<ReturnType<typeof validateProject>> = await validateProject(directory).catch(() => ({
        valid: false,
        issues: [],
      }));
      if (validation.valid && validation.project) {
        project = validation.project;
      } else {
        try {
          project = await scaffoldProject(directory, { title: template.title, templateId: template.id });
        } catch (scaffoldError) {
          throw new Error(`Example initialization failed for ${template.id}; existing data was not reset: ${scaffoldError instanceof Error ? scaffoldError.message : String(scaffoldError)}`);
        }
      }
      registry.push({ ...project, directory: await realpath(directory), isExample: true });
    }
    await writeJson(registryPath(home), registry, true);
  }
}

async function ensureInitialized(): Promise<void> {
  const home = workshopHome();
  let initialization = initializationByHome.get(home);
  if (!initialization) {
    initialization = withMutation(() => initializeHome(home));
    initializationByHome.set(home, initialization);
    initialization.catch(() => initializationByHome.delete(home));
  }
  await initialization;
}

function requireId(id: string): string {
  return Id.parse(id);
}

async function findRecord(id: string): Promise<ProjectRecord> {
  requireId(id);
  const registry = await readRegistry();
  const record = registry.find((entry) => entry.id === id);
  if (!record) throw new Error(`Project not found: ${id}`);
  return record;
}

async function persistRegistry(registry: ProjectRecord[]): Promise<void> {
  const parsed = RegistrySchema.parse(registry);
  await writeJson(registryPath(), parsed);
}

async function appendRegistry(project: Project, directory: string, isExample?: boolean): Promise<ProjectRecord> {
  const resolvedDirectory = await realpath(directory);
  const registry = await readRegistry();
  const identityMatch = registry.find((record) => record.id === project.id);
  const directoryMatch = registry.find((record) => path.resolve(record.directory) === resolvedDirectory);
  if (identityMatch || directoryMatch) {
    if (identityMatch === directoryMatch && identityMatch?.id === project.id) return identityMatch;
    if (identityMatch) throw new Error(`Project identity already registered to another directory: ${project.id}`);
    throw new Error("Project directory is already registered with another identity");
  }
  const record: ProjectRecord = { ...project, directory: resolvedDirectory, ...(isExample ? { isExample: true } : {}) };
  await persistRegistry([...registry, record]);
  return record;
}

function clonedProjectItem(item: CatalogItem): CatalogItem {
  return structuredClone({ ...item, ownedQuantity: 0, notes: "" });
}

function suffixedTitle(title: string, suffix: "copy" | "candidate"): string {
  const trimmed = title.trim();
  if (trimmed.toLowerCase() === suffix) return trimmed;
  const withoutRepeatedSuffix = trimmed.replace(new RegExp(`(?:\\s+${suffix})+$`, "i"), "").trim();
  return `${withoutRepeatedSuffix || trimmed} ${suffix}`;
}

async function detailFromRecord(record: ProjectRecord): Promise<ProjectDetail> {
  const validation = await validateProject(record.directory);
  if (!validation.valid || !validation.project) throw new Error(`Project ${record.id} is invalid: ${validation.issues.join("; ")}`);
  if (validation.project.id !== record.id) throw new Error(`Project identity mismatch for ${record.id}`);
  const files = await listProjectFiles(record.directory);
  let guide = "";
  try {
    guide = (await readSafeFile(record.directory, "README.md")).content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return {
    ...validation.project,
    directory: record.directory,
    ...(record.isExample ? { isExample: true } : {}),
    files,
    guide,
  };
}

async function projectFromCopiedSnapshot(
  source: ProjectRecord,
  destination: string,
  revision: string,
  title?: string,
): Promise<Project> {
  const validation = await validateProject(destination);
  if (!validation.valid || !validation.project) throw new Error(`Copied project is invalid: ${validation.issues.join("; ")}`);
  if (validation.project.id !== source.id) throw new Error(`Project identity mismatch for ${source.id}`);
  const now = new Date().toISOString();
  const project = ProjectSchema.parse({
    ...validation.project,
    id: randomUUID(),
    title: title?.trim() || suffixedTitle(validation.project.title, "copy"),
    createdAt: now,
    updatedAt: now,
    provenance: { sourceProjectId: source.id, sourceRevision: revision },
  });
  return project;
}

async function copiedProject(source: ProjectRecord, destination: string, title?: string): Promise<Project> {
  const { revision } = await snapshotProject(source.directory, destination);
  const project = await projectFromCopiedSnapshot(source, destination, revision, title);
  await writeProjectManifest(destination, project);
  return project;
}

async function atomicReplaceText(filePath: string, content: string): Promise<void> {
  const temporary = path.join(path.dirname(filePath), `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`);
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(content, "utf8");
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

export async function getBootstrap(): Promise<Bootstrap> {
  await ensureInitialized();
  const registry = await readRegistry();
  const projects: ProjectRecord[] = [];
  const warnings: string[] = [];
  for (const record of registry) {
    try {
      const validation = await validateProject(record.directory);
      if (!validation.valid || !validation.project) {
        warnings.push(`Registered project ${record.id} is unavailable: ${validation.issues.join("; ")}`);
        continue;
      }
      if (validation.project.id !== record.id) {
        warnings.push(`Registered project ${record.id} is unavailable because its manifest identity does not match.`);
        continue;
      }
      projects.push({ ...validation.project, directory: record.directory, ...(record.isExample ? { isExample: true } : {}) });
    } catch (error) {
      warnings.push(`Registered project ${record.id} is unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return {
    ...(warnings.length > 0 ? { warnings } : {}),
    projects,
    library: await readCatalog(),
    templates: structuredClone(templates),
  };
}

export async function getProject(id: string): Promise<ProjectDetail> {
  await ensureInitialized();
  return detailFromRecord(await findRecord(id));
}

export async function createProject(input: { title: string; description?: string; templateId: string }): Promise<ProjectDetail> {
  await ensureInitialized();
  return withMutation(async () => {
    const destination = path.join(workshopHome(), "projects", randomUUID());
    let project = await scaffoldProject(destination, { title: input.title, templateId: input.templateId });
    const catalog = await readCatalog();
    const catalogIds = new Set(catalog.map((item) => item.id));
    let catalogChanged = false;
    for (const entry of project.bom) {
      if (catalogIds.has(entry.itemId)) continue;
      catalog.push(structuredClone(entry.snapshot));
      catalogIds.add(entry.itemId);
      catalogChanged = true;
    }
    if (catalogChanged) await writeJson(catalogPath(), catalog);
    if (input.description !== undefined) {
      project = ProjectSchema.parse({ ...project, description: input.description, updatedAt: new Date().toISOString() });
      await writeProjectManifest(destination, project);
    }
    const record = await appendRegistry(project, destination);
    return detailFromRecord(record);
  });
}

export async function readProjectFile(id: string, relativePath: string): Promise<FileContent> {
  await ensureInitialized();
  const record = await findRecord(id);
  return readSafeFile(record.directory, relativePath);
}

export async function saveFileAsCopy(
  id: string,
  input: { path: string; content: string; expectedHash: string },
): Promise<ProjectDetail> {
  await ensureInitialized();
  if (Buffer.byteLength(input.content, "utf8") > MAX_EDIT_BYTES) throw new Error("Edited file exceeds the size limit");
  if (input.content.includes("\0")) throw new Error("Edited content must be text");
  return withMutation(async () => {
    const source = await findRecord(id);
    const original = await readSafeFile(source.directory, input.path);
    if (original.hash !== input.expectedHash) throw new Error("File changed since it was opened; no copy was created");
    let editedManifest: Project | undefined;
    if (original.path === "project.json") {
      try {
        editedManifest = ProjectSchema.parse(JSON.parse(input.content) as unknown);
      } catch (error) {
        throw new Error(`Edited project.json is not a supported project manifest: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const destination = path.join(workshopHome(), "copies", randomUUID());
    const { revision } = await snapshotProject(source.directory, destination);
    const copiedFile = await readSafeFile(destination, input.path);
    if (copiedFile.hash !== input.expectedHash) throw new Error("Copied file does not match the expected source revision");
    const project = await projectFromCopiedSnapshot(source, destination, revision);
    let updated: Project;
    if (editedManifest) {
      updated = ProjectSchema.parse({
        ...editedManifest,
        id: project.id,
        createdAt: project.createdAt,
        updatedAt: new Date().toISOString(),
        provenance: project.provenance,
      });
    } else {
      await writeProjectManifest(destination, project);
      await atomicReplaceText(path.join(destination, ...copiedFile.path.split("/")), input.content);
      updated = ProjectSchema.parse({ ...project, updatedAt: new Date().toISOString() });
    }
    await writeProjectManifest(destination, updated);
    const record = await appendRegistry(updated, destination);
    return detailFromRecord(record);
  });
}

export async function copyProject(id: string, title?: string): Promise<ProjectDetail> {
  await ensureInitialized();
  return withMutation(async () => {
    const source = await findRecord(id);
    const destination = path.join(workshopHome(), "copies", randomUUID());
    const project = await copiedProject(source, destination, title);
    const record = await appendRegistry(project, destination);
    return detailFromRecord(record);
  });
}

export async function saveCatalogItem(item: CatalogItem, expectedVersion?: number): Promise<CatalogItem> {
  await ensureInitialized();
  return withMutation(async () => {
    const incoming = CatalogItemSchema.parse(item);
    const catalog = await readCatalog();
    const index = catalog.findIndex((entry) => entry.id === incoming.id);
    const now = new Date().toISOString();
    let saved: CatalogItem;
    if (index >= 0) {
      const existing = catalog[index];
      if (expectedVersion !== undefined && expectedVersion !== existing.version) {
        throw new Error(`Catalog version conflict for ${incoming.id}: expected ${expectedVersion}, current ${existing.version}`);
      }
      saved = CatalogItemSchema.parse({ ...incoming, createdAt: existing.createdAt, updatedAt: now, version: existing.version + 1 });
      catalog[index] = saved;
    } else {
      if (expectedVersion !== undefined && expectedVersion !== 0) {
        throw new Error(`Catalog version conflict for new item ${incoming.id}: expected 0`);
      }
      saved = CatalogItemSchema.parse({ ...incoming, version: 1, createdAt: incoming.createdAt || now, updatedAt: now });
      catalog.push(saved);
    }
    await writeJson(catalogPath(), catalog);
    return structuredClone(saved);
  });
}

export async function addProjectItem(projectId: string, itemId: string, quantity: number): Promise<ProjectDetail> {
  await ensureInitialized();
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("Quantity must be a positive integer");
  return withMutation(async () => {
    const source = await findRecord(projectId);
    const catalog = await readCatalog();
    const item = catalog.find((entry) => entry.id === requireId(itemId));
    if (!item) throw new Error(`Catalog item not found: ${itemId}`);
    const destination = path.join(workshopHome(), "copies", randomUUID());
    const copied = await copiedProject(source, destination);
    const existingIndex = copied.bom.findIndex((entry) => entry.itemId === item.id && entry.role === (item.kind === "tool" ? "tool" : "component"));
    const bom = copied.bom.map((entry) => structuredClone(entry));
    if (existingIndex >= 0) {
      bom[existingIndex] = { ...bom[existingIndex], quantity: bom[existingIndex].quantity + quantity, snapshot: clonedProjectItem(item) };
    } else {
      bom.push({ itemId: item.id, quantity, role: item.kind === "tool" ? "tool" : "component", snapshot: clonedProjectItem(item) });
    }
    const project = ProjectSchema.parse({ ...copied, bom, updatedAt: new Date().toISOString() });
    await writeProjectManifest(destination, project);
    const record = await appendRegistry(project, destination);
    return detailFromRecord(record);
  });
}

export async function updateParameters(projectId: string, parameters: Record<string, number>): Promise<ProjectDetail> {
  await ensureInitialized();
  return withMutation(async () => {
    const source = await findRecord(projectId);
    const destination = path.join(workshopHome(), "copies", randomUUID());
    const copied = await copiedProject(source, destination);
    const project = ProjectSchema.parse({
      ...copied,
      parameters: { ...copied.parameters, ...parameters },
      updatedAt: new Date().toISOString(),
    });
    await writeProjectManifest(destination, project);
    const record = await appendRegistry(project, destination);
    return detailFromRecord(record);
  });
}

export async function registerProject(directory: string): Promise<ProjectDetail> {
  await ensureInitialized();
  return withMutation(async () => {
    const resolved = await realpath(path.resolve(directory));
    const validation = await validateProject(resolved);
    if (!validation.valid || !validation.project) throw new Error(`Cannot register invalid project: ${validation.issues.join("; ")}`);
    const record = await appendRegistry(validation.project, resolved);
    return detailFromRecord(record);
  });
}

export async function createCandidate(projectId: string): Promise<{ directory: string; project: Project; revision: string }> {
  await ensureInitialized();
  return withMutation(async () => {
    const source = await findRecord(projectId);
    const directory = path.join(workshopHome(), "candidates", randomUUID());
    const { revision } = await snapshotProject(source.directory, directory);
    const validation = await validateProject(directory);
    if (!validation.valid || !validation.project) throw new Error(`Candidate is invalid: ${validation.issues.join("; ")}`);
    const now = new Date().toISOString();
    const project = ProjectSchema.parse({
      ...validation.project,
      id: randomUUID(),
      title: suffixedTitle(validation.project.title, "candidate"),
      createdAt: now,
      updatedAt: now,
      provenance: { sourceProjectId: source.id, sourceRevision: revision },
    });
    await writeProjectManifest(directory, project);
    return { directory, project, revision };
  });
}

export async function registerCandidate(directory: string, sourceProjectId: string): Promise<ProjectDetail> {
  await ensureInitialized();
  return withMutation(async () => {
    const source = await findRecord(sourceProjectId);
    const resolved = await realpath(path.resolve(directory));
    if (resolved === (await realpath(source.directory))) throw new Error("A source project cannot be registered as its own candidate");
    const registry = await readRegistry();
    if (registry.some((record) => path.resolve(record.directory) === resolved)) {
      throw new Error("Candidate directory is already registered");
    }
    const validation = await validateProject(resolved);
    if (!validation.valid || !validation.project) throw new Error(`Cannot register invalid candidate: ${validation.issues.join("; ")}`);
    const now = new Date().toISOString();
    const project = ProjectSchema.parse({
      ...validation.project,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      provenance: {
        sourceProjectId: source.id,
        ...(validation.project.provenance?.sourceRevision ? { sourceRevision: validation.project.provenance.sourceRevision } : {}),
      },
    });
    await writeProjectManifest(resolved, project);
    const record = await appendRegistry(project, resolved);
    return detailFromRecord(record);
  });
}

const DEFAULT_EXPORT_ROOT_FILES = new Set(["README.md", "ENGINEERING.md", "START_HERE.md", "GLOSSARY.md", "LEARNING_PATH.md", "evidence.csv", "notes/bench-log.csv", "AGENTS.md", "CLAUDE.md", "WIRING.md", "MODEL.md"]);
const DEFAULT_EXPORT_DIRECTORIES = ["firmware/", "models/", "drawings/"];
const ExportSelectionSchema = z.object({ files: z.array(z.string()).max(MAX_EXPORT_FILES) }).strict();

function normalizedExportPath(input: string): string {
  if (!input || input.includes("\0") || input.includes("\\") || path.posix.isAbsolute(input)) {
    throw new Error("Export paths must be non-empty relative POSIX paths");
  }
  const normalized = path.posix.normalize(input);
  if (normalized !== input || normalized === "." || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`Invalid export path: ${input}`);
  }
  return normalized;
}

function isSensitiveExportPath(filePath: string): boolean {
  const segments = filePath.toLowerCase().split("/");
  const name = segments.at(-1) ?? "";
  const transcriptMarkers = new Set([".codex", ".claude", ".agents", "transcripts", "agent-transcripts", "agent_transcripts"]);
  return name.startsWith(".env")
    || name.startsWith("secrets.")
    || name.startsWith("credentials.")
    || name === "id_rsa"
    || name.startsWith("id_rsa.")
    || name === "id_ed25519"
    || name.startsWith("id_ed25519.")
    || name.endsWith(".pem")
    || name.endsWith(".key")
    || name.includes("transcript")
    || segments.some((segment) => transcriptMarkers.has(segment));
}

function validateExportSelection(selectedPaths: string[], availablePaths: Set<string>): string[] {
  if (selectedPaths.length > MAX_EXPORT_FILES) throw new Error(`Project export exceeds the ${MAX_EXPORT_FILES} file limit`);
  const seen = new Set<string>();
  return selectedPaths.map((input) => {
    const selected = normalizedExportPath(input);
    if (selected === "project.json") throw new Error("project.json is included as a sanitized manifest and cannot be selected as a source file");
    if (isSensitiveExportPath(selected)) throw new Error(`Sensitive or agent-transcript path cannot be exported: ${selected}`);
    if (!availablePaths.has(selected)) throw new Error(`Selected export path does not exist: ${selected}`);
    if (seen.has(selected)) throw new Error(`Selected export path is duplicated: ${selected}`);
    seen.add(selected);
    return selected;
  });
}

/**
 * Exports only an explicit selection, EXPORT.json's allowlist, or the documented
 * default root documents and firmware/models/drawings trees. The source is first
 * snapshotted into an exclusively owned temporary directory, credentials and
 * agent transcripts are rejected at every depth, and hashes cover the exact bytes
 * placed in the payload. project.json is represented only by a sanitized manifest.
 */
export async function exportProject(projectId: string, selectedPaths?: string[]): Promise<{ filename: string; content: string }> {
  await ensureInitialized();
  const source = await findRecord(projectId);
  const temporary = await mkdtemp(path.join(workshopHome(), ".export-"));
  await chmod(temporary, 0o700);
  try {
    const snapshot = path.join(temporary, "snapshot");
    await snapshotProject(source.directory, snapshot);
    const validation = await validateProject(snapshot);
    if (!validation.valid || !validation.project) throw new Error(`Cannot export invalid project: ${validation.issues.join("; ")}`);
    if (validation.project.id !== source.id) throw new Error(`Cannot export project ${source.id}: manifest identity mismatch`);

    const snapshotFiles = await listProjectFiles(snapshot);
    const availablePaths = new Set(snapshotFiles.map((file) => file.path));
    let requested: string[];
    if (selectedPaths !== undefined) {
      requested = selectedPaths;
    } else if (availablePaths.has("EXPORT.json")) {
      const allowlist = ExportSelectionSchema.parse(JSON.parse((await readSafeFile(snapshot, "EXPORT.json")).content) as unknown);
      requested = allowlist.files;
    } else {
      requested = snapshotFiles
        .map((file) => file.path)
        .filter((filePath) => DEFAULT_EXPORT_ROOT_FILES.has(filePath)
          || DEFAULT_EXPORT_DIRECTORIES.some((directory) => filePath.startsWith(directory)))
        .filter((filePath) => !isSensitiveExportPath(filePath));
    }
    const selected = validateExportSelection(requested, availablePaths);
    const metadata = new Map(snapshotFiles.map((file) => [file.path, file]));
    const portableProject = ProjectSchema.parse({
      ...validation.project,
      bom: validation.project.bom.map((entry) => ({
        ...entry,
        snapshot: {
          ...entry.snapshot,
          ownedQuantity: 0,
          notes: "",
          sources: entry.snapshot.sources.map(({ text: _text, ...sourceRecord }) => sourceRecord),
        },
      })),
    });
    const files: { path: string; kind: string; size: number; hash: string; encoding: "base64"; content: string }[] = [];
    let rawBytes = 0;
    for (const filePath of selected) {
      const file = metadata.get(filePath)!;
      const absolute = path.join(snapshot, ...filePath.split("/"));
      const handle = await open(absolute, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
      let bytes: Buffer;
      try {
        bytes = await handle.readFile();
      } finally {
        await handle.close();
      }
      rawBytes += bytes.byteLength;
      if (rawBytes > MAX_EXPORT_BYTES) throw new Error(`Project export exceeds the ${MAX_EXPORT_BYTES} byte limit`);
      const hash = createHash("sha256").update(bytes).digest("hex");
      files.push({ path: filePath, kind: file.kind, size: bytes.byteLength, hash, encoding: "base64", content: bytes.toString("base64") });
    }
    const content = `${JSON.stringify({ format: "metatransformer-source-bundle", version: 1, project: portableProject, files }, null, 2)}\n`;
    if (Buffer.byteLength(content, "utf8") > Math.ceil(MAX_EXPORT_BYTES * 1.5)) throw new Error("Encoded project export exceeds the size limit");
    const safeTitle = portableProject.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "project";
    return { filename: `${safeTitle}.workshop.json`, content };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

export async function getProjectDirectory(id: string): Promise<string> {
  await ensureInitialized();
  return (await findRecord(id)).directory;
}
