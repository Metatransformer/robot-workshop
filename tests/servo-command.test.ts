import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  SERVO_SCENARIOS,
  ServoCommandController,
  getServoTrace,
  type ServoCommandState,
  type ServoScenarioId,
} from "../src/lib/servo-command";
import { servoFirmwareFiles } from "../src/lib/servo-firmware";

type Step = { pressed: boolean; now: number | "nan" | "inf" | "-inf" };
type StepResult = { pulseUs: number; state: ServoCommandState };

const pythonDifferentialRunner = String.raw`
import json
import sys
import types

payload = json.load(sys.stdin)
controller_module = types.ModuleType("servo_control")
exec(compile(payload["source"], "servo_control.py", "exec"), controller_module.__dict__)
ServoController = controller_module.ServoController

results = []
for sequence in payload["sequences"]:
    controller = ServoController()
    sequence_results = []
    for step in sequence:
        now = step["now"]
        if now == "nan":
            now = float("nan")
        elif now == "inf":
            now = float("inf")
        elif now == "-inf":
            now = float("-inf")
        pulse = controller.step(step["pressed"], now)
        sequence_results.append({"pulseUs": pulse, "state": controller.state})
    results.append(sequence_results)

json.dump(results, sys.stdout)
`;

function runPythonController(sequences: readonly (readonly Step[])[]): StepResult[][] {
  const result = spawnSync("python3", ["-c", pythonDifferentialRunner], {
    input: JSON.stringify({
      source: servoFirmwareFiles["firmware/servo_control.py"],
      sequences,
    }),
    encoding: "utf8",
    timeout: 10_000,
  });

  if (result.error) {
    throw new Error(`python3 is required for servo differential tests: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Python servo controller failed (status ${result.status}): ${result.stderr || result.stdout}`);
  }

  return JSON.parse(result.stdout) as StepResult[][];
}

function runTypeScriptController(sequence: readonly Step[]): StepResult[] {
  const controller = new ServoCommandController();
  return sequence.map((step) => {
    const now = step.now === "nan"
      ? Number.NaN
      : step.now === "inf"
        ? Number.POSITIVE_INFINITY
        : step.now === "-inf"
          ? Number.NEGATIVE_INFINITY
          : step.now;
    const pulseUs = controller.step(step.pressed, now);
    return { pulseUs, state: controller.state };
  });
}

