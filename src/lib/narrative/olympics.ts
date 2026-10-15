/**
 * LOS JUEGOS OLÍMPICOS. El torneo de fútbol masculino es de selecciones SUB-23 con hasta TRES jugadores mayores por equipo
 * («overage»): con 23 años o menos puedes ir si rindes; con más, solo si eres de los tres elegidos por tu seleccionador. Se
 * juegan cada cuatro años en verano (2028 en Los Ángeles, 2032 en Brisbane…), justo después de la Eurocopa o el Mundial, así
 * que un joven con nivel puede jugar los dos. Aquí viven las sedes, quién puede ir, el aviso del año anterior, la
 * convocatoria y la llegada a la villa olímpica. El torneo en sí (grupos, cuartos, semifinal y final) lo juega torneo.ts.
 */
import type { GameEvent } from "@/types/career";
import { playerAge } from "@/types/career";
import type { Player } from "@/types/player";
import { displayName } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";

export interface OlympicHost {
  city: string;
  country: string;
  /** Una pincelada de la ciudad para la escena. */
  flavor: string;
}

/** Sedes conocidas; para el resto se dice que aún está por decidir. */
const HOSTS: Record<number, OlympicHost> = {
  2028: { city: "Los Ángeles", country: "Estados Unidos", flavor: "con el sol de California, estadios enormes y una villa a cinco minutos del océano" },
  2032: { city: "Brisbane", country: "Australia", flavor: "con las tardes cálidas del invierno austral, estadios llenos y una ciudad que vive el deporte en la calle" },
};

export const isOlympicYear = (season: number): boolean => (2026 + season) % 4 === 0;

export function olympicHost(season: number): OlympicHost {
  return HOSTS[2026 + season] ?? { city: "la ciudad anfitriona", country: "sede por confirmar", flavor: "una sede que el Comité Olímpico ya tiene decidida y que se anunciará a su debido tiempo" };
}

