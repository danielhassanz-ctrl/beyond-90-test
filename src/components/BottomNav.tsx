import Link from "next/link";

const ITEMS = [
  {
    href: "/carrera",
    label: "Carrera",
    emoji: "⚽",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M4 21V10l4-3 4 3 4-3 4 3v11" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 21h16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/mi-jugador/patrimonio",
    label: "Patrimonio",
    emoji: "💰",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9 9.5a2.5 2.5 0 012.5-1.5h1a2 2 0 010 4h-1a2 2 0 000 4h1a2.5 2.5 0 002.5-1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/mi-jugador/vida",
    label: "Vida",
    emoji: "❤️",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path
          d="M12 20.5s-7-4.35-9.5-8.9C.9 8.4 2.3 5 5.6 5c1.9 0 3.3 1 4.4 2.4C11.1 6 12.5 5 14.4 5c3.3 0 4.7 3.4 3.1 6.6C15 16.15 12 20.5 12 20.5z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/mi-jugador/legado",
    label: "Legado",
    emoji: "🏆",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <path d="M7 4h10v4a5 5 0 01-10 0V4z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 5H4v2a3 3 0 003 3M17 5h3v2a3 3 0 01-3 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 13v4M9 21h6M10 17h4v4h-4z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/mi-jugador",
    label: "Mi jugador",
    emoji: "👤",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round" />
      </svg>
    ),
  },
];

/**
 * Navegación inferior con indicador de página activa.
 * Mejorado con: mejor visual, emojis, efecto activo mejorado, transiciones suaves.
 */
export function BottomNav({ active }: { active: "carrera" | "patrimonio" | "vida" | "legado" | "jugador" }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-amber-500/20 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-neutral-950/80 backdrop-blur-sm">
      {/* Línea de brillo superior */}
      <div className="h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map((item) => {
          const isActive =
            (active === "carrera" && item.href === "/carrera") ||
            (active === "patrimonio" && item.href === "/mi-jugador/patrimonio") ||
            (active === "vida" && item.href === "/mi-jugador/vida") ||
            (active === "legado" && item.href === "/mi-jugador/legado") ||
            (active === "jugador" && item.href === "/mi-jugador");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-1.5 py-4 text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 ${
                isActive
                  ? "text-gold"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {/* Icono con animación */}
              <div className={`transition-transform duration-300 ${isActive ? "scale-110" : "scale-100 group-hover:scale-105"}`}>
                {item.icon}
              </div>

              {/* Label */}
              <span className="text-[9px]">{item.label}</span>

              {/* Indicador de página activa */}
              {isActive && (
                <>
                  {/* Punto decorativo */}
                  <div className="absolute top-0 h-1 w-1 rounded-full bg-gold shadow-lg shadow-gold/50" />

                  {/* Barra debajo del nombre */}
                  <div className="absolute bottom-0 h-0.5 w-full bg-gradient-to-r from-transparent via-gold to-transparent" />
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
