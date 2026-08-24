import { Link } from "@tanstack/react-router";
import { BookOpen, Heart, Trophy, TrendingUp, Wallet } from "lucide-react";

const ITEMS = [
  { to: "/historia", label: "Historia", Icon: BookOpen },
  { to: "/carrera", label: "Carrera", Icon: TrendingUp },
  { to: "/patrimonio", label: "Dinero", Icon: Wallet },
  { to: "/relaciones", label: "Vida", Icon: Heart },
  { to: "/legado", label: "Legado", Icon: Trophy },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl">
      <ul className="mx-auto grid max-w-md grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className="flex flex-col items-center gap-1 py-3 text-muted-foreground transition-colors"
              activeProps={{ className: "text-gold" }}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span className="font-cond text-[0.68rem] font-semibold uppercase tracking-[0.14em]">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
