import { webkit, devices } from "@playwright/test";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const htmlPath = process.env.BEYOND90_HTML || "dist/client/Beyond90.html";
const target = pathToFileURL(resolve(htmlPath)).href;
const errors = [];
const browser = await webkit.launch();
const context = await browser.newContext({ ...devices["iPhone 14"] });
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
});

async function assertNoFatal(label) {
  const body = await page.locator("body").innerText();
  if (/Esta pantalla no ha cargado|Cargando tu carrera|Esa acción no se pudo aplicar/i.test(body)) {
    throw new Error(`${label}: fatal/loading state visible: ${body.slice(0, 500)}`);
  }
  if (errors.length) throw new Error(`${label}: browser errors: ${errors.join(" | ")}`);
}

async function waitRoute(name) {
  await page.waitForURL(new RegExp(`#/${name}$`), { timeout: 10_000 });
}

try {
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.getByRole("button", { name: "Nueva carrera" }).waitFor({ state: "visible", timeout: 10_000 });
  await assertNoFatal("portable cold start");

  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await waitRoute("onboarding");
  await page.getByLabel("Nombre y apellidos").fill("Daniel Portable QA");
  await page.getByLabel("Ciudad").fill("Madrid");
  await page.getByRole("button", { name: /^Ambicioso/ }).click();
  await page.getByRole("button", { name: /^Profesional/ }).click();
  await page.getByRole("button", { name: "Elegir cantera" }).click();
  await waitRoute("cantera");

  const clubButtons = page.locator("ul button");
  const clubCount = await clubButtons.count();
  if (clubCount !== 4) throw new Error(`portable club selection: expected 4 offers, got ${clubCount}`);
  await clubButtons.first().click();
  await page.getByRole("button", { name: "Firmar en la cantera" }).click();
  await waitRoute("historia");
  await assertNoFatal("portable first story render");

  const firstAction = page.locator("article button").first();
  await firstAction.waitFor({ state: "visible", timeout: 10_000 });
  const before = await page.locator("article").innerText();
  await firstAction.click();
  await page.waitForTimeout(250);
  const after = await page.locator("article").innerText();
  if (after === before) throw new Error("portable first playable decision did not change the scene");
  await assertNoFatal("portable first decision");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(250);
  if (!/#\/historia$/.test(page.url())) throw new Error(`portable reload lost route: ${page.url()}`);
  await page.locator("article").waitFor({ state: "visible", timeout: 10_000 });
  const saved = await page.evaluate(() => Boolean(localStorage.getItem("beyond90:save:v1")));
  if (!saved) throw new Error("portable reload lost persisted save");
  await assertNoFatal("portable persistence");

  console.log(`PORTABLE_WEBKIT_OK file=${htmlPath} offers=${clubCount} route=${page.url()}`);
} finally {
  await browser.close();
}
