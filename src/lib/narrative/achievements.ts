/**
 * LOGROS. Una colección de metas de toda la carrera (primer gol, primer título, un millón en el banco, ser padre, un Balón de Oro…)
 * que se desbloquean solas cuando se cumplen. Los de bronce se anotan sin ruido; los de plata y oro salen como una escena breve y
 * compartible. Se ven todos en /mi-jugador/logros, con los que faltan por descubrir. Lo desbloqueado vive en flags.logros.
 */
import type { GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { readTrofeos } from "@/lib/honours";
import { readProperties } from "@/lib/finance/mortgage";
import { readSponsorships } from "@/lib/finance/sponsorship-income";
import { getAttributes } from "@/lib/narrative/attributes";

export type Tier = "bronce" | "plata" | "oro";
export type Category = "Carrera" | "Títulos" | "Premios" | "Dinero" | "Vida" | "Club" | "Superación";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: Tier;
  category: Category;
  check: (p: Player) => boolean;
}

const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;
const has = (p: Player, kind: string) => readTrofeos(p.flags).some((t) => t.k === (kind as never));
const flag = (p: Player, k: string) => Boolean(p.flags?.[k]);
const clubsPlayed = (p: Player) => new Set([...String(p.flags?.clubs_history ?? "").split("|").filter(Boolean), p.club]).size;
const trophiesCount = (p: Player) => p.stats_titles ?? 0;
const hasAward = (p: Player, kind: string) => has(p, kind) || flag(p, `award_won_${kind}`) || Object.keys(p.flags ?? {}).some((k) => k.startsWith(`award_won_${kind}`));

