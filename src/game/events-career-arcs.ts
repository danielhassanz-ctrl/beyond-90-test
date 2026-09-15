import { ensureCareerCast, touch } from "./career-life";
import { ALL_EVENTS } from "./events";
import { flag, note, rel, stat } from "./mutate";
import type { GameEvent } from "./types";

/**
 * Long-form career arcs that deliberately pay off choices made months earlier.
 * These scenes are not quota filler: they only become eligible after the player
 * has authored a clear career plan with the persistent adviser.
 */
export const CAREER_ARC_EVENTS: GameEvent[] = [
  {
    id: "arc_adviser_plan_reckoning",
    kicker: "Meses después · La promesa vuelve",
    title: "El plan que hiciste ya tiene un precio",
    image: "agent",
    priority: 365,
    category: "agent",
    family: "adviser_plan_reckoning",
    requires: (s) => !!s.flags["people_adviser_first_plan"] && s.sceneCount >= 12 && !s.flags["arc_adviser_plan_reckoning"],
    text: (s) => {
      const adviser = ensureCareerCast(s).adviser;
      if (s.flags["career_plan_minutes"]) {
        return `${adviser.name} abre la conversación recordándote vuestra primera línea roja: jugar antes que presumir de escudo. Han pasado meses y ya no vale decirlo en abstracto. "Si de verdad priorizamos minutos, ahora tenemos que aceptar lo que eso puede costar: salir cedido, bajar un escalón o renunciar a esperar eternamente aquí".`;
      }
      if (s.flags["career_plan_continuity"]) {
        return `${adviser.name} te recuerda que elegiste quedarte y ganarte el sitio. "Te apoyé porque dijiste que querías construir algo aquí. Pero paciencia no significa regalar años. Hoy decidimos cuánto tiempo más merece esta apuesta antes de convertir la lealtad en miedo a salir".`;
      }
      return `${adviser.name} recupera una frase que dijiste al principio: escuchar cualquier salto importante. "Ya no eres el chico que solo imaginaba ofertas. Ahora toca decidir qué significa ambición para ti: un escudo mayor, un papel mayor o esperar hasta que ambas cosas coincidan".`;
    },
    choices: [
      {
        id: "mantener_plan",
        label: "Mantener la promesa que hiciste al principio",
        hint: "Tu siguiente gran decisión respetará aquella prioridad",
        outcome: "No cambias el plan porque el contexto se haya vuelto incómodo. Tu asesor lo convierte en criterio real para la próxima ventana.",
        apply: (s) => {
          const adviser = ensureCareerCast(s).adviser;
          touch(adviser, s, 7); rel(s, "agent", 5); stat(s, "discipline", 3);
          flag(s, "arc_adviser_plan_reckoning", 1); flag(s, "career_plan_reaffirmed", 1);
          note(s, `${adviser.name} te pidió revisar vuestro primer plan de carrera y decidiste mantenerlo incluso cuando empezó a tener un coste.`);
        },
      },
      {
        id: "revisar_plan",
        label: "Admitir que tu prioridad ha cambiado",
        hint: "No borra el pasado: abre una tensión nueva con tu asesor",
        outcome: "Tu asesor no te acusa de incoherente, pero te obliga a poner por escrito qué ha cambiado y por qué.",
        apply: (s) => {
          const adviser = ensureCareerCast(s).adviser;
          touch(adviser, s, -2); rel(s, "agent", -2); stat(s, "morale", 2);
          flag(s, "arc_adviser_plan_reckoning", 1); flag(s, "career_plan_revised", 1);
          note(s, `Meses después del primer plan con ${adviser.name}, reconociste que tu prioridad había cambiado.`);
        },
      },
      {
        id: "poner_plazo",
        label: "Poner una fecha límite antes de decidir",
        hint: "La conversación volverá cuando venza el plazo",
        outcome: "Acordáis una última ventana de prueba. Ya no es esperar por esperar: hay una fecha y una condición concreta.",
        apply: (s) => {
          const adviser = ensureCareerCast(s).adviser;
          touch(adviser, s, 4); rel(s, "agent", 3); stat(s, "discipline", 2);
          flag(s, "arc_adviser_plan_reckoning", 1); flag(s, "career_plan_deadline", 1);
          note(s, `${adviser.name} y tú pusiste una fecha límite al primer plan de carrera en vez de dejarlo abierto indefinidamente.`);
        },
      },
    ],
  },
  {
    id: "arc_adviser_plan_consequence",
    kicker: "Más adelante · La conversación pendiente",
    title: "Tu asesor no ha olvidado aquella decisión",
    image: "office",
    priority: 350,
    category: "agent",
    family: "adviser_plan_consequence",
    requires: (s) => !!s.flags["arc_adviser_plan_reckoning"] && s.sceneCount >= 20 && !s.flags["arc_adviser_plan_consequence"],
    text: (s) => {
      const adviser = ensureCareerCast(s).adviser;
      if (s.flags["career_plan_reaffirmed"]) return `${adviser.name} no empieza con una oferta ni con una cifra. Empieza con lo que prometiste: mantener el plan aunque costara. "Ahora que vuelve a doler, necesito saber si aquella decisión era una convicción o solo una frase bonita".`;
      if (s.flags["career_plan_revised"]) return `${adviser.name} vuelve sobre el día en que admitiste que habías cambiado de prioridad. "Cambiar no fue el problema. El problema sería cambiar otra vez sin aprender nada. Dime qué has descubierto de ti desde entonces".`;
      return `${adviser.name} mira la fecha que dejasteis marcada meses atrás. "Se acabó el margen que pediste. No vengo a empujarte a salir ni a quedarte. Vengo a impedir que movamos la portería otra vez porque decidir da miedo".`;
    },
    choices: [
      {
        id: "decidir_con_coherencia",
        label: "Tomar la decisión según lo que has aprendido",
        outcome: "La conversación termina con un criterio claro para el siguiente movimiento. No es el mismo jugador quien decide ahora.",
        apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,6); rel(s,"agent",4); stat(s,"discipline",3); flag(s,"arc_adviser_plan_consequence",1); flag(s,"career_identity_coherent",1); note(s,`${p.name} te obligó a convertir meses de dudas en un criterio claro para tu siguiente paso.`); },
      },
      {
        id: "apostar_por_ti",
        label: "Asumir el riesgo y apostar por ti",
        outcome: "Tu asesor acepta el riesgo porque esta vez no estás improvisando: sabes exactamente qué puedes perder.",
        apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,3); stat(s,"form",3); stat(s,"morale",3); flag(s,"arc_adviser_plan_consequence",1); flag(s,"career_identity_risk",1); },
      },
      {
        id: "pedir_proteccion",
        label: "Pedirle que priorice proteger tu carrera",
        outcome: "Por primera vez le das permiso explícito para frenarte si una oportunidad amenaza con romper más de lo que puede construir.",
        apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,8); rel(s,"agent",6); flag(s,"arc_adviser_plan_consequence",1); flag(s,"career_identity_protected",1); note(s,`Después de meses de decisiones, pediste a ${p.name} que te frenara si una oportunidad ponía en riesgo la trayectoria que estabais construyendo.`); },
      },
    ],
  },
];

let installed = false;
export function installCareerArcEvents(): void {
  if (installed) return;
  const existing = new Set(ALL_EVENTS.map((event) => event.id));
  const missing = CAREER_ARC_EVENTS.filter((event) => !existing.has(event.id));
  if (missing.length) ALL_EVENTS.unshift(...missing);
  installed = true;
}
