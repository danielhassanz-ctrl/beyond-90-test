import { redirect } from "next/navigation";

/** Los logros viven ahora en el Legado (pestaña «Logros»). Esta dirección se mantiene para no romper enlaces antiguos. */
export default function LogrosRedirect() {
  redirect("/mi-jugador/legado?v=logros");
}
