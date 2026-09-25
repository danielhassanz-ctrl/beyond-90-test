import path from "path";
import TextToSVG from "text-to-svg";

/**
 * Todo el texto que se compone sobre imágenes (marca de compartir en
 * shareBranding.ts, portada WARCA en newspaper.ts) se dibujaba con SVG
 * `<text font-family="...">`, que en producción (Vercel serverless) falla
 * silenciosamente: `sharp`/librsvg necesitan `fontconfig` para resolver
 * "Arial"/"Helvetica"/"sans-serif" a una fuente real del sistema, y ese
 * sistema no tiene ningún fontconfig configurado ("Fontconfig error:
 * Cannot load default config file: File not found", visto en vivo en los
 * logs de producción). El fallo no siempre lanza una excepción capturable
 * a nivel de JS — a veces simplemente no dibuja el texto, o corta el
 * proceso de sharp a medias.
 *
 * La solución robusta es no depender de NINGUNA fuente del sistema en
 * tiempo de ejecución: convertir el texto a rutas vectoriales (`<path>`)
 * en el propio proceso, usando la fuente Geist (la misma que usa Next.js
 * para sus imágenes OG, MPL/OFL, ya incluida en node_modules) cargada
 * directamente desde el archivo .ttf empaquetado en este mismo proyecto.
 * Un `<path>` es geometría pura — no necesita resolución de fuentes en
 * absoluto, así que funciona igual en local que en cualquier serverless.
 */
let converter: TextToSVG | null = null;

function getConverter(): TextToSVG {
  if (!converter) {
    converter = TextToSVG.loadSync(path.join(process.cwd(), "src/lib/images/fonts/Geist-Regular.ttf"));
  }
  return converter;
}

export interface TextPathOptions {
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  /** Alineación horizontal respecto a x (default "left"). */
  anchor?: "left" | "right";
  /**
   * Solo hay una fuente (Geist Regular) empaquetada, así que el "grosor"
   * se simula redibujando el trazo del path más grueso en vez de depender
   * de una variante bold real — cuanto más alto, más "negrita" se ve.
   * 0 = sin engrosar (peso normal).
   */
  weight?: 400 | 600 | 700 | 900;
  letterSpacing?: number;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/** Genera un único `<path>` SVG para una línea de texto. */
export function textToPath(text: string, opts: TextPathOptions): string {
  const d = getConverter().getD(text, {
    x: opts.x,
    y: opts.y,
    fontSize: opts.fontSize,
    anchor: opts.anchor === "right" ? "right baseline" : "left baseline",
    letterSpacing: opts.letterSpacing,
  });

  const weight = opts.weight ?? 400;
  const strokeWidth = weight >= 900 ? opts.fontSize * 0.045 : weight >= 700 ? opts.fontSize * 0.028 : weight >= 600 ? opts.fontSize * 0.016 : 0;
  const strokeAttrs = strokeWidth > 0 ? ` stroke="${escapeAttr(opts.fill)}" stroke-width="${strokeWidth.toFixed(2)}" stroke-linejoin="round"` : "";

  return `<path d="${d}" fill="${escapeAttr(opts.fill)}"${strokeAttrs} />`;
}

/**
 * Reparte un texto largo en varias líneas (por palabras, sin cortar
 * ninguna) y devuelve un `<path>` por línea — el equivalente en rutas de
 * lo que antes hacían los `<tspan>` con salto de línea manual.
 */
export function wrapTextToPaths(
  text: string,
  opts: TextPathOptions & { maxCharsPerLine: number; lineHeight: number },
): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > opts.maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  return lines.map((line, i) => textToPath(line, { ...opts, y: opts.y + i * opts.lineHeight })).join("\n  ");
}

/** Ancho en píxeles de una línea de texto con la fuente empaquetada. */
export function measureText(text: string, fontSize: number): number {
  return getConverter().getMetrics(text, { fontSize }).width;
}

/** Parte un texto en líneas que caben en maxWidth píxeles (por palabras). */
export function wrapByWidth(text: string, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const candidate = current ? current + " " + word : word;
    if (current && measureText(candidate, fontSize) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
