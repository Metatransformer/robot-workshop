import { describe, expect, it } from "vitest";
import {
  MAX_SENSOR_LOG_DATA_ROWS,
  parseSensorLog,
  summarizeSensorSegment,
  type SensorLogParseSuccess,
  type SensorSample,
} from "@/lib/sensor-log";

function parsed(text: string): SensorLogParseSuccess {
  const result = parseSensorLog(text);
  if (!result.ok) throw new Error(result.error);
  return result;
}

describe("sensor serial log parsing", () => {
  it("parses the original firmware serial shape and preserves diagnostic lines", () => {
    const result = parsed([
      "# BME280 ready at 0x77",
      "timestamp,temp_c,humidity_pct,pressure_hpa,led",
      "0.00,26.25,44.10,831.42,0",
      "1.00,2.80e1,44.00,831.38,1",
    ].join("\n"));

    expect(result.totalValidRows).toBe(2);
    expect(result.segments).toHaveLength(1);
    expect(result.segments[0]).toMatchObject({ id: "segment-1", index: 1 });
    expect(result.segments[0].samples).toEqual([
      { timestamp: 0, tempC: 26.25, humidityPct: 44.1, pressureHpa: 831.42, led: 0, sourceLine: 3 },
      { timestamp: 1, tempC: 28, humidityPct: 44, pressureHpa: 831.38, led: 1, sourceLine: 4 },
    ]);
    expect(result.issues).toEqual([
      expect.objectContaining({ line: 1, kind: "diagnostic", source: "# BME280 ready at 0x77" }),
    ]);
  });

  it("accepts BOM, CRLF, trimmed header fields, blanks, and repeated headers", () => {
    const result = parsed("\uFEFF timestamp , temp_c , humidity_pct , pressure_hpa , led \r\n\r\n0,25,40,1000,0\r\ntimestamp,temp_c,humidity_pct,pressure_hpa,led\r\n1,26,41,999,0\r\n");

    expect(result.segments.map((segment) => segment.samples.length)).toEqual([1, 1]);
    expect(result.segments[1].startReason).toMatch(/repeated header/i);
    expect(result.issues).toEqual([
      expect.objectContaining({ line: 4, kind: "segment-restart" }),
    ]);
  });

  it("breaks continuity at comments, invalid rows, and non-increasing timestamps", () => {
    const result = parsed([
      "timestamp,temp_c,humidity_pct,pressure_hpa,led",
      "0,25,40,1000,0",
      "1,26,41,999,0",
      "# sensor read failed; retrying",
      "2,27,42,998,0",
      "bad,27,42,998,0",
      "3,28,43,997,1",
      "3,29,44,996,1",
      "4,28,45,995,1",
    ].join("\n"));

    expect(result.segments.map((segment) => segment.samples.map((sample) => sample.timestamp))).toEqual([
      [0, 1],
      [2],
      [3],
      [3, 4],
    ]);
    expect(result.issues.map((issue) => [issue.line, issue.kind])).toEqual([
      [4, "diagnostic"],
      [6, "invalid-row"],
      [8, "segment-restart"],
    ]);
  });

  it("keeps valid rows around rejected fields without coercing values", () => {
    const result = parsed([
      "timestamp,temp_c,humidity_pct,pressure_hpa,led",
      "0,25,40,1000,0",
      "1,,40,1000,0",
      "2,0x20,40,1000,0",
      "3,Infinity,40,1000,0",
      "4,NaN,40,1000,0",
      "5,25,101,1000,0",
      "6,25,-1,1000,0",
      "7,25,40,0,0",
      "8,25,40,1000,2",
      "9,25,40,1000,1",
    ].join("\n"));

    expect(result.totalValidRows).toBe(2);
    expect(result.segments.map((segment) => segment.samples.map((sample) => sample.timestamp))).toEqual([[0], [9]]);
    expect(result.issues.filter((issue) => issue.kind === "invalid-row")).toHaveLength(8);
  });

  it("requires a supported header and distinguishes the starter bench log", () => {
    const bench = parseSensorLog([
      "timestamp_s,temp_c,humidity_pct,pressure_hpa,led,sensor_address,observation",
      "pending,pending,pending,pending,pending,pending,pending",
    ].join("\n"));
    expect(bench).toEqual(expect.objectContaining({ ok: false, error: expect.stringMatching(/bench-log\.csv/i) }));

    expect(parseSensorLog("0,25,40,1000,0")).toEqual(expect.objectContaining({
      ok: false,
      error: expect.stringMatching(/No supported serial header/i),
    }));
    expect(parseSensorLog("timestamp,temp_c,humidity_pct,pressure_hpa,led\nnope")).toEqual(expect.objectContaining({
      ok: false,
      error: expect.stringMatching(/no valid sensor data/i),
    }));
  });

  it("allows valid data after diagnostics and an initially unrecognized header", () => {
    const result = parsed([
      "time,temp,humidity,pressure,led",
      "# booting",
      "timestamp,temp_c,humidity_pct,pressure_hpa,led",
      ".5,+2.5e1,4.0e1,1.001e3,0",
    ].join("\n"));
    expect(result.totalValidRows).toBe(1);
    expect(result.segments[0].samples[0]).toMatchObject({ timestamp: 0.5, tempC: 25, pressureHpa: 1001 });
    expect(result.issues.map((issue) => issue.line)).toEqual([1, 2]);
  });

  it("enforces the input byte and processed-row limits", () => {
    expect(parseSensorLog("x".repeat(2 * 1024 * 1024 + 1))).toEqual(expect.objectContaining({
      ok: false,
      error: expect.stringMatching(/2 MiB/i),
    }));

    const header = "timestamp,temp_c,humidity_pct,pressure_hpa,led";
    const accepted = parseSensorLog([header, ...Array.from({ length: MAX_SENSOR_LOG_DATA_ROWS }, (_, index) => `${index},25,40,1000,0`)].join("\n"));
    expect(accepted.ok && accepted.totalValidRows).toBe(MAX_SENSOR_LOG_DATA_ROWS);
    const rejected = parseSensorLog([header, ...Array.from({ length: MAX_SENSOR_LOG_DATA_ROWS + 1 }, (_, index) => `${index},25,40,1000,0`)].join("\n"));
    expect(rejected).toEqual(expect.objectContaining({ ok: false, error: expect.stringMatching(/10,000-data-row limit/i) }));
  });
});

