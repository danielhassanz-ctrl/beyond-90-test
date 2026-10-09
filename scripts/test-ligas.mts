/** Prueba sin IA de las ligas: un club extranjero juega SU liga, su copa, su clasificación y rivales europeos de otras ligas. */
import { buildMatchCalendar, getEuropeanCompetitionFor, getClubLevel } from "../src/lib/calendar/match-calendar";
import { leagueOf, LEAGUES } from "../src/lib/calendar/leagues";
import { getActiveStandings } from "../src/lib/narrative/standings";

let bad = 0;
const check = (c: boolean, m: string) => { if (!c) { bad++; console.log("FALLO:", m); } };

for (const club of ["Bayern de Múnich", "Manchester City", "Juventus", "Paris Saint-Germain", "Real Madrid", "Al-Nassr FC", "Aston Villa", "Getafe CF"]) {
  const lg = leagueOf(club);
  const rivals = new Set<string>();
  const cups = new Set<string>();
  for (let season = 1; season < 6; season++) {
    for (const m of buildMatchCalendar(club, season, { copa: { round: 5, alive: true }, euro: { round: 4, alive: true } })) {
      if (m.competition === "liga") { rivals.add(m.rivalClub); check(lg.teams.includes(m.rivalClub), `${club}: rival de liga ${m.rivalClub} no es de la ${lg.name}`); check(m.description.startsWith(lg.name), `${club}: descripción ${m.description}`); }
      if (m.competition === "copa") { cups.add(m.rivalClub); check(m.description.startsWith(lg.cup), `${club}: copa ${m.description}`); }
      if (m.competition === "champions" || m.competition === "europa") check(!lg.teams.includes(m.rivalClub), `${club}: rival europeo de su propia liga: ${m.rivalClub}`);
    }
  }
  const eu = getEuropeanCompetitionFor(club);
  const p: any = { id: "t1", club, week: 28, nation: "España", flags: {}, status: "active" };
  const st = getActiveStandings(p, ["pretemp-amistoso", "rookie-debut-oficial"], { wins: 2, draws: 1, losses: 0, played: 3, results: [{ inSeasonWeek: 3, r: "W" }, { inSeasonWeek: 4, r: "W" }, { inSeasonWeek: 5, r: "D" }] });
  const rows = st.primary?.rows ?? [];
  check(rows.length === lg.teams.length, `${club}: tabla de ${rows.length} equipos, esperaba ${lg.teams.length}`);
  check(rows.every((r) => lg.teams.includes(r.club) || r.club === club), `${club}: tabla con clubes de otra liga`);
  console.log(`${club.padEnd(22)} ${lg.name.padEnd(17)} nivel ${getClubLevel(club).padEnd(7)} euro: ${eu?.competition ?? "—"} | rivales liga ${rivals.size} | copa ${[...cups].slice(0, 3).join(", ")} | tabla: ${st.primary?.label} (${rows.length})`);
}
console.log(bad === 0 ? "TODO OK" : `${bad} fallos`);
