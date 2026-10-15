/** Prueba sin red: la saga (dinastía) — quién puede seguirla, qué hereda el hijo y cómo arranca su historia. */
import { canContinueDynasty, dynastyChildren, newGenerationPlayer, readSaga, sagaEntryOf, describeLegacy, dynastyGeneration, INHERITANCE } from "../src/lib/narrative/dynasty";
import { buildDynastyIntroEvent } from "../src/lib/narrative/dynasty-intro";
import { getNpcName } from "../src/lib/narrative/npcs";
import { NO_CLUB_YET, POSITIONS } from "../src/lib/constants";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));

const kids = JSON.stringify([{ n: "Lucas", w: 300 }, { n: "Sofía", w: 330, f: true }]);
const father = (o: any = {}): any => ({
  id: "p1", user_id: "u1", last_name: "Hassan", nickname: "3 patas", number: 9, foot: "Derecho", nation: "España", position: "Delantero", personality: "Trabajador, Rebelde",
  club: "Real Madrid", week: 480, media: 94, fama: 96, patrimonio: 20_000_000, status: "retired", mode: "pro", stats_goals: 312, stats_titles: 14, stats_matches_played: 700,
  flags: { hijos_info: kids, hijos_n: "2", pareja: "Nerea Solano", title_balon_oro: true, img_paid_credits: "7", img_free_used: "5", free_tier_eligible: "yes" }, ...o,
});

console.log("1) Quién puede seguir la saga");
ok(canContinueDynasty(father()), "retirado y con un hijo");
ok(canContinueDynasty(father({ status: "second_life" })) && canContinueDynasty(father({ status: "awaiting_second_life" })), "también en su segunda vida");
ok(!canContinueDynasty(father({ status: "active" })), "no en activo");
ok(!canContinueDynasty(father({ flags: {} })), "sin hijos no hay saga");
ok(!canContinueDynasty(father({ flags: { hijos_info: JSON.stringify([{ n: "Sofía", w: 330, f: true }]) } })), "solo con hijas no (el juego tiene carreras masculinas)");
ok(dynastyChildren(father().flags).map((c) => c.n).join() === "Lucas", "los hijos que pueden seguirla: solo Lucas");

console.log("2) Lo que hereda el hijo");
const child = dynastyChildren(father().flags)[0];
const { row, flags, carry } = newGenerationPlayer(father(), child, { position: "Centrocampista", photoUrl: "https://x/f.jpg" });
ok(row.last_name === "Hassan" && row.nickname === "Lucas" && row.number === 9 && row.nation === "España", "mismo apellido, se le conoce por su nombre, mismo dorsal y selección");
ok(row.club === NO_CLUB_YET && row.position === "Centrocampista" && row.photo_url === "https://x/f.jpg" && row.mode === "pro", "empieza sin club, con la demarcación y la foto elegidas");
ok(row.patrimonio === Math.round((20_000_000 * INHERITANCE) / 1000) * 1000, `hereda el ${Math.round(INHERITANCE * 100)} % del patrimonio (${(row.patrimonio as number).toLocaleString("es")} €)`);
ok((row.fama as number) >= 25 && (row.fama as number) <= 40, `entra con fama de hijo de leyenda (${row.fama})`);
ok(String(row.personality).split(",").length === 2 && /Trabajador|Rebelde/.test(String(row.personality)), `hereda un rasgo de su padre: ${row.personality}`);
ok(["Derecho", "Izquierdo"].includes(row.foot as string), "pie válido");
ok((POSITIONS as readonly string[]).includes(newGenerationPlayer(father(), child, { position: "Entrenador" }).row.position as string), "una demarcación inválida se corrige");

console.log("3) La saga queda escrita");
ok(dynastyGeneration(flags) === 1 && flags.padre_nombre === "3 patas Hassan" && flags.madre_nombre === "Nerea Solano", "segunda generación, con su padre y su madre de verdad");
const saga = readSaga(flags);
ok(saga.length === 1 && saga[0].n === "3 patas" && saga[0].bo === true && saga[0].titles >= 14 && saga[0].goals === 312, "el eslabón del padre guarda su Balón de Oro, títulos y goles");
ok(/Balón de Oro/.test(describeLegacy(saga[0])) && /14 títulos/.test(describeLegacy(saga[0])), `se describe: ${describeLegacy(saga[0])}`);
const gen2 = { ...father({ nickname: "Lucas", flags: { ...flags, hijos_info: kids } }) };
const next = newGenerationPlayer(gen2, child, { position: "Delantero" });
ok(dynastyGeneration(next.flags) === 2 && readSaga(next.flags).length === 2, "una tercera generación añade otro eslabón");
let big: any = father();
for (let i = 0; i < 9; i++) big = father({ flags: { ...newGenerationPlayer(big, child, { position: "Delantero" }).flags, hijos_info: kids } });
ok(readSaga(newGenerationPlayer(big, child, { position: "Delantero" }).flags).length <= 6, "la saga guarda como mucho los últimos 6 eslabones");

console.log("4) Los créditos de fotos son de la cuenta");
ok(carry.img_paid_credits === "7" && carry.img_free_used === "5" && carry.free_tier_eligible === "yes", "se copian aparte (la base de datos no deja crearlos a un jugador)");
ok(!("img_paid_credits" in flags), "y no van en las banderas del insert, que la base de datos las borraría");

console.log("5) Sus padres en el juego");
const childPlayer: any = { ...row, id: "c1", week: 1, flags };
ok(getNpcName(childPlayer, "padre") === "3 patas Hassan" && getNpcName(childPlayer, "madre") === "Nerea Solano", "tu padre y tu madre son los de verdad");
ok(getNpcName({ ...childPlayer, flags: {} }, "padre") !== "3 patas Hassan", "sin saga, los padres son los de siempre");

console.log("6) La primera escena");
const intro = buildDynastyIntroEvent(childPlayer);
ok(!bad(intro) && intro.options.length === 3 && /3 patas Hassan/.test(intro.description) && /Nerea Solano/.test(intro.description), "habla de su padre y de su madre por su nombre");
ok(intro.isMilestone === true && !!intro.imageScene, "es un hito compartible (el arranque de la carrera)");
ok(intro.options.every((o) => o.consequences.flags?.dinastia_intro === true), "queda marcada para no repetirse");
const entry = sagaEntryOf(father());
ok(entry.titles >= 14 && entry.bo && entry.seasons === 47, `eslabón: ${describeLegacy(entry)} · ${entry.seasons} temporadas`);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
