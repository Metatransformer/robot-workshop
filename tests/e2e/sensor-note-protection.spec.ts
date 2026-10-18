import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const capture = "timestamp,temp_c,humidity_pct,pressure_hpa,led\n0,26,45,1000,0\n# interruption\n0,25,44,999,0\n";
const notes = (page: Page) => page.getByRole("textbox", { name: "Bench observations", exact: true });
async function begin(page: Page) {
  await page.goto("/bench/sensor");
  await page.getByRole("textbox", { name: "Serial CSV", exact: true }).fill(capture);
  await page.getByRole("button", { name: "Analyze readings", exact: true }).click();
}
async function unloadIsGuarded(page: Page) {
  return page.evaluate(() => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  });
}
async function report(page: Page) {
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download observation report", exact: true }).click();
  return downloaded;
}

test("only report exports clear each segment's edited notes; re-edit and deletion become dirty", async ({ page }) => {
  await begin(page);
  expect(await unloadIsGuarded(page)).toBe(false);
  await notes(page).fill("First segment notes.");
  expect(await unloadIsGuarded(page)).toBe(true);
  await page.getByRole("combobox", { name: "Recording segment", exact: true }).selectOption("1");
  await notes(page).fill("Second segment notes.");
  await report(page);
  expect(await unloadIsGuarded(page)).toBe(true);
  await page.getByRole("combobox", { name: "Recording segment", exact: true }).selectOption("0");
  const csv = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download readings CSV", exact: true }).click();
  await csv;
  expect(await unloadIsGuarded(page)).toBe(true);
  await report(page);
  expect(await unloadIsGuarded(page)).toBe(false);
  await notes(page).fill("");
  expect(await unloadIsGuarded(page)).toBe(true);
  await notes(page).fill("First segment notes.");
  expect(await unloadIsGuarded(page)).toBe(false);
  await notes(page).fill("Changed again.");
  expect(await unloadIsGuarded(page)).toBe(true);
  await page.screenshot({ path: "test-results/sensor-notes-protected.png", fullPage: true });
});

test("canceling workshop link navigation and CSV replacement keeps edited notes", async ({ page }) => {
  await begin(page);
  await notes(page).fill("Do not discard me.");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("link", { name: "Sensor build guide", exact: true }).click();
  await expect(page).toHaveURL(/\/bench\/sensor$/);
  await expect(notes(page)).toHaveValue("Do not discard me.");
  await page.getByRole("textbox", { name: "Serial CSV", exact: true }).fill(capture + "1,24,45,1000,0\n");
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "Analyze readings", exact: true }).click();
  await expect(notes(page)).toHaveValue("Do not discard me.");
  expect(await unloadIsGuarded(page)).toBe(true);
  const recoveryDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export previous analysis and notes", exact: true }).click();
  const recovered = JSON.parse(await readFile((await (await recoveryDownload).path())!, "utf8"));
  expect(recovered.notes).toBe("Do not discard me.");
  expect(recovered.samples).toHaveLength(1);
  expect(recovered.samples[0].tempC).toBe(26);
  expect(await unloadIsGuarded(page)).toBe(false);
  await page.getByRole("button", { name: "Analyze readings", exact: true }).click();
  await expect(notes(page)).toHaveValue("");
  expect(await unloadIsGuarded(page)).toBe(false);
});

test("invalid CSV and notes edited during pending import cannot be silently discarded", async ({ page }) => {
  await begin(page);
  await notes(page).fill("Existing work.");
  await page.getByLabel("Import serial CSV", { exact: true }).setInputFiles({ name: "invalid.csv", mimeType: "text/csv", buffer: Buffer.from("wrong header") });
  await expect(page.getByRole("alert").filter({ hasText: "Import not analyzed" })).toBeVisible();
  await expect(notes(page)).toHaveValue("Existing work.");
  await report(page);
  await page.evaluate(() => {
    const original = File.prototype.text;
    File.prototype.text = function() {
      return new Promise<string>((resolve, reject) => {
        (window as unknown as { finishCsvRead: () => Promise<void> }).finishCsvRead = async () => {
          try { resolve(await original.call(this)); } catch (error) { reject(error); }
        };
      });
    };
  });
  await page.getByLabel("Import serial CSV", { exact: true }).setInputFiles({ name: "slow.csv", mimeType: "text/csv", buffer: Buffer.from(capture) });
  await notes(page).fill("Typed while file was loading.");
  page.once("dialog", dialog => dialog.dismiss());
  await page.evaluate(async () => { await (window as unknown as { finishCsvRead: () => Promise<void> }).finishCsvRead(); });
  await expect(notes(page)).toHaveValue("Typed while file was loading.");
  expect(await unloadIsGuarded(page)).toBe(true);
});

test("reload can be canceled and failed report handoff leaves notes protected", async ({ page }) => {
  await begin(page);
  await notes(page).fill("Keep through reload.");
  const dialog = page.waitForEvent("dialog");
  const reload = page.reload({ timeout: 3000 }).catch(() => null);
  const warning = await dialog;
  expect(warning.type()).toBe("beforeunload");
  await warning.dismiss();
  await reload;
  await expect(notes(page)).toHaveValue("Keep through reload.");
  await page.evaluate(() => { URL.createObjectURL = () => { throw new Error("Test download unavailable"); }; });
  await page.getByRole("button", { name: "Download observation report", exact: true }).click();
  expect(await unloadIsGuarded(page)).toBe(true);
  await expect(notes(page)).toHaveValue("Keep through reload.");
  await expect(page.getByRole("alert").filter({ hasText: "download could not be started" })).toBeVisible();
});
