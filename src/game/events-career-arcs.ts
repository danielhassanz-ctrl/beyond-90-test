import { ensureCareerCast, touch } from "./career-life";
import { ALL_EVENTS } from "./events";
import { flag, note, rel, stat } from "./mutate";
import type { GameEvent, GameState } from "./types";

function careerPressure(s: GameState): "stalled" | "breaking" | "steady" {
  if (s.stage !== "first" || s.form <= 43 || s.rel.coach <= 42) return "stalled";
  if (s.stage === "first" && (s.form >= 66 || s.overall >= 73 || s.fame >= 58)) return "breaking";
  return "steady";
}

function planReality(s: GameState): string {
  const pressure = careerPressure(s);
  if (s.flags["career_plan_minutes"]) {
    if (pressure === "stalled") return "Dijimos minutos. Hoy sigues sin una ruta clara al primer equipo. Si mantenemos la palabra, tengo que mover una cesión o una salida donde juegues de verdad";
    if (pressure === "breaking") return "Dijimos minutos y los estás encontrando aquí. Irnos ahora solo por movernos sería traicionar el motivo por el que hicimos aquel plan";
    return "Dijimos minutos antes que escudo. Hay progreso, pero todavía no suficiente como para fingir que el problema está resuelto";
  }
  if (s.flags["career_plan_continuity"]) {
    if (pressure === "stalled") return "Elegiste quedarte y ganarte el sitio, pero la paciencia ya está empezando a costarte desarrollo. Lealtad no puede significar desaparecer del campo";
    if (pressure === "breaking") return "Elegiste construir aquí y por fin estás recibiendo una respuesta deportiva. Eso cambia la conversación: ahora salir también tendría un coste";
    return "Elegiste quedarte. La apuesta sigue viva, pero hoy necesitamos poner una condición concreta para que no se convierta en miedo a cambiar";
  }
  if (pressure === "stalled") return "Me pediste escuchar saltos importantes. Ahora mismo el salto importante quizá no sea a un club más grande, sino a un sitio donde tu carrera vuelva a avanzar";
  if (pressure === "breaking") return "Me pediste escuchar cualquier salto importante. Precisamente por eso no voy a confundir una oferta más grande con una carrera mejor cuando aquí estás creciendo";
  return "Me pediste ambición. Hoy toca definirla: más escudo, más minutos o un proyecto que te dé las dos cosas";
}

