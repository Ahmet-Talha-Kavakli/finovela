import { NextRequest, NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";
import type { CandleResolution } from "@/lib/market";
import { cached } from "@/lib/market/cache";

const CANDLES_TTL = 60; // saniye — mum verisi yavaş değişir

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const symbol = sp.get("symbol");
  const resolution = (sp.get("resolution") ?? "D") as CandleResolution;
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }
  const now = Math.floor(Date.now() / 1000);
  const defaultFrom = now - 365 * 86400;
  const from = Number(sp.get("from") ?? defaultFrom);
  const to = Number(sp.get("to") ?? now);
  try {
    const sym = symbol.toUpperCase();
    // Sembol + çözünürlük ile önbellekle. from/to varsayılanları her saniye
    // değiştiği için anahtara dahil edilmez; 60s TTL pencere kaymasını tolere
    // eder ve aynı grafik için Finnhub'a tekrar tekrar gidilmesini önler.
    const candles = await cached(`candles:${sym}:${resolution}`, CANDLES_TTL, () =>
      getMarketProvider().getCandles(sym, resolution, from, to),
    );
    return NextResponse.json({ candles });
  } catch (e) {
    console.error("[api/market/candles] failed:", e);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
