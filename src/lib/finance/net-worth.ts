import type { Player } from "@/types/player";
import { readInvestments, investmentValue } from "@/lib/finance/investments";
import { readProperties, propertyValue, remainingLoan } from "@/lib/finance/mortgage";

/** Lo que tienes en total: dinero + propiedades + inversiones − lo que aún debes al banco (la misma cuenta que Patrimonio). */
export function netWorth(player: Pick<Player, "patrimonio" | "flags" | "week">): number {
  const props = readProperties(player.flags);
  const propertyTotal = props.reduce((n, p) => n + propertyValue(p, player.week), 0);
  const investmentTotal = readInvestments(player.flags).reduce((n, i) => n + investmentValue(i, player.week), 0);
  const debt = props.reduce((n, p) => n + remainingLoan(p, player.week), 0);
  return Math.round((player.patrimonio ?? 0) + propertyTotal + investmentTotal - debt);
}
