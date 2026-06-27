// Paddle müşteri portalı — kullanıcı aboneliğini yönetir (iptal, kart, fatura).
// POST → { url } (Paddle yönetim oturumu). Müşteri kaydı yoksa graceful hata.
//
// Paddle API: POST /customers/{id}/portal-sessions →
//   data.urls.general.overview (genel yönetim) veya
//   data.urls.subscriptions[].cancel_subscription / update_subscription_payment_method

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { PADDLE_ENABLED, paddleFetch } from "@/lib/paddle";
import { getUserRow } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PortalSession = {
  data?: {
    urls?: {
      general?: { overview?: string };
    };
  };
};

export async function POST() {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
    if (!PADDLE_ENABLED) {
      return NextResponse.json({ ok: false, error: "Ödeme yapılandırılmamış." }, { status: 503 });
    }
    const row = await getUserRow(userId);
    if (!row?.paddleCustomerId) {
      return NextResponse.json({ ok: false, error: "Aktif abonelik bulunamadı." }, { status: 400 });
    }

    const subId = row.paddleSubscriptionId ?? undefined;
    const session = await paddleFetch<PortalSession>(
      `/customers/${row.paddleCustomerId}/portal-sessions`,
      {
        method: "POST",
        body: JSON.stringify(subId ? { subscription_ids: [subId] } : {}),
      },
    );

    const url = session.data?.urls?.general?.overview;
    if (!url) {
      return NextResponse.json({ ok: false, error: "Yönetim bağlantısı alınamadı." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("[api/billing/portal] failed:", e);
    return NextResponse.json({ ok: false, error: "Portal açılamadı." }, { status: 500 });
  }
}
