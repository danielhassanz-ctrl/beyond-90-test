"use client";

import { useState } from "react";

export function ShareButton({
  imageUrl,
  title,
  text,
}: {
  imageUrl?: string | null;
  title: string;
  text: string;
}) {
  const [status, setStatus] = useState<"idle" | "sharing" | "copied" | "success">("idle");

  async function handleShare() {
    setStatus("sharing");

    const nav = navigator as Navigator & {
      canShare?: (data: { files?: File[] }) => boolean;
      share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
    };

    if (imageUrl) {
      try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const file = new File([blob], "beyond90.png", { type: blob.type || "image/png" });

        if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], title, text });
          setStatus("success");
          setTimeout(() => setStatus("idle"), 2000);
          return;
        }
      } catch {
        // el usuario canceló el share, o el navegador no lo soporta: seguimos abajo
      }

      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = "beyond90.png";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }

    // Sin imagen: compartir el texto directamente.
    try {
      if (nav.share) {
        await nav.share({ title, text });
        setStatus("success");
        setTimeout(() => setStatus("idle"), 2000);
        return;
      }
    } catch {
      // cancelado o no soportado, seguimos al portapapeles
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={status === "sharing"}
      className={`w-full rounded-lg px-6 py-3 font-semibold text-sm uppercase tracking-wide transition-all duration-300 ${
        status === "sharing"
          ? "opacity-60 cursor-wait bg-amber-500 text-neutral-950"
          : status === "success"
            ? "bg-green-500 text-white shadow-lg shadow-green-500/50"
            : status === "copied"
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50"
              : "bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 shadow-lg hover:shadow-amber-500/50"
      }`}
    >
      {status === "sharing" && "✨ Preparando..."}
      {status === "success" && "✅ ¡Compartido con éxito!"}
      {status === "copied" && "📋 ¡Copiado al portapapeles!"}
      {status === "idle" && imageUrl && "📸 Compartir momento"}
      {status === "idle" && !imageUrl && "🔗 Compartir"}
    </button>
  );
}
