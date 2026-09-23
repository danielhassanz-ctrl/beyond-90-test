import assert from "node:assert/strict";
import { milestoneVisualSpec } from "../src/game/milestone-visual";
import type { ShareData } from "../src/game/types";

function classify(headline: string) {
  const share: ShareData = { headline, kicker: "Carrera", lines: [] };
  return milestoneVisualSpec(share);
}

const nonCareer = [
  "Retirada por lesión en el minuto 34",
  "Retirada de efectivo antes de comprar el coche",
  "El rival se retira del partido",
  "Oferta de retirada anticipada del mercado",
];

for (const headline of nonCareer) {
  const result = classify(headline);
  assert.equal(result.kind, "career", headline);
  assert.equal(result.scene, "portrait", headline);
}

const confirmed = [
  "Cuelgas las botas tras tu último partido",
  "Tu despedida del fútbol profesional",
  "Fin de carrera: te retiras del fútbol",
  "Retirada definitiva del fútbol profesional",
];

for (const headline of confirmed) {
  const result = classify(headline);
  assert.equal(result.kind, "retirement", headline);
  assert.equal(result.scene, "farewell", headline);
}

console.log("milestone retirement classifier smoke: OK");
