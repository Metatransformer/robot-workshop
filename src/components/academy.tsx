"use client";

import "./academy.css";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown,
  Circle, Download, ExternalLink, FileDown, FlaskConical, GraduationCap, Library,
  Menu, RotateCcw, Search, Upload, Wrench, X,
} from "lucide-react";
import { glossaryEntries, modules, projectPaths, tracks, type GlossaryEntry, type LearningModule } from "@/lib/curriculum";
import {
  MAX_NOTE_LENGTH,
  emptyLearningProgress,
  emptyModuleProgress,
  loadLearningProgress,
  mergeLearningProgress,
  parseLearningProgress,
  saveLearningProgress,
  serializeLearningProgress,
  validateDemonstrationNote,
  type LearningProgressState,
} from "@/lib/learning-progress";

export type AcademyProps = {
  initialLessonId?: string;
  initialProject?: string;
  initialTermId?: string;
};

const browserProgressStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
};

type Notice = { kind: "error" | "success" | "info"; text: string };
type QuizAttempt = { selected: number | null; submitted: boolean };
type RestoreMode = "merge" | "replace";

function ProgressMark({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={done ? "academy-status is-done" : "academy-status"}>
      {done ? <CheckCircle2 aria-hidden="true" /> : <Circle aria-hidden="true" />}
      {label}
    </span>
  );
}

function lessonHref(id: string, project?: string) {
  const query = new URLSearchParams({ lesson: id });
  if (project) query.set("project", project);
  return `/learn?${query.toString()}`;
}

function moduleTitle(id: string) {
  return modules.find((module) => module.id === id)?.title ?? id.replaceAll("-", " ");
}

function includesQuery(module: LearningModule, query: string) {
  if (!query) return true;
  const projectLanguage = projectPaths
    .filter((path) => module.projectIds.includes(path.templateId))
    .flatMap((path) => [path.title, path.description]);
  return [module.title, module.summary, ...module.outcomes, module.concepts, ...projectLanguage]
    .join(" ")
    .toLocaleLowerCase()
    .includes(query);
}

