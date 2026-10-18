import { describe, expect, it } from "vitest";
import {
  associationAfterSuccessfulRun,
  createNotebookRecord,
  parseNotebookStorage,
  type NotebookRecord,
} from "@/lib/simulation-notebook";
import type { RcChargingInput } from "@/lib/simulations";

const rcParameters: RcChargingInput = {
  resistanceOhms: 1_000,
  capacitanceMicrofarads: 100,
  supplyVoltageV: 5,
  initialVoltageV: 0,
  durationMs: 500,
};

describe("simulation notebook provenance", () => {
  it("round-trips a snapshot and recomputes results from validated parameters", () => {
    const ranAt = new Date().toISOString();
    const record = createNotebookRecord("rc-transient", "It will charge.", "It charged.", "bound", {
      parameters: rcParameters,
      ranAt,
    });
    const stored = JSON.stringify({ ...record, results: { finalVoltageV: 999_999 } });

    const restored = parseNotebookStorage(stored, "rc-transient");

    expect(restored.ok).toBe(true);
    if (!restored.ok || !restored.value.run || restored.value.run.labId !== "rc-transient") return;
    expect(restored.value.association).toBe("bound");
    expect(restored.value.run.ranAt).toBe(ranAt);
    expect(restored.value.run.result.ok).toBe(true);
    if (restored.value.run.result.ok) {
      expect(restored.value.run.result.value.finalVoltageV).not.toBe(999_999);
      expect(restored.value.run.result.value.points).toHaveLength(201);
    }
  });

  it("restores legacy text as available but explicitly unbound notes", () => {
    const restored = parseNotebookStorage(JSON.stringify({ prediction: "Old prediction", observations: "Old evidence" }), "dc-motor");

    expect(restored).toEqual({
      ok: true,
      value: {
        source: "legacy",
        prediction: "Old prediction",
        observations: "Old evidence",
        association: "unbound",
        run: null,
      },
    });
  });

  it("unbinds observations when a successful run uses changed parameters", () => {
    expect(associationAfterSuccessfulRun("bound", "Observed output", rcParameters, { ...rcParameters, durationMs: 750 })).toBe("unbound");
    expect(associationAfterSuccessfulRun("bound", "Observed output", rcParameters, { ...rcParameters })).toBe("bound");
    expect(associationAfterSuccessfulRun("unbound", "Legacy evidence", rcParameters, { ...rcParameters })).toBe("unbound");
    expect(associationAfterSuccessfulRun("unbound", "", rcParameters, { ...rcParameters, durationMs: 750 })).toBe("bound");
  });

  it("rejects mismatched labs and invalid model data while salvaging bounded notes", () => {
    const invalid: NotebookRecord = {
      version: 1,
      labId: "rc-transient",
      prediction: "Keep me",
      observations: "Keep this too",
      association: "bound",
      run: { parameters: { ...rcParameters, resistanceOhms: 0 }, ranAt: new Date().toISOString() },
    };

    const badParameters = parseNotebookStorage(JSON.stringify(invalid), "rc-transient");
    expect(badParameters.ok).toBe(false);
    if (!badParameters.ok) {
      expect(badParameters.error).toMatch(/model validation/i);
      expect(badParameters.salvagedText).toEqual({ prediction: "Keep me", observations: "Keep this too" });
    }

    const mismatched = parseNotebookStorage(JSON.stringify({ ...invalid, run: null, association: "unbound" }), "dc-motor");
    expect(mismatched.ok).toBe(false);
    if (!mismatched.ok) expect(mismatched.error).toMatch(/mismatched lab/i);
  });
});
