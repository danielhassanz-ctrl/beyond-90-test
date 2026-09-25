import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { randomPersonName } from "@/lib/narrative/npcs";

/**
 * Eventos donde el AGENTE/REPRESENTANTE es un personaje activo y conversacional.
 * Aparecen en momentos CLAVE de la carrera: fichajes, ofertas, decisiones importantes.
 *
 * Este archivo se escribió pero nunca se conectó a pickNextEventDynamic —
 * por eso, jugando de verdad, el representante nunca llamaba por nada
 * (ni ofertas de otros clubes, ni consejos de inversión, ni avisos), algo
 * reportado en vivo como "tu repre no te llama para nada ni para
 * oportunidad de inversión". No era código muerto de verdad: era una
 * función completa sin ningún punto de entrada.
 */

interface AgentDialogueTracker {
  lastWeek: number;
}

function getTracker(player: Player): AgentDialogueTracker {
  const raw = player.flags?.agent_dialogue_tracker;
  if (typeof raw !== "string") return { lastWeek: 0 };
  try {
    return JSON.parse(raw) as AgentDialogueTracker;
  } catch {
    return { lastWeek: 0 };
  }
}

export function markAgentDialogueTriggered(player: Player): void {
  if (!player.flags) player.flags = {};
  player.flags.agent_dialogue_tracker = JSON.stringify({ lastWeek: player.week } satisfies AgentDialogueTracker);
}

/**
 * Cooldown de 5 semanas (media temporada) para que el representante no
 * llame todas las semanas, pero sí un par de veces por temporada — igual
 * de espaciado que el resto de eventos "de vez en cuando" del motor.
 */
export function shouldTriggerAgentDialogue(player: Player): boolean {
  if (player.club === NO_CLUB_YET) return false;
  const { lastWeek } = getTracker(player);
  if (lastWeek > 0 && player.week - lastWeek < 5) return false;
  return Math.random() < 0.22;
}

/**
 * No todos los triggers tienen sentido en cualquier momento de la
 * carrera: un consejo de "¿Primera con menos dinero o Segunda con más?"
 * no pega en una superestrella asentada, y "invertir 200k" no pega si el
 * jugador todavía no tiene ni 150k ahorrados. Elige solo entre los que sí
 * encajan con el estado real del jugador.
 */
