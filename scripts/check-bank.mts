/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Validador del banco de escenas (gratis, sin IA): esquema, coherencia de las
 * cadenas (cada "after" apunta a una escena y opción que existen), texto sano
 * y cobertura. Sale con error si algo está roto.
 *
 * Uso: npx tsx scripts/check-bank.mts
 */
const { BANK_SCENES } = await import("../src/lib/narrative/bank/scenes");
const { THREAD_KINDS } = await import("../src/lib/narrative/threads");

const errors: string[] = [];
const warn: string[] = [];
const err = (id: string, msg: string) => errors.push(`✗ ${id}: ${msg}`);

const VOSEO = /(?<![\p{L}])(vos|tenés|querés|sos|podés|andá|contame|mirá|fijate|sabés|decime|dale che|plata|computadora|celular|auto)(?![\p{L}])/iu;
const BROKEN = /undefined|\[object|NaN|\{\w+\}(?<!\{club\}|\{el_club\}|\{apellido\})/;
const KNOWN_PLACEHOLDERS = new Set(["{club}", "{el_club}", "{apellido}"]);

const ids = new Set<string>();
const optionsByScene = new Map<string, Set<string>>();
const flagsSet = new Set<string>();
for (const s of BANK_SCENES) {
  optionsByScene.set(s.id, new Set(s.event.options.map((o: any) => o.id)));
  for (const o of s.event.options as any[]) {
    for (const f of Object.keys(o.consequences?.flags ?? {})) flagsSet.add(f);
    for (const k of ["success", "fail"]) for (const f of Object.keys(o.resolve?.[k]?.consequences?.flags ?? {})) flagsSet.add(f);
  }
}

for (const s of BANK_SCENES) {
  if (!s.id.startsWith("bank-")) err(s.id, "el id debe empezar por bank-");
  if (ids.has(s.id)) err(s.id, "id duplicado");
  ids.add(s.id);
  if (!s.family) err(s.id, "falta family");
  const e: any = s.event;
  if (!e.title || !e.description) err(s.id, "título o descripción vacíos");
  if (!e.options || e.options.length < 2 || e.options.length > 4) err(s.id, `debe tener 2-4 opciones (tiene ${e.options?.length})`);
  if (e.isMilestone && !e.imageScene) err(s.id, "es hito pero no tiene imageScene");
  const optIds = new Set<string>();
  const texts: string[] = [e.title, e.description, e.freeTextPrompt ?? ""];
  for (const o of e.options) {
    if (optIds.has(o.id)) err(s.id, `opción duplicada ${o.id}`);
    optIds.add(o.id);
    if (!o.label || !o.subtitle) err(s.id, `opción ${o.id} sin label/subtitle`);
    if (!o.outcomeText && !o.resolve) err(s.id, `opción ${o.id} SIN reacción (outcomeText o resolve)`);
    if (o.resolve && (typeof o.resolve.baseChance !== "number" || !o.resolve.success?.text || !o.resolve.fail?.text)) err(s.id, `opción ${o.id}: resolve incompleto`);
    if (o.thread && !THREAD_KINDS.includes(o.thread.kind)) err(s.id, `opción ${o.id}: hilo con tipo inválido ${o.thread.kind}`);
    texts.push(o.label, o.subtitle, o.outcomeText ?? "", o.resolve?.success?.text ?? "", o.resolve?.fail?.text ?? "", o.thread?.text ?? "", o.thread?.who ?? "");
    const c = o.consequences ?? {};
    for (const k of ["moral", "forma", "fama", "media", "rel_entrenador", "rel_vestuario", "rel_aficion", "rel_representante", "reputacion"]) {
      if (c[k] !== undefined && (typeof c[k] !== "number" || Math.abs(c[k]) > 15)) err(s.id, `opción ${o.id}: ${k}=${c[k]} fuera de rango (±15)`);
    }
    if (c.patrimonio !== undefined && (typeof c.patrimonio !== "number" || Math.abs(c.patrimonio) > 30000)) err(s.id, `opción ${o.id}: patrimonio=${c.patrimonio} fuera de rango`);
    if (typeof c.club === "string" && c.club !== "@LOWER") err(s.id, `opción ${o.id}: club solo puede ser @LOWER en el banco`);
  }
  for (const t of texts) {
    if (VOSEO.test(t)) err(s.id, `voseo o latinoamericanismo en: "${t.slice(0, 60)}"`);
    if (/undefined|\[object|NaN/.test(t)) err(s.id, `texto roto: "${t.slice(0, 60)}"`);
    for (const m of t.match(/\{[a-z_]+\}/g) ?? []) if (!KNOWN_PLACEHOLDERS.has(m)) err(s.id, `marcador desconocido ${m}`);
  }
  // cadenas
  for (const a of s.when.after ?? []) {
    if (!optionsByScene.has(a.scene)) err(s.id, `after apunta a una escena que no existe: ${a.scene}`);
    else if (a.option && !optionsByScene.get(a.scene)!.has(a.option)) err(s.id, `after apunta a una opción que no existe: ${a.scene}/${a.option}`);
    if (a.minGap !== undefined && a.maxGap !== undefined && a.minGap > a.maxGap) err(s.id, "minGap > maxGap");
    if (a.scene === s.id) err(s.id, "after apunta a sí misma");
  }
  for (const f of s.when.flags ?? []) if (!flagsSet.has(f) && !/^(title_|capitan_seleccion|sponsor_|pareja|hijos)/.test(f)) warn.push(`! ${s.id}: exige la bandera "${f}" que ninguna escena del banco activa`);
  const w = s.when;
  if (w.minAge !== undefined && w.maxAge !== undefined && w.minAge > w.maxAge) err(s.id, "minAge > maxAge");
  if (w.minWeek !== undefined && w.maxWeek !== undefined && w.minWeek > w.maxWeek) err(s.id, "minWeek > maxWeek");
}

// huérfanas: escenas encadenadas cuya predecesora nadie puede desbloquear (ciclos)
const dependsOn = new Map<string, string[]>();
for (const s of BANK_SCENES) dependsOn.set(s.id, (s.when.after ?? []).map((a) => a.scene));
function reachable(id: string, seen = new Set<string>()): boolean {
  if (seen.has(id)) return false;
  seen.add(id);
  const deps = dependsOn.get(id) ?? [];
  return deps.every((d) => reachable(d, new Set(seen)));
}
for (const s of BANK_SCENES) if (!reachable(s.id)) err(s.id, "cadena con ciclo: nunca podrá salir");

const families = new Map<string, number>();
for (const s of BANK_SCENES) families.set(s.family, (families.get(s.family) ?? 0) + 1);
const chained = BANK_SCENES.filter((s) => (s.when.after ?? []).length > 0).length;
const withThread = BANK_SCENES.filter((s) => s.event.options.some((o: any) => o.thread)).length;
const milestones = BANK_SCENES.filter((s) => s.event.isMilestone).length;

console.log(`BANCO DE ESCENAS: ${BANK_SCENES.length} escenas · ${families.size} familias · ${chained} encadenadas · ${withThread} abren hilos · ${milestones} hitos compartibles`);
console.log("Familias:", [...families.entries()].map(([f, n]) => `${f}(${n})`).join(", "));
for (const w of warn) console.log(w);
if (errors.length) {
  console.log(`\n${errors.length} ERRORES:`);
  for (const e of errors) console.log(e);
  process.exit(1);
}
console.log("SIN ERRORES");
