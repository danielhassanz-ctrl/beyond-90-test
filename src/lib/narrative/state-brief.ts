/**
 * Resumen del ESTADO REAL del jugador para los prompts de la IA. Sin esto la
 * IA generaba cada escena en el vacío (solo veía títulos y opciones elegidas):
 * podía escribir "confía en ti" con el jugador apartado, ignorar una lesión,
 * una oferta en marcha o el cabreo del vestuario, y las decisiones pasadas no
 * parecían influir en nada. Aquí se traduce el estado a frases que obligan a
 * que la escena nazca de lo que ha pasado.
 */
import type { Player } from "@/types/player";
import type { HistoryItem } from "@/lib/narrative/ai";
import { computeRole, ROLE_LABELS, benchRemaining } from "@/lib/narrative/role";
import { getInjuryRemaining } from "@/lib/narrative/career-dynamics";
import { NO_CLUB_YET } from "@/lib/constants";

function level(value: number, labels: [string, string, string, string]): string {
  // <30, <50, <75, resto
  return value < 30 ? labels[0] : value < 50 ? labels[1] : value < 75 ? labels[2] : labels[3];
}

export function buildStateBrief(player: Player, history: HistoryItem[]): string {
  const lines: string[] = [];
  const flags = player.flags ?? {};

  if (player.club !== NO_CLUB_YET) {
    const { role } = computeRole(player);
    const bench = benchRemaining(flags);
    const roleText: Record<string, string> = {
      titular: "es titular habitual",
      rotacion: "está en rotación: juega bastantes partidos pero no es intocable",
      suplente: "es suplente: entra desde el banquillo y juega pocos minutos",
      apartado: "está APARTADO: el entrenador no lo convoca",
    };
    lines.push(`- ROL EN EL EQUIPO: ${ROLE_LABELS[role]} — ${roleText[role]}${bench > 0 ? " (por decisión explícita del entrenador, de momento)" : ""}.`);
  }

  const injured = getInjuryRemaining(flags);
  lines.push(
    injured > 0
      ? `- LESIÓN: está lesionado, le quedan ~${injured} ${injured === 1 ? "mes" : "meses"} de baja (el fisio lo está tratando). NO puede jugar ni entrenar a tope: nada de escenas de partido jugado ni de recuperar sitio en el campo.`
      : "- LESIÓN: sano.",
  );

  lines.push(
    `- ENTRENADOR (${player.rel_entrenador}/100): ${level(player.rel_entrenador, ["relación rota, conflicto abierto", "relación fría, desconfianza", "relación correcta, profesional", "confía en él y se nota"])}.`,
  );
  lines.push(
    `- VESTUARIO (${player.rel_vestuario}/100): ${level(player.rel_vestuario, ["aislado, mal ambiente con él", "poco integrado", "buen compañero", "líder querido del grupo"])}. AFICIÓN (${player.rel_aficion}/100): ${level(player.rel_aficion, ["le pitan", "dividida", "le apoya", "le adora"])}. REPRESENTANTE (${player.rel_representante}/100): ${level(player.rel_representante, ["relación a punto de romperse", "tensa", "buena", "total confianza"])}.`,
  );

  if (player.moral < 35) lines.push(`- ÁNIMO muy bajo (${player.moral}/100): está hundido, y se nota en cómo reacciona.`);
  else if (player.moral > 85) lines.push(`- ÁNIMO altísimo (${player.moral}/100): está en su mejor momento.`);
  if (player.forma < 35) lines.push(`- FORMA muy baja (${player.forma}/100).`);

  const transferInterest = flags.transfer_interest;
  if (typeof transferInterest === "string" && transferInterest && transferInterest !== player.club) {
    lines.push(`- MERCADO: el ${transferInterest} está interesado en él (negociación en marcha); su representante lo está moviendo.`);
  }
  if (flags.loan_active && !flags.loan_returned) lines.push("- Está CEDIDO en otro club ahora mismo.");
  if (typeof flags.torneo_activo === "string" && flags.torneo_activo) lines.push(`- Está concentrado con su selección en un torneo (${flags.torneo_activo}).`);

  const threads = Object.entries(flags)
    .filter(([key]) => key.startsWith("hilo_"))
    .map(([, value]) => String(value))
    .slice(-5);
  if (threads.length > 0) lines.push(`- HILOS ABIERTOS (vínculos, promesas, rencores): ${threads.join(" | ")}.`);

  const recent = history
    .slice(0, 4)
    .map((h) => {
      const bits = [`"${h.title}" → eligió "${h.chosen}"`];
      if (h.effects) bits.push(`efecto: ${h.effects}`);
      if (h.outcome) bits.push(`reacción: ${h.outcome}`);
      return `  · ${bits.join(" · ")}`;
    })
    .join("\n");

  return `ESTADO REAL DEL JUGADOR (la escena tiene que ser COHERENTE con esto y nacer de ello):
${lines.join("\n")}
${recent ? `\nDECISIONES RECIENTES Y SUS CONSECUENCIAS (de más reciente a más antigua):\n${recent}\n` : ""}
CONTINUIDAD OBLIGATORIA:
- La escena debe nacer de la ÚLTIMA decisión o del estado de arriba, no de la nada: si la última decisión dejó algo pendiente (una promesa, un enfado, una oferta en marcha, un rencor), toca eso o a quien lo sufre antes que inventar un tema nuevo.
- NUNCA contradigas el estado: no escribas que el entrenador confía si la relación está rota, ni que juega si está lesionado o apartado, ni que le adora la grada si la afición le pita.
- Los cambios de las opciones tienen que ser coherentes con el estado (con el vestuario roto, una broma no sube de golpe la relación con el vestuario; con el míster en contra, un gesto amable apenas mueve nada).`;
}

const EFFECT_LABELS: Record<string, string> = {
  forma: "forma",
  moral: "ánimo",
  fama: "fama",
  media: "media",
  patrimonio: "dinero",
  rel_entrenador: "entrenador",
  rel_vestuario: "vestuario",
  rel_aficion: "afición",
  rel_representante: "representante",
  reputacion: "reputación",
};

/** "ánimo +5, entrenador −3, club: Sevilla FC" a partir de las consecuencias guardadas de una decisión. */
export function summarizeEffects(consequences: Record<string, unknown> | null | undefined): string | null {
  if (!consequences) return null;
  const parts: string[] = [];
  for (const [key, label] of Object.entries(EFFECT_LABELS)) {
    const value = consequences[key];
    if (typeof value === "number" && value !== 0) parts.push(`${label} ${value > 0 ? "+" : "−"}${Math.abs(value)}`);
  }
  if (typeof consequences.club === "string" && consequences.club) parts.push(`nuevo club: ${consequences.club}`);
  return parts.length > 0 ? parts.join(", ") : null;
}
