/**
 * Coherencia de las escenas escritas a mano con el ESTADO del jugador. Las
 * ~200 escenas de events.ts no miraban nada más que la semana y la media: el
 * jugador lesionado recibía "una sesión extra con el míster", el apartado
 * "Te confirman como titular", el que estaba a malas con el vestuario "una
 * cena de equipo entrañable" y el que nadie conocía "una revista del corazón
 * te caza". Esta tabla centraliza las condiciones (rol, lesión, relaciones,
 * fama, ánimo) en un único sitio en vez de tocar cada evento, y el motor la
 * aplica junto a minWeek/minMedia en todos los selectores.
 */
import type { Player } from "@/types/player";
import { computeRole, type PlayerRole } from "@/lib/narrative/role";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";

export interface StateRule {
  /** No puede salir si hay una lesión larga en curso. */
  notInjured?: boolean;
  /** Roles en los que tiene sentido la escena. */
  roles?: PlayerRole[];
  minRelEntrenador?: number;
  maxRelEntrenador?: number;
  minRelVestuario?: number;
  maxRelVestuario?: number;
  minRelAficion?: number;
  maxRelAficion?: number;
  minRelRepresentante?: number;
  minMoral?: number;
  maxMoral?: number;
  minFama?: number;
  maxFama?: number;
}

const PLAYS: PlayerRole[] = ["titular", "rotacion"];
const PLAYS_OR_SUB: PlayerRole[] = ["titular", "rotacion", "suplente"];
const NOT_PLAYING: PlayerRole[] = ["rotacion", "suplente", "apartado"];

const CELEBRITY_IDS = [
  "fama-revista-corazon", "fama-gala-benefica", "fama-influencer-unboxing", "fama-reality-show", "fama-videoclip",
  "fama-relojes-lujo", "fama-reportaje-hogar", "fama-desfile-moda", "fama-documental", "fama-actor-foto",
  "fama-portada-revista", "fama-parodia-humor", "fama-cena-empresarios", "fama-streamer-directo", "fama-cancion-dedicada",
  "fama-reality-cocina", "fama-fiesta-piscina", "fama-paparazzi-cena", "fama-portada-warca", "fama-fiesta-exclusiva",
  "fama-fragancia-propia", "fama-videojuego", "fama-coleccion-ropa", "fama-coche-lujo", "esp-cantante", "esp-influencer",
  "pre-paparazzi", "vid-paparazzi-cita", "fama-streamer-fichaje-broma", "fama-leyenda-vestuario",
];

