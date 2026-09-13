import { renderConsequence } from "../src/game/consequences";
import { createGame } from "../src/game/engine";
import { ensureCareerCast } from "../src/game/career-life";
import type { DynamicCard, Player } from "../src/game/types";

const makePlayer = (city: string): Player => ({
  name: "QA Player",
  nickname: "QA",
  position: "MCO",
  nationality: "España",
  city,
  avatar: null,
  traits: ["familiar", "profesional"],
});

const card: DynamicCard = { type: "dynamic", kind: "cons_family_break", data: {} };

const homeState = createGame(makePlayer("Sevilla"));
homeState.careerSeed = 909012;
homeState.clubId = "betis";
homeState.age = 16;
homeState.rel.family = 18;
const homeCast = ensureCareerCast(homeState);

if (homeCast.partner.met) throw new Error("fresh career unexpectedly starts with partner already introduced");

const homeView = renderConsequence(homeState, card);
if (!homeView) throw new Error("family-break consequence failed to render for home-city youth player");
if (homeView.text.includes(homeCast.partner.name)) {
  throw new Error(`unintroduced partner leaked into family consequence at age ${homeState.age}: ${homeView.text}`);
}
if (homeView.text.includes("Tres meses sin aparecer por casa")) {
  throw new Error(`home-city youth player was falsely written as absent from home: ${homeView.text}`);
}
if (!homeView.text.includes("sigues viviendo con ellos")) {
  throw new Error(`home-city youth family pressure did not acknowledge shared home chronology: ${homeView.text}`);
}

const relocatedState = createGame(makePlayer("Málaga"));
relocatedState.careerSeed = 909013;
relocatedState.clubId = "betis";
relocatedState.age = 16;
relocatedState.rel.family = 18;
const relocatedCast = ensureCareerCast(relocatedState);
const relocatedView = renderConsequence(relocatedState, card);
if (!relocatedView) throw new Error("family-break consequence failed to render for relocated youth player");
if (!relocatedView.text.includes("Málaga") || !relocatedView.text.includes("Sevilla")) {
  throw new Error(`relocated youth family pressure lost home/club geography: ${relocatedView.text}`);
}
if (relocatedView.text.includes("sigues viviendo con ellos")) {
  throw new Error(`relocated youth player was incorrectly treated as still living at home: ${relocatedView.text}`);
}
if (relocatedView.text.includes(relocatedCast.partner.name)) {
  throw new Error(`unintroduced partner leaked into relocated youth family consequence: ${relocatedView.text}`);
}

relocatedCast.partner.met = true;
relocatedCast.partner.lastContactScene = relocatedState.sceneCount;
const afterPartner = renderConsequence(relocatedState, card);
if (!afterPartner) throw new Error("family-break consequence failed to render after partner introduction");
if (!afterPartner.text.includes(relocatedCast.partner.name)) {
  throw new Error("introduced persistent partner is not used when family consequence is rendered later in career");
}

console.log(`Family consequence chronology QA OK: home-city youth stays at home, relocation keeps geography, persistent partner ${relocatedCast.partner.name} appears only after introduction.`);
