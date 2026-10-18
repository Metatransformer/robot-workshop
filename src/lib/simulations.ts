export type SimulationSuccess<T> = { ok: true; value: T };
export type SimulationFailure = { ok: false; errors: string[] };
export type SimulationResult<T> = SimulationSuccess<T> | SimulationFailure;

function finite(value: number, label: string, errors: string[]) {
  if (!Number.isFinite(value)) errors.push(`${label} must be a finite number.`);
}

function inRange(
  value: number,
  label: string,
  minimum: number,
  maximum: number,
  errors: string[],
  includeMinimum = true,
) {
  finite(value, label, errors);
  if (!Number.isFinite(value)) return;
  if ((includeMinimum ? value < minimum : value <= minimum) || value > maximum) {
    errors.push(`${label} must be ${includeMinimum ? "between" : "greater than"} ${minimum}${includeMinimum ? ` and ${maximum}` : ` and no more than ${maximum}`}.`);
  }
}

export type RcChargingInput = {
  resistanceOhms: number;
  capacitanceMicrofarads: number;
  supplyVoltageV: number;
  initialVoltageV: number;
  durationMs: number;
};

export type RcPoint = { timeMs: number; voltageV: number; energyJ: number };

export type RcChargingOutput = {
  tauSeconds: number;
  points: RcPoint[];
  finalVoltageV: number;
  finalEnergyJ: number;
  oneTauVoltageV: number;
  threeTauVoltageV: number;
  fractionOfStepAtOneTau: number;
  fractionOfStepAtThreeTau: number;
};

export function simulateRcCharging(input: RcChargingInput): SimulationResult<RcChargingOutput> {
  const errors: string[] = [];
  inRange(input.resistanceOhms, "Resistance", 0, Number.MAX_VALUE, errors, false);
  inRange(input.capacitanceMicrofarads, "Capacitance", 0, Number.MAX_VALUE, errors, false);
  inRange(input.supplyVoltageV, "Supply voltage", 0, 24, errors);
  inRange(input.initialVoltageV, "Initial voltage", 0, 24, errors);
  inRange(input.durationMs, "Duration", 0, 600_000, errors, false);
  if (errors.length) return { ok: false, errors };

  const capacitanceFarads = input.capacitanceMicrofarads * 1e-6;
  const tauSeconds = input.resistanceOhms * capacitanceFarads;
  if (!Number.isFinite(tauSeconds) || tauSeconds <= 0) {
    return { ok: false, errors: ["The resistance-capacitance product is outside the calculable range."] };
  }

  const voltageAtSeconds = (seconds: number) =>
    input.supplyVoltageV
    + (input.initialVoltageV - input.supplyVoltageV) * Math.exp(-seconds / tauSeconds);
  const points = Array.from({ length: 201 }, (_, index): RcPoint => {
    const timeMs = input.durationMs * index / 200;
    const voltageV = voltageAtSeconds(timeMs / 1000);
    return { timeMs, voltageV, energyJ: 0.5 * capacitanceFarads * voltageV ** 2 };
  });
  const final = points.at(-1)!;
  return {
    ok: true,
    value: {
      tauSeconds,
      points,
      finalVoltageV: final.voltageV,
      finalEnergyJ: final.energyJ,
      oneTauVoltageV: voltageAtSeconds(tauSeconds),
      threeTauVoltageV: voltageAtSeconds(3 * tauSeconds),
      fractionOfStepAtOneTau: 1 - Math.exp(-1),
      fractionOfStepAtThreeTau: 1 - Math.exp(-3),
    },
  };
}

export type DcMotorInput = {
  supplyVoltageV: number;
  noLoadRpm: number;
  stallTorqueNm: number;
  stallCurrentA: number;
  noLoadCurrentA: number;
  requestedLoadTorqueNm: number;
  gearRatio: number;
  gearEfficiency: number;
};

export type DcMotorOutput = {
  status: "running" | "stalled";
  motorTorqueDemandNm: number;
  motorRpm: number;
  outputRpm: number;
  currentA: number;
  electricalInputW: number;
  motorMechanicalW: number;
  gearOutputW: number;
  motorLossW: number;
  gearLossW: number;
  totalLossRatio: number | null;
  warnings: string[];
};

