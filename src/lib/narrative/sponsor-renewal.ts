/**
 * Renovación de patrocinios: un contrato de marca dura una temporada (10 turnos) y antes simplemente desaparecía,
 * sin escena ni decisión. Ahora, al vencer, la marca (o tu representante) te llama: renovar, pedir más o dejarlo. Lo
 * que te ofrezcan depende de cómo te haya ido: tu fama, tu forma y tu media hacen subir o bajar la cifra.
 */
import type { EventOption, GameEvent } from "@/types/career";
import type { Player } from "@/types/player";
import { readSponsorships, SPONSORSHIP_TURNS, type SponsorshipRecord } from "@/lib/finance/sponsorship-income";

/** Cuántos turnos después de vencer sigue valiendo la oferta de renovación. */
const WINDOW = 4;
const num = (v: string | boolean | undefined) => parseInt(String(v ?? "0"), 10) || 0;
const slugOf = (key: string) => key.replace(/^patrocinio_/, "");
const eur = (n: number) => Math.round(n).toLocaleString("es") + " €";

/** El contrato recién vencido que aún no se ha tratado, o null. */
export function expiredSponsorship(player: Player): SponsorshipRecord | null {
  const flags = player.flags ?? {};
  const week = player.week;
  if (flags.sporev_last !== undefined && week - num(flags.sporev_last) < 2) return null;
  let best: SponsorshipRecord | null = null;
  for (const s of readSponsorships(flags)) {
    if (week <= s.until || week - s.until > WINDOW) continue;
    if (num(flags[`sporev_${slugOf(s.key)}`]) >= s.until) continue; // ya tratado
    if (!best || s.until < best.until) best = s;
  }
  return best;
}

export function shouldTriggerSponsorRenewal(player: Player): boolean {
  return expiredSponsorship(player) !== null;
}

/** Cómo cambia la cifra al renovar según tu momento: entre un 0,8 y un 1,35 de lo que cobrabas. */
export function renewalFactor(player: Player): number {
  const fama = player.fama ?? 0;
  const forma = player.forma ?? 60;
  const media = player.media ?? 60;
  const f = 0.78 + fama / 220 + Math.max(0, media - 60) / 250 + (forma < 50 ? -0.1 : forma > 80 ? 0.05 : 0);
  return Math.min(1.35, Math.max(0.75, f));
}

const rec = (s: SponsorshipRecord, week: number, monthly: number): string =>
  JSON.stringify({ name: s.name, monthly: Math.max(50, Math.round(monthly / 50) * 50), since: week + 1, until: week + SPONSORSHIP_TURNS });

export function buildSponsorRenewalEvent(player: Player): GameEvent {
  const s = expiredSponsorship(player) as SponsorshipRecord;
  const week = player.week;
  const slug = slugOf(s.key);
  const agent = player.agent_name && player.agent_name !== "sin representante" ? player.agent_name : "Tu representante";
  const factor = renewalFactor(player);
  const offer = Math.max(50, Math.round((s.monthly * factor) / 50) * 50);
  const better = factor >= 1.05;
  const worse = factor < 0.95;
  const done = { [`sporev_${slug}`]: String(s.until), sporev_last: String(week) };

  const intro = better
    ? `${s.name} cierra una temporada contigo y quiere seguir. ${agent} te enseña la propuesta con una sonrisa: «Les has dado más visibilidad de la que esperaban. Te ofrecen ${eur(offer)} al mes, por encima de los ${eur(s.monthly)} de antes».`
    : worse
      ? `El contrato con ${s.name} ha vencido. ${agent} llega con la propuesta de renovación y un gesto que ya lo dice todo: «Quieren seguir, pero a la baja: ${eur(offer)} al mes, frente a los ${eur(s.monthly)} de antes. Dicen que este año no has dado lo que esperaban».`
      : `${s.name} te propone renovar. ${agent} resume: «Mismas condiciones, más o menos: ${eur(offer)} al mes (antes ${eur(s.monthly)}). No te regalan nada, pero tampoco te piden nada raro».`;

  const options: EventOption[] = [
    {
      id: "a",
      label: `Renovar por ${eur(offer)} al mes`,
      subtitle: "Una temporada más",
      consequences: { rel_representante: 1, reputacion: better ? 1 : 0, flags: { ...done, [s.key]: rec(s, week, offer) } },
      outcomeText: better
        ? `Firmas la renovación. ${s.name} te mete en su próxima campaña y vuelves a ver tu cara en las marquesinas de la ciudad. ${agent} te choca la mano: «Esto es lo que pasa cuando juegas bien».`
        : worse
          ? `Firmas la renovación a la baja, sin discutir. No es el contrato que querías, pero es dinero seguro cada mes. ${agent} te dice que si el año que viene remontas, se podrá renegociar.`
          : `Firmas la renovación sin sobresaltos. ${s.name} te manda una caja de regalo con el material de la nueva temporada. Un mes cualquiera, un ingreso más.`,
    },
    {
      id: "b",
      label: `Pedir más: ${eur(offer * 1.35)} al mes`,
      subtitle: "Arriesgas que se vayan",
      consequences: {},
      resolve: {
        baseChance: Math.min(0.75, 0.25 + (player.fama ?? 0) / 160),
        statModifier: "fama",
        success: {
          text: `Aprietas y la marca cede: ${eur(offer * 1.35)} al mes. ${agent} no se lo cree. «Les gustas más de lo que decían», admite. Sales del despacho con un contrato mejor que el que traías.`,
          consequences: { moral: 3, rel_representante: 2, fama: 1, flags: { ...done, [s.key]: rec(s, week, offer * 1.35) } },
        },
        fail: {
          text: `La marca se lo piensa un día y contesta con un comunicado seco: han decidido cerrar un acuerdo con otro deportista. ${s.name} se va, y tu hueco en su campaña lo ocupa otro. ${agent} evita decir «te lo dije».`,
          consequences: { moral: -3, fama: -1, rel_representante: -1, flags: { ...done } },
        },
      },
    },
    {
      id: "c",
      label: "No renovar",
      subtitle: "Dejarlo aquí",
      consequences: { moral: -1, flags: { ...done } },
      outcomeText: `Dices que prefieres cerrar esta etapa. ${s.name} responde con un mensaje educado y deja de ingresarte cada mes. Quedas libre para firmar con otra marca cuando aparezca algo mejor.`,
    },
  ];

  return {
    id: `spo-renewal-${slug}-${week}`,
    category: "representante",
    title: better ? `${s.name} quiere renovarte (y mejora)` : worse ? `${s.name} te ofrece renovar, a la baja` : `${s.name} te propone renovar`,
    description: intro,
    options,
    priority: true,
  };
}
