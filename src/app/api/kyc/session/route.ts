// KYC — Didit doğrulama oturumu aç.
// POST → Didit'te yeni session açılır, kullanıcının yönlendirileceği URL döner.
// vendor_data = userId (webhook'ta geri gelir). Servis kapalıysa demo:true.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { DIDIT_ENABLED, createVerificationSession } from "@/lib/didit";
import { startDiditKyc } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    const rl = rateLimit(rateLimitKey("kyc-session", userId, req.headers), RATE_LIMITS.profile);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    if (!DIDIT_ENABLED) {
      // Servis kapalı — istemci eski "belge yükle + inceleniyor" akışına düşsün.
      return NextResponse.json({ ok: true, demo: true });
    }

    // Kullanıcı doğrulamayı bitirince döneceği sayfa.
    const origin = new URL(req.url).origin;
    const callbackUrl = `${origin}/onboarding?kyc=done`;

    const result = await createVerificationSession(userId, callbackUrl);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 502 });
    }
    await startDiditKyc(userId, result.sessionId).catch((e) =>
      console.error("[kyc/session] db save failed:", e),
    );
    return NextResponse.json({ ok: true, url: result.url, sessionId: result.sessionId });
  } catch (e) {
    console.error("[api/kyc/session] failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}
