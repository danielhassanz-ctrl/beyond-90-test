/**
 * Cronómetros ligeros para saber DÓNDE se va el tiempo de cada turno. Escriben una línea `[perf] etiqueta 123ms` en los
 * registros del servidor (Vercel) y no cambian el comportamiento.
 */
export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    console.log(`[perf] ${label} ${Math.round(performance.now() - t0)}ms`);
  }
}
