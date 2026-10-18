/**
 * Prueba de PUNTA A PUNTA, sin IA y con la bandera REAL: si marcas en la jugada decisiva de una final (Copa o Champions), lo que viene
 * después —la crónica o la escena de la tanda— nunca puede decir 0-0 ni contar un partido sin goles tuyos.
 * (Una prueba anterior comprobaba solo la función suelta, con la palabra «goal», y no vio que en producción la bandera es un JSON.)
 */
process.env.ANTHROPIC_API_KEY = "fake-key-for-local-sim";
globalThis.fetch = (async () => new Response("{}", { status: 500 })) as typeof fetch;
const log = console.log;
console.log = () => {};
console.error = () => {};
const { pickNextEventDynamic } = await import("../src/lib/narrative/engine");
const { buildMatchCalendar, matchKey } = await import("../src/lib/calendar/match-calendar");
console.log = log;

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; log("  ✗ " + m); } else log("  ✓ " + m); };

const season = 7;
const week = season * 10 + 10; // mayo
const base = (): any => ({
  id: "p-final", user_id: "u", last_name: "Hassan", first_name: "Dani", nation: "España", position: "Delantero", personality: "ambicioso", mode: "pro", status: "active",
  club: "Real Madrid", week, media: 92, forma: 80, moral: 80, fama: 85, patrimonio: 5_000_000, rel_entrenador: 70, rel_vestuario: 70, rel_aficion: 70, rel_representante: 60,
  reputacion: 60, agent_name: "Iñaki", pending_event: null, second_career: null, photo_url: null,
  stats_matches_played: 200, stats_goals: 100, stats_assists: 50, stats_minutes_played: 15000, stats_yellow_cards: 0, stats_red_cards: 0, stats_titles: 8,
  flags: { club_since: "10", sel_debut_played: true, contract_until: "999", copa_progress: JSON.stringify({ season, round: 5, alive: true }), euro_progress: JSON.stringify({ season, round: 0, alive: true, tied: true }) },
});

log("Final de Copa del Rey con gol en la jugada decisiva (bandera real)");
const cal = buildMatchCalendar("Real Madrid", season, { copa: { round: 5, alive: true }, euro: { round: 0, alive: true, tied: true } });
const final = cal.find((m) => m.competition === "copa" && m.cupRound === 5);
ok(Boolean(final), "el calendario tiene la final de Copa en mayo");
const keys = cal.filter((m) => m.week === week).map((m) => ({ m, key: matchKey(m) }));

let bad = 0, scenes = 0, reports = 0, total = 0;
for (let i = 0; i < 60; i++) {
  const p = base();
  // Los partidos anteriores de ese mes ya jugados: solo queda la final.
  const done = keys.filter((k) => k.m.competition !== "copa").map((k) => k.key);
  p.flags.match_done_week = `${week}|${done.join(",")}`;
  p.flags[`match_decision_${week}_${final ? matchKey(final) : "x"}`] = JSON.stringify({ outcome: "goal", style: "Definir raso", sit: "Controlas un pase largo en carrera", min: "88" });
  // Antes del partido pueden salir otras escenas (contrato, agente…): se van saltando hasta llegar a la final.
  const used: string[] = [];
  let ev: any = null;
  for (let k = 0; k < 25; k++) {
    const cand: any = await pickNextEventDynamic(p, [], used);
    used.push(cand.id);
    if (/^matchday-/.test(cand.id) || (/penaltis/i.test(cand.title + cand.description) && /tanda/i.test(cand.title + cand.description))) { ev = cand; break; }
  }
  if (!ev) continue;
  total++;
  const text = `${ev.title} ${ev.description}`;
  if (/penaltis/i.test(text) && /tanda/i.test(text) && ev.options?.length) {
    scenes++;
    if (/\b0-0\b|Nadie ha podido con nadie/.test(text)) bad++;
  } else {
    reports++;
    const m = text.match(/Marcador:\s*(\d+)-(\d+)/);
    if (!m || parseInt(m[1], 10) < 1 || /0-0/.test(text)) bad++;
  }
}
ok(total >= 30 && scenes + reports === total, `se resolvieron ${total} finales (${reports} crónicas, ${scenes} tandas)`);
ok(bad === 0, `con gol en la jugada decisiva, ninguna final termina o se cuenta como 0-0 (fallos: ${bad})`);

if (fails) { log(`\n${fails} fallos`); process.exit(1); }
log("\nTodo bien");
