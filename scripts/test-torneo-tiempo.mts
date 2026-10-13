/** Prueba sin IA: un torneo de selecciones no avanza el calendario (todo ocurre en julio) aunque tenga muchas escenas. */
import { computeWeekAdvance } from "../src/lib/narrative/week-advance";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const base: any = { id: "p", club: "Real Madrid", week: 61, media: 90, mode: "pro", flags: { torneo_activo: "eurocopa" } };

let player = { ...base, flags: { ...base.flags } };
let moved = 0;
const ids = ["sel-eurocopa-s6", "torneo-life-a-61-0", "match-decision-torneo-1", "matchday-torneo-g1", "torneo-life-b-61-1", "match-decision-torneo-2", "matchday-torneo-g2", "torneo-life-c-61-2", "matchday-torneo-g3", "match-decision-torneo-4", "matchday-torneo-r16", "torneo-life-d-61-3", "match-decision-torneo-5", "matchday-torneo-qf", "torneo-life-e", "match-decision-torneo-6", "matchday-torneo-sf", "torneo-life-f", "match-decision-torneo-7", "matchday-torneo-final", "tanda-final"];
for (const id of ids) {
  const r = computeWeekAdvance(player, { id, matchKey: id } as any);
  if (r.newWeek !== player.week) moved++;
  player = { ...player, week: r.newWeek, flags: { ...player.flags, wk_count: r.weekCounter } };
}
ok(player.week === 61 && moved === 0, `21 escenas de un torneo seguidas: el calendario sigue en la semana ${player.week} (julio)`);

let normal: any = { ...base, flags: {} };
let avanzo = false;
for (let i = 0; i < 8; i++) {
  const r = computeWeekAdvance(normal, { id: "torneo-life-x" } as any);
  normal = { ...normal, week: r.newWeek, flags: { wk_count: r.weekCounter } };
  if (normal.week !== 61) avanzo = true;
}
ok(avanzo, "fuera de un torneo, la red de seguridad sigue evitando atascos");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
