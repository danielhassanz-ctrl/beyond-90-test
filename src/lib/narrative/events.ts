import type { SupabaseClient } from "@supabase/supabase-js";
import type { GameEvent } from "@/types/career";
import { PRO_RETIREMENT_MIN_WEEK } from "@/types/career";
import type { Player } from "@/types/player";
import { pickStartingClubOffers, type ClubOffer } from "@/lib/constants";
import { describeKit } from "@/lib/clubColors";
import { EXTRA_HOMES, EXTRA_MANSIONS, EXTRA_CARS, EXTRA_YACHTS, EXTRA_JETS, MOTO_LISTINGS } from "@/lib/narrative/listings-extra";
import { cityOfClub } from "@/lib/narrative/cities";
import { getRandomFirstSigningVariant } from "@/lib/narrative/first-signing-variants";
import { getPropertyPhotoWithin } from "@/lib/images/property-photos";
import { investmentFlag } from "@/lib/finance/investments";
import { monthlyPayment, vehicleFinancing, readProperties } from "@/lib/finance/mortgage";
import { playerMonthlyNet } from "@/lib/narrative/transfer-terms";
import { leagueOf } from "@/lib/calendar/leagues";
import { EVENTS_1 } from "@/lib/narrative/events-data/eventos-1";
import { EVENTS_2 } from "@/lib/narrative/events-data/eventos-2";
import { EVENTS_3 } from "@/lib/narrative/events-data/eventos-3";
import { EVENTS_4 } from "@/lib/narrative/events-data/eventos-4";
import { EVENTS_5 } from "@/lib/narrative/events-data/eventos-5";
import { EVENTS_6 } from "@/lib/narrative/events-data/eventos-6";

/**
 * Primer evento de carrera: elegir representante. Ahora es dinámico con 15+ variantes
 * para que cada carrera comience diferente. Puede ser agente hambriento, desconocido,
 * competición de agentes, o casos inesperados. La narrativa y el contexto cambian.
 */
export function buildEleccionRepresentanteEvent(): GameEvent {
  return getRandomFirstSigningVariant();
}

/**
 * Segundo evento, siempre igual y siempre justo después de elegir
 * representante: 2-3 ofertas de clubes modestos para arrancar. No hay
 * "gran club" todavía, eso se gana jugando.
 */
