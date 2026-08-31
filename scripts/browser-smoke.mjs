import { webkit, devices } from "@playwright/test";

const baseURL = process.env.BEYOND90_URL || "http://127.0.0.1:4173";
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

try {
  await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.getByRole("button", { name: "Nueva carrera" }).waitFor({ state: "visible", timeout: 10_000 });
  await assertNoFatal("cold start");

  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.waitForURL(/\/onboarding$/, { timeout: 10_000 });
  await page.getByLabel("Nombre y apellidos").fill("Daniel QA");
  await page.getByLabel("Ciudad").fill("Madrid");
  await page.getByRole("button", { name: /^Ambicioso/ }).click();
  await page.getByRole("button", { name: /^Profesional/ }).click();
  await page.getByRole("button", { name: "Elegir cantera" }).click();
  await page.waitForURL(/\/cantera$/, { timeout: 10_000 });
  await page.getByRole("heading", { name: "Cuatro canteras te quieren" }).waitFor({ state: "visible" });
  const clubButtons = page.locator("ul button");
  const clubCount = await clubButtons.count();
  if (clubCount !== 4) throw new Error(`club selection: expected 4 offers, got ${clubCount}`);
  await clubButtons.first().click();
  await page.getByRole("button", { name: "Firmar en la cantera" }).click();
  await page.waitForURL(/\/historia$/, { timeout: 10_000 });
  await assertNoFatal("first story render");

  const firstAction = page.locator("article button").first();
  await firstAction.waitFor({ state: "visible", timeout: 10_000 });
  const before = await page.locator("article").innerText();
  await firstAction.click();
  await page.waitForTimeout(250);
  const after = await page.locator("article").innerText();
  if (after === before) throw new Error("first playable decision did not change the scene");
  await assertNoFatal("first playable decision");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(200);
  if (!/\/historia$/.test(page.url())) throw new Error(`reload lost route: ${page.url()}`);
  await page.locator("article").waitFor({ state: "visible", timeout: 10_000 });
  await assertNoFatal("saved career reload");

  const saveKey = "beyond90:save:v1";
  const retirementPrepared = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const state = JSON.parse(raw);
    state.retired = true;
    state.age = Math.max(30, Math.min(42, Number(state.age) || 36));
    state.lastOutcome = null;
    state.pendingMarket = null;
    state.pending = {
      type: "dynamic",
      kind: "career_end",
      data: {
        tier: "QA",
        apps: (state.seasons || []).reduce((sum, season) => sum + (season.apps || 0), 0),
        goals: (state.seasons || []).reduce((sum, season) => sum + (season.goals || 0), 0),
        titles: (state.titles || []).length,
        awards: (state.awards || []).length,
        peak: Math.max(state.overall || 0, ...(state.seasons || []).map((season) => season.overall || 0)),
        wealth: state.wealth || 0,
      },
    };
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  }, saveKey);
  if (!retirementPrepared) throw new Error("could not prepare retirement state from persisted career");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("Carrera terminada", { exact: true }).waitFor({ state: "visible", timeout: 10_000 });
  await page.getByRole("link", { name: "Ver mi legado" }).waitFor({ state: "visible", timeout: 10_000 });
  await assertNoFatal("career end render");
  await page.getByRole("link", { name: "Ver mi legado" }).click();
  await page.waitForURL(/\/legado$/, { timeout: 10_000 });
  await page.locator("main").waitFor({ state: "visible", timeout: 10_000 });
  await assertNoFatal("career end to legacy");

  console.log(`BROWSER_SMOKE_OK url=${baseURL} offers=${clubCount} route=${page.url()} legacy=ok`);
} finally {
  await browser.close();
}
