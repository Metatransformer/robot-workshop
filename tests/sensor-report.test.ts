import { describe, expect, it } from "vitest";
import {
  MAX_SENSOR_REPORT_BYTES,
  SENSOR_REPORT_HARDWARE_VALIDATION,
  SENSOR_REPORT_UNITS,
  parseSensorReport,
  type SensorReport,
} from "@/lib/sensor-report";

function fixture(origin: SensorReport["origin"] = "user-supplied-unverified") {
  return {
    version: 1,
    origin,
    source: "bench-capture.csv",
    importedAt: "2026-10-17T14:30:00.000Z",
    reportCreatedAt: "2026-10-17T14:35:00.000Z",
    selectedSegment: {
      id: "segment-3",
      index: 3,
      count: 5,
      startReason: "Recording resumed after diagnostic on source line 20.",
    },
    samples: [
      { timestamp: 10, tempC: 24, humidityPct: 40, pressureHpa: 1001, led: 0, sourceLine: 21 },
      { timestamp: 12, tempC: 28, humidityPct: 44, pressureHpa: 999, led: 1, sourceLine: 22 },
    ],
    summary: {
      count: 2,
      durationSeconds: 2,
      temperatureC: { min: 24, max: 28, mean: 26 },
      humidityPct: { min: 40, max: 44 },
      pressureHpa: { min: 999, max: 1001 },
    },
    notes: "Fan switched on before the second sample.",
    parseIssues: [
      { line: 20, kind: "diagnostic", message: "Firmware diagnostic interrupted the recording segment.", source: "# retrying sensor" },
      { line: 8, kind: "invalid-row", message: "Every field must be finite.", source: "7,NaN,40,1000,0" },
    ],
    units: { ...SENSOR_REPORT_UNITS },
    hardwareValidation: SENSOR_REPORT_HARDWARE_VALIDATION,
  };
}

function accepted(value: unknown): SensorReport {
  const result = parseSensorReport(JSON.stringify(value));
  if (!result.ok) throw new Error(result.error);
  return result.report;
}

