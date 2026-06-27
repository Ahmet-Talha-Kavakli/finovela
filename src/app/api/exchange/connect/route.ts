// Borsa bağlantısı — kullanıcının KENDİ hesabına non-custodial erişim.
// POST: anahtarları DOĞRULA (gerçek API çağrısı) → şifrele → DB'ye kaydet.
// GET: kullanıcının bağlantılarını listele (anahtarlar maskeli, ASLA düz dönmez).
// DELETE: bağlantıyı kaldır.
//
// Clerk userId sunucudan; istemciden gelen kimlik kullanılmaz.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import {
  upsertExchangeConnection,
  listExchangeConnections,
  deleteExchangeConnection,
} from "@/lib/db/repo";
import { encryptSecret, decryptSecret, maskKey } from "@/lib/crypto/secrets";
import { validateKeys, type BinanceEnv } from "@/lib/exchange/binance";
import { canAddMore } from "@/lib/plan-access";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUPPORTED = new Set(["binance"]);

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    // Rate limit — borsa doğrulaması harici API çağrısı yapar (kötüye kullanımı sınırla).
    const rl = rateLimit(rateLimitKey("exchange-connect", userId, req.headers), RATE_LIMITS.exchange);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const body = (await req.json()) as {
      exchange?: string;
      apiKey?: string;
      apiSecret?: string;
      environment?: string;
      label?: string;
    };
    const exchange = (body.exchange ?? "").toLowerCase();
    const apiKey = (body.apiKey ?? "").trim();
    const apiSecret = (body.apiSecret ?? "").trim();
    const environment: BinanceEnv = body.environment === "live" ? "live" : "testnet";

    if (!SUPPORTED.has(exchange)) {
      return NextResponse.json({ ok: false, error: "Bu borsa henüz desteklenmiyor." }, { status: 400 });
    }
    if (apiKey.length < 8 || apiSecret.length < 8) {
      return NextResponse.json({ ok: false, error: "API anahtarı veya secret eksik." }, { status: 400 });
    }

    // 1) GERÇEK doğrulama — anahtarlar çalışıyor mu, hangi izinler var?
    const v = await validateKeys(environment, apiKey, apiSecret);
    if (!v.ok) {
      return NextResponse.json(
        { ok: false, error: `Anahtarlar doğrulanamadı: ${v.error}` },
        { status: 400 },
      );
    }
    if (!v.canTrade) {
      return NextResponse.json(
        { ok: false, error: "Bu anahtarda işlem (trade) yetkisi yok. Binance'te 'Enable Spot Trading' aç." },
        { status: 400 },
      );
    }

    // 1.5) PLAN: bağlı hesap limiti. Yeni bir borsa ekleniyorsa (mevcut güncelleme
    // değilse) plan limitine bak. Free=1, Pro=5, Unlimited=∞.
    const existingConns = await listExchangeConnections(userId);
    const isNew = !existingConns.some((c) => c.exchange === exchange);
    if (isNew) {
      const gate = await canAddMore(userId, "connectedAccounts", existingConns.length);
      if (!gate.ok) {
        return NextResponse.json(
          {
            ok: false,
            error: `Planın ${gate.limit} bağlı hesaba izin veriyor. Daha fazlası için yükselt.`,
            upgrade: true,
          },
          { status: 403 },
        );
      }
    }

    // 2) Şifrele + kaydet (düz metin anahtar ASLA DB'ye girmez)
    await upsertExchangeConnection({
      userId,
      exchange,
      label: body.label ?? null,
      environment,
      apiKeyEnc: encryptSecret(apiKey),
      apiSecretEnc: encryptSecret(apiSecret),
      canTrade: v.canTrade ? 1 : 0,
      canWithdraw: v.canWithdraw ? 1 : 0,
    });

    // 3) Sonuç — para çekme yetkisi varsa kullanıcıyı uyar
    return NextResponse.json({
      ok: true,
      exchange,
      environment,
      canTrade: v.canTrade,
      canWithdraw: v.canWithdraw,
      warning: v.canWithdraw
        ? "Bu anahtarda PARA ÇEKME yetkisi açık. Güvenlik için yalnızca işlem yetkili anahtar kullanman önerilir."
        : null,
    });
  } catch (e) {
    console.error("[api/exchange/connect] POST failed:", e);
    return NextResponse.json({ ok: false, error: "Bağlantı kurulamadı." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
    const rows = await listExchangeConnections(userId);
    // Anahtarlar ASLA düz dönmez — yalnızca maskeli önizleme.
    const connections = rows.map((r) => {
      let masked = "••••";
      try {
        masked = maskKey(decryptSecret(r.apiKeyEnc));
      } catch {
        /* bozuksa maskeli kalsın */
      }
      return {
        exchange: r.exchange,
        label: r.label,
        environment: r.environment,
        canTrade: !!r.canTrade,
        canWithdraw: !!r.canWithdraw,
        status: r.status,
        apiKeyMasked: masked,
        createdAt: r.createdAt,
      };
    });
    return NextResponse.json({ ok: true, connections });
  } catch (e) {
    console.error("[api/exchange/connect] GET failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const exchange = (searchParams.get("exchange") ?? "").toLowerCase();
    if (!exchange) return NextResponse.json({ ok: false, error: "exchange gerekli" }, { status: 400 });
    await deleteExchangeConnection(userId, exchange);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/exchange/connect] DELETE failed:", e);
    return NextResponse.json({ ok: false, error: "Bir hata oluştu" }, { status: 500 });
  }
}
