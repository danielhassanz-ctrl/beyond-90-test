/**
 * Genera las caras de las chicas que te escriben por Instagram/TikTok (personajes ficticios).
 * Solo texto -> imagen: nunca se parte de una foto de nadie, así que las caras no existen.
 *
 * Uso (HACE LLAMADAS REALES A REPLICATE Y CUESTA DINERO; ver MODEL):
 *   DRY=1 npx tsx scripts/gen-chicas.mts                 -> solo enseña los 28 prompts, no gasta nada
 *   MODEL=flux  npx tsx scripts/gen-chicas.mts           -> flux-schnell (barato, ~0,003 US$/imagen, estimación)
 *   MODEL=nano  npx tsx scripts/gen-chicas.mts           -> nano-banana-pro (más realista, ~0,14 €/imagen, estimación)
 *   ONLY=5,6 ...                                         -> regenerar solo algunas
 * Las imágenes se guardan en public/chicas/NN.png
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const env = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
const token = process.env.REPLICATE_API_TOKEN ?? env.match(/^REPLICATE_API_TOKEN=(.+)$/m)?.[1]?.trim();

interface Chica {
  n: number;
  /** Arquetipo corto, para el personaje. */
  rol: string;
  /** Descripción física y de escena, sin referencias a nadie real. */
  look: string;
}

const CHICAS: Chica[] = [
  { n: 1, rol: "actriz en alfombra roja", look: "a woman in her mid 20s, long dark brown hair swept into a sleek high bun, thick defined brows, brown eyes, matte red lipstick, elegant red asymmetric gown, red carpet event, shallow depth of field" },
  { n: 2, rol: "influencer rubia platino", look: "a woman in her late 20s, very long straight platinum blonde hair with darker roots, hazel eyes, glossy nude lips, strapless brown leather top, bright event backdrop" },
  { n: 3, rol: "madura elegante", look: "a woman in her early 40s, wavy sandy blonde hair pinned back loosely, light blue-green eyes, warm genuine smile, large gold chain earrings, bright garden terrace" },
  { n: 4, rol: "chica de Cannes", look: "a woman in her mid 20s, long wavy honey blonde hair with highlights, green eyes, freckles, soft pink lips, sparkling jeweled halter gown, outdoor festival crowd blurred behind" },
  { n: 5, rol: "influencer de viajes", look: "a woman in her early 20s, very long wavy chestnut hair with caramel highlights, brown eyes, light blue denim outfit, small light blue shoulder bag, delicate necklace, sunlit white wall, phone-camera selfie look" },
  { n: 6, rol: "deportista", look: "a woman in her mid 20s, black hair in a high ponytail, olive skin, athletic build, white sports top, natural light, gym entrance, confident smile" },
  { n: 7, rol: "estudiante de medicina", look: "a woman in her early 20s, dark brown shoulder-length hair, round glasses, soft smile, cozy beige knit sweater, university library background" },
  { n: 8, rol: "DJ", look: "a woman in her late 20s, short platinum pixie cut, silver hoop earrings, black leather jacket, neon-lit club backdrop, direct gaze" },
  { n: 9, rol: "chica de barrio", look: "a woman in her early 20s, long straight black hair, brown eyes, simple gold hoop earrings, grey hoodie, evening street with warm lights" },
  { n: 10, rol: "periodista deportiva", look: "a woman in her late 20s, chestnut bob haircut, brown eyes, navy blazer, microphone out of focus, stadium tunnel background, professional smile" },
  { n: 11, rol: "modelo morena", look: "a woman in her mid 20s, long loose dark waves, tanned skin, brown eyes, white linen shirt, beach club terrace, golden hour" },
  { n: 12, rol: "pelirroja", look: "a woman in her mid 20s, long copper-red wavy hair, green eyes, freckles, black dress, candle-lit restaurant" },
  { n: 13, rol: "cantante indie", look: "a woman in her mid 20s, messy dark brown hair with curtain bangs, no heavy makeup, vintage band t-shirt, small stage backdrop" },
  { n: 14, rol: "dueña de una boutique", look: "a woman in her early 30s, wavy light brown hair, elegant cream blouse, light makeup, bright shop interior with plants" },
  { n: 15, rol: "tenista", look: "a woman in her early 20s, blonde hair in a braid, tanned skin, white tennis outfit, visor in hand, clay court background, natural smile" },
  { n: 16, rol: "chica latina simpática", look: "a woman in her mid 20s, long curly dark hair, warm brown skin, bright smile, yellow summer top, street cafe terrace" },
  { n: 17, rol: "abogada", look: "a woman in her late 20s, dark hair in a low bun, minimal makeup, charcoal blazer, glass office background, composed expression" },
  { n: 18, rol: "streamer", look: "a woman in her early 20s, long straight dark hair with a pastel streak, soft ring light reflection in her eyes, oversized headphones around her neck, cozy room with LED lights" },
  { n: 19, rol: "chef", look: "a woman in her late 20s, auburn hair tied back, chef's white jacket, flushed cheeks, warm restaurant kitchen light, friendly grin" },
  { n: 20, rol: "bailarina", look: "a woman in her early 20s, dark hair in a tight ballerina bun, slender, black practice leotard under a light cardigan, studio with mirrors" },
  { n: 21, rol: "heredera sofisticada", look: "a woman in her late 20s, sleek straight dark brown hair parted in the middle, minimal gold jewelry, black silk dress, luxurious hotel lobby" },
  { n: 22, rol: "surfista", look: "a woman in her mid 20s, sun-bleached wavy blonde hair, sun-kissed skin, light freckles, loose white shirt over swimsuit, beach at sunset" },
  { n: 23, rol: "presentadora de TV", look: "a woman in her early 30s, glossy brown hair in loose curls, bright blue dress, TV studio lights soft background, polished makeup" },
  { n: 24, rol: "nutricionista", look: "a woman in her late 20s, light brown wavy hair, healthy glow, green blouse, bright kitchen with fruit, friendly open smile" },
  { n: 25, rol: "artista", look: "a woman in her mid 20s, short dark curly hair, bold earrings, paint-stained denim jacket, art studio with canvases behind" },
  { n: 26, rol: "piloto", look: "a woman in her late 20s, dark hair in a neat ponytail, aviator sunglasses pushed up on her head, white uniform shirt, airport apron at golden hour" },
  { n: 27, rol: "fan de siempre", look: "a woman in her early 20s, brown hair with a side braid, face lightly painted with team colors, scarf around her neck, cheerful expression, stadium stands blurred behind" },
  { n: 28, rol: "mujer de negocios", look: "a woman in her early 30s, honey-blonde straight hair, light makeup, tailored white suit, modern city rooftop, confident half smile" },
];

