interface DmPreviewProps {
  dm: {
    handle: string;
    name: string;
    message: string;
    platform?: "instagram" | "tiktok" | "x";
  };
}

/**
 * Vista previa ligera (CSS, no imagen) del mensaje directo que motiva un
 * evento de redes sociales — hasta ahora `event.dm` solo se usaba para
 * generar la tarjeta de hito DESPUÉS de resolver el evento (ver
 * dmCard.ts), nunca se mostraba en la propia pantalla de decisión. El
 * jugador tenía que elegir cómo responder a un mensaje que nunca había
 * leído — encontrado por el usuario ("por qué los 5.000€ no tienen
 * sentido, no se informa"). Colores inspirados en los mismos temas de
 * dmCard.ts para que la vista previa y la tarjeta final se sientan
 * coherentes, sin reutilizar el propio renderer (que genera un PNG
 * completo vía sharp, pensado solo para la imagen compartible final).
 */
const THEME: Record<"instagram" | "tiktok" | "x", { bg: string; accent: string; label: string }> = {
  instagram: { bg: "#262626", accent: "#C2357F", label: "Instagram" },
  tiktok: { bg: "#2F2F2F", accent: "#E0123F", label: "TikTok" },
  x: { bg: "#2F3336", accent: "#1D9BF0", label: "X" },
};

export function DmPreview({ dm }: DmPreviewProps) {
  const theme = THEME[dm.platform ?? "instagram"];
  const initial = (dm.name[0] ?? "?").toUpperCase();

  return (
    <div className="rounded-2xl border border-panel-border p-3" style={{ background: theme.bg }}>
      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: theme.accent }}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-white">{dm.name}</p>
          <p className="truncate text-[10px] text-gray-400">
            @{dm.handle} · {theme.label}
          </p>
        </div>
      </div>
      <div
        className="max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-snug text-white"
        style={{ background: theme.accent }}
      >
        {dm.message}
      </div>
    </div>
  );
}
