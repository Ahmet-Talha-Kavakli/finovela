// Stripe Checkout — bir plana abone olmak için ödeme oturumu oluşturur.
// POST { plan: "pro" | "unlimited" } → { url } (Stripe ödeme sayfası).
// Stripe yapılandırılmamışsa graceful hata döner (uygulama çökmez).

import { NextResponse } from "next/server";
import { requireUserId, getCurrentUser } from "@/lib/current-user";
import { STRIPE_ENABLED, getStripe, priceIdForPlan } from "@/lib/stripe";
import { getUserRow, upsertUser, setStripeCustomer } from "@/lib/db/repo";
import type { PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    if (!STRIPE_ENABLED) {
      return NextResponse.json(
        { ok: false, error: "Ödeme şu an yapılandırılmamış. Lütfen daha sonra tekrar dene." },
        { status: 503 },
      );
    }

    const body = (await req.json()) as { plan?: string };
    const plan = body.plan as PlanId;
    if (plan !== "pro" && plan !== "unlimited") {
      return NextResponse.json({ ok: false, error: "Geçersiz plan" }, { status: 400 });
    }
    const priceId = priceIdForPlan(plan);
    if (!priceId) {
      return NextResponse.json({ ok: false, error: "Bu plan için fiyat tanımlı değil." }, { status: 400 });
    }

    const stripe = getStripe();
    const u = await getCurrentUser();
    await upsertUser({ id: userId, email: u.email, name: u.name });
    const row = await getUserRow(userId);

    // Mevcut Stripe müşterisi yoksa oluştur.
    let customerId = row?.stripeCustomerId ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: u.email || undefined,
        name: u.name || undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await setStripeCustomer(userId, customerId);
    }

    const origin = new URL(req.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      // 14 günlük deneme (Pro pazarlamasındaki vaat ile uyumlu).
      subscription_data: { trial_period_days: plan === "pro" ? 14 : 0, metadata: { userId, plan } },
      metadata: { userId, plan },
      success_url: `${origin}/dashboard/billing?success=1`,
      cancel_url: `${origin}/pricing?canceled=1`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e) {
    console.error("[api/billing/checkout] failed:", e);
    return NextResponse.json({ ok: false, error: "Ödeme oturumu oluşturulamadı." }, { status: 500 });
  }
}
