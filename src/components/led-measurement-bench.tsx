"use client";

import "./led-measurement-bench.css";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import {
  EMPTY_LED_DRAFT,
  evaluateLedMeasurement,
  makeLedMeasurementRecord,
  parseLedDraft,
} from "@/lib/led-measurement";
import type { LedMeasurementDraft } from "@/lib/led-measurement";

const STORAGE_KEY = "metatransformer:led-measurement:v1";

const LIMITATIONS = [
  "Current is inferred from the resistor voltage using V/R, not measured directly.",
  "Power is conditional on steady DC across an ohmic resistor. Squaring an averaged voltage does not establish average heating power for pulses or flicker.",
  "The nominal LED forward voltage is not guaranteed for the installed part or operating conditions.",
  "User-entered input has not been independently verified and meter calibration has not been confirmed.",
  "This model applies only to the USB-powered original Raspberry Pi Pico, LED 297, and 1 kΩ resistor 4294 route.",
];

type PersistenceState = "idle" | "saved" | "failed" | "invalid";

function displayText(value: string): string {
  return value.trim() || "Not recorded";
}

function displayState(value: LedMeasurementDraft["command"] | LedMeasurementDraft["light"]): string {
  if (value === "unknown") return "Not recorded";
  return value === "on" ? "On" : value === "off" ? "Off" : "Flickering";
}

function formatMeasurement(value: number): string {
  return Number(value.toPrecision(6)).toString();
}

