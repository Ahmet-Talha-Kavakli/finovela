// Gerçek emir gönderme — bağlı borsada kullanıcının KENDİ hesabında al/sat.
// POST { exchange, symbol, side, quantity }. Anahtarlar sunucuda çözülür.
// Finovela parayı tutmaz; emir doğrudan kullanıcının borsa hesabında gerçekleşir.
//
// GÜVENLİK: canTrade yetkisi yoksa reddedilir. İzinler bağlanırken doğrulanır.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { getExchangeConnection, addDecision, getBrain } from "@/lib/db/repo";
import { decryptSecret } from "@/lib/crypto/secrets";
import { placeMarketOrder, BinanceError, type BinanceEnv } from "@/lib/exchange/binance";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tek emirde mantıksız büyük miktar koruması (kaza/istismar). Baz varlık adedi.
const MAX_QTY = 1_000_000;

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    // Rate limit — gerçek para; emir spam'ini sınırla.
    const rl = rateLimit(rateLimitKey("exchange-order", userId, req.headers), RATE_LIMITS.order);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const body = (await req.json()) as {
      exchange?: string;
      symbol?: string;
      side?: string;
      quantity?: number;
    };
    const exchange = (body.exchange ?? "binance").toLowerCase();
    const symbol = (body.symbol ?? "").toUpperCase().trim();
    const side = (body.side ?? "").toUpperCase();
    const quantity = Number(body.quantity);

    if (!symbol) return NextResponse.json({ ok: false, error: "symbol gerekli" }, { status: 400 });
    if (side !== "BUY" && side !== "SELL")
      return NextResponse.json({ ok: false, error: "side BUY veya SELL olmalı" }, { status: 400 });
    if (!(quantity > 0))
      return NextResponse.json({ ok: false, error: "Geçerli bir miktar gir" }, { status: 400 });
    if (quantity > MAX_QTY)
      return NextResponse.json({ ok: false, error: "Miktar çok yüksek." }, { status: 400 });

    const conn = await getExchangeConnection(userId, exchange);
    if (!conn) return NextResponse.json({ ok: false, error: "Bağlantı bulunamadı" }, { status: 404 });
    if (!conn.canTrade)
      return NextResponse.json({ ok: false, error: "Bu bağlantıda işlem yetkisi yok." }, { status: 403 });

    // Acil durdurma (kill-switch) manuel emri de durdurur — her şeyin üstünde.
    const brain = await getBrain(userId);
    if (brain.killSwitch) {
      return NextResponse.json({ ok: false, error: "Acil durdurma aktif — tüm işlemler durduruldu." }, { status: 403 });
    }

    const apiKey = decryptSecret(conn.apiKeyEnc);
    const apiSecret = decryptSecret(conn.apiSecretEnc);
    const env = conn.environment as BinanceEnv;

    // GERÇEK emir — kullanıcının borsa hesabında.
    const result = await placeMarketOrder(env, apiKey, apiSecret, symbol, side, quantity);

    // Karar defterine yaz (denetim izi). Hata olsa bile emir başarılı sayılır.
    try {
      await addDecision(userId, {
        id: `ord_${result.orderId}_${Date.now()}`,
        ts: Date.now(),
        kind: "trade",
        action: `${side === "BUY" ? "Alış" : "Satış"} · ${result.executedQty} ${symbol} @ ${result.price.toFixed(2)}`,
        rationale: `Bağlı ${exchange} (${env}) hesabında gerçek piyasa emri.`,
        authority: "user",
        executed: 1,
        snapshot: JSON.stringify({ orderId: result.orderId, status: result.status }),
      });
    } catch {
      /* defter yazımı kritik değil */
    }

    return NextResponse.json({ ok: true, order: result });
  } catch (e) {
    console.error("[api/exchange/order] POST failed:", e);
    const msg = e instanceof BinanceError ? e.message : "Emir gönderilemedi.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
