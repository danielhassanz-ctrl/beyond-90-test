from pathlib import Path

q = Path('src/qa/run.ts')
s = q.read_text()
old_import = 'import { eventById } from "@/game/events";\n'
new_import = 'import { eventById } from "@/game/events";\nimport { renderDynamic } from "@/game/dynamic";\n'
if old_import not in s:
    raise SystemExit('run import target missing')
s = s.replace(old_import, new_import, 1)
old = '        s = resolveDynamicCard(s, card, "ok");\n'
new = '        const choiceId = renderDynamic(s, card).choices[0]?.id ?? "ok";\n        s = resolveDynamicCard(s, card, choiceId);\n'
if old not in s:
    raise SystemExit('run dynamic resolver target missing')
s = s.replace(old, new, 1)
q.write_text(s)

d = Path('scripts/experience-diagnostic.ts')
ds = d.read_text()
old_import2 = 'import { eventById } from "../src/game/events";\n'
new_import2 = 'import { eventById } from "../src/game/events";\nimport { renderDynamic } from "../src/game/dynamic";\n'
if old_import2 not in ds:
    raise SystemExit('diagnostic import target missing')
ds = ds.replace(old_import2, new_import2, 1)
old2 = '      s = resolveDynamicCard(s, card, "ok");\n'
new2 = '      const choiceId = renderDynamic(s, card).choices[0]?.id ?? "ok";\n      s = resolveDynamicCard(s, card, choiceId);\n'
if old2 not in ds:
    raise SystemExit('diagnostic resolver target missing')
ds = ds.replace(old2, new2, 1)
d.write_text(ds)
