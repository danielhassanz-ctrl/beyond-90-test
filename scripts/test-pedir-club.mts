/** Prueba sin IA: pedir al club (salir, cesión, renovación, sueldo, minutos, brazalete) evalúa con datos reales, deja marcas y no se repite sin pausa. */
import { CLUB_REQUEST_KINDS, requestStatus, resolveClubRequest } from "../src/lib/narrative/club-requests";
import { inStabilityPeriod, shouldTriggerTransferOffer, getMarketWindow, buildTransferOfferEvent } from "../src/lib/narrative/market-window";
import { buildTorneoLifeEvent } from "../src/lib/narrative/torneo-life";
import { personalizeEvent, getNpcName, nationalSquadView } from "../src/lib/narrative/npcs";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const mk = (over: any = {}, flags: any = {}): any => ({
  id: "p-pedir", last_name: "Hassan", club: "Real Madrid", week: 66, media: 90, fama: 90, forma: 85, moral: 70, rel_entrenador: 60, rel_vestuario: 62, rel_aficion: 70, patrimonio: 900000,
  status: "active", position: "Delantero", nation: "España", agent_name: "Julia Rovira", flags: { club_since: "40", contract_until: "72", salary_club: "Real Madrid", salary_fixed: "8000000", ...flags }, ...over,
});
const bad = (r: any) => /undefined|NaN|\[object|\{[a-z_]+\}/.test(JSON.stringify(r));

console.log("1) Disponibilidad y pausas");
const p = mk();
ok(CLUB_REQUEST_KINDS.every((k) => requestStatus(p, k).available || requestStatus(p, k).reason), "cada petición dice si se puede y, si no, por qué");
ok(!requestStatus(mk({}, { ask_transferible: "64" }), "transferible").available, "no se puede repetir seguida (enfriamiento)");
ok(!requestStatus(p, "minutos").available, "un titular no pide más minutos");
ok(!requestStatus(mk({ club: "SELECCIÓN:España" }), "sueldo").available, "con la selección, el club espera");
ok(!requestStatus(mk({}, { contract_signed: "62" }), "renovacion").available, "acabas de firmar: no se renegocia");

console.log("2) Resultados completos y con marcas");
for (const k of CLUB_REQUEST_KINDS) {
  let sin = 0;
  for (let i = 0; i < 300; i++) {
    const r = resolveClubRequest(mk({ rel_entrenador: 20 + (i % 70), rel_vestuario: 30 + (i % 60), forma: 50 + (i % 50), media: 70 + (i % 25) }, { contract_until: String(60 + (i % 40)) }), k);
    if (bad(r) || !r.outcomeText || !r.title || !r.consequences.flags?.[`ask_${k}`]) sin++;
  }
  ok(sin === 0, `${k}: 300 casos sin textos rotos y con su marca de enfriamiento`);
}

console.log("3) Salir: a veces sí, a veces no, y dejarte fuera es excepcional");
let acepta = 0, banquillo = 0, niega = 0;
for (let i = 0; i < 1000; i++) {
  const r = resolveClubRequest(mk({ rel_entrenador: 55 }, { contract_until: "75" }), "transferible");
  if (r.ok) { acepta++; if (r.consequences.flags?.coach_bench) banquillo++; } else niega++;
}
ok(acepta > 100 && niega > 100, `salir: ${acepta} sí / ${niega} no de 1000 (no es automático)`);
ok(banquillo / Math.max(1, acepta) > 0.1 && banquillo / Math.max(1, acepta) < 0.4, `el míster te aparta solo en ${(100 * banquillo / acepta).toFixed(0)}% de las salidas aceptadas (excepcional)`);

console.log("4) Efecto real en el juego");
const salida = (() => { for (let i = 0; i < 500; i++) { const r = resolveClubRequest(mk({}, { contract_until: "68" }), "transferible"); if (r.ok) return r; } return null; })()!;
const recien = mk({}, { club_since: "63", club_moves: "63", ...salida.consequences.flags });
ok(inStabilityPeriod(mk({}, { club_since: "63", club_moves: "63" })) && !inStabilityPeriod(recien), "tras pedir salir, la estabilidad ya no bloquea las ofertas");
let semana = 61; while (!getMarketWindow(semana)) semana++;
const conInteres = mk({ week: semana }, { club_since: "40", transfer_interest: "Sevilla FC", transfer_interest_week: String(semana - 1), transfer_interest_source: "listado", listed_until: String(semana + 20) });
let ofertas = 0;
for (let i = 0; i < 100; i++) if (shouldTriggerTransferOffer(conInteres)) ofertas++;
ok(ofertas > 60, `con la salida pedida llegan ofertas en el mercado (${ofertas}/100)`);
const cedido = mk({ week: semana, rel_entrenador: 30, media: 60 }, { club_since: "40", transfer_interest: "Getafe CF", transfer_interest_week: String(semana - 1), transfer_interest_source: "cesion", listed_until: String(semana + 20) });
let prestamos = 0;
for (let i = 0; i < 50; i++) { const e = buildTransferOfferEvent({ ...cedido, flags: { ...cedido.flags } }); if (/oferta-cesion/.test(e.id)) prestamos++; }
ok(prestamos === 50, `una cesión pedida es siempre una oferta de préstamo (${prestamos}/50)`);
const renov = (() => { for (let i = 0; i < 500; i++) { const r = resolveClubRequest(mk({}, { contract_until: "72" }), "renovacion"); if (r.ok) return r; } return null; })()!;
ok(Boolean(renov.consequences.flags?.contract_until) && Number(renov.consequences.flags?.salary_fixed) > 8000000 && (renov.consequences.patrimonio ?? 0) > 0, "renovar: nuevo sueldo, vencimiento y prima");
const braz = (() => { for (let i = 0; i < 800; i++) { const r = resolveClubRequest(mk({ rel_vestuario: 85 }), "brazalete"); if (r.ok) return r; } return null; })()!;
ok(braz.consequences.flags?.capitan_club === true, "el brazalete te hace capitán");

console.log("5) Un solo nombre para el capitán de la selección");
const pl = mk({ week: 61 });
let desc = ""; 
for (let i = 0; i < 400 && !/brazalete/.test(desc); i++) { const e = buildTorneoLifeEvent(pl as any, { type: "eurocopa", stage: 1, lifeCount: 1 } as any); if (/brazalete/.test(e.title)) desc = personalizeEvent(e as any, pl).description; }
const capitan = getNpcName(nationalSquadView(pl), "capitan");
ok(desc.includes(capitan) && (desc.match(new RegExp(capitan, "g")) ?? []).length === 1, `el capitán sale una sola vez: ${capitan}`);
ok(!/[A-ZÁÉÍÓÚ][a-záéíóúñ]+ [A-ZÁÉÍÓÚ][a-záéíóúñ]+, el capitán [A-ZÁÉÍÓÚ]/.test(desc), "ya no sale «Fulano, el capitán Mengano»");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
