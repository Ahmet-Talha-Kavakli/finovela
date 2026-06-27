"use client";

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { PageTitle, SectionCard, IconChip, AIS_ACCENT, AIS_UP, AIS_DOWN } from "@/components/dashboard/ais-kit";
import { Markdown } from "@/components/dashboard/markdown";
import { newsSentiment, type NewsSentiment } from "@/lib/dashboard/sentiment";
import {
  Sparkle,
  Newspaper,
  ArrowSquareOut,
} from "@phosphor-icons/react";

type NewsItem = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  datetime: number;
  image?: string;
  related?: string;
  sentiment?: "positive" | "neutral" | "negative";
};

// Duyarlılık renkleri — AIS tek istisna renkler (yeşil/kırmızı), gerisi nötr.
const sentColor: Record<NewsSentiment, string> = {
  positive: AIS_UP,
  negative: AIS_DOWN,
  neutral: "var(--ais-fg-muted)",
};
const sentLabelTr: Record<NewsSentiment, string> = {
  positive: "Olumlu",
  negative: "Olumsuz",
  neutral: "Nötr",
};

type Filter = "all" | NewsSentiment;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "positive", label: "Olumlu" },
  { key: "neutral", label: "Nötr" },
  { key: "negative", label: "Olumsuz" },
];

/** Türkçe göreli zaman — SADECE istemci tarafında (now parametresi mount sonrası). */
function relativeTimeTr(datetime: number, now: number): string {
  // Sağlayıcılar datetime'ı saniye (Unix epoch) verir; milisaniyeye normalize et.
  const ms = datetime < 1e12 ? datetime * 1000 : datetime;
  const diff = Math.max(0, now - ms);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} sa önce`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} gün önce`;
  const wk = Math.floor(day / 7);
  return `${wk} hf önce`;
}

