/**
 * Dinero del fútbol, con escala realista, y las condiciones de una oferta de fichaje.
 *
 * SUELDOS. El sueldo bruto anual depende de la media (crece muy rápido: un chico de 50 cobra lo de un filial, uno de
 * 75 cobra seis cifras largas, un 88 millones) y del escalón del club (un modesto paga la mitad que uno europeo; un
 * grande, un 50 % más; los de élite, el doble). Al jugador le llega neto (tras impuestos y comisiones) cada mes.
 * Un fichaje o una renovación pactan un múltiplo propio (flags.salary_mult) válido solo mientras sigas en ese club
 * (flags.salary_club): si te vas por otra vía, vuelve a la escala normal del club nuevo.
 *
 * OFERTAS. Sueldo, años, prima, cláusula, lo que paga el club por ti, papel prometido y cuándo se haría efectivo
 * (según la ventana de mercado), más cuatro salidas con negociación. Todo determinista por (jugador, club, semana).
 */
import type { EventOption } from "@/types/career";
import type { Player } from "@/types/player";
import { getClubLevel } from "@/lib/calendar/match-calendar";
import { computeRole } from "@/lib/narrative/role";

const RANK = { grande: 3, europeo: 2, modesto: 1 } as const;
const ELITE = new Set(["Real Madrid", "Manchester City", "Liverpool FC", "Paris Saint-Germain", "Bayern de Múnich", "FC Barcelona", "Chelsea", "Arsenal"]);

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

/** Lo que llega a la cuenta de cada euro bruto: impuestos (hasta el 47 %), cotizaciones y comisión del representante. */
export const NET_FACTOR = 0.6;

const TIER: Record<"modesto" | "europeo" | "grande", number> = { modesto: 0.55, europeo: 1, grande: 1.5 };
/** Escalón salarial del club: modesto 0,55 · europeo 1 · grande 1,5 · élite 2. */
export const clubTier = (club: string) => (ELITE.has(club) ? 2 : TIER[getClubLevel(club)]);

/** Sueldo bruto anual "de mercado" para una media, en un club de escalón 1 (europeo). Mínimo de un filial: 15.000 €. */
export const baseAnnual = (media: number) => Math.max(15000, Math.round(15000 * Math.exp((media - 45) * 0.135)));

export const salaryMultFor = (flags: Record<string, string | boolean> | null | undefined, club: string): number => {
  if (String(flags?.salary_club ?? "") !== club) return 1;
  const m = parseFloat(String(flags?.salary_mult ?? "1"));
  return Number.isFinite(m) && m > 0 ? Math.min(m, 4) : 1;
};

/** Sueldo bruto anual real del jugador: escala de su media y su club, por lo pactado en su contrato. */
export function playerAnnualGross(player: Pick<Player, "media" | "club" | "flags">): number {
  // Un contrato pactado es una cifra FIJA mientras sigas en ese club: no sube ni baja con tu media (para eso están las renovaciones).
  const fixed = parseInt(String(player.flags?.salary_fixed ?? "0"), 10) || 0;
  if (fixed > 0 && String(player.flags?.salary_club ?? "") === player.club) return fixed;
  return Math.max(15000, Math.round((baseAnnual(player.media ?? 50) * clubTier(player.club) * salaryMultFor(player.flags, player.club)) / 1000) * 1000);
}

/** Lo que entra a la cuenta cada mes (turno): bruto anual / 12, ya neto. */
export const playerMonthlyNet = (player: Pick<Player, "media" | "club" | "flags">): number =>
  Math.round((playerAnnualGross(player) * NET_FACTOR) / 12 / 10) * 10;

export const eur = (n: number) => `${Math.round(n).toLocaleString("es")} €`;

/** 73 -> "73 M€"; 0,8 -> "800.000 €". */
export const eurFee = (millions: number) => (millions >= 1 ? `${Math.round(millions).toLocaleString("es")} M€` : `${Math.round(millions * 1_000_000).toLocaleString("es")} €`);

const round1k = (n: number) => Math.round(n / 1000) * 1000;

/** El sueldo real del jugador al año, en texto (para la escena de la firma). */
export function annualSalaryText(player: Pick<Player, "media" | "club" | "flags">): string {
  return `${eur(playerAnnualGross(player))} brutos al año`;
}

export interface Terms {
  club: string;
  years: number;
  /** Sueldo bruto anual que cobras ahora y el que ofrecen. */
  currentAnnual: number;
  offeredAnnual: number;
  /** Sueldo "de mercado" de ese club para tu media (sin pactar nada): el múltiplo que se guarda es offered / marketAnnual. */
  marketAnnual: number;
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
  const currentAnnual = playerAnnualGross(player);
  const marketAnnual = round1k(baseAnnual(media) * clubTier(club));
  // Ofrecen algo por encima de lo de mercado (hay que convencerte), más si quien paga es de élite.
  const jitter = 1.02 + (hash(seed + "s") % 22) / 100;
  const ageFactor = age >= 32 ? 0.85 : 1;
  const offeredAnnual = Math.max(15000, round1k(marketAnnual * jitter * ageFactor));

