// GERÇEK ABD Hazine getiri eğrisi — Treasury'nin resmi açık API'si (anahtar yok).
// Günlük "Treasury Par Yield Curve Rates". 3ay–10yıl terimlerini döndürür.
// Erişilemezse boş döner (sayfa yedek değerlere düşer).

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// 6 saat cache — getiriler günlük güncellenir.
export const revalidate = 21600;

type Term = { term: string; termMonths: number; yield: number };

export async function GET() {
  try {
    const year = new Date().getUTCFullYear();
    // Treasury resmi veri API'si (JSON). En güncel kayıtları çek.
    const url =
      "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates" +
      "?sort=-record_date&page[size]=1&filter=record_date:gte:" +
      `${year - 1}-01-01`;
    // NOT: avg_interest_rates tek tek terimleri vermez; bunun yerine resmi
    // Daily Treasury Par Yield Curve CSV/JSON kaynağını kullanırız.
    const curveUrl =
      "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/" +
      `${year}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`;

    const res = await fetch(curveUrl, { next: { revalidate: 21600 } });
    if (!res.ok) throw new Error(`Treasury ${res.status}`);
    const csv = await res.text();
    const terms = parseCurveCsv(csv);
    if (!terms.length) throw new Error("Eğri ayrıştırılamadı");
    void url; // alternatif kaynak (kullanılmadı)
    return NextResponse.json({ ok: true, terms });
  } catch (e) {
    console.error("[api/market/treasury] failed:", e);
    return NextResponse.json({ ok: false, error: "Hazine getirileri alınamadı.", terms: [] });
  }
}

// CSV'nin en üst (en güncel) satırından terimleri çıkar.
// Sütun başlıkları: "Date","1 Mo","2 Mo","3 Mo","4 Mo","6 Mo","1 Yr","2 Yr",...
const WANT: { col: string; term: string; months: number }[] = [
  { col: "3 Mo", term: "3mo", months: 3 },
  { col: "6 Mo", term: "6mo", months: 6 },
  { col: "1 Yr", term: "1y", months: 12 },
  { col: "2 Yr", term: "2y", months: 24 },
  { col: "5 Yr", term: "5y", months: 60 },
  { col: "10 Yr", term: "10y", months: 120 },
];

function parseCurveCsv(csv: string): Term[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  const row = splitCsvLine(lines[1]); // en güncel kayıt
  const idx = (name: string) => headers.findIndex((h) => h.trim() === name);
  const out: Term[] = [];
  for (const w of WANT) {
    const i = idx(w.col);
    if (i >= 0) {
      const v = parseFloat(row[i]);
      if (!Number.isNaN(v)) out.push({ term: w.term, termMonths: w.months, yield: v });
    }
  }
  return out;
}

function splitCsvLine(line: string): string[] {
  // Treasury CSV basit (tırnaklı alan içermez) ama güvenli bir bölücü.
  return line.split(",").map((s) => s.replace(/^"|"$/g, ""));
}
