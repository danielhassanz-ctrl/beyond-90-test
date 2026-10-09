/**
 * BANCO DE ESCENAS ENCADENADAS. Escenas escritas a mano (cero coste de IA al
 * jugar) pensadas como una red y no como piezas sueltas: cada una declara
 * CUÁNDO puede salir (etapa, rol, club, relaciones, banderas de decisiones
 * anteriores) y sus opciones dejan marcas (banderas, hilos abiertos,
 * relaciones) que desbloquean otras escenas a corto, medio y largo plazo.
 *
 * El selector (select.ts) solo ofrece lo que encaja con el estado REAL del
 * jugador; por eso dos carreras distintas ven escenas distintas, y por eso lo
 * que decidiste al principio sigue notándose veinte temporadas después.
 */
import type { GameEvent } from "@/types/career";

export type BankRole = "titular" | "rotacion" | "suplente" | "apartado";
export type BankClubLevel = "grande" | "europeo" | "modesto";
export type Range = [number, number];

/** "Si en la escena `scene` elegiste `option` (cualquiera si se omite), esta puede salir entre minGap y maxGap turnos después." */
export interface BankAfter {
  scene: string;
  option?: string;
  minGap?: number;
  maxGap?: number;
}

export interface BankWhen {
  minWeek?: number;
  maxWeek?: number;
  minAge?: number;
  maxAge?: number;
  /** Rol actual en el equipo. */
  roles?: BankRole[];
  clubLevels?: BankClubLevel[];
  media?: Range;
  fama?: Range;
  moral?: Range;
  forma?: Range;
  patrimonio?: Range;
  rel?: Partial<Record<"entrenador" | "vestuario" | "aficion" | "representante", Range>>;
  /** Banderas que deben existir (truthy). */
  flags?: string[];
  /** Banderas que NO deben existir. */
  notFlags?: string[];
  /** Encadenado: escenas anteriores (y la opción elegida) que la desbloquean. TODAS deben cumplirse. */
  after?: BankAfter[];
  /** true = solo lesionado; false/omitido = solo sano. */
  injured?: boolean;
  /** true = solo cedido; false/omitido = no cedido. */
  loan?: boolean;
  /** Solo si existe un hilo abierto de ese tipo con alguien. */
  hasThread?: "favor" | "deuda" | "rencor" | "promesa" | "secreto";
  /** Posición en el campo. */
  positions?: string[];
  /** Resultado de un torneo de selecciones ya jugado ESTA temporada (mundial/eurocopa/copa_america/any) y, opcional, cómo acabó. */
  torneo?: { type: "mundial" | "eurocopa" | "copa_america" | "any"; outcomes?: ("fase_de_grupos" | "octavos" | "cuartos" | "semifinal" | "subcampeon" | "campeon")[] };
  /** La próxima temporada hay torneo de selecciones (solo en los últimos turnos de la anterior): escenas de antesala. */
  torneoProx?: "mundial" | "eurocopa" | "copa_america" | "any";
  /** Ventana de fichajes abierta ahora (verano, enero o cualquiera). */
  market?: "verano" | "enero" | "abierta";
  /** Juegos Olímpicos: "antesala" = la temporada siguiente hay Juegos; "ano" = esta temporada hay Juegos y no juegas un torneo senior. */
  olimpicos?: "antesala" | "ano";
  /** true = solo si juegas en un club fuera de España; false = solo si juegas en España. */
  exterior?: boolean;
  /** true = solo si todavía no has jugado nunca con tu selección (ni torneo ni ventana de selecciones). */
  selDebut?: boolean;
  /** Mes de la temporada (1 = pretemporada/julio ... 10 = mayo). */
  turn?: Range;
  /** Turnos que llevas en el club actual (para escenas de llegada o de arraigo). */
  clubTurns?: Range;
}

export interface BankScene {
  /** Debe empezar por "bank-". Es también el id del evento: sirve para no repetirla. */
  id: string;
  /** Arco o familia temático: evita dos seguidas del mismo tema salvo que estén encadenadas. */
  family: string;
  when: BankWhen;
  /** Peso relativo (1 por defecto). */
  weight?: number;
  /** La escena, sin id. Texto con marcadores: {club}, {el_club}, {apellido}. */
  event: Omit<GameEvent, "id">;
}

/** Bandera que deja una escena del banco al resolverse: `bk_<id sin prefijo>` = "<opción>:<semana>". */
export function bankFlagKey(sceneId: string): string {
  return `bk_${sceneId.replace(/^bank-/, "")}`;
}
