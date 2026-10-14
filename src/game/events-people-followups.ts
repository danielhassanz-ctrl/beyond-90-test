import { ensureCareerCast, touch } from "./career-life";
import { ALL_EVENTS } from "./events";
import { flag, note, rel, stat } from "./mutate";
import type { GameEvent } from "./types";

const PEOPLE_FOLLOWUPS: GameEvent[] = [
  {
    id: "people_captain_dressing_room_test",
    kicker: "Vestuario · Unas semanas después",
    title: "El capitán cumple lo que te prometió",
    image: "locker",
    priority: 315,
    category: "club",
    family: "people_captain_followup",
    requires: (s) => s.age <= 22 && !!s.flags["people_captain_intro"] && s.sceneCount >= 7 && !s.flags["people_captain_dressing_room_test"],
    text: (s) => {
      const c = ensureCareerCast(s);
      const warm = c.captain.relation >= 52;
      return warm
        ? `${c.captain.name} te aparta después del entrenamiento. Un veterano está molesto porque empiezas a quitar minutos. "Te dije que vinieras antes de que esto se pudra. ¿Quieres que hable yo, prefieres hacerlo tú o lo dejamos en el césped?"`
        : `${c.captain.name} te espera en la puerta del vestuario. La relación entre vosotros no empezó fácil, pero ahora hay un problema real: un veterano está molesto porque empiezas a quitar minutos. "No hace falta que nos caigamos bien. Sí hace falta que esto no rompa al grupo."`;
    },
    choices: [
      { id:"capitan",label:"Pedirle al capitán que medie",hint:"Refuerza el vínculo con él",outcome:"Habla con el veterano sin convertirte en protagonista del conflicto.",apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,7);rel(s,"dressing",5);flag(s,"people_captain_dressing_room_test",1);note(s,`${p.name} medió por ti en tu primer conflicto serio de vestuario.`);} },
      { id:"yo",label:"Hablar tú directamente con el veterano",hint:"Más riesgo, más autonomía",outcome:"La conversación es incómoda, pero deja de crecer por detrás.",apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,2);stat(s,"discipline",3);flag(s,"people_captain_dressing_room_test",1);flag(s,"handled_dressing_conflict_yourself",1);} },
      { id:"campo",label:"No hablar: competir y responder jugando",hint:"Puede tensar el vestuario",outcome:"El mensaje queda claro en el campo. Fuera de él, el ambiente no mejora.",apply:(s)=>{const p=ensureCareerCast(s).captain;touch(p,s,-3);rel(s,"dressing",-4);stat(s,"form",3);flag(s,"people_captain_dressing_room_test",1);} },
    ],
  },
  {
    id: "people_teammate_first_crisis",
    kicker: "Después de un partido malo",
    title: "El compañero que elegiste vuelve a aparecer",
    image: "locker",
    priority: 305,
    category: "life",
    family: "people_teammate_followup",
    requires: (s) => s.age <= 23 && !!s.flags["people_teammate_intro"] && s.sceneCount >= 9 && !s.flags["people_teammate_first_crisis"] && s.form <= 62,
    text: (s) => {
      const c=ensureCareerCast(s);
      if (c.teammate.relation >= 55) return `${c.teammate.name} te espera cuando casi todos se han ido. "Hoy has estado fatal. Mañana entrenamos antes que nadie y se acabó darle vueltas." No intenta animarte: intenta sacarte de ahí.`;
      return `${c.teammate.name} se cruza contigo al salir. Entre vosotros siempre hubo más competencia que amistad. "Te están comiendo la cabeza. Si quieres recuperar el sitio, mañana llego antes. Tú decides si vienes."`;
    },
    choices: [
      { id:"juntos",label:"Aceptar y entrenar juntos al día siguiente",outcome:"Por primera vez la relación pesa de verdad en tu rendimiento.",apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,8);rel(s,"dressing",4);stat(s,"form",7);flag(s,"people_teammate_first_crisis",1);note(s,`${p.name} te ayudó a salir de una mala racha al principio de tu carrera.`);} },
      { id:"solo",label:"Agradecerlo, pero trabajar por tu cuenta",outcome:"Lo entiende. Mantienes distancia sin romper nada.",apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,1);stat(s,"discipline",3);stat(s,"form",3);flag(s,"people_teammate_first_crisis",1);} },
      { id:"rechazar",label:"Decir que no necesitas ayuda",outcome:"Asiente y se marcha. La siguiente conversación tardará en llegar.",apply:(s)=>{const p=ensureCareerCast(s).teammate;touch(p,s,-6);rel(s,"dressing",-3);flag(s,"people_teammate_first_crisis",1);} },
    ],
  },
  {
    id: "people_physio_injury_callback",
    kicker: "Sala médica · Ahora sí es serio",
    title: "El fisio recuerda aquella primera conversación",
    image: "injury",
    priority: 345,
    category: "medical",
    family: "people_physio_followup",
    requires: (s) => !!s.flags["people_physio_intro"] && !!s.injury && !s.flags["people_physio_injury_callback"],
    text: (s) => {
      const c=ensureCareerCast(s);
      const trusted=c.physio.relation>=54;
      return trusted
        ? `${c.physio.name} deja el informe sobre la camilla. "¿Te acuerdas de cuando te dije que veinte minutos podían ahorrarte tres semanas? Ahora necesito que me hagas caso de verdad. Podemos apurar o podemos recuperar bien."`
        : `${c.physio.name} revisa las pruebas y no tarda en recordarte vuestra relación complicada. "No voy a decirte lo que quieres oír. Si aceleramos porque estás nervioso, el riesgo es tuyo también."`;
    },
    choices: [
      { id:"plan",label:"Seguir exactamente el plan del fisio",hint:"Menos prisa, más seguridad",outcome:"Aceptas perder días ahora para no hipotecar meses después.",apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,9);stat(s,"discipline",4);stat(s,"fitness",5);flag(s,"people_physio_injury_callback",1);note(s,`${p.name} dirigió tu recuperación cuando llegó una lesión de verdad.`);} },
      { id:"apurar",label:"Pedirle que acorte los plazos",hint:"Más riesgo por volver antes",outcome:"No te promete milagros. Ajusta el plan, pero deja claro que estás asumiendo riesgo.",apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,-4);stat(s,"form",2);stat(s,"fitness",-4);flag(s,"people_physio_injury_callback",1);flag(s,"rushed_injury_return",1);} },
      { id:"segunda_opinion",label:"Pedir una segunda opinión médica",outcome:"No rompe la relación, pero el fisio entiende que todavía no confías del todo.",apply:(s)=>{const p=ensureCareerCast(s).physio;touch(p,s,-1);stat(s,"discipline",2);flag(s,"people_physio_injury_callback",1);} },
    ],
  },
  {
    id: "people_social_dm_followup",
    kicker: "Una semana después · 00:17",
    title: "El mensaje no se quedó en una reacción",
    image: "press",
    priority: 300,
    category: "gossip",
    family: "people_social_followup",
    requires: (s) => !!s.flags["social_dm_replied"] && s.sceneCount >= 8 && !s.flags["people_social_dm_followup"],
    text: (s) => {
      const c=ensureCareerCast(s);
      return `${c.social.name} vuelve a escribirte. Esta vez no habla de fútbol: "Cuando tengas una tarde libre, te invito a un café y me cuentas si eres tan serio como pareces en las entrevistas". Ya no es un mensaje suelto; tienes que decidir qué lugar ocupa esto en tu vida.`;
    },
    choices: [
      { id:"cita",label:"Quedar con ella con discreción",hint:"Abre un arco personal real",outcome:"Elegís un sitio lejos de cámaras. Por primera vez tu vida fuera del fútbol empieza a tener continuidad.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,10);stat(s,"morale",5);flag(s,"people_social_dm_followup",1);flag(s,"social_arc_active",1);note(s,`Tu relación con ${p.name} pasó de las redes a la vida real.`);} },
      { id:"despacio",label:"Seguir hablando, pero sin quedar todavía",outcome:"La conversación sigue viva sin convertirla aún en una relación.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,4);flag(s,"people_social_dm_followup",1);flag(s,"social_arc_slow",1);} },
      { id:"cortar",label:"Decirle que ahora mismo no quieres distraerte",outcome:"Lo acepta. No hay drama; simplemente eliges otra prioridad.",apply:(s)=>{const p=ensureCareerCast(s).social;touch(p,s,-5);stat(s,"discipline",3);flag(s,"people_social_dm_followup",1);flag(s,"social_arc_closed",1);} },
    ],
  },
  {
    id: "people_coach_role_review",
    kicker: "Mitad de temporada · Despacho",
    title: "El míster revisa lo que le prometiste",
    image: "office",
    priority: 320,
    category: "club",
    family: "people_coach_followup",
    requires: (s) => s.age <= 22 && !!s.flags["people_coach_intro"] && s.sceneCount >= 10 && !s.flags["people_coach_role_review"],
    text: (s) => {
      const c=ensureCareerCast(s);
      const good=s.form>=65;
      return good
        ? `${c.coach.name} cierra la puerta. "Al principio te pedí paciencia. Ahora te has ganado otra conversación: más minutos también significa más responsabilidad. Quiero saber si estás preparado para que te exija como a uno importante."`
        : `${c.coach.name} te enseña dos clips del último mes. "No te estoy castigando. Pero aquello que hablamos en pretemporada sigue pendiente. Si quieres más minutos, necesito una reacción concreta, no una frase."`;
    },
    choices: [
      { id:"responsabilidad",label:"Aceptar más responsabilidad sin exigir privilegios",outcome:"El entrenador sale convencido de que puede darte más peso sin perderte por el camino.",apply:(s)=>{const p=ensureCareerCast(s).coach;touch(p,s,7);rel(s,"coach",6);stat(s,"discipline",3);flag(s,"people_coach_role_review",1);note(s,`${p.name} revisó contigo tu rol a mitad de una de tus primeras temporadas.`);} },
      { id:"minutos",label:"Decirle que necesitas jugar más ya",outcome:"La ambición queda clara. Ahora el rendimiento tendrá que sostenerla.",apply:(s)=>{const p=ensureCareerCast(s).coach;touch(p,s,-1);stat(s,"form",4);flag(s,"people_coach_role_review",1);flag(s,"demanded_more_minutes",1);} },
      { id:"plan",label:"Pedir objetivos concretos para las próximas semanas",outcome:"Salís del despacho con métricas y tareas claras, no con promesas vagas.",apply:(s)=>{const p=ensureCareerCast(s).coach;touch(p,s,5);rel(s,"coach",4);stat(s,"overall",1);flag(s,"people_coach_role_review",1);} },
    ],
  },
];

let installed=false;
export function installPeopleFollowups():void {
  if(installed) return;
  const existing=new Set(ALL_EVENTS.map((event)=>event.id));
  const missing=PEOPLE_FOLLOWUPS.filter((event)=>!existing.has(event.id));
  if(missing.length) ALL_EVENTS.unshift(...missing);
  installed=true;
}
