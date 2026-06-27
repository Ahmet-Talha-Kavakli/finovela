"use client";

/**
 * Finovela Haberler — piyasa haber akışı + günlük AI özeti, duyarlılık filtreleri.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, soft rozetler, token renkleri (beyaz-sabit YOK).
 */

import { useEffect, useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { Markdown } from "@/components/dashboard/markdown";
import { newsSentiment, type NewsSentiment } from "@/lib/dashboard/sentiment";
import { Sparkles, Newspaper, ExternalLink } from "lucide-react";

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

// Didit açık-tema renkleri — yeşil/kırmızı tek istisna, gerisi nötr token.
const UP = "var(--ais-green)";
const DOWN = "#d93025";

const sentColor: Record<NewsSentiment, string> = {
  positive: UP,
  negative: DOWN,
  neutral: "var(--ais-fg-muted)",
};
const sentLabelTr: Record<NewsSentiment, string> = {
  positive: "Olumlu",
  negative: "Olumsuz",
  neutral: "Nötr",
};

type Filter = "all" | NewsSentiment;
// Seçili çip dolgu rengi (Didit soft): Tümü=accent mavi, Olumlu=yeşil, Nötr=gri, Olumsuz=kırmızı.
const FILTERS: { key: Filter; label: string; bg: string; fg: string }[] = [
  { key: "all", label: "Tümü", bg: "var(--ais-accent-bg)", fg: "var(--ais-accent)" },
  { key: "positive", label: "Olumlu", bg: "var(--ais-green-bg)", fg: "var(--ais-green)" },
  { key: "neutral", label: "Nötr", bg: "var(--ais-surface-2)", fg: "var(--ais-fg)" },
  { key: "negative", label: "Olumsuz", bg: "rgba(217,48,37,0.10)", fg: "#d93025" },
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
    setNow(Date.now()); // eslint-disable-line react-hooks/set-state-in-effect
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
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Haberler</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Piyasayı hareket ettiren gelişmeler ve Finovela&apos;nın günlük yorumu.
            </p>
          </div>

          {/* ───────── Günlük yapay zeka özeti ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5 flex items-center gap-3">
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                style={{ background: "var(--ais-accent-bg)", color: "var(--ais-accent)" }}
              >
                <Sparkles size={16} />
              </span>
              <h2 className="d-section">Finovela&apos;nın günlük piyasa özeti</h2>
            </div>
            <div
              className="rounded-xl border p-5"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
            >
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
                <Markdown text={summary} tone="light" />
              ) : (
                <p className="text-[13px] text-[var(--ais-fg-muted)]">Şu an özet bulunmuyor.</p>
              )}
            </div>
          </section>

          {/* ───────── Haber akışı ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-4">Piyasa haberleri</h2>

            {/* filtreler — Didit chip */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className="rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition"
                    style={{
                      borderColor: active ? "transparent" : "var(--ais-line)",
                      background: active ? f.bg : "transparent",
                      color: active ? f.fg : "var(--ais-fg-muted)",
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}

              {symbols.length > 0 && (
                <>
                  <span className="mx-1 h-5 w-px" style={{ background: "var(--ais-line)" }} />
                  {symbolFilter && (
                    <button
                      onClick={() => setSymbolFilter(null)}
                      className="rounded-full border px-3.5 py-1.5 text-[12.5px] text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
                      style={{ borderColor: "var(--ais-line)" }}
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
                        className="rounded-full border px-3 py-1.5 text-[12.5px] transition"
                        style={{
                          borderColor: active ? "var(--ais-line-strong)" : "var(--ais-line)",
                          background: active ? "var(--ais-surface-2)" : "transparent",
                          color: active ? "var(--ais-fg)" : "var(--ais-fg-muted)",
                        }}
                      >
                        {sym}
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            <div
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
            >
              {loading ? (
                <div className="space-y-3 p-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 px-2 py-3">
                      <div className="ais-skeleton h-8 w-8 shrink-0 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="ais-skeleton h-3.5 w-3/4" />
                        <div className="ais-skeleton h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <p className="py-10 text-center text-[13px] text-[var(--ais-fg-muted)]">
                  Haberler yüklenemedi. Lütfen daha sonra tekrar deneyin.
                </p>
              ) : filtered.length === 0 ? (
                <p className="py-10 text-center text-[13px] text-[var(--ais-fg-muted)]">
                  Bu filtreye uygun haber bulunamadı.
                </p>
              ) : (
                filtered.map((n, i) => {
                  const sent = newsSentiment(n.headline);
                  return (
                    <a
                      key={n.id}
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-3 px-4 py-3.5 transition hover:bg-[var(--ais-surface-2)]"
                      style={{ borderTop: i === 0 ? "none" : "1px solid var(--ais-line)" }}
                    >
                      {n.related ? (
                        <TickerBadge symbol={n.related} size={30} />
                      ) : (
                        <span
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-[var(--ais-fg-muted)]"
                          style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface-2)" }}
                        >
                          <Newspaper size={15} />
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-[13.5px] font-medium text-[var(--ais-fg)]">
                            {n.headline}
                          </p>
                          <ExternalLink
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
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
