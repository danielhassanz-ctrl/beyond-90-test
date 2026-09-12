import { renderConsequence } from "../src/game/consequences";
import { createGame } from "../src/game/engine";
import { ensureCareerCast } from "../src/game/career-life";
import type { DynamicCard, Player } from "../src/game/types";

const player: Player = {
  name: "QA Player",
  nickname: "QA",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["familiar", "profesional"],
};

const state = createGame(player);
state.careerSeed = 909012;
state.age = 16;
state.rel.family = 18;
const cast = ensureCareerCast(state);

if (cast.partner.met) throw new Error("fresh career unexpectedly starts with partner already introduced");

const card: DynamicCard = { type: "dynamic", kind: "cons_family_break", data: {} };
const beforePartner = renderConsequence(state, card);
if (!beforePartner) throw new Error("family-break consequence failed to render");
if (beforePartner.text.includes(cast.partner.name)) {
  throw new Error(`unintroduced partner leaked into family consequence at age ${state.age}: ${beforePartner.text}`);
}

cast.partner.met = true;
cast.partner.lastContactScene = state.sceneCount;
const afterPartner = renderConsequence(state, card);
if (!afterPartner) throw new Error("family-break consequence failed to render after partner introduction");
if (!afterPartner.text.includes(cast.partner.name)) {
  throw new Error("introduced persistent partner is not used when family consequence is rendered later in career");
}

console.log(`Family consequence cast QA OK: no partner before introduction; persistent partner ${cast.partner.name} used after introduction.`);
