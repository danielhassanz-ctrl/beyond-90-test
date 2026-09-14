const { test, expect, devices } = require("@playwright/test");

const BASE_URL = (process.env.TEST_BASE_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const routeUrl = (route = "") => new URL(route.replace(/^\//, ""), BASE_URL).toString();
const SAVE_KEY = "beyond90:save:v1";
const QA_PLAYER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test.use({ ...devices["iPhone 13"] });

function norm(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function similarity(a, b) {
  const A = new Set(norm(a).split(" ").filter((x) => x.length > 3));
  const B = new Set(norm(b).split(" ").filter((x) => x.length > 3));
  if (!A.size || !B.size) return 0;
  let hits = 0;
  for (const token of A) if (B.has(token)) hits += 1;
  return hits / Math.min(A.size, B.size);
}

async function savedState(page) {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error("missing Beyond 90 save");
    return JSON.parse(raw);
  }, SAVE_KEY);
}

function stateSnapshot(state) {
  const cast = state.memory?.careerCast;
  return {
    age: state.age,
    stage: state.stage,
    clubId: state.clubId || "",
    salary: state.salary,
    wealth: state.wealth,
    injury: state.injury?.label || null,
    cast: cast
      ? {
          adviser: cast.adviser?.name || "",
          coach: cast.coach?.name || "",
          captain: cast.captain?.name || "",
          physio: cast.physio?.name || "",
          teammate: cast.teammate?.name || "",
          social: cast.social?.name || "",
          partner: cast.partner?.name || "",
        }
      : null,
  };
}

async function startDeterministicCareer(page, seed) {
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
  await page.getByPlaceholder("Álvaro Nieto").fill("Jugador QA First15 UI");
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
}

async function captureChoiceScene(page, state, seen) {
  const article = page.locator("article");
  await expect(article).toBeVisible();
  const title = (await article.locator("h2").first().innerText()).trim();
  const text = (await article.innerText()).trim();
  const choices = await article.locator(".space-y-2\\.5 > button").allTextContents();
  const labels = choices.map((choice) => choice.trim()).filter(Boolean);
  expect(labels.length, `no choices rendered for ${state.pending?.type}:${state.pending?.eventId || state.pending?.kind || "unknown"}`).toBeGreaterThan(0);
  seen.push({ title, text, choices: labels, pending: state.pending, state: stateSnapshot(state) });
  await article.locator(".space-y-2\\.5 > button").first().click();
}

async function playFirst15(page) {
  const seen = [];
  let guard = 0;

  while (seen.length < 15 && guard++ < 180) {
    if (/\/cantera\/?$/.test(page.url())) {
      await expect(page.getByRole("heading", { name: "Ahora sí: cuatro caminos" })).toBeVisible();
      const state = await savedState(page);
      const offers = page.locator("ul > li > button");
      await expect(offers).toHaveCount(4);
      const labels = (await offers.allTextContents()).map((x) => x.trim());
      seen.push({
        title: "Ahora sí: cuatro caminos",
        text: labels.join(" | "),
        choices: labels,
        pending: { type: "club_choice" },
        state: stateSnapshot(state),
      });
      await offers.first().click();
      await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
      await expect(page).toHaveURL(/\/historia\/?$/);
      continue;
    }

    await expect(page).toHaveURL(/\/historia\/?$/);
    const state = await savedState(page);

    if (state.lastOutcome) {
      const continueMatch = page.getByRole("button", { name: "Seguir el partido" });
      if (await continueMatch.isVisible()) {
        await continueMatch.click();
      }
      const nextScene = page.getByRole("button", { name: "Siguiente escena" });
      await expect(nextScene).toBeVisible();
      await nextScene.click();
      continue;
    }

    const pending = state.pending;
    if (!pending) {
      await page.getByRole("button", { name: "Avanzar" }).click();
      continue;
    }

    if (pending.type === "season") {
      await page.getByRole("button", { name: "Nueva temporada" }).click();
      continue;
    }

    if (pending.type === "event" || pending.type === "dynamic") {
      expect(pending.kind, "generic match_flash must never reach the playable UI").not.toBe("match_flash");
      await captureChoiceScene(page, state, seen);
      continue;
    }

    if (pending.type === "match") {
      if (state.injury && pending.match.minutes > 0) {
        throw new Error(`injury/on-field contradiction in UI: ${state.injury.label} but ${pending.match.minutes} minutes vs ${pending.match.opponent}`);
      }

      const play = page.getByRole("button", { name: /Salir al campo|Ver el partido/ });
      await expect(play).toBeVisible();
      if (pending.match.keyMoment && pending.match.minutes > 0) {
        await play.click();
        await expect(page.getByRole("heading", { name: "Jugada clave" })).toBeVisible();
        const article = page.locator("article");
        const choices = (await article.locator(".space-y-2\\.5 > button").allTextContents()).map((x) => x.trim()).filter(Boolean);
        const prompt = (await article.innerText()).trim();
        seen.push({
          title: `Jugada clave · ${pending.match.ctx.storyLabel} · ${pending.match.opponent}`,
          text: prompt,
          choices,
          pending,
          state: stateSnapshot(state),
        });
        await article.locator(".space-y-2\\.5 > button").first().click();
      } else {
        await play.click();
      }
      continue;
    }

    throw new Error(`unknown pending card in UI: ${JSON.stringify(pending)}`);
  }

  expect(seen.length, `only ${seen.length} playable decisions reached through the UI`).toBe(15);
  return seen;
}

function assertFirst15Quality(seen) {
  const titles = new Set();
  const triples = new Set();
  let personalCast = null;
  const clubCast = new Map();

  for (let i = 0; i < seen.length; i++) {
    const current = seen[i];
    const titleKey = norm(current.title);
    expect(titles.has(titleKey), `repeated UI title: ${current.title}`).toBeFalsy();
    titles.add(titleKey);

    if (current.choices.length >= 3) {
      const triple = current.choices.map(norm).join("|");
      expect(triples.has(triple), `repeated UI choice triple: ${current.choices.join(" / ")}`).toBeFalsy();
      triples.add(triple);
    }

    for (let j = 0; j < i; j++) {
      const previous = seen[j];
      if (current.text.length > 80 && previous.text.length > 80) {
        expect(similarity(current.text, previous.text), `near-duplicate UI scene: ${previous.title} -> ${current.title}`).toBeLessThan(0.86);
      }
    }

    const snapshot = current.state;
    expect(Number.isFinite(snapshot.salary) && snapshot.salary >= 0, `impossible UI salary at decision ${i + 1}: ${snapshot.salary}`).toBeTruthy();
    if (typeof snapshot.wealth === "number") {
      expect(Number.isFinite(snapshot.wealth) && snapshot.wealth >= 0, `impossible UI wealth at decision ${i + 1}: ${snapshot.wealth}`).toBeTruthy();
    }

    if (snapshot.age <= 17) {
      expect(current.text, `elite/status copy leaked into UI at age ${snapshot.age}: ${current.title}`).not.toMatch(/bal[oó]n de oro|champions|selecci[oó]n absoluta|contrato millonario|salario millonario|cobra(?:s)? millones|arabia/i);
    }
    if (snapshot.stage === "youth" || snapshot.age <= 18) {
      expect(current.text, `money/status copy exceeds youth scale in UI: ${current.title}`).not.toMatch(/contrato millonario|salario millonario|cobra(?:s)? (?:varios )?millones|mansi[oó]n de \d+ millones|patrimonio de \d+ millones/i);
    }

    expect(snapshot.cast, `persistent cast missing from save at UI decision ${i + 1}`).toBeTruthy();
    expect(snapshot.cast.social, `social contact missing at UI decision ${i + 1}`).toBeTruthy();
    expect(snapshot.cast.partner, `partner missing at UI decision ${i + 1}`).toBeTruthy();
    expect(snapshot.cast.social, `social contact and partner collapsed at UI decision ${i + 1}`).not.toBe(snapshot.cast.partner);

    if (!personalCast) {
      personalCast = {
        adviser: snapshot.cast.adviser,
        social: snapshot.cast.social,
        partner: snapshot.cast.partner,
      };
    } else {
      expect(snapshot.cast.adviser, `adviser name drift at UI decision ${i + 1}`).toBe(personalCast.adviser);
      expect(snapshot.cast.social, `social-contact name drift at UI decision ${i + 1}`).toBe(personalCast.social);
      expect(snapshot.cast.partner, `partner name drift at UI decision ${i + 1}`).toBe(personalCast.partner);
    }

    if (snapshot.clubId) {
      const fixed = clubCast.get(snapshot.clubId);
      const currentClubCast = {
        coach: snapshot.cast.coach,
        captain: snapshot.cast.captain,
        physio: snapshot.cast.physio,
        teammate: snapshot.cast.teammate,
      };
      if (!fixed) clubCast.set(snapshot.clubId, currentClubCast);
      else {
        expect(currentClubCast.coach, `coach name drift at UI decision ${i + 1}`).toBe(fixed.coach);
        expect(currentClubCast.captain, `captain name drift at UI decision ${i + 1}`).toBe(fixed.captain);
        expect(currentClubCast.physio, `physio name drift at UI decision ${i + 1}`).toBe(fixed.physio);
        expect(currentClubCast.teammate, `teammate name drift at UI decision ${i + 1}`).toBe(fixed.teammate);
      }
    }
  }
}

test("iPhone WebKit plays the first 15 decisions through the shipped UI without repetition, chronology or persistent-cast contradictions", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await startDeterministicCareer(page, 451590);
  const seen = await playFirst15(page);
  assertFirst15Quality(seen);

  const finalState = await savedState(page);
  expect(finalState.player.avatar).toMatch(/^data:image\//);
  expect(finalState.flags.opening_completed).toBe(1);
  expect(pageErrors).toEqual([]);
});
