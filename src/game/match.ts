import { FIRST_OPPONENTS, RESERVE_OPPONENTS, YOUTH_OPPONENTS, clubById } from "./data";
import type { GameState, KeyMoment, MatchData, MatchMoment, Position } from "./types";

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
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

const SCORELINES: readonly [[number, number], number][] = [
  [[0, 0], 10],
  [[1, 0], 12],
  [[2, 0], 10],
  [[3, 0], 6],
  [[1, 1], 9],
  [[2, 1], 6],
  [[3, 1], 6],
  [[4, 1], 3],
  [[4, 0], 2],
  [[0, 1], 11],
  [[0, 2], 9],
  [[1, 2], 6],
  [[0, 3], 5],
  [[1, 3], 4],
  [[2, 2], 3],
  [[0, 4], 2],
  [[2, 3], 2],
  [[5, 0], 1],
  [[0, 5], 1],
];

export function competitionFor(state: GameState): string {
  if (state.stage === "youth") return "División de Honor Juvenil";
  if (state.stage === "reserves") return "Primera Federación";
  return state.flags["copa"] ? "Copa del Rey" : "LaLiga";
}

function opponentsFor(state: GameState): readonly string[] {
  if (state.stage === "youth") return YOUTH_OPPONENTS;
  if (state.stage === "reserves") return RESERVE_OPPONENTS;
  return FIRST_OPPONENTS;
}

/** 0 = no convocado, 1 = banquillo sin jugar, 2 = suplente con minutos, 3 = titular */
export function computeRole(state: GameState): number {
  if (state.injuryWeeks > 0) return 0;
  const status = state.flags["status"] ?? 0; // 0 juvenil sin debut, 1 debutado, 2 titular
  const club = clubById(state.clubId);
  let score = (state.overall - baselineOverall(state)) * 3;
  score += (state.rel.coach - 50) * 0.35;
  score += (state.form - 50) * 0.25;
  score += club.minutesBonus * 2;
  score += status * 12;
  score += state.flags["nolist"] ? -25 : 0;

  if (score < -18) return 0;
  if (score < -4) return 1;
  if (score < 12) return 2;
  return 3;
}

export function baselineOverall(state: GameState): number {
  if (state.stage === "youth") return 52;
  if (state.stage === "reserves") return 61;
  return 69;
}

const KEY_MOMENTS: KeyMoment[] = [
  {
    prompt: "Penalti a favor en el 71'. El capitán te mira y te deja el balón.",
    minute: 71,
    options: [
      { id: "izq", label: "Ajustado a la izquierda", success: 0.74, note: "Colocado, sin fuerza." },
      { id: "der", label: "Ajustado a la derecha", success: 0.74, note: "Tu lado natural." },
      { id: "fuerte", label: "Fuerte y arriba", success: 0.8, note: "Si entra, es un cañonazo." },
      { id: "panenka", label: "Panenka", success: 0.5, note: "Gloria o ridículo eterno." },
      { id: "ceder", label: "Cederlo a un compañero", success: 0.78, note: "Vestuario contento, focos para otro." },
    ],
  },
  {
    prompt: "Minuto 89, empate, te plantas solo con espacio y un compañero llegando por dentro.",
    minute: 89,
    options: [
      { id: "tiro", label: "Tirar tú desde la frontal", success: 0.42, note: "Egoísta pero valiente." },
      { id: "pase", label: "Pase al que llega", success: 0.6, note: "Asistencia probable." },
      { id: "falta", label: "Provocar la falta y proteger el punto", success: 0.85, note: "Sin épica, con oficio." },
    ],
  },
  {
    prompt: "El rival aprieta en el 82' y el míster pide que bajes a tapar tu banda.",
    minute: 82,
    options: [
      { id: "obedecer", label: "Bajar y defender", success: 0.85, note: "El míster lo apunta." },
      { id: "quedarte", label: "Quedarte arriba buscando el contragolpe", success: 0.45, note: "Riesgo alto." },
    ],
  },
  {
    prompt: "Te llega un balón dividido con un central que te saca dos cabezas.",
    minute: 34,
    options: [
      { id: "meter", label: "Meter la pierna sin miedo", success: 0.6, note: "Puede salir caro." },
      { id: "proteger", label: "Proteger el cuerpo y aguantar", success: 0.82, note: "Cabeza fría." },
    ],
  },
];

