import { describe, expect, it } from "vitest";
import { buildLessonReport, buildProjectReport } from "../src/lib/build-report";
import type { ProjectDetail } from "../src/lib/contracts";
import type { LearningModule } from "../src/lib/curriculum/types";

const lesson: LearningModule = {
  id: "report-lesson",
  track: "foundations",
  title: "Evidence before claims",
  summary: "Practice separating an expectation from an observation.",
  minutes: 30,
  level: "Foundation",
  prerequisites: ["measurement-basics"],
  outcomes: ["Record one observation without turning it into a general claim."],
  concepts: "A **prediction** is not a measured result.",
  workedExample: {
    problem: "Decide whether a stated value is measured.",
    steps: ["Find the instrument and conditions.", "Look for an actual recorded value."],
    result: "No measurement was supplied.",
    sanityCheck: "An expected value alone is not evidence.",
  },
  exercise: {
    question: "Which entry is an observation?",
    choices: ["The motor should draw 1 A.", "The meter displayed 0.82 A at 5 V."],
    answerIndex: 1,
    explanation: "The second entry identifies an instrument reading and condition.",
  },
  lab: {
    goal: "Record a bench observation.",
    equipment: ["meter"],
    steps: ["Make the circuit safe.", "Record the display."],
    observe: ["Record the actual display rather than the nominal value."],
    transfer: "Repeat under one changed condition.",
    cautions: ["Use only low voltage."],
  },
  projectIds: ["blank"],
  glossary: ["evidence"],
  sources: [
    { title: "Safe handbook", url: "https://example.com/handbook" },
    { title: "Unsafe link", url: "javascript:alert(1)" },
  ],
};

const project: ProjectDetail = {
  schemaVersion: 1,
  id: "report-project",
  title: "Bench [prototype]",
  description: "Test <script>alert(1)</script> only after **review**.",
  templateId: "blank",
  model: "none",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-02T00:00:00.000Z",
  parameters: {},
  provenance: { sourceProjectId: "source-project", sourceRevision: "revision-123" },
  bom: [{
    itemId: "sensor-part",
    quantity: 2.75,
    role: "component",
    snapshot: {
      id: "sensor-part",
      name: "Sensor | breakout",
      kind: "part",
      category: "sensor",
      description: "Public part description",
      manufacturer: "Example Devices",
      model: "ED-1",
      tags: [],
      specs: [],
      sources: [
        {
          id: "official-source",
          title: "Official product page",
          url: "https://example.com/products/ed-1",
          capturedAt: "2026-10-01T00:00:00.000Z",
          text: "PRIVATE CAPTURED SOURCE FULLTEXT",
        },
        {
          id: "unsafe-source",
          title: "Unsafe product link",
          url: "data:text/html,unsafe",
          capturedAt: "2026-10-01T00:00:00.000Z",
        },
      ],
      ownedQuantity: 99,
      notes: "PRIVATE SHELF NOTE",
      version: 7,
      createdAt: "2026-10-01T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
    },
  }],
  directory: "/Users/example/private-workshop/report-project",
  files: [
    { path: "README.md", size: 10, hash: "readme-hash", kind: "document" },
    { path: "PRIVATE.md", size: 10, hash: "private-hash", kind: "document" },
  ],
  guide: "UNSELECTED GUIDE CONTENT",
};

describe("print report models", () => {
  it("preserves firmware as literal code, including Markdown-like content", () => {
    const code = '# heading-like comment\nprint("``` and **literal**")\n';
    const report = buildProjectReport(project, [{ path: "code.py", content: code }]);
    const section = report.sections.find(section => section.title === "Selected document: code.py");
    expect(section?.markdown).toContain(code);
    expect(section?.markdown).toMatch(/^`{4,}python\n/);
  });
  it("includes the authored lesson answer in a clearly labelled answer key", () => {
    const report = buildLessonReport(lesson);
    const answerKey = report.sections.find((section) => section.title === "Answer key");

    expect(answerKey?.markdown).toContain("ANSWER KEY");
    expect(answerKey?.markdown).toContain("The meter displayed 0\\.82 A at 5 V\\.");
    expect(answerKey?.markdown).toContain("identifies an instrument reading");
    expect(report.sections.some((section) => section.title === "Evidence record")).toBe(true);
  });

  it("keeps source URLs non-executable while retaining inert citation text", () => {
    const lessonReport = buildLessonReport(lesson);
    const projectReport = buildProjectReport(project, []);

    expect(lessonReport.sources).toContainEqual({ title: "Safe handbook", url: "https://example.com/handbook" });
    expect(lessonReport.sources).toContainEqual({ title: "Unsafe link", url: "" });
    expect(projectReport.sources).toContainEqual({ title: "Unsafe product link", url: "" });
    expect(JSON.stringify([lessonReport.sources, projectReport.sources])).not.toMatch(/javascript:|data:text/i);
  });

  it("preserves exact BOM quantities without leaking private catalog or filesystem metadata", () => {
    const report = buildProjectReport(project, []);
    const serialized = JSON.stringify(report);
    const bom = report.sections.find((section) => section.title === "Bill of materials");

    expect(bom?.markdown).toContain("| 2\\.75 | component | Sensor \\| breakout |");
    expect(serialized).not.toContain(project.directory);
    expect(serialized).not.toContain("PRIVATE SHELF NOTE");
    expect(serialized).not.toContain("PRIVATE CAPTURED SOURCE FULLTEXT");
    expect(serialized).not.toContain("UNSELECTED GUIDE CONTENT");
    expect(serialized).not.toContain("ownedQuantity");
    expect(serialized).not.toContain("version\":7");
  });

  it("includes only supplied selected documents and excludes agent transcripts", () => {
    const selected = "# Selected build notes\n\nOnly this file was chosen.";
    const report = buildProjectReport(project, [
      { path: "README.md", content: selected },
      { path: "transcripts/agent-session.md", content: "PRIVATE AGENT TRANSCRIPT" },
    ]);
    const serialized = JSON.stringify(report);

    expect(report.sections).toContainEqual({ title: "Selected document: README.md", markdown: selected });
    expect(serialized).not.toContain("PRIVATE.md");
    expect(serialized).not.toContain("UNSELECTED GUIDE CONTENT");
    expect(serialized).not.toContain("PRIVATE AGENT TRANSCRIPT");
  });
});
