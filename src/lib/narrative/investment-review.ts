/**
 * Seguimiento de las inversiones: una inversión no es solo un número en Patrimonio. A los ~10 turnos (una temporada)
 * de haberla hecho, y otra vez cada ~10 turnos, tu representante te llama con lo que vale HOY, lo que has ganado o
 * perdido, y tú decides: mantenerla, venderla o meter más. Vender cobra el valor real y borra el activo; meter más lo
 * reinvierte; aguantar una inversión en pérdidas es una tirada que puede salir bien o rematar la caída.
 *
 * Es un evento dinámico (no del banco) porque cada inversión tiene su nombre, importe y rentabilidad propios.
 */
import type { EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { investmentValue, readInvestments, type InvestmentRecord } from "@/lib/finance/investments";

/** Turnos entre una inversión (o la revisión anterior) y la siguiente revisión. Una temporada = 10 turnos. */
export const INVESTMENT_REVIEW_EVERY = 10;
/** Mínimo de turnos entre dos revisiones, aunque haya varias inversiones vencidas. */
const GLOBAL_COOLDOWN = 3;

const slugOf = (key: string) => key.replace(/^inversion_/, "");
const eur = (n: number) => Math.round(n).toLocaleString("es") + " €";
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;

/** La inversión que ya toca revisar (la más atrasada), o null. */
export function dueInvestment(player: Player): InvestmentRecord | null {
  const flags = player.flags ?? {};
  const week = player.week;
  if (week - num(flags.invrev_last) < GLOBAL_COOLDOWN && flags.invrev_last !== undefined) return null;
  let best: { inv: InvestmentRecord; waited: number } | null = null;
  for (const inv of readInvestments(flags)) {
    const since = inv.since ?? week;
    const lastReview = num(flags[`invrev_${slugOf(inv.key)}`]);
    const waited = week - Math.max(since, lastReview);
    if (waited >= INVESTMENT_REVIEW_EVERY && (!best || waited > best.waited)) best = { inv, waited };
  }
  return best?.inv ?? null;
}

export function shouldTriggerInvestmentReview(player: Player): boolean {
  return dueInvestment(player) !== null;
}

/** El mismo activo con otro importe, rentabilidad y fecha de inicio (para reinvertir o cambiar su rumbo). */
function rewritten(inv: InvestmentRecord, week: number, amount: number, annualRate: number, name?: string): string {
  return JSON.stringify({
    name: name ?? inv.name,
    detail: inv.detail,
    amount: Math.round(amount),
    annualRate,
    since: week,
  });
}

export function buildInvestmentReviewEvent(player: Player): GameEvent {
  const inv = dueInvestment(player) as InvestmentRecord;
  const week = player.week;
  const slug = slugOf(inv.key);
  const value = investmentValue(inv, week);
  const gain = value - inv.amount;
  const ratio = inv.amount > 0 ? gain / inv.amount : 0;
  const mood: "good" | "flat" | "bad" = ratio >= 0.12 ? "good" : ratio <= -0.08 ? "bad" : "flat";
  const agent = player.agent_name && player.agent_name !== "sin representante" ? player.agent_name : "Tu asesor";
  const cleanName = inv.name.replace(/\s*\(en pérdidas\)\s*$/i, "");

  const marked = { [`invrev_${slug}`]: String(week), invrev_last: String(week) };
  const money = Math.max(0, player.patrimonio ?? 0);
  // Cuánto más podrías meter: la mitad de lo que vale, sin pasar del 40 % de tu dinero en cuenta.
  const extra = Math.floor(Math.min(value * 0.5, money * 0.4) / 5000) * 5000;
  const canAddMore = extra >= 5000;

  const intro =
    mood === "good"
      ? `${agent} te llama con una voz que ya anticipa la buena noticia. «Lo de ${cleanName}: pusiste ${eur(inv.amount)} y hoy vale ${eur(value)}. Son ${eur(gain)} de beneficio». Hay que decidir si te quedas con la ganancia o dejas que siga corriendo.`
      : mood === "bad"
        ? `${agent} te cita con la carpeta bajo el brazo y esa calma que se pone cuando las noticias no son buenas. «Lo de ${cleanName}: pusiste ${eur(inv.amount)} y hoy vale ${eur(value)}. Vas ${eur(-gain)} por debajo». Toca decidir si aguantas, cortas la pérdida o te la juegas a más.`
        : `${agent} te pone al día de ${cleanName}: pusiste ${eur(inv.amount)} y hoy vale ${eur(value)} (${gain >= 0 ? "+" : "-"}${eur(Math.abs(gain))}). «No es para tirar cohetes, pero tampoco para preocuparse. ¿Qué hacemos?».`;

  const keep: EventOption = {
    id: "a",
    label: "Mantenerla",
    subtitle: mood === "good" ? "Dejar que siga creciendo" : mood === "bad" ? "Esperar a ver" : "Sin tocar nada",
    consequences: { rel_representante: 1, flags: { ...marked } },
    outcomeText:
      mood === "good"
        ? `Dices que sigues. ${agent} apunta algo en su cuaderno: «Dentro de una temporada lo volvemos a mirar». Duermes más tranquilo sabiendo que el dinero trabaja.`
        : mood === "bad"
          ? `Dices que esperas. ${agent} asiente sin mucho entusiasmo: «Es tu dinero. Lo volvemos a mirar dentro de una temporada».`
          : `Dices que se queda como está. «Perfecto, no hay prisa», responde. Lo volveréis a ver dentro de una temporada.`,
  };

  const sell: EventOption = {
    id: "b",
    label: `Venderla y cobrar ${eur(value)}`,
    subtitle: mood === "good" ? "Asegurar el beneficio" : mood === "bad" ? "Cortar la pérdida" : "Liquidar",
    consequences: {
      patrimonio: value,
      moral: mood === "good" ? 2 : mood === "bad" ? -2 : 0,
      rel_representante: mood === "bad" ? -1 : 1,
      flags: { [inv.key]: "", ...marked },
    },
    outcomeText:
      mood === "good"
        ? `Firmas la venta. Esa misma tarde el dinero está en tu cuenta, con ${eur(gain)} de más que cuando empezaste. ${agent} sonríe: «Quien vende en verde no se arrepiente de pronto».`
        : mood === "bad"
          ? `Firmas la venta con un nudo en el estómago. Recuperas ${eur(value)}, ${eur(-gain)} menos de lo que pusiste. «Cortar una pérdida también es ganar», dice ${agent}, aunque no te lo crees del todo.`
          : `Firmas la venta. Recuperas ${eur(value)}, el dinero vuelve a tu cuenta y ${cleanName} desaparece de tu patrimonio.`,
  };

  const options: EventOption[] = [keep, sell];

  if (mood === "bad") {
    options.push({
      id: "c",
      label: "Aguantar: tiene que remontar",
      subtitle: "Puede recuperarse o hundirse más",
      consequences: {},
      resolve: {
        baseChance: 0.42,
        statModifier: "reputacion",
        success: {
          text: `Aguantas, y el mercado te da la razón: ${cleanName} empieza a remontar. ${agent} te escribe un solo mensaje: «Qué paciencia». No es una victoria todavía, pero la tendencia ha cambiado.`,
          consequences: { moral: 3, rel_representante: 2, flags: { ...marked, [inv.key]: rewritten(inv, week, value, 0.12, cleanName) } },
        },
        fail: {
          text: `Aguantas, y la caída continúa. ${cleanName} sigue perdiendo valor y ${agent} no sabe qué decirte. Tendrás que volver a decidir dentro de una temporada.`,
          consequences: { moral: -3, rel_representante: -1, flags: { ...marked, [inv.key]: rewritten(inv, week, value, -0.2, cleanName + " (en pérdidas)") } },
        },
      },
    });
    if (canAddMore) {
      options.push({
        id: "d",
        label: `Meter ${eur(extra)} más para promediar`,
        subtitle: "Apuesta doble: si remonta, ganas más",
        consequences: {},
        resolve: {
          baseChance: 0.38,
          success: {
            text: `Metes ${eur(extra)} más y el valor repunta al poco. ${agent} se frota las manos: «Esto se llama tener estómago». Tu posición ahora es mayor y va a mejor.`,
            consequences: { patrimonio: -extra, moral: 4, rel_representante: 2, flags: { ...marked, [inv.key]: rewritten(inv, week, value + extra, 0.16, cleanName) } },
          },
          fail: {
            text: `Metes ${eur(extra)} más y el mercado se gira otra vez en contra. Duele más, porque ahora hay más dinero dentro. ${agent} evita mirarte a los ojos.`,
            consequences: { patrimonio: -extra, moral: -4, rel_representante: -2, flags: { ...marked, [inv.key]: rewritten(inv, week, value + extra, -0.25, cleanName + " (en pérdidas)") } },
          },
        },
      });
    }
  } else if (canAddMore) {
    options.push({
      id: "c",
      label: `Meter ${eur(extra)} más`,
      subtitle: mood === "good" ? "Reforzar lo que funciona" : "Aumentar la posición",
      consequences: {
        patrimonio: -extra,
        rel_representante: 1,
        flags: { ...marked, [inv.key]: rewritten(inv, week, value + extra, inv.annualRate, cleanName) },
      },
      outcomeText: `Decides reforzar tu posición con ${eur(extra)} más. ${agent} lo prepara todo esa misma tarde. Ahora tienes ${eur(value + extra)} puestos en ${cleanName}.`,
    });
  }

  return {
    id: `inv-review-${slug}-${week}`,
    category: "representante",
    title:
      mood === "good"
        ? `${cleanName}: va mejor de lo previsto`
        : mood === "bad"
          ? `${cleanName}: las cuentas no salen`
          : `${cleanName}: cómo va tu inversión`,
    description: intro,
    options,
    priority: true,
  };
}
