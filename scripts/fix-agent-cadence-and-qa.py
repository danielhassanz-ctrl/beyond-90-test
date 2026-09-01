from pathlib import Path

# Product fix: agent relation must not start in conflict; add cadence cooldown.
p = Path('src/game/engine.ts')
s = p.read_text()
old = '''function agentCard(s: GameState): Card | null {\n  if (agentEligible(s)) return dyn("agent_intro", { commission: 8 + Math.floor(Math.random() * 3) });\n  if (!s.agent.present) return null;\n'''
new = '''function agentCard(s: GameState): Card | null {\n  if (agentEligible(s)) return dyn("agent_intro", { commission: 8 + Math.floor(Math.random() * 3) });\n  if (!s.agent.present) return null;\n  const scene = s.sceneCount ?? 0;\n  const lastAgentScene = s.flags["agent_last_scene"] ?? -99;\n  if (scene - lastAgentScene < 5) return null;\n'''
if old not in s:
    raise SystemExit('agentCard target missing')
s = s.replace(old, new, 1)
old2 = '''  if (card.kind === "thread") {\n    const id = typeof card.data["threadId"] === "string" ? card.data["threadId"] : "";\n    if (id) closeThread(s, id);\n  }\n  s.pending = null;\n'''
new2 = '''  if (card.kind === "thread") {\n    const id = typeof card.data["threadId"] === "string" ? card.data["threadId"] : "";\n    if (id) closeThread(s, id);\n  }\n  if (card.kind.startsWith("agent_")) {\n    s.flags["agent_last_scene"] = s.sceneCount ?? 0;\n  }\n  s.pending = null;\n'''
if old2 not in s:
    raise SystemExit('resolveDynamicCard target missing')
s = s.replace(old2, new2, 1)
p.write_text(s)

# Product fix: signing must establish a viable relationship baseline.
d = Path('src/game/dynamic.ts')
ds = d.read_text()
repls = [
('''      rel(s, "agent", 25);\n      achieve(s, "representante");''', '''      rel(s, "agent", 25);\n      s.rel.agent = Math.max(s.rel.agent, 30);\n      achieve(s, "representante");'''),
('''      rel(s, "agent", 15);\n      achieve(s, "representante");''', '''      rel(s, "agent", 15);\n      s.rel.agent = Math.max(s.rel.agent, 24);\n      achieve(s, "representante");'''),
('''    rel(s, "agent", 10);\n    achieve(s, "representante");\n    return { title: "Acuerdo tibio"''', '''    rel(s, "agent", 10);\n    s.rel.agent = Math.max(s.rel.agent, 20);\n    achieve(s, "representante");\n    return { title: "Acuerdo tibio"'''),
('''    rel(s, "agent", 14);\n    achieve(s, "representante");''', '''    rel(s, "agent", 14);\n    s.rel.agent = Math.max(s.rel.agent, 24);\n    achieve(s, "representante");'''),
('''  rel(s, "agent", 22);\n  achieve(s, "representante");''', '''  rel(s, "agent", 22);\n  s.rel.agent = Math.max(s.rel.agent, 28);\n  achieve(s, "representante");'''),
]
for oldx,newx in repls:
    if oldx not in ds:
        raise SystemExit('dynamic agent relation target missing: '+oldx[:40])
    ds = ds.replace(oldx,newx,1)
d.write_text(ds)

