import fs from "node:fs";

const engineFile = "src/game/engine.ts";
const dynamicFile = "src/game/dynamic.ts";

let engine = fs.readFileSync(engineFile, "utf8");
let dynamic = fs.readFileSync(dynamicFile, "utf8");

const engineBlock = `  if (Math.random() < 0.3) {
    return dyn("agent_check", {
      topic: pick(["minutos", "prensa", "dinero", "vida"]),
      hour: pick(["23:17", "07:40", "14:05", "22:58"]),
    });
  }
`;

if (!engine.includes(engineBlock)) {
  if (engine.includes('dyn("agent_check"')) {
    throw new Error("agent_check still exists in engine.ts but expected generation block changed; review manually");
  }
  console.log("engine.ts: agent_check generation already removed");
} else {
  engine = engine.replace(engineBlock, "");
  console.log("engine.ts: removed generic agent_check emission");
}

const topicsStart = dynamic.indexOf("const AGENT_TOPICS: Record<string, string> = {");
if (topicsStart >= 0) {
  const topicsEnd = dynamic.indexOf("\n};\n\ninterface ThreadView", topicsStart);
  if (topicsEnd < 0) throw new Error("Could not locate AGENT_TOPICS end");
  dynamic = dynamic.slice(0, topicsStart) + "interface ThreadView" + dynamic.slice(topicsEnd + "\n};\n\ninterface ThreadView".length);
  console.log("dynamic.ts: removed dead AGENT_TOPICS copy bank");
}

let removedCases = 0;
for (;;) {
  const caseStart = dynamic.indexOf('    case "agent_check":');
  if (caseStart < 0) break;
  const nextCase = dynamic.indexOf('    case "', caseStart + 8);
  const defaultCase = dynamic.indexOf("    default:", caseStart + 8);
  const candidates = [nextCase, defaultCase].filter((x) => x >= 0);
  if (candidates.length === 0) throw new Error("Could not locate the end of an agent_check switch case");
  const caseEnd = Math.min(...candidates);
  dynamic = dynamic.slice(0, caseStart) + dynamic.slice(caseEnd);
  removedCases += 1;
}
if (removedCases > 0) console.log(`dynamic.ts: removed ${removedCases} agent_check switch path(s)`);

if (engine.includes('dyn("agent_check"')) throw new Error("agent_check emission still present in engine.ts");
if (dynamic.includes('case "agent_check"')) throw new Error("agent_check switch case still present in dynamic.ts");
if (dynamic.includes("AGENT_TOPICS")) throw new Error("AGENT_TOPICS still present in dynamic.ts");

fs.writeFileSync(engineFile, engine);
fs.writeFileSync(dynamicFile, dynamic);
