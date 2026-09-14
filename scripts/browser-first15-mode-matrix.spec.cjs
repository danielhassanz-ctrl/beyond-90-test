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

function castSnapshot(state) {
  const cast = state.memory?.careerCast;
  if (!cast) return null;
  const read = (key) => cast[key]?.name || null;
  return {
    adviser: read("adviser"),
    coach: read("coach"),
    captain: read("captain"),
    physio: read("physio"),
    teammate: read("teammate"),
    social: read("social"),
    partner: read("partner"),
    clubScope: cast.clubScope || state.clubId || "",
  };
}

function chronologySnapshot(state) {
  return {
    age: Number(state.age),
    stage: state.stage,
    clubId: state.clubId || "",
    salary: Number(state.salary || 0),
    wealth: Number(state.wealth || 0),
    overall: Number(state.overall || 0),
    fame: Number(state.fame || 0),
    injured: Boolean(state.injury),
    openingCompleted: state.flags?.opening_completed === 1,
    cast: castSnapshot(state),
  };
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
  await expect(page).toHaveURL(/\/onboarding\/?$/);
  await page.getByPlaceholder("Álvaro Nieto").fill(`QA ${mode} ${seed}`);
  await page.getByRole("button", { name: /Ambicioso/ }).click();
  await page.getByRole("button", { name: /Leal/ }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "qa-player.png", mimeType: "image/png", buffer: QA_PLAYER_PNG });

  const modeLabel = { express: "Express", standard: "Standard", pro: "Pro" }[mode];
  const modeButton = page.getByRole("button", { name: new RegExp(`^${modeLabel}\\b`, "i") });
  await expect(modeButton).toBeVisible();
  await modeButton.click();

  await page.getByRole("button", { name: "Empezar tu historia" }).click();
  await expect(page).toHaveURL(/\/historia\/?$/);

  const initial = await savedState(page);
  expect(initial.careerMode, `${mode}/${seed}: onboarding UI did not persist selected mode`).toBe(mode);
  expect(initial.player.avatar, `${mode}/${seed}: avatar lost at career start`).toMatch(/^data:image\//);

  await page.reload();
  await expect(page).toHaveURL(/\/historia\/?$/);
  expect((await savedState(page)).careerMode, `${mode}/${seed}: selected mode changed after reload`).toBe(mode);
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
      const state = await savedState(page);
      seen.push({ title: "Ahora sí: cuatro caminos", text: labels.join(" | "), choices: labels, family: "club_choice", competition: null, ...chronologySnapshot(state) });
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
      seen.push({ title, text, choices, family: familyOf(state), competition: null, ...chronologySnapshot(state) });
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
        seen.push({ title: `Jugada clave · ${pending.match.ctx.storyLabel} · ${pending.match.opponent}`, text, choices, family: "match", competition: pending.match.ctx.competition || pending.match.competition || null, ...chronologySnapshot(state), injured: false });
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

function assertChronology(seen, mode, seed) {
  let adviserName = null;
  const clubCast = new Map();
  const eliteLeak = /bal[oó]n de oro|champions|selecci[oó]n absoluta|contrato millonario|salario millonario|cobra(?:s)? millones/i;
  const seniorCompetition = /champions|europa league|conference|copa del rey|supercopa/i;

  for (const item of seen) {
    expect(Number.isFinite(item.age), `${mode}/${seed}: invalid age`).toBeTruthy();
    expect(item.age, `${mode}/${seed}: age regressed below career start`).toBeGreaterThanOrEqual(16);
    expect(Number.isFinite(item.salary), `${mode}/${seed}: invalid salary`).toBeTruthy();
    expect(item.salary, `${mode}/${seed}: negative salary`).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(item.wealth), `${mode}/${seed}: invalid wealth`).toBeTruthy();
    expect(item.wealth, `${mode}/${seed}: negative wealth`).toBeGreaterThanOrEqual(0);
    expect(item.overall, `${mode}/${seed}: impossible overall`).toBeGreaterThanOrEqual(40);
    expect(item.overall, `${mode}/${seed}: impossible overall`).toBeLessThanOrEqual(99);
    expect(item.fame, `${mode}/${seed}: impossible fame`).toBeGreaterThanOrEqual(0);
    expect(item.fame, `${mode}/${seed}: impossible fame`).toBeLessThanOrEqual(100);

    if (item.age <= 17) {
      expect(eliteLeak.test(`${item.title} ${item.text}`), `${mode}/${seed}: elite/status leakage at ${item.age}: ${item.title}`).toBeFalsy();
      if (item.stage === "youth" || item.stage === "reserves") {
        expect(seniorCompetition.test(String(item.competition || "")), `${mode}/${seed}: ${item.stage} player in senior competition ${item.competition}`).toBeFalsy();
      }
    }

    if (item.cast) {
      if (item.openingCompleted && item.cast.adviser) {
        if (adviserName === null) adviserName = item.cast.adviser;
        else expect(item.cast.adviser, `${mode}/${seed}: adviser drift ${adviserName} -> ${item.cast.adviser}`).toBe(adviserName);
      }

      if (item.openingCompleted && item.clubId) {
        const key = item.clubId;
        const stable = {
          coach: item.cast.coach,
          captain: item.cast.captain,
          physio: item.cast.physio,
          teammate: item.cast.teammate,
        };
        if (!clubCast.has(key)) clubCast.set(key, stable);
        else {
          const prior = clubCast.get(key);
          for (const role of ["coach", "captain", "physio", "teammate"]) {
            if (prior[role] && stable[role]) expect(stable[role], `${mode}/${seed}: ${role} drift at ${key}: ${prior[role]} -> ${stable[role]}`).toBe(prior[role]);
          }
        }
      }

      if (item.cast.social && item.cast.partner) {
        expect(item.cast.social, `${mode}/${seed}: partner/social identity collision`).not.toBe(item.cast.partner);
      }
    }
  }
}

function assertQuality(seen, mode, seed) {
  const titles = new Set();
  const triples = new Set();
  const families = new Set(seen.map((item) => item.family));
  expect(families.size, `${mode}/${seed}: insufficient UI decision-family diversity (${[...families].join(", ")})`).toBeGreaterThanOrEqual(5);

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
      const threeSameFamily = seen[i - 2].family === current.family && seen[i - 1].family === current.family;
      expect(threeSameFamily, `${mode}/${seed}: >2 consecutive ${current.family}`).toBeFalsy();
    }
  }

  assertChronology(seen, mode, seed);
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
    expect(state.careerMode, `${mode}/${seed}: selected mode drifted by decision 15`).toBe(mode);
    expect(pageErrors).toEqual([]);
  });
}
