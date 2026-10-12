"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { checkReadyMilestoneNotifications, type ReadyImageNotification } from "@/app/notifications/actions";

const POLL_INTERVAL_MS = 15_000;

/**
 * Avisa cuando una foto generada en segundo plano (ver after() en
 * src/app/carrera/actions.ts) ya está lista, sin que el jugador tenga
 * que quedarse esperando ni refrescar nada. Sondea cada 15s; si no hay
 * sesión o no hay nada nuevo, no hace ni muestra nada.
 */
export function ImageReadyNotifier() {
  const [queue, setQueue] = useState<ReadyImageNotification[]>([]);
  const router = useRouter();

  const poll = useCallback(async () => {
    try {
      const ready = await checkReadyMilestoneNotifications();
      if (ready.length > 0) {
        setQueue((prev) => [...prev, ...ready]);
      }
    } catch {
      // Sondeo silencioso: un fallo puntual no debe generar ruido visible
    }
  }, []);

  useEffect(() => {
    const first = setTimeout(poll, 0);
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [poll]);

  if (queue.length === 0) return null;

  const current = queue[0];

  const dismiss = () => setQueue((prev) => prev.slice(1));
  const open = () => {
    router.push(`/carrera/hito/${current.id}`);
    dismiss();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center rounded-xl border border-amber-400/50 bg-neutral-900/95 shadow-2xl shadow-amber-500/20 backdrop-blur transition-transform hover:scale-[1.02] md:bottom-6"
    >
      <button onClick={open} className="flex min-w-0 flex-1 items-center gap-3 p-4 text-left">
        <span className="text-2xl" aria-hidden="true">📸</span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold uppercase tracking-wide text-amber-300">Tu foto está lista</span>
          <span className="block truncate text-sm text-neutral-200">{current.title}</span>
        </span>
      </button>
      <button
        onClick={dismiss}
        aria-label="Cerrar aviso"
        className="shrink-0 px-4 py-4 text-neutral-400 hover:text-neutral-200"
      >
        ✕
      </button>
    </div>
  );
}
