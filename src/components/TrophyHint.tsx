"use client";

import { useEffect, useRef, useState } from "react";
import type { TrofeoKind } from "@/lib/honours";
import { TrophyIcon } from "@/components/TrophyIcon";

/**
 * Un trofeo que dice qué es: con el ratón, al pasar el puntero (burbuja junto al trofeo); en el móvil, al tocarlo (un aviso fijo
 * sobre la barra de abajo, que no se corta aunque el trofeo esté dentro de una tarjeta). Muestra el nombre, el club y la
 * temporada: «Champions League · Real Madrid · 2029/30».
 */
export function TrophyHint({ kind, label, size = 26 }: { kind: TrofeoKind; label: string; size?: number }) {
  const [hover, setHover] = useState(false);
  const [toast, setToast] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function tap() {
    setToast(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(false), 3500);
  }

  return (
    <span className="relative inline-flex" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={tap}
        className="inline-flex min-h-9 min-w-8 cursor-pointer items-center justify-center rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
      >
        <TrophyIcon kind={kind} size={size} />
      </button>
      {hover && !toast && (
        <span role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 hidden w-max max-w-[220px] rounded-lg border border-gold/50 bg-black/95 px-2.5 py-1.5 text-center text-[11px] font-semibold leading-snug text-gold-soft shadow-lg [@media(hover:hover)]:block">
          {label}
        </span>
      )}
      {toast && (
        <span
          role="status"
          onClick={() => setToast(false)}
          className="fixed inset-x-4 bottom-24 z-50 mx-auto w-fit max-w-[90vw] rounded-xl border border-gold/60 bg-black/95 px-4 py-2.5 text-center text-sm font-semibold leading-snug text-gold-soft shadow-xl"
        >
          🏆 {label}
        </span>
      )}
    </span>
  );
}