/** «Juegos Olímpicos de Los Ángeles 2028» (o sin ciudad si todavía no se conoce). */
export function olympicLabel(season: number): string {
  const host = HOSTS[2026 + season];
  return host ? `Juegos Olímpicos de ${host.city} ${2026 + season}` : `Juegos Olímpicos ${2026 + season}`;
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

export type OlympicRole = "sub23" | "overage";

/** Edad que tendrás durante los Juegos de esa temporada (los torneos de verano abren la temporada). */
const ageAtSeason = (season: number) => 16 + season;

/**
 * ¿Puedes ir a esos Juegos? Con 23 años o menos, si tu nivel da para el equipo. Con más, solo si eres uno de los tres mayores
 * del equipo: hace falta ser de los mejores (media y fama altas) y que el seleccionador te elija (estable para tu carrera y ese año).
 */
export function olympicRole(player: Pick<Player, "id" | "media" | "fama">, season: number): OlympicRole | null {
  const age = ageAtSeason(season);
  const media = player.media ?? 0;
  if (age <= 23) return media >= 60 ? "sub23" : null;
  if (media >= 84 && (player.fama ?? 0) >= 55 && hash(`${player.id}:jjoo:${season}`) % 100 < 35) return "overage";
  return null;
}

/** El año anterior (turnos 7-9) llega el aviso de los Juegos del verano que viene. */
export function shouldTriggerOlympicPreview(player: Player, usedEventIds: readonly string[]): boolean {
  if (player.club === NO_CLUB_YET || player.status !== "active" || player.club.startsWith("SELECCIÓN:")) return false;
  const season = Math.floor((player.week - 1) / 10);
  const turn = ((player.week - 1) % 10) + 1;
  if (turn < 7 || turn > 9 || !isOlympicYear(season + 1)) return false;
  if (usedEventIds.includes(`jjoo-aviso-${season + 1}`)) return false;
  return olympicRole(player, season + 1) !== null;
}

export function buildOlympicPreviewEvent(player: Player): GameEvent {
  const season = Math.floor((player.week - 1) / 10) + 1;
  const host = olympicHost(season);
  const role = olympicRole(player, season) as OlympicRole;
  const year = 2026 + season;
  const nation = player.nation;
  const rule = "El torneo de fútbol olímpico es de selecciones sub-23, con un máximo de tres jugadores mayores por equipo, y los clubes no tienen obligación de ceder a nadie.";
  const where = host.country === "sede por confirmar" ? "en una sede que todavía se está confirmando" : `en ${host.city} (${host.country}), ${host.flavor}`;
  const id = `jjoo-aviso-${season}`;
  if (role === "overage") {
    return {
      id,
      category: "especial",
      title: `Los Juegos de ${year}: te quieren como uno de los tres mayores`,
      description: `El seleccionador de ${nation} te llama por teléfono. Los Juegos Olímpicos de ${year} se disputan ${where}. ${rule} «Necesito tres jugadores mayores que lleven al grupo de chavales, y tú eres el primero de mi lista». Dice que sería un verano más sin descanso: Juegos justo después del torneo de selecciones, y la pretemporada, a medias.`,
      options: [
        { id: "a", label: "Decir que sí sin dudarlo", subtitle: "Un sueño, aunque cueste el descanso", consequences: { moral: 6, fama: 2, rel_entrenador: -2, flags: { olimpico_aviso: String(year), olimpico_si: true } }, outcomeText: "Dices que sí antes de que acabe la frase. Tu club, al enterarse, pone cara de «lo hablaremos», pero nadie se atreve a negarle unos Juegos a un jugador de tu nivel." },
        { id: "b", label: "Pedir tiempo y hablarlo con tu club", subtitle: "Valorar el desgaste", consequences: { moral: 1, rel_entrenador: 2, flags: { olimpico_aviso: String(year) } }, outcomeText: "Pides unas semanas. El club agradece la consulta, pero te deja claro que no es una decisión suya: «Si te llaman, es un honor». Lo vas a pensar con calma, aunque ya sabes cómo acabará." },
        { id: "c", label: "Declinar para descansar en verano", subtitle: "Cuidar el cuerpo", consequences: { forma: 2, moral: -2, rel_aficion: -1, flags: { olimpico_aviso: String(year), olimpico_no: true } }, outcomeText: "Le explicas que el cuerpo pide descanso. El seleccionador entiende, o lo disimula bien. Alguien filtra la noticia y en las tertulias hay opiniones para todos los gustos." },
      ],
    };
  }
  return {
    id,
    category: "especial",
    title: `Los Juegos Olímpicos de ${year}: tu edad, tu oportunidad`,
    description: `Se acercan los Juegos Olímpicos de ${year}, que se disputan ${where}. ${rule} Tienes la edad justa y el nivel para que ${nation} piense en ti. Tu representante lo resume con una sonrisa: «Es un torneo que no se repite, y a tu edad solo te dejan jugarlo una o dos veces».`,
    options: [
      { id: "a", label: "Dejar claro que quieres ir", subtitle: "Un sueño de chaval", consequences: { moral: 5, fama: 1, rel_entrenador: -1, flags: { olimpico_aviso: String(year), olimpico_si: true } }, outcomeText: "Lo dices en una entrevista, con la cara de quien lleva toda la vida esperando. El seleccionador de la sub-23 lo lee y te escribe un mensaje: «Entendido»." },
      { id: "b", label: "Esperar a ver si te llaman", subtitle: "Sin presionar", consequences: { moral: 1, reputacion: 1, flags: { olimpico_aviso: String(year) } }, outcomeText: "No dices nada. Si llega la llamada, llegará. Mientras, entrenas con la cabeza puesta en el club." },
      { id: "c", label: "Pedirle a tu club que te cuide para llegar fresco", subtitle: "Pensar en la carga de partidos", consequences: { forma: 2, rel_entrenador: 2, moral: 0, flags: { olimpico_aviso: String(year) } }, outcomeText: "El míster te lo agradece y te reduce los minutos en un par de partidos. Los Juegos, de momento, se quedan en una promesa para el verano." },
    ],
  };
}

export function buildOlympicCallUp(player: Player, season: number): GameEvent {
  const host = olympicHost(season);
  const year = 2026 + season;
  const role = olympicRole(player, season);
  const flagKey = `conv_olimpico_${season}`;
  const label = olympicLabel(season);
  const name = displayName(player);
  const as = role === "overage" ? "uno de los tres jugadores mayores de la lista" : "uno de los 18 de la lista sub-23";
  const city = host.country === "sede por confirmar" ? "la sede olímpica" : host.city;
  return {
    id: `sel-convocatoria-olimpico-s${season}`,
    category: "especial",
    title: `Convocado para los ${label}`,
    description: `El seleccionador de ${player.nation} anuncia la lista olímpica: dieciocho nombres, de los cuales tres pueden pasar de los 23 años. Cuando llega a tu nombre, ${as}, notas que se te seca la garganta. Se jugará en ${city}${host.country !== "sede por confirmar" ? ` (${host.country})` : ""}, y ${name} va a estar allí.`,
    options: [
      { id: "a", label: "Celebrarlo con tu familia por videollamada", subtitle: "Compartirlo con los tuyos", consequences: { moral: 10, fama: 3, rel_aficion: 3, flags: { [flagKey]: true } }, outcomeText: "Tu madre llora, tu padre repite «a los Juegos» una y otra vez, como si fuera una frase en un idioma nuevo. Tu hermano pequeño te pide que le traigas «una medalla, aunque sea de chocolate»." },
      { id: "b", label: "Dar la noticia al vestuario de tu club", subtitle: "Entre risas y abrazos", consequences: { moral: 9, rel_vestuario: 4, flags: { [flagKey]: true } }, outcomeText: "El míster te lo comunica en el rondo. Tus compañeros te levantan en volandas y alguien grita «¡el olímpico!». Los que se quedan sin Juegos te dan palmadas de verdad." },
      { id: "c", label: "Enviar un mensaje a tu entrenador de la cantera", subtitle: "Un agradecimiento", consequences: { moral: 9, reputacion: 3, rel_aficion: 2, flags: { [flagKey]: true } }, outcomeText: "Le escribes tres líneas desde el aeropuerto. Contesta con una foto vuestra de hace diez años, con el escudo del barrio. «Ya sabía yo que llegabas». No hay más que decir." },
    ],
    isMilestone: true,
    milestoneType: "seleccion",
    imageScene: `Photorealistic photo of a young footballer reading an Olympic squad announcement on a phone, surrounded by family hugging him, joyful tears, warm living room light, Olympic rings visible only as abstract coloured circles on a small flag, no logos or readable text`,
  };
}

export function buildOlympicArrival(player: Player, season: number): GameEvent {
  const host = olympicHost(season);
  const year = 2026 + season;
  const label = olympicLabel(season);
  const city = host.country === "sede por confirmar" ? "la sede olímpica" : host.city;
  return {
    id: `sel-olimpico-s${season}`,
    category: "especial",
    title: `Llegas a la villa olímpica de ${city}`,
    description: `Aterrizas en ${city} con el mismo equipaje que usabas de niño para las excursiones del colegio. La villa olímpica es una ciudad dentro de otra: habitaciones compartidas, comedores del tamaño de un estadio, atletas de todos los deportes cruzándose en los pasillos con la acreditación al cuello. Los ${label} no son un torneo de fútbol más: son los Juegos. Tu selección sub-23 te recibe con una bandera y un cartel enorme: «Bienvenido».`,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices a la prensa en tu primera rueda de prensa olímpica?",
    options: [
      { id: "a", label: "Salir a por la medalla desde el primer partido", subtitle: "Sin especular", consequences: { fama: 2, moral: 2, flags: { torneo_activo: "olimpico", torneo_style: "riesgo" } }, outcomeText: `Lo dices ante las cámaras de ${year}: no estás aquí para pasear. Los titulares de la mañana son tuyos.` },
      { id: "b", label: "Disfrutar del momento y jugar con cabeza", subtitle: "Un sueño que se vive una vez", consequences: { moral: 3, reputacion: 2, flags: { torneo_activo: "olimpico", torneo_style: "cabeza" } }, outcomeText: "Hablas de la villa, de los otros deportistas y de lo pequeño que se siente uno entre tanta gente excepcional. La rueda de prensa se queda en una conversación agradable. El seleccionador asiente." },
      { id: "c", label: "Asumir el papel de mayor del grupo", subtitle: "Cuidar a los chavales", consequences: { rel_vestuario: 3, moral: 2, flags: { torneo_activo: "olimpico", torneo_style: "lider" } }, outcomeText: "Hablas de los más jóvenes antes que de ti. En el comedor, esa misma noche, alguien te pide consejo y otro se sienta a tu lado sin decir nada. El grupo ya es un grupo." },
    ],
    isMilestone: true,
    milestoneType: "seleccion",
    imageScene: `Photorealistic photo of a young footballer in a national team tracksuit standing in front of a huge Olympic village building, athletes from many countries walking past, bright daylight, no readable text or logos`,
  };
}
