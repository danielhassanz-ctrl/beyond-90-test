/* QA determinista ligera: simula carreras completas y comprueba invariantes.
 * Ejecutar con: bun run src/qa/run.ts
 * No forma parte del bundle de la app (no lo importa ninguna ruta).
 */
import { CLUB_POOL, buildOffers, defById, validateMatchContext } from "@/game/clubs";
import {
  advance,
  chooseClub,
  createGame,
  migrate,
  resolveDynamicCard,
  resolveEvent,
  resolveEventFree,
  resolveMatch,
} from "@/game/engine";
import { eventById } from "@/game/events";
import type { GameState, Player } from "@/game/types";

const problems: string[] = [];
const fail = (msg: string) => problems.push(msg);

function player(i: number): Player {
  return {
    name: `Jugador ${i}`,
    nickname: "",
    city: ["Sevilla", "Madrid", "Bilbao", "Valencia", "Vigo", "Palma"][i % 6]!,
    position: (["DC", "EXT", "MC", "MCO", "LAT", "DFC"] as const)[i % 6],
    traits: [],
    avatar: null,
    foot: "derecho",
  } as unknown as Player;
}

/* ---------- 1. Ofertas iniciales variables ---------- */
const signatures = new Set<string>();
for (let i = 0; i < 40; i++) {
  const offers = buildOffers(player(i).city);
  if (offers.length !== 4) fail(`Ofertas != 4 (${offers.length})`);
  const defs = offers.map((o) => defById(o.clubId)!);
  if (defs.some((d) => !d)) fail("Oferta con club inexistente");
  if (!defs.some((d) => d.tier === 2)) fail("Ningún club de Segunda en las ofertas");
  if (!defs.some((d) => d.dev >= 4)) fail("Ningún club con buen desarrollo");
  const giants = defs.filter((d) => ["real-madrid", "barcelona", "atletico"].includes(d.id)).length;
  if (giants > 1) fail("Más de un gigante en las ofertas");
  if (new Set(offers.map((o) => o.clubId)).size !== 4) fail("Ofertas duplicadas");
  signatures.add(offers.map((o) => o.clubId).sort().join("|"));
}
if (signatures.size < 10) fail(`Ofertas poco variables (${signatures.size} combinaciones en 40)`);
if (CLUB_POOL.some((c) => c.id === "sevilla-atl")) fail("Sigue existiendo el id sevilla-atl");

/* ---------- 1b. Nuevas carreras: las ofertas cambian de verdad ---------- */
{
  const sets = new Set<string>();
  for (let i = 0; i < 15; i++) {
    const s = createGame(player(i));
    if (s.offers.length !== 4) fail("Nueva carrera sin 4 ofertas");
    sets.add(s.offers.map((o) => o.clubId).sort().join("|"));
  }
  if (sets.size < 10) fail(`Nuevas carreras repiten el mismo set de clubes (${sets.size}/15)`);
  console.log(`Ofertas de nueva carrera: ${sets.size}/15 conjuntos distintos`);
}


/* ---------- 2. Carreras completas ---------- */
const CAREERS = 22;
const stats = { keyMatches: [] as number[], ovr: [] as number[], forms: [] as number[], rels: [] as number[] };

