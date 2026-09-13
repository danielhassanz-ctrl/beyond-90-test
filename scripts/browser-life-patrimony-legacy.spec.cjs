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

async function startPersistedCareer(page) {
  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await expect(page).toHaveURL(/\/onboarding\/?$/);
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA Vida");
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
  const academyButtons = page.locator("ul > li > button");
  await expect(academyButtons).toHaveCount(4);
  await academyButtons.first().click();
  await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);
  await expect(page.getByRole("heading", { name: "No firmas hasta entenderlo" })).toBeVisible();
}

async function prepareIntegratedState(page) {
  await page.evaluate(([primaryKey, backupKey]) => {
    const raw = localStorage.getItem(primaryKey);
    if (!raw) throw new Error("missing persisted career");
    const state = JSON.parse(raw);
    const cast = state.memory?.careerCast;
    if (!cast?.coach || !cast?.captain || !cast?.physio || !cast?.partner) {
      throw new Error("persistent career cast missing from saved career");
    }

    Object.assign(cast.coach, { name: "Tomás Valera", relation: 96, role: "Entrenador", met: true });
    Object.assign(cast.captain, { name: "Iván Moya", relation: 84, role: "Capitán", met: true });
    Object.assign(cast.physio, { name: "Rubén Salas", relation: 79, role: "Fisioterapeuta", met: true });
    Object.assign(cast.partner, { name: "Lucía", relation: 90, role: "Pareja", met: true });
    state.flags.partner_active = 1;
    state.rel.coach = 96;
    state.rel.family = 82;
    state.salary = 480;
    state.finance = {
      cash: 1234,
      annualSalary: 480,
      bonuses: 25,
      sponsorName: "Adidas QA",
      sponsorIncome: 75,
      properties: [{ name: "Piso de Madrid QA", value: 700, debt: 200 }],
      commitments: [{ name: "Apoyo familiar QA", yearly: 25, seasonsLeft: 2 }],
      history: [{ season: "2026/27", text: "Cierre económico QA", amount: 320 }],
      lastOfferScene: -99,
      boughtIds: ["piso_propio"],
    };
    state.wealth = 1734;
    state.updatedAt = Math.max(Date.now(), Number(state.updatedAt || 0) + 10_000);
    const next = JSON.stringify(state);
    localStorage.setItem(primaryKey, next);
    localStorage.setItem(backupKey, next);
  }, [SAVE_KEY, BACKUP_KEY]);

  await page.reload();
  await expect(page.getByText("Cargando carrera…")).toHaveCount(0);
}

async function expectNoHorizontalOverflow(page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
}

test("iPhone WebKit keeps Life, Patrimony and Legacy connected through save reloads", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  await startPersistedCareer(page);
  await prepareIntegratedState(page);

  await page.getByRole("link", { name: "Vida", exact: true }).click();
  await expect(page).toHaveURL(/\/relaciones\/?$/);
  await expect(page.getByText("Tomás Valera", { exact: true })).toBeVisible();
  await expect(page.getByText("Iván Moya", { exact: true })).toBeVisible();
  await expect(page.getByText("Rubén Salas", { exact: true })).toBeVisible();
  await expect(page.getByText("Lucía", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.reload();
  await expect(page).toHaveURL(/\/relaciones\/?$/);
  await expect(page.getByText("Tomás Valera", { exact: true })).toBeVisible();
  await expect(page.getByText("Lucía", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Dinero", exact: true }).click();
  await expect(page).toHaveURL(/\/patrimonio\/?$/);
  await expect(page.getByText("1.734.000 €", { exact: true })).toBeVisible();
  await expect(page.getByText("Marca: Adidas QA", { exact: true })).toBeVisible();
  await expect(page.getByText("Piso de Madrid QA", { exact: true })).toBeVisible();
  await expect(page.getByText("Compraste tu primera vivienda.", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.reload();
  await expect(page).toHaveURL(/\/patrimonio\/?$/);
  await expect(page.getByText("1.734.000 €", { exact: true })).toBeVisible();
  await expect(page.getByText("Piso de Madrid QA", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Legado", exact: true }).click();
  await expect(page).toHaveURL(/\/legado\/?$/);
  await expect(page.getByText("Tomás Valera", { exact: true })).toBeVisible();
  await expect(page.getByText("Entrenador", { exact: true })).toBeVisible();
  await expect(page.getByText("96/100", { exact: true })).toBeVisible();
  await expect(page.getByText("1.734k €", { exact: true })).toBeVisible();
  await expect(page.getByText(/Marca que acompañó tu carrera:/)).toContainText("Adidas QA");
  await expectNoHorizontalOverflow(page);

  await page.reload();
  await expect(page).toHaveURL(/\/legado\/?$/);
  await expect(page.getByText("Tomás Valera", { exact: true })).toBeVisible();
  await expect(page.getByText("1.734k €", { exact: true })).toBeVisible();

  const persisted = await page.evaluate(([primaryKey, backupKey]) => {
    const primary = JSON.parse(localStorage.getItem(primaryKey));
    const backup = JSON.parse(localStorage.getItem(backupKey));
    return {
      primaryCoach: primary.memory.careerCast.coach.name,
      backupCoach: backup.memory.careerCast.coach.name,
      primarySponsor: primary.finance.sponsorName,
      backupSponsor: backup.finance.sponsorName,
    };
  }, [SAVE_KEY, BACKUP_KEY]);
  expect(persisted).toEqual({
    primaryCoach: "Tomás Valera",
    backupCoach: "Tomás Valera",
    primarySponsor: "Adidas QA",
    backupSponsor: "Adidas QA",
  });
  expect(pageErrors).toEqual([]);
});
