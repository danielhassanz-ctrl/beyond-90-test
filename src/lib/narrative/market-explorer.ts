/**
 * EL MERCADO EXPLORABLE. Hasta ahora las ofertas te llegaban solo como escenas. Aquí se ve el mercado: en qué ventana estás, cuánto
 * vales, cuánto te queda de contrato, qué club se interesa por ti y a qué otros clubes puede tantear tu representante, con su
 * nivel, el papel que esperarías, el sueldo aproximado, la probabilidad de que se interesen y lo que opina tu pareja de la ciudad.
 * Si el sondeo sale bien, se abre el mismo flujo de oferta de siempre (transfer_interest con origen "listado"); si no, hay que esperar.
 */
import type { Player } from "@/types/player";
import { playerAge } from "@/types/career";
import { NO_CLUB_YET } from "@/lib/constants";
import { getClubLevel } from "@/lib/calendar/match-calendar";
import { leagueOf } from "@/lib/calendar/leagues";
import { cityOfClub } from "@/lib/narrative/cities";
import { computeRole, ROLE_LABELS, type PlayerRole } from "@/lib/narrative/role";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";
import { buildTerms, contractUntil, marketValueM, releaseClauseM, eur, eurFee } from "@/lib/narrative/transfer-terms";
import { getMarketWindow, inStabilityPeriod, stabilityTurns, interestFlags, art, de, POOL_ELITE, POOL_HIGH, POOL_MID, POOL_LOW, type MarketWindow } from "@/lib/narrative/market-window";
import { partnerOf, describeCity } from "@/lib/narrative/partner";

type Flags = Record<string, string | boolean>;

/** «al Getafe CF», «a la Real Sociedad», «a Las Palmas»: el club con su artículo y la preposición «a». */
export const aClub = (club: string): string => {
  const a = art(club);
  return a.startsWith("el ") ? `al ${a.slice(3)}` : `a ${a}`;
};

const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Cuántos sondeos se pueden hacer en cada ventana (verano o enero). */
export const MAX_PROBES_PER_WINDOW = 2;

export interface MarketStatus {
  window: MarketWindow | null;
  /** Turnos que le quedan a la ventana abierta (incluido este). */
  windowTurnsLeft: number;
  stableUntil: number | null;
  contractLeft: number;
  valueM: number;
  clauseM: number;
  interest: { club: string; source: string } | null;
  probesLeft: number;
  /** Por qué no se puede sondear ahora (o null si se puede). */
  blocked: string | null;
}

const windowKeyOf = (week: number, w: MarketWindow) => `${Math.floor((week - 1) / 10)}_${w}`;

export function marketStatus(player: Player): MarketStatus {
  const flags = (player.flags ?? {}) as Flags;
  const window = getMarketWindow(player.week);
  const turn = ((player.week - 1) % 10) + 1;
  const windowTurnsLeft = !window ? 0 : window === "verano" ? 3 - turn : 9 - turn;
  const since = num(flags.club_since);
  const stable = inStabilityPeriod(player);
  const stableUntil = stable && since > 0 ? since + stabilityTurns(player) : null;
  const interestClub = flags.transfer_interest;
  const interest = typeof interestClub === "string" && interestClub && interestClub !== player.club ? { club: interestClub, source: String(flags.transfer_interest_source ?? "prensa") } : null;
  const used = window ? num(flags[`probe_${windowKeyOf(player.week, window)}`]) : 0;
  const lastProbe = num(flags.probe_last_week);
  let blocked: string | null = null;
  if (player.club === NO_CLUB_YET) blocked = "Todavía no tienes club desde el que mover nada.";
  else if (!window) blocked = "El mercado está cerrado: se abre en verano (hasta el 1 de septiembre) y en enero.";
  else if (Boolean(flags.loan_active) && !flags.loan_returned) blocked = "Estás cedido: tu club decide cuándo vuelves.";
  else if (getInjuryRemaining(flags) > 0) blocked = "Lesionado, nadie paga por ti ahora. Primero recupérate.";
  else if (stable) blocked = "Acabas de incorporarte al club: nadie paga por ti todavía (salvo que pidas salir).";
  else if (interest && interest.source === "listado") blocked = "Tu representante ya tiene una gestión en marcha: espera la llamada.";
  else if (used >= MAX_PROBES_PER_WINDOW) blocked = "Ya has hecho todos los sondeos de esta ventana.";
  else if (lastProbe === player.week) blocked = "Ya has movido ficha este mes: espera al siguiente turno.";
  return {
    window,
    windowTurnsLeft,
    stableUntil,
    contractLeft: Math.max(0, contractUntil(player) - player.week),
    valueM: marketValueM(player),
    clauseM: releaseClauseM(player),
    interest,
    probesLeft: Math.max(0, MAX_PROBES_PER_WINDOW - used),
    blocked,
  };
}

export interface ClubOption {
  club: string;
  league: string;
  city: string;
  level: "grande" | "europeo" | "modesto";
  /** Respecto a tu club actual. */
  direction: "sube" | "igual" | "baja";
  role: PlayerRole;
  roleLabel: string;
  probability: number;
  band: "Alta" | "Media" | "Baja";
  annualText: string;
  feeText: string;
  partnerLine: string | null;
}

