/**
 * Seguimiento de las propiedades (casas, coches, yates, jets). Antes una compra valía siempre lo que costó y nunca
 * volvía a aparecer. Ahora, cada ~2 temporadas, tu representante te dice lo que vale hoy (las casas se revalorizan,
 * los vehículos pierden valor) y decides: mantenerla, venderla (cobras el valor menos los gastos y lo que aún
 * debes al banco) o reformarla (una casa gana valor para siempre, pero cuesta dinero ahora).
 */
import type { EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { propertyValue, readProperties, remainingLoan, serializeProperty, type PropertyRecord } from "@/lib/finance/mortgage";

/** Turnos entre la compra (o la revisión anterior) y la siguiente revisión. Una temporada = 10 turnos. */
export const PROPERTY_REVIEW_EVERY = 20;
const GLOBAL_COOLDOWN = 3;
/** Gastos de la venta (agencia, impuestos, traspaso) sobre el valor. */
const SELL_COST = 0.05;

const slugOf = (key: string) => key.replace(/^propiedad_/, "");
const eur = (n: number) => Math.round(n).toLocaleString("es") + " €";
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;

export function dueProperty(player: Player): PropertyRecord | null {
  const flags = player.flags ?? {};
  const week = player.week;
  if (flags.proprev_last !== undefined && week - num(flags.proprev_last) < GLOBAL_COOLDOWN) return null;
  let best: { p: PropertyRecord; waited: number } | null = null;
  for (const p of readProperties(flags)) {
    const waited = week - Math.max(p.since ?? week, num(flags[`proprev_${slugOf(p.key)}`]));
    if (waited >= PROPERTY_REVIEW_EVERY && (!best || waited > best.waited)) best = { p, waited };
  }
  return best?.p ?? null;
}

export function shouldTriggerPropertyReview(player: Player): boolean {
  return dueProperty(player) !== null;
}

export function buildPropertyReviewEvent(player: Player): GameEvent {
  const p = dueProperty(player) as PropertyRecord;
  const week = player.week;
  const slug = slugOf(p.key);
  const isVehicle = p.kind === "coche" || p.kind === "moto" || p.kind === "yate" || p.kind === "jet";
  const value = propertyValue(p, week);
  const diff = value - p.price;
  const debt = remainingLoan(p, week);
  const proceeds = Math.round(value * (1 - SELL_COST)) - debt; // lo que queda tras gastos y deuda
  const agent = player.agent_name && player.agent_name !== "sin representante" ? player.agent_name : "Tu representante";
  const marked = { [`proprev_${slug}`]: String(week), proprev_last: String(week) };
  const money = player.patrimonio ?? 0;
  const noun = p.kind === "coche" ? "el coche" : p.kind === "moto" ? "la moto" : p.kind === "yate" ? "el yate" : p.kind === "jet" ? "el jet" : "la casa";

  const intro = isVehicle
    ? `${agent} te manda la tasación de ${p.name}. «Lo compraste por ${eur(p.price)} y hoy vale ${eur(value)}: ${eur(-diff)} menos. Es lo que tienen estos caprichos: en cuanto salen del concesionario, pierden valor cada año». ${debt > 0 ? `Todavía debes ${eur(debt)} al banco.` : "Ya lo tienes pagado."}`
    : diff >= 0
      ? `${agent} te pasa la tasación de ${p.name}: «La compraste por ${eur(p.price)} y hoy vale ${eur(value)}. Son ${eur(diff)} de revalorización, solo por esperar». ${debt > 0 ? `Todavía debes ${eur(debt)} al banco.` : "Ya la tienes pagada."}`
      : `${agent} te pasa la tasación de ${p.name}: hoy vale ${eur(value)}. ${debt > 0 ? `Todavía debes ${eur(debt)} al banco.` : "Ya la tienes pagada."}`;

  const keep: EventOption = {
    id: "a",
    label: "Quedártela",
    subtitle: isVehicle ? "Seguir disfrutándolo" : "Dejar que siga subiendo",
    consequences: { moral: 1, flags: { ...marked } },
    outcomeText: isVehicle
      ? `Decides conservarlo. ${agent} se encoge de hombros con una media sonrisa: «Hay cosas que no se compran por lo que valen, sino por lo que se disfrutan».`
      : `Decides quedártela. ${agent} anota la fecha para volver a mirarla dentro de un par de temporadas: «El ladrillo no corre, pero tampoco se pierde».`,
  };

  const options: EventOption[] = [keep];

  if (proceeds >= 0 || money + proceeds >= 0) {
    options.push({
      id: "b",
      label: proceeds >= 0 ? `Venderla y quedarte ${eur(proceeds)}` : `Venderla (pones ${eur(-proceeds)} de tu bolsillo)`,
      subtitle: `Valor ${eur(value)} − gastos − deuda`,
      consequences: {
        patrimonio: proceeds,
        moral: diff >= 0 ? 2 : -2,
        rel_representante: 1,
        flags: { [p.key]: "", ...marked },
      },
      outcomeText:
        proceeds >= 0
          ? `Firmas la venta de ${p.name}. Descontados los gastos y la deuda, ${eur(proceeds)} llegan a tu cuenta. Entregas las llaves con un gesto raro: ${diff >= 0 ? "orgullo y nostalgia a partes iguales" : "alivio, aunque no del todo"}.`
          : `Firmas la venta de ${p.name}, y como aún debías más de lo que sacas, tienes que poner ${eur(-proceeds)} de tu cuenta para cerrar la deuda. Duele, pero te quitas el problema.`,
    });
  }

  if (!isVehicle) {
    const cost = Math.round((value * 0.06) / 1000) * 1000;
    if (cost >= 1000 && money >= cost * 1.5) {
      options.push({
        id: "c",
        label: `Reformarla — ${eur(cost)}`,
        subtitle: "Gana valor para siempre (~8 %)",
        consequences: {
          patrimonio: -cost,
          rel_representante: 1,
          flags: { ...marked, [p.key]: serializeProperty({ ...p, valueAdj: (p.valueAdj ?? 1) * 1.08 }) },
        },
        outcomeText: `Contratas la reforma: cocina nueva, suelos, pintura. Tres semanas de obra y polvo en todo, pero al terminar ${noun} parece otra. La nueva tasación sube cerca de un 8 %. ${agent} lo apunta en su cuaderno: «Esto sí es dinero bien gastado».`,
      });
    }
  }

  return {
    id: `prop-review-${slug}-${week}`,
    category: "representante",
    title: isVehicle ? `${p.name}: lo que vale hoy` : diff >= 0 ? `${p.name}: se ha revalorizado` : `${p.name}: la tasación`,
    description: intro,
    options,
    priority: true,
  };
}
