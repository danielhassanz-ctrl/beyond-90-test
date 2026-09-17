import type { MilestoneVisualSpec, PlayerVisualProfile } from "@/game/milestone-visual";

export interface CareerCardInput {
  headline: string;
  kicker: string;
  name: string;
  club: string;
  lines: { label: string; value: string }[];
  avatar: string | null;
  clubColors?: { primary: string; secondary: string; text: string };
  milestone?: MilestoneVisualSpec;
  /** Metadata for a future identity-preserving image backend. The local card does not fake facial ageing. */
  playerVisual?: PlayerVisualProfile;
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

function visualStageLabel(profile?: PlayerVisualProfile): string | null {
  if (!profile) return null;
  const labels: Record<PlayerVisualProfile["stage"], string> = { academy: "PROMESA", "young-pro": "JOVEN PRO", prime: "PRIME", veteran: "VETERANO", legacy: "LEGADO" };
  return `${profile.age} AÑOS · ${labels[profile.stage]}`;
}

function drawMilestoneBackdrop(ctx: CanvasRenderingContext2D, scene: MilestoneVisualSpec["scene"], primary: string, secondary: string) {
  ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = secondary; ctx.strokeStyle = secondary; ctx.lineWidth = 10;
  if (scene === "pitch") { ctx.strokeRect(90, 300, W - 180, 650); ctx.beginPath(); ctx.moveTo(90, 625); ctx.lineTo(W - 90, 625); ctx.stroke(); ctx.beginPath(); ctx.arc(W / 2, 625, 115, 0, Math.PI * 2); ctx.stroke(); }
  else if (scene === "presentation") { ctx.fillStyle = primary; ctx.fillRect(90, 300, W - 180, 650); ctx.fillStyle = secondary; for (let x = 90; x < W - 90; x += 120) ctx.fillRect(x, 300, 48, 650); }
  else if (scene === "celebration") { for (let i = 0; i < 18; i += 1) { const x = 80 + ((i * 137) % 920); const y = 270 + ((i * 211) % 650); ctx.fillRect(x, y, 16 + (i % 3) * 8, 60 + (i % 4) * 20); } }
  else if (scene === "farewell") { ctx.beginPath(); ctx.moveTo(120, 870); ctx.quadraticCurveTo(W / 2, 250, W - 120, 870); ctx.stroke(); ctx.beginPath(); ctx.moveTo(170, 900); ctx.quadraticCurveTo(W / 2, 380, W - 170, 900); ctx.stroke(); }
  ctx.restore();
}

/** Dibuja una tarjeta vertical determinista. No simula generación fotográfica IA. */
export async function renderCareerCard(input: CareerCardInput): Promise<Blob | null> {
  try {
    const canvas = document.createElement("canvas"); canvas.width = W; canvas.height = H; const ctx = canvas.getContext("2d"); if (!ctx) return null;
    const primary = input.clubColors?.primary ?? "#121316"; const secondary = input.clubColors?.secondary ?? "#d4af37"; const accentText = input.clubColors?.text ?? "#f5f5f4";
    const milestone = input.milestone ?? { kind: "career", label: "Mi carrera", scene: "portrait" as const };
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, "#08090b"); bg.addColorStop(0.55, primary); bg.addColorStop(1, "#08090b"); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); drawMilestoneBackdrop(ctx, milestone.scene, primary, secondary);
    // Rights-safe club treatment: colour + club name only. Official crests, shirt artwork and sponsors stay out until commercial rights are cleared.
    ctx.fillStyle = secondary; ctx.fillRect(0, 0, 24, H); ctx.fillRect(W - 24, 0, 24, H); ctx.strokeStyle = secondary; ctx.lineWidth = 6; ctx.strokeRect(48, 48, W - 96, H - 96);
    const img = input.avatar ? await loadImage(input.avatar) : null; const cx = W / 2; const cy = 620; const r = milestone.scene === "portrait" ? 260 : 285;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
    if (img) { const scale = Math.max((r * 2) / img.width, (r * 2) / img.height); const w = img.width * scale; const h = img.height * scale; ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h); }
    else { ctx.fillStyle = "#1c1d21"; ctx.fillRect(cx - r, cy - r, r * 2, r * 2); ctx.fillStyle = secondary; ctx.font = "bold 180px Georgia, serif"; ctx.textAlign = "center"; ctx.fillText(input.name.slice(0, 1).toUpperCase(), cx, cy + 60); }
    ctx.restore(); ctx.strokeStyle = secondary; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    const ageStage = visualStageLabel(input.playerVisual);
    if (ageStage) { ctx.textAlign = "center"; ctx.font = "700 28px Helvetica, Arial, sans-serif"; const badgeWidth = Math.max(260, ctx.measureText(ageStage).width + 70); ctx.fillStyle = "rgba(8,9,11,0.88)"; ctx.fillRect(cx - badgeWidth / 2, cy + r - 18, badgeWidth, 58); ctx.strokeStyle = secondary; ctx.lineWidth = 3; ctx.strokeRect(cx - badgeWidth / 2, cy + r - 18, badgeWidth, 58); ctx.fillStyle = secondary; ctx.fillText(ageStage, cx, cy + r + 20); }
    ctx.textAlign = "center"; ctx.fillStyle = secondary; ctx.font = "600 40px Helvetica, Arial, sans-serif"; ctx.fillText("BEYOND 90", cx, 160); ctx.font = "700 30px Helvetica, Arial, sans-serif"; ctx.fillText(milestone.label.toUpperCase(), cx, 215);
    ctx.fillStyle = accentText; ctx.font = "bold 78px Helvetica, Arial, sans-serif"; wrap(ctx, input.headline.toUpperCase(), cx, 1010, W - 220, 88);
    ctx.fillStyle = accentText; ctx.globalAlpha = 0.78; ctx.font = "500 42px Helvetica, Arial, sans-serif"; ctx.fillText(input.name, cx, 1170); ctx.globalAlpha = 1; ctx.fillStyle = secondary; ctx.font = "600 36px Helvetica, Arial, sans-serif"; ctx.fillText(`${input.club} · ${input.kicker}`, cx, 1230);
    let y = 1360; for (const line of input.lines.slice(0, 5)) { ctx.textAlign = "left"; ctx.fillStyle = accentText; ctx.globalAlpha = 0.58; ctx.font = "500 34px Helvetica, Arial, sans-serif"; ctx.fillText(line.label.toUpperCase(), 150, y); ctx.textAlign = "right"; ctx.globalAlpha = 1; ctx.fillStyle = accentText; ctx.font = "bold 44px Helvetica, Arial, sans-serif"; ctx.fillText(line.value, W - 150, y); ctx.strokeStyle = secondary; ctx.globalAlpha = 0.22; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(150, y + 24); ctx.lineTo(W - 150, y + 24); ctx.stroke(); ctx.globalAlpha = 1; y += 100; }
    ctx.textAlign = "center"; ctx.fillStyle = accentText; ctx.globalAlpha = 0.38; ctx.font = "500 32px Helvetica, Arial, sans-serif"; ctx.fillText("Simulador narrativo de carrera · beyond90", cx, H - 120); ctx.globalAlpha = 1;
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
  } catch { return null; }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lh: number) { const words = text.split(" "); let line = ""; let cursor = y; for (const word of words) { const test = line ? `${line} ${word}` : word; if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line, x, cursor); line = word; cursor += lh; } else line = test; } if (line) ctx.fillText(line, x, cursor); }
