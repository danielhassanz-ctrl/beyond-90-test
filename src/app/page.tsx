import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    title: "Carrera",
    emoji: "📈",
    text: "Desde joven promesa hasta leyenda mundial",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M4 21V10l4-3 4 3 4-3 4 3v11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 21h16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Vida real",
    emoji: "❤️",
    text: "Relaciones, familia, amigos y rivales",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Decisiones",
    emoji: "⚡",
    text: "Cada elección cambia tu historia",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path
          d="M12 3l2.4 5.1 5.6.8-4 4 1 5.6-5-2.7-5 2.7 1-5.6-4-4 5.6-.8z"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Legado",
    emoji: "👑",
    text: "Gana títulos, récords y el respeto eterno",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
        <path d="M7 4h10v4a5 5 0 01-10 0V4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 5H4v2a3 3 0 003 3M17 5h3v2a3 3 0 01-3 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 13v4M9 21h6M10 17h4v4h-4z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/mi-jugador");
  }

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-neutral-950">
      <div className="absolute inset-0">
        <Image
          src="/hero-tunnel.jpg"
          alt="Futbolista de espaldas con la camiseta de Beyond 90 en el túnel de vestuarios"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/40 via-transparent to-neutral-950" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center px-6 py-12 text-center sm:py-16">
        {/* Logo y tagline */}
        <div className="space-y-2">
          <p className="text-5xl sm:text-6xl">⚽</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Beyond <span className="text-gold">90</span>
          </h1>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            Tu historia. Más allá del partido.
          </p>
        </div>

        {/* Descripción */}
        <p className="mt-6 max-w-sm text-sm leading-relaxed text-neutral-300">
          Vive la vida de un futbolista profesional.
          <br />
          <span className="text-amber-200">Dentro y fuera del campo.</span>
          <br />
          <span className="font-semibold">Cada decisión importa.</span>
        </p>

        {/* Features grid mejorado */}
        <div className="mt-10 w-full max-w-sm space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            Lo que incluye
          </p>
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-lg border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-3 backdrop-blur-sm hover:border-amber-500/40 transition-all duration-300"
              >
                <div className="text-2xl mb-1">{f.emoji}</div>
                <p className="text-xs font-bold uppercase tracking-wide text-amber-200">
                  {f.title}
                </p>
                <p className="text-[11px] leading-tight text-neutral-400 mt-1">
                  {f.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-auto w-full max-w-sm space-y-4 pb-8">
          <div className="space-y-2 text-center">
            <p className="text-[11px] uppercase tracking-widest text-neutral-500">
              🚀 Beyond 90 · Beta
            </p>
            <p className="text-[10px] text-neutral-600">Tu progreso se guarda automáticamente en la nube</p>
          </div>

          <Link
            href="/crear-jugador"
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold to-amber-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-neutral-950 hover:from-amber-400 hover:to-amber-600 transition-all shadow-lg hover:shadow-amber-500/50"
          >
            <span className="text-lg">⭐</span>
            Nueva carrera
          </Link>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-gold bg-neutral-950/50 px-6 py-3 text-sm font-bold uppercase tracking-wide text-gold hover:bg-gold/10 hover:border-amber-400 transition-all"
          >
            <span className="text-lg">👤</span>
            Iniciar sesión
          </Link>

          <p className="text-[10px] text-neutral-600 text-center">
            ¿Primera vez? Crea una cuenta al empezar
          </p>
        </div>
      </div>
    </main>
  );
}
