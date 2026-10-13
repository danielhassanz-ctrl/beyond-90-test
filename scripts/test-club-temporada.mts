/** Prueba sin IA: el club de cada temporada se reconstruye con los fichajes y no es siempre el actual. */
import { clubAtSeasonEnd } from "../src/lib/player/club-timeline";
import { getCompetitionStats } from "../src/lib/player/competition-stats";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
// Temporadas de 10 turnos: Madrid (0-1), Bayern (2-3), Liverpool (4)
const flags: any = { clubs_history: "Real Madrid|Bayern de Múnich" };
const changes = [{ week: 21, club: "Bayern de Múnich" }, { week: 41, club: "Liverpool FC" }];
ok(clubAtSeasonEnd(flags, 0, changes, "Liverpool FC") === "Real Madrid", "temporada 0: Real Madrid");
ok(clubAtSeasonEnd(flags, 1, changes, "Liverpool FC") === "Real Madrid", "temporada 1: Real Madrid");
ok(clubAtSeasonEnd(flags, 2, changes, "Liverpool FC") === "Bayern de Múnich", "temporada 2: Bayern");
ok(clubAtSeasonEnd(flags, 3, changes, "Liverpool FC") === "Bayern de Múnich", "temporada 3: Bayern");
ok(clubAtSeasonEnd(flags, 4, changes, "Liverpool FC") === "Liverpool FC", "temporada 4: Liverpool");
ok(clubAtSeasonEnd({ ...flags, club_s1: "Real Betis" }, 1, changes, "Liverpool FC") === "Real Betis", "lo anotado turno a turno manda");
ok(clubAtSeasonEnd({}, 2, [], "Girona FC") === "Girona FC", "sin cambios nunca: el actual");
ok(clubAtSeasonEnd({ club_s3: "Bayern de Múnich" }, 3, changes, "Liverpool FC", "Real Madrid") === "Real Madrid", "el club del trofeo manda sobre lo anotado (ganaste con el Madrid aunque ese verano te fueras)");

// Trayectoria completa: Madrid (liga y Champions en 29/30), Bayern (30/31), Liverpool (31/32)
const rows = [
  { title: "Fichas por el Real Madrid", description: "", category: "especial", event_id: "oferta-a", week: 1, consequences: { club: "Real Madrid" } },
  { title: "Fichas por el Bayern", description: "", category: "especial", event_id: "oferta-b", week: 42, consequences: { club: "Bayern de Múnich" } },
  { title: "Fichas por el Liverpool", description: "", category: "especial", event_id: "oferta-c", week: 53, consequences: { club: "Liverpool FC" } },
];
const fake: any = new Proxy({}, { get: (_t, prop) => (prop === "range" ? () => Promise.resolve({ data: rows, error: null }) : () => fake) });
const tf = JSON.stringify([{ k: "liga", s: 3, c: "Real Madrid" }, { k: "champions", s: 3, c: "Real Madrid" }, { k: "liga", s: 4, c: "Bayern de Múnich" }]);
const h = await getCompetitionStats(fake, { id: "p", week: 56, nation: "España" }, null, { trofeos: tf, clubs_history: "Real Madrid|Bayern de Múnich", club_s4: "Bayern de Múnich" } as any);
const r3 = h.history.find((x) => x.idx === 3 && x.team === "club");
const r4 = h.history.find((x) => x.idx === 4 && x.team === "club");
ok(r3?.club === "Real Madrid" && r3.titles === 2, `29/30: ${r3?.club}, ${r3?.titles} títulos`);
ok(r4?.club === "Bayern de Múnich" && r4.titles === 1, `30/31: ${r4?.club}, ${r4?.titles} título`);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
