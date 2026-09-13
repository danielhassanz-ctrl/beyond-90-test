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

test("iPhone WebKit chooses the newest valid slot and heals a stale primary", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Freshest Slot");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "qa-player.png",
    mimeType: "image/png",
    buffer: QA_PLAYER_PNG,
  });
  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page.getByRole("heading", { name: "Antes del fútbol está tu vida" })).toBeVisible();

  await page.evaluate(([primaryKey, backupKey]) => {
    const baselineRaw = localStorage.getItem(primaryKey);
    if (!baselineRaw) throw new Error("Missing baseline primary save");
    const baseline = JSON.parse(baselineRaw);
    const baseTime = Math.max(Number(baseline.updatedAt) || 0, Date.now());

    const stalePrimary = structuredClone(baseline);
    stalePrimary.updatedAt = baseTime + 1_000;
    stalePrimary.player.name = "Jugador QA STALE";
    stalePrimary.morale = 11;

    const freshBackup = structuredClone(baseline);
    freshBackup.updatedAt = baseTime + 2_000;
    freshBackup.player.name = "Jugador QA FRESH";
    freshBackup.morale = 88;
    freshBackup.log = [
      ...(freshBackup.log || []),
      { season: freshBackup.seasonIndex, beat: freshBackup.beat, text: "QA freshest backup marker" },
    ];

    localStorage.setItem(primaryKey, JSON.stringify(stalePrimary));
    localStorage.setItem(backupKey, JSON.stringify(freshBackup));
  }, [SAVE_KEY, BACKUP_KEY]);

  await page.reload();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Antes del fútbol está tu vida" })).toBeVisible();

  const healed = await page.evaluate(([primaryKey, backupKey]) => {
    const primaryRaw = localStorage.getItem(primaryKey);
    const backupRaw = localStorage.getItem(backupKey);
    const primary = primaryRaw ? JSON.parse(primaryRaw) : null;
    const backup = backupRaw ? JSON.parse(backupRaw) : null;
    return {
      sameRaw: primaryRaw === backupRaw,
      primaryName: primary?.player?.name,
      backupName: backup?.player?.name,
      primaryMorale: primary?.morale,
      backupMorale: backup?.morale,
      primaryUpdatedAt: primary?.updatedAt,
      backupUpdatedAt: backup?.updatedAt,
      primaryHasMarker: primary?.log?.some((entry) => entry.text === "QA freshest backup marker") ?? false,
      backupHasMarker: backup?.log?.some((entry) => entry.text === "QA freshest backup marker") ?? false,
    };
  }, [SAVE_KEY, BACKUP_KEY]);

  expect(healed.sameRaw).toBe(true);
  expect(healed.primaryName).toBe("Jugador QA FRESH");
  expect(healed.backupName).toBe("Jugador QA FRESH");
  expect(healed.primaryMorale).toBe(88);
  expect(healed.backupMorale).toBe(88);
  expect(healed.primaryUpdatedAt).toBe(healed.backupUpdatedAt);
  expect(healed.primaryHasMarker).toBe(true);
  expect(healed.backupHasMarker).toBe(true);
  expect(pageErrors).toEqual([]);
});
