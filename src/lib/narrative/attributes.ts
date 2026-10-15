/**
 * ATRIBUTOS VISIBLES. El jugador tenía una sola cifra (la media). Ahora se ven seis atributos de su perfil (ritmo, tiro, pase,
 * regate, defensa y físico; en un portero, reflejos, estirada, saque, salidas, colocación y físico) que salen de su media, su
 * demarcación y su personalidad, mejoran con el plan de entrenamiento que elige cada temporada y, con los años, se resienten
 * (el ritmo y el físico los primeros). No sustituyen a la media: la explican.
 */
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";

export type AttrKey = "ritmo" | "tiro" | "pase" | "regate" | "defensa" | "fisico" | "reflejos" | "estirada" | "saque" | "salidas" | "colocacion";

export interface Attribute {
  key: AttrKey;
  label: string;
  value: number;
  /** Lo que has ganado entrenando (puntos). */
  trained: number;
}

const OUTFIELD: { key: AttrKey; label: string }[] = [
  { key: "ritmo", label: "Ritmo" },
  { key: "tiro", label: "Tiro" },
  { key: "pase", label: "Pase" },
  { key: "regate", label: "Regate" },
  { key: "defensa", label: "Defensa" },
  { key: "fisico", label: "Físico" },
];
const KEEPER: { key: AttrKey; label: string }[] = [
  { key: "reflejos", label: "Reflejos" },
  { key: "estirada", label: "Estirada" },
  { key: "saque", label: "Saque" },
  { key: "salidas", label: "Salidas" },
  { key: "colocacion", label: "Colocación" },
  { key: "fisico", label: "Físico" },
];

/** Cuánto se separa cada atributo de la media según la demarcación (suman ~0). */
const PROFILE: Record<"delantero" | "extremo" | "centrocampista" | "defensa" | "portero", Partial<Record<AttrKey, number>>> = {
  delantero: { ritmo: 3, tiro: 7, pase: -4, regate: 3, defensa: -14, fisico: 5 },
  extremo: { ritmo: 9, tiro: 3, pase: -1, regate: 8, defensa: -16, fisico: -3 },
  centrocampista: { ritmo: -2, tiro: -2, pase: 9, regate: 3, defensa: -3, fisico: 0 },
  defensa: { ritmo: -2, tiro: -12, pase: -3, regate: -9, defensa: 12, fisico: 9 },
  portero: { reflejos: 7, estirada: 6, saque: -2, salidas: 0, colocacion: 5, fisico: -4 },
};

export const posGroup = (position: string | null | undefined): keyof typeof PROFILE => {
  const p = (position ?? "").toLowerCase();
  if (p.includes("portero")) return "portero";
  if (p.includes("extremo")) return "extremo";
  if (p.includes("delantero")) return "delantero";
  if (p.includes("defensa") || p.includes("lateral") || p.includes("central")) return "defensa";
  return "centrocampista";
};

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return h >>> 0;
}
const jitter = (seed: string) => ((hash(seed) % 2001) - 1000) / 1000;
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Rasgos de personalidad que empujan un atributo (el jugador elige dos al crearlo). */
const PERSONALITY_BONUS: Record<string, Partial<Record<AttrKey, number>>> = {
  Trabajador: { fisico: 2, defensa: 1 },
  Carismático: { pase: 1, regate: 1 },
  Rebelde: { regate: 2, tiro: 1 },
};

export const trainedKey = (k: AttrKey) => `tr_${k}`;
export const MAX_TRAINED = 14;

export function getAttributes(player: Pick<Player, "id" | "media" | "position" | "week" | "personality" | "flags">): Attribute[] {
  const group = posGroup(player.position);
  const defs = group === "portero" ? KEEPER : OUTFIELD;
  const profile = PROFILE[group];
  const age = playerAge(player.week);
  const media = player.media ?? 60;
  const traits = String(player.personality ?? "").split(",").map((t) => t.trim());
  return defs.map(({ key, label }) => {
    const trained = clamp(num(player.flags?.[trainedKey(key)]), 0, MAX_TRAINED);
    const pers = traits.reduce((n, t) => n + (PERSONALITY_BONUS[t]?.[key] ?? 0), 0);
    // Con los años se pierde: el ritmo desde los 29, el físico desde los 30, y algo el resto desde los 33.
    const decay = key === "ritmo" || key === "reflejos" ? Math.max(0, age - 28) * 2.4 : key === "fisico" ? Math.max(0, age - 29) * 2 : Math.max(0, age - 32) * 0.8;
    const base = media + (profile[key] ?? 0) + pers + jitter(`${player.id}:${key}`) * 3;
    return { key, label, value: clamp(Math.round(base + trained - decay), 25, 99), trained };
  });
}

/** Los atributos que se pueden trabajar según la demarcación. */
export function trainableFor(player: Pick<Player, "position">): { key: AttrKey; label: string }[] {
  return posGroup(player.position) === "portero" ? KEEPER : OUTFIELD;
}

/** Atributo más alto y más bajo (para describir el perfil del jugador). */
export function profileSummary(attrs: Attribute[]): { best: Attribute; worst: Attribute } {
  const sorted = [...attrs].sort((a, b) => b.value - a.value);
  return { best: sorted[0], worst: sorted[sorted.length - 1] };
}
