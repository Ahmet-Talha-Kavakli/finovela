import { NextRequest, NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const results = await getMarketProvider().search(q);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
