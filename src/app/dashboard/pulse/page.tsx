"use client";

/**
 * Finovela Pulse — portföye özel filtrelenmiş istihbarat akışı (hareketler + haber).
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, chip filtreler, ince-kenarlı satırlar, token renkleri. Beyaz-sabit YOK.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ticker-badge";
import { useLivePortfolio } from "@/lib/dashboard/use-portfolio";
import { useWatchlist } from "@/lib/dashboard/use-watchlist";
import { newsSentiment } from "@/lib/dashboard/sentiment";
import { Activity, TrendingUp, TrendingDown, Newspaper, Star, RefreshCw } from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const DOWN = "#d93025";
const ACCENT = "var(--ais-accent)";

type NewsItem = { headline: string; source?: string; url?: string; datetime?: number };
type FeedItem =
  | { kind: "move"; symbol: string; held: boolean; changePct: number; price: number; reason: string; ts: number }
  | { kind: "news"; symbol: string; held: boolean; headline: string; source?: string; url?: string; sentiment: string; ts: number };

export default function PulsePage() {
  const { positions } = useLivePortfolio();
  const { list: watch } = useWatchlist();
  const [news, setNews] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "held" | "news" | "moves">("all");

  // Sembol listesi — STABİL string anahtar (fiyat değişiminde DEĞİŞMEZ).
  // Böylece 15 sn'lik fiyat poll'u haber effect'ini yeniden tetiklemez (sonsuz "tarıyor" bug fix).
  const heldKey = positions.map((p) => p.symbol).sort().join(",");
  const watchKey = [...watch].sort().join(",");
  const symbolsKey = useMemo(() => {
    const s = new Set<string>([...heldKey.split(",").filter(Boolean), ...watchKey.split(",").filter(Boolean)]);
    return [...s].slice(0, 14).join(",");
  }, [heldKey, watchKey]);

  const heldSet = useMemo(() => new Set(heldKey.split(",").filter(Boolean)), [heldKey]);

  // Haberler — yalnız sembol seti değişince çekilir (fiyat poll'una bağlı DEĞİL).
  useEffect(() => {
    let cancelled = false;
    const newsSyms = symbolsKey.split(",").filter(Boolean).slice(0, 8);
    if (newsSyms.length === 0) {
      setNews([]); // eslint-disable-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }
    async function build() {
      setLoading(true);
      const newsResults = await Promise.all(
        newsSyms.map((sym) =>
          fetch(`/api/market/news?symbol=${encodeURIComponent(sym)}`)
            .then((r) => (r.ok ? r.json() : { news: [] }))
            .then((d: { news?: NewsItem[] }) => ({ sym, news: d.news ?? [] }))
            .catch(() => ({ sym, news: [] as NewsItem[] })),
        ),
      );
      if (cancelled) return;
      const items: FeedItem[] = [];
      for (const { sym, news: ns } of newsResults) {
        for (const n of ns.slice(0, 2)) {
          items.push({
            kind: "news",
            symbol: sym,
            held: heldSet.has(sym),
            headline: n.headline,
            source: n.source,
            url: n.url,
            sentiment: newsSentiment(n.headline),
            ts: n.datetime ? n.datetime * 1000 : 0,
          });
        }
      }
      if (!cancelled) {
        setNews(items);
        setLoading(false);
      }
    }
    void build();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbolsKey]);

  // Fiyat hareketleri — her render'da ucuza hesaplanır (canlı fiyatla güncel kalır).
  const moves = useMemo<FeedItem[]>(() => {
    return positions
      .filter((p) => Math.abs(p.changePct) >= 1.2)
      .map((p) => {
        const dir = p.changePct >= 0 ? "yükseldi" : "düştü";
        return {
          kind: "move" as const,
          symbol: p.symbol,
          held: true,
          changePct: p.changePct,
          price: p.price,
          reason: `Portföyündeki ${p.symbol} bugün %${Math.abs(p.changePct).toFixed(1)} ${dir} — pozisyon değerin ${p.changePct >= 0 ? "arttı" : "azaldı"}.`,
          ts: 0,
        };
      });
  }, [positions]);

  // Birleşik akış — holdingler önce, sonra zaman/öncelik.
  const feed = useMemo<FeedItem[]>(() => {
    const all = [...moves, ...news];
    all.sort((a, b) => {
      if (a.held !== b.held) return a.held ? -1 : 1;
      return b.ts - a.ts;
    });
    return all;
  }, [moves, news]);

  const filtered = feed.filter((f) => {
    if (filter === "held") return f.held;
    if (filter === "news") return f.kind === "news";
    if (filter === "moves") return f.kind === "move";
    return true;
  });

  return (
    <>
      <Topbar title="Finovela Pulse" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Sana özel istihbarat akışı</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Genel haber değil — sadece sahip olduğun ve izlediğin varlıkları etkileyen hareketler,
              haberler ve Finovela&apos;nın yorumu. Senin portföyün için filtrelenmiş.
            </p>
          </div>

          {/* ───────── Akış ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="d-section">Akış</h2>
                <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                  Portföyün ve izleme listen için filtrelenmiş hareketler ve haberler.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    // Her kategori farklı ton: holdings=mavi, hareketler=amber (dikkat), haberler=teal.
                    ["all", "Tümü", { fg: "var(--ais-accent)", bg: "var(--ais-accent-bg)" }],
                    ["held", "Sahip olduklarım", { fg: "var(--ais-accent)", bg: "var(--ais-accent-bg)" }],
                    ["moves", "Fiyat hareketleri", { fg: "var(--ais-amber)", bg: "var(--ais-amber-bg)" }],
                    ["news", "Haberler", { fg: "#0f8a8a", bg: "rgba(15,138,138,0.12)" }],
                  ] as const
                ).map(([k, label, c]) => {
                  const on = filter === k;
                  return (
                    <button
                      key={k}
                      onClick={() => setFilter(k)}
                      className="rounded-full border px-3 py-1.5 text-[12px] font-medium transition"
                      style={{
                        borderColor: on ? "transparent" : "var(--ais-line)",
                        background: on ? c.bg : "transparent",
                        color: on ? c.fg : "var(--ais-fg-muted)",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-[var(--ais-fg-muted)]">
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-[13px]">Finovela senin için piyasayı tarıyor…</span>
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="rounded-xl border border-dashed px-6 py-16 text-center"
                style={{ borderColor: "var(--ais-line-strong)" }}
              >
                <Activity size={22} className="mx-auto text-[var(--ais-fg-faint)]" />
                <p className="mt-3 text-[14px] font-medium text-[var(--ais-fg)]">Şu an önemli bir gelişme yok</p>
                <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-[var(--ais-fg-muted)]">
                  Seni etkileyen önemli bir gelişme yok. Daha fazla varlık ekledikçe akış zenginleşir.
                </p>
                <Link
                  href="/dashboard/markets"
                  className="mt-4 inline-flex items-center rounded-lg px-4 py-2 text-[13px] font-medium transition"
                  style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                >
                  Piyasalara göz at
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filtered.map((f, i) => (
                  <FeedRow key={i} item={f} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function FeedRow({ item }: { item: FeedItem }) {
  if (item.kind === "move") {
    const up = item.changePct >= 0;
    const tone = up ? UP : DOWN;
    const Icon = up ? TrendingUp : TrendingDown;
    return (
      <Link
        href={`/dashboard/stock/${item.symbol}`}
        className="group flex items-center gap-3 rounded-xl border p-3.5 transition hover:bg-[var(--ais-surface-2)]"
        style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
      >
        <TickerBadge symbol={item.symbol} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">{item.symbol}</p>
            {item.held && (
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
              >
                <Star size={9} /> Sahip
              </span>
            )}
            <span className="num flex items-center gap-1 text-[13px] font-medium" style={{ color: tone }}>
              <Icon size={13} />
              {up ? "+" : ""}
              {item.changePct.toFixed(2)}%
            </span>
          </div>
          <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{item.reason}</p>
        </div>
      </Link>
    );
  }
  const sentTone = item.sentiment === "positive" ? UP : item.sentiment === "negative" ? DOWN : "var(--ais-fg-faint)";
  const Wrapper = item.url ? "a" : "div";
  return (
    <Wrapper
      {...(item.url ? { href: item.url, target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-start gap-3 rounded-xl border p-3.5 transition hover:bg-[var(--ais-surface-2)]"
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border"
        style={{ borderColor: "var(--ais-line)" }}
      >
        <Newspaper size={17} className="text-[var(--ais-fg-muted)]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[var(--ais-fg-muted)]"
            style={{ background: "var(--ais-surface-2)" }}
          >
            {item.symbol}
          </span>
          {item.held && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
            >
              <Star size={9} /> Sahip
            </span>
          )}
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: sentTone }} />
        </div>
        <p className="mt-1 text-[13px] text-[var(--ais-fg)]">{item.headline}</p>
        {item.source && <p className="mt-0.5 text-[11px] text-[var(--ais-fg-faint)]">{item.source}</p>}
      </div>
    </Wrapper>
  );
}
