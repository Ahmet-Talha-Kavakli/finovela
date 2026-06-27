// Kullanıcı profili — onboarding çıktısının kalıcı (DB) kaydı.
// PUT: riskProfile'ı users tablosuna yazar (Clerk userId'ye bağlı).
// Clerk userId sunucudan alınır; istemciden gelen kimlik ASLA kullanılmaz.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { getCurrentUser } from "@/lib/current-user";
import { upsertUser, getUserRow } from "@/lib/db/repo";
import { db, schema, ready } from "@/lib/db/index";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_RISK = new Set(["conservative", "balanced", "aggressive"]);

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
    }
    const rl = rateLimit(rateLimitKey("profile", userId, req.headers), RATE_LIMITS.profile);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);
    const body = (await req.json()) as { riskProfile?: string };
    const risk = body.riskProfile;
    if (risk && !VALID_RISK.has(risk)) {
      return NextResponse.json({ ok: false, error: "Geçersiz risk profili" }, { status: 400 });
    }
    // Kullanıcı yoksa oluştur (idempotent), sonra riskProfile'ı yaz.
    const u = await getCurrentUser();
    await upsertUser({ id: userId, email: u.email, name: u.name });
    if (risk) {
      await ready();
      await db.update(schema.users).set({ riskProfile: risk }).where(eq(schema.users.id, userId)).run();
    }
    const row = await getUserRow(userId);
    return NextResponse.json({ ok: true, plan: row?.plan ?? "Free", riskProfile: row?.riskProfile ?? null });
  } catch (e) {
    console.error("[api/profile] PUT failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
    }
    const row = await getUserRow(userId);
    return NextResponse.json({
      ok: true,
      plan: row?.plan ?? "Free",
      riskProfile: row?.riskProfile ?? null,
    });
  } catch (e) {
    console.error("[api/profile] GET failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}
