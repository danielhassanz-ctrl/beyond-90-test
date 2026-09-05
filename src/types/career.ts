export type CareerMode = "express" | "standard" | "pro";

export type EventCategory =
  | "entrenamiento"
  | "partido"
  | "vestuario"
  | "representante"
  | "prensa"
  | "vida"
  | "especial"
  | "segunda_vida";

export type SecondCareerRole = "entrenador" | "agente" | "presidente";

export type PlayerStatus = "active" | "awaiting_second_life" | "second_life" | "retired";

export interface Consequences {
  forma?: number;
  moral?: number;
  fama?: number;
  /** Media futbolística (tipo videojuego de fútbol): empieza en 50 a los 16 años, sube con goles/títulos/buen rendimiento, baja si te quedas en el banquillo o te peleas con el entrenador. Techo 99. */
  media?: number;
  patrimonio?: number;
  rel_entrenador?: number;
  rel_vestuario?: number;
  rel_aficion?: number;
  rel_representante?: number;
  reputacion?: number;
  club?: string;
  agent_name?: string;
  /** Abre o actualiza un hilo de vida persistente (pareja, familia, lesión...) */
  flags?: Record<string, string | boolean>;
}

export const CONSEQUENCE_LABELS: Record<string, string> = {
  forma: "Forma física",
  moral: "Ánimo",
  fama: "Fama y prensa",
  media: "Media",
  patrimonio: "Patrimonio",
  rel_entrenador: "Entrenador",
  rel_vestuario: "Vestuario",
  rel_aficion: "Afición",
  rel_representante: "Representante",
  reputacion: "Reputación",
};

export interface ResolutionOutcome {
  text: string;
  consequences: Consequences;
  /** Si es true y el evento es hito, solo cuenta como logro en este desenlace */
  isWin?: boolean;
}

export interface EventOption {
  id: string;
  label: string;
  subtitle: string;
  /** Efecto directo, para opciones sin incertidumbre */
  consequences: Consequences;
  /**
   * Si está presente, el resultado de esta opción no es fijo: se resuelve
   * con una probabilidad (el entrenador te habla o te ignora, metés el
   * penalti o lo fallas, el fichaje se concreta o se cae).
   */
  resolve?: {
    baseChance: number;
    statModifier?: "forma" | "moral" | "fama" | "reputacion" | "media";
    success: ResolutionOutcome;
    fail: ResolutionOutcome;
  };
}

export interface GameEvent {
  id: string;
  category: EventCategory;
  title: string;
  description: string;
  options: EventOption[];
  allowFreeText?: boolean;
  freeTextPrompt?: string;
  isMilestone?: boolean;
  milestoneType?: string;
  /** Solo aparece a partir de esta semana (para dar progresión) */
  minWeek?: number;
  /** Marca un evento de fichaje: si se resuelve con éxito, cambia de club */
  transferOnSuccess?: boolean;
  /** Si se define, el evento solo es elegible en estos modos de carrera */
  modes?: CareerMode[];
  /** Si se define, el evento solo es elegible si el jugador ya tiene este flag activo (ej. "pareja") */
  requiresFlag?: string;
  /**
   * Escena guionada (fichajes grandes, momentos de partido, retiro): se
   * prioriza sobre la narrativa generada para que estos beats mecánicos
   * ocurran de forma confiable.
   */
  priority?: boolean;
  /**
   * Si está presente y el evento se convierte en hito, se genera una
   * imagen (foto real del jugador + esta escena) para la tarjeta
   * compartible. Personajes que aparezcan deben ser ficticios.
   */
  imageScene?: string;
  /**
   * Si está presente, este evento hace evolucionar la foto del jugador
   * (barba, pelo, madurez) para reflejar la etapa de la carrera.
   */
  lookEvolution?: string;
  /** Nombre del club rival, solo en eventos de partido, para mostrar ambos escudos. */
  rivalClub?: string;
  /** Si se define, el evento solo es elegible si la selección del jugador pertenece a alguna de estas confederaciones (ej. Eurocopa, Copa América). */
  requiresConfederation?: ("UEFA" | "CONMEBOL")[];
  /**
   * Si se define, el evento solo es elegible si la media futbolística del
   * jugador alcanza este mínimo. Así los grandes hitos (Real Madrid, Balón
   * de Oro, Champions, selección) solo le llegan a quien de verdad rinde,
   * y una carrera floja diverge hacia una historia más modesta en vez de
   * ver siempre las mismas oportunidades que una carrera brillante.
   */
  minMedia?: number;
}

export interface CareerState {
  id: string;
  week: number;
  mode: CareerMode;
  status: PlayerStatus;
  club: string;
  liga: string | null;
  forma: number;
  moral: number;
  fama: number;
  media: number;
  patrimonio: number;
  rel_entrenador: number;
  rel_vestuario: number;
  rel_aficion: number;
  rel_representante: number;
  reputacion: number;
}

export const MODE_TARGET_WEEKS: Record<CareerMode, number> = {
  express: 20,
  standard: 90,
  pro: 200,
};

/** A partir de esta semana el modo Pro puede plantearse el retiro como jugador */
export const PRO_RETIREMENT_MIN_WEEK = 170;

/** Duración de la segunda vida (entrenador / agente / presidente) */
export const SECOND_LIFE_TARGET_WEEKS = 20;

export const SECOND_CAREER_LABELS: Record<SecondCareerRole, string> = {
  entrenador: "Entrenador",
  agente: "Agente",
  presidente: "Presidente",
};

export const MODE_LABELS: Record<CareerMode, string> = {
  express: "Express (1-2 días)",
  standard: "Standard (4-6 días)",
  pro: "Pro (10-15 días)",
};

const SEASON_START_YEAR = 2026;
const WEEKS_PER_SEASON = 10;
const AGE_START = 16;

/** Traduce la semana interna en una etiqueta de temporada, ej. "2026/27" */
export function seasonLabel(week: number): string {
  const index = Math.floor((week - 1) / WEEKS_PER_SEASON);
  const year1 = SEASON_START_YEAR + index;
  const year2 = (year1 + 1) % 100;
  return `${year1}/${String(year2).padStart(2, "0")}`;
}

/** Edad del jugador según la temporada actual (empieza a los 16) */
export function playerAge(week: number): number {
  return AGE_START + Math.floor((week - 1) / WEEKS_PER_SEASON);
}
