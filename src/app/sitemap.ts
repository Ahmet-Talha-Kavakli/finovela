import type { MetadataRoute } from "next";

// Finovela sitemap — Google Search Console / arama motorları için.
// Otomatik /sitemap.xml üretir (Next.js App Router). YALNIZ public pazarlama
// sayfaları; dashboard/auth/onboarding indekslenmez (login gerektirir).

const BASE = "https://finovela.com";

// Önceliğe göre gruplanmış public route'lar.
const ROUTES: { path: string; priority: number; changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFreq: "weekly" },
  { path: "/pricing", priority: 0.9, changeFreq: "weekly" },
  { path: "/guide", priority: 0.8, changeFreq: "monthly" },
  { path: "/product/ai", priority: 0.8, changeFreq: "monthly" },
  { path: "/product/portfolio", priority: 0.7, changeFreq: "monthly" },
  { path: "/product/strategy", priority: 0.7, changeFreq: "monthly" },
  { path: "/product/tax", priority: 0.7, changeFreq: "monthly" },
  { path: "/automation", priority: 0.7, changeFreq: "monthly" },
  { path: "/copy", priority: 0.6, changeFreq: "monthly" },
  { path: "/markets", priority: 0.6, changeFreq: "daily" },
  { path: "/markets/stocks", priority: 0.6, changeFreq: "daily" },
  { path: "/research", priority: 0.6, changeFreq: "weekly" },
  { path: "/academy", priority: 0.6, changeFreq: "weekly" },
  { path: "/blog", priority: 0.6, changeFreq: "weekly" },
  { path: "/support", priority: 0.5, changeFreq: "monthly" },
  { path: "/download", priority: 0.5, changeFreq: "monthly" },
  { path: "/contact", priority: 0.4, changeFreq: "yearly" },
  // Yasal — düşük öncelik ama indekslenmeli (Paddle/güven).
  { path: "/privacy", priority: 0.3, changeFreq: "yearly" },
  { path: "/terms", priority: 0.3, changeFreq: "yearly" },
  { path: "/refund", priority: 0.3, changeFreq: "yearly" },
  { path: "/cookies", priority: 0.3, changeFreq: "yearly" },
  { path: "/kvkk", priority: 0.3, changeFreq: "yearly" },
  { path: "/disclaimer", priority: 0.3, changeFreq: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFreq,
    priority: r.priority,
  }));
}
