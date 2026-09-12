const { test, expect, devices } = require("@playwright/test");

const BASE_URL = (process.env.TEST_BASE_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const routeUrl = (route = "") => new URL(route.replace(/^\//, ""), BASE_URL).toString();
const SAVE_KEY = "beyond90:save:v1";
const BACKUP_KEY = `${SAVE_KEY}:backup`;
const QA_PLAYER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test.use({ ...devices["iPhone 13"] });

async function clearAndStart(page, name) {
  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await expect(page).toHaveURL(/\/onboarding\/?$/);
  await page.getByPlaceholder("Álvaro Nieto").fill(name);
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();

  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page.getByRole("alert")).toContainText("Sube una foto para empezar tu carrera.");
  await expect(page).toHaveURL(/\/onboarding\/?$/);
  expect(await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBeNull();

  await page.locator('input[type="file"]').setInputFiles({
    name: "qa-player.png",
    mimeType: "image/png",
    buffer: QA_PLAYER_PNG,
  });
  await expect(page.getByAltText("Vista previa de tu foto")).toBeVisible();

  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);
  const created = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(created.player.avatar).toMatch(/^data:image\//);
}

async function reachFirstAgreement(page, name) {
  await clearAndStart(page, name);
  await expect(page.getByRole("heading", { name: "Antes del fútbol está tu vida" })).toBeVisible();
  let state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(state.pending.type).toBe("event");
  expect(state.pending.eventId).toBe("opening_home_family");
  expect(state.player.avatar).toMatch(/^data:image\//);

  await page.getByRole("button", { name: "Decir que no darás ningún paso sin hablarlo en casa" }).click();
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  await expect(page.getByRole("heading", { name: "¿Quién va a cuidar tu carrera?" })).toBeVisible();
  state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(state.pending.type).not.toBe("match");
  expect(state.pending.eventId).toBe("opening_adviser_choice");

  await page.getByRole("button", { name: "Trabajar con un representante profesional" }).click();
  await expect(page).toHaveURL(/\/cantera\/?$/);
  await expect(page.getByRole("heading", { name: "Ahora sí: cuatro caminos" })).toBeVisible();
  const academyButtons = page.locator("ul > li > button");
  await expect(academyButtons).toHaveCount(4);
  await academyButtons.first().click();
  await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "No firmas hasta entenderlo" })).toBeVisible();
  state = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(state.pending.type).toBe("event");
  expect(state.pending.eventId).toBe("opening_first_agreement");
  expect(state.player.avatar).toMatch(/^data:image\//);
  return academyButtons;
}

test("iPhone WebKit recovers a deep link without a save", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  // Establish the origin first, clear storage while navigation is stable, then
  // enter the deep link as a fresh navigation. Reloading /historia while the app
  // itself redirects an empty save to / causes WebKit to cancel one of the two
  // competing navigations with "Navigation canceled by policy check". That is a
  // test harness race, not a recovery failure.
  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.goto(routeUrl("historia"));

  await expect(page.getByText(/Volviendo a portada|Cargando carrera|Simulador narrativo de carrera/)).toBeVisible();
  await page.waitForURL(routeUrl(), { timeout: 5000 }).catch(() => {});
  if (/\/historia\/?$/.test(page.url())) await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("button", { name: "Nueva carrera" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("iPhone WebKit starts with life/adviser before four academies and persists", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await reachFirstAgreement(page, "Jugador QA Mobile");

  const viewportFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(viewportFits).toBeTruthy();

  await page.reload();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "No firmas hasta entenderlo" })).toBeVisible();
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);
  const reloaded = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(reloaded.player.avatar).toMatch(/^data:image\//);

  await page.goto(routeUrl());
  await expect(page.getByText("Partida guardada")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);
  expect(pageErrors).toEqual([]);
});

test("iPhone WebKit restores the last valid backup after primary corruption", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await reachFirstAgreement(page, "Jugador QA Recovery");

  const slots = await page.evaluate(([primary, backup]) => ({
    primary: localStorage.getItem(primary),
    backup: localStorage.getItem(backup),
  }), [SAVE_KEY, BACKUP_KEY]);
  expect(slots.primary).toBeTruthy();
  expect(slots.backup).toBeTruthy();

  await page.evaluate((key) => localStorage.setItem(key, "{corrupt-save"), SAVE_KEY);
  await page.reload();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);
  const healed = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    try { return Boolean(raw && JSON.parse(raw)); } catch { return false; }
  }, SAVE_KEY);
  expect(healed).toBeTruthy();
  const recovered = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(recovered.player.avatar).toMatch(/^data:image\//);
  expect(pageErrors).toEqual([]);
});

test("iPhone WebKit heals a valid but stale backup before recovery is needed", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await reachFirstAgreement(page, "Jugador QA Fresh State");

  await page.evaluate(([primaryKey, backupKey]) => {
    const primaryRaw = localStorage.getItem(primaryKey);
    if (!primaryRaw) throw new Error("missing primary save");
    const stale = JSON.parse(primaryRaw);
    stale.player.name = "Jugador QA Stale State";
    localStorage.setItem(backupKey, JSON.stringify(stale));
  }, [SAVE_KEY, BACKUP_KEY]);

  await page.reload();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect.poll(async () => page.evaluate(([primaryKey, backupKey]) => {
    const primaryRaw = localStorage.getItem(primaryKey);
    const backupRaw = localStorage.getItem(backupKey);
    if (!primaryRaw || !backupRaw) return false;
    return JSON.parse(primaryRaw).player.name === JSON.parse(backupRaw).player.name;
  }, [SAVE_KEY, BACKUP_KEY])).toBeTruthy();

  await page.evaluate((key) => localStorage.setItem(key, "{corrupt-save"), SAVE_KEY);
  await page.reload();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect.poll(async () => page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw).player.name : null;
  }, SAVE_KEY)).toBe("Jugador QA Fresh State");
  const recovered = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(recovered.player.avatar).toMatch(/^data:image\//);
  expect(pageErrors).toEqual([]);
});

test("iPhone WebKit keeps the primary save when backup writes are rejected", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "beyond90:save:v1:backup") throw new DOMException("Simulated Safari backup quota failure", "QuotaExceededError");
      return originalSetItem.call(this, key, value);
    };
  });

  await reachFirstAgreement(page, "Jugador QA Backup Failure");
  const primary = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
  expect(primary).toBeTruthy();
  expect(JSON.parse(primary).player.avatar).toMatch(/^data:image\//);
  await page.reload();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
