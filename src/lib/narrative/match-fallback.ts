/**
 * Crónica de partido de emergencia, escrita en código. Si la IA falla
 * (caída, límite de uso, clave caducada) el partido no puede quedarse sin
 * resolver: la semana no avanza mientras haya un partido pendiente y el
 * jugador se quedaba atascado viendo escenas de relleno sin fin. Esta
 * versión usa el marcador y la jugada ya decididos en código para que el
 * partido se juegue igual, con la misma estructura de datos (marcador,
 * minutos, nota, goles, asistencias) que la crónica de la IA.
 */
import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import type { MatchWeek } from "@/lib/calendar/match-calendar";
import { computeRole } from "@/lib/narrative/role";

interface Decision {
  outcome?: string;
  sit?: string;
  min?: string | number;
}

const COMP_LABEL: Record<string, string> = {
  liga: "La Liga",
  copa: "Copa del Rey",
  champions: "Champions League",
  europa: "Europa League",
  internacional: "Partido internacional",
};

const HEADLINES: Record<string, string[]> = {
  goal: ["tu gol marca el partido", "noche de goleador", "el gol que cambia la tarde"],
  wondergoal: ["una genialidad para el recuerdo", "golazo de los que se repiten mil veces"],
  assist: ["tu pase abre la defensa", "el asistente de la noche"],
  miss: ["ocasión clara fallada", "la que no entró"],
  miss_bad: ["la jugada que salió mal", "un riesgo que costó caro"],
  save: ["una intervención decisiva", "la noche de las manos"],
  concede: ["una acción que pesa en el marcador", "el gol que escuece"],
  clean_tackle: ["una entrada de manual", "firmeza atrás"],
  contained: ["partido de oficio", "sin sobresaltos"],
  beaten: ["un momento para olvidar", "te superan en una jugada clave"],
  foul_committed: ["una falta que cuesta caro", "amarilla y susto"],
  penalty_conceded: ["el penalti que lo cambia todo", "una salida que sale cara"],
};

function rnd<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function parseScore(line: string): { own: number; rival: number } | null {
  const m = line.match(/(\d{1,2})\s*-\s*(\d{1,2})/);
  return m ? { own: Number(m[1]), rival: Number(m[2]) } : null;
}

