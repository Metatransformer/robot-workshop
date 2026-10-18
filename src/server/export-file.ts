import { lstat, link, open, realpath, unlink } from "node:fs/promises";
import { basename, dirname, isAbsolute, relative, resolve } from "node:path";
import { randomUUID } from "node:crypto";

export async function checkExportDestination(source: string, output: string): Promise<string> {
  const destination = resolve(output);
  let current = destination;
  while (true) {
    const stat = await lstat(current).catch(error => { if (error.code === "ENOENT") return null; throw error; });
    if (stat?.isSymbolicLink()) throw new Error(`Symlink paths are not accepted: ${current}`);
    if (current === destination && stat) throw new Error("Export destination already exists.");
    const parent = dirname(current); if (parent === current) break; current = parent;
  }
  const sourceRoot = await realpath(source);
  const canonicalOutput = resolve(await realpath(dirname(destination)), basename(destination));
  const rel = relative(sourceRoot, canonicalOutput);
  if (!rel || (!rel.startsWith("../") && !isAbsolute(rel))) throw new Error("Export output must be outside the source project.");
  return canonicalOutput;
}
export async function writeNewExport(destination: string, content: string): Promise<void> {
  const temporary = resolve(dirname(destination), `.metatransformer-export-${randomUUID()}.tmp`);
  const file = await open(temporary, "wx", 0o600);
  try {
    await file.writeFile(content, "utf8"); await file.sync(); await file.close();
    // Atomic no-replace publication: unlike rename, link fails if destination exists.
    await link(temporary, destination);
  } finally {
    await file.close().catch(() => undefined);
    await unlink(temporary);
  }
}
