import { describe, expect, it } from "vitest";
import {
  EMPTY_LED_DRAFT,
  evaluateLedMeasurement,
  makeLedMeasurementRecord,
  parseLedDraft,
  type LedMeasurementDraft,
} from "../src/lib/led-measurement";

function draft(overrides: Partial<LedMeasurementDraft> = {}): LedMeasurementDraft {
  return { ...EMPTY_LED_DRAFT, resistanceOhm: "1000", voltageV: "1.3", ...overrides };
}

describe("LED measurement model", () => {
  it("provides a blank draft with unknown states", () => {
    expect(EMPTY_LED_DRAFT).toEqual({
      resistanceOhm: "",
      voltageV: "",
      observedAt: "",
      partIdentity: "",
      meter: "",
      notes: "",
      command: "unknown",
      light: "unknown",
    });
  });

  it("calculates the nominal observation without rounding", () => {
    const result = evaluateLedMeasurement(draft());
    expect(result).toMatchObject({
      ok: true,
      resistanceOhm: 1000,
      voltageV: 1.3,
      currentMa: 1.3,
      powerMw: 1.69,
      warnings: [],
    });
  });

  it("calculates measured values from 1005 ohms and 1.2 volts", () => {
    const result = evaluateLedMeasurement(draft({ resistanceOhm: "1005", voltageV: "1.2" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.currentMa).toBeCloseTo(1.1940298507462686, 15);
    expect(result.powerMw).toBeCloseTo(1.4328358208955223, 15);
    expect(result.warnings).toEqual([]);
  });

  it("preserves signed voltage and current while power stays nonnegative", () => {
    const result = evaluateLedMeasurement(draft({ voltageV: "-1.2" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.voltageV).toBe(-1.2);
    expect(result.currentMa).toBeCloseTo(-1.2, 15);
    expect(result.powerMw).toBeCloseTo(1.44, 15);
    expect(result.warnings).toContain("Voltage is negative; check probe orientation.");
  });

  it("accepts zero voltage, surrounding whitespace, and scientific notation", () => {
    expect(evaluateLedMeasurement(draft({ voltageV: "0" }))).toMatchObject({
      ok: true,
      voltageV: 0,
      currentMa: 0,
      powerMw: 0,
    });
    expect(evaluateLedMeasurement(draft({ resistanceOhm: " 1e3 ", voltageV: " +1.3e0 " }))).toMatchObject({
      ok: true,
      resistanceOhm: 1000,
      voltageV: 1.3,
      currentMa: 1.3,
    });
  });

  it.each([
    ["blank resistance", { resistanceOhm: "" }],
    ["blank voltage", { voltageV: "  " }],
    ["zero resistance", { resistanceOhm: "0" }],
    ["negative resistance", { resistanceOhm: "-1000" }],
    ["hex", { voltageV: "0x10" }],
    ["NaN", { voltageV: "NaN" }],
    ["Infinity", { voltageV: "Infinity" }],
    ["trailing junk", { voltageV: "1.2V" }],
  ])("rejects %s", (_label, overrides) => {
    expect(evaluateLedMeasurement(draft(overrides))).toMatchObject({ ok: false });
  });

  it("rejects numeric input overflow and nonzero input underflow", () => {
    expect(evaluateLedMeasurement(draft({ voltageV: "1e309" }))).toMatchObject({ ok: false });
    expect(evaluateLedMeasurement(draft({ voltageV: "1e-400" }))).toMatchObject({ ok: false });
    expect(evaluateLedMeasurement(draft({ resistanceOhm: "1e-400" }))).toMatchObject({ ok: false });
  });

  it("rejects derived overflow and underflow instead of returning nonfinite or false zero values", () => {
    expect(evaluateLedMeasurement(draft({ resistanceOhm: "5e-324", voltageV: "1e308" }))).toMatchObject({ ok: false });
    expect(evaluateLedMeasurement(draft({ resistanceOhm: "1e308", voltageV: "5e-324" }))).toMatchObject({ ok: false });
    expect(evaluateLedMeasurement(draft({ resistanceOhm: "1e308", voltageV: "1e-20" }))).toMatchObject({ ok: false });
  });

  it("uses a stable operation order when large intermediates would overflow", () => {
    const result = evaluateLedMeasurement(draft({ resistanceOhm: "1e200", voltageV: "1e150" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.currentMa).toBe(1e-47);
    expect(result.powerMw).toBeCloseTo(1e103, -88);
    expect(Number.isFinite(result.powerMw)).toBe(true);
  });

  it("warns for unusual but finite accepted observations", () => {
    const result = evaluateLedMeasurement(draft({
      resistanceOhm: "1200",
      voltageV: "-4",
      command: "off",
      light: "flickering",
    }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.warnings).toEqual([
      "Resistance is outside the nominal 950–1050 Ω range.",
      "Voltage is negative; check probe orientation.",
      "Voltage magnitude is above the nominal 3.3 V Pico GPIO route; compare probes and power connections.",
      "Flickering suggests changing voltage. A DC meter may average it; V²/R from that reading does not establish average resistor heating power.",
      "Known command and observed light states disagree.",
    ]);
  });

  it("restores only the exact strict draft schema", () => {
    const valid = draft({ observedAt: "2026-10-18T10:30:00-06:00", notes: "observed" });
    expect(parseLedDraft(valid)).toEqual(valid);
    expect(parseLedDraft(null)).toBeNull();
    expect(parseLedDraft({ ...valid, command: "maybe" })).toBeNull();
    expect(parseLedDraft({ ...valid, extra: "malicious" })).toBeNull();
    expect(parseLedDraft({ ...valid, notes: "x".repeat(5_001) })).toBeNull();
    expect(parseLedDraft({ ...valid, resistanceOhm: "x".repeat(101) })).toBeNull();
    expect(parseLedDraft({ ...valid, voltageV: 1.3 })).toBeNull();
  });

  it("exports a JSON-ready record preserving user fields and separating nominal values", () => {
    const input = draft({
      resistanceOhm: "1005",
      voltageV: "1.2",
      observedAt: "user-provided observation time",
      partIdentity: "LED 297",
      meter: "bench meter",
      notes: "probe notes",
      command: "on",
      light: "on",
    });
    const before = structuredClone(input);
    const record = makeLedMeasurementRecord(input, "2026-10-18T18:00:00.000Z");

    expect(record).toMatchObject({
      format: "metatransformer-led-measurement",
      version: 1,
      exportedAt: "2026-10-18T18:00:00.000Z",
      provenance: "user-entered-unverified",
      input,
      derived: {
        resistanceOhm: 1005,
        voltageV: 1.2,
        currentMa: expect.any(Number),
        powerMw: expect.any(Number),
      },
      nominal: {
        outputV: 3.3,
        forwardV: 2,
        resistanceOhm: 1000,
        currentMa: 1.3,
        powerMw: 1.69,
      },
      warnings: [],
      limitations: expect.any(Array),
    });
    expect(record.input.observedAt).not.toBe(record.exportedAt);
    expect(record.limitations.join(" ")).toContain("not measured directly");
    expect(record.limitations.join(" ")).toContain("not guaranteed");
    expect(record.limitations.join(" ")).toContain("not been independently verified");
    expect(record.limitations.join(" ")).toContain("original Raspberry Pi Pico, LED 297, and 1 kΩ resistor 4294 route");
    expect(input).toEqual(before);
    expect(record.input).not.toBe(input);
  });

  it("throws instead of exporting an invalid measurement and does not mutate inputs", () => {
    const input = draft({ resistanceOhm: "0", notes: "keep me" });
    const before = structuredClone(input);
    expect(() => makeLedMeasurementRecord(input, "export time")).toThrow("Invalid LED measurement");
    expect(input).toEqual(before);
  });
});


it("keeps flicker uncertainty in the exported record", () => {
  const record = makeLedMeasurementRecord({ ...EMPTY_LED_DRAFT, resistanceOhm: "1000", voltageV: "1.3", light: "flickering" }, "2026-10-18T00:00:00Z");
  expect(record.warnings.join(" ")).toContain("does not establish average");
  expect(record.limitations.join(" ")).toContain("steady DC");
});
