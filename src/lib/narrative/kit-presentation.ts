/**
 * LA PRESENTACIÓN DE LA CAMISETA NUEVA. De vez en cuando el club (cada dos temporadas, en pretemporada) o la selección (el verano
 * antes de un gran torneo) te llaman para presentar la equipación nueva con dos o tres compañeros: sesión de fotos, vídeo para las
 * redes, la marca de turno… Es un hito compartible: la foto sale con la camiseta de verdad del club o de la selección. Todo en
 * código, sin IA. La marca técnica es real (como el resto de marcas reales del juego, ver brands.ts); en la imagen no se piden logos.
 */
import type { EventOption, GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { describeKit, describeNationalKit } from "@/lib/clubColors";
import { hasMajorTournament } from "@/lib/calendar/season";
import { getLockerRoom } from "@/lib/narrative/locker-room";
import { fictionalPlayerName } from "@/lib/narrative/npcs";

type Flags = Record<string, string | boolean>;

const MAKERS: Record<string, string> = {
  "Real Madrid": "Adidas", "FC Barcelona": "Nike", "Atlético de Madrid": "Nike", "Sevilla FC": "Castore", "Real Betis": "Hummel", "Valencia CF": "Puma",
  "Athletic Club": "New Balance", "Real Sociedad": "Macron", "Villarreal CF": "Joma",
  "Manchester City": "Puma", "Manchester United": "Adidas", "Liverpool": "Nike", "Arsenal": "Adidas", "Chelsea": "Nike", "Tottenham Hotspur": "Nike",
  "Paris Saint-Germain": "Nike", "Bayern Múnich": "Adidas", "Borussia Dortmund": "Puma", "Juventus": "Adidas", "AC Milan": "Puma", "Inter de Milán": "Nike",
  "España": "Adidas", "Alemania": "Adidas", "Argentina": "Adidas", "Italia": "Adidas", "Francia": "Nike", "Inglaterra": "Nike", "Brasil": "Nike", "Portugal": "Nike", "Países Bajos": "Nike",
};
const FALLBACK = ["Nike", "Adidas", "Puma"];

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return h >>> 0;
}

export const kitMaker = (team: string) => MAKERS[team] ?? FALLBACK[hash(team) % FALLBACK.length];

const turnOf = (week: number) => ((week - 1) % 10) + 1;
const seasonOf = (week: number) => Math.floor((week - 1) / 10);
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;
const n = (flags: Flags | undefined, k: string) => (flags && k in flags ? num(flags[k]) : -99);

/** ¿Merece la pena que te llamen? Hace falta tener algo de nombre: la marca no presenta la camiseta con un desconocido. */
const hasName = (p: Player) => (p.fama ?? 0) >= 45 || (p.media ?? 0) >= 70;

/** Club: pretemporada (turnos 2 a 5), cada dos temporadas como mucho, nunca el primer año en el club ni cedido. */
export function shouldTriggerClubKit(player: Player, rng: () => number = Math.random): boolean {
  if (player.club === NO_CLUB_YET || player.status !== "active" || player.club.startsWith("SELECCIÓN:")) return false;
  const t = turnOf(player.week);
  if (t < 2 || t > 5) return false;
  const season = seasonOf(player.week);
  if (season < 1 || !hasName(player)) return false;
  const flags = (player.flags ?? {}) as Flags;
  if (flags.loan_active && !flags.loan_returned) return false;
  if (season - n(flags, "kit_club_last") < 2) return false;
  const since = num(flags.club_since);
  if (since > 0 && player.week - since < 3) return false;
  if (playerAge(player.week) < 17) return false;
  return rng() < 0.35;
}

/** Selección: el verano antes de un Mundial o una Eurocopa (turnos 8 a 10), si ya has debutado con ella. */
export function shouldTriggerNationalKit(player: Player, rng: () => number = Math.random): boolean {
  if (player.status !== "active" || !player.nation) return false;
  const flags = (player.flags ?? {}) as Flags;
  if (!flags.sel_debut_played) return false;
  const t = turnOf(player.week);
  if (t < 8) return false;
  const season = seasonOf(player.week);
  const next = hasMajorTournament(season + 1, 16 + season + 1, player.nation);
  if (!next.has || (next.type !== "mundial" && next.type !== "eurocopa")) return false;
  if (flags[`kit_sel_${season}`] || (player.media ?? 0) < 66) return false;
  return rng() < 0.6;
}

