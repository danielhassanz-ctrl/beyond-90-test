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

test("iPhone WebKit preserves a new career through backup when primary writes are rejected", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.addInitScript((primaryKey) => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === primaryKey) throw new DOMException("Simulated Safari primary-slot failure", "QuotaExceededError");
      return originalSetItem.call(this, key, value);
    };
  }, SAVE_KEY);

  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Backup Only");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "qa-player.png",
    mimeType: "image/png",
    buffer: QA_PLAYER_PNG,
  });
  await expect(page.getByAltText("Vista previa de tu foto")).toBeVisible();
  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "Antes del fútbol está tu vida" })).toBeVisible();

  const slots = await page.evaluate(([primaryKey, backupKey]) => ({
    primary: localStorage.getItem(primaryKey),
    backup: localStorage.getItem(backupKey),
  }), [SAVE_KEY, BACKUP_KEY]);
  expect(slots.primary).toBeNull();
  expect(slots.backup).toBeTruthy();
  expect(JSON.parse(slots.backup).player.name).toBe("Jugador QA Backup Only");
  expect(JSON.parse(slots.backup).player.avatar).toMatch(/^data:image\//);

  await page.reload();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "Antes del fútbol está tu vida" })).toBeVisible();
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);

  const recovered = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { name: parsed.player?.name, avatar: parsed.player?.avatar };
  }, BACKUP_KEY);
  expect(recovered?.name).toBe("Jugador QA Backup Only");
  expect(recovered?.avatar).toMatch(/^data:image\//);
  expect(pageErrors).toEqual([]);
});