export function calculateDcMotor(input: DcMotorInput): SimulationResult<DcMotorOutput> {
  const errors: string[] = [];
  inRange(input.supplyVoltageV, "Supply voltage", 0, 24, errors, false);
  inRange(input.noLoadRpm, "No-load speed", 0, Number.MAX_VALUE, errors, false);
  inRange(input.stallTorqueNm, "Stall torque", 0, Number.MAX_VALUE, errors, false);
  inRange(input.stallCurrentA, "Stall current", 0, Number.MAX_VALUE, errors, false);
  inRange(input.noLoadCurrentA, "No-load current", 0, Number.MAX_VALUE, errors);
  inRange(input.requestedLoadTorqueNm, "Requested output torque", 0, Number.MAX_VALUE, errors);
  inRange(input.gearRatio, "Gear ratio", 1, Number.MAX_VALUE, errors);
  inRange(input.gearEfficiency, "Gear efficiency", 0, 1, errors, false);
  if (Number.isFinite(input.stallCurrentA) && Number.isFinite(input.noLoadCurrentA)
    && input.stallCurrentA <= input.noLoadCurrentA) {
    errors.push("Stall current must be greater than no-load current.");
  }
  if (errors.length) return { ok: false, errors };

  const motorTorqueDemandNm = input.requestedLoadTorqueNm / (input.gearRatio * input.gearEfficiency);
  const stalled = motorTorqueDemandNm >= input.stallTorqueNm;
  const loadFraction = stalled ? 1 : motorTorqueDemandNm / input.stallTorqueNm;
  const motorRpm = stalled ? 0 : input.noLoadRpm * (1 - loadFraction);
  const currentA = stalled
    ? input.stallCurrentA
    : input.noLoadCurrentA + (input.stallCurrentA - input.noLoadCurrentA) * loadFraction;
  const outputRpm = motorRpm / input.gearRatio;
  const electricalInputW = input.supplyVoltageV * currentA;
  const motorMechanicalW = motorTorqueDemandNm * motorRpm * 2 * Math.PI / 60;
  const gearOutputW = input.requestedLoadTorqueNm * outputRpm * 2 * Math.PI / 60;
  const motorLossW = electricalInputW - motorMechanicalW;
  const gearLossW = motorMechanicalW - gearOutputW;
  const warnings: string[] = [];
  if (stalled) warnings.push("The demanded motor-shaft torque reaches or exceeds the assumed stall torque. The stall-current estimate is not thermally sustainable.");
  if (motorMechanicalW > electricalInputW + 1e-9) warnings.push("The assumed ratings are inconsistent: calculated motor mechanical power exceeds electrical input power.");
  warnings.push("Continuous torque, winding temperature, driver limits, and thermal duty are unknown.");

  return {
    ok: true,
    value: {
      status: stalled ? "stalled" : "running",
      motorTorqueDemandNm,
      motorRpm,
      outputRpm,
      currentA,
      electricalInputW,
      motorMechanicalW,
      gearOutputW,
      motorLossW,
      gearLossW,
      totalLossRatio: electricalInputW > 0 ? (electricalInputW - gearOutputW) / electricalInputW : null,
      warnings,
    },
  };
}

export type PowerLoad = {
  name: string;
  voltage: number;
  currentA: number;
  quantity: number;
  dutyCycle: number;
  peakCurrentA: number;
};

export type PowerBudgetInput = {
  sourceVoltage: number;
  capacityAh: number;
  usableFraction: number;
  conversionEfficiency: number;
  sourceContinuousCurrentA: number;
  loads: PowerLoad[];
};

export type PowerLoadResult = PowerLoad & { averagePowerW: number; peakPowerW: number };

export type PowerBudgetOutput = {
  loads: PowerLoadResult[];
  averageLoadPowerW: number;
  peakLoadPowerW: number;
  sourceAverageCurrentA: number;
  sourcePeakCurrentA: number;
  usableWh: number;
  runtimeHours: number | null;
  averageOverload: boolean;
  peakOverload: boolean;
  warnings: string[];
};

