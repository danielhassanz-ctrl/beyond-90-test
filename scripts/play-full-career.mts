/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CARRERA COMPLETA CON IA REAL: desde el debut hasta el retiro y la segunda
 * vida (entrenador o presidente), con la misma lógica que resolveEvent. Escribe
 * una transcripción para revisarla y mide el gasto de la API.
 *
 * Uso:  TRACK_USAGE=1 npx tsx --env-file=.env.local scripts/play-full-career.mts [maxEventos] [rol] [archivo]
 *   maxEventos  tope de seguridad de escenas de la carrera (por defecto 1200)
 *   rol         entrenador | presidente (por defecto entrenador)
 */
import { writeFileSync, appendFileSync } from "node:fs";
const { pickNextEventDynamic, resolveOption, applyConsequences, nextWeekGap, pickNextEvent } = await import("../src/lib/narrative/engine");
const { computeWeekAdvance } = await import("../src/lib/narrative/week-advance");
const { tickInjury } = await import("../src/lib/narrative/career-dynamics");
const { computeRole } = await import("../src/lib/narrative/role");
const { summarizeEffects } = await import("../src/lib/narrative/state-brief");
const { getGameDateLabel } = await import("../src/lib/calendar/season");
const { buildLedgerEntry, appendLedger } = await import("../src/lib/narrative/ledger");
const { introduceCast, markCastMet } = await import("../src/lib/narrative/cast");
const { personalizeEvent } = await import("../src/lib/narrative/npcs");
const { defaultReaction } = await import("../src/lib/narrative/default-reactions");
const { appendThread, openThreads, consumeThread, shouldTriggerSecondLifePayoff } = await import("../src/lib/narrative/threads");
const { simulateOffScreenMatches, sumSim } = await import("../src/lib/narrative/off-screen-matches");
const { extractStatsFromEvent, applyStatUpdate } = await import("../src/lib/player/update-stats");
const { generateSecondLifeEvent, generateSecondLifeThreadPayoff } = await import("../src/lib/narrative/ai");
const { getSecondLifeEvents } = await import("../src/lib/narrative/segundaVida");
const { playerAge } = await import("../src/types/career");

// Carrera con modelo barato (AI_MODEL_CAREER); la segunda vida con el modelo de producción.
if (process.env.AI_MODEL_CAREER) process.env.AI_MODEL = process.env.AI_MODEL_CAREER;
const origLog = console.log;
if (!process.env.DEBUG_AI) {
  console.log = () => {};
  console.error = () => {};
}

const MAX = Number(process.argv[2] ?? 1200);
const ROLE = (process.argv[3] ?? "entrenador") as "entrenador" | "presidente";
const OUT = process.argv[4] ?? "scripts/partida-completa.md";

const player: any = {
  id: "play-full", user_id: "u", last_name: "Dani Hassan", first_name: "Dani", nation: "España", position: "Delantero",
  personality: "ambicioso pero leal a los suyos", mode: "pro", status: "active", club: "Real Betis", week: 11,
  media: 58, forma: 78, moral: 70, fama: 25, patrimonio: 18000, rel_entrenador: 55, rel_vestuario: 55, rel_aficion: 55,
  rel_representante: 60, reputacion: 45, agent_name: "Iñaki Zubiaurre", flags: {}, pending_event: null,
  stats_matches_played: 4, stats_goals: 1, stats_assists: 0, stats_minutes_played: 200, stats_yellow_cards: 0, stats_red_cards: 0, stats_titles: 0,
  second_career: null, second_club: null, second_week: 1,
};
const used: string[] = ["pretemp-amistoso", "rookie-debut-oficial", "inicio-fichaje-agente"];
const history: any[] = [];
const eur = (n: number) => n.toLocaleString("es");
const earlyDecisions: string[] = [];
let aiScenes = 0;

writeFileSync(OUT, `# Carrera completa de prueba (rol final: ${ROLE})\n`);
const out = (line: string) => appendFileSync(OUT, line + "\n");

function score(o: any): number {
  const c = o.resolve ? { ...o.resolve.success.consequences } : o.consequences;
  const f = (k: string) => c[k] ?? 0;
  const base = f("rel_vestuario") + f("rel_entrenador") + f("rel_aficion") * 0.7 + f("moral") * 0.6 + f("reputacion") * 0.8 + f("fama") * 0.3 + f("forma") * 0.5 + f("media") * 2 + f("rel_representante") * 0.4 + f("patrimonio") / 4000;
  return base * (o.resolve ? 0.5 + o.resolve.baseChance : 1) + Math.random() * 3;
}

function choose(shown: any): any {
  // retirarse cuando toca; ficha por el club grande si lo ofrecen; si no, por puntuación con algo de azar
  const retire = shown.options.find((o: any) => o.id === "retirarse");
  if (retire && shown.id === "transition-ready-to-retire") return retire;
  const ranked = [...shown.options].sort((a: any, b: any) => score(b) - score(a));
  return Math.random() < 0.15 ? shown.options[Math.floor(Math.random() * shown.options.length)] : ranked[0];
}

