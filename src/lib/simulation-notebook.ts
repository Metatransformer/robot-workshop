import {
  calculateDcMotor,
  calculatePowerBudget,
  simulateGpioStateMachine,
  simulateRcCharging,
  type ButtonTimelineEntry,
  type DcMotorInput,
  type DcMotorOutput,
  type GpioSimulationOutput,
  type PowerBudgetInput,
  type PowerBudgetOutput,
  type RcChargingInput,
  type RcChargingOutput,
  type SimulationResult,
} from "@/lib/simulations";

export const LAB_IDS = ["dc-motor", "rc-transient", "power-budget", "gpio-state-machine"] as const;
export type LabId = typeof LAB_IDS[number];
export type NotebookAssociation = "bound" | "unbound";

export type GpioParameters = {
  programText: string;
  timelineText: string;
  durationMs: number;
};

export type LabParameters = RcChargingInput | DcMotorInput | PowerBudgetInput | GpioParameters;

export type RestoredRun =
  | { labId: "rc-transient"; parameters: RcChargingInput; result: SimulationResult<RcChargingOutput>; ranAt: string }
  | { labId: "dc-motor"; parameters: DcMotorInput; result: SimulationResult<DcMotorOutput>; ranAt: string }
  | { labId: "power-budget"; parameters: PowerBudgetInput; result: SimulationResult<PowerBudgetOutput>; ranAt: string }
  | { labId: "gpio-state-machine"; parameters: GpioParameters; result: SimulationResult<GpioSimulationOutput>; ranAt: string };

export type NotebookRecord = {
  version: 1;
  labId: LabId;
  prediction: string;
  observations: string;
  association: NotebookAssociation;
  run: { parameters: LabParameters; ranAt: string } | null;
};

export type RestoredNotebook = {
  source: "versioned" | "legacy";
  prediction: string;
  observations: string;
  association: NotebookAssociation;
  run: RestoredRun | null;
};

export type NotebookParseResult =
  | { ok: true; value: RestoredNotebook }
  | { ok: false; error: string; salvagedText?: { prediction: string; observations: string } };

const MAX_PREDICTION_LENGTH = 4_000;
const MAX_OBSERVATIONS_LENGTH = 8_000;
const MAX_STORED_RECORD_LENGTH = 100_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validText(value: unknown, maximum: number): value is string {
  return typeof value === "string" && value.length <= maximum;
}

function salvageText(value: unknown) {
  if (!isRecord(value)) return undefined;
  if (!validText(value.prediction, MAX_PREDICTION_LENGTH) || !validText(value.observations, MAX_OBSERVATIONS_LENGTH)) return undefined;
  return { prediction: value.prediction, observations: value.observations };
}

function validTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 40) return false;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds)
    && milliseconds >= Date.UTC(2000, 0, 1)
    && milliseconds <= Date.now() + 5 * 60_000
    && new Date(milliseconds).toISOString() === value;
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every((key) => keys.includes(key));
}

function hasNumericFields(value: Record<string, unknown>, keys: readonly string[]) {
  return keys.every((key) => typeof value[key] === "number");
}

export function runGpioModel(parameters: GpioParameters): SimulationResult<GpioSimulationOutput> {
  if (typeof parameters.programText !== "string" || parameters.programText.length > 50_000) {
    return { ok: false, errors: ["Program JSON must be text no longer than 50,000 characters."] };
  }
  if (typeof parameters.timelineText !== "string" || parameters.timelineText.length > 25_000) {
    return { ok: false, errors: ["Timeline JSON must be text no longer than 25,000 characters."] };
  }
  try {
    const program: unknown = JSON.parse(parameters.programText);
    const timeline: unknown = JSON.parse(parameters.timelineText);
    if (!Array.isArray(timeline)) return { ok: false, errors: ["Timeline JSON must be an array."] };
    return simulateGpioStateMachine(program, timeline as ButtonTimelineEntry[], parameters.durationMs);
  } catch (error) {
    return { ok: false, errors: [`JSON syntax error: ${error instanceof Error ? error.message : "The editor content is not valid JSON."}`] };
  }
}

