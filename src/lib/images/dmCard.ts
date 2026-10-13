import sharp from "sharp";
import { measureText, textToPath, wrapByWidth } from "@/lib/images/textToPath";
import { getAppUrl } from "@/lib/constants";

/**
 * Captura falsa (pero creíble) de un chat de mensajes directos de Instagram:
 * ella escribe, tú contestas, ella responde. Se dibuja entera en código
 * (SVG con texto convertido a rutas → sharp), sin IA ni coste por imagen, y
 * es el "momento compartible" de los eventos de mensajes por redes.
 *
 * La fuente empaquetada no trae emojis: se descartan del texto antes de
 * dibujar en vez de dejar cuadraditos vacíos.
 */
export type DmPlatform = "instagram" | "tiktok" | "x";

const THEMES: Record<DmPlatform, { bg: string; her: string; mine: string[]; ring: string[]; status: string; placeholder: string; line: string }> = {
  instagram: { bg: "#000000", her: "#262626", mine: ["#7A3CFF", "#C2357F"], ring: ["#FEDA75", "#FA7E1E", "#D62976", "#962FBF"], status: "Activa hace 4 min", placeholder: "Enviar mensaje...", line: "#1C1C1E" },
  tiktok: { bg: "#121212", her: "#2F2F2F", mine: ["#FE2C55", "#E0123F"], ring: ["#25F4EE", "#25F4EE", "#FE2C55", "#FE2C55"], status: "Activa ahora", placeholder: "Enviar un mensaje...", line: "#222222" },
  x: { bg: "#000000", her: "#2F3336", mine: ["#1D9BF0", "#1A7FC7"], ring: ["#1D9BF0", "#1D9BF0", "#8ECDF8", "#8ECDF8"], status: "Te sigue", placeholder: "Iniciar un mensaje", line: "#2F3336" },
};

export interface DmCardInput {
  platform?: DmPlatform;
  name: string;
  handle: string;
  message: string;
  reply?: string;
  followUp?: string;
  /** Foto de ella: ruta de public/ ("/chicas/nerea.jpg") o URL. Sin ella, se dibuja la inicial. */
  avatar?: string;
  /** Tu foto (URL): con las dos, la cabecera lleva vuestras fotos solapadas. */
  playerPhoto?: string | null;
  /** Foto de los dos (la que haría un paparazzi): va grande ARRIBA y la conversación, debajo. */
  scenePhoto?: Buffer | null;
}

