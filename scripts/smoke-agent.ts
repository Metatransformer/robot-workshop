import { mkdtemp, readFile, realpath } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createProject, getProjectDirectory } from "../src/server/store";
import { adoptAgentRun, cancelAgentRun, getAgentRun, startAgentRun } from "../src/server/agents";
// Explicit manual smoke: uses the user's authenticated local Codex and model credits.
const home = await realpath(await mkdtemp(join(tmpdir(), "mt-live-agent-")));
process.env.METATRANSFORMER_HOME = home;
const project = await createProject({ title: "ACP integration smoke", templateId: "blank" });
const initial = await startAgentRun({ projectId: project.id, agent: "codex", prompt: "Integration smoke test. Create ONLY notes/agent-check.md in the current project containing exactly: ACP workshop smoke passed. Do not change any other files, access other directories, use network, or run tests. Use your normal file editing tool, then say done." });
const deadline = Date.now() + 120000;
let run = initial;
while (!["completed", "failed", "cancelled"].includes(run.status) && Date.now() < deadline) {
  if (run.permissions.length) {
    console.log("Live run requires explicit permission; stopping without granting it.");
    run = await cancelAgentRun(run.id); break;
  }
  await new Promise(resolve => setTimeout(resolve, 500));
  run = getAgentRun(run.id);
}
if (!["completed", "failed", "cancelled"].includes(run.status)) run = await cancelAgentRun(run.id);
console.log(JSON.stringify({ status: run.status, error: run.error, events: run.events.map(e => ({type:e.type,text:e.text})), home }, null, 2));
if (run.status === "completed") {
  const result = await adoptAgentRun(run.id);
  const content = await readFile(join(result.directory, "notes/agent-check.md"), "utf8");
  if (!content.includes("ACP workshop smoke passed.")) throw new Error("Agent did not create expected file.");
  const original = await getProjectDirectory(project.id);
  try { await readFile(join(original, "notes/agent-check.md")); throw new Error("Original was modified."); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  console.log("Verified actual ACP-authored file, adoption, and unchanged original.");
} else { process.exitCode = 1; }
