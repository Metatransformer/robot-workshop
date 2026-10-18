"use client";

import "./simulation-lab.css";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  associationAfterSuccessfulRun,
  createNotebookRecord,
  LAB_IDS,
  parametersEqual,
  parseNotebookStorage,
  runGpioModel,
  type GpioParameters,
  type LabId,
  type LabParameters,
  type NotebookAssociation,
} from "@/lib/simulation-notebook";
import {
  calculateDcMotor,
  calculatePowerBudget,
  simulateRcCharging,
  type ButtonTimelineEntry,
  type DcMotorInput,
  type DcMotorOutput,
  type GpioProgram,
  type GpioSimulationOutput,
  type PowerBudgetInput,
  type PowerBudgetOutput,
  type RcChargingInput,
  type RcChargingOutput,
  type SimulationResult,
} from "@/lib/simulations";

type Run<T, P> = { result: SimulationResult<T>; parameters: P; ranAt: string };
type Notice = { kind: "error" | "success"; text: string } | null;

const labInfo: Record<LabId, { title: string; kicker: string; lesson: string }> = {
  "rc-transient": { title: "RC transient", kicker: "Charge, time, and stored energy", lesson: "capacitance-transients" },
  "dc-motor": { title: "DC motor", kicker: "Linear steady-state estimate", lesson: "torque-gearing" },
  "power-budget": { title: "Power budget", kicker: "Average energy and simultaneous peak", lesson: "power-regulation" },
  "gpio-state-machine": { title: "GPIO state model", kicker: "Bounded logic trace", lesson: "programming-state" },
};

const rcDefaults: RcChargingInput = {
  resistanceOhms: 1_000,
  capacitanceMicrofarads: 100,
  supplyVoltageV: 5,
  initialVoltageV: 0,
  durationMs: 500,
};

const motorDefaults: DcMotorInput = {
  supplyVoltageV: 6,
  noLoadRpm: 6_000,
  stallTorqueNm: 0.025,
  stallCurrentA: 2.4,
  noLoadCurrentA: 0.18,
  requestedLoadTorqueNm: 0.08,
  gearRatio: 10,
  gearEfficiency: 0.75,
};

const powerDefaults: PowerBudgetInput = {
  sourceVoltage: 7.4,
  capacityAh: 2.5,
  usableFraction: 0.8,
  conversionEfficiency: 0.88,
  sourceContinuousCurrentA: 4,
  loads: [
    { name: "Controller", voltage: 5, currentA: 0.12, quantity: 1, dutyCycle: 1, peakCurrentA: 0.22 },
    { name: "Gearmotor", voltage: 6, currentA: 0.55, quantity: 2, dutyCycle: 0.4, peakCurrentA: 2.4 },
  ],
};

const blinkProgram: GpioProgram = {
  initialState: "ON",
  states: {
    ON: { led: true, transitions: [{ to: "OFF", afterMs: 500 }] },
    OFF: { led: false, transitions: [{ to: "ON", afterMs: 500 }] },
  },
};

const interlockProgram: GpioProgram = {
  initialState: "OFF",
  states: {
    OFF: { led: false, transitions: [{ to: "ON", button: true }] },
    ON: { led: true, transitions: [{ to: "OFF", button: false }] },
  },
};

const interlockTimeline: ButtonTimelineEntry[] = [
  { atMs: 200, button: true },
  { atMs: 850, button: false },
];

const gpioDefaults = {
  programText: JSON.stringify(blinkProgram, null, 2),
  timelineText: "[]",
  durationMs: 2_000,
};

