import type { GameEvent, EventOption } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { randomPersonName } from "@/lib/narrative/npcs";
import { getEuropeanCompetitionFor } from "@/lib/calendar/match-calendar";

/**
 * Mercado de fichajes: dos ventanas por temporada (verano y enero) y en
 * CADA una siempre sale un rumor — sin salseo de mercado no hay chicha.
 * El juego solo tenía la oferta de Arabia y el fichaje inicial; el resto
 * del mercado era invisible.
 *
 * Todo en código (cero llamadas a la IA) y con variedad: cinco tipos de
 * rumor, clubes según el nivel real del jugador, y un final incierto — a
 * veces el rumor es real y termina en una oferta formal, a veces era
 * humo y no pasa nada (justo lo pedido: "puede ser verdad o solo un
 * rumor").
 *
 * Estos eventos llevan id "mercado-*" / "oferta-*": carrera/actions.ts
 * los trata como eventos que NO avanzan la semana, así que pueden
 * colarse en una semana de partido sin hacer que el partido se salte.
 */

export type MarketWindow = "verano" | "enero";

export function getMarketWindow(week: number): MarketWindow | null {
  const weekInSeason = ((week - 1) % 10) + 1;
  if (weekInSeason >= 2 && weekInSeason <= 4) return "verano";
  if (weekInSeason >= 5 && weekInSeason <= 9) return "enero";
  return null;
}

const FEMININE_CLUBS = new Set(["Real Sociedad", "Atalanta", "Juventus", "AS Roma"]);
/** "el Getafe CF", "la Real Sociedad", "la Roma"... el artículo depende del club. */
function art(club: string): string {
  if (club === "Las Palmas") return "Las Palmas";
  if (club === "AS Roma") return "la Roma";
  return FEMININE_CLUBS.has(club) ? "la " + club : "el " + club;
}
function de(club: string): string {
  if (club === "Las Palmas") return "de Las Palmas";
  return FEMININE_CLUBS.has(club) ? "de " + art(club) : "del " + club;
}

const seasonOf = (week: number) => Math.floor((week - 1) / 10);
const windowKey = (week: number, w: MarketWindow) => `market_${seasonOf(week)}_${w}`;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shouldTriggerMarketRumor(player: Player): boolean {
  if (player.club === NO_CLUB_YET) return false;
  // Un debutante recién llegado no suena para nadie: primeras ventanas
  // reales a partir de la segunda temporada.
  if (player.week < 12) return false;
  const w = getMarketWindow(player.week);
  if (!w) return false;
  return !player.flags?.[windowKey(player.week, w)];
}

export function markMarketRumorShown(player: Player): void {
  const w = getMarketWindow(player.week);
  if (!w) return;
  if (!player.flags) player.flags = {};
  player.flags[windowKey(player.week, w)] = true;
}

const OUTLETS = ["Mercado Total", "Fichajes Al Día", "Diario del Balón", "Radio Mercado", "Cuenta @FichajesYa"];

const POOL_LOW = ["Getafe CF", "Osasuna", "Celta de Vigo", "Mallorca", "Girona FC", "Las Palmas", "Cádiz CF", "Real Valladolid"];
const POOL_MID = ["Sevilla FC", "Real Betis", "Villarreal CF", "Real Sociedad", "Athletic Club", "Valencia CF"];
const POOL_HIGH = ["Atlético de Madrid", "FC Barcelona", "Borussia Dortmund", "AS Roma", "Atalanta", "Inter de Milán"];
const POOL_ELITE = ["Real Madrid", "Manchester City", "Liverpool FC", "Paris Saint-Germain", "Bayern de Múnich", "Juventus"];

/** Un club de un nivel ligeramente superior al del jugador, nunca el suyo. */
function pickInterestedClub(player: Player): string {
  const media = player.media ?? 50;
  const age = 16 + Math.floor(player.week / 10);
  let pool: string[] = media >= 82 ? POOL_ELITE : media >= 72 ? POOL_HIGH : media >= 58 ? POOL_MID : POOL_LOW;
  if (media >= 80 && age >= 29) pool = [...pool, "Al-Nassr FC"];
  const filtered = pool.filter((c) => c !== player.club);
  return pick(filtered.length ? filtered : POOL_MID);
}

const interestFlags = (club: string, week: number, source: string = "prensa") => ({
  transfer_interest: club,
  transfer_interest_week: String(week),
  transfer_interest_source: source,
});

type RumorKind = "interes" | "agente" | "competencia" | "bulo" | "capitan" | "clausula" | "familia" | "en_venta" | "intermediario" | "confundido" | "asador" | "hincha_rico" | "agente_doble" | "comision";

function pickKind(player: Player): RumorKind {
  const last = String(player.flags?.market_last_kind ?? "");
  const weighted: RumorKind[] = ["interes", "interes", "interes", "agente", "agente", "agente", "competencia", "bulo", "capitan", "clausula", "clausula", "familia", "en_venta", "en_venta", "intermediario", "confundido", "asador", "hincha_rico", "agente_doble", "comision"];
  const options = weighted.filter((k) => k !== last);
  return pick(options);
}

