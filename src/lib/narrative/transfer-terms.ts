/**
 * Las condiciones de una oferta de fichaje, con cifras: sueldo, años de contrato, lo que paga el club por ti,
 * cláusula, prima de fichaje, papel prometido y cuándo se haría efectivo (según la ventana de mercado). Así la
 * decisión se toma con números —y se puede negociar— en vez de aceptar a ciegas.
 *
 * El sueldo ofrecido se guarda al firmar en flags.salary_mult (múltiplo sobre el sueldo base por media) y es lo que
 * cobra el jugador cada mes (ver weeklySalary en engine.ts). Todo determinista por (jugador, club, semana): la
 * oferta enseña siempre los mismos números aunque se recargue la página.
 */
import type { EventOption } from "@/types/career";
import type { Player } from "@/types/player";
import { getClubLevel } from "@/lib/calendar/match-calendar";
import { computeRole } from "@/lib/narrative/role";

const RANK = { grande: 3, europeo: 2, modesto: 1 } as const;
const ELITE = new Set(["Real Madrid", "Manchester City", "Liverpool FC", "Paris Saint-Germain", "Bayern de Múnich", "FC Barcelona"]);

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

/** Sueldo base mensual por media (el mismo cálculo que weeklySalary en engine.ts, sin importar el motor). */
const baseMonthly = (media: number) => Math.round(Math.max(150, Math.max(0, media - 40) ** 2 * 8) / 10) * 10;

export const salaryMult = (flags: Record<string, string | boolean> | null | undefined): number => {
  const m = parseFloat(String(flags?.salary_mult ?? "1"));
  return Number.isFinite(m) && m > 0 ? Math.min(m, 6) : 1;
};

export const eur = (n: number) => `${Math.round(n).toLocaleString("es")} €`;

/** 73 -> "73 M€"; 0,8 -> "800.000 €". */
export const eurFee = (millions: number) => (millions >= 1 ? `${Math.round(millions).toLocaleString("es")} M€` : `${Math.round(millions * 1_000_000).toLocaleString("es")} €`);

export interface Terms {
  club: string;
  years: number;
  /** Sueldo mensual que cobras ahora y el que ofrecen. */
  currentMonthly: number;
  offeredMonthly: number;
  /** offeredMonthly / sueldo base por media: lo que se guarda en salary_mult. */
  mult: number;
  /** Lo que paga el club por ti a tu club actual, en millones. */
  feeM: number;
  /** Prima de fichaje, en euros. */
  bonus: number;
  /** Cláusula de rescisión, en millones. */
  clauseM: number;
  rolePromise: string;
  roleKind: "titular" | "competir" | "proyecto";
  /** Dónde estamos en el calendario: ventana abierta y hasta cuándo. */
  windowLine: string;
}

export function buildTerms(player: Player, club: string, windowName: "verano" | "enero" | null): Terms {
  const media = player.media ?? 50;
  const age = 16 + Math.floor(player.week / 10);
  const seed = `${player.id}:${club}:${player.week}`;
  const base = baseMonthly(media);
  const currentMonthly = Math.round((base * salaryMult(player.flags)) / 100) * 100;

  const rank = RANK[getClubLevel(club)] - RANK[getClubLevel(player.club)];
  const step = rank > 0 ? 1.28 : rank === 0 ? 1.1 : 0.88;
  const jitter = 0.95 + (hash(seed + "s") % 16) / 100;
  const eliteBonus = ELITE.has(club) ? 1.12 : 1;
  const offeredMonthly = Math.max(300, Math.round((currentMonthly * step * jitter * eliteBonus) / 100) * 100);

  let feeM = Math.max(0.4, (Math.max(0, media - 48) ** 2) / 22);
  feeM *= age >= 31 ? 0.45 : age >= 29 ? 0.75 : age <= 21 ? 1.35 : 1;
  feeM *= 0.9 + (hash(seed + "f") % 25) / 100;
  feeM = feeM >= 10 ? Math.round(feeM) : Math.round(feeM * 10) / 10;

  const years = age <= 22 ? 5 : age <= 28 ? 4 : age <= 31 ? 3 : 2;
  const bonus = Math.round((offeredMonthly * (2 + (hash(seed + "b") % 3))) / 500) * 500;
  const clauseM = Math.round(feeM * (2.2 + (hash(seed + "c") % 10) / 10));

  const role = computeRole(player).role;
  const roleKind: Terms["roleKind"] = rank > 0 && media < 78 ? "competir" : role === "titular" || rank <= 0 ? "titular" : "proyecto";
  const rolePromise =
    roleKind === "titular"
      ? "Te garantizan un papel de titular"
      : roleKind === "competir"
        ? "Entras a competir por el puesto con los de siempre"
        : "Te lo plantean como un proyecto a medio plazo";

  const windowLine =
    windowName === "verano"
      ? "El mercado de verano se cierra el 1 de septiembre: si firmas, te incorporas ya, a tiempo de la pretemporada."
      : windowName === "enero"
        ? "El mercado de invierno se cierra a primeros de febrero: si firmas, te incorporas esta misma semana."
        : "Solo se puede cerrar con el mercado abierto.";

  return { club, years, currentMonthly, offeredMonthly, mult: offeredMonthly / Math.max(1, base), feeM, bonus, clauseM, rolePromise, roleKind, windowLine };
}

/** El sueldo se enseña siempre al año (redondeado a miles), que es como se habla en el fútbol. */
export const annual = (monthly: number) => Math.round((monthly * 12) / 1000) * 1000;

