import fs from 'node:fs';

const path = 'src/game/director.ts';
let src = fs.readFileSync(path, 'utf8');

const helperAnchor = 'function callback(s: GameState, id: string, text: string, inScenes = 8): void {';
const helper = `function deterministicChance(s: GameState, key: string, probability: number): boolean {\n  const roll = (hash(careerSeed(s), \`${'${key}'}|${'${s.seasonIndex}'}|${'${s.sceneCount ?? 0}'}|${'${s.beat ?? 0}'}\`) % 10000) / 10000;\n  return roll < Math.max(0, Math.min(1, probability));\n}\n\n`;
if (!src.includes('function deterministicChance(')) {
  if (!src.includes(helperAnchor)) throw new Error('deterministicChance anchor missing');
  src = src.replace(helperAnchor, helper + helperAnchor);
}

const replacements = [
  [
    'const win = Math.random() < 0.5 + (c.s.overall - 60) / 100;',
    'const win = deterministicChance(c.s, `arc_puesto_duelo|${c.rival}`, 0.5 + (c.s.overall - 60) / 100);',
  ],
  [
    'const ok = Math.random() < 0.32 + (c.s.overall - 60) / 120;',
    'const ok = deterministicChance(c.s, "arc_primera_debut_arriesgar", 0.32 + (c.s.overall - 60) / 120);',
  ],
  [
    'const fired = Math.random() < 0.4;',
    'const fired = deterministicChance(c.s, "arc_conflicto_desenlace_entrenador", 0.4);',
  ],
  [
    'const bad = Math.random() < 0.22;',
    'const bad = deterministicChance(c.s, "arc_lesion_primer_duelo_recaida", 0.22);',
  ],
  [
    'const ok = Math.random() < 0.45;',
    'const ok = deterministicChance(c.s, "arc_dinero_negocio_segunda_inyeccion", 0.45);',
  ],
  [
    'if (d.profile === "lesiones" && Math.random() < 0.3) flag(s, "riesgo_recaida", 1);',
    'if (d.profile === "lesiones" && deterministicChance(s, `profile_lesiones|${s.seasonIndex}`, 0.3)) flag(s, "riesgo_recaida", 1);',
  ],
];

for (const [before, after] of replacements) {
  if (src.includes(before)) src = src.replace(before, after);
  else if (!src.includes(after)) throw new Error(`Expected director fragment missing: ${before}`);
}

if (src.includes('Math.random()')) {
  const lines = src.split('\n').map((line, i) => [i + 1, line]).filter(([, line]) => line.includes('Math.random()'));
  throw new Error(`Unseeded Story Director randomness remains: ${JSON.stringify(lines)}`);
}

fs.writeFileSync(path, src);
console.log('Story Director randomness is fully career-seeded.');