export function calculatePowerBudget(input: PowerBudgetInput): SimulationResult<PowerBudgetOutput> {
  const errors: string[] = [];
  inRange(input.sourceVoltage, "Source voltage", 0, 60, errors, false);
  inRange(input.capacityAh, "Capacity", 0, Number.MAX_VALUE, errors);
  inRange(input.usableFraction, "Usable fraction", 0, 1, errors);
  inRange(input.conversionEfficiency, "Conversion efficiency", 0, 1, errors, false);
  inRange(input.sourceContinuousCurrentA, "Source continuous-current rating", 0, Number.MAX_VALUE, errors);
  if (!Array.isArray(input.loads) || input.loads.length > 50) {
    errors.push("Loads must be an array containing no more than 50 entries.");
  } else {
    input.loads.forEach((load, index) => {
      const prefix = `Load ${index + 1}`;
      if (typeof load.name !== "string" || !load.name.trim()) errors.push(`${prefix} needs a name.`);
      inRange(load.voltage, `${prefix} voltage`, 0, 60, errors);
      inRange(load.currentA, `${prefix} current`, 0, Number.MAX_VALUE, errors);
      inRange(load.peakCurrentA, `${prefix} peak current`, 0, Number.MAX_VALUE, errors);
      inRange(load.quantity, `${prefix} quantity`, 1, 1000, errors);
      if (Number.isFinite(load.quantity) && !Number.isInteger(load.quantity)) errors.push(`${prefix} quantity must be a whole number.`);
      inRange(load.dutyCycle, `${prefix} duty cycle`, 0, 1, errors);
      if (Number.isFinite(load.currentA) && Number.isFinite(load.peakCurrentA) && load.peakCurrentA < load.currentA) {
        errors.push(`${prefix} peak current cannot be lower than its nominal current.`);
      }
    });
  }
  if (errors.length) return { ok: false, errors };

  const loads = input.loads.map((load): PowerLoadResult => ({
    ...load,
    averagePowerW: load.voltage * load.currentA * load.quantity * load.dutyCycle,
    peakPowerW: load.voltage * load.peakCurrentA * load.quantity,
  }));
  const averageLoadPowerW = loads.reduce((total, load) => total + load.averagePowerW, 0);
  const peakLoadPowerW = loads.reduce((total, load) => total + load.peakPowerW, 0);
  const sourceAverageCurrentA = averageLoadPowerW / (input.sourceVoltage * input.conversionEfficiency);
  const sourcePeakCurrentA = peakLoadPowerW / (input.sourceVoltage * input.conversionEfficiency);
  const usableWh = input.sourceVoltage * input.capacityAh * input.usableFraction;
  const runtimeHours = averageLoadPowerW === 0
    ? null
    : usableWh / (averageLoadPowerW / input.conversionEfficiency);
  const averageOverload = sourceAverageCurrentA > input.sourceContinuousCurrentA;
  const peakOverload = sourcePeakCurrentA > input.sourceContinuousCurrentA;
  const warnings = ["Peak power assumes every load reaches peak current at the same time; it is a conservative simultaneous estimate."];
  if (averageOverload) warnings.push("Estimated average source current exceeds the entered continuous-current rating.");
  if (peakOverload) warnings.push("Estimated simultaneous peak source current exceeds the entered continuous-current rating; a separate peak rating was not provided.");
  if (runtimeHours === null) warnings.push("Runtime is not calculated for zero average load; zero load does not imply infinite real-world runtime.");

  return {
    ok: true,
    value: {
      loads,
      averageLoadPowerW,
      peakLoadPowerW,
      sourceAverageCurrentA,
      sourcePeakCurrentA,
      usableWh,
      runtimeHours,
      averageOverload,
      peakOverload,
      warnings,
    },
  };
}

