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

test("iPhone WebKit warns when neither recovery slot can persist the career", async ({ page }) => {
  await page.addInitScript(({ primaryKey, backupKey }) => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === primaryKey || key === backupKey) {
        throw new DOMException("Simulated Safari storage exhaustion", "QuotaExceededError");
      }
      return originalSetItem.call(this, key, value);
    };
  }, { primaryKey: SAVE_KEY, backupKey: BACKUP_KEY });

  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Sin Persistencia");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "qa-player.png",
    mimeType: "image/png",
    buffer: QA_PLAYER_PNG,
  });
  await page.getByRole("button", { name: "Empezar tu historia" }).click();

  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "Antes del fútbol está tu vida" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("no ha podido guardarla");

  const slots = await page.evaluate(([primaryKey, backupKey]) => ({
    primary: localStorage.getItem(primaryKey),
    backup: localStorage.getItem(backupKey),
  }), [SAVE_KEY, BACKUP_KEY]);
  expect(slots.primary).toBeNull();
  expect(slots.backup).toBeNull();
});