let retired = false;
let n = 0;
while (n < MAX && !retired && player.week < 215) {
  n++;
  const ev: any = await pickNextEventDynamic(player, history, used);
  if (!ev?.options?.length) { out("\n!! evento vacío en semana " + player.week); break; }
  if (!/^(matchday|match-decision|torneo|sel-|fisio|arco|banco|echo|oferta|mercado|agent|social|preseason|hilo)/.test(ev.id)) aiScenes++;
  const shown: any = personalizeEvent(ev, player);
  const cards = introduceCast(shown, player);
  if (cards.length) player.flags.cast_met = markCastMet(player.flags, cards);
  const opt = choose(shown);
  const resolution = resolveOption(opt, player);
  let cons: any = resolution ? resolution.consequences : opt.consequences;
  // misma fusión que resolveEvent: una opción con tirada conserva su club/flags propios
  if (resolution) {
    cons = {
      ...cons,
      ...(cons.club === undefined && opt.consequences.club !== undefined ? { club: opt.consequences.club } : {}),
      ...(opt.consequences.flags ? { flags: { ...opt.consequences.flags, ...cons.flags } } : {}),
    };
  }
  const fire = String(opt.label).match(/despedir.*fichar\s+(?:a\s+)?(\p{Lu}[\p{L}'-]+(?:\s+\p{Lu}[\p{L}'-]+)+)/u);
  if (fire && cons.agent_name === undefined) cons = { ...cons, agent_name: fire[1], rel_representante: 50 - (player.rel_representante ?? 50) };
  if (opt.thread) {
    const t = appendThread(player.flags, opt.thread, player.week);
    if (t) cons = { ...cons, flags: { ...cons.flags, hilos: t } };
  }
  const outcome = resolution?.text ?? opt.outcomeText ?? defaultReaction(opt, player) ?? "(sin reacción)";

  out(`\n### [sem ${player.week} · ${getGameDateLabel(player.week)} · ${playerAge(player.week)} años] (${ev.category}) ${shown.title}`);
  out(shown.description);
  for (const c of cards) out(`   👤 QUIÉN ES — ${c.name} · ${c.role}: ${c.blurb}`);
  shown.options.forEach((o: any) => out(`   ${o === opt ? "➤" : "·"} ${o.label}${o.subtitle ? ` — ${o.subtitle}` : ""}${o.thread ? `  [HILO ${o.thread.kind} con ${o.thread.who}]` : ""}`));
  out(`   ⮑ ${resolution ? (resolution.success ? "ÉXITO: " : "FALLO: ") : ""}${outcome}`);
  out(`   Δ ${summarizeEffects(cons) ?? "sin cambios numéricos"}`);
  if (earlyDecisions.length < 40 && !/^(matchday|match-decision|torneo)/.test(ev.id)) earlyDecisions.push(`sem ${player.week}: "${shown.title}" → ${opt.label}`);

  const oldClub = player.club;
  const patch = applyConsequences(player, cons);
  const { newWeek, matchDoneFlag, weekCounter } = computeWeekAdvance(player, ev);
  Object.assign(player, patch);
  player.flags = { ...player.flags, ...(cons.flags ?? {}) };
  if (matchDoneFlag) player.flags.match_done_week = matchDoneFlag;
  player.flags.wk_count = weekCounter;
  if (ev.coachStance) player.flags.coach_bench = ev.coachStance === "no_cuenta" ? "4" : "0";
  if (typeof cons.agent_name === "string") player.agent_name = cons.agent_name;
  if (typeof cons.club === "string" && cons.club && cons.club !== oldClub) {
    player.flags = { ...player.flags, club_since: String(newWeek), coach_bench: "0", bench_streak: "0", euro_progress: "" };
    player.rel_entrenador = 50; player.rel_vestuario = 45; player.rel_aficion = 40;
    out(`   🔁 TRASPASO: ${oldClub} → ${player.club} (relaciones reiniciadas)`);
  }
  const entry = buildLedgerEntry(ev, opt, cons, outcome, null, player.week);
  if (entry) player.flags.decisiones = appendLedger(player.flags, entry);

  // estadísticas: partidos clave + estimados (misma cuenta que la app)
  const su = extractStatsFromEvent(ev);
  if (Object.keys(su).length > 0) Object.assign(player, applyStatUpdate(player, su));
  if (newWeek > player.week) {
    const off = sumSim(simulateOffScreenMatches(player, newWeek - player.week));
    player.stats_matches_played += off.matches; player.stats_goals += off.goals; player.stats_assists += off.assists; player.stats_minutes_played += off.minutes;
    const tick = tickInjury(player.flags);
    if (tick) { if (tick.newValue === null) delete player.flags[tick.flagKey]; else player.flags[tick.flagKey] = tick.newValue; player.forma = Math.max(0, player.forma + tick.formaDelta); }
    const bench = parseInt(String(player.flags.coach_bench ?? "0"), 10) || 0;
    if (bench > 0 && cons.flags?.coach_bench === undefined) player.flags.coach_bench = String(Math.max(0, bench - (newWeek - player.week)));
  }
  player.week = newWeek;
  used.push(ev.id);
  history.unshift({ title: ev.title, chosen: opt.label, effects: summarizeEffects(cons), outcome, category: ev.category });
  if (history.length > 10) history.pop();
  out(`   📊 ${player.club} · rol ${computeRole(player).role} · media ${player.media} · forma ${player.forma} · ánimo ${player.moral} · míster ${player.rel_entrenador} · vestuario ${player.rel_vestuario} · afición ${player.rel_aficion} · fama ${player.fama} · dinero ${eur(player.patrimonio)}€ · PJ ${player.stats_matches_played} G ${player.stats_goals} A ${player.stats_assists} T ${player.stats_titles}`);
  if (ev.id === "transition-ready-to-retire" && opt.id === "retirarse") retired = true;
}

