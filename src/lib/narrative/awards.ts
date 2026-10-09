/**
 * Premios con lista de finalistas (Golden Boy, Balón de Oro) y la convocatoria de un
 * torneo de selecciones con la lista de elegidos. Todo en código, sin llamadas a la IA:
 * los nombres de los demás son inventados (estables para esa partida y ese año), y el
 * puesto del jugador sale de su nivel real frente a los rivales de su generación.
 */
import type { GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { fictionalFullName, fictionalPlayerName } from "@/lib/narrative/npcs";
import { CLUB_WEIGHTS, championsPodium, weightedPick } from "@/lib/narrative/world-results";
import { getRivals } from "@/lib/narrative/rivals";
import { maxMediaForAge } from "@/lib/narrative/media-cap";
import { TORNEO_NAMES, torneoYear, type TorneoType } from "@/lib/narrative/torneo";
import { readTrofeos } from "@/lib/honours";

export type AwardKind = "golden_boy" | "balon_oro";

const CLUBS = [
  "Real Madrid", "FC Barcelona", "Manchester City", "Bayern Múnich", "Paris Saint-Germain", "Liverpool FC",
  "Inter de Milán", "Borussia Dortmund", "Juventus", "Atlético de Madrid", "Arsenal", "Benfica", "Ajax", "Sporting CP",
];

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return h >>> 0;
}
/** Decimal estable en [-1, 1]. */
const jitter = (seed: string) => ((hash(seed) % 2001) - 1000) / 1000;

interface Finalist {
  name: string;
  club: string;
  score: number;
  isPlayer: boolean;
}

function seasonOf(player: Player) {
  return Math.floor((player.week - 1) / 10);
}

/** Qué premio toca esta temporada (turno 6, la gala de invierno), o null. */
export function awardDue(player: Player, weekInSeason: number): AwardKind | null {
  if (weekInSeason !== 6 || player.club === NO_CLUB_YET || player.status !== "active") return null;
  const age = playerAge(player.week);
  const season = seasonOf(player);
  const flags = player.flags ?? {};
  if (age >= 17 && age <= 20 && !flags.golden_boy && !flags[`award_gb_${season}`] && player.media >= 66 && (player.fama ?? 0) >= 30) return "golden_boy";
  if (age >= 20 && !flags[`award_bo_${season}`] && player.media >= 84 && (player.fama ?? 0) >= 60) return "balon_oro";
  return null;
}

