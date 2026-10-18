import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import { getProjectDirectory } from "./store";

const MAX_ASSET_BYTES = 16 * 1024 * 1024;
const MAX_MANIFEST_BYTES = 2 * 1024 * 1024;
const GLB_MAGIC = 0x46546c67;
const GLB_JSON_CHUNK = 0x4e4f534a;
const GLB_BINARY_CHUNK = 0x004e4942;
const UNSUPPORTED_COMPRESSION_EXTENSIONS = new Set([
  "KHR_draco_mesh_compression",
  "EXT_meshopt_compression",
]);

const MIME_BY_EXTENSION = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".glb", "model/gltf-binary"],
]);

function assetError(message: string): Error {
  return new Error(`Asset preview not supported: ${message}`);
}

function normalizedAssetPath(input: string): string {
  if (!input || input.includes("\0") || input.includes("\\") || path.posix.isAbsolute(input) || path.win32.isAbsolute(input) || path.isAbsolute(input)) {
    throw assetError("the file path must be a relative POSIX path.");
  }
  const segments = input.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw assetError("path traversal is not allowed.");
  }
  return segments.join("/");
}

function expectedMime(relativePath: string): string {
  const mime = MIME_BY_EXTENSION.get(path.posix.extname(relativePath).toLowerCase());
  if (!mime) {
    throw assetError("only PNG, JPEG, WebP, and self-contained GLB files can be previewed.");
  }
  return mime;
}

function isPng(bytes: Uint8Array): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
}

function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isWebp(bytes: Uint8Array): boolean {
  return bytes.length >= 12
    && String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF"
    && String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP";
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true);
}

function decodedBase64Size(value: string): number {
  if (!value || value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    throw assetError("an embedded image contains invalid base64 data.");
  }
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return (value.length / 4) * 3 - padding;
}

function validateEmbeddedImage(uri: string): string {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(uri);
  if (!match) {
    throw assetError("GLB image URIs must be embedded base64 PNG, JPEG, or WebP data; external files and URLs are disabled.");
  }
  const mime = match[1].toLowerCase();
  const encoded = match[2];
  const size = decodedBase64Size(encoded);
  if (size > MAX_ASSET_BYTES) throw assetError("an embedded image exceeds the 16 MB preview limit.");
  const bytes = Buffer.from(encoded, "base64");
  const matches = mime === "image/png" ? isPng(bytes) : mime === "image/jpeg" ? isJpeg(bytes) : isWebp(bytes);
  if (!matches) throw assetError(`an embedded ${mime} image does not match its declared MIME type.`);
  return mime;
}

function findUnsupportedCompression(value: unknown): string | undefined {
  const pending: unknown[] = [value];
  while (pending.length) {
    const candidate = pending.pop();
    if (!candidate || typeof candidate !== "object") continue;
    if (Array.isArray(candidate)) {
      for (const item of candidate) pending.push(item);
      continue;
    }
    for (const [key, child] of Object.entries(candidate as Record<string, unknown>)) {
      if (UNSUPPORTED_COMPRESSION_EXTENSIONS.has(key)) return key;
      pending.push(child);
    }
  }
  return undefined;
}

