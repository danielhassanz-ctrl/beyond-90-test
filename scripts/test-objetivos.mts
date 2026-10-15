/** Prueba sin IA: objetivos de temporada (se fijan, se pactan, se siguen y se evalúan con consecuencias). */
import {
  baseGoals, adjustGoals, shouldTriggerSeasonGoals, buildSeasonGoalsEvent, shouldTriggerGoalsReview, buildGoalsReviewEvent, readGoalsPlan, goalsProgress, goalsEventId, goalsReviewId,
} from "../src/lib/narrative/season-goals";
import { resolveOption } from "../src/lib/narrative/engine";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));

const mk = (o: any = {}): any => ({
  id: "p1", last_name: "Hassan", nickname: null, club: "Real Madrid", nation: "España", position: "Delantero", week: 62, media: 90, fama: 85, forma: 75, moral: 70, reputacion: 60,
  rel_entrenador: 60, patrimonio: 200000, status: "active", mode: "pro", agent_name: "Iñaki",
  stats_goals: 38, stats_assists: 12, stats_matches_played: 60, stats_clean_sheets: 0, flags: { sb_6_g: "20", sb_6_a: "5", sb_6_m: "40", sb_6_c: "0", club_since: "11" }, ...o,
});
const used = (s: number) => [`preseason-${s}`];

console.log("1) Los objetivos de cada jugador");
const fw = baseGoals(mk());
ok(fw.length === 4 && fw.map((g) => g.kind).join() === "partidos,goles,liga,titulo", `delantero titular de un grande: ${fw.map((g) => g.kind).join(", ")}`);
const gk = baseGoals(mk({ position: "Portero" }));
ok(gk.some((g) => g.kind === "porterias") && !gk.some((g) => g.kind === "goles"), "un portero tiene porterías a cero, no goles");
const small = baseGoals(mk({ club: "Getafe CF", media: 72 }));
ok(!small.some((g) => g.kind === "titulo") && small.find((g) => g.kind === "liga")!.target > 6, "un club pequeño no pide títulos y la meta de Liga es más modesta");
const fwG = fw.find((g) => g.kind === "goles")!.target, dfG = baseGoals(mk({ position: "Defensa" })).find((g) => g.kind === "goles")!.target;
ok(fwG > dfG, `un delantero tiene más metas de gol (${fwG}) que un defensa (${dfG})`);

console.log("2) Pactar: ambiciosas o rebajadas");
const amb = adjustGoals(fw, "ambicioso"), eas = adjustGoals(fw, "rebajado");
const t = (g: any[], k: string) => g.find((x) => x.kind === k).target;
ok(t(amb, "goles") > t(fw, "goles") && t(eas, "goles") <= t(fw, "goles"), "ambiciosas piden más goles; rebajadas, no más");
ok(t(amb, "liga") < t(fw, "liga") && t(eas, "liga") > t(fw, "liga"), "ambiciosas piden mejor puesto en la Liga; rebajadas, peor");
ok(adjustGoals(fw, "normal") === fw, "normal no cambia nada");
ok(amb.every((g) => g.label && !/NaN|undefined/.test(g.label)), "las etiquetas salen limpias");

console.log("3) Cuándo sale la escena");
ok(shouldTriggerSeasonGoals(mk(), used(6)), "tras el cierre de temporada, en pretemporada");
ok(!shouldTriggerSeasonGoals(mk(), []), "no antes del cierre");
ok(!shouldTriggerSeasonGoals(mk(), [...used(6), goalsEventId(6)]), "una vez por temporada");
ok(!shouldTriggerSeasonGoals(mk({ flags: { go_6: "{}" } }), used(6)), "si ya hay objetivos, no");
ok(!shouldTriggerSeasonGoals(mk({ week: 68 }), used(6)), "no a mitad de temporada");

