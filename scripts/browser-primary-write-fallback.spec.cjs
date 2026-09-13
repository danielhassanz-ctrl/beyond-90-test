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

test("iPhone WebKit never lets a stale primary overwrite a fresher backup", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Stale Primary");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "qa-player.png",
    mimeType: "image/png",
    buffer: QA_PLAYER_PNG,
  });
  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page.getByRole("heading", { name: "Antes del fútbol está tu vida" })).toBeVisible();

  const initial = await page.evaluate(([primaryKey, backupKey]) => ({
    primary: localStorage.getItem(primaryKey),
    backup: localStorage.getItem(backupKey),
  }), [SAVE_KEY, BACKUP_KEY]);
  expect(initial.primary).toBeTruthy();
  expect(initial.backup).toBe(initial.primary);

  await page.evaluate((primaryKey) => {
    window.__qaOriginalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === primaryKey) throw new DOMException("Simulated Safari primary-slot failure after a valid save", "QuotaExceededError");
      return window.__qaOriginalSetItem.call(this, key, value);
    };
  }, SAVE_KEY);

  const familyChoice = "Decir que no darás ningún paso sin hablarlo en casa";
  await page.getByRole("button", { name: familyChoice }).click();
  await expect.poll(async () => page.evaluate((backupKey) => localStorage.getItem(backupKey), BACKUP_KEY)).not.toBe(initial.backup);

  const afterFallback = await page.evaluate(([primaryKey, backupKey]) => {
    const backup = localStorage.getItem(backupKey);
    const parsed = backup ? JSON.parse(backup) : null;
    return {
      primary: localStorage.getItem(primaryKey),
      backup,
      beat: parsed?.beat ?? null,
      seenEvents: parsed?.seenEvents ?? [],
      memoryBeats: parsed?.memory?.beats ?? [],
      log: parsed?.log?.map((entry) => entry.text) ?? [],
    };
  }, [SAVE_KEY, BACKUP_KEY]);
  expect(afterFallback.primary).toBeNull();
  expect(afterFallback.backup).toBeTruthy();
  expect(afterFallback.backup).not.toBe(initial.backup);
  expect(afterFallback.seenEvents).toContain("opening_home_family");
  expect(afterFallback.memoryBeats).toContain(familyChoice);
  expect(afterFallback.log.some((text) => text.includes("Prometiste decidir los primeros pasos junto a tu familia"))).toBe(true);
  const freshBeat = afterFallback.beat;

  await page.evaluate(() => {
    if (window.__qaOriginalSetItem) Storage.prototype.setItem = window.__qaOriginalSetItem;
    delete window.__qaOriginalSetItem;
  });
  await page.reload();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "¿Quién va a cuidar tu carrera?" })).toBeVisible();

  const healed = await page.evaluate(([primaryKey, backupKey]) => {
    const primaryRaw = localStorage.getItem(primaryKey);
    const backupRaw = localStorage.getItem(backupKey);
    const primary = primaryRaw ? JSON.parse(primaryRaw) : null;
    const backup = backupRaw ? JSON.parse(backupRaw) : null;
    return {
      primaryExists: !!primary,
      backupExists: !!backup,
      primaryBeat: primary?.beat ?? null,
      backupBeat: backup?.beat ?? null,
      primarySeenEvents: primary?.seenEvents ?? [],
      backupSeenEvents: backup?.seenEvents ?? [],
      primaryMemoryBeats: primary?.memory?.beats ?? [],
      backupMemoryBeats: backup?.memory?.beats ?? [],
      primaryLog: primary?.log?.map((entry) => entry.text) ?? [],
      backupLog: backup?.log?.map((entry) => entry.text) ?? [],
    };
  }, [SAVE_KEY, BACKUP_KEY]);
  expect(healed.primaryExists).toBe(true);
  expect(healed.backupExists).toBe(true);
  expect(healed.primaryBeat).toBe(freshBeat);
  expect(healed.backupBeat).toBe(freshBeat);
  expect(healed.primarySeenEvents).toContain("opening_home_family");
  expect(healed.backupSeenEvents).toContain("opening_home_family");
  expect(healed.primaryMemoryBeats).toContain(familyChoice);
  expect(healed.backupMemoryBeats).toContain(familyChoice);
  expect(healed.primaryLog.some((text) => text.includes("Prometiste decidir los primeros pasos junto a tu familia"))).toBe(true);
  expect(healed.backupLog.some((text) => text.includes("Prometiste decidir los primeros pasos junto a tu familia"))).toBe(true);
  expect(pageErrors).toEqual([]);
});
