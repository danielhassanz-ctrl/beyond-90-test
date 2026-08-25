import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "@/game/engine";
import type { GameState } from "@/game/types";
import { renderDynamic } from "@/game/dynamic";

function run(seed: number) {
  let s = createGame({ name: "Test" + seed, nickname: "T", position: "MC", city: "Sevilla", avatar: null, traits: [] } as any);
  s.careerSeed = seed * 7919;
  s = chooseClub(s, s.offers[0]!.clubId);
  const ids: string[] = []; const texts = new Set<string>(); let dupText = 0; let seasons = 0;
  for (let i = 0; i < 220 && seasons < 3; i++) {
    const c = s.pending;
    if (!c) { s = advance(s); continue; }
    if (c.type === "event") { ids.push("legacy:" + c.eventId); s = resolveEvent(s, c.eventId, "any"); }
    else if (c.type === "match") { s = resolveMatch(s, c.match); }
    else if (c.type === "season") { seasons++; s = advance(s); }
    else {
      const v = renderDynamic(s, c);
      ids.push(c.kind === "arc" ? `${c.data["arcId"]}#${c.data["chapter"]}` : c.kind === "arc_beat" ? String(c.data["beatId"]) : c.kind);
      const t = v.text.slice(0, 60);
      if (texts.has(t)) dupText++; texts.add(t);
      s = resolveDynamicCard(s, c, v.choices[0]?.id ?? "ok");
    }
    if (s.lastOutcome) s = advance(s);
  }
  return { ids, dupText, overall: s.overall, age: s.age, completed: (s as any).director?.completed ?? [] };
}
const a = run(1), b = run(2), c = run(3);
for (const [n, r] of [["A", a], ["B", b], ["C", c]] as const) {
  console.log(n, "media", r.overall, "edad", r.age, "textos repetidos", r.dupText, "arcos", r.completed.join(","));
  console.log("  legacy:", r.ids.filter((x) => x.startsWith("legacy:")).length, "/", r.ids.length);
  console.log("  seq:", r.ids.slice(0, 14).join(" > "));
}
const inter = a.ids.filter((x) => b.ids.includes(x)).length / Math.max(1, a.ids.length);
console.log("solapamiento A/B:", Math.round(inter * 100) + "%");
