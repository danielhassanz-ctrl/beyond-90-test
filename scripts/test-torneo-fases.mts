/** Prueba sin IA: el Mundial (48 selecciones) tiene dieciseisavos; Eurocopa y Copa América no; y la pretemporada va de julio a agosto. */
import { torneoStageLabels, torneoStages, torneoFinalStage, advanceTorneo, buildTorneoMatch, type TorneoProgress, type TorneoResult } from "../src/lib/narrative/torneo";
import { isPreseasonLifeWindow } from "../src/lib/narrative/preseason-life";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const win: TorneoResult = { kind: "ko", win: true, draw: false, scoreLine: "2-1", points: 0 };
const lose: TorneoResult = { kind: "ko", win: false, draw: false, scoreLine: "0-1", points: 0 };
const grp = (p: number): TorneoResult => ({ kind: "group", win: p === 3, draw: p === 1, scoreLine: "1-0", points: p });
const start = (type: TorneoProgress["type"]): TorneoProgress => ({ type, season: 3, stage: 0, alive: true, groupPts: 0, lifeDue: true, lifeCount: 0 });

console.log("1) Rondas por torneo");
ok(torneoStages("mundial") === 8 && torneoStageLabels("mundial")[3] === "Dieciseisavos de final", "Mundial: 3 de grupos + dieciseisavos + octavos + cuartos + semis + final");
ok(torneoStages("eurocopa") === 7 && torneoStageLabels("eurocopa")[3] === "Octavos de final", "Eurocopa: empieza en octavos");
ok(torneoStages("copa_america") === 7, "Copa América: 7 partidos como máximo");
ok(torneoStageLabels("mundial")[torneoFinalStage("mundial")] === "Final", "el último partido es la final");

console.log("2) Camino de un campeón del Mundial");
for (const type of ["mundial", "eurocopa"] as const) {
  let p = start(type); const seen: string[] = []; let champion = false; let guard = 0;
  while (guard++ < 20) {
    const r = p.stage < 3 ? grp(3) : win;
    const adv = advanceTorneo(p, r);
    seen.push(adv.outcome);
    if (adv.finished) { champion = !!adv.champion; break; }
    p = adv.next;
  }
  ok(champion && seen.length === torneoStages(type), `${type}: campeón tras ${seen.length} partidos (${seen.join(" › ")})`);
  ok(type !== "mundial" || seen[2] === "dieciseisavos", `${type}: tras los grupos el siguiente cruce es ${seen[2]}`);
}

console.log("3) Eliminaciones del Mundial");
const outcomes: string[] = [];
for (let lost = 3; lost <= torneoFinalStage("mundial"); lost++) {
  const p = start("mundial"); p.stage = lost; p.groupPts = 9;
  outcomes.push(advanceTorneo(p, lose).outcome);
}
ok(outcomes.join(",") === "dieciseisavos,octavos,cuartos,semifinal,subcampeon", `caer en cada ronda: ${outcomes.join(", ")}`);
const eu: string[] = [];
for (let lost = 3; lost <= torneoFinalStage("eurocopa"); lost++) { const p = start("eurocopa"); p.stage = lost; eu.push(advanceTorneo(p, lose).outcome); }
ok(eu.join(",") === "octavos,cuartos,semifinal,subcampeon", `Eurocopa sin cambios: ${eu.join(", ")}`);

console.log("4) Fase de grupos del Mundial: los mejores terceros también pasan");
let q = 0;
for (let i = 0; i < 4000; i++) { const p = start("mundial"); p.stage = 2; p.groupPts = 3; if (advanceTorneo(p, grp(0)).qualified) q++; }
ok(q / 4000 > 0.5 && q / 4000 < 0.7, `con 3 puntos pasa ~60 % (${Math.round((q / 4000) * 100)} %)`);
const out = (() => { const p = start("mundial"); p.stage = 2; p.groupPts = 0; return advanceTorneo(p, grp(0)); })();
ok(out.finished && out.outcome === "fase_de_grupos", "con 0 puntos, eliminado en grupos");

console.log("5) El partido lleva el nombre de la ronda y rivales distintos");
const player: any = { id: "x", nation: "España", week: 100, flags: {} };
const rivals = new Set<string>();
for (let st = 0; st < 8; st++) { const m = buildTorneoMatch(player, { ...start("mundial"), stage: st }); rivals.add(m.rivalClub!); if (st === 3) ok(/Dieciseisavos/.test(m.description), "descripción: " + m.description); }
ok(rivals.size >= 7, `rivales distintos en cada ronda (${rivals.size})`);

console.log("6) Pretemporada: solo julio y agosto");
const turns = Array.from({ length: 10 }, (_, i) => isPreseasonLifeWindow(31 + i));
ok(turns.join() === "true,true,false,false,false,false,false,false,false,false", "turnos 1-2 sí; septiembre a mayo no");
ok(!isPreseasonLifeWindow(34), "octubre (turno 4) ya no");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
