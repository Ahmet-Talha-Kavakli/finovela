"use client";

import { useEffect, useState } from "react";
import { Card, AIS_UP, AIS_DOWN } from "@/components/dashboard/ais-kit";
import { TickerBadge } from "@/components/dashboard/ui";
import { PriceChart } from "@/components/dashboard/price-chart";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { TradePanel } from "@/components/dashboard/trade-panel";
import { useWatchlist } from "@/lib/dashboard/use-watchlist";
import { fmtMoney } from "@/lib/dashboard/data";
import { getUniverseEntry } from "@/lib/market/universe";
import { Star, ArrowSquareOut } from "@phosphor-icons/react";

type Quote = {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  marketCap?: number;
  sector?: string;
  currency?: string;
};
type News = { id: string; headline: string; source: string; url: string; datetime: number };

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className="num font-medium" style={{ color: up ? AIS_UP : AIS_DOWN }}>
      {up ? "▲" : "▼"} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export function StockDetail({ symbol }: { symbol: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [news, setNews] = useState<News[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const { has, toggle } = useWatchlist();

  useEffect(() => {
    setQuoteLoading(true);
    setNewsLoading(true);
    fetch(`/api/market/quote?symbol=${symbol}`)
      .then((r) => r.json())
      .then((d) => d.quote && setQuote(d.quote))
      .catch(() => {})
      .finally(() => setQuoteLoading(false));
    fetch(`/api/market/news?symbol=${symbol}`)
      .then((r) => r.json())
      .then((d) => d.news && setNews(d.news.slice(0, 6)))
      .catch(() => {})
      .finally(() => setNewsLoading(false));
  }, [symbol]);

  const watched = has(symbol);
  const ccy = quote?.currency ?? getUniverseEntry(symbol).currency ?? "USD";

  return (
    <div className="mx-auto max-w-5xl space-y-5 px-8 py-10">
      {/* başlık + fiyat */}
      <div className="flex flex-wrap items-center gap-4">
        <TickerBadge symbol={symbol} size={48} />
        <div>
          <h1 className="text-[22px] font-normal tracking-tight text-[var(--ais-fg)]">{symbol}</h1>
          <p className="text-[13px] text-[var(--ais-fg-muted)]">{quote?.name ?? "—"}</p>
        </div>
        <div className="ml-2">
          {!quote && quoteLoading ? (
            <>
              <div className="ais-skeleton h-[30px] w-32" />
              <div className="ais-skeleton mt-2 h-[15px] w-24" />
            </>
          ) : (
            <>
              <p className="num text-[28px] font-normal tracking-tight text-[var(--ais-fg)]">
                {quote ? fmtMoney(quote.price, ccy) : "—"}
              </p>
              {quote && (
                <div className="flex items-center gap-2 text-[13px]">
                  <Delta value={quote.changePct} />
                  <span className="num text-[var(--ais-fg-faint)]">
                    {quote.change >= 0 ? "+" : ""}
                    {fmtMoney(quote.change, ccy)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
        <button
          onClick={() => toggle(symbol)}
          className="ml-auto flex items-center gap-2 rounded-lg border border-[var(--ais-line-strong)] px-4 py-2 text-[12.5px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
        >
          <Star size={16} weight={watched ? "fill" : "regular"} className={watched ? "text-[var(--ais-accent)]" : ""} />
          {watched ? "İzleme listesinde" : "İzleme listesine ekle"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* grafik */}
        <Card className="lg:col-span-2">
          <ChartFrame
            title={`${symbol} fiyat grafiği`}
            render={(big) => <PriceChart symbol={symbol} height={big ? 540 : 320} />}
          />
          {!quote && quoteLoading ? (
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--ais-line)] pt-5 sm:grid-cols-4">
              {["Açılış", "En yüksek", "En düşük", "Önceki kapanış"].map((l) => (
                <div key={l}>
                  <p className="text-[12px] text-[var(--ais-fg-faint)]">{l}</p>
                  <div className="ais-skeleton mt-1.5 h-[14px] w-16" />
                </div>
              ))}
            </div>
          ) : (
            quote && (
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--ais-line)] pt-5 sm:grid-cols-4">
                {[
                  ["Açılış", fmtMoney(quote.open, ccy)],
                  ["En yüksek", fmtMoney(quote.high, ccy)],
                  ["En düşük", fmtMoney(quote.low, ccy)],
                  ["Önceki kapanış", fmtMoney(quote.prevClose, ccy)],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-[12px] text-[var(--ais-fg-faint)]">{l}</p>
                    <p className="num mt-1 text-[13.5px] font-medium text-[var(--ais-fg)]">{v}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </Card>

        {/* trade paneli */}
        <TradePanel symbol={symbol} price={quote?.price ?? 0} />
      </div>

      {/* haber */}
      <Card>
        <p className="mb-4 text-[12px] text-[var(--ais-fg-faint)]">Son haberler</p>
        {newsLoading && news.length === 0 ? (
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 px-2 py-3">
                <div className="flex-1 space-y-2">
                  <div className="ais-skeleton h-[13px] w-3/4" />
                  <div className="ais-skeleton h-[11px] w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <p className="text-[13px] text-[var(--ais-fg-muted)]">Yakın zamanda haber yok.</p>
        ) : (
          <div className="space-y-1">
            {news.map((n) => (
              <a
                key={n.id}
                href={n.url}
                target="_blank"
                rel="noreferrer"
                className="ais-row flex items-start gap-3 px-2 py-3"
              >
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[var(--ais-fg)]">{n.headline}</p>
                  <p className="mt-1 text-[12px] text-[var(--ais-fg-muted)]">{n.source}</p>
                </div>
                <ArrowSquareOut size={16} weight="regular" className="mt-0.5 shrink-0 text-[var(--ais-fg-faint)]" />
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
