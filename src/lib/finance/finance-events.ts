/**
 * Apuros con las cuotas de la hipoteca: cuando el dinero en cuenta no da para
 * unos meses de cuotas, el banco llama. Cada salida tiene su coste real
 * (vender, renegociar con riesgo o pedir un adelanto al club). Todo en
 * código, sin llamadas a la IA.
 */
import type { GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { NO_CLUB_YET } from "@/lib/constants";
import { playerMonthlyNet } from "@/lib/narrative/transfer-terms";
import { monthlySponsorshipIncome } from "@/lib/finance/sponsorship-income";
import { monthlyRent } from "@/lib/finance/rent";
import { readProperties, monthlyPayment, remainingLoan, serializeProperty, totalMonthlyPayments } from "@/lib/finance/mortgage";

const COOLDOWN_WEEKS = 8;

/** Sueldo neto mensual real (ver transfer-terms.ts). */
function monthlySalary(player: Player): number {
  return playerMonthlyNet(player);
}

export function shouldTriggerDebtTrouble(player: Player): boolean {
  if (player.club === NO_CLUB_YET) return false;
  const payments = totalMonthlyPayments(player.flags);
  if (payments <= 0) return false;
  // Lo que entra cada mes (sueldo neto + patrocinios − alquiler) cuenta: con 0 € en la cuenta pero 380.000 € que entran el mes que viene,
  // el banco no llama. Solo hay apuros si el dinero y el ingreso de un mes no cubren dos meses de cuotas.
  const income = playerMonthlyNet(player) + monthlySponsorshipIncome(player.flags, player.week) - monthlyRent(player.flags);
  if ((player.patrimonio ?? 0) + Math.max(0, income) >= payments * 2) return false;
  const last = parseInt(String(player.flags?.debt_event_week ?? "0"), 10) || 0;
  return last === 0 || player.week - last >= COOLDOWN_WEEKS;
}

export function buildDebtTroubleEvent(player: Player): GameEvent {
  const props = readProperties(player.flags).filter((p) => monthlyPayment(p) > 0);
  const worst = [...props].sort((a, b) => monthlyPayment(b) - monthlyPayment(a))[0];
  const payments = totalMonthlyPayments(player.flags);
  const pending = props.reduce((n, p) => n + remainingLoan(p, player.week), 0);
  const eur = (n: number) => `${n.toLocaleString("es")} €`;
  const advance = monthlySalary(player) * 3;
  const saleGain = Math.max(0, Math.round(worst.price * 0.92 - remainingLoan(worst, player.week)));
  const seen = { debt_event_week: String(player.week) };
  const renegotiated = serializeProperty({ ...worst, paymentFactor: Math.min(worst.paymentFactor ?? 1, 0.7) });

  return {
    id: `banco-${Date.now()}`,
    category: "representante",
    title: "El banco te llama por las cuotas",
    description: `Entre las cuotas de tus hipotecas (${eur(payments)} al mes) y lo que te queda en la cuenta (${eur(player.patrimonio ?? 0)}), el margen se ha estrechado de golpe. Tu gestor te llama a primera hora: "Tienes que tomar una decisión antes de que lleguen dos recibos devueltos. Debes en total ${eur(pending)} y lo más pesado es ${worst.name}".`,
    options: [
      {
        id: "vender",
        label: `Vender ${worst.name}`,
        subtitle: `Recuperas unos ${eur(saleGain)} y te quitas una cuota de ${eur(monthlyPayment(worst))}`,
        consequences: { patrimonio: saleGain, moral: -4, fama: -1, flags: { ...seen, [worst.key]: "" } },
        outcomeText: `Firmas la venta con un nudo en la garganta. El comprador entra a ver la casa un martes por la tarde y tú esperas en el coche, sin atreverte a mirar por la ventana.`,
      },
      {
        id: "renegociar",
        label: "Renegociar la hipoteca con el banco",
        subtitle: "Cuota más baja, con riesgo de que digan que no",
        consequences: {},
        resolve: {
          baseChance: 0.5,
          statModifier: "reputacion",
          success: {
            text: `El director de la sucursal se pasa la mano por la cara y, al final, cede: alarga el plazo y te baja la cuota de ${worst.name} casi un tercio.`,
            consequences: { moral: 3, rel_representante: 1, flags: { ...seen, [worst.key]: renegotiated } },
          },
          fail: {
            text: "El banco no se mueve y te cobra comisiones por el estudio. Sales con las manos vacías y menos dinero que antes.",
            consequences: { patrimonio: -1500, moral: -4, flags: seen },
          },
        },
      },
      {
        id: "adelanto",
        label: "Pedirle al club un adelanto de sueldo",
        subtitle: `Unos ${eur(advance)}, y deberle un favor al presidente`,
        consequences: {},
        resolve: {
          baseChance: 0.6,
          statModifier: "reputacion",
          success: {
            text: "El presidente firma el adelanto sin hacer preguntas, pero te recuerda con una sonrisa que \"en el club nos cuidamos entre todos\". Quedas en deuda.",
            consequences: { patrimonio: advance, rel_entrenador: -1, rel_vestuario: -1, flags: seen },
          },
          fail: {
            text: "El club se niega a adelantarte nada y la noticia se filtra en el vestuario: ya no eres solo el crack, también el que tiene problemas de dinero.",
            consequences: { moral: -5, fama: -2, rel_vestuario: -2, flags: seen },
          },
        },
      },
    ],
  };
}
