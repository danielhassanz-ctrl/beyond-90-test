/** Prueba sin IA de las cadenas de las chicas: cada una, eligiendo siempre "a", llega a pareja y deja la foto. */
import { eligibleBankScenes } from "../src/lib/narrative/bank/select";
import { bankFlagKey } from "../src/lib/narrative/bank/types";
import { chicaPhoto } from "../src/lib/narrative/chicas-roster";

for (const [fama, media] of [[30, 60], [50, 70], [65, 80]] as const) {
  const p: any = { id: "t", last_name: "Hassan", nation: "España", club: "Sevilla FC", position: "Delantero", week: 41, media, fama, moral: 70, forma: 80, patrimonio: 90000, rel_entrenador: 60, rel_vestuario: 60, rel_aficion: 60, rel_representante: 60, reputacion: 60, stats_matches_played: 80, flags: { club_since: "11" }, status: "active" };
  const used: string[] = []; const seen: string[] = [];
  for (let t = 0; t < 120 && !p.flags.pareja; t++) {
    p.week += 1;
    const el = eligibleBankScenes(p, used).filter((c) => c.scene.family === "chicas");
    if (!el.length) continue;
    const c = el[Math.floor(Math.random() * el.length)];
    const ev: any = c.scene.event;
    const opt = ev.options[0];
    seen.push(c.scene.id.replace("bank-", "").replace("ch-", "") + ":" + opt.id);
    used.push(c.scene.id);
    p.flags[bankFlagKey(c.scene.id)] = `${opt.id}:${p.week}`;
    const fl = opt.consequences?.flags ?? opt.resolve?.success?.consequences?.flags ?? {};
    for (const [k, v] of Object.entries(fl)) p.flags[k] = v as any;
  }
  console.log(`fama ${fama}: ${seen.join(" → ")} | pareja: ${p.flags.pareja ?? "ninguna"} | foto: ${chicaPhoto(p.flags.pareja)}`);
}