export type GpioTransition = { to: string; afterMs?: number; button?: boolean };
export type GpioState = { led: boolean; transitions: GpioTransition[] };
export type GpioProgram = { initialState: string; states: Record<string, GpioState> };
export type ButtonTimelineEntry = { atMs: number; button: boolean };
export type GpioSample = { timeMs: number; state: string; button: boolean; led: boolean };
export type GpioEvent = GpioSample & { from: string; to: string; condition: string };
export type GpioSimulationOutput = { samples: GpioSample[]; events: GpioEvent[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateGpioProgram(value: unknown): SimulationResult<GpioProgram> {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ["Program must be a JSON object."] };
  if (typeof value.initialState !== "string" || !value.initialState) errors.push("initialState must be a non-empty string.");
  if (!isRecord(value.states)) return { ok: false, errors: [...errors, "states must be an object."] };
  const entries = Object.entries(value.states);
  if (entries.length === 0 || entries.length > 20) errors.push("states must contain between 1 and 20 states.");
  const stateNames = new Set(entries.map(([name]) => name));
  const states = Object.create(null) as Record<string, GpioState>;

  for (const [name, rawState] of entries) {
    if (!name) errors.push("State names cannot be empty.");
    if (!isRecord(rawState)) {
      errors.push(`State “${name}” must be an object.`);
      continue;
    }
    if (typeof rawState.led !== "boolean") errors.push(`State “${name}” must have a Boolean led value.`);
    if (!Array.isArray(rawState.transitions)) {
      errors.push(`State “${name}” must have a transitions array.`);
      continue;
    }
    if (rawState.transitions.length > 10) errors.push(`State “${name}” has more than 10 transitions.`);
    const transitions: GpioTransition[] = [];
    rawState.transitions.forEach((rawTransition, index) => {
      const label = `Transition ${index + 1} in “${name}”`;
      if (!isRecord(rawTransition)) {
        errors.push(`${label} must be an object.`);
        return;
      }
      if (typeof rawTransition.to !== "string" || !stateNames.has(rawTransition.to)) errors.push(`${label} has an unknown destination.`);
      const hasDelay = Object.hasOwn(rawTransition, "afterMs");
      const hasButton = Object.hasOwn(rawTransition, "button");
      if (Number(hasDelay) + Number(hasButton) !== 1) errors.push(`${label} must have exactly one condition: afterMs or button.`);
      if (hasDelay && (typeof rawTransition.afterMs !== "number" || !Number.isFinite(rawTransition.afterMs)
        || !Number.isInteger(rawTransition.afterMs) || rawTransition.afterMs < 1)) {
        errors.push(`${label} afterMs must be a whole number of at least 1 ms.`);
      }
      if (hasButton && typeof rawTransition.button !== "boolean") errors.push(`${label} button must be true or false.`);
      if (typeof rawTransition.to === "string") {
        transitions.push({
          to: rawTransition.to,
          ...(hasDelay ? { afterMs: rawTransition.afterMs as number } : {}),
          ...(hasButton ? { button: rawTransition.button as boolean } : {}),
        });
      }
    });
    if (typeof rawState.led === "boolean") states[name] = { led: rawState.led, transitions };
  }
  if (typeof value.initialState === "string" && !stateNames.has(value.initialState)) errors.push("initialState must name a known state.");
  return errors.length ? { ok: false, errors } : { ok: true, value: { initialState: value.initialState as string, states } };
}

export function simulateGpioStateMachine(
  programValue: unknown,
  timeline: ButtonTimelineEntry[],
  durationMs: number,
): SimulationResult<GpioSimulationOutput> {
  const validated = validateGpioProgram(programValue);
  if (!validated.ok) return validated;
  const errors: string[] = [];
  inRange(durationMs, "Duration", 0, 10_000, errors);
  if (!Number.isInteger(durationMs)) errors.push("Duration must be a whole number of milliseconds.");
  if (!Array.isArray(timeline) || timeline.length > 100) {
    errors.push("Timeline must be an array containing no more than 100 entries.");
  } else {
    timeline.forEach((entry, index) => {
      if (!isRecord(entry)) {
        errors.push(`Timeline entry ${index + 1} must be an object.`);
        return;
      }
      inRange(entry.atMs, `Timeline entry ${index + 1} time`, 0, 10_000, errors);
      if (!Number.isInteger(entry.atMs)) errors.push(`Timeline entry ${index + 1} time must be a whole millisecond.`);
      if (typeof entry.button !== "boolean") errors.push(`Timeline entry ${index + 1} button must be true or false.`);
      if (index > 0 && entry.atMs <= timeline[index - 1]!.atMs) errors.push("Timeline times must be sorted and unique.");
    });
  }
  if (errors.length) return { ok: false, errors };

  const program = validated.value;
  let stateName = program.initialState;
  let stateEnteredAt = 0;
  let button = false;
  let timelineIndex = 0;
  const samples: GpioSample[] = [];
  const events: GpioEvent[] = [];

  for (let timeMs = 0; timeMs <= durationMs; timeMs += 1) {
    while (timelineIndex < timeline.length && timeline[timelineIndex]!.atMs === timeMs) {
      button = timeline[timelineIndex]!.button;
      timelineIndex += 1;
    }
    const state = program.states[stateName]!;
    const elapsed = timeMs - stateEnteredAt;
    const transition = state.transitions.find((candidate) =>
      candidate.afterMs !== undefined ? elapsed >= candidate.afterMs : candidate.button === button,
    );
    if (transition) {
      const from = stateName;
      stateName = transition.to;
      stateEnteredAt = timeMs;
      const next = program.states[stateName]!;
      events.push({
        timeMs,
        from,
        to: stateName,
        condition: transition.afterMs !== undefined ? `after ${transition.afterMs} ms` : `button = ${String(transition.button)}`,
        state: stateName,
        button,
        led: next.led,
      });
    }
    samples.push({ timeMs, state: stateName, button, led: program.states[stateName]!.led });
  }
  return { ok: true, value: { samples, events } };
}