export default function Academy({ initialLessonId, initialProject, initialTermId }: AcademyProps) {
  const validModuleIds = useMemo(() => modules.map((module) => module.id), []);
  const [progress, setProgress] = useState<LearningProgressState>(emptyLearningProgress);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [courseOpen, setCourseOpen] = useState(false);
  const [courseQuery, setCourseQuery] = useState("");
  const [glossaryQuery, setGlossaryQuery] = useState(initialTermId && initialTermId !== "all" ? initialTermId : "");
  const [quizAttempts, setQuizAttempts] = useState<Record<string, QuizAttempt>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [noteErrors, setNoteErrors] = useState<Record<string, string>>({});
  const [restoreMode, setRestoreMode] = useState<RestoreMode>("merge");
  const restoreInput = useRef<HTMLInputElement>(null);
  const glossaryMode = initialTermId !== undefined;
  const lesson = initialLessonId ? modules.find((item) => item.id === initialLessonId) : modules[0];
  const unknownLesson = Boolean(initialLessonId && !lesson);
  const selectedProject = projectPaths.find((path) => path.templateId === initialProject);

  useEffect(() => {
    const loaded = loadLearningProgress(browserProgressStorage, validModuleIds);
    if (!loaded.ok) {
      setNotice({ kind: "error", text: loaded.error });
      return;
    }
    setProgress(loaded.value);
    setNoteDrafts(Object.fromEntries(Object.entries(loaded.value.records).map(([id, record]) => [id, record.notes])));
    if (loaded.warnings.length) setNotice({ kind: "info", text: loaded.warnings.join(" ") });
  }, [validModuleIds]);

  useEffect(() => {
    setGlossaryQuery(initialTermId && initialTermId !== "all" ? initialTermId : "");
  }, [initialTermId]);

  const lessonProgress = lesson ? progress.records[lesson.id] ?? emptyModuleProgress() : emptyModuleProgress();
  const noteDraft = lesson ? noteDrafts[lesson.id] ?? lessonProgress.notes : "";
  const query = courseQuery.trim().toLocaleLowerCase();
  const filteredModules = useMemo(() => modules.filter((module) => includesQuery(module, query)), [query]);
  const readCount = modules.filter((module) => progress.records[module.id]?.read).length;
  const practicedCount = modules.filter((module) => progress.records[module.id]?.practiced).length;
  const demonstratedCount = modules.filter((module) => progress.records[module.id]?.demonstrated).length;
  const completedDimensions = readCount + practicedCount + demonstratedCount;

  const persistRecord = (moduleId: string, patch: Partial<ReturnType<typeof emptyModuleProgress>>) => {
    const next: LearningProgressState = {
      version: progress.version,
      records: {
        ...progress.records,
        [moduleId]: {
          ...(progress.records[moduleId] ?? emptyModuleProgress()),
          ...patch,
          updatedAt: new Date().toISOString(),
        },
      },
    };
    setProgress(next);
    const saved = saveLearningProgress(browserProgressStorage, next);
    setNotice(saved.ok
      ? { kind: "success", text: "Progress saved in this browser." }
      : { kind: "error", text: saved.error });
  };

  const submitQuiz = () => {
    if (!lesson) return;
    const attempt = quizAttempts[lesson.id] ?? { selected: null, submitted: false };
    if (attempt.selected === null) return;
    setQuizAttempts((current) => ({ ...current, [lesson.id]: { ...attempt, submitted: true } }));
    if (attempt.selected === lesson.exercise.answerIndex && !lessonProgress.practiced) {
      persistRecord(lesson.id, { practiced: true });
    }
  };

  const saveNotes = () => {
    if (!lesson) return;
    if (lessonProgress.demonstrated) {
      const evidence = validateDemonstrationNote(noteDraft);
      if (!evidence.ok) { setNoteErrors(current => ({ ...current, [lesson.id]: evidence.error })); return; }
    }
    setNoteErrors((current) => ({ ...current, [lesson.id]: "" }));
    persistRecord(lesson.id, { notes: noteDraft });
  };

  const markDemonstrated = () => {
    if (!lesson) return;
    const validation = validateDemonstrationNote(noteDraft);
    if (!validation.ok) {
      setNoteErrors((current) => ({ ...current, [lesson.id]: validation.error }));
      return;
    }
    setNoteDrafts((current) => ({ ...current, [lesson.id]: validation.value }));
    setNoteErrors((current) => ({ ...current, [lesson.id]: "" }));
    persistRecord(lesson.id, { notes: validation.value, demonstrated: true });
  };

  const exportProgress = () => {
    const blob = new Blob([serializeLearningProgress(progress)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "metatransformer-learning-progress.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const restoreProgress = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) { setNotice({ kind: "error", text: "Progress backups must be smaller than 2 MB." }); return; }
      const parsed = parseLearningProgress(await file.text(), validModuleIds);
      if (!parsed.ok) {
        setNotice({ kind: "error", text: parsed.error });
        return;
      }
      const next = restoreMode === "merge" ? mergeLearningProgress(progress, parsed.value) : parsed.value;
      setProgress(next);
      setNoteDrafts(Object.fromEntries(Object.entries(next.records).map(([id, record]) => [id, record.notes])));
      const saved = saveLearningProgress(browserProgressStorage, next);
      if (!saved.ok) {
        setNotice({ kind: "error", text: `${saved.error} The restored progress is available in this tab and can still be exported.` });
      } else {
        setNotice({
          kind: parsed.warnings.length ? "info" : "success",
          text: `${restoreMode === "merge" ? "Progress merged. Existing achievements were kept; newer notes were kept where possible. Bench evidence takes priority over a short draft." : "Progress replaced with the matching records from the backup."}${parsed.warnings.length ? ` ${parsed.warnings.join(" ")}` : ""}`,
        });
      }
    } catch {
      setNotice({ kind: "error", text: "The selected progress file could not be read." });
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="academy-shell">
      <header className="academy-header">
        <Link className="academy-brand" href="/" aria-label="Metatransformer Workshop">
          <span className="academy-brand__mark">MT</span>
          <span><b>Builder Academy</b><small>Learn it. Test it. Build it.</small></span>
        </Link>
        <nav className="academy-header__nav" aria-label="Academy navigation">
          <Link className={!glossaryMode ? "is-current" : ""} href={lesson ? lessonHref(lesson.id, initialProject) : "/learn"}>
            <BookOpen aria-hidden="true" /> Course
          </Link>
          <Link className={glossaryMode ? "is-current" : ""} href="/learn?term=all">
            <Library aria-hidden="true" /> Glossary
          </Link>
          <Link href="/"><ArrowLeft aria-hidden="true" /> Workshop</Link>
        </nav>
        <button className="academy-course-toggle" type="button" aria-expanded={courseOpen} aria-controls="academy-course-map" onClick={() => setCourseOpen((open) => !open)}>
          {courseOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />} Course map
        </button>
      </header>

      {notice && (
        <div className={`academy-notice is-${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>
          {notice.kind === "error" ? <AlertTriangle aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
          <span>{notice.text}</span>
          <button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)}><X aria-hidden="true" /></button>
        </div>
      )}

      <div className="academy-layout">
        <aside id="academy-course-map" className={courseOpen ? "academy-sidebar is-open" : "academy-sidebar"} aria-label="Course map">
          <div className="academy-sidebar__intro">
            <span className="academy-eyebrow">Your evidence</span>
            <strong>{completedDimensions} of {modules.length * 3} learning marks</strong>
            <progress value={completedDimensions} max={modules.length * 3} aria-label={`${completedDimensions} of ${modules.length * 3} learning marks`} />
            <div className="academy-tally" aria-label="Progress breakdown">
              <span><b>{readCount}</b> read</span><span><b>{practicedCount}</b> practiced</span><span><b>{demonstratedCount}</b> bench</span>
            </div>
          </div>

          <div className="academy-sidebar__tools">
            <label className="academy-search">
              <span className="academy-sr-only">Search lessons by goal, title, summary, or outcome</span>
              <Search aria-hidden="true" />
              <input value={courseQuery} onChange={(event) => setCourseQuery(event.target.value)} placeholder="What are you trying to build or fix?" />
              {courseQuery && <button type="button" onClick={() => setCourseQuery("")} aria-label="Clear lesson search"><X aria-hidden="true" /></button>}
            </label>
            <span className="academy-result-count" aria-live="polite">{filteredModules.length} {filteredModules.length === 1 ? "lesson" : "lessons"}</span>
          </div>

          <div className="academy-project-picker">
            <span className="academy-eyebrow">Learn for a project</span>
            <div className="academy-project-links">
              {projectPaths.map((path) => {
                const href = lessonHref(lesson?.id ?? modules[0]?.id ?? "", path.templateId);
                return <Link key={path.templateId} className={path.templateId === initialProject ? "is-active" : ""} href={href}>{path.title}</Link>;
              })}
            </div>
            {initialProject && !selectedProject && <p className="academy-inline-error">That project path does not exist. Choose one above.</p>}
            {selectedProject && (
              <details open className="academy-project-path">
                <summary><ChevronDown aria-hidden="true" /> {selectedProject.required.length} required · {selectedProject.optional.length} optional</summary>
                <p>{selectedProject.description}</p>
                <b>Required</b>
                <ol>
                  {selectedProject.required.map((id) => <li key={id}><Link href={lessonHref(id, selectedProject.templateId)}>{moduleTitle(id)}</Link></li>)}
                </ol>
                <b>Optional</b>
                <ul>
                  {selectedProject.optional.map((id) => <li key={id}><Link href={lessonHref(id, selectedProject.templateId)}>{moduleTitle(id)}</Link></li>)}
                </ul>
                <Link className="academy-studio-link" href={`/?template=${selectedProject.templateId}`}><Wrench aria-hidden="true" /> Open this project in Studio</Link>
              </details>
            )}
          </div>

          <nav className="academy-track-list" aria-label="Lessons by track">
            {tracks.map((track) => {
              const trackModules = filteredModules.filter((module) => module.track === track.id);
              if (!trackModules.length) return null;
              const trackRead = trackModules.filter((module) => progress.records[module.id]?.read).length;
              return (
                <details key={track.id} open={!query || trackModules.some((module) => module.id === lesson?.id)}>
                  <summary>
                    <span><b>{track.title}</b><small>{track.description}</small></span>
                    <span>{trackRead}/{trackModules.length}<ChevronDown aria-hidden="true" /></span>
                  </summary>
                  <ol>
                    {trackModules.map((module) => {
                      const record = progress.records[module.id];
                      return (
                        <li key={module.id}>
                          <Link className={module.id === lesson?.id && !glossaryMode ? "is-current" : ""} href={lessonHref(module.id, initialProject)} onClick={() => setCourseOpen(false)}>
                            <span className="academy-module-number">{String(modules.indexOf(module) + 1).padStart(2, "0")}</span>
                            <span>{module.title}<small>{module.minutes} min · {module.level}</small></span>
                            <span className="academy-mini-marks" aria-label={`${record?.read ? "Read" : "Not read"}, ${record?.practiced ? "practiced" : "not practiced"}, ${record?.demonstrated ? "demonstrated" : "not demonstrated"}`}>
                              <i className={record?.read ? "is-done" : ""} /><i className={record?.practiced ? "is-done" : ""} /><i className={record?.demonstrated ? "is-done" : ""} />
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </details>
              );
            })}
            {filteredModules.length === 0 && (
              <div className="academy-empty"><Search aria-hidden="true" /><b>No lessons match that search.</b><span>Try the thing you want to make, a symptom, or a broader topic.</span><button type="button" onClick={() => setCourseQuery("")}>Clear search</button></div>
            )}
          </nav>

          <div className="academy-portability">
            <button type="button" onClick={exportProgress}><Download aria-hidden="true" /> Export progress</button>
            <fieldset>
              <legend>Restore behavior</legend>
              <label><input type="radio" name="restore-mode" value="merge" checked={restoreMode === "merge"} onChange={() => setRestoreMode("merge")} /> Merge</label>
              <label><input type="radio" name="restore-mode" value="replace" checked={restoreMode === "replace"} onChange={() => setRestoreMode("replace")} /> Replace</label>
            </fieldset>
            <button type="button" onClick={() => restoreInput.current?.click()}><Upload aria-hidden="true" /> Restore a backup</button>
            <input ref={restoreInput} className="academy-sr-only" type="file" accept="application/json,.json" onChange={restoreProgress} aria-label="Choose a progress JSON file to restore" />
            <p><b>Merge</b> keeps achieved marks and uses imported notes when present. <b>Replace</b> starts from the backup. Both ignore unknown lesson IDs and require the current file version.</p>
          </div>
        </aside>

        <main className="academy-main">
          {glossaryMode ? (
            <GlossaryView initialTermId={initialTermId} query={glossaryQuery} onQueryChange={setGlossaryQuery} project={initialProject} />
          ) : unknownLesson ? (
            <Recovery title="Lesson not found" detail={`There is no lesson named “${initialLessonId}”. The link may be old or mistyped.`} project={initialProject} />
          ) : lesson ? (
            <LessonReader
              lesson={lesson}
              project={selectedProject?.templateId}
              progress={lessonProgress}
              noteDraft={noteDraft}
              noteError={noteErrors[lesson.id]}
              quizAttempt={quizAttempts[lesson.id] ?? { selected: null, submitted: false }}
              onQuizSelect={(selected) => setQuizAttempts((current) => ({ ...current, [lesson.id]: { selected, submitted: false } }))}
              onQuizSubmit={submitQuiz}
              onQuizRetry={() => setQuizAttempts((current) => ({ ...current, [lesson.id]: { selected: null, submitted: false } }))}
              onMarkRead={() => persistRecord(lesson.id, { read: true })}
              onNoteChange={(value) => setNoteDrafts((current) => ({ ...current, [lesson.id]: value }))}
              onSaveNotes={saveNotes}
              onMarkDemonstrated={markDemonstrated}
            />
          ) : (
            <Recovery title="The course is empty" detail="Curriculum data is not available yet." />
          )}
        </main>
      </div>
    </div>
  );
}

function Recovery({ title, detail, project }: { title: string; detail: string; project?: string }) {
  return (
    <section className="academy-recovery">
      <span className="academy-eyebrow">Let’s get you oriented</span>
      <h1>{title}</h1>
      <p>{detail}</p>
      <div className="academy-recovery__links">
        {modules.slice(0, 6).map((module) => <Link key={module.id} href={lessonHref(module.id, project)}>{module.title}<ArrowRight aria-hidden="true" /></Link>)}
      </div>
      <Link className="academy-primary-link" href="/learn">Start at the beginning</Link>
    </section>
  );
}

function GlossaryView({ initialTermId, query, onQueryChange, project }: { initialTermId?: string; query: string; onQueryChange: (value: string) => void; project?: string }) {
  const normalized = query.trim().toLocaleLowerCase();
  const exactTerm = initialTermId && initialTermId !== "all" && normalized === initialTermId.toLocaleLowerCase() ? glossaryEntries.find((entry) => entry.id === initialTermId) : undefined;
  const unknownTerm = Boolean(initialTermId && initialTermId !== "all" && !glossaryEntries.some(entry => entry.id === initialTermId));
  const entries = exactTerm && query === initialTermId
    ? [exactTerm]
    : glossaryEntries.filter((entry) => [entry.id, entry.term, ...entry.aliases, entry.plain, entry.technical, entry.units, entry.formula, entry.example, entry.misconception]
      .filter(Boolean).join(" ").toLocaleLowerCase().includes(normalized));

  return (
    <div className="academy-glossary">
      <header className="academy-glossary__hero">
        <span className="academy-eyebrow">Bench reference · {glossaryEntries.length} terms</span>
        <h1>Words worth knowing</h1>
        <p>Start with the plain-language meaning, then reach for the technical definition when you need precision.</p>
        <label className="academy-glossary-search">
          <span>Search terms, meanings, units, or misconceptions</span>
          <div><Search aria-hidden="true" /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Try voltage, backlash, or error" />{query && <button type="button" aria-label="Clear glossary search" onClick={() => onQueryChange("")}><X aria-hidden="true" /></button>}</div>
        </label>
      </header>
      {unknownTerm && (
        <div className="academy-callout is-warning" role="alert"><AlertTriangle aria-hidden="true" /><div><b>Term not found</b><p>There is no glossary entry named “{initialTermId}”. Search below or return to the full glossary.</p><Link href="/learn?term=all">Show every term</Link></div></div>
      )}
      <p className="academy-result-line" aria-live="polite">Showing {entries.length} {entries.length === 1 ? "term" : "terms"}</p>
      <div className="academy-glossary-list">
        {entries.map((entry) => (
          <article key={entry.id} id={`term-${entry.id}`} className="academy-term">
            <header><div><h2>{entry.term}</h2>{entry.aliases.length > 0 && <p>Also: {entry.aliases.join(", ")}</p>}</div><Link href={`/learn?term=${encodeURIComponent(entry.id)}`}>Link to term</Link></header>
            <div className="academy-term__definitions"><section><span>In plain language</span><p>{entry.plain}</p></section><section><span>Technical definition</span><p>{entry.technical}</p></section></div>
            {(entry.units || entry.formula) && <dl className="academy-term__facts">{entry.units && <><dt>Units</dt><dd>{entry.units}</dd></>}{entry.formula && <><dt>Formula</dt><dd><code>{entry.formula}</code></dd></>}</dl>}
            <div className="academy-term__example"><p><b>Example</b> {entry.example}</p><p><b>Common misconception</b> {entry.misconception}</p></div>
            <footer>
              <span>Used in</span>
              <div>{entry.relatedModules.map((id) => <Link key={id} href={lessonHref(id, project)}>{moduleTitle(id)}</Link>)}</div>
              {entry.sources.length > 0 && <details><summary>Sources</summary><ul>{entry.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink aria-hidden="true" /></a></li>)}</ul></details>}
            </footer>
          </article>
        ))}
      </div>
      {entries.length === 0 && <div className="academy-empty is-wide"><Search aria-hidden="true" /><b>No definitions match “{query}”.</b><span>Try an alias, a unit, or a shorter technical term.</span><button type="button" onClick={() => onQueryChange("")}>Clear search</button></div>}
    </div>
  );
}

type LessonReaderProps = {
  lesson: LearningModule;
  project?: string;
  progress: ReturnType<typeof emptyModuleProgress>;
  noteDraft: string;
  noteError?: string;
  quizAttempt: QuizAttempt;
  onQuizSelect: (index: number) => void;
  onQuizSubmit: () => void;
  onQuizRetry: () => void;
  onMarkRead: () => void;
  onNoteChange: (value: string) => void;
  onSaveNotes: () => void;
  onMarkDemonstrated: () => void;
};

function LessonReader({ lesson, project, progress, noteDraft, noteError, quizAttempt, onQuizSelect, onQuizSubmit, onQuizRetry, onMarkRead, onNoteChange, onSaveNotes, onMarkDemonstrated }: LessonReaderProps) {
  const lessonIndex = modules.findIndex((module) => module.id === lesson.id);
  const projectPath = projectPaths.find((path) => path.templateId === project);
  const pathIds = projectPath ? [...projectPath.required, ...projectPath.optional] : [];
  const pathIndex = pathIds.indexOf(lesson.id);
  const nextId = projectPath
    ? (pathIndex >= 0 ? pathIds[pathIndex + 1] : projectPath.required[0])
    : modules[lessonIndex + 1]?.id;
  const atCoreEnd = projectPath?.required.at(-1) === lesson.id;
  const atPathEnd = Boolean(projectPath && pathIds.at(-1) === lesson.id);
  const nextLesson = modules.find((module) => module.id === nextId);
  const lessonTerms = lesson.glossary.map((id) => glossaryEntries.find((entry) => entry.id === id)).filter((entry): entry is GlossaryEntry => entry !== undefined);
  const isCorrect = quizAttempt.submitted && quizAttempt.selected === lesson.exercise.answerIndex;

  return (
    <article className="academy-reader">
      <div className="academy-reader__crumbs"><span>{tracks.find((track) => track.id === lesson.track)?.title}</span><span>Lesson {lessonIndex + 1} of {modules.length}</span></div>
      <header className="academy-lesson-hero">
        <div className="academy-lesson-hero__meta"><span>{lesson.level}</span><span>{lesson.minutes} minutes</span><span>{lesson.projectIds.length} project connections</span></div>
        <h1>{lesson.title}</h1>
        <p className="academy-deck">{lesson.summary}</p>
        <div className="academy-outcome">
          <span className="academy-eyebrow">After this lesson, you can</span>
          <ul>{lesson.outcomes.map((outcome) => <li key={outcome}><Check aria-hidden="true" />{outcome}</li>)}</ul>
        </div>
        <div className="academy-lesson-actions">
          <button className="academy-primary-button" type="button" onClick={onMarkRead} disabled={progress.read}>{progress.read ? <CheckCircle2 aria-hidden="true" /> : <BookOpen aria-hidden="true" />}{progress.read ? "Marked as read" : "Mark as read"}</button>
          <a href={`/learn/print?lesson=${encodeURIComponent(lesson.id)}`} target="_blank" rel="noreferrer"><FileDown aria-hidden="true" /> Print / Save PDF</a>
          {lesson.simulation && <Link href={`/labs?lab=${encodeURIComponent(lesson.simulation)}`}><FlaskConical aria-hidden="true" /> Open related lab</Link>}
          {lesson.id === "timers-pwm" && <Link href="/labs/servo"><FlaskConical aria-hidden="true" /> Explore the FS90 servo command</Link>}
          {lesson.id === "voltage-current-resistance" && <Link href="/build-guides/sensor-led"><FlaskConical aria-hidden="true" /> Build a sensor LED indicator</Link>}
          {lesson.id === "programming-state" && <Link href="/labs/hysteresis"><FlaskConical aria-hidden="true" /> Explore temperature hysteresis</Link>}
          {lesson.id === "digital-interfaces" && <Link href="/labs/sensor-wiring"><FlaskConical aria-hidden="true" /> Practice Pico sensor wiring</Link>}
        </div>
        <div className="academy-progress-row" aria-label="Lesson progress">
          <ProgressMark done={progress.read} label="Read" /><ProgressMark done={progress.practiced} label="Practiced" /><ProgressMark done={progress.demonstrated} label="Bench demonstrated" />
        </div>
      </header>

      {lesson.prerequisites.length > 0 && (
        <aside className="academy-prerequisites">
          <div><span className="academy-eyebrow">Helpful first, never locked</span><h2>Suggested foundations</h2></div>
          <div>{lesson.prerequisites.map((id) => <Link key={id} href={lessonHref(id, project)}>{moduleTitle(id)}<ArrowRight aria-hidden="true" /></Link>)}</div>
        </aside>
      )}

      {Boolean(lesson.relatedStudy?.length) && <details className="academy-prerequisites"><summary>Related study — optional context</summary><div>{lesson.relatedStudy!.map(id => <Link key={id} href={lessonHref(id, project)}>{moduleTitle(id)}</Link>)}</div></details>}

      <section className="academy-prose">
        <div className="academy-section-heading"><span>01</span><div><p>Understand</p><h2>The working idea</h2></div></div>
        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{lesson.concepts}</ReactMarkdown>
      </section>

      <section className="academy-worked-example">
        <div className="academy-section-heading"><span>02</span><div><p>Follow the reasoning</p><h2>Worked example</h2></div></div>
        <h3>{lesson.workedExample.problem}</h3>
        <ol>{lesson.workedExample.steps.map((step, index) => <li key={`${index}-${step}`}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
        <div className="academy-result"><span>Result</span><p>{lesson.workedExample.result}</p></div>
        <div className="academy-sanity"><CheckCircle2 aria-hidden="true" /><p><b>Sanity check</b>{lesson.workedExample.sanityCheck}</p></div>
      </section>

      <section className="academy-quiz">
        <div className="academy-section-heading"><span>03</span><div><p>Try it yourself</p><h2>Independent check</h2></div></div>
        <fieldset>
          <legend>{lesson.exercise.question}</legend>
          <div className="academy-choices">
            {lesson.exercise.choices.map((choice, index) => (
              <label key={choice} className={quizAttempt.selected === index ? "is-selected" : ""}>
                <input type="radio" name={`quiz-${lesson.id}`} checked={quizAttempt.selected === index} onChange={() => onQuizSelect(index)} />
                <span>{String.fromCharCode(65 + index)}</span><b>{choice}</b>
              </label>
            ))}
          </div>
        </fieldset>
        {!quizAttempt.submitted ? (
          <button className="academy-primary-button" type="button" disabled={quizAttempt.selected === null} onClick={onQuizSubmit}>Check my reasoning</button>
        ) : (
          <div className={isCorrect ? "academy-feedback is-correct" : "academy-feedback is-wrong"} role="status">
            {isCorrect ? <CheckCircle2 aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
            <div><b>{isCorrect ? "Correct. Practice recorded." : "Not yet. Use the explanation, then try again."}</b><p>{lesson.exercise.explanation}</p>{!isCorrect && <button type="button" onClick={onQuizRetry}>Retry the question</button>}</div>
          </div>
        )}
      </section>

      <section className="academy-experiment">
        <div className="academy-section-heading"><span>04</span><div><p>Move to the bench</p><h2>{lesson.lab.goal}</h2></div></div>
        <div className="academy-equipment"><b>Gather</b><ul>{lesson.lab.equipment.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="academy-lab-grid">
          <div><h3>Experiment</h3><ol>{lesson.lab.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
          <div><h3>Observe</h3><ul>{lesson.lab.observe.map((observation) => <li key={observation}>{observation}</li>)}</ul></div>
        </div>
        <div className="academy-transfer"><ArrowRight aria-hidden="true" /><div><span className="academy-eyebrow">Transfer it</span><p>{lesson.lab.transfer}</p></div></div>
        {lesson.lab.cautions.length > 0 && <div className="academy-cautions"><AlertTriangle aria-hidden="true" /><div><b>Limits and cautions</b><ul>{lesson.lab.cautions.map((caution) => <li key={caution}>{caution}</li>)}</ul></div></div>}
      </section>

      <section className="academy-evidence">
        <div className="academy-section-heading"><span>05</span><div><p>Keep evidence</p><h2>Bench note</h2></div></div>
        <p>Record what you expected, what you actually measured or observed, and one difference worth investigating. This is self-reported evidence, not a certification.</p>
        <label htmlFor={`note-${lesson.id}`}>Your module notes</label>
        <textarea id={`note-${lesson.id}`} value={noteDraft} maxLength={MAX_NOTE_LENGTH} onChange={(event) => onNoteChange(event.target.value)} placeholder="Expected… Measured… The difference suggests…" aria-describedby={`note-help-${lesson.id} ${noteError ? `note-error-${lesson.id}` : ""}`} />
        <div id={`note-help-${lesson.id}`} className="academy-note-help"><span>{noteDraft.length.toLocaleString()} / {MAX_NOTE_LENGTH.toLocaleString()}</span><span>A bench demonstration needs a concrete note of at least 20 characters.</span></div>
        {noteError && <p id={`note-error-${lesson.id}`} className="academy-field-error" role="alert">{noteError}</p>}
        <div className="academy-note-actions"><button type="button" onClick={onSaveNotes}>Save notes</button><button className="academy-primary-button" type="button" onClick={onMarkDemonstrated} disabled={progress.demonstrated}>{progress.demonstrated ? <CheckCircle2 aria-hidden="true" /> : <GraduationCap aria-hidden="true" />}{progress.demonstrated ? "Bench demonstration recorded" : "Record bench demonstration"}</button></div>
      </section>

      {lessonTerms.length > 0 && (
        <section className="academy-lesson-glossary">
          <span className="academy-eyebrow">Terms in this lesson</span>
          <div>{lessonTerms.map((entry) => <Link key={entry.id} href={`/learn?term=${encodeURIComponent(entry.id)}`}><b>{entry.term}</b><span>{entry.plain}</span></Link>)}</div>
          <Link className="academy-text-link" href="/learn?term=all">Browse the advanced glossary <ArrowRight aria-hidden="true" /></Link>
        </section>
      )}

      <section className="academy-sources">
        <h2>Sources and further reading</h2>
        <ol>{lesson.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}<ExternalLink aria-hidden="true" /></a></li>)}</ol>
      </section>

      {projectPath && (atCoreEnd || atPathEnd) && <section className="academy-next"><h2>{atPathEnd ? "End of this learning path" : "End of the core preparation"}</h2><p>Put the concepts to work: make a prediction, try the project, and record what actually happened. Reading this page alone does not establish readiness.</p><Link href={`/?template=${projectPath.templateId}`}>Open the {projectPath.title.toLowerCase()} starter</Link>{atCoreEnd && !atPathEnd && <p>The remaining lessons are optional extensions.</p>}{atPathEnd && modules[lessonIndex + 1] && <p><Link href={lessonHref(modules[lessonIndex + 1].id)}>Continue into the wider curriculum</Link></p>}</section>}

      {nextLesson && (
        <footer className="academy-next">
          <span className="academy-eyebrow">{projectPath?.optional.includes(nextLesson.id) ? "Optional study" : "Recommended next"}{projectPath ? ` · ${projectPath.title}` : ""}</span>
          <Link href={lessonHref(nextLesson.id, project)}><span><b>{nextLesson.title}</b><small>{nextLesson.summary}</small></span><ArrowRight aria-hidden="true" /></Link>
        </footer>
      )}
    </article>
  );
}
