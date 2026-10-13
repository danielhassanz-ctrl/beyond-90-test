/** Prueba sin IA: la tarjeta de resumen de temporada se monta como una sola imagen (con y sin foto). */
import sharp from "sharp";
import { composeRecapCard } from "../src/lib/images/recapCard";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fails++; };

const base = {
  name: "Dani Hassan", media: 91, position: "Delantero", nation: "España", age: 21, club: "Liverpool FC", seasonLabel: "2030/31",
  marketValue: "44 M€", netWorth: "6,35 M€", stats: { matches: 38, goals: 27, assists: 9, titles: 2, minutes: 3120 },
  tagline: "Así cerré la temporada. ¿Cómo vas tú?", linkLine: "beyond-90.vercel.app",
};
const sinFoto = await composeRecapCard(base);
const meta = await sharp(sinFoto).metadata();
ok(meta.width === 1080 && meta.height === 1440 && meta.format === "png", `sin foto: PNG ${meta.width}×${meta.height}`);
const largo = await composeRecapCard({ ...base, name: "Cristian Alexander Fernández de la Torre", club: "Brighton & Hove Albion", netWorth: "-1.234.567 €", photoUrl: "http://localhost:1/no-existe.png" });
ok((await sharp(largo).metadata()).height === 1440, "nombre largo, club largo y foto que no carga: no revienta");

console.log(fails ? `\nFALLOS: ${fails}` : "\nTODO OK");
process.exit(fails ? 1 : 0);
