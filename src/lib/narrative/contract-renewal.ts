/**
 * El contrato del club tiene fecha de fin. Antes los años de una oferta se decían en el texto y se olvidaban: el
 * contrato no vencía nunca y la renovación solo salía por casualidad en el mercado. Ahora se guarda
 * (flags.contract_until, en turnos) y hay dos escenas:
 *
 *  - ÚLTIMA TEMPORADA (quedan 1-10 turnos): el club te propone renovar. Cifras según cómo estés (fama, forma, relación
 *    con el míster). Puedes renovar, pedir más (tirada; si sale mal el club se enfría) o decir que no renuevas, lo que
 *    abre el mercado con un club interesado y te enfría con el vestuario.
 *  - FIN DE CONTRATO (vencido): última oportunidad de quedarte (a peor precio si dejaste que se agotara) o marcharte
 *    libre a otro club, con una prima mayor porque no hay traspaso de por medio.
 */
import type { EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { TURNS_PER_YEAR, buildTerms, contractFlags, contractUntil, eur, eurFee, marketValueM, playerAnnualGross, releaseClauseM, salaryCeiling, type Terms } from "@/lib/narrative/transfer-terms";
import { pickInterestedClub } from "@/lib/narrative/market-window";
import { NO_CLUB_YET } from "@/lib/constants";

export { contractUntil, TURNS_PER_YEAR };
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;
const round1k = (n: number) => Math.round(n / 1000) * 1000;

export type ContractPhase = "ultima" | "fin" | null;

export function contractPhase(player: Player): ContractPhase {
  if (!player.club || player.club === NO_CLUB_YET || player.status !== "active") return null;
  const f = player.flags ?? {};
  if (player.flags?.loan_active && !player.flags?.loan_returned) return null;
  const until = contractUntil(player);
  const left = until - player.week;
  if (left <= 0) return num(f[`ctr_fin_${until}`]) ? null : "fin";
  if (left <= TURNS_PER_YEAR) return num(f[`ctr_ult_${until}`]) ? null : "ultima";
  return null;
}

export function shouldTriggerContractRenewal(player: Player): boolean {
  if (contractPhase(player) === null) return false;
  const last = num(player.flags?.ctr_last);
  return last === 0 || player.week - last >= 3;
}

/** Lo que te ofrecería tu club para seguir, según cómo estés. */
export function renewalOffer(player: Player, terms: Terms): number {
  const fama = player.fama ?? 50;
  const forma = player.forma ?? 60;
  const mister = player.rel_entrenador ?? 50;
  const perf = Math.min(1.25, Math.max(0.88, 0.9 + (fama - 50) / 250 + (forma - 60) / 400 + (mister - 50) / 500));
  const current = playerAnnualGross(player);
  return Math.min(Math.max(round1k(terms.offeredAnnual * perf), round1k(current * 0.9), 15000), Math.max(15000, salaryCeiling(player.media, player.club)));
}

export function buildContractRenewalEvent(player: Player): GameEvent {
  const phase = contractPhase(player) as "ultima" | "fin";
  const week = player.week;
  const until = contractUntil(player);
  const club = player.club;
  const f = player.flags ?? {};
  const agent = player.agent_name && player.agent_name !== "sin representante" ? player.agent_name : "Tu representante";
  const own = buildTerms(player, club, null);
  const current = playerAnnualGross(player);
  const cooled = Boolean(f.ctr_enfriado);
  const leaving = num(f.ctr_salida) === until;
  // Dejar que se agote el contrato sin renovar sale más caro: te ofrecen menos que antes.
  const lapse = phase === "fin" && !leaving ? 0.92 : cooled ? 0.9 : 1;
  const offer = round1k(renewalOffer(player, own) * lapse);
  const years = own.years;
  const bonus = Math.max(2000, round1k(offer * 0.08));
  // La cláusula de rescisión: la actual y la que se pactaría al renovar (por lo menos un 40 % más, y casi el doble de lo que vales).
  const clause = releaseClauseM(player);
  const newClause = Math.max(2, Math.round(Math.max(clause * 1.4, marketValueM(player) * 1.8)));
  const askClause = Math.round(newClause * 1.25);
  const done = { [phase === "ultima" ? `ctr_ult_${until}` : `ctr_fin_${until}`]: "1", ctr_last: String(week) };
  const delta = offer - current;
  const sign = delta >= 0 ? "+" : "−";

  const renew: EventOption = {
    id: "a",
    label: `Renovar ${years} años por ${eur(offer)} brutos al año`,
    subtitle: `${sign}${eur(Math.abs(delta))} sobre lo que cobras (${eur(current)}) · prima ${eur(bonus)} · cláusula ${eurFee(clause)} → ${eurFee(newClause)}`,
    consequences: {
      patrimonio: bonus,
      moral: 3,
      rel_entrenador: 2,
      rel_aficion: 2,
      flags: { ...done, ctr_enfriado: "", ctr_salida: "", ...contractFlags(player, offer, club, years, newClause) },
    },
    outcomeText: `Firmas ${years} años más con ${club}: ${eur(offer)} brutos al año (antes ${eur(current)}), ${eur(bonus)} de prima y la cláusula de rescisión sube de ${eurFee(clause)} a ${eurFee(newClause)}. ${agent} guarda el boli y te dice, bajito: «Con esto tienes tranquilidad. Y a nosotros nos sobra el tiempo para mirar lo que venga».`,
  };

  const options: EventOption[] = [renew];

  if (phase === "ultima") {
    const ask = Math.min(round1k(offer * 1.2), Math.max(15000, salaryCeiling(player.media, player.club)));
    options.push({
      id: "b",
      label: `Pedir más: ${eur(ask)} al año y cláusula de ${eurFee(askClause)}`,
      subtitle: "Negociar fuerte · riesgo de que el club se enfríe",
      consequences: {},
      resolve: {
        baseChance: Math.min(0.72, 0.42 + ((player.fama ?? 50) - 50) / 300),
        statModifier: "reputacion",
        success: {
          text: `El club cede: ${eur(ask)} brutos al año durante ${years} años y la cláusula de rescisión sube a ${eurFee(askClause)} (antes ${eurFee(clause)}). ${agent} sale del despacho con una sonrisa que da miedo. Que te valoren así también cambia cómo te miran en el vestuario.`,
          consequences: {
            patrimonio: Math.round(bonus * 1.3),
            moral: 6,
            fama: 1,
            rel_entrenador: 1,
            flags: { ...done, ctr_enfriado: "", ctr_salida: "", ...contractFlags(player, ask, club, years, askClause) },
          },
        },
        fail: {
          text: `Te pasas de listo: el club da un paso atrás y retira la propuesta. Os emplazáis a más adelante, pero el ambiente ya es otro, y la próxima oferta será peor.`,
          consequences: { moral: -4, rel_entrenador: -3, rel_representante: -1, flags: { ...done, ctr_last: String(week), ctr_enfriado: "1" } },
        },
      },
    });
    options.push({
      id: "c",
      label: "No renovar: jugar el último año y salir libre",
      subtitle: "Abre el mercado: un club se interesará por ti",
      consequences: {
        rel_entrenador: -3,
        rel_aficion: -2,
        moral: 1,
        flags: { ...done, ctr_salida: String(until), "@interest": "agente" },
      },
      outcomeText: `Le dices al club que no vas a renovar. Lo aceptan con una frialdad educada: seguirás jugando, pero ya eres el que se va. ${agent} empieza a mover tu nombre por el mercado esa misma tarde.`,
    });
  } else {
    // FIN DE CONTRATO: quedarte (la opción a) o marcharte libre a un club.
    const target = typeof f.transfer_interest === "string" && f.transfer_interest && f.transfer_interest !== club ? f.transfer_interest : pickInterestedClub(player);
    const free = buildTerms(player, target, null);
    const freeAnnual = round1k(free.offeredAnnual * 1.1);
    const freeBonus = Math.max(5000, round1k(freeAnnual * 0.22));
    options.push({
      id: "c",
      label: `Marcharte libre a ${target}: ${eur(freeAnnual)} al año`,
      subtitle: `${free.years} años · prima de fichaje ${eur(freeBonus)} · cláusula ${eurFee(free.clauseM)} · sin traspaso`,
      consequences: {
        club: target,
        patrimonio: freeBonus,
        fama: 4,
        moral: 4,
        rel_vestuario: -3,
        rel_aficion: -4,
        flags: { ...done, ctr_enfriado: "", ctr_salida: "", transfer_interest: "", ...contractFlags(player, freeAnnual, target, free.years, free.clauseM) },
      },
      outcomeText: `Quedas libre y firmas por ${target}: ${free.years} años, ${eur(freeAnnual)} brutos al año, ${eur(freeBonus)} de prima y cláusula de ${eurFee(free.clauseM)}, sin traspaso de por medio. En ${club} te despiden con respeto. ${agent} te dice que has hecho justo lo que se hace cuando se puede elegir.`,
    });
  }

  const title =
    phase === "ultima"
      ? cooled
        ? "El club vuelve a hablarte de tu contrato"
        : "Te queda un año de contrato"
      : leaving
        ? "Acaba tu contrato: eres libre"
        : "Se te acaba el contrato";
  const description =
    phase === "ultima"
      ? `${agent} te cita con la carpeta bajo el brazo: «Te queda una temporada de contrato con ${club}. Quieren hablar de la renovación ya, antes de que el mercado empiece a hacer ruido». ${cooled ? "Tras la última negociación, la propuesta es más fría de lo que esperabas. " : ""}Tu cláusula actual es de ${eurFee(clause)}. La oferta sobre la mesa: ${eur(offer)} brutos al año durante ${years} años, con la cláusula subiendo a ${eurFee(newClause)}.`
      : leaving
        ? `Tu contrato con ${club} ha vencido y, como habías avisado, eres agente libre. ${agent} te muestra lo que hay: puedes seguir en ${club} por ${eur(offer)} brutos al año, o irte a otro sitio por mucho más y con una buena prima, porque nadie tiene que pagar por ti.`
        : `Tu contrato con ${club} se ha agotado sin renovar. El club te hace una última propuesta, más baja que la de antes: ${eur(offer)} brutos al año. ${agent} te recuerda que también puedes marcharte libre: «Nadie paga traspaso por ti, y eso se nota en la oferta».`;

  return {
    id: `contrato-${phase}-${until}`,
    category: "representante",
    title,
    description,
    options,
    priority: true,
    // El momento de firmar (o de irte libre) es de los que se comparten: hito con foto en la oficina del club.
    ...(phase === "fin" ? { isMilestone: true, milestoneType: "contrato" as const, imageScene: 'Photorealistic photo of the photographed man holding up a club jersey with a new contract on the table, sitting next to a club director in a suit, official club office, camera flashes, warm lighting' } : {}),
  };
}
