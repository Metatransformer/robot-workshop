import { afterEach, describe, expect, it, vi } from "vitest";
import { boundedJson, sessionToken, verifyApiRequest, verifyLocalEntry } from "../src/server/security";
afterEach(() => vi.unstubAllEnvs());
const request = (extra: Record<string,string> = {}) => new Request("http://localhost:3000/api/workshop", { headers: { host: "localhost:3000", "x-workshop-token": sessionToken(), ...extra } });
describe("local access", () => {
  it("requires a valid secret for reads and writes", () => {
    expect(() => verifyApiRequest(request())).not.toThrow();
    expect(() => verifyApiRequest(request({ "x-workshop-token": "wrong" }))).toThrow("session");
    expect(() => verifyApiRequest(new Request("http://localhost:3000", { headers: { host: "localhost:3000" } }))).toThrow("session");
  });
  it("blocks rebinding, cross-site, null origins and unintended ports", () => {
    const cases: Record<string, string>[] = [{ host: "attacker.test:3000" }, { host: "localhost:4000" }, { origin: "null" }, { origin: "https://localhost:3000" }, { origin: "http://evil.test" }, { "sec-fetch-site": "cross-site" }];
    for (const extra of cases) {
      expect(() => verifyApiRequest(request(extra))).toThrow();
    }
    expect(() => verifyApiRequest(request({ origin: "http://localhost:3000" }))).not.toThrow();
  });
  it("never exposes a local entry in hosted mode", () => {
    vi.stubEnv("METATRANSFORMER_MODE", "hosted");
    expect(() => verifyLocalEntry(request().headers)).toThrow("disabled");
  });
  it("blocks local access on Vercel even with a local Host and valid token", () => {
    vi.stubEnv("VERCEL", "1");
    expect(() => verifyApiRequest(request())).toThrow("disabled");
  });
  it("bounds streamed bodies even without content length", async () => {
    const make = (text: string) => new Request("http://localhost", { method: "POST", headers: { "content-type": "application/json" }, body: text });
    await expect(boundedJson(make('{"ok":true}'))).resolves.toEqual({ ok: true });
    await expect(boundedJson(make('"too long"'), 4)).rejects.toThrow("large");
    await expect(boundedJson(make("oops"))).rejects.toThrow("JSON");
  });
});