const rcLimitations = [
  "Exact first-order response for one ideal, unloaded resistor-capacitor network only.",
  "Excludes capacitor leakage, ESR, component tolerance, wiring, loading, and supply current limits.",
  "It does not claim that every circuit containing R and C behaves like this model.",
];
const motorLimitations = [
  "Linear steady-state interpolation from user-entered assumptions; no startup or other dynamics are predicted.",
  "The voltage is the voltage associated with the entered ratings. This model does not scale RPM above or below it.",
  "Continuous/thermal ratings, winding temperature, driver loss, friction changes, and component-specific behavior are unknown.",
];
const powerLimitations = [
  "Average load power uses duty cycle; peak power conservatively assumes all peak currents occur together.",
  "Capacity in Ah is not a current rating. Source protection, peak capability, charger, cell chemistry, aging, and wiring are not established.",
  "This is an energy budget, not guidance for assembling a bare lithium pack.",
];
const gpioLimitations = [
  "A discrete 1 ms finite-state model, not firmware, MCU timing, pin-electrical, or MicroPython emulation.",
  "Button transitions are level-triggered. Contact bounce, debounce, interrupts, scheduling jitter, and electrical thresholds are excluded.",
  "At most one deterministic transition occurs per simulated millisecond; the first matching transition wins.",
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function nowRun<T, P>(result: SimulationResult<T>, parameters: P): Run<T, P> {
  return { result, parameters: clone(parameters), ranAt: new Date().toISOString() };
}

function defaultRun<T, P>(result: SimulationResult<T>, parameters: P): Run<T, P> {
  return { result, parameters: clone(parameters), ranAt: "" };
}

function format(value: number | null, digits = 3) {
  if (value === null) return "Not calculated";
  if (!Number.isFinite(value)) return "Invalid";
  if (value !== 0 && (Math.abs(value) >= 100_000 || Math.abs(value) < 0.001)) return value.toExponential(3);
  return value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function NumericField({
  label, unit, value, onChange, min, max, step = "any",
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number | "any";
}) {
  return (
    <label className="sim-field">
      <span>{label}</span>
      <span className="sim-field__control">
        <input type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
        <b>{unit}</b>
      </span>
    </label>
  );
}

function ErrorBox({ errors }: { errors: string[] }) {
  return (
    <div className="sim-errors" role="alert">
      <strong>Fix these inputs before the model can run.</strong>
      <ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul>
    </div>
  );
}

function ResultTable({ caption, rows }: { caption: string; rows: Array<[string, ReactNode, string?]> }) {
  return (
    <div className="sim-table-wrap">
      <table className="sim-results-table">
        <caption>{caption}</caption>
        <thead><tr><th scope="col">Quantity</th><th scope="col">Value</th><th scope="col">Unit / meaning</th></tr></thead>
        <tbody>{rows.map(([label, value, unit = ""]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td><td>{unit}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function ModelNotes({ assumptions, limitations }: { assumptions: string[]; limitations: string[] }) {
  return (
    <div className="sim-notes-grid">
      <section><h3>Assumptions</h3><ul>{assumptions.map((item) => <li key={item}>{item}</li>)}</ul></section>
      <section><h3>Excluded effects</h3><ul>{limitations.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </div>
  );
}

function RunBar({ ranAt, dirty, onRun, onReset }: { ranAt: string; dirty: boolean; onRun: () => void; onReset: () => void }) {
  return (
    <>
      {dirty && <p className="sim-dirty" role="status"><strong>Inputs changed</strong> — results belong to the previous run. Run model to update.</p>}
      <div className="sim-runbar">
        <div><span>{ranAt ? "Last model run" : "Preview"}</span>{ranAt ? <time dateTime={ranAt}>{new Date(ranAt).toLocaleString()}</time> : <span>Default inputs</span>}</div>
        <button className="sim-button is-primary" type="button" onClick={onRun}>Run model</button>
        <button className="sim-button" type="button" onClick={onReset}>Reset inputs</button>
      </div>
    </>
  );
}

function RcGraph({ points, supplyVoltage }: { points: Array<{ timeMs: number; voltageV: number }>; supplyVoltage: number }) {
  const maxVoltage = Math.max(1, supplyVoltage, ...points.map((point) => point.voltageV));
  const maxTime = points.at(-1)?.timeMs || 1;
  const polyline = points.map((point) => `${40 + point.timeMs / maxTime * 620},${220 - point.voltageV / maxVoltage * 180}`).join(" ");
  return (
    <figure className="sim-graph">
      <svg viewBox="0 0 700 260" role="img" aria-labelledby="rc-chart-title rc-chart-desc">
        <title id="rc-chart-title">Capacitor voltage over time</title>
        <desc id="rc-chart-desc">A line from the entered initial voltage toward the entered supply voltage over the selected duration.</desc>
        <line x1="40" y1="220" x2="660" y2="220" /><line x1="40" y1="40" x2="40" y2="220" />
        <line className="sim-graph__guide" x1="40" y1={220 - supplyVoltage / maxVoltage * 180} x2="660" y2={220 - supplyVoltage / maxVoltage * 180} />
        <polyline className="sim-graph__line" points={polyline} />
        <text x="40" y="243">0 ms</text><text x="660" y="243" textAnchor="end">{format(maxTime, 0)} ms</text>
        <text x="33" y="45" textAnchor="end">{format(maxVoltage)} V</text><text x="33" y="224" textAnchor="end">0</text>
      </svg>
      <figcaption>Voltage approaches the source exponentially. The dashed guide is the entered supply voltage.</figcaption>
    </figure>
  );
}

function GpioGraph({ samples }: { samples: Array<{ timeMs: number; button: boolean; led: boolean }> }) {
  const lastTime = samples.at(-1)?.timeMs || 1;
  const edgeCount = samples.slice(1).reduce((total, sample, index) => {
    const previous = samples[index]!;
    return total + Number(sample.button !== previous.button) + Number(sample.led !== previous.led);
  }, 0);
  if (edgeCount > 1_000) {
    return (
      <div className="sim-graph-limit" role="note">
        <strong>Trace graph not rendered: more than 1,000 digital edges.</strong>
        <span>Regular downsampling would invent a slower waveform. Use the exact transition event table and downloaded report; narrow the duration to inspect a smaller time window.</span>
      </div>
    );
  }
  const path = (key: "button" | "led", high: number, low: number) => {
    if (!samples.length) return "";
    const y = (value: boolean) => value ? high : low;
    const x = (timeMs: number) => 50 + timeMs / lastTime * 610;
    let data = `M ${x(samples[0]!.timeMs)} ${y(samples[0]![key])}`;
    for (let index = 1; index < samples.length; index += 1) {
      const previous = samples[index - 1]!;
      const sample = samples[index]!;
      if (sample[key] !== previous[key]) data += ` L ${x(sample.timeMs)} ${y(previous[key])} L ${x(sample.timeMs)} ${y(sample[key])}`;
    }
    return `${data} L ${x(samples.at(-1)!.timeMs)} ${y(samples.at(-1)![key])}`;
  };
  return (
    <figure className="sim-graph">
      <svg viewBox="0 0 700 230" role="img" aria-labelledby="gpio-chart-title gpio-chart-desc">
        <title id="gpio-chart-title">Button input and LED output trace</title>
        <desc id="gpio-chart-desc">Two digital traces show low and high levels over the simulated duration.</desc>
        <line x1="50" y1="190" x2="660" y2="190" />
        <text x="42" y="63" textAnchor="end">Button</text><text x="42" y="143" textAnchor="end">LED</text>
        <path className="sim-graph__input" d={path("button", 38, 72)} />
        <path className="sim-graph__line" d={path("led", 118, 152)} />
        <text x="50" y="212">0 ms</text><text x="660" y="212" textAnchor="end">{lastTime} ms</text>
      </svg>
      <figcaption>Orange is LED output; ink is button level. The event table is the exact numeric fallback.</figcaption>
    </figure>
  );
}

type Report = {
  lab: string;
  reportCreatedAt: string;
  modelRanAt: string;
  notesAssociation: "bound-to-model-run";
  modelFidelity: string;
  hardwareStatus: string;
  prediction: string;
  observations: string;
  equations: string[];
  parameters: unknown;
  results: unknown;
  limitations: string[];
};

function reportMarkdown(report: Report) {
  return `# Simulation experiment: ${report.lab}\n\n- Report created: ${report.reportCreatedAt}\n- Model run: ${report.modelRanAt}\n- Notes association: ${report.notesAssociation}\n- Model fidelity: ${report.modelFidelity}\n- Hardware status: ${report.hardwareStatus}\n\n## Prediction\n\n${report.prediction || "No prediction recorded."}\n\n## Observations\n\n${report.observations || "No observations recorded."}\n\n## Equations\n\n${report.equations.map((item) => `- ${item}`).join("\n")}\n\n## Parameters\n\n\`\`\`json\n${JSON.stringify(report.parameters, null, 2)}\n\`\`\`\n\n## Results\n\n\`\`\`json\n${JSON.stringify(report.results, null, 2)}\n\`\`\`\n\n## Limitations\n\n${report.limitations.map((item) => `- ${item}`).join("\n")}\n`;
}

function download(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function Notebook({
  lab, prediction, observations, association, source, lastSuccessful, canAssociate, onPrediction, onObservations, onAssociate, report, onNotice,
}: {
  lab: LabId;
  prediction: string;
  observations: string;
  association: NotebookAssociation;
  source: "current" | "legacy" | "recovered";
  lastSuccessful: { parameters: LabParameters; ranAt: string } | null;
  canAssociate: boolean;
  onPrediction: (value: string) => void;
  onObservations: (value: string) => void;
  onAssociate: () => void;
  report: Report | null;
  onNotice: (notice: Notice) => void;
}) {
  const [retentionNotice, setRetentionNotice] = useState<Notice>(null);
  useEffect(() => setRetentionNotice(null), [lab]);
  const exportReport = (kind: "markdown" | "json") => {
    if (!report) return;
    const prepared = { ...report, reportCreatedAt: new Date().toISOString() };
    if (kind === "markdown") download(`${lab}-experiment.md`, reportMarkdown(prepared), "text/markdown");
    else download(`${lab}-experiment.json`, JSON.stringify(prepared, null, 2), "application/json");
  };
  const save = () => {
    try {
      const serialized = JSON.stringify(createNotebookRecord(lab, prediction, observations, association, lastSuccessful));
      const key = `metatransformer-simulation-notes:${lab}`;
      window.localStorage.setItem(key, serialized);
      if (window.localStorage.getItem(key) !== serialized) throw new Error("Saved data could not be verified.");
      const savedNotice: Notice = { kind: "success", text: `Notebook saved in this browser (${association === "bound" && lastSuccessful ? "bound to the recorded run" : "unbound draft"}). Do not use it for secrets.` };
      setRetentionNotice(savedNotice);
      onNotice(savedNotice);
    } catch {
      const failedNotice: Notice = { kind: "error", text: "This browser could not retain and verify the notebook. Keep this tab open or copy the notes before leaving." };
      setRetentionNotice(failedNotice);
      onNotice(failedNotice);
    }
  };
  return (
    <section className="sim-notebook" aria-labelledby="sim-notebook-heading">
      <div className="sim-section-heading"><span>03</span><div><p>Evidence</p><h2 id="sim-notebook-heading">Predict, observe, keep the mismatch</h2></div></div>
      <div className="sim-notebook__fields">
        <label><span>Prediction before running or testing</span><textarea value={prediction} maxLength={4000} onChange={(event) => onPrediction(event.target.value)} placeholder="What do you expect to change, by how much, and why?" /></label>
        <label><span>Observations notebook</span><textarea value={observations} maxLength={8000} onChange={(event) => onObservations(event.target.value)} placeholder="Record what the model showed and what real hardware later showed. Keep differences visible." /></label>
      </div>
      <div className={`sim-association is-${association}`} role="status">
        <div>
          <strong>{association === "bound" && lastSuccessful ? "Notes bound to a successful model run" : source !== "current" ? "Unbound legacy notes" : "Unbound notes"}</strong>
          <span>{association === "bound" && lastSuccessful ? `Associated with the run at ${new Date(lastSuccessful.ranAt).toLocaleString()}.` : source === "recovered" ? "The saved record could not be validated; its bounded text was recovered without attaching it to parameters or enabling report export." : "These notes are retained as evidence, but are not attached to model parameters and cannot be exported as a report."}</span>
        </div>
        {association === "unbound" && <button className="sim-button" type="button" disabled={!canAssociate} onClick={onAssociate}>Associate these notes with this successful run</button>}
      </div>
      <div className="sim-report-actions">
        <button className="sim-button" type="button" onClick={save}>Save notebook locally</button>
        <button className="sim-button" type="button" disabled={!report} onClick={() => exportReport("markdown")}>Download Markdown</button>
        <button className="sim-button" type="button" disabled={!report} onClick={() => exportReport("json")}>Download JSON</button>
      </div>
      {retentionNotice && <p className={`sim-retention is-${retentionNotice.kind}`} role={retentionNotice.kind === "error" ? "alert" : "status"}>{retentionNotice.text}</p>}
      <p className="sim-privacy">Notes stay in this browser only when you choose save. There is no backend and no secret storage; do not enter credentials or private keys.</p>
    </section>
  );
}

function RcLab({ run, input, setInput, onRun }: { run: Run<RcChargingOutput, RcChargingInput>; input: RcChargingInput; setInput: (input: RcChargingInput | ((current: RcChargingInput) => RcChargingInput)) => void; onRun: (result: SimulationResult<RcChargingOutput>, parameters: RcChargingInput) => void }) {
  const update = (key: keyof RcChargingInput, value: number) => setInput((current) => ({ ...current, [key]: value }));
  const reset = () => { const next = clone(rcDefaults); setInput(next); onRun(simulateRcCharging(next), next); };
  const dirty = !parametersEqual(input, run.parameters);
  return (
    <>
      <div className="sim-workspace">
        <section className="sim-controls" aria-labelledby="rc-input-heading">
          <div className="sim-section-heading"><span>01</span><div><p>Inputs</p><h2 id="rc-input-heading">Define one ideal RC step</h2></div></div>
          <div className="sim-fields">
            <NumericField label="Resistance" unit="Ω" value={input.resistanceOhms} min={0} onChange={(value) => update("resistanceOhms", value)} />
            <NumericField label="Capacitance" unit="µF" value={input.capacitanceMicrofarads} min={0} onChange={(value) => update("capacitanceMicrofarads", value)} />
            <NumericField label="Supply voltage" unit="V" value={input.supplyVoltageV} min={0} max={24} onChange={(value) => update("supplyVoltageV", value)} />
            <NumericField label="Initial voltage" unit="V" value={input.initialVoltageV} min={0} max={24} onChange={(value) => update("initialVoltageV", value)} />
            <NumericField label="Duration" unit="ms" value={input.durationMs} min={0} max={600000} onChange={(value) => update("durationMs", value)} />
          </div>
          <RunBar ranAt={run.ranAt} dirty={dirty} onRun={() => onRun(simulateRcCharging(input), input)} onReset={reset} />
        </section>
        <section className="sim-output" aria-labelledby="rc-output-heading">
          <div className="sim-section-heading"><span>02</span><div><p>Model output</p><h2 id="rc-output-heading">Exponential approach</h2></div></div>
          {!run.result.ok ? <ErrorBox errors={run.result.errors} /> : <>
            <RcGraph points={run.result.value.points} supplyVoltage={run.parameters.supplyVoltageV} />
            <ResultTable caption="RC calculation summary" rows={[
              ["Time constant, τ", format(run.result.value.tauSeconds), "s = R × C"],
              ["After 1τ", `${format(run.result.value.oneTauVoltageV)} V`, `${format(run.result.value.fractionOfStepAtOneTau * 100, 1)}% of the voltage step`],
              ["After 3τ", `${format(run.result.value.threeTauVoltageV)} V`, `${format(run.result.value.fractionOfStepAtThreeTau * 100, 1)}% of the voltage step`],
              ["Final voltage", format(run.result.value.finalVoltageV), "V"],
              ["Final stored energy", format(run.result.value.finalEnergyJ), "J = ½CV², with C in farads"],
            ]} />
            <details className="sim-data"><summary>Numeric graph data (5 representative points)</summary><ResultTable caption="Voltage and energy samples" rows={[0, 50, 100, 150, 200].map((index) => {
              const point = run.result.ok ? run.result.value.points[index]! : { timeMs: 0, voltageV: 0, energyJ: 0 };
              return [`${format(point.timeMs, 1)} ms`, format(point.voltageV), `${format(point.energyJ)} J`];
            })} /></details>
          </>}
        </section>
      </div>
      <ModelNotes assumptions={["V(t) = Vs + (V₀ − Vs)e^(−t/τ).", "τ = RC, with capacitance converted from µF to F.", "Exactly 201 evenly spaced samples include both endpoints."]} limitations={rcLimitations} />
    </>
  );
}

function MotorLab({ run, input, setInput, onRun }: { run: Run<DcMotorOutput, DcMotorInput>; input: DcMotorInput; setInput: (input: DcMotorInput | ((current: DcMotorInput) => DcMotorInput)) => void; onRun: (result: SimulationResult<DcMotorOutput>, parameters: DcMotorInput) => void }) {
  const update = (key: keyof DcMotorInput, value: number) => setInput((current) => ({ ...current, [key]: value }));
  const reset = () => { const next = clone(motorDefaults); setInput(next); onRun(calculateDcMotor(next), next); };
  const dirty = !parametersEqual(input, run.parameters);
  return (
    <>
      <div className="sim-workspace">
        <section className="sim-controls" aria-labelledby="motor-input-heading">
          <div className="sim-section-heading"><span>01</span><div><p>Explicit assumptions</p><h2 id="motor-input-heading">Enter one rated operating point</h2></div></div>
          <div className="sim-fields">
            <NumericField label="Supply / rating voltage" unit="V" value={input.supplyVoltageV} min={0} max={24} onChange={(value) => update("supplyVoltageV", value)} />
            <NumericField label="No-load speed" unit="rpm" value={input.noLoadRpm} min={0} onChange={(value) => update("noLoadRpm", value)} />
            <NumericField label="Stall torque" unit="N·m" value={input.stallTorqueNm} min={0} onChange={(value) => update("stallTorqueNm", value)} />
            <NumericField label="Stall current" unit="A" value={input.stallCurrentA} min={0} onChange={(value) => update("stallCurrentA", value)} />
            <NumericField label="No-load current" unit="A" value={input.noLoadCurrentA} min={0} onChange={(value) => update("noLoadCurrentA", value)} />
            <NumericField label="Requested output torque" unit="N·m" value={input.requestedLoadTorqueNm} min={0} onChange={(value) => update("requestedLoadTorqueNm", value)} />
            <NumericField label="Gear ratio" unit=": 1" value={input.gearRatio} min={1} onChange={(value) => update("gearRatio", value)} />
            <NumericField label="Gear efficiency" unit="0–1" value={input.gearEfficiency} min={0} max={1} step={0.01} onChange={(value) => update("gearEfficiency", value)} />
          </div>
          <RunBar ranAt={run.ranAt} dirty={dirty} onRun={() => onRun(calculateDcMotor(input), input)} onReset={reset} />
        </section>
        <section className="sim-output" aria-labelledby="motor-output-heading">
          <div className="sim-section-heading"><span>02</span><div><p>Model output</p><h2 id="motor-output-heading">Steady-state estimate</h2></div></div>
          {!run.result.ok ? <ErrorBox errors={run.result.errors} /> : <>
            <div className={`sim-status ${run.result.value.motorLossW < 0 ? "is-inconsistent" : `is-${run.result.value.status}`}`}><b>{run.result.value.motorLossW < 0 ? "Inconsistent ratings" : run.result.value.status === "stalled" ? "Stall predicted" : "Running point"}</b><span>{run.result.value.motorLossW < 0 ? "The diagnostic estimate produces more mechanical power than electrical input; this is not a valid normal motor point." : run.result.value.status === "stalled" ? "RPM forced to zero; stall current is a short-duration estimate." : "Within the entered linear torque range."}</span></div>
            <ResultTable caption="DC motor and gearbox calculation" rows={[
              ["Motor-shaft torque demand", format(run.result.value.motorTorqueDemandNm), "N·m = output torque ÷ ratio ÷ gear efficiency"],
              ["Motor speed", format(run.result.value.motorRpm), "rpm"],
              ["Output speed", format(run.result.value.outputRpm), "rpm"],
              ["Estimated current", format(run.result.value.currentA), "A"],
              ["Electrical input", format(run.result.value.electricalInputW), "W = V × I"],
              ["Motor mechanical power", format(run.result.value.motorMechanicalW), "W at motor shaft"],
              ["Gear output power", format(run.result.value.gearOutputW), "W = Tload × ωoutput"],
              ["Motor loss estimate", format(run.result.value.motorLossW), "W; negative means inconsistent assumptions"],
              ["Gear loss estimate", format(run.result.value.gearLossW), "W, kept separate from motor loss"],
              ["Total loss / input", run.result.value.totalLossRatio === null ? "Not calculated" : `${format(run.result.value.totalLossRatio * 100, 1)}%`, "(input − output) ÷ input"],
            ]} />
            <ul className="sim-warnings">{run.result.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </>}
        </section>
      </div>
      <ModelNotes assumptions={["Motor speed falls linearly from no-load speed to zero at stall torque.", "Current rises linearly from no-load current to stall current.", "The gearbox changes torque/speed using the entered ratio and efficiency."]} limitations={motorLimitations} />
    </>
  );
}

function PowerLab({ run, input, setInput, onRun }: { run: Run<PowerBudgetOutput, PowerBudgetInput>; input: PowerBudgetInput; setInput: (input: PowerBudgetInput | ((current: PowerBudgetInput) => PowerBudgetInput)) => void; onRun: (result: SimulationResult<PowerBudgetOutput>, parameters: PowerBudgetInput) => void }) {
  const update = (key: Exclude<keyof PowerBudgetInput, "loads">, value: number) => setInput((current) => ({ ...current, [key]: value }));
  const updateLoad = (index: number, key: keyof PowerBudgetInput["loads"][number], value: string | number) => setInput((current) => ({ ...current, loads: current.loads.map((load, loadIndex) => loadIndex === index ? { ...load, [key]: value } : load) }));
  const reset = () => { const next = clone(powerDefaults); setInput(next); onRun(calculatePowerBudget(next), next); };
  const dirty = !parametersEqual(input, run.parameters);
  return (
    <>
      <div className="sim-workspace">
        <section className="sim-controls" aria-labelledby="power-input-heading">
          <div className="sim-section-heading"><span>01</span><div><p>Source and loads</p><h2 id="power-input-heading">Budget energy before hardware</h2></div></div>
          <div className="sim-fields">
            <NumericField label="Source voltage" unit="V" value={input.sourceVoltage} min={0} onChange={(value) => update("sourceVoltage", value)} />
            <NumericField label="Nominal capacity" unit="Ah" value={input.capacityAh} min={0} onChange={(value) => update("capacityAh", value)} />
            <NumericField label="Usable fraction" unit="0–1" value={input.usableFraction} min={0} max={1} step={0.01} onChange={(value) => update("usableFraction", value)} />
            <NumericField label="Conversion efficiency" unit="0–1" value={input.conversionEfficiency} min={0} max={1} step={0.01} onChange={(value) => update("conversionEfficiency", value)} />
            <NumericField label="Source continuous rating" unit="A" value={input.sourceContinuousCurrentA} min={0} onChange={(value) => update("sourceContinuousCurrentA", value)} />
          </div>
          <div className="sim-loads">
            <div className="sim-loads__heading"><h3>Loads</h3><button type="button" onClick={() => setInput((current) => ({ ...current, loads: [...current.loads, { name: `Load ${current.loads.length + 1}`, voltage: 5, currentA: 0.1, quantity: 1, dutyCycle: 1, peakCurrentA: 0.1 }] }))}>Add load</button></div>
            {input.loads.map((load, index) => <fieldset key={index} className="sim-load">
              <legend>Load {index + 1}</legend>
              <label><span>Name</span><input value={load.name} onChange={(event) => updateLoad(index, "name", event.target.value)} /></label>
              <NumericField label="Voltage" unit="V" value={load.voltage} min={0} onChange={(value) => updateLoad(index, "voltage", value)} />
              <NumericField label="Nominal current" unit="A" value={load.currentA} min={0} onChange={(value) => updateLoad(index, "currentA", value)} />
              <NumericField label="Quantity" unit="count" value={load.quantity} min={1} step={1} onChange={(value) => updateLoad(index, "quantity", value)} />
              <NumericField label="Duty cycle" unit="0–1" value={load.dutyCycle} min={0} max={1} step={0.01} onChange={(value) => updateLoad(index, "dutyCycle", value)} />
              <NumericField label="Peak current each" unit="A" value={load.peakCurrentA} min={0} onChange={(value) => updateLoad(index, "peakCurrentA", value)} />
              <button type="button" className="sim-remove" onClick={() => setInput((current) => ({ ...current, loads: current.loads.filter((_, loadIndex) => loadIndex !== index) }))}>Remove load</button>
            </fieldset>)}
          </div>
          <RunBar ranAt={run.ranAt} dirty={dirty} onRun={() => onRun(calculatePowerBudget(input), input)} onReset={reset} />
        </section>
        <section className="sim-output" aria-labelledby="power-output-heading">
          <div className="sim-section-heading"><span>02</span><div><p>Model output</p><h2 id="power-output-heading">Energy and current check</h2></div></div>
          {!run.result.ok ? <ErrorBox errors={run.result.errors} /> : <>
            {(run.result.value.averageOverload || run.result.value.peakOverload) && <div className="sim-status is-stalled"><b>Source rating warning</b><span>{run.result.value.averageOverload ? "Average current exceeds the entered rating." : "The simultaneous peak estimate exceeds the entered continuous rating."}</span></div>}
            <ResultTable caption="Power budget summary" rows={[
              ["Average load power", format(run.result.value.averageLoadPowerW), "W = Σ(V × I × quantity × duty)"],
              ["Simultaneous peak load power", format(run.result.value.peakLoadPowerW), "W = Σ(V × Ipeak × quantity)"],
              ["Average source current", format(run.result.value.sourceAverageCurrentA), "A, including conversion loss"],
              ["Peak source current", format(run.result.value.sourcePeakCurrentA), "A, conservative simultaneous estimate"],
              ["Usable source energy", format(run.result.value.usableWh), "Wh = source V × Ah × usable fraction"],
              ["Estimated runtime", format(run.result.value.runtimeHours), run.result.value.runtimeHours === null ? "Zero average load" : "h = usable Wh ÷ source-side average W"],
            ]} />
            <div className="sim-table-wrap"><table className="sim-results-table"><caption>Per-load numeric breakdown</caption><thead><tr><th>Load</th><th>Average W</th><th>Peak W</th></tr></thead><tbody>{run.result.value.loads.map((load, index) => <tr key={`${load.name}-${index}`}><th>{load.name}</th><td>{format(load.averagePowerW)}</td><td>{format(load.peakPowerW)}</td></tr>)}</tbody></table></div>
            <ul className="sim-warnings">{run.result.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </>}
        </section>
      </div>
      <ModelNotes assumptions={["Each load's entered voltage and current describe its electrical power demand.", "Conversion efficiency applies once between the source and all loads.", "Runtime is an energy quotient; Ah is converted to Wh using source voltage."]} limitations={powerLimitations} />
    </>
  );
}

function GpioLab({ run, input, setInput, onRun }: { run: Run<GpioSimulationOutput, GpioParameters>; input: GpioParameters; setInput: (input: GpioParameters | ((current: GpioParameters) => GpioParameters)) => void; onRun: (result: SimulationResult<GpioSimulationOutput>, parameters: GpioParameters) => void }) {
  const reset = () => { const next = clone(gpioDefaults); setInput(next); onRun(runGpioModel(next), next); };
  const useExample = (kind: "blink" | "interlock") => {
    const next = kind === "blink" ? clone(gpioDefaults) : { programText: JSON.stringify(interlockProgram, null, 2), timelineText: JSON.stringify(interlockTimeline, null, 2), durationMs: 1_200 };
    setInput(next); onRun(runGpioModel(next), next);
  };
  const dirty = !parametersEqual(input, run.parameters);
  return (
    <>
      <div className="sim-workspace">
        <section className="sim-controls" aria-labelledby="gpio-input-heading">
          <div className="sim-section-heading"><span>01</span><div><p>Declarative JSON only</p><h2 id="gpio-input-heading">Describe states and input levels</h2></div></div>
          <div className="sim-example-buttons"><button type="button" onClick={() => useExample("blink")}>Load 500 ms blink</button><button type="button" onClick={() => useExample("interlock")}>Load button interlock</button></div>
          <label className="sim-code-field"><span>State-machine program</span><textarea spellCheck={false} value={input.programText} onChange={(event) => setInput((current) => ({ ...current, programText: event.target.value }))} /></label>
          <p className="sim-syntax">Supported syntax: <code>{`{ initialState, states: { NAME: { led, transitions: [{ to, afterMs } | { to, button }] } } }`}</code>. Each transition has exactly one condition.</p>
          <label className="sim-code-field is-short"><span>Button input timeline</span><textarea spellCheck={false} value={input.timelineText} onChange={(event) => setInput((current) => ({ ...current, timelineText: event.target.value }))} /></label>
          <p className="sim-syntax">Sorted unique entries: <code>{`[{ "atMs": 200, "button": true }]`}</code>. Button starts false; changes apply before transitions at that millisecond.</p>
          <NumericField label="Simulation duration" unit="ms" value={input.durationMs} min={0} max={10000} step={1} onChange={(value) => setInput((current) => ({ ...current, durationMs: value }))} />
          <RunBar ranAt={run.ranAt} dirty={dirty} onRun={() => onRun(runGpioModel(input), input)} onReset={reset} />
        </section>
        <section className="sim-output" aria-labelledby="gpio-output-heading">
          <div className="sim-section-heading"><span>02</span><div><p>Model output</p><h2 id="gpio-output-heading">Deterministic 1 ms trace</h2></div></div>
          {!run.result.ok ? <ErrorBox errors={run.result.errors} /> : <>
            <GpioGraph samples={run.result.value.samples} />
            <ResultTable caption="Simulation summary" rows={[
              ["Samples", run.result.value.samples.length, "one sample per ms, including t = 0"],
              ["Transitions", run.result.value.events.length, "first matching transition per step"],
              ["Final state", run.result.value.samples.at(-1)?.state ?? "—", "state name"],
              ["Final button", String(run.result.value.samples.at(-1)?.button ?? false), "logic level"],
              ["Final LED", String(run.result.value.samples.at(-1)?.led ?? false), "modeled output only"],
            ]} />
            <div className="sim-table-wrap"><table className="sim-results-table"><caption>Exact transition events (numeric fallback)</caption><thead><tr><th>Time</th><th>From → to</th><th>Condition</th><th>Button</th><th>LED</th></tr></thead><tbody>{run.result.value.events.length ? run.result.value.events.map((event, index) => <tr key={`${event.timeMs}-${index}`}><td>{event.timeMs} ms</td><td>{event.from} → {event.to}</td><td>{event.condition}</td><td>{String(event.button)}</td><td>{String(event.led)}</td></tr>) : <tr><td colSpan={5}>No transitions occurred.</td></tr>}</tbody></table></div>
          </>}
        </section>
      </div>
      <ModelNotes assumptions={["The input is parsed as data with JSON.parse; it is never evaluated as code.", "Timeline changes occur before transition matching at the same timestamp.", "State elapsed time resets on transition, and transition-array order is deterministic priority."]} limitations={gpioLimitations} />
    </>
  );
}

export default function SimulationLab({ initialLab }: { initialLab?: string }) {
  const validInitial = LAB_IDS.includes(initialLab as LabId) ? initialLab as LabId : "rc-transient";
  const [lab, setLab] = useState<LabId>(validInitial);
  const [notice, setNotice] = useState<Notice>(null);
  const [predictions, setPredictions] = useState<Record<LabId, string>>({ "rc-transient": "", "dc-motor": "", "power-budget": "", "gpio-state-machine": "" });
  const [observations, setObservations] = useState<Record<LabId, string>>({ "rc-transient": "", "dc-motor": "", "power-budget": "", "gpio-state-machine": "" });
  const [associations, setAssociations] = useState<Record<LabId, NotebookAssociation>>({ "rc-transient": "unbound", "dc-motor": "unbound", "power-budget": "unbound", "gpio-state-machine": "unbound" });
  const [notebookSources, setNotebookSources] = useState<Record<LabId, "current" | "legacy" | "recovered">>({ "rc-transient": "current", "dc-motor": "current", "power-budget": "current", "gpio-state-machine": "current" });
  const [rcInput, setRcInput] = useState<RcChargingInput>(() => clone(rcDefaults));
  const [motorInput, setMotorInput] = useState<DcMotorInput>(() => clone(motorDefaults));
  const [powerInput, setPowerInput] = useState<PowerBudgetInput>(() => clone(powerDefaults));
  const [gpioInput, setGpioInput] = useState<GpioParameters>(() => clone(gpioDefaults));
  const [rcRun, setRcRun] = useState(() => defaultRun(simulateRcCharging(rcDefaults), rcDefaults));
  const [motorRun, setMotorRun] = useState(() => defaultRun(calculateDcMotor(motorDefaults), motorDefaults));
  const [powerRun, setPowerRun] = useState(() => defaultRun(calculatePowerBudget(powerDefaults), powerDefaults));
  const [gpioRun, setGpioRun] = useState(() => defaultRun(runGpioModel(gpioDefaults), gpioDefaults));
  const [rcLastSuccessful, setRcLastSuccessful] = useState<Run<RcChargingOutput, RcChargingInput> | null>(null);
  const [motorLastSuccessful, setMotorLastSuccessful] = useState<Run<DcMotorOutput, DcMotorInput> | null>(null);
  const [powerLastSuccessful, setPowerLastSuccessful] = useState<Run<PowerBudgetOutput, PowerBudgetInput> | null>(null);
  const [gpioLastSuccessful, setGpioLastSuccessful] = useState<Run<GpioSimulationOutput, GpioParameters> | null>(null);

  const runRc = (result: SimulationResult<RcChargingOutput>, parameters: RcChargingInput) => {
    const next = nowRun(result, parameters);
    setRcRun(next);
    if (result.ok) {
      setAssociations((current) => ({ ...current, "rc-transient": notebookSources["rc-transient"] === "current" ? associationAfterSuccessfulRun(current["rc-transient"], observations["rc-transient"], rcLastSuccessful?.parameters ?? null, parameters) : "unbound" }));
      setRcLastSuccessful(next);
    }
  };
  const runMotor = (result: SimulationResult<DcMotorOutput>, parameters: DcMotorInput) => {
    const next = nowRun(result, parameters);
    setMotorRun(next);
    if (result.ok) {
      setAssociations((current) => ({ ...current, "dc-motor": notebookSources["dc-motor"] === "current" ? associationAfterSuccessfulRun(current["dc-motor"], observations["dc-motor"], motorLastSuccessful?.parameters ?? null, parameters) : "unbound" }));
      setMotorLastSuccessful(next);
    }
  };
  const runPower = (result: SimulationResult<PowerBudgetOutput>, parameters: PowerBudgetInput) => {
    const next = nowRun(result, parameters);
    setPowerRun(next);
    if (result.ok) {
      setAssociations((current) => ({ ...current, "power-budget": notebookSources["power-budget"] === "current" ? associationAfterSuccessfulRun(current["power-budget"], observations["power-budget"], powerLastSuccessful?.parameters ?? null, parameters) : "unbound" }));
      setPowerLastSuccessful(next);
    }
  };
  const runGpio = (result: SimulationResult<GpioSimulationOutput>, parameters: GpioParameters) => {
    const next = nowRun(result, parameters);
    setGpioRun(next);
    if (result.ok) {
      setAssociations((current) => ({ ...current, "gpio-state-machine": notebookSources["gpio-state-machine"] === "current" ? associationAfterSuccessfulRun(current["gpio-state-machine"], observations["gpio-state-machine"], gpioLastSuccessful?.parameters ?? null, parameters) : "unbound" }));
      setGpioLastSuccessful(next);
    }
  };

  useEffect(() => {
    const loadedPredictions: Partial<Record<LabId, string>> = {};
    const loadedObservations: Partial<Record<LabId, string>> = {};
    const loadedAssociations: Partial<Record<LabId, NotebookAssociation>> = {};
    const loadedSources: Partial<Record<LabId, "current" | "legacy" | "recovered">> = {};
    const issues: string[] = [];
    for (const id of LAB_IDS) {
      try {
        const stored = window.localStorage.getItem(`metatransformer-simulation-notes:${id}`);
        if (!stored) continue;
        const parsed = parseNotebookStorage(stored, id);
        if (!parsed.ok) {
          if (parsed.salvagedText) {
            loadedPredictions[id] = parsed.salvagedText.prediction;
            loadedObservations[id] = parsed.salvagedText.observations;
            loadedAssociations[id] = "unbound";
            loadedSources[id] = "recovered";
          }
          issues.push(`${labInfo[id].title}: ${parsed.error}`);
          continue;
        }
        loadedPredictions[id] = parsed.value.prediction;
        loadedObservations[id] = parsed.value.observations;
        loadedAssociations[id] = parsed.value.association;
        loadedSources[id] = parsed.value.source === "legacy" ? "legacy" : "current";
        const restored = parsed.value.run;
        if (!restored) continue;
        if (restored.labId === "rc-transient") {
          setRcInput(clone(restored.parameters)); setRcRun(restored); setRcLastSuccessful(restored);
        } else if (restored.labId === "dc-motor") {
          setMotorInput(clone(restored.parameters)); setMotorRun(restored); setMotorLastSuccessful(restored);
        } else if (restored.labId === "power-budget") {
          setPowerInput(clone(restored.parameters)); setPowerRun(restored); setPowerLastSuccessful(restored);
        } else {
          setGpioInput(clone(restored.parameters)); setGpioRun(restored); setGpioLastSuccessful(restored);
        }
      } catch {
        issues.push(`${labInfo[id].title}: browser storage could not be read.`);
      }
    }
    setPredictions((current) => ({ ...current, ...loadedPredictions }));
    setObservations((current) => ({ ...current, ...loadedObservations }));
    setAssociations((current) => ({ ...current, ...loadedAssociations }));
    setNotebookSources((current) => ({ ...current, ...loadedSources }));
    if (issues.length) setNotice({ kind: "error", text: `Some saved notebook data was left unbound: ${issues.join(" ")}` });
  }, []);

  const report = useMemo<Report | null>(() => {
    if (associations[lab] !== "bound") return null;
    const base = {
      lab: labInfo[lab].title,
      reportCreatedAt: new Date().toISOString(),
      notesAssociation: "bound-to-model-run" as const,
      modelFidelity: "Bounded educational estimate; not electrical certification or a component-specific prediction.",
      hardwareStatus: "Untested hardware. No physical build or safety rating has been validated by this simulation.",
      prediction: predictions[lab],
      observations: observations[lab],
    };
    if (lab === "rc-transient" && rcLastSuccessful?.result.ok && parametersEqual(rcInput, rcLastSuccessful.parameters)) return { ...base, modelRanAt: rcLastSuccessful.ranAt, equations: ["tau_seconds = resistance_ohms × capacitance_microfarads × 10^-6", "V(t) = Vs + (V0 - Vs) × exp(-t/tau)", "energy_joules = 0.5 × capacitance_farads × voltage²"], parameters: rcLastSuccessful.parameters, results: rcLastSuccessful.result.value, limitations: rcLimitations };
    if (lab === "dc-motor" && motorLastSuccessful?.result.ok && parametersEqual(motorInput, motorLastSuccessful.parameters)) return { ...base, modelRanAt: motorLastSuccessful.ranAt, equations: ["motor_torque_demand = load_torque / (gear_ratio × gear_efficiency)", "rpm = no_load_rpm × (1 - demand/stall_torque)", "current = no_load_current + (stall_current - no_load_current) × demand/stall_torque", "power = torque × rpm × 2π/60"], parameters: motorLastSuccessful.parameters, results: motorLastSuccessful.result.value, limitations: motorLimitations };
    if (lab === "power-budget" && powerLastSuccessful?.result.ok && parametersEqual(powerInput, powerLastSuccessful.parameters)) return { ...base, modelRanAt: powerLastSuccessful.ranAt, equations: ["average_load_W = Σ(voltage × current × quantity × duty_cycle)", "peak_load_W = Σ(voltage × peak_current × quantity)", "usable_Wh = source_voltage × capacity_Ah × usable_fraction", "runtime_h = usable_Wh / (average_load_W / conversion_efficiency)"], parameters: powerLastSuccessful.parameters, results: powerLastSuccessful.result.value, limitations: powerLimitations };
    if (lab === "gpio-state-machine" && gpioLastSuccessful?.result.ok && parametersEqual(gpioInput, gpioLastSuccessful.parameters)) return { ...base, modelRanAt: gpioLastSuccessful.ranAt, equations: ["next_state = first transition whose one condition matches", "state_elapsed_ms = time_ms - state_entry_time_ms", "timeline input changes apply before transition checks"], parameters: gpioLastSuccessful.parameters, results: { events: gpioLastSuccessful.result.value.events, finalSample: gpioLastSuccessful.result.value.samples.at(-1), sampleCount: gpioLastSuccessful.result.value.samples.length }, limitations: gpioLimitations };
    return null;
  }, [lab, predictions, observations, associations, rcInput, motorInput, powerInput, gpioInput, rcLastSuccessful, motorLastSuccessful, powerLastSuccessful, gpioLastSuccessful]);

  const lastSuccessful = lab === "rc-transient" ? rcLastSuccessful
    : lab === "dc-motor" ? motorLastSuccessful
      : lab === "power-budget" ? powerLastSuccessful
        : gpioLastSuccessful;
  const currentInput: LabParameters = lab === "rc-transient" ? rcInput
    : lab === "dc-motor" ? motorInput
      : lab === "power-budget" ? powerInput
        : gpioInput;
  const canAssociate = Boolean(lastSuccessful && parametersEqual(currentInput, lastSuccessful.parameters));
  const associateCurrentNotes = () => {
    if (!canAssociate) return;
    setAssociations((current) => ({ ...current, [lab]: "bound" }));
    setNotebookSources((current) => ({ ...current, [lab]: "current" }));
    setNotice({ kind: "success", text: "Notes are now associated with the current successful run. Save the notebook to retain this association in the browser." });
  };

  return (
    <div className="sim-shell">
      <header className="sim-header">
        <Link className="sim-brand" href="/"><span>MT</span><strong>Simulation labs</strong></Link>
        <nav aria-label="Lab navigation"><Link href="/learn">Academy</Link><Link href={`/learn?lesson=${labInfo[lab].lesson}`}>Related lesson</Link><Link href="/">Workshop</Link></nav>
      </header>
      {notice && <div className={`sim-notice is-${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}><span>{notice.text}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}>×</button></div>}
      <main>
        <section className="sim-hero">
          <div><span className="sim-eyebrow">Bounded teaching models · hardware untested</span><h1>Make a prediction.<br />Interrogate the model.</h1><p>These labs expose their equations and omissions. They help you reason before a bench test; they do not select parts, certify a circuit, or replace measurements and datasheets.</p></div>
          <aside><b>Operating boundary</b><p>Finite inputs only. No backend, arbitrary code execution, component database, or hidden hardware assumptions.</p></aside>
        </section>
        <nav className="sim-tabs" aria-label="Choose a simulation lab">
          {LAB_IDS.map((id, index) => <button key={id} type="button" className={lab === id ? "is-active" : ""} aria-pressed={lab === id} onClick={() => { setLab(id); setNotice(null); }}><span>0{index + 1}</span><b>{labInfo[id].title}</b><small>{labInfo[id].kicker}</small></button>)}
        </nav>
        <article className="sim-lab">
          <header className="sim-lab__title"><div><span className="sim-eyebrow">Current lab</span><h2>{labInfo[lab].title}</h2></div><Link href={`/learn?lesson=${labInfo[lab].lesson}`}>Read the supporting lesson →</Link></header>
          {lab === "rc-transient" && <RcLab run={rcRun} input={rcInput} setInput={setRcInput} onRun={runRc} />}
          {lab === "dc-motor" && <MotorLab run={motorRun} input={motorInput} setInput={setMotorInput} onRun={runMotor} />}
          {lab === "power-budget" && <PowerLab run={powerRun} input={powerInput} setInput={setPowerInput} onRun={runPower} />}
          {lab === "gpio-state-machine" && <GpioLab run={gpioRun} input={gpioInput} setInput={setGpioInput} onRun={runGpio} />}
          <Notebook lab={lab} prediction={predictions[lab]} observations={observations[lab]} association={associations[lab]} source={notebookSources[lab]} lastSuccessful={lastSuccessful} canAssociate={canAssociate} onPrediction={(value) => setPredictions((current) => ({ ...current, [lab]: value }))} onObservations={(value) => setObservations((current) => ({ ...current, [lab]: value }))} onAssociate={associateCurrentNotes} report={report} onNotice={setNotice} />
        </article>
      </main>
      <footer className="sim-footer"><p>Educational models only. Record real measurements separately and stop hardware tests on heat, odor, unexpected motion, or damaged insulation.</p><div><Link href="/learn">All lessons</Link><Link href="/">Back to workshop</Link></div></footer>
    </div>
  );
}
