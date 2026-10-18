import { expect, test } from "@playwright/test";
import { SERVO_SCENARIOS } from "../../src/lib/servo-command";

test("predicts each servo scenario and exposes bounded pulse commands on desktop and mobile", async ({ page }) => {
  await page.goto("/build-guides/servo");
  await page.getByRole("link", { name: "Explore button and pulse commands", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Understand the servo command", exact: true })).toBeVisible();
  const scenarioSelect = page.getByRole("combobox", { name: "Scenario", exact: true });
  const reveal = page.getByRole("button", { name: "Reveal command trace", exact: true });
  for (const scenario of SERVO_SCENARIOS) {
    await scenarioSelect.selectOption(scenario.id);
    await expect(reveal).toBeDisabled();
    await page.getByRole("radio", { name: scenario.options[scenario.correctOption], exact: true }).check();
    await reveal.click();
    await expect(page.getByRole("slider", { name: "Trace time", exact: true })).toBeVisible();
    await expect(page.getByText(scenario.feedback, { exact: true })).toBeVisible();
    const events = page.getByRole("table", { name: "Key command events", exact: true });
    expect(await events.getByRole("row").count()).toBeLessThan(20);
    if (scenario.id === "repress") await expect(events.getByRole("row").filter({ hasText: "1.02 s" })).toContainText("released");
  }
  await scenarioSelect.selectOption("normal");
  const normal = SERVO_SCENARIOS.find(s => s.id === "normal")!;
  await page.getByRole("radio", { name: normal.options[(normal.correctOption + 1) % normal.options.length], exact: true }).check();
  await reveal.click();
  await expect(page.getByText(normal.feedback, { exact: true })).toBeVisible();
  const time = page.getByRole("slider", { name: "Trace time", exact: true });
  await time.fill("5");
  await expect(page.getByRole("table", { name: "Exact selected sample values" })).toContainText("1,500 µs");
  await expect(page.getByRole("table", { name: "Exact selected sample values" })).toContainText("7.50%");
  await page.screenshot({ path: "test-results/servo-command-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/servo-command-mobile.png", fullPage: true });
  await time.fill("0");
  await expect(page.getByRole("button", { name: "Previous step", exact: true })).toBeDisabled();
  await time.fill(await time.getAttribute("max") ?? "150");
  await expect(page.getByRole("button", { name: "Next step", exact: true })).toBeDisabled();
  await page.goto("/learn?lesson=timers-pwm");
  await expect(page.getByRole("link", { name: "Explore the FS90 servo command", exact: true })).toBeVisible();
});
