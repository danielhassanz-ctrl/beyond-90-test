/** Prueba sin IA de la tanda de penaltis: aparece una vez, la respuesta inclina el desenlace y queda cerrado. */
import { settleShootout, pensFlag, shootoutInstruction } from "../src/lib/narrative/shootout";

const mk = (pos = "Delantero"): any => ({ id: "t1", last_name: "Dani Hassan", position: pos, media: 82, flags: {}, club: "Real Madrid" });
const ctx = { key: "42_champions_final", team: "Real Madrid", rival: "Bayern", comp: "Champions League", regular: "", round: "Final", decisive: true };

let bad = 0;
const check = (c: boolean, m: string) => { if (!c) { bad++; console.log("FALLO:", m); } };

for (const yo of ["gol", "fallo"]) {
  let wins = 0, n = 400;
  for (let i = 0; i < n; i++) {
    const p = mk();
    const a = settleShootout(p, ctx.key, { win: i % 2 === 0, scoreLine: "1-1 (5-4 en penaltis)" }, ctx);
    check("scene" in a, "primera llamada debe devolver escena");
    if (!("scene" in a)) continue;
    check(a.scene.id.startsWith("tanda-"), "id con prefijo tanda-");
    check(a.scene.options.length === 3, "3 opciones");
    // tras responder
    (p.flags as any)[pensFlag.yo(ctx.key)] = yo;
    const b: any = settleShootout(p, ctx.key, { win: false, scoreLine: "2-1" }, ctx);
    check(!("scene" in b), "segunda llamada no repite escena");
    check(/penaltis/.test(b.scoreLine), "marcador con penaltis: " + b.scoreLine);
    const c: any = settleShootout(p, ctx.key, { win: !b.win, scoreLine: "0-0" }, ctx);
    check(c.win === b.win && c.scoreLine === b.scoreLine, "cerrada: mismo desenlace");
    if (b.win) wins++;
  }
  console.log(`yo=${yo}: gana la tanda ${((wins / n) * 100).toFixed(0)}%`);
}
// sin penaltis: pasa tal cual
const p = mk();
const r: any = settleShootout(p, ctx.key, { win: true, scoreLine: "2-0" }, ctx);
check(!("scene" in r) && r.win === true && r.scoreLine === "2-0", "sin tanda no cambia nada");
// portero
const g = mk("Portero");
const s: any = settleShootout(g, ctx.key, { win: true, scoreLine: "0-0 (4-3 en penaltis)" }, ctx);
check("scene" in s && /Eres/.test(s.scene.description), "escena de portero");
const txt = JSON.stringify(s.scene);
check(!/undefined|\[object|NaN/.test(txt), "sin undefined/NaN");
console.log(shootoutInstruction("gol", true, false, "Real Madrid"));
console.log(bad === 0 ? "TODO OK" : `${bad} fallos`);
