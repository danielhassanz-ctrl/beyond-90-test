import sharp from "sharp";
import { measureText, textToPath, wrapByWidth } from "@/lib/images/textToPath";

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
}

const W = 1080;
const H = 1350;
const FONT = 40;
const LINE = 54;
const PAD = 36;
const MAX_TEXT = 640;

const clean = (s: string) => s.replace(/[^ -ɏ–—‘-”…¿¡]/g, "").replace(/\s+/g, " ").trim();

function bubble(text: string, side: "left" | "right", y: number, theme: (typeof THEMES)[DmPlatform]): { svg: string; height: number } {
  const lines = wrapByWidth(clean(text), FONT, MAX_TEXT);
  const widest = Math.max(...lines.map((l) => measureText(l, FONT)));
  const bw = Math.ceil(widest) + PAD * 2;
  const bh = lines.length * LINE + PAD * 1.1;
  const x = side === "left" ? 48 : W - 48 - bw;
  const fill = side === "left" ? theme.her : "url(#mine)";
  const paths = lines
    .map((l, i) => textToPath(l, { x: x + PAD, y: y + PAD * 0.75 + FONT + i * LINE - 6, fontSize: FONT, fill: "#FFFFFF" }))
    .join("\n");
  return { svg: `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="44" fill="${fill}" />\n${paths}`, height: bh };
}

export async function composeDmCard(input: DmCardInput): Promise<Buffer> {
  const name = clean(input.name);
  const theme = THEMES[input.platform ?? "instagram"];
  const initial = (name[0] ?? "?").toUpperCase();
  const parts: string[] = [];

  // Cabecera
  parts.push(textToPath("<", { x: 44, y: 112, fontSize: 64, fill: "#FFFFFF", weight: 700 }));
  parts.push(`<circle cx="176" cy="92" r="56" fill="url(#ring)" /><circle cx="176" cy="92" r="49" fill="#000" /><circle cx="176" cy="92" r="43" fill="#3A3A3C" />`);
  parts.push(textToPath(initial, { x: 176 - measureText(initial, 46) / 2, y: 108, fontSize: 46, fill: "#FFFFFF", weight: 700 }));
  parts.push(textToPath(name, { x: 262, y: 88, fontSize: 38, fill: "#FFFFFF", weight: 700 }));
  parts.push(textToPath(`${clean(input.handle)} · ${theme.status}`, { x: 262, y: 130, fontSize: 28, fill: "#8E8E93" }));
  parts.push(`<rect x="0" y="170" width="${W}" height="2" fill="${theme.line}" />`);

  // Conversación
  let y = 250;
  parts.push(textToPath("HOY 23:41", { x: W / 2 - measureText("HOY 23:41", 26) / 2, y, fontSize: 26, fill: "#8E8E93" }));
  y += 44;
  const her = bubble(input.message, "left", y, theme);
  parts.push(her.svg);
  y += her.height + 22;
  if (input.reply) {
    const mine = bubble(input.reply, "right", y, theme);
    parts.push(mine.svg);
    y += mine.height + 14;
  }
  if (input.followUp) {
    parts.push(textToPath("Visto", { x: W - 48, y: y + 24, fontSize: 24, fill: "#8E8E93", anchor: "right" }));
    y += 56;
    const again = bubble(input.followUp, "left", y, theme);
    parts.push(again.svg);
  } else {
    parts.push(textToPath("Visto", { x: W - 48, y: y + 24, fontSize: 24, fill: "#8E8E93", anchor: "right" }));
  }

  // Barra de escribir
  parts.push(`<rect x="40" y="1040" width="${W - 80}" height="96" rx="48" fill="none" stroke="${theme.line}" stroke-width="2.5" />`);
  parts.push(textToPath(theme.placeholder, { x: 84, y: 1098, fontSize: 34, fill: "#8E8E93" }));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<linearGradient id="mine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${theme.mine[0]}"/><stop offset="1" stop-color="${theme.mine[1]}"/></linearGradient>
<linearGradient id="ring" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${theme.ring[0]}"/><stop offset="0.4" stop-color="${theme.ring[1]}"/><stop offset="0.7" stop-color="${theme.ring[2]}"/><stop offset="1" stop-color="${theme.ring[3]}"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="${theme.bg}" />
${parts.join("\n")}
</svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}
