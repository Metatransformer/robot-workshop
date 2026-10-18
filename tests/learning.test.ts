import { describe, expect, it } from "vitest";
import { addLearningLinks, getLearningFiles } from "../src/lib/learning";

const templateIds = ["linkage", "desk-robot", "cyberdeck", "sensor", "blank"] as const;
const learningFilenames = ["START_HERE.md", "GLOSSARY.md", "LEARNING_PATH.md"];

function markdownAnchors(markdown: string): Set<string> {
  return new Set(
    [...markdown.matchAll(/^## (.+)$/gm)].map(([, heading]) =>
      heading
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-"),
    ),
  );
}

describe("learning files", () => {
  it.each(templateIds)("generates complete beginner guidance for %s", (templateId) => {
    const files = getLearningFiles(templateId);

    expect(Object.keys(files).sort()).toEqual([...learningFilenames].sort());
    for (const filename of learningFilenames) {
      expect(files[filename].trim().length).toBeGreaterThan(300);
    }
    expect(files["START_HERE.md"]).toContain("Your first small step");
    expect(files["START_HERE.md"]).toMatch(/Success is visible/i);
    expect(files["START_HERE.md"]).toContain("[ENGINEERING.md](ENGINEERING.md)");
    expect(files["LEARNING_PATH.md"]).toContain("Goal:");
    expect(files["LEARNING_PATH.md"]).toContain("Prerequisite:");
  });

  it("uses the researched primary learning sources", () => {
    const paths = templateIds.map((id) => getLearningFiles(id)["LEARNING_PATH.md"]).join("\n");
    const urls = [
      "https://www.raspberrypi.com/products/raspberry-pi-pico/",
      "https://circuitpython.org/board/raspberry_pi_pico/",
      "https://docs.circuitpython.org/projects/bme280/en/latest/examples.html",
      "https://docs.micropython.org/en/latest/rp2/quickref.html",
      "https://docs.blender.org/manual/en/latest/",
      "https://docs.kicad.org/",
    ];

    for (const url of urls) expect(paths).toContain(url);
  });

  it("links only to supported tutorial templates", () => {
    const validIds = new Set<string>(templateIds);

    for (const templateId of templateIds) {
      const path = getLearningFiles(templateId)["LEARNING_PATH.md"];
      const linkedIds = [...path.matchAll(/workshop:template\/([a-z-]+)/g)].map((match) => match[1]);
      expect(linkedIds.length).toBeGreaterThan(0);
      expect(linkedIds.every((id) => validIds.has(id))).toBe(true);
    }
  });

  it("provides 25 to 35 glossary entries and resolves every generated glossary link", () => {
    const files = getLearningFiles("sensor");
    const anchors = markdownAnchors(files["GLOSSARY.md"]);
    const glossaryHeadings = [...files["GLOSSARY.md"].matchAll(/^## /gm)];

    expect(glossaryHeadings.length).toBeGreaterThanOrEqual(25);
    expect(glossaryHeadings.length).toBeLessThanOrEqual(35);

    for (const templateId of templateIds) {
      for (const content of Object.values(getLearningFiles(templateId))) {
        const linkedAnchors = [...content.matchAll(/GLOSSARY\.md#([a-z0-9-]+)/g)].map((match) => match[1]);
        expect(linkedAnchors.every((anchor) => anchors.has(anchor))).toBe(true);
      }
    }

    const annotated = addLearningLinks("The BOM records voltage, I2C, CAD, and validation choices.");
    const annotatedAnchors = [...annotated.matchAll(/GLOSSARY\.md#([a-z0-9-]+)/g)].map((match) => match[1]);
    expect(annotatedAnchors.every((anchor) => anchors.has(anchor))).toBe(true);
  });

  it("explains the sensor build in plain language before technical detail", () => {
    const start = getLearningFiles("sensor")["START_HERE.md"];
    const firstParagraph = start.split("\n\n")[1];

    expect(firstParagraph).toContain("controller");
    expect(firstParagraph).toContain("sensor");
    expect(firstParagraph).toContain("Code");
    expect(start).toContain("original Raspberry Pi Pico");
    expect(start).toContain("BME280");
    expect(start).toContain("built-in LED");
    expect(start).toContain("firmware/code.py");
  });

  it("rejects unsupported templates", () => {
    expect(() => getLearningFiles("unknown")).toThrow("Unknown learning template: unknown");
  });
});

describe("addLearningLinks", () => {
  it("appends matching terms in first-use order without rewriting the source", () => {
    const input = "# Plan\n\nCheck voltage before the BOM, then validate the firmware.";
    const output = addLearningLinks(input);

    expect(output.startsWith(input)).toBe(true);
    expect(output).toContain("## Terms used in this plan");
    expect(output.indexOf("#voltage")).toBeLessThan(output.indexOf("#bom"));
    expect(output.indexOf("#bom")).toBeLessThan(output.indexOf("#validation"));
    expect(output.indexOf("#validation")).toBeLessThan(output.indexOf("#firmware"));
  });

  it("preserves fenced code, inline code, existing links, and URLs exactly", () => {
    const fenced = "```python\nfirmware = 'I2C voltage'\n```";
    const inline = "`GPIO and polarity`";
    const existingLink = "[CAD voltage guide](https://example.com/validation?term=torque)";
    const url = "https://example.com/current/mesh";
    const input = `# Plan\n\n${fenced}\n\n${inline}\n\n${existingLink}\n\n${url}\n\nThe BOM lists a sensor.`;
    const output = addLearningLinks(input);

    expect(output.startsWith(input)).toBe(true);
    expect(output).toContain(fenced);
    expect(output).toContain(inline);
    expect(output).toContain(existingLink);
    expect(output).toContain(url);
    expect(output).toContain("[BOM](GLOSSARY.md#bom)");
    expect(output).toContain("[sensor](GLOSSARY.md#sensor)");
    expect(output).not.toContain("[firmware](GLOSSARY.md#firmware)");
    expect(output).not.toContain("[CAD](GLOSSARY.md#cad)");
    expect(output).not.toContain("[torque](GLOSSARY.md#torque)");
  });

  it("does not add a section when terms occur only in protected content", () => {
    const input = "Use `firmware` and [this I2C source](https://example.com/voltage).\n\n~~~\nGPIO current\n~~~";
    expect(addLearningLinks(input)).toBe(input);
  });

  it("does not duplicate an existing generated section", () => {
    const once = addLearningLinks("The firmware reads a sensor.");
    expect(addLearningLinks(once)).toBe(once);
  });
});
