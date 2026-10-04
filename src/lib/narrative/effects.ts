/** Resumen legible de lo que cambió una decisión (usado por el historial de la IA y el libro de decisiones). */

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
