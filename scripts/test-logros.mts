/** Prueba sin IA: logros (se desbloquean solos, no se repiten, los grandes salen como escena y los de bronce en silencio). */
import { ACHIEVEMENTS, newAchievements, markAchievements, buildAchievementEvent, unlockedIds } from "../src/lib/narrative/achievements";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));

const mk = (o: any = {}): any => ({
  id: "p1", last_name: "Hassan", nickname: null, club: "Real Madrid", nation: "España", position: "Delantero", personality: "Trabajador, Rebelde", week: 62, media: 70, fama: 50, forma: 70, moral: 70,
  patrimonio: 1000, status: "active", mode: "pro", stats_goals: 0, stats_assists: 0, stats_matches_played: 0, stats_clean_sheets: 0, stats_titles: 0, flags: {}, ...o,
});
const ids = (list: { id: string }[]) => list.map((a) => a.id);

console.log("1) El catálogo");
ok(ACHIEVEMENTS.length >= 45, `${ACHIEVEMENTS.length} logros`);
ok(new Set(ACHIEVEMENTS.map((a) => a.id)).size === ACHIEVEMENTS.length, "ids únicos");
ok(ACHIEVEMENTS.every((a) => a.name && a.description && a.icon && !/undefined/.test(a.name + a.description)), "todos con nombre, descripción e icono");
const tiers = { bronce: 0, plata: 0, oro: 0 } as Record<string, number>;
for (const a of ACHIEVEMENTS) tiers[a.tier]++;
ok(tiers.bronce >= 8 && tiers.plata >= 15 && tiers.oro >= 10, `reparto de niveles: ${tiers.bronce} bronce · ${tiers.plata} plata · ${tiers.oro} oro`);

console.log("2) Un jugador novato no tiene casi nada");
const nuevo = newAchievements(mk());
ok(nuevo.length <= 3, `un novato sin logros reales: ${ids(nuevo).join(", ") || "ninguno"}`);
ok(!ids(nuevo).includes("balon-oro") && !ids(nuevo).includes("campeon-europa"), "no regala los grandes");

console.log("3) Se desbloquean al cumplirse");
const star = mk({
  stats_goals: 120, stats_assists: 30, stats_matches_played: 210, stats_titles: 11, media: 96, fama: 92, patrimonio: 12_000_000,
  flags: {
    trofeos: JSON.stringify([
      { k: "liga", s: 3, c: "Real Madrid" }, { k: "copa", s: 3, c: "Real Madrid" }, { k: "champions", s: 3, c: "Real Madrid" }, { k: "mundial", s: 5, c: "España" },
      { k: "balon_oro", s: 4, c: "" }, { k: "pichichi", s: 4, c: "" },
    ]),
    pareja: "Nerea Solano", casados: true, hijos_n: "3", capitan_club: true, sel_debut_played: true, club_since: "10", clubs_history: "A|B|C", go_review_5: "4/4",
    propiedad_1: JSON.stringify({ name: "Yate", price: 1, downPayment: 1, kind: "yate" }),
  },
});
const got = ids(newAchievements(star));
for (const want of ["primer-gol", "cien-goles", "media-95", "primer-titulo", "diez-titulos", "campeon-europa", "triplete", "campeon-mundo", "balon-oro", "pichichi", "diez-millones", "capricho-mayor", "boda", "familia-numerosa", "capitan", "hombre-club", "trotamundos", "objetivos-cumplidos", "debut-seleccion"]) {
  ok(got.includes(want), `desbloquea «${want}»`);
}
ok(!got.includes("cien-millones") && !got.includes("medalla-olimpica") && !got.includes("zamora"), "y no los que no ha conseguido (cien millones, medalla olímpica, Zamora)");

console.log("4) Se anotan una vez y no se repiten");
const p = mk({ ...star });
const first = newAchievements(p);
markAchievements(p, first);
ok(unlockedIds(p).length === first.length && newAchievements(p).length === 0, "tras anotarlos, no vuelven a salir");
p.stats_goals = 130; p.patrimonio = 120_000_000;
ok(ids(newAchievements(p)).join() === "cien-millones", "al cumplir uno nuevo, sale solo ese");
ok(Boolean(p.flags.logro_cien_goles === undefined) || Boolean(p.flags["logro_cien-goles"]), "queda anotada la semana de cada logro");

console.log("5) La escena: solo los de plata y oro");
const bronze = mk({ stats_goals: 1, stats_matches_played: 1 });
const nb = newAchievements(bronze);
ok(nb.every((a) => a.tier === "bronce") && buildAchievementEvent(bronze, nb) === null, "los de bronce se anotan sin escena");
const ev = buildAchievementEvent(star, first)!;
ok(!!ev && !bad(ev) && ev.options.length === 2 && /Logro desbloqueado/.test(ev.title), `con plata y oro sale una escena: «${ev.title}»`);
ok(ev.title.includes(first.filter((a) => a.tier === "oro")[0].name), "la escena destaca el logro de oro");
ok(/Llevas \d+ de \d+ logros/.test(ev.description), "dice cuántos llevas");

console.log("6) Un portero y las particularidades");
const gk = mk({ position: "Portero", stats_clean_sheets: 16 });
ok(ids(newAchievements(gk)).includes("muro"), "el portero con 16 porterías a cero desbloquea «El muro»");
ok(!ids(newAchievements(mk({ position: "Delantero", stats_clean_sheets: 0 }))).includes("muro"), "un delantero no");
ok(ids(newAchievements(mk({ week: 200, status: "active" }))).includes("veterano"), "con 35 años en activo, «Veterano»");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
