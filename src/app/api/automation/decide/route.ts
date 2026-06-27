// AI işlem kararı — bir otomasyon kuralı için canlı bağlamı toplar, AI'a sorar,
// yapılandırılmış kararı (al/sat/bekle + gerekçe) döndürür. YÜRÜTMEZ.
// Yürütme ayrı adım: kullanıcı onaylar → /api/exchange/execute (Brain güvencesi).

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { rateLimit, rateLimitKey, RATE_LIMITS, tooManyRequests } from "@/lib/ratelimit";
import { decideTrade } from "@/lib/ai/decide-trade";
import { getMarketProvider } from "@/lib/market";
import { getExchangeConnection } from "@/lib/db/repo";
import { decryptSecret } from "@/lib/crypto/secrets";
import { getAccount, type BinanceEnv } from "@/lib/exchange/binance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STABLE = new Set(["USDT", "USDC", "BUSD", "DAI", "TUSD", "USD"]);

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    // AI çağrısı pahalı — rate limit (chat ile aynı bütçe).
    const rl = rateLimit(rateLimitKey("automation-decide", userId, req.headers), RATE_LIMITS.chat);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

    const body = (await req.json()) as { rule?: string; symbol?: string; exchange?: string };
    const rule = (body.rule ?? "").trim();
    const symbol = (body.symbol ?? "").toUpperCase().trim();
    const exchange = (body.exchange ?? "binance").toLowerCase();
    if (!rule || !symbol)
      return NextResponse.json({ ok: false, error: "rule ve symbol gerekli" }, { status: 400 });

    // Canlı fiyat
    const provider = getMarketProvider();
    let price = 0;
    let changePct = 0;
    try {
      const q = await provider.getQuote(symbol);
      price = q.price;
      changePct = q.changePct;
    } catch {
      /* fiyat yoksa AI yine de kural mantığını değerlendirebilir */
    }

    // Bağlı borsadan gerçek portföy/nakit/pozisyon (varsa)
    let portfolioValueUsd = 0;
    let currentPositionUsd = 0;
    let cashUsd = 0;
    const conn = await getExchangeConnection(userId, exchange);
    if (conn) {
      try {
        const account = await getAccount(
          conn.environment as BinanceEnv,
          decryptSecret(conn.apiKeyEnc),
          decryptSecret(conn.apiSecretEnc),
        );
        const nonStable = account.balances.map((b) => b.asset).filter((a) => !STABLE.has(a));
        const priceMap = new Map<string, number>();
        if (nonStable.length) {
          const quotes = await provider.getQuotes(nonStable);
          for (const q of quotes) priceMap.set(q.symbol.toUpperCase(), q.price);
        }
        for (const b of account.balances) {
          const total = b.free + b.locked;
          if (STABLE.has(b.asset)) {
            cashUsd += total;
            portfolioValueUsd += total;
          } else {
            const v = total * (priceMap.get(b.asset.toUpperCase()) ?? 0);
            portfolioValueUsd += v;
            if (b.asset.toUpperCase() === symbol.replace(/USDT$|USDC$|USD$/i, "")) currentPositionUsd += v;
          }
        }
      } catch {
        /* hesap çekilemezse bağlamsız AI kararı (genelde hold) */
      }
    }

    const decision = await decideTrade({
      rule,
      symbol,
      price,
      changePct,
      portfolioValueUsd,
      currentPositionUsd,
      cashUsd,
    });

    return NextResponse.json({
      ok: true,
      decision,
      context: { price, changePct, portfolioValueUsd, cashUsd, hasConnection: !!conn },
    });
  } catch (e) {
    console.error("[api/automation/decide] POST failed:", e);
    return NextResponse.json({ ok: false, error: "Karar üretilemedi." }, { status: 500 });
  }
}
