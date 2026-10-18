import type { ProjectDetail, Source } from "./contracts";
import type { LearningModule, LearningSource } from "./curriculum/types";

export type ReportSection = {
  title: string;
  markdown: string;
};

export type ReportSource = {
  title: string;
  url: string;
};

export type ReportModel = {
  title: string;
  subtitle?: string;
  sections: ReportSection[];
  sources: ReportSource[];
};

function escapeMarkdownText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replace(/([\\`*_[\]{}()#+\-.!|])/g, "\\$1");
}

function markdownList(values: string[], emptyMessage: string): string {
  return values.length > 0
    ? values.map((value) => `- ${escapeMarkdownText(value)}`).join("\n")
    : escapeMarkdownText(emptyMessage);
}

function numberedMarkdownList(values: string[]): string {
  return values.map((value, index) => `${index + 1}. ${escapeMarkdownText(value)}`).join("\n");
}

function safeHttpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.href;
  } catch {
    return undefined;
  }
}

function reportSources(sources: Array<LearningSource | Source>): ReportSource[] {
  const seen = new Set<string>();
  const result: ReportSource[] = [];
  for (const source of sources) {
    const title = source.title.trim() || "Untitled source";
    const url = safeHttpUrl(source.url) ?? "";
    const key = `${title}\0${url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ title, url });
  }
  return result;
}

function sourceReference(source: Source): string {
  const title = escapeMarkdownText(source.title.trim() || "Untitled source");
  const url = safeHttpUrl(source.url);
  return url ? `[${title}](<${url}>)` : `${title} (link omitted)`;
}

function choiceLabel(index: number): string {
  return index >= 0 && index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}

export function buildLessonReport(module: LearningModule): ReportModel {
  const answer = module.exercise.choices[module.exercise.answerIndex];
  const choices = module.exercise.choices
    .map((choice, index) => `${choiceLabel(index)}. ${escapeMarkdownText(choice)}`)
    .join("\n");

  return {
    title: module.title,
    subtitle: `${module.level} · ${module.minutes} minutes · ${module.summary}`,
    sections: [
      {
        title: "Learning outcomes",
        markdown: markdownList(module.outcomes, "No outcomes are listed."),
      },
      {
        title: "Prerequisites",
        markdown: markdownList(module.prerequisites, "No prerequisites are listed."),
      },
      {
        title: "Concepts",
        markdown: module.concepts,
      },
      {
        title: "Worked example",
        markdown: [
          "### Problem",
          escapeMarkdownText(module.workedExample.problem),
          "",
          "### Steps",
          numberedMarkdownList(module.workedExample.steps),
          "",
          "### Result",
          escapeMarkdownText(module.workedExample.result),
          "",
          "### Sanity check",
          escapeMarkdownText(module.workedExample.sanityCheck),
        ].join("\n"),
      },
      {
        title: "Check your understanding",
        markdown: [
          escapeMarkdownText(module.exercise.question),
          "",
          choices,
          "",
          "Your answer: ______________________________",
          "",
          "Reasoning:  ",
          "____________________________________________________________  ",
          "____________________________________________________________",
        ].join("\n"),
      },
      {
        title: "Answer key",
        markdown: [
          "**ANSWER KEY — check only after attempting the question.**",
          "",
          answer === undefined
            ? "No authored answer is available."
            : `**${choiceLabel(module.exercise.answerIndex)}. ${escapeMarkdownText(answer)}**`,
          "",
          escapeMarkdownText(module.exercise.explanation),
        ].join("\n"),
      },
      {
        title: "Hands-on lab",
        markdown: [
          "### Goal",
          escapeMarkdownText(module.lab.goal),
          "",
          "### Equipment",
          markdownList(module.lab.equipment, "No equipment is listed."),
          "",
          "### Procedure",
          numberedMarkdownList(module.lab.steps),
          "",
          "### What to observe",
          markdownList(module.lab.observe, "No observation prompts are listed."),
          "",
          "### Transfer challenge",
          escapeMarkdownText(module.lab.transfer),
          "",
          "### Cautions",
          markdownList(module.lab.cautions, "No additional cautions are listed."),
        ].join("\n"),
      },
      {
        title: "Evidence record",
        markdown: [
          "Learner: ____________________    Date: ____________________",
          "",
          "Evidence artifact or file: ____________________________________________",
          "",
          "| Item | Record |",
          "| --- | --- |",
          "| Prediction or expected result |  |",
          "| Actual observation or measurement |  |",
          "| Conditions and tools used |  |",
          "| Difference from expectation |  |",
          "| Next decision or follow-up |  |",
          "",
          "Notes:  ",
          "____________________________________________________________  ",
          "____________________________________________________________  ",
          "____________________________________________________________",
        ].join("\n"),
      },
    ],
    sources: reportSources(module.sources),
  };
}

function projectKind(project: ProjectDetail): string {
  if (project.isExample) return "Example project";
  if (project.provenance) return "Independent project copy";
  return "Project";
}

function provenanceMarkdown(project: ProjectDetail): string {
  if (!project.provenance) return "No parent-project provenance is recorded.";
  const lines = [`- Source project: ${escapeMarkdownText(project.provenance.sourceProjectId)}`];
  if (project.provenance.sourceRevision) {
    lines.push(`- Source revision: ${escapeMarkdownText(project.provenance.sourceRevision)}`);
  }
  return lines.join("\n");
}

