import Image from "next/image";

interface NpcFace {
  role: string;
  label: string;
  url: string | null;
}

/**
 * Pequeña fila de retrato(s) del personaje que habla en esta escena (el
 * míster, tu madre, tu agente...) — ver npcFaces.ts para cómo se generan
 * y cachean. Si la generación falló (sin crédito, red caída) `url` viene
 * null y ese personaje simplemente no se muestra: nunca bloquea ni rompe
 * el turno, es un añadido puramente visual.
 */
export function NpcAvatarRow({ faces }: { faces: NpcFace[] }) {
  const visible = faces.filter((f) => f.url);
  if (visible.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {visible.map((f) => (
        <div key={f.role} className="flex items-center gap-2">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gold/40 bg-surface-2">
            <Image src={f.url as string} alt={f.label} width={40} height={40} className="h-full w-full object-cover" unoptimized />
          </div>
          <span className="text-xs text-muted-foreground">{f.label}</span>
        </div>
      ))}
    </div>
  );
}
