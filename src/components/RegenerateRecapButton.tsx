"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { regenerateRecapPhoto } from "@/app/carrera/resultado/[id]/actions";

/** «Rehacer foto del resumen»: pide una foto nueva (gasta una de tus fotos) y la página se refresca sola al terminar. */
export function RegenerateRecapButton({ careerEventId }: { careerEventId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await regenerateRecapPhoto(careerEventId);
            setMessage({ ok: r.ok, text: r.message });
            if (r.ok) router.refresh();
          })
        }
        className="w-full rounded-full border border-panel-border bg-surface-2 px-4 py-2.5 font-cond text-xs font-bold uppercase tracking-wide text-foreground transition-colors hover:border-gold disabled:opacity-50"
      >
        🔄 Rehacer la foto del resumen (1 de tus fotos)
      </button>
      {message && (
        <p role="status" className={`text-center text-xs ${message.ok ? "text-pitch" : "text-destructive"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
