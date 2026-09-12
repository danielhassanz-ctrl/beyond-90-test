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

const saveKey = "beyond90:save:v1";
const backupKey = `${saveKey}:backup`;

async function assertNoFatal(label) {
  const body = await page.locator("body").innerText();
  if (/Esta pantalla no ha cargado|Cargando tu carrera|Esa acción no se pudo aplicar/i.test(body)) {
    throw new Error(`${label}: fatal/loading state visible: ${body.slice(0, 500)}`);
  }
  if (errors.length) throw new Error(`${label}: browser errors: ${errors.join(" | ")}`);
}

async function saved() {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, saveKey);
}

async function assertOpeningEvent(eventId, label) {
  const state = await saved();
  if (!state) throw new Error(`${label}: no persisted state`);
  if (state.pending?.type === "match") throw new Error(`${label}: football match leaked before opening completion`);
  if (state.pending?.type !== "event" || state.pending.eventId !== eventId) {
    throw new Error(`${label}: expected ${eventId}, got ${state.pending?.type ?? "nothing"}/${state.pending?.eventId ?? ""}`);
  }
  await assertNoFatal(label);
}

async function chooseAndNext(buttonName, nextHeading) {
  await page.getByRole("button", { name: buttonName }).click();
  await page.getByRole("button", { name: "Siguiente escena" }).waitFor({ state: "visible", timeout: 10_000 });
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  if (nextHeading) await page.getByRole("heading", { name: nextHeading }).waitFor({ state: "visible", timeout: 10_000 });
}

try {
  await page.goto(baseURL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Nueva carrera" }).waitFor({ state: "visible", timeout: 10_000 });
  await assertNoFatal("cold start");

  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.waitForURL(/\/onboarding\/?$/, { timeout: 10_000 });
  await page.getByPlaceholder("Álvaro Nieto").fill("Daniel QA");
  await page.getByRole("button", { name: /^Ambicioso/ }).click();
  await page.getByRole("button", { name: /^Leal/ }).click();
  for (const mode of ["Express", "Standard", "Pro"]) {
    await page.getByRole("button", { name: new RegExp(`^${mode}\\b`, "i") }).waitFor({ state: "visible", timeout: 10_000 });
  }
  await page.getByRole("button", { name: /^Pro\b/i }).click();

  // P0 contract: story starts at home, NOT on the academy-offer or match screen.
  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await page.waitForURL(/\/historia\/?$/, { timeout: 10_000 });
  await page.getByRole("heading", { name: "Antes del fútbol está tu vida" }).waitFor({ state: "visible", timeout: 10_000 });
  await assertOpeningEvent("opening_home_family", "decision #1 home/family");

  const selectedMode = (await saved())?.careerMode ?? null;
  if (selectedMode !== "pro") throw new Error(`career mode selection did not persist: ${selectedMode}`);

  await chooseAndNext("Decir que no darás ningún paso sin hablarlo en casa", "¿Quién va a cuidar tu carrera?");
  await assertOpeningEvent("opening_adviser_choice", "decision #2 adviser");

  // Decision #2 must be adviser/family management — this is the exact regression the user found.
  await page.getByRole("button", { name: "Trabajar con un representante profesional" }).click();
  await page.waitForURL(/\/cantera\/?$/, { timeout: 10_000 });
  await page.getByRole("heading", { name: "Ahora sí: cuatro caminos" }).waitFor({ state: "visible", timeout: 10_000 });
  const clubButtons = page.locator("ul > li > button");
  const clubCount = await clubButtons.count();
  if (clubCount !== 4) throw new Error(`club selection: expected 4 offers, got ${clubCount}`);
  const clubState = await saved();
  if (clubState?.pending?.type === "match") throw new Error("club evaluation gate already contains a match");

  await clubButtons.first().click();
  await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
  await page.waitForURL(/\/historia\/?$/, { timeout: 10_000 });
  await page.getByRole("heading", { name: "No firmas hasta entenderlo" }).waitFor({ state: "visible", timeout: 10_000 });
  await assertOpeningEvent("opening_first_agreement", "first agreement");

  await chooseAndNext("Pedir garantías sobre el plan de minutos", "Tu nombre en un papel del club");
  await assertOpeningEvent("opening_signing_day", "signing day");
  await chooseAndNext("Pedir una foto solo con tu familia", "El entrenador te recibe por tu nombre");
  await assertOpeningEvent("opening_named_coach", "named coach");
  await chooseAndNext("Preguntarle exactamente qué espera de ti", "Todavía no hay partidos importantes");
  await assertOpeningEvent("opening_preseason_adaptation", "preseason adaptation");
  await chooseAndNext("Quedarte veinte minutos más a trabajar", "El capitán te explica dónde estás");
  await assertOpeningEvent("opening_named_captain", "named captain");
  await chooseAndNext("Agradecerle que te lo explique", "Aparece tu primer compañero de verdad");
  await assertOpeningEvent("opening_named_teammate", "named teammate");
  await chooseAndNext("Hacer piña desde el principio", "El fisio te conoce antes de que te lesiones");
  await assertOpeningEvent("opening_named_physio", "named physio");

  await page.getByRole("button", { name: "Pedirle una rutina corta de prevención" }).click();
  await page.getByRole("button", { name: "Siguiente escena" }).waitFor({ state: "visible", timeout: 10_000 });
  const completed = await saved();
  if (completed?.flags?.opening_completed !== 1 || completed?.flags?.opening_phase !== 10) {
    throw new Error(`opening did not complete: phase=${completed?.flags?.opening_phase} done=${completed?.flags?.opening_completed}`);
  }
  const cast = completed?.memory?.careerCast;
  for (const role of ["adviser", "coach", "captain", "teammate", "physio"]) {
    if (!cast?.[role]?.met || !cast?.[role]?.name) throw new Error(`persistent ${role} was not introduced with a name`);
  }
  await assertNoFatal("opening completed");

  // Only now is the normal season scheduler allowed to run.
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  await page.waitForTimeout(250);
  await assertNoFatal("post-opening scheduler");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(200);
  if (!/\/historia\/?$/.test(page.url())) throw new Error(`reload lost route: ${page.url()}`);
  const reloaded = await saved();
  if (reloaded?.careerMode !== "pro" || reloaded?.flags?.opening_completed !== 1) {
    throw new Error("career mode/opening state changed after reload");
  }
  await assertNoFatal("saved career reload");

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
  const recovered = await saved();
  if (recovered?.careerMode !== "pro" || recovered?.flags?.opening_completed !== 1) {
    throw new Error("save recovery lost completed opening or career mode");
  }
  await assertNoFatal("corrupted save recovery");

  // Keep the legacy/post-career smoke: the P0 rewrite must not break the end of a career.
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
  await page.getByRole("link", { name: "Ver mi legado" }).click();
  await page.waitForURL(/\/legado\/?$/, { timeout: 10_000 });
  await page.getByText("¿Y después del minuto 90?", { exact: true }).waitFor({ state: "visible", timeout: 10_000 });
  await page.getByRole("button", { name: /Ser entrenador/i }).click();
  await page.getByRole("button", { name: /Empezar desde abajo/i }).click();
  await page.getByText("Entrenador · empieza otra carrera", { exact: true }).waitFor({ state: "visible", timeout: 10_000 });
  await assertNoFatal("post-career decision");

  console.log(`BROWSER_SMOKE_OK url=${baseURL} offers=${clubCount} mode=pro opening=life-first decision2=adviser recovery=ok legacy=ok`);
} finally {
  await browser.close();
}
