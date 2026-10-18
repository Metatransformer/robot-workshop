export const SENSOR_LOG_HEADER = "timestamp,temp_c,humidity_pct,pressure_hpa,led";
export const MAX_SENSOR_LOG_BYTES = 2 * 1024 * 1024;
export const MAX_SENSOR_LOG_DATA_ROWS = 10_000;

export type SensorLedState = 0 | 1;

export type SensorSample = {
  timestamp: number;
  tempC: number;
  humidityPct: number;
  pressureHpa: number;
  led: SensorLedState;
  sourceLine: number;
};

export type SensorLogIssueKind =
  | "diagnostic"
  | "invalid-row"
  | "unsupported-header"
  | "segment-restart";

export type SensorLogIssue = {
  line: number;
  kind: SensorLogIssueKind;
  message: string;
  source: string;
};

export type SensorSegment = {
  id: string;
  index: number;
  startReason: string;
  samples: SensorSample[];
};

export type SensorRange = {
  min: number;
  max: number;
};

export type SensorTemperatureSummary = SensorRange & {
  mean: number;
};

export type SensorSegmentSummary = {
  count: number;
  durationSeconds: number;
  temperatureC: SensorTemperatureSummary;
  humidityPct: SensorRange;
  pressureHpa: SensorRange;
};

export type SensorLogParseSuccess = {
  ok: true;
  segments: SensorSegment[];
  issues: SensorLogIssue[];
  totalValidRows: number;
};

export type SensorLogParseFailure = {
  ok: false;
  error: string;
};

export type SensorLogParseResult = SensorLogParseSuccess | SensorLogParseFailure;

const DECIMAL_NUMBER = /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
const BENCH_LOG_PREFIX = "timestamp_s,temp_c,humidity_pct,pressure_hpa,led,sensor_address,observation";

function textByteLength(text: string): number {
  if (text.length > MAX_SENSOR_LOG_BYTES) return text.length;
  return new TextEncoder().encode(text).byteLength;
}

function normalizedFields(line: string): string[] {
  return line.split(",").map((field) => field.trim());
}

function isSupportedHeader(line: string): boolean {
  return normalizedFields(line).join(",") === SENSOR_LOG_HEADER;
}

function parseDecimal(field: string): number | null {
  if (!DECIMAL_NUMBER.test(field)) return null;
  const value = Number(field);
  return Number.isFinite(value) ? value : null;
}

function rowError(fields: string[]): string | null {
  if (fields.length !== 5) return `Expected 5 fields, received ${fields.length}.`;
  if (fields.some((field) => field.length === 0)) return "Empty fields are not valid readings.";
  if (fields.some((field) => !DECIMAL_NUMBER.test(field))) {
    return "Every field must be an unquoted finite decimal or scientific-notation number.";
  }
  const values = fields.map(Number);
  if (values.some((value) => !Number.isFinite(value))) return "Every field must be finite.";
  if (values[0] < 0) return "Timestamp must be zero or greater.";
  if (values[2] < 0 || values[2] > 100) return "Humidity must be between 0 and 100 percent.";
  if (values[3] <= 0) return "Pressure must be greater than zero hPa.";
  if (values[4] !== 0 && values[4] !== 1) return "LED must be exactly 0 or 1.";
  return null;
}

function makeSample(fields: string[], sourceLine: number): SensorSample {
  const timestamp = parseDecimal(fields[0]);
  const tempC = parseDecimal(fields[1]);
  const humidityPct = parseDecimal(fields[2]);
  const pressureHpa = parseDecimal(fields[3]);
  const led = parseDecimal(fields[4]);
  // rowError has already established these values and the LED union.
  return {
    timestamp: timestamp as number,
    tempC: tempC as number,
    humidityPct: humidityPct as number,
    pressureHpa: pressureHpa as number,
    led: led as SensorLedState,
    sourceLine,
  };
}

