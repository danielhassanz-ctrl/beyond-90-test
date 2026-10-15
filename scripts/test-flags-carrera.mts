/** Prueba sin red: escribir banderas ya no pisa lo que otra petición cambió mientras tanto (fotos, pagos, créditos). */
import { diffFlags, applyFlagsDelta, mergeFlagsForWrite, patchFlagsFresh, type Flags } from "../src/lib/supabase/flags";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };

/** Una base de datos de mentira con una sola fila. */
const fakeDb = (initial: Flags) => {
  const row = { id: "p1", flags: { ...initial } as Flags };
  const client: any = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { flags: { ...row.flags } } }) }) }),
      update: (patch: { flags: Flags }) => ({ eq: () => ({ select: async () => { row.flags = { ...patch.flags }; return { data: [{ id: "p1" }] }; } }) }),
    }),
  };
  return { row, client };
};

console.log("1) Qué ha cambiado");
const d = diffFlags({ a: "1", b: "2", c: true }, { a: "1", b: "3", d: "x" });
ok(d.set.b === "3" && d.set.d === "x" && !("a" in d.set), "detecta lo modificado y lo añadido, no lo que sigue igual");
ok(d.del.length === 1 && d.del[0] === "c", "detecta lo borrado");
ok(JSON.stringify(diffFlags({ a: "1" }, { a: "1" })) === JSON.stringify({ set: {}, del: [] }), "sin cambios, nada que escribir");

console.log("2) Aplicarlo sobre otra versión");
const merged = applyFlagsDelta({ a: "1", b: "2", foto: "nueva.jpg", img_paid_credits: "10" }, { set: { b: "3" }, del: ["a"] });
ok(merged.b === "3" && !("a" in merged), "aplica el cambio y el borrado");
ok(merged.foto === "nueva.jpg" && merged.img_paid_credits === "10", "conserva lo que otra petición había escrito");

console.log("3) El caso real: la IA tarda y mientras tanto llega un pago y una foto");
const { row, client } = fakeDb({ semana: "70", img_paid_credits: "0" });
const start: Flags = { ...row.flags };
const mine: Flags = { ...start, escena_siguiente: "bank-x", semana: "71" };       // lo que cambia esta petición
row.flags = { ...row.flags, img_paid_credits: "10", header_photo: "https://x/h.jpg" }; // mientras tanto: Stripe y una foto
const toWrite = await mergeFlagsForWrite(client, "p1", start, mine);
ok(toWrite.escena_siguiente === "bank-x" && toWrite.semana === "71", "lo suyo se escribe");
ok(toWrite.img_paid_credits === "10" && toWrite.header_photo === "https://x/h.jpg", "los créditos comprados y la foto NO se pisan con el valor viejo");

console.log("4) Gastar un crédito sobre las banderas actuales");
const db2 = fakeDb({ img_paid_credits: "10", otra: "1" });
const stale = { img_paid_credits: "0", otra: "0" };            // lo que creía la petición larga
void stale;
const after = await patchFlagsFresh(db2.client, "p1", (f) => { f.img_paid_credits = String((parseInt(String(f.img_paid_credits), 10) || 0) - 1); });
ok(after?.img_paid_credits === "9" && db2.row.flags.otra === "1", "gasta 1 de los 10 reales y deja el resto como estaba");

console.log("5) Si no se puede leer la fila, se escribe lo de siempre");
const broken: any = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => { throw new Error("red"); } }) }) }) };
const fallback = await mergeFlagsForWrite(broken, "p1", { a: "1" }, { a: "2" });
ok(fallback.a === "2", "sin lectura, devuelve las banderas finales sin romper");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
