import { NextRequest, NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";
import { cached } from "@/lib/market/cache";

// Sparkline serileri yavaş değişir; 5 dk cache yeterli (mini trend çizgisi).
const SPARK_TTL = 300;
// Tek istekte aşırı sembol gelmesini sınırla (kötüye kullanım + sağlayıcı yükü).
const MAX_SYMBOLS = 60;

/**
 * Toplu sparkline endpoint'i — birçok sembol için son ~30 günlük kapanış serisi.
 * Sparkline mini-grafiklerini GERÇEK fiyat geçmişiyle besler (seed-sahte yerine).
 * Her sembol bağımsız cache'lenir; biri başarısız olursa diğerleri etkilenmez.
 * Dönüş: { series: { [symbol]: number[] } }  (boş dizi = veri yok → fallback).
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))].slice(0, MAX_SYMBOLS);
  if (symbols.length === 0) {
    return NextResponse.json({ series: {} });
  }

  const now = Math.floor(Date.now() / 1000);
  const from = now - 45 * 86400; // ~45 gün al, son 30 noktayı kullan

  const provider = getMarketProvider();
  const entries = await Promise.all(
    symbols.map(async (sym) => {
      try {
        const candles = await cached(`spark:${sym}`, SPARK_TTL, async () => {
          const c = await provider.getCandles(sym, "D", from, now);
          // Sadece kapanışları al, son 30'a indir (mini grafik için yeterli).
          return (c ?? []).map((x) => x.close).filter((v) => Number.isFinite(v) && v > 0).slice(-30);
        });
        return [sym, candles] as const;
      } catch {
        return [sym, [] as number[]] as const;
      }
    }),
  );

  const series: Record<string, number[]> = {};
  for (const [sym, data] of entries) series[sym] = data;
  return NextResponse.json({ series });
}
