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

export function buildArrivalIntroEvent(player: Player): GameEvent {
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
