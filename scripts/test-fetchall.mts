/** Prueba: el lector paginado devuelve TODAS las filas aunque la API corte cada respuesta en 1.000. */
import { fetchAllRows } from "../src/lib/supabase/fetchAll";
const TOTAL = 2503;
const rows = Array.from({ length: TOTAL }, (_, i) => ({ id: i }));
let calls = 0;
const api = (from: number, to: number) => { calls++; return Promise.resolve({ data: rows.slice(from, Math.min(to, from + 999) + 1), error: null }); };
const { data, error } = await fetchAllRows<{ id: number }>(api);
const unique = new Set(data.map((r) => r.id)).size;
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };
ok(!error, "sin error");
ok(data.length === TOTAL && unique === TOTAL, `lee las ${TOTAL} filas sin huecos ni duplicados (${data.length}/${unique})`);
ok(calls === 3, `3 páginas (${calls})`);
const exact = await fetchAllRows<{ id: number }>((f, t) => Promise.resolve({ data: rows.slice(f, Math.min(t, 1999) + 1).filter((r) => r.id < 2000), error: null }));
ok(exact.data.length === 2000, `justo 2.000 filas (múltiplo de la página) también termina (${exact.data.length})`);
const failing = await fetchAllRows<{ id: number }>((f) => Promise.resolve(f === 0 ? { data: rows.slice(0, 1000), error: null } : { data: null, error: { message: "boom" } }));
ok(failing.error?.message === "boom" && failing.data.length === 1000, "un error a mitad se devuelve sin perder lo leído");
console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
