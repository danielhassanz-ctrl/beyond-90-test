import type { Interpretation, Intent } from "./types";

/**
 * Intérprete local de respuestas libres.
 * Clasifica cualquier texto en una intención con tono e intensidad.
 * Arquitectura preparada para sustituirse por un intérprete de IA en backend:
 * basta reemplazar `interpretFree` por una llamada asíncrona que devuelva
 * el mismo objeto `Interpretation`.
 */

const RULES: { intent: Intent; label: string; tone: Interpretation["tone"]; words: string[] }[] = [
  {
    intent: "aggressive",
    label: "Agresiva",
    tone: "bad",
    words: [
      "idiota", "imbecil", "imbécil", "gilipollas", "puto", "puta", "mierda", "joder", "cabron",
      "cabrón", "vete", "callate", "cállate", "odio", "asco", "estupido", "estúpido", "payaso",
      "basura", "peleo", "pego", "matar", "fuck", "shit",
    ],
  },
  {
    intent: "defiant",
    label: "Desafiante",
    tone: "neutral",
    words: [
      "no acepto", "no pienso", "me da igual", "paso", "no me sale", "exijo", "quiero jugar",
      "merezco", "no es justo", "injusto", "me voy", "traspaso", "salir", "banquillo no",
      "titular", "más minutos", "mas minutos", "no acepto esto", "protesto", "discrepo",
    ],
  },
  {
    intent: "humorous",
    label: "Con humor",
    tone: "neutral",
    words: [
      "jaja", "jeje", "lol", "broma", "risa", "gracioso", "chiste", "xd", "😂", "🤣", "meme",
      "tranqui", "no pasa nada tío", "bromeo",
    ],
  },
  {
    intent: "conciliatory",
    label: "Conciliadora",
    tone: "good",
    words: [
      "perdon", "perdón", "lo siento", "disculpa", "mi culpa", "entiendo", "tienes razon",
      "tienes razón", "hablemos", "arreglar", "calma", "sin problema", "gracias", "acepto",
      "respeto", "colaborar", "ayudar", "equipo primero",
    ],
  },
  {
    intent: "professional",
    label: "Profesional",
    tone: "good",
    words: [
      "trabajar", "trabajo", "entrenar", "entreno", "esfuerzo", "mejorar", "aprender",
      "disciplina", "cuerpo tecnico", "cuerpo técnico", "seguir", "concentrado", "compromiso",
      "profesional", "callado", "campo", "demostrar", "cabeza", "paso a paso", "humildad",
    ],
  },
  {
    intent: "ambitious",
    label: "Ambiciosa",
    tone: "neutral",
    words: [
      "champions", "seleccion", "selección", "balon de oro", "balón de oro", "el mejor",
      "primera", "élite", "elite", "estrella", "grande", "ganar todo", "top", "leyenda",
      "millones", "europa",
    ],
  },
  {
    intent: "loyal",
    label: "Leal",
    tone: "good",
    words: [
      "me quedo", "mi casa", "mi club", "canterano", "afición", "aficion", "escudo", "fiel",
      "no me voy", "familia del club", "aqui estoy", "aquí estoy", "hasta el final",
    ],
  },
  {
    intent: "evasive",
    label: "Evasiva",
    tone: "neutral",
    words: [
      "no se", "no sé", "ns", "quiza", "quizá", "quizas", "quizás", "ya veremos", "depende",
      "sin comentarios", "no puedo decir", "prefiero no", "mi representante", "otro dia",
      "otro día", "nada", "bueno",
    ],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function interpretFree(raw: string): Interpretation {
  const text = normalize(typeof raw === "string" ? raw : "");
  if (text.length < 2) {
    return { intent: "empty", label: "Silencio", tone: "neutral", intensity: 0.2, matched: [] };
  }

  const scores = new Map<Intent, { score: number; matched: string[] }>();
  for (const rule of RULES) {
    let score = 0;
    const matched: string[] = [];
    for (const w of rule.words) {
      if (text.includes(w)) {
        score += w.includes(" ") ? 2 : 1;
        matched.push(w);
      }
    }
    if (score > 0) scores.set(rule.intent, { score, matched });
  }

  // Señales de tono independientes del léxico.
  const shouting = text === text.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(raw) && raw.length > 6;
  const exclamations = (text.match(/!/g) ?? []).length;
  const questions = (text.match(/\?/g) ?? []).length;
  if (shouting || exclamations >= 2) bump(scores, "aggressive", 1.5);
  if (questions >= 1 && text.length < 60) bump(scores, "evasive", 0.6);
  if (text.length > 140) bump(scores, "professional", 0.8);
  if (text.length <= 8) bump(scores, "evasive", 0.8);

  let best: { intent: Intent; score: number; matched: string[] } | null = null;
  for (const [intent, v] of scores) {
    if (!best || v.score > best.score) best = { intent, score: v.score, matched: v.matched };
  }

  if (!best) {
    // Texto legible pero sin señales claras: neutral profesional suave.
    return {
      intent: "professional",
      label: "Medida",
      tone: "neutral",
      intensity: 0.35,
      matched: [],
    };
  }

  const rule = RULES.find((r) => r.intent === best!.intent)!;
  const intensity = Math.max(0.25, Math.min(1, best.score / 4 + (shouting ? 0.3 : 0)));
  return {
    intent: best.intent,
    label: rule.label,
    tone: rule.tone,
    intensity: Math.round(intensity * 100) / 100,
    matched: best.matched.slice(0, 4),
  };
}

function bump(map: Map<Intent, { score: number; matched: string[] }>, intent: Intent, amount: number) {
  const cur = map.get(intent);
  if (cur) cur.score += amount;
  else map.set(intent, { score: amount, matched: [] });
}

export const INTENT_FEEDBACK: Record<Intent, string> = {
  professional: "Tono profesional. Nadie puede reprocharte nada.",
  aggressive: "Tono agresivo. Se te ha ido de las manos.",
  defiant: "Tono desafiante. Has marcado territorio.",
  conciliatory: "Tono conciliador. Bajas la tensión.",
  humorous: "Tono humorístico. Alivias el ambiente… o lo trivializas.",
  evasive: "Tono evasivo. No te has comprometido a nada.",
  ambitious: "Tono ambicioso. Has puesto el listón alto en voz alta.",
  loyal: "Tono de lealtad. Se te ha entendido perfectamente.",
  empty: "No dices nada. El silencio también responde.",
};
