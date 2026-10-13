/** Prueba sin IA: fichar a mitad de temporada y la competición europea (cup-tied, entrar en la ronda del equipo, sin quedarse en grupos). */
import { euroOnTransfer, hasPlayedEuropeThisSeason, euroPlayedKey } from "../src/lib/calendar/euro-transfer";
import { buildMatchCalendar } from "../src/lib/calendar/match-calendar";
import { getSeasonProgress } from "../src/lib/calendar/competition-progress";
import { addSimSeason, emptySim } from "../src/lib/narrative/off-screen-matches";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const SEASON = 5;
const week = SEASON * 10 + 7; // enero

console.log("1) Ya jugaste la Champions con el club anterior: te inscriben igualmente");
const sim = emptySim(); sim.champions = { matches: 6, goals: 3, assists: 2, minutes: 511 };
const flagsA = addSimSeason({}, SEASON, sim);
ok(hasPlayedEuropeThisSeason(flagsA, SEASON), "se detecta que ya jugaste en Europa esta temporada");
let jugable = 0;
for (let i = 0; i < 200; i++) {
  const a = euroOnTransfer(flagsA, "Liverpool FC", "Real Madrid", week, 91);
  const progA = JSON.parse(String(a.flagsPatch.euro_progress));
  if (!progA.tied && progA.round >= 1 && progA.alive) jugable++;
}
ok(jugable > 150, `entras en las eliminatorias del Madrid (${jugable}/200), sin inscripción exclusiva`);
const player: any = { id: "p", club: "Real Madrid", week, flags: { euro_progress: JSON.stringify({ season: SEASON, round: 1, alive: true }) } };
const cal = buildMatchCalendar("Real Madrid", SEASON, getSeasonProgress(player, SEASON));
ok(cal.some((m) => m.euroKoRound === 1), "el calendario trae la eliminatoria de Champions");

console.log("2) No la habías jugado: entras en la ronda del equipo");
let vivos = 0, muertos = 0;
for (let i = 0; i < 300; i++) {
  const r = euroOnTransfer({}, "Girona FC", "Real Madrid", week, 91);
  const p = JSON.parse(String(r.flagsPatch.euro_progress));
  if (p.alive && p.round >= 1) vivos++; else if (!p.alive && !p.tied) muertos++;
}
ok(vivos > 200 && muertos > 5, `un grande en enero: sigue vivo ${vivos}/300, eliminado en grupos ${muertos}/300 (nunca se queda en «grupos» sin más)`);

console.log("3) Otros casos");
ok(euroOnTransfer({}, "Real Madrid", "Cádiz CF", week, 80).flagsPatch.euro_progress === "", "a un club sin Europa: se limpia");
const early = euroOnTransfer({}, "Girona FC", "Real Madrid", SEASON * 10 + 2, 80);
ok(early.flagsPatch.euro_progress === "" && early.note === null, "fichar en agosto: juegas la fase de grupos con normalidad");
ok(euroPlayedKey(5) === "euro_played_5", "clave estable del registro de partidos europeos");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
