/** Prueba sin red: puntos pendientes de la auditoría (plaza europea por la Liga, temas repetidos, extranjero por nacionalidad, ciudades, rupturas…). */
import { euroSpotFor } from "../src/lib/calendar/euro-spot";
import { buildMatchCalendar, getEuropeanCompetitionFor } from "../src/lib/calendar/match-calendar";
import { expandThemeUsed } from "../src/lib/narrative/theme-groups";
import { playsAbroad, clubCountry } from "../src/lib/narrative/bank/select";
import { cityOfClub } from "../src/lib/narrative/cities";
import { LEAGUES } from "../src/lib/calendar/leagues";
import { canonicalNation } from "../src/lib/nations";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };

console.log("1) La plaza europea sale de la Liga del año anterior");
ok(euroSpotFor({ liga_pos_4: "2|80" }, 5) === "champions" && euroSpotFor({ liga_pos_4: "5|60" }, 5) === "europa" && euroSpotFor({ liga_pos_4: "12|44" }, 5) === "none", "2º → Champions, 5º → Europa League, 12º → nada");
ok(euroSpotFor({}, 5) === null && euroSpotFor({ liga_pos_4: "1|90" }, 0) === null, "sin dato (o primera temporada): la plaza habitual");
ok(euroSpotFor({ liga_pos_4: "1|90", club_s4: "Cádiz CF" }, 5, "Real Madrid") === null && euroSpotFor({ liga_pos_4: "1|90", club_s4: "Real Madrid" }, 5, "Real Madrid") === "champions", "la plaza es del club con el que acabaste, no del que fichas");
ok(getEuropeanCompetitionFor("Real Betis")?.competition === "europa" && getEuropeanCompetitionFor("Real Betis", "champions")?.competition === "champions" && getEuropeanCompetitionFor("Real Madrid", "none") === null, "el Betis puede jugar Champions y un Madrid hundido no juega Europa");
const withCl = buildMatchCalendar("Cádiz CF", 5, { euroSpot: "champions" } as any);
const without = buildMatchCalendar("Real Madrid", 5, { euroSpot: "none" } as any);
ok(withCl.some((m) => m.competition === "champions") && !without.some((m) => m.competition === "champions" || m.competition === "europa"), "el calendario del campeón con el Cádiz lleva Champions; el del Madrid hundido, nada europeo");

console.log("2) Tres partidos clave por mes: la Liga sigue en las semanas 8 y 9");
const full = buildMatchCalendar("Real Madrid", 7, { copa: { round: 5, alive: true }, euro: { round: 4, alive: true } } as any);
const per = (w: number) => full.filter((m) => m.week === 70 + w).map((m) => m.competition);
ok(per(8).includes("liga") && per(9).includes("liga") && per(8).length === 3, `semana 8: ${per(8).join(", ")}`);

console.log("3) Temas repetidos entre bolsas");
const used = expandThemeUsed(["bank-pr-documental", "prensa-tuit-antiguo-52"]);
ok(used.includes("fama-documental") && used.includes("bank-c3-documental") && used.includes("bank-rd-tuit-viejo") && !used.includes("fama-podcast-estrella"), "vivido el documental o el tuit antiguo, no vuelven con otro título (y no se mezcla con otros temas)");

console.log("4) Extranjero según tu nacionalidad");
const pl = (club: string, nation: string) => ({ club, nation });
ok(!playsAbroad(pl("Arsenal", "Inglaterra")) && playsAbroad(pl("Arsenal", "España")) && playsAbroad(pl("Real Madrid", "Argentina")) && !playsAbroad(pl("Real Madrid", "españa")), "un inglés en el Arsenal no es extranjero; un argentino en el Madrid, sí");
ok(clubCountry("Benfica") === "Portugal" && canonicalNation("Holanda") === "Países Bajos", "país del club y nacionalidad normalizada");

console.log("5) Ciudades");
const clubs = new Set<string>();
for (const l of Object.values(LEAGUES)) for (const k of Object.keys(l as any)) { const v = (l as any)[k]; if (Array.isArray(v)) for (const x of v) if (typeof x === "string") clubs.add(x); }
const noCity = [...clubs].filter((c) => cityOfClub(c) === c && !/^(Atalanta|Bolonia|Cagliari|Monza|Parma|Pisa|Como|Spezia|Palermo|Empoli|Cesena|Catanzaro|Sassuolo|Cittadella|Bergerac|Concarneau|Mainz|Brighton|Southampton|Leeds|Leicester|Wrexham|Stockport|Plymouth|Preston|Lincoln|Bristol|Almería|Las Palmas|Santander|Eibar|Valladolid)/.test(c));
ok(noCity.length <= 5, `casi todos los clubes tienen su ciudad (sin ciudad: ${noCity.length}${noCity.length ? " → " + noCity.slice(0, 6).join(", ") : ""})`);
ok(cityOfClub("Wolverhampton Wanderers") === "Wolverhampton" && cityOfClub("Cádiz CF") === "Cádiz" && cityOfClub("Real Madrid") === "Madrid", "«Wolverhampton Wanderers» ya no sale como ciudad");

if (fails) { console.log(`\n${fails} fallos`); process.exit(1); }
console.log("\nTodo bien");
