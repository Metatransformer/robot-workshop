import { describe, expect, it } from "vitest";
import { projectPaths } from "../src/lib/curriculum";
import { getLearningFiles } from "../src/lib/learning";
import { sensorLedFiles } from "../src/lib/sensor-led";
import { getTemplateFiles, getTemplatePartIds, seedCatalog, templates } from "../src/lib/seeds";
import { supplierLinks } from "../src/lib/supplier-links";

describe("external sensor LED template integration", () => {
  it("registers a separate beginner electronics template with the complete authored packet", () => {
    const template = templates.find((entry) => entry.id === "sensor-led");
    const files = getTemplateFiles("sensor-led");
    const requiredFiles = [
      "README.md",
      "ENGINEERING.md",
      "WIRING.md",
      "BUY_AND_BUILD.md",
      "firmware/code.py",
      "firmware/indicator.py",
      "firmware/behavior.md",
    ];

    expect(template).toMatchObject({
      title: "Pico + BME280 external LED indicator",
      model: "none",
      category: "electronics",
      level: "beginner",
    });
    expect(Object.keys(files)).toEqual(expect.arrayContaining(Object.keys(sensorLedFiles)));
    for (const filename of requiredFiles) {
      expect(sensorLedFiles, `${filename} is authored in the sensor LED packet`).toHaveProperty(filename);
      expect(files[filename]?.trim().length, `${filename} is nonblank`).toBeGreaterThan(0);
    }
  });

  it("resolves every template part to the catalog and keeps catalog units separate from seller packs", () => {
    const partIds = getTemplatePartIds("sensor-led");
    const catalogById = new Map(seedCatalog.map((item) => [item.id, item]));

    expect(partIds).toEqual([
      "raspberry-pi-pico",
      "adafruit-bme280",
      "generic-breadboard",
      "generic-usb-data-cable",
      "sensor-led-jumper-set",
      "tool-digital-multimeter",
      "tool-soldering-iron",
      "red-led-5mm-297",
      "resistor-1k-4294",
    ]);
    expect(partIds.every((id) => catalogById.has(id))).toBe(true);

    for (const id of ["red-led-5mm-297", "resistor-1k-4294"]) {
      const item = catalogById.get(id);
      expect(item).toMatchObject({ kind: "part", ownedQuantity: 0 });
      expect(item?.name).not.toMatch(/25-pack/i);
      expect(item?.sources).toHaveLength(1);
      expect(item?.sources[0].capturedAt).toBe("2026-10-18T00:00:00.000Z");
      expect(item?.specs.every((spec) => spec.evidence === "document")).toBe(true);
    }

    expect(supplierLinks.redLED297).toMatchObject({ sku: "297", catalogItemId: "red-led-5mm-297" });
    expect(supplierLinks.resistor1K4294).toMatchObject({ sku: "4294", catalogItemId: "resistor-1k-4294" });
    expect(supplierLinks.redLED297.selectionNotes.join(" ")).toMatch(/package contains 25.*uses one/i);
    expect(supplierLinks.resistor1K4294.selectionNotes.join(" ")).toMatch(/package contains 25.*uses one/i);
  });

  it("does not change the original sensor starter or its onboard GP25 behavior", () => {
    const originalPartIds = getTemplatePartIds("sensor");
    const originalFiles = getTemplateFiles("sensor");

    expect(originalPartIds).toEqual([
      "raspberry-pi-pico",
      "adafruit-bme280",
      "generic-breadboard",
      "generic-usb-data-cable",
      "generic-jumper-wires",
      "tool-digital-multimeter",
      "tool-soldering-iron",
    ]);
    expect(originalPartIds).not.toContain("red-led-5mm-297");
    expect(originalPartIds).not.toContain("resistor-1k-4294");
    expect(originalFiles["README.md"]).toContain("No external LED or light driver is used.");
    expect(originalFiles["WIRING.md"]).toContain("There is no wire from VBUS to the sensor and no external LED connection.");
    expect(originalFiles["firmware/code.py"]).toContain("board.GP25");
    expect(originalFiles["firmware/code.py"]).not.toContain("DigitalInOut(board.GP2)");
  });

  it("provides a nonblank learning route and the intended curriculum path", () => {
    const learningFiles = getLearningFiles("sensor-led");
    const path = projectPaths.find((entry) => entry.templateId === "sensor-led");

    expect(Object.values(learningFiles).every((content) => content.trim().length > 300)).toBe(true);
    expect(learningFiles["LEARNING_PATH.md"]).toContain("workshop:template/sensor-led");
    expect(path?.title).toBe("Make a reading visible");
    expect(path?.required).toEqual(expect.arrayContaining([
      "voltage-current-resistance",
      "measurement-instruments",
      "mcu-gpio",
      "programming-state",
      "digital-interfaces",
      "communications-protocols",
      "firmware-debugging",
      "probability-uncertainty",
    ]));
    expect(path?.optional).toEqual(expect.arrayContaining(["documentation-sharing"]));
  });
});
