import fs from "node:fs";

const share = fs.readFileSync(new URL("../src/lib/share.ts", import.meta.url), "utf8");
const button = fs.readFileSync(new URL("../src/components/game/ShareButton.tsx", import.meta.url), "utf8");
const identity = fs.readFileSync(new URL("../src/game/club-identity.ts", import.meta.url), "utf8");

function requireSource(ok, message) {
  if (!ok) throw new Error(`Visual milestone gate: ${message}`);
}

requireSource(
  button.includes("avatar: generatedAvatar || state.player.avatar"),
  "share milestone must use the generated milestone image when available and otherwise the persisted player avatar",
);
requireSource(
  button.includes("const generationBrief = state.player.avatar") &&
    button.includes("milestoneGenerationBrief(milestone, visualAge, club, identity)"),
  "paid generation must remain anchored to the persisted player avatar and current career context",
);
requireSource(button.includes("clubVisualIdentity(state.clubId)"), "share milestone must resolve the current club identity");
requireSource(button.includes("clubColors:"), "share milestone must pass club colours to the renderer");
requireSource(share.includes("input.avatar ? await loadImage(input.avatar) : null"), "renderer must attempt to render the player photo");
requireSource(share.includes("input.clubColors?.primary") && share.includes("input.clubColors?.secondary"), "renderer must consume primary and secondary club colours");
requireSource(identity.includes("crestAsset: null"), "official crest assets must remain disabled until rights are cleared");
requireSource(identity.includes("does NOT bundle official club crests"), "rights-safe crest policy must remain explicit in source");
requireSource(!identity.match(/crestAsset:\s*["'`][^"'`]+/), "official or unverified crest asset path was introduced");

console.log("Visual milestone source gate OK: persisted player photo anchors generation and fallback; club palette is wired; unlicensed crest assets remain blocked.");