export const ACHIEVEMENTS: Achievement[] = [
  // ── Carrera ──
  { id: "debut", name: "Debut oficial", description: "Juega tu primer partido importante.", icon: "👟", tier: "bronce", category: "Carrera", check: (p) => (p.stats_matches_played ?? 0) >= 1 },
  { id: "primer-gol", name: "El primero", description: "Marca tu primer gol.", icon: "⚽", tier: "bronce", category: "Carrera", check: (p) => (p.stats_goals ?? 0) >= 1 },
  { id: "diez-goles", name: "Doble dígito", description: "Llega a 10 goles en tu carrera.", icon: "🔟", tier: "bronce", category: "Carrera", check: (p) => (p.stats_goals ?? 0) >= 10 },
  { id: "cincuenta-goles", name: "Máquina de goles", description: "Llega a 50 goles.", icon: "🎯", tier: "plata", category: "Carrera", check: (p) => (p.stats_goals ?? 0) >= 50 },
  { id: "cien-goles", name: "Centenario", description: "Llega a 100 goles.", icon: "💯", tier: "oro", category: "Carrera", check: (p) => (p.stats_goals ?? 0) >= 100 },
  { id: "veinticinco-asist", name: "Generoso", description: "Reparte 25 asistencias.", icon: "🎁", tier: "plata", category: "Carrera", check: (p) => (p.stats_assists ?? 0) >= 25 },
  { id: "cincuenta-partidos", name: "Ya eres de la casa", description: "Juega 50 partidos importantes.", icon: "📅", tier: "bronce", category: "Carrera", check: (p) => (p.stats_matches_played ?? 0) >= 50 },
  { id: "doscientos-partidos", name: "Fondo de armario", description: "Juega 200 partidos importantes.", icon: "🗓️", tier: "plata", category: "Carrera", check: (p) => (p.stats_matches_played ?? 0) >= 200 },
  { id: "muro", name: "El muro", description: "Deja la portería a cero en 15 partidos.", icon: "🧱", tier: "plata", category: "Carrera", check: (p) => (p.stats_clean_sheets ?? 0) >= 15 },
  { id: "debut-seleccion", name: "Con la camiseta de tu país", description: "Debuta con tu selección.", icon: "🇪🇺", tier: "plata", category: "Carrera", check: (p) => flag(p, "sel_debut_played") },
  { id: "media-85", name: "De élite", description: "Alcanza una media de 85.", icon: "📈", tier: "bronce", category: "Carrera", check: (p) => (p.media ?? 0) >= 85 },
  { id: "media-90", name: "Crack", description: "Alcanza una media de 90.", icon: "🌟", tier: "plata", category: "Carrera", check: (p) => (p.media ?? 0) >= 90 },
  { id: "media-95", name: "Leyenda viva", description: "Alcanza una media de 95.", icon: "👑", tier: "oro", category: "Carrera", check: (p) => (p.media ?? 0) >= 95 },
  { id: "fama-90", name: "Un icono", description: "Llega a 90 de fama.", icon: "📸", tier: "plata", category: "Carrera", check: (p) => (p.fama ?? 0) >= 90 },
  // ── Títulos ──
  { id: "primer-titulo", name: "Primera vitrina", description: "Gana tu primer título.", icon: "🏆", tier: "bronce", category: "Títulos", check: (p) => trophiesCount(p) >= 1 || readTrofeos(p.flags).length > 0 },
  { id: "cinco-titulos", name: "Coleccionista", description: "Gana 5 títulos.", icon: "🥇", tier: "plata", category: "Títulos", check: (p) => Math.max(trophiesCount(p), readTrofeos(p.flags).filter((t) => !["balon_oro", "golden_boy", "pichichi", "zamora", "mejor_liga", "mvp_champions", "mvp_torneo"].includes(t.k)).length) >= 5 },
  { id: "diez-titulos", name: "Sala de trofeos", description: "Gana 10 títulos.", icon: "🏛️", tier: "oro", category: "Títulos", check: (p) => Math.max(trophiesCount(p), readTrofeos(p.flags).filter((t) => !["balon_oro", "golden_boy", "pichichi", "zamora", "mejor_liga", "mvp_champions", "mvp_torneo"].includes(t.k)).length) >= 10 },
  { id: "campeon-liga", name: "Campeón de Liga", description: "Gana la Liga.", icon: "🏆", tier: "plata", category: "Títulos", check: (p) => has(p, "liga") || flag(p, "title_liga") },
  { id: "campeon-copa", name: "Rey de Copas", description: "Gana la Copa.", icon: "🥇", tier: "bronce", category: "Títulos", check: (p) => has(p, "copa") },
  { id: "campeon-europa", name: "Campeón de Europa", description: "Gana la Champions League.", icon: "🌍", tier: "oro", category: "Títulos", check: (p) => has(p, "champions") || flag(p, "title_champions") },
  { id: "europa-league", name: "Noches de Europa League", description: "Gana la Europa League.", icon: "🌟", tier: "plata", category: "Títulos", check: (p) => has(p, "europa") },
  { id: "doblete", name: "Doblete", description: "Gana Liga y Copa en la misma temporada.", icon: "✌️", tier: "plata", category: "Títulos", check: (p) => { const t = readTrofeos(p.flags); return t.some((a) => a.k === "liga" && t.some((b) => b.k === "copa" && b.s === a.s)); } },
  { id: "triplete", name: "Triplete histórico", description: "Gana Liga, Copa y Champions en la misma temporada.", icon: "🔱", tier: "oro", category: "Títulos", check: (p) => { const t = readTrofeos(p.flags); return t.some((a) => a.k === "liga" && t.some((b) => b.k === "copa" && b.s === a.s) && t.some((c) => c.k === "champions" && c.s === a.s)); } },
  { id: "campeon-mundo", name: "Campeón del mundo", description: "Gana el Mundial con tu selección.", icon: "🌎", tier: "oro", category: "Títulos", check: (p) => has(p, "mundial") },
  { id: "campeon-eurocopa", name: "Campeón de la Eurocopa", description: "Gana la Eurocopa.", icon: "🇪🇺", tier: "oro", category: "Títulos", check: (p) => has(p, "eurocopa") },
  { id: "copa-america", name: "Rey de América", description: "Gana la Copa América.", icon: "🌎", tier: "plata", category: "Títulos", check: (p) => has(p, "copa_america") },
  { id: "medalla-olimpica", name: "Medallista olímpico", description: "Consigue una medalla en los Juegos Olímpicos.", icon: "🏅", tier: "oro", category: "Títulos", check: (p) => has(p, "olimpico") },
  // ── Premios ──
  { id: "golden-boy", name: "Golden Boy", description: "Gana el Golden Boy.", icon: "✨", tier: "plata", category: "Premios", check: (p) => has(p, "golden_boy") || flag(p, "golden_boy") },
  { id: "balon-oro", name: "Balón de Oro", description: "Gana el Balón de Oro.", icon: "🥇", tier: "oro", category: "Premios", check: (p) => has(p, "balon_oro") || flag(p, "title_balon_oro") },
  { id: "pichichi", name: "Pichichi", description: "Sé el máximo goleador de la Liga.", icon: "⚽", tier: "plata", category: "Premios", check: (p) => hasAward(p, "pichichi") },
  { id: "zamora", name: "Zamora", description: "Sé el portero menos goleado de la Liga.", icon: "🧤", tier: "plata", category: "Premios", check: (p) => hasAward(p, "zamora") },
  { id: "mejor-liga", name: "Mejor de la Liga", description: "Sé elegido mejor jugador de la Liga.", icon: "⭐", tier: "plata", category: "Premios", check: (p) => hasAward(p, "mejor_liga") },
  { id: "mvp-champions", name: "MVP de Europa", description: "Sé el mejor jugador de la Champions.", icon: "🌟", tier: "oro", category: "Premios", check: (p) => hasAward(p, "mvp_champions") },
  { id: "mvp-torneo", name: "Figura del torneo", description: "Sé el mejor jugador de un torneo de selecciones.", icon: "🏅", tier: "oro", category: "Premios", check: (p) => hasAward(p, "mvp_torneo") },
  { id: "objetivos-cumplidos", name: "Palabra de profesional", description: "Cumple todos los objetivos de una temporada.", icon: "✅", tier: "plata", category: "Premios", check: (p) => Object.entries(p.flags ?? {}).some(([k, v]) => k.startsWith("go_review_") && /^(\d+)\/\1$/.test(String(v))) },
  // ── Dinero ──
  { id: "primer-millon", name: "Millonario", description: "Reúne un millón de euros.", icon: "💶", tier: "bronce", category: "Dinero", check: (p) => (p.patrimonio ?? 0) >= 1_000_000 },
  { id: "diez-millones", name: "Fortuna", description: "Reúne diez millones.", icon: "💰", tier: "plata", category: "Dinero", check: (p) => (p.patrimonio ?? 0) >= 10_000_000 },
  { id: "cien-millones", name: "Imperio", description: "Reúne cien millones.", icon: "🏦", tier: "oro", category: "Dinero", check: (p) => (p.patrimonio ?? 0) >= 100_000_000 },
  { id: "primera-casa", name: "Un techo propio", description: "Compra tu primera propiedad.", icon: "🏠", tier: "bronce", category: "Dinero", check: (p) => readProperties(p.flags).length >= 1 },
  { id: "coleccion", name: "Garaje y cuadra", description: "Ten 5 propiedades o vehículos.", icon: "🚗", tier: "plata", category: "Dinero", check: (p) => readProperties(p.flags).length >= 5 },
  { id: "capricho-mayor", name: "Capricho de crack", description: "Compra un yate o un jet privado.", icon: "🛥️", tier: "plata", category: "Dinero", check: (p) => readProperties(p.flags).some((x) => x.kind === "yate" || x.kind === "jet") },
  { id: "cara-marca", name: "Cara de marca", description: "Firma tu primer patrocinio.", icon: "🏷️", tier: "bronce", category: "Dinero", check: (p) => readSponsorships(p.flags).length >= 1 },
  { id: "tres-marcas", name: "Todas te quieren", description: "Firma cinco patrocinios a lo largo de tu carrera.", icon: "🤝", tier: "plata", category: "Dinero", check: (p) => readSponsorships(p.flags).length >= 5 },
  // ── Vida ──
  { id: "pareja", name: "Alguien en casa", description: "Empieza una relación estable.", icon: "💞", tier: "bronce", category: "Vida", check: (p) => typeof p.flags?.pareja === "string" && Boolean(p.flags.pareja) },
  { id: "boda", name: "Sí, quiero", description: "Cásate.", icon: "💍", tier: "plata", category: "Vida", check: (p) => flag(p, "casados") },
  { id: "primer-hijo", name: "Papá", description: "Nace tu primer hijo.", icon: "👶", tier: "plata", category: "Vida", check: (p) => num(p.flags?.hijos_n) >= 1 || flag(p, "hijos") },
  { id: "familia-numerosa", name: "Familia numerosa", description: "Ten tres hijos.", icon: "👨‍👩‍👧‍👦", tier: "oro", category: "Vida", check: (p) => num(p.flags?.hijos_n) >= 3 },
  // ── Club ──
  { id: "capitan", name: "El brazalete", description: "Sé capitán de tu club.", icon: "©️", tier: "plata", category: "Club", check: (p) => flag(p, "capitan_club") },
  { id: "capitan-seleccion", name: "Capitán de tu país", description: "Sé capitán de tu selección.", icon: "🎖️", tier: "oro", category: "Club", check: (p) => flag(p, "capitan_seleccion") },
  { id: "hombre-club", name: "Hombre de club", description: "Pasa cinco temporadas en el mismo club.", icon: "🏟️", tier: "plata", category: "Club", check: (p) => { const since = num(p.flags?.club_since); return since > 0 && (p.week ?? 0) - since >= 50; } },
  { id: "trotamundos", name: "Trotamundos", description: "Juega en cuatro clubes distintos.", icon: "🧳", tier: "bronce", category: "Club", check: (p) => clubsPlayed(p) >= 4 },
  // ── Superación ──
  { id: "vuelta-lesion", name: "De vuelta", description: "Vuelve de una lesión grave.", icon: "🩹", tier: "bronce", category: "Superación", check: (p) => Boolean(p.flags?.lg_kind) && Boolean(p.flags?.lg_last) && !Object.keys(p.flags ?? {}).some((k) => k.startsWith("injury_duration_") && p.flags?.[k]) },
  { id: "atributo-95", name: "Excelencia", description: "Lleva un atributo a 95.", icon: "💎", tier: "plata", category: "Superación", check: (p) => getAttributes(p).some((a) => a.value >= 95) },
  { id: "perfil-completo", name: "Perfil completo", description: "Todos tus atributos por encima de 80.", icon: "🧬", tier: "oro", category: "Superación", check: (p) => getAttributes(p).every((a) => a.value >= 80) },
  { id: "veterano", name: "Veterano", description: "Sigue en activo con 35 años.", icon: "🧓", tier: "plata", category: "Superación", check: (p) => playerAge(p.week) >= 35 && p.status === "active" },
];

