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
  // Paddle.js + ProfitWell (Paddle analitiği) ödeme overlay'i için script izni.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com https://clerk.finovela.com https://*.finovela.com https://challenges.cloudflare.com https://cdn.paddle.com https://sandbox-cdn.paddle.com https://*.paddle.com https://public.profitwell.com https://*.profitwell.com",
  "style-src 'self' 'unsafe-inline' https://cdn.paddle.com https://sandbox-cdn.paddle.com https://*.paddle.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://*.paddle.com",
  // Paddle + ProfitWell API (live + sandbox) bağlantı izni.
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com https://clerk.finovela.com https://*.finovela.com https://api.anthropic.com https://generativelanguage.googleapis.com https://*.paddle.com https://*.profitwell.com https:",
  // Paddle checkout overlay (iframe) — *.paddle.com tümünü kapsar.
  "frame-src 'self' https://*.clerk.accounts.dev https://clerk.finovela.com https://*.finovela.com https://challenges.cloudflare.com https://*.paddle.com https://buy.paddle.com https://sandbox-buy.paddle.com",
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
    // microphone=(self): sohbet + canlı destek sesli giriş (Web Speech API) için.
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
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
  /*
    Host-bazlı rewrite — app.finovela.com alt alanı dashboard'u sunar.
    Kullanıcı app.finovela.com açtığında URL aynı kalır ama altta /dashboard
    route'ları render edilir (gizli rewrite, redirect değil). finovela.com landing
    olarak kalır. Eski finovela.com/dashboard linkleri de çalışmaya devam eder
    (route fiziksel olarak taşınmadı).
      - app.finovela.com/            → /dashboard
      - app.finovela.com/chat        → /dashboard/chat
    /api, /_next, /sign-in, /sign-up rewrite DIŞINDA tutulur (Clerk + API + statik
    varlıklar subdomain'de de doğrudan çalışsın). Bunlar zaten dashboard altında değil.
  */
  async rewrites() {
    const APP_HOST = "app.finovela.com";
    return {
      beforeFiles: [
        // app.finovela.com kökü → dashboard ana sayfası
        {
          source: "/",
          has: [{ type: "host", value: APP_HOST }],
          destination: "/dashboard",
        },
        // app.finovela.com/<path> → /dashboard/<path>
        // (API/Next-internal/auth yolları zaten /dashboard altında değil; onlara
        //  dokunmadan olduğu gibi sunulur çünkü destination eşleşmesi /dashboard/* ile
        //  çakışmaz — Next bu kaynakları doğrudan host'tan servis eder.)
        {
          source: "/:path((?!api/|_next/|dashboard/|sign-in|sign-up|onboarding|monitoring).*)",
          has: [{ type: "host", value: APP_HOST }],
          destination: "/dashboard/:path",
        },
      ],
    };
  },
};

export default nextConfig;
