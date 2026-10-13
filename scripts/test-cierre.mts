/** Prueba sin IA: el cierre de temporada no puede faltar, la tarjeta de resumen solo acompaña al cierre real y los partidos se reparten entre clubes. */
import { getCompetitionStats } from "../src/lib/player/competition-stats";
import { addClubSplit, addSimSeason, emptySim, withClubSplit } from "../src/lib/narrative/off-screen-matches";
import { buildSeasonCloseEvent } from "../src/lib/narrative/season-close";
import { priorityFor } from "../src/lib/narrative/ai-budget";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

// Un cliente de Supabase de mentira: todas las consultas devuelven la lista de eventos que le demos.
const fakeSupabase = (rows: any[] = []): any => {
  const chain: any = new Proxy({}, { get: (_t, prop) => (prop === "range" ? () => Promise.resolve({ data: rows, error: null }) : () => chain) });
  return chain;
};
const SEASON = 5; // semanas 51-60
const sim = (liga: number, goals: number) => { const s = emptySim(); s.liga = { matches: liga, goals, assists: 1, minutes: liga * 84 }; return s; };

console.log("1) Cierre de temporada");
const base: any = { id: "p", last_name: "Hassan", club: "Liverpool FC", week: 53, media: 90, status: "active", position: "Delantero", flags: {}, nation: "España" };
const ev: any = buildSeasonCloseEvent(base, SEASON);
ok(ev.id === "preseason-5" && ev.options.length === 2 && !/undefined|NaN|\[object/.test(JSON.stringify(ev)), `existe en código: «${ev.title}»`);
ok(priorityFor("preseason-5") === "high" && priorityFor("preseason-ev-x-52") !== "high", "la IA lo trata como prioridad alta (las escenas de vida de pretemporada, no)");
const recap = (id: string) => /^preseason-\d+$/.test(id);
ok(recap("preseason-5") && recap("preseason-12"), "«preseason-5» es el cierre real");
ok(!recap("preseason-ev-utillero-52") && !recap("preseason-ev-baile-vestuario-53"), "las escenas de pretemporada (utillero, baile del vestuario…) NO llevan la tarjeta de resumen");

console.log("2) Los partidos se reparten entre el club que dejas y el nuevo");
// Llevabas 3 partidos (3 goles) con el Bayern, fichas por el Liverpool y luego juegas 4 más
let flags: any = { club_since: "52", clubs_history: "Real Betis|Bayern de Múnich" };
flags = addSimSeason(flags, SEASON, sim(3, 3));
flags = addClubSplit(flags, SEASON, "Bayern de Múnich", 52); // al irte: 3 partidos con el Bayern
flags = addSimSeason(flags, SEASON, sim(4, 2)); // después, con el Liverpool
let r = await getCompetitionStats(fakeSupabase(), { id: "p", week: 56, nation: "España" }, null, flags);
ok(r.season.liga.matches === 4 && r.season.liga.goals === 2, `Liverpool: ${r.season.liga.matches} partidos, ${r.season.liga.goals} goles`);
ok(r.previous.length === 1 && r.previous[0].club === "Bayern de Múnich" && r.previous[0].stats.liga.matches === 3 && r.previous[0].stats.liga.goals === 3, `Bayern aparte: ${r.previous[0]?.stats.liga.matches} partidos, ${r.previous[0]?.stats.liga.goals} goles`);
ok(r.career.liga.matches === 7, "la carrera suma los dos");
const rowsSeason = r.history.filter((h) => h.idx === SEASON && h.team === "club");
ok(rowsSeason.length === 2 && rowsSeason[0].club === "Bayern de Múnich" && rowsSeason[0].matches === 3 && rowsSeason[1].matches === 4, `Trayectoria: la temporada se reparte en una fila por club (${rowsSeason.map((x) => x.club + " " + x.matches).join(" · ")})`);

console.log("3) Cambio de club anterior a este registro y recién hecho (tu caso)");
let f2: any = { club_since: "53", clubs_history: "Real Betis|Bayern de Múnich" };
f2 = addSimSeason(f2, SEASON, sim(3, 3));
r = await getCompetitionStats(fakeSupabase(), { id: "p", week: 53, nation: "España" }, null, f2);
ok(r.season.liga.matches === 0 && r.previous.length === 1 && r.previous[0].club === "Bayern de Múnich" && r.previous[0].stats.liga.matches === 3, "los 3 partidos pasan al Bayern y el Liverpool queda a 0");

console.log("3b) Ya has jugado con el club nuevo: el reparto es proporcional y se queda guardado");
let f4: any = { club_since: "53", clubs_history: "Real Betis|Bayern de Múnich" };
f4 = addSimSeason(f4, SEASON, sim(6, 4)); // 6 estimados en total a la semana 55: 3 con el Bayern y 3 con el Liverpool
r = await getCompetitionStats(fakeSupabase(), { id: "p", week: 55, nation: "España" }, null, f4);
ok(r.previous[0]?.stats.liga.matches === 3 && r.season.liga.matches === 3, `Bayern ${r.previous[0]?.stats.liga.matches} · Liverpool ${r.season.liga.matches} (no 6 y 0)`);
ok(!!r.splitToPersist, "devuelve el reparto para que la página lo guarde una vez");
const saved = withClubSplit(f4, r.splitToPersist!);
const f5: any = addSimSeason(saved, SEASON, sim(4, 1)); // pasan más semanas y se estiman 4 partidos más
const r2 = await getCompetitionStats(fakeSupabase(), { id: "p", week: 59, nation: "España" }, null, f5);
ok(r2.previous[0]?.stats.liga.matches === 3 && r2.season.liga.matches === 7 && r2.splitToPersist === null, `guardado: el Bayern sigue en ${r2.previous[0]?.stats.liga.matches} y el Liverpool suma hasta ${r2.season.liga.matches}`);

console.log("4) Sin cambio de club no hay bloque aparte");
let f3: any = { club_since: "11", clubs_history: "Real Betis" };
f3 = addSimSeason(f3, SEASON, sim(5, 2));
r = await getCompetitionStats(fakeSupabase(), { id: "p", week: 56, nation: "España" }, null, f3);
ok(r.season.liga.matches === 5 && r.previous.length === 0, "5 partidos y ningún bloque «antes del fichaje»");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
