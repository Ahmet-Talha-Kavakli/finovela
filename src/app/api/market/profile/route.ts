import { NextRequest, NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";
import { cached } from "@/lib/market/cache";

const PROFILE_TTL = 3600; // saniye — şirket profili neredeyse hiç değişmez

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }
  try {
    const sym = symbol.toUpperCase();
    const profile = await cached(`profile:${sym}`, PROFILE_TTL, () =>
      getMarketProvider().getProfile(sym),
    );
    return NextResponse.json({ profile });
  } catch (e) {
    console.error("[api/market/profile] failed:", e);
    return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 });
  }
}
