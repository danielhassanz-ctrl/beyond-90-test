import fs from "node:fs";

const file = "src/game/engine.ts";
let src = fs.readFileSync(file, "utf8");

// Clean accidental duplicate migration guards left by successive source patches.
const guard = '  if (s.pending?.type === "dynamic" && s.pending.kind === "match_flash") s.pending = null;';
while (src.includes(`${guard}\n${guard}`)) src = src.replace(`${guard}\n${guard}`, guard);

const oldBlock = `  if (s.agent.teaser) {
    const suitor = randomSuitor(s);
    s.agent.teaser = null;
    return dyn("agent_offer", { clubName: suitor, salary: 150 + Math.floor(Math.random() * 500) });
  }
  if (s.fame >= 30 && Math.random() < 0.5) {
    const teaser = pick([
      "Ha llamado un club importante preguntando por ti",
      "Hay un ojeador que ha pedido tus últimos tres partidos en vídeo",
      "Me han preguntado por tu cláusula desde fuera de España",
    ]);
    s.agent.teaser = teaser;
    return dyn("agent_teaser", { teaser });
  }
  if (s.agent.trust >= 50 && Math.random() < 0.3) {
    return dyn("agent_commission", { commission: Math.min(15, s.agent.commission + 2) });
  }`;

const newBlock = `  // Market conversations are milestone stories, not renewable filler. A youth
  // player cannot receive repeated late-night transfer calls simply because
  // simulated fame drift crossed a threshold.
  const marketReady = s.stage !== "youth" && s.age >= 18 && totalApps(s) >= 10;
  if (s.agent.teaser) {
    // Legacy saves may carry a teaser into an ineligible youth context. Drop it
    // instead of surfacing a chronologically impossible offer.
    if (!marketReady || s.flags["agent_offer_season"] === s.seasonIndex) {
      s.agent.teaser = null;
    } else {
      const suitor = randomSuitor(s);
      s.agent.teaser = null;
      s.flags["agent_offer_season"] = s.seasonIndex;
      return dyn("agent_offer", { clubName: suitor, salary: 150 + Math.floor(Math.random() * 500) });
    }
  }
  if (marketReady && s.flags["agent_teaser_season"] !== s.seasonIndex && Math.random() < 0.5) {
    const teaser = pick([
      "Ha llamado un club importante preguntando por ti",
      "Hay un ojeador que ha pedido tus últimos tres partidos en vídeo",
      "Me han preguntado por tu cláusula desde fuera de España",
    ]);
    s.agent.teaser = teaser;
    s.flags["agent_teaser_season"] = s.seasonIndex;
    return dyn("agent_teaser", { teaser });
  }
  if (s.age >= 18 && s.stage !== "youth" && s.agent.trust >= 50 && s.flags["agent_commission_season"] !== s.seasonIndex && Math.random() < 0.3) {
    s.flags["agent_commission_season"] = s.seasonIndex;
    return dyn("agent_commission", { commission: Math.min(15, s.agent.commission + 2) });
  }`;

if (src.includes(newBlock)) {
  fs.writeFileSync(file, src);
  console.log("P0 agent market repetition guard already applied; migration duplicates cleaned.");
  process.exit(0);
}
if (!src.includes(oldBlock)) throw new Error("Expected agent market block not found");
src = src.replace(oldBlock, newBlock);
fs.writeFileSync(file, src);
console.log("Applied P0: youth market calls gated and agent teaser/offer/commission limited to one authored beat per season.");
