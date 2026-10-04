/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Simulación local (SIN API real) de carreras completas contra el motor: una respuesta
 * falsa sustituye a Claude y el avance de calendario usa la misma regla que resolveEvent
 * (week-advance.ts). Comprueba que no hay partidos repetidos, atascos de semana, torneos
 * sin cerrar ni lesiones de más de 3 meses.
 *
 * Uso:  env -u ANTHROPIC_API_KEY npx tsx scripts/sim-career.mts
 */
process.env.ANTHROPIC_API_KEY = "fake-key-for-local-sim";
let aiCalls = 0;
const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: any, init?: any) => {
  const url = typeof input === "string" ? input : input?.url ?? String(input);
  if (url.includes("api.anthropic.com")) {
    aiCalls++;
    const body = {
      id: "msg_fake",
      type: "message",
      role: "assistant",
      model: "fake",
      stop_reason: "tool_use",
      stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
      content: [
        {
          type: "tool_use",
          id: "tu_fake",
          name: "emit_event",
          input: {
            title: `Escena IA número ${aiCalls}`,
            description: "Una escena inventada por el simulador local para probar el flujo.",
            options: [
              { label: "Opción prudente", subtitle: "sub", outcome_text: "Reacción prudente.", consequences: { moral: 2 } },
              { label: "Opción arriesgada", subtitle: "sub", outcome_text: "Reacción arriesgada.", consequences: { fama: 2, moral: -1 } },
            ],
          },
        },
      ],
    };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  }
  return realFetch(input, init);
}) as typeof fetch;

const { pickNextEventDynamic, resolveOption, applyConsequences } = await import("../src/lib/narrative/engine");
const { computeWeekAdvance } = await import("../src/lib/narrative/week-advance");
const { tickInjury, getInjuryRemaining } = await import("../src/lib/narrative/career-dynamics");
const { computeRole } = await import("../src/lib/narrative/role");
const { summarizeEffects } = await import("../src/lib/narrative/state-brief");
const { getClubLevel } = await import("../src/lib/calendar/match-calendar");
const { buildLedgerEntry, appendLedger } = await import("../src/lib/narrative/ledger");
const { introduceCast, markCastMet } = await import("../src/lib/narrative/cast");
const { personalizeEvent } = await import("../src/lib/narrative/npcs");

// Silenciar logs del motor
const origLog = console.log;
const origErr = console.error;
console.log = () => {};
console.error = () => {};

interface Result {
  club: string;
  events: number;
  endWeek: number;
  errors: string[];
  stuck: number;
  matchEvents: number;
  matchBySeason: Record<number, number>;
  tournaments: { started: number; matches: number; maxLen: number };
  injuries: { count: number; maxWeeks: number };
  roles: Record<string, number>;
  cats: Record<string, number>;
  noReaction: number;
  withOptions: number;
  nulls: number;
}

