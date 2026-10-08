/**
 * Prueba de cadena de punta a punta, sin IA: ¿las decisiones de una escena del banco cambian de
 * verdad el estado (barras, banderas, rol) y desbloquean las escenas siguientes?
 */
import { BANK_SCENES } from "../src/lib/narrative/bank/scenes";
import { eligibleBankScenes } from "../src/lib/narrative/bank/select";
import { bankFlagKey } from "../src/lib/narrative/bank/types";
import { applyConsequences, resolveOption } from "../src/lib/narrative/engine";
import { computeRole } from "../src/lib/narrative/role";

const find = (id: string) => BANK_SCENES.find((s) => s.id === `bank-${id}`)!;

const player: any = {
  id: "t-chain", last_name: "Dani Hassan", nation: "España", club: "Real Madrid", position: "Delantero", week: 31, media: 80, fama: 60,
  moral: 70, forma: 80, patrimonio: 50000, rel_entrenador: 60, rel_vestuario: 60, rel_aficion: 60, rel_representante: 60, reputacion: 50,
  stats_matches_played: 60, flags: { club_since: "11" }, status: "active",
};

function show(label: string) {
  const r = computeRole(player).role;
  console.log(`  · ${label}: moral ${player.moral} · forma ${player.forma} · rep ${player.reputacion} · entr ${player.rel_entrenador} · rol ${r} · coach_bench=${player.flags.coach_bench ?? "—"}`);
}

function take(sceneId: string, optionId: string, rolls: "success" | "fail" | "auto" = "auto") {
  const sc = find(sceneId);
  const opt = sc.event.options.find((o) => o.id === optionId)!;
  let cons: any = opt.consequences;
  let text = opt.outcomeText ?? "";
  if (opt.resolve) {
    const orig = Math.random;
    Math.random = () => (rolls === "success" ? 0.0001 : 0.9999);
    const res = resolveOption(opt as any, player);
    Math.random = orig;
    cons = res!.consequences;
    text = res!.text;
  }
  const patch = applyConsequences(player, cons);
  Object.assign(player, patch);
  player.flags = { ...player.flags, ...(cons.flags ?? {}), [bankFlagKey(sc.id)]: `${optionId}:${player.week}` };
  console.log(`\n▶ ${sc.event.title}  [opción ${optionId}: ${opt.label}]`);
  console.log(`  ${text.slice(0, 130)}…`);
  show("tras la decisión");
}

const eligible = (id: string) => eligibleBankScenes(player, [], BANK_SCENES).some((c) => c.scene.id === `bank-${id}`);

console.log("CADENA DEL SUPLEMENTO");
show("estado inicial");
console.log(`  ¿Sale ya el control antidopaje? ${eligible("sl-control")}`);
take("sl-suplemento", "c");
player.week += 1;
console.log(`  ¿Sale el control a la semana siguiente (hueco mínimo 3)? ${eligible("sl-control")}`);
player.week += 4;
console.log(`  ¿Y 5 semanas después? ${eligible("sl-control")}`);
take("sl-control", "a", "fail");
player.week += 3;
console.log(`  ¿Sale la escena de la sanción pública? ${eligible("sl-sancion")}`);
take("sl-sancion", "a");
player.week += 6;
console.log(`  ¿Sale la vuelta con la grada? ${eligible("sl-vuelta")}`);
take("sl-vuelta", "a");

console.log("\nLo MISMO eligiendo no tomarlo (rama limpia)");
const p2flags = { club_since: "11" };
player.flags = p2flags; player.moral = 70; player.forma = 80; player.reputacion = 50; player.rel_entrenador = 60; player.week = 31;
take("sl-suplemento", "a");
player.week += 6;
console.log(`  ¿Sale el control antidopaje? ${eligible("sl-control")} (debe ser false: no tomaste nada)`);
