import { NextRequest, NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }
  try {
    const profile = await getMarketProvider().getProfile(symbol.toUpperCase());
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
