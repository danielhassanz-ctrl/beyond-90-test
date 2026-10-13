/** Prueba sin IA: el Balón de Oro dice por qué está cada finalista y las fichas de los rivales no repiten la misma frase. */
import { buildAwardEvent } from "../src/lib/narrative/awards";
import { buildRegistry } from "../src/lib/narrative/cast";
import { getRivals } from "../src/lib/narrative/rivals";
import { championsPodium } from "../src/lib/narrative/world-results";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

const flags: any = { trofeos: JSON.stringify([{ k: "champions", s: 4, c: "Bayern de Múnich" }, { k: "liga", s: 4, c: "Bayern de Múnich" }]), clubs_history: "Real Betis|Bayern de Múnich" };
const player: any = { id: "p-test-1", last_name: "Hassan", club: "Liverpool FC", week: 56, media: 91, fama: 95, moral: 80, forma: 90, position: "Delantero", nation: "España", status: "active", flags };

console.log("1) Balón de Oro: motivos y Champions");
const ev = buildAwardEvent(player, "balon_oro");
const lines = ev.description.split("\n").filter((l) => l.startsWith("• "));
ok(lines.length === 10 && lines.every((l) => / — /.test(l)), `10 finalistas, cada uno con su motivo`);
const podium = championsPodium(player, 4);
ok(podium.byPlayer && /la ganaste tú con el Bayern de Múnich/.test(ev.description), "dice quién ganó la Champions y que fuiste tú");
const mine = lines.find((l) => /\(tú\)/.test(l))!;
ok(/campeón de/.test(mine), `tu línea recoge tus títulos: ${mine}`);
ok(lines.filter((l) => /campeón de Europa/.test(l)).every((l) => l.includes("Bayern") || l.includes("a tu lado")), "solo los del campeón de Europa llevan «campeón de Europa»");
const sin = buildAwardEvent({ ...player, flags: { clubs_history: "Real Betis" } }, "balon_oro");
ok(/fue para el /.test(sin.description) && /perdió la final/.test(sin.description), "si no la ganas tú, dice quién la ganó y quién perdió la final");

console.log("2) Fichas de los rivales");
const registry = buildRegistry(player);
const rivalCards = registry.filter((e) => /Rival de tu generación|Compañero de tu edad/.test(e.role));
const blurbs = rivalCards.map((e) => e.blurb);
ok(rivalCards.length === getRivals(player).length, `${rivalCards.length} fichas de rivales`);
ok(new Set(blurbs).size === blurbs.length, "ninguna ficha de rival repite la misma frase");
ok(!blurbs.some((b) => /todo el mundo te compara, para bien y para mal/.test(b)), "ya no sale la frase repetida de siempre");
const finales = blurbs.map((b) => b.split(". ").slice(-1)[0]);
ok(new Set(finales.slice(2)).size === 3, "las tres fichas de megacracks no acaban con la misma frase de comparación");
blurbs.forEach((b) => console.log("     · " + b));

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
