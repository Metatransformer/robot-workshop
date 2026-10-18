import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import {
  access,
  lstat,
  open,
  realpath,
} from "node:fs/promises";
import path from "node:path";
import { Readable, Writable } from "node:stream";
import {
  PROTOCOL_VERSION,
  client,
  methods,
  ndJsonStream,
  type ClientContext,
  type RequestPermissionResponse,
  type SessionNotification,
} from "@agentclientprotocol/sdk";

import type {
  AgentEvent,
  AgentRun,
  AgentStatus,
  Permission,
  ProjectDetail,
} from "../lib/contracts";
import { createCandidate, registerCandidate } from "./store";

const MAX_EVENTS = 500;
const MAX_EVENT_TEXT = 20_000;
const MAX_RETAINED_RUNS = 50;
const MAX_FILE_BYTES = 1_000_000;
const STARTUP_TIMEOUT_MS = 15_000;
const STOP_TIMEOUT_MS = 3_000;

type TerminalStatus = "completed" | "failed" | "cancelled";
type Candidate = Awaited<ReturnType<typeof createCandidate>>;

type PendingPermission = {
  permission: Permission;
  resolve: (response: RequestPermissionResponse) => void;
};

type ManagedRun = AgentRun & {
  candidate?: Candidate;
  candidateRoot?: string;
  child?: ChildProcessWithoutNullStreams;
  context?: ClientContext;
  sessionId?: string;
  pending: Map<string, PendingPermission>;
  cancelRequested: boolean;
  processStop?: Promise<boolean>;
  stopped: Promise<void>;
  resolveStopped: () => void;
  adopted?: ProjectDetail;
  adoption?: Promise<ProjectDetail>;
};

type AdapterDefinition = {
  id: string;
  name: string;
  binary: string;
  args: string[];
  setup: string;
};

const ADAPTERS: readonly AdapterDefinition[] = [
  {
    id: "codex",
    name: "Codex",
    binary: "codex-acp",
    args: [],
    setup: "Install with `npm install -g @agentclientprotocol/codex-acp`, then authenticate using the adapter's supported Codex login flow.",
  },
  {
    id: "claude",
    name: "Claude",
    binary: "claude-agent-acp",
    args: [],
    setup: "Install with `npm install -g @agentclientprotocol/claude-agent-acp`, then authenticate with the Claude Code login flow.",
  },
  {
    id: "opencode",
    name: "OpenCode",
    binary: "opencode",
    args: ["acp"],
    setup: "Install OpenCode from https://opencode.ai/docs and configure a provider with `opencode auth login`; this integration starts `opencode acp`.",
  },
] as const;

type AgentTestHooks = {
  createCandidate?: typeof createCandidate;
  registerCandidate?: typeof registerCandidate;
  executablePath?: (binary: string) => Promise<string | undefined>;
  startupTimeoutMs?: number;
  stopTimeoutMs?: number;
};

type AgentState = {
  runs: Map<string, ManagedRun>;
  hooks: AgentTestHooks;
};

const globalAgentState = globalThis as typeof globalThis & {
  __robotWorkshopAgentState?: AgentState;
};

const state: AgentState = globalAgentState.__robotWorkshopAgentState
  ?? (globalAgentState.__robotWorkshopAgentState = {
    runs: new Map(),
    hooks: {},
  });

function deferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function publicRun(run: ManagedRun): AgentRun {
  return {
    id: run.id,
    projectId: run.projectId,
    candidateDirectory: run.candidateDirectory,
    agent: run.agent,
    status: run.status,
    events: run.events.map((event) => ({ ...event })),
    permissions: run.permissions.map((permission) => ({
      ...permission,
      options: permission.options.map((option) => ({ ...option })),
    })),
    ...(run.error ? { error: run.error } : {}),
    createdAt: run.createdAt,
  };
}

function addEvent(run: ManagedRun, type: AgentEvent["type"], rawText: string): void {
  const text = redactSecrets(rawText).slice(0, MAX_EVENT_TEXT);
  run.events.push({
    id: (run.events.at(-1)?.id ?? 0) + 1,
    type,
    text,
    timestamp: new Date().toISOString(),
  });
  if (run.events.length > MAX_EVENTS) {
    run.events.splice(0, run.events.length - MAX_EVENTS);
  }
}

