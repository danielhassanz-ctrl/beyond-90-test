import sharp from "sharp";
import { isTrustedImageUrl } from "@/lib/images/upload-guards";
import { measureText, textToPath, wrapByWidth } from "@/lib/images/textToPath";

/**
 * Tarjeta compartible del cierre de temporada montada como UNA imagen (la misma que dibuja SeasonRecapCard en
 * pantalla): la foto de acción a sangre, el nombre y la MEDIA enormes a la izquierda, y abajo el valor de mercado, el
 * patrimonio, la temporada, el club y las cifras de la temporada que se cierra. Se dibuja entera en código (SVG con el
 * texto convertido a rutas → sharp), sin IA y sin coste por imagen, y se guarda: así cada temporada conserva su foto
 * y sus cifras de entonces.
 */
export interface RecapCardInput {
  name: string;
  media: number;
  position: string;
  nation: string;
  age: number;
  club: string;
  seasonLabel: string;
  marketValue: string;
  /** Sin cifra (no se conoce el de aquel momento) no se enseña la casilla. */
  netWorth?: string;
  stats: { matches: number; goals: number; assists: number; titles: number; minutes: number };
  /** Foto resumen (URL). Sin ella, fondo oscuro con degradado. */
  photoUrl?: string | null;
  tagline?: string;
  /** Dirección del juego sin protocolo (getAppUrlLine). */
  linkLine?: string | null;
}

const W = 1080;
const H = 1440;
const GOLD = "#F5B740";
const clean = (s: string) => s.replace(/[^ -ɏ–—‘-”…¿¡€]/g, "").replace(/\s+/g, " ").trim();

