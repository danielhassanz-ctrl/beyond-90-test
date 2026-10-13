/** Prueba sin IA: tras fichar hay 2-3 temporadas sin ofertas formales, los rumores siguen y no llega una oferta en cada mercado. */
import { inStabilityPeriod, stabilityTurns, shouldTriggerTransferOffer, maybeSeedTransferInterest, shouldTriggerMarketRumor, getMarketWindow } from "../src/lib/narrative/market-window";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
const mk = (week: number, flags: any = {}): any => ({ id: "p-est", last_name: "Hassan", club: "Liverpool FC", week, media: 90, fama: 90, status: "active", position: "Delantero", nation: "España", flags: { ...flags } });

ok(stabilityTurns(mk(60, { club_moves: "55" })) === 20, "un cambio reciente: 20 turnos (2 temporadas)");
ok(stabilityTurns(mk(60, { club_moves: "30,45,55" })) === 30, "tres cambios en cinco años: 30 turnos (3 temporadas)");
ok(inStabilityPeriod(mk(60, { club_since: "55", club_moves: "55" })) && !inStabilityPeriod(mk(80, { club_since: "55", club_moves: "55" })), "dentro del periodo no hay ofertas; pasado, sí");

// Con interés abierto y mercado abierto, en estabilidad nunca llega la oferta
let week = 61; while (!getMarketWindow(week)) week++;
const f = { club_since: String(week - 3), club_moves: String(week - 3), transfer_interest: "Real Madrid", transfer_interest_week: String(week - 1) };
let offers = 0;
for (let i = 0; i < 200; i++) if (shouldTriggerTransferOffer(mk(week, f))) offers++;
ok(offers === 0, "recién fichado: 0 ofertas en 200 intentos");
const g = { ...f, club_since: "1", club_moves: "1" };
let offers2 = 0;
for (let i = 0; i < 200; i++) if (shouldTriggerTransferOffer(mk(week, g))) offers2++;
ok(offers2 > 100, `pasado el periodo, la oferta llega (${offers2}/200)`);

// No hay oferta en cada ventana: con una oferta reciente, el interés no se siembra
let seeded = 0;
for (let i = 0; i < 300; i++) {
  const p = mk(week, { club_since: "1", offer_last_week: String(week - 6), [`market_${Math.floor((week - 1) / 10)}_${getMarketWindow(week)}`]: true });
  maybeSeedTransferInterest(p);
  if (p.flags.transfer_interest) seeded++;
}
ok(seeded === 0, "con una oferta de hace 6 turnos, no se siembra otra");

// Rumores fuera de ventana
let out = 0; let w2 = 3; while (getMarketWindow(w2)) w2++;
for (let i = 0; i < 400; i++) if (shouldTriggerMarketRumor(mk(w2 + 40, { rumor_last_week: "1" }))) out++;
ok(out > 40 && out < 250, `también hay rumores fuera de ventana (${out}/400)`);

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
