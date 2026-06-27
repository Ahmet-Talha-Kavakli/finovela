// Bilanço takvimi — GERÇEK veri (Finnhub /calendar/earnings).
// Public: landing/dashboard tüketir (market/* kasıtlı açık). Mock provider'da
// getEarnings yoksa boş döner (graceful).

import { NextResponse } from "next/server";
import { getMarketProvider } from "@/lib/market";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    // Varsayılan: 7 gün önce → 14 gün sonra (raporlanan + yaklaşan).
    const from = searchParams.get("from") ?? ymd(new Date(now.getTime() - 7 * 86400000));
    const to = searchParams.get("to") ?? ymd(new Date(now.getTime() + 14 * 86400000));

    const provider = getMarketProvider();
    if (typeof provider.getEarnings !== "function") {
      return NextResponse.json({ ok: true, earnings: [], note: "Sağlayıcı bilanço takvimini desteklemiyor." });
    }
    const all = await provider.getEarnings(from, to);
    const today = ymd(now);
    const upcoming = all
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 40);
    const reported = all
      .filter((e) => e.date < today && e.epsActual != null)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 40);

    return NextResponse.json({ ok: true, upcoming, reported });
  } catch (e) {
    console.error("[api/market/earnings] failed:", e);
    return NextResponse.json({ ok: false, error: "Bilanço takvimi alınamadı.", upcoming: [], reported: [] });
  }
}
