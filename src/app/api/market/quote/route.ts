import { NextRequest, NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";
import { cached } from "@/lib/market/cache";

export const dynamic = "force-dynamic"; // her istekte taze fiyat (gecikmeli veri fix)
export const revalidate = 0;

const NO_CACHE = { "cache-control": "no-store, max-age=0" };

// force-dynamic + no-store, provider'daki per-fetch `next: { revalidate }`'i
// devre dışı bırakır. Bu yüzden tazeliği bellek-içi `cached()` ile sağlıyoruz:
// Next fetch cache ayarından bağımsız çalışır ve sembol başına Finnhub'a 15s'de
// bir gider. Yanıt şekli ve header'lar aynı kalır.
const QUOTE_TTL = 15; // saniye

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols");
  const symbol = req.nextUrl.searchParams.get("symbol");
  const provider = getMarketProvider();
  try {
    if (symbols) {
      const list = symbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      // Her sembolü ayrı ayrı önbellekle: farklı dashboard'lar örtüşen sembol
      // kümeleri istediğinde tek tek tazelik paylaşılır. Tek bir sembol
      // başarısız olursa tüm yanıtı düşürmek yerine onu atla (provider'ın
      // getQuotes davranışıyla uyumlu).
      const settled = await Promise.allSettled(
        list.map((s) => cached(`quote:${s}`, QUOTE_TTL, () => provider.getQuote(s))),
      );
      const quotes = settled
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof provider.getQuote>>> => r.status === "fulfilled")
        .map((r) => r.value);
      return NextResponse.json({ quotes }, { headers: NO_CACHE });
    }
    if (symbol) {
      const sym = symbol.toUpperCase();
      const quote = await cached(`quote:${sym}`, QUOTE_TTL, () => provider.getQuote(sym));
      return NextResponse.json({ quote }, { headers: NO_CACHE });
    }
    return NextResponse.json({ error: "symbol or symbols required" }, { status: 400 });
  } catch (e) {
    console.error("[api/market/quote] failed:", e);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
