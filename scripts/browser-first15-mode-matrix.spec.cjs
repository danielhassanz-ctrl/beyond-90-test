const { test, expect, devices } = require("@playwright/test");

const BASE_URL = (process.env.TEST_BASE_URL || "http://127.0.0.1:4173/").replace(/\/?$/, "/");
const routeUrl = (route = "") => new URL(route.replace(/^\//, ""), BASE_URL).toString();
const SAVE_KEY = "beyond90:save:v1";
const QA_PLAYER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

test.use({ ...devices["iPhone 13"] });
test.describe.configure({ mode: "serial" });

const CASES = [
  ["express", 101], ["express", 2026], ["express", 31337], ["express", 90909],
  ["standard", 100101], ["standard", 102026], ["standard", 131337], ["standard", 190909],
  ["pro", 200101], ["pro", 202026], ["pro", 231337], ["pro", 290909],
];

function norm(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
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

async function startCareer(page, seed, mode) {
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
  await page.getByPlaceholder("Álvaro Nieto").fill(`QA ${mode} ${seed}`);
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "qa-player.png", mimeType: "image/png", buffer: QA_PLAYER_PNG });
  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);

  // The shipped UI currently starts in Standard. Override only the persisted
  // career-mode field, then reload through the same production hydration path.
  await page.evaluate(({ key, modeValue }) => {
    const raw = localStorage.getItem(key);
    if (!raw) throw new Error("save missing before mode override");
    const state = JSON.parse(raw);
    state.careerMode = modeValue;
    localStorage.setItem(key, JSON.stringify(state));
  }, { key: SAVE_KEY, modeValue: mode });
  await page.reload();
  await expect(page).toHaveURL(/\/historia\/?$/);
  expect((await savedState(page)).careerMode).toBe(mode);
}

function familyOf(state) {
  const p = state.pending;
  if (!p) return "none";
  if (p.type === "match") return "match";
  if (p.type === "event") return `event:${p.eventId}`;
  if (p.type === "dynamic") {
    if (p.kind === "arc") return `arc:${String(p.data?.arcId || "unknown")}`;
    if (p.kind === "thread") return `thread:${String(p.data?.threadKind || "unknown")}`;
    if (p.kind === "arc_callback") return "callback";
    if (p.kind === "arc_beat") {
      const id = String(p.data?.beatId || "unknown");
      if (id.startsWith("beat_pos_")) return "beat:position";
      if (id.includes("pretemporada")) return "beat:preseason";
      if (id.startsWith("beat_early_")) return "beat:early-life";
      if (id.startsWith("beat_lane_")) return "beat:origin-lane";
      return `beat:${id}`;
    }
    return `dynamic:${p.kind}`;
  }
  return p.type;
}

async function playFirst15(page, mode, seed) {
  const seen = [];
  let guard = 0;

  while (seen.length < 15 && guard++ < 220) {
    if (/\/cantera\/?$/.test(page.url())) {
      const offers = page.locator("ul > li > button");
      await expect(offers).toHaveCount(4);
      const labels = (await offers.allTextContents()).map((x) => x.trim());
      seen.push({ title: "Ahora sí: cuatro caminos", text: labels.join(" | "), choices: labels, family: "club_choice" });
      await offers.first().click();
      await page.getByRole("button", { name: "Sentarnos a negociar con este club" }).click();
      await expect(page).toHaveURL(/\/historia\/?$/);
      continue;
    }

    await expect(page).toHaveURL(/\/historia\/?$/);
    const state = await savedState(page);
    expect(state.careerMode, `${mode}/${seed}: career mode drift`).toBe(mode);

    if (state.lastOutcome) {
      const continueMatch = page.getByRole("button", { name: "Seguir el partido" });
      if (await continueMatch.isVisible()) await continueMatch.click();
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
      expect(pending.kind, `${mode}/${seed}: match_flash reached playable UI`).not.toBe("match_flash");
      const article = page.locator("article");
      await expect(article).toBeVisible();
      const title = (await article.locator("h2").first().innerText()).trim();
      const text = (await article.innerText()).trim();
      const choices = (await article.locator(".space-y-2\\.5 > button").allTextContents()).map((x) => x.trim()).filter(Boolean);
      seen.push({ title, text, choices, family: familyOf(state), injured: Boolean(state.injury) });
      await article.locator(".space-y-2\\.5 > button").first().click();
      continue;
    }

    if (pending.type === "match") {
      if (state.injury && pending.match.minutes > 0) throw new Error(`${mode}/${seed}: injured player received on-field match vs ${pending.match.opponent}`);
      const play = page.getByRole("button", { name: /Salir al campo|Ver el partido/ });
      await expect(play).toBeVisible();
      if (pending.match.keyMoment && pending.match.minutes > 0) {
        await play.click();
        await expect(page.getByRole("heading", { name: "Jugada clave" })).toBeVisible();
        const article = page.locator("article");
        const text = (await article.innerText()).trim();
        const choices = (await article.locator(".space-y-2\\.5 > button").allTextContents()).map((x) => x.trim()).filter(Boolean);
        seen.push({ title: `Jugada clave · ${pending.match.ctx.storyLabel} · ${pending.match.opponent}`, text, choices, family: "match", injured: false });
        await article.locator(".space-y-2\\.5 > button").first().click();
      } else {
        await play.click();
      }
      continue;
    }

    throw new Error(`${mode}/${seed}: unknown pending ${JSON.stringify(pending)}`);
  }

  expect(seen.length, `${mode}/${seed}: only ${seen.length} UI decisions`).toBe(15);
  return seen;
}

function assertQuality(seen, mode, seed) {
  const titles = new Set();
  const triples = new Set();
  for (let i = 0; i < seen.length; i++) {
    const current = seen[i];
    const titleKey = norm(current.title);
    expect(titles.has(titleKey), `${mode}/${seed}: repeated title ${current.title}`).toBeFalsy();
    titles.add(titleKey);

    if (current.choices.length >= 3) {
      const triple = current.choices.map(norm).join("|");
      expect(triples.has(triple), `${mode}/${seed}: repeated choice triple ${current.choices.join(" / ")}`).toBeFalsy();
      triples.add(triple);
    }

    for (let j = 0; j < i; j++) {
      if (current.text.length > 80 && seen[j].text.length > 80) {
        expect(similarity(current.text, seen[j].text), `${mode}/${seed}: near-duplicate ${seen[j].title} -> ${current.title}`).toBeLessThan(0.86);
      }
    }

    if (i >= 2) {
      expect(!(seen[i - 2].family === current.family && seen[i - 1].family === current.family), `${mode}/${seed}: >2 consecutive ${current.family}`).toBeFalsy();
    }
  }
}

for (const [mode, seed] of CASES) {
  test(`iPhone WebKit first-15 ${mode}/${seed}`, async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await startCareer(page, seed, mode);
    const seen = await playFirst15(page, mode, seed);
    assertQuality(seen, mode, seed);
    const state = await savedState(page);
    expect(state.player.avatar).toMatch(/^data:image\//);
    expect(state.flags.opening_completed).toBe(1);
    expect(pageErrors).toEqual([]);
  });
}
