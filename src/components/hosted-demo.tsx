import Link from "next/link";

type HostedDemoProps = {
  template?: string;
};

const destinations = [
  { href: "/learn", eyebrow: "Learn", title: "Build your foundations", description: "Work through focused lessons, then keep your progress and worksheet notes in this browser." },
  { href: "/explore-objects", eyebrow: "Observe", title: "Explore everyday objects", description: "Read familiar things as systems of structure, energy, information, and intent." },
  { href: "/labs", eyebrow: "Experiment", title: "Enter the labs", description: "Practice the reasoning behind a build with small, interactive investigations." },
  { href: "/build-guides/sensor", eyebrow: "Build guide 01", title: "Temperature sensor", description: "Follow the parts, wiring, and assembly path for a compact sensing project." },
  { href: "/build-guides/sensor-led", eyebrow: "Build guide 02", title: "Sensor + LED", description: "Extend a sensor with a visible external indicator and supporting circuit decisions." },
  { href: "/build-guides/servo", eyebrow: "Build guide 03", title: "Servo bench", description: "Set up a small servo experiment around commands, motion, and practical limits." },
  { href: "/labs/hysteresis", eyebrow: "Deep dive", title: "Hysteresis lab", description: "See why useful thresholds need memory, separation, and careful observation." },
  { href: "/bench/led", eyebrow: "Workbench", title: "LED measurement bench", description: "Record observations and reason from measurements before carrying an idea to hardware." },
] as const;

export default function HostedDemo({ template }: HostedDemoProps) {
  return (
    <main style={{ minHeight: "100vh", background: "#f2eee3", color: "#1d2822", fontFamily: "Georgia, 'Times New Roman', serif" }}>
      <header style={{ background: "#173b2b", color: "#fbf6eb", borderBottom: "1px solid #0b2117" }}>
        <nav aria-label="Showcase navigation" style={{ width: "min(1180px, calc(100% - 40px))", margin: "0 auto", minHeight: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "inherit", textDecoration: "none", fontSize: "1.05rem", fontWeight: 700, letterSpacing: "0.02em" }}>AI Robot Workshop</Link>
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap", fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            <Link href="/learn" style={{ color: "#dce8df", textDecoration: "none" }}>Learn</Link>
            <Link href="/explore-objects" style={{ color: "#dce8df", textDecoration: "none" }}>Explore</Link>
            <Link href="/labs" style={{ color: "#dce8df", textDecoration: "none" }}>Labs</Link>
            <a href="https://github.com/Metatransformer/robot-workshop" style={{ color: "#dce8df", textDecoration: "none" }}>Source</a>
            <a href="https://metatransformer.com/blog/ai-robot-workshop" style={{ color: "#dce8df", textDecoration: "none" }}>Article</a>
            <a href="https://github.com/Metatransformer/robot-workshop#clone-install-and-run-locally" style={{ color: "#dce8df", textDecoration: "none" }}>Run locally</a>
          </div>
        </nav>
      </header>

      <section style={{ background: "#173b2b", color: "#fbf6eb", padding: "clamp(64px, 10vw, 124px) 20px clamp(72px, 10vw, 116px)" }}>
        <div style={{ width: "min(1180px, 100%)", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "clamp(40px, 7vw, 96px)", alignItems: "end" }}>
          <div>
            <p style={{ margin: "0 0 22px", color: "#e9a47e", fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase" }}>A workshop for invention</p>
            <h1 style={{ margin: 0, maxWidth: 760, fontSize: "clamp(3.2rem, 9vw, 7.2rem)", fontWeight: 500, lineHeight: 0.92, letterSpacing: "-0.055em" }}>AI Robot Workshop</h1>
          </div>
          <div style={{ borderLeft: "5px solid #c86439", padding: "4px 0 4px 26px" }}>
            <p style={{ margin: 0, color: "#d5e0d8", fontSize: "clamp(1.08rem, 2vw, 1.35rem)", lineHeight: 1.65 }}>An open-source, local-first physical invention and learning portfolio prototype by Nick Bryant. Learn how things work, test an idea, and move toward a build with more confidence.</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="showcase-heading" style={{ width: "min(1180px, calc(100% - 40px))", margin: "0 auto", padding: "clamp(58px, 8vw, 96px) 0" }}>
        <div style={{ maxWidth: 720, marginBottom: 42 }}>
          <p style={{ margin: "0 0 12px", color: "#a8472c", fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>Hosted showcase</p>
          <h2 id="showcase-heading" style={{ margin: "0 0 16px", fontSize: "clamp(2rem, 5vw, 3.6rem)", fontWeight: 500, lineHeight: 1.03, letterSpacing: "-0.035em" }}>Choose a trail through the workshop.</h2>
          <p style={{ margin: 0, color: "#59645e", fontSize: "1.06rem", lineHeight: 1.7 }}>Learning progress and worksheet answers in this hosted demo are browser-local. They remain on this device rather than becoming workshop project files.</p>
        </div>

        {template ? (
          <aside style={{ margin: "0 0 36px", padding: "22px 24px", border: "1px solid #d1a18c", borderLeft: "5px solid #b8582f", background: "#fff8ec" }}>
            <p style={{ margin: "0 0 7px", color: "#843c22", fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>Local-only starter · {template}</p>
            <p style={{ margin: 0, color: "#57473e", lineHeight: 1.65 }}>This link names a project starter for the local AI Robot Workshop app. Open the workshop locally to create from that starter, work with agents, and write the resulting project files.</p>
          </aside>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: 1, border: "1px solid #c9c3b5", background: "#c9c3b5" }}>
          {destinations.map((destination, index) => (
            <Link key={destination.href} href={destination.href} style={{ minHeight: 218, display: "flex", flexDirection: "column", padding: "26px", background: index % 3 === 1 ? "#f8f4e9" : "#fffdf7", color: "#1d2822", textDecoration: "none" }}>
              <span style={{ color: "#a8472c", fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>{destination.eyebrow}</span>
              <strong style={{ margin: "22px 0 12px", fontSize: "1.38rem", fontWeight: 600, lineHeight: 1.15 }}>{destination.title}</strong>
              <span style={{ color: "#59645e", fontSize: "0.95rem", lineHeight: 1.58 }}>{destination.description}</span>
              <span aria-hidden="true" style={{ marginTop: "auto", paddingTop: 22, color: "#285a42", fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: "1rem", fontWeight: 800 }}>→</span>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ padding: "clamp(52px, 8vw, 86px) 20px", background: "#e1ebe3", borderTop: "1px solid #c2d0c5" }}>
        <div style={{ width: "min(900px, 100%)", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 34, alignItems: "start" }}>
          <h2 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 500, lineHeight: 1.08 }}>The full workshop lives on your machine.</h2>
          <div>
            <p style={{ margin: 0, color: "#385143", fontSize: "1.03rem", lineHeight: 1.75 }}>Agents, project files, and specification ingestion run in the local app, where your workspace and tools are available. This hosted boundary is for learning, worksheets, guides, and exploration.</p>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 20, fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              <a href="https://github.com/Metatransformer/robot-workshop" style={{ color: "#285a42" }}>Source</a>
              <a href="https://metatransformer.com/blog/ai-robot-workshop" style={{ color: "#285a42" }}>Article</a>
              <a href="https://github.com/Metatransformer/robot-workshop#clone-install-and-run-locally" style={{ color: "#285a42" }}>Run locally</a>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ padding: "28px 20px", background: "#1d2822", color: "#bfc9c2", textAlign: "center", fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace", fontSize: "0.68rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Learn here · build locally</footer>
    </main>
  );
}
