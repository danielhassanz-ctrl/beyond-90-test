import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.149"],
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
