/**
 * Auditoría sin IA: decisiones del banco de escenas que mueven mucho dinero o dejan algo permanente
 * (inversión, compra, negocio) pero a las que NINGUNA escena posterior responde (ni por `after` ni por bandera).
 * Son consecuencias "mudas": un número que cambia y nada más. Uso: npx tsx scripts/audit-consecuencias.mts
 */
import { BANK_SCENES } from "../src/lib/narrative/bank/scenes";

type Opt = { id: string; label: string; consequences?: any; resolve?: { success: { consequences: any }; fail: { consequences: any } } };
const scenes: any[] = BANK_SCENES as any[];

// Quién responde a quién: ids referenciados en `after` y banderas leídas en `when.flags`.
const answeredIds = new Set<string>();
const readFlags = new Set<string>();
for (const s of scenes) {
  for (const a of s.when?.after ?? []) answeredIds.add(a.scene ?? a.id ?? a[0]);
  for (const f of s.when?.flags ?? []) readFlags.add(f);
  for (const f of s.when?.notFlags ?? []) readFlags.add(f);
}

const cons = (o: Opt): any[] => (o.resolve ? [o.resolve.success.consequences, o.resolve.fail.consequences] : [o.consequences ?? {}]);
const rows: { id: string; family: string; spend: number; why: string }[] = [];
for (const s of scenes) {
  const opts: Opt[] = s.event?.options ?? [];
  let spend = 0;
  let leaves = false;
  const flagsSet: string[] = [];
  for (const o of opts) for (const c of cons(o)) {
    if ((c.patrimonio ?? 0) < spend) spend = c.patrimonio;
    for (const k of Object.keys(c.flags ?? {})) { flagsSet.push(k); if (k.startsWith("inversion_") || k.startsWith("propiedad_")) leaves = true; }
  }
  const answered = answeredIds.has(s.id) || flagsSet.some((k) => readFlags.has(k));
  if (spend <= -5000 && !answered && !leaves) rows.push({ id: s.id, family: s.family, spend, why: "gasta y no vuelve" });
}
rows.sort((a, b) => a.spend - b.spend);
console.log(`Escenas con gasto ≥ 5.000 € a las que ninguna escena responde: ${rows.length} de ${scenes.length}`);
for (const r of rows.slice(0, 40)) console.log(`  ${r.id} [${r.family}] ${r.spend.toLocaleString("es")} €`);