for (let c = 0; c < CAREERS; c++) {
  let s = createGame(player(c));
  const offers = s.offers;
  s = chooseClub(s, offers[c % offers.length]!.clubId);
  s = advance(s);

  let seasons = 0;
  let keyThisSeason = 0;
  let guard = 0;
  const seenEventScene = new Map<string, number>();

  while (seasons < 3 && guard++ < 4000) {
    const card = s.pending;
    if (!card) {
      s = advance(s);
      continue;
    }

    if (card.type === "match") {
      keyThisSeason += 1;
      const m = card.match;
      const club = CLUB_POOL.find((d) => d.name === (m.ctx.isHome ? m.ctx.homeTeam : m.ctx.awayTeam));
      if (!club) fail("Contexto de partido sin club propio identificable");
      else if (!validateMatchContext(m.ctx, club.name)) fail(`Contexto incoherente: ${JSON.stringify(m.ctx)}`);
      if (m.goals > m.goalsFor) fail(`playerGoals > teamGoals (${m.goals}/${m.goalsFor})`);
      if (m.goalsFor === 0 && m.goals > 0) fail("Gol del jugador con equipo a 0");
      if (m.assists > Math.max(0, m.goalsFor - m.goals)) fail("Asistencias imposibles");
      if (m.shootout && !(m.tie && m.goalsFor === m.goalsAgainst)) fail("Penaltis sin eliminatoria empatada");
      if (m.minutes === 0 && (m.goals || m.assists || m.rating)) fail("Stats sin minutos");
      if (!Number.isFinite(m.rating)) fail("Rating NaN");
      s = resolveMatch(s, m, m.keyMoment ? m.keyMoment.options[0]!.id : undefined);
    } else if (card.type === "event") {
      const ev = eventById(card.eventId);
      if (!ev) fail(`Evento desconocido ${card.eventId}`);
      const prev = seenEventScene.get(card.eventId);
      if (prev !== undefined && (s.sceneCount ?? 0) - prev < 20) {
        fail(`Evento repetido demasiado pronto: ${card.eventId}`);
      }
      seenEventScene.set(card.eventId, s.sceneCount ?? 0);
      if (ev?.freeform && c % 2 === 0) {
        const texts = ["", "!!!!", "Me da igual lo que digas, yo juego", "Entiendo, trabajaré más"];
        s = resolveEventFree(s, card.eventId, texts[guard % texts.length]!);
      } else {
        s = resolveEvent(s, card.eventId, ev!.choices[guard % ev!.choices.length]!.id);
      }
    } else if (card.type === "dynamic") {
      if (card.kind === "match_flash") {
        const k = String(card.data["kind"] ?? "");
        if (["brace", "winner", "form"].includes(k)) fail(`Bloque simulado positivo convertido en escena (${k})`);
      }
      s = resolveDynamicCard(s, card, "ok");
    } else if (card.type === "season") {
      stats.keyMatches.push(keyThisSeason);
      keyThisSeason = 0;
      seasons += 1;
      s = advance(s);
    }

    if (!Number.isFinite(s.overall) || !Number.isFinite(s.form)) fail("Stat NaN en estado");
    if (s.overall > 99 || s.overall < 30) fail(`OVR fuera de rango (${s.overall})`);
    if (s.form < 4 || s.form > 92) fail(`Forma extrema (${s.form})`);
  }

  stats.ovr.push(s.overall);
  stats.forms.push(s.form);
  stats.rels.push(Math.max(s.rel.coach, s.rel.fans, s.rel.dressing));
}

const avg = (a: number[]) => Math.round((a.reduce((x, y) => x + y, 0) / Math.max(1, a.length)) * 10) / 10;
const keyOut = stats.keyMatches.filter((k) => k < 4 || k > 8);
if (keyOut.length > stats.keyMatches.length * 0.25) fail(`Partidos clave/temporada fuera de 4-8 en ${keyOut.length} casos`);
if (avg(stats.ovr) > 82) fail(`OVR medio disparado tras 3 temporadas (${avg(stats.ovr)})`);
if (stats.rels.some((r) => r >= 95)) fail("Relación llega a 95+ en 3 temporadas");

