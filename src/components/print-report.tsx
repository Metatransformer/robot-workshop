"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./print-report.css";

export type PrintReportProps = {
  title: string;
  subtitle?: string;
  sections: Array<{ title: string; markdown: string }>;
  sources?: Array<{ title: string; url: string }>;
  backHref: string;
};

function safeHttpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

function markdownUrlTransform(url: string, key: string): string {
  if (key === "src") return "";
  return safeHttpUrl(url) ?? "";
}

export function PrintReport({ title, subtitle, sections, sources = [], backHref }: PrintReportProps) {
  return (
    <div className="print-report-shell">
      <nav className="print-report-controls appchrome" aria-label="Report controls">
        <a href={backHref}>← Back</a>
        <p>This preview is the content that will print. Choose “Save as PDF” in your browser’s print dialog to make a PDF.</p>
        <button type="button" onClick={() => window.print()}>Print / Save PDF</button>
      </nav>

      <main className="print-report-page">
        <header className="print-report-heading">
          <p className="print-report-kicker">Metatransformer report</p>
          <h1>{title}</h1>
          {subtitle && <p className="print-report-subtitle">{subtitle}</p>}
          <p className="print-report-format-note"><strong>Text report:</strong> images and diagrams are omitted, and links to project files are inactive. Keep the exported project alongside this PDF for wiring diagrams, models, and linked files.</p>
        </header>

        {sections.map((section, index) => {
          const headingId = `report-section-${index + 1}`;
          const answerKey = section.title.toLowerCase() === "answer key";
          return (
            <section
              className={`print-report-section${answerKey ? " print-report-section--answer-key" : ""}`}
              aria-labelledby={headingId}
              key={`${section.title}-${index}`}
            >
              <h2 id={headingId}>{section.title}</h2>
              <div className="print-report-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  skipHtml
                  urlTransform={markdownUrlTransform}
                  components={{
                    a: ({ href, children }) => {
                      const safeHref = safeHttpUrl(href);
                      return safeHref
                        ? <a href={safeHref} target="_blank" rel="noopener noreferrer">{children}<span className="print-report-screen-reader"> (opens in a new tab)</span></a>
                        : <span className="print-report-inert-link">{children}</span>;
                    },
                    img: ({ alt }) => alt
                      ? <span className="print-report-image-placeholder">[Image omitted: {alt}]</span>
                      : null,
                  }}
                >
                  {section.markdown}
                </ReactMarkdown>
              </div>
            </section>
          );
        })}

        {sources.length > 0 && (
          <section className="print-report-section print-report-sources" aria-labelledby="report-sources-heading">
            <h2 id="report-sources-heading">Sources and references</h2>
            <ol>
              {sources.map((source, index) => {
                const safeHref = safeHttpUrl(source.url);
                return (
                  <li key={`${source.title}-${source.url}-${index}`}>
                    {safeHref
                      ? <a href={safeHref} target="_blank" rel="noopener noreferrer">{source.title}<span className="print-report-screen-reader"> (opens in a new tab)</span></a>
                      : <span>{source.title} <span className="print-report-link-omitted">(link omitted)</span></span>}
                  </li>
                );
              })}
            </ol>
          </section>
        )}
      </main>
    </div>
  );
}

export default PrintReport;
