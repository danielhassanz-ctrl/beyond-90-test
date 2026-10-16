/** Prueba sin red: tus partidos de Liga no superan las jornadas del equipo, la Champions dice «clasificado para octavos» y las bromas de mercado no se repiten. */
import { clampLigaToTable } from "../src/lib/player/liga-clamp";
import { getActiveStandings } from "../src/lib/narrative/standings";
import { buildMarketRumorEvent } from "../src/lib/narrative/market-window";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };

const stat = (m: number, g = 0, a = 0, min = 0) => ({ matches: m, goals: g, assists: a, minutes: min });
const season: any = { liga: stat(20, 14, 5, 1302), champions: stat(3, 2, 1, 186), europa: stat(0), copa: stat(1, 1, 0, 80), seleccion: stat(1, 0, 1, 89), torneos: {} };
const totals = { matches_played: 25, minutes_played: 1657, goals: 17, assists: 7 };

console.log("1) Los partidos de Liga no superan las jornadas del equipo");
const c1 = clampLigaToTable(season, totals, 19);
ok(c1.season.liga.matches === 19 && c1.totals.matches_played === 24, "con 19 jornadas, tus 20 partidos pasan a 19 y el total de 25 a 24");
ok(c1.season.liga.minutes < 1302 && c1.totals.minutes_played === 1657 - (1302 - c1.season.liga.minutes), "los minutos bajan en proporción y se descuentan del total");
ok(c1.season.liga.goals === 14 && c1.season.liga.assists === 5, "los goles y asistencias narrados no se tocan");
ok(c1.season.champions.matches === 3 && c1.season.copa.matches === 1, "el resto de competiciones no se toca");
const c2 = clampLigaToTable(season, totals, 25);
ok(c2.season === season && c2.totals === totals, "si el equipo ha jugado más, no se cambia nada");
ok(clampLigaToTable(season, totals, 0).season === season, "sin jornadas conocidas, tampoco");

console.log("2) La Champions: clasificado, no «octavos» como si ya se jugaran");
const mkp = (euro: any): any => ({
  id: "p1", club: "Real Madrid", week: 66, media: 90, nation: "España", flags: { euro_progress: JSON.stringify(euro) }, status: "active", position: "Delantero", last_name: "H",
});
const alive = getActiveStandings(mkp({ season: 6, round: 1, alive: true }), [], undefined);
ok(!!alive.euro && /Clasificado para octavos de final \(febrero\)/.test(alive.euro.roundLabel ?? ""), `tras los grupos: «${alive.euro?.roundLabel}»`);
const quarter = getActiveStandings(mkp({ season: 6, round: 2, alive: true }), [], undefined);
ok(/cuartos de final \(abril\)/.test(quarter.euro?.roundLabel ?? ""), `en cuartos: «${quarter.euro?.roundLabel}»`);
const out = getActiveStandings(mkp({ season: 6, round: 1, alive: false }), [], undefined);
ok(/Eliminado/.test(out.euro?.roundLabel ?? ""), "eliminado sigue diciendo eliminado");
const copa = getActiveStandings({ ...mkp({ season: 6, round: 0, alive: true }), flags: { copa_progress: JSON.stringify({ season: 6, round: 2, alive: true }) } }, [], undefined);
ok(/^Próxima ronda: /.test(copa.copa?.roundLabel ?? ""), `en la Copa: «${copa.copa?.roundLabel}»`);

console.log("3) Las bromas de mercado no se repiten");
const HUMOR = ["bulo", "intermediario", "confundido", "asador", "hincha_rico", "comision", "agente_doble"];
let maxPerKind = 0, tooClose = 0;
const player: any = { id: "p", club: "Real Madrid", nation: "España", position: "Delantero", last_name: "Hassan", agent_name: "Iñaki", media: 80, fama: 70, forma: 70, week: 62, status: "active", flags: { club_since: "58" }, nickname: null };
const seenAt: Record<string, number[]> = {};
for (let i = 0; i < 600; i++) {
  player.week = 62 + i * 10;
  const kindBefore = JSON.stringify(player.flags);
  void kindBefore;
  const ev = buildMarketRumorEvent(player);
  void ev;
  const last = String(player.flags.market_last_kind ?? "").split(",").pop() ?? "";
  if (HUMOR.includes(last)) (seenAt[last] ??= []).push(player.week);
}
for (const [k, weeks] of Object.entries(seenAt)) {
  maxPerKind = Math.max(maxPerKind, weeks.length);
  for (let i = 1; i < weeks.length; i++) if (weeks[i] - weeks[i - 1] < 40) tooClose++;
  void k;
}
ok(maxPerKind <= 2, `ninguna broma sale más de 2 veces en toda la carrera (máximo ${maxPerKind})`);
ok(tooClose === 0, "y con 40 turnos de distancia entre una y otra");
ok(Object.keys(seenAt).length > 0, `pero siguen existiendo (${Object.entries(seenAt).map(([k, w]) => `${k}×${w.length}`).join(", ")})`);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
