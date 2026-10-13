/** Prueba sin IA: al fichar por otro club, la primera escena es la presentación del míster, el capitán y el cuerpo técnico, con sus fichas. */
import { shouldTriggerArrivalIntro, buildArrivalIntroEvent } from "../src/lib/narrative/arrival-intro";
import { introduceCast } from "../src/lib/narrative/cast";
import { getNpcName } from "../src/lib/narrative/npcs";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const mk = (o: any = {}, flags: any = {}): any => ({
  id: "t", last_name: "Hassan", club: "Liverpool FC", week: 100, media: 82, fama: 80, forma: 75, moral: 70, status: "active", mode: "pro", nation: "España",
  flags: { club_since: "100", clubs_history: "Real Betis|Bayern de Múnich", ...flags }, ...o,
});

console.log("1) Cuándo sale");
ok(shouldTriggerArrivalIntro(mk()), "recién fichado: sí");
ok(shouldTriggerArrivalIntro(mk({ week: 103 })), "3 turnos después todavía vale");
ok(!shouldTriggerArrivalIntro(mk({ week: 104 })), "4 turnos después ya no");
ok(!shouldTriggerArrivalIntro(mk({}, { clubs_history: "" })), "en tu primer club no (tiene su propio arranque)");
ok(!shouldTriggerArrivalIntro(mk({}, { arrival_intro: "100" })), "si ya la viviste para este fichaje, no repite");
ok(shouldTriggerArrivalIntro(mk({ week: 160 }, { club_since: "160", arrival_intro: "100" })), "en un fichaje posterior vuelve a salir");
ok(!shouldTriggerArrivalIntro(mk({ club: "SELECCIÓN:España" })), "no en la selección");

console.log("2) La escena");
const p = mk();
const ev: any = buildArrivalIntroEvent(p);
const mister = getNpcName(p, "entrenador"), capitan = getNpcName(p, "capitan"), prep = getNpcName(p, "preparador");
ok(!/undefined|NaN|\[object|\{[a-z_]+\}/.test(JSON.stringify(ev)), `texto limpio · "${ev.title}"`);
ok([mister, capitan, prep].every((n) => ev.description.includes(n)), `salen el míster (${mister}), el capitán (${capitan}) y el preparador (${prep})`);
const cards = introduceCast(ev, p);
const roles = cards.map((c) => c.role).join(" · ");
ok(cards.length >= 3 && /Entrenador/.test(roles) && /Capit/.test(roles) && /Preparador/.test(roles), `fichas de los tres: ${roles}`);
ok(ev.options.length === 4 && ev.priority === true, "cuatro formas de presentarte y es prioritaria");
const next = mk(); for (const o of [ev.options[0]]) for (const [k, v] of Object.entries(o.consequences.flags ?? {})) next.flags[k] = v;
ok(!shouldTriggerArrivalIntro(next), "al resolverla no vuelve a salir");
const other = mk({ club: "Real Madrid" });
ok(getNpcName(other, "entrenador") !== mister, "con otro club el míster es otro (los personajes son del club)");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
