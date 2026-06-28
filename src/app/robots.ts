import type { MetadataRoute } from "next";

// Finovela robots.txt — arama motorlarına ne taranır/taranmaz + sitemap konumu.
// Public pazarlama indekslenir; özel/oturum gerektiren alanlar engellenir.

const BASE = "https://finovela.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/", // oturum gerektiren panel — indekslenmemeli
          "/api/", // API uçları
          "/onboarding", // kuruluma özel akış
          "/sign-in/",
          "/sign-up/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
