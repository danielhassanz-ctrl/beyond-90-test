from pathlib import Path
p = Path('src/game/director.ts')
s = p.read_text()
old = '''  const contextualBeats = BEATS.filter((b) => !seen(s, b.id) && !familyBlocked(s, b.family) && statusOk(s, b.family) && b.requires(s));\n  const laneBeats = contextualBeats.filter((b) => ["rareza", "posicion", "origen"].includes(b.family) || hash(careerSeed(s), `beat-lane|${d.profile}|${b.id}`) % 100 < 55);\n'''
new = '''  const earlyCareer = s.age <= 19 && s.seasonIndex <= 2;\n  const contextualBeats = BEATS.filter((b) => {\n    if (seen(s, b.id) || familyBlocked(s, b.family) || !statusOk(s, b.family) || !b.requires(s)) return false;\n    if (!earlyCareer) return true;\n    // Durante los primeros años cada carrera recibe un catálogo secundario\n    // diferente. Las escenas creadas específicamente para su semilla y su\n    // posición siempre pueden entrar; el resto se reparte por carriles.\n    if (b.id.startsWith("beat_early_") || b.family === "posicion") return true;\n    return hash(careerSeed(s), `early-catalog|${d.profile}|${b.id}`) % 100 < 42;\n  });\n  const laneBeats = contextualBeats.filter((b) =>\n    b.id.startsWith("beat_early_") || b.family === "posicion" ||\n    hash(careerSeed(s), `beat-lane|${d.profile}|${b.id}`) % 100 < (earlyCareer ? 46 : 55)\n  );\n'''
if old not in s:
    raise SystemExit('selector target not found')
if 'early-catalog|' in s:
    raise SystemExit('patch already applied')
s = s.replace(old, new, 1)
p.write_text(s)
