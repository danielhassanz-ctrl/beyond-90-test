import { canReceiveSocialDm, ensureCareerCast, touch } from "./career-life";
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
      const who = cast.adviser.name;
      const role = cast.adviserKind === "agent" ? "representante" : cast.adviserKind === "father" ? "padre" : "amigo de confianza";
      return `${who}, tu ${role}, te llama antes de que empiece de verdad la temporada. "A partir de ahora no quiero que firmes, gastes ni rechaces nada sin hablarlo. Esto puede durar veinte años o seis meses. Vamos a llevarlo con cabeza".`;
    },
    choices: [
      { id: "confiar", label: "Darle confianza para guiarte", hint: "Tendrá peso real en mercado y dinero", outcome: "Le das margen. Desde hoy será una voz frecuente en tu carrera.", apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,8); rel(s,"agent",8); flag(s,"people_adviser_intro",1); note(s,`${p.name} empezó a asesorarte desde el inicio de tu carrera.`); } },
      { id: "escuchar", label: "Escuchar, pero decidir siempre tú", hint: "Relación más independiente", outcome: "Acepta. " + '"Yo te doy información; tú cargas con la decisión."', apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,3); rel(s,"agent",3); stat(s,"discipline",2); flag(s,"people_adviser_intro",1); } },
      { id: "marcar_distancia", label: "Decirle que no quieres que controle todo", hint: "Más libertad, menos confianza", outcome: "Hay un silencio incómodo. Seguirá ahí, pero la relación empieza con límites.", apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,-6); rel(s,"agent",-6); stat(s,"morale",2); flag(s,"people_adviser_intro",1); } },
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
    text: (s) => {
      const c=ensureCareerCast(s); return `${c.coach.name} te hace pasar al despacho. No habla de sueños: habla de lo que ve. "Tienes talento, pero ahora mismo estás detrás de gente más hecha. Quiero saber si vas a tener paciencia cuando no juegues".`;
    },
    choices: [
      { id:"paciencia", label:"Decir que te ganarás cada minuto", outcome:"El entrenador asiente y apunta algo en su libreta.", apply:(s)=>{const p=ensureCareerCast(s).coach;touch(p,s,7);rel(s,"coach",7);stat(s,"discipline",3);flag(s,"people_coach_intro",1);} },
      { id:"ambicion", label:"Decir que vienes a ser titular", outcome:"No sonríe. Tampoco le molesta. " + '"Entonces demuéstramelo."', apply:(s)=>{const p=ensureCareerCast(s).coach;touch(p,s,-1);rel(s,"coach",-1);stat(s,"form",4);flag(s,"people_coach_intro",1);} },
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
    text: (s) => { const c=ensureCareerCast(s); return `${c.captain.name}, capitán del equipo, se sienta a tu lado mientras los demás se duchan. "Aquí hay chavales mejores de lo que creen y peores de lo que creen. Si tienes un problema con el míster o con alguien del vestuario, antes de liarla, ven a verme".`; },
    choices: [
      { id:"agradecer",label:"Agradecerle el gesto",outcome:"Te da su número y te mete en el grupo del vestuario.",apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,8);rel(s,"dressing",6);flag(s,"people_captain_intro",1);} },
      { id:"competir",label:"Decirle que no has venido a hacer amigos",outcome:"Se ríe. " + '"Eso dicen todos hasta que necesitan uno."',apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,-4);rel(s,"dressing",-3);stat(s,"form",3);flag(s,"people_captain_intro",1);} },
      { id:"preguntar",label:"Preguntarle quién manda de verdad en el vestuario",outcome:"Te señala dos taquillas y te explica cosas que nadie pone en el contrato.",apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,5);rel(s,"dressing",5);stat(s,"discipline",2);flag(s,"people_captain_intro",1);} },
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
    text: (s) => { const c=ensureCareerCast(s); return `${c.teammate.name} espera a que salgáis del entrenamiento y te propone comer juntos. Juega cerca de tu posición y podría verte como competencia, pero te habla sin rodeos: "Si los dos llegamos, mejor. Aquí solo es imposible".`; },
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
    text: (s) => { const c=ensureCareerCast(s); return `${c.physio.name}, fisioterapeuta del equipo, te frena cuando ibas a volver al gimnasio. "Puedes entrenar hoy y perder tres semanas, o parar veinte minutos y llegar al sábado. Tú eliges, pero luego no me digas que no te avisé".`; },
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
    text: (s) => { const c=ensureCareerCast(s); return `${c.social.name} ha respondido a una historia después de uno de tus primeros partidos con algo que parece inocente: "Buen partido 😉". No la conoces personalmente. Tienes el mensaje abierto y tu compañero acaba de ver la pantalla.`; },
    choices: [
      { id:"contestar",label:"Contestarle y seguir la conversación",hint:"Puede abrir un hilo personal",outcome:"La conversación dura más de lo previsto. No sabes todavía si es una anécdota o el principio de algo.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,8);flag(s,"social_dm_intro",1);flag(s,"social_dm_replied",1);stat(s,"morale",4);note(s,`Contestaste al primer mensaje de ${p.name} en redes.`);} },
      { id:"ignorar",label:"Dejarlo en visto",outcome:"Cierras el móvil. Tu compañero te llama frío durante una semana.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,-2);flag(s,"social_dm_intro",1);stat(s,"discipline",2);} },
      { id:"ensenar",label:"Enseñárselo a tu compañero y bromear",outcome:"La captura no sale del vestuario. De momento.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,2);flag(s,"social_dm_intro",1);flag(s,"social_dm_shared",1);rel(s,"dressing",4);stat(s,"morale",3);} },
    ],
  },
];
