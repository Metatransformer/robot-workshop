"use client";

import "./sensor-wiring-lab.css";

import Link from "next/link";
import { useState } from "react";
import {
  CHECK_OPTIONS,
  ENDPOINTS,
  FAULT_OPTIONS,
  REFERENCE_EDGES,
  WIRING_CASES,
  breadboardConnected,
  type EndpointId,
  type WiringCase,
  type WiringCheckId,
  type WiringEdge,
  type WiringFaultId,
} from "@/lib/sensor-wiring";

const endpointById = new Map(ENDPOINTS.map((endpoint) => [endpoint.id, endpoint]));

const endpointPosition: Record<EndpointId, { x: number; y: number }> = {
  "pico-gp0": { x: 292, y: 70 },
  "pico-gp1": { x: 292, y: 125 },
  "pico-3v3": { x: 292, y: 215 },
  "pico-gnd": { x: 292, y: 270 },
  "pico-gp2": { x: 292, y: 325 },
  "bme-sda": { x: 628, y: 70 },
  "bme-scl": { x: 628, y: 125 },
  "bme-vin": { x: 628, y: 215 },
  "bme-gnd": { x: 628, y: 270 },
};

function endpointLabel(id: EndpointId): string {
  return endpointById.get(id)?.label ?? id;
}

function edgeLabel(edge: WiringEdge): string {
  return `${endpointLabel(edge.from)} → ${endpointLabel(edge.to)}`;
}

function edgeKind(edge: WiringEdge): string {
  if (edge.from.includes("gnd") || edge.to.includes("gnd")) return "ground";
  if (edge.from.includes("3v3") || edge.from.includes("gp2") || edge.to === "bme-vin") return "supply";
  return "signal";
}

