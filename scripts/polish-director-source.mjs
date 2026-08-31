import { readFileSync, writeFileSync } from "node:fs";

const path = "src/game/director.ts";
let src = readFileSync(path, "utf8");

const genericReturn = 'return { title: "Buscas una tercera vía", text: "No eliges ninguno de los extremos. Pides margen, escuchas y obligas a los demás a esperar tu respuesta.", tone: "neutral" };';
const genericHint = '            hint: "Alternativa prudente con consecuencias propias",\n';
const genericCount = src.split(genericReturn).length - 1;
if (genericCount < 5) throw new Error(`Expected at least 5 generic third-way outcomes, found ${genericCount}`);

const helperMarker = 'function callback(s: GameState, id: string, text: string, inScenes = 8): void {';
const helper = `function thirdWayResult(s: GameState): Res {\n  const variants = [\n    { title: "Pides margen", text: "No respondes en caliente. Escuchas una versión más, fijas un plazo y haces que el resto espere tu decisión." },\n    { title: "Cambias el terreno", text: "Sacas la conversación del foco público y la llevas a una mesa pequeña. Pierdes impacto inmediato, ganas información." },\n    { title: "Ni sí ni no", text: "No compras ninguno de los dos extremos. Pides condiciones concretas y dejas claro que decidirás cuando tengas todos los datos." },\n    { title: "Veinticuatro horas", text: "Te reservas un día para hablar con quien realmente está implicado. La situación no desaparece, pero deja de decidir por ti." },\n    { title: "Una salida intermedia", text: "Propones una solución menos vistosa y más controlable. Nadie sale del todo satisfecho, que a veces es señal de un acuerdo real." },\n    { title: "Lo enfrías", text: "Bajas el volumen, haces dos preguntas incómodas y pospones la respuesta. El problema sigue ahí, pero ahora conoces mejor su precio." },\n  ] as const;\n  const i = hash(careerSeed(s), \\`third-way-\\${s.sceneCount ?? 0}-\\${s.beat ?? 0}-\\${s.seasonIndex}\\`) % variants.length;\n  return { ...variants[i]!, tone: "neutral" };\n}\n\n`;
if (!src.includes("function thirdWayResult(s: GameState): Res")) {
  const pos = src.indexOf(helperMarker);
  if (pos < 0) throw new Error("Could not find callback helper insertion point");
  src = src.slice(0, pos) + helper + src.slice(pos);
}

let replaced = 0;
while (src.includes(genericReturn)) {
  const idx = src.indexOf(genericReturn);
  const before = src.slice(Math.max(0, idx - 1400), idx);
  const matches = [...before.matchAll(/apply:\s*\((\w+)\)\s*=>\s*\{/g)];
  const arg = matches.at(-1)?.[1];
  if (!arg) throw new Error(`Could not determine apply argument near generic outcome #${replaced + 1}`);
  const stateExpr = arg === "c" ? "c.s" : arg;
  src = src.slice(0, idx) + `return thirdWayResult(${stateExpr});` + src.slice(idx + genericReturn.length);
  replaced++;
}
if (replaced !== genericCount) throw new Error(`Expected to replace ${genericCount}, replaced ${replaced}`);

src = src.split(genericHint).join("");

const consultBlock = `    if (choiceId === "consultar") {\n      stat(s, "discipline", 2);\n      rel(s, "dressing", 3);\n      return { title: "Buscas contexto", text: "Antes de responder, hablas con quien estuvo dentro de aquella historia. Cambia el tono, no borra lo ocurrido.", tone: "neutral" };\n    }\n`;
const doubled = consultBlock + consultBlock;
if (src.includes(doubled)) src = src.replace(doubled, consultBlock);

if (src.includes("Buscas una tercera vía")) throw new Error("Generic third-way title remains after polish");
if (src.includes("Alternativa prudente con consecuencias propias")) throw new Error("Generic third-way hint remains after polish");

writeFileSync(path, src);
console.log(`DIRECTOR_POLISH_OK replaced=${replaced}`);