function redactSecrets(value: string): string {
  return value
    .replace(/\b(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, "$1[redacted]")
    .replace(/\b((?:api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password)\s*[:=]\s*)[^\s,;]+/gi, "$1[redacted]")
    .replace(/\b(sk-[A-Za-z0-9_-]{12,})\b/g, "[redacted]");
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    // ACP adapters sometimes append raw private diagnostics after the summary.
    // Only the first line is eligible for a browser-visible error.
    return redactSecrets(error.message.split(/\r?\n/, 1)[0]);
  }
  return "Unknown ACP integration error";
}

function isTerminal(status: AgentRun["status"]): status is TerminalStatus {
  return status === "completed" || status === "failed" || status === "cancelled";
}

function getManagedRun(runId: string): ManagedRun {
  const run = state.runs.get(runId);
  if (!run) throw new Error(`Agent run not found: ${runId}`);
  return run;
}

function adapterFor(id: string): AdapterDefinition | undefined {
  return ADAPTERS.find((adapter) => adapter.id === id);
}

async function executablePath(binary: string): Promise<string | undefined> {
  const names = process.platform === "win32"
    ? [binary, ...String(process.env.PATHEXT ?? ".EXE;.CMD;.BAT").split(";").map((ext) => `${binary}${ext.toLowerCase()}`)]
    : [binary];
  const directories = [
    path.resolve(process.cwd(), "node_modules", ".bin"),
    ...String(process.env.PATH ?? "").split(path.delimiter).filter(Boolean),
  ];

  for (const directory of directories) {
    for (const name of names) {
      const candidate = path.resolve(directory, name);
      try {
        await access(candidate, process.platform === "win32" ? fsConstants.F_OK : fsConstants.X_OK);
        return candidate;
      } catch {
        // Continue through the fixed adapter binary search path.
      }
    }
  }
  return undefined;
}

export async function getAgentStatus(): Promise<AgentStatus> {
  const adapters = await Promise.all(ADAPTERS.map(async (adapter) => {
    const resolved = await (state.hooks.executablePath ?? executablePath)(adapter.binary);
    return {
      id: adapter.id,
      name: adapter.name,
      available: Boolean(resolved),
      command: adapter.args.length > 0
        ? `${adapter.binary} ${adapter.args.join(" ")}`
        : adapter.binary,
      setup: resolved ? "Installed. Provider authentication is managed by the adapter; this application does not read provider credentials." : adapter.setup,
    };
  }));

  return {
    adapters,
    runs: [...state.runs.values()].map(publicRun),
  };
}

export async function startAgentRun(input: {
  projectId: string;
  agent: string;
  prompt: string;
}): Promise<AgentRun> {
  if (!input.projectId.trim()) throw new Error("Project id is required");
  if (!input.prompt.trim()) throw new Error("Agent prompt is required");

  const active = [...state.runs.values()].find(
    (run) => run.projectId === input.projectId && !isTerminal(run.status),
  );
  if (active) {
    throw new Error(`Project ${input.projectId} already has an active agent run (${active.id})`);
  }

  makeRoomForRun();
  if (state.runs.size >= MAX_RETAINED_RUNS) {
    throw new Error(`Agent run capacity reached (${MAX_RETAINED_RUNS} active runs)`);
  }

  const stopped = deferred();
  const run: ManagedRun = {
    id: crypto.randomUUID(),
    projectId: input.projectId,
    candidateDirectory: "",
    agent: input.agent,
    status: "connecting",
    events: [],
    permissions: [],
    createdAt: new Date().toISOString(),
    pending: new Map(),
    cancelRequested: false,
    stopped: stopped.promise,
    resolveStopped: stopped.resolve,
  };

  // Reserve the project synchronously, before candidate creation yields.
  state.runs.set(run.id, run);
  addEvent(run, "notice", "Creating an isolated result copy. The agent's own provider tools are not OS-sandboxed merely by this working directory.");
  void orchestrate(run, input.prompt).catch(async (error) => {
    // Orchestration is responsible for terminal state, but keep the background
    // promise guarded so a defect never becomes an unhandled rejection.
    if (isTerminal(run.status)) return;
    const processStopped = await stopRunProcess(run);
    if (!processStopped) {
      run.error = "Agent orchestration failed, and the adapter process could not be confirmed stopped; result adoption remains disabled";
      addEvent(run, "error", run.error);
      return;
    }
    finishRun(run, run.cancelRequested ? "cancelled" : "failed", errorMessage(error));
  });
  return publicRun(run);
}

