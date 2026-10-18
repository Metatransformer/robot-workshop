import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readProjectAsset, validateAssetBytes } from "../src/server/assets";
import { createProject } from "../src/server/store";

const temporaryDirectories: string[] = [];
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

beforeEach(async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "workshop-assets-"));
  temporaryDirectories.push(directory);
  process.env.METATRANSFORMER_HOME = path.join(directory, "home");
});

afterEach(async () => {
  delete process.env.METATRANSFORMER_HOME;
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

function paddedJson(value: unknown): Buffer {
  const source = Buffer.from(JSON.stringify(value), "utf8");
  const padding = (4 - source.byteLength % 4) % 4;
  return Buffer.concat([source, Buffer.alloc(padding, 0x20)]);
}

function makeGlb(document: unknown, binary?: Buffer): Buffer {
  const json = paddedJson(document);
  const binaryPadding = binary ? (4 - binary.byteLength % 4) % 4 : 0;
  const paddedBinary = binary ? Buffer.concat([binary, Buffer.alloc(binaryPadding)]) : undefined;
  const totalLength = 12 + 8 + json.byteLength + (paddedBinary ? 8 + paddedBinary.byteLength : 0);
  const glb = Buffer.alloc(totalLength);
  glb.writeUInt32LE(0x46546c67, 0);
  glb.writeUInt32LE(2, 4);
  glb.writeUInt32LE(totalLength, 8);
  glb.writeUInt32LE(json.byteLength, 12);
  glb.writeUInt32LE(0x4e4f534a, 16);
  json.copy(glb, 20);
  if (paddedBinary) {
    const offset = 20 + json.byteLength;
    glb.writeUInt32LE(paddedBinary.byteLength, offset);
    glb.writeUInt32LE(0x004e4942, offset + 4);
    paddedBinary.copy(glb, offset + 8);
  }
  return glb;
}

function triangleGlb(): Buffer {
  const vertices = Buffer.alloc(9 * Float32Array.BYTES_PER_ELEMENT);
  [0, 0, 0, 1, 0, 0, 0, 1, 0].forEach((value, index) => vertices.writeFloatLE(value, index * 4));
  return makeGlb({
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: vertices.byteLength }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: vertices.byteLength, target: 34962 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] }],
  }, vertices);
}

describe("artifact validation", () => {
  it("accepts supported image signatures and rejects mismatches and oversized bytes", () => {
    expect(validateAssetBytes("render.png", PNG)).toBe("image/png");
    expect(() => validateAssetBytes("render.jpg", PNG)).toThrow(/signature|match/i);
    expect(() => validateAssetBytes("render.png", Buffer.alloc(16 * 1024 * 1024 + 1))).toThrow(/16 MB/i);
  });

  it("accepts a self-contained GLB 2 triangle", () => {
    expect(validateAssetBytes("models/triangle.glb", triangleGlb())).toBe("model/gltf-binary");
  });

  it("rejects GLBs with external resource URIs", () => {
    const external = makeGlb({ asset: { version: "2.0" }, buffers: [{ byteLength: 12, uri: "https://example.test/model.bin" }] });
    expect(() => validateAssetBytes("external.glb", external)).toThrow(/URI|self-contained|embed/i);
  });
});

describe("project asset reads", () => {
  it("reads an owned project asset after verifying its type", async () => {
    const project = await createProject({ title: "Asset read", templateId: "blank" });
    await writeFile(path.join(project.directory, "render.png"), PNG);
    await expect(readProjectAsset(project.id, "render.png")).resolves.toEqual({
      mime: "image/png",
      base64: PNG.toString("base64"),
    });
  });

  it("rejects traversal and absolute paths", async () => {
    const project = await createProject({ title: "Traversal", templateId: "blank" });
    await expect(readProjectAsset(project.id, "../render.png")).rejects.toThrow(/traversal|relative/i);
    await expect(readProjectAsset(project.id, "/tmp/render.png")).rejects.toThrow(/relative/i);
    await expect(readProjectAsset(project.id, "folder\\render.png")).rejects.toThrow(/relative/i);
  });

  it("rejects a symlink segment that escapes the project directory", async () => {
    const project = await createProject({ title: "Symlink", templateId: "blank" });
    const outside = await mkdtemp(path.join(os.tmpdir(), "workshop-assets-outside-"));
    temporaryDirectories.push(outside);
    await writeFile(path.join(outside, "escape.png"), PNG);
    await mkdir(path.join(project.directory, "models"), { recursive: true });
    await symlink(outside, path.join(project.directory, "models", "linked"));
    await expect(readProjectAsset(project.id, "models/linked/escape.png")).rejects.toThrow(/symlink/i);
  });
});