export function buildMarketRumorEvent(player: Player): GameEvent {
  const w = getMarketWindow(player.week) ?? "verano";
  const label = w === "verano" ? "el mercado de verano" : "el mercado de enero";
  const kind = pickKind(player);
  if (!player.flags) player.flags = {};
  player.flags.market_last_kind = kind;

  const club = pickInterestedClub(player);
  const outlet = pick(OUTLETS);
  const agent = player.agent_name ?? "Tu representante";
  const position = (player.position ?? "jugador").toLowerCase();
  const id = `mercado-${w}-${Date.now()}`;
  const week = player.week;
  // Si el interés nace de gestiones del representante, puede acabar siendo un montaje suyo.
  const source = (["agente", "competencia", "familia", "en_venta"] as RumorKind[]).includes(kind) ? "agente" : "prensa";

  if (kind === "agente") {
    return {
      id,
      category: "representante",
      title: `${agent} te llama con un secreto`,
      description: `"Hay dos clubes preguntando por ti para ${label}. No te digo cuáles por teléfono, pero uno te va a sonar." Te deja con la miel en los labios y cuelga.`,
      allowFreeText: true,
      freeTextPrompt: `¿Qué le dices a ${agent} antes de que cuelgue?`,
      options: [
        {
          id: "nombres",
          label: "Exigirle los nombres ahora mismo",
          subtitle: "O se hace el interesante o suelta prenda",
          consequences: {},
          resolve: {
            baseChance: 0.55,
            statModifier: "reputacion",
            success: {
              text: `Suelta el nombre: ${art(club)}. Dice que han preguntado por tus condiciones. Ahora toca esperar.`,
              consequences: { fama: 2, moral: 3, flags: interestFlags(club, week, source) },
            },
            fail: {
              text: `Se hace el misterioso, alarga la conversación y al final no suelta nada. Puro humo de agente.`,
              consequences: { moral: -2 },
            },
          },
        },
        {
          id: "aqui-bien",
          label: "Decirle que estás a gusto donde estás",
          subtitle: "Lealtad, por ahora",
          consequences: { rel_entrenador: 3, rel_aficion: 2, rel_representante: -2 },
        },
        {
          id: "filtrar",
          label: "Pedirle que lo filtre a la prensa para subir tu caché",
          subtitle: "Jugada de riesgo",
          consequences: {},
          resolve: {
            baseChance: 0.5,
            statModifier: "fama",
            success: {
              text: `${outlet} lo publica en portada. Tu nombre suena en todas partes y ${art(club)} se da por aludido.`,
              consequences: { fama: 5, rel_representante: 2, flags: interestFlags(club, week, source) },
            },
            fail: {
              text: "Se descontrola: te acusan de forzar la salida. La grada te mira raro en el siguiente entrenamiento.",
              consequences: { rel_aficion: -6, rel_vestuario: -3, moral: -3 },
            },
          },
        },
      ],
    };
  }

  if (kind === "competencia") {
    return {
      id,
      category: "representante",
      title: "Van a por un fichaje en tu puesto",
      description: `Suena con fuerza que tu club quiere traer un ${position} de nivel en ${label}. En el vestuario ya bromean con que te van a hacer sitio en el banquillo.`,
      allowFreeText: true,
      freeTextPrompt: "Un compañero te pregunta si te preocupa. ¿Qué le contestas?",
      options: [
        {
          id: "mister",
          label: "Hablar con el míster sin rodeos",
          subtitle: "Ir de cara",
          consequences: {},
          resolve: {
            baseChance: 0.5,
            statModifier: "media",
            success: { text: "Te dice que cuenta contigo pase lo que pase. Sales del despacho más tranquilo.", consequences: { rel_entrenador: 5, moral: 4 } },
            fail: { text: "Respuesta de manual: 'todos competimos'. No te aclara nada.", consequences: { moral: -3 } },
          },
        },
        {
          id: "doble",
          label: "Entrenar el doble y callar",
          subtitle: "Que hablen tus piernas",
          consequences: { forma: 3, moral: -1, rel_entrenador: 2 },
        },
        {
          id: "salidas",
          label: `Pedirle a ${agent} que mire salidas por si acaso`,
          subtitle: "Plan B, con discreción",
          consequences: {},
          resolve: {
            baseChance: 0.45,
            statModifier: "fama",
            success: {
              text: `${agent} ya tenía un contacto: ${art(club)} escucharía una oferta por ti.`,
              consequences: { rel_representante: 3, flags: interestFlags(club, week, source) },
            },
            fail: { text: "Nadie se mueve por ti este mercado. Toca quedarse y competir.", consequences: { moral: -2 } },
          },
        },
      ],
    };
  }

  if (kind === "bulo") {
    return {
      id,
      category: "prensa",
      title: "Un bulo de mercado que se te va de las manos",
      description: `Una cuenta anónima jura que ${art(club)} ya te ha fichado, con foto tuya en el aeropuerto que no eres tú. Tiene 40.000 retuits, tu madre te ha llamado preguntando y hasta tu compañero de taquilla te llama "el traidor".`,
      allowFreeText: true,
      freeTextPrompt: "Te ponen un micrófono delante. ¿Qué dices del supuesto fichaje?",
      options: [
        {
          id: "cachondeo",
          label: "Seguirle el juego en redes con humor",
          subtitle: "Momento viral asegurado",
          consequences: { fama: 4, moral: 2, rel_aficion: -1 },
        },
        {
          id: "desmentir",
          label: "Desmentirlo seco y volver al trabajo",
          subtitle: "Corta el ruido",
          consequences: { rel_entrenador: 3, rel_aficion: 3 },
        },
        {
          id: "ni-si-ni-no",
          label: "Ni confirmarlo ni desmentirlo",
          subtitle: "Que especulen",
          consequences: {},
          resolve: {
            baseChance: 0.4,
            statModifier: "fama",
            success: {
              text: `Tu silencio hace ruido y ${art(club)} pregunta de verdad por ti. El bulo se convierte en algo.`,
              consequences: { fama: 4, flags: interestFlags(club, week, source) },
            },
            fail: { text: "Nadie te toma en serio y el bulo muere solo, pero la grada duda de ti.", consequences: { rel_aficion: -4 } },
          },
        },
      ],
    };
  }

  if (kind === "capitan") {
    return {
      id,
      category: "vestuario",
      title: "El capitán quiere irse",
      description: `Se filtra que el capitán ha pedido salir en ${label}. El vestuario está patas arriba y alguien ya susurra que tú podrías heredar el brazalete.`,
      allowFreeText: true,
      freeTextPrompt: "El capitán te mira en el pasillo. ¿Qué le dices?",
      options: [
        {
          id: "apoyarle",
          label: "Apoyar al capitán, salga lo que salga",
          subtitle: "Lealtad de vestuario",
          consequences: { rel_vestuario: 6, rel_entrenador: -2 },
        },
        {
          id: "brazalete",
          label: "Postularte al brazalete si se marcha",
          subtitle: "Ambición sin disimulo",
          consequences: {},
          resolve: {
            baseChance: 0.45,
            statModifier: "media",
            success: { text: "El míster se lo apunta. Si se va, tu nombre suena para llevar el brazalete.", consequences: { rel_entrenador: 4, fama: 3, moral: 4 } },
            fail: { text: "A los veteranos les sienta fatal que hables del brazalete antes de tiempo.", consequences: { rel_vestuario: -6 } },
          },
        },
        {
          id: "silencio",
          label: "No abrir la boca",
          subtitle: "Que se aclare solo",
          consequences: { moral: 1 },
        },
      ],
    };
  }

  if (kind === "clausula") {
    const raise = Math.round((6000 + (player.media ?? 50) * 250) / 500) * 500;
    return {
      id,
      category: "representante",
      title: "Se filtra tu cláusula de rescisión",
      description: `${outlet} publica la cifra de tu cláusula y dice que ${art(club)} estaría dispuesto a pagarla en ${label}. Tu club te cita en el despacho: quieren "hablar de tu futuro".`,
      allowFreeText: true,
      freeTextPrompt: "El presidente te pregunta qué quieres. ¿Qué le dices?",
      options: [
        {
          id: "renovar-subir",
          label: "Pedir renovar con la cláusula más alta",
          subtitle: "Blindarte y cobrar más",
          consequences: {},
          resolve: {
            baseChance: 0.5,
            statModifier: "reputacion",
            success: { text: "El club cede: renuevas, te suben la cláusula y te mejoran la ficha. Mensaje claro a todo el mercado.", consequences: { patrimonio: raise, moral: 5, rel_entrenador: 3 } },
            fail: { text: "El presidente se niega a tocar nada y la conversación acaba fría. Te quedas igual, pero con peor ambiente.", consequences: { moral: -4, rel_entrenador: -2 } },
          },
        },
        {
          id: "dejar-que-pague",
          label: "Que pague quien te quiera: tú te dejas querer",
          subtitle: "Poner el foco en la salida",
          consequences: { fama: 3, rel_aficion: -3, flags: interestFlags(club, week, source) },
        },
        {
          id: "sin-comentar",
          label: "Decir que la cláusula es cosa de tu representante",
          subtitle: "Sin mojarte",
          consequences: { rel_representante: 1 },
        },
      ],
    };
  }

  if (kind === "familia") {
    const pareja = typeof player.flags?.pareja === "string" ? player.flags.pareja : null;
    const who = pareja ?? "tu padre";
    return {
      id,
      category: "vida",
      title: "En casa opinan del mercado",
      description: `Cenando, ${who} suelta lo que piensa: que con lo que suena de ${art(club)} quizá ha llegado el momento de un cambio de aires. Ojo: también hay que pensar en la ciudad, el colegio, los amigos...`,
      allowFreeText: true,
      freeTextPrompt: `¿Qué le contestas a ${who}?`,
      options: [
        {
          id: "escuchar",
          label: `Escuchar y decirle a ${agent} que se mueva`,
          subtitle: "Abrir la puerta con la familia detrás",
          consequences: { moral: 2, rel_representante: 2, flags: interestFlags(club, week, source) },
        },
        {
          id: "aqui-feliz",
          label: "Decir que aquí eres feliz y no te mueves",
          subtitle: "Estabilidad ante todo",
          consequences: { moral: 4, rel_aficion: 3 },
        },
        {
          id: "no-se-metan",
          label: "Pedir que no se metan en tu carrera",
          subtitle: "Marcar distancias, con riesgo",
          consequences: { moral: -2, rel_entrenador: 1 },
        },
      ],
    };
  }

  if (kind === "en_venta") {
    return {
      id,
      category: "representante",
      title: "Tu club te pone en el escaparate",
      description: `Corre la voz de que tu club quiere hacer caja en ${label} y tu nombre está entre los que se venden. Nadie te ha dicho nada a la cara.`,
      allowFreeText: true,
      freeTextPrompt: "Te cruzas con el director deportivo en el pasillo. ¿Qué le dices?",
      options: [
        {
          id: "explicaciones",
          label: "Pedirle explicaciones al director deportivo",
          subtitle: "Cara a cara, sin rodeos",
          consequences: {},
          resolve: {
            baseChance: 0.5,
            statModifier: "reputacion",
            success: { text: "Te jura que eres intocable si no llega una oferta que no se pueda rechazar. Al menos sabes dónde estás.", consequences: { moral: 3, rel_entrenador: 2 } },
            fail: { text: "Sonrisa y palmada en la espalda: no te dice ni sí ni no. Sales peor de lo que entraste.", consequences: { moral: -4 } },
          },
        },
        {
          id: "aprovechar",
          label: `Aprovechar para que ${agent} busque ofertas`,
          subtitle: "Si me venden, que sea a mi favor",
          consequences: { rel_representante: 3, flags: interestFlags(club, week, source) },
        },
        {
          id: "demostrar",
          label: "Demostrar en el campo que no debes salir",
          subtitle: "Que hablen tus números",
          consequences: { forma: 3, moral: 1, rel_entrenador: 2 },
        },
      ],
    };
  }

  // ── Picaresca: situaciones raras, pintorescas y con truco ────────────
  const mediaNow = player.media ?? 50;
  const cost = Math.min(
    Math.round((800 + mediaNow * 40) / 100) * 100,
    Math.max(300, Math.round(((player.patrimonio ?? 0) * 0.2) / 100) * 100),
  );
  const commission = Math.min(
    Math.round((1500 + mediaNow * 90) / 100) * 100,
    Math.max(500, Math.round(((player.patrimonio ?? 0) * 0.25) / 100) * 100),
  );
  const newAgent = randomPersonName();

  if (kind === "intermediario") {
    return {
      id,
      category: "representante",
      title: "Un tipo de gabardina te ofrece un club",
      description: `Un desconocido que se presenta como "intermediario" te para a la salida del entrenamiento y jura que puede colocarte en ${art(club)} en ${label}. Solo pide un adelanto "para gastos" y que no se lo cuentes a nadie. Huele raro, pero habla muy bien.`,
      allowFreeText: true,
      freeTextPrompt: "El tipo te tiende una tarjeta sin nombre. ¿Qué le dices?",
      options: [
        {
          id: "pagar",
          label: `Pagarle el adelanto (${cost.toLocaleString("es")} €)`,
          subtitle: "Fiarte de un desconocido",
          consequences: {},
          resolve: {
            baseChance: 0.2,
            statModifier: "reputacion",
            success: { text: `Milagro: el tipo sí tenía contactos y ${art(club)} pregunta de verdad por ti.`, consequences: { fama: 2, moral: 3, flags: interestFlags(club, week, "prensa") } },
            fail: { text: "Desaparece con el dinero y su número da 'apagado o fuera de cobertura'. Te toca contarlo en el vestuario, donde no paran de reír.", consequences: { patrimonio: -cost, moral: -4, rel_vestuario: 1 } },
          },
        },
        {
          id: "al-agente",
          label: `Pasarle el marrón a ${agent}`,
          subtitle: "Que lo compruebe él",
          consequences: {},
          resolve: {
            baseChance: 0.5,
            statModifier: "reputacion",
            success: { text: "Tu agente lo conoce de sobra: es un pelagatos de la zona. Te lo quita de encima y te agradece el aviso.", consequences: { rel_representante: 3, moral: 2 } },
            fail: { text: "A tu agente le fastidia que dudes de su trabajo y se lo toma como una ofensa.", consequences: { rel_representante: -3 } },
          },
        },
        {
          id: "grabar",
          label: "Grabarlo a escondidas y subirlo a redes",
          subtitle: "Contenido gratis",
          consequences: { fama: 5, moral: 2, rel_representante: -1 },
        },
        { id: "ignorar", label: "Ignorarlo y seguir andando", subtitle: "Cabeza fría", consequences: { moral: 1 } },
      ],
    };
  }

  if (kind === "confundido") {
    return {
      id,
      category: "prensa",
      title: "Te quieren fichar... por error",
      description: `${cap(art(club))} llama a tu club para cerrar tu fichaje. Solo hay un problema: quieren a otro jugador que se apellida igual que tú. Tu club se parte de risa; ${agent}, no tanto.`,
      allowFreeText: true,
      freeTextPrompt: "Un compañero te llama 'el jugador equivocado'. ¿Qué le respondes?",
      options: [
        {
          id: "aprovechar",
          label: "Aprovechar el malentendido para negociar",
          subtitle: "Ya que llaman...",
          consequences: {},
          resolve: {
            baseChance: 0.35,
            statModifier: "fama",
            success: { text: `Al otro lado dicen que, ya que estás, te echan un vistazo. Empieza un interés de verdad.`, consequences: { fama: 3, moral: 3, flags: interestFlags(club, week, "prensa") } },
            fail: { text: "Se dan cuenta del error a mitad de la llamada y cuelgan. Ridículo histórico, pero de los que se recuerdan con cariño.", consequences: { fama: 2, moral: -1 } },
          },
        },
        { id: "reirte", label: "Reírte y subirlo a redes", subtitle: "Momento viral", consequences: { fama: 4, moral: 3 } },
        { id: "agente", label: `Pedirle a ${agent} que se entere de todo antes que nadie`, subtitle: "Que no vuelva a pasar", consequences: { rel_representante: -3, moral: 1 } },
      ],
    };
  }

  if (kind === "asador") {
    return {
      id,
      category: "representante",
      title: "El presidente que ficha en un asador",
      description: `El presidente ${de(club)} te cita en un asador de carretera. Te pone delante un cochinillo, un contrato escrito en una servilleta y una cifra que no cuadra con nada. "Aquí los fichajes se cierran comiendo", te dice con la boca llena.`,
      allowFreeText: true,
      freeTextPrompt: "El presidente levanta la copa. ¿Qué le dices?",
      options: [
        {
          id: "servilleta",
          label: "Firmar la servilleta",
          subtitle: "Palabra de presidente",
          consequences: {},
          resolve: {
            baseChance: 0.3,
            statModifier: "fama",
            success: { text: "Sorprendentemente, la servilleta va en serio: mañana te llaman con el papel de verdad.", consequences: { fama: 2, moral: 3, flags: interestFlags(club, week, "prensa") } },
            fail: { text: "A la mañana siguiente el presidente ni se acuerda de la cena, y la servilleta no vale ni para limpiarte las manos.", consequences: { moral: -2, forma: -1 } },
          },
        },
        { id: "postre", label: "Seguirle la corriente y pedir el postre", subtitle: "Cena gratis, sin compromiso", consequences: { moral: 3, forma: -2, fama: 1 } },
        { id: "al-agente", label: `Decirle que hable con ${agent}`, subtitle: "Profesional hasta con el cochinillo", consequences: { rel_representante: 2, moral: 1 } },
      ],
    };
  }

  if (kind === "hincha_rico") {
    return {
      id,
      category: "representante",
      title: "Un hincha con dinero quiere pagar tu cláusula",
      description: `Un empresario que jura ser hincha ${de(club)} te escribe: si nadie más lo hace, pagará tu cláusula "de su bolsillo" para llevarte a su equipo del alma. Tu representante dice que lo mirará "con los números".`,
      allowFreeText: true,
      freeTextPrompt: "El empresario te manda un audio de cuatro minutos. ¿Qué le contestas?",
      options: [
        {
          id: "en-serio",
          label: "Tomártelo en serio y pedir pruebas",
          subtitle: "Que enseñe el dinero",
          consequences: {},
          resolve: {
            baseChance: 0.4,
            statModifier: "fama",
            success: { text: `Resulta que sí tiene contactos y mueve hilos: ${art(club)} lo escucha de verdad.`, consequences: { fama: 3, moral: 2, flags: interestFlags(club, week, "prensa") } },
            fail: { text: "El empresario tenía menos dinero que ideas: lo suyo eran 3.000 euros por Bizum y muchas ganas de salir en la tele.", consequences: { fama: -1, moral: -2 } },
          },
        },
        { id: "humor", label: "Publicarlo con humor en redes", subtitle: "Que hable la gente", consequences: { fama: 3, moral: 2 } },
        { id: "pasar", label: "Dejarlo en visto", subtitle: "Sin ruido", consequences: { moral: 1 } },
      ],
    };
  }

  if (kind === "agente_doble") {
    return {
      id,
      category: "representante",
      title: "Tu agente también lleva a tu competencia",
      description: `Te enteras por casualidad de que ${agent} también representa a tu rival directo por el puesto y de que, cuando llegue una buena oferta, "ya veremos a cuál de los dos va". Nadie te lo había contado.`,
      allowFreeText: true,
      freeTextPrompt: `Tienes a ${agent} al teléfono. ¿Por dónde empiezas?`,
      options: [
        {
          id: "explicaciones",
          label: "Pedir explicaciones ahora mismo",
          subtitle: "Sin rodeos",
          consequences: {},
          resolve: {
            baseChance: 0.5,
            statModifier: "reputacion",
            success: { text: "Se disculpa, te pone por delante y te promete exclusividad. Por primera vez en meses parece sincero.", consequences: { rel_representante: 5, moral: 3 } },
            fail: { text: "Lo niega todo con una sonrisa y te hace sentir un paranoico. Cuelgas peor de lo que empezaste.", consequences: { rel_representante: -4, moral: -3 } },
          },
        },
        { id: "cambiar", label: `Cambiar de representante: ${newAgent}`, subtitle: "Romper y empezar de cero", consequences: { agent_name: newAgent, rel_representante: 10, moral: 2 } },
        { id: "vigilar", label: "No decir nada y vigilarlo de cerca", subtitle: "Ojos abiertos", consequences: { rel_representante: -2, moral: -1 } },
      ],
    };
  }

  if (kind === "comision") {
    return {
      id,
      category: "representante",
      title: "Un cargo que no recuerdas haber pedido",
      description: `En tu extracto aparece un cargo de ${commission.toLocaleString("es")} € de ${agent} por "gestiones de mercado". No recuerdas haberle encargado nada. Cuando se lo preguntas, habla de "esfuerzos que no se ven".`,
      allowFreeText: true,
      freeTextPrompt: `${agent} te habla de "esfuerzos que no se ven". ¿Qué le dices?`,
      options: [
        {
          id: "factura",
          label: "Exigir factura y desglose",
          subtitle: "Quien no debe, no teme",
          consequences: {},
          resolve: {
            baseChance: 0.5,
            statModifier: "reputacion",
            success: { text: "No tiene factura que enseñar y devuelve el dinero de golpe, con mala cara.", consequences: { rel_representante: -3, moral: 3 } },
            fail: { text: "Te suelta un papel ilegible con un sello borroso. No hay manera de reclamar nada.", consequences: { patrimonio: -commission, rel_representante: -6, moral: -4 } },
          },
        },
        { id: "cambiar", label: `Despedirle y fichar a ${newAgent}`, subtitle: "Aquí se acaba la confianza", consequences: { patrimonio: -commission, agent_name: newAgent, rel_representante: 10, moral: 2 } },
        { id: "dejar", label: "Dejarlo pasar por esta vez", subtitle: "Elegir tus batallas", consequences: { patrimonio: -commission, rel_representante: -2, moral: -3 } },
      ],
    };
  }

  // "interes": el rumor clásico de prensa
  return {
    id,
    category: "prensa",
    title: `Suena tu nombre para ${label.replace("el mercado de ", "el ")}`,
    description: `${outlet} asegura que ${art(club)} te sigue "muy de cerca". Nadie del club ha llamado... todavía. En la puerta del entrenamiento hay más micrófonos de lo normal.`,
    allowFreeText: true,
    freeTextPrompt: `Un periodista te pregunta por ${art(club)}. ¿Qué le respondes?`,
    options: [
      {
        id: "preguntar",
        label: `Llamar a ${agent} y preguntar si hay algo de verdad`,
        subtitle: "Salir de dudas",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "reputacion",
          success: {
            text: `Hay contacto real: ${art(club)} ha preguntado por tu situación y tus condiciones. Ahora hay que ver si dan el paso.`,
            consequences: { fama: 2, moral: 3, flags: interestFlags(club, week, source) },
          },
          fail: { text: `${agent} se ríe: humo puro, ni una llamada. Alguien quería vender periódicos.`, consequences: { moral: -1 } },
        },
      },
      {
        id: "puerta",
        label: "Dejar la puerta entreabierta en rueda de prensa",
        subtitle: "Ganas fama, pierdes grada",
        consequences: {},
        resolve: {
          baseChance: 0.35,
          statModifier: "fama",
          success: {
            text: `Tus palabras llegan a ${art(club)}, que se interesa de verdad. La afición local te mira con recelo.`,
            consequences: { fama: 4, rel_aficion: -3, flags: interestFlags(club, week, source) },
          },
          fail: { text: "La afición se enfada y el rumor se apaga sin más.", consequences: { rel_aficion: -5, fama: 1 } },
        },
      },
      {
        id: "solo-mi-club",
        label: "Decir que solo piensas en tu club",
        subtitle: "Cero ruido",
        consequences: { rel_aficion: 4, rel_entrenador: 2 },
      },
    ],
  };
}

