/** Prueba sin IA: la segunda foto de referencia se suma a la principal y el modelo recibe las dos. */
import { photoRefs, splitRefs } from "../src/lib/images/photo-refs";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { fails++; console.log("  ✗ " + m); } else console.log("  ✓ " + m); };

ok(photoRefs({ photo_url: "https://x/a.jpg", flags: {} }) === "https://x/a.jpg", "sin segunda foto, solo la principal");
ok(photoRefs({ photo_url: "https://x/a.jpg", flags: { photo_ref2: "https://x/b.jpg" } }) === "https://x/a.jpg|https://x/b.jpg", "con segunda foto, las dos");
ok(photoRefs({ photo_url: null, flags: { photo_ref2: "https://x/b.jpg" } }) === "", "sin foto principal no se genera nada (no se usa solo la segunda)");
ok(photoRefs({ photo_url: "https://x/a.jpg", flags: null }) === "https://x/a.jpg", "sin banderas no rompe");
ok(photoRefs({ photo_url: "https://x/a.jpg", flags: { photo_ref2: true } }) === "https://x/a.jpg", "una bandera mal formada se ignora");
ok(splitRefs("https://x/a.jpg|https://x/b.jpg").length === 2 && splitRefs("https://x/a.jpg").length === 1 && splitRefs("").length === 0, "se separan bien las URLs");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
