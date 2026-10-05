/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PARTIDA REAL (con la API de Claude): juega N eventos del motor con un jugador
 * de personalidad concreta y escribe una transcripción para revisarla.
 * Uso:  npx tsx --env-file=.env.local scripts/play-career.mts [eventos]
 */
import { writeFileSync } from "node:fs";
const { pickNextEventDynamic, resolveOption, applyConsequences } = await import("../src/lib/narrative/engine");
const { computeWeekAdvance } = await import("../src/lib/narrative/week-advance");
const { tickInjury, getInjuryRemaining } = await import("../src/lib/narrative/career-dynamics");
const { computeRole } = await import("../src/lib/narrative/role");
const { summarizeEffects } = await import("../src/lib/narrative/state-brief");
const { getClubLevel } = await import("../src/lib/calendar/match-calendar");
const { getGameDateLabel } = await import("../src/lib/calendar/season");
const { buildLedgerEntry, appendLedger } = await import("../src/lib/narrative/ledger");
const { introduceCast, markCastMet } = await import("../src/lib/narrative/cast");
const { personalizeEvent } = await import("../src/lib/narrative/npcs");


const origLog = console.log;
if (!process.env.DEBUG_AI) console.log = () => {};
if (!process.env.DEBUG_AI) console.error = () => {};

const N = Number(process.argv[2] ?? 120);
const player: any = {
  id: "play-dani", user_id: "u", last_name: "Dani Hassan", first_name: "Dani", nation: "España", position: "Delantero",
  personality: "ambicioso pero leal a los suyos", mode: "pro", status: "active", club: "Real Betis", week: 11,
  media: 58, forma: 78, moral: 70, fama: 25, patrimonio: 18000, rel_entrenador: 55, rel_vestuario: 55, rel_aficion: 55,
  rel_representante: 60, reputacion: 45, agent_name: "Iñaki Zubiaurre", flags: {}, pending_event: null,
  stats_matches_played: 4, stats_goals: 1, stats_assists: 0, stats_minutes_played: 200, stats_yellow_cards: 0, stats_red_cards: 0, stats_titles: 0,
};
const used: string[] = ["pretemp-amistoso", "rookie-debut-oficial", "inicio-fichaje-agente"];
const history: any[] = [];
const out: string[] = [];
const eur = (n: number) => n.toLocaleString("es");

function score(o: any): number {
  const c = o.resolve ? { ...(o.resolve.success.consequences), } : o.consequences;
  const f = (k: string) => (c[k] ?? 0);
  const base = f("rel_vestuario") + f("rel_entrenador") + f("rel_aficion") * 0.7 + f("moral") * 0.6 + f("reputacion") * 0.8 + f("fama") * 0.3 + f("forma") * 0.5 + f("media") * 2 + f("rel_representante") * 0.4;
  return base * (o.resolve ? 0.5 + o.resolve.baseChance : 1) + Math.random() * 3;
}

let ai = 0;
for (let i = 0; i < N && player.week < 80; i++) {
  const ev: any = await pickNextEventDynamic(player, history, used);
  if (!ev?.options?.length) { out.push(`
!! evento vacío en semana ${player.week}`); break; }
  if (!/^(matchday|match-decision|torneo|sel-|fisio|arco|banco|echo|oferta|mercado|agent|social|preseason)/.test(ev.id)) ai++;
  const shown: any = personalizeEvent(ev, player);
  const cards = introduceCast(shown, player);
  if (cards.length) player.flags.cast_met = markCastMet(player.flags, cards);

  // decisión según personalidad
  const ranked = [...shown.options].sort((a: any, b: any) => score(b) - score(a));
  const opt = Math.random() < 0.15 ? shown.options[Math.floor(Math.random() * shown.options.length)] : ranked[0];
  const resolution = resolveOption(opt, player);
  const cons: any = resolution ? resolution.consequences : opt.consequences;
  const outcome = resolution?.text ?? opt.outcomeText ?? "(sin reacción)";

  out.push(`
### [sem ${player.week} · ${getGameDateLabel(player.week)}] (${ev.category}) ${shown.title}`);
  out.push(shown.description);
  for (const c of cards) out.push(`   👤 QUIÉN ES — ${c.name} · ${c.role}: ${c.blurb}`);
  shown.options.forEach((o: any) => out.push(`   ${o === opt ? "➤" : "·"} ${o.label}${o.subtitle ? ` — ${o.subtitle}` : ""}`));
  out.push(`   ⮑ ${resolution ? (resolution.success ? "ÉXITO: " : "FALLO: ") : ""}${outcome}`);
  out.push(`   Δ ${summarizeEffects(cons) ?? "sin cambios numéricos"}`);

  const oldClub = player.club;
  const patch = applyConsequences(player, cons);
  const { newWeek, matchDoneFlag, weekCounter } = computeWeekAdvance(player, ev);
  Object.assign(player, patch);
  player.flags = { ...player.flags, ...(cons.flags ?? {}) };
  if (matchDoneFlag) player.flags.match_done_week = matchDoneFlag;
    player.flags.wk_count = weekCounter;
  if (ev.coachStance) player.flags.coach_bench = ev.coachStance === "no_cuenta" ? "4" : "0";
  if (typeof cons.club === "string" && cons.club && cons.club !== oldClub) {
    player.flags = { ...player.flags, club_since: String(newWeek), coach_bench: "0", bench_streak: "0", euro_progress: "" };
    player.rel_entrenador = 50; player.rel_vestuario = 45; player.rel_aficion = 40;
    out.push(`   🔁 TRASPASO: ${oldClub} → ${player.club} (relaciones reiniciadas)`);
  }
  const entry = buildLedgerEntry(ev, opt, cons, outcome, null, player.week);
  if (entry) player.flags.decisiones = appendLedger(player.flags, entry);
  if (newWeek > player.week) {
    const tick = tickInjury(player.flags);
    if (tick) { if (tick.newValue === null) delete player.flags[tick.flagKey]; else player.flags[tick.flagKey] = tick.newValue; player.forma = Math.max(0, player.forma + tick.formaDelta); }
    const bench = parseInt(String(player.flags.coach_bench ?? "0"), 10) || 0;
    if (bench > 0 && cons.flags?.coach_bench === undefined) player.flags.coach_bench = String(Math.max(0, bench - (newWeek - player.week)));
  }
  player.week = newWeek;
  used.push(ev.id);
  history.unshift({ title: ev.title, chosen: opt.label, effects: summarizeEffects(cons), outcome, category: ev.category });
  if (history.length > 10) history.pop();
  out.push(`   📊 ${player.club} · rol ${computeRole(player).role} · media ${player.media} · forma ${player.forma} · ánimo ${player.moral} · entrenador ${player.rel_entrenador} · vestuario ${player.rel_vestuario} · afición ${player.rel_aficion} · fama ${player.fama} · dinero ${eur(player.patrimonio)}€`);
}
writeFileSync("scripts/partida-transcripcion.md", "# Partida de prueba (" + N + " eventos, llamadas IA aprox. " + ai + ")\n" + out.join("\n"));
console.log = origLog;
console.log(`Transcripción escrita: ${out.length} líneas, ~${ai} escenas de IA`);
