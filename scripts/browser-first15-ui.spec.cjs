const { test, expect, devices } = require("@playwright/test");

const BASE_URL = (process.env.TEST_BASE_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const routeUrl = (route = "") => new URL(route.replace(/^\//, ""), BASE_URL).toString();
const SAVE_KEY = "beyond90:save:v1";
const QA_PLAYER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test.use({ ...devices["iPhone 13"] });

const norm = (text) => text
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9 ]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

async function savedState(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, SAVE_KEY);
}

async function startStandardCareer(page) {
  await page.goto(routeUrl());
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Nueva carrera" }).click();
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA First15 UI");
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.getByRole("button", { name: /^Standard/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "qa-player.png",
    mimeType: "image/png",
    buffer: QA_PLAYER_PNG,
  });
  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);
}

async function visibleScene(page) {
  const article = page.locator("article").first();
  await expect(article).toBeVisible();
  const title = (await article.locator("h2").first().innerText()).trim();
  const text = (await article.locator(".p-4").first().innerText()).trim();
  return { article, title, text };
}

async function choiceLabels(article) {
  const labels = [];
  const buttons = article.locator("button");
  for (let i = 0; i < await buttons.count(); i += 1) {
    const label = (await buttons.nth(i).innerText()).trim();
    if (!label || /^(Responder|Siguiente escena|Avanzar|Nueva temporada|Salir al campo|Ver el partido|Seguir el partido)$/i.test(label)) continue;
    labels.push(label);
  }
  return labels;
}

function assertNewDecision(seen, decision) {
  const titleKey = norm(decision.title);
  expect(titleKey, `empty title at decision ${seen.length + 1}`).not.toBe("");
  expect(seen.some((item) => norm(item.title) === titleKey), `repeated UI title: ${decision.title}`).toBeFalsy();
  if (decision.choices.length >= 3) {
    const triple = decision.choices.slice(0, 3).map(norm).join("|");
    expect(seen.some((item) => item.choices.length >= 3 && item.choices.slice(0, 3).map(norm).join("|") === triple), `repeated UI choice triple: ${decision.choices.join(" / ")}`).toBeFalsy();
  }
  expect(/match_flash/i.test(`${decision.title} ${decision.text}`), `match_flash leaked into UI: ${decision.title}`).toBeFalsy();
  seen.push(decision);
}

async function clickOutcomeOrAdvance(page) {
  for (const name of ["Siguiente escena", "Nueva temporada", "Avanzar", "Seguir el partido"]) {
    const button = page.getByRole("button", { name, exact: true });
    if (await button.count()) {
      await button.first().click();
      return true;
    }
  }
  return false;
}

test("iPhone WebKit really plays the first 15 decisions through the shipped UI", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await startStandardCareer(page);

  const seen = [];
  let guard = 0;
  let reloadedAtEight = false;

  while (seen.length < 15 && guard++ < 160) {
    if (/\/cantera\/?$/.test(page.url())) {
      const title = (await page.getByRole("heading", { name: "Ahora sí: cuatro caminos" }).innerText()).trim();
      const clubButtons = page.locator("ul > li > button");
      await expect(clubButtons).toHaveCount(4);
      const choices = await clubButtons.allInnerTexts();
      assertNewDecision(seen, { title, text: "Selección del primer club", choices });
      await clubButtons.first().click();
      await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
      await expect(page).toHaveURL(/\/historia\/?$/);
      continue;
    }

    const state = await savedState(page);
    expect(state, "save disappeared during first-15 UI playthrough").toBeTruthy();
    expect(state.pending?.kind, "playable match_flash reached saved UI state").not.toBe("match_flash");
    if (state.injury && state.pending?.type === "match") {
      throw new Error(`injured player received present-tense match UI at decision ${seen.length + 1}`);
    }

    if (state.lastOutcome || !state.pending || state.pending.type === "season") {
      if (await clickOutcomeOrAdvance(page)) continue;
    }

    if (state.pending?.type === "match") {
      const entry = page.getByRole("button", { name: /^(Salir al campo|Ver el partido)$/ });
      await expect(entry).toBeVisible();
      await entry.click();
      if (state.pending.match?.keyMoment && state.pending.match.minutes > 0) {
        const scene = await visibleScene(page);
        const choices = await choiceLabels(scene.article);
        expect(choices.length, `missing key-moment choices for ${scene.title}`).toBeGreaterThan(0);
        assertNewDecision(seen, { title: `${state.pending.match.ctx.storyLabel} · ${scene.title}`, text: scene.text, choices });
        await scene.article.locator("button").filter({ hasText: choices[0] }).first().click();
      }
      continue;
    }

    if (state.pending?.type === "event" || state.pending?.type === "dynamic") {
      const scene = await visibleScene(page);
      const choices = await choiceLabels(scene.article);
      expect(choices.length, `missing playable choices for ${scene.title}`).toBeGreaterThan(0);
      assertNewDecision(seen, { title: scene.title, text: scene.text, choices });
      await scene.article.locator("button").filter({ hasText: choices[0] }).first().click();
    } else {
      throw new Error(`unsupported first-15 UI state: ${JSON.stringify(state.pending)}`);
    }

    if (seen.length >= 8 && !reloadedAtEight && /\/historia\/?$/.test(page.url())) {
      const before = await savedState(page);
      await page.reload();
      await expect(page.getByText("Cargando carrera…")).toHaveCount(0);
      const after = await savedState(page);
      expect(after.player.name).toBe(before.player.name);
      expect(after.careerMode).toBe("standard");
      expect(after.player.avatar).toBe(before.player.avatar);
      expect(after.beat).toBe(before.beat);
      expect(after.age).toBe(before.age);
      reloadedAtEight = true;
    }
  }

  expect(seen, `only ${seen.length} playable decisions reached through UI`).toHaveLength(15);
  expect(reloadedAtEight, "first-15 path never proved save/reload continuity").toBeTruthy();
  expect(pageErrors).toEqual([]);
  console.log(seen.map((item, index) => `${index + 1}. ${item.title}`).join("\n"));
});