async function career(club: string, media: number, seed: number): Promise<Result> {
  const player: any = {
    id: `sim-${club}-${seed}`,
    user_id: "u",
    last_name: "Hassan",
    first_name: "Dani",
    nation: "España",
    position: "Delantero",
    personality: "ambicioso",
    mode: "pro",
    status: "active",
    club,
    week: 11,
    media,
    forma: 80,
    moral: 70,
    fama: 40,
    patrimonio: 200000,
    rel_entrenador: 60,
    rel_vestuario: 60,
    rel_aficion: 60,
    rel_representante: 60,
    reputacion: 50,
    agent_name: "Iñaki Zubiaurre",
    flags: { propiedad_sim_0: JSON.stringify({ name: "Villa de prueba", price: 2500000, downPayment: 500000, since: 11 }) },
    pending_event: null,
    stats_matches_played: 20,
    stats_goals: 5,
    stats_assists: 3,
    stats_minutes_played: 1200,
    stats_yellow_cards: 0,
    stats_red_cards: 0,
    stats_titles: 0,
  };
  const used: string[] = ["pretemp-amistoso", "rookie-debut-oficial", "inicio-fichaje-agente"];
  const history: any[] = [];
  const res: Result = {
    club, events: 0, endWeek: 0, errors: [], stuck: 0, matchEvents: 0, matchBySeason: {},
    tournaments: { started: 0, matches: 0, maxLen: 0 }, injuries: { count: 0, maxWeeks: 0 },
    roles: {}, cats: {}, noReaction: 0, withOptions: 0, nulls: 0,
  };
  let sameWeek = 0;
  let lastWeek = player.week;
  let torneoLen = 0;
  let injuryStartWeek: number | null = null;
  const seenMatch = new Set<string>();
  const castSeen = new Set<string>();
  const castStats = { events: 0, cards: 0, max: 0 };
  const prefixCount: Record<string, number> = {};

  for (let i = 0; i < 1800 && player.week < 190; i++) {
    let ev: any;
    try {
      ev = await pickNextEventDynamic(player, history, used);
    } catch (e: any) {
      res.errors.push(`pick@${player.week}: ${e?.message ?? e}`);
      break;
    }
    if (!ev || !ev.options?.length) {
      res.nulls++;
      res.errors.push(`evento vacío @${player.week} (${ev?.id})`);
      break;
    }
    res.events++;
    res.cats[ev.category] = (res.cats[ev.category] ?? 0) + 1;
    const { role } = computeRole(player);
    res.roles[role] = (res.roles[role] ?? 0) + 1;

    // coherencia con el estado: lesionado/apartado no juegan ni entrenan
    const injuredNow = getInjuryRemaining(player.flags) > 0;
    const allowedWhileInjured = ev.id.startsWith("matchday-baja-") || ev.id.startsWith("fisio-") || ev.id.startsWith("torneo-life-") || ev.id.startsWith("mercado-") || ev.id.startsWith("matchday-torneo-") || ev.id.startsWith("sel-") || ev.id.startsWith("preseason-");
    if (injuredNow && !allowedWhileInjured && (ev.category === "entrenamiento" || ev.category === "partido")) {
      res.errors.push(`lesionado con escena de ${ev.category}: ${ev.id} (${ev.title})`);
    }
    if (role === "apartado" && ev.id.startsWith("match-decision-") && !ev.ownTeam) {
      res.errors.push(`apartado con jugada decisiva de club: ${ev.id}`);
    }
    // sanity del texto
    const txt = `${ev.title} ${ev.description}`;
    if (/undefined|\[object|NaN/.test(txt)) res.errors.push(`texto roto: ${ev.id}`);

    // presentación de personajes (cast.ts): igual que en page/actions
    const shown = personalizeEvent(ev, player);
    const cards = introduceCast(shown, player);
    castStats.events += cards.length > 0 ? 1 : 0;
    castStats.cards += cards.length;
    castStats.max = Math.max(castStats.max, cards.length);
    for (const c of cards) {
      if (castSeen.has(c.name)) res.errors.push(`ficha repetida: ${c.name}`);
      castSeen.add(c.name);
    }
    if (cards.length) player.flags.cast_met = markCastMet(player.flags, cards);
    const opt = ev.options[Math.floor(Math.random() * ev.options.length)];
    res.withOptions++;
    const resolution = resolveOption(opt, player);
    const cons = resolution ? resolution.consequences : opt.consequences;
    if (!resolution && !opt.outcomeText) res.noReaction++;

    // consecuencias
    const patch = applyConsequences(player, cons);
    const { newWeek, matchDoneFlag } = computeWeekAdvance(player, ev);
    Object.assign(player, patch);
    player.flags = { ...player.flags, ...(cons.flags ?? {}) };
    if (matchDoneFlag) player.flags.match_done_week = matchDoneFlag;
    if (ev.coachStance) {
      player.flags.coach_bench = ev.coachStance === "no_cuenta" ? "4" : "0";
    }
    if (cons.club === "@LOWER") player.club = "Real Zaragoza";
    const entry = buildLedgerEntry(ev, opt, cons, resolution?.text ?? opt.outcomeText ?? null, null, player.week);
    if (entry) player.flags.decisiones = appendLedger(player.flags, entry);
    if (newWeek > player.week) {
      const tick = tickInjury(player.flags);
      if (tick) {
        if (tick.newValue === null) delete player.flags[tick.flagKey];
        else player.flags[tick.flagKey] = tick.newValue;
        player.forma = Math.max(0, player.forma + tick.formaDelta);
      }
      const bench = parseInt(String(player.flags.coach_bench ?? "0"), 10) || 0;
      if (bench > 0 && cons.flags?.coach_bench === undefined) player.flags.coach_bench = String(Math.max(0, bench - (newWeek - player.week)));
    }

    // métricas
    for (const pre of ["fisio-", "mercado-banquillo-", "matchday-baja-banquillo-", "matchday-baja-", "agent-minutes-", "agent-injury-", "sel-", "torneo-life-", "echo-", "banco-"]) {
      if (ev.id.startsWith(pre)) prefixCount[pre] = (prefixCount[pre] ?? 0) + 1;
    }
    if (ev.id.startsWith("matchday-") && ev.matchKey) {
      const k = `${player.week}:${ev.matchKey}`;
      if (seenMatch.has(k)) res.errors.push(`partido repetido ${k}`);
      seenMatch.add(k);
    }
    if (ev.id.startsWith("matchday-") && !ev.id.startsWith("matchday-torneo-") && !ev.id.startsWith("matchday-baja-")) {
      res.matchEvents++;
      const season = Math.floor((player.week - 1) / 10);
      res.matchBySeason[season] = (res.matchBySeason[season] ?? 0) + 1;
    }
    if (typeof player.flags.torneo_activo === "string" && player.flags.torneo_activo) {
      if (torneoLen === 0) res.tournaments.started++;
      torneoLen++;
      res.tournaments.maxLen = Math.max(res.tournaments.maxLen, torneoLen);
    } else torneoLen = 0;
    if (ev.id.startsWith("matchday-torneo-")) res.tournaments.matches++;

    const inj = getInjuryRemaining(player.flags);
    if (inj > 0 && injuryStartWeek === null) { injuryStartWeek = player.week; res.injuries.count++; }
    if (inj === 0 && injuryStartWeek !== null) { res.injuries.maxWeeks = Math.max(res.injuries.maxWeeks, newWeek - injuryStartWeek); injuryStartWeek = null; }

    // estancamiento
    if (newWeek === lastWeek) sameWeek++; else { sameWeek = 0; lastWeek = newWeek; }
    if (sameWeek > 45) { res.stuck++; res.errors.push(`atascado en semana ${newWeek}: último evento ${ev.id}`); break; }

    player.week = newWeek;
    used.push(ev.id);
    history.unshift({
      title: ev.title,
      chosen: opt.label,
      effects: summarizeEffects(cons as any),
      outcome: resolution?.text ?? opt.outcomeText ?? null,
      category: ev.category,
    });
    if (history.length > 10) history.pop();
  }
  res.endWeek = player.week;
  (res as any).prefixCount = prefixCount;
  (res as any).castStats = castStats;
  return res;
}

const setups: [string, number][] = [["Real Madrid", 72], ["Sevilla FC", 64], ["Málaga CF", 55]];
let totalErrors = 0;
for (const [club, media] of setups) {
  for (let seed = 0; seed < 2; seed++) {
    const r = await career(club, media, seed);
    totalErrors += r.errors.length;
    const seasons = Object.keys(r.matchBySeason).length;
    const perSeason = seasons ? (r.matchEvents / seasons).toFixed(1) : "0";
    origLog(
      `${club.padEnd(12)} #${seed} eventos=${r.events} semana=${r.endWeek} partidos/temp=${perSeason} torneos=${r.tournaments.started} (partidos ${r.tournaments.matches}, máx ${r.tournaments.maxLen} eventos) lesiones=${r.injuries.count} (máx ${r.injuries.maxWeeks} semanas) sinReacción=${r.noReaction}/${r.withOptions} IA=${aiCalls}`,
    );
    origLog("   roles:", JSON.stringify(r.roles), "cats:", JSON.stringify(r.cats), "prefijos:", JSON.stringify((r as any).prefixCount), "fichas:", JSON.stringify((r as any).castStats));
    if (r.errors.length) origLog("   ERRORES:", r.errors.slice(0, 5));
  }
}
origLog(totalErrors === 0 ? "SIN ERRORES" : `ERRORES TOTALES: ${totalErrors}`);
console.log = origLog;
console.error = origErr;
