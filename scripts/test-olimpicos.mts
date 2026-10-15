/** Prueba sin IA: Juegos Olímpicos (sub-23 + 3 mayores, sedes, aviso, convocatoria, torneo con medallas) y que conviven con la Eurocopa del mismo verano. */
import { olympicRole, olympicHost, olympicLabel, isOlympicYear, shouldTriggerOlympicPreview, buildOlympicPreviewEvent, buildOlympicCallUp, buildOlympicArrival } from "../src/lib/narrative/olympics";
import {
  shouldStartOlympics, shouldStartTorneo, startTorneoProgress, saveTorneoProgress, torneoStageLabels, torneoStages, torneoFinalStage, advanceTorneo, buildTorneoMatch, getTorneoProgress, torneoLabel,
  type TorneoResult,
} from "../src/lib/narrative/torneo";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));
// Edad = 16 + temporada: la temporada 2 (2028) tiene 18 años, la 6 (2032) 22, la 8 (2034) 24...
const mk = (season: number, o: any = {}): any => ({
  id: "t", last_name: "Hassan", nickname: null, club: "Real Madrid", nation: "España", week: season * 10 + 1, media: 85, fama: 70, status: "active", flags: {}, ...o,
});

console.log("1) Sedes y años");
ok(isOlympicYear(2) && isOlympicYear(6) && !isOlympicYear(3) && isOlympicYear(10), "2028, 2032 y 2036 son años olímpicos; 2029 no");
ok(olympicHost(2).city === "Los Ángeles" && olympicHost(6).city === "Brisbane", "2028 en Los Ángeles y 2032 en Brisbane");
ok(/Los Ángeles 2028/.test(olympicLabel(2)) && /Brisbane 2032/.test(torneoLabel("olimpico", 6)), "el nombre del torneo lleva la ciudad");
ok(/2036/.test(olympicLabel(10)) && !/undefined/.test(olympicLabel(10)), "una sede aún sin decidir no rompe el texto");

console.log("2) Quién puede ir: sub-23 y tres mayores");
ok(olympicRole(mk(6), 6) === "sub23", "con 22 años y nivel, vas como sub-23");
ok(olympicRole({ id: "a", media: 55, fama: 50 }, 6) === null, "con 22 años pero nivel bajo, no");
let overage = 0, tooLow = 0, young = 0;
for (let i = 0; i < 1000; i++) {
  if (olympicRole({ id: `p${i}`, media: 90, fama: 80 }, 10) === "overage") overage++;    // 26 años
  if (olympicRole({ id: `p${i}`, media: 70, fama: 80 }, 10) !== null) tooLow++;          // 26 años, nivel bajo
  if (olympicRole({ id: `p${i}`, media: 75, fama: 60 }, 5) === "sub23") young++;         // 21 años
}
ok(overage > 250 && overage < 450, `con 26 años y nivel de élite te eligen como mayor en ~${Math.round(overage / 10)} % de los casos`);
ok(tooLow === 0, "con 26 años y nivel bajo, nunca");
ok(young === 1000, "con 21 años y nivel de titular, siempre sub-23");
ok(olympicRole({ id: "x", media: 95, fama: 90 }, 12) === (olympicRole({ id: "x", media: 95, fama: 90 }, 12)), "el sorteo de los tres mayores es estable");

console.log("3) El aviso del año anterior");
const prev = mk(5, { week: 5 * 10 + 8 });
ok(shouldTriggerOlympicPreview(prev, []), "en el turno 8 de la temporada anterior sale el aviso");
ok(!shouldTriggerOlympicPreview(mk(5, { week: 5 * 10 + 2 }), []), "no en pretemporada");
ok(!shouldTriggerOlympicPreview(prev, ["jjoo-aviso-6"]), "una sola vez");
ok(!shouldTriggerOlympicPreview(mk(4, { week: 4 * 10 + 8 }), []), "ni en un año sin Juegos al año siguiente");
const ev = buildOlympicPreviewEvent(prev);
ok(!bad(ev) && /Brisbane/.test(ev.description) && /sub-23/.test(ev.description) && /tres jugadores mayores/.test(ev.description), "dice dónde son y la regla de edad");
const evo = buildOlympicPreviewEvent(mk(9, { week: 9 * 10 + 8, media: 95, fama: 95, id: "pp" }));
void evo;

