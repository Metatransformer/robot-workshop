import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

const capture = "timestamp,temp_c,humidity_pct,pressure_hpa,led\n0,26,45,1000,0\n1,29,46,1001,1\n# sensor disconnected\n0,25,44,999,0\n";

test("sensor capture keeps segment evidence, stale state and synthetic origin distinct", async ({ page }) => {
  await page.goto("/build-guides/sensor");
  await page.getByRole("link", { name: "Inspect sensor readings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Inspect your sensor readings" })).toBeVisible();
  await page.getByRole("textbox", { name: "Serial CSV", exact: true }).fill(capture);
  await page.getByRole("button", { name: "Analyze readings", exact: true }).click();
  await expect(page.getByRole("table", { name: "Recorded samples" })).toBeVisible();
  await page.getByRole("textbox", { name: "Bench observations", exact: true }).fill("Near the USB board; no reference thermometer comparison.");
  const downloadReport = async () => {
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download observation report", exact: true }).click();
    const download = await pending;
    return JSON.parse(await readFile((await download.path())!, "utf8"));
  };
  const first = await downloadReport();
  expect(first.samples.map((sample: {sourceLine:number}) => sample.sourceLine)).toEqual([2,3]);
  expect(first.summary.temperatureC.mean).toBe(27.5);
  await expect(page.getByRole("button", {name:"Analyze readings",exact:true})).toBeDisabled();
  expect(JSON.stringify(first)).toContain("Near the USB board");
  expect(JSON.stringify(first)).toContain("user-supplied-unverified");
  await expect(page.getByRole("combobox", {name:"Recording segment",exact:true}).locator("option")).toHaveCount(2);
  const options = await page.getByRole("combobox", { name: "Recording segment", exact: true }).locator("option").evaluateAll(elements => elements.map(element => (element as HTMLOptionElement).value));
  expect(options).toHaveLength(2);
  await page.getByRole("combobox", { name: "Recording segment", exact: true }).selectOption(options[1]);
  await expect(page.getByRole("textbox", { name: "Bench observations", exact: true })).toHaveValue("");
  await page.getByRole("textbox", { name: "Bench observations", exact: true }).fill("After disconnect; placement unchanged.");
  const second = await downloadReport();
  expect(JSON.stringify(second)).toContain("After disconnect");
  expect(JSON.stringify(second)).not.toContain("Near the USB board");
  expect(JSON.stringify(second)).toContain("sensor disconnected");
  expect(second.samples).toHaveLength(1);
  expect(second.samples[0].sourceLine).toBe(5);
  await page.getByRole("combobox", {name:"Recording segment",exact:true}).selectOption(options[0]);
  await expect(page.getByRole("textbox", { name: "Bench observations", exact:true})).toHaveValue("Near the USB board; no reference thermometer comparison.");
  await page.getByRole("textbox", { name: "Serial CSV", exact: true }).fill(capture + "1,26,44,999,0\n");
  await expect(page.getByRole("button", { name: "Download observation report", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Analyze readings", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Bench observations", exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Load synthetic example", exact: true }).click();
  await page.getByRole("button", { name: "Analyze readings", exact: true }).click();
  const synthetic = await downloadReport();
  expect(JSON.stringify(synthetic)).toContain("synthetic");
  await page.getByLabel("Import serial CSV", { exact: true }).setInputFiles({name:"bench-capture.csv",mimeType:"text/csv",buffer:Buffer.from(capture)});
  await expect(page.getByRole("button", {name:"Download observation report",exact:true})).toBeEnabled();
  const uploaded = await downloadReport();
  expect(JSON.stringify(uploaded)).toContain("bench-capture.csv");
  expect(JSON.stringify(uploaded)).toContain("user-supplied-unverified");
  await page.screenshot({path:"test-results/sensor-observations-desktop.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:"test-results/sensor-observations-mobile.png",fullPage:true});
  await page.getByRole("textbox", { name: "Serial CSV", exact: true }).fill("timestamp_s,temp_c,humidity_pct,pressure_hpa,led,sensor_address,observation\n");
  await page.getByRole("button", { name: "Analyze readings", exact: true }).click();
  await expect(page.getByRole("table", { name: "Recorded samples" })).toHaveCount(0);
});


test("late file reads cannot replace a newer pasted analysis", async ({page}) => {
  await page.goto("/bench/sensor");
  await page.evaluate(() => {
    const original = File.prototype.text;
    File.prototype.text = function() {
      return new Promise<string>((resolve, reject) => {
        (window as unknown as {finishSensorRead: () => Promise<void>}).finishSensorRead = async () => {
          try { resolve(await original.call(this)); } catch(error) { reject(error); }
        };
      });
    };
  });
  await page.getByLabel("Import serial CSV",{exact:true}).setInputFiles({name:"slow.csv",mimeType:"text/csv",buffer:Buffer.from(capture)});
  const newer = "timestamp,temp_c,humidity_pct,pressure_hpa,led\n10,22,40,1000,0";
  await page.getByRole("textbox", { name: "Serial CSV", exact:true}).fill(newer);
  await page.getByRole("button",{name:"Analyze readings",exact:true}).click();
  await page.getByRole("textbox", { name: "Bench observations", exact:true}).fill("Newer analysis must survive.");
  await page.evaluate(async () => { await (window as unknown as {finishSensorRead: () => Promise<void>}).finishSensorRead(); });
  await expect(page.getByRole("textbox", { name: "Serial CSV", exact:true})).toHaveValue(newer);
  await expect(page.getByRole("textbox", { name: "Bench observations", exact:true})).toHaveValue("Newer analysis must survive.");
});
