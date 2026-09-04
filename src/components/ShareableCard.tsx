"use client";

import { useRef, useState, type ReactNode } from "react";

export function ShareableCard({
  children,
  title,
  text,
}: {
  children: ReactNode;
  title: string;
  text: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "sharing" | "copied">("idle");

  async function handleShare() {
    setStatus("sharing");
    const node = cardRef.current;

    try {
      if (!node) throw new Error("no card node");
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(node, { pixelRatio: 2, cacheBust: true });
      if (!blob) throw new Error("no blob generated");

      const file = new File([blob], "beyond90.png", { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: { files?: File[] }) => boolean;
        share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      };

      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title, text });
        setStatus("idle");
        return;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "beyond90.png";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("idle");
    } catch {
      // La captura de la tarjeta falló (CORS, navegador sin soporte, etc.):
      // se cae a compartir solo el texto, para que el botón nunca se rompa.
      try {
        if ((navigator as { share?: unknown }).share) {
          await (navigator as unknown as { share: (d: { title?: string; text?: string }) => Promise<void> }).share({
            title,
            text,
          });
          setStatus("idle");
          return;
        }
        await navigator.clipboard.writeText(text);
        setStatus("copied");
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("idle");
      }
    }
  }

  return (
    <div className="space-y-4">
      <div ref={cardRef}>{children}</div>
      <button
        onClick={handleShare}
        disabled={status === "sharing"}
        className="w-full rounded-md bg-amber-500 px-5 py-2 text-sm font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-60"
      >
        {status === "sharing"
          ? "Preparando..."
          : status === "copied"
            ? "¡Copiado! Pégalo donde quieras"
            : "Compartir imagen"}
      </button>
    </div>
  );
}
