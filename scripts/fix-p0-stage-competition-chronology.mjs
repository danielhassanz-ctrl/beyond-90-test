import fs from "node:fs";

const file = "src/game/engine.ts";
let src = fs.readFileSync(file, "utf8");

const oldFn = `function keyMatchSpecs(s: GameState): KeySpec[] {
  const debut = !s.achievements.includes(s.stage === "first" ? "debut_pro" : "debut_juvenil");
  const derby = derbyRivalOf(clubDef(s.clubId));
  const specs: KeySpec[] = [
    { tag: debut ? "debut" : "scouts" },
    ...(derby ? [{ tag: "derby" as const, opponentId: derby.id }] : []),
    { tag: "decisive" },
    { tag: "cup", tie: true },
    { tag: "scouts" },
    { tag: "decisive" },
  ];
  // FASE 6: si el club juega competición europea, uno de los partidos clave lo es.
  const euro = europeanCompetition(s);
  if (euro) specs.splice(2, 0, { tag: "euro", tie: true, competition: euro });
  if (s.memory.rejectedClubs.length > 0 && Math.random() < 0.6) specs.splice(3, 0, { tag: "exclub" });
  else if (finalPlausible(s) && Math.random() < 0.6) specs.push({ tag: "final", tie: true });
  else specs.push({ tag: "cup", tie: true });
  return specs.slice(0, 7);
}`;

const newFn = `function keyMatchSpecs(s: GameState): KeySpec[] {
  const debut = !s.achievements.includes(s.stage === "first" ? "debut_pro" : "debut_juvenil");
  const derby = derbyRivalOf(clubDef(s.clubId));

  // Juveniles and reserve/B teams do not magically enter the senior Copa del
  // Rey or Europe. Their key matches are development milestones: debut,
  // derbies, scouts and genuinely decisive league/category fixtures.
  if (s.stage !== "first") {
    const developmental: KeySpec[] = [
      { tag: debut ? "debut" : "scouts" },
      ...(derby ? [{ tag: "derby" as const, opponentId: derby.id }] : []),
      { tag: "decisive" },
      { tag: "scouts" },
      { tag: "decisive" },
      { tag: "scouts" },
      { tag: "decisive" },
    ];
    if (s.memory.rejectedClubs.length > 0 && Math.random() < 0.6) developmental.splice(3, 0, { tag: "exclub" });
    return developmental.slice(0, 7);
  }

  const specs: KeySpec[] = [
    { tag: debut ? "debut" : "scouts" },
    ...(derby ? [{ tag: "derby" as const, opponentId: derby.id }] : []),
    { tag: "decisive" },
    { tag: "cup", tie: true },
    { tag: "scouts" },
    { tag: "decisive" },
  ];
  // Senior-only: European and cup stories require a first-team career.
  const euro = europeanCompetition(s);
  if (euro) specs.splice(2, 0, { tag: "euro", tie: true, competition: euro });
  if (s.memory.rejectedClubs.length > 0 && Math.random() < 0.6) specs.splice(3, 0, { tag: "exclub" });
  else if (finalPlausible(s) && Math.random() < 0.6) specs.push({ tag: "final", tie: true });
  else specs.push({ tag: "cup", tie: true });
  return specs.slice(0, 7);
}`;

if (src.includes(newFn)) {
  console.log("Stage-aware competition chronology already applied");
  process.exit(0);
}
if (!src.includes(oldFn)) throw new Error("Expected keyMatchSpecs function not found");
src = src.replace(oldFn, newFn);
fs.writeFileSync(file, src);
console.log("Applied P0: youth/reserves cannot receive senior Copa/Europe key matches.");
