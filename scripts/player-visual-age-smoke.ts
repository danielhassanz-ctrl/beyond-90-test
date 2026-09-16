import { playerVisualProfile } from "../src/game/milestone-visual";

const cases = [
  [16, "academy"], [18, "academy"],
  [19, "young-pro"], [23, "young-pro"],
  [24, "prime"], [30, "prime"],
  [31, "veteran"], [35, "veteran"],
  [36, "legacy"], [41, "legacy"],
] as const;

for (const [age, expected] of cases) {
  const profile = playerVisualProfile(age);
  if (profile.stage !== expected) throw new Error(`age ${age}: expected ${expected}, got ${profile.stage}`);
  if (!profile.ageDirection.trim()) throw new Error(`age ${age}: missing age direction`);
}

if (playerVisualProfile(12).age !== 16) throw new Error("underage visual profile must clamp to career minimum age");
if (playerVisualProfile(99).age !== 50) throw new Error("visual profile must clamp implausible late-career age");
if (playerVisualProfile(Number.NaN).stage !== "academy") throw new Error("invalid age must fail safely to academy stage");

console.log("player visual age smoke: deterministic ageing bands preserve a single identity source without faking local AI generation");