/** Long-form arcs: a choice returns only when the player's real career has changed its meaning. */
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
      return `${adviser.name} deja el móvil boca abajo. No viene con una frase genérica: compara lo que prometisteis al principio con tu situación de hoy. \"${planReality(s)}. Decide si aquel plan sigue mandando o si has cambiado de jugador.\"`;
    },
    choices: [
      {
        id: "mantener_plan", label: "Mantener la promesa que hiciste al principio", hint: "Tu siguiente gran decisión respetará aquella prioridad",
        outcome: "No cambias el plan porque el contexto se haya vuelto incómodo. Tu asesor lo convierte en criterio real para la próxima ventana.",
        apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,7); rel(s,"agent",5); stat(s,"discipline",3); flag(s,"arc_adviser_plan_reckoning",1); flag(s,"career_plan_reaffirmed",1); flag(s,"career_plan_pressure_at_reckoning",careerPressure(s)==="stalled"?-1:careerPressure(s)==="breaking"?1:0); note(s,`${p.name} te pidió revisar vuestro primer plan frente a tu situación deportiva real y decidiste mantenerlo.`); },
      },
      {
        id: "revisar_plan", label: "Admitir que tu prioridad ha cambiado", hint: "No borra el pasado: abre una tensión nueva con tu asesor",
        outcome: "Tu asesor no te acusa de incoherente, pero te obliga a explicar qué cambió en el campo para que cambiara tu prioridad.",
        apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,-2); rel(s,"agent",-2); stat(s,"morale",2); flag(s,"arc_adviser_plan_reckoning",1); flag(s,"career_plan_revised",1); flag(s,"career_plan_pressure_at_reckoning",careerPressure(s)==="stalled"?-1:careerPressure(s)==="breaking"?1:0); note(s,`Meses después del primer plan con ${p.name}, reconociste que tu prioridad había cambiado por cómo estaba evolucionando tu carrera.`); },
      },
      {
        id: "poner_plazo", label: "Poner una fecha límite antes de decidir", hint: "La conversación volverá cuando venza el plazo",
        outcome: "Acordáis una última ventana de prueba con una condición deportiva concreta. Ya no es esperar por esperar.",
        apply: (s) => { const p=ensureCareerCast(s).adviser; touch(p,s,4); rel(s,"agent",3); stat(s,"discipline",2); flag(s,"arc_adviser_plan_reckoning",1); flag(s,"career_plan_deadline",1); flag(s,"career_plan_pressure_at_reckoning",careerPressure(s)==="stalled"?-1:careerPressure(s)==="breaking"?1:0); note(s,`${p.name} y tú pusiste una fecha límite al primer plan de carrera.`); },
      },
    ],
  },
  {
    id: "arc_adviser_plan_consequence",
    kicker: "Más adelante · La conversación pendiente",
    title: "La realidad responde a aquella decisión",
    image: "office",
    priority: 350,
    category: "agent",
    family: "adviser_plan_consequence",
    requires: (s) => !!s.flags["arc_adviser_plan_reckoning"] && s.sceneCount >= 20 && !s.flags["arc_adviser_plan_consequence"],
    text: (s) => {
      const adviser=ensureCareerCast(s).adviser;
      const before=s.flags["career_plan_pressure_at_reckoning"] ?? 0;
      const now=careerPressure(s)==="stalled"?-1:careerPressure(s)==="breaking"?1:0;
      const change=now>before ? "Desde aquella charla tu situación deportiva ha mejorado" : now<before ? "Desde aquella charla tu situación deportiva ha empeorado" : "Desde aquella charla la situación apenas se ha movido";
      const prior=s.flags["career_plan_reaffirmed"] ? "decidiste mantener el plan" : s.flags["career_plan_revised"] ? "decidiste cambiar de prioridad" : "pediste una última ventana antes de decidir";
      return `${adviser.name} abre sus notas y te devuelve dos hechos, no un discurso. ${change}; y ${prior}. \"Ahora sí tenemos información nueva. No quiero que repitas la decisión anterior por orgullo: quiero que decidas qué hacemos con lo que ha pasado desde entonces.\"`;
    },
    choices: [
      { id:"decidir_con_coherencia", label:"Actuar según lo que ha demostrado el campo", outcome:"El siguiente movimiento tendrá que encajar con la evolución real de tu carrera, no solo con una promesa antigua.", apply:(s)=>{const p=ensureCareerCast(s).adviser;touch(p,s,6);rel(s,"agent",4);stat(s,"discipline",3);flag(s,"arc_adviser_plan_consequence",1);flag(s,"career_identity_coherent",1);note(s,`${p.name} te obligó a contrastar tu plan con lo que realmente había ocurrido en el campo.`);} },
      { id:"apostar_por_ti", label:"Asumir el riesgo aunque la evidencia no sea perfecta", outcome:"Tu asesor acepta el riesgo porque esta vez sabes qué parte de la decisión es convicción y qué parte es apuesta.", apply:(s)=>{const p=ensureCareerCast(s).adviser;touch(p,s,3);stat(s,"form",3);stat(s,"morale",3);flag(s,"arc_adviser_plan_consequence",1);flag(s,"career_identity_risk",1);} },
      { id:"pedir_proteccion", label:"Pedirle que te frene si estás decidiendo por ego", outcome:"Le das permiso para enfrentarse a ti si el siguiente movimiento amenaza con romper la trayectoria que estáis construyendo.", apply:(s)=>{const p=ensureCareerCast(s).adviser;touch(p,s,8);rel(s,"agent",6);flag(s,"arc_adviser_plan_consequence",1);flag(s,"career_identity_protected",1);note(s,`Pediste a ${p.name} que te frenara si el ego pesaba más que la carrera en tu siguiente decisión.`);} },
    ],
  },
];

let installed=false;
export function installCareerArcEvents(): void {
  if(installed)return;
  const existing=new Set(ALL_EVENTS.map((event)=>event.id));
  const missing=CAREER_ARC_EVENTS.filter((event)=>!existing.has(event.id));
  if(missing.length)ALL_EVENTS.unshift(...missing);
  installed=true;
}
