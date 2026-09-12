import { plausibleMoneyScale } from "./career-life";
import type { GameState } from "./types";

export type MoneyOfferId =
  | "piso_alquiler"
  | "coche"
  | "piso_propio"
  | "ayuda_familia"
  | "negocio_amigo"
  | "casa_grande"
  | "mansion"
  | "coche_absurdo"
  | "restaurante"
  | "fondo";

const BY_SCALE: Record<ReturnType<typeof plausibleMoneyScale>, ReadonlySet<MoneyOfferId>> = {
  youth: new Set<MoneyOfferId>(["piso_alquiler"]),
  pro: new Set<MoneyOfferId>(["piso_alquiler", "coche", "piso_propio", "ayuda_familia", "fondo"]),
  star: new Set<MoneyOfferId>([
    "piso_alquiler",
    "coche",
    "piso_propio",
    "ayuda_familia",
    "negocio_amigo",
    "casa_grande",
    "coche_absurdo",
    "restaurante",
    "fondo",
  ]),
  superstar: new Set<MoneyOfferId>([
    "piso_alquiler",
    "coche",
    "piso_propio",
    "ayuda_familia",
    "negocio_amigo",
    "casa_grande",
    "mansion",
    "coche_absurdo",
    "restaurante",
    "fondo",
  ]),
};

/**
 * Hard chronology gate for Life/Patrimony scenes.
 * Cash is never enough by itself: age and sporting status must justify the
 * lifestyle decision before finance.ts may even consider its price threshold.
 */
export function moneyOfferAllowed(s: GameState, id: string): boolean {
  if (!(id in OFFER_IDS)) return false;
  const offerId = id as MoneyOfferId;
  const scale = plausibleMoneyScale(s);
  if (!BY_SCALE[scale].has(offerId)) return false;

  // Explicit real-world age/status rules layered on top of the scale.
  if (s.age < 18) return offerId === "piso_alquiler";
  if (offerId === "coche" && s.age < 18) return false;
  if (["piso_propio", "ayuda_familia"].includes(offerId) && s.age < 19) return false;
  if (offerId === "fondo" && s.age < 21) return false;
  if (["negocio_amigo", "restaurante"].includes(offerId) && s.age < 21) return false;
  if (["casa_grande", "coche_absurdo"].includes(offerId) && s.age < 22) return false;
  if (offerId === "mansion" && s.age < 24) return false;
  return true;
}

const OFFER_IDS: Record<MoneyOfferId, true> = {
  piso_alquiler: true,
  coche: true,
  piso_propio: true,
  ayuda_familia: true,
  negocio_amigo: true,
  casa_grande: true,
  mansion: true,
  coche_absurdo: true,
  restaurante: true,
  fondo: true,
};

export function sponsorshipAllowed(s: GameState): boolean {
  return s.stage !== "youth" && s.age >= 18 && plausibleMoneyScale(s) !== "youth";
}
