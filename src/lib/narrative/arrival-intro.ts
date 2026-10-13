/**
 * LA PRESENTACIÓN EN EL CLUB NUEVO. Al fichar por otro club, lo primero que ocurre es conocer a la gente que manda en
 * tu nuevo día a día: el entrenador, el capitán y alguien del cuerpo técnico. Es siempre la primera escena en el club
 * nuevo (antes que cualquier escena suelta) y trae las fichas de los tres personajes, que a partir de ahí ya se conocen.
 * Todo en código: cero llamadas a la IA.
 */
import type { EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getNpcName } from "@/lib/narrative/npcs";
import { cityOfClub } from "@/lib/narrative/events";
import { isReturningTo, pastStint } from "@/lib/narrative/ex-clubs";
import { trofeoLabel } from "@/lib/honours";

const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;

/** Cuántos turnos como máximo después de llegar sigue valiendo la presentación. */
const WINDOW = 3;

export function shouldTriggerArrivalIntro(player: Player): boolean {
  const f = player.flags ?? {};
  if (player.status !== "active" || !player.club || player.club === NO_CLUB_YET || player.club.startsWith("SELECCIÓN:")) return false;
  const since = num(f.club_since);
  if (since <= 0) return false;
  // Solo si vienes de otro club: el primer club de la carrera tiene su propio arranque (ver ai.ts, debut-pretemp).
  if (!String(f.clubs_history ?? "").split("|").some(Boolean)) return false;
  if (num(f.arrival_intro) === since) return false; // ya hecha para este fichaje
  const elapsed = player.week - since;
  return elapsed >= 0 && elapsed <= WINDOW;
}

/** Volver a un club en el que ya jugaste: el juego te recuerda, y la gente de allí también. */
function buildReturnIntroEvent(player: Player): GameEvent {
  const club = player.club;
  const since = num(player.flags?.club_since);
  const city = cityOfClub(club);
  const mister = getNpcName(player, "entrenador");
  const capitan = getNpcName(player, "capitan");
  const preparador = getNpcName(player, "preparador");
  const done = { arrival_intro: String(since) };
  const corto = (full: string) => full.split(" ")[0];
  const stint = pastStint(player);
  const years = stint.seasons;
  const labels = [...new Set(stint.titles.map((t) => trofeoLabel(t)))];
  const stintLine =
    years > 0
      ? `Estuviste aquí ${years} ${years === 1 ? "temporada" : "temporadas"}${labels.length > 0 ? ` y dejaste ${stint.titles.length === 1 ? "un título" : `${stint.titles.length} títulos`} (${labels.join(", ")})` : ""}.`
      : `Ya pasaste por aquí una vez${labels.length > 0 ? ` y dejaste algún título (${labels.join(", ")})` : ""}.`;
  const tie = stint.tie;
  const misterLine =
    tie && tie.re >= 70
      ? `${mister}, que no ha olvidado lo bien que os llevabais, te abraza antes de que cruces la puerta: «Sabía que volverías».`
      : tie && tie.re < 35
        ? `${mister} te da un apretón de manos correcto y sin más. Las cosas no acabaron del todo bien y los dos lo saben.`
        : `${mister} te espera en la entrada: «Cuánto tiempo. Esto sigue en pie, ya lo ves».`;
  const capitanLine =
    tie && tie.rv >= 70
      ? `${capitan} sale a tu encuentro y te levanta en volandas: media plantilla se acuerda de ti.`
      : `${capitan} te hace un gesto con la cabeza y te enseña los cambios que ha habido: caras nuevas, taquillas movidas, el mismo olor de siempre.`;

  const options: EventOption[] = [
    {
      id: "a",
      label: "Abrazar a los de siempre y preguntar: «¿Qué me he perdido?»",
      subtitle: "Retomar el vestuario donde lo dejaste",
      consequences: { rel_vestuario: 5, moral: 4, flags: { ...done } },
      outcomeText: `Te pasas media mañana de abrazo en abrazo. Los veteranos te cuentan lo que ha pasado desde que te fuiste y los nuevos te miran con la curiosidad de quien conoce la leyenda pero no al hombre. ${corto(capitan)} resume la jornada: «Aquí no te has ido nunca del todo».`,
    },
    {
      id: "b",
      label: "Presentarte a los nuevos: «Vuelvo, pero me toca ganarme el sitio otra vez»",
      subtitle: "Humildad pese a todo lo que has hecho",
      consequences: { rel_entrenador: 4, rel_vestuario: 2, moral: 2, flags: { ...done } },
      outcomeText: `Lo dices delante de todos, sin adornos. ${mister} asiente despacio: «Eso es lo que quería oír». Los más jóvenes lo anotan mentalmente; los veteranos sonríen. Empiezas la semana con el respeto intacto y las expectativas por las nubes.`,
    },
    {
      id: "c",
      label: "Decirle a la afición que vuelves a por lo que dejaste pendiente",
      subtitle: "Prometer, con todo el riesgo que eso trae",
      consequences: { rel_aficion: 6, fama: 2, moral: 3, rel_vestuario: -1, flags: { ...done } },
      outcomeText: `Lo dices ante las cámaras a la puerta de ${city}: «Vuelvo a casa y vuelvo a ganar». La grada, que lleva meses esperándote, estalla en redes. En el vestuario, algún compañero levanta una ceja: has puesto el listón muy alto desde el primer día.`,
    },
    {
      id: "d",
      label: "Ir a tu antigua taquilla y quedarte un minuto en silencio",
      subtitle: "Dejar que los recuerdos hagan su trabajo",
      consequences: { moral: 6, forma: 1, flags: { ...done, ret_nostalgia: true } },
      outcomeText: `Sigue igual: la misma esquina, el mismo gancho torcido. ${corto(preparador)} te ve desde la puerta y respeta el silencio un buen rato antes de decirte, suave: «Cuando quieras, empezamos». Entras al primer entrenamiento con un nudo en la garganta y las piernas más ligeras de lo que esperabas.`,
    },
  ];

  return {
    id: `llegada-vuelta-${since}`,
    category: "vida",
    title: `Vuelves a ${club}: de nuevo en casa`,
    description: `Cruzas la puerta de la ciudad deportiva de ${club} y no huele a nuevo: huele a casa. ${stintLine} ${misterLine} ${capitanLine} Desde el fondo del pasillo, alguien grita: «¡Eh, qué hay de nuevo, viejo!». ${corto(preparador)}, del cuerpo técnico, sigue ahí con su carpeta bajo el brazo. Todo se para un segundo: es el tiempo justo para decidir cómo quieres volver.`,
    options,
    priority: true,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al grupo en tu primera frase?",
  };
}

