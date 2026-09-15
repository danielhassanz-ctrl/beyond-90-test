import fs from "node:fs";

const path = "src/game/threads.ts";
let source = fs.readFileSync(path, "utf8");

const oldImport = 'import { ensureCareerCast } from "./career-life";';
const newImport = 'import { careerStatus, ensureCareerCast } from "./career-life";';
if (!source.includes(oldImport)) throw new Error("career-life import marker missing");
source = source.replace(oldImport, newImport);

const oldBlock = `  if (s.rel.coach <= 34 && chance(s, "coach_upset", 0.55) && attempt("coach_upset")) return;
  if (s.agent.present && s.fame >= 28 && chance(s, "club_interest", 0.4) && attempt("club_interest")) return;
  if (s.fame >= 34 && chance(s, "public_attention", 0.3)) {
    const first: ThreadKind = chance(s, "public_attention_order", 0.5) ? "press_digging" : "sponsor_call";
    const second: ThreadKind = first === "press_digging" ? "sponsor_call" : "press_digging";
    if (attempt(first) || attempt(second)) return;
  }
  if (s.stage !== "youth" && s.overall >= 68 && s.age <= 21 && chance(s, "national_call", 0.28) && attempt("national_call")) return;`;

const newBlock = `  if (s.rel.coach <= 34 && chance(s, "coach_upset", 0.55) && attempt("coach_upset")) return;

  // Fame alone must never fast-forward a sixteen-year-old into transfer-market,
  // press or sponsorship life. Those threads are earned only after the life-first
  // year has established football status. A strong prospect can attract clubs at
  // 17, while commercial/public attention waits for a genuine starter profile.
  const status = careerStatus(s);
  const establishedStarter = status === "starter" || status === "star" || status === "elite" || status === "legend";
  if (s.age >= 17 && s.agent.present && s.fame >= 28 && chance(s, "club_interest", 0.4) && attempt("club_interest")) return;
  if (s.age >= 18 && establishedStarter && s.fame >= 34 && chance(s, "public_attention", 0.3)) {
    const first: ThreadKind = chance(s, "public_attention_order", 0.5) ? "press_digging" : "sponsor_call";
    const second: ThreadKind = first === "press_digging" ? "sponsor_call" : "press_digging";
    if (attempt(first) || attempt(second)) return;
  }
  if (s.stage !== "youth" && s.overall >= 68 && s.age <= 21 && chance(s, "national_call", 0.28) && attempt("national_call")) return;`;

if (!source.includes(oldBlock)) throw new Error("thread eligibility block missing");
source = source.replace(oldBlock, newBlock);
fs.writeFileSync(path, source);
console.log("Grounded fame-driven narrative threads behind age and earned status.");
