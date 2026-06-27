"use client";

/**
 * Finovela Piyasalar — canlı fiyatlar: endeksler, hareketler, tüm evren tablosu.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ais-dt dense tablo, ızgara-ayraçlı endeks şeridi, token renkleri.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { Sparkline } from "@/components/dashboard/area-chart";
import { useSparklines } from "@/lib/dashboard/use-sparklines";
import { fmtMoney } from "@/lib/dashboard/data";
import { UNIVERSE, type AssetType } from "@/lib/market/universe";
import { Search, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const DOWN = "#d93025";
const ACCENT = "var(--ais-accent)";

type Q = { symbol: string; name: string; sector: string; price: number; changePct: number; currency: string; type: AssetType };
type SearchHit = { symbol: string; name: string; type: string };

const CLASSES: { key: AssetType | "all"; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "stock", label: "ABD Hisse" },
  { key: "bist", label: "BIST" },
  { key: "crypto", label: "Kripto" },
  { key: "forex", label: "Döviz" },
  { key: "metal", label: "Metal" },
  { key: "commodity", label: "Emtia" },
  { key: "etf", label: "ETF" },
];

const INDICES = [
  { name: "S&P 500", proxy: "SPY", val: "5,842.31", chg: 0.62 },
  { name: "Nasdaq 100", proxy: "QQQ", val: "20,914.77", chg: 0.94 },
  { name: "Dow Jones", proxy: "DIA", val: "43,210.08", chg: -0.11 },
  { name: "Russell 2000", proxy: "IWM", val: "2,318.44", chg: 0.38 },
];
const INDEX_PROXIES = INDICES.map((i) => i.proxy);

type IndexLive = { val: string; chg: number };

/** İnce yüzde göstergesi — Didit yeşil/kırmızı. */
function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className="num text-[12.5px] font-medium" style={{ color: up ? UP : DOWN }}>
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export default function MarketsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [cls, setCls] = useState<AssetType | "all">("all");
  const [indexLive, setIndexLive] = useState<Record<string, IndexLive>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // canlı kotasyonlar (evren + endeks proxy ETF'leri)
  useEffect(() => {
    const symbols = [...new Set([...UNIVERSE.map((u) => u.symbol), ...INDEX_PROXIES])].join(",");
    fetch(`/api/market/quote?symbols=${symbols}`)
      .then((r) => r.json())
      .then((d: { quotes?: { symbol: string; price: number; changePct: number }[] }) => {
        if (!d.quotes) return;
        const map = new Map(d.quotes.map((q) => [q.symbol, q]));
        setRows(
          UNIVERSE.map((u) => {
            const q = map.get(u.symbol);
            return {
              symbol: u.symbol,
              name: u.name,
              sector: u.sector,
              price: q?.price ?? u.basePrice,
              changePct: q?.changePct ?? 0,
              currency: u.currency ?? "USD",
              type: u.type,
            };
          }),
        );
        const live: Record<string, IndexLive> = {};
        for (const idx of INDICES) {
          const q = map.get(idx.proxy);
          if (q && Number.isFinite(q.price)) {
            live[idx.proxy] = {
              val: q.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
              chg: q.changePct ?? 0,
            };
          }
        }
        if (Object.keys(live).length) setIndexLive(live);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // debounce'lı arama. Boş sorguda fetch'i debounce içinde temizle (senkron
  // setState-in-effect'ten kaçın) — sonuçlar async callback'te güncellenir.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 1) {
      timer.current = setTimeout(() => {
        setHits([]);
        setSearching(false);
      }, 0);
      return;
    }
    // Anında "aranıyor" göster (debounce'a koyarsak spinner gecikir → kötü UX).
    setSearching(true); // eslint-disable-line react-hooks/set-state-in-effect
    timer.current = setTimeout(() => {
      fetch(`/api/market/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: { results?: SearchHit[] }) => setHits((d.results ?? []).slice(0, 8)))
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 250);
  }, [query]);

  const gainers = [...rows].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const losers = [...rows].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
  const filtered = cls === "all" ? rows : rows.filter((r) => r.type === cls);

  // Tüm görünen semboller (evren + endeks proxy'leri) için gerçek sparkline serisi — tek batch.
  const series = useSparklines([...rows.map((r) => r.symbol), ...INDEX_PROXIES]);

  return (
    <>
      <Topbar title="Piyasalar" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Piyasalar</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Hisse, ETF, kripto, döviz ve emtia — tek ekranda canlı fiyatlar.
            </p>
          </div>

          {/* ───────── Arama ───────── */}
          <div className="relative mt-6">
            <div
              className="flex items-center gap-3 rounded-xl border px-4 transition focus-within:border-[var(--ais-accent)] focus-within:ring-2 focus-within:ring-[var(--ais-accent)]/15"
              style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface)" }}
            >
              <Search size={17} className="text-[var(--ais-fg-faint)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hits[0]) router.push(`/dashboard/stock/${hits[0].symbol}`);
                }}
                placeholder="Hisse, ETF veya kripto ara…"
                className="h-12 flex-1 bg-transparent text-[14px] text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
              />
              {searching && <Loader2 size={16} className="animate-spin text-[var(--ais-fg-faint)]" />}
            </div>
            {hits.length > 0 && (
              <div
                className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border p-1 shadow-[0_16px_40px_-16px_rgba(26,26,26,0.2)]"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                {hits.map((h) => (
                  <Link
                    key={h.symbol}
                    href={`/dashboard/stock/${h.symbol}`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-[var(--ais-surface-2)]"
                  >
                    <TickerBadge symbol={h.symbol} size={26} />
                    <span className="text-[13px] font-medium text-[var(--ais-fg)]">{h.symbol}</span>
                    <span className="truncate text-[12.5px] text-[var(--ais-fg-muted)]">{h.name}</span>
                    <span className="ml-auto text-[11px] uppercase text-[var(--ais-fg-faint)]">{h.type}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ───────── Endeksler (kutusuz ızgara-ayraçlı şerit) ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Endeksler</h2>
            <div
              className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
            >
              {INDICES.map((idx) => {
                const live = indexLive[idx.proxy];
                const val = live?.val ?? idx.val;
                const chg = live?.chg ?? idx.chg;
                return (
                  <div key={idx.name} className="bg-[var(--ais-surface)] px-5 py-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[11.5px] text-[var(--ais-fg-faint)]">{idx.name}</p>
                      {loading ? (
                        <div className="ais-skeleton h-[20px] w-[50px]" />
                      ) : (
                        <Sparkline seed={idx.proxy} up={chg >= 0} width={50} height={20} data={series[idx.proxy.toUpperCase()]} />
                      )}
                    </div>
                    {loading ? (
                      <>
                        <div className="ais-skeleton mt-2 h-[22px] w-24" />
                        <div className="ais-skeleton mt-2 h-[13px] w-14" />
                      </>
                    ) : (
                      <>
                        <p className="num mt-2 text-[19px] font-medium tracking-tight text-[var(--ais-fg)]">{val}</p>
                        <div className="mt-0.5">
                          <Delta value={chg} />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ───────── Günün hareketleri ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Günün hareketleri</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <MoverPanel title="En çok yükselenler" icon={TrendingUp} tone={UP} rows={gainers} loading={loading} series={series} />
              <MoverPanel title="En çok düşenler" icon={TrendingDown} tone={DOWN} rows={losers} loading={loading} series={series} />
            </div>
          </section>

          {/* ───────── Tüm piyasalar (filtreli ais-dt tablo) ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-4">Tüm piyasalar</h2>

            {/* varlık sınıfı filtre — Didit chip */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              {CLASSES.map((c) => {
                const on = cls === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setCls(c.key)}
                    className="rounded-full border px-3 py-1.5 text-[12px] font-medium transition"
                    style={{
                      borderColor: on ? "transparent" : "var(--ais-line)",
                      background: on ? "var(--ais-accent-bg)" : "transparent",
                      color: on ? ACCENT : "var(--ais-fg-muted)",
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
              <table className="ais-dt min-w-[640px]">
                <thead>
                  <tr>
                    <th>VARLIK</th>
                    <th>SEKTÖR</th>
                    <th className="!text-right">FİYAT</th>
                    <th className="!text-right">BUGÜN</th>
                    <th>TREND</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.symbol} onClick={() => router.push(`/dashboard/stock/${a.symbol}`)} className="cursor-pointer">
                      <td>
                        <div className="flex items-center gap-3">
                          <TickerBadge symbol={a.symbol} size={28} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-[var(--ais-fg)]">{a.symbol}</p>
                            <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{a.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-[var(--ais-fg-muted)]">{a.sector}</td>
                      <td className="num !text-right font-medium">{fmtMoney(a.price, a.currency)}</td>
                      <td className="!text-right"><Delta value={a.changePct} /></td>
                      <td><Sparkline seed={a.symbol} up={a.changePct >= 0} width={70} data={series[a.symbol.toUpperCase()]} /></td>
                    </tr>
                  ))}
                  {loading &&
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={`sk-${i}`}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="ais-skeleton h-[28px] w-[28px] rounded-full" />
                            <div className="space-y-1.5">
                              <div className="ais-skeleton h-[12px] w-16" />
                              <div className="ais-skeleton h-[11px] w-28" />
                            </div>
                          </div>
                        </td>
                        <td><div className="ais-skeleton h-[12px] w-20" /></td>
                        <td><div className="ais-skeleton ml-auto h-[12px] w-16" /></td>
                        <td><div className="ais-skeleton ml-auto h-[12px] w-12" /></td>
                        <td><div className="ais-skeleton h-[18px] w-[70px]" /></td>
                      </tr>
                    ))}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--ais-fg-faint)]">
                        Bu filtreye uyan varlık yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/* ── Hareket paneli (yükselenler/düşenler) — ince-kenarlı, border-b ayraçlı satır ── */
function MoverPanel({
  title,
  icon: Icon,
  tone,
  rows,
  loading,
  series,
}: {
  title: string;
  icon: typeof TrendingUp;
  tone: string;
  rows: Q[];
  loading?: boolean;
  series?: Record<string, number[]>;
}) {
  return (
    <div className="rounded-xl border" style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}>
      <div className="flex items-center justify-between border-b px-5 py-3.5" style={{ borderColor: "var(--ais-line)" }}>
        <h3 className="text-[13px] font-medium text-[var(--ais-fg)]">{title}</h3>
        <Icon size={16} style={{ color: tone }} />
      </div>
      <div className="p-2">
        {loading && rows.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <div className="ais-skeleton h-[30px] w-[30px] rounded-full" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="ais-skeleton h-[12px] w-16" />
                <div className="ais-skeleton h-[11px] w-24" />
              </div>
              <div className="ais-skeleton h-[18px] w-[60px]" />
              <div className="w-20 space-y-1.5">
                <div className="ais-skeleton ml-auto h-[12px] w-14" />
                <div className="ais-skeleton ml-auto h-[11px] w-10" />
              </div>
            </div>
          ))
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-[12.5px] text-[var(--ais-fg-muted)]">Veri yok.</p>
        ) : (
          rows.map((m) => (
            <Link
              key={m.symbol}
              href={`/dashboard/stock/${m.symbol}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-[var(--ais-surface-2)]"
            >
              <TickerBadge symbol={m.symbol} size={30} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[var(--ais-fg)]">{m.symbol}</p>
                <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{m.name}</p>
              </div>
              <Sparkline seed={m.symbol + "m"} up={m.changePct >= 0} width={60} data={series?.[m.symbol.toUpperCase()]} />
              <div className="w-20 text-right">
                <p className="num text-[13px] font-medium text-[var(--ais-fg)]">{fmtMoney(m.price, m.currency)}</p>
                <Delta value={m.changePct} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
