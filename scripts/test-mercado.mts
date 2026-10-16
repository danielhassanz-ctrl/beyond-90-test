/** Prueba sin red: el mercado explorable (estado, clubes que se pueden tantear, sondeos y su conexión con la oferta de siempre). */
import { marketStatus, exploreClubs, probeClub, probeProbability, MAX_PROBES_PER_WINDOW, aClub } from "../src/lib/narrative/market-explorer";
import { shouldTriggerTransferOffer } from "../src/lib/narrative/market-window";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const bad = (e: unknown) => /undefined|NaN|\[object|null/.test(JSON.stringify(e));

// Semana 62 = turno 2 de la temporada 6 (agosto: ventana de verano abierta).
const mk = (o: any = {}): any => ({
  id: "p1", last_name: "Hassan", nickname: null, club: "Real Betis", nation: "España", position: "Delantero", week: 62, media: 80, fama: 70, forma: 70, moral: 70, rel_entrenador: 55,
  patrimonio: 500000, status: "active", mode: "pro", agent_name: "Iñaki", flags: { club_since: "20", club_changes: "1" }, ...o,
});

console.log("1) Estado del mercado");
const s = marketStatus(mk());
ok(s.window === "verano" && s.windowTurnsLeft === 1 && s.blocked === null, "en agosto, la ventana de verano está abierta y se puede sondear");
ok(marketStatus(mk({ week: 65 })).window === null && /cerrado/i.test(marketStatus(mk({ week: 65 })).blocked ?? ""), "en octubre el mercado está cerrado");
ok(marketStatus(mk({ week: 67 })).window === "enero", "en enero, la ventana de invierno");
ok(/incorporarte/.test(marketStatus(mk({ flags: { club_since: "58" } })).blocked ?? ""), "recién fichado, nadie paga por ti todavía");
ok(/Lesionado/.test(marketStatus(mk({ flags: { club_since: "20", injury_duration_x: "3" } })).blocked ?? ""), "lesionado, no se puede");
ok(/cedido/.test(marketStatus(mk({ flags: { club_since: "20", loan_active: true } })).blocked ?? ""), "cedido, no se puede");
ok(s.valueM > 0 && s.clauseM > s.valueM * 0.5 && s.contractLeft >= 6, `valor ${s.valueM} M€, cláusula ${s.clauseM} M€, contrato ${s.contractLeft} turnos`);
ok(marketStatus(mk({ flags: { club_since: "20", transfer_interest: "Sevilla FC", transfer_interest_source: "prensa", transfer_interest_week: "61" } })).interest?.club === "Sevilla FC", "enseña el interés actual");

console.log("2) Los clubes que se pueden tantear");
const clubs = exploreClubs(mk());
ok(clubs.length >= 6 && clubs.length <= 9, `${clubs.length} clubes`);
ok(clubs.every((c) => c.club !== "Real Betis" && c.city !== "Sevilla" && !bad({ ...c, partnerLine: "" })), "ninguno es tu club ni de tu ciudad, y los textos salen limpios");
ok(new Set(clubs.map((c) => c.direction)).size >= 2, `hay clubes de distinto nivel: ${[...new Set(clubs.map((c) => c.direction))].join(", ")}`);
ok(clubs.every((c) => c.probability >= 0.08 && c.probability <= 0.9 && ["Alta", "Media", "Baja"].includes(c.band)), "probabilidad entre 8 y 90 %, con su etiqueta");
ok(clubs.every((c) => /brutos al año/.test(c.annualText) && /traspaso/.test(c.feeText) && c.roleLabel), "cada club dice sueldo, traspaso y papel esperado");
ok(exploreClubs(mk({ flags: { club_since: "20", pareja: "Nerea Solano", pareja_rel_de: "Nerea Solano" } })).every((c) => c.partnerLine && /Nerea/.test(c.partnerLine)), "con pareja, dice qué opina de cada ciudad");
ok(exploreClubs(mk({ club: "NO_CLUB" })).length >= 0, "sin club no rompe");

console.log("2b) Probabilidad: más nivel, más opciones");
const top = probeProbability(mk({ media: 90 }), "Atlético de Madrid"), low = probeProbability(mk({ media: 60 }), "Atlético de Madrid");
ok(top > low, `con media 90 hay más opciones en un grande (${Math.round(top * 100)} %) que con 60 (${Math.round(low * 100)} %)`);
ok(probeProbability(mk({ media: 55, fama: 30 }), "Real Madrid") <= 0.1, "un jugador de 55 no tiene opciones reales en el Real Madrid");

console.log("3) El sondeo");
let okN = 0, koN = 0, badN = 0;
const target = clubs[0].club;
for (let i = 0; i < 400; i++) {
  const r = probeClub(mk({ id: `p${i}` }), target, () => (i % 100) / 100);
  if ("error" in r) { badN++; continue; }
  if (r.ok) { okN++; if (r.flags.transfer_interest !== target || r.flags.transfer_interest_source !== "listado" || bad(r)) badN++; } else { koN++; if (r.flags.transfer_interest || bad(r)) badN++; }
  if (!r.flags.probe_last_week) badN++;
}
ok(badN === 0 && okN > 20 && koN > 20, `sale bien (${okN}) o mal (${koN}); si sale bien abre el flujo de oferta («listado»)`);
const good = probeClub(mk(), target, () => 0) as any;
const after = mk({ flags: { club_since: "20", ...good.flags } });
ok(after.flags.transfer_interest === target && shouldTriggerTransferOffer({ ...after, week: 62 } as any) !== undefined, "tras un sondeo exitoso queda el interés del club (la oferta llega con el flujo de siempre)");
ok(marketStatus(after).blocked !== null && /gestión en marcha/.test(marketStatus(after).blocked ?? ""), "mientras tu representante gestiona, no se puede sondear otro");

console.log("4) Límites");
let p2 = mk();
let used = 0;
for (let i = 0; i < 4; i++) {
  const st = marketStatus(p2);
  if (st.blocked) break;
  const r = probeClub(p2, target, () => 0.99) as any;
  if ("error" in r) break;
  used++;
  p2 = { ...p2, week: p2.week, flags: { ...p2.flags, ...r.flags, probe_last_week: "0" } };
}
ok(used === MAX_PROBES_PER_WINDOW, `como mucho ${MAX_PROBES_PER_WINDOW} sondeos por ventana (${used})`);
const sameWeek = mk({ flags: { club_since: "20", probe_last_week: "62" } });
ok(/ya has movido ficha/i.test(marketStatus(sameWeek).blocked ?? ""), "uno por turno");
ok("error" in (probeClub(mk({ week: 65 }), target) as any), "con el mercado cerrado, el sondeo devuelve error");
ok("error" in (probeClub(mk(), "Club Inventado") as any), "un club que no está en la lista, error");

console.log("5) Los textos");
ok(aClub("Getafe CF") === "al Getafe CF" && aClub("Real Sociedad") === "a la Real Sociedad" && aClub("Las Palmas") === "a Las Palmas", "«al Getafe», «a la Real Sociedad», «a Las Palmas»");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
