"use client";

import "./servo-command-lab.css";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SERVO_SCENARIOS, getServoTrace } from "@/lib/servo-command";

type ScenarioId = (typeof SERVO_SCENARIOS)[number]["id"];
type ServoSample = ReturnType<typeof getServoTrace>[number];

function buttonLabel(pressed: boolean): string {
  return pressed ? "Pressed" : "Released";
}

function ledLabel(led: boolean): string {
  return led ? "On" : "Off";
}

function formatTime(timeSeconds: number): string {
  return `${timeSeconds.toFixed(2)} s`;
}

function commandPath(samples: readonly ServoSample[], maximumPulse: number): string {
  if (!samples.length) return "";

  const firstTime = samples[0]!.timeSeconds;
  const lastTime = samples.at(-1)!.timeSeconds;
  const duration = Math.max(lastTime - firstTime, 0.02);
  const x = (time: number) => 72 + ((time - firstTime) / duration) * 660;
  const y = (pulse: number) => 188 - (pulse / maximumPulse) * 138;
  let path = `M ${x(firstTime)} ${y(samples[0]!.pulseUs)}`;

  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const sample = samples[index]!;
    path += ` L ${x(sample.timeSeconds)} ${y(previous.pulseUs)} L ${x(sample.timeSeconds)} ${y(sample.pulseUs)}`;
  }

  return `${path} L ${x(lastTime)} ${y(samples.at(-1)!.pulseUs)}`;
}

function CommandTimeline({ samples, selectedIndex }: { samples: readonly ServoSample[]; selectedIndex: number }) {
  const firstTime = samples[0]!.timeSeconds;
  const lastTime = samples.at(-1)!.timeSeconds;
  const duration = Math.max(lastTime - firstTime, 0.02);
  const maximumPulse = Math.max(1600, ...samples.map((sample) => sample.pulseUs));
  const selected = samples[selectedIndex]!;
  const selectedX = 72 + ((selected.timeSeconds - firstTime) / duration) * 660;

  return (
    <figure className="servo-command-chart">
      <svg viewBox="0 0 780 245" role="img" aria-labelledby="servo-session-title servo-session-desc">
        <title id="servo-session-title">Pulse command over the full selected scenario</title>
        <desc id="servo-session-desc">
          A sampled step trace of commanded pulse width in microseconds over time. Zero is shown on the baseline and means no pulses are commanded. A vertical marker identifies the selected sample.
        </desc>
        <line className="servo-chart-grid" x1="72" y1="50" x2="732" y2="50" />
        <line className="servo-chart-grid" x1="72" y1="188" x2="732" y2="188" />
        <line className="servo-chart-axis" x1="72" y1="36" x2="72" y2="188" />
        <line className="servo-chart-axis" x1="72" y1="188" x2="732" y2="188" />
        <text x="62" y="54" textAnchor="end">{maximumPulse.toLocaleString()}</text>
        <text className="servo-zero-label" x="62" y="192" textAnchor="end">0</text>
        <text x="72" y="213">{firstTime.toFixed(2)} s</text>
        <text x="732" y="213" textAnchor="end">{lastTime.toFixed(2)} s</text>
        <text x="402" y="235" textAnchor="middle">Scenario time (seconds)</text>
        <path className="servo-command-line" d={commandPath(samples, maximumPulse)} />
        <line className="servo-selected-marker" x1={selectedX} y1="35" x2={selectedX} y2="188" />
        <circle className="servo-selected-point" cx={selectedX} cy={188 - (selected.pulseUs / maximumPulse) * 138} r="5" />
      </svg>
      <figcaption>
        Pulse width is in microseconds; zero means no pulses. Each value is held until the next nominal 20 ms sample. The line does not interpolate controller states or model shaft motion.
      </figcaption>
    </figure>
  );
}

