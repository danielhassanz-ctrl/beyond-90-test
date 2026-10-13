/** Prueba sin IA: un hilo nace en un club y lo cobra gente de ESE club aunque ya te hayas ido. */
import { appendThread, readThreads, threadOriginClub, threadIsFromOtherClub, genericRoleOf, describeOpenThreads } from "../src/lib/narrative/threads";
import { getNpcName } from "../src/lib/narrative/npcs";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

console.log("1) Los hilos nuevos guardan su club");
let flags: any = { club_since: "10", clubs_history: "Real Betis|Bayern de Múnich" };
const json = appendThread(flags, { kind: "deuda", who: "el presidente", text: "Te adelantó la ficha" }, 30, "Bayern de Múnich")!;
flags = { ...flags, hilos: json };
const [t] = readThreads(flags);
ok(t.c === "Bayern de Múnich", `guarda el club de origen: ${t.c}`);

console.log("2) Tras fichar por el Liverpool, el hilo sigue siendo del Bayern");
const p: any = { id: "p1", last_name: "Hassan", club: "Liverpool FC", week: 60, flags: { ...flags, club_since: "55", clubs_history: "Real Betis|Bayern de Múnich" } };
ok(threadIsFromOtherClub(t, p) && threadOriginClub(t, p) === "Bayern de Múnich", "origen = Bayern, club actual = Liverpool");
ok(describeOpenThreads(p.flags, p.week, p.club)[0].includes("club que ya dejaste"), "el resumen de la IA avisa de que es de otro club");

console.log("3) Hilos antiguos (sin club) se deducen del historial");
const old = { w: 40, k: "deuda" as const, who: "Dermot Prescott", t: "x" };
ok(threadOriginClub(old, p) === "Bayern de Múnich", "nació antes de llegar al Liverpool → Bayern");
ok(!threadIsFromOtherClub({ ...old, w: 58 }, p), "nacido ya en el Liverpool → es de este club");

console.log("4) El cargo genérico se traduce al nombre del cargo en el club viejo");
ok(genericRoleOf("el presidente") === "presidente" && genericRoleOf("El míster") === "entrenador" && genericRoleOf("tu padre") === null, "reconoce cargos");
const viejo = getNpcName({ ...p, club: "Bayern de Múnich" }, "presidente");
const actual = getNpcName(p, "presidente");
ok(!!viejo && viejo !== actual, `presidente del Bayern (${viejo}) ≠ presidente del Liverpool (${actual})`);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
