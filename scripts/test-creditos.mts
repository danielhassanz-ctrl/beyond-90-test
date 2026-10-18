/**
 * Prueba sin red: la reserva atómica de créditos de foto. Con un servidor falso que reproduce lo que importa (lecturas y escrituras con
 * retardo, escritura condicional por banderas), N peticiones a la vez nunca gastan más créditos de los que hay.
 */
import { reserveImageCredit, refundImageCredit, FREE_IMAGES_PER_CAREER } from "../src/lib/images/credits";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };
const tick = () => new Promise((r) => setTimeout(r, Math.random() * 4));

function fakeSupabase(initial: Record<string, string | boolean>) {
  const row = { id: "p1", flags: { ...initial } as Record<string, any> };
  const client: any = {
    row,
    auth: { getUser: async () => ({ data: { user: { id: "u1" } } }) },
    from() {
      return {
        select() {
          return { eq: () => ({ maybeSingle: async () => { await tick(); return { data: { flags: { ...row.flags } } }; } }) };
        },
        update(patch: { flags: Record<string, any> }) {
          const conds: [string, string | null][] = [];
          const q: any = {
            eq: (col: string, v: string) => (col.startsWith("flags->>") ? conds.push([col.slice(8), v]) : void 0, q),
            is: (col: string, v: null) => (conds.push([col.slice(8), v]), q),
            select: async () => {
              await tick();
              // La comprobación y la escritura son un solo paso (como en la base de datos).
              const pass = conds.every(([k, v]) => (v === null ? row.flags[k] === undefined || row.flags[k] === null : String(row.flags[k]) === v));
              if (!pass) return { data: [] };
              row.flags = { ...patch.flags };
              return { data: [{ id: "p1" }] };
            },
          };
          return q;
        },
      };
    },
  };
  return client;
}

const player = (flags: any) => ({ id: "p1", flags });

console.log("1) Un solo crédito gratis y diez peticiones a la vez");
{
  const db = fakeSupabase({ free_tier_eligible: "yes", img_free_used: String(FREE_IMAGES_PER_CAREER - 1) });
  const res = await Promise.all(Array.from({ length: 10 }, () => reserveImageCredit(db, player(db.row.flags), "x@y.z")));
  const got = res.filter(Boolean).length;
  ok(got === 1, `solo una consigue crédito (${got})`);
  ok(Number(db.row.flags.img_free_used) === FREE_IMAGES_PER_CAREER, "el contador de gratis queda en 5, nunca por encima");
}

console.log("2) Tres compradas, gratis agotadas, veinte peticiones");
{
  const db = fakeSupabase({ free_tier_eligible: "yes", img_free_used: String(FREE_IMAGES_PER_CAREER), img_paid_credits: "3" });
  const res = await Promise.all(Array.from({ length: 20 }, () => reserveImageCredit(db, player(db.row.flags), "x@y.z")));
  ok(res.filter(Boolean).length === 3, `exactamente 3 reservas (${res.filter(Boolean).length})`);
  ok(Number(db.row.flags.img_paid_credits) === 0, "las compradas quedan en 0, no en negativo");
}

console.log("3) Sin cupo gratis (fuera de los 100 primeros) y sin compradas");
{
  const db = fakeSupabase({ free_tier_eligible: "no" });
  ok((await reserveImageCredit(db, player(db.row.flags), "x@y.z")) === null, "no se reserva nada");
}

console.log("4) Devolver el crédito si la foto no sale");
{
  const db = fakeSupabase({ free_tier_eligible: "yes", img_free_used: "2", img_paid_credits: "0" });
  const r = await reserveImageCredit(db, player(db.row.flags), "x@y.z");
  ok(Boolean(r) && db.row.flags.img_free_used === "3", "reservado: 3 gratis gastadas");
  await refundImageCredit(db, r);
  ok(db.row.flags.img_free_used === "2", "devuelto: otra vez 2");
  const db2 = fakeSupabase({ free_tier_eligible: "no", img_paid_credits: "1" });
  const r2 = await reserveImageCredit(db2, player(db2.row.flags), "x@y.z");
  await refundImageCredit(db2, r2);
  ok(db2.row.flags.img_paid_credits === "1", "una comprada reservada y devuelta vuelve a 1");
}

console.log("5) El dueño no gasta nada");
{
  const db = fakeSupabase({ free_tier_eligible: "no" });
  const r = await reserveImageCredit(db, player(db.row.flags), "danielhassanz@gmail.com");
  ok(r?.kind === "owner" && db.row.flags.img_paid_credits === undefined, "reserva de dueño, sin tocar el saldo");
}

if (fails) { console.log(`\n${fails} fallos`); process.exit(1); }
console.log("\nTodo bien");
