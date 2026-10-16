/** Prueba sin red: todos los clubes del juego tienen camiseta descrita con palabras (sin hexadecimales) y no hay dos idénticas. */
import { LEAGUES } from "../src/lib/calendar/leagues";
import { describeKit } from "../src/lib/clubColors";
import { colorName } from "../src/lib/clubKits";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };

const clubs = new Set<string>();
for (const l of Object.values(LEAGUES)) for (const k of Object.keys(l as any)) { const v = (l as any)[k]; if (Array.isArray(v)) for (const x of v) if (typeof x === "string") clubs.add(x); }

console.log("1) Todos los clubes");
const hex = [...clubs].filter((c) => /#[0-9a-f]{3,6}/i.test(describeKit(c)));
ok(hex.length === 0, `ningún club lleva hexadecimales en su camiseta${hex.length ? ": " + hex.slice(0, 6).join(", ") : ""}`);
const custom = [...clubs].filter((c) => /^a .* jersey with .* trim|plain .* jersey/.test(describeKit(c)));
ok(custom.length === 0, `todos tienen descripción hecha a mano (sin la genérica por colores)${custom.length ? ": " + custom.slice(0, 8).join(", ") : ""}`);

console.log("2) Distintas entre sí");
const seen = new Map<string, string>();
const dup: string[] = [];
for (const c of clubs) {
  const d = describeKit(c).split(" (the jersey")[0];
  if (seen.has(d)) dup.push(`${seen.get(d)} = ${c}`);
  else seen.set(d, c);
}
ok(dup.length === 0, `no hay dos camisetas idénticas${dup.length ? ": " + dup.join("; ") : ""}`);

console.log("3) Casos especiales");
ok(/no club crest/.test(describeKit("Agente libre")) && !/#/.test(describeKit("Agente libre")), "sin club: ropa neutra, sin escudo ni colores inventados");
ok(colorName("#003DA5") === "royal blue" && colorName("#FFFFFF") === "white" && colorName("#C8102E") === "red", "los colores se dicen con palabras");

if (fails) { console.log(`\n${fails} fallos`); process.exit(1); }
console.log("\nTodo bien");
