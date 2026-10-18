export type ServoCommandState = "disarmed" | "released" | "armed" | "active" | "timeout";

export type ServoScenarioId = "normal" | "held-at-boot" | "repress" | "timeout";

export type ServoTraceSample = {
  timeSeconds: number;
  pressed: boolean;
  state: ServoCommandState;
  pulseUs: number;
  led: boolean;
  dutyPercent: number;
};

export type ServoScenario = {
  id: ServoScenarioId;
  title: string;
  description: string;
  question: string;
  options: readonly string[];
  correctOption: number;
  feedback: string;
  benchCheck: string;
};

const RELEASE_SECONDS = 0.05;
const SESSION_SECONDS = 5;
const CENTER_US = 1500;
const MIN_US = 1450;
const MAX_US = 1550;
const RATE_US_PER_SECOND = 50;
const COMMAND_FREQUENCY_HZ = 50;
const PERIOD_US = 1_000_000 / COMMAND_FREQUENCY_HZ;

function roundTiesToEven(value: number): number {
  const lower = Math.floor(value);
  const fraction = value - lower;

  if (fraction < 0.5) return lower;
  if (fraction > 0.5) return lower + 1;
  return lower % 2 === 0 ? lower : lower + 1;
}

export class ServoCommandController {
  public state: ServoCommandState = "disarmed";

  private lastNow: number | null = null;
  private releaseSince: number | null = null;
  private sessionStart: number | null = null;

  private reset(): void {
    this.state = "disarmed";
    this.lastNow = null;
    this.releaseSince = null;
    this.sessionStart = null;
  }

  private static trianglePulse(elapsed: number): number {
    const phase = elapsed % 4;
    let pulse: number;

    if (phase <= 1) {
      pulse = CENTER_US + RATE_US_PER_SECOND * phase;
    } else if (phase <= 3) {
      pulse = MAX_US - RATE_US_PER_SECOND * (phase - 1);
    } else {
      pulse = MIN_US + RATE_US_PER_SECOND * (phase - 3);
    }

    return Math.max(MIN_US, Math.min(MAX_US, roundTiesToEven(pulse)));
  }

  public step(pressed: boolean, now: number): number {
    if (!Number.isFinite(now)) {
      this.reset();
      return 0;
    }

    if (this.lastNow !== null && now < this.lastNow) {
      this.reset();
      this.lastNow = now;
      return 0;
    }
    this.lastNow = now;

    if (!pressed) {
      this.sessionStart = null;
      if (this.releaseSince === null) {
        this.releaseSince = now;
        this.state = "released";
      } else if (now - this.releaseSince >= RELEASE_SECONDS) {
        this.state = "armed";
      }
      return 0;
    }

    this.releaseSince = null;
    if (this.state === "armed") {
      this.state = "active";
      this.sessionStart = now;
      return CENTER_US;
    }

    if (this.state !== "active" || this.sessionStart === null) {
      return 0;
    }

    const elapsed = now - this.sessionStart;
    if (elapsed < 0) {
      this.reset();
      return 0;
    }
    if (elapsed >= SESSION_SECONDS) {
      this.state = "timeout";
      this.sessionStart = null;
      return 0;
    }
    return ServoCommandController.trianglePulse(elapsed);
  }
}