export function getAgentRun(runId: string): AgentRun {
  return publicRun(getManagedRun(runId));
}

export async function cancelAgentRun(runId: string): Promise<AgentRun> {
  const run = getManagedRun(runId);
  if (isTerminal(run.status)) return publicRun(run);

  if (!run.cancelRequested) {
    run.cancelRequested = true;
    resolveAllPermissions(run, { outcome: { outcome: "cancelled" } });
    addEvent(run, "notice", "Cancellation requested. The partial result copy is being retained.");
  }

  const processStop = stopRunProcess(run);
  if (run.context && run.sessionId) {
    try {
      void run.context.notify(methods.agent.session.cancel, { sessionId: run.sessionId }).catch(() => undefined);
    } catch {
      // Protocol notification is advisory; process termination is authoritative.
    }
  }
  const processStopped = await processStop;
  if (!processStopped) {
    const message = "Cancellation failed because the adapter process could not be confirmed stopped; result adoption remains disabled";
    run.error = message;
    addEvent(run, "error", message);
    throw new Error(message);
  }
  finishRun(run, "cancelled");
  await run.stopped;
  return publicRun(run);
}

export async function answerAgentPermission(
  runId: string,
  permissionId: string,
  optionId: string,
): Promise<AgentRun> {
  const run = getManagedRun(runId);
  const pending = run.pending.get(permissionId);
  if (!pending) {
    throw new Error(`Permission ${permissionId} is not pending for agent run ${runId}`);
  }
  if (!pending.permission.options.some((option) => option.optionId === optionId)) {
    throw new Error(`Invalid option ${optionId} for permission ${permissionId}`);
  }

  run.pending.delete(permissionId);
  run.permissions = run.permissions.filter((permission) => permission.id !== permissionId);
  if (!run.cancelRequested) run.status = run.pending.size > 0 ? "permission" : "running";
  pending.resolve({ outcome: { outcome: "selected", optionId } });
  addEvent(run, "notice", `Permission response submitted: ${optionId}`);
  return publicRun(run);
}

export async function adoptAgentRun(runId: string): Promise<ProjectDetail> {
  const run = getManagedRun(runId);
  if (!isTerminal(run.status)) {
    throw new Error("The result copy can only be opened after the agent process has stopped");
  }
  await run.stopped;
  if (!run.candidate || !run.candidateRoot || !run.candidateDirectory) {
    throw new Error("This run has no candidate result copy to adopt");
  }
  if (run.adopted) return run.adopted;
  if (run.adoption) return run.adoption;

  run.adoption = (async () => {
    const currentRoot = await realpath(run.candidateDirectory);
    if (currentRoot !== run.candidateRoot) {
      throw new Error("Candidate result directory changed before adoption");
    }
    const register = state.hooks.registerCandidate ?? registerCandidate;
    const detail = await register(currentRoot, run.projectId);
    run.adopted = detail;
    addEvent(run, "notice", `Registered result copy as project ${detail.id}; the original project was not modified.`);
    return detail;
  })();

  try {
    return await run.adoption;
  } catch (error) {
    run.adoption = undefined;
    throw error;
  }
}

