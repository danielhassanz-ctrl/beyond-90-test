import assert from "node:assert/strict";
import { milestoneVisualSpec } from "../src/game/milestone-visual";
import type { ShareData } from "../src/game/types";

function classify(headline: string) {
  const share: ShareData = { headline, kicker: "Mercado de verano", lines: [] };
  return milestoneVisualSpec(share);
}

const speculative = [
  "Oferta del Villarreal para tu fichaje",
  "El Sevilla muestra interés en tu fichaje",
  "Negociación abierta para tu traspaso al Valencia",
  "Rumor: posible fichaje por el Atlético",
  "Opción de cesión al Zaragoza",
  "Podrías ser cedido al Málaga",
  "El mercado estudia un posible cambio de club",
];

for (const headline of speculative) {
  const result = classify(headline);
  assert.equal(result.kind, "career", headline);
  assert.equal(result.scene, "portrait", headline);
}

const confirmed = [
  "Fichas por el Villarreal",
  "Fichado por el Valencia",
  "Traspasado al Sevilla",
  "Cambio de club: nuevo jugador del Málaga",
  "Presentación como nuevo jugador en el Zaragoza",
  "Firmas por el Real Betis",
];

for (const headline of confirmed) {
  const result = classify(headline);
  assert.equal(result.kind, "signing", headline);
  assert.equal(result.scene, "presentation", headline);
}

console.log("milestone signing classifier smoke: OK");
