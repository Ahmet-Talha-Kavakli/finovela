// Otonom/yarı-otonom işlem yürütme — Finovela Brain güvencesi altında.
// POST { exchange, symbol, side, quantity, confirmedPin? }
//   1) Bağlantı + işlem yetkisi kontrolü
//   2) Brain güven bütçesi kontrolü (DB'deki ayarlar: yetki, kill-switch, limitler)
//   3) PIN gerekiyorsa doğrula
//   4) GERÇEK emir → karar defteri
//
// "advisory" yetki veya kill-switch → reddedilir (sadece öneri modu).
// Bu route hem AI/otomasyon motoru hem manuel "Brain ile çalıştır" tarafından kullanılır.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { getExchangeConnection, getBrain, addDecision } from "@/lib/db/repo";
import { decryptSecret } from "@/lib/crypto/secrets";
import { placeMarketOrder, getAccount, BinanceError, type BinanceEnv } from "@/lib/exchange/binance";
import { checkBudget, type BrainLimits } from "@/lib/brain/guard";
import { getMarketProvider } from "@/lib/market";
import { countTodaysTrades } from "@/lib/db/repo";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STABLE = new Set(["USDT", "USDC", "BUSD", "DAI", "TUSD", "USD"]);
const MAX_QTY = 1_000_000;

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    const rl = rateLimit(rateLimitKey("exchange-execute", userId, req.headers), RATE_LIMITS.order);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const body = (await req.json()) as {
      exchange?: string;
      symbol?: string;
      side?: string;
      quantity?: number;
      rationale?: string;
      ruleId?: string;
    };
    const exchange = (body.exchange ?? "binance").toLowerCase();
    const symbol = (body.symbol ?? "").toUpperCase().trim();
    const side = (body.side ?? "").toUpperCase();
    const quantity = Number(body.quantity);

    if (!symbol) return NextResponse.json({ ok: false, error: "symbol gerekli" }, { status: 400 });
    if (side !== "BUY" && side !== "SELL")
      return NextResponse.json({ ok: false, error: "side BUY veya SELL olmalı" }, { status: 400 });
    if (!(quantity > 0)) return NextResponse.json({ ok: false, error: "Geçerli miktar gir" }, { status: 400 });
    if (quantity > MAX_QTY) return NextResponse.json({ ok: false, error: "Miktar çok yüksek." }, { status: 400 });

    const conn = await getExchangeConnection(userId, exchange);
    if (!conn) return NextResponse.json({ ok: false, error: "Bağlantı bulunamadı" }, { status: 404 });
    if (!conn.canTrade)
      return NextResponse.json({ ok: false, error: "Bu bağlantıda işlem yetkisi yok." }, { status: 403 });

    const apiKey = decryptSecret(conn.apiKeyEnc);
    const apiSecret = decryptSecret(conn.apiSecretEnc);
    const env = conn.environment as BinanceEnv;

    // ── Brain güven bütçesi (DB'deki kullanıcı ayarları) ───────────────────────
    const brainRow = await getBrain(userId);
    const brain: BrainLimits = {
      authority: brainRow.authority as BrainLimits["authority"],
      killSwitch: !!brainRow.killSwitch,
      maxTradePct: brainRow.maxTradePct,
      maxDailyTrades: brainRow.maxDailyTrades,
      maxPositionPct: brainRow.maxPositionPct,
      requirePinOver: brainRow.requirePinOver ?? 1000,
    };

    // Hesap + fiyat → işlem değeri ve portföy değeri (gerçek).
    const account = await getAccount(env, apiKey, apiSecret);
    const provider = getMarketProvider();
    const baseAsset = symbol.replace(/USDT$|USDC$|BUSD$|USD$/i, "");
    let price = 0;
    try {
      const q = await provider.getQuote(baseAsset);
      price = q.price;
    } catch {
      /* fiyat alınamadı; tradeValue 0 → limit kontrolü gevşek kalır */
    }
    const tradeValue = price * quantity;

    // Portföy değeri (USD) — bütçe yüzdeleri için.
    let portfolioValue = 0;
    const priceMap = new Map<string, number>();
    const nonStable = account.balances.map((b) => b.asset).filter((a) => !STABLE.has(a));
    if (nonStable.length) {
      try {
        const quotes = await provider.getQuotes(nonStable);
        for (const q of quotes) priceMap.set(q.symbol.toUpperCase(), q.price);
      } catch {
        /* fiyatsız devam */
      }
    }
    for (const b of account.balances) {
      const p = STABLE.has(b.asset) ? 1 : priceMap.get(b.asset.toUpperCase()) ?? 0;
      portfolioValue += (b.free + b.locked) * p;
    }

    // Günün GERÇEK işlem sayısı (karar defterinden) — günlük limit uygulanır.
    const todaysTrades = await countTodaysTrades(userId);

    const verdict = checkBudget(brain, { tradeValue, portfolioValue, todaysTrades });
    if (!verdict.allowed) {
      // Reddi de karar defterine yaz (denetim izi).
      try {
        await addDecision(userId, {
          id: `blk_${Date.now()}`,
          ts: Date.now(),
          kind: "blocked",
          action: `${side} ${quantity} ${symbol} engellendi`,
          rationale: verdict.reason ?? "Brain bütçesi reddetti",
          authority: brain.authority,
          executed: 0,
        });
      } catch {
        /* ignore */
      }
      return NextResponse.json({ ok: false, blocked: true, reason: verdict.reason }, { status: 403 });
    }

    // PIN gerekiyorsa: bu route PIN doğrulamasını client tarafına bırakır (use-security
    // client-side). needsPin true dönüp client onay+PIN sonrası /api/exchange/order çağırır.
    if (verdict.needsPin) {
      return NextResponse.json({
        ok: false,
        needsPin: true,
        reason: `Bu işlem ${brain.requirePinOver}$ eşiğinin üstünde — PIN gerekli.`,
        preview: { symbol, side, quantity, tradeValue },
      });
    }

    // ── GERÇEK emir ────────────────────────────────────────────────────────────
    const result = await placeMarketOrder(env, apiKey, apiSecret, symbol, side, quantity);

    try {
      await addDecision(userId, {
        id: `ord_${result.orderId}_${Date.now()}`,
        ts: Date.now(),
        kind: "trade",
        action: `${side === "BUY" ? "Alış" : "Satış"} · ${result.executedQty} ${symbol} @ ${result.price.toFixed(2)}`,
        rationale: body.rationale ?? `Finovela Brain otonom yürütme (${env}).`,
        goalRef: body.ruleId ?? null,
        authority: brain.authority,
        executed: 1,
        snapshot: JSON.stringify({ orderId: result.orderId, status: result.status, tradeValue }),
      });
    } catch {
      /* defter kritik değil */
    }

    return NextResponse.json({ ok: true, order: result, authority: brain.authority });
  } catch (e) {
    console.error("[api/exchange/execute] POST failed:", e);
    const msg = e instanceof BinanceError ? e.message : "İşlem yürütülemedi.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
