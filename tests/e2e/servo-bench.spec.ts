import { expect, test } from "@playwright/test";
import { extractText, getDocumentProxy } from "unpdf";

test("FS90 bench starter has a printable guide, source files and a linked learning path", async ({ page }) => {
  let firstBootstrap = true;
  await page.route("**/api/workshop?action=bootstrap", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    if (firstBootstrap) {
      data.data.library = data.data.library.filter((item: { id: string }) => item.id !== "feetech-fs90");
      firstBootstrap = false;
    }
    await route.fulfill({ response, json: data });
  });
  await page.goto("/build-guides/servo");
  await expect(page.getByRole("heading", {level:1})).toContainText(/FS90/);
  await expect(page.locator('a[href="https://www.pololu.com/product/2818"]').first()).toBeVisible();
  const pdf = await page.pdf({path:"test-results/fs90-bench-guide.pdf",format:"A4",printBackground:true});
  const document = await getDocumentProxy(new Uint8Array(pdf));
  const {text} = await extractText(document,{mergePages:true});
  expect(text).toContain("1450");
  expect(text).toContain("1550");
  expect(text).toContain("servo_control.py");
  expect(text).toMatch(/not.*(physically|physical)|unbuilt/i);
  await page.screenshot({path:"test-results/fs90-guide-desktop.png",fullPage:true});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(() => window.document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({path:"test-results/fs90-guide-mobile.png",fullPage:true});
  await page.getByRole("link",{name:"Open the FS90 bench starter",exact:true}).click();
  const dialog = page.getByRole("dialog",{name:"Start a local project"});
  await dialog.getByRole("textbox",{name:"Project title",exact:true}).fill("FS90 bench QA");
  await dialog.getByRole("button",{name:"Create project",exact:true}).click();
  await expect(page.getByRole("link",{name:"Build the FS90 bench",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Files",exact:true}).click();
  await expect(page.getByRole("button",{name:/^firmware\/servo_control.py/})).toBeVisible();
  await expect(page.getByRole("button",{name:/^firmware\/code.py/})).toBeVisible();
  await expect(page.getByRole("button",{name:/^BUY_AND_BUILD.md/})).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Parts & tools" }).click();
  await page.getByRole("textbox", { name: "Search catalog" }).fill("FS90");
  await expect(page.getByRole("button", { name: /^View .*FS90/ })).toBeVisible();
  await page.goto("/learn?project=servo-bench");
  await expect(page.getByText("Command a servo deliberately",{exact:true})).toBeVisible();
});
