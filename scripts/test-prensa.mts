/** Prueba sin red: la prensa y las redes como sistema (medios, clima, seguidores, acciones, escenas, hitos y efecto por turno). */
import { getPress, pressClimate, followers, followersText, dueFollowersMilestone, pressNarrative, doPressAction, pressActionBlocked, applyPressDeltas, applyPressTick, shouldTriggerPressScene, buildPressScene, buildFollowersMilestone, shouldTriggerCover, buildCoverEvent, outletKey, MAX_PRESS_ACTS_PER_TURN } from "../src/lib/narrative/press-system";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));

const mk = (o: any = {}): any => ({
  id: "p1", last_name: "Hassan", nickname: null, club: "Real Betis", nation: "España", position: "Delantero", week: 52, media: 75, fama: 50, forma: 70, moral: 70, rel_entrenador: 55, rel_vestuario: 60,
  rel_aficion: 60, reputacion: 55, patrimonio: 100000, status: "active", mode: "pro", agent_name: "Iñaki", flags: { club_since: "20" }, ...o,
});

console.log("1) Tres medios");
const press = getPress(mk());
ok(press.length === 3 && press.map((o) => o.key).join() === "afin,neutral,hostil", "afín, neutral y hostil");
ok(press.every((o) => o.name && o.journalist.trim().split(" ").length >= 2 && o.rel >= 0 && o.rel <= 100) && !bad(press), "con nombre, periodista y relación 0-100");
ok(JSON.stringify(getPress(mk())) === JSON.stringify(press), "estables para esa partida");
ok(press[0].rel > press[2].rel, "el afín te quiere más que el hostil");
const good = getPress(mk({ fama: 90, forma: 90, rel_aficion: 90 })), poor = getPress(mk({ fama: 20, forma: 20, rel_aficion: 15 }));
ok(good.every((o, i) => o.rel >= poor[i].rel) && good[2].rel > poor[2].rel, "tu fama, tu forma y tu afición mueven a los medios");

console.log("2) Clima y narrativa");
ok(pressClimate(mk({ fama: 90, forma: 90, rel_aficion: 95 })).tone === "good", "con todo bien, clima bueno");
ok(pressClimate(mk({ fama: 10, forma: 5, rel_aficion: 5, flags: { club_since: "20", pr_afin: "-40", pr_neutral: "-40", pr_hostil: "-40" } })).label === "Hostil", "con todo mal y los medios en contra, hostil");
ok(pressNarrative(mk({ fama: 10, week: 5 })).label === "La joven promesa", "un chaval sin fama: la joven promesa");
ok(pressNarrative(mk({ rel_aficion: 90, fama: 60 })).label === "El ídolo de la grada", "con la grada a tus pies: el ídolo");
ok(pressNarrative(mk({ reputacion: 20, fama: 50 })).label === "El polémico", "con mala reputación y fama: el polémico");

console.log("3) Seguidores");
ok(followers(mk({ fama: 20 })) < followers(mk({ fama: 50 })) && followers(mk({ fama: 50 })) < followers(mk({ fama: 90 })), "crecen con la fama");
ok(followers(mk({ fama: 95 })) >= 5_000_000 && followers(mk({ fama: 30 })) < 100_000, "órdenes de magnitud razonables (fama 95 ≥ 5 M; fama 30 < 100 mil)");
ok(followers(mk({ fama: 50, flags: { rs: "50" } })) > followers(mk({ fama: 50 })), "lo que publicas los multiplica");
ok(/M$/.test(followersText(2_300_000)) && /mil$/.test(followersText(150_000)), "se escriben bien");
ok(dueFollowersMilestone(mk({ fama: 85 })) !== null && dueFollowersMilestone(mk({ fama: 5 })) === null, "con mucha fama toca un hito; sin fama, no");
ok(dueFollowersMilestone(mk({ fama: 85, flags: { rs_hito_100000: true, rs_hito_1000000: true } })) === null, "tras celebrar el mayor, los menores se dan por vistos");
const hm = buildFollowersMilestone(mk({ fama: 85 }), 1_000_000);
ok(!bad(hm) && hm.isMilestone === true && hm.milestoneType === "seguidores" && hm.options.every((o) => o.consequences?.flags?.["rs_hito_1000000"]), "el hito es limpio, compartible y se anota");