/** Reserva por si la escena de contrato generada por IA falla (sin crédito, error de red, etc.) */
export function buildFallbackContractEvent(
  club: string,
  agentName: string,
  isFirstSigning: boolean,
  /** El sueldo real al año, en texto (ver annualSalaryText). Si no llega, una cifra de cantera. */
  salaryText?: string,
): GameEvent {
  const salary = salaryText ?? `${(Math.round((9000 + Math.random() * 20000) / 500) * 500).toLocaleString("es")} € brutos al año`;
  const minutosClause = isFirstSigning
    ? "sin ninguna promesa de minutos: tendrás que ganarte el puesto en pretemporada"
    : "titular indiscutible desde el primer partido";

  return {
    id: `contrato-${isFirstSigning ? "debut" : "fallback"}-${Date.now()}`,
    category: "representante",
    title: "Firma del contrato",
    description: `Te sientas con el entrenador, el presidente del ${club} y ${agentName} para cerrar los términos: ${salary} de salario y ${minutosClause}.`,
    milestoneType: "contrato",
    imageScene: `Photorealistic photo of the photographed man holding up a ${describeKit(club)} football jersey with both hands at an official club unveiling event, a club president in a suit next to him extending a handshake, camera flashes, stadium or press room backdrop, official club photo style`,
    options: [
      {
        id: "a",
        label: "Aceptar las condiciones tal cual las trae el club",
        subtitle: "Rápido y sin fricción",
        consequences: { moral: 3, rel_entrenador: 3 },
      },
      {
        id: "b",
        label: `Dejar que ${agentName} presione por mejores condiciones`,
        subtitle: "Puede tensar la negociación",
        consequences: { patrimonio: isFirstSigning ? 300 : 3000, rel_representante: 4, moral: -1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Algo que quieras dejar claro antes de firmar?",
  };
}

/**
 * Convierte el desglose desarrollo/competencia/minutos/riesgo de una
 * oferta de club en las "details" que sabe pintar la pantalla de
 * decisión. Se usa tanto para el evento escrito a mano como para
 * enriquecer el evento generado por la IA (ver attachClubOfferDetails) —
 * las categorías siempre están disponibles, escriba quien escriba el
 * resto del texto.
 */
function clubOfferDetails(offer: ClubOffer): { icon: string; label: string; text: string }[] {
  return [
    { icon: "📈", label: "Desarrollo", text: offer.desarrollo },
    { icon: "👥", label: "Competencia", text: offer.competencia },
    { icon: "⏱️", label: "Minutos", text: offer.minutos },
    { icon: "⚠️", label: "Riesgo", text: offer.riesgo },
  ];
}

/**
 * La IA escribe su propia versión de "Las primeras ofertas" (para que
 * cada carrera arranque con un texto distinto), pero eso significaba que
 * las tarjetas ricas de club (nivel, desarrollo, competencia, minutos,
 * riesgo) solo se veían en la rara ocasión en que la IA fallaba y se
 * usaba el evento de reserva. Esto adjunta esas categorías siempre,
 * emparejando por posición — la IA respeta el orden de `offers` porque
 * así se le pide explícitamente en el prompt.
 */
export function attachClubOfferDetails(event: GameEvent, offers: ClubOffer[]): GameEvent {
  return {
    ...event,
    options: event.options.map((option, i) => {
      const offer = offers[i];
      if (!offer) return option;
      return { ...option, level: offer.nivel, details: clubOfferDetails(offer) };
    }),
  };
}

export function buildInicioFichajeEvent(agentName: string, offers: ClubOffer[] = pickStartingClubOffers()): GameEvent {
  const hasGiant = offers.some((o) => o.club === "Real Madrid" || o.club === "FC Barcelona");

  return {
    id: "inicio-fichaje-agente",
    category: "representante",
    title: "Las primeras ofertas",
    description: hasGiant
      ? `${agentName} se reúne contigo con una noticia enorme: uno de los clubes interesados en ti es un auténtico gigante. Los otros dos son puertas de entrada más modestas, pero esta vez hay una oportunidad que casi nunca llega.`
      : `${agentName} se reúne contigo con dos o tres clubes modestos interesados en darte tu primer contrato profesional. Ninguno es un gigante, pero todos son una puerta de entrada.`,
    // Elegir entre ofertas todavía no es el momento fotografiable — la
    // firma real (con camiseta, presidente y flashes) llega justo
    // después vía generateContractEvent, que sí es milestone. Marcar los
    // dos como hito duplicaba la misma "noticia de fichaje" en dos
    // tarjetas compartibles seguidas.
    milestoneType: "contrato",
    options: offers.map((offer) => ({
      id: offer.club,
      label: offer.club,
      subtitle: offer.pitch,
      level: offer.nivel,
      details: clubOfferDetails(offer),
      consequences: { club: offer.club, moral: 5 },
    })),
  };
}

function randomPrice(min: number, max: number, roundTo: number): number {
  const raw = min + Math.random() * (max - min);
  return Math.round(raw / roundTo) * roundTo;
}

function pickRandom<T>(items: T[], n: number): T[] {
  return [...items].sort(() => Math.random() - 0.5).slice(0, n);
}

/**
 * Elige n opciones del catálogo que el jugador PUEDE pagar (la entrada del
 * préstamo cabe en su cuenta). Antes los coches, yates y jets se ofrecían sin
 * comprobar el dinero: con 40.000 € se podía "comprar" un superdeportivo de
 * 375.000 € pagando solo lo que había en la cuenta, y el resto desaparecía.
 * Si no hay suficientes asequibles, se completa con los más baratos.
 */
/**
 * Lo que ya es tuyo (casa, coche, moto, yate, jet) no se te vuelve a ofrecer: se quitan del catálogo los modelos que ya
 * tienes (por su nombre sin ciudad). Si no quedaran opciones, se deja el catálogo entero.
 */
export function withoutOwned<T extends { name: string }>(items: T[], player: Pick<Player, "flags">, minLeft = 1): T[] {
  const owned = new Set(readProperties(player.flags).map((p) => baseListingName(p.name)));
  if (owned.size === 0) return items;
  const rest = items.filter((l) => !owned.has(baseListingName(l.name)));
  return rest.length >= minLeft ? rest : items;
}

function pickAffordable<T extends { name: string; min: number; max: number }>(
  catalog: T[],
  n: number,
  kind: "coche" | "moto" | "yate" | "jet",
  player: Player,
  roundTo: number,
  seed?: string,
): (T & { price: number })[] {
  const downFor = (price: number) => vehicleFinancing(kind, price).down;
  catalog = withoutOwned(catalog, player, n);
  const affordable = catalog.filter((l) => downFor(l.min) <= player.patrimonio);
  const pool = affordable.length >= n ? affordable : [...catalog].sort((a, b) => a.min - b.min).slice(0, Math.max(n, affordable.length));
  return (seed ? pickSeeded(pool, n, seed) : pickRandom(pool, n)).map((l) => {
    let price = randomPrice(l.min, l.max, roundTo);
    // Tampoco se sortea un precio cuya entrada no puedas pagar si el mínimo sí.
    if (downFor(price) > player.patrimonio && downFor(l.min) <= player.patrimonio) {
      price = Math.max(l.min, Math.floor(player.patrimonio / (downFor(1000000) / 1000000) / roundTo) * roundTo);
    }
    return { ...l, price };
  });
}

/** Una opción de compra financiada: entrada ahora, cuota cada mes, deuda que cuenta en tu patrimonio. */
function financedPurchase(
  kind: "coche" | "moto" | "yate" | "jet",
  l: { name: string; price: number },
  photoUrl: string | null | undefined,
  week: number,
  i: number,
  city?: string,
) {
  const f = vehicleFinancing(kind, l.price);
  const monthly = monthlyPayment({ key: "", name: "", price: l.price, downPayment: f.down, termMonths: f.termMonths, rate: f.rate });
  return {
    down: f.down,
    monthly,
    flag: {
      [`propiedad_${Date.now()}_${i}`]: JSON.stringify({
        ...(city ? { city } : {}),
        name: l.name,
        price: l.price,
        downPayment: f.down,
        termMonths: f.termMonths,
        rate: f.rate,
        kind: f.kind,
        photoUrl: photoUrl ?? null,
        since: week,
      }),
    },
  };
}

/**
 * Clubes cuya ciudad es claramente de interior: ofrecer una villa "junto
 * al mar" o un yate a alguien que juega ahí no tiene ninguna coherencia
 * geográfica (visto en vivo con un jugador del Real Madrid al que le
 * salía una villa frente al mar). El resto de clubes por defecto se
 * consideran compatibles con listados de costa — la mayoría de ciudades
 * españolas y europeas del juego están cerca del mar o son ambiguas, y
 * el caso que de verdad rompía la inmersión era el de las grandes
 * capitales de interior.
 */
const INLAND_CLUBS = new Set([
  "Real Madrid",
  "Atlético de Madrid",
  "Rayo Vallecano",
  "Getafe CF",
  "Real Valladolid",
  "Real Zaragoza",
  "Bayern de Múnich",
  "Bayern Múnich",
  "Bayern Munich",
  "Juventus",
  "PSG",
  "Al Hilal",
  "Al-Nassr FC",
  "Manchester City",
  "Manchester United",
]);

export function isInlandClub(club: string): boolean {
  return INLAND_CLUBS.has(club);
}

export const HOME_LISTINGS = [
  {
    name: "Piso de dos habitaciones cerca de la ciudad deportiva",
    min: 90000,
    max: 130000,
    prompt: "Real estate photography, modern two-bedroom apartment building exterior near a sports training facility, clean architecture, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Ático con terraza en pleno centro",
    min: 140000,
    max: 190000,
    prompt: "Real estate photography, rooftop penthouse terrace in a city center, modern building, skyline view, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Casa a las afueras, cerca de donde creciste",
    min: 100000,
    max: 150000,
    prompt: "Real estate photography, cozy suburban house with small garden, quiet residential street, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Dúplex nuevo en una zona residencial tranquila",
    min: 110000,
    max: 160000,
    prompt: "Real estate photography, brand new modern duplex house, quiet residential neighborhood, clean lines, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso reformado junto al estadio",
    min: 95000,
    max: 135000,
    prompt: "Real estate photography, renovated modern apartment building exterior near a football stadium, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso luminoso en un edificio clásico del centro histórico",
    min: 105000,
    max: 145000,
    prompt: "Real estate photography, bright apartment in a classic historic building facade, ornate balconies, old town street, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Casa adosada con jardín pequeño en las afueras",
    min: 115000,
    max: 155000,
    prompt: "Real estate photography, townhouse with small private garden, quiet suburban street, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Loft industrial reformado cerca del puerto",
    min: 100000,
    max: 140000,
    prompt: "Real estate photography, converted industrial loft building exterior near a harbor, exposed brick and large windows, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Apartamento con vistas al río en un edificio nuevo",
    min: 120000,
    max: 165000,
    prompt: "Real estate photography, brand new riverside apartment building with large windows, river view, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso de tres habitaciones en un barrio familiar tranquilo",
    min: 100000,
    max: 145000,
    prompt: "Real estate photography, three-bedroom apartment building in a quiet family neighborhood, tree-lined street, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso con balcón cerca del campus universitario",
    min: 85000,
    max: 120000,
    prompt: "Real estate photography, apartment building with balconies near a university campus, modern facade, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Ático con jacuzzi privado en la terraza",
    min: 155000,
    max: 200000,
    prompt: "Real estate photography, penthouse rooftop terrace with private jacuzzi, city view, bright daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso reformado en un edificio de ladrillo visto",
    min: 100000,
    max: 140000,
    prompt: "Real estate photography, renovated apartment building with exposed brick facade, urban street, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Loft tipo estudio en una antigua fábrica reconvertida",
    min: 95000,
    max: 135000,
    prompt: "Real estate photography, converted factory building turned into loft apartments, industrial windows, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso con parking incluido en una urbanización cerrada",
    min: 110000,
    max: 150000,
    prompt: "Real estate photography, apartment building in a gated residential complex with parking, landscaped gardens, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Ático dúplex con vistas a un parque urbano",
    min: 160000,
    max: 210000,
    prompt: "Real estate photography, duplex penthouse building overlooking a city park, large terrace, bright daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso soleado en un edificio con piscina comunitaria",
    min: 105000,
    max: 145000,
    prompt: "Real estate photography, sunny apartment building with a communal swimming pool, modern facade, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Ático reformado con techos altos y grandes ventanales",
    min: 150000,
    max: 195000,
    prompt: "Real estate photography, renovated penthouse with high ceilings and large windows, elegant facade, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso tranquilo en una zona residencial con parques cercanos",
    min: 95000,
    max: 135000,
    prompt: "Real estate photography, apartment building in a quiet residential area surrounded by green parks, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Dúplex interior con patio privado",
    min: 115000,
    max: 155000,
    prompt: "Real estate photography, duplex house with a private interior courtyard, quiet street, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso funcional cerca de la estación de tren",
    min: 88000,
    max: 125000,
    prompt: "Real estate photography, functional apartment building near a train station, urban street, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Ático nuevo con placas solares y domótica",
    min: 165000,
    max: 215000,
    prompt: "Real estate photography, brand new penthouse building with solar panels and smart home features, modern architecture, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso amplio en un edificio clásico con portero",
    min: 130000,
    max: 175000,
    prompt: "Real estate photography, spacious apartment in a classic elegant building with a doorman entrance, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Casa pequeña de una planta con patio trasero",
    min: 92000,
    max: 130000,
    prompt: "Real estate photography, small single-story house with a backyard patio, quiet suburban street, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso con vistas al mar en un edificio de primera línea",
    min: 140000,
    max: 190000,
    prompt: "Real estate photography, beachfront apartment building with sea view, modern facade, bright daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Ático con terraza panorámica y zona de barbacoa",
    min: 155000,
    max: 205000,
    prompt: "Real estate photography, penthouse terrace with panoramic view and outdoor barbecue area, bright daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso clásico con suelos originales en un edificio señorial",
    min: 120000,
    max: 165000,
    prompt: "Real estate photography, classic apartment in a stately old building with ornate facade, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Apartamento moderno con gimnasio en el edificio",
    min: 125000,
    max: 170000,
    prompt: "Real estate photography, modern apartment building with an in-house gym facility, clean architecture, daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Piso en un edificio nuevo cerca de un parque natural",
    min: 108000,
    max: 148000,
    prompt: "Real estate photography, new apartment building near a natural park, green surroundings, bright daylight, professional listing photo, photorealistic, no people",
  },
];

// El umbral de patrimonio que activa buildCasaEvent/buildMansionEvent
// (en carrera/page.tsx) tiene que cubrir de verdad la entrada de la
// vivienda MÁS BARATA del catálogo — si no, un jugador puede llegar a ver
// tres opciones de casa sin poder pagar la entrada de ninguna. Ya pasó
// una vez (el umbral se fijó a mano y el catálogo creció después sin
// volver a comprobarlo); calculándolo aquí a partir de los datos reales
// no puede volver a desincronizarse.
export function getMinHomeDownPayment(): number {
  const cheapest = Math.min(...HOME_LISTINGS.map((l) => l.min));
  return Math.round((cheapest * 0.2) / 500) * 500;
}

const MANSION_LISTINGS = [
  {
    name: "Mansión con piscina en una urbanización exclusiva",
    min: 1800000,
    max: 2600000,
    prompt: "Real estate photography, luxury mansion with large swimming pool, exclusive gated community, palm trees, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Ático de lujo con vistas a toda la ciudad",
    min: 1200000,
    max: 1900000,
    prompt: "Real estate photography, luxury penthouse terrace with panoramic city skyline view, modern glass architecture, golden hour, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Finca con terreno propio y zona de entrenamiento personal",
    min: 2200000,
    max: 3400000,
    prompt: "Real estate photography, large private estate with green land and a personal outdoor sports training area, countryside, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Villa moderna junto al mar",
    min: 1600000,
    max: 2400000,
    prompt: "Real estate photography, modern minimalist villa right by the sea, infinity pool facing the ocean, bright daylight, professional listing photo, photorealistic, no people",
    coastal: true,
  },
  {
    name: "Casa histórica reformada en el barrio más exclusivo",
    min: 1900000,
    max: 2800000,
    prompt: "Real estate photography, beautifully renovated historic mansion in an exclusive upscale neighborhood, elegant facade, daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Villa con vistas al golfo y muelle privado",
    min: 2100000,
    max: 3200000,
    prompt: "Real estate photography, luxury waterfront villa with panoramic gulf view and private boat dock, bright daylight, professional listing photo, photorealistic, no people",
    coastal: true,
  },
  {
    name: "Casa de diseño minimalista con piscina infinita en la montaña",
    min: 2000000,
    max: 2900000,
    prompt: "Real estate photography, minimalist architect-designed house with infinity pool overlooking mountains, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Mansión de estilo clásico con biblioteca y bodega propia",
    min: 1700000,
    max: 2500000,
    prompt: "Real estate photography, classic-style mansion exterior with manicured gardens, elegant estate, daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Chalet de lujo junto al club de golf",
    min: 1500000,
    max: 2200000,
    prompt: "Real estate photography, luxury villa bordering a golf course, manicured green fairways visible, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Casa acristalada con vistas al mar Mediterráneo",
    min: 2300000,
    max: 3300000,
    prompt: "Real estate photography, glass-walled modern house with panoramic Mediterranean sea view, bright daylight, professional listing photo, photorealistic, no people",
    coastal: true,
  },
  {
    name: "Villa toscana con viñedo propio",
    min: 1900000,
    max: 2700000,
    prompt: "Real estate photography, Tuscan-style villa surrounded by its own vineyard, warm daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Palacete urbano restaurado con patio interior",
    min: 2000000,
    max: 2900000,
    prompt: "Real estate photography, restored urban palace mansion with an elegant interior courtyard, daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Casa de cristal y madera en un bosque privado",
    min: 1700000,
    max: 2400000,
    prompt: "Real estate photography, glass and wood house surrounded by a private forest, natural light, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Mansión de estilo colonial con columnas y jardín central",
    min: 1900000,
    max: 2800000,
    prompt: "Real estate photography, colonial-style mansion with grand columns and a central garden, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Villa balinesa con piscina de piedra natural",
    min: 2100000,
    max: 3000000,
    prompt: "Real estate photography, Balinese-style villa with a natural stone swimming pool, tropical garden, bright daylight, professional listing photo, photorealistic, no people",
    coastal: true,
  },
  {
    name: "Casa flotante de lujo en un lago privado",
    min: 1800000,
    max: 2600000,
    prompt: "Real estate photography, luxury floating house on a private lake, calm water, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Cortijo andaluz reformado con caballerizas",
    min: 1600000,
    max: 2300000,
    prompt: "Real estate photography, renovated Andalusian countryside estate with horse stables, warm daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Villa contemporánea con muro de cristal frente al mar",
    min: 2400000,
    max: 3400000,
    prompt: "Real estate photography, contemporary villa with a glass wall facing the sea, infinity pool, bright daylight, professional listing photo, photorealistic, no people",
    coastal: true,
  },
  {
    name: "Casa de un solo nivel estilo californiano con jardín tropical",
    min: 1700000,
    max: 2500000,
    prompt: "Real estate photography, single-story California-style house with a tropical garden, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Mansión gótica restaurada con torre y jardines",
    min: 2000000,
    max: 2900000,
    prompt: "Real estate photography, restored gothic-style mansion with a tower and manicured gardens, daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Villa mediterránea de estilo ibicenco con vistas al atardecer",
    min: 2200000,
    max: 3100000,
    prompt: "Real estate photography, Ibiza-style Mediterranean villa with sunset ocean view, whitewashed walls, professional listing photo, photorealistic, no people",
    coastal: true,
  },
  {
    name: "Casa ecológica autosuficiente con huerto propio",
    min: 1500000,
    max: 2200000,
    prompt: "Real estate photography, self-sufficient eco house with solar panels and a private vegetable garden, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Palacio urbano dividido en plantas privadas",
    min: 2100000,
    max: 3000000,
    prompt: "Real estate photography, urban palace mansion with elegant private floors, ornate facade, daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Chalet de esquí con acceso directo a las pistas",
    min: 1900000,
    max: 2800000,
    prompt: "Real estate photography, luxury ski chalet with direct slope access, snowy mountains, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Casa de playa minimalista con terraza infinita",
    min: 2000000,
    max: 2900000,
    prompt: "Real estate photography, minimalist beach house with an endless terrace facing the ocean, bright daylight, professional listing photo, photorealistic, no people",
    coastal: true,
  },
  {
    name: "Mansión con pista de tenis privada y piscina climatizada",
    min: 2300000,
    max: 3300000,
    prompt: "Real estate photography, luxury mansion with a private tennis court and heated swimming pool, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Villa con bodega subterránea y sala de catas",
    min: 1800000,
    max: 2600000,
    prompt: "Real estate photography, luxury villa exterior with an underground wine cellar entrance, elegant estate, daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Casa de campo restaurada con terreno propio",
    min: 1600000,
    max: 2400000,
    prompt: "Real estate photography, restored countryside manor with its own land, rustic elegance, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Villa contemporánea con patio zen y muro verde",
    min: 1900000,
    max: 2700000,
    prompt: "Real estate photography, contemporary villa with a zen courtyard and a living green wall, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Casa señorial con fachada de piedra",
    min: 1800000,
    max: 2600000,
    prompt: "Real estate photography, stately manor house with a stone facade, elegant gardens, daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Mansión frente al lago con embarcadero privado",
    min: 2000000,
    max: 2900000,
    prompt: "Real estate photography, lakeside mansion with a private boat dock, calm water, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Villa de lujo con spa privado y gimnasio integrado",
    min: 2200000,
    max: 3100000,
    prompt: "Real estate photography, luxury villa with a private spa and integrated home gym, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Casa moderna en acantilado con vistas panorámicas al mar",
    min: 2600000,
    max: 3600000,
    prompt: "Real estate photography, modern clifftop house with panoramic sea views, dramatic coastline, bright daylight, professional listing photo, photorealistic, no people",
    coastal: true,
  },
  {
    name: "Palacete afrancesado con jardines geométricos",
    min: 2100000,
    max: 3000000,
    prompt: "Real estate photography, French-style mansion with geometric formal gardens, elegant facade, daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Villa tropical con piscina infinita y cabaña de invitados",
    min: 2300000,
    max: 3200000,
    prompt: "Real estate photography, tropical villa with an infinity pool and a separate guest cottage, bright daylight, professional listing photo, photorealistic, no people",
    coastal: true,
  },
  {
    name: "Mansión brutalista de hormigón y cristal",
    min: 1900000,
    max: 2800000,
    prompt: "Real estate photography, brutalist-style mansion made of concrete and glass, striking modern architecture, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Casa de troncos de lujo en plena naturaleza",
    min: 1600000,
    max: 2300000,
    prompt: "Real estate photography, luxury log cabin house surrounded by nature, warm daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Villa andaluza con patio de naranjos y fuente central",
    min: 1800000,
    max: 2600000,
    prompt: "Real estate photography, Andalusian-style villa with an orange tree courtyard and central fountain, bright daylight, professional listing photo, photorealistic, no people",
    coastal: false,
  },
  {
    name: "Villa de diseño con fachada ondulada frente al mar",
    min: 2500000,
    max: 3500000,
    prompt: "Real estate photography, architect-designed villa with a curved wave-like facade facing the sea, bright daylight, professional listing photo, photorealistic, no people",
    coastal: true,
  },
];

/** Mismo razonamiento que getMinHomeDownPayment, para la segunda vivienda de lujo. */
export function getMinMansionDownPayment(): number {
  const cheapest = Math.min(...MANSION_LISTINGS.map((l) => l.min));
  return Math.round((cheapest * 0.3) / 10000) * 10000;
}

/**
 * Caprichos de "crack": solo tienen sentido cuando el jugador ya es una
 * figura de verdad (fama y media altas), no algo que aparezca porque sí
 * ha pasado el tiempo — comprarse un yate con 20 años y fama de barrio no
 * cuadra.
 */
const YACHT_LISTINGS = [
  {
    name: "Yate deportivo de 15 metros",
    min: 450000,
    max: 700000,
    prompt: "Real estate photography, sleek 15-meter sport yacht docked in a marina, bright daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Yate de lujo con cabina para invitados",
    min: 900000,
    max: 1400000,
    prompt: "Real estate photography, luxury motor yacht with guest cabins, docked in an exclusive marina, bright daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Barco pequeño para fines de semana",
    min: 60000,
    max: 120000,
    prompt: "Real estate photography, small elegant weekend motorboat docked in a marina, bright daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Catamarán de lujo para toda la familia",
    min: 550000,
    max: 850000,
    prompt: "Real estate photography, luxury catamaran yacht docked in a marina, spacious deck, bright daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Yate clásico de madera restaurado",
    min: 300000,
    max: 500000,
    prompt: "Real estate photography, classic restored wooden yacht docked in a marina, vintage elegant design, bright daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Superyate con helipuerto",
    min: 3000000,
    max: 5000000,
    prompt: "Real estate photography, massive superyacht with helicopter landing pad docked in an exclusive marina, bright daylight, professional listing photo, photorealistic, no people",
  },
];

const JET_LISTINGS = [
  {
    name: "Jet privado de segunda mano, corto alcance",
    min: 2500000,
    max: 4000000,
    prompt: "Real estate photography, small private business jet parked on a sunny airport tarmac, professional listing photo, photorealistic, no people",
  },
  {
    name: "Jet privado de largo alcance",
    min: 6000000,
    max: 9000000,
    prompt: "Real estate photography, long-range private jet parked on an airport tarmac, bright daylight, professional listing photo, photorealistic, no people",
  },
  {
    name: "Jet privado de gama media con cabina VIP",
    min: 4000000,
    max: 6000000,
    prompt: "Real estate photography, midsize private jet with VIP cabin parked on a sunny airport tarmac, professional listing photo, photorealistic, no people",
  },
  {
    name: "Multipropiedad de un jet privado ejecutivo",
    min: 800000,
    max: 1500000,
    prompt: "Real estate photography, executive private jet parked on a private airfield tarmac, bright daylight, professional listing photo, photorealistic, no people",
  },
];

/**
 * Coches deportivos: el primer capricho de verdad, mucho antes que un
 * yate o un jet — llega con el primer contrato serio, no con la carrera
 * consolidada. Los nombres describen el tipo de coche (compacto,
 * descapotable, superdeportivo...) sin marcas reales, igual que con los
 * escudos de club: el modelo de imagen no reproduce bien logos exactos
 * de marcas de coches y usarlos tal cual es terreno legal delicado.
 */
export const CAR_LISTINGS = [
  {
    name: "Deportivo compacto de segunda mano",
    min: 35000,
    max: 60000,
    prompt: "Automotive photography, sporty compact two-door coupe parked in an empty urban street, dynamic angle, daylight, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Coupé deportivo alemán",
    min: 70000,
    max: 100000,
    prompt: "Automotive photography, sleek German-style sports coupe parked in a modern parking garage, dynamic angle, daylight, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Descapotable italiano de edición limitada",
    min: 150000,
    max: 230000,
    prompt: "Automotive photography, limited-edition Italian-style convertible sports car parked on a scenic coastal road, bright daylight, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Superdeportivo de fibra de carbono",
    min: 280000,
    max: 420000,
    prompt: "Automotive photography, extreme carbon-fiber supercar parked in a private garage with dramatic lighting, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Deportivo eléctrico de última generación",
    min: 110000,
    max: 170000,
    prompt: "Automotive photography, futuristic all-electric sports car parked in a modern showroom, sleek design, bright lighting, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Clásico deportivo restaurado de coleccionista",
    min: 120000,
    max: 200000,
    prompt: "Automotive photography, beautifully restored vintage classic sports car parked in a private collector's garage, warm lighting, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Compacto GTI de caja manual",
    min: 36000,
    max: 55000,
    prompt: "Automotive photography, sporty hot-hatch with red accents parked on a quiet city street, dynamic angle, daylight, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Berlina deportiva de cuatro puertas",
    min: 75000,
    max: 110000,
    prompt: "Automotive photography, powerful dark sports saloon with four doors parked in front of a modern glass building, daylight, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Roadster ligero de dos plazas",
    min: 60000,
    max: 95000,
    prompt: "Automotive photography, lightweight two-seat roadster with the roof down on a winding road, golden hour, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "SUV de lujo con interior de piel",
    min: 90000,
    max: 140000,
    prompt: "Automotive photography, large luxury SUV with a leather interior visible through the window parked outside a stylish hotel, daylight, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Gran turismo británico de edición especial",
    min: 190000,
    max: 280000,
    prompt: "Automotive photography, elegant British-style grand tourer in racing green with a long bonnet, parked on a stone driveway, soft daylight, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Pickup americana preparada",
    min: 65000,
    max: 100000,
    prompt: "Automotive photography, customised full-size pickup truck with chrome details and big wheels parked at a ranch-style house, daylight, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Coupé clásico de los setenta restaurado",
    min: 85000,
    max: 140000,
    prompt: "Automotive photography, beautifully restored 1970s coupe in deep blue with chrome bumpers parked in front of an old garage, warm light, professional listing photo, photorealistic, no people, no visible brand logos",
  },
  {
    name: "Hiperdeportivo híbrido de serie limitada",
    min: 350000,
    max: 520000,
    prompt: "Automotive photography, extreme hybrid hypercar with sharp aerodynamic lines parked in a minimalist private garage, dramatic lighting, professional listing photo, photorealistic, no people, no visible brand logos",
  },
];

// Catálogo ampliado (listings-extra.ts): más casas, mansiones, coches, yates y jets; las motos son un catálogo propio.
HOME_LISTINGS.push(...EXTRA_HOMES);
MANSION_LISTINGS.push(...EXTRA_MANSIONS);
CAR_LISTINGS.push(...EXTRA_CARS);
YACHT_LISTINGS.push(...EXTRA_YACHTS);
JET_LISTINGS.push(...EXTRA_JETS);

/**
 * Comprar la primera vivienda: 3 opciones sorteadas de un catálogo, cada
 * una con un precio real que se descuenta del patrimonio tal cual, no una
 * cifra aproximada fija. Si el jugador ya tiene pareja, su opinión entra
 * en la decisión en vez de comprar en solitario. Cada opción trae su foto
 * real (generada una vez por listado y cacheada — ver property-photos.ts).
 */
/**
 * Prompt de la foto de un listado por su nombre exacto — para poder generar
 * (una sola vez, ver getOrCreatePropertyPhoto) la foto de una propiedad
 * comprada cuando no llegó a guardarse en su momento.
 */
export function findPropertyPrompt(name: string): string | null {
  const all = [...HOME_LISTINGS, ...MANSION_LISTINGS, ...YACHT_LISTINGS, ...JET_LISTINGS, ...CAR_LISTINGS, ...MOTO_LISTINGS] as { name: string; prompt: string }[];
  const base = baseListingName(name);
  const found = all.find((l) => l.name === base);
  if (!found) return null;
  // Con ciudad («… (Madrid)»), la foto lleva el sello de esa ciudad.
  return base === name ? found.prompt : localizeListing(found, name.slice(base.length + 2, -1)).prompt;
}

/**
 * Foto del INTERIOR de una propiedad (salón moderno, cabina del jet, salón
 * del yate, habitáculo del coche) — se enseña en Patrimonio junto a la
 * exterior. El estilo se deduce del nombre del listado para que un loft no
 * tenga el mismo salón que una villa junto al mar.
 */
export function findPropertyInteriorPrompt(fullName: string): string | null {
  const name = baseListingName(fullName);
  const n = name.toLowerCase();
  if (HOME_LISTINGS.some((l) => l.name === name) || MANSION_LISTINGS.some((l) => l.name === name)) {
    const mansion = MANSION_LISTINGS.some((l) => l.name === name);
    let style = "bright modern open-plan living room with a comfortable designer sofa, wooden floor and large windows";
    if (n.includes("loft") || n.includes("industrial") || n.includes("fábrica") || n.includes("ladrillo")) style = "industrial loft living room with exposed brick, high ceilings, leather sofa and big metal-framed windows";
    else if (n.includes("ático") || n.includes("atico")) style = "penthouse living room with floor-to-ceiling windows, city skyline view, modern minimalist furniture";
    else if (n.includes("mar") || n.includes("golfo") || n.includes("mediterr")) style = "luxurious beach-house living room with floor-to-ceiling glass facing the sea, white sofas and natural light";
    else if (n.includes("clásic") || n.includes("histórica") || n.includes("señorial") || n.includes("biblioteca")) style = "elegant classic living room with original floors, high ceilings, a fireplace and a refined modern sofa";
    else if (n.includes("toscana") || n.includes("finca")) style = "rustic-chic villa living room with stone walls, wooden beams, a big sofa and vineyard views through the windows";
    else if (n.includes("minimalista") || n.includes("diseño") || n.includes("acristalada")) style = "ultra-modern minimalist living room with concrete and glass, designer furniture and an infinity-pool view";
    else if (mansion) style = "grand luxury living room with double-height ceiling, designer sofas, marble details and a view of the pool";
    return `Interior design photography, ${style}, warm natural light, magazine quality, photorealistic, no people`;
  }
  if (YACHT_LISTINGS.some((l) => l.name === name)) return "Interior photography, luxurious yacht main salon with cream leather sofas, wood paneling and large windows facing the sea, photorealistic, no people";
  if (MOTO_LISTINGS.some((l) => l.name === name)) return "Motorcycle detail photography, premium motorcycle handlebars, digital dashboard and leather seat close-up, photorealistic, no people, no visible brand logos";
  if (JET_LISTINGS.some((l) => l.name === name)) return "Interior photography, private jet cabin with cream leather seats, wood details and soft lighting, photorealistic, no people";
  if (CAR_LISTINGS.some((l) => l.name === name)) return "Automotive interior photography, sports car cockpit with leather seats, carbon-fibre details and a digital dashboard, photorealistic, no people, no visible brand logos";
  return null;
}

/** Qué tipo de capricho es una propiedad por su nombre (coche, yate o jet), o null si es una casa. */
export function findVehicleKind(fullName: string): "coche" | "moto" | "yate" | "jet" | null {
  const name = baseListingName(fullName);
  if (CAR_LISTINGS.some((l) => l.name === name)) return "coche";
  if (MOTO_LISTINGS.some((l) => l.name === name)) return "moto";
  if (YACHT_LISTINGS.some((l) => l.name === name)) return "yate";
  if (JET_LISTINGS.some((l) => l.name === name)) return "jet";
  return null;
}

export async function buildCasaEvent(player: Player, supabase: SupabaseClient): Promise<GameEvent> {
  // El umbral de patrimonio que dispara este evento solo garantiza que
  // la vivienda MÁS BARATA de todo el catálogo sea pagable — pero los 3
  // listados que se enseñan salen sorteados del catálogo entero, así que
  // sin este filtro podían tocarle 3 opciones caras igualmente, aunque el
  // jugador cumpliera el umbral general. Se prioriza mostrar las que de
  // verdad puede pagar; solo si no hay 3 así, se completa con las más
  // baratas del resto (nunca al azar entre las caras).
  const homes = withoutOwned(HOME_LISTINGS, player, 3);
  const affordable = homes.filter(
    (l) => Math.round((l.min * 0.2) / 500) * 500 <= player.patrimonio,
  );
  const pool =
    affordable.length >= 3
      ? affordable
      : [...homes].sort((a, b) => a.min - b.min);
  const listings = pickRandom(pool, 3).map((l) => ({
    ...l,
    price: randomPrice(l.min, l.max, 5000),
  }));
  const partner = typeof player.flags?.pareja === "string" ? player.flags.pareja : null;
  const photos = await Promise.all(listings.map((l) => getPropertyPhotoWithin(supabase, player.user_id, l.name, l.prompt)));

  return {
    id: "vid-casa",
    category: "vida",
    title: "Tu primer contrato importante",
    description: partner
      ? `Con el nuevo sueldo, tu representante te enseña tres opciones de vivienda. Se las enseñas también a ${partner}, que tiene bastante claro cuál le gusta más — aunque la decisión final es tuya. El precio es el de venta; lo que pagas ahora es la entrada, el resto se financia con hipoteca.`
      : "Con el nuevo sueldo, tu representante te sugiere invertir en una vivienda propia y te enseña tres opciones. El precio es el de venta; lo que pagas ahora es la entrada, el resto se financia con hipoteca.",
    options: [
      ...listings.map((l, i) => {
        const downPayment = Math.round((l.price * 0.2) / 500) * 500;
        return {
          id: `casa-${i}`,
          label: `${l.name} — ${l.price.toLocaleString("es")} €`,
          subtitle: `Entrada: ${downPayment.toLocaleString("es")} € · Cuota: ${monthlyPayment({ key: "", name: "", price: l.price, downPayment }).toLocaleString("es")} €/mes`,
          imageUrl: photos[i] ?? undefined,
          // Sin este flag, la compra se registraba como un simple gasto en
          // el ledger y desaparecía — "Propiedades e inversiones" en la
          // pantalla de Patrimonio llevaba vacía siempre, para cualquier
          // jugador, porque nada escribía ahí nunca.
          consequences: {
            patrimonio: -downPayment,
            moral: 5,
            flags: { [`propiedad_${Date.now()}_${i}`]: JSON.stringify({ city: cityOfClub(player.club), name: l.name, price: l.price, downPayment, photoUrl: photos[i] ?? null, since: player.week }) },
          },
        };
      }),
      {
        id: "esperar",
        label: "Esperar y seguir alquilando",
        subtitle: "Conservador",
        consequences: { patrimonio: 0 },
      },
    ],
    minWeek: 8,
  };
}

/**
 * La segunda vivienda, ya con la carrera consolidada: mismo mecanismo que
 * buildCasaEvent pero con un catálogo de lujo y foto por listado.
 */
export async function buildMansionEvent(player: Player, supabase: SupabaseClient): Promise<GameEvent> {
  const eligibleListings = withoutOwned(
    isInlandClub(player.club) ? MANSION_LISTINGS.filter((l) => !l.coastal) : MANSION_LISTINGS,
    player,
    3,
  );
  // Mismo filtro de asequibilidad que buildCasaEvent, sobre lo que ya
  // haya quedado tras el filtro de costa/interior.
  const affordable = eligibleListings.filter(
    (l) => Math.round((l.min * 0.3) / 10000) * 10000 <= player.patrimonio,
  );
  const pool =
    affordable.length >= 3
      ? affordable
      : [...eligibleListings].sort((a, b) => a.min - b.min);
  const listings = pickRandom(pool, 3).map((l) => ({
    ...l,
    price: randomPrice(l.min, l.max, 50000),
  }));
  const partner = typeof player.flags?.pareja === "string" ? player.flags.pareja : null;
  const photos = await Promise.all(listings.map((l) => getPropertyPhotoWithin(supabase, player.user_id, l.name, l.prompt)));

  return {
    id: "vid-mansion-lujo",
    category: "vida",
    title: "La casa con la que soñabas de pequeño",
    description: partner
      ? `Con la carrera en su mejor momento, tu representante os enseña tres propiedades a ti y a ${partner}. La típica casa que veías desde fuera de la verja cuando eras un chaval sin nada, y ahora te la pueden vender a ti — si los dos os ponéis de acuerdo. El precio es el de venta; lo que pagas ahora es la entrada.`
      : "Con la carrera en su mejor momento, tu representante te enseña tres propiedades. La típica casa que veías desde fuera de la verja cuando eras un chaval sin nada. Ahora te la pueden vender a ti. El precio es el de venta; lo que pagas ahora es la entrada.",
    options: [
      ...listings.map((l, i) => {
        const downPayment = Math.round((l.price * 0.3) / 10000) * 10000;
        return {
          id: `mansion-${i}`,
          label: `${l.name} — ${l.price.toLocaleString("es")} €`,
          subtitle: `Entrada: ${downPayment.toLocaleString("es")} € · Cuota: ${monthlyPayment({ key: "", name: "", price: l.price, downPayment }).toLocaleString("es")} €/mes`,
          imageUrl: photos[i] ?? undefined,
          consequences: {
            patrimonio: -downPayment,
            moral: 8,
            fama: 3,
            flags: { [`propiedad_${Date.now()}_${i}`]: JSON.stringify({ city: cityOfClub(player.club), name: l.name, price: l.price, downPayment, photoUrl: photos[i] ?? null, since: player.week }) },
          },
        };
      }),
      {
        id: "descartar",
        label: "Descartarlo, sigues prefiriendo algo discreto",
        subtitle: "Perfil bajo pese al dinero",
        consequences: { moral: 2 },
      },
    ],
    minWeek: 65,
  };
}

/**
 * Caprichos de "crack": yate y jet privado. Solo aparecen cuando el
 * jugador ya es una figura de verdad (fama y media altas) — no algo que
 * salga solo porque ha pasado el tiempo, como si acabara de debutar.
 */
export async function buildYachtEvent(player: Player, supabase: SupabaseClient): Promise<GameEvent> {
  const listings = pickAffordable(YACHT_LISTINGS, 3, "yate", player, 10000);
  const photos = await Promise.all(listings.map((l) => getPropertyPhotoWithin(supabase, player.user_id, l.name, l.prompt)));

  return {
    id: "vid-yate",
    category: "vida",
    title: "Un capricho de crack",
    description:
      "Tu nombre ya suena en cualquier lado. Un amigo del gremio te comenta que se ha comprado un barco y que 'no hay nada como desconectar en el agua'. Tu representante te manda un par de opciones, por si te apetece. Se paga una entrada y el resto se financia con cuota mensual.",
    options: [
      ...listings.map((l, i) => {
        const buy = financedPurchase("yate", l, photos[i], player.week, i, cityOfClub(player.club));
        return {
          id: `yate-${i}`,
          label: `${l.name} — ${l.price.toLocaleString("es")} €`,
          subtitle: `Entrada: ${buy.down.toLocaleString("es")} € · Cuota: ${buy.monthly.toLocaleString("es")} €/mes`,
          imageUrl: photos[i] ?? undefined,
          consequences: {
            patrimonio: -buy.down,
            moral: 6,
            fama: 2,
            flags: buy.flag,
          },
        };
      }),
      {
        id: "pasar",
        label: "Pasar, no es tu estilo",
        subtitle: "Los pies en el suelo",
        consequences: { moral: 2 },
      },
    ],
    minWeek: 30,
  };
}

export async function buildJetEvent(player: Player, supabase: SupabaseClient): Promise<GameEvent> {
  const listings = pickAffordable(JET_LISTINGS, 2, "jet", player, 100000);
  const photos = await Promise.all(listings.map((l) => getPropertyPhotoWithin(supabase, player.user_id, l.name, l.prompt)));

  return {
    id: "vid-jet-privado",
    category: "vida",
    title: "¿Vuelas por tu cuenta?",
    description:
      "Entre viajes de selección, publicidad y vacaciones, tu representante hace cuentas: 'A este ritmo, un jet privado se paga solo en comodidad. Es una pasada de dinero, pero míralo tú mismo.'",
    options: [
      ...listings.map((l, i) => {
        const buy = financedPurchase("jet", l, photos[i], player.week, i, cityOfClub(player.club));
        return {
          id: `jet-${i}`,
          label: `${l.name} — ${l.price.toLocaleString("es")} €`,
          subtitle: `Entrada: ${buy.down.toLocaleString("es")} € · Cuota: ${buy.monthly.toLocaleString("es")} €/mes`,
          imageUrl: photos[i] ?? undefined,
          consequences: {
            patrimonio: -buy.down,
            moral: 8,
            fama: 4,
            flags: buy.flag,
          },
        };
      }),
      {
        id: "pasar",
        label: "Seguir volando en primera clase, sin más",
        subtitle: "Discreción",
        consequences: { moral: 2 },
      },
    ],
    minWeek: 80,
  };
}

/**
 * El coche deportivo: el primer capricho de verdad, mucho antes que la
 * mansión o el yate — con el primer contrato serio ya hay para un
 * deportivo de segunda mano, y con la carrera consolidada para un
 * superdeportivo de coleccionista.
 */
export async function buildCarEvent(player: Player, supabase: SupabaseClient): Promise<GameEvent> {
  const listings = pickAffordable(CAR_LISTINGS, 3, "coche", player, 5000);
  const photos = await Promise.all(listings.map((l) => getPropertyPhotoWithin(supabase, player.user_id, l.name, l.prompt)));

  return {
    id: "vid-coche-deportivo",
    category: "vida",
    title: "Tu primer coche de verdad",
    description:
      "Con el sueldo ya entrando de verdad, un compañero de vestuario te comenta que se acaba de comprar un coche que 'no necesita, pero se lo merece'. Tu representante te manda un par de opciones, por si te apetece darte el capricho.",
    options: [
      ...listings.map((l, i) => {
        const buy = financedPurchase("coche", l, photos[i], player.week, i, cityOfClub(player.club));
        return {
          id: `coche-${i}`,
          label: `${l.name} — ${l.price.toLocaleString("es")} €`,
          subtitle: `Entrada: ${buy.down.toLocaleString("es")} € · Cuota: ${buy.monthly.toLocaleString("es")} €/mes`,
          imageUrl: photos[i] ?? undefined,
          consequences: {
            patrimonio: -buy.down,
            moral: 6,
            fama: 1,
            flags: buy.flag,
          },
        };
      }),
      {
        id: "pasar",
        label: "Pasar, el coche que tienes te vale",
        subtitle: "Sin prisa",
        consequences: { moral: 2 },
      },
    ],
    minWeek: 12,
  };
}

/**
 * La moto: otro capricho de los que llegan pronto. Un compañero llega a entrenar en la suya y te contagia.
 */
export async function buildMotoEvent(player: Player, supabase: SupabaseClient): Promise<GameEvent> {
  const listings = pickAffordable(MOTO_LISTINGS, 3, "moto", player, 500);
  const photos = await Promise.all(listings.map((l) => getPropertyPhotoWithin(supabase, player.user_id, l.name, l.prompt)));
  return {
    id: "vid-moto",
    category: "vida",
    title: "Una moto para escaparte",
    description:
      "Un compañero del vestuario llega a entrenar en su moto, con el casco colgando del brazo y una sonrisa de oreja a oreja: «No hay mejor forma de volver a casa después de un partido». Esa tarde, tu representante te manda tres opciones por si te pica el gusanillo. Alguna es más sensata que otra.",
    options: [
      ...listings.map((l, i) => {
        const buy = financedPurchase("moto", l, photos[i], player.week, i, cityOfClub(player.club));
        return {
          id: `moto-${i}`,
          label: `${l.name} — ${l.price.toLocaleString("es")} €`,
          subtitle: `Entrada: ${buy.down.toLocaleString("es")} € · Cuota: ${buy.monthly.toLocaleString("es")} €/mes`,
          imageUrl: photos[i] ?? undefined,
          consequences: { patrimonio: -buy.down, moral: 6, fama: 1, flags: buy.flag },
        };
      }),
      {
        id: "pasar",
        label: "Pasar: el coche te basta",
        subtitle: "Sin prisa",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 14,
  };
}

/**
 * La oferta de Arabia Saudí, en la recta final de la carrera: si el
 * jugador tiene pareja, la decisión se habla con ella antes de nada
 * (igual que la partida original que inspiró Beyond 90), no se decide en
 * solitario.
 */
export function buildOfertaArabiaEvent(player: Player): GameEvent {
  const partner = typeof player.flags?.pareja === "string" ? player.flags.pareja : null;
  const tieneHijos = Boolean(player.flags?.hijos);

  const description = partner
    ? `Un club de la liga saudí pone sobre la mesa una cifra que no se parece a nada de lo que has visto en Europa. Antes de responder nada, te sientas a hablarlo con ${partner}${tieneHijos ? ", con los niños ya en la ecuación" : ""}: significa dejar la élite competitiva en su momento más alto, cambiar de país y empezar de cero fuera del campo también.`
    : "Un club de la liga saudí pone sobre la mesa una cifra que no se parece a nada de lo que has visto en Europa. Tu representante te avisa: esto no se va a repetir, pero también significa dejar la élite competitiva en su momento más alto.";

  const options: GameEvent["options"] = partner
    ? [
        {
          id: "a",
          label: `Aceptar, con ${partner} de acuerdo en dar el salto juntos`,
          subtitle: "+Patrimonio enorme, sales de la élite competitiva",
          consequences: {
            club: "Al-Nassr FC",
            patrimonio: 900000,
            fama: 4,
            moral: 8,
            rel_aficion: -10,
          },
        },
        {
          id: "b",
          label: `Aceptar aunque a ${partner} le cueste dejar atrás su vida aquí`,
          subtitle: "+Patrimonio enorme, tensión en casa",
          consequences: {
            club: "Al-Nassr FC",
            patrimonio: 900000,
            fama: 4,
            moral: -4,
            rel_aficion: -10,
          },
        },
        {
          id: "c",
          label: "Rechazarla: la vida que tenéis construida pesa más",
          subtitle: "Prioridad: la familia y el legado deportivo, no el dinero",
          consequences: { reputacion: 10, moral: 5 },
        },
      ]
    : [
        {
          id: "a",
          label: "Aceptar, es el contrato de tu vida",
          subtitle: "+Patrimonio enorme, sales de la élite competitiva",
          consequences: {
            club: "Al-Nassr FC",
            patrimonio: 900000,
            fama: 4,
            moral: 6,
            rel_aficion: -10,
          },
        },
        {
          id: "b",
          label: "Rechazarla y seguir compitiendo en Europa",
          subtitle: "Prioridad: el legado deportivo, no el dinero",
          consequences: { reputacion: 10, moral: 3 },
        },
      ];

  return {
    id: "fork-oferta-arabia",
    category: "representante",
    priority: true,
    title: partner ? `Hablarlo con ${partner} antes de decidir` : "La oferta que cambia los números para siempre",
    description,
    milestoneType: "contrato",
    allowFreeText: true,
    freeTextPrompt: partner ? `¿Qué le dices a ${partner} para convencerla o para dejarlo pasar?` : "¿Qué es lo primero que piensas al leer la cifra?",
    imageScene:
      "Photorealistic photo of the photographed man in a tailored suit shaking hands with club executives in a luxurious modern office, Middle Eastern architecture visible through large windows, official signing photo style",
    options,
    minWeek: 155,
    minMedia: 60,
  };
}

/**
 * Secuencia de pretemporada, garantizada y encadenada, justo después de la
 * firma del primer contrato ("contrato-debut-*"): entrenamiento con los
 * mayores → lesión con el fisio → mensaje de una ex del instituto. Después
 * de esto la carrera cae en el pool normal.
 */
/** Variantes de cómo arranca el primer entrenamiento, para que no sea siempre la misma escena. */
const DEBUT_PRETEMP1_INTROS = (club: string) => [
  `Llegas a la ciudad deportiva del ${club} antes del amanecer, con las manos sudando. Los veteranos ya están estirando cuando entras al vestuario — nadie te mira dos veces todavía. El primer rondo te deja sin aire: esto no se parece en nada a lo que jugabas hace un mes.`,
  `Llegas tarde a tu primer día en la ciudad deportiva del ${club} por los nervios de la noche anterior. El vestuario ya está casi lleno; un veterano te lanza una camiseta de entrenamiento sin decir nada. En el primer sprint te dejan atrás como si corrieras con las piernas de otro.`,
  `El entrenador te presenta al grupo por tu nombre completo delante de toda la plantilla del ${club}. Se hace un silencio incómodo de dos segundos antes de que alguien diga "bienvenido" sin mucha convicción. El primer ejercicio de posesión te hace parecer un niño perdido entre profesionales.`,
];

export function buildDebutPretemp1(club: string): GameEvent {
  const intros = DEBUT_PRETEMP1_INTROS(club);
  const description = intros[Math.floor(Math.random() * intros.length)];

  return {
    id: "debut-pretemp-1",
    category: "entrenamiento",
    title: "Primer entrenamiento con los mayores",
    description,
    options: [
      {
        id: "a",
        label: "Meterte de lleno aunque no puedas seguirles el ritmo",
        subtitle: "+Forma, te ganas una primera mirada",
        consequences: { forma: 6, rel_vestuario: 3, moral: 3 },
      },
      {
        id: "b",
        label: "Ir con cabeza, observar antes de forzar",
        subtitle: "+Relación con el entrenador",
        consequences: { rel_entrenador: 5, forma: 2 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "El primer veterano que te dirige la palabra te pregunta de dónde sales. ¿Qué le dices?",
  };
}

/** Variantes de la primera lesión leve de pretemporada, para que no sea siempre la misma escena. */
const DEBUT_PRETEMP2_VARIANTS = [
  {
    title: "El fisio del club se presenta",
    description:
      'En un ejercicio de cambios de ritmo sientes un pinchazo seco en el isquiotibial. Marta Solís, la fisioterapeuta del primer equipo, te hace tumbarte en la camilla y te palpa la zona sin prisa. "Bienvenido. Vamos a conocernos bien tú y yo este año — mejor que sea lo menos posible, pero para eso tienes que hacerme caso", te dice con media sonrisa. No es grave, pero te frena unos días.',
  },
  {
    title: "Un tobillo hinchado el segundo día",
    description:
      'Un mal apoyo en un ejercicio de velocidad y el tobillo se te hincha en minutos. El fisio del club, Javier Ruano, te lo venda sin dramatizar: "Esto es del pack de bienvenida, a todos os pasa. Dame unos días y estás como nuevo." No es grave, pero te frena unos días.',
  },
  {
    title: "La sobrecarga que nadie te avisó",
    description:
      'Llevas dos días exigiéndote al máximo para causar buena impresión, y el cuerpo pasa factura: una sobrecarga muscular te obliga a parar en pleno rondo. El preparador físico te mira con media sonrisa cansada: "Novato que se mata a entrenar la primera semana. Clásico. Vamos a frenar antes de que sea peor."',
  },
];

export function buildDebutPretemp2(): GameEvent {
  const variant =
    DEBUT_PRETEMP2_VARIANTS[Math.floor(Math.random() * DEBUT_PRETEMP2_VARIANTS.length)];

  return {
    id: "debut-pretemp-2",
    category: "entrenamiento",
    title: variant.title,
    description: variant.description,
    options: [
      {
        id: "a",
        label: "Seguir su plan de recuperación al pie de la letra",
        subtitle: "Más lento, pero seguro",
        consequences: { moral: 4, rel_entrenador: 2 },
      },
      {
        id: "b",
        label: "Pedirle que te deje volver antes de tiempo",
        subtitle: "Quieres no perderte nada de la pretemporada",
        consequences: {},
        resolve: {
          baseChance: 0.4,
          statModifier: "forma",
          success: {
            text: "Marta cede y te deja volver antes. Aguantas bien y no pasa nada — esta vez.",
            consequences: { forma: 4, moral: 5 },
          },
          fail: {
            text: "Vuelves demasiado pronto y la molestia regresa, peor que antes. Marta no dice \"te lo dije\", pero se le nota.",
            consequences: { forma: -10, moral: -4 },
          },
        },
      },
    ],
    minWeek: 2,
  };
}

/** Variantes de quién te escribe tras el fichaje, para que no sea siempre la misma persona. */
const DEBUT_PRETEMP3_VARIANTS = [
  {
    who: "Carla",
    title: "Un mensaje del instituto",
    description:
      'Entre entrenamientos te llega un mensaje que no esperabas: Carla, con quien saliste un tiempo en el instituto y con la que no hablas desde hace más de un año. "Te vi en el periódico de la ciudad, fichaste por el equipo de aquí. Me alegro muchísimo por ti, en serio." Vuelves a leerlo dos veces.',
  },
  {
    who: "Diego",
    title: "Tu mejor amigo de la infancia",
    description:
      'Diego, con quien creciste jugando en la calle antes de que él dejara el fútbol, te escribe nada más verte en las redes del club: "No me lo puedo creer, tío. En serio, no me lo puedo creer. Te lo has ganado." Hace meses que no hablabais.',
  },
  {
    who: "tu antiguo entrenador",
    title: "Un antiguo entrenador de la cantera",
    description:
      'El primer entrenador que te dio minutos de verdad, cuando nadie más confiaba en ti, te manda un audio de casi dos minutos. Se le entrecorta la voz al final: "Ya sabía yo que ibas a llegar. Que no se te olvide de dónde vienes."',
  },
];

export function buildDebutPretemp3(): GameEvent {
  const variant =
    DEBUT_PRETEMP3_VARIANTS[Math.floor(Math.random() * DEBUT_PRETEMP3_VARIANTS.length)];

  return {
    id: "debut-pretemp-3",
    category: "vida",
    title: variant.title,
    description: variant.description,
    options: [
      {
        id: "a",
        label: "Responderle con cariño y ponerte al día",
        subtitle: "+Moral",
        consequences: { moral: 6 },
      },
      {
        id: "b",
        label: "Responder cordial y dejarlo ahí",
        subtitle: "Página pasada",
        consequences: { moral: 2 },
      },
      {
        id: "c",
        label: "No responder todavía",
        subtitle: "Necesitas pensarlo",
        consequences: { moral: -1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: `¿Qué le respondes a ${variant.who}?`,
    minWeek: 3,
  };
}

export const EVENTS: GameEvent[] = [...EVENTS_1, ...EVENTS_2, ...EVENTS_3, ...EVENTS_4, ...EVENTS_5, ...EVENTS_6];

/* ─────────────── Mudanza a la ciudad de un club nuevo: vivienda y coche ─────────────── */

export { cityOfClub };

/** Cómo es cada ciudad (arquitectura y ambiente): las casas y los coches de cada mudanza salen con su sello, no iguales en todas. */
const CITY_STYLE: Record<string, string> = {
  Madrid: "classic brick and stone buildings with wrought-iron balconies, tree-lined avenues, warm dry sunlight",
  Barcelona: "Modernista buildings with decorative facades, Mediterranean light, palm trees and narrow shaded streets",
  Sevilla: "whitewashed Andalusian buildings with orange trees, tiled patios and bright southern light",
  Valencia: "modern Mediterranean architecture beside gardens and the sea, bright coastal light",
  Bilbao: "grey-green northern city with iron bridges, steel-and-glass modern buildings and soft overcast light",
  Villarreal: "small sunny Mediterranean town with low whitewashed houses and orange groves",
  Girona: "medieval stone old town with colourful riverside houses and Catalan light",
  Vigo: "granite houses and glass galleries above a Galician estuary, soft Atlantic light",
  Málaga: "bright white buildings, palm trees and the Mediterranean in the background",
  Londres: "Victorian red-brick terraces, sash windows, grey London sky with soft daylight",
  Liverpool: "red-brick Victorian terraces and converted docklands warehouses near the Mersey, overcast northern light",
  Mánchester: "red-brick converted mills, modern glass towers and a rainy-bright northern city mood",
  Newcastle: "stone Georgian buildings above a river with iron bridges, crisp northern light",
  Birmingham: "red-brick canalside warehouses converted into lofts, modern towers in the background",
  Múnich: "tidy Bavarian apartment buildings with wooden balconies, clean modern architecture and alpine light",
  Dortmund: "red-brick industrial heritage buildings and green residential districts, honest working-city light",
  Leverkusen: "quiet modern residential area beside a river, orderly German architecture",
  Leipzig: "restored art-nouveau townhouses and modern lofts, soft central-European light",
  Fráncfort: "glass skyscrapers next to rebuilt old-town houses and a riverside, crisp light",
  París: "cream Haussmann stone buildings with wrought-iron balconies and mansard roofs, soft Paris light",
  Marsella: "bright Mediterranean port city buildings, pale stone and shutters, strong southern sun",
  Mónaco: "luxury coastal towers on a hillside above a harbour with yachts, Riviera light",
  Lyon: "ochre and terracotta buildings along two rivers, Renaissance old town",
  Lille: "Flemish-style red-brick facades with ornate gables, northern French light",
  Turín: "elegant arcaded 19th-century apartment buildings, wide boulevards, the Alps in the background",
  Milán: "refined Italian apartment buildings with inner courtyards and sleek design touches, soft grey-gold light",
  Roma: "ochre and terracotta Roman palazzi, ivy-covered courtyards, golden light",
  Nápoles: "colourful crowded Neapolitan buildings with laundry balconies and a view of the bay",
  Bérgamo: "stone hill town with medieval walls and elegant residential streets",
  Florencia: "Renaissance stone buildings with terracotta roofs and a Tuscan hills backdrop",
  Riad: "modern desert-city towers and sand-coloured luxury villas with large glazed fronts, bright harsh sun",
  Lisboa: "pastel tiled facades on steep hills with the river in the background",
  Ámsterdam: "narrow gabled canal houses with big windows and bicycles",
};

const cityFlavor = (city: string): string => CITY_STYLE[city] ?? `typical architecture of ${city}`;

/** Una propiedad del catálogo «vista» en esta ciudad: otro nombre y otra foto que la del mismo listado en otro sitio. */
export function localizeListing<T extends { name: string; prompt: string }>(l: T, city: string): T {
  return { ...l, name: `${l.name} (${city})`, prompt: `${l.prompt}, set in ${city}: ${cityFlavor(city)}` };
}

/** El nombre del listado sin la ciudad: «Coupé deportivo alemán (Madrid)» → «Coupé deportivo alemán». */
export function baseListingName(name: string): string {
  const i = name.lastIndexOf(" (");
  return i > 0 && name.endsWith(")") ? name.slice(0, i) : name;
}

function seedHash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  return h >>> 0;
}

/** Elige n del catálogo de forma estable para esa semilla (jugador + ciudad): cada ciudad enseña otras opciones. */
function pickSeeded<T extends { name: string }>(items: T[], n: number, seed: string): T[] {
  return [...items].sort((a, b) => seedHash(`${seed}:${a.name}`) - seedHash(`${seed}:${b.name}`)).slice(0, n);
}

/** Identificador estable por club para las escenas de mudanza (una vivienda y un coche por cada club nuevo). */
export function cityMoveIds(club: string): { casa: string; coche: string } {
  const slug = club.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return { casa: `vid-vivienda-${slug}`, coche: `vid-coche-${slug}` };
}

const round50 = (n: number) => Math.round(n / 50) * 50;

/**
 * Has fichado por un club de otra ciudad: toca decidir dónde vivir. Alquilar (un piso normal o un ático de lujo,
 * con fianza y una cuota que sale cada mes), comprar (financiado, como siempre) o quedarte en el hotel del club un
 * tiempo. Las cuotas escalan con tu sueldo neto: un chaval no puede con un ático; una estrella, sí.
 */
export async function buildCityHousingEvent(player: Player, supabase: SupabaseClient): Promise<GameEvent> {
  const city = cityOfClub(player.club);
  const abroad = leagueOf(player.club).id !== "es";
  const net = playerMonthlyNet(player);
  const flat = Math.min(9000, Math.max(600, round50(net * 0.1)));
  const lux = Math.min(26000, Math.max(flat + 700, round50(net * 0.22)));
  const rentFlag = (name: string, monthly: number) => JSON.stringify({ name, monthly, city, since: player.week });

  // Compra: una vivienda de lujo si la cuenta lo permite (solo en una ciudad de costa o interior que encaje), o una normal.
  const rich = player.patrimonio >= getMinMansionDownPayment();
  const pool = withoutOwned(
    rich
      ? MANSION_LISTINGS.filter((l) => !isInlandClub(player.club) || !l.coastal)
      : HOME_LISTINGS.filter((l) => Math.round((l.min * 0.2) / 500) * 500 <= player.patrimonio),
    player,
  );
  // Cada ciudad enseña SU casa (otro listado, otro nombre y otra foto que en las demás ciudades).
  const buyBase = pool.length > 0 ? pickSeeded(pool, 1, `${player.id}:${city}:casa`)[0] : null;
  const buyList = buyBase ? localizeListing(buyBase, city) : null;
  const buyPrice = buyList ? randomPrice(buyList.min, buyList.max, rich ? 50000 : 5000) : 0;
  const buyDown = Math.round((buyPrice * (rich ? 0.3 : 0.2)) / 500) * 500;
  const photo = buyList ? await getPropertyPhotoWithin(supabase, player.user_id, buyList.name, buyList.prompt) : null;

  const intro = abroad
    ? `Has aterrizado en ${city} con dos maletas y un idioma que no es el tuyo. El club te ha pagado el hotel unos días, pero no puedes vivir en el hotel para siempre. Tu representante lo resume: "O decides ahora, o decide la agencia de relocation por ti, y te aseguro que no te va a gustar".`
    : `Has fichado por un club de ${city} y toca decidir dónde vivir. Tu representante lo ve claro: "Cuanto antes te instales, antes te rinde la cabeza".`;

  return {
    id: cityMoveIds(player.club).casa,
    category: "vida",
    title: `Dónde vivir en ${city}`,
    description: intro,
    options: [
      {
        id: "alquiler-piso",
        label: `Alquilar un piso cerca del campo de entrenamiento — ${flat.toLocaleString("es")} €/mes`,
        subtitle: `Fianza de ${(flat * 2).toLocaleString("es")} € · cómodo y sin ataduras`,
        consequences: { patrimonio: -flat * 2, moral: 4, flags: { alquiler: rentFlag(`Piso en ${city}`, flat) } },
        outcomeText: `Firmas un contrato de alquiler de un piso luminoso a diez minutos del campo. El casero te pide un autógrafo para su sobrino antes de darte las llaves.`,
      },
      {
        id: "alquiler-atico",
        label: `Alquilar un ático de lujo en el centro — ${lux.toLocaleString("es")} €/mes`,
        subtitle: `Fianza de ${(lux * 2).toLocaleString("es")} € · terraza, portero y vistas`,
        consequences: { patrimonio: -lux * 2, moral: 7, fama: 2, flags: { alquiler: rentFlag(`Ático de lujo en ${city}`, lux) } },
        outcomeText: `El ático tiene terraza, portero y una vista de la ciudad que te hace olvidar el cansancio. Cada mes, eso sí, la cuota se nota en la cuenta.`,
      },
      ...(buyList
        ? [
            {
              id: "comprar",
              label: `Comprar: ${buyList.name} — ${buyPrice.toLocaleString("es")} €`,
              subtitle: `Entrada: ${buyDown.toLocaleString("es")} € · Cuota: ${monthlyPayment({ key: "", name: "", price: buyPrice, downPayment: buyDown }).toLocaleString("es")} €/mes`,
              imageUrl: photo ?? undefined,
              consequences: {
                patrimonio: -buyDown,
                moral: 8,
                flags: { [`propiedad_${Date.now()}_c`]: JSON.stringify({ city: cityOfClub(player.club), name: buyList.name, price: buyPrice, downPayment: buyDown, photoUrl: photo ?? null, since: player.week }) },
              },
              outcomeText: `Firmas ante notario con el estómago encogido y una sonrisa enorme. Por primera vez en ${city}, algo es tuyo.`,
            },
          ]
        : []),
      {
        id: "hotel",
        label: "Quedarte en el hotel del club unas semanas más",
        subtitle: "Sin gastos, sin sensación de hogar",
        consequences: { moral: -2, flags: {} },
        outcomeText: "Te quedas en la habitación del hotel, con el desayuno incluido y la maleta a medio deshacer. A las tres semanas, las paredes empiezan a parecerte conocidas.",
      },
    ],
    minWeek: 8,
  };
}

/** Un coche para moverte por la ciudad nueva (financiado, como el resto de compras). */
export async function buildCityCarEvent(player: Player, supabase: SupabaseClient): Promise<GameEvent> {
  const city = cityOfClub(player.club);
  const abroad = leagueOf(player.club).id !== "es";
  // Los coches de cada ciudad son otros (y con su ambiente): no se repiten los del club anterior.
  const listings = pickAffordable(CAR_LISTINGS, 3, "coche", player, 5000, `${player.id}:${city}:coche`).map((l) => localizeListing(l, city));
  const photos = await Promise.all(listings.map((l) => getPropertyPhotoWithin(supabase, player.user_id, l.name, l.prompt)));
  return {
    id: cityMoveIds(player.club).coche,
    category: "vida",
    title: `Un coche para moverte por ${city}`,
    description: abroad
      ? `En ${city} las distancias son otras y el transporte público habla un idioma que aún no dominas. Un compañero te habla de un concesionario donde atienden a jugadores del club y te lo dejan listo en dos días.`
      : `Con la mudanza a ${city}, tu coche de siempre se te queda corto. Un compañero te pasa el contacto de un concesionario donde ya conocen al club.`,
    options: [
      ...listings.map((l, i) => {
        const buy = financedPurchase("coche", l, photos[i], player.week, i, cityOfClub(player.club));
        return {
          id: `coche-${i}`,
          label: `${l.name} — ${l.price.toLocaleString("es")} €`,
          subtitle: `Entrada: ${buy.down.toLocaleString("es")} € · Cuota: ${buy.monthly.toLocaleString("es")} €/mes`,
          imageUrl: photos[i] ?? undefined,
          consequences: { patrimonio: -buy.down, moral: 6, fama: 1, flags: buy.flag },
        };
      }),
      {
        id: "pasar",
        label: "Pasar: te mueves en taxi y en el coche del club",
        subtitle: "Sin prisa",
        consequences: { moral: 1 },
      },
    ],
    minWeek: 8,
  };
}
