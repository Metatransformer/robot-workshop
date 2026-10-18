import { z } from "zod";
import { CatalogItemSchema, Id } from "@/lib/contracts";
import * as store from "@/server/store";
import * as agents from "@/server/agents";
import { readProjectAsset } from "@/server/assets";
import { extractDocument, saveReviewedIngestion } from "@/server/ingestion";
import { boundedJson, verifyApiRequest, WorkshopError } from "@/server/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const title = z.string().trim().min(1).max(160);
const payload = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), title, description: z.string().max(3000).optional(), templateId: Id }),
  z.object({ action: z.literal("copy"), id: Id, title: title.optional() }),
  z.object({ action: z.literal("save-file"), id: Id, path: z.string().min(1).max(500), content: z.string().max(2_000_000), expectedHash: z.string().min(1).max(128) }),
  z.object({ action: z.literal("save-item"), item: CatalogItemSchema, expectedVersion: z.number().int().positive().optional() }),
  z.object({ action: z.literal("add-item"), id: Id, itemId: Id, quantity: z.number().positive().max(100000) }),
  z.object({ action: z.literal("parameters"), id: Id, parameters: z.record(z.string().max(80), z.number().finite().min(-100000).max(100000)).refine(v => Object.keys(v).length <= 50) }),
  z.object({ action: z.literal("ingest"), text: z.string().max(250000).optional(), base64: z.string().max(33_554_432).optional(), fileName: z.string().max(300).optional(), sourceUrl: z.string().max(2048).optional() }),
  z.object({ action: z.literal("save-ingestion"), draftId: Id, item: CatalogItemSchema }),
  z.object({ action: z.literal("export"), id: Id, selectedPaths: z.array(z.string().min(1).max(500)).max(2000).optional() }),
  z.object({ action: z.literal("agent-start"), id: Id, agent: z.enum(["codex", "claude", "opencode"]), prompt: z.string().trim().min(1).max(50000) }),
  z.object({ action: z.literal("agent-cancel"), runId: Id }),
  z.object({ action: z.literal("agent-permission"), runId: Id, permissionId: z.string().min(1).max(200), optionId: z.string().min(1).max(200) }),
  z.object({ action: z.literal("agent-adopt"), runId: Id }),
]);
const response = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
function failure(error: unknown) {
  if (error instanceof WorkshopError) return response({ error: error.message, code: error.code }, error.status);
  if (error instanceof z.ZodError) return response({ error: error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "), code: "INVALID_INPUT" }, 400);
  // Domain errors are actionable local failures; do not send stack traces or child-process logs.
  return response({ error: error instanceof Error ? error.message : "Workshop operation failed.", code: "WORKSHOP_ERROR" }, 400);
}
export async function GET(request: Request) {
  try {
    verifyApiRequest(request);
    const q = new URL(request.url).searchParams;
    let data: unknown;
    switch (q.get("action")) {
      case "bootstrap": data = await store.getBootstrap(); break;
      case "project": data = await store.getProject(Id.parse(q.get("id"))); break;
      case "file": data = await store.readProjectFile(Id.parse(q.get("id")), z.string().min(1).max(500).parse(q.get("path"))); break;
      case "agents": data = await agents.getAgentStatus(); break;
      case "asset": data = await readProjectAsset(Id.parse(q.get("id")), z.string().min(1).max(500).parse(q.get("path"))); break;
      default: throw new WorkshopError("Unknown workshop operation.");
    }
    return response({ data });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    verifyApiRequest(request);
    const p = payload.parse(await boundedJson(request));
    let data: unknown;
    switch (p.action) {
      case "create": data = await store.createProject(p); break;
      case "copy": data = await store.copyProject(p.id, p.title); break;
      case "save-file": data = await store.saveFileAsCopy(p.id, p); break;
      case "save-item": data = await store.saveCatalogItem(p.item, p.expectedVersion); break;
      case "add-item": data = await store.addProjectItem(p.id, p.itemId, p.quantity); break;
      case "parameters": data = await store.updateParameters(p.id, p.parameters); break;
      case "ingest": data = await extractDocument(p); break;
      case "save-ingestion": data = await saveReviewedIngestion(p); break;
      case "export": data = await store.exportProject(p.id, p.selectedPaths); break;
      case "agent-start": data = await agents.startAgentRun({ projectId: p.id, agent: p.agent, prompt: p.prompt }); break;
      case "agent-cancel": data = await agents.cancelAgentRun(p.runId); break;
      case "agent-permission": data = await agents.answerAgentPermission(p.runId, p.permissionId, p.optionId); break;
      case "agent-adopt": data = await agents.adoptAgentRun(p.runId); break;
    }
    return response({ data });
  } catch (error) { return failure(error); }
}
