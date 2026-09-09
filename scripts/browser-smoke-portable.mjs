import { webkit, devices } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const htmlPath = process.env.BEYOND90_HTML || "dist/client/Beyond90.html";
const absoluteHtmlPath = resolve(htmlPath);
const fileTarget = pathToFileURL(absoluteHtmlPath).href;

async function createHostedTarget() {
  const html = await readFile(absoluteHtmlPath);
  const server = createServer((req, res) => {
    if (req.url !== "/" && req.url !== "/Beyond90.html") {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    });
    res.end(html);
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("portable hosted smoke failed to bind local HTTP server");
  return {
    target: `http://127.0.0.1:${address.port}/Beyond90.html`,
    close: () => new Promise((resolveClose, reject) => server.close((error) => error ? reject(error) : resolveClose())),
  };
}

async function runFlow(browser, target, label) {
  const context = await browser.newContext({ ...devices["iPhone 14"] });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });

  async function assertNoFatal(step) {
    const body = await page.locator("body").innerText();
    if (/Esta pantalla no ha cargado|Cargando tu carrera|Esa acción no se pudo aplicar|BEYOND 90 no pudo arrancar/i.test(body)) {
      throw new Error(`${label} ${step}: fatal/loading state visible: ${body.slice(0, 700)}`);
    }
    if (!body.trim()) throw new Error(`${label} ${step}: body is blank`);
    if (errors.length) throw new Error(`${label} ${step}: browser errors: ${errors.join(" | ")}`);
  }

  async function waitRoute(name) {
    await page.waitForURL(new RegExp(`#/${name}$`), { timeout: 10_000 });
  }

  try {
    await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.getByRole("button", { name: "Nueva carrera" }).waitFor({ state: "visible", timeout: 10_000 });
    await assertNoFatal("cold start");

    await page.getByRole("button", { name: "Nueva carrera" }).click();
    await waitRoute("onboarding");
    await page.getByLabel("Nombre y apellidos").fill(`Daniel ${label} QA`);
    await page.getByLabel("Ciudad").fill("Madrid");
    await page.getByRole("button", { name: /^Ambicioso/ }).click();
    await page.getByRole("button", { name: /^Profesional/ }).click();
    await page.getByRole("button", { name: "Elegir cantera" }).click();
    await waitRoute("cantera");

    const clubButtons = page.locator("ul button");
    const clubCount = await clubButtons.count();
    if (clubCount !== 4) throw new Error(`${label} club selection: expected 4 offers, got ${clubCount}`);
    await clubButtons.first().click();
    await page.getByRole("button", { name: "Firmar en la cantera" }).click();
    await waitRoute("historia");
    await assertNoFatal("first story render");

    const firstAction = page.locator("article button").first();
    await firstAction.waitFor({ state: "visible", timeout: 10_000 });
    const before = await page.locator("article").innerText();
    await firstAction.click();
    await page.waitForTimeout(250);
    const after = await page.locator("article").innerText();
    if (after === before) throw new Error(`${label} first playable decision did not change the scene`);
    await assertNoFatal("first decision");

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    if (!/#\/historia$/.test(page.url())) throw new Error(`${label} reload lost route: ${page.url()}`);
    await page.locator("article").waitFor({ state: "visible", timeout: 10_000 });
    const saved = await page.evaluate(() => Boolean(localStorage.getItem("beyond90:save:v1")));
    if (!saved) throw new Error(`${label} reload lost persisted save`);
    await assertNoFatal("persistence");

    console.log(`PORTABLE_WEBKIT_${label.toUpperCase()}_OK offers=${clubCount} route=${page.url()}`);
  } finally {
    await context.close();
  }
}

const browser = await webkit.launch();
const hosted = await createHostedTarget();
try {
  await runFlow(browser, fileTarget, "file");
  await runFlow(browser, hosted.target, "http");
  console.log(`PORTABLE_WEBKIT_OK file=${htmlPath} modes=file,http`);
} finally {
  await hosted.close();
  await browser.close();
}
