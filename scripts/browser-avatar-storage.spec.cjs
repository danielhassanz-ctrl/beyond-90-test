const { test, expect, devices } = require("@playwright/test");

const BASE_URL = (process.env.TEST_BASE_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const routeUrl = (route = "") => new URL(route.replace(/^\//, ""), BASE_URL).toString();
const SAVE_KEY = "beyond90:save:v1";
const BACKUP_KEY = `${SAVE_KEY}:backup`;
const MAX_AVATAR_DATA_URL_LENGTH = 180_000;

// Deliberately much larger than an avatar should ever be. The payload lives in
// an SVG comment so WebKit has to read a >1 MB source without spending time on
// thousands of DOM/image nodes. The actual rendered source is 1600x1200.
const LARGE_SOURCE_SVG = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200" viewBox="0 0 1600 1200">
    <defs><linearGradient id="g"><stop stop-color="#d7b35b"/><stop offset="1" stop-color="#111"/></linearGradient></defs>
    <rect width="1600" height="1200" fill="url(#g)"/>
    <!-- ${"camera-payload-".repeat(90_000)} -->
  </svg>`,
);

expect(LARGE_SOURCE_SVG.length).toBeGreaterThan(1_000_000);

test.use({ ...devices["iPhone 13"] });

test("iPhone WebKit compresses a large mandatory photo before primary/backup persistence", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await expect(page).toHaveURL(/\/onboarding\/?$/);

  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Foto Grande");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();

  await page.locator('input[type="file"]').setInputFiles({
    name: "iphone-camera-large.svg",
    mimeType: "image/svg+xml",
    buffer: LARGE_SOURCE_SVG,
  });

  const preview = page.getByAltText("Vista previa de tu foto");
  await expect(preview).toBeVisible();
  const previewSrc = await preview.getAttribute("src");
  expect(previewSrc).toMatch(/^data:image\/jpeg/);
  expect(previewSrc.length).toBeLessThanOrEqual(MAX_AVATAR_DATA_URL_LENGTH);
  expect(previewSrc.length).toBeLessThan(LARGE_SOURCE_SVG.length / 4);

  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "Antes del fútbol está tu vida" })).toBeVisible();

  await page.getByRole("button", { name: "Decir que no darás ningún paso sin hablarlo en casa" }).click();
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  await expect(page.getByRole("heading", { name: "¿Quién va a cuidar tu carrera?" })).toBeVisible();

  const slots = await page.evaluate(([primaryKey, backupKey]) => {
    const primaryRaw = localStorage.getItem(primaryKey);
    const backupRaw = localStorage.getItem(backupKey);
    return {
      primary: primaryRaw ? JSON.parse(primaryRaw) : null,
      backup: backupRaw ? JSON.parse(backupRaw) : null,
      primaryBytes: primaryRaw?.length || 0,
      backupBytes: backupRaw?.length || 0,
    };
  }, [SAVE_KEY, BACKUP_KEY]);

  expect(slots.primary).toBeTruthy();
  expect(slots.backup).toBeTruthy();
  expect(slots.primary.player.avatar).toMatch(/^data:image\/jpeg/);
  expect(slots.backup.player.avatar).toMatch(/^data:image\/jpeg/);
  expect(slots.primary.player.avatar.length).toBeLessThanOrEqual(MAX_AVATAR_DATA_URL_LENGTH);
  expect(slots.backup.player.avatar.length).toBeLessThanOrEqual(MAX_AVATAR_DATA_URL_LENGTH);
  expect(slots.primaryBytes).toBeLessThan(500_000);
  expect(slots.backupBytes).toBeLessThan(500_000);

  await page.reload();
  await expect(page.getByRole("heading", { name: "¿Quién va a cuidar tu carrera?" })).toBeVisible();

  await page.evaluate((key) => localStorage.setItem(key, "{corrupt-save"), SAVE_KEY);
  await page.reload();
  await expect(page.getByRole("heading", { name: "¿Quién va a cuidar tu carrera?" })).toBeVisible();
  const recovered = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  expect(recovered.player.name).toBe("Jugador QA Foto Grande");
  expect(recovered.player.avatar).toMatch(/^data:image\/jpeg/);
  expect(recovered.player.avatar.length).toBeLessThanOrEqual(MAX_AVATAR_DATA_URL_LENGTH);
  expect(pageErrors).toEqual([]);
});
