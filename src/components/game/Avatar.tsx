import { cn } from "@/lib/utils";

interface Props {
  src: string | null;
  name: string;
  className?: string;
}

export function PlayerAvatar({ src, name, className }: Props) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0］ ?? "")
    .join("");
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-gold/40 bg-surface-2",
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="font-cond text-lg font-bold text-gold">{initials.toUpperCase()}</span>
      )}
    </div>
  );
}