/** Reglas explícitas por id. */
const RULES: Record<string, StateRule> = {
  // — Rol: lo que solo tiene sentido jugando… o sin jugar —
  "par-titular": { roles: PLAYS, minRelEntrenador: 45 },
  "par-banco": { roles: ["suplente", "apartado", "rotacion"] },
  "par-gol-decisivo": { roles: PLAYS_OR_SUB },
  "par-mano-a-mano": { roles: PLAYS_OR_SUB },
  "par-penal": { roles: PLAYS },
  "par-hat-trick": { roles: PLAYS },
  "par-mvp-partido-clave": { roles: PLAYS },
  "par-roja-injusta": { roles: PLAYS },
  "par-mal-partido": { roles: PLAYS_OR_SUB },
  "par-etiqueta-fichaje-caro": { roles: PLAYS },
  "par-cesion-revancha": { roles: PLAYS_OR_SUB },
  "fork-titulo-liga": { roles: PLAYS },
  "fork-champions": { roles: PLAYS },
  "fork-ascenso-division": { roles: PLAYS },
  "esp-guino-saludo-leyenda": { roles: PLAYS },
  "esp-guino-rondo-imposible": { roles: PLAYS },
  "esp-guino-capitan-eterno": { roles: PLAYS, notInjured: true },
  "sel-primera-convocatoria": { roles: PLAYS },
  "sel-capitania": { roles: PLAYS, minRelVestuario: 55 },
  "sel-clasificacion-mundial": { roles: PLAYS, notInjured: true },
  "sel-clasificacion-eurocopa": { roles: PLAYS, notInjured: true },
  "sel-clasificacion-copa-america": { roles: PLAYS, notInjured: true },
  "sel-convocatoria-snub": { roles: PLAYS },
  "premio-balon-oro": { roles: PLAYS },
  "premio-pichichi": { roles: PLAYS },
  "premio-mvp-torneo": { roles: PLAYS },
  "ves-suplente-explota-tarde": { roles: NOT_PLAYING },
  "ves-perder-capitania": { roles: PLAYS },
  "fork-fuera-de-planes": { roles: NOT_PLAYING, maxRelEntrenador: 60 },
  "fork-cesion": { roles: NOT_PLAYING },
  "vid-aceptar-la-realidad": { roles: NOT_PLAYING },
  "ent-grada-sin-avisar": { roles: NOT_PLAYING, maxRelEntrenador: 70 },
  "ent-cambio-posicion": { roles: PLAYS_OR_SUB },
  "rep-renovacion-contrato": { roles: PLAYS, minRelEntrenador: 45 },
  // la escena en que el míster te aparta solo tiene sentido si hoy cuenta contigo
  "ent-marginado-nuevo-entrenador": { roles: PLAYS, minRelEntrenador: 40 },

  // — Relaciones —
  "ent-elogio-publico": { minRelEntrenador: 55, roles: PLAYS_OR_SUB },
  "ves-capitan": { minRelVestuario: 40 },
  "ves-companero-crisis-personal": { minRelVestuario: 45 },
  "ves-cumple-sorpresa": { minRelVestuario: 50 },
  "ves-cena-equipo": { minRelVestuario: 35 },
  "ves-guerra-bromas-vestuario": { minRelVestuario: 35 },
  "ves-supersticion-ridicula": { minRelVestuario: 30, notInjured: true },
  "ves-pitada-propia-aficion": { maxRelAficion: 55 },
  "rep-comision": { minRelRepresentante: 25 },
  "esp-espiral-alcohol": { maxMoral: 60 },

  // — Lesión: nada de entrenamientos ni partidos mientras tanto —
  "ent-lesion-susto": { notInjured: true },
  "esp-lesion-ligamento-cruzado": { notInjured: true },
  "especial-lesion-grave": { notInjured: true },
  "ent-jugar-con-dolor": { notInjured: true },
  "ves-conflicto": { notInjured: true },
  "ves-equipacion-prestada": { notInjured: true },
  "ves-corte-pelo-obsesivo": { notInjured: true },
  "ent-concentracion-hotel": { notInjured: true },
  "fama-cantar-himno": { notInjured: true },
  "fama-leyenda-vestuario": { notInjured: true },
};

for (const id of CELEBRITY_IDS) RULES[id] = { ...(RULES[id] ?? {}), minFama: 30 };

/** Texto que implica entrenar o jugar: no sale con una lesión larga en curso. */
const PHYSICAL_TEXT = /\b(entrenamiento|sesión de|calentamiento|sobre el campo|rondo|juegas|jugar el|marcar a portería|el partido de hoy|salir al campo)\b/i;

export function isEventCoherentWithState(
  event: { id: string; category: string; title?: string; description?: string },
  player: Player,
): boolean {
  const rule = RULES[event.id];
  const injured = getInjuryRemaining(player.flags) > 0;

  // Lesionado: ni entrenamientos, ni partidos, ni escenas que lo impliquen.
  if (injured) {
    if (rule?.notInjured) return false;
    if (event.category === "entrenamiento" || event.category === "partido") return false;
    if (PHYSICAL_TEXT.test(`${event.title ?? ""} ${event.description ?? ""}`)) return false;
  }

  // Apartado: el entrenador no lo convoca, así que no hay escenas de partido jugado.
  const role = computeRole(player).role;
  if (!rule?.roles && role === "apartado" && event.category === "partido") return false;

  if (!rule) return true;
  if (rule.roles && !rule.roles.includes(role)) return false;
  if (rule.minRelEntrenador !== undefined && player.rel_entrenador < rule.minRelEntrenador) return false;
  if (rule.maxRelEntrenador !== undefined && player.rel_entrenador > rule.maxRelEntrenador) return false;
  if (rule.minRelVestuario !== undefined && player.rel_vestuario < rule.minRelVestuario) return false;
  if (rule.maxRelVestuario !== undefined && player.rel_vestuario > rule.maxRelVestuario) return false;
  if (rule.minRelAficion !== undefined && player.rel_aficion < rule.minRelAficion) return false;
  if (rule.maxRelAficion !== undefined && player.rel_aficion > rule.maxRelAficion) return false;
  if (rule.minRelRepresentante !== undefined && player.rel_representante < rule.minRelRepresentante) return false;
  if (rule.minMoral !== undefined && player.moral < rule.minMoral) return false;
  if (rule.maxMoral !== undefined && player.moral > rule.maxMoral) return false;
  if (rule.minFama !== undefined && player.fama < rule.minFama) return false;
  if (rule.maxFama !== undefined && player.fama > rule.maxFama) return false;
  return true;
}
