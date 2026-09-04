import Link from "next/link";

const ITEMS = [
  {
    href: "/carrera",
    label: "Carrera",
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
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v10M9 9.5a2.5 2.5 0 012.5-1.5h1a2 2 0 010 4h-1a2 2 0 000 4h1a2.5 2.5 0 002.5-1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/mi-jugador",
    label: "Mi jugador",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function BottomNav({ active }: { active: "carrera" | "patrimonio" | "jugador" }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-panel-border bg-neutral-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map((item) => {
          const isActive =
            (active === "carrera" && item.href === "/carrera") ||
            (active === "patrimonio" && item.href === "/mi-jugador/patrimonio") ||
            (active === "jugador" && item.href === "/mi-jugador");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-[11px] ${
                isActive ? "text-gold" : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
