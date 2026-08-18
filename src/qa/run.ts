import { createGame, chooseClub, advance, resolveEvent, resolveEventFree, resolveDynamicCard, resolveMatch } from "../game/engine";
import { eventById } from "../game/events";
import type { GameState } from "../game/types";

const problems: string[] = [];
let scenes = 0, matchScenes = 0, dynScenes = 0, evScenes = 0, seasonScenes = 0;
const evCounts: Record<string, number> = {};
const ovr19: number[] = [];
let firstTeam = 0, careers = 0;
const forms: number[] = [];
const rels: number[] = [];

for (let c = 0; c < 25; c++) {
  careers++;
  let s: GameState = createGame({ name: "Test", nickname: "T", position: "EXT", nationality: "España", city: "Sevilla", avatar: null, traits: ["ambicioso"] } as any);
  s = chooseClub(s, s.offers[Math.floor(Math.random()*s.offers.length)]!.clubId);
  const seen: Record<string, number> = {};
  for (let i = 0; i < 400 && s.seasonIndex < 3; i++) {
    s = advance(s);
    const p = s.pending;
    if (!p) { problems.push("pending null tras advance"); break; }
    scenes++;
    if (p.type === "match") {
      matchScenes++;
      const m = p.match;
      if (!m.ctx) problems.push("match sin ctx");
      else {
        if (m.ctx.isHome && m.ctx.homeTeam === m.ctx.opponent) problems.push("home==opponent");
        if (!m.ctx.isHome && m.ctx.awayTeam === m.ctx.opponent) problems.push("away==opponent");
        if (m.ctx.specialTag && m.ctx.derbyOpponent && m.ctx.derbyOpponent !== m.ctx.opponent) problems.push("derby mismatch");
        if (!m.ctx.venue || !m.ctx.competition) problems.push("ctx incompleto");
      }
      if (m.goals > m.goalsFor) problems.push("goles>equipo");
      if (m.goals + m.assists > m.goalsFor) problems.push("g+a>equipo");
      if (m.shootout && !(m.tie && m.goalsFor === m.goalsAgainst)) problems.push("penaltis indebidos");
      if (!Number.isFinite(m.rating)) problems.push("rating NaN");
      s = resolveMatch(s, m, m.keyMoment?.options[0]?.id);
    } else if (p.type === "event") {
      evScenes++;
      evCounts[p.eventId] = (evCounts[p.eventId] ?? 0) + 1;
      if (seen[p.eventId] !== undefined && s.sceneCount - seen[p.eventId]! < 20) problems.push("evento repetido pronto " + p.eventId);
      seen[p.eventId] = s.sceneCount;
      const ev = eventById(p.eventId)!;
      if (ev.freeform && Math.random() < 0.5) s = resolveEventFree(s, ev.id, Math.random() < 0.3 ? "" : "Me da igual lo que digas, yo juego 😤".repeat(3));
      else s = resolveEvent(s, ev.id, ev.choices[Math.floor(Math.random()*ev.choices.length)]!.id);
    } else if (p.type === "dynamic") {
      dynScenes++;
      s = resolveDynamicCard(s, p, "x", Math.random() < 0.3 ? "haz tu trabajo, confío en ti" : undefined);
    } else if (p.type === "season") {
      seasonScenes++;
      s = advance(s);
    }
    if (!Number.isFinite(s.overall) || !Number.isFinite(s.form)) { problems.push("NaN state"); break; }
    forms.push(s.form);
    rels.push(s.rel.coach);
  }
  ovr19.push(s.overall);
  if (s.stage === "first") firstTeam++;
}
const q=(a:number[],p:number)=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length*p)]!;
console.log("carreras",careers,"escenas",scenes);
console.log("por temporada: partidos",(matchScenes/(careers*3)).toFixed(1),"eventos",(evScenes/(careers*3)).toFixed(1),"dinamicas",(dynScenes/(careers*3)).toFixed(1));
console.log("OVR fin 3 temporadas med",(ovr19.reduce((a,b)=>a+b,0)/ovr19.length).toFixed(1),"p10",q(ovr19,0.1),"p90",q(ovr19,0.9),"max",Math.max(...ovr19));
console.log("primer equipo %",Math.round(firstTeam/careers*100));
console.log("forma p5",q(forms,0.05),"med",Math.round(forms.reduce((a,b)=>a+b,0)/forms.length),"p95",q(forms,0.95));
console.log("rel coach p5",q(rels,0.05),"p95",q(rels,0.95));
console.log("problemas",problems.length, [...new Set(problems)].slice(0,8));
