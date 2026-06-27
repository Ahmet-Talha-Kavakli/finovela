// Clerk middleware — Next.js'in çalıştırdığı doğru dosya adı (src/middleware.ts).
// Anahtarlar yapılandırıldıysa devreye girer; aksi halde geliştirmede no-op (demo modu).
// ÜRETİMDE (NODE_ENV==='production') anahtar yoksa BYPASS YOK — Clerk normal davranışı uygulanır.

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const IS_PROD = process.env.NODE_ENV === "production";

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
