/** Prueba sin red: el reto del día (mismo reto para todos, una vez al día, tirada fija, rachas, premios y tarjeta). */
import { madridDay, challengeOfDay, challengeState, playChallenge, playedText, shareText, winChance } from "../src/lib/narrative/daily-challenge";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));

const mk = (o: any = {}): any => ({ id: "p1", last_name: "Hassan", nickname: null, media: 75, forma: 70, fama: 40, flags: {}, ...o });
const at = (iso: string) => new Date(iso);

console.log("1) El día");
ok(madridDay(at("2026-01-01T12:00:00Z")) === 0 && madridDay(at("2026-01-02T12:00:00Z")) === 1, "el 1 de enero de 2026 es el día 0");
ok(madridDay(at("2026-06-30T22:30:00Z")) === madridDay(at("2026-07-01T10:00:00Z")), "pasada la medianoche de Madrid (22:30 UTC en verano) ya es el día siguiente");

console.log("2) El reto es el mismo para todos");
const a = challengeOfDay(300, mk()), b = challengeOfDay(300, mk({ id: "otro", last_name: "García", nickname: "Pepe" }));
ok(a.key === b.key && a.stage === b.stage && a.options.map((o) => o.label).join() === b.options.map((o) => o.label).join(), "misma jugada y mismas opciones");
ok(/Hassan/.test(challengeOfDay(300, mk()).setup + challengeOfDay(301, mk()).setup + challengeOfDay(302, mk()).setup + challengeOfDay(303, mk()).setup + challengeOfDay(304, mk()).setup + challengeOfDay(305, mk()).setup + challengeOfDay(306, mk()).setup + challengeOfDay(307, mk()).setup + challengeOfDay(308, mk()).setup + challengeOfDay(309, mk()).setup + challengeOfDay(310, mk()).setup + challengeOfDay(311, mk()).setup), "el nombre del jugador sale en los textos");

console.log("3) Variedad y limpieza");
const keys: string[] = [];
let broken = 0, repeats = 0;
for (let d = 0; d < 400; d++) {
  const c = challengeOfDay(d, mk());
  keys.push(c.key);
  if (d > 0 && keys[d] === keys[d - 1]) repeats++;
  if (bad(c) || c.options.length !== 3 || c.options.some((o) => !o.win || !o.lose || o.chance <= 0 || o.chance >= 1) || /\$\{|undefined/.test(c.setup)) broken++;
}
ok(broken === 0, "400 días: textos limpios, tres opciones y probabilidades válidas");
ok(new Set(keys).size >= 12, `${new Set(keys).size} jugadas distintas`);
ok(repeats === 0, "nunca la misma jugada dos días seguidos");

console.log("4) Jugarlo");
const day = madridDay(at("2026-10-16T10:00:00Z"));
const fresh = mk();
const r1 = playChallenge(fresh, "a", at("2026-10-16T10:00:00Z")) as any;
ok(!("error" in r1) && typeof r1.win === "boolean" && r1.streak === 1 && r1.flags.dc_last === String(day) && !bad({ ...r1, streakBonus: "" }), "se juega y deja la racha en 1");
const r1b = playChallenge(fresh, "a", at("2026-10-16T11:00:00Z")) as any;
ok(r1b.win === r1.win, "tirada fija: reenviar el formulario no cambia el resultado");
const played = mk({ flags: r1.flags });
ok("error" in (playChallenge(played, "b", at("2026-10-16T18:00:00Z")) as any), "una vez al día");
ok("error" in (playChallenge(fresh, "z", at("2026-10-16T10:00:00Z")) as any), "opción inexistente rechazada");
const st = challengeState(played, day);
ok(st.playedToday && st.win === r1.win && st.played === 1, "el estado recuerda lo jugado hoy");
ok(playedText(played, day) === (r1.win ? challengeOfDay(day, played).options[0].win : challengeOfDay(day, played).options[0].lose), "al volver, enseña el mismo desenlace");
ok(/Reto del día #/.test(shareText(played, day) ?? "") && /Racha: 1 día\b/.test(shareText(played, day) ?? ""), "la tarjeta compartible cuenta la jugada y la racha");

console.log("5) Rachas");
let p = mk();
const gains: number[] = [];
for (let i = 0; i < 31; i++) {
  const now = new Date(Date.UTC(2026, 9, 1 + i, 10));
  const r = playChallenge(p, "b", now) as any;
  if ("error" in r) { fails++; console.log("  ✗ error inesperado " + r.error); break; }
  p = { ...p, flags: { ...p.flags, ...r.flags } };
  if (r.streakBonus) gains.push(r.streak);
}
ok(gains.join() === "3,7,14,30", `premios de racha en 3, 7, 14 y 30 (${gains.join(",")})`);
ok(challengeState(p, madridDay(new Date(Date.UTC(2026, 10, 1, 10)))).streak === 31 && challengeState(p, madridDay(new Date(Date.UTC(2026, 10, 1, 10)))).streakAlive, "al día siguiente la racha sigue viva");
ok(challengeState(p, madridDay(new Date(Date.UTC(2026, 10, 5, 10)))).streak === 0, "tras saltarte días, la racha vuelve a 0");
const after = playChallenge(mk({ flags: { dc_last: String(madridDay(new Date(Date.UTC(2026, 9, 1, 10)))), dc_streak: "20", dc_best: "20" } }), "b", new Date(Date.UTC(2026, 9, 5, 10))) as any;
ok(after.streak === 1 && after.flags.dc_best === "20", "tras romper la racha se empieza en 1 y se guarda la mejor");

console.log("6) Equilibrio");
ok(winChance(mk({ media: 95, forma: 95 }), 0.9) <= 0.9 && winChance(mk({ media: 30, forma: 10 }), 0.2) >= 0.15, "las probabilidades quedan entre 15 y 90 %");
ok(winChance(mk({ media: 90 }), 0.5) > winChance(mk({ media: 55 }), 0.5), "más nivel, más opciones");
let wins = 0, total = 0, rewardSafe = 0, rewardRisk = 0, nSafe = 0, nRisk = 0;
for (let i = 0; i < 3000; i++) {
  const pl = mk({ id: "u" + i, media: 50 + (i % 40), forma: 40 + (i % 50) });
  const day2 = 100 + (i % 50);
  const now = new Date(Date.UTC(2026, 0, 1 + day2, 10));
  const ch = challengeOfDay(day2, pl);
  const opt = ch.options[i % 3];
  const r = playChallenge(pl, opt.id, now) as any;
  total++;
  if (r.win) wins++;
  if (r.win && opt.chance >= 0.6) { rewardSafe += r.fama; nSafe++; }
  if (r.win && opt.chance <= 0.4) { rewardRisk += r.fama; nRisk++; }
  if (r.fama > 6 || r.patrimonio > 30000 || r.moral < -2) { fails++; console.log("  ✗ premio fuera de rango", r.fama, r.patrimonio, r.moral); break; }
}
ok(wins / total > 0.35 && wins / total < 0.65, `acierto global razonable (${Math.round((wins / total) * 100)} %)`);
ok(nSafe > 0 && nRisk > 0 && rewardRisk / nRisk >= rewardSafe / nSafe, "la opción arriesgada, cuando sale, premia más");

if (fails) { console.log(`\n${fails} fallos`); process.exit(1); }
console.log("\nTodo bien");
