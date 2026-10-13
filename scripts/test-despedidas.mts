/** Prueba sin IA: las despedidas dependen de lo que ha pasado y no se repiten de un traspaso a otro. */
import { buildFarewell } from "../src/lib/narrative/farewell";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const base: any = { id: "p-farewell", last_name: "Hassan", club: "Bayern de Múnich", week: 80, rel_vestuario: 70, rel_aficion: 55, flags: { club_since: "60", club_changes: "1" } };

const seq = [1, 2, 3, 4].map((n) => buildFarewell({ ...base, flags: { ...base.flags, club_changes: String(n) } }));
ok(new Set(seq).size === seq.length, "cuatro traspasos seguidos: cuatro despedidas distintas");
ok(!seq.some((t) => /abrazos sinceros.*mirada fría/.test(t)), "ya no sale la frase de siempre");

const calido = buildFarewell({ ...base, rel_vestuario: 80 });
const frio = buildFarewell({ ...base, rel_vestuario: 10 });
ok(calido !== frio, "con el vestuario a favor o en contra la despedida cambia");

const capitan = buildFarewell({ ...base, flags: { ...base.flags, capitan_club: true } });
ok(/brazalete|capitán/i.test(capitan), "si eras el capitán, lo recoge");
const campeon = buildFarewell({ ...base, flags: { ...base.flags, trofeos: JSON.stringify([{ k: "liga", s: 5, c: "Bayern de Múnich" }]) } });
ok(/trofe|copa|título|vitrina/i.test(campeon), "si ganaste títulos allí, lo recoge");
const corto = buildFarewell({ ...base, flags: { ...base.flags, club_since: "76" } });
ok(/poco tiempo|de paso|maleta/i.test(corto), "una estancia corta se nota");
for (const t of [calido, frio, capitan, campeon, corto]) if (/undefined|NaN|\[object/.test(t)) fails++;
console.log("   · " + calido + "\n   · " + frio);
console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
