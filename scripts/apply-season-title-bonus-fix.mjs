import fs from "node:fs";

const financePath = "src/game/finance.ts";
const enginePath = "src/game/engine.ts";
const careerPath = "src/game/career.ts";
const dynamicPath = "src/game/dynamic.ts";

let finance = fs.readFileSync(financePath, "utf8");
let engine = fs.readFileSync(enginePath, "utf8");
let career = fs.readFileSync(careerPath, "utf8");
let dynamic = fs.readFileSync(dynamicPath, "utf8");

const oldSignature = "export function seasonFinance(s: GameState): { income: number; spend: number; net: number; text: string } {";
const newSignature = "export function seasonFinance(s: GameState, seasonTitleCount = 0): { income: number; spend: number; net: number; text: string } {";
const oldBonus = "const bonuses = Math.round(apps * (2 + s.overall / 40) + goals * 4 + (s.titles?.length ?? 0) * 15);";
const newBonus = "const bonuses = Math.round(apps * (2 + s.overall / 40) + goals * 4 + Math.max(0, seasonTitleCount) * 15);";
const oldCall = "const fin = seasonFinance(s);";
const newCall = "const fin = seasonFinance(s, honours.titles.length);";

if (!finance.includes(newSignature)) {
  if (!finance.includes(oldSignature)) throw new Error("seasonFinance signature marker not found");
  finance = finance.replace(oldSignature, newSignature);
}
if (!finance.includes(newBonus)) {
  if (!finance.includes(oldBonus)) throw new Error("season bonus marker not found");
  finance = finance.replace(oldBonus, newBonus);
}
if (!engine.includes(newCall)) {
  if (!engine.includes(oldCall)) throw new Error("seasonFinance call marker not found");
  engine = engine.replace(oldCall, newCall);
}

const oldRetirementStart = `export function shouldRetire(s: GameState): boolean {
  if (s.retired) return false;
  if (s.age >= 40) return true;`;
const newRetirementStart = `export function shouldRetire(s: GameState): boolean {
  if (s.retired) return false;
  // "Última temporada" is a promise, not a renewable label. Once that year
  // closes, the retirement decision must return even if the veteran played well.
  if ((s.flags["ultima_temporada"] ?? 0) === 1) return true;
  if (s.age >= 40) return true;`;
if (!career.includes(newRetirementStart)) {
  if (!career.includes(oldRetirementStart)) throw new Error("shouldRetire marker not found");
  career = career.replace(oldRetirementStart, newRetirementStart);
}

const oldRetirementCase = `    case "retirement": {
      if (choiceId === "seguir") {
        stat(s, "morale", 4);
        stat(s, "fitness", -3);
        return {
          title: "Una más",
          text: "Aprietas los dientes y firmas un año más con la idea de competir como siempre. Puede salir bonito o puede salir triste.",
          tone: "neutral",
        };
      }
      if (choiceId === "rol_menor") {`;
const newRetirementCase = `    case "retirement": {
      // A previous "one more" or an explicit final veteran season cannot be
      // selected forever. Age 40 is also a hard professional-career cap.
      const forcedRetirement =
        s.age >= 40 ||
        (s.flags["ultima_temporada"] ?? 0) === 1 ||
        (choiceId === "seguir" && (s.flags["retirement_extension_used"] ?? 0) === 1);
      if (forcedRetirement && choiceId !== "retirar") {
        s.retired = true;
        milestone(s, "El último año se convierte en tu despedida definitiva.");
        note(s, "Cierras la carrera después de agotar tu última prórroga.", "gold");
        return {
          title: "Hasta aquí",
          text: "Querías estirarlo otra vez, pero ya habías pedido una última temporada. Cierras la carrera dentro del campo, sin convertir el final en una prórroga infinita.",
          tone: "gold",
        };
      }
      if (choiceId === "seguir") {
        s.flags["retirement_extension_used"] = 1;
        stat(s, "morale", 4);
        stat(s, "fitness", -3);
        return {
          title: "Una más",
          text: "Aprietas los dientes y firmas un año más con la idea de competir como siempre. Es la única prórroga: la próxima llamada será la despedida.",
          tone: "neutral",
        };
      }
      if (choiceId === "rol_menor") {`;
if (!dynamic.includes(newRetirementCase)) {
  if (!dynamic.includes(oldRetirementCase)) throw new Error("retirement resolver marker not found");
  dynamic = dynamic.replace(oldRetirementCase, newRetirementCase);
}

fs.writeFileSync(financePath, finance);
fs.writeFileSync(enginePath, engine);
fs.writeFileSync(careerPath, career);
fs.writeFileSync(dynamicPath, dynamic);
console.log("Applied current-season title accounting and bounded retirement extensions.");
