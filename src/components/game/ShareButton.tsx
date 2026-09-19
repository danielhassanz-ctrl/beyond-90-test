import { ImagePlus, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { clubById } from "@/game/data";
import { clubVisualIdentity } from "@/game/club-identity";
import { HttpMilestoneImageProvider, MilestoneImageUnavailableError } from "@/game/milestone-image-provider";
import { milestoneGenerationBrief, milestoneVisualSpec, playerVisualProfile } from "@/game/milestone-visual";
import { seasonLabel, stageLabel } from "@/game/engine";
import type { GameState, ShareData } from "@/game/types";
import { copyShareText, downloadCard, prepareCareerCard, sharePreparedCareerCard, type PreparedCareerCard } from "@/lib/share";

const milestoneImageProvider = new HttpMilestoneImageProvider();

/** Botón único de compartir hitos y career card final. */
export function ShareButton({ state, share, label = "Compartir career card" }: { state: GameState; share: ShareData; label?: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const imageRequestInFlight = useRef<symbol | null>(null);
  const generationEpoch = useRef(0);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<PreparedCareerCard | null>(null);
  const [preview, setPreview] = useState<{ url: string; text: string; canDownload: boolean } | null>(null);
  const [previewStatus, setPreviewStatus] = useState<string | null>(null);

  const input = useMemo(() => {
    const identity = clubVisualIdentity(state.clubId);
    const milestone = milestoneVisualSpec(share);
    const visualAge = playerVisualProfile(state.age);
    const club = clubById(state.clubId).name;
    const generationBrief = state.player.avatar
      ? milestoneGenerationBrief(milestone, visualAge, club, identity)
      : undefined;
    const baseKicker = share.kicker || `${seasonLabel(state.seasonIndex)} · ${stageLabel(state.stage)}`;
    return {
      headline: share.headline,
      kicker: `${baseKicker} · ${visualAge.age} años`,
      name: state.player.nickname || state.player.name,
      club,
      lines: share.lines,
      avatar: generatedAvatar || state.player.avatar,
      clubColors: { primary: identity.primary, secondary: identity.secondary, text: identity.text },
      milestone,
      playerVisual: visualAge,
      ...(generationBrief ? { generationBrief } : {}),
    };
  }, [share, state.seasonIndex, state.stage, state.age, state.player.nickname, state.player.name, state.player.avatar, state.clubId, generatedAvatar]);

  useEffect(() => {
    // Advancing the story invalidates the previous paid request immediately.
    // We cannot necessarily abort the provider after it has started, but we can
    // prevent its late result from mutating the new milestone and release the UI
    // lock so the new earned milestone can start its own request.
    generationEpoch.current += 1;
    imageRequestInFlight.current = null;
    setImageBusy(false);
    setGeneratedAvatar(null);
  }, [share, state.age, state.clubId, state.player.avatar]);

  useEffect(() => {
    let active = true;
    setPrepared(null);
    void prepareCareerCard(input).then((card) => { if (active) setPrepared(card); });
    return () => { active = false; };
  }, [input]);

  useEffect(() => {
    if (!preview) return;
    const url = preview.url;
    return () => URL.revokeObjectURL(url);
  }, [preview]);

  const canGenerate = Boolean(state.player.avatar && input.generationBrief && input.milestone.kind !== "career" && !generatedAvatar);

  return <div className="mt-4">
    {canGenerate && <button disabled={imageBusy} onClick={async () => {
      if (!state.player.avatar || !input.generationBrief || imageRequestInFlight.current) return;
      const requestToken = Symbol("milestone-image-request");
      imageRequestInFlight.current = requestToken;
      const requestEpoch = generationEpoch.current;
      setImageBusy(true); setStatus(null);
      try {
        const result = await milestoneImageProvider.generate({
          playerPhoto: state.player.avatar,
          brief: input.generationBrief,
          output: { width: 1024, height: 1536 },
        });
        if (requestEpoch !== generationEpoch.current) return;
        setGeneratedAvatar(result.imageUrl);
        setStatus("Imagen personalizada preparada.");
      } catch (error) {
        if (requestEpoch !== generationEpoch.current) return;
        setStatus(error instanceof MilestoneImageUnavailableError
          ? "La imagen personalizada no está disponible ahora. La tarjeta segura sigue lista para compartir."
          : "No se ha podido generar la imagen personalizada. La tarjeta segura sigue disponible.");
      } finally {
        if (imageRequestInFlight.current === requestToken) {
          imageRequestInFlight.current = null;
          setImageBusy(false);
        }
      }
    }} className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 font-cond text-sm font-bold uppercase tracking-[0.16em] text-black active:scale-[0.99] disabled:opacity-60">
      <ImagePlus className="h-4 w-4" aria-hidden />
      {imageBusy ? "Creando imagen…" : "Crear imagen del hito"}
    </button>}
    <button disabled={busy || !prepared} onClick={async () => {
      if (!prepared) return;
      setBusy(true); setStatus(null);
      try {
        const result = await sharePreparedCareerCard(prepared);
        if (result.status === "shared") setStatus("Compartido.");
        else if (result.status === "cancelled") setStatus(null);
        else if (result.status === "preview") { setStatus(null); setPreviewStatus(null); setPreview({ url: result.url, text: result.text, canDownload: result.canDownload }); }
        else { const ok = await copyShareText(result.text); setStatus(ok ? "Texto copiado al portapapeles." : "No se ha podido compartir."); }
      } catch { setStatus("No se ha podido compartir la tarjeta."); }
      finally { setBusy(false); }
    }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/60 px-4 py-3 font-cond text-sm font-bold uppercase tracking-[0.16em] text-gold active:scale-[0.99] disabled:opacity-60">
      <Share2 className="h-4 w-4" aria-hidden />
      {!prepared ? "Preparando…" : busy ? "Compartiendo…" : label}
    </button>
    {status && <p className="mt-2 text-center text-xs text-muted-foreground" role="status">{status}</p>}
    {preview && <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-black/90 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]" role="dialog" aria-modal="true" aria-label="Vista previa de la career card">
      <img src={preview.url} alt="Career card de Beyond 90" className="max-h-[58vh] w-auto rounded-xl border border-gold/40" />
      <p className="text-center text-xs text-muted-foreground">Mantén pulsada la imagen para guardarla en tu galería.</p>
      <div className="flex w-full max-w-sm flex-col gap-2">
        {preview.canDownload && <button onClick={() => downloadCard(preview.url)} className="rounded-xl border border-gold/60 px-4 py-3 font-cond text-sm font-bold uppercase tracking-[0.16em] text-gold">Descargar PNG</button>}
        <button onClick={async () => { const ok = await copyShareText(preview.text); setPreviewStatus(ok ? "Texto copiado al portapapeles." : "No se ha podido copiar."); }} className="rounded-xl border border-border px-4 py-3 font-cond text-sm font-bold uppercase tracking-[0.16em]">Copiar texto</button>
        {previewStatus && <p className="text-center text-xs text-muted-foreground" role="status">{previewStatus}</p>}
        <button onClick={() => { setPreviewStatus(null); setPreview(null); }} className="py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">Cerrar</button>
      </div>
    </div>}
  </div>;
}
