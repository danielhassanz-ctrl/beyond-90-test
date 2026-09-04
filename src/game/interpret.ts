import type { Interpretation, Intent } from "./types";

/**
 * Intérprete local de respuestas libres.
 *
 * No pretende ser un LLM: combina frases, negación, contraste, actos de habla
 * y señales léxicas para evitar el clasificador superficial por palabra suelta
 * que tenía el prototipo. Mantiene la misma interfaz para poder sustituirse
 * más adelante por un intérprete semántico remoto sin tocar el motor del juego.
 */

type Rule = {
  intent: Exclude<Intent, "empty">;
  label: string;
  tone: Interpretation["tone"];
  phrases: string[];
  words: string[];
};

const RULES: Rule[] = [
  {
    intent: "aggressive",
    label: "Agresiva",
    tone: "bad",
    phrases: ["vete a", "me importa una mierda", "os vais a enterar"],
    words: ["idiota", "imbecil", "imbécil", "gilipollas", "puto", "puta", "mierda", "joder", "cabron", "cabrón", "callate", "cállate", "odio", "asco", "estupido", "estúpido", "payaso", "basura", "pego", "matar", "fuck", "shit"],
  },
  {
    intent: "defiant",
    label: "Desafiante",
    tone: "neutral",
    phrases: ["no acepto", "no pienso", "me da igual", "no es justo", "quiero jugar", "merezco jugar", "más minutos", "mas minutos", "me quiero ir", "quiero salir", "quiero un traspaso", "no voy a aceptar"],
    words: ["exijo", "injusto", "traspaso", "protesto", "discrepo", "titular"],
  },
  {
    intent: "humorous",
    label: "Con humor",
    tone: "neutral",
    phrases: ["no pasa nada tío", "no pasa nada tio", "era broma", "estoy de broma"],
    words: ["jaja", "jeje", "lol", "broma", "risa", "gracioso", "chiste", "xd", "😂", "🤣", "meme", "tranqui"],
  },
  {
    intent: "conciliatory",
    label: "Conciliadora",
    tone: "good",
    phrases: ["lo siento", "mi culpa", "tienes razon", "tienes razón", "podemos hablar", "vamos a hablar", "quiero arreglarlo", "entiendo tu postura", "entiendo su postura", "equipo primero"],
    words: ["perdon", "perdón", "disculpa", "entiendo", "hablemos", "arreglar", "calma", "gracias", "acepto", "respeto", "colaborar", "ayudar"],
  },
  {
    intent: "professional",
    label: "Profesional",
    tone: "good",
    phrases: ["voy a trabajar", "seguir trabajando", "quiero mejorar", "voy a entrenar", "paso a paso", "hablar en el campo", "demostrarlo en el campo", "me toca trabajar", "seguiré trabajando"],
    words: ["trabajar", "trabajo", "entrenar", "entreno", "esfuerzo", "mejorar", "aprender", "disciplina", "concentrado", "compromiso", "profesional", "demostrar", "cabeza", "humildad"],
  },
  {
    intent: "ambitious",
    label: "Ambiciosa",
    tone: "neutral",
    phrases: ["quiero ser el mejor", "quiero ganar", "quiero llegar", "quiero jugar champions", "balon de oro", "balón de oro", "ganar todo", "llegar a la seleccion", "llegar a la selección"],
    words: ["champions", "seleccion", "selección", "élite", "elite", "estrella", "top", "leyenda", "europa"],
  },
  {
    intent: "loyal",
    label: "Leal",
    tone: "good",
    phrases: ["me quedo", "quiero quedarme", "no me voy", "seguir aqui", "seguir aquí", "este es mi club", "mi club", "mi casa", "hasta el final", "quiero seguir aquí", "quiero seguir aqui"],
    words: ["canterano", "afición", "aficion", "escudo", "fiel"],
  },
  {
    intent: "evasive",
    label: "Evasiva",
    tone: "neutral",
    phrases: ["no se", "no sé", "ya veremos", "sin comentarios", "no puedo decir", "prefiero no", "otro dia", "otro día", "depende de", "hablad con mi representante", "preguntad a mi representante"],
    words: ["quiza", "quizá", "quizas", "quizás", "depende", "bueno"],
  },
];

const NEGATORS = new Set(["no", "nunca", "jamás", "jamas", "tampoco", "ni"]);
const CONTRAST = /\b(?:pero|aunque|sin embargo|aun así|aun asi|eso sí|eso si)\b/g;

function normalize(text: string): string {
  return text.toLowerCase().replace(/[“”«»]/g, '"').replace(/\s+/g, " ").trim();
}

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function clauses(text: string): string[] {
  return text
    .replace(CONTRAST, " | ")
    .split(/[|.;!?]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function phraseNegated(clause: string, phrase: string): boolean {
  const idx = clause.indexOf(phrase);
  if (idx < 0) return false;
  const before = clause.slice(Math.max(0, idx - 24), idx).trim().split(/\s+/).slice(-3);
  return before.some((token) => NEGATORS.has(stripAccents(token.replace(/[^a-záéíóúñ]/gi, ""))));
}

function wordNegated(clause: string, word: string): boolean {
  const tokens = stripAccents(clause).match(/[a-zñ]+/g) ?? [];
  const needle = stripAccents(word);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== needle) continue;
    const start = Math.max(0, i - 3);
    if (tokens.slice(start, i).some((token) => NEGATORS.has(token))) return true;
  }
  return false;
}

