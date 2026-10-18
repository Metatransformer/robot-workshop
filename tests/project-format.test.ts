import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { listProjectFiles, scaffoldProject, snapshotProject, validateProject } from "../src/lib/project-format";

const temporaryDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "workshop-format-"));
  temporaryDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("project format", () => {
  it("scaffolds useful template guidance and validates the project", async () => {
    const parent = await temporaryDirectory();
    const directory = path.join(parent, "linkage");
    const project = await scaffoldProject(directory, { title: "Bench linkage", templateId: "linkage" });

    expect(project.parameters).toEqual({ crank: 25, coupler: 65, rocker: 50, ground: 70, speed: 1 });
    expect(await readFile(path.join(directory, "README.md"), "utf8")).toContain("ENGINEERING.md");
    const engineering = await readFile(path.join(directory, "ENGINEERING.md"), "utf8");
    expect(engineering).toContain("Dead-center locking");
    expect(engineering).toContain("has not been physically built or validated");
    expect((await validateProject(directory)).valid).toBe(true);
    expect((await listProjectFiles(directory)).map((file) => file.path)).toContain("AGENTS.md");
  });

  it("aborts on a collision without altering the existing file", async () => {
    const parent = await temporaryDirectory();
    const directory = path.join(parent, "existing");
    await mkdir(directory);
    await writeFile(path.join(directory, "README.md"), "keep me\n");

    await expect(scaffoldProject(directory, { title: "No overwrite", templateId: "blank" })).rejects.toThrow(/collision/i);
    expect(await readFile(path.join(directory, "README.md"), "utf8")).toBe("keep me\n");
    await expect(readFile(path.join(directory, "project.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("refuses symlinks and leaves no snapshot directory", async () => {
    const parent = await temporaryDirectory();
    const source = path.join(parent, "source");
    const destination = path.join(parent, "snapshot");
    await scaffoldProject(source, { title: "Symlink test", templateId: "blank" });
    await symlink(path.join(source, "README.md"), path.join(source, "linked.md"));

    await expect(snapshotProject(source, destination)).rejects.toThrow(/symlink/i);
    await expect(readFile(path.join(destination, "project.json"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("detects a source changing while a bounded snapshot is copied", async () => {
    const parent = await temporaryDirectory();
    const source = path.join(parent, "source");
    const destination = path.join(parent, "snapshot");
    await scaffoldProject(source, { title: "Mutation test", templateId: "blank" });
    const changing = path.join(source, "z-changing.txt");
    await writeFile(changing, Buffer.alloc(4 * 1024 * 1024, 1));
    for (let index = 0; index < 12; index += 1) {
      await writeFile(path.join(source, `payload-${String(index).padStart(2, "0")}.bin`), Buffer.alloc(2 * 1024 * 1024, index));
    }

    let counter = 2;
    const timer = setInterval(() => {
      void writeFile(changing, Buffer.alloc(4 * 1024 * 1024, counter++ % 251));
    }, 2);
    try {
      await expect(snapshotProject(source, destination)).rejects.toThrow(/changed while|verification/i);
    } finally {
      clearInterval(timer);
    }
  }, 20_000);
});