export function shouldTriggerTransferOffer(player: Player): boolean {
  const club = player.flags?.transfer_interest;
  if (typeof club !== "string" || !club || club === player.club) return false;
  const since = player.week - (parseInt(String(player.flags?.transfer_interest_week ?? "0"), 10) || 0);
  if (since < 1) return false;
  if (since > 15) return false;
  return Math.random() < 0.7;
}

/** El interés caducado (o hacia el propio club) se limpia para que no se acumule. */
export function clearStaleTransferInterest(player: Player): void {
  const club = player.flags?.transfer_interest;
  if (typeof club !== "string" || !club) return;
  const since = player.week - (parseInt(String(player.flags?.transfer_interest_week ?? "0"), 10) || 0);
  if (club === player.club || since > 15) {
    player.flags.transfer_interest = "";
  }
}

export function buildTransferOfferEvent(player: Player): GameEvent {
  const club = String(player.flags?.transfer_interest);
  // El rumor puede acabar en nada: un montaje del representante (si el
  // interés vino por él) o un club que se echa atrás sin más.
  const source = String(player.flags?.transfer_interest_source ?? "prensa");
  const roll = Math.random();
  if (source === "agente") {
    if (roll < 0.3) return buildFizzleEvent(player, "agente");
    if (roll < 0.4) return buildFizzleEvent(player, "otro");
  } else if (roll < 0.15) {
    return buildFizzleEvent(player, "otro");
  }
  const agent = player.agent_name ?? "Tu representante";
  const raise = Math.round((8000 + (player.media ?? 50) * 300) / 500) * 500;
  const clear = { transfer_interest: "" };
  const options: EventOption[] = [
    {
      id: "fichar",
      label: `Aceptar y fichar por ${art(club)}`,
      subtitle: "Nuevo reto, nuevo vestuario",
      consequences: { club, fama: 6, moral: 4, rel_vestuario: -4, rel_aficion: -5, flags: clear },
    },
    {
      id: "negociar",
      label: "Usar la oferta para negociar mejoras en tu club",
      subtitle: "Jugar tus cartas",
      consequences: {},
      resolve: {
        baseChance: 0.5,
        statModifier: "reputacion",
        success: {
          text: `Tu club se asusta y mejora tu contrato para que te quedes. Ganas peso en el vestuario y en la cuenta.`,
          consequences: { patrimonio: raise, rel_entrenador: 3, moral: 4, flags: clear },
        },
        fail: {
          text: `Tu club se lo toma mal, se enfría todo y ${art(club)} se echa atrás. Te quedas sin oferta y con el ambiente raro.`,
          consequences: { moral: -5, rel_entrenador: -3, flags: clear },
        },
      },
    },
    {
      id: "rechazar",
      label: "Rechazarla: aquí me quedo",
      subtitle: "La grada lo va a agradecer",
      consequences: { rel_aficion: 7, rel_entrenador: 3, moral: 2, flags: clear },
    },
  ];
  return {
    id: `oferta-${Date.now()}`,
    category: "representante",
    title: `Oferta formal ${de(club)}`,
    description: `${agent} entra con papeles en la mano: "Ya no es un rumor. ${art(club).charAt(0).toUpperCase() + art(club).slice(1)} ha puesto una oferta por escrito y quiere una respuesta rápida."`,
    allowFreeText: true,
    freeTextPrompt: `¿Qué le dices a ${agent} después de leer la oferta?`,
    options,
  };
}


