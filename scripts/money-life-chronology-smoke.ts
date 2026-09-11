import { plausibleMoneyScale } from "../src/game/career-life";
import { createGame } from "../src/game/engine";
import { ensureFinance, moneyCard } from "../src/game/finance";
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
      if (scenario.age < 18 && offer === "coche") {
        throw new Error(`${scenario.age}yo: first-car purchase leaked before adult driving age`);
      }
    }
  }
} finally {
  Math.random = originalRandom;
}

console.log("Money/Life chronology QA OK: lifestyle and patrimony offers respect age/status scale.");
