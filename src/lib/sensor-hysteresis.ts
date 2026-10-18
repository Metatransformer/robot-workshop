export type IndicatorEvent =
  | { kind: "sample"; temperatureC: number }
  | { kind: "fault" }
  | { kind: "reset" };

type IndicatorTraceRow = {
  index: number;
  event: IndicatorEvent;
  previous: boolean;
  command: boolean;
  singleThreshold: boolean;
  reason: string;
};

type HysteresisScenario = {
  id: "memory" | "chatter" | "recovery";
  title: string;
  description: string;
  events: readonly IndicatorEvent[];
  question: string;
  predictionIndex: number;
  expectedCommand: boolean;
  explanation: string;
};

const HIGH_C = 28;
const LOW_C = 26;

export function traceIndicator(
  events: readonly IndicatorEvent[],
): IndicatorTraceRow[] {
  let command = false;

  return events.map((event, index) => {
    const previous = command;
    let singleThreshold = false;
    let reason: string;

    if (event.kind === "sample") {
      if (!Number.isFinite(event.temperatureC)) {
        throw new TypeError("temperatureC must be a finite number");
      }

      singleThreshold = event.temperatureC >= HIGH_C;
      if (event.temperatureC >= HIGH_C) {
        command = true;
        reason = "At or above 28 °C turns the indicator on.";
      } else if (event.temperatureC <= LOW_C) {
        command = false;
        reason = "At or below 26 °C turns the indicator off.";
      } else {
        command = previous;
        reason = previous
          ? "Between 26 °C and 28 °C retains the previous on command."
          : "Between 26 °C and 28 °C retains the previous off command.";
      }
    } else if (event.kind === "fault") {
      command = false;
      reason = "A fault clears the indicator command.";
    } else {
      command = false;
      reason =
        "A reset performs post-startup initialization and clears the indicator command.";
    }

    return {
      index,
      event,
      previous,
      command,
      singleThreshold,
      reason,
    };
  });
}

export const HYSTERESIS_SCENARIOS = [
  {
    id: "memory",
    title: "Remembering the last command",
    description:
      "Once the temperature reaches the upper boundary, a reading between the boundaries keeps the indicator on.",
    events: [
      { kind: "sample", temperatureC: 25 },
      { kind: "sample", temperatureC: 28 },
      { kind: "sample", temperatureC: 27 },
      { kind: "sample", temperatureC: 26 },
      { kind: "sample", temperatureC: 27 },
    ],
    question: "What is the LED command at step 3, after 28 °C and then 27 °C?",
    predictionIndex: 2,
    expectedCommand: true,
    explanation:
      "ON. The 28 °C sample turns it on, and 27 °C retains that previous command until a sample reaches 26 °C or lower.",
  },
  {
    id: "chatter",
    title: "Staying steady near the boundary",
    description:
      "Hysteresis prevents repeated toggling when samples move just below and above the upper boundary.",
    events: [
      { kind: "sample", temperatureC: 27.9 },
      { kind: "sample", temperatureC: 28.1 },
      { kind: "sample", temperatureC: 27.9 },
      { kind: "sample", temperatureC: 28.1 },
      { kind: "sample", temperatureC: 27.9 },
    ],
    question:
      "What is the LED command at step 5, after the final 27.9 °C sample?",
    predictionIndex: 4,
    expectedCommand: true,
    explanation:
      "ON. The final 27.9 °C sample retains the on command, while a memoryless 28 °C comparator would be off.",
  },
  {
    id: "recovery",
    title: "Clearing state during recovery",
    description:
      "Faults and program restarts both clear the remembered command before later samples are evaluated.",
    events: [
      { kind: "sample", temperatureC: 28 },
      { kind: "fault" },
      { kind: "sample", temperatureC: 27 },
      { kind: "sample", temperatureC: 28 },
      { kind: "reset" },
      { kind: "sample", temperatureC: 27 },
    ],
    question:
      "What is the LED command at step 6, after the restart and final 27 °C sample?",
    predictionIndex: 5,
    expectedCommand: false,
    explanation:
      "OFF. A fault is an error transition, while reset models post-startup initialization after a program restart; each clears the command. Physical startup pulses are intentionally omitted.",
  },
] as const satisfies readonly HysteresisScenario[];