function finalists(player: Player, kind: AwardKind): Finalist[] {
  const season = seasonOf(player);
  const mine = displayName(player);
  const titlesThisSeason = readTrofeos(player.flags).filter((t) => t.s === season || t.s === season - 1).length;
  // El Balón de Oro lo ganan jugadores de 24-30 años en su apogeo; un chico de 20 casi nunca (solo un genio generacional).
  // La edad pesa: cuanto más joven, más lejos del puesto de arriba aunque la media sea altísima.
  const ageNow = playerAge(player.week);
  const youthPenalty = kind === "balon_oro" ? Math.max(0, 25 - ageNow) * 1.6 : 0;
  const playerScore =
    player.media + ((player.fama ?? 50) - 50) * 0.06 + Math.min(4, titlesThisSeason * 1.5) - youthPenalty + jitter(`${player.id}:${kind}:${season}:yo`) * 1.5;
  // Los demás: los megacracks de tu generación (si encajan) y el resto inventados, de más a menos.
  const top = kind === "golden_boy" ? maxMediaForAge(player.week, 78) : 90;
  const out: Finalist[] = [{ name: mine, club: player.club, score: playerScore, isPlayer: true }];
  const megas = getRivals(player).filter((r) => r.kind === "mega" && (kind === "balon_oro" || r.media > 0));
  for (const m of megas) out.push({ name: m.name, club: m.club, score: m.media - 2.5 + jitter(`${m.name}:${season}`) * 1.5, isPlayer: false });
  // Los clubes que de verdad han ganado mandan: el campeón de Europa de la temporada pasada (tu club, si lo ganaste tú) y
  // el finalista aportan jugadores a la lista; el resto sale de los grandes de todas las ligas, con un máximo de dos por club.
  const podium = championsPodium(player, season - 1);
  const perClub = new Map<string, number>();
  const count = (c: string) => perClub.get(c) ?? 0;
  for (const f of out) perClub.set(f.club, count(f.club) + 1);
  const forced: string[] = [
    podium.winner, podium.winner, ...(kind === "balon_oro" ? [podium.winner] : []), podium.runnerUp,
  ];
  for (let i = out.length - 1; out.length < 10; i++) {
    const seed = `${player.id}:${kind}:${season}:f${i}`;
    const wanted = forced.shift();
    const full = new Set(CLUB_WEIGHTS.map(([c]) => c).filter((c) => count(c) >= (c === podium.winner ? 3 : 2)));
    const club = wanted && count(wanted) < 3 ? wanted : weightedPick(`${seed}:c`, CLUB_WEIGHTS, full);
    perClub.set(club, count(club) + 1);
    const champBonus = club === podium.winner ? 2.2 : club === podium.runnerUp ? 1 : 0;
    out.push({
      name: fictionalPlayerName(seed, club, player.last_name),
      club,
      score: top - 1.5 - (out.length - 3) * (kind === "golden_boy" ? 1.1 : 0.9) + jitter(`${seed}:s`) * 2.5 + champBonus,
      isPlayer: false,
    });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 10);
}

const listLine = (list: Finalist[]) => list.map((f, i) => `${i + 1}. ${f.name}${f.isPlayer ? " (tú)" : ""} · ${f.club}`).join("  |  ");