# QA fix: every dynamic card chooses an actual rendered option, and semantic
# IDs reflect genuinely different visible content rather than only card.kind.
q = Path('src/qa/run.ts')
qs = q.read_text()
qs = qs.replace('s = resolveDynamicCard(s, card, "ok");', 's = resolveDynamicCard(s, card, renderDynamic(s, card).choices[0]?.id ?? "ok");')
old3 = '''        const dynamicKey = card.kind === "arc_beat"\n          ? String(card.data["beatId"] ?? "arc_beat")\n          : card.kind === "arc"\n            ? `${String(card.data["arcId"] ?? "arc")}:c${String(card.data["chapter"] ?? "?")}`\n            : card.kind === "arc_callback"\n              ? `callback:${String(card.data["cbId"] ?? "?")}`\n              : card.kind;\n        ids.push(`dynamic:${dynamicKey}`);\n        fams.push(`dynamic:${card.kind}`);\n        titles.push(dynamicKey);\n'''
new3 = '''        const view = renderDynamic(s, card);\n        const semantic = (key: string, fallback = "?") => String(card.data[key] ?? fallback);\n        const dynamicKey = card.kind === "arc_beat"\n          ? semantic("beatId", "arc_beat")\n          : card.kind === "arc"\n            ? `${semantic("arcId", "arc")}:c${semantic("chapter")}`\n            : card.kind === "arc_callback"\n              ? `callback:${semantic("cbId")}`\n              : card.kind === "thread"\n                ? `thread:${semantic("threadKind")}`\n                : card.kind === "match_flash"\n                  ? `match_flash:${semantic("kind", "run")}`\n                  : card.kind === "agent_check"\n                    ? `agent_check:${semantic("topic", "general")}`\n                    : card.kind === "agent_teaser"\n                      ? `agent_teaser:${semantic("teaser", "rumor")}`\n                      : card.kind === "agent_offer"\n                        ? `agent_offer:${semantic("clubName", "club")}`\n                        : card.kind === "money"\n                          ? `money:${semantic("offer", "decision")}`\n                          : card.kind === "injury_diagnosis"\n                            ? `injury:${semantic("severity", "minor")}:${semantic("label", "lesion")}`\n                            : card.kind === "return"\n                              ? `return:${semantic("label", "lesion")}`\n                              : card.kind;\n        ids.push(`dynamic:${dynamicKey}`);\n        fams.push(`dynamic:${view.category}`);\n        titles.push(view.title);\n'''
if old3 not in qs:
    raise SystemExit('experience dynamic key block missing')
qs = qs.replace(old3,new3,1)
q.write_text(qs)

# Diagnostic: semantic keys and valid choices too.
diag = Path('scripts/experience-diagnostic.ts')
dg = diag.read_text()
old4 = '''      const dynamicKey = card.kind === "arc_beat"\n        ? String(card.data["beatId"] ?? "arc_beat")\n        : card.kind === "arc"\n          ? `${String(card.data["arcId"] ?? "arc")}:c${String(card.data["chapter"] ?? "?")}`\n          : card.kind === "arc_callback"\n            ? `callback:${String(card.data["cbId"] ?? "?")}`\n            : card.kind;\n      ids.push(`dynamic:${dynamicKey}`);\n      const choiceId = renderDynamic(s, card).choices[0]?.id ?? "ok";\n'''
new4 = '''      const semantic = (key: string, fallback = "?") => String(card.data[key] ?? fallback);\n      const dynamicKey = card.kind === "arc_beat" ? semantic("beatId", "arc_beat")\n        : card.kind === "arc" ? `${semantic("arcId", "arc")}:c${semantic("chapter")}`\n        : card.kind === "arc_callback" ? `callback:${semantic("cbId")}`\n        : card.kind === "thread" ? `thread:${semantic("threadKind")}`\n        : card.kind === "match_flash" ? `match_flash:${semantic("kind", "run")}`\n        : card.kind === "agent_check" ? `agent_check:${semantic("topic", "general")}`\n        : card.kind === "agent_teaser" ? `agent_teaser:${semantic("teaser", "rumor")}`\n        : card.kind === "agent_offer" ? `agent_offer:${semantic("clubName", "club")}`\n        : card.kind === "money" ? `money:${semantic("offer", "decision")}`\n        : card.kind === "injury_diagnosis" ? `injury:${semantic("severity", "minor")}:${semantic("label", "lesion")}`\n        : card.kind === "return" ? `return:${semantic("label", "lesion")}`\n        : card.kind;\n      ids.push(`dynamic:${dynamicKey}`);\n      const choiceId = renderDynamic(s, card).choices[0]?.id ?? "ok";\n'''
if old4 not in dg:
    raise SystemExit('diagnostic key block missing')
dg = dg.replace(old4,new4,1)
diag.write_text(dg)
