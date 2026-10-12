/**
 * Lee TODAS las filas de una consulta de Supabase, página a página. La API de Supabase corta cada respuesta en
 * 1.000 filas por defecto (sin avisar): una carrera larga supera con holgura las 1.000 escenas (una simulada
 * llegó a 1.097), y las consultas "de toda la carrera" (escenas ya vividas, palmarés, estadísticas) se quedaban
 * sin las más antiguas o sin las más nuevas, con consecuencias como repetir escenas ya vividas.
 *
 * `build` recibe el rango de cada página y devuelve la consulta con `.range(from, to)` ya aplicado. Tiene que
 * llevar un orden estable (p. ej. `.order("id")`) para que las páginas no se solapen ni dejen huecos.
 */
export async function fetchAllRows<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
  maxPages = 50,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const all: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize;
    const { data, error } = await build(from, from + pageSize - 1);
    if (error) return { data: all, error };
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return { data: all, error: null };
}