function validateGlb(bytes: Uint8Array): void {
  if (bytes.byteLength < 20 || readUint32(bytes, 0) !== GLB_MAGIC) {
    throw assetError("the .glb file does not have a valid glTF binary signature.");
  }
  if (readUint32(bytes, 4) !== 2) throw assetError("only glTF 2.0 GLB models are supported.");
  if (readUint32(bytes, 8) !== bytes.byteLength) throw assetError("the GLB header length does not match the file size.");

  let offset = 12;
  let json: unknown;
  let binaryChunk: Uint8Array | undefined;
  let chunkIndex = 0;
  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) throw assetError("the GLB has a truncated chunk header.");
    const chunkLength = readUint32(bytes, offset);
    const chunkType = readUint32(bytes, offset + 4);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;
    if (chunkLength % 4 !== 0 || chunkEnd > bytes.byteLength) throw assetError("the GLB contains an invalid chunk length.");
    if (chunkIndex === 0 && chunkType !== GLB_JSON_CHUNK) throw assetError("the first GLB chunk must contain JSON.");
    if (chunkType === GLB_JSON_CHUNK) {
      if (json !== undefined) throw assetError("the GLB contains more than one JSON chunk.");
      try {
        const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(chunkStart, chunkEnd)).replace(/[\x00\x20]+$/g, "");
        json = JSON.parse(text) as unknown;
      } catch {
        throw assetError("the GLB JSON chunk is invalid.");
      }
    } else if (chunkType === GLB_BINARY_CHUNK) {
      if (binaryChunk) throw assetError("the GLB contains more than one binary chunk.");
      binaryChunk = bytes.subarray(chunkStart, chunkEnd);
    }
    offset = chunkEnd;
    chunkIndex += 1;
  }
  if (offset !== bytes.byteLength || !json || typeof json !== "object" || Array.isArray(json)) {
    throw assetError("the GLB does not contain a valid JSON document.");
  }

  const document = json as Record<string, unknown>;
  const asset = document.asset;
  if (!asset || typeof asset !== "object" || Array.isArray(asset) || (asset as Record<string, unknown>).version !== "2.0") {
    throw assetError("the GLB JSON must declare glTF asset version 2.0.");
  }
  let unsupported: string | undefined;
  for (const extensions of [document.extensionsUsed, document.extensionsRequired]) {
    if (!Array.isArray(extensions)) continue;
    const found = extensions.find((extension) => typeof extension === "string" && UNSUPPORTED_COMPRESSION_EXTENSIONS.has(extension));
    if (typeof found === "string") {
      unsupported = found;
      break;
    }
  }
  unsupported ??= findUnsupportedCompression(document);
  if (unsupported) {
    throw assetError(`${unsupported} compressed geometry is not supported; export the model without Draco or meshopt compression.`);
  }

  if (document.buffers !== undefined && !Array.isArray(document.buffers)) throw assetError("the GLB buffers list is invalid.");
  for (const buffer of (document.buffers as unknown[] | undefined) ?? []) {
    if (!buffer || typeof buffer !== "object" || Array.isArray(buffer)) throw assetError("the GLB contains an invalid buffer entry.");
    if ("uri" in buffer) throw assetError("GLB buffer URIs are disabled; embed geometry in the GLB binary chunk.");
  }
  if (document.images !== undefined && !Array.isArray(document.images)) throw assetError("the GLB images list is invalid.");
  for (const image of (document.images as unknown[] | undefined) ?? []) {
    if (!image || typeof image !== "object" || Array.isArray(image)) throw assetError("the GLB contains an invalid image entry.");
    const imageRecord = image as Record<string, unknown>;
    const uri = imageRecord.uri;
    if (uri !== undefined) {
      if (typeof uri !== "string") throw assetError("the GLB contains an invalid image URI.");
      const embeddedMime = validateEmbeddedImage(uri);
      if (imageRecord.mimeType !== undefined && String(imageRecord.mimeType).toLowerCase() !== embeddedMime) {
        throw assetError("an embedded GLB image URI does not match its declared MIME type.");
      }
    } else if (imageRecord.bufferView !== undefined) {
      const imageMime = String(imageRecord.mimeType).toLowerCase();
      if (!["image/png", "image/jpeg", "image/webp"].includes(imageMime)) {
        throw assetError("embedded GLB images must declare PNG, JPEG, or WebP MIME type; SVG and other formats are disabled.");
      }
      const viewIndex = imageRecord.bufferView;
      const bufferViews = document.bufferViews;
      if (!Number.isInteger(viewIndex) || !Array.isArray(bufferViews) || !bufferViews[viewIndex as number] || !binaryChunk) {
        throw assetError("an embedded GLB image references an invalid binary buffer view.");
      }
      const view = bufferViews[viewIndex as number];
      if (!view || typeof view !== "object" || Array.isArray(view)) throw assetError("an embedded GLB image references an invalid buffer view.");
      const viewRecord = view as Record<string, unknown>;
      const byteOffset = viewRecord.byteOffset ?? 0;
      const byteLength = viewRecord.byteLength;
      if (viewRecord.buffer !== 0 || !Number.isInteger(byteOffset) || !Number.isInteger(byteLength)
        || (byteOffset as number) < 0 || (byteLength as number) < 0
        || (byteOffset as number) + (byteLength as number) > binaryChunk.byteLength) {
        throw assetError("an embedded GLB image has invalid binary bounds.");
      }
      const imageBytes = binaryChunk.subarray(byteOffset as number, (byteOffset as number) + (byteLength as number));
      const matches = imageMime === "image/png" ? isPng(imageBytes) : imageMime === "image/jpeg" ? isJpeg(imageBytes) : isWebp(imageBytes);
      if (!matches) throw assetError(`an embedded ${imageMime} image does not match its declared MIME type.`);
    } else {
      throw assetError("each GLB image must use an embedded data URI or binary buffer view.");
    }
  }
}

