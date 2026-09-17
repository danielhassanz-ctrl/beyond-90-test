import type { Player } from "@/types/player";

/**
 * Personajes fijos del entorno del jugador (entrenador, capitán, rival de
 * puesto, fisio, periodista de cabecera) — a diferencia de
 * secondary-characters.ts (personajes episódicos que la IA introduce y
 * pueden desaparecer), estos existen desde el minuto uno de la carrera y
 * se muestran siempre en la pestaña "Vida", con nombre estable durante
 * toda la carrera.
 *
 * El nombre se deriva de un hash del id del jugador — determinista, sin
 * necesitar guardar nada en flags ni gastar una escritura extra: el mismo
 * jugador siempre obtiene el mismo nombre para el mismo rol.
 */
export type NpcRole = "entrenador" | "capitan" | "rival_puesto" | "fisio" | "prensa";

export const NPC_ROLE_LABELS: Record<NpcRole, string> = {
  entrenador: "Entrenador",
  capitan: "Capitán",
  rival_puesto: "Competencia por el puesto",
  fisio: "Fisioterapeuta",
  prensa: "Prensa",
};

const NPC_NAME_POOLS: Record<NpcRole, string[]> = {
  entrenador: ["Paco Mendoza", "Julián Roldán", "Ernesto Vallejo", "Ramón Aguirre", "Tomás Bilbao", "Fermín Casares"],
  capitan: ["Óscar Barragán", "Rubén Castilla", "Ignacio Solera", "Adrián Fuentes", "Marcos Iribar", "Gonzalo Peña"],
  rival_puesto: ["Manolo Mendoza", "Kike Almenara", "Bruno Segarra", "Iván Roca", "Toni Bassa", "Nico Verdejo"],
  fisio: ["Pau Bermejo", "Marta Sagasta", "Iker Zubillaga", "Elena Roig", "Samuel Torreblanca", "Cristina Nadales"],
  prensa: ["Cristian Cazorla", "Lourdes Ibarra", "Nando Prats", "Alicia Rovira", "Kepa Uranga", "Silvia Montoro"],
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getNpcName(player: Player, role: NpcRole): string {
  const pool = NPC_NAME_POOLS[role];
  return pool[hashString(`${player.id}:${role}`) % pool.length];
}

/**
 * Descripción cualitativa corta de una relación numérica (0-100), en el
 * mismo tono que las que ya usa el juego en otros sitios.
 */
export function describeRelationshipLevel(value: number): string {
  if (value >= 75) return "Confía en ti sin fisuras.";
  if (value >= 55) return "La relación es buena, sin más.";
  if (value >= 35) return "Te ve como una opción, no como una certeza.";
  if (value >= 15) return "Terreno frío. Conviene un gesto pronto.";
  return "La relación está rota. Toca reconstruir desde cero.";
}
