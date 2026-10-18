import { z } from "zod";
import {
  MAX_SENSOR_LOG_DATA_ROWS,
  summarizeSensorSegment,
  type SensorSegmentSummary,
} from "./sensor-log";

export const MAX_SENSOR_REPORT_BYTES = 16 * 1024 * 1024;

export const SENSOR_REPORT_UNITS = {
  timestamp: "seconds since firmware startup",
  temperature: "degrees Celsius",
  humidity: "percent relative humidity",
  pressure: "hectopascals",
  led: "logged output state, 0 or 1",
} as const;

export const SENSOR_REPORT_HARDWARE_VALIDATION = "Hardware validation: not established by this import";

const MAX_ID_LENGTH = 256;
const MAX_SOURCE_LENGTH = 4_096;
const MAX_REASON_LENGTH = 65_536;
const MAX_NOTES_LENGTH = MAX_SENSOR_REPORT_BYTES;
const MAX_ISSUE_TEXT_LENGTH = 2 * 1024 * 1024;

const finiteNumber = z.number().refine(Number.isFinite);
const positiveSafeInteger = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const isoDate = z.iso.datetime({ offset: true });

const SensorSampleSchema = z.object({
  timestamp: finiteNumber.nonnegative(),
  tempC: finiteNumber,
  humidityPct: finiteNumber.min(0).max(100),
  pressureHpa: finiteNumber.positive(),
  led: z.union([z.literal(0), z.literal(1)]),
  sourceLine: positiveSafeInteger,
}).strict();

const RangeSchema = z.object({
  min: finiteNumber,
  max: finiteNumber,
}).strict();

const SummarySchema = z.object({
  count: z.number().int().positive().max(MAX_SENSOR_LOG_DATA_ROWS),
  durationSeconds: finiteNumber.nonnegative(),
  temperatureC: RangeSchema.extend({ mean: finiteNumber }).strict(),
  humidityPct: RangeSchema,
  pressureHpa: RangeSchema,
}).strict();

const SelectedSegmentSchema = z.object({
  id: z.string().min(1).max(MAX_ID_LENGTH),
  index: z.number().int().positive().max(MAX_SENSOR_LOG_DATA_ROWS),
  count: z.number().int().positive().max(MAX_SENSOR_LOG_DATA_ROWS),
  startReason: z.string().min(1).max(MAX_REASON_LENGTH),
}).strict().superRefine((segment, context) => {
  if (segment.index > segment.count) {
    context.addIssue({
      code: "custom",
      path: ["index"],
      message: "Selected segment index cannot exceed the original segment count.",
    });
  }
});

const ParseIssueSchema = z.object({
  line: positiveSafeInteger,
  kind: z.enum(["diagnostic", "invalid-row", "unsupported-header", "segment-restart"]),
  message: z.string().min(1).max(MAX_ISSUE_TEXT_LENGTH),
  source: z.string().max(MAX_ISSUE_TEXT_LENGTH),
}).strict();

const SensorReportSchema = z.object({
  version: z.literal(1),
  origin: z.enum(["synthetic", "user-supplied-unverified"]),
  source: z.string().min(1).max(MAX_SOURCE_LENGTH),
  importedAt: isoDate,
  reportCreatedAt: isoDate,
  selectedSegment: SelectedSegmentSchema,
  samples: z.array(SensorSampleSchema).min(1).max(MAX_SENSOR_LOG_DATA_ROWS),
  summary: SummarySchema,
  notes: z.string().max(MAX_NOTES_LENGTH),
  parseIssues: z.array(ParseIssueSchema),
  units: z.object({
    timestamp: z.literal(SENSOR_REPORT_UNITS.timestamp),
    temperature: z.literal(SENSOR_REPORT_UNITS.temperature),
    humidity: z.literal(SENSOR_REPORT_UNITS.humidity),
    pressure: z.literal(SENSOR_REPORT_UNITS.pressure),
    led: z.literal(SENSOR_REPORT_UNITS.led),
  }).strict(),
  hardwareValidation: z.literal(SENSOR_REPORT_HARDWARE_VALIDATION),
}).strict().superRefine((report, context) => {
  for (let index = 1; index < report.samples.length; index += 1) {
    const previous = report.samples[index - 1];
    const sample = report.samples[index];
    if (sample.timestamp <= previous.timestamp) {
      context.addIssue({
        code: "custom",
        path: ["samples", index, "timestamp"],
        message: "Sample timestamps must be strictly increasing.",
      });
    }
    if (sample.sourceLine <= previous.sourceLine) {
      context.addIssue({
        code: "custom",
        path: ["samples", index, "sourceLine"],
        message: "Sample source lines must be strictly increasing.",
      });
    }
  }
});

type ParsedSensorReport = z.infer<typeof SensorReportSchema>;

export type SensorReport = Omit<ParsedSensorReport, "summary"> & {
  summary: SensorSegmentSummary;
};

export type SensorReportParseResult =
  | { ok: true; report: SensorReport }
  | { ok: false; error: string };

function textByteLength(text: string): number {
  if (text.length > MAX_SENSOR_REPORT_BYTES) return text.length;
  return new TextEncoder().encode(text).byteLength;
}

export function parseSensorReport(text: string): SensorReportParseResult {
  if (textByteLength(text) > MAX_SENSOR_REPORT_BYTES) {
    return { ok: false, error: "Observation report must be 16 MiB or smaller." };
  }

  let input: unknown;
  try {
    input = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: "Observation report is not valid JSON. Choose an exported version 1 report." };
  }

  if (typeof input === "object" && input !== null && "version" in input && input.version !== 1) {
    return { ok: false, error: "Unsupported observation report version. This notebook can restore version 1 reports." };
  }

  const parsed = SensorReportSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Observation report is incomplete or contains invalid fields. Choose an unmodified complete version 1 report.",
    };
  }

  return {
    ok: true,
    report: {
      ...parsed.data,
      summary: summarizeSensorSegment(parsed.data.samples),
    },
  };
}
