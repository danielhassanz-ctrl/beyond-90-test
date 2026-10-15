/** Prueba sin IA: con el jugador lesionado la Champions sigue su curso (se decide la fase de grupos, hay eliminatorias, cae o llega a la final). */
import { getMatchesInWeek } from "../src/lib/calendar/match-calendar";
import { getSeasonProgress } from "../src/lib/calendar/competition-progress";
import { settleOffscreenMatch } from "../src/lib/calendar/offscreen-progress";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };

const SEASON = 6;
const mk = (i: number): any => ({ id: `p-${i}`, last_name: "Hassan", club: "Real Madrid", media: 88, week: SEASON * 10 + 1, flags: {}, nation: "España" });

/** Una temporada entera con el jugador fuera (lesionado): el equipo juega igual. */
function playSeasonInjured(p: any) {
  const log: string[] = [];
  for (let w = 1; w <= 10; w++) {
    p.week = SEASON * 10 + w;
    const done = new Set<string>();
    for (let guard = 0; guard < 4; guard++) {
      const matches = getMatchesInWeek(p.week, p.club, getSeasonProgress(p, SEASON)).filter((m) => m.competition === "champions");
      const m = matches.find((x) => !done.has(x.euroKoRound ? `k${x.euroKoRound}` : `g${x.euroGroupIndex}`));
      if (!m) break;
      const key = m.euroKoRound ? `k${m.euroKoRound}` : `g${m.euroGroupIndex}`;
      done.add(key);
      const off = settleOffscreenMatch(p, m);
      log.push(`${w}:${key}${off.win === undefined ? "" : off.win ? "+" : "-"}`);
    }
  }
  return { log, progress: getSeasonProgress(p, SEASON) };
}

console.log("1) Un caso concreto");
const one = playSeasonInjured(mk(1));
console.log("    " + one.log.join("  "));
ok(one.log.some((l) => l.includes(":g2")), "se juega la última jornada de grupos aunque estés lesionado");
ok(!(one.progress.euro.round === 0 && one.progress.euro.alive), "la fase de grupos queda decidida (pasa o cae), no se queda en el aire");

console.log("2) 600 temporadas lesionado");
let qualified = 0, withKo = 0, stuck = 0, koAfterEliminated = 0, finals = 0, titles = 0;
for (let i = 0; i < 600; i++) {
  const p = mk(i);
  const { log, progress } = playSeasonInjured(p);
  if (progress.euro.round === 0 && progress.euro.alive) stuck++;
  const reachedKo = log.some((l) => /:k\d/.test(l));
  if (progress.euro.round > 0 || reachedKo) qualified++;
  if (reachedKo) withKo++;
  if (log.some((l) => l.includes(":k4"))) finals++;
  if (log.some((l) => l.includes(":k4+"))) titles++;
  const lostAt = log.findIndex((l) => l.endsWith("-") && /:k\d/.test(l));
  if (lostAt >= 0 && log.slice(lostAt + 1).some((l) => /:k\d/.test(l) && !l.startsWith(log[lostAt].split(":")[0] + ":"))) koAfterEliminated++;
}
ok(stuck === 0, "ninguna temporada se queda con la fase de grupos sin decidir");
ok(qualified / 600 > 0.8 && qualified / 600 < 0.995, `un grande pasa de grupos en ${Math.round((qualified / 600) * 100)} %`);
ok(withKo === qualified, "todos los que pasan tienen eliminatorias en el calendario");
ok(koAfterEliminated === 0, "tras caer eliminado no hay más partidos europeos");
console.log(`    llegan a la final: ${finals} · la ganan sin ti: ${titles}`);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
