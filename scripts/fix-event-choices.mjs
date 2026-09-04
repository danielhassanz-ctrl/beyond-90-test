import fs from "node:fs";

const file = "src/game/events.ts";
let src = fs.readFileSync(file, "utf8");

function matchingBracket(text, open) {
  let depth = 0, quote = null, template = false, esc = false, lineComment = false, blockComment = false;
  for (let i = open; i < text.length; i++) {
    const ch = text[i], nx = text[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && nx === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === quote) quote = null; continue; }
    if (template) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === "`") template = false; continue; }
    if (ch === "/" && nx === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && nx === "*") { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "`") { template = true; continue; }
    if (ch === "[") depth++;
    if (ch === "]") { depth--; if (depth === 0) return i; }
  }
  throw new Error(`No closing bracket for ${open}`);
}

function countObjects(body) {
  let sq = 0, cu = 0, pa = 0, count = 0, quote = null, template = false, esc = false, lc = false, bc = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i], nx = body[i + 1];
    if (lc) { if (ch === "\n") lc = false; continue; }
    if (bc) { if (ch === "*" && nx === "/") { bc = false; i++; } continue; }
    if (quote) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === quote) quote = null; continue; }
    if (template) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === "`") template = false; continue; }
    if (ch === "/" && nx === "/") { lc = true; i++; continue; }
    if (ch === "/" && nx === "*") { bc = true; i++; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "`") { template = true; continue; }
    if (ch === "[") sq++;
    else if (ch === "]") sq--;
    else if (ch === "(") pa++;
    else if (ch === ")") pa--;
    else if (ch === "{") { if (sq === 0 && cu === 0 && pa === 0) count++; cu++; }
    else if (ch === "}") cu--;
  }
  return count;
}

const labels = {
  medical: "Consultar con el fisio y decidir con más información",
  training: "Pedir un plan concreto antes de elegir",
  press: "Responder con calma y sin regalar un titular",
  gossip: "Resolverlo primero en privado",
  agent: "Pedir tiempo y escuchar otra opinión",
  market: "Comparar las opciones antes de firmar",
  life: "Hablarlo con los tuyos antes de decidir",
  club: "Buscar una conversación privada y un punto medio",
  preseason: "Seguir el plan y revisar la decisión después",
  story: "Tomarte un día y buscar una tercera vía",
};

function categoryBefore(pos) {
  const chunk = src.slice(Math.max(0, pos - 2200), pos);
  const matches = [...chunk.matchAll(/category:\s*"([a-z]+)"/g)];
  return matches.at(-1)?.[1] ?? "story";
}

const inserts = [];
for (let from = 0; ; ) {
  const marker = src.indexOf("choices: [", from);
  if (marker < 0) break;
  const open = src.indexOf("[", marker);
  const close = matchingBracket(src, open);
  const body = src.slice(open + 1, close);
  from = close + 1;
  if (!body.includes("apply:")) continue;
  const count = countObjects(body);
  if (count >= 3) continue;
  const category = categoryBefore(marker);
  let addition = "";
  for (let i = count; i < 3; i++) {
    const id = i === 1 ? "tercera_via" : "consultar";
    const relation = category === "life" ? "family" : category === "agent" || category === "market" ? "agent" : category === "training" || category === "club" || category === "preseason" ? "coach" : "dressing";
    addition += `\n      {\n        id: "${id}",\n        label: "${labels[category] ?? labels.story}",\n        hint: "Menos impulso, más contexto",\n        outcome: "No eliges ninguno de los extremos. Pides margen y la situación se enfría lo suficiente para pensar.",\n        apply: (s) => {\n          stat(s, "discipline", 2);\n          stat(s, "morale", 1);\n          rel(s, "${relation}", 2);\n        },\n      },`;
  }
  inserts.push({ at: close, text: addition });
}

for (const ins of inserts.sort((a, b) => b.at - a.at)) src = src.slice(0, ins.at) + ins.text + "\n" + src.slice(ins.at);
src = src.replace(/[ \t]+$/gm, "");
fs.writeFileSync(file, src);
console.log(`Normalized ${inserts.length} static event choice arrays to exactly 3 choices.`);