describe("FS90 command model", () => {
  it("matches the exported Python controller at every sample in all four traces", () => {
    const ids: ServoScenarioId[] = ["normal", "held-at-boot", "repress", "timeout"];
    const traces = ids.map((id) => getServoTrace(id));
    const sequences = traces.map((trace) => trace.map(({ pressed, timeSeconds }) => ({
      pressed,
      now: timeSeconds,
    })));
    const pythonResults = runPythonController(sequences);

    ids.forEach((id, scenarioIndex) => {
      const trace = traces[scenarioIndex];
      expect(trace).toHaveLength((id === "timeout" ? 7 : 3) * 50 + 1);
      trace.forEach((sample, sampleIndex) => {
        expect(
          { pulseUs: sample.pulseUs, state: sample.state },
          `${id} at t=${sample.timeSeconds}`,
        ).toEqual(pythonResults[scenarioIndex][sampleIndex]);
      });
    });
  });

  it("matches Python at release and timeout boundaries, fractional pulses, and clock resets", () => {
    const sequences: Step[][] = [
      [
        { pressed: false, now: 0 },
        { pressed: false, now: 0.049999999 },
        { pressed: false, now: 0.05 },
        { pressed: true, now: 0.051 },
        { pressed: true, now: 0.061 },
        { pressed: true, now: 0.081 },
        { pressed: true, now: 1.061 },
        { pressed: true, now: 5.050999999 },
        { pressed: true, now: 5.051 },
      ],
      [
        { pressed: false, now: 10 },
        { pressed: false, now: 10.05 },
        { pressed: false, now: 10.05 },
        { pressed: true, now: 10.05 },
        { pressed: true, now: 10.05 },
        { pressed: true, now: 9 },
        { pressed: true, now: 9 },
        { pressed: false, now: 9.1 },
        { pressed: false, now: 9.15 },
        { pressed: true, now: 9.16 },
      ],
      [
        { pressed: false, now: 0 },
        { pressed: false, now: 0.05 },
        { pressed: true, now: 0.1 },
        { pressed: true, now: "nan" },
        { pressed: false, now: 1 },
        { pressed: false, now: 1.05 },
        { pressed: true, now: 1.1 },
        { pressed: true, now: "inf" },
        { pressed: true, now: "-inf" },
      ],
      [
        { pressed: false, now: -0.05 },
        { pressed: false, now: 0 },
        { pressed: true, now: 0 },
        { pressed: true, now: 0.01 },
        { pressed: true, now: 0.03 },
        { pressed: true, now: 0.05 },
        { pressed: true, now: 0.07 },
      ],
    ];
    const pythonResults = runPythonController(sequences);

    sequences.forEach((sequence, index) => {
      expect(runTypeScriptController(sequence)).toEqual(pythonResults[index]);
    });

    expect(runTypeScriptController(sequences[0]).map(({ pulseUs }) => pulseUs)).toEqual([
      0,
      0,
      0,
      1500,
      1500,
      1502,
      1550,
      1550,
      0,
    ]);
    expect(runTypeScriptController(sequences[3]).map(({ pulseUs }) => pulseUs)).toEqual([
      0,
      0,
      1500,
      1500,
      1502,
      1502,
      1504,
    ]);
  });

  it("exposes the concrete scenario outcomes and ideal 50 Hz command percentage", () => {
    expect(SERVO_SCENARIOS).toHaveLength(4);
    for (const scenario of SERVO_SCENARIOS) {
      expect(scenario.options).toHaveLength(3);
      expect(scenario.options[scenario.correctOption]).toBeDefined();
    }

    const normal = getServoTrace("normal");
    const firstNormalPulse = normal.find((sample) => sample.pulseUs > 0);
    expect(firstNormalPulse).toMatchObject({
      timeSeconds: 0.1,
      state: "active",
      pulseUs: 1500,
      led: true,
      dutyPercent: 7.5,
    });
    expect(normal.find((sample) => sample.timeSeconds === 2)).toMatchObject({
      pressed: false,
      state: "released",
      pulseUs: 0,
      led: false,
      dutyPercent: 0,
    });

    const heldAtBoot = getServoTrace("held-at-boot");
    expect(heldAtBoot.filter((sample) => sample.timeSeconds < 1)).toSatisfy(
      (samples: typeof heldAtBoot) => samples.every((sample) => sample.pulseUs === 0),
    );
    expect(heldAtBoot.find((sample) => sample.timeSeconds === 1.1)).toMatchObject({
      state: "active",
      pulseUs: 1500,
    });

    const repress = getServoTrace("repress");
    expect(repress.find((sample) => sample.timeSeconds === 1.02)).toMatchObject({
      pressed: true,
      state: "released",
      pulseUs: 0,
    });
    expect(repress.find((sample) => sample.timeSeconds === 1.6)).toMatchObject({
      state: "active",
      pulseUs: 1500,
    });

    const timeout = getServoTrace("timeout");
    expect(timeout.find((sample) => sample.timeSeconds === 5.1)).toMatchObject({
      pressed: true,
      state: "timeout",
      pulseUs: 0,
    });
    expect(timeout.find((sample) => sample.timeSeconds === 5.5)).toMatchObject({
      pressed: true,
      state: "timeout",
      pulseUs: 0,
    });
    expect(timeout.find((sample) => sample.timeSeconds === 6)).toMatchObject({
      state: "released",
      pulseUs: 0,
    });
    expect(timeout.find((sample) => sample.timeSeconds === 6.1)).toMatchObject({
      state: "active",
      pulseUs: 1500,
    });
  });
});
