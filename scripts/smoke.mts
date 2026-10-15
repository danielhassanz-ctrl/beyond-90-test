/**
 * PRUEBA DE HUMO de la web desplegada: comprueba, sin iniciar sesión, que lo esencial responde y que las rutas protegidas siguen
 * protegidas. No juega ninguna partida (eso lo cubren los tests con el motor). Uso:
 *   SMOKE_URL=https://beyond-90.vercel.app npx tsx scripts/smoke.mts
 * Sale con código 1 si algo falla (para el aviso de GitHub Actions).
 */
const BASE = (process.env.SMOKE_URL ?? "https://beyond-90.vercel.app").replace(/\/$/, "");
const SLOW_MS = 4000;

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };

async function get(path: string, init: RequestInit = {}) {
  const t0 = Date.now();
  const res = await fetch(BASE + path, { redirect: "manual", ...init });
  return { res, ms: Date.now() - t0, text: res.status < 300 ? await res.text() : "" };
}

console.log(`Prueba de humo contra ${BASE}`);

console.log("1) Páginas públicas");
for (const path of ["/", "/login", "/legal/privacidad", "/legal/terminos"]) {
  const { res, ms } = await get(path);
  ok(res.status === 200, `${path} responde 200 (${res.status}) en ${ms} ms`);
  ok(ms < SLOW_MS, `${path} no tarda más de ${SLOW_MS / 1000} s`);
}
const home = await get("/");
ok(/Beyond 90/.test(home.text), "la portada se llama Beyond 90");
ok(!/Conviértete en Leyenda/i.test(home.text), "no queda el nombre antiguo del juego");

console.log("2) Las rutas de juego exigen sesión");
for (const path of ["/carrera", "/mi-jugador", "/crear-jugador", "/mi-jugador/patrimonio", "/mi-jugador/fotos"]) {
  const { res } = await get(path);
  const loc = res.headers.get("location") ?? "";
  ok(res.status >= 300 && res.status < 400 && /\/login/.test(loc), `${path} sin sesión redirige a /login (${res.status} ${loc})`);
}

console.log("3) El webhook de pagos rechaza lo que no viene firmado por Stripe");
{
  const { res } = await get("/api/stripe/webhook", { method: "POST", body: "{}", headers: { "content-type": "application/json" } });
  ok(res.status === 400 || res.status === 503, `POST sin firma → ${res.status} (400 firma inválida o 503 no configurado), nunca 200`);
}

console.log("4) Recursos y cabeceras");
{
  const { res } = await get("/robots.txt");
  ok(res.status === 200, "robots.txt responde");
  const manifest = await get("/manifest.webmanifest");
  ok(manifest.res.status === 200, "el manifest de la app responde");
  const h = home.res.headers;
  ok(Boolean(h.get("x-content-type-options")) || Boolean(h.get("strict-transport-security")), "cabeceras de seguridad presentes");
}

console.log("5) Región de las funciones (cerca de la base de datos)");
{
  const id = home.res.headers.get("x-vercel-id") ?? "";
  ok(/dub1|lhr1|cdg1|fra1/.test(id), `las funciones corren en Europa (${id})`);
}

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
