"use client";

import "./sensor-hysteresis-lab.css";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HYSTERESIS_SCENARIOS, traceIndicator } from "@/lib/sensor-hysteresis";

type ScenarioId = (typeof HYSTERESIS_SCENARIOS)[number]["id"];
type TraceRow = ReturnType<typeof traceIndicator>[number];

function commandLabel(command: boolean): "ON" | "OFF" {
  return command ? "ON" : "OFF";
}

function inputLabel(event: TraceRow["event"]): string {
  if (event.kind === "sample") return `${event.temperatureC}°C`;
  if (event.kind === "fault") return "Sensor fault";
  return "Program restart (after startup)";
}

function comparisonReason(row: TraceRow): string {
  if (row.event.kind === "fault") {
    return "The sensor fault clears this simplified comparison command to OFF.";
  }

  if (row.event.kind === "reset") {
    return "The post-startup restart initializes this simplified comparison command to OFF.";
  }

  return row.event.temperatureC >= 28
    ? "The sample is at or above 28°C, so the single threshold commands ON."
    : "The sample is below 28°C, so the single threshold commands OFF.";
}

export default function SensorHysteresisLab() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>(HYSTERESIS_SCENARIOS[0]!.id);
  const [prediction, setPrediction] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scenario = HYSTERESIS_SCENARIOS.find((item) => item.id === scenarioId)!;
  const rows = useMemo(() => traceIndicator(scenario.events), [scenario.events]);
  const selectedRow = rows[selectedIndex]!;
  const predictionIsCorrect = prediction === scenario.expectedCommand;

  const changeScenario = (nextId: ScenarioId) => {
    setScenarioId(nextId);
    setPrediction(null);
    setChecked(false);
    setSelectedIndex(0);
  };

  const choosePrediction = (command: boolean) => {
    setPrediction(command);
    setChecked(false);
    setSelectedIndex(0);
  };

  return (
    <div className="hysteresis-shell">
      <header className="hysteresis-header">
        <Link className="hysteresis-brand" href="/" aria-label="Workshop home">
          <span>LED</span>
          Workshop
        </Link>
        <nav className="hysteresis-nav" aria-label="Sensor hysteresis lab navigation">
          <Link href="/build-guides/sensor-led">Build guide</Link>
          <Link href="/learn?lesson=programming-state">Learn state</Link>
          <Link className="hysteresis-nav-emphasis" href="/?template=sensor-led">Open starter</Link>
        </nav>
      </header>

      <main className="hysteresis-main">
        <section className="hysteresis-intro" aria-labelledby="hysteresis-title">
          <p className="hysteresis-eyebrow">Sensor logic lab · state and thresholds</p>
          <h1 id="hysteresis-title">Why the LED remembers</h1>
          <p className="hysteresis-lede">
            The command turns ON at 28°C or above and OFF at 26°C or below. Between those thresholds, it retains the last command. The command is what the program requests—not an observation that the physical light is on.
          </p>
        </section>

        <section className="hysteresis-predict" aria-labelledby="hysteresis-predict-title">
          <div className="hysteresis-section-heading">
            <span>01</span>
            <div>
              <p>Predict before inspecting</p>
              <h2 id="hysteresis-predict-title">Follow the input sequence</h2>
            </div>
          </div>

          <label className="hysteresis-scenario-select">
            <span>Temperature sequence</span>
            <select value={scenarioId} onChange={(event) => changeScenario(event.target.value as ScenarioId)}>
              {HYSTERESIS_SCENARIOS.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>

          <article className="hysteresis-prediction-card">
            <p className="hysteresis-scenario-description">{scenario.description}</p>

            <div className="hysteresis-sequence-block">
              <h3>Chosen input sequence</h3>
              <ol className="hysteresis-input-list">
                {scenario.events.map((event, index) => (
                  <li key={`${scenario.id}-${index}`}>
                    <span>Step {index + 1}</span>
                    <strong>{inputLabel(event)}</strong>
                  </li>
                ))}
              </ol>
            </div>

            <fieldset className="hysteresis-fieldset">
              <legend>Predict the LED command</legend>
              <p className="hysteresis-question">{scenario.question}</p>
              <div className="hysteresis-options">
                {[true, false].map((command) => (
                  <label
                    key={commandLabel(command)}
                    className={prediction === command ? "hysteresis-option hysteresis-option-selected" : "hysteresis-option"}
                  >
                    <input
                      type="radio"
                      name={`hysteresis-prediction-${scenario.id}`}
                      checked={prediction === command}
                      onChange={() => choosePrediction(command)}
                    />
                    <span>{commandLabel(command)}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              className="hysteresis-button hysteresis-button-primary"
              type="button"
              disabled={prediction === null}
              onClick={() => setChecked(true)}
            >
              Check prediction
            </button>
          </article>

          {checked && (
            <div
              className={predictionIsCorrect
                ? "hysteresis-feedback hysteresis-feedback-correct"
                : "hysteresis-feedback hysteresis-feedback-incorrect"}
              role="status"
              aria-live="polite"
            >
              <strong>
                {predictionIsCorrect
                  ? "Correct—that matches the command at this step."
                  : "Not quite—follow the previous command through the sequence."}
              </strong>
              <p>{scenario.explanation}</p>
              {!predictionIsCorrect && <p>Choose ON or OFF again, then check the new prediction.</p>}
            </div>
          )}
        </section>

        {checked && (
          <section className="hysteresis-explorer" aria-labelledby="hysteresis-explorer-title">
            <div className="hysteresis-section-heading">
              <span>02</span>
              <div>
                <p>Inspect the state</p>
                <h2 id="hysteresis-explorer-title">Command explorer</h2>
              </div>
            </div>

            <div className="hysteresis-step-panel">
              <div className="hysteresis-step-toolbar">
                <button
                  className="hysteresis-button"
                  type="button"
                  disabled={selectedIndex === 0}
                  onClick={() => setSelectedIndex((index) => index - 1)}
                >
                  Previous step
                </button>
                <strong>Step {selectedIndex + 1} of {rows.length}</strong>
                <button
                  className="hysteresis-button"
                  type="button"
                  disabled={selectedIndex === rows.length - 1}
                  onClick={() => setSelectedIndex((index) => index + 1)}
                >
                  Next step
                </button>
              </div>

              <dl className="hysteresis-step-details">
                <div>
                  <dt>Input</dt>
                  <dd>{inputLabel(selectedRow.event)}</dd>
                </div>
                <div>
                  <dt>Previous hysteresis command</dt>
                  <dd><span className="hysteresis-command-text">{commandLabel(selectedRow.previous)}</span></dd>
                </div>
                <div>
                  <dt>Current hysteresis command</dt>
                  <dd><span className="hysteresis-command-text">{commandLabel(selectedRow.command)}</span></dd>
                </div>
                <div>
                  <dt>Single-threshold 28°C command</dt>
                  <dd><span className="hysteresis-command-text">{commandLabel(selectedRow.singleThreshold)}</span></dd>
                </div>
              </dl>

              <div className="hysteresis-reasons">
                <div>
                  <h3>Why hysteresis chose this command</h3>
                  <p>{selectedRow.reason}</p>
                </div>
                <div>
                  <h3>Why the single threshold chose this command</h3>
                  <p>{comparisonReason(selectedRow)}</p>
                </div>
              </div>
            </div>

            <aside className="hysteresis-comparison-note" aria-labelledby="hysteresis-comparison-title">
              <div>
                <p className="hysteresis-eyebrow">Comparison rule</p>
                <h3 id="hysteresis-comparison-title">One threshold has no memory</h3>
              </div>
              <p>
                The comparison rule is ON at 28°C or above and OFF below 28°C. Small repeated changes around 28°C may flip that command back and forth; hysteresis keeps the last command until an outer boundary is reached.
              </p>
            </aside>

            <p className="hysteresis-table-hint" id="hysteresis-table-hint">
              Full sequence. On a small screen, scroll this table sideways to inspect every column.
            </p>
            <div className="hysteresis-table-wrap" tabIndex={0} aria-describedby="hysteresis-table-hint">
              <table className="hysteresis-table">
                <caption>Command at every input step</caption>
                <thead>
                  <tr>
                    <th scope="col">Step</th>
                    <th scope="col">Input</th>
                    <th scope="col">Previous hysteresis</th>
                    <th scope="col">Hysteresis</th>
                    <th scope="col">Single threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const isSelected = index === selectedIndex;
                    return (
                      <tr key={`${scenario.id}-row-${row.index}`} className={isSelected ? "hysteresis-table-selected" : undefined}>
                        <td>
                          <button
                            className="hysteresis-inspect-button"
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setSelectedIndex(index)}
                          >
                            Inspect step {index + 1}
                          </button>
                          {isSelected && <span className="hysteresis-selected-label">Selected</span>}
                        </td>
                        <td>{inputLabel(row.event)}</td>
                        <td><strong>{commandLabel(row.previous)}</strong></td>
                        <td><strong>{commandLabel(row.command)}</strong></td>
                        <td><strong>{commandLabel(row.singleThreshold)}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="hysteresis-startup-note">
              <h3>What restart means here</h3>
              <p>
                The real starter runs three startup pulses. They are deliberately omitted from this state trace. A restart row represents the initialization that follows those pulses, not a claim that the electrical LED stayed OFF throughout startup.
              </p>
            </div>
          </section>
        )}

        <section className="hysteresis-handoff" aria-labelledby="hysteresis-handoff-title">
          <div>
            <p className="hysteresis-eyebrow">Continue on the real starter</p>
            <h2 id="hysteresis-handoff-title">Edit the thresholds, then restart</h2>
            <p>
              Edit <code>HIGH_C</code> and <code>LOW_C</code> near the top of <code>code.py</code>, as the build guide describes. Saving restarts CircuitPython and clears retained state. The defaults in <code>indicator.py</code> are overridden by those constants. A forced ON/OFF check is useful for wiring, but it is different from testing whether a between-threshold sample retains the previous command.
            </p>
          </div>
          <div className="hysteresis-handoff-links">
            <Link className="hysteresis-button hysteresis-button-primary" href="/build-guides/sensor-led">Open the build guide</Link>
            <Link className="hysteresis-button" href="/?template=sensor-led">Open the source starter</Link>
            <Link className="hysteresis-button" href="/bench/led">Record LED measurements</Link>
          </div>
        </section>

        <footer className="hysteresis-footnote">
          <p>
            Sample decisions are differentially checked against the exported <code>indicator.py</code>. Fault and restart rows are explicit state-clearing transitions; clearing the single-threshold comparison on those rows is an imposed comparison rule, not a claim about another device. It is not a universal microcontroller simulation and does not model physical time, temperature dynamics, sensor accuracy, LED brightness, or persistence across restart.
          </p>
        </footer>
      </main>
    </div>
  );
}