out(`\n\n## === FIN DE LA CARRERA COMO JUGADOR (semana ${player.week}, ${playerAge(player.week)} años, ${n} escenas) ===`);
out(`Estadísticas finales: ${player.stats_matches_played} partidos, ${player.stats_goals} goles, ${player.stats_assists} asistencias, ${player.stats_titles} títulos. Dinero ${eur(player.patrimonio)} €. Club final: ${player.club}.`);
out(`Hilos abiertos al retirarse: ${JSON.stringify(openThreads(player.flags))}`);

// ---------------- SEGUNDA VIDA ----------------
if (retired || player.week >= 170 || process.env.FORCE_SECOND) {
  delete process.env.AI_MODEL;
  player.status = "second_life";
  player.second_career = ROLE;
  player.second_club = ROLE === "presidente" ? "Real Betis" : "Getafe CF";
  player.second_week = 1;
  out(`\n\n## === SEGUNDA VIDA: ${ROLE.toUpperCase()} del ${player.second_club} ===`);
  const slHistory: any[] = [];
  const slUsed: string[] = [];
  let guard = 0;
  while (player.second_week <= 20 && guard++ < 40) {
    let ev: any = null;
    let fromThread = false;
    const due = openThreads(player.flags)[0];
    if (due && shouldTriggerSecondLifePayoff(player)) {
      ev = await generateSecondLifeThreadPayoff(player, ROLE, due, slHistory);
      if (ev) {
        fromThread = true;
        player.flags = { ...player.flags, hilos: consumeThread(player.flags, due), thread_last_second_week: String(player.second_week) };
      }
    }
    if (!ev) ev = await generateSecondLifeEvent(player, ROLE, slHistory);
    if (!ev) ev = pickNextEvent(getSecondLifeEvents(ROLE, player.second_club), player.second_week, slUsed);
    if (!ev?.options?.length) { out("!! sin evento de segunda vida"); break; }
    const opt = [...ev.options].sort((a: any, b: any) => score(b) - score(a))[0];
    const resolution = resolveOption(opt, player);
    const cons: any = resolution ? resolution.consequences : opt.consequences;
    const outcome = resolution?.text ?? opt.outcomeText ?? defaultReaction(opt, player) ?? "(sin reacción)";
    out(`\n### [segunda vida · sem ${player.second_week}] (${ev.category})${fromThread ? " ⟲ COBRO DE HILO" : ""} ${ev.title}`);
    out(ev.description);
    ev.options.forEach((o: any) => out(`   ${o === opt ? "➤" : "·"} ${o.label}${o.subtitle ? ` — ${o.subtitle}` : ""}${o.thread ? `  [HILO ${o.thread.kind} con ${o.thread.who}]` : ""}`));
    out(`   ⮑ ${resolution ? (resolution.success ? "ÉXITO: " : "FALLO: ") : ""}${outcome}`);
    out(`   Δ ${summarizeEffects(cons) ?? "sin cambios numéricos"}`);
    if (opt.thread) {
      const t = appendThread(player.flags, opt.thread, player.week);
      if (t) player.flags = { ...player.flags, hilos: t };
    }
    Object.assign(player, applyConsequences(player, { patrimonio: cons.patrimonio, reputacion: cons.reputacion }));
    slHistory.unshift({ title: ev.title, chosen: opt.label, scene: ev.description });
    if (slHistory.length > 10) slHistory.pop();
    slUsed.push(ev.id);
    player.second_week += nextWeekGap(player.media, player.mode);
  }
}

out("\n\n## DECISIONES DEL PRINCIPIO (para rastrear su efecto después)");
for (const d of earlyDecisions) out("- " + d);

const g = globalThis as any;
const u = g.__usage ?? { calls: 0, input: 0, output: 0 };
const costUsd = (u.input * 3 + u.output * 15) / 1_000_000;
out(`\n\n## GASTO DE LA API: ${u.calls} llamadas · ${u.input} tokens de entrada · ${u.output} de salida · ≈ ${costUsd.toFixed(2)} US$ (a 3/15 US$ por millón de tokens; el precio real puede variar)`);
console.log = origLog;
console.log(`Transcripción escrita en ${OUT}: ${n} escenas de carrera, ~${aiScenes} sueltas de IA. API: ${u.calls} llamadas, ≈ ${costUsd.toFixed(2)} US$`);