describe("sensor segment summaries", () => {
  const sample = (timestamp: number, tempC: number, humidityPct: number, pressureHpa: number): SensorSample => ({
    timestamp,
    tempC,
    humidityPct,
    pressureHpa,
    led: 0,
    sourceLine: timestamp + 2,
  });

  it("reports zero duration and finite ranges for one sample", () => {
    expect(summarizeSensorSegment([sample(4, 26, 45, 1001)])).toEqual({
      count: 1,
      durationSeconds: 0,
      temperatureC: { min: 26, max: 26, mean: 26 },
      humidityPct: { min: 45, max: 45 },
      pressureHpa: { min: 1001, max: 1001 },
    });
  });

  it("computes duration, mean, and min/max from the selected segment", () => {
    expect(summarizeSensorSegment([
      sample(10, 25, 50, 1002),
      sample(12, 29, 44, 998),
      sample(15, 27, 47, 1000),
    ])).toEqual({
      count: 3,
      durationSeconds: 5,
      temperatureC: { min: 25, max: 29, mean: 27 },
      humidityPct: { min: 44, max: 50 },
      pressureHpa: { min: 998, max: 1002 },
    });
  });

  it("does not invent a summary for an empty segment", () => {
    expect(() => summarizeSensorSegment([])).toThrow(/empty sensor segment/i);
  });
});


it("keeps a finite mean for extreme finite input", () => {
  const result = parsed("timestamp,temp_c,humidity_pct,pressure_hpa,led\n0,1e308,40,1000,0\n1,1e308,40,1000,0");
  expect(summarizeSensorSegment(result.segments[0].samples).temperatureC.mean).toBe(1e308);
});
