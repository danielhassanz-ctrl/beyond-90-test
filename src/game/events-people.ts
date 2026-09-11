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
    id: "people_captain_callback",
    kicker: "Vestuario · Meses después",
    title: "El capitán recuerda lo que le dijiste",
    image: "locker",
    priority: 315,
    category: "club",
    family: "people_captain_callback",
    requires: (s) => s.age <= 23 && !!s.flags["people_captain_intro"] && s.sceneCount >= 8 && !s.flags["people_captain_callback"],
    text: (s) => { const p=ensureCareerCast(s).captain; const warm=p.relation>=50; return warm ? `${p.name} te aparta al terminar el entrenamiento. "Te dije que vinieras antes de que algo explotara. Ahora ya llevas meses aquí: dime si estás bien de verdad".` : `${p.name} te cruza en el vestuario y no olvida cómo empezó vuestra relación. "No hace falta que seamos amigos, pero sí que sepamos si vamos a ayudarnos o a estorbarnos".`; },
    choices: [
      { id:"abrirse",label:"Contarle cómo estás de verdad",outcome:"La charla no cambia tu carrera en un minuto, pero cambia quién te cubre la espalda.",apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,7);rel(s,"dressing",6);flag(s,"people_captain_callback",1);note(s,`${p.name} pasó de ser solo el capitán a una referencia dentro del vestuario.`);} },
      { id:"profesional",label:"Mantenerlo estrictamente profesional",outcome:"Lo acepta. Hay respeto, aunque no intimidad.",apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,1);stat(s,"discipline",2);flag(s,"people_captain_callback",1);} },
      { id:"retar",label:"Decirle que prefieres resolver tus problemas solo",outcome:"Te deja hacer. También deja claro que no piensa rescatarte de todos los incendios.",apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,-6);rel(s,"dressing",-4);flag(s,"people_captain_callback",1);} },
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
    id: "people_teammate_callback",
    kicker: "Ciudad deportiva · La relación ya pesa",
    title: "Amigo, compañero o rival",
    image: "training",
    priority: 305,
    category: "life",
    family: "people_teammate_callback",
    requires: (s) => s.age <= 24 && !!s.flags["people_teammate_intro"] && s.sceneCount >= 10 && !s.flags["people_teammate_callback"],
    text: (s) => { const p=ensureCareerCast(s).teammate; if(p.relation>=58)return `${p.name} te espera fuera del vestuario. "Nos están comparando todo el rato. A mí me da igual mientras no dejemos que eso nos rompa".`; if(p.relation<=45)return `${p.name} no disimula ya la tensión. "Entrenamos juntos, pero los dos sabemos que hay minutos para uno. Mejor no fingir".`; return `${p.name} te lanza una pregunta que llevaba semanas flotando: "¿Somos compañeros de verdad o solo dos tipos que coinciden mientras esto nos conviene?".`; },
    choices: [
      { id:"equipo",label:"Proteger la relación por encima de la competencia",outcome:"No dejáis de competir. Dejáis de convertir cada entrenamiento en una guerra.",apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,8);rel(s,"dressing",6);flag(s,"people_teammate_callback",1);flag(s,"teammate_long_term_ally",1);} },
      { id:"competir",label:"Decir que el puesto está por encima de la amistad",outcome:"La relación se enfría, pero la rivalidad eleva la intensidad.",apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,-7);stat(s,"form",4);flag(s,"people_teammate_callback",1);flag(s,"teammate_rivalry",1);} },
      { id:"equilibrio",label:"Competir fuerte sin romper la relación",outcome:"No prometes amistad eterna. Prometes no jugar sucio.",apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,3);stat(s,"discipline",2);flag(s,"people_teammate_callback",1);} },
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
    id: "people_physio_injury_callback",
    kicker: "Sala médica · Ahora sí es serio",
    title: "El fisio ya sabe cómo reaccionas al dolor",
    image: "injury",
    priority: 360,
    category: "medical",
    family: "people_physio_callback",
    requires: (s) => !!s.flags["people_physio_intro"] && !!s.injury && !s.flags["people_physio_injury_callback"],
    text: (s) => { const p=ensureCareerCast(s).physio; return `${p.name} cierra la puerta de la sala médica. Esta vez no es una molestia preventiva: ${s.injury?.label ?? "la lesión"} te obliga a parar. "Ya sé si eres de escuchar o de apretar de más. Lo que hagamos ahora decide cómo vuelves".`; },
    choices: [
      { id:"protocolo",label:"Seguir el plan sin saltarte etapas",outcome:"Aceptas perder días para no perder meses.",apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,8);stat(s,"discipline",4);stat(s,"fitness",3);flag(s,"people_physio_injury_callback",1);} },
      { id:"forzar",label:"Pedir acelerar la vuelta",outcome:"El fisio no está de acuerdo, pero adapta el plan y te hace asumir el riesgo.",apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,-5);stat(s,"fitness",-3);stat(s,"morale",2);flag(s,"people_physio_injury_callback",1);} },
      { id:"preguntar",label:"Pedirle una fecha realista y entender cada fase",outcome:"Sales con una hoja concreta y menos ansiedad que al entrar.",apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,6);stat(s,"morale",3);stat(s,"discipline",2);flag(s,"people_physio_injury_callback",1);} },
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
  {
    id: "people_social_dm_followup",
    kicker: "Semanas después · Fuera del foco",
    title: "El mensaje no se quedó en una noche",
    image: "travel",
    priority: 300,
    category: "life",
    family: "people_social_dm_followup",
    requires: (s) => s.age <= 24 && !!s.flags["social_dm_replied"] && s.sceneCount >= 9 && !s.flags["people_social_dm_followup"],
    text: (s) => { const p=ensureCareerCast(s).social; return `${p.name} vuelve a escribirte. Ya habéis hablado varias veces y propone veros sin publicar nada. "Un café normal. Sin fotos, sin historias y sin convertir esto en una película".`; },
    choices: [
      { id:"quedar",label:"Quedar y conocerla de verdad",hint:"Puede abrir una relación personal persistente",outcome:"La conversación cara a cara es menos perfecta y bastante más real que por mensaje.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,9);flag(s,"people_social_dm_followup",1);flag(s,"social_relationship_open",1);stat(s,"morale",5);note(s,`Conociste en persona a ${p.name} después de varias semanas hablando por redes.`);} },
      { id:"privado",label:"Seguir hablando, pero no quedar todavía",outcome:"Mantienes el hilo abierto sin meterlo aún en tu vida real.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,3);flag(s,"people_social_dm_followup",1);flag(s,"social_thread_slow",1);} },
      { id:"cortar",label:"Decir que prefieres centrarte en el fútbol",outcome:"Lo entiende, aunque la conversación pierde casi toda la cercanía.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,-8);flag(s,"people_social_dm_followup",1);flag(s,"social_thread_closed",1);stat(s,"discipline",3);} },
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
