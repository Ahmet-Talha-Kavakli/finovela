// Paddle Checkout — bir plana abone olmak için gereken bilgileri döndürür.
// Paddle, client-side overlay (Paddle.js) ile ödeme alır; bu route ödeme sayfası
// AÇMAZ, sadece frontend'in Paddle.Checkout.open() çağırması için verileri verir.
//
// POST { plan: "pro" | "unlimited" }
//   → { ok, priceId, clientToken, env, customData: { userId, plan } }
// Paddle yapılandırılmamışsa graceful 503 döner (uygulama çökmez).

import { NextResponse } from "next/server";
import { requireUserId, getCurrentUser } from "@/lib/current-user";
import { PADDLE_ENABLED, PADDLE_ENV, PADDLE_CLIENT_TOKEN, priceIdForPlan } from "@/lib/paddle";
import { upsertUser } from "@/lib/db/repo";
import type { PlanId } from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    if (!PADDLE_ENABLED || !PADDLE_CLIENT_TOKEN) {
      return NextResponse.json(
        { ok: false, error: "Ödeme şu an yapılandırılmamış. Lütfen daha sonra tekrar dene." },
        { status: 503 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as { plan?: string };
    const plan = body.plan as PlanId;
    if (plan !== "pro" && plan !== "unlimited") {
      return NextResponse.json({ ok: false, error: "Geçersiz plan" }, { status: 400 });
    }
    const priceId = priceIdForPlan(plan);
    if (!priceId) {
      return NextResponse.json({ ok: false, error: "Bu plan için fiyat tanımlı değil." }, { status: 400 });
    }

    // Kullanıcı DB'de var olsun (webhook customData.userId ile eşleşecek).
    const u = await getCurrentUser();
    await upsertUser({ id: userId, email: u.email, name: u.name });

    return NextResponse.json({
      ok: true,
      priceId,
      clientToken: PADDLE_CLIENT_TOKEN,
      env: PADDLE_ENV,
      email: u.email || undefined,
      customData: { userId, plan },
    });
  } catch (e) {
    console.error("[api/billing/checkout] failed:", e);
    return NextResponse.json({ ok: false, error: "Ödeme başlatılamadı." }, { status: 500 });
  }
}
