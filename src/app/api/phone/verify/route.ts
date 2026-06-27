// Telefon doğrulama — girilen SMS kodunu kontrol et (Netgsm akışı).
// POST { code } → { ok, verified } ; verified=true ise telefon onaylanır + DB'ye işlenir.
// Kod hash'li olarak phone_verifications tablosunda; süre/deneme kontrolü repo'da.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { checkPhoneCode, setUserPhone } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REASON: Record<string, string> = {
  expired: "Kodun süresi doldu. Yeni kod iste.",
  too_many: "Çok fazla hatalı deneme. Yeni kod iste.",
  wrong: "Kod hatalı. Tekrar dene.",
  none: "Önce kod iste.",
};

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    const rl = rateLimit(rateLimitKey("sms-check", userId, req.headers), RATE_LIMITS.smsCheck);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const b = (await req.json()) as { code?: string };
    const code = (b.code ?? "").trim();
    if (!/^\d{4,10}$/.test(code)) {
      return NextResponse.json({ ok: false, error: "Geçersiz kod." }, { status: 400 });
    }

    const { result, phone } = await checkPhoneCode(userId, code, Date.now());
    if (result === "ok" && phone) {
      await setUserPhone(userId, phone).catch((e) => console.error("[phone] save failed:", e));
      return NextResponse.json({ ok: true, verified: true });
    }
    return NextResponse.json(
      { ok: true, verified: false, error: REASON[result] ?? "Kod doğrulanamadı." },
    );
  } catch (e) {
    console.error("[api/phone/verify] failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}
