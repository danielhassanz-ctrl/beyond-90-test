import sharp from "sharp";
import { getAppUrlLine } from "@/lib/constants";
import { textToPath, wrapTextToPaths } from "@/lib/images/textToPath";

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

  // Sin fuente serif/itálica empaquetada, "WARCA" se dibuja con la misma
  // Geist Regular que el resto, compensando el aspecto de titular de
  // prensa con más tamaño, trazo engrosado (weight 900) y letterspacing.
  const mastheadPath = textToPath("WARCA", {
    x: 40,
    y: MASTHEAD_HEIGHT / 2 + 34,
    fontSize: 92,
    fill: "#E30613",
    weight: 900,
    letterSpacing: 0.03,
  });
  const editionPath = textToPath("EDICIÓN ESPECIAL", {
    x: WIDTH - 40,
    y: MASTHEAD_HEIGHT / 2 + 34,
    fontSize: 22,
    fill: "#333333",
    weight: 700,
    anchor: "right",
  });
  const headlinePath = textToPath(headline, {
    x: 40,
    y: HEIGHT - 230,
    fontSize: 64,
    fill: "#FFFFFF",
    weight: 900,
  });
  const bylinePath = wrapTextToPaths(byline, {
    x: 40,
    y: HEIGHT - 170,
    fontSize: 32,
    fill: "#F5B740",
    weight: 700,
    maxCharsPerLine: 34,
    lineHeight: 40,
  });
  const todayPath = textToPath(today, {
    x: 40,
    y: HEIGHT - 15,
    fontSize: 24,
    fill: "#FFFFFF",
    weight: 600,
  });
  const brandPath = textToPath(brandLine, {
    x: WIDTH - 40,
    y: HEIGHT - 15,
    fontSize: 24,
    fill: "#FFFFFF",
    weight: 600,
    anchor: "right",
  });

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
  ${mastheadPath}
  ${editionPath}
  <rect x="0" y="${MASTHEAD_HEIGHT - 8}" width="${WIDTH}" height="8" fill="#E30613" />

  <!-- Degradado inferior para que el titular se lea sobre la foto -->
  <rect x="0" y="${MASTHEAD_HEIGHT}" width="${WIDTH}" height="${HEIGHT - MASTHEAD_HEIGHT}" fill="url(#fade)" />

  <!-- Titular -->
  ${headlinePath}

  <!-- Bajada -->
  ${bylinePath}

  <!-- Fecha -->
  <rect x="0" y="${HEIGHT - 46}" width="${WIDTH}" height="46" fill="#111111" />
  ${todayPath}
  ${brandPath}
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
