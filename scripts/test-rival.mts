/** Prueba sin IA: la rivalidad se bifurca según el camino elegido, llega al final en los tres caminos y los nombres/tarjetas se rellenan bien. */
import { eligibleBankScenes, fillBankEvent } from "../src/lib/narrative/bank/select";
import { bankFlagKey } from "../src/lib/narrative/bank/types";
import { BANK_SCENES } from "../src/lib/narrative/bank/scenes";
import { getRivals } from "../src/lib/narrative/rivals";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

function walk(camino: "a" | "b" | "c") {
  const p: any = {
    id: "rv-test", last_name: "Hassan", nation: "España", club: "Real Madrid", position: "Delantero", week: 120, media: 86, fama: 82, moral: 70, forma: 80, patrimonio: 900000,
    rel_entrenador: 60, rel_vestuario: 60, rel_aficion: 60, rel_representante: 60, reputacion: 60, stats_matches_played: 300, status: "active", mode: "pro", agent_name: "Iñaki Zubiaurre",
    flags: { club_since: "100", sel_debut: true },
  };
  const used: string[] = [];
  const seq: string[] = [];
  const texts: string[] = [];
  let dmCards = 0;
  for (let t = 0; t < 140 && !seq.includes("nm-6"); t++) {
    p.week += 3;
    // una lesión larga a media historia, para que salga la escena de visita
    const injured = t >= 20 && t <= 26;
    if (injured) p.flags.injury_duration_x = "3"; else delete p.flags.injury_duration_x;
    const el = eligibleBankScenes(p, used, BANK_SCENES).filter((c) => c.scene.id.startsWith("bank-nm-"));
    if (!el.length) continue;
    const c = el.sort((a, b) => b.weight - a.weight)[0];
    const ev: any = fillBankEvent(c.scene.event as any, p);
    const id = c.scene.id.replace("bank-", "");
    const optId = id === "nm-1" ? camino : "a";
    const opt = ev.options.find((x: any) => x.id === optId) ?? ev.options[0];
    used.push(c.scene.id);
    seq.push(`${id}:${opt.id}`);
    texts.push(JSON.stringify(ev));
    if (ev.dm) dmCards++;
    p.flags[bankFlagKey(c.scene.id)] = `${opt.id}:${p.week}`;
    const fl = opt.consequences?.flags ?? opt.resolve?.success?.consequences?.flags ?? {};
    for (const [k, v] of Object.entries(fl)) p.flags[k] = v as any;
    if (id === "nm-4g" || id === "nm-4r" || id === "nm-4f") delete p.flags.injury_duration_x;
  }
  return { seq, texts, dmCards, flags: p.flags, p };
}

const expected: Record<string, string[]> = {
  a: ["nm-1", "nm-g1", "nm-g2", "nm-2g", "nm-3", "nm-4g", "nm-5", "nm-6"],
  b: ["nm-1", "nm-r1", "nm-r2", "nm-2r", "nm-3", "nm-4r", "nm-5", "nm-6"],
  c: ["nm-1", "nm-f1", "nm-2f", "nm-3", "nm-4f", "nm-5", "nm-6"],
};
for (const [k, label] of [["a", "guerra"], ["b", "respeto"], ["c", "frialdad"]] as const) {
  console.log(`Camino ${label}`);
  const r = walk(k);
  const ids = r.seq.map((s) => s.split(":")[0]);
  console.log("   " + r.seq.join(" → "));
  ok(expected[k].every((id) => ids.includes(id)), `recorre toda la historia (${expected[k].length} capítulos)`);
  ok(!ids.some((id) => (k !== "a" && /-g\d|2g|4g/.test(id)) || (k !== "b" && /-r\d|2r|4r/.test(id)) || (k !== "c" && /-f\d|2f|4f/.test(id))), "no se cuelan escenas de otros caminos");
  ok(r.texts.every((t) => !/\{(mega|peer|club|el_club|apellido)/.test(t) && !/undefined|NaN/.test(t)), "todos los marcadores sustituidos");
  ok(r.dmCards >= 1, `tarjetas de mensaje: ${r.dmCards}`);
  ok(!!r.flags.nm_final, `final guardado: ${r.flags.nm_final}`);
}

console.log("Nombres estables y tarjetas");
const base: any = { id: "rv-test", last_name: "Hassan", club: "Real Madrid", week: 200, flags: {} };
const rival = getRivals(base).find((x) => x.key === "mega1")!;
const card: any = fillBankEvent(BANK_SCENES.find((s) => s.id === "bank-nm-6")!.event as any, base);
ok(card.dm.name === rival.name && /^[a-z0-9.]+$/.test(card.dm.handle), `tarjeta de ${card.dm.name} (@${card.dm.handle})`);
ok(card.isMilestone === true && card.dm.message.includes("Veinte años"), "el final es un hito compartible");
const girl: any = fillBankEvent(BANK_SCENES.find((s) => s.id === "bank-ch-alma-dm")!.event as any, base);
ok(girl.isMilestone === true, "el primer mensaje de las chicas también genera su tarjeta");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
