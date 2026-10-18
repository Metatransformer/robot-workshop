import { z } from "zod";

export const Id = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
export const SourceSchema = z.object({
  id: Id, title: z.string().min(1).max(300), url: z.string().url().optional(),
  fileName: z.string().max(300).optional(), hash: z.string().optional(),
  capturedAt: z.string(), text: z.string().max(250_000).optional(),
});
export const SpecSchema = z.object({
  label: z.string().min(1).max(160), value: z.string().max(500),
  unit: z.string().max(50).optional(), evidence: z.enum(["document", "manual", "estimated"]),
  sourceId: Id.optional(), quote: z.string().max(2000).optional(), page: z.number().int().positive().optional(),
});
export const CatalogItemSchema = z.object({
  id: Id, name: z.string().min(1).max(160), kind: z.enum(["part", "tool"]),
  category: z.string().max(80), description: z.string().max(3000),
  manufacturer: z.string().max(160).optional(), model: z.string().max(160).optional(),
  tags: z.array(z.string().max(60)).max(30), specs: z.array(SpecSchema).max(100),
  sources: z.array(SourceSchema).max(20), ownedQuantity: z.number().int().min(0).max(100000),
  notes: z.string().max(10000), version: z.number().int().positive(),
  createdAt: z.string(), updatedAt: z.string(),
});
export type Source = z.infer<typeof SourceSchema>;
export type Specification = z.infer<typeof SpecSchema>;
export type CatalogItem = z.infer<typeof CatalogItemSchema>;
export type ModelKind = "linkage" | "robot" | "cyberdeck" | "none";
export type Template = {
  id: string; title: string; description: string; category: string;
  level: string; model: ModelKind; skills: string[]; partIds: string[];
};
export const ProjectSchema = z.object({
  schemaVersion: z.literal(1), id: Id, title: z.string().min(1).max(160),
  description: z.string().max(3000), templateId: Id,
  model: z.enum(["linkage", "robot", "cyberdeck", "none"]),
  createdAt: z.string(), updatedAt: z.string(),
  parameters: z.record(z.string(), z.number()),
  bom: z.array(z.object({ itemId: Id, quantity: z.number().positive(), role: z.enum(["component", "tool"]), snapshot: CatalogItemSchema })),
  provenance: z.object({ sourceProjectId: z.string(), sourceRevision: z.string().optional() }).optional(),
});
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectRecord = Project & { directory: string; isExample?: boolean };
export type ProjectFile = { path: string; size: number; hash: string; kind: "document" | "code" | "image" | "data" | "model" | "other" };
export type FileContent = { path: string; content: string; hash: string };
export type ProjectDetail = ProjectRecord & { files: ProjectFile[]; guide: string };
export type IngestionDraft = {
  id: string; name: string; manufacturer: string; category: string; description: string;
  source: Source; specifications: Specification[]; warnings: string[]; pageCount?: number;
};
export type Bootstrap = { warnings?: string[]; projects: ProjectRecord[]; library: CatalogItem[]; templates: Template[] };
export type Permission = { id: string; title: string; options: { optionId: string; name: string; kind: string }[] };
export type AgentEvent = { id: number; type: "message" | "tool" | "notice" | "error"; text: string; timestamp: string };
export type AgentRun = {
  id: string; projectId: string; candidateDirectory: string; agent: string;
  status: "connecting" | "running" | "permission" | "completed" | "failed" | "cancelled";
  events: AgentEvent[]; permissions: Permission[]; error?: string; createdAt: string;
};
export type AgentAdapter = { id: string; name: string; available: boolean; command: string; setup: string };
export type AgentStatus = { adapters: AgentAdapter[]; runs: AgentRun[] };
export type ApiResult<T> = { data: T } | { error: string; code: string };
