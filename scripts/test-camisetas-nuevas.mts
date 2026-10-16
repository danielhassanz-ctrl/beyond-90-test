/** Prueba sin red: presentación de la camiseta nueva (club y selección), camisetas de segunda equipación y escenas de piso. */
import { shouldTriggerClubKit, shouldTriggerNationalKit, buildClubKitEvent, buildNationalKitEvent, kitMaker } from "../src/lib/narrative/kit-presentation";
import { describeNationalKit } from "../src/lib/clubColors";
import { cleanImagePrompt, withSceneGuards } from "../src/lib/images/milestonePrompts";
import { isNationalTeamEvent } from "../src/lib/images/national-event";
import { pickBankScene } from "../src/lib/narrative/bank/select";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));

const mk = (o: any = {}): any => ({
  id: "p1", last_name: "Hassan", nickname: null, club: "Real Madrid", nation: "España", position: "Delantero", week: 63, media: 82, fama: 70, forma: 70, moral: 70, rel_entrenador: 55, rel_vestuario: 60,
  rel_aficion: 60, rel_representante: 50, patrimonio: 500000, status: "active", mode: "pro", agent_name: "Iñaki", flags: { club_since: "20" }, ...o,
});

console.log("1) Camiseta del club");
ok(shouldTriggerClubKit(mk(), () => 0), "en pretemporada, con nombre, toca");
ok(!shouldTriggerClubKit(mk({ week: 68 }), () => 0), "no fuera de pretemporada");
ok(!shouldTriggerClubKit(mk({ week: 3 }), () => 0), "no el primer año");
ok(!shouldTriggerClubKit(mk({ fama: 20, media: 60 }), () => 0), "un desconocido no presenta camisetas");
ok(!shouldTriggerClubKit(mk({ flags: { club_since: "20", kit_club_last: "5" } }), () => 0), "no dos temporadas seguidas (última: 5, ahora 6)");
ok(shouldTriggerClubKit(mk({ flags: { club_since: "20", kit_club_last: "4" } }), () => 0), "sí cada dos temporadas");
ok(!shouldTriggerClubKit(mk({ flags: { club_since: "20", loan_active: true } }), () => 0), "no cedido");
const ev = buildClubKitEvent(mk());
ok(!bad(ev) && ev.options.length === 3 && ev.isMilestone === true && ev.milestoneType === "camiseta_nueva", "evento limpio, hito con tipo propio (sin escena genérica que lo pise)");
ok(/white/i.test(ev.imageScene ?? "") && /teammates/.test(ev.imageScene ?? "") && !/Adidas|logo:/i.test(ev.imageScene ?? ""), "la foto lleva la camiseta blanca del Madrid y compañeros, sin marcas");
ok(/Adidas/.test(ev.description) && /Real Madrid/.test(ev.title), "la marca del Madrid es Adidas");
ok(ev.options.every((o) => o.consequences?.flags?.kit_club_last !== undefined || o.resolve), "cada opción deja marcada la temporada");
ok(ev.id.startsWith("kit-club-") && !isNationalTeamEvent(ev, "España"), "id propio del club: no usa camiseta de selección");

console.log("2) Camiseta de la selección");
const sel = (o: any = {}) => mk({ week: 80, flags: { club_since: "20", sel_debut_played: true }, ...o });
// Semana 80 = turno 10 de la temporada 7 (2033); 2034 no hay torneo de selecciones mayores... buscamos el verano anterior a uno.
let prev = -1;
for (let s = 1; s < 20; s++) if (shouldTriggerNationalKit(sel({ week: s * 10 + 9 }), () => 0)) { prev = s; break; }
ok(prev > 0, `toca el verano antes de un gran torneo (temporada ${prev})`);
const wk = prev * 10 + 9;
ok(!shouldTriggerNationalKit(sel({ week: wk, flags: { club_since: "20" } }), () => 0), "sin haber debutado con la selección, no");
ok(!shouldTriggerNationalKit(sel({ week: wk, flags: { club_since: "20", sel_debut_played: true, [`kit_sel_${prev}`]: true } }), () => 0), "una vez por verano");
ok(!shouldTriggerNationalKit(sel({ week: wk - 3 }), () => 0), "no en los primeros meses de la temporada");
const nev = buildNationalKitEvent(sel({ week: wk }));
ok(!bad(nev) && nev.id.startsWith("sel-kit-") && isNationalTeamEvent(nev, "España"), "evento limpio y con id de selección");
ok(/national team (home|away) kit/.test(nev.imageScene ?? ""), "la foto declara la camiseta de la selección");
ok(/Adidas/.test(nev.description) && /España/.test(nev.description), "la marca de España es Adidas");
ok(kitMaker("Equipo Desconocido") !== undefined && ["Nike", "Adidas", "Puma"].includes(kitMaker("Equipo Desconocido")), "club sin marca conocida: reparte entre tres");

console.log("3) La segunda de España no es la del Madrid");
const away = describeNationalKit("España", "away");
ok(/away kit/.test(away) && /crown|crest/.test(away) && /national team/.test(away), "la segunda de España es blanca pero con escudo de la federación y detalles rojos y amarillos");
ok(/home kit/.test(describeNationalKit("España")) && /red/.test(describeNationalKit("España")), "la primera sigue siendo roja");
const ws = withSceneGuards(nev.imageScene ?? "", { club: "Real Madrid", age: 24, nationalTeam: true, nation: "España" });
ok((ws.match(/national team (home|away) kit/g) ?? []).length === 1, "la guarda no repite la camiseta (no mezcla primera y segunda)");

console.log("4) «Away kit» no deja inventar camisetas");
const c = cleanImagePrompt("Player celebrating in the away kit in Munich, arms raised", {});
ok(!/away kit/i.test(c) && /club kit/.test(c), "«away kit» pasa a «club kit»: manda la camiseta del club");
ok(/national team away kit/.test(cleanImagePrompt("wearing the España national team away kit", {})), "pero la segunda de una selección se respeta");

console.log("5) Escenas de piso solo si vives en piso");
const flatIds = ["bank-cd-obra-vecino", "bank-cd-vecino-manual", "bank-cv-vecino", "bank-ex-vecino-amigo"];
const seen = (p: any) => {
  const ids = new Set<string>();
  for (let i = 0; i < 1500; i++) {
    const e = pickBankScene({ ...p, week: 40 + (i % 50), flags: { ...p.flags, club_since: "10" } }, []);
    if (e) ids.add(e.id);
  }
  return ids;
};
const withHouse = seen(mk({ patrimonio: 5_000_000, flags: { propiedad_1: JSON.stringify({ price: 900000, downPayment: 900000, kind: "casa", city: "Madrid" }) } }));
ok(flatIds.every((id) => !withHouse.has(id)), "con casa propia en la ciudad, no sale ninguna escena de vecinos");
const inFlat = seen(mk({ patrimonio: 50_000 }));
ok(inFlat.has("bank-cd-obra-vecino") || inFlat.has("bank-cv-vecino") || inFlat.has("bank-cd-vecino-manual"), "en un piso, sí salen");

if (fails) { console.log(`\n${fails} fallos`); process.exit(1); }
console.log("\nTodo bien");