const opt = (id: string, label: string, subtitle: string, c: Record<string, number>, flags: Flags, text: string): EventOption => ({ id, label, subtitle, consequences: { ...c, flags }, outcomeText: text });

function fee(player: Player): number {
  return Math.round((3000 + (player.fama ?? 0) * 220 + Math.max(0, (player.media ?? 0) - 60) * 150) / 100) * 100;
}

function mates(player: Player, national: boolean): string[] {
  if (national) {
    const nation = player.nation ?? "";
    const names = new Set<string>();
    for (let i = 0; names.size < 3 && i < 12; i++) names.add(fictionalPlayerName(`${player.id}:${nation}:kit:${i}`, nation, player.last_name));
    return [...names];
  }
  const room = getLockerRoom(player);
  const pick = ["capitan", "amigo", hash(`${player.id}:${player.week}`) % 2 ? "joven" : "veterano"];
  return pick.map((k) => room.find((m) => m.key === k)?.name).filter((x): x is string => Boolean(x));
}

const list = (names: string[]) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`);

export function buildClubKitEvent(player: Player): GameEvent {
  const season = seasonOf(player.week);
  const club = player.club;
  const maker = kitMaker(club);
  const crew = mates(player, false);
  const first = (s: string) => s.split(" ")[0];
  const pay = fee(player);
  const name = displayName(player);
  const scene = `Photorealistic professional photo shoot of the photographed man and ${crew.length} teammates posing side by side in a modern stadium tunnel, all wearing the brand-new season kit: ${describeKit(club)}. Camera flashes, confident smiles, one of them laughing, studio-quality lighting with dramatic stadium backdrop, premium sports campaign look, no brand logos, no readable text`;
  return {
    id: `kit-club-${season}`,
    category: "especial",
    title: `La camiseta nueva del ${club}`,
    description: `${maker} y el club presentan la equipación de la temporada y quieren tu cara en la campaña, junto a ${list(crew)}. Una tarde entera de focos, cambios de camiseta y un fotógrafo que repite «una más, una más». Hay vídeo para las redes y la tienda del club abrirá la preventa esa misma noche. Te pagan ${pay.toLocaleString("es-ES")} € por el día.`,
    options: [
      opt("a", "Posar con una sonrisa y darlo todo", "Profesional", { fama: 3, rel_aficion: 2, moral: 2, patrimonio: pay }, { kit_club_last: String(season) }, `El fotógrafo no tiene que pedirte nada: acierta a la primera. Cuando salen las fotos, ${first(crew[0] ?? name)} te escribe: «Pareces uno de los de la tele». La preventa vuela y el club te da las gracias por eso, aunque en voz baja.`),
      {
        id: "b",
        label: "Hacerte el gracioso delante de la cámara",
        subtitle: "Puede ser viral… o un corte para la sala de montaje",
        consequences: { patrimonio: pay },
        resolve: {
          baseChance: 0.62,
          success: { text: `Improvisas un baile con ${first(crew[1] ?? crew[0] ?? name)} y acabáis los cuatro llorando de risa. El vídeo no estaba previsto, pero es el que más se comparte de toda la campaña. ${maker} te escribe para repetir.`, consequences: { fama: 6, rel_vestuario: 3, rel_aficion: 3, moral: 3, flags: { kit_club_last: String(season) } } },
          fail: { text: `El baile sale raro, el vídeo da más vergüenza que gracia y el departamento de marketing lo guarda en el cajón. No pasa nada, pero tampoco será lo que recordemos de esta tarde.`, consequences: { fama: 1, moral: -1, flags: { kit_club_last: String(season) } } },
        },
      },
      opt("c", `Llevarte a un par de chavales de la cantera a la sesión`, "Compartir el foco", { fama: 2, rel_vestuario: 4, rel_aficion: 3, moral: 3, patrimonio: pay }, { kit_club_last: String(season) }, `Pides que dos chicos del juvenil salgan en la foto y el club accede, un poco a regañadientes. Se les ve en la cara que no se lo creen. La foto de grupo se convierte en la favorita de la afición.`),
    ],
    isMilestone: true,
    milestoneType: "camiseta_nueva",
    imageScene: scene,
  };
}

export function buildNationalKitEvent(player: Player): GameEvent {
  const season = seasonOf(player.week);
  const nation = player.nation ?? "";
  const maker = kitMaker(nation);
  const crew = mates(player, true);
  const variant: "home" | "away" = hash(`${player.id}:${nation}:${season}`) % 2 ? "away" : "home";
  const first = (s: string) => s.split(" ")[0];
  const pay = fee(player);
  const tournament = hasMajorTournament(season + 1, 16 + season + 1, nation).type === "mundial" ? "el Mundial" : "la Eurocopa";
  const kitWord = variant === "away" ? "segunda equipación" : "primera equipación";
  const scene = `Photorealistic photo shoot of the photographed man and ${crew.length} national teammates standing together in a bright modern studio-like hall, all wearing the new national team shirt, ${describeNationalKit(nation, variant)}. Proud relaxed poses, a few of them touching the crest on their chest, premium football campaign photography, no brand logos, no readable text`;
  return {
    id: `sel-kit-${season}`,
    category: "especial",
    title: `La nueva camiseta de la selección`,
    description: `Falta un año para ${tournament} y ${maker} presenta la ${kitWord} de ${nation}. La federación te llama para la foto oficial, junto a ${list(crew)}. Es la camiseta con la que la gente te va a ver en el torneo, y la primera vez que la tienes puesta fuera de un partido: pesa distinto. Te pagan ${pay.toLocaleString("es-ES")} € por el día.`,
    options: [
      opt("a", "Posar con orgullo, con la mano en el escudo", "Solemne", { fama: 3, rel_aficion: 3, moral: 3, patrimonio: pay }, { [`kit_sel_${season}`]: true }, `El fotógrafo te pide la mano en el escudo y no te hace falta fingir nada. En la foto, los cuatro parecéis lo que sois: gente que lleva el país a cuestas. Se hace viral con el titular «ya huele a ${tournament === "el Mundial" ? "Mundial" : "Eurocopa"}».`),
      {
        id: "b",
        label: "Soltar una broma y echar un balón con los compañeros",
        subtitle: "Naturalidad frente a solemnidad",
        consequences: { patrimonio: pay },
        resolve: {
          baseChance: 0.65,
          success: { text: `${first(crew[0] ?? "Uno")} te lanza un balón a mitad de foto y acabáis haciendo malabares con la camiseta nueva puesta. El vídeo es una fiesta y todos los medios lo recogen. El seleccionador finge enfadarse y se ríe.`, consequences: { fama: 6, rel_vestuario: 3, rel_aficion: 4, moral: 3, flags: { [`kit_sel_${season}`]: true } } },
          fail: { text: `Un balón vuela donde no debe, rompe un foco y la sesión se para diez minutos. La anécdota da risa en el hotel esa noche, pero la federación no está tan contenta.`, consequences: { fama: 1, moral: -1, flags: { [`kit_sel_${season}`]: true } } },
        },
      },
      opt("c", "Dedicar la foto a los que no han tenido tu suerte", "Un gesto bonito", { fama: 2, reputacion: 3, rel_aficion: 4, moral: 4, patrimonio: pay }, { [`kit_sel_${season}`]: true }, `Escribes un pie de foto sencillo: «Para los que soñaron con esto y no llegaron». Lo comparten las escuelas de fútbol de medio país. Algunos compañeros te dicen, con la voz baja, que ojalá se les hubiera ocurrido a ellos.`),
    ],
    isMilestone: true,
    milestoneType: "camiseta_nueva",
    imageScene: scene,
  };
}
