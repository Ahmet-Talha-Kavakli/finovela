// Stripe müşteri portalı — kullanıcı aboneliğini yönetir (iptal, kart, fatura).
// POST → { url } (Stripe portal). Müşteri kaydı yoksa hata.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { STRIPE_ENABLED, getStripe } from "@/lib/stripe";
import { getUserRow } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
    if (!STRIPE_ENABLED) {
      return NextResponse.json({ ok: false, error: "Ödeme yapılandırılmamış." }, { status: 503 });
    }
    const row = await getUserRow(userId);
    if (!row?.stripeCustomerId) {
      return NextResponse.json({ ok: false, error: "Aktif abonelik bulunamadı." }, { status: 400 });
    }
    const stripe = getStripe();
    const origin = new URL(req.url).origin;
    const portal = await stripe.billingPortal.sessions.create({
      customer: row.stripeCustomerId,
      return_url: `${origin}/dashboard/billing`,
    });
    return NextResponse.json({ ok: true, url: portal.url });
  } catch (e) {
    console.error("[api/billing/portal] failed:", e);
    return NextResponse.json({ ok: false, error: "Portal açılamadı." }, { status: 500 });
  }
}
