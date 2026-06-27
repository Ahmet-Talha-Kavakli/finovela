// KYC (kimlik doğrulama) — başvuru kaydet + durum sorgula.
// POST: kimlik bilgileri + belge → DB'ye 'pending' kaydedilir ("inceleniyor").
// GET: kullanıcının KYC durumu.
//
// NOT: Gerçek belge doğrulaması 3. parti KYC servisi (Onfido/Sumsub) gerektirir.
// Bu uç bilgileri güvenle toplar; doğrulama hook'u sonradan bağlanır.
// Belge boyutu sınırlanır (data URL kötüye kullanımını engelle).

import { NextResponse } from "next/server";
import { requireUserId, getCurrentUser } from "@/lib/current-user";
import { submitKyc, getKyc, upsertUser } from "@/lib/db/repo";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DOC = 4_000_000; // ~4MB data URL tavanı (belge başına)
const VALID_ID = new Set(["tc", "passport", "other"]);

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
    const row = await getKyc(userId);
    return NextResponse.json({
      ok: true,
      status: row?.status ?? "none",
      fullName: row?.fullName ?? null,
      submittedAt: row?.submittedAt ?? null,
    });
  } catch (e) {
    console.error("[api/kyc] GET failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    const rl = rateLimit(rateLimitKey("kyc", userId, req.headers), RATE_LIMITS.profile);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const b = (await req.json()) as Record<string, string | undefined>;
    const fullName = (b.fullName ?? "").trim();
    const birthDate = (b.birthDate ?? "").trim();
    const idType = (b.idType ?? "").trim();
    const idNumber = (b.idNumber ?? "").trim();
    const country = (b.country ?? "").trim();

    if (fullName.length < 3) return NextResponse.json({ ok: false, error: "Ad soyad gerekli." }, { status: 400 });
    if (!birthDate) return NextResponse.json({ ok: false, error: "Doğum tarihi gerekli." }, { status: 400 });
    if (!VALID_ID.has(idType)) return NextResponse.json({ ok: false, error: "Kimlik türü seç." }, { status: 400 });
    if (idNumber.length < 5) return NextResponse.json({ ok: false, error: "Kimlik numarası gerekli." }, { status: 400 });
    if (!country) return NextResponse.json({ ok: false, error: "Ülke gerekli." }, { status: 400 });

    // Belge boyut kontrolü.
    for (const k of ["docFront", "docBack"] as const) {
      if (b[k] && b[k]!.length > MAX_DOC) {
        return NextResponse.json({ ok: false, error: "Belge çok büyük (max ~4MB)." }, { status: 413 });
      }
    }

    // Kullanıcıyı garanti et (KYC öncesi).
    const u = await getCurrentUser();
    await upsertUser({ id: userId, email: u.email, name: u.name });

    await submitKyc({
      userId,
      fullName,
      birthDate,
      idType,
      idNumber,
      country,
      address: b.address ?? null,
      city: b.city ?? null,
      postalCode: b.postalCode ?? null,
      docFront: b.docFront ?? null,
      docBack: b.docBack ?? null,
    });

    return NextResponse.json({ ok: true, status: "pending" });
  } catch (e) {
    console.error("[api/kyc] POST failed:", e);
    return NextResponse.json({ ok: false, error: "Başvuru kaydedilemedi." }, { status: 500 });
  }
}
