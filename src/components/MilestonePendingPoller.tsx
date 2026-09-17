"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getMilestoneImageStatus } from "@/app/notifications/actions";

const POLL_INTERVAL_MS = 6_000;
// Si tras este tiempo la foto sigue "pending", se deja de esperar y se
// muestra la tarjeta sin foto en vez de un spinner infinito — cubre el
// caso de un job huérfano (p.ej. el servidor se reinició a medio generar)
// que nunca va a llegar a "ready" ni a "failed" por sí solo.
//
// El peor caso real de generación (ver replicate.ts) suma hasta 70s de
// la llamada inicial + 180s de sondeo + 30s para descargar la imagen
// final = ~280s — con el límite anterior de 4 minutos (240s), este aviso
// podía saltar mientras la foto todavía se estaba generando de verdad,
// no porque el trabajo estuviera huérfano. Se alinea con maxDuration
// (300s) de la página que dispara la generación en segundo plano.
const GIVE_UP_AFTER_MS = 5 * 60_000;

/**
 * La página del hito se renderiza una vez en el servidor: si en ese
 * momento la foto seguía "pending", se quedaba con el spinner para
 * siempre, aunque terminara de generarse segundos después — el único
 * aviso de que ya estaba lista era el toast flotante global
 * (ImageReadyNotifier), fácil de no ver si te quedas mirando esta
 * pantalla. Este componente sondea el estado de ESTE hito en concreto y
 * refresca la página en cuanto cambia.
 */
export function MilestonePendingPoller({ milestoneId }: { milestoneId: string }) {
  const router = useRouter();
  const [gaveUp, setGaveUp] = useState(false);
  // Date.now() no puede llamarse durante el render (impuro) — se captura
  // al montar, dentro del efecto, no como valor inicial de useRef.
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (startedAt.current === null) startedAt.current = Date.now();
    const interval = setInterval(async () => {
      if (Date.now() - startedAt.current! > GIVE_UP_AFTER_MS) {
        clearInterval(interval);
        setGaveUp(true);
        // El servidor decide con la fecha real de creación del hito
        // (milestone.created_at) si ya se considera huérfano — no con el
        // tiempo que lleva este componente montado, que se reinicia cada
        // vez que se visita la página. Refrescar aquí hace que, si de
        // verdad está huérfano, la pantalla pase a la tarjeta sin foto en
        // vez de quedarse con el spinner para siempre.
        router.refresh();
        return;
      }
      try {
        const result = await getMilestoneImageStatus(milestoneId);
        if (result && result.status !== "pending") {
          clearInterval(interval);
          router.refresh();
        }
      } catch {
        // Sondeo silencioso: un fallo puntual no debe generar ruido visible
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [milestoneId, router]);

  if (gaveUp) {
    return (
      <p className="mt-3 text-xs text-neutral-500">
        Está tardando más de lo normal — puedes seguir jugando, si termina te avisamos igualmente.
      </p>
    );
  }

  return null;
}
