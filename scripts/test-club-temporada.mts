/** Prueba sin IA: el club de cada temporada se reconstruye con los fichajes y no es siempre el actual. */
import { clubAtSeasonEnd } from "../src/lib/player/club-timeline";

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
console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