/**
 * Decisiones PROPIAS de cambiar de equipo: hasta ahora el jugador solo
 * podía reaccionar a lo que le llegaba. Aquí es él quien puede mover
 * ficha — pedir salir, buscar un club donde juegue más, renovar o
 * quedarse. Sale tras el rumor de cada ventana, con más probabilidad si
 * está a disgusto (moral o entrenador) o si el club se le ha quedado
 * pequeño; sin resultado garantizado: el club puede negarse.
 */
export function shouldTriggerOwnMoveDecision(player: Player): boolean {
  if (player.club === NO_CLUB_YET || player.week < 12) return false;
  const loanOngoing = Boolean(player.flags?.loan_active) && !player.flags?.loan_returned;
  if (loanOngoing) return false;
  const w = getMarketWindow(player.week);
  if (!w) return false;
  if (!player.flags?.[windowKey(player.week, w)]) return false; // primero el rumor
  if (player.flags?.[`market_own_${seasonOf(player.week)}_${w}`]) return false;
  const unhappy = (player.moral ?? 70) < 55 || (player.rel_entrenador ?? 60) < 50;
  const outgrown = (player.media ?? 50) >= 75 && getEuropeanCompetitionFor(player.club)?.competition !== "champions";
  const chance = Math.min(0.85, 0.4 + (unhappy ? 0.3 : 0) + (outgrown ? 0.15 : 0));
  if (Math.random() >= chance) {
    // se anota igual para no tirar el dado cada turno de la ventana
    if (!player.flags) player.flags = {};
    player.flags[`market_own_${seasonOf(player.week)}_${w}`] = true;
    return false;
  }
  return true;
}

