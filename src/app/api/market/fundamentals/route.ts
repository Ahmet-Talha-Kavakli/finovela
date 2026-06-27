import { NextRequest, NextResponse } from "next/server";
import { cached } from "@/lib/market/cache";
import { fetchYahooFundamentals } from "@/lib/market/yahoo-candles";

// GERÇEK 52-haftalık yüksek/düşük + spot — Yahoo chart meta'sından.
// compare sayfasındaki uydurma RNG değerlerinin yerine geçer.
const TTL = 900; // 15 dk — 52h aralığı yavaş değişir

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }
  try {
    const sym = symbol.toUpperCase();
    const fundamentals = await cached(`fundamentals:${sym}`, TTL, () =>
      fetchYahooFundamentals(sym),
    );
    // Yahoo ulaşılamazsa null döner; sahte sayı UYDURMUYORUZ — alan boş kalır.
    return NextResponse.json({ fundamentals: fundamentals ?? null });
  } catch (e) {
    console.error("[api/market/fundamentals] failed:", e);
    return NextResponse.json({ fundamentals: null });
  }
}
