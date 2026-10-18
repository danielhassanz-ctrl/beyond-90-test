/**
 * Prueba sin red: la Liga SIEMPRE llega a la jornada 38 al acabar la temporada, aunque la Copa y Europa omitan los partidos clave de las
 * semanas 8, 9 y 10 (un mes admite como mucho dos partidos clave). Antes, con Copa y Champions vivas, la tabla se quedaba en «Jornada 24 de 38»
 * en mayo y la Liga nunca terminaba (ni había puesto final ni título).
 */
import { buildMatchCalendar } from "../src/lib/calendar/match-calendar";
import { ligaJornadaByWeek } from "../src/lib/calendar/leagues";
import { ligaJornadaReached, leagueFinish, getActiveStandings } from "../src/lib/narrative/standings";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };

const season = 7;
const mk = (club: string, w: number, copa: any, euro: any, extra: any = {}): any => ({
  id: "p1", club, week: season * 10 + w, media: 85, position: "Delantero", status: "active", nation: "España", mode: "pro",
  flags: { copa_progress: JSON.stringify({ season, ...copa }), euro_progress: JSON.stringify({ season, ...euro }), ...extra },
});
/** Un registro con todos los partidos de Liga que el calendario sí programa hasta la semana w. */
const recordUpTo = (club: string, w: number, copa: any, euro: any) => {
  const cal = buildMatchCalendar(club, season, { copa, euro });
  const results = cal.filter((m) => m.competition === "liga" && m.week - season * 10 <= w).map((m) => ({ inSeasonWeek: m.week - season * 10, r: "W" as const }));
  return { wins: results.length, draws: 0, losses: 0, played: results.length, results };
};

console.log("1) Real Madrid con Copa y Champions vivas hasta las finales");
const copa = { round: 5, alive: true }, euro = { round: 4, alive: true };
for (const [w, expected] of [[7, 24], [8, 29], [9, 34], [10, 38]] as const) {
  const reached = ligaJornadaReached(mk("Real Madrid", w, copa, euro), recordUpTo("Real Madrid", w, copa, euro));
  ok(reached === expected, `semana ${w}: jornada ${reached} (esperada ${expected})`);
}
const table = getActiveStandings(mk("Real Madrid", 10, copa, euro), ["pretemp-amistoso", "rookie-debut-oficial"], recordUpTo("Real Madrid", 10, copa, euro)).primary as any;
ok(/Jornada 38 de 38/.test(table.label) && table.rows.every((r: any) => r.played === 38), "la tabla de Clasificación en mayo dice «Jornada 38 de 38»");
const fin = leagueFinish(mk("Real Madrid", 10, copa, euro), recordUpTo("Real Madrid", 10, copa, euro));
ok(fin !== null && fin.rank >= 1 && fin.rank <= 20, `el cierre de la temporada da puesto final (${fin?.rank}º)`);

console.log("2) Sin Copa ni Europa: la jornada avanza al jugarse cada partido, no antes");
const none = { round: 1, alive: false }, noneEuro = { round: 0, alive: false, tied: true };
ok(ligaJornadaReached(mk("Real Madrid", 8, none, noneEuro), recordUpTo("Real Madrid", 7, none, noneEuro)) === 24, "semana 8 con el partido aún por jugar: sigue en la 24");
ok(ligaJornadaReached(mk("Real Madrid", 8, none, noneEuro), recordUpTo("Real Madrid", 8, none, noneEuro)) === 29, "jugado el partido de la semana 8: 29");

console.log("3) Todas las combinaciones, tres niveles de club: al acabar la temporada, jornada 38");
let bad = 0, cases = 0;
for (const club of ["Real Madrid", "Real Betis", "Cádiz CF", "Manchester City"]) {
  for (let cr = 1; cr <= 5; cr++) for (const ca of [true, false]) for (let er = 0; er <= 4; er++) for (const ea of [true, false]) {
    const c = { round: cr, alive: ca }, e = { round: er, alive: ea };
    cases++;
    const reached = ligaJornadaReached(mk(club, 10, c, e), recordUpTo(club, 10, c, e));
    if (reached !== ligaJornadaByWeek(club)[10]) bad++;
  }
}
ok(bad === 0, `${cases} combinaciones: la Liga siempre llega a su última jornada (fallos: ${bad})`);

console.log("4) Etiquetas de Copa y Europa tras ganar la final");
const won = getActiveStandings(mk("Real Madrid", 10, { round: 6, alive: true }, { round: 5, alive: true }), ["pretemp-amistoso", "rookie-debut-oficial"], recordUpTo("Real Madrid", 10, copa, euro));
ok(won.copa?.roundLabel === "Campeón de la copa", `Copa ganada: «${won.copa?.roundLabel}» (antes «Próxima ronda: Copa del Rey»)`);
ok(/Campeón/.test(won.euro?.roundLabel ?? ""), `Champions ganada: «${won.euro?.roundLabel}»`);

if (fails) { console.log(`\n${fails} fallos`); process.exit(1); }
console.log("\nTodo bien");