const BASE = "Photorealistic portrait photo, natural skin texture, shot on a high-end camera, not a real identifiable person, no text, no logos";

async function generate(prompt: string, model: "flux" | "nano"): Promise<Buffer | null> {
  const slug = model === "flux" ? "black-forest-labs/flux-schnell" : "google/nano-banana-pro";
  const input = model === "flux" ? { prompt, aspect_ratio: "3:4", output_format: "png", num_outputs: 1 } : { prompt, aspect_ratio: "3:4", output_format: "png" };
  const res = await fetch(`https://api.replicate.com/v1/models/${slug}/predictions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Prefer: "wait=60" },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    console.error("HTTP", res.status, (await res.text()).slice(0, 300));
    return null;
  }
  let data: any = await res.json();
  for (let i = 0; i < 40 && data.status !== "succeeded" && data.status !== "failed" && data.status !== "canceled"; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    data = await (await fetch(data.urls.get, { headers: { Authorization: `Bearer ${token}` } })).json();
  }
  if (data.status !== "succeeded") {
    console.error("falló:", data.status, data.error);
    return null;
  }
  const url = Array.isArray(data.output) ? data.output[0] : data.output;
  return Buffer.from(await (await fetch(url)).arrayBuffer());
}

const only = process.env.ONLY ? new Set(process.env.ONLY.split(",").map(Number)) : null;
const list = CHICAS.filter((c) => !only || only.has(c.n));

if (process.env.DRY) {
  for (const c of list) console.log(`${String(c.n).padStart(2, "0")} · ${c.rol}\n   ${BASE}. ${c.look}\n`);
  console.log(`${list.length} imágenes. No se ha llamado a ninguna API.`);
  process.exit(0);
}

const model = process.env.MODEL === "nano" ? "nano" : process.env.MODEL === "flux" ? "flux" : null;
if (!model) {
  console.error("Indica MODEL=flux o MODEL=nano (o DRY=1 para ver los prompts sin gastar).");
  process.exit(1);
}
if (!token) {
  console.error("Falta REPLICATE_API_TOKEN.");
  process.exit(1);
}
mkdirSync("public/chicas", { recursive: true });
let ok = 0;
for (const c of list) {
  const buf = await generate(`${BASE}. ${c.look}`, model);
  if (!buf) continue;
  writeFileSync(join("public/chicas", `${String(c.n).padStart(2, "0")}.png`), buf);
  ok++;
  console.log(`✓ ${c.n} ${c.rol}`);
}
console.log(`Generadas ${ok}/${list.length} con ${model}.`);