/** El evento del premio (con la clasificación final ya decidida), o null si no toca o no entras entre los diez. */
export function buildAwardEvent(player: Player, kind: AwardKind): GameEvent {
  const season = seasonOf(player);
  const list = finalists(player, kind);
  const rank = list.findIndex((f) => f.isPlayer) + 1;
  const year = 2026 + season;
  const gb = kind === "golden_boy";
  const prizeName = gb ? "Golden Boy" : "Balón de Oro";
  const alphabetical = [...list].sort((a, b) => a.name.localeCompare(b.name, "es")).map((f) => `${f.name}${f.isPlayer ? " (tú)" : ""} (${f.club})`).join(" · ");
  const winner = list[0];
  const podium = list.slice(0, 3).map((f, i) => `${i + 1}. ${f.name}${f.isPlayer ? " (tú)" : ""}`).join("  ·  ");
  const resultLine = `Clasificación final: ${listLine(list)}.`;

  const base = gb
    ? rank === 1
      ? { fama: 14, moral: 12, rel_aficion: 6, reputacion: 5 }
      : rank <= 3
        ? { fama: 5, moral: 3, reputacion: 2 }
        : { fama: 2, moral: 0 }
    : rank === 1
      ? { fama: 20, moral: 15, rel_aficion: 8, reputacion: 8, media: 1 }
      : rank <= 3
        ? { fama: 7, moral: 4, reputacion: 3 }
        : { fama: 3, moral: -1 };
  const flags: Record<string, string | boolean> = {
    [`award_${gb ? "gb" : "bo"}_${season}`]: true,
    ...(rank === 1 ? (gb ? { golden_boy: true } : { title_balon_oro: true }) : {}),
    ...(gb && rank > 1 && rank <= 3 ? { gb_finalista: true } : {}),
  };

  const verdict =
    rank === 1
      ? `Dicen tu nombre. Durante un segundo no oyes nada. Eres el ganador del ${prizeName} ${year}.`
      : rank <= 3
        ? `El ${prizeName} se lo lleva ${winner.name}. Tú terminas en el puesto ${rank}: tan cerca que casi puedes tocarlo.`
        : `El ${prizeName} se lo lleva ${winner.name}. Tú terminas en el puesto ${rank}, entre los diez mejores. No es poco, y lo sabes.`;
  const extra = (a: string, b: string, c: string) => (rank === 1 ? a : rank <= 3 ? b : c);

  return {
    id: `award-${gb ? "golden-boy" : "balon-oro"}-${season}`,
    category: "especial",
    title: gb ? `Golden Boy ${year}: los diez finalistas` : `Balón de Oro ${year}: la gala`,
    description: gb
      ? `Un diario italiano publica los diez finalistas del Golden Boy, el premio al mejor jugador menor de 21 años de Europa. Hay tres nombres que todo el mundo daba por hechos y varios que nadie esperaba. El tuyo está en la lista. Finalistas, por orden alfabético: ${alphabetical}. La gala es en pocos días.`
      : `Llega la noche de París. Los diez finalistas del Balón de Oro, por orden alfabético: ${alphabetical}. Hay un traje preparado en tu habitación del hotel y una butaca en primera fila con tu nombre. Todo el mundo del fútbol está mirando el mismo sobre.`,
    options: [
      {
        id: "a",
        label: gb ? "Ir a la gala con tu familia" : "Ir a la gala con tu familia y tu agente",
        subtitle: "Compartirlo con los tuyos",
        consequences: { ...base, moral: (base.moral ?? 0) + 2, flags },
        outcomeText: `${verdict} ${extra(
          "Tu madre llora antes de que termines de levantarte y tu padre, que no llora nunca, se tapa la cara con el programa.",
          "Tu madre te aprieta la mano bajo la mesa: «Para mí, has ganado». Y por unos segundos, te lo crees.",
          "Tu madre te susurra al oído que ha sido la mejor cena de su vida. A ti también te ha valido la pena.",
        )} ${resultLine}`,
      },
      {
        id: "b",
        label: "Ir solo, sin discurso preparado",
        subtitle: "Lo que salga",
        consequences: { ...base, reputacion: (base.reputacion ?? 0) + 1, flags },
        outcomeText: `${verdict} ${extra(
          "Subes sin papeles y tartamudeas tres frases que luego serán meme y homenaje a la vez. «Esto es para el barrio», dices. El mundo se enamora un poco de ti.",
          "Aplaudes de pie al ganador y la cámara te pilla sonriendo. «Qué deportividad», titulan al día siguiente.",
          "Sales con la corbata torcida y el móvil lleno de mensajes de gente que te quiere. No ganas el premio, pero ganas la noche.",
        )} ${resultLine}`,
      },
      {
        id: "c",
        label: "No ir: tienes partido mañana",
        subtitle: "Primero el equipo",
        consequences: { ...base, rel_entrenador: 3, moral: Math.max(-3, (base.moral ?? 0) - 3), flags },
        outcomeText: `${verdict} ${extra(
          "Lo recoges por videollamada desde el hotel de concentración, con el chándal del club y el pelo mojado. El equipo se levanta en bloque: es la mejor imagen de la noche.",
          "Lo ves por la tele con el resto de la plantilla. El míster te pone una mano en el hombro: «Esto es solo el principio».",
          "Lo sigues desde el sofá del hotel con los auriculares puestos. Mañana juegas; hoy descansas. El equipo te lo agradecerá más que el premio.",
        )} ${resultLine}`,
      },
    ],
    isMilestone: rank === 1,
    milestoneType: rank === 1 ? "premio" : undefined,
    imageScene:
      rank === 1
        ? gb
          ? "Photorealistic photo of a young footballer in a dark suit on a gala stage holding a golden trophy, flashbulbs and elegant audience, emotional smile, cinematic lighting, no logos or readable text"
          : "Photorealistic photo of a footballer in a tuxedo on a Paris gala stage holding a golden ball trophy above his head, flashbulbs and elegant audience, emotional smile, cinematic lighting, no logos or readable text"
        : undefined,
    // Dónde quedan los demás, por si la escena se enseña en una tarjeta.
    ...(podium ? {} : {}),
  };
}

