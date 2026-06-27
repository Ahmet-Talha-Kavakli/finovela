import { NextRequest, NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";
import { cached } from "@/lib/market/cache";

const NEWS_TTL = 300; // saniye — haber akışı dakika ölçeğinde tazelenmesi yeterli

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? undefined;
  try {
    const sym = symbol?.toUpperCase();
    // Sembol varsa ona göre, yoksa "general" anahtarıyla önbellekle.
    const key = `news:${sym ?? "general"}`;
    const news = await cached(key, NEWS_TTL, () => getMarketProvider().getNews(sym));
    return NextResponse.json({ news });
  } catch (e) {
    console.error("[api/market/news] failed:", e);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
