import { plausibleMoneyScale } from "../src/game/career-life";
import { createGame } from "../src/game/engine";
import { ensureFinance, moneyCard } from "../src/game/finance";
import { moneyOfferAllowed, sponsorshipAllowed } from "../src/game/money-gating";
import type { GameState, Player } from "../src/game/types";

const player: Player = {
  name: "QA Prospect",
  nickname: "",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["ambicioso", "familiar"],
};

const allowedByScale: Record<ReturnType<typeof plausibleMoneyScale>, Set<string>> = {
  youth: new Set(["piso_alquiler"]),
  pro: new Set(["piso_alquiler", "coche", "piso_propio", "ayuda_familia", "fondo"]),
  star: new Set(["piso_alquiler", "coche", "piso_propio", "ayuda_familia", "negocio_amigo", "casa_grande", "coche_absurdo", "restaurante", "fondo"]),
  superstar: new Set(["piso_alquiler", "coche", "piso_propio", "ayuda_familia", "negocio_amigo", "casa_grande", "mansion", "coche_absurdo", "restaurante", "fondo"]),
};

const firstTeamOnly = new Set(["negocio_amigo", "casa_grande", "mansion", "coche_absurdo", "restaurante"]);

function richState(age: number, overall: number, fame: number): GameState {
  const s = createGame(player);
  s.age = age;
  s.overall = overall;
  s.fame = fame;
  s.stage = age <= 18 ? "youth" : "first";
  s.clubId = "betis";
  s.sceneCount = 100;
  s.salary = age <= 18 ? 6 : age <= 21 ? 180 : age <= 25 ? 900 : 2500;
  const f = ensureFinance(s);
  f.cash = 10_000;
  f.sponsorName = "QA"; // isolate property/lifestyle offers from sponsorship branch
  f.lastOfferScene = -99;
  f.properties = [{ name: "QA property", value: 1000, debt: 0 }];
  return s;
}

const scenarios = [
  { age: 16, overall: 95, fame: 99 }, // even an exceptional minor must still live like a minor
  { age: 19, overall: 74, fame: 35 },
  { age: 23, overall: 84, fame: 78 },
  { age: 28, overall: 91, fame: 92 },
];

const originalRandom = Math.random;
try {
  // Use deterministic rolls that force an offer and walk different candidate indexes.
  const rolls = [0.36, 0.42, 0.51, 0.63, 0.74, 0.86, 0.97];
  for (const scenario of scenarios) {
    const base = richState(scenario.age, scenario.overall, scenario.fame);
    const scale = plausibleMoneyScale(base);
    for (const roll of rolls) {
      const state = structuredClone(base);
      Math.random = () => roll;
      const card = moneyCard(state);
      if (!card) continue;
      if (card.kind !== "money") throw new Error(`unexpected non-money card ${card.kind}`);
      const offer = String(card.data["offer"] ?? "");
      if (offer === "patrocinio") continue;
      if (!allowedByScale[scale].has(offer)) {
        throw new Error(`${scenario.age}yo/${scale}: implausible Life/Patrimony offer leaked: ${offer}`);
      }
      if (!moneyOfferAllowed(state, offer)) {
        throw new Error(`${scenario.age}yo/${scale}: runtime emitted offer rejected by canonical gate: ${offer}`);
      }
      if (scenario.age < 18 && offer === "coche") {
        throw new Error(`${scenario.age}yo: first-car purchase leaked before adult driving age`);
      }
    }
  }

  // A reserve player can have unusually high overall/fame or accumulated cash,
  // but that must not make the game narrate an established first-team lifestyle.
  const reserve = richState(24, 93, 99);
  reserve.stage = "reserves";
  reserve.salary = 450;
  const reserveFinance = ensureFinance(reserve);
  reserveFinance.cash = 20_000;
  reserveFinance.sponsorName = "QA";
  reserveFinance.lastOfferScene = -99;
  for (const offer of firstTeamOnly) {
    if (moneyOfferAllowed(reserve, offer)) {
      throw new Error(`24yo reserves: first-team-only Life/Patrimony offer incorrectly allowed: ${offer}`);
    }
  }
  for (const roll of rolls) {
    const state = structuredClone(reserve);
    Math.random = () => roll;
    const card = moneyCard(state);
    if (!card || card.kind !== "money") continue;
    const offer = String(card.data["offer"] ?? "");
    if (firstTeamOnly.has(offer)) {
      throw new Error(`24yo reserves: moneyCard leaked first-team-only offer: ${offer}`);
    }
  }

  // Sponsorship is part of the same chronology problem: fame alone must never
  // turn a 16-year-old youth player into a commercial star.
  for (const age of [16, 17, 18]) {
    const youth = richState(age, 96, 99);
    youth.stage = "youth";
    const finance = ensureFinance(youth);
    finance.sponsorName = null;
    finance.lastOfferScene = -99;
    Math.random = () => 0.1; // would force the sponsorship branch without the gate
    if (sponsorshipAllowed(youth)) throw new Error(`${age}yo youth: sponsorship gate incorrectly opened`);
    const card = moneyCard(youth);
    if (card?.kind === "money" && String(card.data["offer"] ?? "") === "patrocinio") {
      throw new Error(`${age}yo youth: sponsorship leaked through moneyCard`);
    }
  }
} finally {
  Math.random = originalRandom;
}

console.log("Money/Life chronology QA OK: lifestyle, patrimony and sponsorship respect age/status/team-level chronology.");
