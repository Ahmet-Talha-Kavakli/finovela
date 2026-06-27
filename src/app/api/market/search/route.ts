import { NextRequest, NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";
import { cached } from "@/lib/market/cache";

const SEARCH_TTL = 300; // saniye — arama sonuçları nadiren değişir

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    // Sorgu metnine göre önbellekle (normalleştirilmiş: trim + küçük harf).
    const key = `search:${q.trim().toLowerCase()}`;
    const results = await cached(key, SEARCH_TTL, () => getMarketProvider().search(q));
    return NextResponse.json({ results });
  } catch (e) {
    console.error("[api/market/search] failed:", e);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
