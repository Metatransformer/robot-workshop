import { z } from "zod";

export type LedMeasurementDraft = {
  resistanceOhm: string;
  voltageV: string;
  observedAt: string;
  partIdentity: string;
  meter: string;
  notes: string;
  command: "unknown" | "on" | "off";
  light: "unknown" | "on" | "off" | "flickering";
};

const LedMeasurementDraftSchema = z.object({
  resistanceOhm: z.string().max(100),
  voltageV: z.string().max(100),
  observedAt: z.string().max(200),
  partIdentity: z.string().max(500),
  meter: z.string().max(500),
  notes: z.string().max(5_000),
  command: z.enum(["unknown", "on", "off"]),
  light: z.enum(["unknown", "on", "off", "flickering"]),
}).strict();

export const EMPTY_LED_DRAFT: LedMeasurementDraft = {
  resistanceOhm: "",
  voltageV: "",
  observedAt: "",
  partIdentity: "",
  meter: "",
  notes: "",
  command: "unknown",
  light: "unknown",
};

export function parseLedDraft(value: unknown): LedMeasurementDraft | null {
  const result = LedMeasurementDraftSchema.safeParse(value);
  return result.success ? result.data : null;
}

export type LedMeasurementEvaluation =
  | { ok: false; errors: string[] }
  | {
      ok: true;
      resistanceOhm: number;
      voltageV: number;
      currentMa: number;
      powerMw: number;
      warnings: string[];
    };

const DECIMAL_NUMBER = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;

type ParsedNumber =
  | { ok: true; value: number }
  | { ok: false; error: string };

function hasNonzeroSignificand(value: string): boolean {
  return /[1-9]/.test(value.split(/[eE]/, 1)[0]);
}

function parseMeasurementNumber(
  input: string,
  label: "Resistance" | "Voltage",
): ParsedNumber {
  const normalized = input.trim();
  if (!DECIMAL_NUMBER.test(normalized)) {
    return { ok: false, error: `${label} must be a decimal or scientific-notation number.` };
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return { ok: false, error: `${label} must be finite.` };
  }
  if (value === 0 && hasNonzeroSignificand(normalized)) {
    return { ok: false, error: `${label} is too small to represent without underflow.` };
  }

  return { ok: true, value };
}

function finiteNonzeroCandidate(candidates: number[]): number | null {
  return candidates.find((candidate) => Number.isFinite(candidate) && candidate !== 0) ?? null;
}

export function evaluateLedMeasurement(draft: LedMeasurementDraft): LedMeasurementEvaluation {
  const parsedDraft = LedMeasurementDraftSchema.safeParse(draft);
  if (!parsedDraft.success) {
    return { ok: false, errors: ["Measurement draft has an invalid shape or field value."] };
  }

  const resistance = parseMeasurementNumber(parsedDraft.data.resistanceOhm, "Resistance");
  const voltage = parseMeasurementNumber(parsedDraft.data.voltageV, "Voltage");
  const errors: string[] = [];

  if (!resistance.ok) errors.push(resistance.error);
  if (!voltage.ok) errors.push(voltage.error);
  if (resistance.ok && resistance.value <= 0) {
    errors.push("Resistance must be greater than zero.");
  }
  if (errors.length > 0 || !resistance.ok || !voltage.ok) {
    return { ok: false, errors };
  }

  const resistanceOhm = resistance.value;
  const voltageV = voltage.value;
  const currentCandidates = [
    (voltageV / resistanceOhm) * 1_000,
    (voltageV * 1_000) / resistanceOhm,
  ];

  let currentMa: number;
  if (voltageV === 0) {
    currentMa = voltageV;
  } else {
    const candidate = finiteNonzeroCandidate(currentCandidates);
    if (candidate === null) {
      const hasFiniteZero = currentCandidates.some((value) => Number.isFinite(value) && value === 0);
      return {
        ok: false,
        errors: [hasFiniteZero
          ? "Calculated current underflowed to zero."
          : "Calculated current is outside the finite numeric range."],
      };
    }
    currentMa = candidate;
  }

  const powerCandidates = [
    ((voltageV / resistanceOhm) * voltageV) * 1_000,
    ((voltageV / resistanceOhm) * 1_000) * voltageV,
    ((voltageV * 1_000) / resistanceOhm) * voltageV,
    ((voltageV * voltageV) / resistanceOhm) * 1_000,
    ((voltageV * voltageV) * 1_000) / resistanceOhm,
  ];

  let powerMw: number;
  if (voltageV === 0) {
    powerMw = 0;
  } else {
    const candidate = finiteNonzeroCandidate(powerCandidates);
    if (candidate === null) {
      const hasFiniteZero = powerCandidates.some((value) => Number.isFinite(value) && value === 0);
      return {
        ok: false,
        errors: [hasFiniteZero
          ? "Calculated power underflowed to zero."
          : "Calculated power is outside the finite numeric range."],
      };
    }
    powerMw = candidate;
  }

  const warnings: string[] = [];
  if (resistanceOhm < 950 || resistanceOhm > 1_050) {
    warnings.push("Resistance is outside the nominal 950–1050 Ω range.");
  }
  if (voltageV < 0) {
    warnings.push("Voltage is negative; check probe orientation.");
  }
  if (Math.abs(voltageV) > 3.3) {
    warnings.push("Voltage magnitude is above the nominal 3.3 V Pico GPIO route; compare probes and power connections.");
  }
  const { command, light } = parsedDraft.data;
  if (light === "flickering") {
    warnings.push("Flickering suggests changing voltage. A DC meter may average it; V²/R from that reading does not establish average resistor heating power.");
  }
  if (
    (command === "on" && light !== "unknown" && light !== "on")
    || (command === "off" && light !== "unknown" && light !== "off")
  ) {
    warnings.push("Known command and observed light states disagree.");
  }

  return {
    ok: true,
    resistanceOhm,
    voltageV,
    currentMa,
    powerMw,
    warnings,
  };
}

export function makeLedMeasurementRecord(draft: LedMeasurementDraft, exportedAt: string) {
  const result = evaluateLedMeasurement(draft);
  if (!result.ok) {
    throw new Error(`Invalid LED measurement: ${result.errors.join(" ")}`);
  }

  return {
    format: "metatransformer-led-measurement" as const,
    version: 1 as const,
    exportedAt,
    provenance: "user-entered-unverified" as const,
    input: { ...draft },
    derived: {
      resistanceOhm: result.resistanceOhm,
      voltageV: result.voltageV,
      currentMa: result.currentMa,
      powerMw: result.powerMw,
    },
    warnings: [...result.warnings],
    nominal: {
      outputV: 3.3,
      forwardV: 2,
      resistanceOhm: 1_000,
      currentMa: 1.3,
      powerMw: 1.69,
    },
    limitations: [
      "Current is inferred from the resistor voltage using V/R, not measured directly.",
      "Power is conditional on steady DC across an ohmic resistor. Squaring an averaged voltage does not establish average heating power for pulses or flicker.",
      "The nominal LED forward voltage is not guaranteed for the installed part or operating conditions.",
      "User-entered input has not been independently verified and meter calibration has not been confirmed.",
      "This model applies only to the USB-powered original Raspberry Pi Pico, LED 297, and 1 kΩ resistor 4294 route.",
    ],
  };
}
