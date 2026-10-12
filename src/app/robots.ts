import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/constants";

const base = getAppUrl() ?? "https://beyond-90.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/comparar/", "/legal/"], disallow: ["/mi-jugador", "/carrera", "/crear-jugador", "/admin", "/api/", "/login/"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