console.log("4) La escena de objetivos");
const ev = buildSeasonGoalsEvent(mk());
ok(!bad(ev) && ev.options.length === 3 && /Marcar/.test(ev.description), "tres opciones y las metas en el texto");
const a = ev.options[0].consequences.flags!;
const plan = JSON.parse(String(a.go_6));
ok(plan.mode === "normal" && plan.goals.length === 4 && a.go_set_6 === true, "aceptar guarda el plan normal");
const b = ev.options[1].consequences.flags!;
ok(JSON.parse(String(b.go_6)).mode === "ambicioso" && Number(b.go_bonus_6) >= 500, "pedir más guarda el plan ambicioso con su prima");
let easyOk = 0, easyKo = 0, badR = 0;
for (let i = 0; i < 300; i++) {
  const e = buildSeasonGoalsEvent(mk({ id: `p${i}` }));
  const r = resolveOption(e.options[2], mk())!;
  const pl = JSON.parse(String(r.consequences.flags!.go_6));
  if (r.success) { easyOk++; if (pl.mode !== "rebajado") badR++; } else { easyKo++; if (pl.mode !== "normal" || (r.consequences.rel_entrenador ?? 0) >= 0) badR++; }
}
ok(badR === 0 && easyOk > 80 && easyKo > 40, `negociar a la baja sale (${easyOk}) o enfada al míster (${easyKo})`);

console.log("5) Progreso durante el año y balance al cerrar");
const p7 = mk({ week: 72, stats_goals: 50, stats_assists: 15, stats_matches_played: 52, flags: { sb_6_g: "38", sb_6_a: "12", sb_6_m: "40", sb_6_c: "0", go_6: JSON.stringify({ season: 6, mode: "normal", goals: fw }), liga_pos_6: "1|88", trofeos: JSON.stringify([{ k: "liga", s: 6, c: "Real Madrid" }]), sb_7_g: "50", sb_7_a: "15", sb_7_m: "52", sb_7_c: "0" } });
const rows = goalsProgress(p7, 6, readGoalsPlan(p7, 6)!, true);
ok(rows.find((r) => r.goal.kind === "liga")!.done && rows.find((r) => r.goal.kind === "titulo")!.done, "campeón de Liga: cumples la meta de puesto y la de título");
ok(rows.find((r) => r.goal.kind === "partidos")!.value === 12 && rows.find((r) => r.goal.kind === "goles")!.value === 12, "partidos y goles de esa temporada salen de las marcas de inicio");
ok(shouldTriggerGoalsReview(p7, used(7)), "tras el cierre sale el balance");
ok(!shouldTriggerGoalsReview(p7, [...used(7), goalsReviewId(6)]), "una sola vez");
const rev = buildSeasonGoalsEventReview(p7);
function buildSeasonGoalsEventReview(p: any) { return buildGoalsReviewEvent(p); }
ok(!bad(rev) && /✓/.test(rev.description) && /Balance de objetivos/.test(rev.title), "el balance lista cada meta con ✓/✗ y cifras");
const good = rev.options[0].consequences;
const failP = mk({ week: 72, stats_goals: 38, stats_assists: 12, stats_matches_played: 41, flags: { sb_6_g: "38", sb_6_a: "12", sb_6_m: "40", sb_6_c: "0", go_6: JSON.stringify({ season: 6, mode: "normal", goals: fw }), liga_pos_6: "7|60", sb_7_g: "38", sb_7_a: "12", sb_7_m: "41", sb_7_c: "0" } });
const badRev = buildGoalsReviewEvent(failP);
ok((good.moral ?? 0) > 0 && (badRev.options[0].consequences.moral ?? 0) < (good.moral ?? 0), "cumplir sube el ánimo; fallar, no");
ok((good.rel_entrenador ?? 0) > (badRev.options[0].consequences.rel_entrenador ?? 0), "cumplir sube la confianza del míster más que fallar");
const ambP = mk({ ...p7, flags: { ...p7.flags, go_6: JSON.stringify({ season: 6, mode: "ambicioso", goals: fw.slice(0, 2).map((g, i) => (i === 0 ? { ...g, target: 5 } : { ...g, target: 5 })) }), go_bonus_6: "3000" } });
const bonusRev = buildGoalsReviewEvent(ambP);
ok((bonusRev.options[0].consequences.patrimonio ?? 0) === 3000, "con prima pactada y todo cumplido, se cobra");
const noBonus = buildGoalsReviewEvent({ ...ambP, flags: { ...ambP.flags, go_6: JSON.stringify({ season: 6, mode: "ambicioso", goals: fw.slice(0, 2).map((g) => ({ ...g, target: 99 })) }) } });
ok((noBonus.options[0].consequences.patrimonio ?? 0) === 0 && /no se cobra/.test(noBonus.description), "si fallas alguna, la prima no se cobra");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
