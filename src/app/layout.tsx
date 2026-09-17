import type { Metadata } from "next";
import { Manrope, Archivo_Black, Barlow_Condensed } from "next/font/google";
import { ImageReadyNotifier } from "@/components/ImageReadyNotifier";
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

export const metadata: Metadata = {
  title: "Beyond 90",
  description: "Simulador de carrera futbolística",
};

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
