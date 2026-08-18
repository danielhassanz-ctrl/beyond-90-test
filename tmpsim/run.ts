import { createGame, chooseClub, advance, resolveEvent, resolveEventFree, resolveDynamicCard, resolveBlock, resolveMatch, migrate, SAVE_KEY } from "../src/game/engine";
import { ALL_EVENTS as EVENTS } from "../src/game/events";
import { renderDynamic } from "../src/game/dynamic";
import type { GameState, Player } from "../src/game/types";

const p: Player = { name: "Test Jugador", nickname: "Testi", position: "DC", nationality: "España", city: "Sevilla", avatar: null, traits: ["ambicioso","profesional"] };
const problems: string[] = [];
const byAge: Record<number, number[]> = {};
const stageByAge: Record<number, Record<string, number>> = {};
const finals: number[] = [];
let firstTeamBy19 = 0, agentSeen = 0, matchesPlayed = 0, scores: Record<string,number> = {};
let freeUsed = 0, dynSeen = 0, injuries = 0;

const allEvents = EVENTS;
for (let run = 0; run < 60; run++) {
  let s = createGame(p);
  const clubs = ["betis","villarreal","sevilla","malaga"];
  s = chooseClub(s, clubs[run % 4]!);
  if (!Number.isFinite(s.overall)) problems.push("overall NaN inicio");
  if (s.overall < 50 || s.overall > 70) problems.push(`overall inicio raro ${s.overall}`);
  let guard = 0; let lastAge = 16; (byAge[16] ??= []).push(s.overall);
  while (s.seasonIndex < 4 && guard++ < 4000) {
    if (!s.pending) { s = advance(s); continue; }
    const c = s.pending;
    if (c.type === "event") {
      const ev = allEvents.find((e) => e.id === c.eventId);
      if (!ev) { problems.push(`evento desconocido ${c.eventId}`); s = { ...s, pending: null }; continue; }
      if (ev.freeform && run % 3 === 0) {
        const texts = ["", "   ", "Voy a trabajar como un profesional y callar", "eres un puto inútil, me largo", "jajaja qué gracioso 😂", "no sé, ya veremos", "🙂🙂🙂", "a".repeat(600)];
        s = resolveEventFree(s, ev.id, texts[(run + guard) % texts.length]!); freeUsed++;
      } else {
        const ch = ev.choices[(run + guard) % ev.choices.length]!;
        s = resolveEvent(s, ev.id, ch.id);
      }
    } else if (c.type === "match") {
      const m = c.match; matchesPlayed++;
      const key = `${m.goalsFor}-${m.goalsAgainst}`; scores[key] = (scores[key] ?? 0) + 1;
      if (m.goals > m.goalsFor) problems.push(`goles jugador > equipo ${m.goals}/${m.goalsFor}`);
      if (m.goalsFor === 0 && m.goals > 0) problems.push("marca con 0 goles equipo");
      if (m.assists + m.goals > m.goalsFor) problems.push(`G+A > marcador ${m.goals}+${m.assists}/${m.goalsFor}`);
      if (m.shootout && !m.tie) problems.push("penaltis sin eliminatoria");
      if (!Number.isFinite(m.rating) || m.rating < 0 || m.rating > 10) problems.push(`rating raro ${m.rating}`);
      if (m.unused && m.minutes > 0) problems.push("no usado con minutos");
      const kid = m.keyMoment?.options[(run+guard) % m.keyMoment.options.length]?.id;
      s = kid ? resolveMatch(s, m, kid) : resolveMatch(s, m);
    } else if (c.type === "block") { s = resolveBlock(s, c.block); }
    else if (c.type === "season") { s = advance(s); }
    else { dynSeen++;
      const v = renderDynamic(s, c);
      if (!v || !v.title) problems.push(`dynamic sin vista ${c.kind}`);
      if (c.kind.includes("injur")) injuries++;
      const opt = v.choices?.[0];
      s = resolveDynamicCard(s, c, opt ? opt.id : "ok", v.freeform ? "vale, lo hablamos" : undefined);
    }
    if (!Number.isFinite(s.overall) || !Number.isFinite(s.form)) { problems.push("NaN en stats"); break; }
    if (s.overall > 99) problems.push("overall >99");
    if (s.age !== lastAge) { lastAge = s.age; (byAge[s.age] ??= []).push(s.overall); const m = (stageByAge[s.age] ??= {}); m[s.stage] = (m[s.stage] ?? 0) + 1; }
    // roundtrip save
    const rt = migrate(JSON.parse(JSON.stringify(s)));
    if (!rt) problems.push("migrate falló");
  }
  if (s.agent.present) agentSeen++;
  if (s.stage === "first" && s.age <= 19) firstTeamBy19++;
  finals.push(s.overall);
}
finals.sort((a,b)=>a-b);
const top = Object.entries(scores).sort((a,b)=>b[1]-a[1]).slice(0,12);
console.log("problemas:", [...new Set(problems)].slice(0,12), "total", problems.length);
console.log("OVR tras 4 temp:", { min: finals[0], p25: finals[15], med: finals[30], p90: finals[54], max: finals[59] });
console.log("agente:", agentSeen, "/60  primer equipo<=19:", firstTeamBy19, "/60  partidos:", matchesPlayed, "libres:", freeUsed, "dyn:", dynSeen, "lesiones:", injuries);
const tier = (o:number)=> o>=90?"LEGEND/elite":o>=85?"estrella":o>=80?"gran jugador":o>=72?"buen Primera":o>=66?"modesto":"truncada";
const dist: Record<string,number> = {}; for (const f of finals) dist[tier(f)] = (dist[tier(f)] ?? 0)+1;
console.log("potenciales->tier a los 20:", dist);
console.log("marcadores top:", top);
for (const a of Object.keys(byAge).map(Number).sort((x,y)=>x-y)) { const v = byAge[a]!.slice().sort((x,y)=>x-y); console.log("edad", a, "n", v.length, "min", v[0], "med", v[Math.floor(v.length/2)], "p90", v[Math.floor(v.length*0.9)], "max", v[v.length-1], stageByAge[a] ?? {}); }
