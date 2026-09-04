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
  const [status, setStatus] = useState<"idle" | "sharing" | "copied">("idle");

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
          setStatus("idle");
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
      setStatus("idle");
      return;
    }

    // Sin imagen: compartir el texto directamente.
    try {
      if (nav.share) {
        await nav.share({ title, text });
        setStatus("idle");
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
      className="w-full rounded-md bg-amber-500 px-5 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-60"
    >
      {status === "sharing"
        ? "Preparando..."
        : status === "copied"
          ? "¡Copiado! Pégalo donde quieras"
          : imageUrl
            ? "Compartir imagen"
            : "Compartir"}
    </button>
  );
}