/* ---------- 3. Migración de saves antiguos ---------- */
const legacy = {
  version: 1,
  player: player(1),
  clubId: "betis",
  stage: "youth",
  age: 17,
  seasonIndex: 1,
  injuryWeeks: 3,
  injuryLabel: "Esguince",
  week: 12,
  overall: 63,
  potential: 60,
  form: 50,
  fitness: 70,
  morale: 60,
  discipline: 55,
  fame: 10,
  rel: { coach: 50, fans: 30, dressing: 50, agent: 0, family: 60 },
  seasons: [],
  log: [],
  achievements: [],
  seenEvents: [],
  flags: {},
  memory: { rejectedClubs: [], conflicts: [], promises: [] },
  pending: { type: "block", results: [] },
  onboarded: true,
};
try {
  const migrated = migrate(JSON.parse(JSON.stringify(legacy)) as unknown as GameState);
  if (!migrated) throw new Error("migrate devolvió null");
  if (!migrated.queue.length) fail("Save antiguo migrado sin plan de temporada");
  if (migrated.pending && migrated.pending.type === ("block" as never)) fail("Save antiguo conserva tarjeta de bloque");
  const after = advance(migrated);
  if (!after.pending) fail("Save antiguo migrado no genera escena");
} catch (err) {
  fail(`Migración de save antiguo lanza: ${String(err)}`);
}

console.log(
  `Carreras: ${CAREERS} · partidos clave/temporada ${avg(stats.keyMatches)} · OVR medio ${avg(stats.ovr)} · forma media ${avg(stats.forms)} · combinaciones de ofertas ${signatures.size}/40`,
);
if (problems.length) {
  const counts = new Map<string, number>();
  for (const p of problems) counts.set(p, (counts.get(p) ?? 0) + 1);
  console.log(`PROBLEMAS (${problems.length}):`);
  for (const [msg, n] of [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)) console.log(` x${n} ${msg}`);
  process.exit(1);
}
console.log("QA OK: sin incoherencias detectadas.");

/* ---------- 4. Variedad entre carreras (Fase 5) ---------- */
{
  const setsPerCareer: Set<string>[] = [];
  let preseasonMissing = 0;
  const finals: number[] = [];
  for (let c = 0; c < 12; c++) {
    let s = createGame(player(c + 100));
    s = chooseClub(s, s.offers[0]!.clubId);
    s = advance(s);
    const ids = new Set<string>();
    let preseasonSeen = 0;
    let seasons = 0;
    let guard = 0;
    while (seasons < 3 && guard++ < 4000) {
      const card = s.pending;
      if (!card) { s = advance(s); continue; }
      if (card.type === "match") s = resolveMatch(s, card.match, card.match.keyMoment ? card.match.keyMoment.options[0]!.id : undefined);
      else if (card.type === "event") {
        const ev = eventById(card.eventId)!;
        ids.add(card.eventId);
        if (ev.category === "preseason") preseasonSeen++;
        s = ev.freeform && guard % 3 === 0 ? resolveEventFree(s, card.eventId, "Trabajaré para ganarme el sitio") : resolveEvent(s, card.eventId, ev.choices[guard % ev.choices.length]!.id);
      } else if (card.type === "dynamic") s = resolveDynamicCard(s, card, "ok");
      else if (card.type === "season") { seasons++; s = advance(s); }
    }
    if (preseasonSeen < 2) preseasonMissing++;
    setsPerCareer.push(ids);
    finals.push(s.overall);
  }
  // Solapamiento medio entre carreras: cuanto menor, más rejugabilidad.
  let overlap = 0;
  let pairs = 0;
  for (let i = 0; i < setsPerCareer.length; i++) {
    for (let j = i + 1; j < setsPerCareer.length; j++) {
      const a = setsPerCareer[i]!;
      const b = setsPerCareer[j]!;
      const inter = [...a].filter((x) => b.has(x)).length;
      overlap += inter / Math.max(1, Math.min(a.size, b.size));
      pairs++;
    }
  }
  const jac = Math.round((overlap / Math.max(1, pairs)) * 100);
  const spread = Math.max(...finals) - Math.min(...finals);
  console.log(`Fase 5 · solapamiento de eventos entre carreras ${jac}% · pretemporadas cortas ${preseasonMissing}/12 · OVR final ${Math.min(...finals)}-${Math.max(...finals)}`);
  if (jac > 78) console.log(`AVISO: carreras demasiado parecidas (${jac}%)`);
  if (preseasonMissing > 3) console.log("AVISO: pretemporada poco presente");
  if (spread < 6) console.log("AVISO: resultados de carrera demasiado uniformes");
}
