"use client";

import { useEffect, useRef, useState } from "react";
import type { TrofeoKind } from "@/lib/honours";
import { TrophyIcon } from "@/components/TrophyIcon";

/**
 * Un trofeo que dice qué es: con el ratón, al pasar el puntero; en el móvil, al tocarlo (se queda unos segundos).
 * Muestra el nombre, el club y la temporada: «Champions League · Real Madrid · 2029/30».
 */
export function TrophyHint({ kind, label }: { kind: TrofeoKind; label: string }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function show() {
    setOpen(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 3500);
  }

  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" aria-label={label} title={label} onClick={show} onBlur={() => setOpen(false)} className="cursor-pointer rounded-md focus:outline-none focus-visible:ring-1 focus-visible:ring-gold">
        <TrophyIcon kind={kind} size={26} />
      </button>
      {open && (
        <span role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 w-max max-w-[220px] rounded-lg border border-gold/50 bg-black/95 px-2.5 py-1.5 text-center text-[11px] font-semibold leading-snug text-gold-soft shadow-lg">
          {label}
        </span>
      )}
    </span>
  );
}
