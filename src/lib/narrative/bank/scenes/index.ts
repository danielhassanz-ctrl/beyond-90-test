import type { BankScene } from "../types";
import { BARRIO } from "./barrio";
import { VESTUARIO } from "./vestuario";
import { BANQUILLO } from "./banquillo";
import { PRENSA } from "./prensa";
import { MENTE } from "./mente";
import { AFICION_FAMILIA } from "./aficion-familia";
import { SUELTAS } from "./sueltas";

/** Todas las escenas del banco, en un solo sitio. Añadir una familia nueva = importarla aquí. */
export const BANK_SCENES: BankScene[] = [...BARRIO, ...VESTUARIO, ...BANQUILLO, ...PRENSA, ...MENTE, ...AFICION_FAMILIA, ...SUELTAS];

/**
 * Banderas que dejan las escenas del banco y que cuentan algo de la historia
 * del jugador: la IA y la segunda vida las leen (ver describeLifeFacts).
 */
export const BANK_FACTS: Record<string, string> = {
  amigo_bar: "su amigo de la infancia Nacho abrió un bar en el barrio con su ayuda y tiene su camiseta colgada en la pared",
  socio_bar: "es socio del bar de su amigo Nacho",
  capitan_equipo: "fue capitán de su equipo",
  ahijado_hugo: "sacó adelante a Hugo Barral, un joven del vestuario que hoy se lo agradece",
  padrino_ivan: "fue maestro de Iván Cortés, el canterano que hoy es figura",
  maestro_ivan: "Iván Cortés lo llamó públicamente su maestro",
  libro_laura: "la periodista Laura Cano escribió un libro sobre él",
  terapia: "fue a terapia con la psicóloga del club cuando se hundió",
  habla_salud_mental: "contó públicamente lo que pasó con su salud mental",
  pregonero: "fue pregonero de la peña del club",
  caja_entradas: "su madre guarda las entradas de todos sus partidos",
  tregua_mister: "hizo las paces con su entrenador tras una mala racha",
  mister_confidente: "su entrenador y él compartieron un secreto que nunca contaron",
  tuit_polemico: "un tuit polémico le persiguió durante meses",
  polivalente: "aceptó jugar fuera de su posición cuando el equipo lo necesitó",
};
