import sharp from "sharp";
import { getAppUrlLine } from "@/lib/constants";

/**
 * Compone la portada "WARCA" (parodia ficticia de un diario deportivo,
 * inspirada en los colores de la prensa deportiva española — no es un
 * logo ni una plantilla real de ningún periódico, nombre y diseño
 * originales) para el gol de chilena.
 *
 * El titular y el nombre se dibujan con código (SVG → sharp), no con IA:
 * así el texto sale SIEMPRE legible — evita el problema visto con Flux
 * Kontext Pro, que a veces generaba texto de patrocinador ilegible en
 * las camisetas al intentar "dibujar" letras dentro de la imagen.
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * librsvg (el motor que usa sharp para rasterizar SVG) no soporta bien
 * `<foreignObject>` con HTML dentro — el texto simplemente no aparece.
 * Por eso el ajuste de línea se hace a mano aquí, partiendo por palabras
 * y devolviendo <tspan> con saltos de línea reales en SVG puro.
 */
function wrapTextToTspans(text: string, maxCharsPerLine: number, x: number, lineHeight: number): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  return lines
    .map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
}

export async function composeWarcaCover(
  actionPhoto: Buffer,
  playerName: string,
  club: string,
): Promise<Buffer> {
  const WIDTH = 1080;
  const HEIGHT = 1350;
  const MASTHEAD_HEIGHT = 160;

  const photo = await sharp(actionPhoto)
    .resize(WIDTH, HEIGHT - MASTHEAD_HEIGHT, { fit: "cover", position: "attention" })
    .toBuffer();

  const today = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
  const headline = "¡GOLAZO DE CHILENA!";
  const byline = `${playerName.toUpperCase()} FIRMA UNA OBRA DE ARTE CON EL ${club.toUpperCase()}`;
  // Antes solo decía "Beyond 90" sin ningún sitio al que ir a jugar — la
  // portada podía llegar a compartirse sin acompañar ningún texto (ver
  // shareBranding.ts) y quien la recibía no tenía forma de encontrar el juego.
  const linkLine = getAppUrlLine();
  const brandLine = linkLine ? `Beyond 90 · ${linkLine}` : "Beyond 90";

  const overlaySvg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.92" />
    </linearGradient>
  </defs>

  <!-- Masthead: fondo blanco, letras rojas — estilo prensa deportiva española -->
  <rect x="0" y="0" width="${WIDTH}" height="${MASTHEAD_HEIGHT}" fill="#FFFFFF" />
  <text x="40" y="${MASTHEAD_HEIGHT / 2 + 34}" font-family="Georgia, 'Times New Roman', serif" font-weight="900" font-size="96" font-style="italic" fill="#E30613" letter-spacing="1">WARCA</text>
  <text x="${WIDTH - 40}" y="${MASTHEAD_HEIGHT / 2 + 34}" font-family="Arial, sans-serif" font-weight="700" font-size="22" fill="#333333" text-anchor="end">EDICIÓN ESPECIAL</text>
  <rect x="0" y="${MASTHEAD_HEIGHT - 8}" width="${WIDTH}" height="8" fill="#E30613" />

  <!-- Degradado inferior para que el titular se lea sobre la foto -->
  <rect x="0" y="${MASTHEAD_HEIGHT}" width="${WIDTH}" height="${HEIGHT - MASTHEAD_HEIGHT}" fill="url(#fade)" />

  <!-- Titular -->
  <text x="40" y="${HEIGHT - 230}" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="64" fill="#FFFFFF">${escapeXml(headline)}</text>

  <!-- Bajada (ajuste de línea manual: foreignObject con HTML no renderiza en librsvg) -->
  <text x="40" y="${HEIGHT - 170}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="32" fill="#F5B740">${wrapTextToTspans(byline, 34, 40, 40)}</text>

  <!-- Fecha -->
  <rect x="0" y="${HEIGHT - 46}" width="${WIDTH}" height="46" fill="#111111" />
  <text x="40" y="${HEIGHT - 15}" font-family="Arial, sans-serif" font-weight="600" font-size="24" fill="#FFFFFF">${escapeXml(today)}</text>
  <text x="${WIDTH - 40}" y="${HEIGHT - 15}" font-family="Arial, sans-serif" font-weight="600" font-size="24" fill="#FFFFFF" text-anchor="end">${escapeXml(brandLine)}</text>
</svg>`;

  return sharp({
    create: { width: WIDTH, height: HEIGHT, channels: 3, background: "#000000" },
  })
    .composite([
      { input: photo, top: MASTHEAD_HEIGHT, left: 0 },
      { input: Buffer.from(overlaySvg), top: 0, left: 0 },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}
