/**
 * Frase característica para cada tipo de hito, al estilo "esta es mi
 * carrera, ¿cuál es la tuya?" (pedido explícito del usuario, inspirado en
 * otro juego similar) — se imprime sobre la propia imagen compartida (ver
 * lib/images/shareBranding.ts) y también en el texto que acompaña al
 * compartir. Antes cualquier hito, tuviera foto real de IA o cayera al
 * fallback sin foto, se compartía sin ninguna marca del juego ni frase
 * gancho: quien lo recibía no tenía ni idea de qué era ni dónde jugarlo.
 *
 * Agrupado por tipo de momento en vez de una entrada por cada
 * milestoneType exacto (son más de 40): así un tipo nuevo que se añada en
 * el futuro sin actualizar este archivo cae en el DEFAULT en vez de en un
 * hueco sin frase.
 */
const DEBUT = "Así fue mi debut. ¿Cómo será el tuyo?";
const FICHAJE = "Así empezó mi historia. ¿Cuál es la tuya?";
const GOL = "Este es mi golazo. ¿Tienes uno mejor?";
const TITULO = "Así se siente ser campeón. ¿Cuándo lo sientes tú?";
const CAPITANIA = "Así llevo el brazalete. ¿Serías capitán?";
const PREMIO = "Este es mi reconocimiento. ¿Cuál sería el tuyo?";
const SELECCION = "Así defiendo a mi país. ¿Jugarías tú también?";
const FAMA = "Así es mi fama. Atrévete a vivir la tuya.";
const PRENSA = "Así hablan de mí. ¿Qué dirían de ti?";
const BODA = "Este es mi gran día. Empieza el tuyo.";
const DM = "Así me escriben cuando marco. ¿A ti quién te escribiría?";
const SEGUNDA_VIDA = "Así sigue mi historia. ¿Cuál sería la tuya?";
export const DEFAULT_TAGLINE = "Esta es mi carrera. ¿Cuál es la tuya?";

const SHARE_TAGLINES: Record<string, string> = {
  debut: DEBUT,
  lesion_debut: DEBUT,

  contrato: FICHAJE,
  representante: FICHAJE,
  fichaje_agente: FICHAJE,
  puja_agente: FICHAJE,
  agencia: FICHAJE,
  cantera: FICHAJE,
  cantera_propia: FICHAJE,
  canterano: FICHAJE,
  filial: FICHAJE,
  fichaje_galactico: FICHAJE,
  oferta_fondo: FICHAJE,
  ascenso: FICHAJE,
  ascenso_entrenador: FICHAJE,

  gol_decisivo: GOL,
  primer_gol: GOL,
  primer_hat_trick: GOL,
  gol_chilena: GOL,

  titulo: TITULO,
  primer_titulo: TITULO,
  titulo_presidente: TITULO,
  final_champions: TITULO,
  copa_america: TITULO,
  eurocopa: TITULO,
  mundial: TITULO,

  capitania: CAPITANIA,

  premio: PREMIO,
  balon_oro_cliente: PREMIO,
  hall_fama: PREMIO,
  mvp: PREMIO,

  seleccion: SELECCION,
  presidente_federacion: SELECCION,

  sponsor: FAMA,
  fama: FAMA,

  prensa: PRENSA,

  dm_instagram: DM,

  boda: BODA,

  retiro_jugador: SEGUNDA_VIDA,
  autobiografia: SEGUNDA_VIDA,
  inversor: SEGUNDA_VIDA,
  carrera: SEGUNDA_VIDA,
  tactica: SEGUNDA_VIDA,
  pretemp: SEGUNDA_VIDA,
  pretemporada: SEGUNDA_VIDA,
};

export function getShareTagline(milestoneType?: string | null): string {
  if (!milestoneType) return DEFAULT_TAGLINE;
  return SHARE_TAGLINES[milestoneType] ?? DEFAULT_TAGLINE;
}
