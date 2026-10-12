import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.149"],
  poweredByHeader: false,
  // Cabeceras de seguridad básicas. Sin CSP a propósito: una CSP mal ajustada rompe la app (scripts en línea de
  // Next, imágenes de Supabase y Replicate); si se añade, empezar en modo "report-only".
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  // La fuente que usa textToPath.ts (src/lib/images/textToPath.ts) para
  // dibujar texto sin depender de fontconfig del sistema se lee desde
  // disco en tiempo de ejecución (fs.readFileSync), no vía import — el
  // rastreo automático de archivos de Next para las funciones serverless
  // no la detecta sola, así que hay que declararla explícitamente o el
  // despliegue en Vercel se queda sin el .ttf y todo el pipeline de
  // imágenes vuelve a fallar en silencio.
  outputFileTracingIncludes: {
    "/**": ["./src/lib/images/fonts/**"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hdfypriiswfqsomxgmsd.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
