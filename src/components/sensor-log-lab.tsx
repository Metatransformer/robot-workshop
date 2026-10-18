"use client";

import "./sensor-log-lab.css";

import Link from "next/link";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  MAX_SENSOR_LOG_BYTES,
  parseSensorLog,
  summarizeSensorSegment,
  type SensorLogIssue,
  type SensorLogParseSuccess,
  type SensorSample,
} from "@/lib/sensor-log";

type DatasetOrigin = "synthetic" | "user-supplied-unverified";
type PlotMetric = "temperature" | "humidity" | "pressure";

type AnalyzedDataset = SensorLogParseSuccess & {
  origin: DatasetOrigin;
  source: string;
  importedAt: string;
};

const SYNTHETIC_EXAMPLE = `# Synthetic example — generated values, not hardware measurements
timestamp,temp_c,humidity_pct,pressure_hpa,led
0,26.0,43.2,1004.8,0
1,27.1,43.0,1004.7,0
2,28.0,42.8,1004.6,1
3,29.0,42.5,1004.5,1
# Synthetic fault marker — acquisition interrupted
timestamp,temp_c,humidity_pct,pressure_hpa,led
4,28.5,42.6,1004.4,1
0,26.0,43.4,1004.9,0
1,25.0,43.8,1005.0,0`;

const PAGE_SIZE = 100;

const metricInfo: Record<PlotMetric, { label: string; unit: string; value: (sample: SensorSample) => number }> = {
  temperature: { label: "Temperature", unit: "°C", value: (sample) => sample.tempC },
  humidity: { label: "Humidity", unit: "% RH", value: (sample) => sample.humidityPct },
  pressure: { label: "Pressure", unit: "hPa", value: (sample) => sample.pressureHpa },
};

