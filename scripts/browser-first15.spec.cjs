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
  seen.push({ title, text, choices: labels, pending: state.pending });
  await article.locator(".space-y-2\\.5 > button").first().click();
}

async function playFirst15(page) {
  const seen = [];
  let guard = 0;

  while (seen.length < 15 && guard++ < 180) {
    if (/\/cantera\/?$/.test(page.url())) {
      await expect(page.getByRole("heading", { name: "Ahora sí: cuatro caminos" })).toBeVisible();
      const offers = page.locator("ul > li > button");
      await expect(offers).toHaveCount(4);
      const labels = (await offers.allTextContents()).map((x) => x.trim());
      seen.push({ title: "Ahora sí: cuatro caminos", text: labels.join(" | "), choices: labels, pending: { type: "club_choice" } });
      await offers.first().click();
      await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
      await expect(page).toHaveURL(/\/historia\/?$/);
      continue;
    }

    await expect(page).toHaveURL(/\/historia\/?$/);
    const state = await savedState(page);

    if (state.lastOutcome) {
      await page.getByRole("button", { name: "Siguiente escena" }).click();
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
  }
}

test("iPhone WebKit plays the first 15 decisions through the shipped UI without repetition or injury contradictions", async ({ page }) => {
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
