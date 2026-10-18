/** Prueba sin IA: el marcador decidido en código es coherente con lo que viviste en la jugada decisiva (gol → no hay 0-0 ni derrota sin gol). */
import { decideKnockoutResult, decideTwoLegResult, ownGoalsOf, decisionNeedsGoal } from "../src/lib/calendar/competition-progress";
import { decideTorneoResult } from "../src/lib/narrative/torneo";
import { decideSelResult } from "../src/lib/narrative/seleccion";
import { buildShootoutEvent } from "../src/lib/narrative/shootout";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const player: any = { id: "p", nation: "España", media: 92, club: "Real Madrid", flags: {} };

ok(ownGoalsOf("1-1 (5-4 en penaltis)") === 1 && ownGoalsOf("0-0 (4-3 en penaltis)") === 0 && ownGoalsOf("2-1") === 2, "se cuentan los goles de tu equipo sin la tanda");
// LA FORMA REAL de la bandera match_decision_*: un JSON, no la palabra suelta. Esta prueba usaba solo la palabra y por eso no vio que en producción nunca funcionaba.
const real = (outcome: string) => JSON.stringify({ outcome, style: "x", sit: "Una jugada", min: "88" });
ok(decisionNeedsGoal(real("goal")) && decisionNeedsGoal(real("wondergoal")) && decisionNeedsGoal(real("assist")) && !decisionNeedsGoal(real("concede")) && !decisionNeedsGoal(real("save")), "con la bandera REAL (JSON), gol, golazo y asistencia exigen gol del equipo");
ok(decisionNeedsGoal("goal") && decisionNeedsGoal("wondergoal") && decisionNeedsGoal("assist") && !decisionNeedsGoal("miss") && !decisionNeedsGoal(undefined), "gol, golazo y asistencia exigen gol del equipo");

for (const decision of ["goal", "wondergoal", "assist", real("goal"), real("wondergoal"), real("assist")]) {
  let sin = 0;
  for (let i = 0; i < 400; i++) {
    if (ownGoalsOf(decideKnockoutResult(92, 2, 0.05, decision).scoreLine) === 0) sin++;
    if (ownGoalsOf(decideTwoLegResult(92, { own: 0, rival: 0 }, 0.05, decision).scoreLine) === 0) sin++;
    if (ownGoalsOf(decideTorneoResult(player, { stage: 6, type: "eurocopa", alive: true, groupPts: 6 } as any, "Suiza", decision).scoreLine) === 0) sin++;
    if (ownGoalsOf(decideTorneoResult(player, { stage: 1, type: "eurocopa", alive: true, groupPts: 3 } as any, "Suiza", decision).scoreLine) === 0) sin++;
    if (ownGoalsOf(decideSelResult(player, "Suiza", decision).scoreLine) === 0) sin++;
  }
  ok(sin === 0, `${decision.startsWith("{") ? "JSON " + JSON.parse(decision).outcome : decision}: en 2000 partidos, ninguno termina sin gol de tu equipo`);
}
let sinGol = 0;
for (let i = 0; i < 400; i++) if (ownGoalsOf(decideKnockoutResult(92, 2, 0.05, "miss").scoreLine) === 0) sinGol++;
ok(sinGol > 20, `si fallas la jugada, sigue habiendo partidos sin gol (${sinGol}/400): no se fuerza nada de más`);

const tanda = buildShootoutEvent({ ...player, last_name: "Hassan", position: "Delantero" } as any, { key: "k", team: "España", rival: "Suiza", comp: "Eurocopa 2032", regular: "", round: "Final", decisive: true, national: true, scored: true });
ok(/Tu gol había puesto el partido de cara/.test(tanda.description) && !/0-0|Nadie ha podido con nadie/.test(tanda.description), "si marcaste, la tanda no cuenta un partido sin goles");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
