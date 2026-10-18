import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function downloadReport(page: Page) {
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download observation report", exact: true }).click();
  const file = await pending;
  return JSON.parse(await readFile((await file.path())!, "utf8"));
}

async function exportExample(page: Page) {
  await page.goto("/bench/sensor");
  await page.getByRole("button", { name: "Load synthetic example", exact: true }).click();
  await page.getByRole("button", { name: "Analyze readings", exact: true }).click();
  await page.getByRole("combobox", { name: "Recording segment", exact: true }).selectOption("2");
  await page.getByRole("textbox", { name: "Bench observations", exact: true }).fill("Generated example only; no real sensor connected.");
  return downloadReport(page);
}

const upload = (page: Page, report: unknown) => page.getByLabel("Restore observation report", { exact: true }).setInputFiles({ name: "saved-observation.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(report)) });

test("saved selected segment restores after reload with notes, provenance and source lines", async ({ page }) => {
  const original = await exportExample(page);
  expect(original.selectedSegment.index).toBe(3);
  await page.reload();
  await upload(page, original);
  const preview = page.getByRole("region", { name: "Review observation report" });
  await expect(preview).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Bench observations", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Restore and replace notebook", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Bench observations", exact: true })).toHaveValue(original.notes);
  await expect(page.getByRole("textbox", { name: "Serial CSV", exact: true })).toHaveValue("");
  await expect(page.getByRole("button", { name: "Analyze readings", exact: true })).toBeDisabled();
  const restored = await downloadReport(page);
  expect({ ...restored, reportCreatedAt: "ignored" }).toEqual({ ...original, reportCreatedAt: "ignored" });
  await page.getByRole("textbox", { name: "Bench observations", exact: true }).fill("Restored note remains editable.");
  expect((await downloadReport(page)).notes).toBe("Restored note remains editable.");
  await page.screenshot({ path: "test-results/sensor-restored-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/sensor-restored-mobile.png", fullPage: true });
});

test("cancel and malformed reports preserve notebook; delayed report cannot replace newer source", async ({ page }) => {
  const original = await exportExample(page);
  await upload(page, original);
  await page.getByRole("button", { name: "Cancel restoration", exact: true }).click();
  expect((await downloadReport(page)).notes).toBe(original.notes);
  await upload(page, { ...original, version: 999 });
  await expect(page.getByRole("alert").filter({ hasText: "Report not restored" })).toBeVisible();
  expect((await downloadReport(page)).samples).toEqual(original.samples);
  await page.evaluate(() => {
    const originalText = File.prototype.text;
    File.prototype.text = function() {
      return new Promise<string>((resolve, reject) => {
        (window as unknown as { finishReportRead: () => Promise<void> }).finishReportRead = async () => {
          try { resolve(await originalText.call(this)); } catch (error) { reject(error); }
        };
      });
    };
  });
  await upload(page, original);
  await page.getByRole("textbox", { name: "Serial CSV", exact: true }).fill("timestamp,temp_c,humidity_pct,pressure_hpa,led\n0,20,40,1000,0");
  await page.getByRole("button", { name: "Analyze readings", exact: true }).click();
  await page.getByRole("textbox", { name: "Bench observations", exact: true }).fill("Keep this new capture.");
  await page.evaluate(async () => { await (window as unknown as { finishReportRead: () => Promise<void> }).finishReportRead(); });
  await expect(page.getByRole("region", { name: "Review observation report" })).toHaveCount(0);
  expect((await downloadReport(page)).notes).toBe("Keep this new capture.");
});

test("cancel during report read invalidates its later completion", async ({ page }) => {
  const report = await exportExample(page);
  await page.evaluate(() => {
    const originalText = File.prototype.text;
    File.prototype.text = function() {
      return new Promise<string>((resolve, reject) => {
        (window as unknown as { finishReportRead: () => Promise<void> }).finishReportRead = async () => {
          try { resolve(await originalText.call(this)); } catch (error) { reject(error); }
        };
      });
    };
  });
  await upload(page, report);
  await page.getByRole("button", { name: "Cancel restoration", exact: true }).click();
  await page.evaluate(async () => { await (window as unknown as { finishReportRead: () => Promise<void> }).finishReportRead(); });
  await expect(page.getByRole("region", { name: "Review observation report" })).toHaveCount(0);
  expect((await downloadReport(page)).notes).toBe(report.notes);
});
