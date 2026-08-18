export interface CareerCardInput {
  headline: string;
  kicker: string;
  name: string;
  club: string;
  lines: { label: string; value: string }[];
  avatar: string | null;
}

const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Dibuja la Career Card vertical de Beyond 90 y devuelve un blob PNG. */
export async function renderCareerCard(input: CareerCardInput): Promise<Blob | null> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0a0a0b");
    bg.addColorStop(0.55, "#121316");
    bg.addColorStop(1, "#07120c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Marco dorado
    ctx.strokeStyle = "rgba(212,175,55,0.55)";
    ctx.lineWidth = 6;
    ctx.strokeRect(48, 48, W - 96, H - 96);

    // Avatar / retrato (sustituible en el futuro por imagen generada)
    const img = input.avatar ? await loadImage(input.avatar) : null;
    const cx = W / 2;
    const cy = 620;
    const r = 260;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (img) {
      const scale = Math.max((r * 2) / img.width, (r * 2) / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    } else {
      ctx.fillStyle = "#1c1d21";
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.fillStyle = "rgba(212,175,55,0.8)";
      ctx.font = "bold 180px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(input.name.slice(0, 1).toUpperCase(), cx, cy + 60);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(212,175,55,0.85)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(212,175,55,0.9)";
    ctx.font = "600 40px Helvetica, Arial, sans-serif";
    ctx.fillText("BEYOND 90", cx, 180);

    ctx.fillStyle = "#f5f5f4";
    ctx.font = "bold 78px Helvetica, Arial, sans-serif";
    wrap(ctx, input.headline.toUpperCase(), cx, 1010, W - 220, 88);

    ctx.fillStyle = "rgba(245,245,244,0.7)";
    ctx.font = "500 42px Helvetica, Arial, sans-serif";
    ctx.fillText(input.name, cx, 1170);
    ctx.fillStyle = "rgba(212,175,55,0.85)";
    ctx.font = "500 36px Helvetica, Arial, sans-serif";
    ctx.fillText(`${input.club} · ${input.kicker}`, cx, 1230);

    let y = 1360;
    for (const line of input.lines.slice(0, 5)) {
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(245,245,244,0.55)";
      ctx.font = "500 34px Helvetica, Arial, sans-serif";
      ctx.fillText(line.label.toUpperCase(), 150, y);
      ctx.textAlign = "right";
      ctx.fillStyle = "#f5f5f4";
      ctx.font = "bold 44px Helvetica, Arial, sans-serif";
      ctx.fillText(line.value, W - 150, y);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(150, y + 24);
      ctx.lineTo(W - 150, y + 24);
      ctx.stroke();
      y += 100;
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(245,245,244,0.35)";
    ctx.font = "500 32px Helvetica, Arial, sans-serif";
    ctx.fillText("Simulador narrativo de carrera · beyond90", cx, H - 120);

    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  } catch {
    return null;
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lh: number) {
  const words = text.split(" ");
  let line = "";
  let cursor = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursor);
      line = word;
      cursor += lh;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursor);
}

export async function shareCareerCard(input: CareerCardInput): Promise<"shared" | "downloaded" | "copied" | "failed"> {
  const text = `${input.headline} — ${input.name} (${input.club}, ${input.kicker})\n${input.lines
    .map((l) => `${l.label}: ${l.value}`)
    .join(" · ")}\n\nMi carrera en BEYOND 90.`;

  const blob = await renderCareerCard(input);
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };

  if (blob && typeof nav.share === "function") {
    const file = new File([blob], "beyond90.png", { type: "image/png" });
    if (!nav.canShare || nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], text, title: "BEYOND 90" });
        return "shared";
      } catch {
        /* usuario canceló o no soportado: seguimos con el fallback */
      }
    }
  }

  if (blob) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "beyond90-career-card.png";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return "downloaded";
    } catch {
      /* seguimos al portapapeles */
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
