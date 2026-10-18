import type { ModuleProgress } from "@/lib/curriculum/types";

export const LEARNING_PROGRESS_VERSION = 1 as const;
export const LEARNING_PROGRESS_STORAGE_KEY = "metatransformer.learning-progress.v1";
export const MAX_PROGRESS_RECORDS = 256;
export const MAX_NOTE_LENGTH = 5_000;
export const MIN_DEMONSTRATION_NOTE_LENGTH = 20;

export type LearningProgressState = {
  version: typeof LEARNING_PROGRESS_VERSION;
  records: Record<string, ModuleProgress>;
};

export type ProgressResult<T> =
  | { ok: true; value: T; warnings: string[] }
  | { ok: false; error: string };

type ProgressStorage = Pick<Storage, "getItem" | "setItem">;

export function emptyLearningProgress(): LearningProgressState {
  return { version: LEARNING_PROGRESS_VERSION, records: {} };
}

export function emptyModuleProgress(): ModuleProgress {
  return { read: false, practiced: false, demonstrated: false, notes: "", updatedAt: "" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validModuleProgress(value: unknown): value is ModuleProgress {
  if (!isRecord(value)) return false;
  return typeof value.read === "boolean"
    && typeof value.practiced === "boolean"
    && typeof value.demonstrated === "boolean"
    && typeof value.notes === "string"
    && value.notes.length <= MAX_NOTE_LENGTH
    && (!value.demonstrated || value.notes.trim().length >= MIN_DEMONSTRATION_NOTE_LENGTH)
    && typeof value.updatedAt === "string"
    && value.updatedAt.length <= 64
    && Number.isFinite(Date.parse(value.updatedAt));
}

export function parseLearningProgress(
  input: string,
  validModuleIds: Iterable<string>,
): ProgressResult<LearningProgressState> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    return { ok: false, error: "That file is not valid JSON." };
  }

  if (!isRecord(parsed) || parsed.version !== LEARNING_PROGRESS_VERSION || !isRecord(parsed.records)) {
    return { ok: false, error: `Progress files must use version ${LEARNING_PROGRESS_VERSION}.` };
  }

  const allowed = new Set(validModuleIds);
  const records: Record<string, ModuleProgress> = {};
  const warnings: string[] = [];
  let accepted = 0;

  for (const [moduleId, value] of Object.entries(parsed.records)) {
    if (!allowed.has(moduleId)) {
      warnings.push(`Ignored unknown lesson “${moduleId}”.`);
      continue;
    }
    if (!validModuleProgress(value)) {
      warnings.push(`Ignored invalid progress for “${moduleId}”.`);
      continue;
    }
    if (accepted >= MAX_PROGRESS_RECORDS) {
      warnings.push(`Only the first ${MAX_PROGRESS_RECORDS} valid records were restored.`);
      break;
    }
    records[moduleId] = { ...value };
    accepted += 1;
  }

  return { ok: true, value: { version: LEARNING_PROGRESS_VERSION, records }, warnings };
}

export function serializeLearningProgress(state: LearningProgressState): string {
  return JSON.stringify(state, null, 2);
}

export function mergeLearningProgress(
  current: LearningProgressState,
  incoming: LearningProgressState,
): LearningProgressState {
  const records: Record<string, ModuleProgress> = { ...current.records };

  for (const [moduleId, restored] of Object.entries(incoming.records)) {
    const existing = records[moduleId];
    if (!existing) {
      records[moduleId] = { ...restored };
      continue;
    }
    const demonstrated = existing.demonstrated || restored.demonstrated;
    const importedNotes = restored.notes.trim().length > 0
      && (!existing.notes.trim() || Date.parse(restored.updatedAt) >= Date.parse(existing.updatedAt))
      && (!demonstrated || restored.notes.trim().length >= MIN_DEMONSTRATION_NOTE_LENGTH);
    const chosenNotes = importedNotes ? restored.notes : existing.notes;
    const notes = demonstrated && chosenNotes.trim().length < MIN_DEMONSTRATION_NOTE_LENGTH
      ? restored.notes : chosenNotes;
    records[moduleId] = {
      read: existing.read || restored.read,
      practiced: existing.practiced || restored.practiced,
      demonstrated,
      notes,
      updatedAt: Date.parse(restored.updatedAt) >= Date.parse(existing.updatedAt) ? restored.updatedAt : existing.updatedAt,
    };
  }

  return { version: LEARNING_PROGRESS_VERSION, records };
}

export function validateDemonstrationNote(note: string): ProgressResult<string> {
  const trimmed = note.trim();
  if (trimmed.length < MIN_DEMONSTRATION_NOTE_LENGTH) {
    return {
      ok: false,
      error: `Describe what you expected and measured in at least ${MIN_DEMONSTRATION_NOTE_LENGTH} characters.`,
    };
  }
  if (trimmed.length > MAX_NOTE_LENGTH) {
    return { ok: false, error: `Notes must be ${MAX_NOTE_LENGTH.toLocaleString()} characters or fewer.` };
  }
  return { ok: true, value: trimmed, warnings: [] };
}

export function loadLearningProgress(
  storage: ProgressStorage,
  validModuleIds: Iterable<string>,
): ProgressResult<LearningProgressState> {
  let raw: string | null;
  try {
    raw = storage.getItem(LEARNING_PROGRESS_STORAGE_KEY);
  } catch {
    return { ok: false, error: "Browser storage is unavailable. Progress will remain in this tab only." };
  }
  if (raw === null) return { ok: true, value: emptyLearningProgress(), warnings: [] };
  return parseLearningProgress(raw, validModuleIds);
}

export function saveLearningProgress(
  storage: ProgressStorage,
  state: LearningProgressState,
): ProgressResult<LearningProgressState> {
  try {
    const serialized = serializeLearningProgress(state);
    storage.setItem(LEARNING_PROGRESS_STORAGE_KEY, serialized);
    if (storage.getItem(LEARNING_PROGRESS_STORAGE_KEY) !== serialized) {
      return { ok: false, error: "Browser storage did not retain this change. Progress is not saved beyond this tab." };
    }
    return { ok: true, value: state, warnings: [] };
  } catch {
    return { ok: false, error: "Browser storage is unavailable. This change is not saved beyond this tab." };
  }
}
