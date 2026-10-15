/** Prueba sin IA: premios de la temporada (Pichichi, Zamora, mejor jugador de Liga, Champions y torneo) con listas de diez y tu puesto por méritos reales. */
import { shouldTriggerSeasonAwards, buildSeasonAwardsEvent, computeSeasonAwards, seasonStats, seasonAwardsId } from "../src/lib/narrative/season-awards";
import { TROFEO_LABEL, INDIVIDUAL } from "../src/lib/honours";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));

// Temporada 6 recién empezada (turno 2): se cierra la 5. Inicio de la 5 con 20 goles acumulados y de la 6 con 38.
const mk = (o: any = {}): any => ({
  id: "p1", last_name: "Hassan", nickname: null, club: "Real Madrid", nation: "España", position: "Delantero", week: 62, media: 90, fama: 85, status: "active", mode: "pro",
  stats_goals: 38, stats_assists: 12, stats_matches_played: 60, stats_clean_sheets: 0,
  flags: { sb_5_g: "20", sb_5_a: "5", sb_5_m: "40", sb_5_c: "0", sb_6_g: "38", sb_6_a: "12", sb_6_m: "60", sb_6_c: "0" }, ...o,
});
const used = (n: number) => [`preseason-${n}`];

console.log("1) Cuándo toca");
ok(shouldTriggerSeasonAwards(mk(), used(6)), "tras vivir el cierre de temporada, toca");
ok(!shouldTriggerSeasonAwards(mk(), []), "no antes del cierre de temporada");
ok(!shouldTriggerSeasonAwards(mk(), [...used(6), seasonAwardsId(5)]), "una sola vez");
ok(!shouldTriggerSeasonAwards(mk({ week: 68 }), used(6)), "no a mitad de temporada");
ok(!shouldTriggerSeasonAwards(mk({ stats_matches_played: 41, flags: { sb_5_m: "40", sb_6_m: "41" } }), used(6)), "sin partidos esa temporada no hay premios");

console.log("2) Estadísticas de la temporada = acumulado menos lo de antes");
const st = seasonStats(mk(), 5);
ok(st.goals === 18 && st.assists === 7 && st.matches === 20, `18 goles, 7 asistencias, 20 partidos (${st.goals}/${st.assists}/${st.matches})`);
const sinMarca = seasonStats(mk({ flags: {} }), 5);
ok(sinMarca.goals > 0, "sin marcas de inicio (partidas antiguas) se reparte el total");

console.log("3) Un delantero goleador");
const aw = computeSeasonAwards(mk());
const kinds = aw.map((a) => a.kind);
ok(kinds.includes("pichichi") && kinds.includes("mejor_liga") && !kinds.includes("zamora"), `delantero: ${kinds.join(", ")} (sin Zamora)`);
for (const a of aw) {
  ok(a.top.length === 10 && a.top.filter((r) => r.isPlayer).length <= 1 && new Set(a.top.map((r) => r.name)).size === 10, `${a.title}: lista de 10 sin nombres repetidos`);
}
const pich = aw.find((a) => a.kind === "pichichi")!;
ok(pich.rank >= 1 && pich.top[0].value >= pich.top[1].value, "la lista del Pichichi está ordenada de más a menos goles");

console.log("4) Cuanto más marcas, mejor puesto; lesionado, peor");
const rank = (goals: number, extra: any = {}) => computeSeasonAwards(mk({ stats_goals: 20 + goals, ...extra, flags: { sb_5_g: "20", sb_5_a: "5", sb_5_m: "40", sb_5_c: "0", sb_6_g: String(20 + goals), sb_6_a: "12", sb_6_m: "60", sb_6_c: "0", ...(extra.flags ?? {}) } })).find((a) => a.kind === "pichichi")?.rank ?? 99;
ok(rank(24) <= rank(8), "con más goles, mejor puesto");
let wins = 0;
for (let i = 0; i < 200; i++) {
  const r = computeSeasonAwards(mk({ id: `p${i}`, stats_goals: 20 + 16, stats_matches_played: 60, flags: { sb_5_g: "20", sb_5_a: "5", sb_5_m: "40", sb_5_c: "0", sb_6_g: "36", sb_6_a: "12", sb_6_m: "60", sb_6_c: "0" } })).find((a) => a.kind === "pichichi");
  if (r?.won) wins++;
}
ok(wins > 0 && wins < 200, `con 16 goles en 20 partidos clave ganas el Pichichi a veces (${wins}/200), no siempre`);

