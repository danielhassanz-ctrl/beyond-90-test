import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Beyond 90",
    short_name: "Beyond 90",
    description: "Simulador de carrera de futbolista: cada decisión cuenta.",
    start_url: "/mi-jugador",
    display: "standalone",
    background_color: "#0a0c10",
    theme_color: "#0a0c10",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