function goalProbability(pos: Position): number {
  switch (pos) {
    case "DC": return 0.42;
    case "EXT": return 0.3;
    case "MCO": return 0.28;
    case "MC": return 0.14;
    case "LAT": return 0.07;
    case "DFC": return 0.07;
    case "POR": return 0.004;
  }
}

function assistProbability(pos: Position): number {
  switch (pos) {
    case "DC": return 0.18;
    case "EXT": return 0.32;
    case "MCO": return 0.34;
    case "MC": return 0.22;
    case "LAT": return 0.18;
    case "DFC": return 0.05;
    case "POR": return 0.01;
  }
}

export function simulateMatch(state: GameState): MatchData {
  const club = clubById(state.clubId);
  const role = computeRole(state);
  const competition = competitionFor(state);
  const opponent = pick(opponentsFor(state));
  const home = Math.random() < 0.5;

  let [gf, ga] = weighted(SCORELINES);
  const strength = club.prestige - 3 + (state.stage === "first" ? 0 : 1);
  if (strength > 0 && Math.random() < 0.28 && ga > gf) {
    [gf, ga] = [ga, gf];
  }
  if (strength < 0 && Math.random() < 0.25 && gf > ga) {
    [gf, ga] = [ga, gf];
  }

  const minutes =
    role === 0 ? 0 : role === 1 ? 0 : role === 2 ? 12 + Math.floor(Math.random() * 33) : 60 + Math.floor(Math.random() * 31);

  let rating = 0;
  let goals = 0;
  let assists = 0;
  const moments: MatchMoment[] = [];

  if (minutes > 0) {
    const quality = (state.overall - baselineOverall(state)) * 0.12 + (state.form - 50) * 0.02;
    rating = 5.6 + quality + (Math.random() * 2.2 - 1.1) + (state.fitness - 70) * 0.005;
    const share = minutes / 90;
    const gp = goalProbability(state.player.position) * share * (1 + quality * 0.15) * (gf > 0 ? 1.25 : 0.35);
    const ap = assistProbability(state.player.position) * share * (gf > 0 ? 1.2 : 0.3);
    if (Math.random() < gp) goals += 1;
    if (goals === 1 && Math.random() < gp * 0.22) goals += 1;
    if (Math.random() < ap) assists += 1;

    rating += goals * 0.9 + assists * 0.55;
    if (state.player.position === "POR" || state.player.position === "DFC") {
      rating += ga === 0 ? 0.6 : ga >= 3 ? -0.7 : 0;
    }
    if (gf > ga) rating += 0.2;
    if (ga - gf >= 3) rating -= 0.5;
    rating = Math.max(3.8, Math.min(9.4, Math.round(rating * 10) / 10));

    const kickoff = 90 - minutes;
    for (let i = 0; i < goals; i++) {
      moments.push({ minute: kickoff + 5 + Math.floor(Math.random() * Math.max(5, minutes - 6)), text: "Gol tuyo.", tone: "good" });
    }
    for (let i = 0; i < assists; i++) {
      moments.push({ minute: kickoff + 5 + Math.floor(Math.random() * Math.max(5, minutes - 6)), text: "Asistencia tuya.", tone: "good" });
    }
    if (rating < 5.2) moments.push({ minute: kickoff + 20, text: "Pérdida evitable en zona peligrosa.", tone: "bad" });
    if (rating >= 7.4) moments.push({ minute: kickoff + 12, text: "Jugada de calidad aplaudida por la grada.", tone: "good" });
    if (Math.random() < 0.16) moments.push({ minute: kickoff + 30, text: "Tarjeta amarilla.", tone: "bad" });
    if (ga > 0) moments.push({ minute: 10 + Math.floor(Math.random() * 78), text: `Gol de ${opponent}.`, tone: "bad" });
    if (gf > goals) moments.push({ minute: 10 + Math.floor(Math.random() * 78), text: "Gol de tu equipo.", tone: "neutral" });
    moments.sort((a, b) => a.minute - b.minute);
  }

  const keyMoment = minutes >= 35 && Math.random() < 0.3 ? { ...pick(KEY_MOMENTS) } : undefined;

  return {
    competition,
    home,
    opponent,
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
  };
}