function formatNumber(value: number, digits = 2): string {
  return Math.abs(value) >= 1e6 ? value.toExponential(2) : value.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function download(filename: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function issueCounts(issues: readonly SensorLogIssue[]) {
  return {
    skipped: issues.filter((issue) => issue.kind === "invalid-row" || issue.kind === "unsupported-header").length,
    diagnostics: issues.filter((issue) => issue.kind === "diagnostic" || issue.kind === "segment-restart").length,
  };
}

function ScatterPlot({ samples, metric }: { samples: SensorSample[]; metric: PlotMetric }) {
  const info = metricInfo[metric];
  const timestamps = samples.map((sample) => sample.timestamp);
  const values = samples.map(info.value);
  const rawMinX = Math.min(...timestamps);
  const rawMaxX = Math.max(...timestamps);
  const rawMinY = Math.min(...values);
  const rawMaxY = Math.max(...values);
  // Scale before subtraction so finite extreme inputs cannot overflow a span.
  const fraction = (value: number, min: number, max: number) => {
    if (min === max) return 0.5;
    const scale = Math.max(Math.abs(min), Math.abs(max), 1);
    return (value / scale - min / scale) / (max / scale - min / scale);
  };
  const point = (sample: SensorSample) => ({
    x: 58 + fraction(sample.timestamp, rawMinX, rawMaxX) * 682,
    y: 42 + (1 - fraction(info.value(sample), rawMinY, rawMaxY)) * 200,
  });

  return (
    <figure className="sensor-plot">
      <svg viewBox="0 0 780 310" role="img" aria-labelledby="sensor-plot-title sensor-plot-description">
        <title id="sensor-plot-title">{info.label} readings in the selected recording segment</title>
        <desc id="sensor-plot-description">
          Scatter points show {samples.length} logged {info.label.toLocaleLowerCase()} readings against seconds since firmware startup. Points are not interpolated.
        </desc>
        <line x1="58" y1="260" x2="740" y2="260" />
        <line x1="58" y1="24" x2="58" y2="260" />
        <text x={rawMinX === rawMaxX ? 399 : 58} y="282" textAnchor={rawMinX === rawMaxX ? "middle" : "start"}>{formatNumber(rawMinX)} s</text>
        {rawMinX !== rawMaxX && <text x="740" y="282" textAnchor="end">{formatNumber(rawMaxX)} s</text>}
        <text x="48" y={rawMinY === rawMaxY ? 146 : 46} textAnchor="end">{formatNumber(rawMaxY)}</text>
        {rawMinY !== rawMaxY && <text x="48" y="246" textAnchor="end">{formatNumber(rawMinY)}</text>}
        <text x="399" y="304" textAnchor="middle">Time since startup (s)</text>
        <text className="sensor-plot__unit" x="12" y="142" textAnchor="middle" transform="rotate(-90 12 142)">{info.unit}</text>
        {samples.map((sample) => {
          const coordinates = point(sample);
          return <circle key={sample.sourceLine} cx={coordinates.x} cy={coordinates.y} r="4" />;
        })}
      </svg>
      <figcaption>
        Scatter only: no interpolation and no connection across interruptions. LED values are logged firmware outputs, not evidence of sensor accuracy.
      </figcaption>
    </figure>
  );
}

export default function SensorLogLab() {
  const [sourceText, setSourceText] = useState("");
  const [draftOrigin, setDraftOrigin] = useState<DatasetOrigin>("user-supplied-unverified");
  const [draftSource, setDraftSource] = useState("pasted");
  const [analysis, setAnalysis] = useState<AnalyzedDataset | null>(null);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0);
  const [metric, setMetric] = useState<PlotMetric>("temperature");
  const [notesBySegment, setNotesBySegment] = useState<Record<string, string>>({});
  const [tablePage, setTablePage] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const sourceRevision = useRef(0);

  const selectedSegment = analysis?.segments[selectedSegmentIndex] ?? null;
  const summary = useMemo(
    () => selectedSegment ? summarizeSensorSegment(selectedSegment.samples) : null,
    [selectedSegment],
  );
  const counts = analysis ? issueCounts(analysis.issues) : null;
  const exportsDisabled = !analysis || stale || !selectedSegment || !summary;
  const tablePageCount = selectedSegment ? Math.ceil(selectedSegment.samples.length / PAGE_SIZE) : 0;
  const visibleSamples = selectedSegment?.samples.slice(tablePage * PAGE_SIZE, (tablePage + 1) * PAGE_SIZE) ?? [];

  const clearAnalysis = (message: string) => {
    setAnalysis(null);
    setNotesBySegment({});
    setSelectedSegmentIndex(0);
    setTablePage(0);
    setStale(false);
    setError(message);
  };

  const commitAnalysis = (text: string, origin: DatasetOrigin, source: string) => {
    const result = parseSensorLog(text);
    if (!result.ok) {
      clearAnalysis(result.error);
      return;
    }
    setAnalysis({ ...result, origin, source, importedAt: new Date().toISOString() });
    setNotesBySegment({});
    setSelectedSegmentIndex(0);
    setTablePage(0);
    setMetric("temperature");
    setStale(false);
    setError("");
  };

  const editSource = (value: string) => {
    sourceRevision.current += 1;
    setSourceText(value);
    setDraftOrigin("user-supplied-unverified");
    setDraftSource("pasted");
    setStale(Boolean(analysis));
    setError("");
  };

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const revision = ++sourceRevision.current;
    setStale(Boolean(analysis));
    if (!/\.(csv|txt)$/i.test(file.name)) {
      clearAnalysis("Choose a .csv or .txt serial capture.");
      input.value = "";
      return;
    }
    if (file.size > MAX_SENSOR_LOG_BYTES) {
      clearAnalysis("Serial CSV must be 2 MiB or smaller.");
      input.value = "";
      return;
    }
    try {
      const text = await file.text();
      if (revision !== sourceRevision.current) return;
      setSourceText(text);
      setDraftOrigin("user-supplied-unverified");
      setDraftSource(file.name);
      commitAnalysis(text, "user-supplied-unverified", file.name);
    } catch {
      if (revision === sourceRevision.current) clearAnalysis("The selected file could not be read in this browser.");
    } finally {
      input.value = "";
    }
  };

  const loadSyntheticExample = () => {
    sourceRevision.current += 1;
    setSourceText(SYNTHETIC_EXAMPLE);
    setDraftOrigin("synthetic");
    setDraftSource("built-in synthetic example");
    setStale(Boolean(analysis));
    setError("");
    if (fileInput.current) fileInput.current.value = "";
  };

  const changeSegment = (value: number) => {
    setSelectedSegmentIndex(value);
    setTablePage(0);
  };

  const exportReport = () => {
    if (exportsDisabled || !analysis || !selectedSegment || !summary) return;
    const report = {
      version: 1,
      origin: analysis.origin,
      source: analysis.source,
      importedAt: analysis.importedAt,
      reportCreatedAt: new Date().toISOString(),
      selectedSegment: {
        id: selectedSegment.id,
        index: selectedSegment.index,
        count: analysis.segments.length,
        startReason: selectedSegment.startReason,
      },
      samples: selectedSegment.samples,
      summary,
      notes: notesBySegment[selectedSegment.id] ?? "",
      parseIssues: analysis.issues,
      units: {
        timestamp: "seconds since firmware startup",
        temperature: "degrees Celsius",
        humidity: "percent relative humidity",
        pressure: "hectopascals",
        led: "logged output state, 0 or 1",
      },
      hardwareValidation: "Hardware validation: not established by this import",
    };
    download(`sensor-observation-segment-${selectedSegment.index}.json`, JSON.stringify(report, null, 2), "application/json");
  };

  const exportCsv = () => {
    if (exportsDisabled || !selectedSegment) return;
    const rows = selectedSegment.samples.map((sample) => [
      sample.timestamp,
      sample.tempC,
      sample.humidityPct,
      sample.pressureHpa,
      sample.led,
    ].join(","));
    download(
      `sensor-readings-segment-${selectedSegment.index}.csv`,
      [`timestamp,temp_c,humidity_pct,pressure_hpa,led`, ...rows].join("\n"),
      "text/csv;charset=utf-8",
    );
  };

  const exportIssues = () => {
    if (exportsDisabled || !analysis) return;
    download("sensor-import-issues.json", JSON.stringify({
      version: 1,
      origin: analysis.origin,
      source: analysis.source,
      importedAt: analysis.importedAt,
      issues: analysis.issues,
    }, null, 2), "application/json");
  };

  return (
    <div className="sensor-shell">
      <header className="sensor-header">
        <Link className="sensor-brand" href="/">Metatransformer <span>Workshop</span></Link>
        <nav aria-label="Sensor observation navigation">
          <Link href="/">Workshop</Link>
          <Link href="/build-guides/sensor">Sensor build guide</Link>
          <Link href="/learn?lesson=measurement-instruments">Supporting theory</Link>
        </nav>
      </header>

      <main className="sensor-main">
        <section className="sensor-intro">
          <span className="sensor-eyebrow">Browser-only observation notebook</span>
          <h1>Inspect your sensor readings</h1>
          <p>
            Import the original Pico + BME280 firmware’s serial CSV. This tool separates interrupted recordings, keeps rejected rows visible, and never treats an import as physical validation.
          </p>
        </section>

        <section className="sensor-import" aria-labelledby="sensor-import-heading">
          <div className="sensor-section-heading">
            <span>01</span>
            <div><p>Source capture</p><h2 id="sensor-import-heading">Bring in serial text</h2></div>
          </div>
          <p className="sensor-segment-reason">Paste the header and serial output, including # comments. CSV/TXT files: up to 2 MiB and 10,000 data rows. Analyzing changed input replaces the previous analysis and its notes; export first to keep them.</p>
          <label className="sensor-source-field">
            <span>Serial CSV</span>
            <textarea
              value={sourceText}
              onChange={(event) => editSource(event.target.value)}
              spellCheck={false}
              placeholder="timestamp,temp_c,humidity_pct,pressure_hpa,led"
            />
          </label>
          <div className="sensor-import-actions">
            <label className="sensor-file-button">
              <span>Import serial CSV</span>
              <input ref={fileInput} type="file" accept=".csv,.txt,text/csv,text/plain" onChange={importFile} />
            </label>
            <button className="sensor-button is-primary" type="button" disabled={Boolean(analysis) && !stale} onClick={() => { sourceRevision.current += 1; commitAnalysis(sourceText, draftOrigin, draftSource); }}>Analyze readings</button>
            <button className="sensor-button" type="button" onClick={loadSyntheticExample}>Load synthetic example</button>
          </div>
          <div className={draftOrigin === "synthetic" ? "sensor-origin is-synthetic" : "sensor-origin"}>
            <strong>{draftOrigin === "synthetic" ? "Synthetic dataset" : "User-supplied, unverified"}</strong>
            <span>
              {draftOrigin === "synthetic"
                ? "Generated values for exploring the interface; not measured hardware. Analyze when ready."
                : "Pasted and imported values are shown as observations, not proof of sensor accuracy."}
            </span>
          </div>
          {stale && (
            <p className="sensor-stale" role="status">
              <strong>Source changed.</strong> The preview below belongs to the previous analysis. Analyze readings to update it; downloads are disabled meanwhile.
            </p>
          )}
          {error && <p className="sensor-error" role="alert"><strong>Import not analyzed.</strong> {error}</p>}
        </section>

        {analysis && selectedSegment && summary && counts && (
          <>
            <section className="sensor-analysis" aria-labelledby="sensor-analysis-heading">
              <div className="sensor-section-heading">
                <span>02</span>
                <div><p>Parsed readings</p><h2 id="sensor-analysis-heading">Explore one continuous segment</h2></div>
              </div>

              <p className="sensor-segment-reason">Analyzed source: {analysis.source} · {analysis.origin === "synthetic" ? "Synthetic dataset — not hardware measurements" : "User-supplied, unverified"}</p>

              <div className="sensor-import-summary" aria-label="Import summary">
                <div><b>{analysis.totalValidRows.toLocaleString()}</b><span>Valid readings</span></div>
                <div><b>{counts.skipped.toLocaleString()}</b><span>Skipped rows</span></div>
                <div><b>{counts.diagnostics.toLocaleString()}</b><span>Diagnostics / restarts</span></div>
                <div><b>{analysis.segments.length.toLocaleString()}</b><span>Recording segments</span></div>
              </div>

              <div className="sensor-selectors">
                <label>
                  <span>Recording segment</span>
                  <select value={selectedSegmentIndex} onChange={(event) => changeSegment(Number(event.target.value))}>
                    {analysis.segments.map((segment, index) => (
                      <option key={segment.id} value={index}>Segment {segment.index} — {segment.samples.length} samples</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Plot measurement</span>
                  <select value={metric} onChange={(event) => setMetric(event.target.value as PlotMetric)}>
                    <option value="temperature">Temperature</option>
                    <option value="humidity">Humidity</option>
                    <option value="pressure">Pressure</option>
                  </select>
                </label>
              </div>
              <p className="sensor-segment-reason">{selectedSegment.startReason}</p>

              <div className="sensor-summary-grid" aria-label={`Summary for recording segment ${selectedSegment.index}`}>
                <article><span>Samples / duration</span><b>{summary.count} / {formatNumber(summary.durationSeconds)} s</b></article>
                <article><span>Temperature °C</span><b>{formatNumber(summary.temperatureC.min)}–{formatNumber(summary.temperatureC.max)}</b><small>Mean {formatNumber(summary.temperatureC.mean)} °C</small></article>
                <article><span>Humidity % RH</span><b>{formatNumber(summary.humidityPct.min)}–{formatNumber(summary.humidityPct.max)}</b></article>
                <article><span>Pressure hPa</span><b>{formatNumber(summary.pressureHpa.min)}–{formatNumber(summary.pressureHpa.max)}</b></article>
              </div>

              <ScatterPlot samples={selectedSegment.samples} metric={metric} />

              <div className="sensor-table-wrap">
                <table className="sensor-table">
                  <caption>Recorded samples</caption>
                  <thead><tr><th scope="col">Source line</th><th scope="col">Timestamp (s since startup)</th><th scope="col">Temperature (°C)</th><th scope="col">Humidity (% RH)</th><th scope="col">Pressure (hPa)</th><th scope="col">LED output</th></tr></thead>
                  <tbody>
                    {visibleSamples.map((sample) => (
                      <tr key={sample.sourceLine}>
                        <td>{sample.sourceLine}</td><td>{sample.timestamp}</td><td>{sample.tempC}</td><td>{sample.humidityPct}</td><td>{sample.pressureHpa}</td><td>{sample.led}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tablePageCount > 1 && (
                <div className="sensor-pagination" aria-label="Recorded samples pages">
                  <button type="button" disabled={tablePage === 0} onClick={() => setTablePage((page) => page - 1)}>Previous 100</button>
                  <span>Page {tablePage + 1} of {tablePageCount}</span>
                  <button type="button" disabled={tablePage + 1 >= tablePageCount} onClick={() => setTablePage((page) => page + 1)}>Next 100</button>
                </div>
              )}
            </section>

            <section className="sensor-issues" aria-labelledby="sensor-issues-heading">
              <div>
                <span className="sensor-eyebrow">Import trace</span>
                <h2 id="sensor-issues-heading">Diagnostics and skipped input</h2>
                <p>Comments, restarts, and rejected rows remain visible instead of being converted into readings.</p>
              </div>
              {analysis.issues.length ? (
                <ol>
                  {analysis.issues.slice(0, 8).map((issue, index) => (
                    <li key={`${issue.line}-${issue.kind}-${index}`}>
                      <b>Line {issue.line}</b> — {issue.message}<code>{issue.source}</code>
                    </li>
                  ))}
                </ol>
              ) : <p className="sensor-no-issues">No diagnostic or rejected lines were found.</p>}
              {analysis.issues.length > 8 && <p>Showing the first 8 of {analysis.issues.length} issues. Download the complete issue list below.</p>}
              <button className="sensor-button" type="button" disabled={exportsDisabled} onClick={exportIssues}>Download all issues JSON</button>
            </section>

            <section className="sensor-notebook" aria-labelledby="sensor-notebook-heading">
              <div className="sensor-section-heading">
                <span>03</span>
                <div><p>Segment-linked notes</p><h2 id="sensor-notebook-heading">Observation report</h2></div>
              </div>
              <label>
                <span>Bench observations</span>
                <textarea
                  value={notesBySegment[selectedSegment.id] ?? ""}
                  onChange={(event) => setNotesBySegment((current) => ({ ...current, [selectedSegment.id]: event.target.value }))}
                  placeholder="Record expected versus observed behavior, setup details, disconnects, and uncertainties for this segment."
                />
              </label>
              <p className="sensor-privacy">Notes live in this tab until export. Downloads contain the selected segment; export each segment you want to keep. Nothing is stored in local storage or sent to a server.</p>
              <div className="sensor-export-actions">
                <button className="sensor-button is-primary" type="button" disabled={exportsDisabled} onClick={exportReport}>Download observation report</button>
                <button className="sensor-button" type="button" disabled={exportsDisabled} onClick={exportCsv}>Download readings CSV</button>
              </div>
              <p className="sensor-validation">Hardware validation: not established by this import. LED values are logged outputs, not evidence of measurement accuracy.</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
