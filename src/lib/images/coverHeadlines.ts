/**
 * Qué hitos salen en la portada de WARCA (el diario deportivo ficticio del juego) y con qué titular. Antes solo el gol de
 * chilena tenía portada; ahora también los títulos, los premios, los fichajes de impacto, el debut y los goles decisivos.
 * El titular y la bajada se dibujan con código (ver newspaper.ts), así que siempre se leen.
 */
export interface CoverSpec {
  headline: string;
  byline: string;
  /** "marca": cabecera blanca con letras rojas · "as": cabecera roja con letras blancas. */
  variant: "marca" | "as";
}

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return h >>> 0;
}

const pick = <T,>(list: readonly T[], seed: string): T => list[hash(seed) % list.length];

export interface CoverInput {
  type: string;
  title: string;
  /** "liga", "copa", "champions"… si el hito es un trofeo. */
  trophyKind?: string;
  name: string;
  club: string;
  seed: string;
}

/** La portada de este hito, o null si no toca portada. */
export function coverForMilestone(i: CoverInput): CoverSpec | null {
  const NAME = i.name.toUpperCase();
  const CLUB = i.club.toUpperCase();
  const title = i.title;
  const variant: CoverSpec["variant"] = hash(`${i.seed}:v`) % 2 === 0 ? "marca" : "as";
  const s = `${i.seed}:${i.type}`;
  const make = (headline: string, byline: string): CoverSpec => ({ headline, byline, variant });

  if (i.type === "final_champions" || (i.type === "titulo" && i.trophyKind === "champions")) {
    return make(pick(["¡REYES DE EUROPA!", "¡LA DUODÉCIMA… Y LA QUE VENGA!", "¡EUROPA ES SUYA!", "¡CAMPEONES DE EUROPA!"], s), `${NAME} LEVANTA LA CHAMPIONS CON EL ${CLUB}`);
  }
  if (i.type === "titulo" || i.type === "titulo_presidente") {
    const what = i.trophyKind === "copa" ? "LA COPA" : i.trophyKind === "liga" ? "LA LIGA" : "EL TÍTULO";
    return make(pick(["¡CAMPEONES!", "¡A LA GLORIA!", "¡LO HAN LOGRADO!", "¡HISTÓRICO!"], s), `${NAME} Y EL ${CLUB} SE LLEVAN ${what}`);
  }
  if (i.type === "premio") {
    if (/balón de oro/i.test(title)) {
      return make(pick(["¡BALÓN DE ORO!", "¡EL MEJOR DEL MUNDO!", "¡DE ORO!", "¡REY DE PARÍS!"], s), `${NAME} SE CORONA EN LA NOCHE DE PARÍS`);
    }
    if (/golden boy/i.test(title)) {
      return make(pick(["¡GOLDEN BOY!", "¡EL FUTURO ES SUYO!", "¡NACE UNA ESTRELLA!"], s), `${NAME} ES EL MEJOR JOVEN DE EUROPA`);
    }
    return make(pick(["¡PREMIADO!", "¡RECONOCIMIENTO MUNDIAL!"], s), `${NAME} RECIBE EL PREMIO QUE TODOS QUERÍAN`);
  }
  if (i.type === "seleccion" && /campe/i.test(title)) {
    return make(pick(["¡CAMPEONES!", "¡LA ROJA TOCA EL CIELO!", "¡HISTÓRICO CON LA SELECCIÓN!"], s), `${NAME} LEVANTA EL TROFEO CON SU SELECCIÓN`);
  }
  if (i.type === "fichaje_galactico" || (i.type === "carrera" && /fich|firm|present|nuevo jugador|oficial/i.test(title))) {
    return make(pick(["¡BOMBAZO!", "¡FICHAJE GALÁCTICO!", "¡OFICIAL!", "¡SE VA A ESCRIBIR HISTORIA!"], s), `${NAME} ES NUEVO JUGADOR DEL ${CLUB}`);
  }
  if (i.type === "hall_fama") return make("¡PARA LA HISTORIA!", `${NAME} ENTRA EN EL SALÓN DE LA FAMA`);
  if (i.type === "debut") return make(pick(["¡DEBUTÓ!", "¡NACE UNA ESTRELLA!", "¡YA ESTÁ AQUÍ!"], s), `${NAME} DEBUTA CON EL ${CLUB}`);
  if (i.type === "gol_decisivo" || i.type === "gol_ex_club" || i.type === "mvp") {
    return make(pick(["¡EL HÉROE!", "¡DECISIVO!", "¡GOLAZO!"], s), `${NAME} DECIDE EL PARTIDO CON EL ${CLUB}`);
  }
  if (i.type === "capitania") return make("¡NUEVO CAPITÁN!", `${NAME} LLEVA EL BRAZALETE DEL ${CLUB}`);
  return null;
}
