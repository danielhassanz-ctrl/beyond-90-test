/** Prueba sin IA: la relación con tu pareja sube y baja, ella opina de las mudanzas y la historia con una chica no se pierde. */
import { stepPartner, partnerRel, cityStance, moveReaction, addPartnerOpinion, PARTNER_START_REL } from "../src/lib/narrative/partner";
import { BANK_SCENES } from "../src/lib/narrative/bank/scenes";
import { eligibleBankScenes } from "../src/lib/narrative/bank/select";
import { CHICAS } from "../src/lib/narrative/bank/scenes/chicas";
import { bankFlagKey } from "../src/lib/narrative/bank/types";
import { chicaEnCurso } from "../src/lib/narrative/chicas-roster";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

console.log("1) La relación empieza en 70 y se mueve con las decisiones");
let flags: any = {};
let s = stepPartner(flags, { club: "Liverpool FC", week: 40, eventId: "bank-ro-marta-formal", moral: 9, optionFlags: { pareja: "Marta Vidal" } });
flags = { ...flags, pareja: "Marta Vidal", ...s.flags };
ok(partnerRel(flags) === PARTNER_START_REL, `pareja nueva: ${partnerRel(flags)}`);
s = stepPartner(flags, { club: "Liverpool FC", week: 41, eventId: "bank-p4-frio", moral: 3, optionFlags: { pareja_delta: "14" } });
flags = { ...flags, ...s.flags };
ok(partnerRel(flags) === 84 && flags.pareja_delta === "", `con tiempo juntos sube: ${partnerRel(flags)}`);
s = stepPartner(flags, { club: "Liverpool FC", week: 60, eventId: "bank-otra", moral: 0 });
flags = { ...flags, ...s.flags };
ok(partnerRel(flags) === 82, "si pasan muchos turnos sin dedicarle nada, se enfría un poco (−2)");

console.log("2) Se enfría y se va");
let f2: any = { pareja: "Marta Vidal", pareja_rel: "31", pareja_rel_de: "Marta Vidal", pareja_last_week: "50" };
s = stepPartner(f2, { club: "Liverpool FC", week: 51, eventId: "bank-p4-frio", moral: -3, optionFlags: { pareja_delta: "-8" } });
f2 = { ...f2, ...s.flags };
ok(f2.pareja_baja === true && partnerRel(f2) === 23, `relación ${partnerRel(f2)}: pareja_baja activada`);
s = stepPartner(f2, { club: "Liverpool FC", week: 52, eventId: "bank-p4-frio", optionFlags: { pareja_delta: "-15" } });
f2 = { ...f2, ...s.flags };
ok(f2.pareja_rota_ya === true, "por debajo de 10 se activa la ruptura");
const rota = BANK_SCENES.find((x) => x.id === "bank-p4-se-va")!;
const pl: any = { id: "p", last_name: "Hassan", club: "Liverpool FC", week: 53, media: 85, fama: 80, moral: 50, forma: 80, patrimonio: 90000, status: "active", position: "Delantero", nation: "España", flags: f2 };
ok(eligibleBankScenes(pl, []).some((c) => c.scene.id === rota.id), "la escena de la ruptura sale elegible");
s = stepPartner(f2, { club: "Liverpool FC", week: 53, eventId: rota.id, optionFlags: { pareja: "", ex_pareja: true } });
ok(s.flags.pareja_rel === "" && s.flags.pareja_baja === false, "tras cortar se limpia la relación");

console.log("3) Ella opina de las mudanzas");
const clubs = ["Real Madrid", "FC Barcelona", "Bayern de Múnich", "Liverpool FC", "Juventus", "París Saint-Germain", "Atlético de Madrid", "Valencia CF"];
const stances = new Set(clubs.map((c) => cityStance("Marta Vidal", c)));
ok(stances.size >= 2, `no todas las ciudades le dan igual: ${[...stances].join(", ")}`);
const reacts = clubs.flatMap((a) => clubs.map((b) => moveReaction("Marta Vidal", a, b))).filter(Boolean);
ok(reacts.some((r) => r!.delta <= -9) && reacts.some((r) => r!.delta >= 5), "según el destino, la relación baja o sube");
const ev: any = { id: "oferta-x", category: "vida", title: "Oferta", description: "Hay oferta.", options: [{ id: "a", label: "Firmar", subtitle: "", consequences: { club: "Real Madrid" } }, { id: "b", label: "Seguir", subtitle: "", consequences: {} }] };
const withOp = addPartnerOpinion(ev, { club: "Liverpool FC", flags: { pareja: "Marta Vidal" } });
ok(/Marta/.test(withOp.description) && withOp.description.startsWith("Hay oferta."), `el texto recoge su opinión: «${withOp.description.split("\n\n")[1]}»`);
ok(addPartnerOpinion(ev, { club: "Liverpool FC", flags: {} }).description === "Hay oferta.", "sin pareja, el texto no cambia");

console.log("4) La historia con una chica no se pierde");
const cena = CHICAS.find((x) => x.id === "bank-ch-nerea-cena")!;
const fl: any = { ch_en_curso: "nerea", ch_nerea: "dm", [bankFlagKey("bank-ch-nerea-dm")]: "a:100" };
const base: any = { id: "p", last_name: "Hassan", club: "Liverpool FC", media: 85, fama: 80, moral: 50, forma: 80, patrimonio: 90000, status: "active", position: "Delantero", nation: "España", flags: fl };
for (const gap of [2, 12, 30]) {
  const pp = { ...base, week: 100 + gap, flags: { ...fl } };
  ok(eligibleBankScenes(pp, [], [cena]).length === 1, `la cita sigue disponible ${gap} turnos después del mensaje`);
}
const c = chicaEnCurso({ ch_en_curso: "nerea", ch_nerea: "cena" });
ok(!!c && c.name === "Nerea Solano" && /cita/.test(c.estado), `Vida enseña con quién tienes una historia: ${c?.name} — ${c?.estado}`);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
