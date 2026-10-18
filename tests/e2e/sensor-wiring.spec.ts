import { expect, test } from "@playwright/test";
import { CHECK_OPTIONS, FAULT_OPTIONS, WIRING_CASES } from "../../src/lib/sensor-wiring";

test("inspect all four wiring cases, get feedback and practice breadboard continuity", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", error => runtimeErrors.push(error.message));
  await page.goto("/build-guides/sensor");
  await page.getByRole("link", { name: "Practice wiring inspection", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Inspect the sensor wiring", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Inspect the sensor wiring", exact: true })).toBeVisible();
  const submit = page.getByRole("button", { name: "Check my inspection", exact: true });
  for (const wiring of WIRING_CASES) {
    await page.getByRole("combobox", { name: "Wiring case", exact: true }).selectOption(wiring.id);
    await expect(submit).toBeDisabled();
    const fault = FAULT_OPTIONS.find(option => option.id === wiring.expectedFault)!;
    const check = CHECK_OPTIONS.find(option => option.id === wiring.expectedCheckId)!;
    await page.getByRole("group", { name: "Your diagnosis", exact: true }).getByRole("radio", { name: fault.label, exact: true }).check();
    await page.getByRole("group", { name: "Unpowered check", exact: true }).getByRole("radio", { name: check.label, exact: true }).check();
    await submit.click();
    await expect(page.getByText(wiring.explanation, { exact: true })).toBeVisible();
    const broad = CHECK_OPTIONS.find(option => option.id === "trace-all")!;
    await page.getByRole("group", { name: "Unpowered check", exact: true }).getByRole("radio", { name: broad.label, exact: true }).check();
    await submit.click();
    await expect(page.getByRole("heading", { name: "Check: appropriate", exact: true })).toBeVisible();
  }
  const power = CHECK_OPTIONS.find(option => option.id === "power-and-see")!;
  await page.getByRole("group", { name: "Unpowered check", exact: true }).getByRole("radio", { name: power.label, exact: true }).check();
  await submit.click();
  await expect(page.getByRole("heading", { name: "Check: choose another", exact: true })).toBeVisible();
  const strip = page.getByRole("group", { name: "Which contact shares a strip with a10?", exact: true });
  await strip.getByRole("radio", { name: "f10", exact: true }).check();
  await page.getByRole("button", { name: "Check strip", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Not this contact" })).toBeVisible();
  await strip.getByRole("radio", { name: "e10", exact: true }).check();
  await page.getByRole("button", { name: "Check strip", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Correct." })).toBeVisible();
  await page.screenshot({ path: "test-results/sensor-wiring-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/sensor-wiring-mobile.png", fullPage: true });
  expect(runtimeErrors).toEqual([]);
  await page.goto("/learn?lesson=digital-interfaces");
  await expect(page.getByRole("link", { name: "Practice Pico sensor wiring", exact: true })).toBeVisible();
});
