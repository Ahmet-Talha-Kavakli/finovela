// Clerk middleware — Next.js'in çalıştırdığı doğru dosya adı (src/middleware.ts).
// Anahtarlar yapılandırıldıysa devreye girer; aksi halde geliştirmede no-op (demo modu).
// ÜRETİMDE (NODE_ENV==='production') anahtar yoksa BYPASS YOK — Clerk normal davranışı uygulanır.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const IS_PROD = process.env.NODE_ENV === "production";

// Dashboard'un sunulduğu alt alan. Bu host'tan gelen istekler /dashboard'a
// rewrite edilir (URL aynı kalır). Middleware seviyesinde yapılır çünkü edge'de
// HER istekte çalışır — kök "/" landing'in statik prerender'ını da gölgeleyebilir
// (next.config rewrites statik sayfayı yakalayamıyordu → 404).
const APP_HOST = "app.finovela.com";

// app host'unda /dashboard'a rewrite EDİLMEYECEK yollar (subdomain'de doğrudan çalışsın):
// auth ekranları, api, next-internal, statik dosya (nokta içeren), zaten /dashboard.
function isPassthroughOnAppHost(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/monitoring") ||
    pathname.includes(".") // favicon.ico, *.png, *.svg vb.
  );
}

/** app.finovela.com isteğini /dashboard/<path>'e rewrite eder; değilse null. */
function appHostRewrite(req: NextRequest): URL | null {
  const host = req.headers.get("host")?.toLowerCase() ?? "";
  if (host !== APP_HOST) return null;
  const { pathname } = req.nextUrl;
  if (isPassthroughOnAppHost(pathname)) return null;
  const url = req.nextUrl.clone();
  url.pathname = pathname === "/" ? "/dashboard" : `/dashboard${pathname}`;
  return url;
}

const CLERK_ENABLED =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("YOUR_") &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

// Korumalı rotalar: dashboard + AI/state API'leri.
// /api/market/* KASITLI olarak AÇIK bırakıldı — public landing (hot-stocks) onu tüketiyor.
const isProtected = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/api/chat(.*)",
  "/api/chat-title(.*)",
  "/api/daily-brief(.*)",
  "/api/news-summary(.*)",
  "/api/state(.*)",
  "/api/decisions(.*)",
  "/api/profile(.*)",
  "/api/kyc(.*)",
  "/api/exchange(.*)",
  "/api/automation(.*)",
  // Billing: checkout & portal oturum ister; webhook KORUNMAZ (Stripe çağırır).
  "/api/billing/checkout(.*)",
  "/api/billing/portal(.*)",
]);

// Sayfa (UI) korumalı rotaları: oturum yoksa /sign-in'e YÖNLENDİR (404 değil).
const isProtectedPage = createRouteMatcher(["/dashboard(.*)", "/onboarding(.*)"]);

const clerkMw = clerkMiddleware(async (auth, req) => {
  // ÖNCE: app.finovela.com → /dashboard rewrite. Rewrite'tan SONRA req.nextUrl
  // /dashboard'ı gösterir; isProtected() bunu yakalar → Clerk koruması uygulanır.
  const rewritten = appHostRewrite(req);
  if (rewritten) {
    const { userId, redirectToSignIn } = await auth();
    if (!userId) {
      // app host'unda dashboard → oturum yoksa giriş ekranına gönder.
      return redirectToSignIn({ returnBackUrl: req.url });
    }
    return NextResponse.rewrite(rewritten);
  }

  if (!isProtected(req)) return;
  const { userId, redirectToSignIn } = await auth();
  if (userId) return; // oturum var — geç
  if (isProtectedPage(req)) {
    // Dashboard gibi sayfalar: 404 yerine giriş ekranına gönder, dönüşte
    // kullanıcıyı istediği sayfaya geri getir.
    return redirectToSignIn({ returnBackUrl: req.url });
  }
  // Korumalı /api/* uçları: açık 401 JSON döndür (protect()'in 404'ü yerine —
  // client/sync-engine 401'i bekler; route'lar kendi içinde de doğrular).
  return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
});

export default function middleware(req: NextRequest, ev: unknown) {
  // Clerk yapılandırılmamışsa: geliştirmede zarifçe geç (demo akışı bozulmasın).
  // Üretimde geçme — Clerk'in normal davranışı (anahtar yoksa hata) geçerli olsun
  // ki dashboard sessizce herkese açılmasın.
  if (!CLERK_ENABLED && !IS_PROD) {
    // Clerk kapalıyken bile app host rewrite çalışsın (lokal subdomain testi).
    const rewritten = appHostRewrite(req);
    if (rewritten) return NextResponse.rewrite(rewritten);
    return NextResponse.next();
  }
  // @ts-expect-error Clerk middleware event tipini geniş kabul ediyor
  return clerkMw(req, ev);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