function WiringSchematic({ wiringCase }: { wiringCase: WiringCase }) {
  const connectionDescription = wiringCase.edges.length
    ? wiringCase.edges.map(edgeLabel).join("; ")
    : "No displayed connections";

  return (
    <figure className="sensor-wiring-schematic">
      <svg viewBox="0 0 920 370" role="img" aria-labelledby="sensor-wiring-schematic-title sensor-wiring-schematic-description">
        <title id="sensor-wiring-schematic-title">{`${wiringCase.title} simplified endpoint diagram`}</title>
        <desc id="sensor-wiring-schematic-description">
          Pico endpoints are in the left column and BME280 endpoints are in the right column. Displayed connections: {connectionDescription}.
        </desc>

        <rect className="sensor-wiring-board-block" x="20" y="22" width="272" height="330" rx="4" />
        <rect className="sensor-wiring-board-block" x="628" y="22" width="272" height="275" rx="4" />
        <text className="sensor-wiring-board-title" x="40" y="49">Original Pico RP2040</text>
        <text className="sensor-wiring-board-title" x="648" y="49">Adafruit BME280</text>

        {wiringCase.edges.map((edge, index) => {
          const from = endpointPosition[edge.from];
          const to = endpointPosition[edge.to];
          return (
            <g key={`${edge.from}-${edge.to}-${index}`} aria-hidden="true">
              <line className={`sensor-wiring-wire is-${edgeKind(edge)}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} />
              <circle className={`sensor-wiring-wire-dot is-${edgeKind(edge)}`} cx={from.x} cy={from.y} r="5" />
              <circle className={`sensor-wiring-wire-dot is-${edgeKind(edge)}`} cx={to.x} cy={to.y} r="5" />
            </g>
          );
        })}

        <g className="sensor-wiring-endpoint-labels">
          <text x="42" y="75">1 · GP0</text>
          <text x="42" y="130">2 · GP1</text>
          <text x="42" y="220">36 · 3V3(OUT)</text>
          <text x="42" y="275">38 · GND</text>
          <text x="42" y="330">4 · GP2 (GPIO)</text>
          <text x="878" y="75" textAnchor="end">SDI / SDA</text>
          <text x="878" y="130" textAnchor="end">SCK / SCL</text>
          <text x="878" y="220" textAnchor="end">VIN (input)</text>
          <text x="878" y="275" textAnchor="end">GND</text>
        </g>
      </svg>
      <figcaption>
        A simplified endpoint netlist, not a physical placement or orientation drawing. Read the printed labels and use the manufacturer pinouts before touching a board; wire colors are not evidence. On a narrow screen, scroll the diagram sideways or use the connection table below.
      </figcaption>
    </figure>
  );
}

function ConnectionTable({ edges }: { edges: readonly WiringEdge[] }) {
  return (
    <div className="sensor-wiring-table-wrap">
      <table className="sensor-wiring-connection-table">
        <caption>Connections visible in this case</caption>
        <thead>
          <tr><th scope="col">Pico source</th><th scope="col">BME280 destination</th></tr>
        </thead>
        <tbody>
          {edges.map((edge, index) => (
            <tr key={`${edge.from}-${edge.to}-${index}`}>
              <td>{endpointLabel(edge.from)}</td>
              <td>{endpointLabel(edge.to)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {edges.length < 4 ? <p className="sensor-wiring-table-note">Only {edges.length} connections are shown. An absent wire is left absent rather than drawn as a dangling stub.</p> : null}
    </div>
  );
}

function ReferenceList({ edges }: { edges: readonly WiringEdge[] }) {
  return (
    <ul className="sensor-wiring-netlist">
      {edges.map((edge) => <li key={`${edge.from}-${edge.to}`}>{edgeLabel(edge)}</li>)}
    </ul>
  );
}

function BreadboardInset() {
  const [answer, setAnswer] = useState<string>("");
  const [checked, setChecked] = useState(false);
  const choices = ["e10", "f10", "a11"] as const;
  const isCorrect = answer ? breadboardConnected("a10", answer) : false;

  return (
    <section className="sensor-wiring-breadboard" aria-labelledby="sensor-wiring-breadboard-heading">
      <div>
        <p className="sensor-wiring-kicker">Breadboard mini-check</p>
        <h2 id="sensor-wiring-breadboard-heading">One row, two isolated strips</h2>
        <p>On this generic example, a–e in row 10 share one five-contact strip. The center trench separates f–j, and row 11 is a different strip. Power rails are not shown.</p>
      </div>

      <div className="sensor-wiring-breadboard-diagram" role="img" aria-label="Generic breadboard rows 10 and 11. Contacts a through e form one strip, contacts f through j form a second strip across a central trench, and the next numbered row is isolated.">
        <div className="sensor-wiring-breadboard-labels" aria-hidden="true">
          {["a", "b", "c", "d", "e", "", "f", "g", "h", "i", "j"].map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
        </div>
        {[10, 11].map((row) => (
          <div className="sensor-wiring-breadboard-row" key={row} aria-hidden="true">
            <b>{row}</b>
            {["a", "b", "c", "d", "e"].map((column) => <span className={column === "a" && row === 10 ? "is-origin" : ""} key={`${column}${row}`} />)}
            <i />
            {["f", "g", "h", "i", "j"].map((column) => <span key={`${column}${row}`} />)}
          </div>
        ))}
      </div>

      <fieldset className="sensor-wiring-breadboard-question">
        <legend>Which contact shares a strip with a10?</legend>
        <div className="sensor-wiring-breadboard-options">
          {choices.map((choice) => (
            <label key={choice}>
              <input
                type="radio"
                name="sensor-wiring-breadboard-contact"
                value={choice}
                checked={answer === choice}
                onChange={() => { setAnswer(choice); setChecked(false); }}
              />
              {choice}
            </label>
          ))}
        </div>
        <button className="sensor-wiring-button" type="button" disabled={!answer} onClick={() => setChecked(true)}>Check strip</button>
      </fieldset>

      {checked ? (
        <div className={`sensor-wiring-breadboard-feedback ${isCorrect ? "is-correct" : "is-incorrect"}`} role="status">
          <strong>{isCorrect ? "Correct." : "Not this contact."}</strong>{" "}
          e10 shares the a–e strip with a10. f10 is across the trench, and a11 is on the next row. Verify the actual unpowered breadboard because layouts vary; never place all BME280 pins in one shared strip.
        </div>
      ) : null}
    </section>
  );
}

export default function SensorWiringLab() {
  const [caseId, setCaseId] = useState<WiringFaultId>("correct");
  const [diagnosis, setDiagnosis] = useState<WiringFaultId | "">("");
  const [check, setCheck] = useState<WiringCheckId | "">("");
  const [revealed, setRevealed] = useState(false);
  const wiringCase = WIRING_CASES.find(({ id }) => id === caseId) ?? WIRING_CASES[0];
  const diagnosisIsCorrect = diagnosis === wiringCase.expectedFault;
  const checkIsCorrect = check === wiringCase.expectedCheckId || check === "trace-all";
  const selectedFaultLabel = FAULT_OPTIONS.find(({ id }) => id === diagnosis)?.label;
  const selectedCheckLabel = CHECK_OPTIONS.find(({ id }) => id === check)?.label;

  function chooseCase(nextId: WiringFaultId) {
    setCaseId(nextId);
    setDiagnosis("");
    setCheck("");
    setRevealed(false);
  }

  return (
    <div className="sensor-wiring-shell">
      <header className="sensor-wiring-header">
        <Link className="sensor-wiring-brand" href="/">Metatransformer</Link>
        <nav aria-label="Workshop links">
          <Link href="/">Workshop</Link>
          <Link href="/build-guides/sensor">Build guide</Link>
          <Link href="/?template=sensor">Starter</Link>
          <Link href="/learn?lesson=digital-interfaces">Lesson</Link>
        </nav>
      </header>

      <main className="sensor-wiring-main">
        <section className="sensor-wiring-intro">
          <p className="sensor-wiring-kicker">Unpowered inspection practice</p>
          <h1>Inspect the sensor wiring</h1>
          <p>Practice tracing one documented route: the original Pico RP2040 to the Adafruit BME280 STEMMA QT breakout’s pad row. This is a visual netlist exercise—not a simulator, arbitrary-circuit checker, or hardware qualification.</p>
        </section>

        <aside className="sensor-wiring-unpowered-note">
          <strong>Keep the real assembly unpowered.</strong>
          <p>Disconnect USB and every external power source before identifying pins or using continuity mode. Do not energize a suspected fault to “see what happens.”</p>
        </aside>

        <section className="sensor-wiring-inspection" aria-labelledby="case-heading">
          <div className="sensor-wiring-section-heading">
            <span>01</span>
            <div><p>Look first</p><h2 id="case-heading">Trace the displayed endpoints</h2></div>
          </div>

          <label className="sensor-wiring-case-select">
            <span>Wiring case</span>
            <select value={caseId} onChange={(event) => chooseCase(event.target.value as WiringFaultId)}>
              {WIRING_CASES.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
            </select>
          </label>

          <WiringSchematic wiringCase={wiringCase} />
          <ConnectionTable edges={wiringCase.edges} />

          <details className="sensor-wiring-reference">
            <summary>Reference wiring</summary>
            <p>Open this when you want a side-by-side check. These four connections are the complete reference for this exercise:</p>
            <ReferenceList edges={REFERENCE_EDGES} />
            <p><strong>SDI means SDA</strong> here, and <strong>SCK means SCL</strong>. Sensor VIN is the input used in this route; the sensor’s 3Vo pad is a regulator output and is not connected.</p>
          </details>
        </section>

        <section className="sensor-wiring-answer" aria-labelledby="answer-heading">
          <div className="sensor-wiring-section-heading">
            <span>02</span>
            <div><p>Decide safely</p><h2 id="answer-heading">Name the mapping and the next check</h2></div>
          </div>

          <div className="sensor-wiring-answer-grid">
            <fieldset>
              <legend>Your diagnosis</legend>
              <div className="sensor-wiring-radio-list">
                {FAULT_OPTIONS.map((option) => (
                  <label className={diagnosis === option.id ? "is-selected" : ""} key={option.id}>
                    <input type="radio" name="fault" value={option.id} checked={diagnosis === option.id} onChange={() => { setDiagnosis(option.id); setRevealed(false); }} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Unpowered check</legend>
              <div className="sensor-wiring-radio-list">
                {CHECK_OPTIONS.map((option) => (
                  <label className={check === option.id ? "is-selected" : ""} key={option.id}>
                    <input type="radio" name="check" value={option.id} checked={check === option.id} onChange={() => { setCheck(option.id); setRevealed(false); }} />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <button className="sensor-wiring-button is-primary" type="button" disabled={!diagnosis || !check} onClick={() => setRevealed(true)}>Check my inspection</button>

          {revealed ? (
            <div className="sensor-wiring-feedback" aria-live="polite">
              <p className="sensor-wiring-verdict">{diagnosisIsCorrect && wiringCase.id === "correct" ? "Matches the four reference connections" : diagnosisIsCorrect && checkIsCorrect ? "Inspection matched" : "Review the traces"}</p>
              <div className="sensor-wiring-feedback-grid">
                <section className={diagnosisIsCorrect ? "is-correct" : "is-incorrect"}>
                  <h3>Diagnosis: {diagnosisIsCorrect ? "correct" : "not yet"}</h3>
                  <p>{diagnosisIsCorrect ? wiringCase.explanation : `“${selectedFaultLabel}” does not match the displayed edges. ${wiringCase.explanation}`}</p>
                </section>
                <section className={checkIsCorrect ? "is-correct" : "is-incorrect"}>
                  <h3>Check: {checkIsCorrect ? "appropriate" : "choose another"}</h3>
                  <p>{checkIsCorrect ? `${check === "trace-all" && wiringCase.expectedCheckId !== "trace-all" ? "Tracing all four paths is valid. A more focused check for this case is: " : ""}${wiringCase.checkExplanation}` : check === "power-and-see" ? "Powering a suspected fault is not an inspection method. Disconnect USB and external power, then choose a targeted visual or continuity trace." : `“${selectedCheckLabel}” is not the most direct check for this case. ${wiringCase.checkExplanation}`}</p>
                </section>
              </div>
              <div className="sensor-wiring-netlist-compare">
                <div><h3>Observed snapshot</h3><ReferenceList edges={wiringCase.edges} /></div>
                <div><h3>Reference</h3><ReferenceList edges={REFERENCE_EDGES} /></div>
              </div>
              <p className="sensor-wiring-feedback-boundary">A match means only that the four listed edges equal this reference. It does not approve the assembly for power.</p>
            </div>
          ) : null}
        </section>

        <BreadboardInset />

        <section className="sensor-wiring-sources" aria-labelledby="sources-heading">
          <p className="sensor-wiring-kicker">Use the labels, then verify</p>
          <h2 id="sources-heading">Manufacturer pin references</h2>
          <div className="sensor-wiring-source-links">
            <a href="https://cdn-shop.adafruit.com/product-files/4883/4864_Pico-R3-A4-Pinout.pdf" target="_blank" rel="noreferrer">Original Pico R3 numbered pinout (PDF)</a>
            <a href="https://learn.adafruit.com/adafruit-bme280-humidity-barometric-pressure-temperature-sensor-wiring-breakout/pinouts" target="_blank" rel="noreferrer">Adafruit BME280 power and signal pinouts</a>
          </div>
          <p>This visual check cannot prove solder-joint quality, contact resistance, supply health, sensor calibration, or compatibility with a project whose wiring or firmware has been modified. The project’s own files remain authoritative for a modified build.</p>
        </section>
      </main>
    </div>
  );
}
