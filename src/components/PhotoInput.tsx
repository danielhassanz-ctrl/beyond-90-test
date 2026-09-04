"use client";

import { useRef, useState } from "react";

const MAX_DIMENSION = 1440;
const JPEG_QUALITY = 0.85;

/**
 * Las fotos que llegan directo de la cámara del móvil (sobre todo iPhone,
 * HEIC de varios MB) pueden superar el límite de tamaño de la server action
 * o tardar tanto en subir que parece que la app se queda colgada. Antes de
 * meter el archivo en el formulario, lo redibujamos en un canvas más
 * pequeño y lo reexportamos como JPEG liviano.
 */
async function compressImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob || blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

export function PhotoInput({ name }: { name: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setStatus(null);
      setPreview(null);
      return;
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setStatus(`Foto recibida (${sizeMB} MB, ${file.type || "tipo desconocido"}) — optimizando…`);

    try {
      const compressed = await compressImage(file);

      if (compressed !== file && inputRef.current) {
        const transfer = new DataTransfer();
        transfer.items.add(compressed);
        inputRef.current.files = transfer.files;
      }

      setPreview(URL.createObjectURL(compressed));
      setStatus(`Lista (${Math.round(compressed.size / 1024)} KB)`);
    } catch (err) {
      // No se pudo procesar (formato raro, etc.): se sube tal cual, pero se
      // muestra el motivo real para poder diagnosticarlo si vuelve a fallar.
      const reason = err instanceof Error ? err.message : String(err);
      setStatus(`No se pudo optimizar (${reason}). Se subirá el original de ${sizeMB} MB.`);
      try {
        setPreview(URL.createObjectURL(file));
      } catch {
        // Ni siquiera se puede previsualizar: seguimos igual, el input ya tiene el archivo.
      }
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        name={name}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="w-full rounded-md border border-panel-border bg-panel px-3 py-2 text-sm text-neutral-100 outline-none file:mr-3 file:rounded file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-neutral-950 file:font-medium focus:border-gold"
      />
      {(status || preview) && (
        <div className="flex items-center gap-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Vista previa"
              className="h-14 w-14 rounded-md border border-panel-border object-cover"
            />
          )}
          {status && <p className="text-xs text-neutral-500">{status}</p>}
        </div>
      )}
    </div>
  );
}