export const TIER_LABEL: Record<Tier, string> = { bronce: "Bronce", plata: "Plata", oro: "Oro" };

/** Los ids ya desbloqueados. */
export function unlockedIds(p: Pick<Player, "flags">): string[] {
  return String(p.flags?.logros ?? "").split(",").filter(Boolean);
}

/** Los logros que se cumplen ahora y todavía no estaban anotados. */
export function newAchievements(p: Player): Achievement[] {
  const have = new Set(unlockedIds(p));
  return ACHIEVEMENTS.filter((a) => !have.has(a.id) && (() => { try { return a.check(p); } catch { return false; } })());
}

/** Anota los logros en las banderas del jugador (en memoria; el motor las guarda con el resto). */
export function markAchievements(p: Player, list: Achievement[]): void {
  if (list.length === 0) return;
  if (!p.flags) p.flags = {};
  p.flags.logros = [...unlockedIds(p), ...list.map((a) => a.id)].join(",");
  for (const a of list) p.flags[`logro_${a.id}`] = String(p.week);
}

/** Una escena breve y compartible con los logros de plata y oro recién desbloqueados (los de bronce se anotan sin ruido). */
export function buildAchievementEvent(p: Player, list: Achievement[]): GameEvent | null {
  const loud = list.filter((a) => a.tier !== "bronce");
  if (loud.length === 0) return null;
  const top = [...loud].sort((a, b) => (a.tier === "oro" ? 0 : 1) - (b.tier === "oro" ? 0 : 1))[0];
  const total = ACHIEVEMENTS.length;
  const done = unlockedIds(p).length;
  const extra = loud.length > 1 ? ` También desbloqueas: ${loud.filter((a) => a !== top).map((a) => `${a.icon} ${a.name}`).join(", ")}.` : "";
  return {
    id: `logro-${top.id}`,
    category: "especial",
    title: `${top.icon} Logro desbloqueado: ${top.name}`,
    description: `${top.description}\n\nLogro de ${TIER_LABEL[top.tier].toLowerCase()}.${extra} Llevas ${done} de ${total} logros: míralos todos en tu perfil.`,
    options: [
      { id: "a", label: "Disfrutarlo un momento", subtitle: "Es tuyo", consequences: { moral: top.tier === "oro" ? 4 : 2, fama: top.tier === "oro" ? 1 : 0 }, outcomeText: top.tier === "oro" ? "Te quedas mirando la pantalla un buen rato. Hay cosas que, una vez conseguidas, ya no te las quita nadie." : "Una pequeña sonrisa, un mensaje a tu familia y a seguir. Un logro más en la estantería." },
      { id: "b", label: "Compartirlo con la afición", subtitle: "Que lo sepa todo el mundo", consequences: { fama: top.tier === "oro" ? 2 : 1, rel_aficion: 1, moral: 1 }, outcomeText: "Subes la captura con una sola línea. La afición lo llena de corazones y de memes; alguien comenta «de otro planeta»." },
    ],
  };
}
