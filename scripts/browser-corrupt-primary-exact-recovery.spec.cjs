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

async function readSlot(page, key) {
  return page.evaluate((storageKey) => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  }, key);
}

function recoverySnapshot(state) {
  return {
    player: state.player,
    age: state.age,
    stage: state.stage,
    clubId: state.clubId,
    pending: state.pending,
    injury: state.injury,
    salary: state.salary,
    wealth: state.wealth,
    flags: state.flags,
    memory: state.memory,
    careerMode: state.careerMode,
    careerSeed: state.careerSeed,
  };
}

async function createCareerAtAgreement(page) {
  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Exact Recovery");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "qa-player.png",
    mimeType: "image/png",
    buffer: QA_PLAYER_PNG,
  });
  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);

  await page.getByRole("button", { name: "Decir que no darás ningún paso sin hablarlo en casa" }).click();
  await page.getByRole("button", { name: "Siguiente escena" }).click();
  await page.getByRole("button", { name: "Trabajar con un representante profesional" }).click();
  await expect(page).toHaveURL(/\/cantera\/?$/);
  const offers = page.locator("ul > li > button");
  await expect(offers).toHaveCount(4);
  await offers.first().click();
  await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "No firmas hasta entenderlo" })).toBeVisible();
}

test("iPhone WebKit restores the exact last good backup after primary JSON corruption", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await createCareerAtAgreement(page);

  const primaryBefore = await readSlot(page, SAVE_KEY);
  const backupBefore = await readSlot(page, BACKUP_KEY);
  expect(primaryBefore).toBeTruthy();
  expect(backupBefore).toBeTruthy();
  expect(recoverySnapshot(primaryBefore)).toEqual(recoverySnapshot(backupBefore));
  expect(backupBefore.player.avatar).toMatch(/^data:image\//);
  expect(backupBefore.pending?.type).toBe("event");
  expect(backupBefore.pending?.eventId).toBe("opening_first_agreement");

  const expected = recoverySnapshot(backupBefore);
  await page.evaluate((key) => localStorage.setItem(key, "{corrupt-primary-save"), SAVE_KEY);
  await page.reload();

  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "No firmas hasta entenderlo" })).toBeVisible();
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);

  await expect.poll(async () => {
    try {
      const state = await readSlot(page, SAVE_KEY);
      return state ? recoverySnapshot(state) : null;
    } catch {
      return null;
    }
  }).toEqual(expected);

  const primaryAfter = await readSlot(page, SAVE_KEY);
  const backupAfter = await readSlot(page, BACKUP_KEY);
  expect(recoverySnapshot(primaryAfter)).toEqual(expected);
  expect(recoverySnapshot(backupAfter)).toEqual(expected);
  expect(recoverySnapshot(primaryAfter)).toEqual(recoverySnapshot(backupAfter));
  expect(primaryAfter.player.name).toBe("Jugador QA Exact Recovery");
  expect(primaryAfter.player.avatar).toMatch(/^data:image\//);
  expect(pageErrors).toEqual([]);
});