const RANK = { modesto: 0, europeo: 1, grande: 2 } as const;
const ROLE_P: Record<PlayerRole, number> = { titular: 0.72, rotacion: 0.5, suplente: 0.22, apartado: 0.1 };

/** Probabilidad de que ese club se interese si tu representante lo tantea. */
export function probeProbability(player: Player, club: string): number {
  const role = computeRole({ ...player, club }).role;
  const age = playerAge(player.week);
  const ctrLeft = contractUntil(player) - player.week;
  let p = ROLE_P[role] + ((player.fama ?? 50) - 50) / 500 + (age <= 21 ? 0.05 : 0) + (ctrLeft <= 10 ? 0.1 : 0);
  if (getClubLevel(club) === "grande" && (player.media ?? 50) < 66) p = Math.min(p, 0.1);
  return Math.round(clamp(p, 0.05, 0.9) * 100) / 100;
}

const band = (p: number): ClubOption["band"] => (p >= 0.6 ? "Alta" : p >= 0.35 ? "Media" : "Baja");

/** Una selección de clubes a los que se puede tantear: algunos de mayor nivel, del mismo y de menor. */
export function exploreClubs(player: Player): ClubOption[] {
  if (player.club === NO_CLUB_YET) return [];
  const window = getMarketWindow(player.week);
  const partner = partnerOf(player.flags);
  const own = getClubLevel(player.club);
  const all = [...new Set([...POOL_ELITE, ...POOL_HIGH, ...POOL_MID, ...POOL_LOW, "Al-Nassr FC"])].filter((c) => c !== player.club && cityOfClub(c) !== cityOfClub(player.club));
  const rows: ClubOption[] = all.map((club) => {
    const level = getClubLevel(club);
    const terms = buildTerms(player, club, window);
    const role = computeRole({ ...player, club }).role;
    const p = probeProbability(player, club);
    return {
      club,
      league: leagueOf(club).short,
      city: cityOfClub(club),
      level,
      direction: RANK[level] > RANK[own] ? "sube" : RANK[level] < RANK[own] ? "baja" : "igual",
      role,
      roleLabel: ROLE_LABELS[role],
      probability: p,
      band: band(p),
      annualText: `${eur(terms.offeredAnnual)} brutos al año`,
      feeText: `${eurFee(terms.feeM)} de traspaso`,
      partnerLine: partner ? describeCity(partner, club) : null,
    };
  });
  const take = (dir: ClubOption["direction"], n: number) => rows.filter((r) => r.direction === dir && r.probability >= 0.08).sort((a, b) => b.probability - a.probability).slice(0, n);
  return [...take("sube", 3), ...take("igual", 3), ...take("baja", 3)];
}

export interface ProbeResult {
  ok: boolean;
  title: string;
  label: string;
  description: string;
  outcomeText: string;
  flags: Flags;
  moral: number;
}

/** El sondeo de tu representante a un club. Si cuaja, abre el flujo de oferta de siempre. */
export function probeClub(player: Player, club: string, rng: () => number = Math.random): ProbeResult | { error: string } {
  const status = marketStatus(player);
  if (status.blocked) return { error: status.blocked };
  const options = exploreClubs(player);
  const opt = options.find((o) => o.club === club);
  if (!opt) return { error: "Ese club no está entre los que se pueden tantear ahora." };
  const agent = player.agent_name && player.agent_name !== "sin representante" ? player.agent_name : "Tu representante";
  const week = player.week;
  const window = status.window as MarketWindow;
  const stamp: Flags = { probe_last_week: String(week), [`probe_${windowKeyOf(week, window)}`]: String(num(player.flags?.[`probe_${windowKeyOf(week, window)}`]) + 1) };
  const ok = rng() < opt.probability;
  const base = {
    title: `${agent} tantea ${aClub(club)}`,
    label: `Sondear ${aClub(club)}`,
    description: `Le pides a ${agent} que llame ${aClub(club)} y mire si hay hueco para ti: ${opt.roleLabel.toLowerCase()} en una plantilla de nivel ${opt.level === "grande" ? "alto" : opt.level === "europeo" ? "medio-alto" : "medio"}. «Pregunto sin comprometer a nadie», te promete.`,
  };
  if (ok) {
    return {
      ok: true,
      ...base,
      outcomeText: `${agent} vuelve con una sonrisa que no puede disimular: «Les has gustado. Están dispuestos a hablar en serio». En los próximos días llegará una oferta formal ${de(club)}. ${opt.partnerLine ? `${opt.partnerLine} ` : ""}Tú decides entonces si el movimiento te conviene.`,
      flags: { ...stamp, ...interestFlags(club, week - 1, "listado") },
      moral: 2,
    };
  }
  return {
    ok: false,
    ...base,
    outcomeText: `${agent} te llama esa misma tarde: «No hay hueco ahora mismo en ${art(club)}. Han dicho que seguirán tu evolución». No es un portazo, pero tampoco una puerta abierta. Todavía te queda ${Math.max(0, status.probesLeft - 1)} ${status.probesLeft - 1 === 1 ? "sondeo" : "sondeos"} en esta ventana.`,
    flags: stamp,
    moral: -1,
  };
}