export function parseSensorLog(text: string): SensorLogParseResult {
  if (textByteLength(text) > MAX_SENSOR_LOG_BYTES) {
    return { ok: false, error: "Serial CSV must be 2 MiB or smaller." };
  }

  const lines = text.split("\n");
  const segments: SensorSegment[] = [];
  const issues: SensorLogIssue[] = [];
  let headerSeen = false;
  let benchLogHeaderSeen = false;
  let dataRowsProcessed = 0;
  let currentSamples: SensorSample[] = [];
  let nextStartReason = "Capture began after the supported serial header.";

  const finishSegment = () => {
    if (currentSamples.length === 0) return;
    const index = segments.length + 1;
    segments.push({
      id: `segment-${index}`,
      index,
      startReason: nextStartReason,
      samples: currentSamples,
    });
    currentSamples = [];
  };

  for (let offset = 0; offset < lines.length; offset += 1) {
    const lineNumber = offset + 1;
    const source = (offset === 0 ? lines[offset].replace(/^\uFEFF/, "") : lines[offset]).replace(/\r$/, "");
    const trimmed = source.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("#")) {
      const interrupted = currentSamples.length > 0;
      if (interrupted) finishSegment();
      issues.push({
        line: lineNumber,
        kind: "diagnostic",
        message: interrupted
          ? "Firmware diagnostic interrupted the recording segment."
          : "Firmware diagnostic preserved from the capture.",
        source,
      });
      nextStartReason = `Recording resumed after diagnostic on source line ${lineNumber}.`;
      continue;
    }

    if (isSupportedHeader(trimmed)) {
      if (headerSeen) {
        finishSegment();
        issues.push({
          line: lineNumber,
          kind: "segment-restart",
          message: "Repeated serial header started a new recording segment.",
          source,
        });
        nextStartReason = `Recording restarted after a repeated header on source line ${lineNumber}.`;
      }
      headerSeen = true;
      continue;
    }

    const normalized = normalizedFields(trimmed).join(",");
    if (normalized === BENCH_LOG_PREFIX) {
      benchLogHeaderSeen = true;
      if (currentSamples.length > 0) finishSegment();
      issues.push({
        line: lineNumber,
        kind: "unsupported-header",
        message: "This is the notes/bench-log.csv header, not the firmware serial-capture header.",
        source,
      });
      nextStartReason = `Recording resumed after an unsupported header on source line ${lineNumber}.`;
      continue;
    }

    dataRowsProcessed += 1;
    if (dataRowsProcessed > MAX_SENSOR_LOG_DATA_ROWS) {
      return { ok: false, error: `Serial CSV exceeds the ${MAX_SENSOR_LOG_DATA_ROWS.toLocaleString("en-US")}-data-row limit.` };
    }

    if (!headerSeen) {
      issues.push({
        line: lineNumber,
        kind: "invalid-row",
        message: "Skipped because the supported serial header has not appeared yet.",
        source,
      });
      continue;
    }

    const fields = normalizedFields(source);
    const error = rowError(fields);
    if (error) {
      if (currentSamples.length > 0) finishSegment();
      issues.push({ line: lineNumber, kind: "invalid-row", message: error, source });
      nextStartReason = `Recording resumed after a rejected row on source line ${lineNumber}.`;
      continue;
    }

    const sample = makeSample(fields, lineNumber);
    const previous = currentSamples.at(-1);
    if (previous && sample.timestamp <= previous.timestamp) {
      finishSegment();
      issues.push({
        line: lineNumber,
        kind: "segment-restart",
        message: `Timestamp ${sample.timestamp} s was not greater than the previous ${previous.timestamp} s; a new segment was started.`,
        source,
      });
      nextStartReason = `Timestamp restart or non-increasing value on source line ${lineNumber}.`;
    }
    currentSamples.push(sample);
  }

  finishSegment();
  const totalValidRows = segments.reduce((total, segment) => total + segment.samples.length, 0);
  if (totalValidRows === 0) {
    if (!headerSeen && benchLogHeaderSeen) {
      return {
        ok: false,
        error: `The imported file uses the notes/bench-log.csv columns. Paste the firmware serial capture beginning with ${SENSOR_LOG_HEADER}.`,
      };
    }
    if (!headerSeen) {
      return { ok: false, error: `No supported serial header was found. Expected ${SENSOR_LOG_HEADER}.` };
    }
    return { ok: false, error: "The supported header was found, but there were no valid sensor data rows." };
  }

  return { ok: true, segments, issues, totalValidRows };
}

function range(values: readonly number[]): SensorRange {
  return { min: Math.min(...values), max: Math.max(...values) };
}

export function summarizeSensorSegment(samples: readonly SensorSample[]): SensorSegmentSummary {
  if (samples.length === 0) throw new Error("Cannot summarize an empty sensor segment.");
  const temperatures = samples.map((sample) => sample.tempC);
  const humidities = samples.map((sample) => sample.humidityPct);
  const pressures = samples.map((sample) => sample.pressureHpa);
  const first = samples[0];
  const last = samples[samples.length - 1];
  return {
    count: samples.length,
    durationSeconds: last.timestamp - first.timestamp,
    temperatureC: {
      ...range(temperatures),
      mean: temperatures.reduce((total, value) => total + value / temperatures.length, 0),
    },
    humidityPct: range(humidities),
    pressureHpa: range(pressures),
  };
}

export const computeSegmentSummary = summarizeSensorSegment;
