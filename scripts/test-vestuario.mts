/** Prueba sin red: el vestuario como sistema (compañeros, ambiente, acciones, escenas y cambios de relación). */
import { personalizeEvent } from "../src/lib/narrative/npcs";
import { getLockerRoom, lockerMood, doMateAction, actionBlocked, applyLockerDeltas, shouldTriggerLockerScene, buildLockerScene, personalKey, MAX_ACTS_PER_TURN } from "../src/lib/narrative/locker-room";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));

const mk = (o: any = {}): any => ({
  id: "p1", last_name: "Hassan", nickname: null, club: "Real Betis", nation: "España", position: "Delantero", week: 52, media: 75, fama: 50, forma: 70, moral: 70, rel_entrenador: 55, rel_vestuario: 50,
  patrimonio: 100000, status: "active", mode: "pro", agent_name: "Iñaki", flags: { club_since: "20" }, ...o,
});

console.log("1) Los seis compañeros");
const room = getLockerRoom(mk());
ok(room.length === 6 && new Set(room.map((m) => m.role)).size === 6, "seis compañeros, uno por papel");
ok(room.every((m) => m.name.trim().split(" ").length >= 2 && m.rel >= 0 && m.rel <= 100 && m.age >= 17) && !bad(room), "con nombre completo, relación 0-100 y edad");
ok(JSON.stringify(getLockerRoom(mk())) === JSON.stringify(room), "son estables para esa partida");
ok(JSON.stringify(getLockerRoom(mk({ club: "Sevilla FC" })).map((m) => m.name)) !== JSON.stringify(room.map((m) => m.name)), "cambian al cambiar de club");
ok(getLockerRoom(mk({ club: "Agente libre" })).length === 0, "sin club, sin vestuario");
const hi = getLockerRoom(mk({ rel_vestuario: 90 })), lo = getLockerRoom(mk({ rel_vestuario: 10 }));
ok(hi.every((m, i) => m.rel > lo[i].rel), "tu relación general con el vestuario sube la de todos");

console.log("2) Ambiente");
ok(lockerMood(mk({ rel_vestuario: 95 })).label === "Unido" || lockerMood(mk({ rel_vestuario: 95 })).tone === "good", "con relación altísima, el vestuario está unido");
ok(lockerMood(mk({ rel_vestuario: 5 })).tone === "bad", "con relación bajísima, hay tensión");

console.log("3) Dedicar tiempo");
const p0 = mk();
const r1 = doMateAction(p0, "amigo", "cenar", () => 0.1) as any;
ok(!("error" in r1) && r1.ok && r1.patrimonio === -150 && r1.flags[personalKey("Real Betis", "amigo")] === "7", "cena con éxito: +7 de relación y 150 € menos");
const r2 = doMateAction(p0, "amigo", "cenar", () => 0.95) as any;
ok(!("error" in r2) && !r2.ok && Number(r2.flags[personalKey("Real Betis", "amigo")]) === 2, "cena fallida: gana poco");
const r3 = doMateAction(p0, "rival", "tender_mano", () => 0.9) as any;
ok(!("error" in r3) && !r3.ok && Number(r3.flags[personalKey("Real Betis", "rival")]) === -2, "mano rechazada: baja un poco");
ok("error" in (doMateAction(p0, "rival", "cenar") as any), "no se puede cenar con el rival");
ok("error" in (doMateAction(mk({ patrimonio: 20 }), "amigo", "cenar") as any), "sin dinero no se invita");
const after = mk({ flags: { club_since: "20", ...(r1 as any).flags } });
ok(actionBlocked(after, "amigo", "charlar") !== null, "acabas de estar con él: espera");
const two = mk({ flags: { club_since: "20", vr_acts_week: "52", vr_acts_n: String(MAX_ACTS_PER_TURN) } });
ok(actionBlocked(two, "veterano", "charlar") !== null, "máximo dos compañeros por turno");
ok(getLockerRoom(after).find((m) => m.key === "amigo")!.rel > room.find((m) => m.key === "amigo")!.rel, "la cena sube la relación con ese compañero");
const rg = doMateAction(p0, "capitan", "consejo", () => 0.5) as any;
const otherKey = personalKey("Real Betis", "amigo");
ok(!("error" in rg) && rg.flags[otherKey] === "-1", "lo que ganas con un veterano lo nota un joven");

console.log("4) Cambios desde las escenas");
const d = applyLockerDeltas(mk(), "capitan:+4,rival:-6,xx:+3,joven:abc");
ok(d[personalKey("Real Betis", "capitan")] === "4" && d[personalKey("Real Betis", "rival")] === "-6" && Object.keys(d).length === 2, "se aplican los papeles válidos y se ignoran los malos");
ok(applyLockerDeltas(mk({ flags: { [personalKey("Real Betis", "capitan")]: "39" } }), "capitan:+9")[personalKey("Real Betis", "capitan")] === "40", "tope en 40");
ok(Object.keys(applyLockerDeltas(mk(), undefined)).length === 0, "sin delta, nada");

console.log("5) Escenas");
ok(!shouldTriggerLockerScene(mk({ week: 10 }), () => 0), "no salen antes de la semana 14");
ok(!shouldTriggerLockerScene(mk({ flags: { club_since: "20", vr_scene_last: "50" } }), () => 0), "no salen dos en menos de 5 turnos");
ok(!shouldTriggerLockerScene(mk({ club: "SELECCIÓN: España" }), () => 0), "no salen en la selección");
ok(shouldTriggerLockerScene(mk(), () => 0), "salen cuando toca");
const titles = new Set<string>();
let broken = 0;
for (let i = 0; i < 400; i++) {
  const p = mk({ id: "p" + (i % 7), club: ["Real Betis", "Sevilla FC", "Valencia CF"][i % 3], rel_vestuario: (i * 13) % 100, week: 30 + (i % 60), flags: { club_since: "10", ...(i % 5 === 0 ? { [personalKey("Real Betis", "rival")]: "-20" } : {}) } });
  const e = buildLockerScene(p, () => ((i * 37) % 100) / 100);
  if (!e) continue;
  titles.add(e.title.replace(/\S+ \S+/g, "X"));
  const fine = !bad({ t: e.title, d: e.description, o: e.options }) && e.options.length >= 2 && e.options.every((o) => typeof o.consequences?.flags?.vr_delta === "string" && o.outcomeText);
  if (!fine) broken++;
}
ok(broken === 0, "400 escenas: opciones con delta y textos limpios");
ok(titles.size >= 4, `varias escenas distintas (${titles.size})`);

console.log("6) Los nombres no salen duplicados al personalizar la escena");
let dups = 0;
for (let i = 0; i < 200; i++) {
  const pl = mk({ id: "d" + (i % 11), week: 30 + (i % 60), club: ["Real Betis", "Sevilla FC", "Real Madrid"][i % 3] });
  const e = buildLockerScene(pl, () => ((i * 37) % 100) / 100);
  if (!e) continue;
  const out = personalizeEvent(e, pl);
  const names: string[] = Array.from(out.description.match(/[A-ZÁÉÍÓÚÑ]\p{L}+ [A-ZÁÉÍÓÚÑ]\p{L}+/gu) ?? []);
  if (names.some((n, k) => names.indexOf(n) !== k)) dups++;
}
ok(dups === 0, "200 escenas de vestuario: ningún nombre repetido en la descripción («Óscar Iribar, el capitán Óscar Iribar»)");

if (fails) { console.log(`\n${fails} fallos`); process.exit(1); }
console.log("\nTodo bien");