console.log("5) Un portero: Zamora, no Pichichi");
const gk = mk({ position: "Portero", stats_clean_sheets: 11, flags: { sb_5_g: "0", sb_5_a: "0", sb_5_m: "40", sb_5_c: "4", sb_6_g: "0", sb_6_a: "0", sb_6_m: "60", sb_6_c: "11" } });
const gkAw = computeSeasonAwards(gk).map((a) => a.kind);
ok(gkAw.includes("zamora") && !gkAw.includes("pichichi"), `portero: ${gkAw.join(", ")}`);
let zw = 0;
for (let i = 0; i < 200; i++) if (computeSeasonAwards({ ...gk, id: `g${i}` }).find((a) => a.kind === "zamora")?.won) zw++;
ok(zw > 20 && zw < 190, `con 7 porterías a cero en 20 partidos el Zamora es posible, no seguro (${zw}/200)`);

console.log("6) Champions y torneos de selecciones");
const champ = mk({ flags: { ...mk().flags, euro_progress: JSON.stringify({ season: 5, round: 4, alive: true }), trofeos: JSON.stringify([{ k: "champions", s: 5, c: "Real Madrid" }]) } });
ok(computeSeasonAwards(champ).some((a) => a.kind === "mvp_champions"), "con la Champions ganada hay lista de mejor jugador de la Champions");
ok(!computeSeasonAwards(mk({ flags: { ...mk().flags, euro_progress: JSON.stringify({ season: 5, round: 0, alive: false }) } })).some((a) => a.kind === "mvp_champions"), "eliminado en grupos, no hay lista");
const torneo = mk({ flags: { ...mk().flags, torneo_result_mundial_6: "campeon", "match_decision_61_torneo.3": "goal", "match_decision_61_torneo.4": "assist", "match_decision_61_torneo.5": "goal" } });
const tAw = computeSeasonAwards(torneo).find((a) => a.kind === "mvp_torneo");
ok(!!tAw && /Mundial/.test(tAw.title), "con el Mundial jugado este verano hay lista del mejor jugador del Mundial");
ok(computeSeasonAwards(mk()).every((a) => a.kind !== "mvp_torneo"), "sin torneo, no hay lista");

console.log("7) La escena");
const ev = buildSeasonAwardsEvent(mk());
ok(!bad(ev) && ev.options.length === 2 && /PICHICHI/.test(ev.description) && /Premios de la temporada 2031\/32/.test(ev.title), `título y listas: «${ev.title}»`);
ok(ev.options.every((o) => o.consequences.flags?.sa_done_5 === true), "queda anotada para no repetirse");
let milestone = 0, withWin = 0;
for (let i = 0; i < 100; i++) {
  const e = buildSeasonAwardsEvent(mk({ id: `p${i}` }));
  const won = Object.keys(e.options[0].consequences.flags ?? {}).filter((k) => k.startsWith("award_won_"));
  if (won.length > 0) { withWin++; if (e.isMilestone) milestone++; }
}
ok(withWin === 0 || milestone === withWin, "si ganas algún premio, es un hito compartible");
ok(["pichichi", "zamora", "mejor_liga", "mvp_champions", "mvp_torneo"].every((k) => (TROFEO_LABEL as any)[k] && INDIVIDUAL.has(k as any)), "los premios nuevos están en el palmarés como individuales");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
