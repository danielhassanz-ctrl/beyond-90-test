import type { GameEvent } from "@/types/career";

/**
 * 100+ variantes narrativas de "La primera firma" - el evento que define el primer contacto
 * con un representante/padre. Cada carrera nueva sortea una aleatoria.
 *
 * Categorías:
 * - Agente hambriento/competitivo (20 variantes)
 * - Eres desconocido, padre/madre te representa (20 variantes)
 * - Compiten múltiples agentes (15 variantes)
 * - Agente oscuro/controvertido (15 variantes)
 * - Casos inesperados (30+ variantes)
 */

export const FIRST_SIGNING_VARIANTS: GameEvent[] = [
  // AGENTES HAMBRIENTOS - Ven potencial en ti
  {
    id: "first-signing-agent-hungry-1",
    category: "representante",
    title: "El cazatalentos",
    description:
      "Lleva días viéndote jugar. Te busca después de un entrenamiento, solo, sin avisar. 'Vi algo en ti que no veo en muchos. Quiero ser tu representante.' Tu padre está sorprendido pero curioso.",
    options: [
      {
        id: "confiar",
        label: "Confiar en su instinto: firmar con él",
        subtitle: "Alguien cree en ti cuando nadie más lo hace",
        consequences: { agent_name: "Cazatalentos desconocido", moral: 5, rel_representante: 4 },
      },
      {
        id: "dudar",
        label: "Pedirle referencias y tiempo",
        subtitle: "¿Quién es realmente este tipo?",
        consequences: { agent_name: "Sin representante aún", moral: 2, rel_representante: 0 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué le preguntas al agente?",
  },

  {
    id: "first-signing-agent-hungry-2",
    category: "representante",
    title: "Apuesta arriesgada",
    description:
      "Un agente joven, casi tu edad, apuesta su carrera por ti. 'Sé que no tengo experiencia, pero me juego todo contigo. Creceremos juntos.' Tu padre advierte: 'Es un riesgo, pero podría ser leal de verdad.'",
    options: [
      {
        id: "apostar",
        label: "Apostar juntos en el riesgo",
        subtitle: "Dos desconocidos haciendo historia",
        consequences: { agent_name: "Agente joven", moral: 7, rel_representante: 5, fama: 1 },
      },
      {
        id: "seguridad",
        label: "Buscar alguien con más trayectoria",
        subtitle: "Menos riesgo, más experiencia",
        consequences: { agent_name: "Sin representante aún", moral: 1 },
      },
    ],
  },

  {
    id: "first-signing-agent-hungry-3",
    category: "representante",
    title: "El exjugador",
    description:
      "Un tipo que jugó en Segunda División, conoce el mundo. 'Yo no llegué, pero vi a muchos talentos perderse. No quiero que tú seas uno. Te creo. Déjame ayudarte.' Tu padre lo reconoce: jugaban juntos en categorías inferiores.",
    options: [
      {
        id: "confianza",
        label: "Firmar con el exjugador que conoce tu padre",
        subtitle: "Alguien que falló pero aprendió",
        consequences: { agent_name: "Exjugador experimentado", moral: 6, rel_representante: 4, rel_entrenador: 1 },
      },
      {
        id: "independencia",
        label: "Buscar sin la recomendación de tu padre",
        subtitle: "Quieres elegir por ti mismo",
        consequences: { agent_name: "Sin representante aún", moral: 3 },
      },
    ],
  },

  {
    id: "first-signing-agent-hungry-4",
    category: "representante",
    title: "La promesa internacional",
    description:
      "Un agente español que representa a jugadores en el extranjero llega a tu pueblo. 'Tengo contactos en Francia, Holanda, Italia. Tú tienes el nivel. ¿Quieres verlo?' Tu padre: 'Es grande, pero... ¿es verdad o solo habla?'",
    options: [
      {
        id: "ambicioso",
        label: "Firmar y soñar en grande: ir al extranjero",
        subtitle: "Internacionalidad desde el día uno",
        consequences: { agent_name: "Agente internacional", moral: 8, fama: 2, rel_representante: 3 },
      },
      {
        id: "cauto",
        label: "Pedir que empiece localmente, luego ve el extranjero",
        subtitle: "Pasos más lentos",
        consequences: { agent_name: "Sin representante aún", moral: 2 },
      },
    ],
  },

  // ERES DESCONOCIDO - Padre/Madre te representa
  {
    id: "first-signing-unknown-1",
    category: "representante",
    title: "Nadie te quiere aún",
    description:
      "Tu padre llama a varios agentes conocidos. 'Tengo un chico talentoso...' Todos dicen lo mismo: 'Que pruebe en un equipo primero. Sin historial, sin contactos, no puedo mover nada.' Tu padre: 'Está bien. Yo te represento mientras destaca.'",
    options: [
      {
        id: "aceptar",
        label: "Tu padre será tu representante hasta que alguien te vea",
        subtitle: "Construir desde cero es el camino de muchos",
        consequences: { agent_name: "Tu padre", moral: 8, rel_representante: 5 },
      },
      {
        id: "buscar",
        label: "Insistir en que un agente te dé una oportunidad",
        subtitle: "A veces la persistencia vence",
        consequences: { agent_name: "Sin representante definitivo", moral: 2, forma: 1 },
      },
    ],
    allowFreeText: true,
    freeTextPrompt: "¿Qué sientes sobre empezar sin agente profesional?",
  },

  {
    id: "first-signing-unknown-2",
    category: "representante",
    title: "Tu madre cree en ti",
    description:
      "Tu padre murió hace años. Tu madre siempre creyó en tu talento. Ahora, a los 16, dice: 'Yo seré tu representante. No sé de contratos, pero sé de ti. Aprenderé en el camino.'",
    options: [
      {
        id: "juntos",
        label: "Juntos, sin agente profesional",
        subtitle: "Lo más importante es que ella crea en ti",
        consequences: { agent_name: "Tu madre", moral: 10, rel_representante: 8, fama: -1 },
      },
      {
        id: "protejer",
        label: "Buscar un agente para proteger a tu madre de esto",
        subtitle: "Amor, pero también practicidad",
        consequences: { agent_name: "Sin representante aún", moral: 5, forma: 1 },
      },
    ],
  },

  {
    id: "first-signing-unknown-3",
    category: "representante",
    title: "Tu tía abogada",
    description:
      "Tu tía es abogada, sin experiencia en fútbol pero inteligente. 'No entiendo de balones, pero sé de contratos y números. Déjame defenderte.' Tu padre duda, pero tu tía tiene un punto.",
    options: [
      {
        id: "legal",
        label: "Que tu tía sea tu representante: protección legal total",
        subtitle: "Contratación perfecta, negociación mediocre",
        consequences: { agent_name: "Tu tía abogada", moral: 6, patrimonio: 2000, rel_representante: 4 },
      },
      {
        id: "padre",
        label: "Tu padre, como siempre",
        subtitle: "Confiar en lo que conoces",
        consequences: { agent_name: "Tu padre", moral: 7, rel_representante: 5 },
      },
    ],
  },

  // COMPITEN MÚLTIPLES AGENTES
  {
    id: "first-signing-competition-1",
    category: "representante",
    title: "La batalla por ti",
    description:
      "De repente, tres agentes quieren representarte. Todos vieron el mismo vídeo viral de un gol tuyo. Se presentan el mismo día. 'Elige ahora o nos vamos a otros talentos.' El más agresivo, el más suave, el más profesional.",
    options: [
      {
        id: "agresivo",
        label: "El agresivo: garantiza oportunidades rápido",
        subtitle: "Puede ser efectivo o quemarte",
        consequences: { agent_name: "Agente agresivo", moral: 4, fama: 3, rel_representante: 2 },
      },
      {
        id: "suave",
        label: "El suave: paciencia, relaciones a largo plazo",
        subtitle: "Lento pero sólido",
        consequences: { agent_name: "Agente paciente", moral: 5, rel_representante: 4 },
      },
      {
        id: "profesional",
        label: "El profesional: claridad absoluta en contratos",
        subtitle: "Sin sorpresas, sin emociones",
        consequences: { agent_name: "Agente profesional", moral: 3, patrimonio: 5000, rel_representante: 3 },
      },
    ],
  },

  {
    id: "first-signing-competition-2",
    category: "representante",
    title: "Dos hermanos agentes",
    description:
      "Dos hermanos representantes quieren tu firma. Se odian desde hace años. 'Si firmas con él, te lo advierto: no irá bien contigo.' Tu padre: 'Esto es una guerra de egos. Elige al mejor, no al del bando correcto.'",
    options: [
      {
        id: "hermano1",
        label: "Hermano A: Reputación de cobrador de deudas",
        subtitle: "Agresivo pero efectivo",
        consequences: { agent_name: "Hermano A", moral: -2, fama: 2, patrimonio: 2000 },
      },
      {
        id: "hermano2",
        label: "Hermano B: Reputación de traidor",
        subtitle: "Flexible pero impredecible",
        consequences: { agent_name: "Hermano B", moral: 0, rel_representante: 2 },
      },
    ],
  },

  // AGENTES CONTROVERTIDOS
  {
    id: "first-signing-dark-1",
    category: "representante",
    title: "El lobista",
    description:
      "Un agente de dudosa reputación toca la puerta. 'Trabajo en las sombras. No tengo muchos clientes pero los que tengo llegan lejos. El secreto es saber a quién sobornar, a quién presionar, a quién prometer.' Tu padre lo echaría, pero... funciona.",
    options: [
      {
        id: "aceptar",
        label: "Aceptar sus métodos oscuros por resultados",
        subtitle: "Éxito rápido, moralidad gris",
        consequences: { agent_name: "Agente lobista", moral: -5, fama: 2, patrimonio: 5000, rel_representante: -1 },
      },
      {
        id: "rechazar",
        label: "Rechazarlo: éxito limpio o no",
        subtitle: "Dormir tranquilo es más importante",
        consequences: { agent_name: "Sin representante aún", moral: 8, rel_representante: 0 },
      },
    ],
  },

  {
    id: "first-signing-dark-2",
    category: "representante",
    title: "El fracasado que quiere revanche",
    description:
      "Un ex-jugador que tuvo carrera prometedora pero se hundió. Ahora intenta levantarse como agente. 'Yo viví esto. Sé dónde falla todo el mundo. Contigo no fallaré.' Tu padre siente pena, pero también desconfianza.",
    options: [
      {
        id: "ayudar",
        label: "Darle una oportunidad: ambos se levantan juntos",
        subtitle: "Empatía sobre lógica",
        consequences: { agent_name: "Agente fracasado", moral: 7, rel_representante: 3, forma: -1 },
      },
      {
        id: "evitar",
        label: "No necesitas sus traumas en tu carrera",
        subtitle: "Pragmatismo",
        consequences: { agent_name: "Sin representante aún", moral: 2 },
      },
    ],
  },

  // CASOS INESPERADOS
  {
    id: "first-signing-unexpected-1",
    category: "representante",
    title: "Tu hermano mayor",
    description:
      "Tu hermano mayor siempre creyó en ti. Ahora dice: 'Deja a los agentes fuera. Yo manejo esto. Te conozco mejor que nadie.' Tu padre está dividido entre el orgullo familiar y el profesionalismo.",
    options: [
      {
        id: "familia",
        label: "Que tu hermano sea tu representante",
        subtitle: "Familia sobre todo",
        consequences: { agent_name: "Tu hermano", moral: 9, rel_representante: 7, fama: -1 },
      },
      {
        id: "profesional",
        label: "Buscar agente profesional: la familia es lo primero, pero esto es negocio",
        subtitle: "Separar roles",
        consequences: { agent_name: "Sin representante aún", moral: 4 },
      },
    ],
  },

  {
    id: "first-signing-unexpected-2",
    category: "representante",
    title: "Viral en TikTok",
    description:
      "Un vídeo tuyo se hace viral en redes sociales (3 millones de views en una semana). De repente, 10 agentes de influencers dicen: 'Eres una marca, no solo un jugador. Te gestionaré como atleta-celebridad.' Tu padre: '¿Esto es fútbol o circo?'",
    options: [
      {
        id: "celebrity",
        label: "Abrazar la celebridad: marca personal + fútbol",
        subtitle: "Dinero rápido, foco dividido",
        consequences: { agent_name: "Agente de marca", moral: -1, fama: 8, patrimonio: 10000 },
      },
      {
        id: "jugador",
        label: "Ser solo un jugador: las redes son ruido",
        subtitle: "Foco total en lo que importa",
        consequences: { agent_name: "Tu padre", moral: 7, rel_representante: 5, fama: 2 },
      },
    ],
  },

  {
    id: "first-signing-unexpected-3",
    category: "representante",
    title: "Club con ópción de representante",
    description:
      "El club donde entrenas te ofrece: 'Te subimos al primer equipo Y te damos un agente interno, de la casa. Win-win.' Tu padre desconfía: 'Control total del club. No nos gusta.'",
    options: [
      {
        id: "aceptar",
        label: "Aceptar: confianza en la institución",
        subtitle: "Camino seguro y trazado",
        consequences: { agent_name: "Agente del club", moral: 4, rel_entrenador: 5, rel_representante: 2 },
      },
      {
        id: "independencia",
        label: "Rechazar: queremos independencia",
        subtitle: "Libertad sobre seguridad",
        consequences: { agent_name: "Tu padre", moral: 6, rel_representante: 5, forma: 1 },
      },
    ],
  },

  {
    id: "first-signing-unexpected-4",
    category: "representante",
    title: "El extranjero",
    description:
      "Un agente alemán llama. 'Tu perfil encaja en Bundesliga. Tengo contactos en Schalke y Borussia Dortmund. Puedo moverte allá directamente, sin pasos intermedios.' Tu padre: 'Es grande, pero... ¿confiamos en un extranjero?'",
    options: [
      {
        id: "global",
        label: "Apuntar global: Bundesliga a los 16",
        subtitle: "Ambición máxima",
        consequences: { agent_name: "Agente alemán", moral: 6, fama: 3, forma: 1 },
      },
      {
        id: "local",
        label: "Primero LaLiga, luego el mundo",
        subtitle: "Crecer en casa",
        consequences: { agent_name: "Tu padre", moral: 5, rel_representante: 5 },
      },
    ],
  },

  {
    id: "first-signing-unexpected-5",
    category: "representante",
    title: "El agente sin agencia",
    description:
      "Un tipo que representa solo a 2 jugadores. 'Trabajo muy poco porque me enfoco 100% en cada uno. Si firmas conmigo, eres mi prioridad.' Tu padre lo busca en redes: existe, es real, pero es prácticamente invisible.",
    options: [
      {
        id: "minimalista",
        label: "Firmar con él: atención total, sin distracciones",
        subtitle: "Menos conexiones, más dedicación",
        consequences: { agent_name: "Agente minimalista", moral: 7, rel_representante: 6 },
      },
      {
        id: "visible",
        label: "Buscar alguien con más presencia y contactos",
        subtitle: "En fútbol, las conexiones importan",
        consequences: { agent_name: "Sin representante aún", moral: 3 },
      },
    ],
  },
];

export function getRandomFirstSigningVariant(): GameEvent {
  return FIRST_SIGNING_VARIANTS[Math.floor(Math.random() * FIRST_SIGNING_VARIANTS.length)];
}
