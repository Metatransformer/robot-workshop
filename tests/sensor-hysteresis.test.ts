import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  HYSTERESIS_SCENARIOS,
  traceIndicator,
  type IndicatorEvent,
} from "../src/lib/sensor-hysteresis";
import { sensorLedFirmwareFiles } from "../src/lib/sensor-led-firmware";

type DifferentialSequence = {
  id: string;
  events: readonly IndicatorEvent[];
};

const exactAndNearbyEvents = [
  { kind: "sample", temperatureC: 28 },
  { kind: "sample", temperatureC: 28 - Number.EPSILON * 16 },
  { kind: "sample", temperatureC: 26 },
  { kind: "sample", temperatureC: 26 + Number.EPSILON * 16 },
  { kind: "sample", temperatureC: 28 + Number.EPSILON * 16 },
  { kind: "sample", temperatureC: 26 - Number.EPSILON * 16 },
] as const satisfies readonly IndicatorEvent[];

function deterministicFiniteEvents(length: number): IndicatorEvent[] {
  let state = 0x5eed1234;
  return Array.from({ length }, () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return {
      kind: "sample",
      temperatureC: 24 + (state / 0x1_0000_0000) * 6,
    };
  });
}

const differentialPython = String.raw`
import json
import sys
import types

payload = json.load(sys.stdin)
module = types.ModuleType("indicator")
exec(compile(payload["source"], "indicator.py", "exec"), module.__dict__)

traces = []
for sequence in payload["sequences"]:
    command = False
    rows = []
    for event in sequence["events"]:
        previous = command
        if event["kind"] == "sample":
            command = module.update_indicator(event["temperatureC"], previous, 28, 26)
        else:
            command = False
        rows.append({"previous": previous, "command": command})
    traces.append({"id": sequence["id"], "rows": rows})

sys.stdout.write(json.dumps(traces))
`;

describe("sensor indicator hysteresis model", () => {
  it("models the fixed boundaries, retention band, comparator, faults, and resets", () => {
    const events = [
      { kind: "sample", temperatureC: 25 },
      { kind: "sample", temperatureC: 28 },
      { kind: "sample", temperatureC: 27 },
      { kind: "fault" },
      { kind: "sample", temperatureC: 27 },
      { kind: "sample", temperatureC: 28 },
      { kind: "reset" },
      { kind: "sample", temperatureC: 26 },
    ] as const satisfies readonly IndicatorEvent[];

    expect(traceIndicator(events)).toMatchObject([
      { index: 0, previous: false, command: false, singleThreshold: false },
      { index: 1, previous: false, command: true, singleThreshold: true },
      { index: 2, previous: true, command: true, singleThreshold: false },
      { index: 3, previous: true, command: false, singleThreshold: false },
      { index: 4, previous: false, command: false, singleThreshold: false },
      { index: 5, previous: false, command: true, singleThreshold: true },
      { index: 6, previous: true, command: false, singleThreshold: false },
      { index: 7, previous: false, command: false, singleThreshold: false },
    ]);

    const reasons = traceIndicator(events).map((row) => row.reason);
    expect(reasons[1]).toContain("At or above 28");
    expect(reasons[2]).toContain("retains the previous on");
    expect(reasons[3]).toContain("fault clears");
    expect(reasons[6]).toContain("post-startup initialization");
    expect(reasons[7]).toContain("At or below 26");
  });

  it("provides the three immutable teaching scenarios with their predictions", () => {
    expect(HYSTERESIS_SCENARIOS.map(({ id }) => id)).toEqual([
      "memory",
      "chatter",
      "recovery",
    ]);

    for (const scenario of HYSTERESIS_SCENARIOS) {
      const prediction = traceIndicator(scenario.events)[scenario.predictionIndex];
      expect(prediction?.command, scenario.id).toBe(scenario.expectedCommand);
    }

    const chatter = HYSTERESIS_SCENARIOS[1];
    expect(traceIndicator(chatter.events)[4]).toMatchObject({
      command: true,
      singleThreshold: false,
    });
    expect(HYSTERESIS_SCENARIOS.find(({ id }) => id === "recovery")?.explanation).toContain(
      "Physical startup pulses are intentionally omitted",
    );
  });

  it("rejects non-finite samples without mutating its input", () => {
    for (const temperatureC of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      expect(() => traceIndicator([{ kind: "sample", temperatureC }])).toThrow(
        "temperatureC must be a finite number",
      );
    }

    const events = Object.freeze([
      Object.freeze({ kind: "sample" as const, temperatureC: 28 }),
      Object.freeze({ kind: "sample" as const, temperatureC: 27 }),
      Object.freeze({ kind: "reset" as const }),
    ]);
    const before = structuredClone(events);
    traceIndicator(events);
    expect(events).toEqual(before);
  });

  it("matches the exported Python sample function across presets, boundaries, and a long sequence", () => {
    const sequences: DifferentialSequence[] = [
      ...HYSTERESIS_SCENARIOS.map(({ id, events }) => ({ id, events })),
      { id: "exact-and-nearby", events: exactAndNearbyEvents },
      { id: "long-deterministic", events: deterministicFiniteEvents(1_024) },
    ];
    const source = sensorLedFirmwareFiles["firmware/indicator.py"];
    expect(source).toBeTypeOf("string");

    const result = spawnSync("python3", ["-c", differentialPython], {
      input: JSON.stringify({ source, sequences }),
      encoding: "utf8",
      timeout: 10_000,
    });

    expect(result.error).toBeUndefined();
    expect(result.status, result.stderr || result.stdout).toBe(0);

    const pythonTraces = JSON.parse(result.stdout) as Array<{
      id: string;
      rows: Array<{ previous: boolean; command: boolean }>;
    }>;
    expect(pythonTraces).toHaveLength(sequences.length);

    for (const sequence of sequences) {
      const typescriptRows = traceIndicator(sequence.events).map(
        ({ previous, command }) => ({ previous, command }),
      );
      expect(
        pythonTraces.find(({ id }) => id === sequence.id)?.rows,
        sequence.id,
      ).toEqual(typescriptRows);
    }
  });
});
