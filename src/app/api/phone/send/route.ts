// Telefon doğrulama — SMS kodu gönder (Netgsm).
// POST { phone, country? } → kod üretilir, hash'li kaydedilir, Netgsm ile SMS gider.
// Oturum + katı rate-limit (SMS gerçek para + suistimal riski).

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { NETGSM_ENABLED, normalizePhone, sendSms, generateCode, verificationMessage } from "@/lib/netgsm";
import { savePhoneCode } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CODE_TTL_MS = 5 * 60 * 1000; // 5 dakika

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    const rl = rateLimit(rateLimitKey("sms-send", userId, req.headers), RATE_LIMITS.smsSend);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const b = (await req.json()) as { phone?: string; country?: "TR" | "US" };
    const phone = normalizePhone((b.phone ?? "").trim(), b.country ?? "TR");
    if (!phone) {
      return NextResponse.json({ ok: false, error: "Geçersiz telefon numarası." }, { status: 400 });
    }

    const now = Date.now();
    const code = generateCode();
    // Kodu HER ZAMAN hash'li kaydet (demo modda da doğrulama tutarlı çalışsın).
    await savePhoneCode(userId, phone, code, now + CODE_TTL_MS, now);

    if (!NETGSM_ENABLED) {
      // Servis kapalı — demo mod. Kodu yanıtta dön ki localde test edilebilsin.
      // (Üretimde NETGSM_ENABLED=true olduğundan bu dal çalışmaz.)
      return NextResponse.json({ ok: true, demo: true, devCode: code, phone });
    }

    const result = await sendSms(phone, verificationMessage(code));
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }
    return NextResponse.json({ ok: true, phone });
  } catch (e) {
    console.error("[api/phone/send] failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}