async function orchestrate(run: ManagedRun, prompt: string): Promise<void> {
  let outcome: TerminalStatus = "failed";
  let failure: string | undefined;
  try {
    const makeCandidate = state.hooks.createCandidate ?? createCandidate;
    const candidate = await makeCandidate(run.projectId);
    run.candidate = candidate;
    run.candidateDirectory = candidate.directory;
    run.candidateRoot = await realpath(candidate.directory);

    if (run.cancelRequested) {
      outcome = "cancelled";
      return;
    }

    const adapter = adapterFor(run.agent);
    if (!adapter) {
      throw new Error(`Unknown agent adapter: ${run.agent}. Allowed adapters are codex, claude, and opencode.`);
    }
    const executable = await (state.hooks.executablePath ?? executablePath)(adapter.binary);
    if (run.cancelRequested) {
      outcome = "cancelled";
      return;
    }
    if (!executable) {
      throw new Error(`${adapter.name} adapter is not installed. ${adapter.setup}`);
    }

    const child = spawn(/* turbopackIgnore: true */ executable, adapter.args, {
      cwd: run.candidateRoot,
      env: adapter.id === "codex"
        ? { ...process.env, INITIAL_AGENT_MODE: "workspace-write" }
        : process.env,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });
    run.child = child;
    child.on("error", () => undefined);
    child.stdin.on("error", () => undefined);
    observeStderr(run, child);

    const stream = ndJsonStream(
      Writable.toWeb(child.stdin) as WritableStream<Uint8Array>,
      Readable.toWeb(child.stdout) as ReadableStream<Uint8Array>,
      { maxMessageBytes: 2_000_000 },
    );
    const app = createClient(run);

    const protocolResult = await app.connectWith(stream, async (context) => {
        run.context = context;
        const initialized = await withTimeout(
          context.request(methods.agent.initialize, {
            protocolVersion: PROTOCOL_VERSION,
            clientCapabilities: {
              fs: { readTextFile: true, writeTextFile: true },
            },
            clientInfo: { name: "Robot Workshop", version: "0.1.0" },
          }),
          state.hooks.startupTimeoutMs ?? STARTUP_TIMEOUT_MS,
          "ACP initialization timed out",
        );
        if (initialized.protocolVersion !== PROTOCOL_VERSION) {
          throw new Error(`ACP protocol mismatch: expected ${PROTOCOL_VERSION}, received ${initialized.protocolVersion}`);
        }

        const session = await withTimeout(
          context.buildSession(run.candidateRoot!).start(),
          state.hooks.startupTimeoutMs ?? STARTUP_TIMEOUT_MS,
          "ACP session startup timed out",
        );
        run.sessionId = session.sessionId;
        run.status = "running";
        addEvent(run, "notice", `Connected to ${adapter.name} through ACP ${PROTOCOL_VERSION}. Generated output is not proof that a physical build works.`);

        try {
          const promptResult = session.prompt(prompt);
          // Prevent a rejection racing the update consumer from becoming unhandled.
          void promptResult.catch(() => undefined);
          for (;;) {
            const message = await session.nextUpdate();
            if (message.kind === "stop") {
              await promptResult;
              return message.stopReason;
            }
            handleSessionUpdate(run, message.notification);
          }
        } finally {
          session.dispose();
        }
      });

    outcome = run.cancelRequested || protocolResult === "cancelled" ? "cancelled" : "completed";
  } catch (error) {
    failure = classifyError(error);
    outcome = run.cancelRequested ? "cancelled" : "failed";
  } finally {
    resolveAllPermissions(run, { outcome: { outcome: "cancelled" } });
    const processStopped = await stopRunProcess(run);
    if (!processStopped) {
      run.error = "Agent work ended, but the adapter process could not be confirmed stopped; result adoption remains disabled";
      addEvent(run, "error", run.error);
      return;
    }
    finishRun(run, run.cancelRequested ? "cancelled" : outcome, failure);
  }
}

