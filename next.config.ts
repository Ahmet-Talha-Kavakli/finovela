import type { NextConfig } from "next";

// Üretim dışı ortamlarda (preview/staging) arama motoru indekslemesini engelle.
// Vercel'de VERCEL_ENV "production" | "preview" | "development" olur.
// Lokal/CI'da VERCEL_ENV yoksa NODE_ENV'e düş.
const isProduction =
  process.env.VERCEL_ENV === "production" ||
  (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");

/*
  Content-Security-Policy — pragmatik (Clerk + Next + market verisi bozulmasın).
  Not: Clerk hem clerk.com hem *.clerk.accounts.dev altyapısını kullanır; Next dev
  ve bazı runtime gereği inline/eval script'lere ihtiyaç duyabilir. Tailwind inline
  style üretir → style-src 'unsafe-inline'. Görseller her kaynaktan + data/blob.
  Çok katı bir CSP uygulamayı kasten YAPMIYORUZ (uygulamayı kırmamak için);
  daraltmak istenirse 'unsafe-inline'/'unsafe-eval' kaldırılıp nonce'a geçilebilir.
*/
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com https://api.anthropic.com https:",
  "frame-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Finans uygulaması — gömülmeye/clickjacking'e izin yok.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  images: {
    // Gemini ürettiğimiz PNG'ler net kalsın — optimizasyon donuklaştırıyordu
    unoptimized: true,
    // Next 16: quality=100 kullanan <Image>'lar için uyarıyı sustur
    qualities: [75, 100],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          // Yalnız üretim DIŞI ortamda indekslemeyi kapat; üretim indexlenebilir kalır.
          ...(!isProduction
            ? [{ key: "X-Robots-Tag", value: "noindex" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
