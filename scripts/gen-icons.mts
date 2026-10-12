/**
 * Genera los iconos de la app (PWA / pantalla de inicio) en public/. Sin red ni coste: dibuja un SVG con `sharp`.
 * Uso: npx tsx scripts/gen-icons.mts
 */
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const svg = (size: number, pad: number) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2c85b"/>
      <stop offset="1" stop-color="#b98a2a"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="#0a0c10"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - pad}" fill="url(#g)"/>
  <text x="50%" y="53%" text-anchor="middle" dominant-baseline="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${Math.round(size * 0.36)}" fill="#0a0c10">B90</text>
</svg>`;

for (const [file, size, pad] of [
  ["public/icon-192.png", 192, 14],
  ["public/icon-512.png", 512, 36],
  ["public/apple-touch-icon.png", 180, 12],
] as const) {
  const png = await sharp(Buffer.from(svg(size, pad))).png().toBuffer();
  writeFileSync(file, png);
  console.log(`${file} · ${png.length} bytes`);
}