export function validateAssetBytes(relativePath: string, bytes: Uint8Array): string {
  const normalized = normalizedAssetPath(relativePath);
  const mime = expectedMime(normalized);
  if (bytes.byteLength > MAX_ASSET_BYTES) throw assetError("the file exceeds the 16 MB preview limit.");
  if (mime === "image/png" && !isPng(bytes)) throw assetError("the .png file signature does not match PNG.");
  if (mime === "image/jpeg" && !isJpeg(bytes)) throw assetError("the JPEG file signature does not match its extension.");
  if (mime === "image/webp" && !isWebp(bytes)) throw assetError("the .webp file signature does not match WebP.");
  if (mime === "model/gltf-binary") validateGlb(bytes);
  return mime;
}

function isWithin(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function readBoundedRegularFile(absolutePath: string, limit: number, label: string): Promise<Buffer> {
  const handle = await open(absolutePath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = await handle.stat();
    if (!before.isFile()) throw assetError(`${label} is not a regular file.`);
    if (before.size > limit) throw assetError(`${label} exceeds the ${Math.floor(limit / (1024 * 1024))} MB limit.`);
    const bytes = await handle.readFile();
    const after = await handle.stat();
    if (!after.isFile() || after.size > limit || bytes.byteLength > limit) throw assetError(`${label} changed beyond its size limit while being read.`);
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || bytes.byteLength !== after.size) {
      throw assetError(`${label} changed while being read; try again.`);
    }
    return bytes;
  } finally {
    await handle.close();
  }
}

async function assertRealPathSegments(root: string, relativePath: string): Promise<string> {
  let current = root;
  for (const segment of relativePath.split("/")) {
    current = path.join(current, segment);
    const details = await lstat(current);
    if (details.isSymbolicLink()) throw assetError(`symlinks are not allowed in asset paths: ${relativePath}`);
  }
  const resolved = await realpath(current);
  if (!isWithin(root, resolved)) throw assetError("the resolved file path escapes the project directory.");
  return resolved;
}

async function verifyProjectIdentity(root: string, id: string): Promise<void> {
  const manifestPath = await assertRealPathSegments(root, "project.json");
  const manifestBytes = await readBoundedRegularFile(manifestPath, MAX_MANIFEST_BYTES, "the project manifest");
  try {
    const manifest = JSON.parse(manifestBytes.toString("utf8")) as unknown;
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest) || (manifest as Record<string, unknown>).id !== id) {
      throw new Error("identity mismatch");
    }
  } catch {
    throw assetError(`registered project identity does not match ${id}.`);
  }
}

export async function readProjectAsset(id: string, requestedPath: string): Promise<{ mime: string; base64: string }> {
  const relativePath = normalizedAssetPath(requestedPath);
  expectedMime(relativePath);
  const directory = await getProjectDirectory(id);
  const rootDetails = await lstat(directory);
  if (!rootDetails.isDirectory() || rootDetails.isSymbolicLink()) throw assetError("the registered project directory is not a real directory.");
  const root = await realpath(directory);
  await verifyProjectIdentity(root, id);
  const absolutePath = await assertRealPathSegments(root, relativePath);
  const bytes = await readBoundedRegularFile(absolutePath, MAX_ASSET_BYTES, "the asset");
  const verifiedAfterRead = await assertRealPathSegments(root, relativePath);
  if (verifiedAfterRead !== absolutePath) throw assetError("the asset path changed while being read; try again.");
  const mime = validateAssetBytes(relativePath, bytes);
  return { mime, base64: bytes.toString("base64") };
}
