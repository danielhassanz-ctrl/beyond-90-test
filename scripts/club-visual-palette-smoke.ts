import { CLUB_POOL, EURO_POOL } from "../src/game/clubs";
import { clubVisualIdentity } from "../src/game/club-identity";

const fallback = JSON.stringify({ primary: "#17181c", secondary: "#d4af37", text: "#ffffff" });
const missing: string[] = [];
const invalid: string[] = [];
const seenIds = new Set<string>();
const hex = /^#[0-9a-f]{6}$/i;

for (const club of [...CLUB_POOL, ...EURO_POOL]) {
  if (seenIds.has(club.id)) invalid.push(`${club.id}: duplicate club id`);
  seenIds.add(club.id);

  const identity = clubVisualIdentity(club.id);
  const palette = JSON.stringify({ primary: identity.primary, secondary: identity.secondary, text: identity.text });
  if (palette === fallback) missing.push(`${club.id} (${club.colors})`);
  if (![identity.primary, identity.secondary, identity.text].every((value) => hex.test(value))) {
    invalid.push(`${club.id}: invalid six-digit hex palette`);
  }
  if (identity.primary.toLowerCase() === identity.secondary.toLowerCase()) {
    invalid.push(`${club.id}: primary and secondary colours must differ`);
  }
  if (identity.crestAsset !== null) throw new Error(`${club.id}: crest assets must remain null until rights-cleared`);
}

if (missing.length) {
  throw new Error(`Missing rights-safe visual palettes: ${missing.join(", ")}`);
}
if (invalid.length) {
  throw new Error(`Invalid milestone club visual data: ${invalid.join(", ")}`);
}

console.log(`club visual palette smoke: ${CLUB_POOL.length + EURO_POOL.length} clubs covered with valid distinct palettes and no crest assets`);
