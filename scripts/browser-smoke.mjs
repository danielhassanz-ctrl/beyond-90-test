import { webkit, devices } from "@playwright/test";

const baseURL = (process.env.BEYOND90_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const errors = [];
const browser = await webkit.launch();
const context = await browser.newContext({ ...devices["iPhone 14"] });
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("response", (response) => {
  if (response.status() >= 400) errors.push(`http ${response.status()}: ${response.url()}`);
});
page.on("console", (msg) => {
  if (msg.type() === "error") {
    const location = msg.location();
    const source = location?.url ? ` @ ${location.url}${location.lineNumber != null ? `:${location.lineNumber}` : ""}` : "";
    errors.push(`console: ${msg.text()}${source}`);
  }
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
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Nueva carrera" }).waitFor({ state: "visible", timeout: 10_000 });
  await assertNoFatal("cold start");

  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.waitForURL(/\/onboarding$/, { timeout: 10_000 });
  await page.getByPlaceholder("Álvaro Nieto").fill("Daniel QA");
  await page.getByRole("button", { name: /^Ambicioso/ }).click();
  await page.getByRole("button", { name: /^Leal/ }).click();

  for (const mode of ["Express", "Standard", "Pro"]) {
    await page.getByRole("button", { name: new RegExp(`^${mode}\\b`, "i") }).waitFor({ state: "visible", timeout: 10_000 });
  }
  await page.getByRole("button", { name: /^Pro\b/i }).click();

  await page.getByRole("button", { name: "Elegir cantera" }).click();
  await page.waitForURL(/\/cantera$/, { timeout: 10_000 });

  // P0 contract: life and family must precede football and club choice.
  await page.getByRole("heading", { name: "Esta noche todavía eres el de siempre" }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Escuchar y disfrutarlo con ellos/i }).click();
  await page.getByRole("button", { name: "Seguir" }).click();

  // The player explicitly chooses who will advise/manage the career.
  await page.getByRole("heading", { name: "Alguien quiere llevar tu carrera" }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Álvaro Montes · representante profesional/i }).click();
  await page.getByRole("button", { name: "Escuchar ofertas" }).click();

  await page.getByRole("heading", { name: "Ahora sí: cuatro canteras te quieren" }).waitFor({ state: "visible" });
  const clubButtons = page.locator("ul > li > button");
  const clubCount = await clubButtons.count();
  if (clubCount !== 4) throw new Error(`club selection: expected 4 offers, got ${clubCount}`);
  await clubButtons.first().click();
  await page.getByRole("button", { name: "Sentarnos a negociar" }).click();

  // First agreement is negotiated with the chosen adviser before arrival.
  await page.getByRole("heading", { name: /La mesa del / }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Pedir un camino claro hacia minutos/i }).click();
  await page.getByRole("button", { name: "Firmar y conocer al míster" }).click();
  await page.waitForURL(/\/historia$/, { timeout: 10_000 });
  await assertNoFatal("first story render");

  // The live flow must now force named club introductions before any match.
  await page.getByRole("heading", { name: "El entrenador te pone nombre y objetivo" }).waitFor({ state: "visible", timeout: 10_000 });
  const firstStoryText = await page.locator("article").innerText();
  if (/Salir al campo|Ver el partido|Jugada clave/i.test(firstStoryText)) {
    throw new Error("opening order: a football match surfaced before the named coach introduction");
  }

  const saveKey = "beyond90:save:v1";
  const openingPersisted = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const state = JSON.parse(raw);
    return {
      mode: state.careerMode ?? null,
      family: state.flags?.opening_family_done === 1,
      adviser: state.flags?.opening_adviser_agent === 1,
      contract: state.flags?.opening_contract_minutes === 1,
      adviserName: state.agent?.name ?? null,
      pending: state.pending?.eventId ?? null,
    };
  }, saveKey);
  if (openingPersisted?.mode !== "pro") throw new Error(`career mode selection did not persist: ${openingPersisted?.mode}`);
  if (!openingPersisted?.family || !openingPersisted?.adviser || !openingPersisted?.contract) {
    throw new Error(`opening choices did not persist: ${JSON.stringify(openingPersisted)}`);
  }
  if (openingPersisted?.adviserName !== "Álvaro Montes") throw new Error(`chosen adviser identity did not persist: ${openingPersisted?.adviserName}`);
  if (openingPersisted?.pending !== "people_coach_intro") throw new Error(`coach intro was not forced after signing: ${openingPersisted?.pending}`);

  await page.locator("article button").first().click();
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  await page.getByRole("heading", { name: "El capitán se sienta a tu lado" }).waitFor({ state: "visible", timeout: 10_000 });
  const captainText = await page.locator("article").innerText();
  if (/Salir al campo|Ver el partido/i.test(captainText)) throw new Error("opening order: match surfaced before captain introduction");

  await page.locator("article button").first().click();
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  await page.getByRole("heading", { name: "Tu primer aliado dentro" }).waitFor({ state: "visible", timeout: 10_000 });
  await assertNoFatal("mandatory opening chain");

  await page.locator("article button").first().click();
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  await page.waitForTimeout(250);
  await assertNoFatal("first post-opening scene");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(200);
  if (!/\/historia$/.test(page.url())) throw new Error(`reload lost route: ${page.url()}`);
  await page.locator("article").waitFor({ state: "visible", timeout: 10_000 });
  const reloadedOpening = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const state = JSON.parse(raw);
    return {
      mode: state.careerMode ?? null,
      family: state.flags?.opening_family_done === 1,
      coach: state.flags?.people_coach_intro === 1,
      captain: state.flags?.people_captain_intro === 1,
      teammate: state.flags?.people_teammate_intro === 1,
      adviserName: state.agent?.name ?? null,
    };
  }, saveKey);
  if (reloadedOpening?.mode !== "pro") throw new Error(`career mode changed after reload: ${reloadedOpening?.mode}`);
  if (!reloadedOpening?.family || !reloadedOpening?.coach || !reloadedOpening?.captain || !reloadedOpening?.teammate) {
    throw new Error(`mandatory opening chain did not survive reload: ${JSON.stringify(reloadedOpening)}`);
  }
  if (reloadedOpening?.adviserName !== "Álvaro Montes") throw new Error(`persistent adviser identity changed after reload: ${reloadedOpening?.adviserName}`);
  await assertNoFatal("saved career reload");

  const backupKey = `${saveKey}:backup`;
  const backupReady = await page.evaluate(([primaryKey, recoveryKey]) => {
    const primaryRaw = localStorage.getItem(primaryKey);
    const backupRaw = localStorage.getItem(recoveryKey);
    if (!primaryRaw || !backupRaw) return false;
    JSON.parse(primaryRaw);
    JSON.parse(backupRaw);
    return true;
  }, [saveKey, backupKey]);
  if (!backupReady) throw new Error("save recovery: valid primary/backup pair was not created");

  await page.evaluate((key) => localStorage.setItem(key, "{corrupted-save"), saveKey);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(200);
  if (!/\/historia$/.test(page.url())) throw new Error(`save recovery lost route: ${page.url()}`);
  await page.locator("article").waitFor({ state: "visible", timeout: 10_000 });
  const recoveredPrimary = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const state = JSON.parse(raw);
    return state.careerMode === "pro" && state.flags?.opening_family_done === 1 && state.agent?.name === "Álvaro Montes";
  }, saveKey);
  if (!recoveredPrimary) throw new Error("save recovery: backup did not repair the opening career state");
  await assertNoFatal("corrupted save recovery");

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
  await page.getByText("¿Y después del minuto 90?", { exact: true }).waitFor({ state: "visible", timeout: 10_000 });
  await assertNoFatal("career end to legacy");

  await page.getByRole("button", { name: /Ser entrenador/i }).click();
  await page.getByText("Nueva vida · Entrenador", { exact: true }).waitFor({ state: "visible", timeout: 10_000 });
  await page.getByRole("button", { name: /Empezar desde abajo/i }).click();
  await page.getByText("Entrenador · empieza otra carrera", { exact: true }).waitFor({ state: "visible", timeout: 10_000 });
  await assertNoFatal("post-career decision");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByText("Entrenador · empieza otra carrera", { exact: true }).waitFor({ state: "visible", timeout: 10_000 });
  const persistedPostCareer = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    const state = JSON.parse(raw);
    return state.flags?.post_career_path === 1 && state.flags?.post_career_style === 1;
  }, saveKey);
  if (!persistedPostCareer) throw new Error("post-career coach path/style did not persist after reload");
  await assertNoFatal("post-career persistence");

  console.log(`BROWSER_SMOKE_OK url=${baseURL} offers=${clubCount} mode=pro opening=family-adviser-contract-coach-captain-teammate recovery=ok legacy=ok postCareer=coach-a`);
} finally {
  await browser.close();
}
