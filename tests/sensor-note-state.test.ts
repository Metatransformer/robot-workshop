import { describe, expect, it } from "vitest";
import { changedSensorNoteSegmentIds } from "../src/lib/sensor-note-state";

describe("sensor note change tracking", () => {
  it("treats empty notes as clean against the default empty baseline", () => {
    expect(changedSensorNoteSegmentIds({})).toEqual([]);
    expect(changedSensorNoteSegmentIds({ "segment-1": "" })).toEqual([]);
  });

  it("finds edited notes and becomes clean when they revert to baseline", () => {
    expect(changedSensorNoteSegmentIds({ "segment-1": "bench observation" })).toEqual(["segment-1"]);
    expect(changedSensorNoteSegmentIds(
      { "segment-1": "original note" },
      { "segment-1": "original note" },
    )).toEqual([]);
  });

  it("treats deletion of a restored or exported note as a change", () => {
    expect(changedSensorNoteSegmentIds({}, { "segment-1": "included in report" })).toEqual(["segment-1"]);
  });

  it("tracks each segment against its own baseline", () => {
    expect(changedSensorNoteSegmentIds(
      { "segment-1": "exported", "segment-2": "new edit", "segment-3": "restored then edited" },
      { "segment-1": "exported", "segment-3": "restored" },
    )).toEqual(["segment-2", "segment-3"]);
  });

  it("uses a replacement dataset baseline instead of recycled segment IDs", () => {
    const oldDatasetBaseline = { "segment-1": "exported old note" };
    expect(changedSensorNoteSegmentIds({ "segment-1": "exported old note" }, oldDatasetBaseline)).toEqual([]);

    const replacementDatasetBaseline = {};
    expect(changedSensorNoteSegmentIds({ "segment-1": "exported old note" }, replacementDatasetBaseline)).toEqual(["segment-1"]);
  });
});