export default function NewsPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [filter, setFilter] = useState<Filter>("all");
  const [symbolFilter, setSymbolFilter] = useState<string | null>(null);

  // Hidrasyon güvenliği: göreli zamanı yalnızca mount sonrası hesapla.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Haberleri çek + günlük özet iste.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/market/news");
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json()) as { news?: NewsItem[] };
        const news = data.news ?? [];
        if (cancelled) return;
        setItems(news);
        setLoading(false);

        // Günlük özet — başlıkları AI'a yolla.
        const headlines = news.map((n) => n.headline).filter(Boolean);
        try {
          const sres = await fetch("/api/news-summary", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ headlines }),
          });
          const sdata = (await sres.json()) as { summary?: string };
          if (!cancelled) setSummary(sdata.summary ?? "");
        } catch {
          if (!cancelled)
            setSummary(
              "Günlük özet şu an hazırlanamadı. Aşağıdaki haber akışından güncel gelişmeleri inceleyebilirsiniz.",
            );
        } finally {
          if (!cancelled) setSummaryLoading(false);
        }
      } catch {
        if (cancelled) return;
        setError(true);
        setLoading(false);
        setSummaryLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Haberdeki ilgili semboller (sembol filtresi çipleri için).
  const symbols = useMemo(() => {
    const set = new Set<string>();
    for (const n of items) if (n.related) set.add(n.related.toUpperCase());
    return Array.from(set).slice(0, 12);
  }, [items]);

  // Duyarlılık + sembol filtresini uygula.
  const filtered = useMemo(() => {
    return items.filter((n) => {
      if (filter !== "all" && newsSentiment(n.headline) !== filter) return false;
      if (symbolFilter && (n.related?.toUpperCase() ?? "") !== symbolFilter)
        return false;
      return true;
    });
  }, [items, filter, symbolFilter]);

  return (
    <>
      <Topbar title="Haberler" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Haberler"
            desc="Piyasayı hareket ettiren gelişmeler ve Finovela'nın günlük yorumu."
          />

          {/* Günlük yapay zeka özeti */}
          <SectionCard
            label="Finovela'nın günlük piyasa özeti"
            className="mt-6"
            action={<IconChip icon={Sparkle} color={AIS_ACCENT} size={30} />}
          >
            <div>
              {summaryLoading ? (
                <div className="flex items-center gap-2 text-[13px] text-[var(--ais-fg-muted)]">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-faint)]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-faint)] [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--ais-fg-faint)] [animation-delay:300ms]" />
                  </span>
                  Özet hazırlanıyor…
                </div>
              ) : summary ? (
                <Markdown text={summary} />
              ) : (
                <p className="text-[13px] text-[var(--ais-fg-muted)]">
                  Şu an özet bulunmuyor.
                </p>
              )}
            </div>
          </SectionCard>

          {/* Filtreler */}
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full border px-3.5 py-1.5 text-[12.5px] transition ${
                    active
                      ? "border-[var(--ais-line-strong)] bg-[var(--ais-surface-2)] text-[var(--ais-fg)]"
                      : "border-[var(--ais-line)] text-[var(--ais-fg-muted)] hover:border-[var(--ais-line-strong)] hover:text-[var(--ais-fg)]"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}

            {symbols.length > 0 && (
              <>
                <span className="mx-1 h-5 w-px bg-[var(--ais-line)]" />
                {symbolFilter && (
                  <button
                    onClick={() => setSymbolFilter(null)}
                    className="rounded-full border border-[var(--ais-line)] px-3.5 py-1.5 text-[12.5px] text-[var(--ais-fg-muted)] transition hover:border-[var(--ais-line-strong)] hover:text-[var(--ais-fg)]"
                  >
                    Sembolü temizle
                  </button>
                )}
                {symbols.map((sym) => {
                  const active = symbolFilter === sym;
                  return (
                    <button
                      key={sym}
                      onClick={() => setSymbolFilter(active ? null : sym)}
                      className={`rounded-full border px-3 py-1.5 text-[12.5px] transition ${
                        active
                          ? "border-[var(--ais-line-strong)] bg-[var(--ais-surface-2)] text-[var(--ais-fg)]"
                          : "border-[var(--ais-line)] text-[var(--ais-fg-muted)] hover:border-[var(--ais-line-strong)] hover:text-[var(--ais-fg)]"
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Haber akışı */}
          <SectionCard label="Piyasa haberleri" className="mt-3" bodyClassName="p-2">
            {loading ? (
              <div className="space-y-3 p-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 px-2 py-3"
                  >
                    <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-[var(--ais-surface-2)]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-[var(--ais-surface-2)]" />
                      <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--ais-surface-2)]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <p className="py-8 text-center text-[13px] text-[var(--ais-fg-muted)]">
                Haberler yüklenemedi. Lütfen daha sonra tekrar deneyin.
              </p>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-[var(--ais-fg-muted)]">
                Bu filtreye uygun haber bulunamadı.
              </p>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((n) => {
                  const sent = newsSentiment(n.headline);
                  return (
                    <a
                      key={n.id}
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ais-row group flex items-start gap-3 px-3 py-3"
                    >
                      {n.related ? (
                        <TickerBadge symbol={n.related} size={30} />
                      ) : (
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--ais-line)] bg-[var(--ais-surface-2)] text-[var(--ais-fg-muted)]">
                          <Newspaper size={15} weight="regular" />
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-[13.5px] font-medium text-[var(--ais-fg)]">
                            {n.headline}
                          </p>
                          <ArrowSquareOut
                            size={14}
                            className="mt-0.5 shrink-0 text-[var(--ais-fg-faint)] transition group-hover:text-[var(--ais-fg-muted)]"
                          />
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px]">
                          <span
                            className="rounded-full px-2 py-0.5 font-medium"
                            style={{
                              background:
                                sent === "neutral"
                                  ? "var(--ais-surface-2)"
                                  : `${sentColor[sent]}1f`,
                              color: sentColor[sent],
                            }}
                          >
                            {sentLabelTr[sent]}
                          </span>
                          <span className="text-[var(--ais-fg-muted)]">{n.source}</span>
                          {/* Göreli zaman: yalnızca mount sonrası (hidrasyon güvenli). */}
                          {now !== null && (
                            <>
                              <span className="text-[var(--ais-fg-faint)]">·</span>
                              <span className="text-[var(--ais-fg-faint)]">
                                {relativeTimeTr(n.datetime, now)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
