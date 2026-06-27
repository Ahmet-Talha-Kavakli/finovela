// Bağlı borsadaki GERÇEK bakiyeler — kullanıcının kendi hesabından.
// Anahtarlar sunucuda çözülür, hesap çekilir, fiyatlarla USD değeri hesaplanır.
// Düz metin anahtar yanıtta ASLA dönmez.

import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/current-user";
import { getExchangeConnection } from "@/lib/db/repo";
import { decryptSecret } from "@/lib/crypto/secrets";
import { getAccount, type BinanceEnv } from "@/lib/exchange/binance";
import { getMarketProvider } from "@/lib/market";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ ok: false, error: "Oturum gerekli" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const exchange = (searchParams.get("exchange") ?? "binance").toLowerCase();

    const conn = await getExchangeConnection(userId, exchange);
    if (!conn) {
      return NextResponse.json({ ok: false, error: "Bağlantı bulunamadı" }, { status: 404 });
    }

    const apiKey = decryptSecret(conn.apiKeyEnc);
    const apiSecret = decryptSecret(conn.apiSecretEnc);
    const env = conn.environment as BinanceEnv;

    const account = await getAccount(env, apiKey, apiSecret);

    // Her varlık için USD fiyatı (stablecoin'ler 1$, gerisi piyasa sağlayıcıdan).
    const provider = getMarketProvider();
    const STABLE = new Set(["USDT", "USDC", "BUSD", "DAI", "TUSD", "USD"]);
    const symbols = account.balances
      .map((b) => b.asset)
      .filter((a) => !STABLE.has(a));

    const priceMap = new Map<string, number>();
    if (symbols.length) {
      const quotes = await provider.getQuotes(symbols);
      for (const q of quotes) priceMap.set(q.symbol.toUpperCase(), q.price);
    }

    const holdings = account.balances.map((b) => {
      const total = b.free + b.locked;
      const price = STABLE.has(b.asset) ? 1 : priceMap.get(b.asset.toUpperCase()) ?? 0;
      return {
        asset: b.asset,
        free: b.free,
        locked: b.locked,
        total,
        price,
        valueUsd: total * price,
      };
    });
    const totalUsd = holdings.reduce((s, h) => s + h.valueUsd, 0);

    return NextResponse.json({
      ok: true,
      exchange,
      environment: env,
      canTrade: account.canTrade,
      totalUsd,
      holdings: holdings.sort((a, b) => b.valueUsd - a.valueUsd),
    });
  } catch (e) {
    console.error("[api/exchange/balances] GET failed:", e);
    const msg = e instanceof Error ? e.message : "Bakiye alınamadı";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
