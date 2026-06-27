// Stripe webhook — abonelik olaylarında kullanıcının planını DB'de günceller.
// İmza DOĞRULAMASI zorunlu (STRIPE_WEBHOOK_SECRET). Doğrulanamayan istek reddedilir.
//
// Stripe Dashboard'da webhook ekle: <site>/api/billing/webhook
// Dinlenen olaylar: checkout.session.completed, customer.subscription.updated/deleted.
//
// NOT: Bu route Clerk korumasının DIŞINDA olmalı (Stripe sunucusu çağırır, oturum yok).
// middleware matcher'ında /api/billing/webhook KORUNMAZ.

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { STRIPE_ENABLED, getStripe, planForPriceId } from "@/lib/stripe";
import { getUserByStripeCustomer, setUserSubscription } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!STRIPE_ENABLED) {
    return NextResponse.json({ ok: false, error: "Stripe yapılandırılmamış" }, { status: 503 });
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Webhook secret yok" }, { status: 503 });
  }

  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", webhookSecret);
  } catch (e) {
    console.error("[webhook] imza doğrulanamadı:", e);
    return NextResponse.json({ ok: false, error: "Geçersiz imza" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = s.metadata?.userId;
        const plan = s.metadata?.plan;
        if (userId && plan) {
          await setUserSubscription(userId, plan, "active");
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription;
        const priceId = sub.items.data[0]?.price?.id;
        const plan = planForPriceId(priceId) ?? "free";
        const user = await resolveUser(sub);
        if (user) {
          // trialing/active → planı uygula; aksi (past_due/unpaid) durumu yansıt.
          const active = sub.status === "active" || sub.status === "trialing";
          await setUserSubscription(user.id, active ? plan : user.plan ?? "free", sub.status);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const user = await resolveUser(sub);
        if (user) await setUserSubscription(user.id, "free", "canceled");
        break;
      }
      default:
        break;
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("[webhook] işleme hatası:", e);
    return NextResponse.json({ ok: false, error: "İşlenemedi" }, { status: 500 });
  }
}

/** Subscription → kullanıcı: önce metadata.userId, yoksa customer ID ile DB'den. */
async function resolveUser(sub: Stripe.Subscription) {
  const metaUserId = sub.metadata?.userId;
  if (metaUserId) return { id: metaUserId, plan: undefined as string | undefined };
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  const row = await getUserByStripeCustomer(customerId);
  return row ? { id: row.id, plan: row.plan ?? undefined } : null;
}
