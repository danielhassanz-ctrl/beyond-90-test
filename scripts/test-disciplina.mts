/** Prueba sin IA: la cadena de disciplina se encadena (paparazzi -> despacho), deja estados con efecto y estos caducan. */
import { eligibleBankScenes } from "../src/lib/narrative/bank/select";
import { bankFlagKey } from "../src/lib/narrative/bank/types";
import { DISCIPLINA } from "../src/lib/narrative/bank/scenes/disciplina";
import { activeStates, applyStateTick, stateRollNudge } from "../src/lib/narrative/states";

const p: any = { id: "t", last_name: "Hassan", nation: "España", club: "Sevilla FC", position: "Delantero", week: 60, media: 75, fama: 55, moral: 70, forma: 80, patrimonio: 90000, rel_entrenador: 60, rel_vestuario: 60, rel_aficion: 60, rel_representante: 60, reputacion: 60, stats_matches_played: 80, flags: { club_since: "11" }, status: "active" };
const used: string[] = [];
const apply = (opt: any) => {
  const fl = opt.consequences?.flags ?? {};
  for (const [k, v] of Object.entries(fl)) p.flags[k] = typeof v === "string" && /^@WEEK\+\d+$/.test(v) ? String(p.week + parseInt(v.slice(6), 10)) : (v as any);
  for (const k of ["rel_entrenador", "moral", "fama"]) if (typeof opt.consequences?.[k] === "number") p[k] = Math.max(0, Math.min(100, p[k] + opt.consequences[k]));
};
const first = eligibleBankScenes(p, used, DISCIPLINA).find((c) => c.scene.id === "bank-dc-paparazzi");
console.log("paparazzi elegible:", Boolean(first));
const sc: any = first!.scene; const opt = sc.event.options[0];
used.push(sc.id); p.flags[bankFlagKey(sc.id)] = `a:${p.week}`; apply(opt);
console.log("estados tras la cena:", activeStates(p.flags, p.week).map((s) => s.def.label), "| empujón en jugadas:", stateRollNudge(p.flags, p.week));
p.week += 2;
const next = eligibleBankScenes(p, used, DISCIPLINA).map((c) => c.scene.id);
console.log("elegible 2 turnos después:", next.includes("bank-dc-despacho-a") ? "despacho del míster ✓" : next.join(","));
const f0 = p.forma, m0 = p.moral;
applyStateTick(p); p.week++; applyStateTick(p); p.week++; applyStateTick(p); p.week += 2; applyStateTick(p);
console.log("tras unos turnos: forma", f0, "→", p.forma, "| ánimo", m0, "→", p.moral, "| estados:", activeStates(p.flags, p.week).map((s) => s.def.label), "| flag estado_escandalo:", JSON.stringify(p.flags.estado_escandalo));
