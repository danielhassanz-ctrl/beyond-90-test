import assert from "node:assert/strict";
import { milestoneVisualSpec } from "../src/game/milestone-visual";
import type { ShareData } from "../src/game/types";

const share = (headline: string): ShareData => ({
  headline,
  kicker: "Carrera",
  lines: [],
});

// A relative or social contact retiring must never turn the player's share card
// into a retirement milestone. Only the controlled player's own retirement is
// allowed to render the farewell treatment.
for (const headline of [
  "Tu padre anuncia su retirada",
  "Tu madre confirma el fin de su carrera",
  "Tu hermano se retira del fútbol",
  "Tu hermana cuelga las botas",
  "Tu pareja anuncia su retirada",
  "Tu novio confirma el fin de su carrera",
  "Tu novia se retira del fútbol",
  "Tu amigo cuelga las botas",
  "Tu amiga anuncia su retirada",
]) {
  assert.equal(milestoneVisualSpec(share(headline)).kind, "career", headline);
}

for (const headline of [
  "Anuncias tu retirada",
  "Te retiras del fútbol",
  "Cuelgas las botas",
]) {
  assert.equal(milestoneVisualSpec(share(headline)).kind, "retirement", headline);
}

console.log("milestone family-retirement guard smoke passed");
