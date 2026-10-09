"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * La foto resumen de la temporada se genera en segundo plano tras confirmar
 * la decisión; mientras tanto la tarjeta enseña "revelando…" y esto vuelve a
 * pedir la página cada pocos segundos hasta que la foto está lista.
 */
export function RecapPhotoWatcher() {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [router]);
  return null;
}