function recomputeRun(labId: LabId, parameters: unknown, ranAt: string): RestoredRun | null {
  if (!isRecord(parameters)) return null;
  if (labId === "rc-transient") {
    const keys = ["resistanceOhms", "capacitanceMicrofarads", "supplyVoltageV", "initialVoltageV", "durationMs"] as const;
    if (!hasExactKeys(parameters, keys) || !hasNumericFields(parameters, keys)) return null;
    const typed: RcChargingInput = {
      resistanceOhms: parameters.resistanceOhms as number,
      capacitanceMicrofarads: parameters.capacitanceMicrofarads as number,
      supplyVoltageV: parameters.supplyVoltageV as number,
      initialVoltageV: parameters.initialVoltageV as number,
      durationMs: parameters.durationMs as number,
    };
    const result = simulateRcCharging(typed);
    return result.ok ? { labId, parameters: typed, result, ranAt } : null;
  }
  if (labId === "dc-motor") {
    const keys = ["supplyVoltageV", "noLoadRpm", "stallTorqueNm", "stallCurrentA", "noLoadCurrentA", "requestedLoadTorqueNm", "gearRatio", "gearEfficiency"] as const;
    if (!hasExactKeys(parameters, keys) || !hasNumericFields(parameters, keys)) return null;
    const typed = Object.fromEntries(keys.map((key) => [key, parameters[key]])) as DcMotorInput;
    const result = calculateDcMotor(typed);
    return result.ok ? { labId, parameters: typed, result, ranAt } : null;
  }
  if (labId === "power-budget") {
    const keys = ["sourceVoltage", "capacityAh", "usableFraction", "conversionEfficiency", "sourceContinuousCurrentA", "loads"] as const;
    const numericKeys = keys.slice(0, -1);
    if (!hasExactKeys(parameters, keys) || !hasNumericFields(parameters, numericKeys) || !Array.isArray(parameters.loads)) return null;
    const loadKeys = ["name", "voltage", "currentA", "quantity", "dutyCycle", "peakCurrentA"] as const;
    if (!parameters.loads.every((load) => isRecord(load)
      && hasExactKeys(load, loadKeys)
      && typeof load.name === "string"
      && load.name.length <= 200
      && hasNumericFields(load, loadKeys.slice(1)))) return null;
    const typed = parameters as PowerBudgetInput;
    const result = calculatePowerBudget(typed);
    return result.ok ? { labId, parameters: typed, result, ranAt } : null;
  }
  const keys = ["programText", "timelineText", "durationMs"] as const;
  if (!hasExactKeys(parameters, keys)
    || typeof parameters.programText !== "string"
    || typeof parameters.timelineText !== "string"
    || typeof parameters.durationMs !== "number") return null;
  const typed = parameters as GpioParameters;
  const result = runGpioModel(typed);
  return result.ok ? { labId, parameters: typed, result, ranAt } : null;
}

export function parseNotebookStorage(raw: string, expectedLabId: LabId): NotebookParseResult {
  if (raw.length > MAX_STORED_RECORD_LENGTH) return { ok: false, error: "Saved notebook data is too large to restore safely." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Saved notebook data is not valid JSON." };
  }

  const salvagedText = salvageText(parsed);
  if (!isRecord(parsed)) return { ok: false, error: "Saved notebook data is not an object." };

  if (!("version" in parsed)) {
    if (!salvagedText) return { ok: false, error: "Legacy notebook text is outside the supported bounds." };
    return {
      ok: true,
      value: { source: "legacy", ...salvagedText, association: "unbound", run: null },
    };
  }

  const invalid = (error: string): NotebookParseResult => ({ ok: false, error, ...(salvagedText ? { salvagedText } : {}) });
  if (parsed.version !== 1) return invalid("Saved notebook version is not supported.");
  if (!LAB_IDS.includes(parsed.labId as LabId) || parsed.labId !== expectedLabId) return invalid("Saved notebook has an unknown or mismatched lab.");
  if (!salvagedText) return invalid("Saved notebook text is outside the supported bounds.");
  if (parsed.association !== "bound" && parsed.association !== "unbound") return invalid("Saved notebook association is invalid.");
  if (parsed.run === null) {
    if (parsed.association === "bound") return invalid("Saved notes cannot be bound without a successful run.");
    return { ok: true, value: { source: "versioned", ...salvagedText, association: "unbound", run: null } };
  }
  if (!isRecord(parsed.run) || !validTimestamp(parsed.run.ranAt)) return invalid("Saved run metadata is invalid.");
  const run = recomputeRun(expectedLabId, parsed.run.parameters, parsed.run.ranAt);
  if (!run) return invalid("Saved run parameters do not pass this lab's current model validation.");
  return {
    ok: true,
    value: { source: "versioned", ...salvagedText, association: parsed.association, run },
  };
}

export function createNotebookRecord(
  labId: LabId,
  prediction: string,
  observations: string,
  association: NotebookAssociation,
  run: { parameters: LabParameters; ranAt: string } | null,
): NotebookRecord {
  if (!validText(prediction, MAX_PREDICTION_LENGTH) || !validText(observations, MAX_OBSERVATIONS_LENGTH)) {
    throw new Error("Notebook text is outside the supported bounds.");
  }
  if (run && (!validTimestamp(run.ranAt) || !recomputeRun(labId, run.parameters, run.ranAt))) {
    throw new Error("Notebook run is not a valid successful model run.");
  }
  return {
    version: 1,
    labId,
    prediction,
    observations,
    association: run ? association : "unbound",
    run: run ? { parameters: structuredClone(run.parameters), ranAt: run.ranAt } : null,
  };
}

export function parametersEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function associationAfterSuccessfulRun(
  current: NotebookAssociation,
  observations: string,
  previousParameters: LabParameters | null,
  nextParameters: LabParameters,
): NotebookAssociation {
  if (!observations.trim()) return "bound";
  if (current === "bound" && previousParameters !== null && parametersEqual(previousParameters, nextParameters)) return "bound";
  return "unbound";
}
