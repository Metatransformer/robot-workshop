import { createHash } from "node:crypto";
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { importSourceBundle } from "../src/lib/bundle";
import { scaffoldProject } from "../src/lib/project-format";
import { exportProject, registerProject } from "../src/server/store";

type BundleEntry = {
  path: string;
  kind: string;
  size: number;
  hash: string;
  encoding: "base64";
  content: string;
};

type SourceBundle = {
  format: string;
  version: number;
  project: Record<string, unknown> & {
    id: string;
    createdAt: string;
    bom: Array<{
      snapshot: {
        ownedQuantity: number;
        notes: string;
        sources: Array<Record<string, unknown>>;
        specs: Array<Record<string, unknown>>;
      };
    }>;
  };
  files: BundleEntry[];
};

let temporaryRoot: string;

beforeEach(async () => {
  const canonicalTemporaryDirectory = await realpath(os.tmpdir());
  temporaryRoot = await mkdtemp(path.join(canonicalTemporaryDirectory, "workshop-bundle-"));
  process.env.METATRANSFORMER_HOME = path.join(temporaryRoot, "home");
});

afterEach(async () => {
  delete process.env.METATRANSFORMER_HOME;
  await rm(temporaryRoot, { recursive: true, force: true });
});

async function makeExportedBundle(): Promise<{ bundle: SourceBundle; bundleFile: string }> {
  const sourceDirectory = path.join(temporaryRoot, "publisher-project");
  await scaffoldProject(sourceDirectory, { title: "Bundle publisher", templateId: "sensor" });

  const manifestPath = path.join(sourceDirectory, "project.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as SourceBundle["project"];
  const firstSnapshot = manifest.bom[0].snapshot;
  firstSnapshot.ownedQuantity = 17;
  firstSnapshot.notes = "publisher-only inventory note";
  firstSnapshot.sources = [{
    id: "quoted-document",
    title: "Quoted component data sheet",
    url: "https://example.com/data-sheet.pdf",
    fileName: "data-sheet.pdf",
    hash: "publisher-document-hash",
    capturedAt: "2026-01-02T03:04:05.000Z",
    text: "private full source text",
  }];
  firstSnapshot.specs = [{
    label: "Supply voltage",
    value: "5",
    unit: "V",
    evidence: "document",
    sourceId: "quoted-document",
    quote: "The device accepts a regulated five volt supply.",
    page: 4,
  }];
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  await mkdir(path.join(sourceDirectory, "firmware"), { recursive: true });
  await writeFile(path.join(sourceDirectory, "firmware", "native.bin"), Buffer.from([0x00, 0xff, 0x13, 0x37, 0x0a, 0x80]));
  const registered = await registerProject(sourceDirectory);
  const exported = await exportProject(registered.id, ["README.md", "firmware/native.bin", "firmware/code.py"]);
  const bundleFile = path.join(temporaryRoot, exported.filename);
  await writeFile(bundleFile, exported.content);
  return { bundle: JSON.parse(exported.content) as SourceBundle, bundleFile };
}

async function writeMutatedBundle(bundle: SourceBundle, name: string): Promise<string> {
  const bundleFile = path.join(temporaryRoot, name);
  await writeFile(bundleFile, `${JSON.stringify(bundle, null, 2)}\n`);
  return bundleFile;
}

async function expectPathMissing(filePath: string): Promise<void> {
  await expect(lstat(filePath)).rejects.toMatchObject({ code: "ENOENT" });
}

describe("source bundle import", () => {
  it("round-trips every exported native byte and hash into a fresh, sanitized project", async () => {
    const { bundle, bundleFile } = await makeExportedBundle();
    const destination = path.join(temporaryRoot, "imported-project");

    const imported = await importSourceBundle(bundleFile, destination);

    expect(imported.id).not.toBe(bundle.project.id);
    expect(imported.createdAt).not.toBe(bundle.project.createdAt);
    expect(imported.provenance).toEqual({ sourceProjectId: bundle.project.id });
    for (const entry of bundle.files) {
      const expected = Buffer.from(entry.content, "base64");
      const actual = await readFile(path.join(destination, ...entry.path.split("/")));
      expect(actual.equals(expected), entry.path).toBe(true);
      expect(actual.byteLength, entry.path).toBe(entry.size);
      expect(createHash("sha256").update(actual).digest("hex"), entry.path).toBe(entry.hash);
    }

    const writtenManifest = JSON.parse(await readFile(path.join(destination, "project.json"), "utf8")) as SourceBundle["project"];
    expect(writtenManifest).toEqual(imported);
    expect(writtenManifest.bom[0].snapshot.ownedQuantity).toBe(0);
    expect(writtenManifest.bom[0].snapshot.notes).toBe("");
    expect(writtenManifest.bom[0].snapshot.sources[0]).toEqual({
      id: "quoted-document",
      title: "Quoted component data sheet",
      url: "https://example.com/data-sheet.pdf",
      fileName: "data-sheet.pdf",
      hash: "publisher-document-hash",
      capturedAt: "2026-01-02T03:04:05.000Z",
    });
    expect(writtenManifest.bom[0].snapshot.specs[0]).toMatchObject({
      sourceId: "quoted-document",
      quote: "The device accepts a regulated five volt supply.",
      page: 4,
    });
  });

  it("rejects duplicate paths before creating the destination", async () => {
    const { bundle } = await makeExportedBundle();
    bundle.files.push(structuredClone(bundle.files[0]));
    const bundleFile = await writeMutatedBundle(bundle, "duplicate.workshop.json");
    const destination = path.join(temporaryRoot, "duplicate-import");

    await expect(importSourceBundle(bundleFile, destination)).rejects.toThrow(/duplicate/i);
    await expectPathMissing(destination);
  });

  it("rejects traversal before creating the destination", async () => {
    const { bundle } = await makeExportedBundle();
    bundle.files[0].path = "../escaped.txt";
    const bundleFile = await writeMutatedBundle(bundle, "traversal.workshop.json");
    const destination = path.join(temporaryRoot, "traversal-import");

    await expect(importSourceBundle(bundleFile, destination)).rejects.toThrow(/escapes|relative POSIX|canonical/i);
    await expectPathMissing(destination);
    await expectPathMissing(path.join(temporaryRoot, "escaped.txt"));
  });

  it("rejects a modified hash before creating the destination", async () => {
    const { bundle } = await makeExportedBundle();
    bundle.files[0].hash = "0".repeat(64);
    const bundleFile = await writeMutatedBundle(bundle, "hash.workshop.json");
    const destination = path.join(temporaryRoot, "hash-import");

    await expect(importSourceBundle(bundleFile, destination)).rejects.toThrow(/hash mismatch/i);
    await expectPathMissing(destination);
  });

  it("rejects malformed base64 before creating the destination", async () => {
    const { bundle } = await makeExportedBundle();
    bundle.files[0].content = "not-base64!!!!";
    const bundleFile = await writeMutatedBundle(bundle, "base64.workshop.json");
    const destination = path.join(temporaryRoot, "base64-import");

    await expect(importSourceBundle(bundleFile, destination)).rejects.toThrow(/malformed base64/i);
    await expectPathMissing(destination);
  });

  it("rejects an existing destination without changing it", async () => {
    const { bundleFile } = await makeExportedBundle();
    const destination = path.join(temporaryRoot, "existing-import");
    await mkdir(destination);
    const sentinel = path.join(destination, "keep.txt");
    await writeFile(sentinel, "do not replace\n");

    await expect(importSourceBundle(bundleFile, destination)).rejects.toThrow(/already exists/i);
    expect(await readFile(sentinel, "utf8")).toBe("do not replace\n");
    await expectPathMissing(path.join(destination, "project.json"));
  });

  it("rejects a bad project schema before creating the destination", async () => {
    const { bundle } = await makeExportedBundle();
    bundle.project.title = "";
    const bundleFile = await writeMutatedBundle(bundle, "schema.workshop.json");
    const destination = path.join(temporaryRoot, "schema-import");

    await expect(importSourceBundle(bundleFile, destination)).rejects.toThrow(/schema is invalid/i);
    await expectPathMissing(destination);
  });

  it("rejects a symlink destination ancestor without writing through it", async () => {
    const { bundleFile } = await makeExportedBundle();
    const realParent = path.join(temporaryRoot, "real-parent");
    const linkedParent = path.join(temporaryRoot, "linked-parent");
    await mkdir(realParent);
    await symlink(realParent, linkedParent, "dir");
    const destination = path.join(linkedParent, "imported-project");

    await expect(importSourceBundle(bundleFile, destination)).rejects.toThrow(/symlink/i);
    await expectPathMissing(path.join(realParent, "imported-project"));
  });
});
