import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/mi-jugador", "/crear-jugador", "/carrera"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims verifica el token en local (sin viaje a la red de Supabase) y refresca la sesión si hace falta: la página ya
  // pide el usuario completo con getUser() donde lo necesita, así que aquí basta con saber si hay sesión válida.
  const { data: claimsData } = await supabase.auth.getClaims();
  let user: { id: string } | null = claimsData?.claims ? { id: String(claimsData.claims.sub ?? "") } : null;
  // Sin sesión válida según el token local: se confirma una vez con el servidor antes de echar a nadie (red de seguridad).
  if (!user) {
    const { data: userData } = await supabase.auth.getUser();
    user = userData.user ? { id: userData.user.id } : null;
  }

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/mi-jugador";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
