import sharp from "sharp";
import { getAppUrlLine } from "@/lib/constants";

/**
 * Marca de agua con el nombre del juego, la frase gancho del hito (ver
 * lib/shareTaglines.ts) y el enlace para jugar, impresa directamente
 * sobre CUALQUIER imagen que se comparta — tanto la foto generada por IA
 * como, más adelante, cualquier otra imagen del juego.
 *
 * Por qué en la propia imagen y no solo como texto que acompaña al
 * compartir (navigator.share({text})): cuando se comparte un archivo de
 * imagen, muchos destinos (Instagram Stories entre los más usados,
 * capturas reenviadas, descargas) IGNORAN por completo ese texto — solo
 * llega el PNG. Sin la marca dentro de la imagen, la mitad de las veces
 * que se comparte un hito, quien lo recibe no tiene ni idea de qué juego
 * es ni dónde jugarlo. Igual que composeWarcaCover (newspaper.ts), el
 * texto se dibuja con SVG → sharp en vez de pedírselo a la IA, para que
 * salga siempre legible.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function addShareBranding(photo: Buffer, tagline: string): Promise<Buffer> {
  const image = sharp(photo);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;

  const linkLine = getAppUrlLine();

  const barHeight = Math.round(height * 0.13);
  const wordmarkSize = Math.round(barHeight * 0.34);
  const taglineSize = Math.round(barHeight * 0.22);
  const linkSize = Math.round(barHeight * 0.18);
  const padding = Math.round(width * 0.045);

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="footerFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0" />
      <stop offset="55%" stop-color="#000000" stop-opacity="0.75" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.92" />
    </linearGradient>
  </defs>
  <rect x="0" y="${height - barHeight}" width="${width}" height="${barHeight}" fill="url(#footerFade)" />
  <text x="${padding}" y="${height - barHeight * 0.62}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="${wordmarkSize}" fill="#F5B740" letter-spacing="1">BEYOND 90</text>
  <text x="${padding}" y="${height - barHeight * 0.62 + taglineSize + 6}" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="${taglineSize}" fill="#FFFFFF">${escapeXml(tagline)}</text>
  ${
    linkLine
      ? `<text x="${padding}" y="${height - barHeight * 0.62 + taglineSize + linkSize + 16}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="${linkSize}" fill="#F5B740">${escapeXml(linkLine)}</text>`
      : ""
  }
</svg>`;

  return image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