function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildOwnMoveEvent(player: Player): GameEvent {
  const w = getMarketWindow(player.week) ?? "verano";
  if (!player.flags) player.flags = {};
  player.flags[`market_own_${seasonOf(player.week)}_${w}`] = true;
  const media = player.media ?? 50;
  const agent = player.agent_name ?? "Tu representante";
  const bigger = pickInterestedClub(player);
  const minutesPool = (media >= 72 ? POOL_MID : POOL_LOW).filter((c) => c !== player.club);
  const minutesClub = pick(minutesPool.length ? minutesPool : POOL_LOW);
  const raise = Math.round((7000 + media * 280) / 500) * 500;
  const unhappy = (player.moral ?? 70) < 55 || (player.rel_entrenador ?? 60) < 50;
  const mood = unhappy
    ? "Llevas semanas con la cabeza en otra parte y todo el vestuario lo nota."
    : media >= 75
      ? "Sientes que el club se te está quedando pequeño."
      : "Con el mercado abierto, te toca decidir qué quieres de verdad.";

  return {
    id: `mercado-propio-${w}-${Date.now()}`,
    category: "representante",
    title: "Tu decisión: ¿te quedas o mueves ficha?",
    description: `${mood} ${agent} lo deja claro: "Si quieres moverte, es ahora. Esto lo decides tú."`,
    allowFreeText: true,
    freeTextPrompt: `Se lo dices a ${agent} sin filtros. ¿Qué quieres de verdad?`,
    options: [
      {
        id: "pedir-salir",
        label: `Pedir salir del club y apostar por ${art(bigger)}`,
        subtitle: "Un paso adelante, con riesgo de portazo",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "reputacion",
          success: {
            text: `El club acepta hablar y se cierra el traspaso a ${art(bigger)}. Te vas con abrazos en el vestuario y algún pitido en la grada.`,
            consequences: { club: bigger, fama: 4, moral: 4, rel_aficion: -6, rel_vestuario: -3 },
          },
          fail: {
            text: "El club se niega en redondo y te aparta unos días del grupo. Te toca tragar y volver a ganarte el sitio.",
            consequences: { rel_entrenador: -6, moral: -6, forma: -2 },
          },
        },
      },
      {
        id: "buscar-minutos",
        label: `Buscar un club donde juegues de verdad: ${art(minutesClub)}`,
        subtitle: "Menos brillo, más minutos",
        consequences: {},
        resolve: {
          baseChance: 0.6,
          statModifier: "media",
          success: {
            text: `${cap(art(minutesClub))} te quiere de titular indiscutible. Cambias de aires y de rol.`,
            consequences: { club: minutesClub, forma: 6, moral: 5, media: 2, fama: -2, rel_aficion: -3 },
          },
          fail: {
            text: "Nadie te ofrece un papel realmente importante. Te quedas donde estás, con la sensación de haber perdido el tiempo.",
            consequences: { moral: -3 },
          },
        },
      },
      {
        id: "renovar",
        label: "Pedir renovación con mejoras y quedarte",
        subtitle: "Apostar por este proyecto",
        consequences: {},
        resolve: {
          baseChance: 0.55,
          statModifier: "media",
          success: {
            text: "El club te renueva y te sube la ficha. Ganas peso en el vestuario y la afición te lo agradece.",
            consequences: { patrimonio: raise, moral: 4, rel_aficion: 5, rel_entrenador: 3 },
          },
          fail: {
            text: "'Ahora no es el momento', te dicen. Sigues igual, pero sabiendo dónde estás.",
            consequences: { moral: -3 },
          },
        },
      },
      {
        id: "competir",
        label: "Quedarte y competir sin más",
        subtitle: "Cabeza fría",
        consequences: { moral: 1, forma: 2, rel_entrenador: 2 },
      },
    ],
  };
}

