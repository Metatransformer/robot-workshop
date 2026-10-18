import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  __resetAgentStateForTests,
  __setAgentTestHooks,
  adoptAgentRun,
  answerAgentPermission,
  cancelAgentRun,
  getAgentRun,
  getAgentStatus,
  startAgentRun,
} from "../src/server/agents";

const FAKE_ADAPTER = String.raw`#!/usr/bin/env node
const fs = require("node:fs");
const readline = require("node:readline");
const input = readline.createInterface({ input: process.stdin });
let sessionId = "fake-session";
let promptRequest;
let pendingClientRequest;
let stubborn = false;
let keepAlive;
fs.writeFileSync("adapter-started.txt", "started");
const send = (message) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...message }) + "\n");
const text = (params) => params.prompt?.find((block) => block.type === "text")?.text ?? "";
const update = (value) => send({ method: "session/update", params: { sessionId, update: value } });
const finish = (stopReason = "end_turn") => {
  if (promptRequest != null) send({ id: promptRequest, result: { stopReason } });
  promptRequest = undefined;
};

process.on("SIGTERM", () => {
  if (!stubborn) process.exit(0);
  fs.writeFileSync("sigterm-observed.txt", "ignored");
});

input.on("line", (line) => {
  const message = JSON.parse(line);
  if (message.method === "initialize") {
    send({ id: message.id, result: { protocolVersion: 1, agentCapabilities: {} } });
    return;
  }
  if (message.method === "session/new") {
    if (process.env.FAKE_ACP_AUTH_REQUIRED === "1") {
      send({ id: message.id, error: { code: -32000, message: "Authentication required\nOPENAI_API_KEY=sk-never-expose-this-value" } });
      return;
    }
    send({ id: message.id, result: { sessionId } });
    return;
  }
  if (message.method === "session/prompt") {
    promptRequest = message.id;
    const prompt = text(message.params);
    if (prompt === "permission") {
      pendingClientRequest = "permission-1";
      send({
        id: pendingClientRequest,
        method: "session/request_permission",
        params: {
          sessionId,
          toolCall: { toolCallId: "write-tool", title: "Write candidate file" },
          options: [
            { optionId: "allow", name: "Allow once", kind: "allow_once" },
            { optionId: "reject", name: "Reject once", kind: "reject_once" }
          ]
        }
      });
      return;
    }
    if (prompt === "hold") return;
    if (prompt === "stubborn") {
      stubborn = true;
      keepAlive = setInterval(() => undefined, 1_000);
      update({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: "stubborn-ready" } });
      return;
    }
    if (prompt.startsWith("read:")) {
      pendingClientRequest = "read-1";
      send({ id: pendingClientRequest, method: "fs/read_text_file", params: { sessionId, path: prompt.slice(5) } });
      return;
    }
    update({ sessionUpdate: "agent_message_chunk", content: { type: "text", text: "generated-answer" } });
    update({ sessionUpdate: "tool_call", toolCallId: "tool-1", title: "Inspect candidate", status: "completed" });
    finish();
    return;
  }
  if (message.method === "session/cancel") {
    if (stubborn) return;
    finish("cancelled");
    return;
  }
  if (message.id === pendingClientRequest) {
    if (pendingClientRequest === "permission-1") {
      const outcome = message.result?.outcome;
      update({
        sessionUpdate: "agent_message_chunk",
        content: { type: "text", text: outcome?.outcome === "selected" ? "permission-" + outcome.optionId : "permission-cancelled" }
      });
    } else {
      update({
        sessionUpdate: "agent_message_chunk",
        content: { type: "text", text: message.error ? "filesystem-rejected" : "filesystem-allowed" }
      });
    }
    pendingClientRequest = undefined;
    finish();
  }
});
`;

let temporaryRoot = "";
let originalPath: string | undefined;
let fakeExecutable = "";
let candidateCount = 0;
let adoptedCount = 0;

async function waitForRun(
  runId: string,
  predicate: (run: ReturnType<typeof getAgentRun>) => boolean,
  timeoutMs = 3_000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const run = getAgentRun(runId);
    if (predicate(run)) return run;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error(`Timed out waiting for run ${runId}: ${JSON.stringify(getAgentRun(runId))}`);
}

async function makeCandidate() {
  candidateCount += 1;
  const directory = path.join(temporaryRoot, `candidate-${candidateCount}`);
  await mkdir(directory);
  await writeFile(path.join(directory, "project.json"), "{}", "utf8");
  return {
    directory,
    project: { id: `candidate_${candidateCount}` },
    revision: `revision_${candidateCount}`,
  };
}

