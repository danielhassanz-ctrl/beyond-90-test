/** Prueba sin IA: volver a un club en el que ya jugaste se recuerda, y la presentación no repite el nombre del míster. */
import { buildArrivalIntroEvent } from "../src/lib/narrative/arrival-intro";
import { isReturningTo, pastStint, exClubMembers, readExTies } from "../src/lib/narrative/ex-clubs";
import { personalizeEvent } from "../src/lib/narrative/npcs";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

const flags: any = {
  clubs_history: "Real Madrid|Bayern de Múnich|Liverpool FC",
  club_since: "56",
  club_s0: "Real Madrid", club_s1: "Real Madrid", club_s2: "Real Madrid", club_s3: "Real Madrid",
  trofeos: JSON.stringify([{ k: "liga", s: 3, c: "Real Madrid" }, { k: "champions", s: 3, c: "Real Madrid" }]),
  ex_ties: JSON.stringify([{ c: "Real Madrid", w: 41, re: 82, rv: 76 }, { c: "Bayern de Múnich", w: 52, re: 30, rv: 40 }]),
};
const player: any = { id: "p-vuelta", last_name: "Hassan", club: "Real Madrid", week: 57, media: 92, status: "active", position: "Delantero", nation: "España", rel_entrenador: 50, rel_vestuario: 50, flags };

ok(isReturningTo(player), "detecta que vuelves a un club anterior");
const st = pastStint(player);
ok(st.seasons === 4 && st.titles.length === 2 && st.tie?.re === 82, `etapa anterior: ${st.seasons} temporadas, ${st.titles.length} títulos, relación con el míster ${st.tie?.re}`);

const ev = buildArrivalIntroEvent(player);
ok(/^llegada-vuelta-/.test(ev.id) && /qué hay de nuevo, viejo/i.test(ev.description), "es la escena de vuelta, con el «qué hay de nuevo, viejo»");
ok(/4 temporadas/.test(ev.description) && /Champions|Liga/.test(ev.description), "recuerda tus temporadas y tus títulos allí");
const personal = personalizeEvent(ev as any, player);
const names = ev.description.match(/[A-ZÁÉÍÓÚ][a-záéíóúñ]+ [A-ZÁÉÍÓÚ][a-záéíóúñ]+/g) ?? [];
ok(!/(\b[A-Z][\wáéíóúñ]+ [A-Z][\wáéíóúñ]+), el entrenador \1/.test(personal.description), "el nombre del míster no se repite pegado al cargo");
void names;

const first = buildArrivalIntroEvent({ ...player, club: "Girona FC", flags: { ...flags, clubs_history: "Real Madrid" } });
ok(/^llegada-presentacion-/.test(first.id), "un club nuevo sigue con la presentación de siempre");
const personalNew = personalizeEvent(first as any, { ...player, club: "Girona FC", flags: { ...flags, clubs_history: "Real Madrid" } });
ok(!/el entrenador [A-Z]/.test(personalNew.description), "la presentación de club nuevo tampoco repite el nombre");

const members = exClubMembers({ ...player, club: "Liverpool FC" });
ok(members.length >= 4 && members.some((m) => /Real Madrid/.test(m.label) && m.value === 82), `Vida enseña a la gente de clubes anteriores: ${members.map((m) => m.label).join(", ")}`);
ok(readExTies(flags).length === 2, "lee el registro de cómo te despediste");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
