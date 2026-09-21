import { CLUB_POOL, EURO_POOL } from "../src/game/clubs";
import { clubVisualIdentity } from "../src/game/club-identity";

const fallback = JSON.stringify({ primary: "#17181c", secondary: "#d4af37", text: "#ffffff" });
const missing: string[] = [];
const invalid: string[] = [];
const seenIds = new Set<string>();
const hex = /^#[0-9a-f]{6}$/i;

function luminance(hexColour: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hexColour.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a: string, b: string): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

for (const club of [...CLUB_POOL, ...EURO_POOL]) {
  if (seenIds.has(club.id)) invalid.push(`${club.id}: duplicate club id`);
  seenIds.add(club.id);

  const identity = clubVisualIdentity(club.id);
  const palette = JSON.stringify({ primary: identity.primary, secondary: identity.secondary, text: identity.text });
  if (palette === fallback) missing.push(`${club.id} (${club.colors})`);
  if (![identity.primary, identity.secondary, identity.text].every((value) => hex.test(value))) {
    invalid.push(`${club.id}: invalid six-digit hex palette`);
  } else {
    // The primary colour is the guaranteed text surface in milestone/share UI.
    // A readable secondary colour must not hide an unreadable primary surface.
    const primaryTextContrast = contrast(identity.text, identity.primary);
    if (primaryTextContrast < 4.5) {
      invalid.push(`${club.id}: text/primary fails WCAG AA contrast (${primaryTextContrast.toFixed(2)}:1)`);
    }
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

console.log(`club visual palette smoke: ${CLUB_POOL.length + EURO_POOL.length} clubs covered with valid, primary-readable distinct palettes and no crest assets`);