/**
 * Último día de mercado (última semana de cada ventana): si un club
 * llevaba interés pendiente y aún no se ha decidido, llama a última hora.
 */
export function shouldTriggerDeadlineDay(player: Player): boolean {
  const club = player.flags?.transfer_interest;
  if (typeof club !== "string" || !club || club === player.club) return false;
  const w = getMarketWindow(player.week);
  if (!w) return false;
  const weekInSeason = ((player.week - 1) % 10) + 1;
  if (weekInSeason !== 4 && weekInSeason !== 9) return false;
  return !player.flags?.[`market_deadline_${seasonOf(player.week)}_${w}`];
}

export function buildDeadlineDayEvent(player: Player): GameEvent {
  const w = getMarketWindow(player.week) ?? "verano";
  if (!player.flags) player.flags = {};
  player.flags[`market_deadline_${seasonOf(player.week)}_${w}`] = true;
  const club = String(player.flags.transfer_interest);
  const agent = player.agent_name ?? "Tu representante";
  const clear = { transfer_interest: "" };
  const raise = Math.round((9000 + (player.media ?? 50) * 320) / 500) * 500;
  return {
    id: `oferta-deadline-${Date.now()}`,
    category: "representante",
    title: `Último día de mercado: llama ${art(club)}`,
    description: `Quedan horas para que se cierre el mercado. ${agent} te llama sin aliento: "${cap(art(club))} ha vuelto a la carga. O firmas hoy o esto se acaba."`,
    allowFreeText: true,
    freeTextPrompt: "Tienes el teléfono en la mano y el reloj corriendo. ¿Qué haces?",
    options: [
      {
        id: "firmar",
        label: "Firmar ya, contra reloj",
        subtitle: "Ahora o nunca",
        consequences: { club, fama: 6, moral: 3, rel_vestuario: -4, rel_aficion: -5, flags: clear },
      },
      {
        id: "forzar",
        label: "Apretar a tu club: mejoras o me voy",
        subtitle: "Jugarte el todo por el todo",
        consequences: {},
        resolve: {
          baseChance: 0.45,
          statModifier: "reputacion",
          success: {
            text: "Tu club cede en el último minuto: contrato nuevo y mejor ficha. Se cierra el mercado y sigues aquí, con más peso.",
            consequences: { patrimonio: raise, moral: 5, rel_entrenador: 2, flags: clear },
          },
          fail: {
            text: `${cap(art(club))} se cansa de esperar, tu club no se mueve y suena el pitido final del mercado. Te quedas sin nada.`,
            consequences: { moral: -6, rel_entrenador: -3, flags: clear },
          },
        },
      },
      {
        id: "dejar-pasar",
        label: "Dejarlo pasar: te quedas",
        subtitle: "Sin arrepentimientos",
        consequences: { rel_aficion: 6, moral: 1, flags: clear },
      },
    ],
  };
}



