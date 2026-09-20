import { CLUB_POOL, EURO_POOL } from "../src/game/clubs";
import { clubVisualIdentity } from "../src/game/club-identity";

const fallback = JSON.stringify({ primary: "#17181c", secondary: "#d4af37", text: "#ffffff" });
const missing: string[] = [];

for (const club of [...CLUB_POOL, ...EURO_POOL]) {
  const identity = clubVisualIdentity(club.id);
  const palette = JSON.stringify({ primary: identity.primary, secondary: identity.secondary, text: identity.text });
  if (palette === fallback) missing.push(`${club.id} (${club.colors})`);
  if (identity.crestAsset !== null) throw new Error(`${club.id}: crest assets must remain null until rights-cleared`);
}

if (missing.length) {
  throw new Error(`Missing rights-safe visual palettes: ${missing.join(", ")}`);
}

console.log(`club visual palette smoke: ${CLUB_POOL.length + EURO_POOL.length} clubs covered without crest assets`);