function createClient(run: ManagedRun) {
  return client({ name: "robot-workshop" })
    .onRequest(methods.client.session.requestPermission, ({ params, requestId }) => {
      if (run.cancelRequested) return { outcome: { outcome: "cancelled" } };
      if (params.options.length === 0) throw new Error("ACP permission request supplied no user-selectable options");
      const permissionId = String(requestId ?? crypto.randomUUID());
      if (run.pending.has(permissionId)) {
        throw new Error(`Duplicate ACP permission request id: ${permissionId}`);
      }
      const permission: Permission = {
        id: permissionId,
        title: params.toolCall.title ?? `Tool request ${params.toolCall.toolCallId}`,
        options: params.options.map(({ optionId, name, kind }) => ({ optionId, name, kind })),
      };
      return new Promise<RequestPermissionResponse>((resolve) => {
        run.pending.set(permissionId, { permission, resolve });
        run.permissions.push(permission);
        run.status = "permission";
        addEvent(run, "notice", `Explicit permission required: ${permission.title}`);
      });
    })
    .onRequest(methods.client.fs.readTextFile, async ({ params }) => {
      assertSession(run, params.sessionId);
      const target = await safeCandidatePath(run, params.path, false);
      const handle = await open(target, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0));
      let content: string;
      try {
        const file = await handle.stat();
        if (!file.isFile()) throw new Error("ACP file read target is not a regular file");
        if (file.size > MAX_FILE_BYTES) throw new Error(`ACP file read exceeds ${MAX_FILE_BYTES} bytes`);
        content = await handle.readFile("utf8");
      } finally {
        await handle.close();
      }
      if (params.line == null && params.limit == null) return { content };
      const lines = content.split("\n");
      const start = Math.max(0, (params.line ?? 1) - 1);
      const end = params.limit == null ? lines.length : start + Math.max(0, params.limit);
      return { content: lines.slice(start, end).join("\n") };
    })
    .onRequest(methods.client.fs.writeTextFile, async ({ params }) => {
      assertSession(run, params.sessionId);
      if (Buffer.byteLength(params.content, "utf8") > MAX_FILE_BYTES) {
        throw new Error(`ACP file write exceeds ${MAX_FILE_BYTES} bytes`);
      }
      const target = await safeCandidatePath(run, params.path, true);
      const handle = await open(
        target,
        fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_TRUNC | (fsConstants.O_NOFOLLOW ?? 0),
        0o600,
      );
      try {
        await handle.writeFile(params.content, "utf8");
      } finally {
        await handle.close();
      }
      return {};
    });
}

function assertSession(run: ManagedRun, sessionId: string): void {
  if (!run.sessionId || sessionId !== run.sessionId) {
    throw new Error("ACP filesystem request does not belong to this run's active session");
  }
}

async function safeCandidatePath(run: ManagedRun, requested: string, allowMissingLeaf: boolean): Promise<string> {
  const root = run.candidateRoot;
  if (!root) throw new Error("Candidate workspace is not ready");
  if (!path.isAbsolute(requested)) throw new Error("ACP filesystem paths must be absolute");
  const target = path.resolve(requested);
  const relative = path.relative(root, target);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("ACP filesystem path is outside the candidate workspace");
  }

  const segments = relative.split(path.sep);
  let current = root;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    try {
      const entry = await lstat(current);
      if (entry.isSymbolicLink()) throw new Error("ACP filesystem paths may not traverse symbolic links");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code === "ENOENT" && allowMissingLeaf && index === segments.length - 1) break;
      throw error;
    }
  }

  const parentRoot = await realpath(allowMissingLeaf ? path.dirname(target) : target);
  const resolved = allowMissingLeaf ? path.join(parentRoot, path.basename(target)) : parentRoot;
  const resolvedRelative = path.relative(root, resolved);
  if (resolvedRelative.startsWith("..") || path.isAbsolute(resolvedRelative)) {
    throw new Error("ACP filesystem path resolves outside the candidate workspace");
  }
  return resolved;
}

function handleSessionUpdate(run: ManagedRun, notification: SessionNotification): void {
  if (run.sessionId && notification.sessionId !== run.sessionId) return;
  const update = notification.update;
  switch (update.sessionUpdate) {
    case "agent_message_chunk":
      if (update.content.type === "text") addEvent(run, "message", update.content.text);
      break;
    case "tool_call":
      addEvent(run, "tool", `${update.title}${update.status ? ` (${update.status})` : ""}`);
      break;
    case "tool_call_update":
      addEvent(run, "tool", `${update.title ?? update.toolCallId}${update.status ? ` (${update.status})` : ""}`);
      break;
    case "notice":
      addEvent(run, "notice", noticeText(update));
      break;
    case "plan":
      addEvent(run, "notice", update.entries.map((entry) => `${entry.status}: ${entry.content}`).join("\n"));
      break;
    default:
      break;
  }
}

