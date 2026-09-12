/** Redimensiona una foto del móvil a un avatar pequeño para guardarlo en local. */
const MAX_AVATAR_DATA_URL_LENGTH = 180_000;
const JPEG_QUALITIES = [0.82, 0.72, 0.62, 0.52] as const;

export async function fileToAvatar(file: File, size = 320): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen");

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Imagen no válida"));
    el.src = dataUrl;
  });

  if (!img.width || !img.height) throw new Error("Imagen sin dimensiones válidas");

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Este navegador no puede procesar la foto");

  const min = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);

  for (const quality of JPEG_QUALITIES) {
    const avatar = canvas.toDataURL("image/jpeg", quality);
    if (!avatar.startsWith("data:image/jpeg")) continue;
    if (avatar.length <= MAX_AVATAR_DATA_URL_LENGTH) return avatar;
  }

  throw new Error("La foto procesada ocupa demasiado espacio");
}
