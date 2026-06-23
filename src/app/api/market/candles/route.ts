import { NextRequest, NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";
import type { CandleResolution } from "@/lib/market";

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
    const candles = await getMarketProvider().getCandles(symbol.toUpperCase(), resolution, from, to);
    return NextResponse.json({ candles });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
