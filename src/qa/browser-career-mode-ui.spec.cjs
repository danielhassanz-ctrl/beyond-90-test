const { test, expect, devices } = require("@playwright/test");

const BASE_URL = (process.env.TEST_BASE_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const routeUrl = (route = "") => new URL(route.replace(/^\//, ""), BASE_URL).toString();
const SAVE_KEY = "beyond90:save:v1";
const QA_PLAYER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

const CASES = [
  ["express", "Express", 101],
  ["express", "Express", 2026],
  ["express", "Express", 31337],
  ["express", "Express", 90909],
  ["standard", "Standard", 100101],
  ["standard", "Standard", 102026],
  ["standard", "Standard", 131337],
  ["standard", "Standard", 190909],
  ["pro", "Pro", 200101],
  ["pro", "Pro", 202026],
  ["pro", "Pro", 231337],
  ["pro", "Pro", 290909],
];

test.use({ ...devices["iPhone 13"] });
test.describe.configure({ mode: "serial" });

async function savedState(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error("missing Beyond 90 save");
    return JSON.parse(raw);
  }, SAVE_KEY);
}

async function startCareerViaUi(page, mode, label, seed) {
  await page.addInitScript((initialSeed) => {
    let x = initialSeed >>> 0;
    Math.random = () => {
      x = (x * 1664525 + 1013904223) >>> 0;
      return x / 0x100000000;
    };
  }, seed);

  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await expect(page).toHaveURL(/\/onboarding\/?$/);

  await page.getByPlaceholder("Álvaro Nieto").fill(`QA mode UI ${mode} ${seed}`);
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "qa-player.png",
    mimeType: "image/png",
    buffer: QA_PLAYER_PNG,
  });

  const modeButton = page.getByRole("button", { name: new RegExp(`^${label}\\b`, "i") });
  await expect(modeButton).toBeVisible();
  await modeButton.click();

  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);

  const firstSave = await savedState(page);
  expect(firstSave.careerMode, `${mode}/${seed}: onboarding UI did not persist selected mode`).toBe(mode);
  expect(firstSave.player.avatar, `${mode}/${seed}: avatar lost at career start`).toMatch(/^data:image\//);

  await page.reload();
  await expect(page).toHaveURL(/\/historia\/?$/);
  const reloaded = await savedState(page);
  expect(reloaded.careerMode, `${mode}/${seed}: selected mode changed after reload`).toBe(mode);
  expect(reloaded.player.name).toBe(`QA mode UI ${mode} ${seed}`);

  const article = page.locator("article");
  await expect(article).toBeVisible();
  const firstChoice = article.locator(".space-y-2\\.5 > button").first();
  await expect(firstChoice).toBeVisible();
  await firstChoice.click();

  const afterDecision = await savedState(page);
  expect(afterDecision.careerMode, `${mode}/${seed}: selected mode changed after first narrative write`).toBe(mode);

  await page.reload();
  const afterDecisionReload = await savedState(page);
  expect(afterDecisionReload.careerMode, `${mode}/${seed}: selected mode changed after decision reload`).toBe(mode);
}

for (const [mode, label, seed] of CASES) {
  test(`iPhone WebKit selects and persists ${mode}/${seed} through onboarding UI`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await startCareerViaUi(page, mode, label, seed);
    expect(pageErrors).toEqual([]);
  });
}
