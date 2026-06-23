import { NextRequest, NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";

export async function GET(req: NextRequest) {
  const symbols = req.nextUrl.searchParams.get("symbols");
  const symbol = req.nextUrl.searchParams.get("symbol");
  const provider = getMarketProvider();
  try {
    if (symbols) {
      const list = symbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
      const quotes = await provider.getQuotes(list);
      return NextResponse.json({ quotes });
    }
    if (symbol) {
      const quote = await provider.getQuote(symbol.toUpperCase());
      return NextResponse.json({ quote });
    }
    return NextResponse.json({ error: "symbol or symbols required" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
