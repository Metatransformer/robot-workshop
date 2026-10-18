"use client";

import "./studio.css";

import { Children, isValidElement, useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import {
  AlertCircle, Archive, ArrowLeft, Bot, Box, Boxes, Check, ChevronDown, ChevronLeft,
  ChevronRight, CircleStop, Clipboard, Copy, Download, ExternalLink, FileCode2, FileText,
  FolderOpen, Hammer, Import, Library, Menu, MessageSquareText, Minus, PackagePlus, PanelRightClose,
  PanelRightOpen, Pencil, Plus, Save, Search, Send, Settings2, Sparkles, SquareStack, Upload,
  Wrench, X,
} from "lucide-react";
import remarkGfm from "remark-gfm";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import ArtifactPreview from "./artifact-preview";
import MechanismView from "./mechanism-view";
import type {
  AgentAdapter, AgentEvent, AgentRun, AgentStatus, Bootstrap, CatalogItem, FileContent, IngestionDraft,
  ModelKind, ProjectDetail, ProjectFile, ProjectRecord, Specification, Template,
} from "@/lib/contracts";

type StudioProps = { token: string };
type Section = "workshop" | "explore" | "catalog";
type ArtifactTab = "overview" | "model" | "parts" | "files";
type ImportStep = "input" | "extracting" | "review";
type ExportResult = { filename: string; content: string };
type FileDraft = { content: string; baseContent: string; baseHash: string };
type FileRequest = { projectId: string; path: string; mode?: "read" | "edit"; fragment?: string };

const TEMPLATE_LINKS = new Set(["sensor", "linkage", "desk-robot", "cyberdeck", "blank"]);
const LEARNING_FILES = [
  { basename: "START_HERE.md", label: "Start here" },
  { basename: "GLOSSARY.md", label: "Glossary" },
  { basename: "LEARNING_PATH.md", label: "Learning path" },
] as const;

class WorkshopApiError extends Error {
  constructor(message: string, readonly code: string) { super(message); }
}

async function workshopRequest<T>(token: string, request: { method?: "GET" | "POST"; query?: Record<string, string>; body?: object }): Promise<T> {
  const query = request.query ? `?${new URLSearchParams(request.query)}` : "";
  const response = await fetch(`/api/workshop${query}`, {
    method: request.method ?? (request.body ? "POST" : "GET"),
    headers: { "X-Workshop-Token": token, ...(request.body ? { "Content-Type": "application/json" } : {}) },
    body: request.body ? JSON.stringify(request.body) : undefined,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({ error: "Metatransformer returned an unreadable response.", code: "BAD_RESPONSE" })) as { data?: T; error?: string; code?: string };
  if (!response.ok || payload.error || payload.data === undefined) {
    throw new WorkshopApiError(payload.error ?? `Metatransformer request failed (${response.status}).`, payload.code ?? "REQUEST_FAILED");
  }
  return payload.data;
}

function decodeLinkPart(value: string) {
  try { return decodeURIComponent(value); }
  catch { return value; }
}

function resolveProjectLink(url: string, currentPath = ""): { path: string; fragment?: string } | null {
  const hashIndex = url.indexOf("#");
  const pathAndQuery = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const queryIndex = pathAndQuery.indexOf("?");
  const rawPath = decodeLinkPart(queryIndex === -1 ? pathAndQuery : pathAndQuery.slice(0, queryIndex)).replaceAll("\\", "/");
  const fragment = hashIndex === -1 ? undefined : decodeLinkPart(url.slice(hashIndex + 1));
  const parts = rawPath.startsWith("/") ? [] : currentPath.replaceAll("\\", "/").split("/").slice(0, -1).filter(Boolean);
  for (const part of rawPath.replace(/^\/+/, "").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      if (!parts.length) return null;
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  const path = parts.join("/");
  return path ? { path, ...(fragment ? { fragment } : {}) } : null;
}

function markdownUrlTransform(value: string) {
  if (/^workshop:template\/(sensor|linkage|desk-robot|cyberdeck|blank)$/.test(value)) return value;
  return defaultUrlTransform(value);
}

function headingText(children: ReactNode): string {
  return Children.toArray(children).map((child) => {
    if (typeof child === "string" || typeof child === "number") return String(child);
    return isValidElement<{ children?: ReactNode }>(child) ? headingText(child.props.children) : "";
  }).join(" ");
}

function headingSlug(children: ReactNode) {
  return headingText(children).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "") || "section";
}

function findProjectFile(project: ProjectDetail, basename: string) {
  const expected = basename.toLowerCase();
  return project.files.find((file) => file.path.replaceAll("\\", "/").toLowerCase() === expected)
    ?? project.files.find((file) => file.path.replaceAll("\\", "/").split("/").pop()?.toLowerCase() === expected);
}

function isArtifactPreviewPath(path: string) {
  return /\.(?:png|jpe?g|webp|glb)$/i.test(path);
}

function isExternalUrl(url: string) {
  try { return ["https:", "http:"].includes(new URL(url).protocol); }
  catch { return false; }
}

function isSensitiveExportPath(path: string) {
  const normalized = path.toLowerCase().replaceAll("\\", "/");
  const basename = normalized.split("/").pop() ?? normalized;
  return basename === ".env" || basename.startsWith(".env.") || basename.startsWith("secrets.") || basename.startsWith("credentials.") || basename.endsWith(".pem") || basename.endsWith(".key") || basename === "id_rsa" || basename.startsWith("id_rsa.") || normalized.split("/").some((part) => part === "transcript" || part === "transcripts" || part.startsWith("transcript.") || part.startsWith("transcripts."));
}

function isDefaultExportPath(path: string) {
  const normalized = path.replaceAll("\\", "/");
  const basename = normalized.split("/").pop() ?? normalized;
  return normalized === "notes/bench-log.csv" || /^(README|ENGINEERING|AGENTS|CLAUDE|WIRING|MODEL|START_HERE|GLOSSARY|LEARNING_PATH|evidence)(\..+)?$/i.test(basename) || /^(firmware|models|drawings)\//i.test(normalized);
}

function projectDraftKey(projectId: string, path: string) {
  return `${projectId}\u0000${path}`;
}

function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelector<HTMLElement>("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]");
    focusable?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]")];
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); restoreFocus.current?.focus(); };
  }, [onClose]);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={dialogRef} className={`modal ${wide ? "modal--wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header className="modal__header"><div><span className="eyebrow">Metatransformer</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></header>
      {children}
    </div>
  </div>;
}

function ProceduralPreview({ model, seed = 0 }: { model: ModelKind; seed?: number }) {
  if (model === "none") return <svg className="template-art" viewBox="0 0 320 170" role="img" aria-label="Technical document preview"><rect width="320" height="170" fill="#ebe7db"/><path d="M64 30h150v112H64z" fill="#fffdf6" stroke="#202724"/><path d="M88 57h92M88 76h104M88 95h78M88 114h112" stroke="#78929d" strokeWidth="5"/><circle cx="238" cy="115" r="35" fill="none" stroke="#c45b2d" strokeWidth="8"/><path d="M238 88v54M211 115h54" stroke="#c45b2d" strokeWidth="5"/></svg>;
  if (model === "robot") return <svg className="template-art" viewBox="0 0 320 170" role="img" aria-label="Robot arm concept preview"><rect width="320" height="170" fill="#dfe8e8"/><path d="M0 142h320M40 119h250M75 94h174" stroke="#91aeb6" opacity=".6"/><ellipse cx="104" cy="134" rx="49" ry="14" fill="#222b2d"/><path d="M105 125l28-62 18 7-24 58zM142 66l55-35 11 17-54 35z" fill="#d58c35" stroke="#202724" strokeWidth="5"/><circle cx="143" cy="68" r="13" fill="#f3ede0" stroke="#202724" strokeWidth="6"/><path d="M200 36l40 19" stroke="#202724" strokeWidth="12"/></svg>;
  if (model === "cyberdeck") return <svg className="template-art" viewBox="0 0 320 170" role="img" aria-label="Cyberdeck concept preview"><rect width="320" height="170" fill="#dbe5e5"/><path d="M41 38h237l17 95-253 5z" fill="#293134" stroke="#141918" strokeWidth="5"/><path d="M62 54h137v52H62z" fill="#71a6b4" stroke="#141918" strokeWidth="5"/><path d="M217 57h47v63h-47z" fill="#eee8d8"/><g fill="#c15b32">{[0,1,2].map(row => [0,1].map(column => <circle key={`${row}-${column}`} cx={229+column*22} cy={70+row*20} r={6}/>))}</g></svg>;
  const shift = seed % 17;
  return <svg className="template-art" viewBox="0 0 320 170" role="img" aria-label="Four-bar linkage diagram"><rect width="320" height="170" fill="#dfe9eb"/><path d="M0 29h320M0 65h320M0 101h320M0 137h320M52 0v170M105 0v170M158 0v170M211 0v170M264 0v170" stroke="#8eabb4" opacity=".35"/><path d={`M65 125L${119+shift} 69L228 48L257 125`} fill="none" stroke="#202724" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"/><path d={`M65 125L${119+shift} 69`} stroke="#c65b2d" strokeWidth="13" strokeLinecap="round"/><g fill="#f5f1e5" stroke="#202724" strokeWidth="6"><circle cx="65" cy="125" r="12"/><circle cx={119+shift} cy="69" r="12"/><circle cx="228" cy="48" r="12"/><circle cx="257" cy="125" r="12"/></g></svg>;
}

function ErrorNotice({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return <div className="error-notice" role="alert"><AlertCircle size={18} /><span>{message}</span>{onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss error"><X size={16}/></button>}</div>;
}

function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return <div className="empty-state">{icon}<h3>{title}</h3><p>{body}</p>{action}</div>;
}

export default function Studio({ token }: StudioProps) {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [section, setSection] = useState<Section>("workshop");
  const [artifactTab, setArtifactTab] = useState<ArtifactTab>("model");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectTemplateId, setNewProjectTemplateId] = useState("");
  const [agentDockOpen, setAgentDockOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [fileDrafts, setFileDrafts] = useState<Record<string, FileDraft>>({});
  const [fileRequest, setFileRequest] = useState<FileRequest | null>(null);
  const parameterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentToggleRef = useRef<HTMLButtonElement>(null);

  const upsertProject = useCallback((result: ProjectDetail) => {
    setBootstrap((current) => current ? {
      ...current,
      projects: current.projects.some((item) => item.id === result.id)
        ? current.projects.map((item) => item.id === result.id ? result : item)
        : [result, ...current.projects],
    } : current);
  }, []);

  const selectReturnedProject = useCallback((result: ProjectDetail, options?: { tab?: ArtifactTab; openWorkshop?: boolean; file?: FileRequest }) => {
    upsertProject(result);
    setProject(result);
    if (options?.openWorkshop) setSection("workshop");
    if (options?.tab) setArtifactTab(options.tab);
    if (options?.file) setFileRequest(options.file);
  }, [upsertProject]);

  const loadProject = useCallback(async (id: string, tab?: ArtifactTab) => {
    setPending("project"); setError("");
    try {
      const detail = await workshopRequest<ProjectDetail>(token, { query: { action: "project", id } });
      setProject(detail);
      setArtifactTab(tab ?? (detail.model === "none" ? "overview" : "model"));
      setSection("workshop");
      setBootstrap((current) => current ? { ...current, projects: current.projects.some((item) => item.id === detail.id) ? current.projects.map((item) => item.id === detail.id ? detail : item) : [detail, ...current.projects] } : current);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open project."); }
    finally { setPending(""); }
  }, [token]);

  const loadBootstrap = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await workshopRequest<Bootstrap>(token, { query: { action: "bootstrap" } });
      setBootstrap(data);
      const first = data.projects.find((item) => item.isExample && item.model === "linkage") ?? data.projects[0];
      if (first) await loadProject(first.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open Metatransformer."); }
    finally { setLoading(false); }
  }, [loadProject, token]);

  useEffect(() => { void loadBootstrap(); }, [loadBootstrap]);
  useEffect(() => () => { if (parameterTimer.current) clearTimeout(parameterTimer.current); }, []);
  useEffect(() => {
    if (window.matchMedia("(min-width: 1100px)").matches) setAgentDockOpen(true);
  }, []);
  useEffect(() => {
    if (!Object.keys(fileDrafts).length) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [fileDrafts]);

  const copyProject = async (id: string, title?: string) => {
    setPending(`copy:${id}`); setError("");
    try {
      const result = await workshopRequest<ProjectDetail>(token, { body: { action: "copy", id, ...(title?.trim() ? { title: title.trim() } : {}) } });
      selectReturnedProject(result, { openWorkshop: true, tab: result.model === "none" ? "overview" : "model" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not make a project copy."); }
    finally { setPending(""); }
  };

  const exportProject = async (selectedPaths: string[]) => {
    if (!project) return;
    setPending("export"); setError("");
    try {
      const result = await workshopRequest<ExportResult>(token, { body: { action: "export", id: project.id, selectedPaths } });
      const url = URL.createObjectURL(new Blob([result.content], { type: "application/octet-stream" }));
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = result.filename; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportOpen(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not export this project."); }
    finally { setPending(""); }
  };

  const updateParameters = (parameters: Record<string, number>) => {
    if (!project) return;
    const projectId = project.id;
    setProject((current) => current?.id === projectId ? { ...current, parameters } : current);
    if (parameterTimer.current) clearTimeout(parameterTimer.current);
    parameterTimer.current = setTimeout(async () => {
      try {
        const updated = await workshopRequest<ProjectDetail>(token, { body: { action: "parameters", id: projectId, parameters } });
        upsertProject(updated);
        setProject((current) => current?.id === projectId ? updated : current);
      } catch (cause) { setError(`${cause instanceof Error ? cause.message : "Could not save parameters."} Your current slider setting remains on screen.`); }
    }, 400);
  };

  const openProjectFile = (path: string, mode: "read" | "edit" = "read", fragment?: string) => {
    if (!project) return;
    setFileRequest({ projectId: project.id, path, mode, ...(fragment ? { fragment } : {}) });
    setArtifactTab("files");
  };

  const openTemplate = (templateId: string) => {
    if (!TEMPLATE_LINKS.has(templateId) || !bootstrap?.templates.some((template) => template.id === templateId)) return;
    setNewProjectTemplateId(templateId);
    setNewProjectOpen(true);
  };

  const closeAgentDock = () => {
    setAgentDockOpen(false);
    requestAnimationFrame(() => agentToggleRef.current?.focus());
  };

  if (loading) return <main className="studio-loading"><div className="workmark"><span>MT</span></div><p>Opening Metatransformer…</p></main>;
  if (!bootstrap) return <main className="studio-loading"><ErrorNotice message={error || "Metatransformer could not load."}/><button className="button button--primary" onClick={() => void loadBootstrap()}>Try again</button></main>;

  return <main className={`studio-shell ${agentDockOpen ? "has-agent" : ""}`}>
    <Rail section={section} onSection={(next) => { setSection(next); setMobileMenuOpen(false); }} mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
    <ProjectSidebar projects={bootstrap.projects} activeId={project?.id} pending={pending} onOpen={(id) => void loadProject(id)} onNew={() => setNewProjectOpen(true)} />

    <div className="studio-main">
      <header className="topbar">
        <button className="mobile-menu" type="button" onClick={() => setMobileMenuOpen(true)} aria-label="Open navigation"><Menu size={20}/></button>
        <div className="topbar__identity">
          <span className="eyebrow">{section === "explore" ? "Project library" : section === "catalog" ? "Local catalog" : project?.isExample ? "Bundled example" : project?.provenance ? "Result copy · original retained" : "Local project"}</span>
          <h1>{section === "explore" ? "Explore build ideas" : section === "catalog" ? "Parts & tools" : project?.title ?? "Metatransformer"}</h1>
        </div>
        <div className="topbar__actions">
          {section === "workshop" && project && <button className="button button--quiet hide-small" type="button" onClick={() => setExportOpen(true)} disabled={pending === "export"}><Download size={16}/>Export source</button>}
          <button className="button button--primary" type="button" onClick={() => setNewProjectOpen(true)}><Plus size={17}/> New project</button>
          <button ref={agentToggleRef} className="icon-button agent-toggle" type="button" onClick={() => agentDockOpen ? closeAgentDock() : setAgentDockOpen(true)} aria-label={agentDockOpen ? "Close agent dock" : "Open agent dock"}>{agentDockOpen ? <PanelRightClose size={19}/> : <PanelRightOpen size={19}/>}</button>
        </div>
      </header>
      {error && (
        <ErrorNotice message={error} onDismiss={() => setError("")}/>
      )}
      {bootstrap.warnings?.map((warning) => <div className="bootstrap-warning" role="status" key={warning}><AlertCircle size={17}/><span><b>Project unavailable.</b> {warning}</span></div>)}

      <div className="main-scroll">
        {section === "workshop" && <WorkshopSurface project={project} bootstrap={bootstrap} tab={artifactTab} onTab={setArtifactTab} pending={pending} token={token} drafts={fileDrafts} fileRequest={fileRequest} onDrafts={setFileDrafts} onResult={(result, path) => selectReturnedProject(result, { openWorkshop: true, tab: "files", ...(path ? { file: { projectId: result.id, path, mode: "edit" } } : {}) })} onError={setError} onParameters={updateParameters} onOpenFile={openProjectFile} onOpenTemplate={openTemplate} onOpenProject={(id, tab) => void loadProject(id, tab)} onOpenCatalog={() => setSection("catalog")} />}
        {section === "explore" && <ExploreSurface templates={bootstrap.templates} projects={bootstrap.projects} pending={pending} onOpen={(id) => void loadProject(id)} onCopy={(id) => void copyProject(id)} onCreate={(template) => { setNewProjectTemplateId(template.id); setNewProjectOpen(true); setSection("explore"); }} />}
        {section === "catalog" && <CatalogSurface token={token} items={bootstrap.library} project={project} onItems={(library) => setBootstrap((current) => current ? { ...current, library } : current)} onProject={(result) => selectReturnedProject(result)} onError={setError} />}
      </div>
      <footer className="statusbar"><span><span className="status-dot"/> Local-first workspace</span><span>Agent models connect only when you start a run</span><span className="statusbar__path">{project?.directory ?? "No project open"}</span></footer>
    </div>

    {agentDockOpen && <AgentDock token={token} project={project} onClose={closeAgentDock} onResult={(result) => selectReturnedProject(result, { openWorkshop: true, tab: result.model === "none" ? "overview" : "model" })} onError={setError} />}
    {newProjectOpen && <NewProjectDialog key={newProjectTemplateId || "blank-project"} templates={bootstrap.templates} initialTemplateId={newProjectTemplateId} token={token} onClose={() => { setNewProjectOpen(false); setNewProjectTemplateId(""); }} onCreated={(created) => { setNewProjectOpen(false); setNewProjectTemplateId(""); selectReturnedProject(created, { openWorkshop: true, tab: created.model === "none" ? "overview" : "model" }); }} />}
    {exportOpen && project && <ExportDialog project={project} pending={pending === "export"} onClose={() => setExportOpen(false)} onExport={(paths) => void exportProject(paths)}/>}
  </main>;
}

function Rail({ section, onSection, mobileOpen, onMobileClose }: { section: Section; onSection: (value: Section) => void; mobileOpen: boolean; onMobileClose: () => void }) {
  const items: { id: Section; label: string; icon: ReactNode }[] = [
    { id: "workshop", label: "Workshop", icon: <Hammer size={20}/> },
    { id: "explore", label: "Explore", icon: <Sparkles size={20}/> },
    { id: "catalog", label: "Parts & tools", icon: <Wrench size={20}/> },
  ];
  return <><nav className={`rail ${mobileOpen ? "is-open" : ""}`} aria-label="Main navigation">
    <button className="rail__mobile-close" type="button" onClick={onMobileClose} aria-label="Close navigation"><X size={20}/></button>
    <div className="workmark" aria-label="Metatransformer"><span>MT</span></div>
    <div className="rail__items">{items.map((item) => <button key={item.id} type="button" className={section === item.id ? "is-active" : ""} onClick={() => onSection(item.id)} aria-current={section === item.id ? "page" : undefined}>{item.icon}<span>{item.label}</span></button>)}</div>
    <div className="rail__local"><span/><small>LOCAL</small></div>
  </nav>{mobileOpen && <button className="mobile-scrim" type="button" aria-label="Close navigation" onClick={onMobileClose}/>}</>;
}

function ProjectSidebar({ projects, activeId, pending, onOpen, onNew }: { projects: ProjectRecord[]; activeId?: string; pending: string; onOpen: (id: string) => void; onNew: () => void }) {
  return <aside className="project-sidebar">
    <div className="project-sidebar__heading"><span>Projects</span><button type="button" onClick={onNew} aria-label="New project"><Plus size={16}/></button></div>
    <div className="project-list">
      {projects.map((item) => <button type="button" key={item.id} className={activeId === item.id ? "is-active" : ""} onClick={() => onOpen(item.id)} disabled={pending === "project"}>
        <span className={`project-glyph model-${item.model}`}><Box size={15}/></span><span><b>{item.title}</b><small>{item.isExample ? "Example" : item.provenance ? "Result copy" : "Local build"}</small></span>
      </button>)}
    </div>
    <button className="sidebar-library" type="button" onClick={onNew}><SquareStack size={16}/><span><b>Start something</b><small>Templates & blank projects</small></span></button>
  </aside>;
}

function WorkshopSurface({ project, bootstrap, tab, onTab, pending, token, drafts, fileRequest, onDrafts, onResult, onError, onParameters, onOpenFile, onOpenTemplate, onOpenProject, onOpenCatalog }: {
  project: ProjectDetail | null; bootstrap: Bootstrap; tab: ArtifactTab; onTab: (tab: ArtifactTab) => void; pending: string; token: string;
  drafts: Record<string, FileDraft>; fileRequest: FileRequest | null; onDrafts: Dispatch<SetStateAction<Record<string, FileDraft>>>;
  onResult: (project: ProjectDetail, path?: string) => void; onError: (message: string) => void; onParameters: (parameters: Record<string, number>) => void;
  onOpenFile: (path: string, mode?: "read" | "edit", fragment?: string) => void; onOpenTemplate: (templateId: string) => void;
  onOpenProject: (id: string, tab?: ArtifactTab) => void; onOpenCatalog: () => void;
}) {
  if (!project) return <EmptyState icon={<Box size={38}/>} title="No project is open" body="Start from a workshop template to make a local project."/>;
  const provenance = project.provenance ? bootstrap.projects.find((item) => item.id === project.provenance?.sourceProjectId) : null;
  const engineeringPath = findProjectFile(project, "ENGINEERING.md")?.path;
  const learningFiles = LEARNING_FILES.flatMap((item) => {
    const file = findProjectFile(project, item.basename);
    return file ? [{ path: file.path, label: item.label }] : [];
  });
  return <section className="artifact-surface">
    <div className="project-meta">
      <div><span className="project-stage">{project.isExample ? "Example" : project.provenance ? "Copy" : "Project"}</span><span className="dot-separator">•</span><span>{project.model === "none" ? "Documentation build" : project.model === "linkage" ? "Kinematic study" : "Concept assembly"}</span></div>
      <p>{project.description}</p>
      {(learningFiles.length > 0 || engineeringPath) && <ProjectDocumentLinks learningFiles={learningFiles} engineeringPath={engineeringPath} onOpenFile={onOpenFile}/>}
      {project.provenance && <div className="copy-banner"><Copy size={15}/><span>This is an independent result copy. {provenance ? <>Original: <button type="button" onClick={() => onOpenProject(provenance.id)}>{provenance.title}</button>.</> : "The original project remains unchanged."}</span></div>}
    </div>
    <nav className="artifact-tabs" aria-label="Project views">
      {(["overview", "model", "parts", "files"] as ArtifactTab[]).map((item) => <button type="button" key={item} className={tab === item ? "is-active" : ""} onClick={() => onTab(item)}>{item === "parts" ? "Parts & tools" : item[0].toUpperCase() + item.slice(1)}</button>)}
    </nav>
    {pending === "project" ? <div className="surface-loading">Opening project…</div> : <>
      {tab === "overview" && (
        <Overview project={project} engineeringPath={engineeringPath} learningFiles={learningFiles} onOpenFile={onOpenFile} onOpenTemplate={onOpenTemplate}/>
      )}
      {tab === "model" && (project.model === "none" ? <EmptyState icon={<FileText size={38}/>} title="This project starts with a guide" body="It has no mechanical model. Open Overview to read the working document." action={<button className="button button--primary" type="button" onClick={() => onTab("overview")}>Open overview</button>}/> : <div className="model-surface"><MechanismView model={project.model} parameters={project.parameters} onParametersChange={onParameters}/>{engineeringPath && <button className="button button--quiet model-plan-action" type="button" onClick={() => onOpenFile(engineeringPath, "read")}><FileText size={16}/> Engineering plan</button>}</div>) }
      {tab === "parts" && <ProjectParts project={project} onOpenCatalog={onOpenCatalog}/>}
      {tab === "files" && <FilesSurface token={token} project={project} drafts={drafts} request={fileRequest} onDrafts={onDrafts} onResult={onResult} onError={onError} onOpenTemplate={onOpenTemplate}/>}
    </>}
  </section>;
}

function MarkdownDocument({ content, project, currentPath = "", onOpenFile, onOpenTemplate }: { content: string; project: ProjectDetail; currentPath?: string; onOpenFile: (path: string, mode?: "read" | "edit", fragment?: string) => void; onOpenTemplate: (templateId: string) => void }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml urlTransform={markdownUrlTransform} components={{
    h1: ({ children }) => <h1 id={headingSlug(children)}>{children}</h1>,
    h2: ({ children }) => <h2 id={headingSlug(children)}>{children}</h2>,
    h3: ({ children }) => <h3 id={headingSlug(children)}>{children}</h3>,
    h4: ({ children }) => <h4 id={headingSlug(children)}>{children}</h4>,
    h5: ({ children }) => <h5 id={headingSlug(children)}>{children}</h5>,
    h6: ({ children }) => <h6 id={headingSlug(children)}>{children}</h6>,
    a: ({ href = "", children }) => {
      if (!href) return <span>{children}</span>;
      if (href.startsWith("#")) return <a href={href}>{children}</a>;
      const templateMatch = /^workshop:template\/(sensor|linkage|desk-robot|cyberdeck|blank)$/.exec(href);
      if (templateMatch) return <button className="markdown-file-link markdown-template-link" type="button" onClick={() => onOpenTemplate(templateMatch[1])}>{children}</button>;
      if (isExternalUrl(href)) return <a href={href} target="_blank" rel="noopener noreferrer">{children}<span className="sr-only"> (opens in a new tab)</span></a>;
      if (/^(?:ircs?|mailto|xmpp):/i.test(href)) return <a href={href}>{children}</a>;
      const resolved = resolveProjectLink(href, currentPath);
      if (!resolved) return <span>{children}</span>;
      const match = project.files.find((entry) => entry.path === resolved.path || entry.path.toLowerCase() === resolved.path.toLowerCase());
      if (!match) return <span>{children}</span>;
      return <button className="markdown-file-link" type="button" onClick={() => onOpenFile(match.path, "read", resolved.fragment)}>{children}</button>;
    },
  }}>{content}</ReactMarkdown>;
}

function ProjectDocumentLinks({ learningFiles, engineeringPath, onOpenFile, compact = false }: { learningFiles: { path: string; label: string }[]; engineeringPath?: string; onOpenFile: (path: string, mode?: "read" | "edit", fragment?: string) => void; compact?: boolean }) {
  return <nav className={`project-document-links ${compact ? "project-document-links--compact" : ""}`} aria-label="Project guides">{learningFiles.map((file) => <button type="button" key={file.path} onClick={() => onOpenFile(file.path, "read")}><FileText size={14}/>{file.label}</button>)}{engineeringPath && <button type="button" onClick={() => onOpenFile(engineeringPath, "read")}><FileCode2 size={14}/>Engineering plan</button>}</nav>;
}

function Overview({ project, engineeringPath, learningFiles, onOpenFile, onOpenTemplate }: { project: ProjectDetail; engineeringPath?: string; learningFiles: { path: string; label: string }[]; onOpenFile: (path: string, mode?: "read" | "edit", fragment?: string) => void; onOpenTemplate: (templateId: string) => void }) {
  const guidePath = findProjectFile(project, "README.md")?.path ?? "";
  return <div className="overview-grid"><article className="markdown-card"><div className="document-kicker"><FileText size={16}/> Build guide</div>{learningFiles.length > 0 && <ProjectDocumentLinks learningFiles={learningFiles} onOpenFile={onOpenFile} compact/>}<MarkdownDocument content={project.guide || "No guide has been written for this project yet."} project={project} currentPath={guidePath} onOpenFile={onOpenFile} onOpenTemplate={onOpenTemplate}/></article><aside className="outcome-card"><span className="eyebrow">Metatransformer outcome</span><h3>{project.model === "linkage" ? "A motion study you can tune, inspect, and carry into a physical prototype." : project.model === "none" ? "A documented build with ordinary files you can keep editing anywhere." : "A concept assembly ready for design decisions and source work."}</h3>{engineeringPath && <button className="button button--plan" type="button" onClick={() => onOpenFile(engineeringPath, "read")}><FileText size={16}/> Engineering plan</button>}<dl><div><dt>Files</dt><dd>{project.files.length}</dd></div><div><dt>Catalog entries</dt><dd>{project.bom.length}</dd></div><div><dt>Updated</dt><dd>{new Date(project.updatedAt).toLocaleDateString()}</dd></div></dl><p className="fine-print">Previews explain intent; they do not certify component dimensions or physical compatibility.</p></aside></div>;
}

function ProjectParts({ project, onOpenCatalog }: { project: ProjectDetail; onOpenCatalog: () => void }) {
  return <div className="project-parts"><div className="section-heading"><div><span className="eyebrow">Project-local snapshots</span><h2>Parts & tools in this build</h2></div><button className="button button--primary" type="button" onClick={onOpenCatalog}><PackagePlus size={16}/> Add from catalog</button></div>{project.bom.length ? <div className="cards-grid">{project.bom.map((entry) => <article className="catalog-card" key={`${entry.itemId}-${entry.role}`}><div className="catalog-card__icon">{entry.role === "tool" ? <Wrench/> : <Boxes/>}</div><span className="pill">{entry.role}</span><h3>{entry.snapshot.name}</h3><p>{entry.snapshot.description}</p><footer><span>Build qty. {entry.quantity}</span><span>{entry.snapshot.manufacturer ?? "Unbranded"}</span></footer></article>)}</div> : <EmptyState icon={<Boxes size={38}/>} title="No catalog items yet" body="Add parts or tools to capture a portable definition snapshot in this project." action={<button className="button button--primary" type="button" onClick={onOpenCatalog}>Browse catalog</button>}/>}</div>;
}

function FilesSurface({ token, project, drafts, request, onDrafts, onResult, onError, onOpenTemplate }: {
  token: string; project: ProjectDetail; drafts: Record<string, FileDraft>; request: FileRequest | null;
  onDrafts: Dispatch<SetStateAction<Record<string, FileDraft>>>; onResult: (project: ProjectDetail, path?: string) => void; onError: (message: string) => void; onOpenTemplate: (templateId: string) => void;
}) {
  const [selected, setSelected] = useState<ProjectFile | null>(project.files[0] ?? null);
  const [file, setFile] = useState<FileContent | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [readError, setReadError] = useState("");
  const [viewMode, setViewMode] = useState<"read" | "edit">("edit");
  const [pendingFragment, setPendingFragment] = useState("");
  const draftsRef = useRef(drafts);
  useEffect(() => { draftsRef.current = drafts; }, [drafts]);
  useEffect(() => {
    const requested = request?.projectId === project.id ? project.files.find((entry) => entry.path === request.path) : undefined;
    setSelected(requested ?? project.files[0] ?? null);
    setViewMode(requested && request?.mode === "read" && /\.md$/i.test(requested.path) ? "read" : "edit");
    setPendingFragment(requested ? request?.fragment ?? "" : "");
    setFile(null); setContent(""); setReadError("");
  }, [project.id, project.files, request]);
  useEffect(() => {
    if (!selected || isArtifactPreviewPath(selected.path) || !["document", "code", "data"].includes(selected.kind)) { setLoading(false); setNotice(""); setReadError(""); setFile(null); setContent(""); return; }
    let alive = true; setLoading(true); setNotice(""); setReadError(""); setFile(null); setContent("");
    workshopRequest<FileContent>(token, { query: { action: "file", id: project.id, path: selected.path } }).then((result) => {
      if (!alive) return;
      const draft = draftsRef.current[projectDraftKey(project.id, result.path)];
      setFile(result);
      setContent(draft?.content ?? result.content);
    }).catch((cause) => {
      if (!alive) return;
      setReadError(cause instanceof Error ? cause.message : "Could not read this file.");
    }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [project.id, selected, token]);
  useEffect(() => {
    if (!file || loading || file.path !== selected?.path || viewMode !== "read" || !pendingFragment) return;
    const frame = requestAnimationFrame(() => {
      const heading = document.getElementById(pendingFragment);
      if (heading) {
        heading.scrollIntoView({ block: "center", inline: "nearest" });
        setPendingFragment("");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [file, loading, selected?.path, pendingFragment, viewMode]);
  const chooseFile = (entry: ProjectFile) => {
    setSelected(entry);
    setViewMode("edit");
    setPendingFragment("");
  };
  const editContent = (value: string) => {
    if (!file) return;
    setContent(value);
    const key = projectDraftKey(project.id, file.path);
    onDrafts((current) => {
      if (value === file.content) {
        const { [key]: _removed, ...remaining } = current;
        return remaining;
      }
      return { ...current, [key]: { content: value, baseContent: file.content, baseHash: file.hash } };
    });
  };
  const save = async () => {
    if (!file) return; setSaving(true); setNotice("");
    try {
      const result = await workshopRequest<ProjectDetail>(token, { body: { action: "save-file", id: project.id, path: file.path, content, expectedHash: file.hash } });
      const key = projectDraftKey(project.id, file.path);
      onDrafts((current) => { const { [key]: _removed, ...remaining } = current; return remaining; });
      onResult(result, file.path); setNotice(`Opened “${result.title}” as a separate result copy. The original was retained.`);
    } catch (cause) { onError(`${cause instanceof Error ? cause.message : "Could not save the result copy."} Your edits remain in the editor.`); }
    finally { setSaving(false); }
  };
  const dirty = file ? Boolean(drafts[projectDraftKey(project.id, file.path)]) : false;
  const markdown = Boolean(file && /\.md$/i.test(file.path));
  const artifactPreview = Boolean(selected && isArtifactPreviewPath(selected.path));
  return <div className="files-layout">
    <aside className="file-list" aria-label="Project files">{project.files.map((entry) => {
      const entryDirty = Boolean(drafts[projectDraftKey(project.id, entry.path)]);
      return <button type="button" key={entry.path} className={selected?.path === entry.path ? "is-active" : ""} onClick={() => chooseFile(entry)}><span>{entry.kind === "code" ? <FileCode2 size={16}/> : <FileText size={16}/>}</span><b>{entry.path}{entryDirty ? " •" : ""}</b><small>{entryDirty ? "Unsaved draft · " : ""}{entry.kind} · {entry.size < 1024 ? `${entry.size} B` : `${(entry.size / 1024).toFixed(1)} KB`}</small></button>;
    })}</aside>
    <section className="file-editor">
      {notice && <div className="success-notice"><Check size={17}/>{notice}</div>}
      {!selected ? <EmptyState icon={<FolderOpen size={36}/>} title="No files" body="This project does not contain any readable artifacts yet."/>
        : artifactPreview ? <><div className="file-editor__bar"><div><span className="eyebrow">Artifact preview</span><b>{selected.path}</b></div><div className="file-editor__meta"><span>{selected.kind} · {selected.size < 1024 ? `${selected.size} B` : `${(selected.size / 1024).toFixed(1)} KB`}</span></div></div><div className="artifact-preview"><ArtifactPreview token={token} projectId={project.id} path={selected.path}/></div></>
        : loading ? <div className="surface-loading">Reading {selected.path}…</div>
        : readError ? <EmptyState icon={<AlertCircle size={36}/>} title={`Could not read ${selected.path}`} body={readError} action={<button className="button button--quiet" type="button" onClick={() => setSelected({ ...selected })}>Try again</button>}/>
        : ["document", "code", "data"].includes(selected.kind) && file ? <>
          <div className="file-editor__bar"><div><span className="eyebrow">{dirty ? "Unsaved draft" : viewMode === "read" ? "Markdown preview" : "Plain text editor"}</span><b>{file.path}</b></div><div className="file-editor__meta">{markdown && <div className="segmented"><button type="button" className={viewMode === "read" ? "is-active" : ""} onClick={() => setViewMode("read")}>Read</button><button type="button" className={viewMode === "edit" ? "is-active" : ""} onClick={() => setViewMode("edit")}>Edit text</button></div>}<span>{content.length.toLocaleString()} characters</span></div></div>
          {markdown && viewMode === "read"
            ? <article className="markdown-card file-markdown-preview"><MarkdownDocument content={content} project={project} currentPath={file.path} onOpenTemplate={onOpenTemplate} onOpenFile={(path, _mode, fragment) => { const match = project.files.find((entry) => entry.path === path || entry.path.toLowerCase() === path.toLowerCase()); if (match) { chooseFile(match); setPendingFragment(fragment ?? ""); setViewMode(/\.md$/i.test(match.path) ? "read" : "edit"); } }}/></article>
            : <textarea aria-label={`Edit ${file.path}`} value={content} onChange={(event) => editContent(event.target.value)} spellCheck={selected.kind === "document"}/>}
          <div className="file-editor__actions"><p>{dirty ? "Draft saved in this browser session. " : ""}Saving makes a new project copy. It never replaces this file.</p><button className="button button--primary" type="button" onClick={() => void save()} disabled={saving || !dirty}><Save size={16}/>{saving ? "Saving copy…" : "Save as result copy"}</button></div>
        </>
        : <EmptyState icon={<Archive size={36}/>} title="Preview intentionally unavailable" body={`${selected.kind} files are preserved in the project and its export, but arbitrary binary, HTML, and SVG content is not rendered here.`}/>}
    </section>
  </div>;
}

function ExportDialog({ project, pending, onClose, onExport }: { project: ProjectDetail; pending: boolean; onClose: () => void; onExport: (paths: string[]) => void }) {
  const selectableFiles = project.files.filter((file) => file.path.toLowerCase() !== "project.json");
  const [selected, setSelected] = useState(() => new Set(selectableFiles.filter((file) => !isSensitiveExportPath(file.path) && isDefaultExportPath(file.path)).map((file) => file.path)));
  const toggle = (path: string, checked: boolean) => setSelected((current) => {
    const next = new Set(current);
    if (checked) next.add(path); else next.delete(path);
    return next;
  });
  return <Modal title="Review export source" onClose={onClose} wide><div className="export-dialog"><div className="export-warning"><AlertCircle size={18}/><b>Only selected project files; review for private content.</b><span>The sanitized project manifest is always included.</span></div><div className="export-file-list">{selectableFiles.map((file) => {
    const sensitive = isSensitiveExportPath(file.path);
    return <label className={sensitive ? "is-disabled" : ""} key={file.path}><input type="checkbox" checked={!sensitive && selected.has(file.path)} disabled={sensitive} onChange={(event) => toggle(file.path, event.target.checked)}/><span><b>{file.path}</b><small>{sensitive ? "Blocked: possible secret, credential, key, or transcript" : `${file.kind} · ${file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(1)} KB`}`}</small></span></label>;
  })}</div><div className="dialog-actions"><button className="button button--quiet" type="button" onClick={onClose}>Cancel</button><button className="button button--primary" type="button" onClick={() => onExport([...selected])} disabled={pending}><Download size={16}/>{pending ? "Exporting…" : "Export selected"}</button></div></div></Modal>;
}