function bomMarkdown(project: ProjectDetail): string {
  if (project.bom.length === 0) return "No parts or tools are listed in this project.";
  const rows = project.bom.map((entry) => {
    const item = entry.snapshot;
    const identity = [item.manufacturer, item.model].filter(Boolean).map((value) => escapeMarkdownText(value!)).join(" / ") || "Not specified";
    const references = item.sources.length > 0 ? item.sources.map(sourceReference).join("; ") : "No source attached";
    return `| ${escapeMarkdownText(String(entry.quantity))} | ${escapeMarkdownText(entry.role)} | ${escapeMarkdownText(item.name)} | ${identity} | ${references} |`;
  });
  return [
    "Quantities below are project requirements, not owned inventory, price, or supplier stock. A source link documents the recorded part; it does not prove ordering or compatibility.",
    "",
    "| Exact quantity | Role | Part or tool | Manufacturer / model | Source reference |",
    "| ---: | --- | --- | --- | --- |",
    ...rows,
  ].join("\n");
}

function isTranscriptPath(filePath: string): boolean {
  const segments = filePath.toLowerCase().replaceAll("\\", "/").split("/");
  const name = segments.at(-1) ?? "";
  const transcriptMarkers = new Set([".codex", ".claude", ".agents", "transcripts", "agent-transcripts", "agent_transcripts"]);
  return name.includes("transcript") || segments.some((segment) => transcriptMarkers.has(segment));
}

function safeDocumentTitle(filePath: string, index: number): string {
  const absolute = filePath.startsWith("/") || filePath.startsWith("\\") || /^[a-z]:[\\/]/i.test(filePath);
  return absolute || filePath.includes("\0") ? `Selected document ${index + 1}` : `Selected document: ${filePath}`;
}

function printableDocument(filePath: string, content: string): string {
  if (/\.(md|markdown)$/i.test(filePath)) return content;
  // Keep firmware, CSV, and plain text literal, including embedded backticks.
  const fence = "`".repeat(Math.max(3, ...Array.from(content.matchAll(/`+/g), match => match[0].length + 1)));
  const extension = filePath.split(".").at(-1)?.toLowerCase() ?? "";
  const language = ({ py: "python", ts: "typescript", js: "javascript", json: "json", csv: "csv", ino: "cpp" } as Record<string, string>)[extension] ?? "";
  return `${fence}${language}\n${content}\n${fence}`;
}

export function buildProjectReport(
  project: ProjectDetail,
  documents: Array<{ path: string; content: string }>,
): ReportModel {
  const selectedDocumentSections = documents.flatMap((document, index): ReportSection[] => {
    if (isTranscriptPath(document.path)) return [];
    return [{
      title: safeDocumentTitle(document.path, index),
      markdown: printableDocument(document.path, document.content),
    }];
  });
  const sources = reportSources(project.bom.flatMap((entry) => entry.snapshot.sources));

  return {
    title: project.title,
    subtitle: "Printable build report",
    sections: [
      {
        title: "Project summary and status",
        markdown: [
          "### Description",
          project.description ? escapeMarkdownText(project.description) : "No description is recorded.",
          "",
          "### Status",
          `- Record type: ${escapeMarkdownText(projectKind(project))}`,
          "- Completion status: Not specified in project metadata.",
          "- Validation status: This report does not claim that the design has been built, tested, certified, or found compatible.",
          "",
          "### Provenance",
          provenanceMarkdown(project),
        ].join("\n"),
      },
      {
        title: "Bill of materials",
        markdown: bomMarkdown(project),
      },
      {
        title: "Claims and evidence boundaries",
        markdown: [
          "- **Design claims:** The description, bill of materials, and selected documents record design intent. They are not proof of performance, fit, safety, or compatibility.",
          "- **Estimates:** Treat values identified as estimates as estimates. This report adds no calculated or purchasing estimates.",
          "- **Test observations:** Only observations explicitly recorded in a selected document or completed test record are observations. Blank fields are not results.",
        ].join("\n"),
      },
      ...selectedDocumentSections,
      {
        title: "Blank test record",
        markdown: [
          "Complete this record during or after a real test. Do not fill the actual-result fields from an expectation.",
          "",
          "Date/time: ____________________    Tester: ____________________",
          "",
          "Build or software revision: __________________________________________",
          "",
          "Requirement or question:  ",
          "____________________________________________________________",
          "",
          "Setup, conditions, and instruments:  ",
          "____________________________________________________________  ",
          "____________________________________________________________",
          "",
          "Expected result and basis:  ",
          "____________________________________________________________  ",
          "____________________________________________________________",
          "",
          "Actual observations or measurements:  ",
          "____________________________________________________________  ",
          "____________________________________________________________  ",
          "____________________________________________________________",
          "",
          "Result: ☐ Pass  ☐ Fail  ☐ Inconclusive  ☐ Not evaluated",
          "",
          "Evidence or log reference: ___________________________________________",
          "",
          "Follow-up action:  ",
          "____________________________________________________________",
        ].join("\n"),
      },
    ],
    sources,
  };
}
