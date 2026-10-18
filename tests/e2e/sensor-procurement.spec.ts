import { expect, test } from "@playwright/test";
import { extractText, getDocumentProxy } from "unpdf";

test("sensor purchasing guide is discoverable, printable and travels with a new project", async ({ page }) => {
  await page.goto("/explore-objects?object=thermostat");
  await page.getByRole("link", { name: /Sensor shopping and assembly guide/ }).click();
  await expect(page).toHaveURL(/\/build-guides\/sensor$/);
  await expect(page.getByRole("heading", {level:1})).toBeVisible();
  await expect(page.locator('a[href="https://www.adafruit.com/product/758"]').first()).toBeVisible();
  await page.screenshot({path:"test-results/sensor-shopping-desktop.png",fullPage:true});
  const pdf = await page.pdf({ path: "test-results/sensor-shopping-guide.pdf", format: "A4", printBackground: true });
  const document = await getDocumentProxy(new Uint8Array(pdf));
  const { text } = await extractText(document, {mergePages:true});
  expect(text).toMatch(/solder/i);
  expect(text).toContain("Micro-B");
  expect(text).toContain("GP0");
  expect(text).toContain("Required companion files");
  expect(text).toContain("workshop import");
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => window.document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:"test-results/sensor-shopping-mobile.png",fullPage:true});
  await page.getByRole("link", { name: "Open the Pico + BME280 starter", exact:true }).click();
  const dialog = page.getByRole("dialog", {name:"Start a local project"});
  await dialog.getByRole("textbox", {name:"Project title",exact:true}).fill("Procurement QA sensor");
  await dialog.getByRole("button", {name:"Create project",exact:true}).click();
  await expect(page.getByRole("link", {name:"Buy & assemble this sensor",exact:true})).toBeVisible();
  await page.getByRole("button", {name:"Files",exact:true}).click();
  await expect(page.getByRole("button", {name:/^BUY_AND_BUILD.md document/})).toBeVisible();
});
