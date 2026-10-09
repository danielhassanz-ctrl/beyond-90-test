/**
 * Escenas que nacen del rol del jugador en el equipo (ver role.ts): el
 * partido que ves desde el banquillo cuando el entrenador no cuenta contigo y
 * la salida del club cuando eso se alarga. Todo en código (cero llamadas a la
 * IA). Cada opción deja una consecuencia real: el rol se recupera, empeora o
 * te lleva a otro equipo.
 */
import type { EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import type { MatchWeek } from "@/lib/calendar/match-calendar";
import { getClubLevel } from "@/lib/calendar/match-calendar";
import { ligaLabel, copaLabel, leagueOf } from "@/lib/calendar/leagues";
import { benchRemaining } from "@/lib/narrative/role";

const WEEKS_PER_SEASON = 10;

const streakOf = (player: Player) => parseInt(String(player.flags?.bench_streak ?? "0"), 10) || 0;

/** Partido del equipo SIN ti: el entrenador no te convoca. */
export function buildBenchedMatchEvent(player: Player, match: MatchWeek): GameEvent {
  const compLabel: Record<string, string> = {
    liga: ligaLabel(player.club),
    copa: copaLabel(player.club),
    champions: "Champions League",
    europa: "Europa League",
  };
  let h = 0;
  for (const ch of `${player.id}:${match.week}:${match.slot}:banquillo`) h = (h * 31 + ch.charCodeAt(0)) % 1000003;
  const roll = (h % 100) / 100;
  const own = roll < 0.5 ? 2 + (h % 2) : roll < 0.75 ? 1 : h % 2;
  const rival = roll < 0.5 ? h % 2 : roll < 0.75 ? 1 : 2 + (h % 2);
  const verdict = own > rival ? "gana" : own === rival ? "empata" : "pierde";
  const comp = compLabel[match.competition] ?? "partido oficial";
  const streak = streakOf(player);
  const bench = benchRemaining(player.flags);
  const base = { bench_streak: String(streak + 1) };

  const options: EventOption[] = [
    {
      id: "a",
      label: "Pedirle al míster una charla cara a cara",
      subtitle: "Preguntar qué tienes que hacer para volver",
      consequences: {},
      resolve: {
        baseChance: 0.4,
        statModifier: "reputacion",
        success: {
          text: "Te escucha de verdad. Reconoce que ha sido duro contigo y te promete una oportunidad si respondes en los entrenamientos.",
          consequences: { rel_entrenador: 8, moral: 4, flags: { bench_streak: "0", coach_bench: String(Math.max(0, bench - 3)) } },
        },
        fail: {
          text: "La charla es corta y fría. Te dice que ya sabes lo que hay, y te quedas igual que entraste.",
          consequences: { moral: -4, rel_entrenador: -2, media: -1, flags: base },
        },
      },
    },
    {
      id: "b",
      label: "Entrenar el doble y esperar tu oportunidad",
      subtitle: "Ganártelo con trabajo",
      consequences: { forma: 3, moral: -1, rel_entrenador: 2, media: -1, flags: base },
      outcomeText: "Eres el primero en llegar y el último en irte. Nadie dice nada, pero el preparador físico te anota la constancia.",
    },
    {
      id: "c",
      label: "Pedirle a tu representante que te busque equipo",
      subtitle: "Salir donde sí cuenten contigo",
      consequences: {
        rel_representante: 2,
        moral: 1,
        media: -1,
        flags: {
          ...base,
          transfer_interest: pickLowerClub(player),
          transfer_interest_week: String(player.week),
          transfer_interest_source: "agente",
        },
      },
      outcomeText: "Tu representante toma nota sin hacer preguntas. \"Dame unas semanas\", te dice. Esta misma noche ya está llamando.",
    },
    {
      id: "d",
      label: "Callarte y aguantar el chaparrón",
      subtitle: "No hacer ruido",
      consequences: { moral: -3, media: -1, flags: base },
      outcomeText: "Te sientas en la grada y aplaudes cuando toca. Por dentro, algo se va enfriando.",
    },
  ];

  return {
    id: `matchday-baja-banquillo-${match.week}-${Date.now()}`,
    category: "partido",
    rivalClub: match.rivalClub,
    title: `Fuera de la convocatoria: ${player.club} ${verdict} ante ${match.rivalClub}`,
    description: `${comp} ante ${match.rivalClub}. El entrenador no te incluye en la lista: no juegas ni siquiera desde el banquillo. Marcador: ${own}-${rival} (${player.club}-${match.rivalClub}). Lo ves desde la grada, con la camiseta de paisano, mientras el equipo juega sin ti.`,
    options,
  };
}

const LOWER_CLUBS: Record<"grande" | "europeo" | "modesto", string[]> = {
  grande: ["Sevilla FC", "Real Betis", "Villarreal CF", "Real Sociedad", "Athletic Club", "Valencia CF"],
  europeo: ["Getafe CF", "Osasuna", "Celta de Vigo", "Mallorca", "Girona FC", "Las Palmas"],
  modesto: ["CD Tenerife", "Real Zaragoza", "Racing de Santander", "Real Oviedo", "UD Almería", "Cádiz CF"],
};

export function pickLowerClub(player: Player): string {
  const level = getClubLevel(player.club);
  const lg = leagueOf(player.club);
  // Fuera de España, un escalón por debajo dentro de TU liga (no un club español).
  const own =
    lg.id === "es"
      ? []
      : lg.teams.filter((t) => {
          const tier = lg.tiers[t] ?? 3;
          return level === "grande" ? tier >= 3 && tier <= 4 : level === "europeo" ? tier >= 2 && tier <= 3 : tier <= 2;
        });
  const base = own.length > 0 ? own : LOWER_CLUBS[level];
  const pool = base.filter((c) => c !== player.club);
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Tras dos partidos seguidos fuera de la convocatoria, el club te pone en la calle (una vez por temporada). */
export function shouldTriggerBenchEscape(player: Player): boolean {
  if (streakOf(player) < 2) return false;
  const season = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  return !player.flags?.[`bench_escape_${season}`];
}

export function buildBenchEscapeEvent(player: Player): GameEvent {
  const season = Math.floor((player.week - 1) / WEEKS_PER_SEASON);
  const club = pickLowerClub(player);
  const agent = player.agent_name && !/^(Tu |Sin )/.test(player.agent_name) ? player.agent_name : "Tu representante";
  const seen = { [`bench_escape_${season}`]: true };
  const reset = { bench_streak: "0", coach_bench: "0" };
  return {
    id: `mercado-banquillo-${Date.now()}`,
    category: "representante",
    title: "El club te pide que busques una salida",
    description: `${agent} te cita con cara de pocos amigos: dos jornadas fuera de la lista y el club te lo deja claro, con educación pero sin rodeos. "Si no te vas a quedar a pelear por un sitio, es mejor que busques minutos en otro lado. Hay clubes interesados, como ${club}."`,
    options: [
      {
        id: "traspaso",
        label: `Aceptar el traspaso a ${club}`,
        subtitle: "Jugar con regularidad en otro club",
        consequences: { club, moral: 6, fama: -2, rel_aficion: -3, rel_vestuario: -2, rel_entrenador: 30, flags: { ...seen, ...reset } },
        outcomeText: "Firmas la salida con sentimientos encontrados: te vas del club de tus sueños, pero te vas a jugar.",
      },
      {
        id: "pelear",
        label: "Quedarte y pelear por tu sitio",
        subtitle: "Demostrarle al míster que se equivoca",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "moral",
          success: {
            text: "Tu respuesta en los entrenamientos es tan fuerte que el míster rectifica delante de todo el grupo. Vuelves a contar.",
            consequences: { rel_entrenador: 25, moral: 6, rel_vestuario: 3, flags: { ...seen, ...reset } },
          },
          fail: {
            text: "Das la cara, pero el míster no cambia de opinión. Sigues sin sitio y con el club ya mirando a otro lado.",
            consequences: { moral: -6, rel_entrenador: -3, flags: { ...seen, bench_streak: "0", coach_bench: "3" } },
          },
        },
      },
      {
        id: "mercado",
        label: "Pedir a tu representante que busque ofertas",
        subtitle: "Dejar abierta la puerta",
        consequences: {
          rel_representante: 3,
          flags: {
            ...seen,
            bench_streak: "0",
            transfer_interest: club,
            transfer_interest_week: String(player.week),
            transfer_interest_source: "agente",
          },
        },
        outcomeText: `${agent} ya tiene el teléfono en la oreja antes de que acabes la frase.`,
      },
    ],
  };
}
