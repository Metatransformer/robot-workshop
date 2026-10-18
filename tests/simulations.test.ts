import { describe, expect, it } from "vitest";
import {
  calculateDcMotor,
  calculatePowerBudget,
  simulateGpioStateMachine,
  simulateRcCharging,
  validateGpioProgram,
  type DcMotorInput,
  type GpioProgram,
  type PowerBudgetInput,
} from "@/lib/simulations";

function valueOf<T>(result: { ok: true; value: T } | { ok: false; errors: string[] }): T {
  if (!result.ok) throw new Error(result.errors.join(" "));
  return result.value;
}

describe("RC charging model", () => {
  it("uses seconds for tau, returns 201 points, and reaches the exact one-tau reference", () => {
    const result = valueOf(simulateRcCharging({
      resistanceOhms: 1_000,
      capacitanceMicrofarads: 100,
      supplyVoltageV: 5,
      initialVoltageV: 0,
      durationMs: 100,
    }));

    expect(result.tauSeconds).toBeCloseTo(0.1, 12);
    expect(result.points).toHaveLength(201);
    expect(result.points[0]).toMatchObject({ timeMs: 0, voltageV: 0, energyJ: 0 });
    expect(result.finalVoltageV).toBeCloseTo(5 * (1 - Math.exp(-1)), 12);
    expect(result.fractionOfStepAtOneTau).toBeCloseTo(0.6321205588, 9);
    expect(result.fractionOfStepAtThreeTau).toBeCloseTo(0.9502129316, 9);
  });

  it("converts microfarads to farads when reporting joules", () => {
    const result = valueOf(simulateRcCharging({
      resistanceOhms: 1,
      capacitanceMicrofarads: 1_000_000,
      supplyVoltageV: 2,
      initialVoltageV: 2,
      durationMs: 1,
    }));
    expect(result.finalEnergyJ).toBeCloseTo(2, 12);
  });

  it("rejects non-finite and out-of-bound inputs before calculation", () => {
    expect(simulateRcCharging({ resistanceOhms: 0, capacitanceMicrofarads: 10, supplyVoltageV: 5, initialVoltageV: 0, durationMs: 1 }).ok).toBe(false);
    expect(simulateRcCharging({ resistanceOhms: 10, capacitanceMicrofarads: 10, supplyVoltageV: Number.NaN, initialVoltageV: 0, durationMs: 1 }).ok).toBe(false);
    expect(simulateRcCharging({ resistanceOhms: 10, capacitanceMicrofarads: 10, supplyVoltageV: 5, initialVoltageV: 0, durationMs: 600_001 }).ok).toBe(false);
  });
});

describe("DC motor steady-state model", () => {
  const base: DcMotorInput = {
    supplyVoltageV: 12,
    noLoadRpm: 1_000,
    stallTorqueNm: 1,
    stallCurrentA: 5,
    noLoadCurrentA: 1,
    requestedLoadTorqueNm: 0,
    gearRatio: 2,
    gearEfficiency: 1,
  };

  it("keeps no-load speed/current and applies gear ratio", () => {
    const result = valueOf(calculateDcMotor(base));
    expect(result.status).toBe("running");
    expect(result.motorRpm).toBeCloseTo(1_000);
    expect(result.outputRpm).toBeCloseTo(500);
    expect(result.currentA).toBeCloseTo(1);
    expect(result.gearOutputW).toBe(0);
  });

  it("interpolates a nominal load and separates gearbox loss", () => {
    const result = valueOf(calculateDcMotor({ ...base, requestedLoadTorqueNm: 0.8, gearEfficiency: 0.8 }));
    expect(result.motorTorqueDemandNm).toBeCloseTo(0.5);
    expect(result.motorRpm).toBeCloseTo(500);
    expect(result.outputRpm).toBeCloseTo(250);
    expect(result.currentA).toBeCloseTo(3);
    expect(result.motorMechanicalW).toBeCloseTo(0.5 * 500 * 2 * Math.PI / 60);
    expect(result.gearOutputW).toBeCloseTo(0.8 * 250 * 2 * Math.PI / 60);
    expect(result.gearLossW).toBeCloseTo(result.motorMechanicalW - result.gearOutputW);
  });

  it("reports stall with zero rpm and the stall-current estimate", () => {
    const result = valueOf(calculateDcMotor({ ...base, requestedLoadTorqueNm: 2 }));
    expect(result.status).toBe("stalled");
    expect(result.motorRpm).toBe(0);
    expect(result.outputRpm).toBe(0);
    expect(result.currentA).toBe(5);
    expect(result.warnings.join(" ")).toMatch(/not thermally sustainable/i);
  });

  it("flags assumed ratings that imply more mechanical than electrical power", () => {
    const result = valueOf(calculateDcMotor({ ...base, supplyVoltageV: 1, requestedLoadTorqueNm: 1 }));
    expect(result.motorMechanicalW).toBeGreaterThan(result.electricalInputW);
    expect(result.warnings.join(" ")).toMatch(/assumed ratings are inconsistent/i);
  });

  it("rejects inconsistent current ratings and zero gear efficiency", () => {
    expect(calculateDcMotor({ ...base, stallCurrentA: 1 }).ok).toBe(false);
    expect(calculateDcMotor({ ...base, gearEfficiency: 0 }).ok).toBe(false);
  });
});

