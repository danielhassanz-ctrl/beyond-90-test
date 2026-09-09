import fs from "node:fs";

const file = "src/game/director.ts";
let src = fs.readFileSync(file, "utf8");

function matchingBracket(text, open) {
  let depth = 0;
  let quote = null;
  let template = false;
  let esc = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    const nx = text[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && nx === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (template) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === "`") { template = false; continue; }
      continue;
    }
    if (ch === "/" && nx === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && nx === "*") { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "`") { template = true; continue; }
    if (ch === "[") depth++;
    if (ch === "]") { depth--; if (depth === 0) return i; }
  }
  throw new Error(`No closing bracket for ${open}`);
}

function topLevelObjects(body) {
  let depthSquare = 0, depthCurly = 0, depthParen = 0, count = 0;
  let quote = null, template = false, esc = false, lineComment = false, blockComment = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i], nx = body[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && nx === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === quote) quote = null; continue; }
    if (template) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === "`") template = false; continue; }
    if (ch === "/" && nx === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && nx === "*") { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "`") { template = true; continue; }
    if (ch === "[") depthSquare++;
    else if (ch === "]") depthSquare--;
    else if (ch === "(") depthParen++;
    else if (ch === ")") depthParen--;
    else if (ch === "{") {
      if (depthSquare === 0 && depthCurly === 0 && depthParen === 0) count++;
      depthCurly++;
    } else if (ch === "}") depthCurly--;
  }
  return count;
}

const policy = {
  medical: ["Consultar el plan con el fisio antes de decidir", "Proteger el cuerpo y revisar la decisión mañana"],
  market: ["Pedir 48 horas y comparar el coste real", "Hablarlo con tu entorno antes de firmar nada"],
  agent: ["Pedir tiempo y marcar tus propias condiciones", "Escuchar otra opinión antes de responder"],
  press: ["Responder solo lo imprescindible y salir", "Pedir al club hablarlo primero en privado"],
  gossip: ["Quitarte del foco y resolverlo en privado", "Hablar con el vestuario antes de reaccionar"],
  life: ["Hablarlo con los tuyos antes de decidir", "No decidir en caliente y retomarlo mañana"],
  training: ["Pedir un plan individual y demostrarlo entrenando", "Medir el riesgo y hablar con el cuerpo técnico"],
  preseason: ["Seguir el plan del cuerpo técnico sin hacer ruido", "Pedir una conversación privada antes de elegir"],
  club: ["Pedir una conversación privada y buscar un punto medio", "No responder en caliente y ganarte margen en el campo"],
  story: ["Hablar con alguien de confianza antes de decidir", "Pedir tiempo y buscar una tercera vía"],
};

function categoryBefore(pos) {
  const chunk = src.slice(Math.max(0, pos - 1800), pos);
  const matches = [...chunk.matchAll(/category:\s*"([a-z]+)"/g)];
  return matches.at(-1)?.[1] ?? "story";
}

function generatedChoice(category, index, chapterMode) {
  const labels = policy[category] ?? policy.story;
  const label = labels[index % labels.length];
  const id = index === 0 ? "tercera_via" : "consultar_entorno";
  const target = chapterMode ? "c.s" : "st";
  const relTarget = category === "life" ? "family" : category === "agent" || category === "market" ? "agent" : category === "club" || category === "training" || category === "preseason" ? "coach" : "dressing";
  return `\n          {\n            id: "${id}",\n            label: "${label}",\n            hint: "Alternativa prudente con consecuencias propias",\n            apply: (${chapterMode ? "c" : "st"}) => {\n              stat(${target}, "discipline", 2);\n              stat(${target}, "morale", 1);\n              rel(${target}, "${relTarget}", 2);\n              return { title: "Buscas una tercera vía", text: "No eliges ninguno de los extremos. Pides margen, escuchas y obligas a los demás a esperar tu respuesta.", tone: "neutral" };\n            },\n          },`;
}

const beatMarker = src.indexOf("const BEATS: Beat[]");
const inserts = [];
for (let from = 0; ; ) {
  const marker = src.indexOf("choices: [", from);
  if (marker < 0) break;
  const open = src.indexOf("[", marker);
  const close = matchingBracket(src, open);
  const body = src.slice(open + 1, close);
  from = close + 1;
  if (!body.includes("apply:")) continue;
  const count = topLevelObjects(body);
  if (count >= 3) continue;
  const chapterMode = marker < beatMarker;
  const category = categoryBefore(marker);
  const missing = 3 - count;
  let addition = "";
  for (let i = 0; i < missing; i++) addition += generatedChoice(category, i, chapterMode);
  inserts.push({ at: close, text: addition });
}

for (const ins of inserts.sort((a, b) => b.at - a.at)) src = src.slice(0, ins.at) + ins.text + "\n" + src.slice(ins.at);

src = src.replace(
  '{ id: "esquivar", label: "Esquivarlo por ahora", hint: "Puede volver peor" },\n      ],',
  '{ id: "esquivar", label: "Esquivarlo por ahora", hint: "Puede volver peor" },\n        { id: "consultar", label: "Hablar con alguien implicado antes de cerrar", hint: "Menos impulso, más contexto" },\n      ],',
);
src = src.replace(
  'if (choiceId === "esquivar") {\n      d.callbacks.push',
  'if (choiceId === "consultar") {\n      stat(s, "discipline", 2);\n      rel(s, "dressing", 3);\n      return { title: "Buscas contexto", text: "Antes de responder, hablas con quien estuvo dentro de aquella historia. Cambia el tono, no borra lo ocurrido.", tone: "neutral" };\n    }\n    if (choiceId === "esquivar") {\n      d.callbacks.push',
);

src = src.replace(/[ \t]+$/gm, "");
fs.writeFileSync(file, src);
console.log(`Normalized ${inserts.length} director choice arrays to exactly 3 choices.`);
