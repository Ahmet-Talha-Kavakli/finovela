// Paddle webhook — abonelik olaylarında kullanıcının planını DB'de günceller.
// İmza DOĞRULAMASI zorunlu (PADDLE_WEBHOOK_SECRET). Doğrulanamayan istek reddedilir.
//
// Paddle Dashboard → Notifications → webhook ekle: <site>/api/billing/webhook
// Dinlenen olaylar:
//   subscription.created / subscription.updated / subscription.activated
//   subscription.canceled
//
// NOT: Bu route Clerk korumasının DIŞINDA olmalı (Paddle sunucusu çağırır, oturum yok).
// middleware matcher'ında /api/billing/webhook KORUNMAZ.

import { NextResponse } from "next/server";
import { PADDLE_ENABLED, planForPriceId, verifyPaddleSignature } from "@/lib/paddle";
import { getUserByPaddleCustomer, getUserRow, setPaddleIds, setUserSubscription, addCredits } from "@/lib/db/repo";
import { sendEmail } from "@/lib/email/send";
import { subscriptionActiveEmail, creditsPurchasedEmail } from "@/lib/email/templates";
import { CREDIT_PACKS, PLANS, type PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Paddle subscription event payload (kullandığımız alanlar). */
type PaddleSubscription = {
  id?: string;
  status?: string; // active | trialing | past_due | canceled | paused
  customer_id?: string;
  custom_data?: { userId?: string; plan?: string; kind?: string; pack?: string } | null;
  items?: Array<{ price?: { id?: string } | null }> | null;
};

type PaddleEvent = {
  event_type?: string;
  data?: PaddleSubscription;
};

/**
 * Mail gönderimi ana akışı ASLA bloklamaz/bozmaz — hata yutulur.
 * EMAIL_ENABLED false ise sendEmail zaten no-op.
 */
async function safeSend(to: string | null | undefined, mail: { subject: string; html: string; text: string }): Promise<void> {
  if (!to) return;
  await sendEmail({ to, subject: mail.subject, html: mail.html, text: mail.text }).catch((e) => {
    console.error("[webhook] mail gönderilemedi:", e);
  });
}

export async function POST(req: Request) {
  if (!PADDLE_ENABLED) {
    return NextResponse.json({ ok: false, error: "Paddle yapılandırılmamış" }, { status: 503 });
  }
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: "Webhook secret yok" }, { status: 503 });
  }

  const raw = await req.text();
  const sig = req.headers.get("paddle-signature");
  if (!verifyPaddleSignature(raw, sig)) {
    console.error("[webhook] Paddle imzası doğrulanamadı");
    return NextResponse.json({ ok: false, error: "Geçersiz imza" }, { status: 400 });
  }

  let event: PaddleEvent;
  try {
    event = JSON.parse(raw) as PaddleEvent;
  } catch {
    return NextResponse.json({ ok: false, error: "Geçersiz gövde" }, { status: 400 });
  }

  try {
    const type = event.event_type ?? "";
    switch (type) {
      case "subscription.created":
      case "subscription.updated":
      case "subscription.activated": {
        const sub = event.data ?? {};
        const userId = await resolveUserId(sub);
        if (!userId) break;

        // Plan'ı önce custom_data'dan, yoksa price ID'den çöz.
        const priceId = sub.items?.[0]?.price?.id;
        const plan: PlanId =
          (sub.custom_data?.plan as PlanId | undefined) ?? planForPriceId(priceId) ?? "free";

        const status = sub.status ?? "active";
        const active = status === "active" || status === "trialing";

        await setPaddleIds(userId, {
          customerId: sub.customer_id ?? undefined,
          subscriptionId: sub.id ?? undefined,
        });
        // Aktif/deneme → planı uygula; aksi (past_due/paused) → durumu yansıt, planı düşürme.
        await setUserSubscription(userId, active ? plan : plan, status);

        // Mail: yalnızca YENİ aktivasyonda (created/activated) + aktif/deneme durumunda.
        // updated'da tekrar gönderme (yoksa her yenilemede mail gider).
        if ((type === "subscription.created" || type === "subscription.activated") && active && plan !== "free") {
          const user = await getUserRow(userId);
          await safeSend(user?.email, subscriptionActiveEmail(PLANS[plan].name));
        }
        break;
      }
      case "transaction.completed": {
        // Tek-seferlik kredi paketi alımı. Aboneliklerin de transaction'ı olur —
        // sadece kredi paketi price ID'siyle eşleşeni işle (mükerrer plan tetiği yok).
        const tx = event.data ?? {};
        const priceIds = (tx.items ?? []).map((i) => i?.price?.id).filter(Boolean) as string[];

        // Önce custom_data ile (checkout kind:"credits" + pack), yoksa price ID eşleşmesi.
        let pack =
          tx.custom_data?.kind === "credits" && tx.custom_data.pack
            ? CREDIT_PACKS.find((p) => p.id === tx.custom_data?.pack)
            : undefined;
        if (!pack) {
          pack = CREDIT_PACKS.find((p) => {
            const envPriceId = process.env[p.priceEnvKey]?.trim();
            return !!envPriceId && priceIds.includes(envPriceId);
          });
        }
        if (!pack) break; // kredi paketi değil (örn. abonelik transaction'ı) → atla

        const userId = await resolveUserId(tx);
        if (!userId) break;

        await addCredits(userId, pack.credits);

        const user = await getUserRow(userId);
        await safeSend(user?.email, creditsPurchasedEmail(pack.credits));
        break;
      }
      case "subscription.canceled": {
        const sub = event.data ?? {};
        const userId = await resolveUserId(sub);
        if (userId) await setUserSubscription(userId, "free", "canceled");
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

/** Subscription → userId: önce custom_data.userId, yoksa customer ID ile DB'den. */
async function resolveUserId(sub: PaddleSubscription): Promise<string | null> {
  const metaUserId = sub.custom_data?.userId;
  if (metaUserId) return metaUserId;
  if (sub.customer_id) {
    const row = await getUserByPaddleCustomer(sub.customer_id);
    if (row) return row.id;
  }
  return null;
}
