import { expect, test } from "@playwright/test";
import { HYSTERESIS_SCENARIOS } from "../../src/lib/sensor-hysteresis";

test("predict and inspect memory, chatter and recovery commands", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/build-guides/sensor-led");
  await page.getByRole("link", { name: "Explore temperature hysteresis", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Why the LED remembers", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Edit HIGH_C and LOW_C near the top of code.py/)).toBeVisible();
  const check = page.getByRole("button", { name: "Check prediction", exact: true });
  const choice = page.getByRole("group", { name: "Predict the LED command", exact: true });
  for (const scenario of HYSTERESIS_SCENARIOS) {
    await page.getByRole("combobox", { name: "Temperature sequence", exact: true }).selectOption(scenario.id);
    await expect(check).toBeDisabled();
    await expect(page.getByRole("table")).toHaveCount(0);
    await choice.getByRole("radio", { name: scenario.expectedCommand ? "OFF" : "ON", exact: true }).check();
    await check.click();
    await expect(page.getByText(scenario.explanation, { exact: true })).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Not quite");
    await choice.getByRole("radio", { name: scenario.expectedCommand ? "ON" : "OFF", exact: true }).check();
    await expect(page.getByRole("table")).toHaveCount(0);
    await check.click();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Correct");
    const predictedRow = page.getByRole("row").filter({ has: page.getByRole("button", { name: `Inspect step ${scenario.predictionIndex + 1}`, exact: true }) });
    await expect(predictedRow.getByRole("cell").nth(3)).toHaveText(scenario.expectedCommand ? "ON" : "OFF");
    if (scenario.id === "memory" || scenario.id === "chatter") await expect(predictedRow.getByRole("cell").nth(4)).toHaveText("OFF");
    await expect(page.getByRole("button", { name: "Previous step", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: `Inspect step ${scenario.events.length}`, exact: true }).click();
    await expect(page.getByRole("button", { name: "Next step", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Previous step", exact: true }).click();
    await expect(page.getByRole("button", { name: "Next step", exact: true })).toBeEnabled();
  }
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "test-results/hysteresis-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/hysteresis-mobile.png", fullPage: true });
  await page.getByRole("heading", { name: "Command explorer", exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/hysteresis-mobile-explorer.png" });
  await page.goto("/learn?lesson=programming-state");
  await expect(page.getByRole("link", { name: "Explore temperature hysteresis", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
