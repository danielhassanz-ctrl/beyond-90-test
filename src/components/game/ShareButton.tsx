import { Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { clubById } from "@/game/data";
import { seasonLabel, stageLabel } from "@/game/engine";
import type { GameState, ShareData } from "@/game/types";
import {
  copyShareText,
  downloadCard,
  prepareCareerCard,
  sharePreparedCareerCard,
  type PreparedCareerCard,
} from "@/lib/share";

/** Botón único de compartir (hitos y career card final). Reutiliza el canvas existente. */
export function ShareButton({
  state,
  share,
  label = "Compartir career card",
}: {
  state: GameState;
  share: ShareData;
  label?: string;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState<PreparedCareerCard | null>(null);
  const [preview, setPreview] = useState<{ url: string; text: string; canDownload: boolean } | null>(null);
  const [previewStatus, setPreviewStatus] = useState<string | null>(null);

  const input = useMemo(
    () => ({
      headline: share.headline,
      kicker: share.kicker || `${seasonLabel(state.seasonIndex)} · ${stageLabel(state.stage)}`,
      name: state.player.nickname || state.player.name,
      club: clubById(state.clubId).name,
      lines: share.lines,
      avatar: state.player.avatar,
    }),
    [share, state.seasonIndex, state.stage, state.player.nickname, state.player.name, state.player.avatar, state.clubId],
  );

  useEffect(() => {
    let active = true;
    setPrepared(null);
    void prepareCareerCard(input).then((card) => {
      if (active) setPrepared(card);
    });
    return () => {
      active = false;
    };
  }, [input]);

  useEffect(() => {
    if (!preview) return;
    const url = preview.url;
    return () => URL.revokeObjectURL(url);
  }, [preview]);

  return (
    <div className="mt-4">
      <button
        disabled={busy || !prepared}
        onClick={async () => {
          if (!prepared) return;
          setBusy(true);
          setStatus(null);
          try {
            // Important on iPhone/WebKit: this call reaches navigator.share()
            // immediately from the tap, with the expensive canvas work already done.
            const result = await sharePreparedCareerCard(prepared);
            if (result.status === "shared") setStatus("Compartido.");
            else if (result.status === "cancelled") setStatus(null);
            else if (result.status === "preview") {
              setStatus(null);
              setPreviewStatus(null);
              setPreview({ url: result.url, text: result.text, canDownload: result.canDownload });
            } else {
              const ok = await copyShareText(result.text);
              setStatus(ok ? "Texto copiado al portapapeles." : "No se ha podido compartir.");
            }
          } catch {
            setStatus("No se ha podido compartir la tarjeta.");
          } finally {
            setBusy(false);
          }
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/60 px-4 py-3 font-cond text-sm font-bold uppercase tracking-[0.16em] text-gold active:scale-[0.99] disabled:opacity-60"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        {!prepared ? "Preparando…" : busy ? "Compartiendo…" : label}
      </button>
      {status && <p className="mt-2 text-center text-xs text-muted-foreground">{status}</p>}

      {preview && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-black/90 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]"
          role="dialog"
          aria-modal="true"
          aria-label="Vista previa de la career card"
        >
          <img
            src={preview.url}
            alt="Career card de Beyond 90"
            className="max-h-[58vh] w-auto rounded-xl border border-gold/40"
          />
          <p className="text-center text-xs text-muted-foreground">
            Mantén pulsada la imagen para guardarla en tu galería.
          </p>
          <div className="flex w-full max-w-sm flex-col gap-2">
            {preview.canDownload && (
              <button
                onClick={() => downloadCard(preview.url)}
                className="rounded-xl border border-gold/60 px-4 py-3 font-cond text-sm font-bold uppercase tracking-[0.16em] text-gold"
              >
                Descargar PNG
              </button>
            )}
            <button
              onClick={async () => {
                const ok = await copyShareText(preview.text);
                setPreviewStatus(ok ? "Texto copiado al portapapeles." : "No se ha podido copiar.");
              }}
              className="rounded-xl border border-border px-4 py-3 font-cond text-sm font-bold uppercase tracking-[0.16em]"
            >
              Copiar texto
            </button>
            {previewStatus && (
              <p className="text-center text-xs text-muted-foreground" role="status">
                {previewStatus}
              </p>
            )}
            <button
              onClick={() => {
                setPreviewStatus(null);
                setPreview(null);
              }}
              className="py-2 text-xs uppercase tracking-[0.16em] text-muted-foreground"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