function IdealFrame({ pulseUs }: { pulseUs: number }) {
  const frameMs = 20;
  const pulseMs = pulseUs / 1000;
  const startX = 72;
  const endX = 732;
  const highEndX = startX + (Math.min(pulseMs, frameMs) / frameMs) * (endX - startX);
  const highY = 54;
  const lowY = 148;
  const path = pulseUs === 0
    ? `M ${startX} ${lowY} L ${endX} ${lowY}`
    : `M ${startX} ${lowY} L ${startX} ${highY} L ${highEndX} ${highY} L ${highEndX} ${lowY} L ${endX} ${lowY}`;

  return (
    <figure className="servo-command-chart servo-frame-chart">
      <svg viewBox="0 0 780 230" role="img" aria-labelledby="servo-frame-title servo-frame-desc">
        <title id="servo-frame-title">One ideal 20 millisecond command frame</title>
        <desc id="servo-frame-desc">
          {pulseUs === 0
            ? "The signal stays low for the whole ideal frame because no pulses are commanded."
            : `The signal is high for the first ${pulseMs.toFixed(2)} milliseconds, then low for the rest of the 20 millisecond frame.`}
        </desc>
        <line className="servo-chart-grid" x1={startX} y1={highY} x2={endX} y2={highY} />
        <line className="servo-chart-grid" x1={startX} y1={lowY} x2={endX} y2={lowY} />
        <text x="60" y={highY + 4} textAnchor="end">HIGH</text>
        <text x="60" y={lowY + 4} textAnchor="end">LOW</text>
        {[0, 5, 10, 15, 20].map((time) => {
          const tickX = startX + (time / frameMs) * (endX - startX);
          return (
            <g key={time}>
              <line className="servo-frame-tick" x1={tickX} y1="158" x2={tickX} y2="164" />
              <text x={tickX} y="184" textAnchor={time === 0 ? "start" : time === 20 ? "end" : "middle"}>{time}</text>
            </g>
          );
        })}
        <text x="402" y="211" textAnchor="middle">Time within ideal frame (ms)</text>
        <path className="servo-frame-line" d={path} />
        {pulseUs === 0 ? (
          <text className="servo-no-pulses" x="402" y="124" textAnchor="middle">No pulses</text>
        ) : (
          <>
            <line className="servo-pulse-marker" x1={highEndX} y1="38" x2={highEndX} y2="158" />
            <text className="servo-pulse-label" x="72" y="30" textAnchor="start">
              {pulseUs.toLocaleString()} µs = {pulseMs.toFixed(2)} ms HIGH
            </text>
          </>
        )}
      </svg>
      <figcaption>
        Ideal frame view for the selected command sample. It explains duty cycle only; it is not an oscilloscope capture.
      </figcaption>
    </figure>
  );
}

