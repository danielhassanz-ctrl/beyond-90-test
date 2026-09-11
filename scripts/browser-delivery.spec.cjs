const { test, expect, devices } = require("@playwright/test");

const BASE_URL = (process.env.TEST_BASE_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const routeUrl = (route = "") => new URL(route.replace(/^\//, ""), BASE_URL).toString();

test.use({
  ...devices["iPhone 13"],
});

test("iPhone WebKit recovers a deep link without a save", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(routeUrl("historia"));
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByText(/Volviendo a portada|Cargando carrera|Simulador narrativo de carrera/)).toBeVisible();
  await page.waitForURL(routeUrl(), { timeout: 5000 }).catch(() => {});

  if (page.url().endsWith("/historia")) {
    await page.getByRole("button", { name: "Continuar" }).click();
  }

  await expect(page.getByRole("button", { name: "Nueva carrera" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test("iPhone WebKit completes onboarding, shows four academies and keeps the save", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expect(page.getByRole("button", { name: "Nueva carrera" })).toBeEnabled();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Mobile");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.getByRole("button", { name: "Elegir cantera" }).click();

  await expect(page).toHaveURL(/\/cantera$/);
  await expect(page.getByRole("heading", { name: "Cuatro canteras te quieren" })).toBeVisible();

  const academyButtons = page.locator("ul > li > button");
  await expect(academyButtons).toHaveCount(4);
  const academyNames = await academyButtons.locator("h2").allTextContents();
  expect(academyNames).toHaveLength(4);
  expect(new Set(academyNames.map((name) => name.trim()).filter(Boolean)).size).toBe(4);

  await academyButtons.first().click();
  await page.getByRole("button", { name: "Firmar en la cantera" }).click();
  await expect(page).toHaveURL(/\/historia$/);
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);

  const viewportFits = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(viewportFits).toBeTruthy();

  await page.reload();
  await expect(page).toHaveURL(/\/historia$/);
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);

  await page.goto(routeUrl());
  await expect(page.getByText("Partida guardada")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page).toHaveURL(/\/historia$/);

  expect(pageErrors).toEqual([]);
});

test("iPhone WebKit restores the last valid backup after primary save corruption", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Recovery");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.getByRole("button", { name: "Elegir cantera" }).click();
  await page.locator("ul > li > button").first().click();
  await page.getByRole("button", { name: "Firmar en la cantera" }).click();
  await expect(page).toHaveURL(/\/historia$/);

  const slots = await page.evaluate(() => ({
    primary: localStorage.getItem("beyond90:save:v1"),
    backup: localStorage.getItem("beyond90:save:v1:backup"),
  }));
  expect(slots.primary).toBeTruthy();
  expect(slots.backup).toBeTruthy();

  await page.evaluate(() => localStorage.setItem("beyond90:save:v1", "{corrupt-save"));
  await page.reload();

  await expect(page).toHaveURL(/\/historia$/);
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);

  const healed = await page.evaluate(() => {
    const primary = localStorage.getItem("beyond90:save:v1");
    try {
      return Boolean(primary && JSON.parse(primary));
    } catch {
      return false;
    }
  });
  expect(healed).toBeTruthy();
  expect(pageErrors).toEqual([]);
});

test("iPhone WebKit heals a valid but stale backup before recovery is needed", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Fresh State");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.getByRole("button", { name: "Elegir cantera" }).click();
  await page.locator("ul > li > button").first().click();
  await page.getByRole("button", { name: "Firmar en la cantera" }).click();
  await expect(page).toHaveURL(/\/historia$/);

  await page.evaluate(() => {
    const primaryRaw = localStorage.getItem("beyond90:save:v1");
    if (!primaryRaw) throw new Error("missing primary save");
    const stale = JSON.parse(primaryRaw);
    stale.player.name = "Jugador QA Stale State";
    localStorage.setItem("beyond90:save:v1:backup", JSON.stringify(stale));
  });

  // A normal boot with a valid primary must refresh an older-but-valid backup.
  await page.reload();
  const synchronized = await page.evaluate(() => {
    const primaryRaw = localStorage.getItem("beyond90:save:v1");
    const backupRaw = localStorage.getItem("beyond90:save:v1:backup");
    if (!primaryRaw || !backupRaw) return false;
    return JSON.parse(primaryRaw).player.name === JSON.parse(backupRaw).player.name;
  });
  expect(synchronized).toBeTruthy();

  // If the primary then corrupts, recovery must return the current career, not
  // the stale snapshot that was valid before the synchronization boot.
  await page.evaluate(() => localStorage.setItem("beyond90:save:v1", "{corrupt-save"));
  await page.reload();
  await expect(page).toHaveURL(/\/historia$/);
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);

  const recoveredName = await page.evaluate(() => {
    const primaryRaw = localStorage.getItem("beyond90:save:v1");
    return primaryRaw ? JSON.parse(primaryRaw).player.name : null;
  });
  expect(recoveredName).toBe("Jugador QA Fresh State");
  expect(pageErrors).toEqual([]);
});

test("iPhone WebKit keeps the primary save when backup writes are rejected", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript(() => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "beyond90:save:v1:backup") {
        throw new DOMException("Simulated Safari backup quota failure", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
  });

  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Backup Failure");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.getByRole("button", { name: "Elegir cantera" }).click();
  await page.locator("ul > li > button").first().click();
  await page.getByRole("button", { name: "Firmar en la cantera" }).click();
  await expect(page).toHaveURL(/\/historia$/);

  const primary = await page.evaluate(() => localStorage.getItem("beyond90:save:v1"));
  expect(primary).toBeTruthy();

  await page.reload();
  await expect(page).toHaveURL(/\/historia$/);
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