describe("sensor observation report restoration", () => {
  it.each(["synthetic", "user-supplied-unverified"] as const)("round-trips a complete %s version 1 report", (origin) => {
    const original = fixture(origin);
    const restored = accepted(original);
    const roundTripped = accepted(restored);

    expect(roundTripped).toEqual(original);
    expect(roundTripped.selectedSegment).toMatchObject({ id: "segment-3", index: 3, count: 5 });
    expect(roundTripped.parseIssues).toEqual(original.parseIssues);
    expect(roundTripped.notes).toBe(original.notes);
    expect(roundTripped.source).toBe(original.source);
    expect(roundTripped.importedAt).toBe(original.importedAt);
  });

  it("validates but never trusts a report's derived summary", () => {
    const report = fixture();
    report.summary = {
      count: 99,
      durationSeconds: 999,
      temperatureC: { min: -500, max: 500, mean: 400 },
      humidityPct: { min: 0, max: 100 },
      pressureHpa: { min: 1, max: 2 },
    };

    expect(accepted(report).summary).toEqual({
      count: 2,
      durationSeconds: 2,
      temperatureC: { min: 24, max: 28, mean: 26 },
      humidityPct: { min: 40, max: 44 },
      pressureHpa: { min: 999, max: 1001 },
    });
  });

  it("rejects malformed JSON, unknown versions, extra fields, and wrong fixed metadata", () => {
    expect(parseSensorReport("{nope")).toEqual(expect.objectContaining({ ok: false, error: expect.stringMatching(/valid JSON/i) }));
    expect(parseSensorReport(JSON.stringify({ ...fixture(), version: 2 }))).toEqual(expect.objectContaining({ ok: false, error: expect.stringMatching(/unsupported/i) }));
    expect(parseSensorReport(JSON.stringify({ ...fixture(), extra: true }))).toEqual(expect.objectContaining({ ok: false }));
    expect(parseSensorReport(JSON.stringify({ ...fixture(), units: { ...SENSOR_REPORT_UNITS, pressure: "pascals" } }))).toEqual(expect.objectContaining({ ok: false }));
    expect(parseSensorReport(JSON.stringify({ ...fixture(), hardwareValidation: "verified" }))).toEqual(expect.objectContaining({ ok: false }));
  });

  it.each([
    ["nonnumeric temperature", (report: ReturnType<typeof fixture>) => { report.samples[0].tempC = "hot" as unknown as number; }],
    ["negative timestamp", (report: ReturnType<typeof fixture>) => { report.samples[0].timestamp = -1; }],
    ["humidity over 100", (report: ReturnType<typeof fixture>) => { report.samples[0].humidityPct = 101; }],
    ["nonpositive pressure", (report: ReturnType<typeof fixture>) => { report.samples[0].pressureHpa = 0; }],
    ["invalid LED", (report: ReturnType<typeof fixture>) => { report.samples[0].led = 2 as 0; }],
  ])("rejects sample bounds: %s", (_label, mutate) => {
    const report = fixture();
    mutate(report);
    expect(parseSensorReport(JSON.stringify(report))).toEqual(expect.objectContaining({ ok: false }));
  });

  it("rejects empty and over-limit sample collections", () => {
    expect(parseSensorReport(JSON.stringify({ ...fixture(), samples: [] }))).toEqual(expect.objectContaining({ ok: false }));
    const sample = fixture().samples[0];
    const samples = Array.from({ length: 10_001 }, (_, index) => ({ ...sample, timestamp: index, sourceLine: index + 1 }));
    expect(parseSensorReport(JSON.stringify({ ...fixture(), samples }))).toEqual(expect.objectContaining({ ok: false }));
  });

  it("requires strictly increasing timestamps and source lines", () => {
    const duplicateTimestamp = fixture();
    duplicateTimestamp.samples[1].timestamp = duplicateTimestamp.samples[0].timestamp;
    expect(parseSensorReport(JSON.stringify(duplicateTimestamp))).toEqual(expect.objectContaining({ ok: false }));

    const decreasingTimestamp = fixture();
    decreasingTimestamp.samples[1].timestamp = 9;
    expect(parseSensorReport(JSON.stringify(decreasingTimestamp))).toEqual(expect.objectContaining({ ok: false }));

    const duplicateLine = fixture();
    duplicateLine.samples[1].sourceLine = duplicateLine.samples[0].sourceLine;
    expect(parseSensorReport(JSON.stringify(duplicateLine))).toEqual(expect.objectContaining({ ok: false }));

    const decreasingLine = fixture();
    decreasingLine.samples[1].sourceLine = 19;
    expect(parseSensorReport(JSON.stringify(decreasingLine))).toEqual(expect.objectContaining({ ok: false }));
  });

  it("rejects invalid original segment metadata and dates", () => {
    expect(parseSensorReport(JSON.stringify({ ...fixture(), selectedSegment: { ...fixture().selectedSegment, index: 6 } }))).toEqual(expect.objectContaining({ ok: false }));
    expect(parseSensorReport(JSON.stringify({ ...fixture(), selectedSegment: { ...fixture().selectedSegment, count: 0 } }))).toEqual(expect.objectContaining({ ok: false }));
    expect(parseSensorReport(JSON.stringify({ ...fixture(), importedAt: "yesterday" }))).toEqual(expect.objectContaining({ ok: false }));
    expect(parseSensorReport(JSON.stringify({ ...fixture(), reportCreatedAt: "2026-13-99T00:00:00Z" }))).toEqual(expect.objectContaining({ ok: false }));
  });

  it("rejects reports above the 16 MiB UTF-8 limit without echoing input", () => {
    const marker = "private-value-that-must-not-appear";
    const result = parseSensorReport(`${marker}${"x".repeat(MAX_SENSOR_REPORT_BYTES)}`);
    expect(result).toEqual(expect.objectContaining({ ok: false, error: expect.stringMatching(/16 MiB/i) }));
    if (!result.ok) expect(result.error).not.toContain(marker);
  });
});


describe("large existing report compatibility", () => {
  it("retains notes above eight MiB and long diagnostic lines within the total limit", () => {
    const report = fixture();
    report.notes = "n".repeat(8 * 1024 * 1024 + 1);
    report.parseIssues[0].source = "#" + "x".repeat(1_500_000);
    expect(accepted(report)).toEqual(report);
  });
});
