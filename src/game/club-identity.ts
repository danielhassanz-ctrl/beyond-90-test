import { clubDef } from "./data";

/**
 * Visual identity for Beyond 90 milestone cards.
 *
 * IMPORTANT: this deliberately does NOT bundle official club crests, shirt
 * artwork, sponsors or trademarks. Those assets require a separate rights
 * decision before commercial distribution. Until then milestone/share cards
 * use club name + a deterministic colour treatment.
 */
export interface ClubVisualIdentity {
  primary: string;
  secondary: string;
  text: string;
  crestAsset: null;
}

const EXACT: Record<string, Omit<ClubVisualIdentity, "crestAsset">> = {
  "real-madrid": { primary: "#f4f4f4", secondary: "#1d2d5c", text: "#111111" },
  barcelona: { primary: "#004d98", secondary: "#a50044", text: "#ffffff" },
  atletico: { primary: "#d71920", secondary: "#ffffff", text: "#ffffff" },
  athletic: { primary: "#ee2523", secondary: "#ffffff", text: "#ffffff" },
  "real-sociedad": { primary: "#0067b1", secondary: "#ffffff", text: "#ffffff" },
  betis: { primary: "#0b7a3e", secondary: "#ffffff", text: "#ffffff" },
  sevilla: { primary: "#d71920", secondary: "#ffffff", text: "#ffffff" },
  villarreal: { primary: "#ffe667", secondary: "#005187", text: "#111111" },
  valencia: { primary: "#ffffff", secondary: "#111111", text: "#111111" },
  celta: { primary: "#8ac3e8", secondary: "#ffffff", text: "#10243e" },
  osasuna: { primary: "#c8102e", secondary: "#0b1f45", text: "#ffffff" },
  malaga: { primary: "#66b5e3", secondary: "#ffffff", text: "#10243e" },
  zaragoza: { primary: "#ffffff", secondary: "#1c5aa6", text: "#111111" },
  deportivo: { primary: "#1769aa", secondary: "#ffffff", text: "#ffffff" },
};

const BY_LABEL: Record<string, Omit<ClubVisualIdentity, "crestAsset">> = {
  Rojiblanco: { primary: "#d71920", secondary: "#ffffff", text: "#ffffff" },
  Blanquirrojo: { primary: "#ffffff", secondary: "#d71920", text: "#111111" },
  Verdiblanco: { primary: "#0b7a3e", secondary: "#ffffff", text: "#ffffff" },
  Blanquiverde: { primary: "#ffffff", secondary: "#0b7a3e", text: "#111111" },
  Blanquiazul: { primary: "#ffffff", secondary: "#1769aa", text: "#111111" },
  Albiazul: { primary: "#ffffff", secondary: "#1769aa", text: "#111111" },
  "Txuri-urdin": { primary: "#0067b1", secondary: "#ffffff", text: "#ffffff" },
  Blaugrana: { primary: "#004d98", secondary: "#a50044", text: "#ffffff" },
  Azulgrana: { primary: "#1769aa", secondary: "#a50044", text: "#ffffff" },
  Celeste: { primary: "#8ac3e8", secondary: "#ffffff", text: "#10243e" },
  Amarillo: { primary: "#ffe667", secondary: "#173f7a", text: "#111111" },
  Blanco: { primary: "#f4f4f4", secondary: "#b7b7b7", text: "#111111" },
  Azul: { primary: "#1769aa", secondary: "#ffffff", text: "#ffffff" },
  "Azulón": { primary: "#0057a8", secondary: "#ffffff", text: "#ffffff" },
  Rojo: { primary: "#d71920", secondary: "#ffffff", text: "#ffffff" },
  Rojillo: { primary: "#c8102e", secondary: "#0b1f45", text: "#ffffff" },
  Franjirrojo: { primary: "#ffffff", secondary: "#d71920", text: "#111111" },
  "Bermellón": { primary: "#d71920", secondary: "#111111", text: "#ffffff" },
  Pepinero: { primary: "#ffffff", secondary: "#1769aa", text: "#111111" },
  Violeta: { primary: "#6f2c91", secondary: "#ffffff", text: "#ffffff" },
  Blanquinegro: { primary: "#ffffff", secondary: "#111111", text: "#111111" },
  Albinegro: { primary: "#ffffff", secondary: "#111111", text: "#111111" },
  Rojinegro: { primary: "#c8102e", secondary: "#111111", text: "#ffffff" },
  Neroazzurro: { primary: "#00529f", secondary: "#111111", text: "#ffffff" },
  Granate: { primary: "#8e1f2f", secondary: "#f0bc42", text: "#ffffff" },
  Azulnegro: { primary: "#1769aa", secondary: "#111111", text: "#ffffff" },
};

const FALLBACK = { primary: "#17181c", secondary: "#d4af37", text: "#ffffff" };
const HEX = /^#[0-9a-f]{6}$/i;

function luminance(hexColour: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hexColour.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function visualContrast(a: string, b: string): number {
  if (!HEX.test(a) || !HEX.test(b)) return 0;
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Primary is the guaranteed text surface used by milestone/share UI. */
export function hasReadablePrimary(identity: Pick<ClubVisualIdentity, "primary" | "text">): boolean {
  return visualContrast(identity.text, identity.primary) >= 4.5;
}

export function clubVisualIdentity(clubId: string): ClubVisualIdentity {
  const def = clubDef(clubId);
  const palette = EXACT[clubId] ?? BY_LABEL[def.colors] ?? FALLBACK;
  return { ...palette, crestAsset: null };
}
