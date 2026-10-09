import type { BankScene } from "../types";
import { BARRIO } from "./barrio";
import { VESTUARIO } from "./vestuario";
import { BANQUILLO } from "./banquillo";
import { PRENSA } from "./prensa";
import { MENTE } from "./mente";
import { AFICION_FAMILIA } from "./aficion-familia";
import { SUELTAS } from "./sueltas";
import { CACHONDEO_VESTUARIO } from "./cachondeo-vestuario";
import { TRASPASOS } from "./traspasos";
import { SELECCION } from "./seleccion";
import { PREMIOS } from "./premios";
import { CAMBIOS } from "./cambios";
import { PAREJA } from "./pareja";
import { RIVALES } from "./rivales";
import { SURREALISMO } from "./surrealismo";
import { NEGOCIOS } from "./negocios";
import { VETERANOS } from "./veteranos";
import { JUVENTUD } from "./juventud";
import { AFICION } from "./aficion";
import { VESTUARIO2 } from "./vestuario2";
import { REDES } from "./redes";
import { FAMILIA } from "./familia";
import { LESIONES } from "./lesiones";
import { SELECCION2 } from "./seleccion2";
import { MISTER2 } from "./mister2";
import { SUELTAS2 } from "./sueltas2";
import { MERCADO2 } from "./mercado2";
import { TORNEOS2 } from "./torneos2";
import { DIA_A_DIA } from "./dia-a-dia";
import { SURREALISMO2 } from "./surrealismo2";
import { HUMOR3 } from "./humor3";
import { EMOCION } from "./emocion";
import { CANTERA2 } from "./cantera2";
import { PAREJA2 } from "./pareja2";
import { PRENSA3 } from "./prensa3";
import { EUROPA } from "./europa";
import { CLUB2 } from "./club2";
import { VESTUARIO3 } from "./vestuario3";
import { BARRIO2 } from "./barrio2";
import { SALUD } from "./salud";
import { LUJO } from "./lujo";
import { MENTALIDAD } from "./mentalidad";
import { CUERPO_TECNICO } from "./cuerpo-tecnico";
import { SELECCION3 } from "./seleccion3";
import { AFICION3 } from "./aficion3";
import { CIUDAD } from "./ciudad";
import { HUMOR4 } from "./humor4";
import { EXTRANJERO } from "./extranjero";
import { FICHAJES_VIDA } from "./fichajes-vida";
import { FAMILIA2 } from "./familia2";
import { VERANO } from "./verano";
import { VETERANO2 } from "./veterano2";
import { ROLES } from "./roles";
import { PAREJA3 } from "./pareja3";
import { RIVALES2 } from "./rivales2";
import { HUMOR5 } from "./humor5";
import { TORNEOS3 } from "./torneos3";
import { MERCADO4 } from "./mercado4";
import { HOBBIES } from "./hobbies";
import { ESTADIOS } from "./estadios";
import { MARCAS } from "./marcas";
import { CHICAS } from "./chicas";

/** Todas las escenas del banco, en un solo sitio. Añadir una familia nueva = importarla aquí. */
export const BANK_SCENES: BankScene[] = [...BARRIO, ...VESTUARIO, ...BANQUILLO, ...PRENSA, ...MENTE, ...AFICION_FAMILIA, ...SUELTAS, ...CACHONDEO_VESTUARIO, ...TRASPASOS, ...SELECCION, ...PREMIOS, ...CAMBIOS, ...PAREJA, ...RIVALES, ...SURREALISMO, ...NEGOCIOS, ...VETERANOS, ...JUVENTUD, ...AFICION, ...VESTUARIO2, ...REDES, ...FAMILIA, ...LESIONES, ...SELECCION2, ...MISTER2, ...SUELTAS2, ...MERCADO2, ...TORNEOS2, ...DIA_A_DIA, ...SURREALISMO2, ...HUMOR3, ...EMOCION, ...CANTERA2, ...PAREJA2, ...PRENSA3, ...EUROPA, ...CLUB2, ...VESTUARIO3, ...BARRIO2, ...SALUD, ...LUJO, ...MENTALIDAD, ...CUERPO_TECNICO, ...SELECCION3, ...AFICION3, ...CIUDAD, ...HUMOR4, ...EXTRANJERO, ...FICHAJES_VIDA, ...FAMILIA2, ...VERANO, ...VETERANO2, ...ROLES, ...PAREJA3, ...RIVALES2, ...HUMOR5, ...TORNEOS3, ...MERCADO4, ...HOBBIES, ...ESTADIOS, ...MARCAS, ...CHICAS];

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
  golden_boy: "ganó el Golden Boy, el premio al mejor joven de Europa",
  gb_finalista: "fue finalista del Golden Boy pero no lo ganó",
  olimpico_convocado: "fue convocado con la selección sub-23 a unos Juegos Olímpicos",
  loro_leyenda: "el loro del utillero, Evaristo, se convirtió en leyenda del vestuario y acudió a su despedida",
  restaurante_exito: "su primo Quique y él abrieron un restaurante, Bar el Crack, que triunfó; hay un plato con su nombre",
  campo_inaugurado: "pagó el césped del campo de tierra de su barrio, que hoy lleva su apellido",
  fundacion: "creó o apoyó una fundación con su nombre",
  ahorrador: "ahorró con cabeza durante su carrera siguiendo el consejo de un veterano",
  doble_anuncio: "rodó un anuncio junto a su doble, un chaval idéntico a él",
  padrino_ismael: "fue padrino de boda de Ismael, su compañero de habitación de la residencia",
  hugo_debuta: "el niño que le pidió su primer autógrafo, Hugo, acabó debutando en el primer equipo",
  nino_cantera: "un niño que le esperaba cada tarde a la puerta del campo entró en la cantera",
  concha_recuerdo: "Concha, la abuela más ultra del estadio, le dejó un bocadillo de despedida",
  medico_futuro: "un niño al que visitó en el hospital se hizo médico",
  gol_hijo: "le dedicó un gol a su hijo desde el césped",
  madre_casa: "le prometió una casa a su madre",
  padre_caja: "su padre guardó durante años una caja con todos los recortes de su carrera",
  vt_dorsal: "su club retiró su dorsal",
  titulado: "acabó la carrera universitaria mientras jugaba",
  capitan_futuro: "un capitán de la selección le dijo que sería su relevo",
  mi_credito: "su entrenador le reconoció públicamente una idea táctica",
  perro_adios: "su perro Míster fue mascota del vestuario hasta el final",
};