export const SERVO_SCENARIOS: readonly ServoScenario[] = [
  {
    id: "normal",
    title: "Normal hold-to-run",
    description: "The button is released at boot, pressed from 0.10 s to 2.00 s, then released.",
    question: "What is the first command after the press at 0.10 s?",
    options: ["1500 us (7.5% duty)", "10000 us (50% duty)", "No pulse until the next sample"],
    correctOption: 0,
    feedback: "After a stable release, the press starts the session at 1500 us. At 50 Hz that is 1500/20000 = 7.5% duty, not a 50% command or an angle measurement.",
    benchCheck: "With external servo power off first, optionally check GP0-to-GND with a logic analyzer or oscilloscope and confirm a 1500 us first pulse within the bounded guide procedure.",
  },
  {
    id: "held-at-boot",
    title: "Button held at boot",
    description: "The button is held through startup, released at 1.00 s, then pressed again at 1.10 s.",
    question: "When can this trace first produce a pulse?",
    options: ["Immediately at boot", "After 50 ms passes, even while still held", "Only after release is observed for at least 50 ms and the button is pressed again"],
    correctOption: 2,
    feedback: "A held-at-boot press leaves the controller disarmed with no output. It must observe a release for at least 0.05 s and then see a new press before commanding 1500 us.",
    benchCheck: "With external servo power off first, boot while holding the button; optionally use a logic analyzer or oscilloscope to confirm no GP0 pulses until the bounded guide's release-and-repress sequence.",
  },
  {
    id: "repress",
    title: "Release too briefly",
    description: "After the first run, the button is released for 20 ms, repressed, then later released long enough to rearm.",
    question: "What happens when the button is repressed after only 20 ms released?",
    options: ["It starts a new 1500 us session", "It stays released with no pulses because 20 ms is too short to rearm", "It resumes the previous triangle command"],
    correctOption: 1,
    feedback: "The 20 ms release does not meet the 0.05 s threshold. The repress clears the release timer while state remains released, so output stays at zero until another stable release and press. At nominal 20 ms sampling, the release must be observed across samples spanning at least 0.05 s; actual loop jitter differs.",
    benchCheck: "With external servo power off first, optionally observe GP0 with a logic analyzer or oscilloscope; use the bounded guide and allow for real loop jitter when checking the 0.05 s release requirement.",
  },
  {
    id: "timeout",
    title: "Five-second timeout",
    description: "The first press is held beyond its five-second session, then the button is released and pressed again.",
    question: "What does the controller do after the held command reaches five seconds?",
    options: ["It restarts the triangle automatically", "It holds the last pulse until release", "It latches timeout with no pulses until a stable release and a new press"],
    correctOption: 2,
    feedback: "Five seconds after the press—not five seconds after boot—the controller enters timeout and commands no pulses. Continued holding cannot restart it; a stable release and new press are required.",
    benchCheck: "With external servo power off first, optionally use a logic analyzer or oscilloscope to confirm the five-second pulse cutoff and the bounded guide's release-and-repress recovery.",
  },
];

type ScenarioDefinition = {
  durationSeconds: number;
  isPressed: (timeSeconds: number) => boolean;
};

const scenarioDefinitions: Record<ServoScenarioId, ScenarioDefinition> = {
  normal: {
    durationSeconds: 3,
    isPressed: (time) => time >= 0.1 && time < 2,
  },
  "held-at-boot": {
    durationSeconds: 3,
    isPressed: (time) => (time >= 0 && time < 1) || (time >= 1.1 && time < 2),
  },
  repress: {
    durationSeconds: 3,
    isPressed: (time) =>
      (time >= 0.1 && time < 1) ||
      (time >= 1.02 && time < 1.5) ||
      (time >= 1.6 && time < 2.5),
  },
  timeout: {
    durationSeconds: 7,
    isPressed: (time) => (time >= 0.1 && time < 6) || (time >= 6.1 && time < 7.01),
  },
};

export function getServoTrace(id: ServoScenarioId): ServoTraceSample[] {
  const definition = scenarioDefinitions[id];
  const controller = new ServoCommandController();
  const samples: ServoTraceSample[] = [];
  const finalSample = definition.durationSeconds * COMMAND_FREQUENCY_HZ;

  for (let index = 0; index <= finalSample; index += 1) {
    const timeSeconds = index / COMMAND_FREQUENCY_HZ;
    const pressed = definition.isPressed(timeSeconds);
    const pulseUs = controller.step(pressed, timeSeconds);

    samples.push({
      timeSeconds,
      pressed,
      state: controller.state,
      pulseUs,
      led: pulseUs > 0,
      dutyPercent: pulseUs > 0 ? (pulseUs / PERIOD_US) * 100 : 0,
    });
  }

  return samples;
}