function SelectedSampleTable({ sample }: { sample: ServoSample }) {
  return (
    <div className="servo-table-wrap">
      <table className="servo-value-table">
        <caption>Exact selected sample values</caption>
        <thead>
          <tr>
            <th scope="col">Trace time</th>
            <th scope="col">Button</th>
            <th scope="col">Controller state</th>
            <th scope="col">Pulse</th>
            <th scope="col">LED</th>
            <th scope="col">Duty cycle</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{formatTime(sample.timeSeconds)}</td>
            <td>{buttonLabel(sample.pressed)}</td>
            <td>{sample.state}</td>
            <td>{sample.pulseUs.toLocaleString()} µs</td>
            <td>{ledLabel(sample.led)}</td>
            <td>{sample.dutyPercent.toFixed(2)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function KeyEventsTable({ samples }: { samples: readonly ServoSample[] }) {
  const events = useMemo(() => samples.filter((sample, index) => {
    if (index === 0) return true;
    const previous = samples[index - 1]!;
    return sample.pressed !== previous.pressed
      || sample.state !== previous.state;
  }), [samples]);

  return (
    <div className="servo-table-wrap servo-events-wrap">
      <table className="servo-events-table">
        <caption>Key command events</caption>
        <thead>
          <tr><th scope="col">Time</th><th scope="col">Button</th><th scope="col">State</th><th scope="col">Pulse</th></tr>
        </thead>
        <tbody>
          {events.map((sample) => (
            <tr key={`${sample.timeSeconds}-${sample.state}-${sample.pulseUs}`}>
              <td>{formatTime(sample.timeSeconds)}</td>
              <td>{buttonLabel(sample.pressed)}</td>
              <td>{sample.state}</td>
              <td>{sample.pulseUs.toLocaleString()} µs</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="servo-table-note">Only the first sample and changes to button or controller state are shown here. Pulse widths are in microseconds. The trace controls expose every sample.</p>
    </div>
  );
}

export default function ServoCommandLab() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>(SERVO_SCENARIOS[0]!.id);
  const [answer, setAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scenario = SERVO_SCENARIOS.find((item) => item.id === scenarioId)!;
  const samples = useMemo(() => getServoTrace(scenarioId), [scenarioId]);
  const selectedSample = samples[selectedIndex]!;

  const changeScenario = (nextId: ScenarioId) => {
    setScenarioId(nextId);
    setAnswer(null);
    setRevealed(false);
    setSelectedIndex(0);
  };

  const chooseAnswer = (optionIndex: number) => {
    setAnswer(optionIndex);
    setRevealed(false);
    setSelectedIndex(0);
  };

  const correct = answer === scenario.correctOption;

  return (
    <div className="servo-command-shell">
      <header className="servo-command-header">
        <Link className="servo-command-brand" href="/" aria-label="Workshop">
          <span>FS90</span>
          Workshop
        </Link>
        <nav aria-label="Servo lab navigation">
          <Link href="/build-guides/servo">FS90 build guide</Link>
          <Link href="/learn?lesson=timers-pwm">Learn PWM</Link>
          <Link className="is-emphasized" href="/?template=servo-bench">Open starter</Link>
        </nav>
      </header>

      <main className="servo-command-main">
        <section className="servo-command-intro" aria-labelledby="servo-command-heading">
          <p className="servo-command-eyebrow">Command explorer · Pico + FS90 bench</p>
          <h1 id="servo-command-heading">Understand the servo command</h1>
          <p>
            Predict what the starter controller will command, then inspect its sampled pulse trace one step at a time. This is a behavior model of the exact starter firmware logic—not a model of the servo mechanism.
          </p>
        </section>

        <aside className="servo-model-boundary" aria-labelledby="servo-boundary-title">
          <div>
            <p className="servo-command-eyebrow">Model boundary</p>
            <h2 id="servo-boundary-title">Command logic, not physical motion</h2>
          </div>
          <p>
            The explorer does not model shaft angle, torque, load, or power. It does not animate a shaft, and hardware validation has not been established. Use the bench check to compare the command model with real hardware.
          </p>
        </aside>

        <section className="servo-predict" aria-labelledby="servo-predict-title">
          <div className="servo-section-heading">
            <span>01</span>
            <div><p>Make a prediction</p><h2 id="servo-predict-title">Choose a firmware scenario</h2></div>
          </div>

          <label className="servo-scenario-select">
            <span>Scenario</span>
            <select value={scenarioId} onChange={(event) => changeScenario(event.target.value as ScenarioId)}>
              {SERVO_SCENARIOS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
          </label>

          <article className="servo-scenario-card">
            <p className="servo-scenario-description">{scenario.description}</p>
            <fieldset>
              <legend>Your prediction</legend>
              <p className="servo-question">{scenario.question}</p>
              <div className="servo-options">
                {scenario.options.map((option, optionIndex) => (
                  <label key={option} className={answer === optionIndex ? "is-selected" : undefined}>
                    <input
                      type="radio"
                      name={`servo-prediction-${scenario.id}`}
                      checked={answer === optionIndex}
                      onChange={() => chooseAnswer(optionIndex)}
                    />
                    <span aria-hidden="true">{String.fromCharCode(65 + optionIndex)}</span>
                    <b>{option}</b>
                  </label>
                ))}
              </div>
            </fieldset>
            <button className="servo-button is-primary" type="button" disabled={answer === null} onClick={() => setRevealed(true)}>
              Reveal command trace
            </button>
          </article>

          {revealed && (
            <div className={`servo-feedback ${correct ? "is-correct" : "is-incorrect"}`} role="status">
              <strong>{correct ? "That prediction matches the controller." : "That prediction does not match this trace yet."}</strong>
              <p>{scenario.feedback}</p>
              {!correct && <p>Select another answer and reveal the trace again to retry.</p>}
            </div>
          )}
        </section>

        {revealed && (
          <section className="servo-trace" aria-labelledby="servo-trace-title">
            <div className="servo-section-heading">
              <span>02</span>
              <div><p>Read the command</p><h2 id="servo-trace-title">Sampled controller trace</h2></div>
            </div>

            <CommandTimeline samples={samples} selectedIndex={selectedIndex} />

            <div className="servo-trace-controls">
              <label htmlFor="servo-trace-time">
                <span>Trace time</span>
                <output htmlFor="servo-trace-time">{formatTime(selectedSample.timeSeconds)} · sample {selectedIndex + 1} of {samples.length}</output>
              </label>
              <input
                id="servo-trace-time"
                type="range"
                min={0}
                max={samples.length - 1}
                step={1}
                value={selectedIndex}
                onChange={(event) => setSelectedIndex(Number(event.target.value))}
              />
              <div className="servo-step-buttons">
                <button className="servo-button" type="button" disabled={selectedIndex === 0} onClick={() => setSelectedIndex((index) => index - 1)}>Previous step</button>
                <button className="servo-button" type="button" disabled={selectedIndex === samples.length - 1} onClick={() => setSelectedIndex((index) => index + 1)}>Next step</button>
              </div>
            </div>

            <SelectedSampleTable sample={selectedSample} />
            <IdealFrame pulseUs={selectedSample.pulseUs} />

            <div className="servo-duty-explainer">
              <p className="servo-command-eyebrow">Read the number</p>
              <h3>Pulse width becomes a frame duty cycle</h3>
              <p>
                A 1,500 µs pulse is 1.5 ms HIGH. In one ideal 20 ms frame, 1.5 ÷ 20 = 7.5% duty cycle. That percentage describes the command signal; it is not motor power or a guaranteed shaft position.
              </p>
            </div>

            <KeyEventsTable samples={samples} />

            <div className="servo-timing-notes">
              <section>
                <h3>Sampling and timing</h3>
                <p>
                  This trace uses nominal 20 ms steps. The starter checks inputs on those samples, so a stable 50 ms release may first arm at the 60 ms sample. A real loop can add timing and quantization differences.
                </p>
                <p>The timeout is 5 seconds from activation, as evaluated by the sampled controller loop.</p>
              </section>
              <section>
                <h3>What the LED can tell you</h3>
                <p>
                  LED on means the firmware is commanding pulses; it is not a position, motion, or electrical measurement. No pulses does not guarantee zero torque or that servo power has been removed.
                </p>
              </section>
            </div>
          </section>
        )}

        <section className="servo-bench-check" aria-labelledby="servo-bench-title">
          <div>
            <p className="servo-command-eyebrow">On the real bench</p>
            <h2 id="servo-bench-title">Check this scenario on hardware</h2>
            <p>{scenario.benchCheck}</p>
          </div>
          <div className="servo-bench-links">
            <Link className="servo-button is-primary" href="/build-guides/servo">Open the build guide</Link>
            <Link className="servo-button" href="/?template=servo-bench">Open the starter</Link>
          </div>
        </section>

        <footer className="servo-command-footnote">
          <p>
            <sup>1</sup> The original starter firmware is the source of behavior. Designed to follow the starter controller; this interface does not claim to simulate a generalized microcontroller or servo.
          </p>
        </footer>
      </main>
    </div>
  );
}