export function shareText(input: CareerCardInput): string { return `${input.headline} — ${input.name} (${input.club}, ${input.kicker})\n${input.lines.map((l) => `${l.label}: ${l.value}`).join(" · ")}\n\nMi carrera en BEYOND 90.`; }
export interface PreparedCareerCard { blob: Blob | null; text: string; }
export type ShareOutcome = { status: "shared" } | { status: "cancelled" } | { status: "preview"; url: string; text: string; canDownload: boolean } | { status: "failed"; text: string };
function isIOS(): boolean { const ua = navigator.userAgent || ""; return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document); }
function wasShareCancelled(err: unknown): boolean { return err instanceof DOMException && err.name === "AbortError"; }
export async function prepareCareerCard(input: CareerCardInput): Promise<PreparedCareerCard> { const [blob, text] = await Promise.all([renderCareerCard(input), Promise.resolve(shareText(input))]); return { blob, text }; }
export async function sharePreparedCareerCard(prepared: PreparedCareerCard): Promise<ShareOutcome> { const { blob, text } = prepared; const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }; if (typeof nav.share === "function") { if (blob) { const file = new File([blob], "beyond90.png", { type: "image/png" }); const canShareFiles = typeof nav.canShare === "function" && nav.canShare({ files: [file] }); if (canShareFiles) { try { await nav.share({ files: [file], text, title: "BEYOND 90" }); return { status: "shared" }; } catch (err) { if (wasShareCancelled(err)) return { status: "cancelled" }; } } else { try { await nav.share({ text, title: "BEYOND 90" }); return { status: "shared" }; } catch (err) { if (wasShareCancelled(err)) return { status: "cancelled" }; } } } else { try { await nav.share({ text, title: "BEYOND 90" }); return { status: "shared" }; } catch (err) { if (wasShareCancelled(err)) return { status: "cancelled" }; } } } if (blob) { const url = URL.createObjectURL(blob); return { status: "preview", url, text, canDownload: !isIOS() }; } return { status: "failed", text }; }
export async function shareCareerCard(input: CareerCardInput): Promise<ShareOutcome> { return sharePreparedCareerCard(await prepareCareerCard(input)); }
export function downloadCard(url: string): void { const a = document.createElement("a"); a.href = url; a.download = "beyond90-career-card.png"; a.rel = "noopener"; a.click(); }
export async function copyShareText(text: string): Promise<boolean> { try { await navigator.clipboard.writeText(text); return true; } catch { return false; } }
