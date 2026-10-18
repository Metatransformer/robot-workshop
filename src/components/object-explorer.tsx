"use client";

import "./object-explorer.css";

import { useEffect, useState, type MouseEvent } from "react";
import { everydayObjects, type EverydayObject } from "@/lib/everyday-objects";
import { supplierLinks } from "@/lib/supplier-links";

type ObjectExplorerProps = { initialObjectId?: string };

function resolveObject(id?: string) {
  return everydayObjects.find((object) => object.id === id) ?? everydayObjects[0];
}

function ObjectSketch({ object }: { object: EverydayObject }) {
  const common = <><path className="sketch-grid" d="M20 45H400M20 95H400M20 145H400M75 15V175M145 15V175M215 15V175M285 15V175M355 15V175"/><path className="sketch-arrow" d="M25 160H395m-14-8 14 8-14 8"/></>;
  let drawing;
  if (object.id === "vacuum") drawing = <><path d="M88 128h155l32-44h64"/><path d="M339 84c30 0 38 12 38 27"/><circle cx="181" cy="103" r="35"/><path d="m181 75 12 27-12 27-12-27zM110 128l-19 27m130-27 18 27"/><path className="sketch-signal" d="M107 112c26-18 45-18 62-5m49-4c25-21 48-21 72-11"/></>;
  else if (object.id === "display") drawing = <><rect x="91" y="39" width="240" height="112" rx="7"/><path d="M178 151v18m66-18v18m-92 0h118"/><g className="sketch-pixels"><rect x="113" y="59" width="31" height="28"/><rect x="144" y="87" width="31" height="28"/><rect x="175" y="59" width="31" height="28"/><rect x="206" y="87" width="31" height="28"/><rect x="237" y="59" width="31" height="28"/><rect x="268" y="87" width="31" height="28"/></g><path className="sketch-signal" d="M48 72h43m-12-9 12 9-12 9"/></>;
  else if (object.id === "electric-car") drawing = <><path d="M61 126h33l24-48h144l51 48h46v20H61z"/><circle cx="127" cy="146" r="25"/><circle cx="301" cy="146" r="25"/><rect x="157" y="99" width="72" height="27" rx="3"/><path className="sketch-signal" d="M166 86h56m-9-9 9 9-9 9m28 42h36"/></>;
  else if (object.id === "washer") drawing = <><rect x="111" y="25" width="200" height="145" rx="9"/><circle cx="211" cy="109" r="47"/><circle cx="211" cy="109" r="35"/><circle cx="139" cy="49" r="7"/><path className="sketch-signal" d="M179 110c13-25 50-23 63 0-16 25-48 25-63 0Zm31-47v-22m-9 11 9-11 9 11"/></>;
  else if (object.id === "thermostat") drawing = <><path d="M74 97 210 29l136 68v73H74z"/><rect x="163" y="82" width="94" height="62" rx="6"/><path d="M190 97v27m0 0a12 12 0 1 0 12 0V97a6 6 0 0 0-12 0Z"/><path className="sketch-signal" d="M265 92c29 12 29 34 0 46m15-55c43 19 43 47 0 65"/></>;
  else drawing = <><path d="M91 164V43h31v121m0-91 201 58v17l-201-19"/><circle cx="122" cy="83" r="13"/><path className="sketch-signal" d="M302 53c21 7 32 21 32 42m-12-47c29 10 45 29 45 58"/><circle cx="338" cy="127" r="12"/><path d="M338 139v25m0-13-18 13m18-13 18 13"/></>;
  return (
    <svg className="object-sketch" viewBox="0 0 420 190" role="img" aria-labelledby={`sketch-${object.id}`}>
      <title id={`sketch-${object.id}`}>{`${object.title} system concept illustration`}</title>
      {common}{drawing}
    </svg>
  );
}

function FlowLane({ label, items, kind }: { label: string; items: string[]; kind: "energy" | "information" }) {
  return <section className={`flow-lane flow-lane--${kind}`} aria-label={`${label} flow`}>
    <h3>{label}</h3>
    <ol>{items.map((item, index) => <li key={`${item}-${index}`}><span>{item}</span></li>)}</ol>
  </section>;
}