async function loadPhoto(url: string | null | undefined): Promise<Buffer | null> {
  if (!isTrustedImageUrl(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** Una casilla con valor grande y etiqueta pequeña, centradas. */
function box(x: number, y: number, w: number, h: number, value: string, label: string, valueSize: number, labelSize: number): string {
  const v = clean(value);
  let size = valueSize;
  while (size > 22 && measureText(v, size) > w - 28) size -= 2;
  const l = clean(label).toUpperCase();
  let lsize = labelSize;
  while (lsize > 14 && measureText(l, lsize) > w - 20) lsize -= 1;
  return [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="#000" fill-opacity="0.58" stroke="#F5B740" stroke-opacity="0.32" stroke-width="2" />`,
    textToPath(v, { x: x + w / 2 - measureText(v, size) / 2, y: y + h * 0.5 + size * 0.1, fontSize: size, fill: "#FFFFFF", weight: 900 }),
    textToPath(l, { x: x + w / 2 - measureText(l, lsize) / 2, y: y + h - 22, fontSize: lsize, fill: "#F3D9A0" }),
  ].join("\n");
}

export async function composeRecapCard(input: RecapCardInput): Promise<Buffer> {
  const parts: string[] = [];
  const composites: { input: Buffer; left: number; top: number }[] = [];

  const raw = await loadPhoto(input.photoUrl);
  if (raw) {
    const photo = await sharp(raw).resize(W, H, { fit: "cover", position: "top" }).png().toBuffer();
    composites.push({ input: photo, left: 0, top: 0 });
  }

  // Cabecera
  parts.push(textToPath("BEYOND 90", { x: 56, y: 96, fontSize: 44, fill: GOLD, weight: 900 }));
  parts.push(textToPath(`TEMPORADA ${clean(input.seasonLabel)} CERRADA`, { x: 58, y: 134, fontSize: 24, fill: "#F3D9A0" }));

  // Nombre y media enormes, a la izquierda
  const nameLines = wrapByWidth(clean(input.name).toUpperCase(), 76, 640).slice(0, 2);
  let y = 330;
  for (const line of nameLines) {
    parts.push(textToPath(line, { x: 56, y, fontSize: 76, fill: "#FFFFFF", weight: 900 }));
    y += 84;
  }
  const mediaSize = 280;
  parts.push(textToPath(String(input.media), { x: 50, y: y + 210, fontSize: mediaSize, fill: GOLD, weight: 900 }));
  parts.push(textToPath("MEDIA", { x: 56 + measureText(String(input.media), mediaSize) + 18, y: y + 210, fontSize: 30, fill: "#F3D9A0" }));
  parts.push(textToPath(clean(input.position).toUpperCase(), { x: 56, y: y + 280, fontSize: 36, fill: "#FFFFFF", weight: 700 }));
  const sub = `${input.nation ? `${clean(input.nation).toUpperCase()} · ` : ""}${input.age} AÑOS`;
  parts.push(textToPath(sub, { x: 56, y: y + 326, fontSize: 30, fill: "#E5E5E5" }));

  // Cifras (de abajo arriba): enlace, temporada, valor/patrimonio/temporada/club
  const left = 48;
  const gap = 14;
  const innerW = W - left * 2;
  const link = clean(input.linkLine ?? "");
  const tag = clean(input.tagline ?? "");
  let by = H - 48;
  if (link || tag) {
    parts.push(`<rect x="${left}" y="${by - 96}" width="${innerW}" height="2" fill="#FFFFFF" fill-opacity="0.15" />`);
    if (link) parts.push(textToPath(link, { x: W / 2 - measureText(link, 28) / 2, y: by - 8, fontSize: 28, fill: "#F3D9A0", weight: 700 }));
    if (tag) parts.push(textToPath(tag, { x: W / 2 - measureText(tag, 26) / 2, y: by - 52, fontSize: 26, fill: "#D4D4D4" }));
    by -= 118;
  }
  const s = input.stats;
  const statRow: [string, string][] = [
    [String(s.matches), "Partidos"],
    [String(s.goals), "Goles"],
    [String(s.assists), "Asist."],
    [String(s.titles), "Títulos"],
    [s.minutes.toLocaleString("es"), "Minutos"],
  ];
  const sw = (innerW - gap * 4) / 5;
  const rowH = 118;
  by -= rowH;
  statRow.forEach(([v, l], i) => parts.push(box(left + i * (sw + gap), by, sw, rowH, v, l, 46, 20)));

  const infoRow: [string, string][] = [
    [input.marketValue, "Valor de mercado"],
    ...(input.netWorth ? ([[input.netWorth, "Patrimonio"]] as [string, string][]) : []),
    [input.seasonLabel, "Temporada"],
    [input.club, "Club"],
  ];
  const iw = (innerW - gap * (infoRow.length - 1)) / infoRow.length;
  by -= gap + rowH;
  infoRow.forEach(([v, l], i) => parts.push(box(left + i * (iw + gap), by, iw, rowH, v, l, 38, 18)));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="left" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.82"/><stop offset="0.6" stop-color="#000" stop-opacity="0.25"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
<linearGradient id="bottom" x1="0" y1="0" x2="0" y2="1"><stop offset="0.35" stop-color="#000" stop-opacity="0"/><stop offset="0.75" stop-color="#000" stop-opacity="0.78"/><stop offset="1" stop-color="#000" stop-opacity="1"/></linearGradient>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2A2110"/><stop offset="1" stop-color="#0B0B0D"/></linearGradient>
</defs>
${raw ? "" : `<rect width="${W}" height="${H}" fill="url(#bg)" />`}
<rect width="${W}" height="${H}" fill="url(#left)" />
<rect width="${W}" height="${H}" fill="url(#bottom)" />
<rect x="3" y="3" width="${W - 6}" height="${H - 6}" rx="36" fill="none" stroke="#F5B740" stroke-opacity="0.8" stroke-width="6" />
${parts.join("\n")}
</svg>`;

  // La foto va debajo de los degradados y los textos: se compone primero sobre un lienzo y encima el SVG.
  const overlay = await sharp(Buffer.from(svg)).png().toBuffer();
  const canvas = sharp({ create: { width: W, height: H, channels: 4, background: "#0B0B0D" } });
  return canvas.composite([...composites, { input: overlay, left: 0, top: 0 }]).png().toBuffer();
}
