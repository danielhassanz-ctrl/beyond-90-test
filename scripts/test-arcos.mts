/** Prueba sin IA: los arcos largos avanzan capítulo a capítulo y las escenas cotidianas vuelven a poder salir años después. */
import { eligibleBankScenes, recycleBankScenes } from "../src/lib/narrative/bank/select";
import { bankFlagKey } from "../src/lib/narrative/bank/types";
import { BANK_SCENES } from "../src/lib/narrative/bank/scenes";

const p: any = { id: "t", last_name: "Hassan", nation: "España", club: "Real Madrid", position: "Delantero", week: 100, media: 82, fama: 70, moral: 70, forma: 80, patrimonio: 900000, rel_entrenador: 60, rel_vestuario: 60, rel_aficion: 60, rel_representante: 60, reputacion: 60, stats_matches_played: 200, flags: { club_since: "11" }, status: "active" };
const used: string[] = [];
function play(prefixes: string[], choose: (id: string) => number) {
  const seen: string[] = [];
  for (let t = 0; t < 150; t++) {
    p.week += 1; p.flags.coach_bench = "0";
    const el = eligibleBankScenes(p, used, BANK_SCENES).filter((c) => prefixes.some((x) => c.scene.id.startsWith(x)));
    if (!el.length) continue;
    const c = el[0]; const ev: any = c.scene.event; const idx = choose(c.scene.id); const opt = ev.options[Math.min(idx, ev.options.length - 1)];
    used.push(c.scene.id); p.flags[bankFlagKey(c.scene.id)] = `${opt.id}:${p.week}`; seen.push(`${c.scene.id.replace("bank-ar-", "")}:${opt.id}`);
    const fl = opt.consequences?.flags ?? opt.resolve?.success?.consequences?.flags ?? {};
    for (const [k, v] of Object.entries(fl)) p.flags[k] = typeof v === "string" && /^@WEEK\+\d+$/.test(v) ? String(p.week + parseInt(v.slice(6))) : (v as any);
  }
  return seen;
}
console.log("Arco del chaval (mentor):", play(["bank-ar-chaval"], () => 0).join(" → "));
p.week = 100;
console.log("Arco del periodista:", play(["bank-ar-periodista"], () => 0).join(" → "));
// reciclaje
const q: any = { ...p, week: 300, flags: { [bankFlagKey("bank-cv-pelea")]: "a:100", cv_pelea: true } };
const base = ["bank-cv-pelea", "bank-cv-novia", "bank-cv-reconcilia"];
const out = recycleBankScenes(q, base);
console.log("tras 20 temporadas, cv-pelea vuelve:", !out.includes("bank-cv-pelea"), "| cv-reconcilia (cadena) no:", out.includes("bank-cv-reconcilia"), "| marca limpiada:", JSON.stringify(q.flags.cv_pelea));