/** Descarga una imagen (ruta de public/ o URL); si falla, null y la tarjeta usa la inicial. */
async function loadImage(src: string | null | undefined): Promise<Buffer | null> {
  if (!src) return null;
  try {
    const url = /^https?:\/\//.test(src) ? src : `${getAppUrl() ?? "https://beyond-90.vercel.app"}${src}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/** La foto recortada en círculo, centrada arriba (donde suele estar la cara). */
async function circle(buf: Buffer, d: number): Promise<Buffer | null> {
  try {
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}" fill="#fff"/></svg>`);
    return await sharp(buf).resize(d, d, { fit: "cover", position: "top" }).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  } catch {
    return null;
  }
}

const W = 1080;
const H = 1350;
const FONT = 40;
const LINE = 54;
const PAD = 36;
const MAX_TEXT = 640;

const clean = (s: string) => s.replace(/[^ -ɏ–—‘-”…¿¡]/g, "").replace(/\s+/g, " ").trim();

interface Metrics {
  font: number;
  line: number;
  pad: number;
  max: number;
}
const NORMAL: Metrics = { font: FONT, line: LINE, pad: PAD, max: MAX_TEXT };

function bubble(text: string, side: "left" | "right", y: number, theme: (typeof THEMES)[DmPlatform], m: Metrics = NORMAL): { svg: string; height: number } {
  const lines = wrapByWidth(clean(text), m.font, m.max);
  const widest = Math.max(...lines.map((l) => measureText(l, m.font)));
  const bw = Math.ceil(widest) + m.pad * 2;
  const bh = lines.length * m.line + m.pad * 1.1;
  const x = side === "left" ? 48 : W - 48 - bw;
  const fill = side === "left" ? theme.her : "url(#mine)";
  const paths = lines
    .map((l, i) => textToPath(l, { x: x + m.pad, y: y + m.pad * 0.75 + m.font + i * m.line - 6, fontSize: m.font, fill: "#FFFFFF" }))
    .join("\n");
  return { svg: `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${Math.round(m.font * 1.1)}" fill="${fill}" />\n${paths}`, height: bh };
}

/** Alto que ocupa la conversación con estas medidas (para elegir el tamaño de letra que cabe). */
function chatHeight(input: DmCardInput, theme: (typeof THEMES)[DmPlatform], m: Metrics): number {
  let h = 44 + bubble(input.message, "left", 0, theme, m).height + 22;
  if (input.reply) h += bubble(input.reply, "right", 0, theme, m).height + 14;
  h += input.followUp ? 56 + bubble(input.followUp, "left", 0, theme, m).height : 40;
  return h;
}

export async function composeDmCard(input: DmCardInput): Promise<Buffer> {
  const name = clean(input.name);
  const theme = THEMES[input.platform ?? "instagram"];
  const initial = (name[0] ?? "?").toUpperCase();
  const [avatarRaw, playerRaw] = await Promise.all([loadImage(input.avatar), loadImage(input.playerPhoto)]);
  const avatar = avatarRaw ? await circle(avatarRaw, 86) : null;
  const mePhoto = playerRaw ? await circle(playerRaw, 86) : null;
  const composites: { input: Buffer; left: number; top: number }[] = [];
  const parts: string[] = [];

  // Con foto de los dos arriba, la cabecera del chat baja debajo de la foto (oy) y el texto se hace algo más pequeño.
  const SCENE_H = 470;
  const hasScene = Boolean(input.scenePhoto);
  const oy = hasScene ? SCENE_H : 0;
  if (hasScene && input.scenePhoto) {
    const photo = await sharp(input.scenePhoto).resize(W, SCENE_H, { fit: "cover", position: "attention" }).png().toBuffer();
    composites.push({ input: photo, left: 0, top: 0 });
    // degradado hacia el negro en el borde inferior de la foto
    parts.push(`<rect x="0" y="${SCENE_H - 140}" width="${W}" height="140" fill="url(#fade)" />`);
  }

  // Cabecera: su foto y, si tenemos la tuya, las dos solapadas (como el avatar de un chat entre dos personas)
  parts.push(textToPath("<", { x: 44, y: 112 + oy, fontSize: 64, fill: "#FFFFFF", weight: 700 }));
  const ringAt = (cx: number) => `<circle cx="${cx}" cy="${92 + oy}" r="56" fill="url(#ring)" /><circle cx="${cx}" cy="${92 + oy}" r="49" fill="#000" />`;
  let textX = 262;
  if (avatar && mePhoto) {
    // la tuya detrás, la de ella delante
    parts.push(ringAt(236), ringAt(176));
    composites.push({ input: mePhoto, left: 236 - 43, top: 92 - 43 + oy }, { input: avatar, left: 176 - 43, top: 92 - 43 + oy });
    textX = 320;
  } else {
    parts.push(ringAt(176));
    if (avatar) {
      composites.push({ input: avatar, left: 176 - 43, top: 92 - 43 + oy });
    } else {
      parts.push(`<circle cx="176" cy="${92 + oy}" r="43" fill="#3A3A3C" />`);
      parts.push(textToPath(initial, { x: 176 - measureText(initial, 46) / 2, y: 108 + oy, fontSize: 46, fill: "#FFFFFF", weight: 700 }));
    }
  }
  parts.push(textToPath(name, { x: textX, y: 88 + oy, fontSize: 38, fill: "#FFFFFF", weight: 700 }));
  parts.push(textToPath(`${clean(input.handle)} · ${theme.status}`, { x: textX, y: 130 + oy, fontSize: 28, fill: "#8E8E93" }));
  parts.push(`<rect x="0" y="${170 + oy}" width="${W}" height="2" fill="${theme.line}" />`);

  // Tamaño de letra: el normal si cabe; con foto arriba, el mayor que quepa antes de la barra de escribir
  const barY = hasScene ? 1250 : 1190;
  const room = barY - (250 + oy) - 24;
  let metrics = NORMAL;
  if (hasScene) {
    metrics = { font: 30, line: 41, pad: 28, max: 760 };
    for (const font of [34, 32, 30, 28, 26, 24]) {
      const m = { font, line: Math.round(font * 1.35), pad: Math.round(font * 0.85), max: 780 };
      if (chatHeight(input, theme, m) <= room) { metrics = m; break; }
      metrics = m;
    }
  }

  let y = 250 + oy;
  // Conversación
  parts.push(textToPath("HOY 23:41", { x: W / 2 - measureText("HOY 23:41", 26) / 2, y, fontSize: 26, fill: "#8E8E93" }));
  y += 44;
  const her = bubble(input.message, "left", y, theme, metrics);
  parts.push(her.svg);
  y += her.height + 22;
  if (input.reply) {
    const mine = bubble(input.reply, "right", y, theme, metrics);
    parts.push(mine.svg);
    y += mine.height + 14;
  }
  if (input.followUp) {
    parts.push(textToPath("Visto", { x: W - 48, y: y + 24, fontSize: 24, fill: "#8E8E93", anchor: "right" }));
    y += 56;
    const again = bubble(input.followUp, "left", y, theme, metrics);
    parts.push(again.svg);
  } else {
    parts.push(textToPath("Visto", { x: W - 48, y: y + 24, fontSize: 24, fill: "#8E8E93", anchor: "right" }));
  }

  // Barra de escribir
  parts.push(`<rect x="40" y="${barY}" width="${W - 80}" height="96" rx="48" fill="none" stroke="${theme.line}" stroke-width="2.5" />`);
  parts.push(textToPath(theme.placeholder, { x: 84, y: barY + 58, fontSize: 34, fill: "#8E8E93" }));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="mine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.mine[0]}"/><stop offset="1" stop-color="${theme.mine[1]}"/></linearGradient>
<linearGradient id="ring" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${theme.ring[0]}"/><stop offset="0.4" stop-color="${theme.ring[1]}"/><stop offset="0.7" stop-color="${theme.ring[2]}"/><stop offset="1" stop-color="${theme.ring[3]}"/></linearGradient>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="1"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="${theme.bg}" />
${parts.join("\n")}
</svg>`;

  const base = sharp(Buffer.from(svg));
  return (composites.length ? base.composite(composites) : base).png().toBuffer();
}
