import fs from "node:fs";

const path = "src/game/dynamic.ts";
let src = fs.readFileSync(path, "utf8");

const importNeedle = 'import { clubById } from "./data";';
if (!src.includes(importNeedle)) throw new Error("dynamic import marker missing");
src = src.replace(importNeedle, `${importNeedle}\nimport { ensureCareerCast } from "./career-life";`);

const marker = `function threadViewFor(s: GameState, kind: string): ThreadView | undefined {\n  const uses = Object.keys(s.memory?.threads ?? {}).filter((key) => key.startsWith("thread-season:") && key.endsWith(\`:\${kind}\`) && (s.memory.threads[key] ?? 0) > 0).length;\n  return uses >= 2 ? (THREAD_FOLLOWUPS[kind] ?? THREAD_VIEWS[kind]) : THREAD_VIEWS[kind];\n}`;
if (!src.includes(marker)) throw new Error("threadViewFor marker missing");
const replacement = `${marker}\n\nfunction threadResolutionText(s: GameState, kind: string, teaser: string, body: string, remembered: string): string {\n  const cast = ensureCareerCast(s);\n  const recall = remembered.trim() ? \` La conversación que vuelve es concreta: «\${remembered.replace(/[.]+$/, "")}».\` : "";\n  const owner = (() => {\n    switch (kind) {\n      case "club_interest": return \`\${cast.adviser.name} no te lo plantea como un rumor: se sienta contigo para decidir el siguiente paso.\`;\n      case "coach_upset": return \`\${cast.coach.name} cierra la puerta del despacho y deja claro que esta conversación tendrá consecuencias en tu rol.\`;\n      case "teammate_jealous": return \`\${cast.captain.name} os sienta a ti y a \${cast.teammate.name}; ya no es una tensión anónima del vestuario.\`;\n      case "family_worry": return s.flags["partner_active"] === 1\n        ? \`\${cast.partner.name} quiere decidirlo contigo porque también afecta a vuestra vida fuera del fútbol.\`\n        : \`Tu entorno no quiere que el fútbol convierta este problema en otra cosa que se deja para después.\`;\n      case "sponsor_call": return \`\${cast.adviser.name} ha leído la letra pequeña antes de llamarte y te obliga a elegir qué parte de tu vida estás dispuesto a vender.\`;\n      case "national_call": return \`\${cast.coach.name} te pide que valores la llamada por lo que significa para tu momento actual, no por el titular.\`;\n      default: return "";\n    }\n  })();\n  return [teaser, owner, body, recall].filter(Boolean).join(" ").replace(/\\s+/g, " ").trim();\n}`;
src = src.replace(marker, replacement);

const oldText = '        text: `${str(d, "teaser", "Se hablaba de algo.")} ${view?.text ?? "Hoy tiene nombre y apellidos."}`,';
const newText = '        text: threadResolutionText(s, kind, str(d, "teaser", "Se hablaba de algo."), view?.text ?? "Hoy tiene nombre y apellidos.", str(d, "remembered")),';
if (!src.includes(oldText)) throw new Error("thread render text marker missing");
src = src.replace(oldText, newText);

fs.writeFileSync(path, src);
console.log("Applied named-person ownership and exact-memory recall to thread resolutions.");