export default function ObjectExplorer({ initialObjectId }: ObjectExplorerProps) {
  const [selectedId, setSelectedId] = useState(resolveObject(initialObjectId).id);
  const selected = resolveObject(selectedId);

  useEffect(() => {
    const onPopState = () => {
      const id = new URLSearchParams(window.location.search).get("object") ?? undefined;
      setSelectedId(resolveObject(id).id);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const selectObject = (event: MouseEvent<HTMLAnchorElement>, id: EverydayObject["id"]) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("object", id);
    window.history.pushState({}, "", url);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  return (
    <main className="object-explorer">
      <header className="object-explorer__topbar print-hidden">
        <a className="object-wordmark" href="/">METATRANSFORMER</a>
        <nav aria-label="Object explorer navigation">
          <a href="/learn">Learning library</a>
          <a href="/">Back to workshop</a>
        </nav>
      </header>

      <section className="object-hero">
        <div className="object-hero__copy">
          <span className="object-kicker">Reverse-engineer from the outside in</span>
          <h1>How everyday things work.</h1>
          <p>Follow the energy and signals through familiar machines. Try a small bench experiment, learn the underlying theory, and source real components.</p>
          <div className="object-actions print-hidden">
            <button type="button" onClick={() => window.print()}>Print / Save PDF</button>
            <a href="#system-report">Read the selected system</a>
          </div>
        </div>
        <div className="hero-system" aria-label="Energy and information legend">
          <span className="hero-system__energy">Energy</span><span aria-hidden="true">→</span><span>behavior</span>
          <span className="hero-system__info">Information</span><span aria-hidden="true">→</span><span>decisions</span>
        </div>
      </section>

      <nav className="object-browser print-hidden" aria-label="Choose an everyday object">
        <div>
          {everydayObjects.map((object, index) => (
            <a
              key={object.id}
              id={`object-tab-${object.id}`}
              href={`/explore-objects?object=${object.id}`}
              aria-current={selected.id === object.id ? "page" : undefined}
              onClick={(event) => selectObject(event, object.id)}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{object.title}</strong>
              <small>{object.question}</small>
            </a>
          ))}
        </div>
      </nav>

      <article id="system-report" className="system-report" aria-labelledby={`object-tab-${selected.id}`}>
        <header className="report-heading">
          <div>
            <span className="object-kicker">System map · {selected.id.replace("-", " ")}</span>
            <h2>{selected.title}</h2>
            <p className="report-question">{selected.question}</p>
          </div>
          <ObjectSketch object={selected}/>
        </header>

        <p className="system-summary">{selected.summary}</p>

        <section className="flow-map" aria-labelledby="flow-title">
          <div className="section-intro"><span>01</span><div><h2 id="flow-title">Follow the flows</h2><p>Energy makes change possible. Information selects, sequences, and corrects that change.</p></div></div>
          <FlowLane label="Energy" kind="energy" items={selected.energyFlow}/>
          <FlowLane label="Information" kind="information" items={selected.informationFlow}/>
        </section>

        <section className="subsystem-section" aria-labelledby="subsystems-title">
          <div className="section-intro"><span>02</span><div><h2 id="subsystems-title">Subsystem map</h2><p>Observe externally first; documentation fills in what the enclosure deliberately hides.</p></div></div>
          <div className="subsystem-grid">
            {selected.subsystems.map((subsystem, index) => <article key={subsystem.name}>
              <span className="subsystem-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{subsystem.name}</h3>
              <p>{subsystem.purpose}</p>
              <dl><div><dt>Energy or signal</dt><dd>{subsystem.energyOrSignal}</dd></div><div><dt>Observe</dt><dd>{subsystem.whatToObserve}</dd></div></dl>
            </article>)}
          </div>
        </section>

        <section className="experiment-section" aria-labelledby="experiment-title">
          <div className="section-intro section-intro--light"><span>03</span><div><h2 id="experiment-title">Test the idea safely</h2><p>{selected.proposedBuild}</p></div></div>
          <div className="experiment-layout">
            <div className="experiment-main"><h3>Goal</h3><p>{selected.experiment.goal}</p><h3>Procedure</h3><ol>{selected.experiment.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
            <aside><h3>Materials</h3><ul>{selected.experiment.materials.map((material) => <li key={material}>{material}</li>)}</ul><h3>Predict first</h3><p>{selected.experiment.predict}</p></aside>
          </div>
          <div className="evidence-grid">
            <section><h3>Observe</h3><ul>{selected.experiment.observe.map((item) => <li key={item}>{item}</li>)}</ul></section>
            <section><h3>Diagnose</h3><ul>{selected.experiment.diagnose.map((item) => <li key={item}>{item}</li>)}</ul></section>
            <section className="limits"><h3>Limits</h3><ul>{selected.experiment.limits.map((item) => <li key={item}>{item}</li>)}</ul></section>
          </div>
        </section>

        <section className="continue-section" aria-labelledby="continue-title">
          <div className="section-intro"><span>04</span><div><h2 id="continue-title">Learn and source deliberately</h2><p>Lessons explain the transferable concepts. Supplier links identify exact candidates; they are not approval, availability, or a completed order.</p></div></div>
          <p><a href={`/?template=${selected.id === "thermostat" ? "sensor" : selected.id === "barrier" ? "desk-robot" : "blank"}`}>{selected.id === "thermostat" ? "Open the Pico + BME280 starter" : "Start a project plan for this idea"} →</a></p>
          <div className="continue-grid">
            <section><h3>Prerequisite lessons</h3><div className="lesson-links">{selected.prerequisites.map((id) => <a key={id} href={`/learn?lesson=${id}`}>{id.replaceAll("-", " ")} <span aria-hidden="true">→</span></a>)}</div></section>
            <section><h3>Candidate parts — incomplete list</h3><p>Choose supplies, connectors, mounting and tools before treating this as an order list.</p><div className="supplier-cards">{selected.supplierIds.map((id) => { const supplier = supplierLinks[id]; return <div key={id}><a href={supplier.url} target="_blank" rel="noopener noreferrer"><strong>{supplier.name}</strong><span>{supplier.seller}{supplier.sku ? ` · ${supplier.sku}` : ""}</span><small>Official page checked {supplier.checkedAt} ↗</small></a><ul>{supplier.selectionNotes.map(note => <li key={note}>{note}</li>)}</ul></div>; })}</div></section>
          </div>
        </section>

        <footer className="report-sources">
          <h2>Sources</h2>
          <ul>{selected.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
          <p>Conceptual maps and bench exercises are Metatransformer synthesis. They have not been physically validated.</p>
        </footer>
      </article>
    </main>
  );
}
