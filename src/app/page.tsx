import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const FEATURES = [
  {
    title: "Carrera",
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

      <div className="relative z-10 flex flex-1 flex-col items-center px-6 py-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Beyond <span className="text-gold">90</span>
        </h1>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
          Tu historia. Más allá del partido.
        </p>

        <p className="mt-6 max-w-xs text-sm leading-relaxed text-neutral-300">
          Vive la vida de un futbolista profesional.
          <br />
          Dentro y fuera del campo.
          <br />
          Cada decisión importa.
        </p>

        <div className="mt-auto w-full max-w-xs space-y-3 pb-8">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase tracking-wide text-neutral-950 hover:bg-gold-soft"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round" />
            </svg>
            Iniciar sesión
          </Link>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase tracking-wide text-neutral-950 hover:bg-gold-soft"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3.2l2.4 1.8-.9 2.7H10.5l-.9-2.7L12 5.2zM6.6 8.9l2.5 1.8-1 3-2.9.1a8 8 0 011.4-4.9zm.5 8.6l1.1-2.9 2.9-.1 1.4 2.6a8 8 0 01-5.4.4zm7.8 0a8 8 0 01-1.9-.1l1.4-2.6 2.9.1 1.1 2.9c-.5.3-1 .5-1.5.7zm2.5-3.7l-1-3 2.5-1.8a8 8 0 011.4 4.9z" />
            </svg>
            Nueva carrera
          </Link>
        </div>

        <div className="mt-auto w-full max-w-sm pt-16">
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-panel-border bg-panel/80 p-5 backdrop-blur">
            {FEATURES.map((f) => (
              <div key={f.title} className="space-y-1 text-left">
                <div className="text-gold">{f.icon}</div>
                <p className="text-xs font-bold uppercase tracking-wide text-gold">{f.title}</p>
                <p className="text-xs leading-snug text-neutral-400">{f.text}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[11px] uppercase tracking-widest text-neutral-500">
            Beyond 90 · Beta
          </p>
          <p className="text-[11px] text-neutral-600">Tu progreso se guarda en la nube</p>
        </div>
      </div>
    </main>
  );
}
