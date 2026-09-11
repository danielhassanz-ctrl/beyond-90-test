import { canReceiveSocialDm, ensureCareerCast, touch } from "./career-life";
import { ALL_EVENTS } from "./events";
import { flag, note, rel, stat } from "./mutate";
import type { GameEvent } from "./types";

export const PEOPLE_EVENTS: GameEvent[] = [
  {
    id: "people_adviser_intro",
    kicker: "16 años · La primera llamada",
    title: "Alguien quiere llevar tu carrera",
    image: "agent",
    priority: 420,
    category: "agent",
    family: "people_adviser",
    requires: (s) => s.age <= 17 && !s.flags["people_adviser_intro"],
    text: (s) => {
      const cast = ensureCareerCast(s);
      const role = cast.adviserKind === "agent" ? "representante" : cast.adviserKind === "father" ? "padre" : "amigo de confianza";
      return `${cast.adviser.name}, tu ${role}, te llama antes de que empiece de verdad la temporada. "A partir de ahora no quiero que firmes, gastes ni rechaces nada sin hablarlo. Esto puede durar veinte años o seis meses. Vamos a llevarlo con cabeza".`;
    },
    choices: [
      { id: "confiar", label: "Darle confianza para guiarte", hint: "Tendrá peso real en mercado y dinero", outcome: "Le das margen. Desde hoy será una voz frecuente en tu carrera.", apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,8); rel(s,"agent",8); flag(s,"people_adviser_intro",1); note(s,`${p.name} empezó a asesorarte desde el inicio de tu carrera.`); } },
      { id: "escuchar", label: "Escuchar, pero decidir siempre tú", hint: "Relación más independiente", outcome: "Acepta. \"Yo te doy información; tú cargas con la decisión.\"", apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,3); rel(s,"agent",3); stat(s,"discipline",2); flag(s,"people_adviser_intro",1); } },
      { id: "marcar_distancia", label: "Decirle que no quieres que controle todo", hint: "Más libertad, menos confianza", outcome: "Hay un silencio incómodo. Seguirá ahí, pero la relación empieza con límites.", apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,-6); rel(s,"agent",-6); stat(s,"morale",2); flag(s,"people_adviser_intro",1); } },
    ],
  },
  {
    id: "people_adviser_first_plan",
    kicker: "Primeros meses · Llamada del asesor",
    title: "Tu carrera ya necesita un plan",
    image: "agent",
    priority: 405,
    category: "agent",
    family: "people_adviser_plan",
    requires: (s) => s.age <= 19 && !!s.flags["people_adviser_intro"] && s.sceneCount >= 3 && !s.flags["people_adviser_first_plan"],
    text: (s) => {
      const c = ensureCareerCast(s);
      return `${c.adviser.name} vuelve a llamarte. Ya no habla de ilusión, sino de los próximos doce meses. "Necesito saber qué quieres priorizar: jugar, crecer aquí o acelerar si aparece una oportunidad. Si no lo decidimos nosotros, lo decidirán otros".`;
    },
    choices: [
      { id:"minutos", label:"Priorizar minutos por encima del nombre del club", hint:"Favorece decisiones de cesión o salida si te estancas", outcome:"Lo apunta como línea roja: primero jugar, luego presumir de escudo.", apply:(s)=>{const p=ensureCareerCast(s).adviser;touch(p,s,6);rel(s,"agent",5);flag(s,"people_adviser_first_plan",1);flag(s,"career_plan_minutes",1);note(s,`${p.name} y tú acordaste priorizar minutos en la primera etapa de la carrera.`);} },
      { id:"club", label:"Quedarte y ganarte el sitio donde estás", hint:"Apuesta por continuidad y paciencia", outcome:"Acepta el plan, pero te avisa de que la paciencia también tiene fecha de caducidad.", apply:(s)=>{const p=ensureCareerCast(s).adviser;touch(p,s,4);rel(s,"agent",3);stat(s,"discipline",3);flag(s,"people_adviser_first_plan",1);flag(s,"career_plan_continuity",1);} },
      { id:"ambicion", label:"Pedirle que escuche cualquier salto importante", hint:"Más agresivo en mercado", outcome:"Se ríe. \"Vale. Pero una oferta grande no siempre es un paso grande.\"", apply:(s)=>{const p=ensureCareerCast(s).adviser;touch(p,s,2);stat(s,"fame",2);flag(s,"people_adviser_first_plan",1);flag(s,"career_plan_ambition",1);} },
    ],
  },
  {
    id: "people_adviser_first_money",
    kicker: "Primer sueldo serio · Videollamada",
    title: "Cobrar más no significa ser rico",
    image: "office",
    priority: 335,
    category: "agent",
    family: "people_adviser_money",
    requires: (s) => s.age <= 21 && !!s.flags["people_adviser_first_plan"] && s.salary >= 20 && s.sceneCount >= 7 && !s.flags["people_adviser_first_money"],
    text: (s) => {
      const c = ensureCareerCast(s);
      return `${c.adviser.name} comparte pantalla contigo: sueldo, impuestos, ahorro y lo que queda de verdad. "Ahora es cuando muchos empiezan a vivir como si la carrera no pudiera torcerse. Quiero saber qué hacemos con tu primer dinero serio".`;
    },
    choices: [
      { id:"ahorrar",label:"Guardar una parte importante y vivir normal",hint:"Más margen para futuras decisiones",outcome:"No es espectacular, pero construyes una base antes de pensar en coches o casas.",apply:(s)=>{const p=ensureCareerCast(s).adviser;touch(p,s,7);rel(s,"agent",5);stat(s,"discipline",4);flag(s,"people_adviser_first_money",1);flag(s,"money_style_prudent",1);note(s,`${p.name} te convenció de construir un colchón con tus primeros ingresos serios.`);} },
      { id:"invertir",label:"Reservar dinero para una primera inversión",hint:"Abre una línea patrimonial temprana, sin lujos absurdos",outcome:"Acordáis que primero estudiaréis opciones sencillas y líquidas. Nada de jugar a empresario con dieciocho años.",apply:(s)=>{const p=ensureCareerCast(s).adviser;touch(p,s,8);rel(s,"agent",6);flag(s,"people_adviser_first_money",1);flag(s,"money_style_invest",1);} },
      { id:"disfrutar",label:"Decir que también quieres disfrutar lo que has ganado",hint:"Más libertad, menos prudencia",outcome:"No te lo prohíbe. Solo te obliga a fijar un límite antes de gastar.",apply:(s)=>{const p=ensureCareerCast(s).adviser;touch(p,s,-1);stat(s,"morale",4);stat(s,"discipline",-2);flag(s,"people_adviser_first_money",1);flag(s,"money_style_spend",1);} },
    ],
  },
  {
    id: "people_coach_intro",
    kicker: "Pretemporada · Despacho",
    title: "El entrenador te pone nombre y objetivo",
    image: "office",
    priority: 410,
    category: "club",
    family: "people_coach",
    requires: (s) => s.age <= 18 && !!s.flags["people_adviser_intro"] && !s.flags["people_coach_intro"],
    text: (s) => { const c=ensureCareerCast(s); return `${c.coach.name} te hace pasar al despacho. "Tienes talento, pero ahora mismo estás detrás de gente más hecha. Quiero saber si vas a tener paciencia cuando no juegues".`; },
    choices: [
      { id:"paciencia", label:"Decir que te ganarás cada minuto", outcome:"El entrenador asiente y apunta algo en su libreta.", apply:(s)=>{const p=ensureCareerCast(s).coach;touch(p,s,7);rel(s,"coach",7);stat(s,"discipline",3);flag(s,"people_coach_intro",1);} },
      { id:"ambicion", label:"Decir que vienes a ser titular", outcome:"No sonríe. Tampoco le molesta. \"Entonces demuéstramelo.\"", apply:(s)=>{const p=ensureCareerCast(s).coach;touch(p,s,-1);rel(s,"coach",-1);stat(s,"form",4);flag(s,"people_coach_intro",1);} },
      { id:"preguntar", label:"Preguntarle qué te falta exactamente", outcome:"Te da dos tareas concretas para las próximas semanas.", apply:(s)=>{const p=ensureCareerCast(s).coach;touch(p,s,5);rel(s,"coach",5);stat(s,"overall",1);flag(s,"people_coach_intro",1);} },
    ],
  },
  {
    id: "people_captain_intro",
    kicker: "Vestuario · Primeras semanas",
    title: "El capitán se sienta a tu lado",
    image: "locker",
    priority: 400,
    category: "club",
    family: "people_captain",
    requires: (s) => s.age <= 19 && !!s.flags["people_coach_intro"] && !s.flags["people_captain_intro"],
    text: (s) => { const c=ensureCareerCast(s); return `${c.captain.name}, capitán del equipo, se sienta a tu lado. "Si tienes un problema con el míster o con alguien del vestuario, antes de liarla, ven a verme".`; },
    choices: [
      { id:"agradecer",label:"Agradecerle el gesto",outcome:"Te da su número y te mete en el grupo del vestuario.",apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,8);rel(s,"dressing",6);flag(s,"people_captain_intro",1);} },
      { id:"competir",label:"Decirle que no has venido a hacer amigos",outcome:"Se ríe. \"Eso dicen todos hasta que necesitan uno.\"",apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,-4);rel(s,"dressing",-3);stat(s,"form",3);flag(s,"people_captain_intro",1);} },
      { id:"preguntar",label:"Preguntarle quién manda de verdad en el vestuario",outcome:"Te explica cosas que nadie pone en el contrato.",apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,5);rel(s,"dressing",5);stat(s,"discipline",2);flag(s,"people_captain_intro",1);} },
    ],
  },
  {
    id: "people_teammate_intro",
    kicker: "Ciudad deportiva · Después de entrenar",
    title: "Tu primer aliado dentro",
    image: "training",
    priority: 390,
    category: "life",
    family: "people_teammate",
    requires: (s) => s.age <= 20 && !!s.flags["people_captain_intro"] && !s.flags["people_teammate_intro"],
    text: (s) => { const c=ensureCareerCast(s); return `${c.teammate.name} te propone comer juntos. Juega cerca de tu posición y podría verte como competencia. "Si los dos llegamos, mejor. Aquí solo es imposible".`; },
    choices: [
      { id:"aliado",label:"Aceptar y hacer piña",outcome:"Empieza una amistad que puede durar más que el club.",apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,10);rel(s,"dressing",8);flag(s,"people_teammate_intro",1);note(s,`${p.name} se convirtió en uno de tus primeros aliados en el vestuario.`);} },
      { id:"distancia",label:"Mantener la relación profesional",outcome:"No hay mal rollo, pero tampoco confianza.",apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,1);flag(s,"people_teammate_intro",1);} },
      { id:"competencia",label:"Decirle que sois competencia directa",outcome:"La comida se enfría un poco. El entrenamiento del día siguiente, no.",apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,-5);rel(s,"dressing",-2);stat(s,"form",4);flag(s,"people_teammate_intro",1);} },
    ],
  },
  {
    id: "people_physio_intro",
    kicker: "Sala médica · Una molestia",
    title: "Conoces al fisio antes de necesitarlo de verdad",
    image: "injury",
    priority: 310,
    category: "medical",
    family: "people_physio",
    requires: (s) => s.age <= 21 && s.fitness < 88 && !s.flags["people_physio_intro"],
    text: (s) => { const c=ensureCareerCast(s); return `${c.physio.name}, fisioterapeuta del equipo, te frena antes del gimnasio. "Puedes entrenar hoy y perder tres semanas, o parar veinte minutos y llegar al sábado".`; },
    choices: [
      { id:"hacer_caso",label:"Hacerle caso y tratarte",outcome:"Sales mejor de lo que entraste y con una persona de confianza nueva.",apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,7);stat(s,"fitness",7);stat(s,"discipline",2);flag(s,"people_physio_intro",1);} },
      { id:"seguir",label:"Entrenar igualmente",outcome:"No pasa nada grave hoy, pero el fisio toma nota de cómo eres.",apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,-5);stat(s,"fitness",-4);stat(s,"form",2);flag(s,"people_physio_intro",1);} },
      { id:"preguntar",label:"Preguntarle cómo cuidar mejor tu cuerpo",outcome:"Te prepara una rutina corta que acabarás usando durante años.",apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,9);stat(s,"fitness",4);stat(s,"discipline",4);flag(s,"people_physio_intro",1);note(s,`${p.name} te enseñó una rutina de prevención al principio de tu carrera.`);} },
    ],
  },
  {
    id: "people_social_dm_intro",
    kicker: "23:48 · Mensaje directo",
    title: "Una chica te escribe por redes",
    image: "press",
    priority: 330,
    category: "gossip",
    family: "people_social_dm",
    requires: (s) => canReceiveSocialDm(s),
    text: (s) => { const c=ensureCareerCast(s); return `${c.social.name} ha respondido a una historia después de uno de tus primeros partidos: "Buen partido 😉". No la conoces personalmente. Tu compañero acaba de ver la pantalla.`; },
    choices: [
      { id:"contestar",label:"Contestarle y seguir la conversación",hint:"Puede abrir un hilo personal",outcome:"La conversación dura más de lo previsto. No sabes todavía si es una anécdota o el principio de algo.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,8);flag(s,"social_dm_intro",1);flag(s,"social_dm_replied",1);stat(s,"morale",4);note(s,`Contestaste al primer mensaje de ${p.name} en redes.`);} },
      { id:"ignorar",label:"Dejarlo en visto",outcome:"Cierras el móvil. Tu compañero te llama frío durante una semana.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,-2);flag(s,"social_dm_intro",1);stat(s,"discipline",2);} },
      { id:"ensenar",label:"Enseñárselo a tu compañero y bromear",outcome:"La captura no sale del vestuario. De momento.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,2);flag(s,"social_dm_intro",1);flag(s,"social_dm_shared",1);rel(s,"dressing",4);stat(s,"morale",3);} },
    ],
  },
];

let installed = false;
/**
 * Compatibility bridge while the live selector still owns ALL_EVENTS in events.ts.
 * Called after module initialization from npc.ts, so the cycle never reads ALL_EVENTS
 * during evaluation. This keeps the people scenes in the real selector without
 * duplicating the legacy event bank.
 */
export function installPeopleEvents(): void {
  if (installed) return;
  const existing = new Set(ALL_EVENTS.map((event) => event.id));
  const missing = PEOPLE_EVENTS.filter((event) => !existing.has(event.id));
  if (missing.length) ALL_EVENTS.unshift(...missing);
  installed = true;
}