describe("low-voltage power budget", () => {
  const base: PowerBudgetInput = {
    sourceVoltage: 12,
    capacityAh: 10,
    usableFraction: 0.8,
    conversionEfficiency: 0.8,
    sourceContinuousCurrentA: 1,
    loads: [{ name: "Load", voltage: 5, currentA: 2, quantity: 1, dutyCycle: 0.5, peakCurrentA: 4 }],
  };

  it("keeps Ah and Wh distinct and includes conversion loss in runtime", () => {
    const result = valueOf(calculatePowerBudget(base));
    expect(result.averageLoadPowerW).toBeCloseTo(5);
    expect(result.peakLoadPowerW).toBeCloseTo(20);
    expect(result.usableWh).toBeCloseTo(96);
    expect(result.sourceAverageCurrentA).toBeCloseTo(5 / (12 * 0.8));
    expect(result.runtimeHours).toBeCloseTo(96 / (5 / 0.8));
    expect(result.averageOverload).toBe(false);
    expect(result.peakOverload).toBe(true);
  });

  it("returns null, not infinity, for an idle budget", () => {
    const result = valueOf(calculatePowerBudget({ ...base, loads: [] }));
    expect(result.averageLoadPowerW).toBe(0);
    expect(result.runtimeHours).toBeNull();
  });

  it("flags continuous-source overload", () => {
    const result = valueOf(calculatePowerBudget({ ...base, sourceContinuousCurrentA: 0.1 }));
    expect(result.averageOverload).toBe(true);
    expect(result.peakOverload).toBe(true);
    expect(result.warnings.join(" ")).toMatch(/average source current exceeds/i);
  });
});

describe("GPIO finite-state model", () => {
  it("takes timed transitions exactly when state elapsed time reaches the delay", () => {
    const program: GpioProgram = {
      initialState: "ON",
      states: {
        ON: { led: true, transitions: [{ to: "OFF", afterMs: 2 }] },
        OFF: { led: false, transitions: [{ to: "ON", afterMs: 2 }] },
      },
    };
    const result = valueOf(simulateGpioStateMachine(program, [], 5));
    expect(result.events.map((event) => [event.timeMs, event.from, event.to])).toEqual([
      [2, "ON", "OFF"],
      [4, "OFF", "ON"],
    ]);
    expect(result.samples).toHaveLength(6);
  });

  it("applies a timeline change before matching transitions at that time", () => {
    const program: GpioProgram = {
      initialState: "OFF",
      states: {
        OFF: { led: false, transitions: [{ to: "ON", button: true }] },
        ON: { led: true, transitions: [{ to: "OFF", button: false }] },
      },
    };
    const result = valueOf(simulateGpioStateMachine(program, [
      { atMs: 2, button: true },
      { atMs: 3, button: false },
    ], 4));
    expect(result.events.map((event) => [event.timeMs, event.to, event.button])).toEqual([
      [2, "ON", true],
      [3, "OFF", false],
    ]);
  });

  it("rejects unknown targets and zero-delay transitions", () => {
    expect(validateGpioProgram({
      initialState: "A",
      states: { A: { led: false, transitions: [{ to: "MISSING", afterMs: 1 }] } },
    }).ok).toBe(false);
    expect(validateGpioProgram({
      initialState: "A",
      states: { A: { led: false, transitions: [{ to: "A", afterMs: 0 }] } },
    }).ok).toBe(false);
    expect(validateGpioProgram({
      initialState: "A",
      states: { A: { led: false, transitions: [{ to: "A", afterMs: 1, button: true }] } },
    }).ok).toBe(false);
  });

  it("uses the first matching transition deterministically", () => {
    const program: GpioProgram = {
      initialState: "A",
      states: {
        A: { led: false, transitions: [{ to: "B", button: false }, { to: "C", button: false }] },
        B: { led: true, transitions: [] },
        C: { led: false, transitions: [] },
      },
    };
    const result = valueOf(simulateGpioStateMachine(program, [], 0));
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.to).toBe("B");
    expect(result.samples[0]?.state).toBe("B");
    expect(result.samples[0]?.led).toBe(true);
  });
});