export function buildFallbackMatchReport(args: {
  player: Player;
  match: MatchWeek;
  decisionRaw?: string;
  /** Marcador ya decidido (de la Copa/eliminatorias o el torneo), siempre "propio-rival". */
  forcedScoreLine?: string;
  /** En eliminatorias: si tu equipo pasa o cae (importa si se decide en penaltis). */
  forcedWin?: boolean;
  /** Nombre de tu equipo en el marcador (el club, o la selección en un torneo). */
  team: string;
  /** Texto de competición extra, ej. "Mundial 2030". */
  competitionNote?: string;
}): GameEvent {
  const { player, match, team } = args;
  let decision: Decision = {};
  try {
    decision = args.decisionRaw ? (JSON.parse(args.decisionRaw) as Decision) : {};
  } catch {
    decision = {};
  }
  const outcome = decision.outcome ?? "contained";
  const role = match.competition === "internacional" ? "titular" : computeRole(player).role;

  // Marcador
  let own: number;
  let rival: number;
  const forced = args.forcedScoreLine ? parseScore(args.forcedScoreLine) : null;
  if (forced) {
    own = forced.own;
    rival = forced.rival;
  } else {
    const r = Math.random();
    const strong = (player.media ?? 60) >= 70;
    const win = strong ? 0.58 : 0.45;
    const draw = 0.24;
    if (r < win) { own = 1 + Math.floor(Math.random() * 3); rival = Math.floor(Math.random() * own); }
    else if (r < win + draw) { own = Math.floor(Math.random() * 3); rival = own; }
    else { rival = 1 + Math.floor(Math.random() * 3); own = Math.floor(Math.random() * rival); }
  }

  // Goles y asistencias coherentes con la jugada decisiva ya vivida
  let goals = outcome === "goal" || outcome === "wondergoal" ? 1 : 0;
  const assists = outcome === "assist" ? 1 : 0;
  if (goals === 1 && Math.random() < 0.12) goals = 2;
  if (outcome === "concede" || outcome === "penalty_conceded") rival = Math.max(rival, 1);
  own = Math.max(own, goals + assists);

  // Minutos según el rol; la jugada decisiva tiene que caber dentro
  const rawMin = String(decision.min ?? "");
  const decisionMin = rawMin.includes("+") ? 90 : parseInt(rawMin, 10) || 0;
  let minutes = role === "titular" ? 80 + Math.floor(Math.random() * 11) : role === "rotacion" ? 45 + Math.floor(Math.random() * 26) : 10 + Math.floor(Math.random() * 21);
  minutes = Math.min(90, Math.max(minutes, decisionMin > 0 ? decisionMin + 3 : 0));

  // Nota
  const bad = ["miss_bad", "concede", "beaten", "penalty_conceded", "foul_committed"].includes(outcome);
  let rating = 6.2 + goals * 1.3 + assists * 0.7 - (bad ? 0.7 : 0) + (Math.random() - 0.5);
  rating = Math.max(4.5, Math.min(9.6, rating));
  const nota = rating.toFixed(1);

  const verdict =
    own === rival && args.forcedWin !== undefined
      ? args.forcedWin ? "gana en los penaltis a" : "pierde en los penaltis ante"
      : own > rival ? "gana a" : own === rival ? "empata con" : "pierde ante";
  const compBase = COMP_LABEL[match.competition] ?? "partido oficial";
  const comp = args.competitionNote ? `${compBase} (${args.competitionNote})` : compBase;
  const headline = rnd(HEADLINES[outcome] ?? HEADLINES.contained);
  const keyPlay = decision.sit
    ? ` En el minuto ${rawMin || "clave"} llegó el momento decisivo: ${decision.sit.charAt(0).toLowerCase()}${decision.sit.slice(1)}`
    : "";

  const mediaDelta = rating >= 8 ? 3 : rating >= 7 ? 1 : rating < 5.2 ? -2 : rating < 5.8 ? -1 : 0;
  const base = { media: mediaDelta };
  const options = [
    {
      id: "a",
      label: "Dar la cara en zona mixta",
      subtitle: "Hablar con la prensa",
      consequences: { ...base, fama: goals > 0 ? 3 : bad ? -1 : 1 },
      outcomeText: goals > 0 ? "Los micrófonos te buscan a ti. Respondes con calma, y tus palabras abren los informativos de la noche." : "Respondes con serenidad a las preguntas incómodas. Nadie te saca una frase fuera de tono.",
    },
    {
      id: "b",
      label: "Analizar el partido con el míster",
      subtitle: "Repasar lo que salió bien y mal",
      consequences: { ...base, rel_entrenador: bad ? 1 : 2, forma: 1 },
      outcomeText: "Os sentáis cinco minutos en su despacho con el vídeo parado en tu jugada. No hay reproches: hay detalles concretos que mejorar.",
    },
    {
      id: "c",
      label: "Salir a cenar con los compañeros",
      subtitle: "Cerrar la noche en grupo",
      consequences: { ...base, rel_vestuario: 3, moral: bad ? 2 : 1 },
      outcomeText: "Acabáis en una pizzería hasta que echan el cierre. Entre risas, el partido pesa menos y el grupo se siente un poco más equipo.",
    },
  ];

  return {
    id: `matchday-${match.week}-fallback-${Date.now()}`,
    category: "partido",
    title: `${team} ${own}-${rival} ${match.rivalClub}: ${headline}`,
    description: `Ante ${match.rivalClub} en ${comp}, jugaste ${minutes} minutos. Nota: ${nota}/10. Goles: ${goals}. Asistencias: ${assists}. Marcador: ${own}-${rival} (${team}-${match.rivalClub}). Tu equipo ${verdict} ${match.rivalClub}.${keyPlay}`,
    rivalClub: match.rivalClub,
    options,
  };
}
