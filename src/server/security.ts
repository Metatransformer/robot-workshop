import { randomBytes, timingSafeEqual } from "node:crypto";

const state = globalThis as typeof globalThis & { workshopToken?: string };
export class WorkshopError extends Error {
  constructor(message: string, readonly status = 400, readonly code = "INVALID_REQUEST") { super(message); }
}
export function sessionToken(): string {
  return state.workshopToken ??= randomBytes(32).toString("hex");
}
function permittedHosts(): Set<string> {
  const port = process.env.PORT || "3000";
  return new Set([`localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`]);
}
export function verifyLocalEntry(headers: Headers): void {
  if (process.env.VERCEL === "1" || process.env.METATRANSFORMER_MODE === "hosted") throw new WorkshopError("The local workshop is disabled on this host.", 403, "LOCAL_ONLY");
  if (!permittedHosts().has(headers.get("host") || "")) throw new WorkshopError("Open this workshop on its configured localhost address.", 403, "LOCAL_ONLY");
  if (headers.get("sec-fetch-site") === "cross-site") throw new WorkshopError("Cross-site workshop access is blocked.", 403, "CROSS_SITE");
  const origin = headers.get("origin");
  if (origin) {
    let parsed: URL;
    try { parsed = new URL(origin); } catch { throw new WorkshopError("Invalid origin.", 403, "CROSS_SITE"); }
    if (parsed.protocol !== "http:" || parsed.host !== headers.get("host") || parsed.origin !== origin) {
      throw new WorkshopError("Use the same local origin as the workshop.", 403, "CROSS_SITE");
    }
  }
}
export function verifyApiRequest(request: Request): void {
  verifyLocalEntry(request.headers);
  const actual = Buffer.from(request.headers.get("x-workshop-token") || "");
  const expected = Buffer.from(sessionToken());
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new WorkshopError("Workshop session expired. Reload the local workshop.", 401, "SESSION_REQUIRED");
  }
}
export async function boundedJson(request: Request, limit = 34_000_000): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new WorkshopError("Send application/json.", 415, "CONTENT_TYPE");
  }
  if (Number(request.headers.get("content-length")) > limit) throw new WorkshopError("Request is too large.", 413, "TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) throw new WorkshopError("Missing request body.");
  const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      total += value.byteLength;
      if (total > limit) { await reader.cancel(); throw new WorkshopError("Request is too large.", 413, "TOO_LARGE"); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof WorkshopError) throw error;
    throw new WorkshopError("Request body must be valid JSON.");
  } finally { reader.releaseLock(); }
}
