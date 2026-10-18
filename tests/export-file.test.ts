import { mkdtemp, mkdir, readFile, readdir, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";
import { checkExportDestination, writeNewExport } from "../src/server/export-file";
let root: string;
beforeEach(async () => { root = await realpath(await mkdtemp(join(tmpdir(), "mt-export-"))); await mkdir(join(root, "project")); });
afterEach(async () => { await rm(root, { recursive: true, force: true }); });
it("refuses outputs inside source and symlink ancestors", async () => {
  await expect(checkExportDestination(join(root, "project"), join(root, "project", "bundle.json"))).rejects.toThrow("outside");
  await symlink(join(root, "project"), join(root, "alias"));
  await expect(checkExportDestination(join(root, "project"), join(root, "alias", "bundle.json"))).rejects.toThrow("Symlink");
  expect(await readdir(join(root, "project"))).toEqual([]);
});
it("publishes complete files without replacing a concurrent output", async () => {
  const destination = await checkExportDestination(join(root, "project"), join(root, "bundle.json"));
  await writeNewExport(destination, '{"complete":true}');
  await expect(writeNewExport(destination, "bad")).rejects.toThrow();
  expect(await readFile(destination, "utf8")).toBe('{"complete":true}');
  expect((await readdir(root)).filter(f => f.endsWith(".tmp"))).toEqual([]);
});
it("cleans up a failed write before any final filename is visible", async () => {
  const destination = join(root, "bundle.json");
  // Invalid content forces writeFile failure after temporary creation.
  await expect(writeNewExport(destination, null as unknown as string)).rejects.toThrow();
  expect(await readdir(root)).toEqual(["project"]);
});