function noticeText(update: Extract<SessionNotification["update"], { sessionUpdate: "notice" }>): string {
  return update.description ? `${update.title}: ${update.description}` : update.title;
}

function resolveAllPermissions(run: ManagedRun, response: RequestPermissionResponse): void {
  for (const pending of run.pending.values()) pending.resolve(response);
  run.pending.clear();
  run.permissions = [];
}

function observeStderr(run: ManagedRun, child: ChildProcessWithoutNullStreams): void {
  let reported = false;
  child.stderr.on("data", () => {
    if (reported) return;
    reported = true;
    // Adapter diagnostics can contain provider-owned sensitive values. Drain
    // stderr, but expose no raw content through browser-visible run events.
    addEvent(run, "notice", "The adapter emitted private diagnostics; raw stderr is not exposed.");
  });
}

async function stopProcess(child: ChildProcessWithoutNullStreams | undefined, timeoutMs: number): Promise<boolean> {
  if (!child || child.exitCode !== null || child.signalCode !== null) return true;
  const exited = new Promise<void>((resolve) => child.once("exit", () => resolve()));
  try {
    child.stdin.end();
  } catch {
    // Continue to explicit process termination.
  }
  try {
    child.kill("SIGTERM");
  } catch {
    if (child.exitCode !== null || child.signalCode !== null) return true;
  }
  const graceful = await Promise.race([
    exited.then(() => true),
    new Promise<false>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
  ]);
  if (!graceful && child.exitCode === null && child.signalCode === null) {
    try {
      child.kill("SIGKILL");
    } catch {
      if (child.exitCode !== null || child.signalCode !== null) return true;
    }
    return Promise.race([
      exited.then(() => true),
      new Promise<false>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
    ]);
  }
  return true;
}

function stopRunProcess(run: ManagedRun): Promise<boolean> {
  if (!run.processStop) {
    const attempt = stopProcess(run.child, state.hooks.stopTimeoutMs ?? STOP_TIMEOUT_MS);
    const tracked = attempt.then((stopped) => {
      if (!stopped && run.processStop === tracked) run.processStop = undefined;
      return stopped;
    });
    run.processStop = tracked;
  }
  return run.processStop;
}

function finishRun(run: ManagedRun, outcome: TerminalStatus, failure?: string): void {
  if (isTerminal(run.status)) return;
  run.child = undefined;
  run.context = undefined;
  if (outcome === "failed") {
    run.error = failure ?? "Agent run failed";
    addEvent(run, "error", run.error);
  } else if (outcome === "completed") {
    delete run.error;
    addEvent(run, "notice", "Agent process stopped. The generated result copy is ready to inspect; no hardware behavior has been verified.");
  } else {
    delete run.error;
    addEvent(run, "notice", "Agent process stopped. The partial result copy was retained and the original project was not modified.");
  }
  run.status = outcome;
  run.resolveStopped();
}

async function withTimeout<T>(operation: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function classifyError(error: unknown): string {
  const message = errorMessage(error);
  if (/auth[_ -]?required|authentication required|not authenticated|login required/i.test(message)) {
    return `Provider authentication required. Use the adapter's supported login flow; Robot Workshop does not extract or proxy credentials. ${message}`;
  }
  return message;
}

function makeRoomForRun(): void {
  if (state.runs.size < MAX_RETAINED_RUNS) return;
  for (const [id, run] of state.runs) {
    if (state.runs.size < MAX_RETAINED_RUNS) break;
    if (isTerminal(run.status)) state.runs.delete(id);
  }
}

/** Test-only dependency seam. Production callers must not supply adapter paths. */
export function __setAgentTestHooks(hooks: AgentTestHooks): void {
  state.hooks = { ...hooks };
}

/** Test-only reset. It refuses to discard live child processes. */
export function __resetAgentStateForTests(): void {
  if ([...state.runs.values()].some((run) => !isTerminal(run.status))) {
    throw new Error("Cannot reset agent state while a run is active");
  }
  state.runs.clear();
  state.hooks = {};
}