function scoreRule(rule: Rule, textClauses: string[]): { score: number; matched: string[] } {
  let score = 0;
  const matched: string[] = [];
  for (let ci = 0; ci < textClauses.length; ci++) {
    const clause = textClauses[ci]!;
    // Tras un "pero/aunque" suele venir la postura que la persona realmente prioriza.
    const clauseWeight = ci === textClauses.length - 1 && textClauses.length > 1 ? 1.25 : 1;
    for (const phrase of rule.phrases) {
      if (!clause.includes(phrase)) continue;
      if (phraseNegated(clause, phrase)) {
        score -= 1.5 * clauseWeight;
        continue;
      }
      score += 3 * clauseWeight;
      matched.push(phrase);
    }
    for (const word of rule.words) {
      const plainClause = stripAccents(clause);
      const plainWord = stripAccents(word);
      const hit = new RegExp(`(^|\\b)${escapeRegExp(plainWord)}(\\b|$)`).test(plainClause);
      if (!hit) continue;
      if (wordNegated(clause, word)) {
        score -= 0.8 * clauseWeight;
        continue;
      }
      score += 0.8 * clauseWeight;
      matched.push(word);
    }
  }
  return { score, matched };
}

function semanticOverrides(text: string, scores: Map<Intent, { score: number; matched: string[] }>) {
  // Pares que el clasificador antiguo confundía por compartir literalmente palabras.
  if (/\bno me voy\b|\bno quiero irme\b|\bquiero quedarme\b|\bme quiero quedar\b/.test(text)) {
    bump(scores, "loyal", 5, "compromiso de quedarse");
    suppress(scores, "defiant", 4);
  }
  if (/\bme (?:quiero|voy a) ir\b|\bquiero salir\b|\bpido (?:salir|traspaso)\b/.test(text)) {
    bump(scores, "defiant", 4.5, "intención de salida");
    suppress(scores, "loyal", 4);
  }
  if (/\blo siento\b.*\bpero\b/.test(text)) bump(scores, "conciliatory", 1, "disculpa explícita");
  if (/\bpero\b.*\b(?:voy a trabajar|seguir trabajando|demostrarlo)\b/.test(text)) bump(scores, "professional", 2, "compromiso posterior");
  if (/\bquiero\b.*\b(?:ganar|llegar|ser|jugar)\b/.test(text)) bump(scores, "ambitious", 1.2, "objetivo explícito");
  if (/\b(?:creo|pienso) que\b/.test(text) && /\b(?:entiendo|respeto)\b/.test(text)) bump(scores, "conciliatory", 1, "desacuerdo respetuoso");
}

export function interpretFree(raw: string): Interpretation {
  const original = typeof raw === "string" ? raw : "";
  const text = normalize(original);
  if (text.length < 2) return { intent: "empty", label: "Silencio", tone: "neutral", intensity: 0.2, matched: [] };

  const parts = clauses(text);
  const scores = new Map<Intent, { score: number; matched: string[] }>();
  for (const rule of RULES) {
    const value = scoreRule(rule, parts);
    if (value.score > 0) scores.set(rule.intent, value);
  }
  semanticOverrides(text, scores);

  const shouting = original === original.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(original) && original.length > 6;
  const exclamations = (original.match(/!/g) ?? []).length;
  const questions = (original.match(/\?/g) ?? []).length;
  if (shouting || exclamations >= 3) bump(scores, "aggressive", 1.5, "énfasis alto");
  if (questions >= 2 && text.length < 90) bump(scores, "evasive", 0.5, "respuesta interrogativa");
  if (text.length > 140 && /\b(?:porque|aunque|pero|entiendo|quiero)\b/.test(text)) bump(scores, "professional", 0.5, "respuesta elaborada");
  if (text.length <= 6) bump(scores, "evasive", 0.7, "respuesta mínima");

  let best: { intent: Intent; score: number; matched: string[] } | null = null;
  for (const [intent, value] of scores) {
    if (!best || value.score > best.score) best = { intent, score: value.score, matched: value.matched };
  }

  if (!best || best.score <= 0.35) {
    return { intent: "professional", label: "Medida", tone: "neutral", intensity: 0.35, matched: [] };
  }

  const rule = RULES.find((r) => r.intent === best!.intent);
  const intensity = Math.max(0.25, Math.min(1, best.score / 5 + (shouting ? 0.2 : 0)));
  return {
    intent: best.intent,
    label: rule?.label ?? "Medida",
    tone: rule?.tone ?? "neutral",
    intensity: Math.round(intensity * 100) / 100,
    matched: [...new Set(best.matched)].slice(0, 4),
  };
}

function bump(map: Map<Intent, { score: number; matched: string[] }>, intent: Intent, amount: number, marker?: string) {
  const cur = map.get(intent);
  if (cur) {
    cur.score += amount;
    if (marker) cur.matched.push(marker);
  } else {
    map.set(intent, { score: amount, matched: marker ? [marker] : [] });
  }
}

function suppress(map: Map<Intent, { score: number; matched: string[] }>, intent: Intent, amount: number) {
  const cur = map.get(intent);
  if (cur) cur.score -= amount;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
