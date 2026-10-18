import { describe, expect, it } from "vitest";
import { sensorBuildGuide, sensorBuildGuideMarkdown } from "../src/lib/sensor-build-guide";
import { getTemplateFiles } from "../src/lib/seeds";

describe("sensor procurement and assembly guide", () => {
  it("assembles every report section and primary source into the portable Markdown", () => {
    expect(sensorBuildGuideMarkdown).toContain(`# ${sensorBuildGuide.title}`);
    for (const section of sensorBuildGuide.sections) {
      expect(sensorBuildGuideMarkdown).toContain(`## ${section.title}`);
      expect(sensorBuildGuideMarkdown).toContain(section.markdown);
    }
    for (const source of sensorBuildGuide.sources) {
      expect(sensorBuildGuideMarkdown).toContain(`[${source.title}](${source.url})`);
    }
  });

  it("adds the identical portable guide only to new sensor projects", () => {
    expect(getTemplateFiles("sensor")["BUY_AND_BUILD.md"]).toBe(sensorBuildGuideMarkdown);
    for (const templateId of ["linkage", "desk-robot", "cyberdeck", "blank"]) {
      expect(getTemplateFiles(templateId)).not.toHaveProperty("BUY_AND_BUILD.md");
    }
  });

  it("distinguishes package counts from used quantities and preserves the exact route", () => {
    expect(sensorBuildGuideMarkdown).toContain("40-wire, 150 mm male/male jumper ribbon");
    expect(sensorBuildGuideMarkdown).toContain("1 pack | 4 individual wires");
    expect(sensorBuildGuideMarkdown).toContain("GP0 physical pin 1 to SDI/SDA");
    expect(sensorBuildGuideMarkdown).toContain("GP1 physical pin 2 to SCK/SCL");
    expect(sensorBuildGuideMarkdown).toContain("3V3(OUT) physical pin 36 to VIN");
    expect(sensorBuildGuideMarkdown).toContain("GND physical pin 38 to GND");
    expect(sensorBuildGuideMarkdown).toContain("Do not connect VBUS physical pin 40");
    expect(sensorBuildGuideMarkdown).toContain("researched assembly plan");
    expect(sensorBuildGuideMarkdown).toContain("not a completed build or electrical qualification");
  });
});