  let feeM = Math.max(0.4, (Math.max(0, media - 48) ** 2) / 22);
  feeM *= age >= 31 ? 0.45 : age >= 29 ? 0.75 : age <= 21 ? 1.35 : 1;
  feeM *= 0.9 + (hash(seed + "f") % 25) / 100;
  feeM = feeM >= 10 ? Math.round(feeM) : Math.round(feeM * 10) / 10;

  const years = age <= 22 ? 5 : age <= 28 ? 4 : age <= 31 ? 3 : 2;
  const bonus = Math.max(2000, Math.round((offeredAnnual * (0.1 + (hash(seed + "b") % 11) / 100)) / 1000) * 1000);
  const clauseM = Math.max(1, Math.round(feeM * (2.2 + (hash(seed + "c") % 10) / 10)));

  const rank = RANK[getClubLevel(club)] - RANK[getClubLevel(player.club)];
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

  return { club, years, currentAnnual, offeredAnnual, marketAnnual, feeM, bonus, clauseM, rolePromise, roleKind, windowLine };
}

/** El bloque de números que se enseña en la descripción de la oferta (el sueldo, siempre bruto y al año). */
export function termsText(t: Terms, art: (club: string) => string): string {
  const delta = t.offeredAnnual - t.currentAnnual;
  const sign = delta >= 0 ? "+" : "−";
  return [
    `Sueldo: ${eur(t.offeredAnnual)} brutos al año (${sign}${eur(Math.abs(delta))} sobre lo que cobras ahora: ${eur(t.currentAnnual)}).`,
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
  const haggleAnnual = round1k(t.offeredAnnual * 1.14);
  const haggleBonus = Math.round((t.bonus * 1.35) / 1000) * 1000;
  const stayAnnual = round1k(t.currentAnnual * 1.18);
  const stayBonus = Math.max(2000, Math.round((t.currentAnnual * 0.1) / 1000) * 1000);
  const dealFlags = (annual: number, forClub: string) => ({
    salary_mult: (annual / Math.max(1, baseAnnual(player.media ?? 50) * clubTier(forClub))).toFixed(3),
    salary_fixed: String(annual),
    salary_club: forClub,
  });
  return [
    {
      id: "fichar",
      label: `Aceptar: ${eur(t.offeredAnnual)} al año, ${t.years} años`,
      subtitle: `Fichar por ${art(club)} · prima ${eur(t.bonus)} · incorporación inmediata`,
      consequences: { club, fama: 6, moral: 4, rel_vestuario: -4, rel_aficion: -5, patrimonio: t.bonus, flags: { ...close, ...sign, ...dealFlags(t.offeredAnnual, club) } },
      outcomeText: `Firmas ${t.years} años con ${art(club)}: ${eur(t.offeredAnnual)} brutos al año y ${eur(t.bonus)} de prima. ${cfg.farewell ?? "En el vestuario te despiden con abrazos sinceros... y alguna mirada fría que no se molesta en disimular."}`,
    },
    {
      id: "regatear",
      label: `Pedir más: ${eur(haggleAnnual)} al año y ${eur(haggleBonus)} de prima`,
      subtitle: "Negociar con el club que te quiere · riesgo de que se enfríe",
      consequences: {},
      resolve: {
        baseChance: Math.min(0.75, (cfg.haggleChance ?? 0.55) + ((player.fama ?? 50) - 60) / 400),
        statModifier: "reputacion",
        success: {
          text: `${cap(art(club))} cede: ${eur(haggleAnnual)} al año y ${eur(haggleBonus)} de prima. Tu representante sale del despacho con una sonrisa que da miedo.`,
          consequences: { club, fama: 6, moral: 6, rel_vestuario: -4, rel_aficion: -5, patrimonio: haggleBonus, flags: { ...close, ...sign, ...dealFlags(haggleAnnual, club) } },
        },
        fail: {
          text: `Te pasas de listo: ${art(club)} da un paso atrás y retira la oferta. Te quedas donde estabas y con la sensación de haberlo dejado escapar.`,
          consequences: { moral: -6, rel_representante: -2, flags: close },
        },
      },
    },
    {
      id: "negociar",
      label: `Usar la oferta para subir tu sueldo aquí (a ${eur(stayAnnual)} al año)`,
      subtitle: "Jugar tus cartas con tu club",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "reputacion",
        success: {
          text: `Tu club se asusta y mejora tu contrato: ${eur(stayAnnual)} brutos al año y ${eur(stayBonus)} de prima por renovar. Ganas peso en el vestuario y en la cuenta.`,
          consequences: { patrimonio: stayBonus, rel_entrenador: 3, moral: 4, flags: { ...close, ...dealFlags(stayAnnual, player.club) } },
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
