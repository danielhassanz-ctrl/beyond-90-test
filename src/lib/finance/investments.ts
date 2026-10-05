/**
 * Inversiones con nombre y apellidos. Antes "Tu agente te habla de invertir"
 * restaba 3.000 € sin decir en qué: el dinero desaparecía. Ahora cada
 * inversión es un activo concreto (fondo indexado, un local alquilado, la
 * deuda del Estado…) que vive en player.flags.inversion_* como JSON, se
 * revaloriza cada turno con su propia rentabilidad y cuenta en el patrimonio
 * neto igual que las propiedades.
 *
 * El flag se escribe desde una escena escrita a mano, que no sabe en qué
 * semana está el jugador: "@WEEK" en `since` se sustituye al resolver la
 * decisión (ver resolveEvent).
 */
export interface InvestmentRecord {
  key: string;
  name: string;
  /** Qué es, en una frase para el jugador. */
  detail: string;
  amount: number;
  /** Semana en que se invirtió. */
  since?: number;
  /** Rentabilidad anual esperada (0,06 = 6 %). Un turno = un mes. */
  annualRate: number;
}

export function readInvestments(flags: Record<string, string | boolean> | null | undefined): InvestmentRecord[] {
  const out: InvestmentRecord[] = [];
  for (const [key, value] of Object.entries(flags ?? {})) {
    if (!key.startsWith("inversion_") || typeof value !== "string" || !value) continue;
    try {
      const i = JSON.parse(value) as Omit<InvestmentRecord, "key">;
      if (i && typeof i.amount === "number") out.push({ key, ...i });
    } catch {
      // inversión corrupta: se ignora
    }
  }
  return out;
}

/** Lo que vale hoy lo invertido: capital + rentabilidad compuesta mes a mes. */
export function investmentValue(i: InvestmentRecord, week: number): number {
  const months = Math.max(0, week - (i.since ?? week));
  return Math.round(i.amount * (1 + i.annualRate / 12) ** months);
}

export function totalInvestmentValue(flags: Record<string, string | boolean> | null | undefined, week: number): number {
  return readInvestments(flags).reduce((n, i) => n + investmentValue(i, week), 0);
}

/** Flag listo para pegar en `consequences.flags` de una escena escrita a mano. */
export function investmentFlag(
  slug: string,
  rec: Omit<InvestmentRecord, "key" | "since">,
): Record<string, string> {
  return { [`inversion_${slug}`]: JSON.stringify({ ...rec, since: "@WEEK" }) };
}
