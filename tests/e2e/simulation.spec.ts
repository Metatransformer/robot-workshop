import { expect, test } from "@playwright/test";

test("motor, power and fast GPIO models expose usable results without aliasing", async ({ page }) => {
  await page.goto("/labs?lab=dc-motor");
  await expect(page.getByText("Running point", { exact: true })).toBeVisible();
  await expect(page.getByText("Inconsistent ratings", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Run model", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download JSON", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: /Power budget/ }).click();
  await page.getByRole("button", { name: "Run model", exact: true }).click();
  await expect(page.getByRole("button", { name: "Download JSON", exact: true })).toBeEnabled();
  await page.getByRole("spinbutton", { name: /Nominal capacity/ }).fill("3");
  await expect(page.getByRole("button", { name: "Download JSON", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: /GPIO state model/ }).click();
  const program = { initialState: "ON", states: {
    ON: { led: true, transitions: [{ to: "OFF", afterMs: 1 }] },
    OFF: { led: false, transitions: [{ to: "ON", afterMs: 1 }] },
  } };
  await page.getByRole("textbox", { name: "State-machine program", exact: true }).fill(JSON.stringify(program));
  await page.getByRole("spinbutton", { name: /Simulation duration/ }).fill("2000");
  await page.getByRole("button", { name: "Run model", exact: true }).click();
  await expect(page.getByText("Trace graph not rendered: more than 1,000 digital edges.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Download JSON", exact: true })).toBeEnabled();
});

test("saved observations restore the exact run and changed inputs cannot export stale evidence", async ({ page }) => {
  await page.goto("/labs?lab=rc-transient");
  const download = page.getByRole("button", { name: "Download JSON", exact: true });
  await expect(download).toBeDisabled();
  await page.getByRole("spinbutton", { name: /Resistance/ }).fill("2200");
  await page.getByRole("button", { name: "Run model", exact: true }).click();
  await page.getByRole("textbox", { name: "Observations notebook", exact: true }).fill("Synthetic QA: the model approaches the supply voltage; no hardware measurement made.");
  await page.getByRole("button", { name: "Save notebook locally", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("spinbutton", { name: /Resistance/ })).toHaveValue("2200");
  await expect(page.getByRole("textbox", { name: "Observations notebook", exact: true })).toHaveValue(/Synthetic QA/);
  await expect(download).toBeEnabled();
  await page.getByRole("spinbutton", { name: /Resistance/ }).fill("3300");
  await expect(page.getByText("Inputs changed", { exact: true })).toBeVisible();
  await expect(download).toBeDisabled();
  await page.getByRole("button", { name: "Run model", exact: true }).click();
  await expect(page.getByText("Unbound notes", { exact: true })).toBeVisible();
  await expect(download).toBeDisabled();
  await page.getByRole("button", { name: "Associate these notes with this successful run", exact: true }).click();
  await expect(download).toBeEnabled();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/simulation-mobile.png", fullPage: true });
});
