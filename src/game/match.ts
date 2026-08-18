import { buildMatchContext, competitionFor as compFor, defById, CLUB_POOL, validateMatchContext } from "./clubs";
import { clubDef } from "./data";
import type { GameState, KeyMoment, MatchContext, MatchData, MatchMoment, Position, RecentResult, Slot } from "./types";

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function rnd(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function weighted<T>(entries: readonly [T, number][]): T {
  const total = entries.reduce((a, e) => a + e[1], 0);
  let r = Math.random() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return entries[0]![0];
}

/** Distribución realista de marcadores (muchos resultados cortos). */
const SCORELINES: readonly [[number, number], number][] = [
  [[0, 0], 11],
  [[1, 0], 13],
  [[1, 1], 11],
  [[2, 0], 10],
  [[2, 1], 8],
  [[3, 0], 5],
  [[3, 1], 4],
  [[4, 1], 2],
  [[4, 0], 1],
  [[0, 1], 12],
  [[0, 2], 9],
  [[1, 2], 7],
  [[0, 3], 5],
  [[1, 3], 3],
  [[2, 2], 3],
  [[0, 4], 2],
  [[2, 3], 2],
  [[5, 0], 1],
  [[0, 5], 1],
];

export function competitionFor(state: GameState): string {
  return compFor(state.stage, clubDef(state.clubId));
}

/** 0 = no convocado, 1 = banquillo sin jugar, 2 = suplente con minutos, 3 = titular */
export function computeRole(state: GameState): number {
  if (state.injury) return 0;
  const status = state.flags["status"] ?? 0;
  const club = clubDef(state.clubId);
  let score = (state.overall - baselineOverall(state)) * 3;
  score += (state.rel.coach - 50) * 0.35;
  score += (state.form - 50) * 0.2;
  score += club.minutes * 2;
  score += status * 10;
  score += state.flags["nolist"] ? -25 : 0;
  // Un entrenador enfadado se nota en la lista, no solo en una barra.
  if (state.rel.coach <= 30) score -= 12;

  if (score < -20) return 0;
  if (score < -8) return 1;
  if (score < 8) return 2;
  return 3;
}

export function baselineOverall(state: GameState): number {
  if (state.stage === "youth") return 58;
  if (state.stage === "reserves") return 65;
  return clubDef(state.clubId).tier === 1 ? 71 : 68;
}

const KEY_MOMENTS: KeyMoment[] = [
  {
    prompt: "Penalti a favor en el 71'. El capitán te mira y te deja el balón.",
    minute: 71,
    options: [
      { id: "izq", label: "Ajustado a la izquierda", success: 0.74, note: "Colocado, sin fuerza." },
      { id: "der", label: "Ajustado a la derecha", success: 0.74, note: "Tu lado natural." },
      { id: "fuerte", label: "Fuerte y arriba", success: 0.8, note: "Si entra, es un cañonazo." },
      { id: "panenka", label: "Panenka", success: 0.48, note: "Gloria o ridículo eterno." },
      { id: "ceder", label: "Cederlo a un compañero", success: 0.78, note: "Vestuario contento, focos para otro." },
    ],
  },
  {
    prompt: "Minuto 89, te plantas solo con espacio y un compañero llegando por dentro.",
    minute: 89,
    options: [
      { id: "tiro", label: "Tirar tú desde la frontal", success: 0.4, note: "Egoísta pero valiente." },
      { id: "pase", label: "Pase al que llega", success: 0.58, note: "Asistencia probable." },
      { id: "falta", label: "Provocar la falta y proteger el resultado", success: 0.85, note: "Sin épica, con oficio." },
    ],
  },
  {
    prompt: "El rival aprieta en el 82' y el míster pide que bajes a tapar tu banda.",
    minute: 82,
    options: [
      { id: "obedecer", label: "Bajar y defender", success: 0.85, note: "El míster lo apunta." },
      { id: "quedarte", label: "Quedarte arriba buscando el contragolpe", success: 0.42, note: "Riesgo alto." },
    ],
  },
  {
    prompt: "Balón dividido con un central que te saca dos cabezas.",
    minute: 34,
    options: [
      { id: "meter", label: "Meter la pierna sin miedo", success: 0.6, note: "Puede salir caro." },
      { id: "proteger", label: "Proteger el cuerpo y aguantar", success: 0.82, note: "Cabeza fría." },
    ],
  },
];

function goalShare(pos: Position): number {
  switch (pos) {
    case "DC": return 0.4;
    case "EXT": return 0.26;
    case "MCO": return 0.24;
    case "MC": return 0.12;
    case "LAT": return 0.06;
    case "DFC": return 0.06;
    case "POR": return 0.003;
  }
}

function assistShare(pos: Position): number {
  switch (pos) {
    case "DC": return 0.16;
    case "EXT": return 0.3;
    case "MCO": return 0.32;
    case "MC": return 0.2;
    case "LAT": return 0.18;
    case "DFC": return 0.05;
    case "POR": return 0.01;
  }
}

function scoreline(state: GameState, opponentPrestige: number): [number, number] {
  let [gf, ga] = weighted(SCORELINES);
  const club = clubDef(state.clubId);
  const strength = club.prestige - opponentPrestige;
  if (strength > 0 && Math.random() < 0.2 + strength * 0.06 && ga > gf) [gf, ga] = [ga, gf];
  if (strength < 0 && Math.random() < 0.2 - strength * 0.06 && gf > ga) [gf, ga] = [ga, gf];
  return [gf, ga];
}

/** Contexto coherente para un partido clave. Se valida antes de devolverlo. */
export function makeContext(state: GameState, slot: Slot, index = 0): MatchContext {
  const club = clubDef(state.clubId);
  for (let i = 0; i < 6; i++) {
    const ctx = buildMatchContext({
      stage: state.stage,
      club,
      slot,
      index,
      memoryClubs: state.memory.rejectedClubs,
    });
    if (validateMatchContext(ctx, club.name)) return ctx;
  }
  return buildMatchContext({ stage: state.stage, club, slot: { kind: "match" }, index });
}

/**
 * Fuente ÚNICA de verdad del partido: contexto, marcador, minutos, goles del
 * jugador, asistencias, rating y relato salen todos de aquí y son coherentes.
 */
export function simulateMatch(state: GameState, slot: Slot = { kind: "match" }, index = 0): MatchData {
  const ctx = makeContext(state, slot, index);
  const role = computeRole(state);
  const oppDef = defById(CLUB_POOL.find((c) => c.name === ctx.opponent)?.id ?? "") ?? null;
  const oppPrestige = oppDef?.prestige ?? 3;

  let [gf, ga] = scoreline(state, oppPrestige);
  if (!ctx.isHome && Math.random() < 0.12 && gf > ga) [gf, ga] = [ga, gf];

  const minutes = role === 0 || role === 1 ? 0 : role === 2 ? rnd(12, 44) : rnd(60, 90);

  let goals = 0;
  let assists = 0;
  let rating = 0;
  const moments: MatchMoment[] = [];
  const quality = (state.overall - baselineOverall(state)) * 0.1 + (state.form - 50) * 0.018;

  if (minutes > 0) {
    const share = minutes / 90;
    // Reparto de los goles REALES del equipo: nunca puede marcar más que el equipo.
    for (let i = 0; i < gf; i++) {
      if (Math.random() < goalShare(state.player.position) * share * (1 + quality * 0.12)) goals += 1;
    }
    const remaining = gf - goals;
    for (let i = 0; i < remaining; i++) {
      if (Math.random() < assistShare(state.player.position) * share) assists += 1;
    }

    rating = 5.7 + quality + (Math.random() * 2 - 1) + (state.fitness - 70) * 0.004;
    rating += goals * 0.9 + assists * 0.55;
    if (state.player.position === "POR" || state.player.position === "DFC") {
      rating += ga === 0 ? 0.6 : ga >= 3 ? -0.7 : 0;
    }
    if (gf > ga) rating += 0.2;
    if (ga - gf >= 3) rating -= 0.5;
    rating = Math.max(3.8, Math.min(9.4, Math.round(rating * 10) / 10));

    const kickoff = Math.max(0, 90 - minutes);
    const span = Math.max(6, minutes - 6);
    for (let i = 0; i < goals; i++) {
      moments.push({ minute: kickoff + 4 + Math.floor(Math.random() * span), text: "Gol tuyo.", tone: "good" });
    }
    for (let i = 0; i < assists; i++) {
      moments.push({ minute: kickoff + 4 + Math.floor(Math.random() * span), text: "Asistencia tuya.", tone: "good" });
    }
    const teamOthers = gf - goals - assists;
    for (let i = 0; i < Math.max(0, teamOthers); i++) {
      moments.push({ minute: rnd(6, 88), text: "Gol de tu equipo.", tone: "neutral" });
    }
    for (let i = 0; i < ga; i++) {
      moments.push({ minute: rnd(6, 88), text: `Gol del ${ctx.opponentShort}.`, tone: "bad" });
    }
    if (rating < 5.2) moments.push({ minute: kickoff + 20, text: "Pérdida evitable en zona peligrosa.", tone: "bad" });
    if (rating >= 7.4) moments.push({ minute: kickoff + 12, text: "Jugada de calidad aplaudida por la grada.", tone: "good" });
    if (Math.random() < 0.14) moments.push({ minute: kickoff + 25, text: "Tarjeta amarilla.", tone: "bad" });
  } else {
    for (let i = 0; i < gf; i++) moments.push({ minute: rnd(6, 88), text: "Gol de tu equipo.", tone: "neutral" });
    for (let i = 0; i < ga; i++) moments.push({ minute: rnd(6, 88), text: `Gol del ${ctx.opponentShort}.`, tone: "bad" });
  }
  moments.sort((a, b) => a.minute - b.minute);

  const keyMoment = minutes >= 30 && Math.random() < 0.6 ? { ...pick(KEY_MOMENTS) } : undefined;

  const match: MatchData = {
    ctx,
    label: ctx.storyLabel,
    competition: ctx.competition,
    home: ctx.isHome,
    opponent: ctx.opponent,
    goalsFor: gf,
    goalsAgainst: ga,
    minutes,
    goals,
    assists,
    rating,
    moments,
    keyMoment,
    benchOnly: role === 1,
    unused: role === 0,
    tie: ctx.tie,
    debut: state.stage === "first" && !state.achievements.includes("debut_pro") && minutes > 0,
    shootout: undefined,
  };

  return validateMatch(match);
}

/** Invariantes duros: nada puede contradecir el marcador ni el contexto. */
export function validateMatch(m: MatchData): MatchData {
  // Coherencia de etiquetas: todo se reescribe desde el contexto único.
  m.competition = m.ctx.competition;
  m.opponent = m.ctx.opponent;
  m.home = m.ctx.isHome;
  m.label = m.ctx.storyLabel;
  m.tie = m.ctx.tie;

  m.goalsFor = Math.max(0, Math.round(m.goalsFor));
  m.goalsAgainst = Math.max(0, Math.round(m.goalsAgainst));
  m.minutes = Math.max(0, Math.min(90, Math.round(m.minutes || 0)));
  if (m.minutes === 0) {
    m.goals = 0;
    m.assists = 0;
    m.rating = 0;
  }
  m.goals = Math.max(0, Math.min(m.goals || 0, m.goalsFor));
  m.assists = Math.max(0, Math.min(m.assists || 0, Math.max(0, m.goalsFor - m.goals)));
  if (!Number.isFinite(m.rating)) m.rating = 0;
  if (m.minutes > 0) m.rating = Math.max(3.5, Math.min(9.7, Math.round(m.rating * 10) / 10));

  // Solo hay tanda de penaltis en eliminatoria empatada.
  if (m.tie && m.goalsFor === m.goalsAgainst) {
    if (!m.shootout) {
      const us = rnd(3, 5);
      const them = us === 5 ? rnd(3, 4) : rnd(us + 1, 5);
      m.shootout = Math.random() < 0.5 ? { us, them: Math.min(them, us - 1 >= 0 ? us - 1 : 0) } : { us: Math.min(them, 4), them: us };
      if (m.shootout.us === m.shootout.them) m.shootout.them = m.shootout.us + 1;
    }
  } else {
    m.shootout = undefined;
  }

  // Relato coherente: cuenta de goles narrados == marcador.
  const narratedFor = m.moments.filter((x) => x.text.includes("Gol tuyo") || x.text.includes("Gol de tu equipo")).length
    + m.moments.filter((x) => x.text.includes("Asistencia tuya")).length;
  if (narratedFor > m.goalsFor + m.assists) {
    m.moments = m.moments.filter((x) => !x.text.includes("Gol de tu equipo")).slice(0, 12);
  }
  m.moments = m.moments
    .map((x) => ({ ...x, minute: Math.max(1, Math.min(90, Math.round(x.minute))) }))
    .sort((a, b) => a.minute - b.minute)
    .slice(0, 12);
  return m;
}

/* ==================== Simulación en SEGUNDO PLANO ==================== */

export interface SimRun {
  results: RecentResult[];
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  apps: number;
  goals: number;
  assists: number;
  ratingSum: number;
  cleanSheets: number;
  missed: number;
  /** Si ha pasado algo digno de escena (expulsión, gol decisivo, titularidad…). */
  notable: { kind: string; text: string; opponent: string } | null;
}

/**
 * Resuelve N jornadas sin pantalla propia. Devuelve datos para el feed y,
 * ocasionalmente, un hecho notable que el motor sí convierte en escena.
 */
export function simulateRun(state: GameState, count: number): SimRun {
  const club = clubDef(state.clubId);
  const role = computeRole(state);
  const run: SimRun = {
    results: [],
    matches: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    apps: 0,
    goals: 0,
    assists: 0,
    ratingSum: 0,
    cleanSheets: 0,
    missed: 0,
    notable: null,
  };

  const injuredFor = state.injury ? state.injury.matchesOut : 0;

  for (let i = 0; i < count; i++) {
    const slot: Slot = { kind: "match" };
    const ctx = makeContext(state, slot, i);
    const oppDef = CLUB_POOL.find((c) => c.name === ctx.opponent);
    const [gf, ga] = scoreline(state, oppDef?.prestige ?? 3);
    const played = i >= injuredFor && role >= 2;
    run.matches += 1;
    const res: RecentResult["res"] = gf > ga ? "W" : gf === ga ? "D" : "L";
    if (res === "W") run.wins += 1;
    else if (res === "D") run.draws += 1;
    else run.losses += 1;
    if (!played) run.missed += 1;

    let goals = 0;
    let assists = 0;
    if (played) {
      const share = role === 3 ? 0.95 : 0.42;
      for (let g = 0; g < gf; g++) {
        if (Math.random() < goalShare(state.player.position) * share) goals += 1;
      }
      for (let g = 0; g < gf - goals; g++) {
        if (Math.random() < assistShare(state.player.position) * share * 0.8) assists += 1;
      }
      goals = Math.min(goals, gf);
      assists = Math.min(assists, Math.max(0, gf - goals));
      const rating = Math.max(
        4,
        Math.min(9.2, 5.9 + (state.overall - baselineOverall(state)) * 0.08 + goals * 0.8 + assists * 0.4 + (Math.random() * 1.4 - 0.7)),
      );
      run.apps += 1;
      run.goals += goals;
      run.assists += assists;
      run.ratingSum += rating;
      if (ga === 0) run.cleanSheets += 1;

      if (!run.notable) {
        if (goals >= 2) {
          run.notable = { kind: "brace", text: `Firmas ${goals} goles en un partido que nadie esperaba que jugaras entero.`, opponent: ctx.opponent };
        } else if (goals === 1 && res === "W" && gf - ga === 1 && Math.random() < 0.7) {
          run.notable = { kind: "winner", text: `Tu gol decide el partido ante el ${ctx.opponent}.`, opponent: ctx.opponent };
        } else if (Math.random() < 0.06) {
          run.notable = { kind: "red", text: `Te expulsan en ${ctx.venue} con el partido roto.`, opponent: ctx.opponent };
        } else if (rating < 4.8 && Math.random() < 0.35) {
          run.notable = { kind: "bad", text: `Partido para olvidar ante el ${ctx.opponent}: te cambian antes de la hora.`, opponent: ctx.opponent };
        }
      }
    } else if (!run.notable && role <= 1 && Math.random() < 0.05) {
      run.notable = { kind: "snub", text: `Te quedas fuera de la lista para ir a ${ctx.venueCity}. El míster no da explicaciones.`, opponent: ctx.opponent };
    }

    run.results.push({ opponent: oppDef?.short ?? ctx.opponentShort, gf, ga, res, played, goals, assists });
  }

  if (club.prestige >= 5 && run.losses > run.wins && Math.random() < 0.3) {
    // Los grandes no encajan bien las malas rachas: material para escena.
    if (!run.notable) run.notable = { kind: "crisis", text: "La racha ha encendido al entorno del club.", opponent: run.results[0]?.opponent ?? "" };
  }

  return run;
}
