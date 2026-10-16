/** Prueba sin red: qué aviso push recibe cada jugador (frecuencia, racha, inactividad) y que el service worker y el cron existen. */
import { existsSync, readFileSync } from "node:fs";
import { reminderFor, MIN_HOURS_BETWEEN_PUSHES } from "../src/lib/push/reminders";
import { madridDay } from "../src/lib/narrative/daily-challenge";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));

const now = new Date("2026-10-16T17:00:00Z");
const day = madridDay(now);
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();
const mk = (o: any = {}): any => ({ last_name: "Hassan", nickname: null, status: "active", flags: {}, last_active_at: hoursAgo(5), ...o });

console.log("1) Quién recibe aviso");
const base = reminderFor(mk(), null, now);
ok(base !== null && /Reto del día/.test(base.title) && base.url === "/mi-jugador/reto" && !bad(base), "quien ha entrado hoy y no ha jugado el reto: aviso del reto");
ok(reminderFor(mk({ status: "retired" }), null, now) === null, "un retirado, no");
ok(reminderFor(mk(), hoursAgo(MIN_HOURS_BETWEEN_PUSHES - 2), now) === null, "no más de un aviso cada 20 horas");
ok(reminderFor(mk(), hoursAgo(MIN_HOURS_BETWEEN_PUSHES + 2), now) !== null, "pasadas 20 horas, sí");
ok(reminderFor(mk({ last_active_at: hoursAgo(24 * 20) }), null, now) === null, "quien lleva 20 días sin entrar ya no recibe nada (no ser pesado)");
ok(reminderFor(mk({ flags: { dc_last: String(day), dc_streak: "1", dc_win: true, dc_opt: "a" } }), null, now) === null, "quien ya jugó el reto de hoy y viene a menudo, no recibe aviso");

console.log("2) La racha");
const streak = reminderFor(mk({ flags: { dc_last: String(day - 1), dc_streak: "6" } }), null, now);
ok(streak !== null && /racha de 6/.test(streak.title) && /^Hoy: «/.test(streak.body), "con racha viva de 6 días, el aviso habla de la racha");
const short = reminderFor(mk({ flags: { dc_last: String(day - 1), dc_streak: "1" } }), null, now);
ok(short !== null && /Reto del día/.test(short.title), "con una racha de 1 día no se dramatiza");

console.log("3) La carrera parada");
let sentAway = 0, sentAwayPlayed = 0;
for (let d = 0; d < 9; d++) {
  const n = new Date(now.getTime() + d * 86_400_000);
  if (reminderFor(mk({ last_active_at: new Date(n.getTime() - 5 * 86_400_000).toISOString() }), null, n)) sentAway++;
  if (reminderFor(mk({ last_active_at: new Date(n.getTime() - 5 * 86_400_000).toISOString(), flags: { dc_last: String(madridDay(n)), dc_streak: "1", dc_opt: "a" } }), null, n)) sentAwayPlayed++;
}
ok(sentAway >= 2 && sentAway <= 4, `quien lleva 5 días fuera recibe uno de cada tres días (${sentAway} de 9)`);
ok(sentAwayPlayed <= 4, `y quien ya jugó el reto del día no recibe más (${sentAwayPlayed} de 9)`);
const back = reminderFor(mk({ last_active_at: hoursAgo(24 * 2.5) }), null, now);
ok(back !== null && /te echa de menos/.test(back.title) && /parada/.test(back.body), "a los dos días fuera, aviso de vuelta con el reto");
ok(reminderFor(mk({ flags: { dc_last: String(day - 1), dc_streak: "3" }, last_active_at: hoursAgo(24 * 10) }), null, now) !== null, "jugar el reto cuenta como actividad (la racha sigue)");

console.log("4) Textos");
let broken = 0;
for (let i = 0; i < 300; i++) {
  const n = new Date(now.getTime() + i * 86_400_000);
  const r = reminderFor(mk({ nickname: i % 2 ? "Pepe" : null, last_active_at: hoursAgo(5 + (i % 9) * 12) }), null, n);
  if (r && (bad(r) || r.title.length > 60 || r.body.length > 140)) broken++;
}
ok(broken === 0, "300 días: textos limpios y cortos (los avisos largos se recortan en el móvil)");

console.log("5) Piezas del sistema");
ok(existsSync("public/sw.js") && /addEventListener\("push"/.test(readFileSync("public/sw.js", "utf8")) && /notificationclick/.test(readFileSync("public/sw.js", "utf8")), "el service worker maneja push y clic");
ok(existsSync("src/app/api/cron/recordatorios/route.ts") && /CRON_SECRET/.test(readFileSync("src/app/api/cron/recordatorios/route.ts", "utf8")), "el cron exige su secreto");
ok(/recordatorios/.test(readFileSync("vercel.json", "utf8")), "el cron está programado en vercel.json");
ok(/enable row level security/i.test(readFileSync("supabase/migrations/20261017_push_subscriptions.sql", "utf8")) && !/for insert/i.test(readFileSync("supabase/migrations/20261017_push_subscriptions.sql", "utf8")), "la tabla de dispositivos tiene RLS y sin alta directa de usuarios");

if (fails) { console.log(`\n${fails} fallos`); process.exit(1); }
console.log("\nTodo bien");