/**
 * El otro final posible de un rumor: que no haya nada. Con interés
 * generado a través del representante hay una probabilidad real de que
 * el rumor fuera un montaje suyo (para cobrar unos "gastos de gestión" de
 * un fichaje que nunca existió); en el resto, el club simplemente se echa
 * atrás de la forma más pintoresca posible.
 */
function buildFizzleEvent(player: Player, source: string): GameEvent {
  const club = String(player.flags?.transfer_interest);
  const agent = player.agent_name ?? "Tu representante";
  const media = player.media ?? 50;
  const clear = { transfer_interest: "" };

  if (source === "agente") {
    const fee = Math.min(
      Math.round((1500 + media * 90) / 100) * 100,
      Math.max(500, Math.round(((player.patrimonio ?? 0) * 0.25) / 100) * 100),
    );
    const newAgent = randomPersonName();
    return {
      id: `oferta-engano-${Date.now()}`,
      category: "representante",
      title: "El fichaje que nunca existió",
      description: `${agent} llega con la cara larga: "${cap(art(club))} se ha echado atrás. Cosas del mercado." Días después te enteras de que nunca hubo oferta y de que ya había cobrado ${fee.toLocaleString("es")} € de "gastos de gestión" a cuenta de ese traspaso.`,
      allowFreeText: true,
      freeTextPrompt: `${agent} te sonríe como si nada. ¿Qué le dices?`,
      options: [
        {
          id: "plantar-cara",
          label: "Plantarle cara y exigir el dinero",
          subtitle: "Con pruebas en la mano",
          consequences: {},
          resolve: {
            baseChance: 0.5,
            statModifier: "reputacion",
            success: { text: "Ante las pruebas se le acaba el teatro: devuelve hasta el último euro entre excusas y balbuceos.", consequences: { rel_representante: -5, moral: 4, flags: clear } },
            fail: { text: "Lo niega todo, te acusa de desconfiar y no recuperas nada. Ni el dinero ni la confianza.", consequences: { patrimonio: -fee, rel_representante: -10, moral: -5, flags: clear } },
          },
        },
        { id: "despedir", label: `Despedirle y fichar a ${newAgent}`, subtitle: "Aquí se acabó", consequences: { patrimonio: -fee, agent_name: newAgent, rel_representante: 10, moral: 2, flags: clear } },
        { id: "callar", label: "Hacerte el tonto y seguir con él", subtitle: "Mal necesario", consequences: { patrimonio: -fee, rel_representante: 2, moral: -4, flags: clear } },
      ],
    };
  }

  const excuses = [
    `${cap(art(club))} ha fichado a otro a última hora: "Le recomendó un primo del utillero y le salía más barato", te cuenta ${agent}.`,
    `${cap(art(club))} se ha echado atrás porque su presidente ha decidido "reinvertir en el césped". Así, tal cual.`,
    `Al final ${art(club)} ha cerrado a otro jugador tras una llamada de su suegra, según cuentan por los pasillos.`,
  ];
  return {
    id: `oferta-humo-${Date.now()}`,
    category: "representante",
    title: "Se cae el fichaje",
    description: pick(excuses),
    allowFreeText: true,
    freeTextPrompt: "Te toca contárselo al vestuario. ¿Qué dices?",
    options: [
      { id: "humor", label: "Tomártelo con humor en el vestuario", subtitle: "Reírte antes de que se rían de ti", consequences: { moral: 2, rel_vestuario: 3, flags: clear } },
      { id: "rabia", label: "Guardarte la rabia y entrenar el doble", subtitle: "Convertirlo en gasolina", consequences: { forma: 3, moral: -2, rel_entrenador: 2, flags: clear } },
      { id: "agente", label: `Pedirle cuentas a ${agent}`, subtitle: "Que se entere de todo antes", consequences: { rel_representante: -3, moral: 1, flags: clear } },
    ],
  };
}
