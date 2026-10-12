import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/constants";

const base = getAppUrl() ?? "https://beyond-90.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/legal/privacidad`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/terminos`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
