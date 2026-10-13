/** Prueba sin IA: la foto de fichaje varía (apretón de manos con el presidente, camiseta con tu nombre...) y nunca pide dos camisetas. */
import { getMilestoneImagePrompt, cleanImagePrompt } from "../src/lib/images/milestonePrompts";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const seen = new Set<string>();
for (let i = 0; i < 80; i++) {
  const p = getMilestoneImagePrompt("fork-fichaje-grande", 21, "Real Madrid", "Hassan", "contrato", "su representante");
  if (p) seen.add(cleanImagePrompt(p));
}
const all = [...seen];
ok(all.length >= 4, `${all.length} variantes de foto de fichaje`);
ok(all.some((p) => /shaking hands with the elderly club president/.test(p)), "hay una con el apretón de manos al presidente");
ok(all.some((p) => /surname "Hassan"/.test(p)), "la camiseta de presentación lleva el apellido");
ok(!all.some((p) => /over (his )?shoulders/.test(p.replace(/no second shirt[^)]*\)/g, ""))), "ninguna pide la camiseta sobre los hombros");
ok(!all.some((p) => /Getty/i.test(p)), "ninguna nombra a Getty");
ok(all.every((p) => /watermark/i.test(p)), "todas piden sin marca de agua");
console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
