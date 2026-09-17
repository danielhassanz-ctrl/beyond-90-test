import assert from "node:assert/strict";
import { clubVisualIdentity } from "../src/game/club-identity.ts";

const expected: Record<string, [string, string]> = {
  betis: ["#0b7a3e", "#ffffff"],
  "real-madrid": ["#f4f4f4", "#1d2d5c"],
  barcelona: ["#004d98", "#a50044"],
  atletico: ["#d71920", "#ffffff"],
  villarreal: ["#ffe667", "#005187"],
};

for (const [clubId, [primary, secondary]] of Object.entries(expected)) {
  const identity = clubVisualIdentity(clubId);
  assert.equal(identity.primary, primary, `${clubId} must keep its configured milestone primary colour`);
  assert.equal(identity.secondary, secondary, `${clubId} must keep its configured milestone secondary colour`);
  assert.equal(identity.crestAsset, null, `${clubId} must not silently ship an uncleared official crest`);
}

console.log("club visual identity QA passed: milestone palettes are deterministic and official crest assets remain rights-gated");