function ExploreSurface({ templates, projects, pending, onOpen, onCopy, onCreate }: { templates: Template[]; projects: ProjectRecord[]; pending: string; onOpen: (id: string) => void; onCopy: (id: string) => void; onCreate: (template: Template) => void }) {
  const examples = projects.filter((item) => item.isExample);
  return <section className="explore"><div className="explore-hero"><span className="eyebrow">Build from something tangible</span><h2>Mechanisms, field tools, and useful little machines.</h2><p>Every starter is local, inspectable, and built from ordinary files. Make a copy before you change one.</p></div><div className="section-heading"><div><span className="eyebrow">Bundled workshop</span><h2>Open examples</h2></div></div><div className="explore-grid">{examples.map((entry, index) => <article className="explore-card" key={entry.id}><ProceduralPreview model={entry.model} seed={index}/><div className="explore-card__body"><div className="tag-row"><span>{entry.model === "none" ? "Documented build" : "Interactive"}</span><span>Local</span></div><h3>{entry.title}</h3><p>{entry.description}</p><div className="explore-card__actions"><button className="button button--quiet" type="button" onClick={() => onOpen(entry.id)}>Open</button><button className="button button--primary" type="button" onClick={() => onCopy(entry.id)} disabled={pending === `copy:${entry.id}`}><Copy size={15}/>{pending === `copy:${entry.id}` ? "Copying…" : "Make a copy"}</button></div></div></article>)}</div><div className="section-heading"><div><span className="eyebrow">Fresh work</span><h2>Templates</h2></div></div><div className="template-grid">{templates.map((template, index) => <button type="button" className="template-card" key={template.id} onClick={() => onCreate(template)}><ProceduralPreview model={template.model} seed={index}/><span className="eyebrow">{template.category} · {template.level}</span><h3>{template.title}</h3><p>{template.description}</p><div className="tag-row">{template.skills.slice(0, 3).map((skill) => <span key={skill}>{skill}</span>)}</div><b>Use template <ChevronRight size={16}/></b></button>)}</div></section>;
}