export default function LedMeasurementBench() {
  const [draft, setDraft] = useState<LedMeasurementDraft>(EMPTY_LED_DRAFT);
  const [attempted, setAttempted] = useState(false);
  const [hasCalculatedValid, setHasCalculatedValid] = useState(false);
  const [reviewedDraft, setReviewedDraft] = useState<string | null>(null);
  const [persistence, setPersistence] = useState<PersistenceState>("idle");
  const [storageMessage, setStorageMessage] = useState("");
  const [exportError, setExportError] = useState("");

  const evaluation = useMemo(() => evaluateLedMeasurement(draft), [draft]);
  const reportReady = hasCalculatedValid && evaluation.ok;
  const exportReady = reportReady && reviewedDraft === JSON.stringify(draft);

  useEffect(() => {
    let stored: string | null;

    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      setPersistence("failed");
      setStorageMessage("Draft is not saved. Copy your entries before leaving, or download a record once the required measurements are valid.");
      return;
    }

    if (stored === null) return;

    try {
      const parsed = parseLedDraft(JSON.parse(stored));
      if (parsed === null) {
        setPersistence("invalid");
        setStorageMessage("The saved draft has an invalid shape. It was left untouched and was not loaded; your next edit will replace it.");
        return;
      }

      setDraft(parsed);
      setPersistence("saved");
      setStorageMessage("Draft saved in this browser.");
    } catch {
      setPersistence("invalid");
      setStorageMessage("The saved draft could not be read. It was left untouched and was not loaded; your next edit will replace it.");
    }
  }, []);

  useEffect(() => {
    if (persistence !== "failed") return;

    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [persistence]);

  const updateField = <Key extends keyof LedMeasurementDraft>(
    field: Key,
    value: LedMeasurementDraft[Key],
  ) => {
    const nextDraft = { ...draft, [field]: value };
    setDraft(nextDraft);
    setExportError("");

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDraft));
      setPersistence("saved");
      setStorageMessage("Draft saved in this browser.");
    } catch {
      setPersistence("failed");
      setStorageMessage("Draft is not saved. Copy your entries before leaving, or download a record once the required measurements are valid.");
    }
  };

  const confirmUnsavedNavigation = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      persistence === "failed" &&
      !window.confirm("This draft is not saved in this browser. Leave this page anyway?")
    ) {
      event.preventDefault();
    }
  };

  const calculateRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
    if (evaluation.ok) setHasCalculatedValid(true);
    setReviewedDraft(evaluation.ok ? JSON.stringify(draft) : null);
    setExportError("");
  };

  const downloadRecord = () => {
    if (!exportReady) return;

    try {
      const record = makeLedMeasurementRecord(draft, new Date().toISOString());
      const blob = new Blob([JSON.stringify(record, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "led-measurement-record.json";
      document.body.appendChild(anchor);

      try {
        anchor.click();
      } finally {
        anchor.remove();
        URL.revokeObjectURL(url);
      }
    } catch {
      setExportError("The record could not be downloaded. Check the entries and try again.");
    }
  };

  const printRecord = () => {
    if (!exportReady) return;

    try {
      window.print();
    } catch {
      setExportError("The print dialog could not be opened. Try your browser’s print command.");
    }
  };

  const handleTextChange =
    (field: keyof Pick<LedMeasurementDraft, "resistanceOhm" | "voltageV" | "observedAt" | "partIdentity" | "meter" | "notes">) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateField(field, event.target.value);
    };

  return (
    <div className="led-bench-shell">
      <header className="led-bench-header">
        <Link className="led-bench-brand" href="/" onClick={confirmUnsavedNavigation}>
          <span className="led-bench-brand-mark" aria-hidden="true">LED</span>
          Workshop
        </Link>
        <nav className="led-bench-nav" aria-label="LED bench navigation">
          <Link href="/build-guides/sensor-led" onClick={confirmUnsavedNavigation}>Build guide</Link>
          <Link href="/labs/hysteresis" onClick={confirmUnsavedNavigation}>Hysteresis lab</Link>
        </nav>
      </header>

      <main className="led-bench-main">
        <section className="led-bench-intro" aria-labelledby="led-bench-title">
          <div className="led-bench-intro-copy">
            <p className="led-bench-eyebrow">Bench worksheet · original sensor LED route</p>
            <h1 id="led-bench-title">Measure the LED circuit</h1>
            <p className="led-bench-lede">
              Record two meter readings, then derive current and resistor power without placing an ammeter across the circuit. This worksheet stores drafts only in this browser and sends no measurements anywhere.
            </p>
          </div>
          <aside className="led-bench-verification" aria-label="Verification status">
            <span className="led-bench-verification-dot" aria-hidden="true" />
            <strong>No observations verified</strong>
            <p>All values remain user-entered and unverified.</p>
          </aside>
        </section>

        <section className="led-bench-probe-instructions" aria-labelledby="led-bench-probe-title">
          <div className="led-bench-section-heading">
            <span className="led-bench-step-number">01</span>
            <div className="led-bench-heading-copy">
              <p>Set up the meter safely</p>
              <h2 id="led-bench-probe-title">Probe the resistor, not the supply</h2>
            </div>
          </div>

          <figure className="led-bench-schematic">
            <svg className="led-bench-schematic-svg" viewBox="0 0 920 180" role="img" aria-labelledby="led-bench-schematic-title led-bench-schematic-desc">
              <title id="led-bench-schematic-title">LED measurement schematic</title>
              <desc id="led-bench-schematic-desc">Node A at Pico GP2 physical pin 4 connects through a 1 kiloohm resistor to node B at the LED anode. The LED cathode connects to node C at ground physical pin 3.</desc>
              <line className="led-bench-wire" x1="92" y1="90" x2="212" y2="90" />
              <polyline className="led-bench-resistor" points="212,90 232,66 260,114 288,66 316,114 344,66 364,90" />
              <line className="led-bench-wire" x1="364" y1="90" x2="494" y2="90" />
              <polygon className="led-bench-led-triangle" points="528,54 528,126 598,90" />
              <line className="led-bench-led-bar" x1="612" y1="50" x2="612" y2="130" />
              <line className="led-bench-wire" x1="494" y1="90" x2="528" y2="90" />
              <line className="led-bench-wire" x1="612" y1="90" x2="820" y2="90" />
              <circle className="led-bench-node" cx="92" cy="90" r="10" />
              <circle className="led-bench-node" cx="494" cy="90" r="10" />
              <circle className="led-bench-node" cx="820" cy="90" r="10" />
              <text className="led-bench-node-label" x="92" y="34" textAnchor="middle">A · GP2 · physical 4</text>
              <text className="led-bench-component-label" x="288" y="38" textAnchor="middle">1 kΩ resistor</text>
              <text className="led-bench-node-label" x="494" y="158" textAnchor="middle">B · LED anode</text>
              <text className="led-bench-component-label" x="570" y="38" textAnchor="middle">LED</text>
              <text className="led-bench-node-label" x="820" y="34" textAnchor="middle">C · GND · physical 3</text>
            </svg>
            <p className="led-bench-schematic-path">A · GP2 physical 4 → 1 kΩ resistor → B · LED anode → LED cathode → C · GND physical 3</p>
            <figcaption className="led-bench-schematic-caption">
              A and B are the opposite ends of the resistor; B is also the LED anode connection. This is an electrical schematic, not a physical breadboard layout.
            </figcaption>
          </figure>

          <ol className="led-bench-instruction-list">
            <li className="led-bench-instruction">
              <span className="led-bench-instruction-index">1</span>
              <div className="led-bench-instruction-copy">
                <h3>Measure the isolated resistor first</h3>
                <p>Unplug USB. Set the meter to resistance (Ω), then measure R before installing it. If it is already installed, lift one resistor end so it is isolated. Resistance and continuity modes must never be used on a powered circuit.</p>
              </div>
            </li>
            <li className="led-bench-instruction">
              <span className="led-bench-instruction-index">2</span>
              <div className="led-bench-instruction-copy">
                <h3>Inspect the intact circuit</h3>
                <p>Reconnect the resistor and inspect the original Pico / LED 297 / resistor 4294 route against the <Link href="/build-guides/sensor-led" onClick={confirmUnsavedNavigation}>sensor LED build guide</Link>. Do not measure voltage until the intended circuit is intact.</p>
              </div>
            </li>
            <li className="led-bench-instruction">
              <span className="led-bench-instruction-index">3</span>
              <div className="led-bench-instruction-copy">
                <h3>Measure voltage across the resistor</h3>
                <p>Use high-impedance V/DC mode. Put the black lead in COM and the red lead in the V socket—not a current jack. With red on A and black on B, read the voltage across the resistor, not across GPIO and GND.</p>
              </div>
            </li>
            <li className="led-bench-instruction">
              <span className="led-bench-instruction-index">4</span>
              <div className="led-bench-instruction-copy">
                <h3>Move clips only while unpowered</h3>
                <p>When possible, place clips with USB unplugged, then connect USB for the voltage reading so a probe cannot bridge adjacent pins. Remove USB again before moving any wire or clip.</p>
              </div>
            </li>
          </ol>

          <div className="led-bench-danger-note">
            <strong>Do not place an ammeter across the circuit.</strong>
            <span>This worksheet derives current from the measured resistor voltage and resistance.</span>
          </div>
        </section>

        <section className="led-bench-entry" aria-labelledby="led-bench-entry-title">
          <div className="led-bench-section-heading">
            <span className="led-bench-step-number">02</span>
            <div className="led-bench-heading-copy">
              <p>Enter what you observed</p>
              <h2 id="led-bench-entry-title">Create the measurement record</h2>
            </div>
          </div>

          <form className="led-bench-form" onSubmit={calculateRecord} noValidate>
            <div className="led-bench-form-grid">
              <label className="led-bench-field">
                <span className="led-bench-label">Measured resistance (Ω)</span>
                <input
                  className="led-bench-input"
                  type="text"
                  inputMode="decimal"
                  maxLength={100}
                  value={draft.resistanceOhm}
                  onChange={handleTextChange("resistanceOhm")}
                />
              </label>
              <label className="led-bench-field">
                <span className="led-bench-label">Resistor voltage (V)</span>
                <input
                  className="led-bench-input"
                  type="text"
                  inputMode="decimal"
                  maxLength={100}
                  value={draft.voltageV}
                  onChange={handleTextChange("voltageV")}
                />
              </label>
              <label className="led-bench-field">
                <span className="led-bench-label">Observation date/time</span>
                <span className="led-bench-field-hint">Free text, in your timezone</span>
                <input
                  className="led-bench-input"
                  type="text"
                  maxLength={200}
                  value={draft.observedAt}
                  onChange={handleTextChange("observedAt")}
                />
              </label>
              <label className="led-bench-field">
                <span className="led-bench-label">Part identity</span>
                <input
                  className="led-bench-input"
                  type="text"
                  maxLength={500}
                  value={draft.partIdentity}
                  onChange={handleTextChange("partIdentity")}
                />
              </label>
              <label className="led-bench-field">
                <span className="led-bench-label">Meter and range</span>
                <input
                  className="led-bench-input"
                  type="text"
                  maxLength={500}
                  value={draft.meter}
                  onChange={handleTextChange("meter")}
                />
              </label>
              <label className="led-bench-field">
                <span className="led-bench-label">Commanded LED</span>
                <select
                  className="led-bench-select"
                  aria-label="Commanded LED"
                  value={draft.command}
                  onChange={(event) => updateField("command", event.target.value as LedMeasurementDraft["command"])}
                >
                  <option value="unknown">Unknown</option>
                  <option value="on">On</option>
                  <option value="off">Off</option>
                </select>
              </label>
              <label className="led-bench-field">
                <span className="led-bench-label">Observed light</span>
                <select
                  className="led-bench-select"
                  aria-label="Observed light"
                  value={draft.light}
                  onChange={(event) => updateField("light", event.target.value as LedMeasurementDraft["light"])}
                >
                  <option value="unknown">Unknown</option>
                  <option value="on">On</option>
                  <option value="off">Off</option>
                  <option value="flickering">Flickering</option>
                </select>
              </label>
              <label className="led-bench-field led-bench-field-wide">
                <span className="led-bench-label">Bench notes</span>
                <textarea
                  className="led-bench-textarea"
                  maxLength={5000}
                  rows={5}
                  aria-label="Bench notes"
                  value={draft.notes}
                  onChange={handleTextChange("notes")}
                />
              </label>
            </div>

            <div className={`led-bench-save-status led-bench-save-status-${persistence}`} role="status" aria-live="polite">
              {storageMessage || "Your first edit will save this draft in this browser."}
            </div>

            {attempted && !evaluation.ok && (
              <div className="led-bench-errors" role="alert">
                <strong>Complete the readings before creating a record.</strong>
                <ul className="led-bench-error-list">
                  {evaluation.errors.map((error) => <li key={error}>{error}</li>)}
                </ul>
              </div>
            )}

            <div className="led-bench-actions">
              <button className="led-bench-button led-bench-button-primary" type="submit">Calculate record</button>
              <button className="led-bench-button" type="button" disabled={!exportReady} onClick={downloadRecord}>Download record JSON</button>
              <button className="led-bench-button" type="button" disabled={!exportReady} onClick={printRecord}>Print / Save PDF</button>
            </div>
            {reportReady && !exportReady && (
              <p className="led-bench-review-needed" role="status">Select Calculate record to review this version before export.</p>
            )}
            {exportError && <p className="led-bench-export-error" role="alert">{exportError}</p>}
          </form>
        </section>

        {reportReady && (
          <section className="led-bench-record" aria-labelledby="led-bench-record-title">
            <div className="led-bench-record-heading">
              <div>
                <p className="led-bench-eyebrow">Portable measurement record</p>
                <h2 id="led-bench-record-title">LED circuit observation</h2>
              </div>
              <span className="led-bench-provenance">User-entered, unverified</span>
            </div>

            <dl className="led-bench-record-grid">
              <div className="led-bench-record-item"><dt>Measured resistance</dt><dd>{draft.resistanceOhm.trim()} Ω</dd></div>
              <div className="led-bench-record-item"><dt>Resistor voltage</dt><dd>{draft.voltageV.trim()} V</dd></div>
              <div className="led-bench-record-item led-bench-record-derived"><dt>Inferred current</dt><dd>{formatMeasurement(evaluation.currentMa)} mA</dd></div>
              <div className="led-bench-record-item led-bench-record-derived"><dt>Resistor power (steady DC)</dt><dd>{formatMeasurement(evaluation.powerMw)} mW</dd></div>
              <div className="led-bench-record-item"><dt>Observation date/time</dt><dd>{displayText(draft.observedAt)}</dd></div>
              <div className="led-bench-record-item"><dt>Part identity</dt><dd>{displayText(draft.partIdentity)}</dd></div>
              <div className="led-bench-record-item"><dt>Meter and range</dt><dd>{displayText(draft.meter)}</dd></div>
              <div className="led-bench-record-item"><dt>Commanded LED</dt><dd>{displayState(draft.command)}</dd></div>
              <div className="led-bench-record-item"><dt>Observed light</dt><dd>{displayState(draft.light)}</dd></div>
              <div className="led-bench-record-item led-bench-record-item-wide"><dt>Bench notes</dt><dd>{displayText(draft.notes)}</dd></div>
            </dl>

            <div className="led-bench-record-notice">
              <strong>Derived, not directly measured</strong>
              <p>Current and power are calculated from the entered resistor voltage and resistance. Their displayed precision does not make the inferred current an exact measurement.</p>
            </div>

            <div className="led-bench-record-columns">
              <div className="led-bench-record-list-block">
                <h3>Warnings</h3>
                {evaluation.warnings.length > 0 ? (
                  <ul className="led-bench-record-list">
                    {evaluation.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                ) : <p>No model warnings for these entries.</p>}
              </div>
              <div className="led-bench-record-list-block">
                <h3>Limits of this record</h3>
                <ul className="led-bench-record-list">
                  {LIMITATIONS.map((limitation) => <li key={limitation}>{limitation}</li>)}
                </ul>
              </div>
            </div>
          </section>
        )}

        {!reportReady && (
          <section className="led-bench-print-empty" aria-label="No completed measurement record">
            <h2>No completed measurement record</h2>
            <p>This printout contains instructions and nominal reference assumptions only. No valid user observation was calculated.</p>
          </section>
        )}

        <section className="led-bench-nominal" aria-labelledby="led-bench-nominal-title">
          <div className="led-bench-nominal-heading">
            <p className="led-bench-eyebrow">Estimated reference only</p>
            <h2 id="led-bench-nominal-title">Nominal assumptions</h2>
          </div>
          <div className="led-bench-nominal-values">
            <span className="led-bench-nominal-value"><strong>3.3 V</strong> output</span>
            <span className="led-bench-nominal-value"><strong>2.0 V</strong> LED drop</span>
            <span className="led-bench-nominal-value"><strong>1 kΩ</strong> resistor</span>
            <span className="led-bench-nominal-value"><strong>1.3 mA</strong> estimated current</span>
            <span className="led-bench-nominal-value"><strong>1.69 mW</strong> estimated resistor power</span>
          </div>
          <p className="led-bench-nominal-note">
            These assumptions stay separate from your observations and never replace them. A published LED forward voltage is commonly specified at 20 mA, not at this estimated low current, so 2.0 V is only a reference assumption here.
          </p>
        </section>
      </main>
    </div>
  );
}
