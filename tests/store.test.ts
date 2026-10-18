import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CatalogItem } from "../src/lib/contracts";
import { scaffoldProject } from "../src/lib/project-format";
import {
  addProjectItem,
  createProject,
  exportProject,
  getBootstrap,
  getProject,
  readProjectFile,
  registerProject,
  saveCatalogItem,
  saveFileAsCopy,
  updateParameters,
} from "../src/server/store";

const temporaryDirectories: string[] = [];
const execFileAsync = promisify(execFile);

beforeEach(async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "workshop-store-"));
  temporaryDirectories.push(directory);
  process.env.METATRANSFORMER_HOME = path.join(directory, "home");
});

afterEach(async () => {
  delete process.env.METATRANSFORMER_HOME;
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function manualItem(id: string): CatalogItem {
  const now = new Date().toISOString();
  return {
    id,
    name: "Bench resistor",
    kind: "part",
    category: "electronics",
    description: "A reviewed local catalog item.",
    tags: [],
    specs: [{ label: "Resistance", value: "1000", unit: "ohm", evidence: "manual" }],
    sources: [],
    ownedQuantity: 7,
    notes: "Stored in drawer two",
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
}

describe("durable workshop store", () => {
  it("serializes first-use initialization and creates complete examples", async () => {
    const results = await Promise.all([getBootstrap(), getBootstrap(), getBootstrap()]);
    expect(results[0].projects).toHaveLength(5);
    expect(results[0].library.some((item) => item.id === "raspberry-pi-pico")).toBe(true);
    for (const project of results[0].projects) {
      expect(await readFile(path.join(project.directory, "ENGINEERING.md"), "utf8")).toMatch(/untested|not been/i);
    }
  });

  it("recovers a lock only when its recorded owner process is positively dead", async () => {
    const home = process.env.METATRANSFORMER_HOME!;
    const lock = path.join(home, ".storage.lock");
    await mkdir(lock, { recursive: true });
    await writeFile(path.join(lock, "owner.json"), `${JSON.stringify({ pid: 2_147_483_647, token: "dead-owner" })}\n`);

    const bootstrap = await getBootstrap();
    expect(bootstrap.projects).toHaveLength(5);
    await expect(readFile(path.join(lock, "owner.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("fails visibly instead of resetting corrupt storage", async () => {
    await getBootstrap();
    const catalogPath = path.join(process.env.METATRANSFORMER_HOME!, "catalog.json");
    const originalCatalog = await readFile(catalogPath, "utf8");
    await writeFile(catalogPath, "{ definitely not json");
    await expect(getBootstrap()).rejects.toThrow(/corrupt|unreadable/i);
    expect(await readFile(catalogPath, "utf8")).toBe("{ definitely not json");
    await writeFile(catalogPath, originalCatalog);

    const registryPath = path.join(process.env.METATRANSFORMER_HOME!, "projects.json");
    await writeFile(registryPath, "{ also not json");
    await expect(getBootstrap()).rejects.toThrow(/corrupt|unreadable/i);
    expect(await readFile(registryPath, "utf8")).toBe("{ also not json");
  });

  it("saves edits as a separate copy and leaves the original byte-for-byte unchanged", async () => {
    const original = await createProject({ title: "Original", templateId: "blank" });
    const opened = await readProjectFile(original.id, "README.md");
    const copied = await saveFileAsCopy(original.id, { path: "README.md", content: "# Changed copy\n", expectedHash: opened.hash });

    expect(copied.id).not.toBe(original.id);
    expect((await readProjectFile(original.id, "README.md")).content).toBe(opened.content);
    expect((await readProjectFile(copied.id, "README.md")).content).toBe("# Changed copy\n");
    expect(copied.provenance?.sourceProjectId).toBe(original.id);
  });

  it("accepts project.json edits after checking the original hash and preserves the copy identity", async () => {
    const original = await createProject({ title: "Manifest source", templateId: "blank" });
    const opened = await readProjectFile(original.id, "project.json");
    const edited = JSON.parse(opened.content) as Record<string, unknown>;
    edited.title = "Edited manifest";
    edited.description = "A valid user edit";
    edited.id = "attempted-identity-replacement";
    edited.createdAt = "2000-01-01T00:00:00.000Z";
    edited.provenance = { sourceProjectId: "wrong-source" };

    const copied = await saveFileAsCopy(original.id, {
      path: "project.json",
      content: `${JSON.stringify(edited, null, 2)}\n`,
      expectedHash: opened.hash,
    });

    expect(copied.id).not.toBe(original.id);
    expect(copied.id).not.toBe(edited.id);
    expect(copied.title).toBe("Edited manifest");
    expect(copied.createdAt).not.toBe(edited.createdAt);
    expect(copied.provenance?.sourceProjectId).toBe(original.id);
    expect((await readProjectFile(original.id, "project.json")).content).toBe(opened.content);

    const unsupported = { ...JSON.parse(opened.content) as Record<string, unknown>, schemaVersion: 2 };
    await expect(saveFileAsCopy(original.id, {
      path: "project.json",
      content: JSON.stringify(unsupported),
      expectedHash: opened.hash,
    })).rejects.toThrow(/supported project manifest/i);
  });

  it("keeps owned inventory out of project requirement snapshots", async () => {
    const saved = await saveCatalogItem(manualItem("bench-resistor"), 0);
    const project = await createProject({ title: "Inventory distinction", templateId: "blank" });
    const updated = await addProjectItem(project.id, saved.id, 3);
    const requirement = updated.bom.find((entry) => entry.itemId === saved.id);

    expect(updated.id).not.toBe(project.id);
    expect(requirement?.quantity).toBe(3);
    expect(requirement?.snapshot.ownedQuantity).toBe(0);
    expect(requirement?.snapshot.notes).toBe("");
    expect((await getBootstrap()).library.find((item) => item.id === saved.id)?.ownedQuantity).toBe(7);
    expect((await getProject(project.id)).bom.some((entry) => entry.itemId === saved.id)).toBe(false);
  });

  it("creates verified result copies for BOM and parameter changes without accumulating copy suffixes", async () => {
    const saved = await saveCatalogItem(manualItem("copy-result-item"), 0);
    const original = await createProject({ title: "Stable copy", templateId: "blank" });
    const withItem = await addProjectItem(original.id, saved.id, 1);
    const withParameters = await updateParameters(withItem.id, { reach: 42 });

    expect(withItem.id).not.toBe(original.id);
    expect(withParameters.id).not.toBe(withItem.id);
    expect(withItem.title).toBe("Stable copy");
    expect(withParameters.title).toBe("Stable copy");
    expect((await getProject(original.id)).bom.some((entry) => entry.itemId === saved.id)).toBe(false);
    expect((await getProject(withItem.id)).parameters.reach).toBeUndefined();
    expect(withParameters.parameters.reach).toBe(42);
  });

  it("rejects stale catalog versions", async () => {
    const first = await saveCatalogItem(manualItem("versioned-item"), 0);
    await saveCatalogItem({ ...first, description: "New description" }, first.version);
    await expect(saveCatalogItem({ ...first, description: "Stale update" }, first.version)).rejects.toThrow(/version conflict/i);
  });

  it("keeps concurrent registrations from separate tsx processes", async () => {
    await getBootstrap();
    const parent = path.dirname(process.env.METATRANSFORMER_HOME!);
    const firstDirectory = path.join(parent, "external-first");
    const secondDirectory = path.join(parent, "external-second");
    const first = await scaffoldProject(firstDirectory, { title: "Concurrent first", templateId: "blank" });
    const second = await scaffoldProject(secondDirectory, { title: "Concurrent second", templateId: "blank" });
    const childSource = (directory: string) => `
      import { registerProject } from "./src/server/store.ts";
      await registerProject(${JSON.stringify(directory)});
    `;
    const options = {
      cwd: process.cwd(),
      env: { ...process.env, METATRANSFORMER_HOME: process.env.METATRANSFORMER_HOME! },
      timeout: 20_000,
    };

    await Promise.all([
      execFileAsync(process.execPath, ["--import=tsx", "--input-type=module", "--eval", childSource(firstDirectory)], options),
      execFileAsync(process.execPath, ["--import=tsx", "--input-type=module", "--eval", childSource(secondDirectory)], options),
    ]);

    const ids = (await getBootstrap()).projects.map((project) => project.id);
    expect(ids).toContain(first.id);
    expect(ids).toContain(second.id);
  }, 30_000);

  it("registers the same canonical project idempotently and can export it", async () => {
    const parent = path.dirname(process.env.METATRANSFORMER_HOME!);
    const directory = path.join(parent, "registered-project");
    await scaffoldProject(directory, { title: "Registered once", templateId: "blank" });

    const first = await registerProject(directory);
    const second = await registerProject(path.join(directory, "."));
    const bundle = JSON.parse((await exportProject(second.id, ["README.md"])).content) as { files: { path: string }[] };

    expect(second.id).toBe(first.id);
    expect(bundle.files.map((file) => file.path)).toEqual(["README.md"]);
  });

  it("rejects real registry identity and directory collisions", async () => {
    const parent = path.dirname(process.env.METATRANSFORMER_HOME!);
    const firstDirectory = path.join(parent, "collision-first");
    const secondDirectory = path.join(parent, "collision-second");
    const first = await scaffoldProject(firstDirectory, { title: "Collision first", templateId: "blank" });
    await scaffoldProject(secondDirectory, { title: "Collision second", templateId: "blank" });
    await registerProject(firstDirectory);

    const secondManifestPath = path.join(secondDirectory, "project.json");
    const secondManifest = JSON.parse(await readFile(secondManifestPath, "utf8")) as Record<string, unknown>;
    await writeFile(secondManifestPath, `${JSON.stringify({ ...secondManifest, id: first.id }, null, 2)}\n`);
    await expect(registerProject(secondDirectory)).rejects.toThrow(/identity.*another directory/i);

    const registeredSecondId = "collision-second-id";
    await writeFile(secondManifestPath, `${JSON.stringify({ ...secondManifest, id: registeredSecondId }, null, 2)}\n`);
    await registerProject(secondDirectory);
    await writeFile(secondManifestPath, `${JSON.stringify({ ...secondManifest, id: "replacement-identity" }, null, 2)}\n`);
    await expect(registerProject(secondDirectory)).rejects.toThrow(/directory.*another identity/i);
  });

  it("keeps unavailable registrations for recovery while bootstrapping the valid catalog", async () => {
    const project = await createProject({ title: "Temporarily offline", templateId: "blank" });
    await rm(project.directory, { recursive: true, force: true });

    const bootstrap = await getBootstrap();
    expect(bootstrap.projects.some((entry) => entry.id === project.id)).toBe(false);
    expect(bootstrap.warnings?.join(" ")).toMatch(new RegExp(project.id));
    expect(bootstrap.library.length).toBeGreaterThan(0);
    const registry = JSON.parse(await readFile(path.join(process.env.METATRANSFORMER_HOME!, "projects.json"), "utf8")) as { id: string }[];
    expect(registry.some((entry) => entry.id === project.id)).toBe(true);
    await expect(getProject(project.id)).rejects.toThrow(/invalid|project\.json/i);
  });

  it("exports a capped portable source bundle without private inventory or source text", async () => {
    const item = manualItem("private-inventory-item");
    item.sources = [{
      id: "local-source",
      title: "Local notes",
      capturedAt: new Date().toISOString(),
      text: "private retained ingestion original",
    }];
    const saved = await saveCatalogItem(item, 0);
    const project = await createProject({ title: "Portable build", templateId: "blank" });
    const result = await addProjectItem(project.id, saved.id, 2);
    await writeFile(path.join(result.directory, "PRIVATE-NOTES.md"), "not for default export\n");
    await mkdir(path.join(result.directory, "firmware"), { recursive: true });
    await writeFile(path.join(result.directory, "firmware", "main.cpp"), "int main() { return 0; }\n");
    await writeFile(path.join(result.directory, "firmware", "credentials.key"), "do not export\n");
    await writeFile(path.join(result.directory, "firmware", "agent-transcript.json"), "do not export\n");

    const exported = await exportProject(result.id);
    const bundle = JSON.parse(exported.content) as {
      project: { bom: { snapshot: CatalogItem }[] };
      files: { path: string; encoding: string; content: string }[];
      library?: unknown;
    };
    const snapshot = bundle.project.bom.find((entry) => entry.snapshot.id === saved.id)!.snapshot;
    expect(exported.filename).toBe("portable-build-copy.workshop.json");
    expect(snapshot.ownedQuantity).toBe(0);
    expect(snapshot.notes).toBe("");
    expect(snapshot.sources[0].text).toBeUndefined();
    expect(bundle.library).toBeUndefined();
    expect(bundle.files.find((file) => file.path === "README.md")).toMatchObject({ encoding: "base64" });
    expect(bundle.files.some((file) => file.path === "firmware/main.cpp")).toBe(true);
    expect(bundle.files.some((file) => file.path === "PRIVATE-NOTES.md")).toBe(false);
    expect(bundle.files.some((file) => file.path === "firmware/credentials.key")).toBe(false);
    expect(bundle.files.some((file) => file.path === "firmware/agent-transcript.json")).toBe(false);
    expect((bundle.project as unknown as { directory?: string }).directory).toBeUndefined();

    const explicitlySelected = JSON.parse((await exportProject(result.id, ["PRIVATE-NOTES.md"])).content) as {
      files: { path: string; size: number; hash: string; content: string }[];
    };
    expect(explicitlySelected.files.map((file) => file.path)).toEqual(["PRIVATE-NOTES.md"]);
    const selectedBytes = Buffer.from(explicitlySelected.files[0].content, "base64");
    expect(explicitlySelected.files[0].size).toBe(selectedBytes.byteLength);
    expect(explicitlySelected.files[0].hash).toBe(createHash("sha256").update(selectedBytes).digest("hex"));
    await expect(exportProject(result.id, ["firmware/credentials.key"])).rejects.toThrow(/sensitive/i);
    await expect(exportProject(result.id, ["firmware/agent-transcript.json"])).rejects.toThrow(/transcript/i);
    await expect(exportProject(result.id, ["missing.txt"])).rejects.toThrow(/does not exist/i);
    await expect(exportProject(result.id, Array.from({ length: 501 }, () => "README.md"))).rejects.toThrow(/file limit/i);

    await writeFile(path.join(result.directory, "EXPORT.json"), `${JSON.stringify({ files: ["PRIVATE-NOTES.md"] }, null, 2)}\n`);
    const allowlisted = JSON.parse((await exportProject(result.id)).content) as { files: { path: string }[] };
    expect(allowlisted.files.map((file) => file.path)).toEqual(["PRIVATE-NOTES.md"]);
  });
});
