/** Prueba sin red: el Legado unificado (el camino son 13 logros de la misma lista, sin metas duplicadas). */
import { ACHIEVEMENTS, PATH_ORDER, pathAchievements, optionalAchievements, newAchievements, unlockedIds } from "../src/lib/narrative/achievements";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };

const mk = (o: any = {}): any => ({
  id: "p1", last_name: "Hassan", nickname: null, club: "Real Betis", nation: "España", position: "Delantero", week: 20, media: 55, fama: 20, forma: 70, moral: 70,
  patrimonio: 5000, status: "active", agent_name: null, stats_matches_played: 0, stats_goals: 0, stats_titles: 0, flags: {}, ...o,
});

console.log("1) El camino");
const path = pathAchievements();
ok(path.length === 13, "trece pasos");
ok(path.map((a) => PATH_ORDER[a.id]).join() === Array.from({ length: 13 }, (_, i) => i + 1).join(), "en orden 1 a 13");
ok(new Set(ACHIEVEMENTS.map((a) => a.id)).size === ACHIEVEMENTS.length, "ids únicos");
ok(new Set(ACHIEVEMENTS.map((a) => a.name)).size === ACHIEVEMENTS.length, "nombres únicos: ninguna meta aparece dos veces con otro nombre");
ok(optionalAchievements().length + path.length === ACHIEVEMENTS.length && optionalAchievements().every((a) => !PATH_ORDER[a.id]), "los opcionales son el resto, sin solaparse");
ok(path.every((a) => a.tier === "bronce" || a.id === "primer-titulo" || a.id === "balon-oro" || a.tier === "plata" || a.tier === "oro"), "todos con nivel");

console.log("2) Se desbloquean solos");
const fresh = newAchievements(mk()).map((a) => a.id);
ok(fresh.includes("primer-paso") && !fresh.includes("debut") && !fresh.includes("representante"), "un recién llegado: solo el primer paso");
const mid = newAchievements(mk({ agent_name: "Iñaki Zubiaurre", stats_matches_played: 5, stats_goals: 1, media: 72, flags: { sel_debut_played: true, capitan_equipo: true }, stats_titles: 1 })).map((a) => a.id);
for (const id of ["representante", "debut", "primer-gol", "media-70", "convocado", "capitan", "primer-titulo"]) ok(mid.includes(id), `se cumple «${id}»`);
ok(!mid.includes("media-85") && !mid.includes("fin-camino") && !mid.includes("segunda-vida"), "los de más adelante, no");
ok(!newAchievements(mk({ agent_name: "Sin representante aún" })).some((a) => a.id === "representante"), "«Sin representante» no cuenta");
const end = newAchievements(mk({ status: "retired", second_career: "entrenador", media: 90, flags: { title_balon_oro: true, award_won_pichichi_3: "x" } })).map((a) => a.id);
ok(end.includes("fin-camino") && end.includes("segunda-vida") && end.includes("balon-oro") && end.includes("distinguido") && end.includes("media-85"), "al final: retiro, segunda vida, Balón de Oro, premio individual y media 85");
ok(unlockedIds(mk({ flags: { logros: "debut,id-que-no-existe,primer-gol" } })).join() === "debut,primer-gol", "un id antiguo no cuenta");

if (fails) { console.log(`\n${fails} fallos`); process.exit(1); }
console.log("\nTodo bien");