function NewProjectDialog({ templates, initialTemplateId, token, onClose, onCreated }: { templates: Template[]; initialTemplateId: string; token: string; onClose: () => void; onCreated: (project: ProjectDetail) => void }) {
  const initialTemplate = templates.find((item) => item.id === initialTemplateId) ?? templates[0];
  const [templateId, setTemplateId] = useState(initialTemplate?.id ?? "");
  const selected = templates.find((item) => item.id === templateId);
  const [title, setTitle] = useState(initialTemplateId ? initialTemplate?.title ?? "" : ""); const [description, setDescription] = useState(""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); if (!title.trim() || !templateId) return; setSaving(true); setError(""); try { onCreated(await workshopRequest<ProjectDetail>(token, { body: { action: "create", title: title.trim(), description, templateId } })); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create the project."); } finally { setSaving(false); } };
  return <Modal title="Start a local project" onClose={onClose} wide><form onSubmit={(event) => void submit(event)} className="dialog-form"><div className="template-picker" role="radiogroup" aria-label="Project template">{templates.map((template) => <button type="button" role="radio" aria-checked={templateId === template.id} className={templateId === template.id ? "is-active" : ""} key={template.id} onClick={() => { setTemplateId(template.id); if (!title) setTitle(template.title); }}><ProceduralPreview model={template.model}/><span>{template.level}</span><b>{template.title}</b></button>)}</div><div className="dialog-fields"><label>Project title<input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required/></label><label>What are you building?<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} placeholder={selected?.description}/></label>{error && <ErrorNotice message={error}/>}<div className="dialog-actions"><button className="button button--quiet" type="button" onClick={onClose}>Cancel</button><button className="button button--primary" type="submit" disabled={!title.trim() || !templateId || saving}>{saving ? "Creating…" : "Create project"}</button></div></div></form></Modal>;
}

