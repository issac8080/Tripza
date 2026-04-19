import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!base) {
    return [];
  }
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/vehicles`, lastModified: now },
    { url: `${base}/trips`, lastModified: now },
    { url: `${base}/activity`, lastModified: now },
    { url: `${base}/my-trips`, lastModified: now },
    { url: `${base}/post-trip`, lastModified: now },
    { url: `${base}/login`, lastModified: now },
    { url: `${base}/register`, lastModified: now },
    { url: `${base}/profile`, lastModified: now },
    { url: `${base}/provider/vehicles/new`, lastModified: now },
    { url: `${base}/terms`, lastModified: now },
    { url: `${base}/privacy`, lastModified: now },
  ];
}