/** El sueldo real del jugador al año, en texto: lo que cobra de verdad cada mes por doce. */
export function annualSalaryText(player: Pick<Player, "media" | "flags">): string {
  const monthly = baseMonthly(player.media ?? 50) * salaryMult(player.flags);
  return `${eur(annual(monthly))} brutos al año`;
}

/** El bloque de números que se enseña en la descripción de la oferta. */
export function termsText(t: Terms, art: (club: string) => string): string {
  const delta = annual(t.offeredMonthly) - annual(t.currentMonthly);
  const sign = delta >= 0 ? "+" : "−";
  return [
    `Sueldo: ${eur(annual(t.offeredMonthly))} brutos al año (${sign}${eur(Math.abs(delta))} sobre lo que cobras ahora: ${eur(annual(t.currentMonthly))}).`,
    `Contrato: ${t.years} años · prima de fichaje ${eur(t.bonus)} · cláusula ${eurFee(t.clauseM)}.`,
    `Traspaso: ${art(t.club)} pagaría ${eurFee(t.feeM)} a tu club.`,
    `${t.rolePromise}.`,
    t.windowLine,
  ].join("\n");
}

export interface OfferCfg {
  /** Club al que se iría. */
  club: string;
  art: (club: string) => string;
  /** Efectos que acompañan a firmar (flags propios, p. ej. los del arco). */
  signFlags?: Record<string, string | boolean>;
  /** Flags al cerrarse la oferta sin firmar (limpiar el interés, cooldowns...). */
  closeFlags?: Record<string, string | boolean>;
  /** Frase de despedida del club. */
  farewell?: string;
  /** Probabilidad base de que salga bien negociar con el club interesado. */
  haggleChance?: number;
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Las cuatro salidas de una oferta con cifras: firmar, regatear con el club que ofrece, usarla en tu club y rechazar. */
export function offerOptions(player: Player, t: Terms, cfg: OfferCfg): EventOption[] {
  const { club, art } = cfg;
  const sign = cfg.signFlags ?? {};
  const close = cfg.closeFlags ?? {};
  const base = t.offeredMonthly / Math.max(0.0001, t.mult); // sueldo base por media
  const haggleMonthly = Math.round(t.offeredMonthly * 1.14);
  const haggleBonus = Math.round((t.bonus * 1.35) / 500) * 500;
  const stayMonthly = Math.round(t.currentMonthly * 1.18);
  const stayBonus = Math.round((t.currentMonthly * 4) / 500) * 500;
  const multOf = (monthly: number) => (monthly / Math.max(1, base)).toFixed(3);
  return [
    {
      id: "fichar",
      label: `Aceptar: ${eur(annual(t.offeredMonthly))} al año, ${t.years} años`,
      subtitle: `Fichar por ${art(club)} · prima ${eur(t.bonus)} · incorporación inmediata`,
      consequences: { club, fama: 6, moral: 4, rel_vestuario: -4, rel_aficion: -5, patrimonio: t.bonus, flags: { ...close, ...sign, salary_mult: multOf(t.offeredMonthly) } },
      outcomeText: `Firmas ${t.years} años con ${art(club)}: ${eur(annual(t.offeredMonthly))} brutos al año y ${eur(t.bonus)} de prima. ${cfg.farewell ?? "En el vestuario te despiden con abrazos sinceros... y alguna mirada fría que no se molesta en disimular."}`,
    },
    {
      id: "regatear",
      label: `Pedir más: ${eur(annual(haggleMonthly))} al año y ${eur(haggleBonus)} de prima`,
      subtitle: "Negociar con el club que te quiere · riesgo de que se enfríe",
      consequences: {},
      resolve: {
        baseChance: Math.min(0.75, (cfg.haggleChance ?? 0.55) + ((player.fama ?? 50) - 60) / 400),
        statModifier: "reputacion",
        success: {
          text: `${cap(art(club))} cede: ${eur(annual(haggleMonthly))} al año y ${eur(haggleBonus)} de prima. Tu representante sale del despacho con una sonrisa que da miedo.`,
          consequences: { club, fama: 6, moral: 6, rel_vestuario: -4, rel_aficion: -5, patrimonio: haggleBonus, flags: { ...close, ...sign, salary_mult: multOf(haggleMonthly) } },
        },
        fail: {
          text: `Te pasas de listo: ${art(club)} da un paso atrás y retira la oferta. Te quedas donde estabas y con la sensación de haberlo dejado escapar.`,
          consequences: { moral: -6, rel_representante: -2, flags: close },
        },
      },
    },
    {
      id: "negociar",
      label: `Usar la oferta para subir tu sueldo aquí (a ${eur(annual(stayMonthly))} al año)`,
      subtitle: "Jugar tus cartas con tu club",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "reputacion",
        success: {
          text: `Tu club se asusta y mejora tu contrato: ${eur(annual(stayMonthly))} al año y ${eur(stayBonus)} de prima por renovar. Ganas peso en el vestuario y en la cuenta.`,
          consequences: { patrimonio: stayBonus, rel_entrenador: 3, moral: 4, flags: { ...close, salary_mult: multOf(stayMonthly) } },
        },
        fail: {
          text: `Tu club se lo toma mal, se enfría todo y ${art(club)} se echa atrás. Te quedas sin oferta y con el ambiente raro.`,
          consequences: { moral: -5, rel_entrenador: -3, flags: close },
        },
      },
    },
    {
      id: "rechazar",
      label: "Rechazarla: aquí me quedo",
      subtitle: "La grada lo va a agradecer",
      consequences: { rel_aficion: 7, rel_entrenador: 3, moral: 2, flags: close },
      outcomeText: "La noticia de que has rechazado la oferta recorre el club en horas. En el siguiente partido, la grada te dedica una ovación larga y cerrada.",
    },
  ];
}
