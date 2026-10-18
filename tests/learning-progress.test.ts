import { describe, expect, it } from "vitest";
import {
  LEARNING_PROGRESS_STORAGE_KEY,
  emptyLearningProgress,
  loadLearningProgress,
  mergeLearningProgress,
  parseLearningProgress,
  saveLearningProgress,
  serializeLearningProgress,
  validateDemonstrationNote,
  type LearningProgressState,
} from "@/lib/learning-progress";

const ids = ["units-estimation", "algebra-trig"];
const record = {
  read: true,
  practiced: false,
  demonstrated: false,
  notes: "Measured 4.8 V at the supply under load.",
  updatedAt: "2026-10-18T12:00:00.000Z",
};

describe("learning progress", () => {
  it("rejects malformed JSON and unsupported versions", () => {
    expect(parseLearningProgress("{nope", ids)).toMatchObject({ ok: false });
    expect(parseLearningProgress('{"version":2,"records":{}}', ids)).toEqual({
      ok: false,
      error: "Progress files must use version 1.",
    });
  });

  it("ignores unknown lesson IDs while retaining matching records", () => {
    const parsed = parseLearningProgress(JSON.stringify({
      version: 1,
      records: { "units-estimation": record, "invented-lesson": record },
    }), ids);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.records).toEqual({ "units-estimation": record });
    expect(parsed.warnings).toEqual(["Ignored unknown lesson “invented-lesson”."]);
  });

  it("round-trips valid progress without changing evidence", () => {
    const state: LearningProgressState = { version: 1, records: { "units-estimation": record } };
    const parsed = parseLearningProgress(serializeLearningProgress(state), ids);
    expect(parsed).toEqual({ ok: true, value: state, warnings: [] });
  });

  it("merges achievements independently and imports non-empty notes", () => {
    const current: LearningProgressState = {
      version: 1,
      records: { "units-estimation": { ...record, notes: "old note", practiced: true } },
    };
    const incoming: LearningProgressState = {
      version: 1,
      records: { "units-estimation": { ...record, read: false, demonstrated: true } },
    };
    const merged = mergeLearningProgress(current, incoming).records["units-estimation"];
    expect(merged).toMatchObject({ read: true, practiced: true, demonstrated: true, notes: record.notes });
  });

  it("requires a concrete demonstration note", () => {
    expect(validateDemonstrationNote("measured it")).toMatchObject({ ok: false });
    expect(validateDemonstrationNote(" Expected 5 V; measured 4.82 V under load. ")).toEqual({
      ok: true,
      value: "Expected 5 V; measured 4.82 V under load.",
      warnings: [],
    });
  });

  it("reports storage read and write exceptions without throwing", () => {
    const blocked = {
      getItem() { throw new Error("blocked"); },
      setItem() { throw new Error("blocked"); },
    };
    expect(loadLearningProgress(blocked, ids)).toMatchObject({ ok: false, error: expect.stringContaining("unavailable") });
    expect(saveLearningProgress(blocked, emptyLearningProgress())).toMatchObject({ ok: false, error: expect.stringContaining("not saved") });
  });

  it("does not claim success when storage silently drops a write", () => {
    const noOpStorage = { getItem: () => null, setItem: () => undefined };
    expect(saveLearningProgress(noOpStorage, emptyLearningProgress())).toMatchObject({
      ok: false,
      error: expect.stringContaining("not saved"),
    });
  });

  it("reads and writes through a storage-compatible object", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem(key: string) { return values.get(key) ?? null; },
      setItem(key: string, value: string) { values.set(key, value); },
    };
    const state: LearningProgressState = { version: 1, records: { "units-estimation": record } };
    expect(saveLearningProgress(storage, state).ok).toBe(true);
    expect(values.has(LEARNING_PROGRESS_STORAGE_KEY)).toBe(true);
    expect(loadLearningProgress(storage, ids)).toEqual({ ok: true, value: state, warnings: [] });
  });
});


describe("evidence integrity on restore", () => {
  it("rejects a demonstrated flag without an observation note", () => {
    const parsed = parseLearningProgress(JSON.stringify({ version: 1, records: { "units-estimation": { ...record, demonstrated: true, notes: "" } } }), ids);
    expect(parsed.ok && parsed.value.records).toEqual({});
  });
  it("keeps newer evidence when restoring an older backup", () => {
    const recent = { ...record, demonstrated: true, updatedAt: "2026-10-19T12:00:00Z", notes: "Recent bench evidence with measurement conditions." };
    const merged = mergeLearningProgress({version:1, records:{"units-estimation":recent}}, {version:1, records:{"units-estimation":record}});
    expect(merged.records["units-estimation"].notes).toBe(recent.notes);
    expect(merged.records["units-estimation"].updatedAt).toBe(recent.updatedAt);
  });
});

it("retains older bench evidence when a newer draft is too short to support the achievement", () => {
  const current = {version:1 as const, records:{"units-estimation":{...record, notes:"new draft", updatedAt:"2026-10-19T12:00:00Z"}}};
  const incoming = {version:1 as const, records:{"units-estimation":{...record, demonstrated:true}}};
  const merged = mergeLearningProgress(current, incoming);
  expect(merged.records["units-estimation"].demonstrated).toBe(true);
  expect(merged.records["units-estimation"].notes).toBe(record.notes);
  expect(parseLearningProgress(serializeLearningProgress(merged), ids)).toMatchObject({ok:true, value:merged});
});
