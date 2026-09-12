import { ensureCareerCast } from "../src/game/career-life";
import { createGame } from "../src/game/engine";
import { npcMood, who } from "../src/game/npc";
import type { Player } from "../src/game/types";

const player: Player = {
  name: "Partner Cast QA",
  nickname: "PCQA",
  position: "MCO",
  nationality: "España",
  city: "Sevilla",
  avatar: null,
  traits: ["familiar", "ambicioso"],
};

const state = createGame(player);
state.careerSeed = 515151;
const cast = ensureCareerCast(state);

if (cast.partner.id === cast.social.id || cast.partner.name === cast.social.name) {
  throw new Error(`partner and social contact collapsed into one person: ${cast.partner.name}`);
}
if (!who(state, "partner").startsWith(`${cast.partner.name}, pareja`)) {
  throw new Error(`partner role did not resolve through persistent cast: ${who(state, "partner")}`);
}
if (!who(state, "social").startsWith(`${cast.social.name}, contacto de redes`)) {
  throw new Error(`social role did not resolve through persistent cast: ${who(state, "social")}`);
}

const socialBefore = cast.social.relation;
const partnerBefore = cast.partner.relation;
npcMood(state, "partner", 9);
if (cast.partner.relation !== Math.min(100, partnerBefore + 9)) {
  throw new Error("partner relationship did not persist its own mood change");
}
if (cast.social.relation !== socialBefore) {
  throw new Error("partner relationship mutation leaked into social-contact relationship");
}

const legacy = createGame(player);
legacy.careerSeed = 515151;
const legacyCast = ensureCareerCast(legacy) as typeof cast & { partner?: typeof cast.partner };
delete legacyCast.partner;
delete legacy.memory.npcs.partner;
const migrated = ensureCareerCast(legacy);
if (!migrated.partner || migrated.partner.name === migrated.social.name) {
  throw new Error("legacy save did not migrate to a distinct persistent partner");
}
const migratedName = migrated.partner.name;
if (!who(legacy, "partner").startsWith(`${migratedName}, pareja`)) {
  throw new Error("migrated partner is not reused by narrative lookups");
}

console.log(`Partner cast QA OK: partner=${cast.partner.name}; social=${cast.social.name}; legacy migration=${migratedName}`);
