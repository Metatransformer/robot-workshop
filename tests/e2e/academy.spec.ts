import { expect, test } from "@playwright/test";
import { extractText, getDocumentProxy } from "unpdf";

test("a selected sensor build packet retains literal firmware in its PDF", async ({ page }) => {
  const { createProject } = await import("../../src/server/store");
  const project = await createProject({ title: `Packet QA ${Date.now()}`, templateId: "sensor" });
  await page.goto(`/project-report?id=${project.id}`);
  await page.getByRole("checkbox", { name: "firmware/code.py", exact: true }).check();
  await page.getByRole("button", { name: "Preview build packet", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Bill of materials", exact: true })).toBeVisible();
  await expect(page.getByText("Text report:", { exact: true })).toBeVisible();
  await expect(page.locator("pre code.language-python")).toContainText("import board");
  const pdf = await page.pdf({ path: "test-results/sensor-build-packet.pdf", format: "A4", printBackground: true });
  const pdfDocument = await getDocumentProxy(new Uint8Array(pdf));
  const extracted = await extractText(pdfDocument, { mergePages: true });
  expect(extracted.text).toContain("import board");
  expect(extracted.text).toContain("BME280");
  expect(extracted.text).not.toContain(project.directory);
});

test("everyday objects lead to exact supplier references and a real project starter", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/explore-objects?object=thermostat");
  await expect(page.getByRole("heading", { name: "Candidate parts — incomplete list" })).toBeVisible();
  const supplier = page.getByRole("link", { name: /Adafruit BME280 breakout/ });
  await expect(supplier).toHaveAttribute("href", "https://www.adafruit.com/product/2652");
  await expect(supplier).toHaveAttribute("rel", "noopener noreferrer");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("link", { name: /Open the Pico \+ BME280 starter/ }).click();
  const dialog = page.getByRole("dialog", { name: "Start a local project" });
  await expect(dialog.getByRole("radio", { name: /Pico.*BME280/ })).toHaveAttribute("aria-checked", "true");
  expect(errors).toEqual([]);
});

// Evidence and exports are separate from source-project mutation.
test("learn, practise, record evidence, restore progress and follow glossary links", async ({ page }) => {
  await page.goto("/learn?lesson=units-estimation&project=sensor");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Mark as read", exact: true }).click();
  await expect(page.getByRole("button", { name: "Marked as read", exact: true })).toBeDisabled();
  await page.getByRole("radio", { name: "A 0.0006 A", exact: true }).check();
  await page.getByRole("button", { name: "Check my reasoning", exact: true }).click();
  await expect(page.getByText("Correct. Practice recorded.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Record bench demonstration", exact: true }).click();
  await expect(page.getByText(/^Describe what you expected and measured/)).toBeVisible();
  await page.getByLabel("Your module notes", { exact: true }).fill("Synthetic QA fixture, not a physical measurement: expected 5 V; example measurement 4.98 V under load.");
  await page.getByRole("button", { name: "Record bench demonstration", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Bench demonstration recorded", exact: true })).toBeDisabled();
  const exported = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress", exact: true }).click();
  const backup = await exported;
  expect(backup.suggestedFilename()).toBe("metatransformer-learning-progress.json");
  await page.evaluate(() => localStorage.removeItem("metatransformer.learning-progress.v1"));
  await page.reload();
  await expect(page.getByRole("button", { name: "Mark as read", exact: true })).toBeEnabled();
  await page.getByLabel("Choose a progress JSON file to restore").setInputFiles((await backup.path())!);
  await expect(page.getByRole("button", { name: "Bench demonstration recorded", exact: true })).toBeDisabled();
  await page.goto("/learn?term=torque");
  await expect(page.getByRole("heading", { name: "Torque", exact: true })).toBeVisible();
  const search = page.getByPlaceholder("Try voltage, backlash, or error");
  await search.fill("voltage");
  await expect(page.getByRole("heading", { name: "Voltage", exact: true })).toBeVisible();
  await expect(page.getByText("Term not found", {exact:true})).toHaveCount(0);
  await page.screenshot({ path: "test-results/academy-glossary.png", fullPage: true });
});

test("focused lesson stays readable on mobile and prints a real PDF", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/learn?lesson=voltage-current-resistance");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/academy-mobile.png", fullPage: true });
  await page.goto("/learn/print?lesson=voltage-current-resistance");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const pdf = await page.pdf({ path: "test-results/voltage-lesson.pdf", format: "A4", printBackground: true });
  const pdfDocument = await getDocumentProxy(new Uint8Array(pdf));
  const extracted = await extractText(pdfDocument, { mergePages: true });
  expect(extracted.text).toMatch(/resistor/i);
  expect(extracted.text).toMatch(/answer/i);
  expect(extracted.totalPages).toBeGreaterThan(0);
});

test("blocked browser storage leaves learning usable and reports unsaved progress", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Storage blocked", "SecurityError"); } }));
  await page.goto("/learn?lesson=units-estimation");
  await expect(page.getByText(/Browser storage is unavailable/)).toBeVisible();
  await page.getByRole("button", { name: "Mark as read", exact: true }).click();
  await expect(page.getByText(/not saved beyond this tab/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Marked as read", exact: true })).toBeDisabled();
});