function CatalogSurface({ token, items, project, onItems, onProject, onError }: { token: string; items: CatalogItem[]; project: ProjectDetail | null; onItems: (items: CatalogItem[]) => void; onProject: (project: ProjectDetail) => void; onError: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | "part" | "tool">("all");
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const filtered = useMemo(() => items.filter((item) => (kind === "all" || item.kind === kind) && `${item.name} ${item.manufacturer ?? ""} ${item.category} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [items, kind, query]);

  const replaceItem = (item: CatalogItem) => {
    onItems(items.some((entry) => entry.id === item.id) ? items.map((entry) => entry.id === item.id ? item : entry) : [item, ...items]);
    setSelected(item);
  };
  const saveItem = async (item: CatalogItem, expectedVersion?: number) => {
    setPendingId(item.id);
    try { const saved = await workshopRequest<CatalogItem>(token, { body: { action: "save-item", item, ...(expectedVersion ? { expectedVersion } : {}) } }); replaceItem(saved); return saved; }
    catch (cause) { onError(cause instanceof Error ? cause.message : "Could not save the catalog item."); return null; }
    finally { setPendingId(""); }
  };
  const adjustQuantity = async (item: CatalogItem, delta: number) => {
    const quantity = Math.max(0, item.ownedQuantity + delta);
    await saveItem({ ...item, ownedQuantity: quantity }, item.version);
  };
  const addToProject = async (item: CatalogItem) => {
    if (!project) { onError("Open a project before adding a catalog item."); return; }
    setPendingId(`add:${item.id}`);
    try { onProject(await workshopRequest<ProjectDetail>(token, { body: { action: "add-item", id: project.id, itemId: item.id, quantity: 1 } })); }
    catch (cause) { onError(cause instanceof Error ? cause.message : "Could not add the item to this project."); }
    finally { setPendingId(""); }
  };

  return <section className="catalog-surface">
    <div className="catalog-hero"><div><span className="eyebrow">Definition and inventory are separate</span><h2>Your local parts bench.</h2><p>Keep source-backed specifications, owned quantities, and project use honest and independent.</p></div><div className="catalog-hero__actions"><button className="button button--quiet" type="button" onClick={() => setManualOpen(true)}><Plus size={16}/> Manual item</button><button className="button button--primary" type="button" onClick={() => setImportOpen(true)}><Import size={16}/> Import datasheet</button></div></div>
    <div className="catalog-toolbar"><label className="search-field"><Search size={17}/><span className="sr-only">Search catalog</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name, maker, category…"/></label><div className="segmented" aria-label="Filter catalog">{(["all", "part", "tool"] as const).map((value) => <button type="button" key={value} className={kind === value ? "is-active" : ""} onClick={() => setKind(value)}>{value === "all" ? "All" : value === "part" ? "Parts" : "Tools"}</button>)}</div></div>
    {filtered.length ? <div className="cards-grid">{filtered.map((item) => <article className="catalog-card catalog-card--interactive" key={item.id}><button className="catalog-card__open" type="button" onClick={() => setSelected(item)} aria-label={`View ${item.name}`}><div className="catalog-card__icon">{item.kind === "tool" ? <Wrench/> : <Boxes/>}</div><span className="pill">{item.category || item.kind}</span><h3>{item.name}</h3><p>{item.description || "No description yet."}</p><div className="source-line">{item.sources[0] ? <><ExternalLink size={13}/>{item.sources[0].title}</> : <>Manual entry · no source attached</>}</div></button><footer className="catalog-card__footer"><div className="quantity-control"><span>Owned</span><button type="button" onClick={() => void adjustQuantity(item, -1)} disabled={item.ownedQuantity === 0 || pendingId === item.id} aria-label={`Decrease owned ${item.name}`}><Minus size={14}/></button><b>{item.ownedQuantity}</b><button type="button" onClick={() => void adjustQuantity(item, 1)} disabled={pendingId === item.id} aria-label={`Increase owned ${item.name}`}><Plus size={14}/></button></div><button className="button button--small" type="button" onClick={() => void addToProject(item)} disabled={!project || pendingId === `add:${item.id}`}><PackagePlus size={14}/>{pendingId === `add:${item.id}` ? "Adding…" : "Add to project"}</button></footer></article>)}</div> : <EmptyState icon={<Search size={37}/>} title="Nothing matches" body="Try another phrase or switch the parts/tools filter."/>}
    {selected && <CatalogItemDialog item={selected} pending={pendingId === selected.id} onClose={() => setSelected(null)} onSave={(next) => void saveItem(next, selected.version)} onAdd={() => void addToProject(selected)} projectTitle={project?.title}/>}
    {importOpen && <ImportDialog token={token} onClose={() => setImportOpen(false)} onSaved={(item) => { replaceItem(item); setImportOpen(false); setSelected(item); }} />}
    {manualOpen && <ManualItemDialog token={token} onClose={() => setManualOpen(false)} onSaved={(item) => { replaceItem(item); setManualOpen(false); setSelected(item); }}/>}
  </section>;
}

function CatalogItemDialog({ item, pending, onClose, onSave, onAdd, projectTitle }: { item: CatalogItem; pending: boolean; onClose: () => void; onSave: (item: CatalogItem) => void; onAdd: () => void; projectTitle?: string }) {
  const [draft, setDraft] = useState(item);
  const update = <K extends keyof CatalogItem>(key: K, value: CatalogItem[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const editSpec = (index: number, field: "label" | "value" | "unit", value: string) => update("specs", draft.specs.map((spec, specIndex) => specIndex === index ? { label: field === "label" ? value : spec.label, value: field === "value" ? value : spec.value, ...(field === "unit" ? value ? { unit: value } : {} : spec.unit ? { unit: spec.unit } : {}), evidence: "manual" } : spec));
  return <Modal title={item.name} onClose={onClose} wide><div className="item-detail"><div className="item-detail__fields"><label>Name<input value={draft.name} onChange={(event) => update("name", event.target.value)}/></label><div className="field-row"><label>Manufacturer<input value={draft.manufacturer ?? ""} onChange={(event) => update("manufacturer", event.target.value || undefined)}/></label><label>Model<input value={draft.model ?? ""} onChange={(event) => update("model", event.target.value || undefined)}/></label></div><div className="field-row"><label>Type<select value={draft.kind} onChange={(event) => update("kind", event.target.value as CatalogItem["kind"])}><option value="part">Part</option><option value="tool">Tool</option></select></label><label>Category<input value={draft.category} onChange={(event) => update("category", event.target.value)}/></label></div><label>Description<textarea value={draft.description} onChange={(event) => update("description", event.target.value)}/></label><label>Notes<textarea value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Fit notes, storage location, caveats…"/></label></div><div className="spec-panel"><span className="eyebrow">Specifications</span>{draft.specs.length ? <table className="editable-specs"><thead><tr><th>Property</th><th>Value</th><th>Unit</th></tr></thead><tbody>{draft.specs.map((spec, index) => <tr key={index}><td><input aria-label={`Edit specification ${index + 1} label`} value={spec.label} onChange={(event) => editSpec(index, "label", event.target.value)}/></td><td><input aria-label={`Edit specification ${index + 1} value`} value={spec.value} onChange={(event) => editSpec(index, "value", event.target.value)}/></td><td><input aria-label={`Edit specification ${index + 1} unit`} value={spec.unit ?? ""} onChange={(event) => editSpec(index, "unit", event.target.value)}/><span className={`evidence evidence--${spec.evidence}`}>{spec.evidence}</span></td></tr>)}</tbody></table> : <p className="muted">No specifications have been recorded.</p>}<button className="add-spec-button" type="button" onClick={() => update("specs", [...draft.specs, { label: "New property", value: "", evidence: "manual" }])}><Plus size={14}/> Add specification</button><div className="sources"><span className="eyebrow">Sources</span>{draft.sources.length ? draft.sources.map((source) => <div key={source.id}><FileText size={15}/><span><b>{source.title}</b><small>{source.fileName ?? "Text source"}</small></span>{source.url && <a href={source.url} target="_blank" rel="noreferrer" aria-label={`Open source for ${source.title}`}><ExternalLink size={15}/></a>}</div>) : <p className="muted">Manual entry; no source document attached.</p>}</div></div></div><div className="dialog-actions dialog-actions--spread"><button className="button button--quiet" type="button" onClick={onAdd} disabled={!projectTitle}><PackagePlus size={16}/>{projectTitle ? `Add to ${projectTitle}` : "Open a project to add"}</button><div><button className="button button--quiet" type="button" onClick={onClose}>Cancel</button><button className="button button--primary" type="button" disabled={!draft.name.trim() || pending} onClick={() => onSave(draft)}><Save size={16}/>{pending ? "Saving…" : "Save changes"}</button></div></div></Modal>;
}

function ManualItemDialog({ token, onClose, onSaved }: { token: string; onClose: () => void; onSaved: (item: CatalogItem) => void }) {
  const [name, setName] = useState(""); const [manufacturer, setManufacturer] = useState(""); const [kind, setKind] = useState<CatalogItem["kind"]>("part"); const [category, setCategory] = useState(""); const [description, setDescription] = useState(""); const [quantity, setQuantity] = useState(0); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); setSaving(true); setError(""); const now = new Date().toISOString(); const item: CatalogItem = { id: crypto.randomUUID(), name: name.trim(), kind, category: category.trim(), description: description.trim(), ...(manufacturer.trim() ? { manufacturer: manufacturer.trim() } : {}), tags: [], specs: [], sources: [], ownedQuantity: quantity, notes: "", version: 1, createdAt: now, updatedAt: now }; try { onSaved(await workshopRequest<CatalogItem>(token, { body: { action: "save-item", item } })); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this item."); } finally { setSaving(false); } };
  return <Modal title="Add a catalog item" onClose={onClose}><form className="dialog-fields" onSubmit={(event) => void submit(event)}><p className="dialog-intro">Use this for a part or tool without a datasheet. You can leave specifications empty.</p><label>Name<input autoFocus required maxLength={160} value={name} onChange={(event) => setName(event.target.value)}/></label><div className="field-row"><label>Type<select value={kind} onChange={(event) => setKind(event.target.value as CatalogItem["kind"])}><option value="part">Part</option><option value="tool">Tool</option></select></label><label>Owned quantity<input type="number" min="0" step="1" value={quantity} onChange={(event) => setQuantity(Math.max(0, Number(event.target.value)))}/></label></div><label>Manufacturer (optional)<input value={manufacturer} onChange={(event) => setManufacturer(event.target.value)}/></label><label>Category<input value={category} maxLength={80} onChange={(event) => setCategory(event.target.value)}/></label><label>Description<textarea value={description} maxLength={3000} onChange={(event) => setDescription(event.target.value)}/></label>{error && <ErrorNotice message={error}/>}<div className="dialog-actions"><button className="button button--quiet" type="button" onClick={onClose}>Cancel</button><button className="button button--primary" type="submit" disabled={!name.trim() || saving}>{saving ? "Saving…" : "Save item"}</button></div></form></Modal>;
}

type ReviewedSpec = { included: boolean; spec: Specification; originalLabel: string; originalValue: string };

function ImportDialog({ token, onClose, onSaved }: { token: string; onClose: () => void; onSaved: (item: CatalogItem) => void }) {
  const [step, setStep] = useState<ImportStep>("input");
  const [text, setText] = useState(""); const [sourceUrl, setSourceUrl] = useState(""); const [fileName, setFileName] = useState(""); const [base64, setBase64] = useState(""); const [draft, setDraft] = useState<IngestionDraft | null>(null); const [reviewedSpecs, setReviewedSpecs] = useState<ReviewedSpec[]>([]); const [kind, setKind] = useState<CatalogItem["kind"]>("part"); const [owned, setOwned] = useState(0); const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const chooseFile = async (file?: File) => {
    if (!file) return; setError("");
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["txt", "md", "csv", "pdf"].includes(extension)) { setError("Choose a TXT, Markdown, CSV, or PDF document."); return; }
    if (file.size > 24 * 1024 * 1024) { setError("That file is larger than the 24 MB import limit."); return; }
    const reader = new FileReader();
    reader.onerror = () => setError("The browser could not read that file.");
    reader.onload = () => { const result = String(reader.result); setBase64(result.slice(result.indexOf(",") + 1)); setFileName(file.name); };
    reader.readAsDataURL(file);
  };
  const extract = async () => {
    if (!text.trim() && !base64) { setError("Paste document text or choose a supported file. A URL alone is citation metadata and is not fetched."); return; }
    setStep("extracting"); setError("");
    try {
      const result = await workshopRequest<IngestionDraft>(token, { body: { action: "ingest", ...(text.trim() ? { text } : {}), ...(base64 ? { base64, fileName } : {}), ...(sourceUrl.trim() ? { sourceUrl: sourceUrl.trim() } : {}) } });
      setDraft(result); setReviewedSpecs(result.specifications.map((spec) => ({ included: true, spec, originalLabel: spec.label, originalValue: spec.value }))); setStep("review");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not extract this document."); setStep("input"); }
  };
  const updateSpec = (index: number, field: "label" | "value" | "unit", value: string) => setReviewedSpecs((rows) => rows.map((row, rowIndex) => {
    if (rowIndex !== index) return row;
    const edited = { ...row.spec, [field]: value || (field === "unit" ? undefined : value) } as Specification;
    return { ...row, spec: { ...edited, evidence: "manual" } };
  }));
  const save = async () => {
    if (!draft || !draft.name.trim()) return; setStep("extracting"); setError(""); const now = new Date().toISOString();
    const item: CatalogItem = { id: crypto.randomUUID(), name: draft.name.trim(), kind, category: draft.category.trim(), description: draft.description.trim(), ...(draft.manufacturer.trim() ? { manufacturer: draft.manufacturer.trim() } : {}), tags: [], specs: reviewedSpecs.filter((row) => row.included).map((row) => row.spec), sources: [draft.source], ownedQuantity: owned, notes: "", version: 1, createdAt: now, updatedAt: now };
    try { onSaved(await workshopRequest<CatalogItem>(token, { body: { action: "save-ingestion", draftId: draft.id, item } })); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save the reviewed item."); setStep("review"); }
  };
  return <Modal title={step === "review" ? "Review extracted document" : "Import a datasheet"} onClose={onClose} wide>{step === "input" && <div className="import-input"><p className="dialog-intro">Paste text or upload a local datasheet. Extraction happens locally. A source URL is recorded as a citation; Metatransformer does not fetch it.</p><label>Document text<textarea autoFocus value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste labelled specifications or source notes here…" rows={9}/></label><div className="upload-row"><input ref={fileInput} className="sr-only" type="file" accept=".txt,.md,.csv,.pdf,text/plain,text/markdown,text/csv,application/pdf" onChange={(event) => void chooseFile(event.target.files?.[0])}/><button className="upload-box" type="button" onClick={() => fileInput.current?.click()}><Upload size={22}/><span><b>{fileName || "Choose TXT, Markdown, CSV, or PDF"}</b><small>{fileName ? "Ready to extract" : "Up to 24 MB"}</small></span></button><label>Optional source URL<input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://manufacturer.example/datasheet"/></label></div>{error && <ErrorNotice message={error}/>}<div className="dialog-actions"><button className="button button--quiet" type="button" onClick={onClose}>Cancel</button><button className="button button--primary" type="button" onClick={() => void extract()} disabled={!text.trim() && !base64}>Extract locally</button></div></div>}{step === "extracting" && <div className="extracting"><div className="extracting__mark"><Settings2 size={28}/></div><h3>{draft ? "Saving reviewed source…" : "Reading labels and evidence…"}</h3><p>The original source stays intact.</p></div>}{step === "review" && draft && <div className="review-layout"><section className="source-pane"><span className="eyebrow">Original source · retained</span><h3>{draft.source.title}</h3>{draft.source.url && <a href={draft.source.url} target="_blank" rel="noopener noreferrer">Source URL <ExternalLink size={14}/></a>}<pre>{draft.source.text || text || "The parser could not recover text from this file. You can still fill in the item manually, or return and use a text-based document."}</pre>{draft.warnings.map((warning) => <div className="warning-line" key={warning}><AlertCircle size={15}/>{warning}</div>)}</section><section className="review-fields"><div className="field-row"><label>Name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })}/></label><label>Manufacturer<input value={draft.manufacturer} onChange={(event) => setDraft({ ...draft, manufacturer: event.target.value })}/></label></div><div className="field-row"><label>Type<select value={kind} onChange={(event) => setKind(event.target.value as CatalogItem["kind"])}><option value="part">Part</option><option value="tool">Tool</option></select></label><label>Category<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}/></label><label>Owned<input type="number" min="0" step="1" value={owned} onChange={(event) => setOwned(Math.max(0, Number(event.target.value)))}/></label></div><label>Description<textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })}/></label><div className="review-specs"><div className="review-specs__heading"><div><span className="eyebrow">Candidate specifications</span><p>Document claims are not compatibility verification. Editing any extracted field changes its evidence to manual.</p></div><button type="button" onClick={() => setReviewedSpecs((rows) => [...rows, { included: true, originalLabel: "", originalValue: "", spec: { label: "New property", value: "", evidence: "manual" } }])}><Plus size={15}/> Add row</button></div>{reviewedSpecs.map((row, index) => <div className={`spec-row-wrap ${row.included ? "" : "is-excluded"}`} key={index}><div className="spec-row"><label className="check-label"><input type="checkbox" checked={row.included} onChange={(event) => setReviewedSpecs((rows) => rows.map((entry, rowIndex) => rowIndex === index ? { ...entry, included: event.target.checked } : entry))}/><span className="sr-only">Include specification {index + 1}</span></label><input aria-label={`Specification ${index + 1} label`} value={row.spec.label} onChange={(event) => updateSpec(index, "label", event.target.value)}/><input aria-label={`Specification ${index + 1} value`} value={row.spec.value} onChange={(event) => updateSpec(index, "value", event.target.value)}/><input className="unit-input" aria-label={`Specification ${index + 1} unit`} value={row.spec.unit ?? ""} onChange={(event) => updateSpec(index, "unit", event.target.value)} placeholder="unit"/><span className={`evidence evidence--${row.spec.evidence}`}>{row.spec.evidence}</span></div>{(row.spec.quote || row.spec.page) && <div className="spec-evidence-detail"><b>{row.spec.page ? `Page ${row.spec.page}` : "Source quote"}</b>{row.spec.quote && <q>{row.spec.quote}</q>}</div>}</div>)}</div>{error && <ErrorNotice message={error}/>}<div className="dialog-actions"><button className="button button--quiet" type="button" onClick={() => setStep("input")}><ArrowLeft size={15}/> Back</button><button className="button button--primary" type="button" onClick={() => void save()} disabled={!draft.name.trim()}>Save reviewed item</button></div></section></div>}</Modal>;
}

function coalesceAgentEvents(events: AgentEvent[]) {
  return events.reduce<AgentEvent[]>((grouped, event) => {
    const previous = grouped[grouped.length - 1];
    if (event.type === "message" && previous?.type === "message") {
      grouped[grouped.length - 1] = { ...previous, id: event.id, text: `${previous.text}${event.text}`, timestamp: event.timestamp };
    } else {
      grouped.push(event);
    }
    return grouped;
  }, []);
}

function AgentDock({ token, project, onClose, onResult, onError }: { token: string; project: ProjectDetail | null; onClose: () => void; onResult: (project: ProjectDetail) => void; onError: (message: string) => void }) {
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [adapterId, setAdapterId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [activeRunId, setActiveRunId] = useState("");
  const [pending, setPending] = useState("");
  const [localError, setLocalError] = useState("");
  const eventsRef = useRef<HTMLDivElement>(null);
  const projectIdRef = useRef(project?.id);
  const loadSequence = useRef(0);
  const load = useCallback(async () => {
    const requestedProjectId = project?.id;
    const sequence = ++loadSequence.current;
    try {
      const next = await workshopRequest<AgentStatus>(token, { query: { action: "agents" } });
      if (sequence !== loadSequence.current || projectIdRef.current !== requestedProjectId) return;
      setStatus(next);
      setAdapterId((current) => current || next.adapters.find((adapter) => adapter.available)?.id || next.adapters[0]?.id || "");
      const ownedRuns = next.runs.filter((run) => run.projectId === requestedProjectId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      setActiveRunId((current) => ownedRuns.some((run) => run.id === current) ? current : ownedRuns.find((run) => ["connecting", "running", "permission"].includes(run.status))?.id ?? ownedRuns[0]?.id ?? "");
    } catch (cause) {
      if (sequence === loadSequence.current && projectIdRef.current === requestedProjectId) setLocalError(cause instanceof Error ? cause.message : "Could not inspect local agent adapters.");
    }
  }, [project?.id, token]);
  useEffect(() => {
    projectIdRef.current = project?.id;
    loadSequence.current += 1;
    setActiveRunId("");
    setPrompt("");
    setPending("");
    setLocalError("");
  }, [project?.id]);
  useEffect(() => { void load(); }, [load]);
  const selectedRun = status?.runs.find((item) => item.id === activeRunId && item.projectId === project?.id);
  const run = useMemo(() => selectedRun ? { ...selectedRun, events: coalesceAgentEvents(selectedRun.events) } : undefined, [selectedRun]);
  const active = run && ["connecting", "running", "permission"].includes(run.status);
  useEffect(() => { if (!active) return; const timer = setInterval(() => void load(), 900); return () => clearInterval(timer); }, [active, load]);
  useEffect(() => { eventsRef.current?.scrollTo({ top: eventsRef.current.scrollHeight, behavior: "smooth" }); }, [run?.events.length, run?.events.at(-1)?.text]);
  const selectedAdapter = status?.adapters.find((adapter) => adapter.id === adapterId);
  const start = async (event: FormEvent) => { event.preventDefault(); if (!project || !prompt.trim() || !selectedAdapter?.available) return; const ownerId = project.id; setPending("start"); setLocalError(""); try { const created = await workshopRequest<AgentRun>(token, { body: { action: "agent-start", id: ownerId, agent: selectedAdapter.id, prompt } }); if (projectIdRef.current !== ownerId || created.projectId !== ownerId) return; setStatus((current) => current ? { ...current, runs: [created, ...current.runs.filter((item) => item.id !== created.id)] } : current); setActiveRunId(created.id); setPrompt(""); } catch (cause) { if (projectIdRef.current === ownerId) setLocalError(cause instanceof Error ? cause.message : "Could not start this run."); } finally { if (projectIdRef.current === ownerId) setPending(""); } };
  const act = async (body: object, label: string) => { if (!run || run.projectId !== project?.id) return; const ownerId = run.projectId; setPending(label); setLocalError(""); try { const updated = await workshopRequest<AgentRun>(token, { body }); if (projectIdRef.current !== ownerId || updated.projectId !== ownerId) return; setStatus((current) => current ? { ...current, runs: current.runs.map((item) => item.id === updated.id ? updated : item) } : current); } catch (cause) { if (projectIdRef.current === ownerId) setLocalError(cause instanceof Error ? cause.message : "Agent operation failed."); } finally { if (projectIdRef.current === ownerId) setPending(""); } };
  const adopt = async () => { if (!run || run.projectId !== project?.id) return; const ownerId = run.projectId; setPending("adopt"); try { const result = await workshopRequest<ProjectDetail>(token, { body: { action: "agent-adopt", runId: run.id } }); if (projectIdRef.current === ownerId) onResult(result); } catch (cause) { if (projectIdRef.current === ownerId) onError(cause instanceof Error ? cause.message : "Could not open the result copy."); } finally { if (projectIdRef.current === ownerId) setPending(""); } };
  return <aside className="agent-dock" aria-label="Agent workspace"><header className="agent-dock__header"><div><span className="eyebrow">Local adapters</span><h2><Bot size={19}/> Build agent</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close agent dock"><X size={18}/></button></header><div className="agent-selector"><label>Adapter<select value={adapterId} onChange={(event) => setAdapterId(event.target.value)}>{status?.adapters.map((adapter) => <option key={adapter.id} value={adapter.id}>{adapter.name} · {adapter.available ? "ready" : "not found"}</option>)}</select></label>{selectedAdapter && !selectedAdapter.available && <div className="adapter-setup"><AlertCircle size={16}/><div><b>{selectedAdapter.name} is not connected</b><p>{selectedAdapter.setup}</p><code>{selectedAdapter.command}</code><small>Provider credentials and sandbox policy stay with that adapter. The workshop does not auto-approve permissions.</small></div></div>}</div><div ref={eventsRef} className="agent-events">{run ? <><div className="run-status"><span className={`run-dot status-${run.status}`}/><b>{run.status.replace("-", " ")}</b><small>Candidate workspace · original project unchanged</small></div>{run.events.map((event) => <article className={`agent-event event-${event.type}`} key={event.id}><span>{event.type === "message" ? <MessageSquareText size={15}/> : event.type === "tool" ? <Settings2 size={15}/> : event.type === "error" ? <AlertCircle size={15}/> : <Bot size={15}/>}</span><div><small>{event.type} · {new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small><p>{event.text}</p></div></article>)}{run.error && <ErrorNotice message={run.error}/>} {run.permissions.map((permission) => <div className="permission-card" key={permission.id}><span className="eyebrow">Permission needed</span><h3>{permission.title}</h3><p>Review the adapter request. Nothing is approved automatically.</p><div>{permission.options.map((option) => <button className="button button--quiet" type="button" key={option.optionId} onClick={() => void act({ action: "agent-permission", runId: run.id, permissionId: permission.id, optionId: option.optionId }, "permission")} disabled={pending === "permission"}>{option.name}</button>)}</div></div>)}{["completed", "failed", "cancelled"].includes(run.status) && run.candidateDirectory && <div className="result-card"><b>{run.status === "completed" ? "Candidate ready to inspect" : "Partial candidate may be available"}</b><p>Opening it registers a separate project. It does not merge into the original.</p><button className="button button--primary" type="button" onClick={() => void adopt()} disabled={pending === "adopt"}><FolderOpen size={15}/>{pending === "adopt" ? "Opening…" : "Open result copy"}</button></div>}</> : <EmptyState icon={<Bot size={35}/>} title="A quiet workbench" body={project ? "Choose an available local adapter and describe a bounded task. Real events will appear here." : "Open a project before starting an agent run."}/>}</div>{localError && <ErrorNotice message={localError} onDismiss={() => setLocalError("")}/>}<form className="agent-prompt" onSubmit={(event) => void start(event)}><label htmlFor="agent-prompt">Task for the agent</label><textarea id="agent-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the result you want. Your text is kept if sending fails." disabled={Boolean(active)}/><div><small>{active ? "Run in progress" : "Runs work in a fresh candidate copy"}</small>{active && run ? <button className="button button--danger" type="button" onClick={() => void act({ action: "agent-cancel", runId: run.id }, "cancel")} disabled={pending === "cancel"}><CircleStop size={15}/> Stop</button> : <button className="button button--primary" type="submit" disabled={!project || !prompt.trim() || !selectedAdapter?.available || pending === "start"}><Send size={15}/>{pending === "start" ? "Starting…" : "Send"}</button>}</div></form></aside>;
}
