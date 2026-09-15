import fs from "node:fs";

const path = "src/game/dynamic.ts";
let src = fs.readFileSync(path, "utf8");

const before = `    case "thread": {\n      const kind = str(d, "threadKind", "club_interest");\n      const view = threadViewFor(s, kind);\n      return {\n        kicker: view?.kicker ?? "Se resuelve",\n        title: view?.title ?? "Aquello de lo que se hablaba",\n        image: view?.image ?? "locker",\n        category: view?.category ?? "story",\n        text: \`${str(d, "teaser", "Se hablaba de algo.")} \${view?.text ?? "Hoy tiene nombre y apellidos."}\`,`;

const after = `    case "thread": {\n      const kind = str(d, "threadKind", "club_interest");\n      const view = threadViewFor(s, kind);\n      const actor = kind === "coach_upset"\n        ? who(s, "coach")\n        : kind === "teammate_jealous"\n          ? who(s, "captain")\n          : kind === "club_interest" || kind === "sponsor_call"\n            ? agentName\n            : kind === "family_worry"\n              ? "Tu familia"\n              : "";\n      const actorLead = actor ? \`\${actor} retoma una conversación que ya forma parte de tu carrera. \` : "";\n      return {\n        kicker: view?.kicker ?? "Se resuelve",\n        title: view?.title ?? "Aquello de lo que se hablaba",\n        image: view?.image ?? "locker",\n        category: view?.category ?? "story",\n        text: \`\${actorLead}\${str(d, "teaser", "Se hablaba de algo.")} \${view?.text ?? "Hoy tiene nombre y apellidos."}\`,`;

if (!src.includes(before)) throw new Error("thread render block not found");
src = src.replace(before, after);
fs.writeFileSync(path, src);