describe("ACP agent integration", () => {
  beforeEach(async () => {
    temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "robot-workshop-agent-"));
    const bin = path.join(temporaryRoot, "bin");
    await mkdir(bin);
    fakeExecutable = path.join(bin, "codex-acp");
    await writeFile(fakeExecutable, FAKE_ADAPTER, "utf8");
    await chmod(fakeExecutable, 0o755);
    originalPath = process.env.PATH;
    process.env.PATH = `${bin}${path.delimiter}${originalPath ?? ""}`;
    candidateCount = 0;
    adoptedCount = 0;
    delete process.env.FAKE_ACP_AUTH_REQUIRED;
    __setAgentTestHooks({
      createCandidate: makeCandidate as never,
      registerCandidate: (async (directory: string) => {
        adoptedCount += 1;
        return { id: "adopted_candidate", directory, files: [], guide: "" };
      }) as never,
      executablePath: async (binary) => binary === "codex-acp" ? fakeExecutable : undefined,
      startupTimeoutMs: 1_000,
      stopTimeoutMs: 300,
    });
  });

  afterEach(async () => {
    __resetAgentStateForTests();
    delete process.env.FAKE_ACP_AUTH_REQUIRED;
    process.env.PATH = originalPath;
    await rm(temporaryRoot, { recursive: true, force: true });
  });

  it("detects only allowlisted installed adapters and gives exact missing setup", async () => {
    const status = await getAgentStatus();
    expect(status.adapters.find((adapter) => adapter.id === "codex")).toMatchObject({
      available: true,
      command: "codex-acp",
    });
    expect(status.adapters.find((adapter) => adapter.id === "claude")).toMatchObject({
      available: false,
      command: "claude-agent-acp",
      setup: expect.stringContaining("npm install -g @agentclientprotocol/claude-agent-acp"),
    });
    expect(status.adapters.find((adapter) => adapter.id === "opencode")?.command).toBe("opencode acp");
  });

  it("streams real ACP message and tool updates, then permits idempotent adoption", async () => {
    const started = await startAgentRun({ projectId: "source", agent: "codex", prompt: "normal" });
    const completed = await waitForRun(started.id, (run) => run.status === "completed");
    expect(completed.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "message", text: "generated-answer" }),
      expect.objectContaining({ type: "tool", text: "Inspect candidate (completed)" }),
    ]));
    expect(completed.events.some((event) => event.text.includes("not proof"))).toBe(true);

    const first = await adoptAgentRun(started.id);
    const second = await adoptAgentRun(started.id);
    expect(second).toEqual(first);
    expect(adoptedCount).toBe(1);
  });

  it("never silently grants permission and validates the selected option", async () => {
    const started = await startAgentRun({ projectId: "source", agent: "codex", prompt: "permission" });
    const pending = await waitForRun(started.id, (run) => run.status === "permission");
    expect(pending.permissions).toHaveLength(1);
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(getAgentRun(started.id).status).toBe("permission");

    await expect(answerAgentPermission(started.id, pending.permissions[0].id, "made-up")).rejects.toThrow("Invalid option");
    await answerAgentPermission(started.id, pending.permissions[0].id, "allow");
    const completed = await waitForRun(started.id, (run) => run.status === "completed");
    expect(completed.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "message", text: "permission-allow" }),
    ]));
  });

  it("cancels a pending permission, stops the process, and retains the partial candidate", async () => {
    const started = await startAgentRun({ projectId: "source", agent: "codex", prompt: "permission" });
    await waitForRun(started.id, (run) => run.status === "permission");
    const cancelled = await cancelAgentRun(started.id);
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.candidateDirectory).not.toBe("");
    await expect(writeFile(path.join(cancelled.candidateDirectory, "retained.txt"), "yes")).resolves.toBeUndefined();
  });

  it("escalates cancellation to SIGKILL when the adapter ignores protocol cancellation and SIGTERM", async () => {
    const started = await startAgentRun({ projectId: "stubborn-source", agent: "codex", prompt: "stubborn" });
    await waitForRun(started.id, (run) => run.events.some((event) => event.text === "stubborn-ready"));

    const cancelled = await cancelAgentRun(started.id);
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.candidateDirectory).not.toBe("");
    await expect(readFile(path.join(cancelled.candidateDirectory, "sigterm-observed.txt"), "utf8")).resolves.toBe("ignored");

    await expect(adoptAgentRun(started.id)).resolves.toMatchObject({ id: "adopted_candidate" });
    const next = await startAgentRun({ projectId: "stubborn-source", agent: "codex", prompt: "normal" });
    await expect(waitForRun(next.id, (run) => run.status === "completed")).resolves.toMatchObject({ status: "completed" });
  });

  it("surfaces authentication requirements without exposing adapter credentials", async () => {
    process.env.FAKE_ACP_AUTH_REQUIRED = "1";
    const started = await startAgentRun({ projectId: "source", agent: "codex", prompt: "normal" });
    const failed = await waitForRun(started.id, (run) => run.status === "failed");
    expect(failed.error).toContain("Provider authentication required");
    expect(JSON.stringify(failed)).not.toContain("sk-never-expose");
  });

  it("rejects outside and symlinked filesystem reads from a real peer request", async () => {
    const outside = path.join(temporaryRoot, "outside.txt");
    await writeFile(outside, "secret", "utf8");

    const outsideRun = await startAgentRun({ projectId: "outside-source", agent: "codex", prompt: `read:${outside}` });
    const outsideDone = await waitForRun(outsideRun.id, (run) => run.status === "completed");
    expect(outsideDone.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "message", text: "filesystem-rejected" }),
    ]));

    const expectedCandidate = path.join(temporaryRoot, `candidate-${candidateCount + 1}`);
    const link = path.join(expectedCandidate, "outside-link.txt");
    const baseFactory = makeCandidate;
    __setAgentTestHooks({
      createCandidate: (async () => {
        const candidate = await baseFactory();
        await symlink(outside, link);
        return candidate;
      }) as never,
      registerCandidate: (async () => { throw new Error("unused"); }) as never,
      executablePath: async (binary) => binary === "codex-acp" ? fakeExecutable : undefined,
      startupTimeoutMs: 1_000,
      stopTimeoutMs: 300,
    });
    const linkRun = await startAgentRun({ projectId: "link-source", agent: "codex", prompt: `read:${link}` });
    const linkDone = await waitForRun(linkRun.id, (run) => run.status === "completed");
    expect(linkDone.events).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "message", text: "filesystem-rejected" }),
    ]));
  });

  it("surfaces unknown adapters and reserves a project before awaiting its snapshot", async () => {
    const unknown = await startAgentRun({ projectId: "unknown-source", agent: "browser-command", prompt: "normal" });
    const failed = await waitForRun(unknown.id, (run) => run.status === "failed");
    expect(failed.error).toContain("Unknown agent adapter");

    let releaseCandidate!: () => void;
    const candidateGate = new Promise<void>((resolve) => { releaseCandidate = resolve; });
    __setAgentTestHooks({
      createCandidate: (async () => {
        await candidateGate;
        return makeCandidate();
      }) as never,
      executablePath: async (binary) => binary === "codex-acp" ? fakeExecutable : undefined,
      startupTimeoutMs: 1_000,
      stopTimeoutMs: 300,
    });
    const first = await startAgentRun({ projectId: "same-source", agent: "codex", prompt: "normal" });
    await expect(startAgentRun({ projectId: "same-source", agent: "codex", prompt: "normal" })).rejects.toThrow("already has an active agent run");
    releaseCandidate();
    await waitForRun(first.id, (run) => run.status === "completed");
  });

  it("does not launch an adapter after cancellation during executable lookup", async () => {
    let releaseLookup!: () => void;
    let markLookupStarted!: () => void;
    const lookupGate = new Promise<void>((resolve) => { releaseLookup = resolve; });
    const lookupStarted = new Promise<void>((resolve) => { markLookupStarted = resolve; });
    __setAgentTestHooks({
      createCandidate: makeCandidate as never,
      registerCandidate: (async (directory: string) => ({ id: "adopted_candidate", directory, files: [], guide: "" })) as never,
      executablePath: async (binary) => {
        if (binary !== "codex-acp") return undefined;
        markLookupStarted();
        await lookupGate;
        return fakeExecutable;
      },
      startupTimeoutMs: 1_000,
      stopTimeoutMs: 300,
    });

    const started = await startAgentRun({ projectId: "lookup-source", agent: "codex", prompt: "normal" });
    await lookupStarted;
    const cancelled = await cancelAgentRun(started.id);
    expect(cancelled.status).toBe("cancelled");
    expect(cancelled.candidateDirectory).not.toBe("");

    releaseLookup();
    const next = await startAgentRun({ projectId: "lookup-source", agent: "codex", prompt: "normal" });
    await waitForRun(next.id, (run) => run.status === "completed");
    await expect(readFile(path.join(cancelled.candidateDirectory, "adapter-started.txt"), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });
});