console.log("4) Convocatoria y llegada");
const call = buildOlympicCallUp(mk(6), 6);
ok(!bad(call) && /Brisbane/.test(call.description) && call.isMilestone === true, "la convocatoria habla de Brisbane y es un hito compartible");
ok(call.options.every((o) => o.consequences.flags?.conv_olimpico_6 === true), "marca la convocatoria como vivida");
const arr = buildOlympicArrival(mk(6), 6);
ok(!bad(arr) && /villa olímpica/.test(arr.description) && arr.options.every((o) => o.consequences.flags?.torneo_activo === "olimpico"), "la llegada a la villa activa el torneo olímpico");

console.log("5) Cuándo empieza el torneo");
const base = mk(6);
ok(shouldStartOlympics(base, 1, false) === "olimpico", "en 2032 (turno 1) y con nivel, empiezan los Juegos");
ok(shouldStartOlympics(base, 1, true) === null, "lesionado no va");
ok(shouldStartOlympics(base, 3, false) === null, "solo al arrancar la temporada (verano)");
ok(shouldStartOlympics(mk(7), 1, false) === null, "en 2033 no hay Juegos");
ok(shouldStartOlympics(mk(6, { flags: { olimpico_no: true, olimpico_aviso: "2032" } }), 1, false) === null, "quien rechazó la llamada, no va");

console.log("6) Eurocopa y Juegos en el mismo verano");
const both = mk(6, { flags: {} });
const first = shouldStartTorneo(both, 1, false);
ok(first === "eurocopa", "primero la Eurocopa de 2032");
startTorneoProgress(both, "eurocopa");
ok(shouldStartOlympics(both, 1, false) === null, "mientras juegas la Eurocopa, no empiezan los Juegos");
saveTorneoProgress(both, null);
ok(shouldStartTorneo(both, 1, false) === null && shouldStartOlympics(both, 1, false) === "olimpico", "al acabar la Eurocopa, empiezan los Juegos");
startTorneoProgress(both, "olimpico");
saveTorneoProgress(both, null);
ok(shouldStartOlympics(both, 1, false) === null, "y no se repiten");

console.log("7) El torneo olímpico: grupos, cuartos, semifinal y final");
ok(torneoStages("olimpico") === 6 && torneoFinalStage("olimpico") === 5, "6 partidos como máximo");
ok(torneoStageLabels("olimpico")[3] === "Cuartos de final", "tras los grupos van los cuartos");
const win: TorneoResult = { kind: "ko", win: true, draw: false, scoreLine: "2-1", points: 0 };
const lose: TorneoResult = { kind: "ko", win: false, draw: false, scoreLine: "0-1", points: 0 };
const grp = (p: number): TorneoResult => ({ kind: "group", win: p === 3, draw: p === 1, scoreLine: "1-0", points: p });
let p = startTorneoProgress(mk(6), "olimpico"); const seen: string[] = []; let champion = false;
for (let g = 0; g < 10; g++) {
  const adv = advanceTorneo(p, p.stage < 3 ? grp(3) : win);
  seen.push(adv.outcome);
  if (adv.finished) { champion = !!adv.champion; break; }
  p = adv.next;
}
ok(champion && seen.length === 6 && seen[2] === "cuartos", `camino al oro: ${seen.join(" › ")}`);
const outs: string[] = [];
for (let lost = 3; lost <= 5; lost++) { const q = startTorneoProgress(mk(6), "olimpico"); q.stage = lost; outs.push(advanceTorneo(q, lose).outcome); }
ok(outs.join(",") === "cuartos,semifinal,subcampeon", `caer en cada ronda: ${outs.join(", ")}`);
const m = buildTorneoMatch(mk(6), { ...startTorneoProgress(mk(6), "olimpico"), stage: 3 });
ok(/Brisbane 2032/.test(m.description) && /Cuartos/.test(m.description), "el partido lleva el nombre de los Juegos: " + m.description);
const sin = mk(6); void getTorneoProgress(sin);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
