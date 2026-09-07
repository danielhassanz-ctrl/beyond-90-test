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
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [poll]);

  if (queue.length === 0) return null;

  const current = queue[0];

  const dismiss = () => setQueue((prev) => prev.slice(1));
  const open = () => {
    router.push(`/carrera/hito/${current.id}`);
    dismiss();
  };

  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 md:bottom-6">
      <button
        onClick={open}
        className="flex w-full items-center gap-3 rounded-xl border border-amber-400/50 bg-neutral-900/95 p-4 text-left shadow-2xl shadow-amber-500/20 backdrop-blur transition-transform hover:scale-[1.02]"
      >
        <span className="text-2xl">📸</span>
        <span className="flex-1 min-w-0">
          <span className="block text-xs font-bold uppercase tracking-wide text-amber-300">
            Tu foto está lista
          </span>
          <span className="block truncate text-sm text-neutral-200">{current.title}</span>
        </span>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          className="shrink-0 text-neutral-500 hover:text-neutral-300 px-1"
        >
          ✕
        </span>
      </button>
    </div>
  );
}