export function pickEligibleAgentTrigger(player: Player): string | null {
  const fama = player.fama ?? 0;
  const media = player.media ?? 0;
  const patrimonio = player.patrimonio ?? 0;

  const eligible: string[] = [AGENT_EVENT_TRIGGERS.OFFER_FROM_CLUB, AGENT_EVENT_TRIGGERS.WARNING];
  if (fama >= 25) eligible.push(AGENT_EVENT_TRIGGERS.COMPETING_AGENT);
  if (media < 65) eligible.push(AGENT_EVENT_TRIGGERS.TACTICAL_ADVICE);
  if (patrimonio >= 150_000) eligible.push(AGENT_EVENT_TRIGGERS.INVESTMENT_ADVICE);

  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

export const AGENT_EVENT_TRIGGERS = {
  // === CARRERA DEPORTIVA ===
  // El agente te trae una oferta de un club que te quiere
  OFFER_FROM_CLUB: "agent-offer-club",

  // Llega otro agente/agencia queriendo representarte
  COMPETING_AGENT: "agent-competing",

  // El agente te da un consejo táctico: esperar vs. firmar ahora
  TACTICAL_ADVICE: "agent-tactical-advice",

  // El agente negocia extras en tu contrato (bonificaciones, cláusulas)
  CONTRACT_NEGOTIATION: "agent-contract-negotiation",

  // El agente te advierte sobre un club o una oportunidad que suena raro
  WARNING: "agent-warning",

  // === DINERO Y PATRIMONIO ===
  // El agente te propone una inversión o consejo sobre dinero
  INVESTMENT_ADVICE: "agent-investment-advice",

  // El agente habla sobre finanzas durante problemas económicos
  FINANCIAL_CRISIS: "agent-financial-crisis",

  // === VIDA PERSONAL ===
  // Tu pareja/familia está cansada de las mudanzas por tu carrera
  FAMILY_CONFLICT: "agent-family-conflict",

  // Te pide un familiar dinero, el agente te asesora
  FAMILY_MONEY_REQUEST: "agent-family-money",

  // Lesión larga: el agente te asesora psicológicamente
  INJURY_SUPPORT: "agent-injury-support",

  // Presión mediática/fama te está afectando
  FAME_PRESSURE: "agent-fame-pressure",

  // Tienes oferta de un club pero tu pareja no quiere mudarse
  LIFE_CAREER_CONFLICT: "agent-life-career-conflict",
};

/**
 * Genera un evento donde el AGENTE es personaje: da consejo, presenta ofertas,
 * negocia. Estos son momentos clave de la carrera.
 *
 * IMPORTANTE: El agente NO siempre está presente. A veces tomas decisiones por tu cuenta
 * sin consultarle (comprar casa con pareja, irte a otro club por iniciativa propia, etc).
 * El agente aparece ocasionalmente en momentos donde su consejo es relevante o necesario.
 */
export function buildAgentDialogueEvent(
  player: Player,
  trigger: string,
  agentName: string,
): GameEvent | null {
  switch (trigger) {
    case AGENT_EVENT_TRIGGERS.OFFER_FROM_CLUB:
      return {
        id: "agent-offer-club-" + Date.now(),
        category: "representante",
        title: "Tu agente te trae una oportunidad",
        description: `${agentName} te llama: "Tengo algo bueno para ti. Un club de nivel superior está buscando refuerzo en tu posición. No es de los grandes aún, pero es el paso que necesitas para llegar. ¿Hablamos con ellos?"`,
        options: [
          {
            id: "0",
            label: "Adelante, quiero escuchar",
            subtitle: `Que ${agentName} arregle una reunión`,
            consequences: { rel_representante: 3 },
            // No todo lo que trae el representante llega a algo — a veces
            // es puro ruido de mercado que se apaga en un par de semanas.
            // Sin esto, cualquier "oportunidad" siempre acababa siendo
            // fama gratis garantizada, cuando lo pedido explícitamente
            // era justo lo contrario: que a veces sea solo un rumor.
            resolve: {
              baseChance: 0.5,
              statModifier: "media",
              success: {
                text: `La reunión sale bien: el interés era real y ahora hay algo concreto sobre la mesa para valorar en las próximas semanas.`,
                consequences: { fama: 3, moral: 3 },
              },
              fail: {
                text: `Al final era solo ruido de mercado — el club ficha a otro jugador y ${agentName} te lo cuenta con cara de circunstancias. "Pasa constantemente, no te lo tomes a mal."`,
                consequences: { moral: -2 },
              },
            },
          },
          {
            id: "1",
            label: "Esperar un poco más",
            subtitle: "Confiar en que algo mejor llegará",
            consequences: { moral: -2, rel_representante: -1 },
          },
        ],
        isMilestone: false,
      };

    case AGENT_EVENT_TRIGGERS.COMPETING_AGENT:
      return {
        id: "agent-competing-" + Date.now(),
        category: "representante",
        title: "Otro agente quiere representarte",
        description: `Te llama un representante de una agencia grande: "He visto tu progreso. Creo que puedo hacer más por ti que quien te representa ahora. Tengo contactos en los grandes de Europa. ¿Nos vemos?" ${agentName} no lo sabe todavía.`,
        options: [
          {
            id: "0",
            label: "Lealtad primero",
            subtitle: `Rechazar y contarle a ${agentName}`,
            consequences: { rel_representante: 5, fama: -1 },
          },
          {
            id: "1",
            label: "Escuchar la propuesta",
            subtitle: "Ver qué ofrece antes de decidir",
            consequences: { fama: 2, rel_representante: -3 },
          },
          {
            id: "2",
            label: "Cambiar de representante",
            subtitle: "Ir con la agencia grande",
            consequences: { rel_representante: -10, fama: 3, agent_name: randomPersonName() },
          },
        ],
        isMilestone: false,
      };

    case AGENT_EVENT_TRIGGERS.TACTICAL_ADVICE:
      return {
        id: "agent-tactical-" + Date.now(),
        category: "representante",
        title: `${agentName} te da un consejo importante`,
        description: `"Mira, tienes dos opciones. Este club ofrece dinero ahora pero es Segunda División. El otro es Primera pero pagaría menos. A tu edad, ¿qué te hace más profesional: el dinero o los focos?" Te queda claro que tu decisión importa.`,
        options: [
          {
            id: "0",
            label: "Primera División, aunque sea menos dinero",
            subtitle: "Visibilidad > dinero",
            consequences: { fama: 5, patrimonio: -5000, media: 3 },
          },
          {
            id: "1",
            label: "Segunda, pero con dinero asegurado",
            subtitle: "Dinero > visibilidad",
            consequences: { patrimonio: 15000, fama: -2, media: -1 },
          },
        ],
        isMilestone: false,
      };

    case AGENT_EVENT_TRIGGERS.INVESTMENT_ADVICE:
      return {
        id: "agent-investment-" + Date.now(),
        category: "representante",
        title: `${agentName} te habla sobre tu futuro económico`,
        description: `"Estás ganando bien ahora. Pero esto no dura para siempre. Tengo un contacto que maneja inversiones inmobiliarias. O metemos 200k en una vivienda para rentarla después, o lo dejas todo en la cuenta. ¿Qué prefieres?"`,
        options: [
          {
            id: "0",
            label: "Invertir en propiedad",
            subtitle: "Asegurar patrimonio a largo plazo",
            consequences: { patrimonio: -200000, fama: 1 },
          },
          {
            id: "1",
            label: "Guardar el dinero",
            subtitle: "Mantenerlo accesible",
            consequences: { moral: 2 },
          },
        ],
        isMilestone: false,
      };

    case AGENT_EVENT_TRIGGERS.WARNING:
      return {
        id: "agent-warning-" + Date.now(),
        category: "representante",
        title: `${agentName} te advierte`,
        description: `"Hay un club que quiere ficharte, pero me llegó información: crisis financiera, vestuario tóxico, entrenador que sale en junio. La pasta es buena, pero el proyecto es un desastre. Mi consejo: pasa. ¿Confías en mí o quieres verlo tú?"`,
        options: [
          {
            id: "0",
            label: `Confiar en ${agentName}`,
            subtitle: "Rechazar la oferta",
            consequences: { rel_representante: 5 },
          },
          {
            id: "1",
            label: "Quiero escucharlos igual",
            subtitle: "Tomar mi propia decisión",
            consequences: { rel_representante: -2, fama: 1 },
          },
        ],
        isMilestone: false,
      };

    default:
      return null;
  }
}