export function buildArrivalIntroEvent(player: Player): GameEvent {
  if (isReturningTo(player)) return buildReturnIntroEvent(player);
  const club = player.club;
  const since = num(player.flags?.club_since);
  const city = cityOfClub(club);
  const mister = getNpcName(player, "entrenador");
  const capitan = getNpcName(player, "capitan");
  const preparador = getNpcName(player, "preparador");
  const done = { arrival_intro: String(since) };
  const nombreCorto = (full: string) => full.split(" ")[0];

  const options: EventOption[] = [
    {
      id: "a",
      label: "Presentarte con humildad: «Vengo a aprender de todos»",
      subtitle: "Ganarte el respeto desde abajo",
      consequences: { rel_entrenador: 4, rel_vestuario: 3, moral: 2, flags: { ...done } },
      outcomeText: `${mister} asiente despacio, como quien apunta algo en la cabeza. «Con esa actitud ya tienes medio trabajo hecho», dice. ${capitan} te da una palmada en la espalda: «Aquí al que llega callado le abrimos la puerta enseguida». ${nombreCorto(preparador)} ya te ha hecho un hueco en el primer grupo de trabajo.`,
    },
    {
      id: "b",
      label: "Decir claro a qué vienes: «Vengo a ganar títulos»",
      subtitle: "Marcar el tono desde el primer día",
      consequences: { fama: 3, rel_aficion: 2, moral: 4, rel_vestuario: -1, flags: { ...done } },
      outcomeText: `Lo dices sin levantar la voz, y se oye en todo el vestuario. ${mister} sonríe a medias: «Eso lo decimos todos los lunes». ${capitan} te mira un segundo de más y deja caer, medio en broma: «Veremos el martes». Al salir, alguien murmura que ha llegado alguien con hambre.`,
    },
    {
      id: "c",
      label: `Pedirle a ${nombreCorto(capitan)} que te explique cómo funciona el vestuario`,
      subtitle: "Aprender las normas no escritas",
      consequences: { rel_vestuario: 5, moral: 2, flags: { ...done, arrival_capitan: true } },
      outcomeText: `${capitan} te lleva a tu taquilla y, de paso, te cuenta lo que no está en ningún manual: dónde se sienta cada uno en el autobús, quién paga el café, qué no se le dice nunca al míster en un día de derrota. «Con esto ya sobrevives una semana», sonríe. Es el mejor mapa que podías pedir.`,
    },
    {
      id: "d",
      label: `Preguntarle a ${nombreCorto(preparador)} por tu plan físico`,
      subtitle: "Ponerte a punto cuanto antes",
      consequences: { forma: 4, rel_entrenador: 2, flags: { ...done } },
      outcomeText: `${preparador} saca una carpeta con tu nombre y el calendario de las próximas semanas. «Te he visto jugar. Tienes mucho que dar y un par de cosas que pulir», dice. Os ponéis de acuerdo en un plan a tu medida y sales del despacho con ganas de empezar ya.`,
    },
  ];

  return {
    id: `llegada-presentacion-${since}`,
    category: "vida",
    title: `Tu primer día en ${club}`,
    description: `Cruzas la puerta de la ciudad deportiva de ${club} con la sensación de que todo huele a nuevo: el césped, las taquillas, hasta el aire de ${city}. ${mister}, el entrenador, te espera en la entrada con un apretón de manos firme y una frase corta: «Bienvenido. Aquí se trabaja». A su lado, ${capitan}, el capitán, te hace un gesto con la cabeza y te enseña por dónde se va al vestuario. Más atrás, ${preparador}, del cuerpo técnico, te saluda con una carpeta bajo el brazo. Todos te miran un segundo: el tiempo justo para decidir cómo quieres que te recuerden de este primer día.`,
    options,
    priority: true,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices al grupo en tu primera frase?",
  };
}
