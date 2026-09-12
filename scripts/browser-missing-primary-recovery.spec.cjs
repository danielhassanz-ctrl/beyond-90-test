const { test, expect, devices } = require("@playwright/test");

const BASE_URL = (process.env.TEST_BASE_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const routeUrl = (route = "") => new URL(route.replace(/^\//, ""), BASE_URL).toString();
const SAVE_KEY = "beyond90:save:v1";
const BACKUP_KEY = `${SAVE_KEY}:backup`;

test.use({ ...devices["iPhone 13"] });

async function reachPersistedOpening(page, name) {
  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await expect(page).toHaveURL(/\/onboarding\/?$/);
  await page.getByPlaceholder("Álvaro Nieto").fill(name);
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "Antes del fútbol está tu vida" })).toBeVisible();

  await page.getByRole("button", { name: "Decir que no darás ningún paso sin hablarlo en casa" }).click();
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  await expect(page.getByRole("heading", { name: "¿Quién va a cuidar tu carrera?" })).toBeVisible();

  await page.getByRole("button", { name: "Trabajar con un representante profesional" }).click();
  await expect(page).toHaveURL(/\/cantera\/?$/);
  const academyButtons = page.locator("ul > li > button");
  await expect(academyButtons).toHaveCount(4);
  await academyButtons.first().click();
  await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "No firmas hasta entenderlo" })).toBeVisible();
}

test("iPhone WebKit restores a valid backup when the primary save disappears", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await reachPersistedOpening(page, "Jugador QA Missing Primary");

  const before = await page.evaluate(([primaryKey, backupKey]) => {
    const primaryRaw = localStorage.getItem(primaryKey);
    const backupRaw = localStorage.getItem(backupKey);
    return {
      primaryRaw,
      backupRaw,
      name: primaryRaw ? JSON.parse(primaryRaw).player?.name : null,
      eventId: primaryRaw ? JSON.parse(primaryRaw).pending?.eventId : null,
    };
  }, [SAVE_KEY, BACKUP_KEY]);

  expect(before.primaryRaw).toBeTruthy();
  expect(before.backupRaw).toBeTruthy();
  expect(before.name).toBe("Jugador QA Missing Primary");
  expect(before.eventId).toBe("opening_first_agreement");

  await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY);
  await page.reload();

  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "No firmas hasta entenderlo" })).toBeVisible();
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);

  const healed = await page.evaluate(([primaryKey, backupKey]) => {
    const primaryRaw = localStorage.getItem(primaryKey);
    const backupRaw = localStorage.getItem(backupKey);
    if (!primaryRaw || !backupRaw) return null;
    const primary = JSON.parse(primaryRaw);
    const backup = JSON.parse(backupRaw);
    return {
      primaryName: primary.player?.name,
      backupName: backup.player?.name,
      primaryEvent: primary.pending?.eventId,
      backupEvent: backup.pending?.eventId,
    };
  }, [SAVE_KEY, BACKUP_KEY]);

  expect(healed).not.toBeNull();
  expect(healed.primaryName).toBe("Jugador QA Missing Primary");
  expect(healed.backupName).toBe("Jugador QA Missing Primary");
  expect(healed.primaryEvent).toBe("opening_first_agreement");
  expect(healed.backupEvent).toBe("opening_first_agreement");
  expect(pageErrors).toEqual([]);
});
