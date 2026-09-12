import { createGame } from "../src/game/engine";
import { resolveDynamic } from "../src/game/dynamic";
import { shouldRetire } from "../src/game/career";
import type { DynamicCard, Player } from "../src/game/types";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const player: Player = {
  name: "Retirement QA",
  nickname: "",
  position: "MC",
  nationality: "España",
  city: "Madrid",
  avatar: null,
  traits: ["profesional"],
};

const retirementCard: DynamicCard = { type: "dynamic", kind: "retirement", data: { age: 40, tier: "Gran profesional" } };

// The hard age cap is real: choosing "one more" at 40 cannot create a 41-57 year-old pro career.
{
  const s = createGame(player);
  s.age = 40;
  s.stage = "first";
  s.retired = false;
  resolveDynamic(s, retirementCard, "seguir");
  assert(s.retired === true, "Age-40 player escaped the retirement hard cap with 'seguir'");
}

// A veteran can ask for one extension, but the same escape hatch cannot be reused forever.
{
  const s = createGame(player);
  s.age = 36;
  s.stage = "first";
  s.retired = false;
  resolveDynamic(s, retirementCard, "seguir");
  assert(s.retired === false, "First veteran extension should remain playable below the hard cap");
  assert(s.flags["retirement_extension_used"] === 1, "First extension was not persisted");
  s.age = 37;
  resolveDynamic(s, retirementCard, "seguir");
  assert(s.retired === true, "Repeated retirement extension allowed an endless career");
}

// The explicit veteran-role option really is the final season and must trigger retirement review next close.
{
  const s = createGame(player);
  s.age = 36;
  s.stage = "first";
  s.retired = false;
  resolveDynamic(s, retirementCard, "rol_menor");
  assert(s.flags["ultima_temporada"] === 1, "Veteran-role final season was not persisted");
  assert(shouldRetire(s) === true, "Final-season flag does not force retirement review");
  resolveDynamic(s, retirementCard, "rol_menor");
  assert(s.retired === true, "Final-season retirement could be postponed repeatedly");
}

console.log("retirement hard-cap smoke: OK");