console.log("4) Acciones");
const p0 = mk();
const ex = doPressAction(p0, "exclusiva", "afin", () => 0.1) as any;
ok(!("error" in ex) && ex.flags[outletKey("afin")] === String(8 + press[0].personal) && ex.fama === 2, "exclusiva al afín: sube él, fama +2");
ok(ex.flags[outletKey("neutral")] === "-2" && ex.flags[outletKey("hostil")] === "-1", "los otros dos se enfrían");
const exH = doPressAction(p0, "exclusiva", "hostil", () => 0.1) as any, exH2 = doPressAction(p0, "exclusiva", "hostil", () => 0.9) as any;
ok(exH.ok && exH.flags[outletKey("hostil")] === "10" && !exH2.ok && exH2.flags[outletKey("hostil")] === "-4", "el hostil: arriesgado, 45 %");
ok("error" in (doPressAction(p0, "exclusiva") as any), "sin elegir medio, no vale");
const rc = doPressAction(p0, "responder_critico", undefined, () => 0.9) as any;
ok(!rc.ok && rc.reputacion === -2 && Number(rc.flags.rs) < 0, "responder mal: baja reputación y seguidores");
const after = mk({ flags: { club_since: "20", ...ex.flags } });
ok(pressActionBlocked(after, "exclusiva", "afin") !== null, "acabas de hacerlo con ese medio: espera");
const two = mk({ flags: { club_since: "20", pr_acts_week: "52", pr_acts_n: String(MAX_PRESS_ACTS_PER_TURN) } });
ok(pressActionBlocked(two, "foto_entreno") !== null, "máximo dos movimientos por turno");
ok(pressActionBlocked(mk({ rel_vestuario: 20 }), "video_vestuario") !== null, "con el vestuario roto no hay vídeo de piña");
ok(!bad(["foto_entreno", "video_vestuario", "mensaje_aficion", "responder_critico"].map((a) => doPressAction(mk({ flags: { club_since: "20" } }), a as any, undefined, () => 0.3))), "los textos salen limpios");

console.log("5) Cambios desde las escenas");
const d = applyPressDeltas(mk(), "afin:+4,hostil:-6,seg:+5,xx:+3,neutral:abc");
ok(d[outletKey("afin")] === "4" && d[outletKey("hostil")] === "-6" && d.rs === "5" && Object.keys(d).length === 3, "se aplican los válidos y se ignoran los malos");
ok(applyPressDeltas(mk({ flags: { club_since: "20", pr_afin: "39" } }), "afin:+9").pr_afin === "40", "tope en 40");

console.log("6) La prensa devuelve algo");
const pa = mk({ forma: 40, flags: { club_since: "20", pr_hostil: "-40" }, rel_aficion: 40, moral: 50 });
applyPressTick(pa);
ok(pa.rel_aficion === 39 && pa.moral === 49, "vas mal y la tertulia aprieta: -1 de afición y de moral");
const pb = mk({ forma: 85, fama: 50, flags: { club_since: "20", pr_afin: "30" } });
applyPressTick(pb);
ok(pb.fama === 51, "vas bien y el diario afín te adora: +1 de fama");

console.log("7) Escenas");
ok(!shouldTriggerPressScene(mk({ week: 5 }), () => 0), "no antes de la semana 12");
ok(!shouldTriggerPressScene(mk({ flags: { club_since: "20", pr_scene_last: "50" } }), () => 0), "no dos en menos de 6 turnos");
ok(shouldTriggerPressScene(mk(), () => 0), "salen cuando toca");
const titles = new Set<string>();
let broken = 0;
for (let i = 0; i < 400; i++) {
  const p = mk({ id: "p" + (i % 9), club: ["Real Betis", "Sevilla FC", "Valencia CF"][i % 3], fama: 20 + ((i * 7) % 80), media: 60 + (i % 30), forma: (i * 11) % 100, rel_aficion: (i * 13) % 100, week: 30 + (i % 60), flags: { club_since: "10" } });
  const e = buildPressScene(p, () => ((i * 37) % 100) / 100);
  if (!e) continue;
  titles.add(e.id.replace(/-\d+$/, ""));
  const fine = !bad({ t: e.title, d: e.description, o: e.options }) && e.options.length >= 2 && e.options.every((o) => typeof o.consequences?.flags?.pr_delta === "string" && o.outcomeText);
  if (!fine) broken++;
}
ok(broken === 0, "400 escenas: opciones con delta y textos limpios");
ok(titles.size >= 5, `varias escenas distintas (${titles.size})`);

console.log("8) Portada de revista");
ok(!shouldTriggerCover(mk({ fama: 30 }), () => 0) && !shouldTriggerCover(mk({ fama: 80, week: 10 }), () => 0), "no sin fama ni sin recorrido");
ok(!shouldTriggerCover(mk({ fama: 80, flags: { club_since: "20", pr_portada: true } }), () => 0), "una vez por carrera");
const cp = mk({ fama: 85, flags: { club_since: "20", pr_afin: "20" } });
ok(shouldTriggerCover(cp, () => 0), "con fama y un medio afín, toca");
const ce = buildCoverEvent(cp);
ok(!bad(ce) && ce.isMilestone === true && ce.milestoneType === "portada_revista" && ce.options.length === 3 && Boolean(ce.imageScene), "la portada es hito compartible con su escena");

if (fails) { console.log(`\n${fails} fallos`); process.exit(1); }
console.log("\nTodo bien");
