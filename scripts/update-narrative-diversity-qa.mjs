import fs from "node:fs";

const file = "src/qa/run.ts";
let src = fs.readFileSync(file, "utf8");
const startMarker = "/* ---------- 5. Diversidad de la historia principal (rutas narrativas) ---------- */";
const endMarker = "/* ---------- 6. FASE 6 · carrera completa hasta la retirada ---------- */";
const start = src.indexOf(startMarker);
const end = src.indexOf(endMarker);
if (start < 0 || end < 0 || end <= start) throw new Error("Narrative diversity QA block not found");

const replacement = `/* ---------- 5. Diversidad de la historia principal (Narrative Director) ---------- */
{
  const signaturesStory = new Map<string, number>();
  const profiles = new Set<string>();
  const firstArcs = new Map<string, number>();
  const N = 14;
  for (let c = 0; c < N; c++) {
    let s = createGame(player(c + 500));
    s = chooseClub(s, s.offers[c % s.offers.length]!.clubId);
    s = advance(s);
    const storyBeats: string[] = [];
    let guard = 0;
    while (storyBeats.length < 5 && guard++ < 5000) {
      const card = s.pending;
      if (!card) { s = advance(s); continue; }
      if (card.type === "match") {
        s = resolveMatch(s, card.match, card.match.keyMoment ? card.match.keyMoment.options[0]!.id : undefined);
      } else if (card.type === "event") {
        const ev = eventById(card.eventId)!;
        s = ev.freeform && guard % 3 === 0
          ? resolveEventFree(s, card.eventId, "Voy a pelear mi sitio")
          : resolveEvent(s, card.eventId, ev.choices[guard % ev.choices.length]!.id);
      } else if (card.type === "dynamic") {
        if (card.kind === "arc") {
          const arcId = String(card.data["arcId"] ?? "?");
          const chapter = Number(card.data["chapter"] ?? 0);
          storyBeats.push(\`\${arcId}:c\${chapter}\`);
          if (storyBeats.length === 1) firstArcs.set(arcId, (firstArcs.get(arcId) ?? 0) + 1);
        } else if (card.kind === "arc_callback") {
          storyBeats.push(\`callback:\${String(card.data["cbId"] ?? "?")}\`);
        }
        s = resolveDynamicCard(s, card, "ok");
      } else if (card.type === "season") {
        s = advance(s);
      }
    }
    const director = (s as unknown as { director?: { profile?: string } }).director;
    profiles.add(String(director?.profile ?? "?"));
    const sig = storyBeats.join(">");
    signaturesStory.set(sig, (signaturesStory.get(sig) ?? 0) + 1);
  }
  const top = Math.max(...signaturesStory.values());
  const share = Math.round((top / N) * 100);
  const firstTop = Math.max(...firstArcs.values());
  const firstShare = Math.round((firstTop / N) * 100);
  console.log(
    \`Narrative Director · firmas distintas \${signaturesStory.size}/\${N} · perfiles usados \${profiles.size} · primeros arcos \${firstArcs.size} · firma más repetida \${share}% · primer arco más repetido \${firstShare}%\`,
  );
  if (signaturesStory.size < 5 || share > 35 || firstArcs.size < 3 || firstShare > 55 || profiles.size < 3) {
    console.log("FALLO: el Narrative Director converge demasiado entre carreras");
    process.exit(1);
  }
}

`;

src = src.slice(0, start) + replacement + src.slice(end);
fs.writeFileSync(file, src);
console.log("Narrative diversity QA now measures active arcs, callbacks and director profiles.");
