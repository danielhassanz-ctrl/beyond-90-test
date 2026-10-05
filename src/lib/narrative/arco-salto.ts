/**
 * Arco "El salto": la escalera de clubes con escenas que la preparan y la
 * cobran. Antes un traspaso era una oferta suelta que aparecía de la nada y
 * se olvidaba al firmar. Ahora ascender de club es una historia en cinco
 * capítulos, y lo que decides en cada uno cambia el siguiente:
 *   1. Alguien te está mirando (un ojeador del club objetivo).
 *   2. El club se huele algo (tu actual club reacciona según cómo te portaste).
 *   3. La oferta (fichar, negociar quedarte o rechazar — cada una cuesta algo).
 *   4. El primer día (llegada al nuevo club; empiezas de cero con míster y vestuario).
 *   5. La prueba (a las pocas semanas se ve si el salto salió bien según tu rol real).
 *
 * Estado en player.flags: salto_fase (0-5), salto_target, salto_postura,
 * salto_last_week, salto_cooldown. Ids "arco-salto-*" (no avanzan la semana).
 */
import type { EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { getClubLevel } from "@/lib/calendar/match-calendar";
import { getNpcName } from "@/lib/narrative/npcs";
import { computeRole } from "@/lib/narrative/role";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";
import { pickInterestedClub } from "@/lib/narrative/market-window";

type Postura = "leal" | "ambicioso" | "discreto";

const MIN_MEDIA: Record<"modesto" | "europeo" | "grande", number> = { modesto: 60, europeo: 68, grande: 80 };

const fase = (p: Player) => parseInt(String(p.flags?.salto_fase ?? "0"), 10) || 0;
const lastWeek = (p: Player) => parseInt(String(p.flags?.salto_last_week ?? "0"), 10) || 0;
const postura = (p: Player): Postura => (["leal", "ambicioso", "discreto"].includes(String(p.flags?.salto_postura)) ? (p.flags!.salto_postura as Postura) : "discreto");
const target = (p: Player) => String(p.flags?.salto_target ?? "");


export function shouldTriggerSalto(player: Player): boolean {
  if (player.club === NO_CLUB_YET || player.mode === "express") return false;
  const f = fase(player);
  const now = player.week;

  // Un arco a medias que se queda parado demasiado tiempo se abandona solo.
  if (f >= 1 && f <= 3 && now - lastWeek(player) > 25) return false;

  if (f === 0) {
    if (getInjuryRemaining(player.flags) > 0) return false;
    const cooldown = parseInt(String(player.flags?.salto_cooldown ?? "0"), 10) || 0;
    if (now < cooldown) return false;
    const level = getClubLevel(player.club);
    if ((player.media ?? 0) < MIN_MEDIA[level]) return false;
    const role = computeRole(player).role;
    if (role !== "titular" && role !== "rotacion") return false;
    const since = parseInt(String(player.flags?.club_since ?? "0"), 10) || 0;
    if (since > 0 && now - since < 10) return false;
    if (now < 20) return false;
    return Math.random() < 0.25;
  }
  const gap = now - lastWeek(player);
  if (f === 1 || f === 2) return gap >= 4 && Math.random() < 0.6;
  if (f === 3) return gap >= 1;
  if (f === 4) return player.club === target(player);
  if (f === 5) return gap >= 6 && getInjuryRemaining(player.flags) === 0;
  return false;
}

export function buildSaltoEvent(player: Player): GameEvent {
  const f = fase(player);
  if (f === 0) return chapter1(player);
  if (f === 1) return chapter2(player);
  if (f === 2) return chapter3(player);
  if (f === 4) return chapter4(player);
  if (f === 5) return chapter5(player);
  // fase 3 sin resolver (no debería ocurrir): vuelve a presentar la oferta
  return chapter3(player);
}

const stamp = (p: Player, extra: Record<string, string | boolean>) => ({ salto_last_week: String(p.week), ...extra });

function chapter1(player: Player): GameEvent {
  const club = pickInterestedClub(player);
  const agent = player.agent_name && !/^(Tu |Sin )/.test(player.agent_name) ? player.agent_name : "Tu representante";
  const coach = getNpcName(player, "entrenador");
  const base = { salto_fase: "1", salto_target: club };
  return {
    id: `arco-salto-1-${Date.now()}`,
    category: "especial",
    title: "Alguien te está mirando",
    description: `Llevas semanas viendo al mismo señor en la misma esquina de la grada: abrigo largo, libreta y cero reacciones, ni siquiera cuando marcáis. ${agent} te lo confirma por teléfono: es ojeador del ${club}, que ha pedido cuatro de tus partidos. "Todavía no hay nada. Pero conviene que lo sepas."`,
    options: [
      {
        id: "discreto",
        label: "Rendir como si no supieras nada",
        subtitle: "Que hablen los números",
        consequences: { forma: 2, moral: 2, flags: stamp(player, { ...base, salto_postura: "discreto" }) },
        outcomeText: "Juegas el siguiente partido sin mirar hacia la esquina ni una sola vez. Nadie sabe lo que te cuesta.",
      },
      {
        id: "leal",
        label: `Contárselo a ${coach} antes de que se entere por otro`,
        subtitle: "Lealtad, aunque cueste",
        consequences: { rel_entrenador: 3, rel_vestuario: -1, moral: 1, flags: stamp(player, { ...base, salto_postura: "leal" }) },
        outcomeText: `${coach} te escucha sin interrumpirte, asiente despacio y, al terminar, solo dice: "Gracias por decírmelo tú." Es más de lo que esperabas.`,
      },
      {
        id: "ambicioso",
        label: "Dejar caer un par de gestos para el ojeador",
        subtitle: "Que te vea en tu mejor versión",
        consequences: { fama: 3, rel_entrenador: -2, rel_aficion: -2, flags: stamp(player, { ...base, salto_postura: "ambicioso" }) },
        outcomeText: "Te pasas el partido buscando el regate vistoso y la jugada de portada. Sale bien. Pero en el banquillo alguien ha notado que ya juegas para otro público.",
      },
    ],
  };
}

function chapter2(player: Player): GameEvent {
  const p = postura(player);
  const club = target(player);
  const director = getNpcName(player, "director_deportivo");
  const agent = player.agent_name && !/^(Tu |Sin )/.test(player.agent_name) ? player.agent_name : "Tu representante";
  const raise = Math.round((9000 + (player.media ?? 60) * 300) / 500) * 500;
  const intro =
    p === "leal"
      ? `${director} te cita en su despacho con una sonrisa que no es de compromiso: sabe que fuiste honesto con el míster y quiere "ponerte las cosas fáciles". Te adelanta que, si hay oferta de fuera, el club "se lo pensará dos veces" antes de dejarte marchar.`
      : p === "ambicioso"
        ? `${director} te recibe con la puerta abierta y la cara cerrada. Se ha enterado de tus gestos al ojeador del ${club} y lo deja caer sin levantar la voz: "Aquí nadie es imprescindible, ni siquiera tú."`
        : `${director} te cita sin dar explicaciones. Sabe que el ${club} te sigue y quiere saber hacia dónde miras: "No te voy a preguntar nada. Solo quiero que sepas que aquí cuentas con nosotros."`;
  return {
    id: `arco-salto-2-${Date.now()}`,
    category: "representante",
    title: "El club se huele algo",
    description: `${intro} Al salir, ${agent} te espera con el móvil en la mano: el ${club} ha vuelto a preguntar.`,
    options: [
      {
        id: "mejora",
        label: "Pedir una mejora de contrato para quedarte",
        subtitle: "Usar el interés para ganar peso",
        consequences: {},
        resolve: {
          baseChance: p === "leal" ? 0.65 : p === "discreto" ? 0.5 : 0.3,
          statModifier: "reputacion",
          success: { text: `El club cede: te sube el sueldo y te promete un papel de referencia. Te sientes valorado... y con una pequeña deuda de honor.`, consequences: { patrimonio: raise, moral: 4, rel_entrenador: 2, flags: stamp(player, { salto_fase: "2" }) } },
          fail: { text: "El club se enfría y te dice que 'ahora no es el momento'. Entiendes que tu carta no pesaba tanto como creías.", consequences: { moral: -4, rel_entrenador: -2, flags: stamp(player, { salto_fase: "2" }) } },
        },
      },
      {
        id: "verdad",
        label: "Decirle la verdad: si llega una oferta grande, querrás escucharla",
        subtitle: "Honestidad sin rodeos",
        consequences: { rel_aficion: -2, rel_entrenador: -1, moral: 2, reputacion: 2, flags: stamp(player, { salto_fase: "2" }) },
        outcomeText: `${director} no se inmuta. "Gracias por la franqueza. Prefiero esto a que te marches por la puerta de atrás." Esa tarde el club, por si acaso, empieza a mirar a un sustituto.`,
      },
      {
        id: "callar",
        label: `Callar y dejar que ${agent} lo gestione`,
        subtitle: "Cero ruido",
        consequences: { rel_representante: 2, flags: stamp(player, { salto_fase: "2" }) },
        outcomeText: `${agent} toma el relevo con una calma que da envidia. Tú sigues entrenando como si nada, mientras el teléfono vibra en tu taquilla.`,
      },
    ],
  };
}

function chapter3(player: Player): GameEvent {
  const club = target(player);
  const p = postura(player);
  const agent = player.agent_name && !/^(Tu |Sin )/.test(player.agent_name) ? player.agent_name : "Tu representante";
  const raise = Math.round((12000 + (player.media ?? 60) * 350) / 500) * 500;
  const farewell =
    p === "leal"
      ? "Te vas con las puertas abiertas: en el club te desean suerte de corazón."
      : p === "ambicioso"
        ? "Te vas con una despedida fría: en el club ya habían empezado a mirar a otro."
        : "Te vas sin dramas, aunque con un par de abrazos sinceros.";
  const options: EventOption[] = [
    {
      id: "fichar",
      label: `Fichar por el ${club}`,
      subtitle: "El salto que llevabas esperando",
      consequences: { club, fama: 6, moral: 5, rel_aficion: -4, flags: { ...stamp(player, { salto_fase: "4" }) } },
      outcomeText: `Firmas con ${agent} a tu lado y el estómago hecho un nudo. ${farewell} En el coche, camino del aeropuerto, no puedes dejar de mirar por el retrovisor.`,
    },
    {
      id: "negociar",
      label: "Usar la oferta para negociar quedarte",
      subtitle: "Jugar tus cartas",
      consequences: {},
      resolve: {
        baseChance: p === "leal" ? 0.6 : 0.45,
        statModifier: "reputacion",
        success: { text: "Tu club mueve ficha y te ofrece un proyecto y una cifra que no esperabas. Te quedas con la mano llena y la afición, encantada.", consequences: { patrimonio: raise, moral: 4, rel_aficion: 4, rel_entrenador: 2, flags: { ...stamp(player, { salto_fase: "0", salto_cooldown: String(player.week + 20) }) } } },
        fail: { text: `El ${club} se cansa de esperar y retira la oferta. Tu club, que ya sabe que querías irte, te trata con una frialdad educada.`, consequences: { moral: -6, rel_entrenador: -3, rel_aficion: -2, flags: { ...stamp(player, { salto_fase: "0", salto_cooldown: String(player.week + 25) }) } } },
      },
    },
    {
      id: "rechazar",
      label: "Rechazarla: aquí hay una historia por terminar",
      subtitle: "La grada lo va a agradecer",
      consequences: { rel_aficion: 7, rel_entrenador: 3, moral: 1, flags: { ...stamp(player, { salto_fase: "0", salto_cooldown: String(player.week + 25) }) } },
      outcomeText: "Lo anuncias en la zona mixta con una frase corta. En el estadio, el domingo siguiente, hay una pancarta nueva con tu nombre y la palabra \"gracias\".",
    },
  ];
  return {
    id: `arco-salto-3-${Date.now()}`,
    category: "representante",
    title: `La oferta del ${club}`,
    description: `Ya no es un rumor. ${agent} entra con papeles y la voz temblando: el ${club} ha puesto una oferta formal, con contrato, ficha y proyecto. "Esto es lo que llevabas esperando. Pero tienes que decidir ya."`,
    isMilestone: true,
    imageScene: `Photorealistic photo of the photographed man sitting at a long table in a modern club office, a contract and a pen in front of him, an agent in a suit at his side, bright natural window light, serious thoughtful expression, official signing-day style`,
    allowFreeText: true,
    freeTextPrompt: "¿Qué le dices a tu representante antes de firmar o rechazar?",
    options,
  };
}

function chapter4(player: Player): GameEvent {
  const club = player.club;
  const coach = getNpcName(player, "entrenador");
  const captain = getNpcName(player, "capitan");
  return {
    id: `arco-salto-4-${Date.now()}`,
    category: "vestuario",
    title: `Primer día en el ${club}`,
    description: `Cruzas el túnel del ${club} con tu maleta aún sin deshacer. En el vestuario, ${captain}, el capitán, te señala una taquilla en la esquina; en la puerta, ${coach}, tu nuevo entrenador, te mira de arriba abajo sin una sonrisa: "Aquí lo que hiciste antes no vale nada. Empiezas de cero."`,
    options: [
      {
        id: "grupo",
        label: "Presentarte uno a uno al grupo, empezando por el capitán",
        subtitle: "Ganarte al vestuario primero",
        consequences: { rel_vestuario: 6, moral: 3, flags: stamp(player, { salto_fase: "5", salto_llegada: "grupo" }) },
        outcomeText: `${captain} te sostiene la mirada un segundo y te estrecha la mano con fuerza: "Aquí se trabaja, se come y se ríe. En ese orden." Es lo más cálido que te dirán en semanas.`,
      },
      {
        id: "campo",
        label: "Dejar los discursos: ganarte el sitio en el campo",
        subtitle: "Que hablen tus botas",
        consequences: { forma: 3, rel_entrenador: 3, rel_vestuario: -1, flags: stamp(player, { salto_fase: "5", salto_llegada: "campo" }) },
        outcomeText: `En el primer rondo no pierdes ni un balón. ${coach} no dice nada, pero cuando acaba la sesión, te señala con la barbilla y apunta algo en su libreta.`,
      },
      {
        id: "trato",
        label: "Recordar lo que costó tu fichaje y pedir un trato especial",
        subtitle: "Marcar territorio",
        consequences: { fama: 2, rel_vestuario: -5, rel_entrenador: -2, flags: stamp(player, { salto_fase: "5", salto_llegada: "trato" }) },
        outcomeText: `Lo sueltas con tono de estrella y la sala se queda en silencio. ${captain} cruza una mirada con ${coach}, y entiendes que acabas de ganar un enemigo antes de calentar.`,
      },
    ],
  };
}

function chapter5(player: Player): GameEvent {
  const club = player.club;
  const coach = getNpcName(player, "entrenador");
  const role = computeRole(player).role;
  const style = String(player.flags?.salto_llegada ?? "");
  const done = { salto_fase: "0", salto_cooldown: String(player.week + 30) };

  if (role === "titular") {
    return {
      id: `arco-salto-5-${Date.now()}`,
      category: "especial",
      title: "La prueba superada",
      description: `Ocho semanas después de llegar, ${coach} lee la alineación en voz alta y tu nombre sale entre los primeros. Fuera del vestuario, la prensa del ${club} ya habla de ti como "el fichaje que acertó".${style === "trato" ? " Aun así, hay quien no te ha perdonado el primer día." : ""}`,
      isMilestone: true,
      imageScene: `Photorealistic photo of the photographed man in a new club's kit celebrating with teammates on a big stadium pitch, arms raised, huge crowd behind, bright floodlights, proud emotional expression`,
      options: [
        { id: "a", label: "Dar las gracias al grupo y pedir más", subtitle: "Humildad con hambre", consequences: { rel_vestuario: 4, moral: 5, flags: done }, outcomeText: `${coach} te saca a un lado después del entreno: "No te acomodes. Esto no ha hecho más que empezar."` },
        { id: "b", label: "Disfrutarlo: lo has ganado", subtitle: "Orgullo bien merecido", consequences: { moral: 6, fama: 2, flags: done }, outcomeText: "Esa noche llamas a casa y te dejas llevar. Por primera vez en meses, no te da miedo mirar hacia arriba." },
      ],
    };
  }
  if (role === "rotacion") {
    return {
      id: `arco-salto-5-${Date.now()}`,
      category: "entrenamiento",
      title: "Te falta un empujón",
      description: `Ocho semanas en el ${club} y juegas más de lo que esperabas, pero todavía no eres intocable. ${coach} te ha dicho a la cara que "estás a un paso, no más". Tienes el estadio, la ciudad y el vestuario... y una oportunidad de demostrar de qué estás hecho.`,
      options: [
        { id: "a", label: "Quedarte a entrenar cada tarde con el preparador", subtitle: "El empujón que falta", consequences: { forma: 4, rel_entrenador: 3, moral: -1, flags: done }, outcomeText: `Cada tarde, una hora más. ${coach} nunca lo menciona, pero un jueves te cita en su despacho para decirte que el domingo juegas de inicio.` },
        { id: "b", label: "Hablar con el míster y pedirle un papel claro", subtitle: "Ir de frente", consequences: { rel_entrenador: 2, moral: 2, flags: done }, outcomeText: "Te dice lo que ya sabías, con otras palabras. Al menos sales con un plan concreto en la cabeza." },
      ],
    };
  }
  return {
    id: `arco-salto-5-${Date.now()}`,
    category: "representante",
    title: "La travesía",
    description: `Ocho semanas en el ${club} y apenas has jugado. ${coach} no te cuenta sus razones y en el vestuario ya hay quien murmura que "el fichaje no ha salido". ${player.agent_name && !/^(Tu |Sin )/.test(player.agent_name) ? player.agent_name : "Tu representante"} te lo plantea sin rodeos: o te mueves o aguantas.`,
    options: [
      { id: "a", label: "Aguantar y pelear el sitio", subtitle: "Una segunda oportunidad", consequences: { forma: 2, moral: -3, flags: { ...done, coach_bench: "0" } }, outcomeText: "Te prometes que el próximo mes será distinto. Mientras tanto, entrenas el doble y sonríes cuando el míster te mira, aunque por dentro duela." },
      { id: "b", label: "Pedir una cesión para recuperar sensaciones", subtitle: "Reconstruirte fuera", consequences: { rel_representante: 2, moral: 1, flags: { ...done, bench_streak: "2" } }, outcomeText: "Tu representante asiente sin dramatizar: \"Será solo un desvío.\" Esa misma noche empieza a llamar a clubes donde sí vas a jugar." },
    ],
  };
}

