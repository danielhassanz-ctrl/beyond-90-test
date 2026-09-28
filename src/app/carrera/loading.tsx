/**
 * Antes no existía ningún loading.tsx en esta ruta: al elegir una opción,
 * la siguiente pantalla genera el próximo evento con IA (ver
 * pickNextEventDynamic en page.tsx) ANTES de pintar nada — mientras eso
 * tarda (una llamada real a Claude, unos segundos), el jugador se
 * quedaba mirando la pantalla anterior congelada sin ninguna señal de
 * que algo estaba pasando. Con este archivo, el App Router de Next.js
 * pinta esto al instante en cuanto se navega, mientras el Server
 * Component de arriba sigue trabajando de fondo — no acorta el tiempo
 * real, pero convierte "parece que se ha colgado" en "está cargando".
 */
export default function CarreraLoading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      <p className="font-cond text-sm uppercase tracking-wide text-muted-foreground">
        Escribiendo tu próxima jugada…
      </p>
    </main>
  );
}
