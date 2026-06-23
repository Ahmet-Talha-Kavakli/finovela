import { NextRequest, NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") ?? undefined;
  try {
    const news = await getMarketProvider().getNews(symbol?.toUpperCase());
    return NextResponse.json({ news });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
