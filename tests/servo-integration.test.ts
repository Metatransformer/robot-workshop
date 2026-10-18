import { describe, expect, it } from "vitest";
import { modules, projectPaths } from "../src/lib/curriculum";
import { seedCatalog, templates, getTemplateFiles, getTemplatePartIds } from "../src/lib/seeds";
import { servoBenchFiles } from "../src/lib/servo-bench";

describe("FS90 starter integration", () => {
  it("registers an independent starter whose files and parts all resolve", () => {
    const template = templates.find((entry) => entry.id === "servo-bench");
    const files = getTemplateFiles("servo-bench");
    const catalogIds = new Set(seedCatalog.map((item) => item.id));

    expect(template).toMatchObject({
      title: "Pico + FS90 servo bench",
      model: "none",
      category: "robotics",
      level: "beginner",
    });
    expect(template?.description).toMatch(/hold-to-run/i);
    expect(template?.description).toMatch(/unloaded/i);
    expect(template?.description).toMatch(/unbuilt/i);
    expect(Object.keys(files)).toEqual(expect.arrayContaining(Object.keys(servoBenchFiles)));
    expect(Object.values(files).every((content) => content.trim().length > 0)).toBe(true);
    expect(getTemplatePartIds("servo-bench").every((id) => catalogIds.has(id))).toBe(true);
  });

  it("keeps the SG92R desk robot and its original firmware independent", () => {
    const partIds = getTemplatePartIds("desk-robot");
    const files = getTemplateFiles("desk-robot");

    expect(partIds).toContain("adafruit-sg92r");
    expect(partIds).not.toContain("feetech-fs90");
    expect(files).toHaveProperty("firmware/main.py");
    expect(files["firmware/main.py"]).toContain("NEUTRAL_DEGREES = 90");
    expect(files["firmware/main.py"]).not.toMatch(/FS90/i);
  });

  it("resolves every module in the servo learning path", () => {
    const path = projectPaths.find((entry) => entry.templateId === "servo-bench");
    const moduleIds = new Set(modules.map((module) => module.id));
    const resolvedIds = [...(path?.required ?? []), ...(path?.optional ?? [])];

    expect(path).toBeDefined();
    expect(path?.title).toBe("Command a servo deliberately");
    expect(path?.required).toEqual(expect.arrayContaining([
      "voltage-current-resistance",
      "power-regulation",
      "torque-gearing",
      "mcu-gpio",
      "timers-pwm",
      "programming-state",
      "reliability-faults",
    ]));
    expect(resolvedIds).toEqual(expect.arrayContaining(["measurement-instruments", "experimental-method"]));
    expect(resolvedIds.every((id) => moduleIds.has(id))).toBe(true);
  });

  it("attaches the authored source guide to the generated starter", () => {
    const files = getTemplateFiles("servo-bench");

    expect(files["BUY_AND_BUILD.md"]).toBe(servoBenchFiles["BUY_AND_BUILD.md"]);
    expect(files["BUY_AND_BUILD.md"]).toContain("Buy and build — Pico + FS90 bounded servo bench");
  });
});
