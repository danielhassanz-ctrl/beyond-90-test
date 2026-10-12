import type { Metadata, Viewport } from "next";
import { Manrope, Archivo_Black, Barlow_Condensed } from "next/font/google";
import { ImageReadyNotifier } from "@/components/ImageReadyNotifier";
import { getAppUrl } from "@/lib/constants";
import "./globals.css";

// Réplica exacta de la tipografía del prototipo de referencia: Manrope
// para el cuerpo, Archivo Black para titulares/números grandes, Barlow
// Condensed para etiquetas en mayúsculas y cifras de stats.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  weight: "400",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Vive la carrera de futbolista que nunca tuviste: cada decisión cuenta, cada escena deja consecuencias y cada gran momento se puede compartir. Crea tu jugador y llega a la leyenda.";

export const metadata: Metadata = {
  metadataBase: new URL(getAppUrl() ?? "https://beyond-90.vercel.app"),
  title: { default: "Beyond 90 — Simulador de carrera de futbolista", template: "%s · Beyond 90" },
  description: SITE_DESCRIPTION,
  applicationName: "Beyond 90",
  keywords: ["simulador de fútbol", "carrera de futbolista", "juego de decisiones", "Beyond 90"],
  openGraph: {
    type: "website",
    siteName: "Beyond 90",
    locale: "es_ES",
    title: "Beyond 90 — Simulador de carrera de futbolista",
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "Beyond 90", description: SITE_DESCRIPTION },
  icons: { icon: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }], apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Beyond 90", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#0a0c10", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${manrope.variable} ${archivoBlack.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ImageReadyNotifier />
      </body>
    </html>
  );
}
