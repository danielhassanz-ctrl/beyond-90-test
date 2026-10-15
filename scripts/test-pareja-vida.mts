/** Prueba sin IA: con pareja, cada pocos turnos pasa algo con ella; depende de cómo vais, de la ciudad, de tu estado y de los hijos. */
import { shouldTriggerPartnerLife, buildPartnerLifeEvent, PARTNER_LIFE_KEYS } from "../src/lib/narrative/partner-life";
import { stepPartner, partnerRel } from "../src/lib/narrative/partner";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const mk = (week: number, o: any = {}): any => ({
  id: "t", last_name: "Hassan", club: "Real Madrid", position: "Delantero", week, media: 82, fama: 70, forma: 70, moral: 70, patrimonio: 500000,
  status: "active", mode: "pro", flags: { pareja: "Nerea Solano", pareja_rel: "70", pareja_rel_de: "Nerea Solano" }, ...o,
});
const keyOf = (id: string) => id.replace(/^pareja-vida-/, "").replace(/-\d+$/, "");
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));
const clean = (e: any) => !bad(e) && e.options.length >= 2 && e.options.every((o: any) => o.label && o.outcomeText && typeof o.consequences.flags.pareja_delta === "string");

console.log("1) Sin pareja no hay escenas de pareja");
ok(!shouldTriggerPartnerLife(mk(100, { flags: {} }), () => 0), "sin pareja: nada");
ok(buildPartnerLifeEvent(mk(100, { flags: {} })) === null, "sin pareja: no se construye");

console.log("2) Cuándo toca: cada pocos turnos");
ok(shouldTriggerPartnerLife(mk(100), () => 0), "con pareja y sin escenas recientes, puede tocar");
ok(!shouldTriggerPartnerLife(mk(101, { flags: { pareja: "Nerea Solano", pa_scene_last: "100" } }), () => 0), "no dos turnos seguidos");
ok(shouldTriggerPartnerLife(mk(103, { flags: { pareja: "Nerea Solano", pa_scene_last: "100" } }), () => 0), "a los 3 turnos ya puede tocar");

console.log("3) Una temporada tras otra: aparece de verdad (10 carreras de 10 temporadas)");
let totalScenes = 0, minPerSeason = 99, maxRun = 0;
for (let run = 0; run < 10; run++) {
  const p = mk(11, { flags: { pareja: "Nerea Solano", pareja_rel: "70", pareja_rel_de: "Nerea Solano" } });
  for (let season = 0; season < 10; season++) {
    let n = 0;
    for (let t = 0; t < 10; t++) {
      p.week = 11 + season * 10 + t;
      if (shouldTriggerPartnerLife(p)) {
        const ev = buildPartnerLifeEvent(p);
        if (ev) { n++; totalScenes++; const o = ev.options[0]; Object.assign(p.flags, o.consequences.flags); }
      }
    }
    minPerSeason = Math.min(minPerSeason, n);
    maxRun = Math.max(maxRun, n);
  }
}
const avg = totalScenes / 100;
ok(avg >= 2 && avg <= 4.2, `media de ${avg.toFixed(1)} escenas de pareja por temporada`);
ok(minPerSeason >= 1, `ninguna temporada sin pareja (mínimo ${minPerSeason})`);

console.log("4) Todas las escenas son válidas y no repiten seguidas");
let invalid = 0, repeats = 0; const seen = new Set<string>();
for (let i = 0; i < 4000; i++) {
  const p = mk(20 + (i % 150), { moral: 30 + (i % 70), forma: 30 + (i % 70), fama: 20 + (i % 80), flags: { pareja: ["Nerea Solano", "Marta Ruiz", "Irene Vidal"][i % 3], pareja_rel: String(5 + (i % 95)), pareja_rel_de: ["Nerea Solano", "Marta Ruiz", "Irene Vidal"][i % 3], hijos_n: i % 4 === 0 ? "1" : "", hijos: i % 4 === 0 } });
  p.flags.pareja_rel_de = p.flags.pareja;
  const a = buildPartnerLifeEvent(p, () => (i % 97) / 97); if (!a) { invalid++; continue; }
  if (!clean(a)) invalid++;
  seen.add(keyOf(a.id));
  Object.assign(p.flags, a.options[0].consequences.flags);
  const b = buildPartnerLifeEvent(p, () => ((i * 7) % 97) / 97);
  if (b && keyOf(b.id) === keyOf(a.id) && PARTNER_LIFE_KEYS.length > 5) repeats++;
}
ok(invalid === 0, "4.000 escenas válidas (texto, opciones, efecto sobre la relación)");
ok(repeats === 0, "una escena no se repite justo después de salir");
ok(seen.size >= 20, `${seen.size} tipos de escena distintos`);

console.log("5) Lo que sale depende de cómo estás y de cómo vais");
const low = buildPartnerLifeEvent(mk(100, { flags: { pareja: "Nerea Solano", pareja_rel: "30", pareja_rel_de: "Nerea Solano", pa_recent: PARTNER_LIFE_KEYS.filter((k) => k !== "conversacion-pendiente").join(",") } }), () => 0)!;
ok(!!low && /conversaci/i.test(low.title), "con la relación en 30 sale la conversación pendiente");
const down = buildPartnerLifeEvent(mk(100, { moral: 40, flags: { pareja: "Nerea Solano", pareja_rel_de: "Nerea Solano", pa_recent: PARTNER_LIFE_KEYS.filter((k) => k !== "te-nota-apagado").join(",") } }), () => 0)!;
ok(!!down && /apagado/.test(down.title), "con el ánimo bajo, ella te nota apagado");
const hurt = buildPartnerLifeEvent(mk(100, { flags: { pareja: "Nerea Solano", pareja_rel_de: "Nerea Solano", hijos_n: "1", hijos: true, pa_recent: PARTNER_LIFE_KEYS.filter((k) => !k.startsWith("hijo")).join(",") } }), () => 0)!;
ok(!!hurt && /fiebre|función/.test(hurt.title), "con hijos salen escenas de hijos");

console.log("6) Cada escena cambia de verdad la relación (stepPartner)");
const ev = buildPartnerLifeEvent(mk(100), () => 0.3)!;
const pos = ev.options.find((o: any) => Number(o.consequences.flags.pareja_delta) > 0)!;
const neg = ev.options.find((o: any) => Number(o.consequences.flags.pareja_delta) < 0);
const base = mk(100).flags;
const after = stepPartner(base, { club: "Real Madrid", week: 100, eventId: ev.id, moral: 0, optionFlags: pos.consequences.flags });
ok(partnerRel({ ...base, ...after.flags }) > 70, `la buena decisión sube la relación (${partnerRel({ ...base, ...after.flags })})`);
if (neg) {
  const worse = stepPartner(base, { club: "Real Madrid", week: 100, eventId: ev.id, moral: 0, optionFlags: neg.consequences.flags });
  ok(partnerRel({ ...base, ...worse.flags }) < 70, `la mala decisión la baja (${partnerRel({ ...base, ...worse.flags })})`);
}
ok(pos.consequences.flags?.pa_scene_last === "100" && String(pos.consequences.flags?.pa_recent).includes(keyOf(ev.id)), "deja anotado cuándo y cuál para no repetir");

console.log("7) Las que solo pasan una vez, una vez");
const once = buildPartnerLifeEvent(mk(100, { flags: { pareja: "Nerea Solano", pareja_rel_de: "Nerea Solano", pa_done_mascota: true, pa_recent: PARTNER_LIFE_KEYS.filter((k) => k !== "mascota").join(",") } }), () => 0);
ok(!once || !/cachorro/.test(once.title), "el cachorro no vuelve");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
