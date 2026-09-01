import { advance, chooseClub, createGame, resolveDynamicCard, resolveEvent, resolveMatch } from "../src/game/engine";
import { eventById } from "../src/game/events";
import { renderDynamic } from "../src/game/dynamic";
import type { Player } from "../src/game/types";

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

const runs: string[][] = [];
for (let c = 0; c < 8; c++) {
  let s = createGame(player(c + 500));
  s = chooseClub(s, s.offers[c % s.offers.length]!.clubId);
  s = advance(s);
  const ids: string[] = [];
  let guard = 0;
  while (ids.length < 30 && guard++ < 6000) {
    const card = s.pending;
    if (!card) { s = advance(s); continue; }
    if (card.type === "match") s = resolveMatch(s, card.match, card.match.keyMoment?.options[0]!.id);
    else if (card.type === "event") {
      const ev = eventById(card.eventId)!;
      ids.push(ev.id);
      s = resolveEvent(s, ev.id, ev.choices[guard % ev.choices.length]!.id);
    } else if (card.type === "dynamic") {
      const dynamicKey = card.kind === "arc_beat"
        ? String(card.data["beatId"] ?? "arc_beat")
        : card.kind === "arc"
          ? `${String(card.data["arcId"] ?? "arc")}:c${String(card.data["chapter"] ?? "?")}`
          : card.kind === "arc_callback"
            ? `callback:${String(card.data["cbId"] ?? "?")}`
            : card.kind;
      ids.push(`dynamic:${dynamicKey}`);
      const choiceId = renderDynamic(s, card).choices[0]?.id ?? "ok";
      s = resolveDynamicCard(s, card, choiceId);
    } else s = advance(s);
  }
  runs.push(ids);
  console.log(`CAREER_${c}: ${ids.join(" | ")}`);
}

const counts = new Map<string, number>();
for (const ids of runs) for (const id of new Set(ids)) counts.set(id, (counts.get(id) ?? 0) + 1);
console.log("COMMON_IDS");
for (const [id, count] of [...counts.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0]))) {
  if (count >= 4) console.log(`${count}/8 ${id}`);
}