/* ───────────── Convocatoria de un torneo de selecciones ───────────── */

/** La lista de 26: porteros, defensas, centrocampistas y delanteros, con el jugador en su sitio. */
function squadByLines(player: Player, type: TorneoType, season: number) {
  const pos = (player.position ?? "").toLowerCase();
  const myLine = pos.includes("portero") ? "Porteros" : pos.includes("defensa") || pos.includes("lateral") ? "Defensas" : pos.includes("delantero") || pos.includes("extremo") ? "Delanteros" : "Centrocampistas";
  const sizes: [string, number][] = [["Porteros", 3], ["Defensas", 8], ["Centrocampistas", 8], ["Delanteros", 7]];
  let n = 0;
  return sizes.map(([line, size]) => {
    const names: string[] = [];
    const slots = line === myLine ? size - 1 : size;
    for (let i = 0; i < slots; i++) names.push(fictionalFullName(`${player.id}:conv:${type}:${season}:${n++}`, player.last_name));
    if (line === myLine) names.splice(hash(`${player.id}:${type}:${season}:slot`) % (names.length + 1), 0, `${displayName(player)} (tú)`);
    return `${line}: ${names.join(", ")}`;
  });
}

export function buildConvocatoriaEvent(player: Player, type: TorneoType, season: number): GameEvent {
  const tName = `${TORNEO_NAMES[type]} ${torneoYear(season)}`;
  const nation = player.nation;
  const lines = squadByLines(player, type, season);
  const flagKey = `conv_${type}_${season}`;
  return {
    id: `sel-convocatoria-${type}-s${season}`,
    category: "especial",
    title: `Convocado para el ${tName}`,
    description: `El seleccionador de ${nation} lee la lista definitiva en una sala llena de cámaras, uno por uno, por orden de posición. Cuando llega a tu línea, el corazón te golpea el pecho. La lista de 26: ${lines.join(" · ")}. Tu nombre está ahí, entre los que van a representar a todo un país.`,
    options: [
      {
        id: "a",
        label: "Verlo en casa con tu familia",
        subtitle: "Compartirlo con los tuyos",
        consequences: { moral: 12, fama: 4, rel_aficion: 4, flags: { [flagKey]: true } },
        outcomeText: "Estáis todos en el salón. Cuando el seleccionador dice tu nombre, tu madre grita, tu padre se levanta de golpe y tira un vaso de agua. Nadie lo recoge hasta media hora después. Lo único que sabes decir es «voy al Mundial» una y otra vez.",
      },
      {
        id: "b",
        label: "Enterarte en el entrenamiento, con tus compañeros",
        subtitle: "Entre risas y abrazos",
        consequences: { moral: 10, fama: 3, rel_vestuario: 4, flags: { [flagKey]: true } },
        outcomeText: "Te lo cuenta el míster en medio del rondo, con un silbato en la boca. Todo el vestuario te levanta en volandas. Los que se quedan fuera te abrazan también, y eso es lo que más te emociona.",
      },
      {
        id: "c",
        label: "Llamar a tu madre antes de nada",
        subtitle: "La primera llamada",
        consequences: { moral: 11, reputacion: 3, rel_aficion: 2, flags: { [flagKey]: true } },
        outcomeText: "Marcas su número antes de que termine la lectura. «Mamá —dices—, estoy en la lista». Se hace un silencio largo al otro lado. «Ya lo sabía», responde, con la voz rota. «Llevo veinte años sabiéndolo».",
      },
    ],
    isMilestone: true,
    milestoneType: "seleccion",
    imageScene: `Photorealistic photo of a young footballer reading his national team squad announcement on a phone, surrounded by his family hugging him, tears of joy, living room, warm light, ${tName} atmosphere, no logos or readable text`,
  };
}
