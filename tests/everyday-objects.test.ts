import { describe, expect, it } from "vitest";
import { embeddedRoboticsModules } from "../src/lib/curriculum/embedded-robotics";
import { foundationsElectronicsModules } from "../src/lib/curriculum/foundations-electronics";
import { mechanicsControlModules } from "../src/lib/curriculum/mechanics-control";
import { everydayObjects } from "../src/lib/everyday-objects";
import { supplierLinks } from "../src/lib/supplier-links";

describe("everyday object learning maps", () => {
  it("has the six required unique object ids", () => {
    const ids = everydayObjects.map((object) => object.id);
    expect(ids).toEqual(["vacuum", "display", "electric-car", "washer", "thermostat", "barrier"]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references only canonical curriculum lessons", () => {
    const modules = [...foundationsElectronicsModules, ...mechanicsControlModules, ...embeddedRoboticsModules];
    const moduleIds = new Set(modules.map((module) => module.id));
    const references = everydayObjects.flatMap((object) => object.prerequisites);
    expect(references.length).toBeGreaterThan(0);
    expect(references.filter((id) => !moduleIds.has(id))).toEqual([]);
  });

  it("provides substantive experiments and explicit limits", () => {
    for (const object of everydayObjects) {
      expect(object.subsystems.length).toBeGreaterThanOrEqual(4);
      expect(object.energyFlow.length).toBeGreaterThanOrEqual(5);
      expect(object.informationFlow.length).toBeGreaterThanOrEqual(4);
      expect(object.experiment.materials.length).toBeGreaterThan(0);
      expect(object.experiment.steps.length).toBeGreaterThanOrEqual(4);
      expect(object.experiment.observe.length).toBeGreaterThan(0);
      expect(object.experiment.diagnose.length).toBeGreaterThan(0);
      expect(object.experiment.limits.length).toBeGreaterThan(0);
      expect(object.proposedBuild.toLowerCase()).toContain("proposed");
      expect(object.proposedBuild.toLowerCase()).toContain("unvalidated");
      expect(object.proposedBuild.toLowerCase()).toContain("not");
      expect(object.supplierIds.every((id) => id in supplierLinks)).toBe(true);
    }
  });
});

describe("verified supplier identities", () => {
  const expected = {
    originalPico: ["Raspberry Pi", "Pico", "https://www.raspberrypi.com/products/raspberry-pi-pico/", "raspberry-pi-pico"],
    Pi5: ["Raspberry Pi", "5", "https://www.raspberrypi.com/products/raspberry-pi-5/", "raspberry-pi-5"],
    BME2802652: ["Adafruit", "BME280 breakout", "https://www.adafruit.com/product/2652", "adafruit-bme280"],
    SG92R169: ["TowerPro", "SG92R", "https://www.adafruit.com/product/169", "adafruit-sg92r"],
    fan3368: ["Adafruit", "Miniature 5 V cooling fan", "https://www.adafruit.com/product/3368", undefined],
    "DRV8833-3297": ["Adafruit", "DRV8833 breakout", "https://www.adafruit.com/product/3297", undefined],
    OLED326: ["Adafruit", "128 × 64 monochrome OLED breakout", "https://www.adafruit.com/product/326", undefined],
    FS902818: ["FEETECH", "FS90", "https://www.pololu.com/product/2818", "feetech-fs90"],
    servoSupply276: ["Adafruit", "5 V 2 A switching power supply", "https://www.adafruit.com/product/276", "servo-supply-5v"],
    servoPowerAdapter368: ["Adafruit", "2.1 mm female barrel-to-screw adapter", "https://www.adafruit.com/product/368", "servo-power-adapter"],
    servoButton1119: ["Adafruit", "12 mm square, 6 mm tall tactile button", "https://www.adafruit.com/product/1119", "servo-button-pack"],
    servoCable5515: ["Adafruit", "Shrouded servo-to-three-male-jumper adapter", "https://www.adafruit.com/product/5515", "servo-cable-adapter"],
  } as const;

  it("uses only the verified direct official product pages", () => {
    expect(Object.keys(supplierLinks)).toEqual(Object.keys(expected));
    for (const [id, supplier] of Object.entries(supplierLinks)) {
      const url = new URL(supplier.url);
      expect(url.protocol).toBe("https:");
      expect(["www.raspberrypi.com", "www.adafruit.com", "www.pololu.com"]).toContain(url.hostname);
      expect(url.username).toBe("");
      expect(url.password).toBe("");
      expect(url.search).toBe("");
      expect(url.hash).toBe("");
      expect(supplier.selectionNotes.length, id).toBeGreaterThan(0);
      expect(supplier.checkedAt).toBe("2026-10-18");
    }
  });

  it("matches exact known models, URLs, and existing catalog ids", () => {
    for (const [id, [manufacturer, model, url, catalogItemId]] of Object.entries(expected)) {
      expect(supplierLinks[id]).toMatchObject({ manufacturer, model, url });
      expect(supplierLinks[id].catalogItemId).toBe(catalogItemId);
    }
  });
});
