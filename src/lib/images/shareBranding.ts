import sharp from "sharp";
import { getAppUrlLine } from "@/lib/constants";
import { textToPath } from "@/lib/images/textToPath";

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

  const wordmarkPath = textToPath("BEYOND 90", {
    x: padding,
    y: height - barHeight * 0.62,
    fontSize: wordmarkSize,
    fill: "#F5B740",
    weight: 900,
    letterSpacing: 0.02,
  });
  const taglinePath = textToPath(tagline, {
    x: padding,
    y: height - barHeight * 0.62 + taglineSize + 6,
    fontSize: taglineSize,
    fill: "#FFFFFF",
    weight: 600,
  });
  const linkPath = linkLine
    ? textToPath(linkLine, {
        x: padding,
        y: height - barHeight * 0.62 + taglineSize + linkSize + 16,
        fontSize: linkSize,
        fill: "#F5B740",
        weight: 700,
      })
    : "";

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
  ${wordmarkPath}
  ${taglinePath}
  ${linkPath}
</svg>`;

  return image
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
