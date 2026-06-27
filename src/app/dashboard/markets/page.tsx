"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { PageTitle, SectionCard, Row, EmptyState, AIS_UP, AIS_DOWN } from "@/components/dashboard/ais-kit";
import { Sparkline } from "@/components/dashboard/area-chart";
import { fmtMoney } from "@/lib/dashboard/data";
import { UNIVERSE, type AssetType } from "@/lib/market/universe";
import { MagnifyingGlass, TrendUp, TrendDown, Spinner } from "@phosphor-icons/react";

type Q = { symbol: string; name: string; sector: string; price: number; changePct: number; currency: string; type: AssetType };
type SearchHit = { symbol: string; name: string; type: string };

// Varlık sınıfı sekmeleri
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

// Endeksleri temsil eden ETF sembolleri — canlı fiyat bu sembollerden çekilir.
// val/chg de; gerçek veri gelmezse zarif fallback olarak kullanılır.
const INDICES = [
  { name: "S&P 500", proxy: "SPY", val: "5,842.31", chg: 0.62 },
  { name: "Nasdaq 100", proxy: "QQQ", val: "20,914.77", chg: 0.94 },
  { name: "Dow Jones", proxy: "DIA", val: "43,210.08", chg: -0.11 },
  { name: "Russell 2000", proxy: "IWM", val: "2,318.44", chg: 0.38 },
];

const INDEX_PROXIES = INDICES.map((i) => i.proxy);

type IndexLive = { val: string; chg: number };

/** İnce yüzde göstergesi (AIS renkleri). */
function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className="num text-[12.5px]" style={{ color: up ? AIS_UP : AIS_DOWN }}>
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
  // Endeks kartları için canlı veri (proxy ETF'lerden). Boşsa mock'a düşülür.
  const [indexLive, setIndexLive] = useState<Record<string, IndexLive>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // canlı kotasyonlar (evren + endeks proxy ETF'leri)
  useEffect(() => {
    // Evren + endeks proxy'lerini tek istekte çek (proxy'ler evrende olmasa da
    // sağlayıcı sembolle doğrudan çeker; bilinmeyen sembol stock'a yönlenir).
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
        // Endeks kartlarını proxy ETF canlı fiyatından doldur.
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

  // debounce'lı arama
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 1) {
      setHits([]);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(() => {
      fetch(`/api/market/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d: { results?: SearchHit[] }) => setHits((d.results ?? []).slice(0, 8)))
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 250);
  }, [query]);

  const gainers = [...rows].sort((a, b) => b.changePct - a.changePct).slice(0, 5);
  const losers = [...rows].sort((a, b) => a.changePct - b.changePct).slice(0, 5);
  const filtered = cls === "all" ? rows : rows.filter((r) => r.type === cls);

  return (
    <>
      <Topbar title="Piyasalar" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Piyasalar"
            desc="Hisse, ETF, kripto, döviz ve emtia — tek ekranda canlı fiyatlar."
          />

          {/* arama */}
          <div className="relative">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--ais-line-strong)] bg-[var(--ais-surface)] px-4 py-3">
              <MagnifyingGlass size={18} weight="regular" className="text-[var(--ais-fg-faint)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hits[0]) router.push(`/dashboard/stock/${hits[0].symbol}`);
                }}
                placeholder="Hisse, ETF veya kripto ara…"
                className="flex-1 bg-transparent text-[14px] text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
              />
              {searching && <Spinner size={16} className="animate-spin text-[var(--ais-fg-faint)]" />}
            </div>
            {hits.length > 0 && (
              <div className="ais-card absolute z-20 mt-2 w-full overflow-hidden p-1">
                {hits.map((h) => (
                  <Link
                    key={h.symbol}
                    href={`/dashboard/stock/${h.symbol}`}
                    className="ais-row flex items-center gap-3 px-3 py-2.5"
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

          {/* endeksler */}
          <SectionCard label="Endeksler" className="mt-10" bodyClassName="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {INDICES.map((idx) => {
              const live = indexLive[idx.proxy];
              const val = live?.val ?? idx.val;
              const chg = live?.chg ?? idx.chg;
              return (
                <div key={idx.name} className="ais-card p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] text-[var(--ais-fg-faint)]">{idx.name}</p>
                    {loading ? (
                      <div className="ais-skeleton h-[22px] w-[56px]" />
                    ) : (
                      <Sparkline seed={idx.proxy} up={chg >= 0} width={56} height={22} />
                    )}
                  </div>
                  {loading ? (
                    <>
                      <div className="ais-skeleton mt-2 h-[24px] w-24" />
                      <div className="ais-skeleton mt-2 h-[14px] w-14" />
                    </>
                  ) : (
                    <>
                      <p className="num mt-2 text-[20px] font-normal tracking-tight text-[var(--ais-fg)]">{val}</p>
                      <div className="mt-1">
                        <Delta value={chg} />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </SectionCard>

          {/* gainers / losers */}
          <SectionCard label="Günün hareketleri" className="mt-3" bodyClassName="grid gap-3 lg:grid-cols-2">
            <div className="ais-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13.5px] font-medium text-[var(--ais-fg)]">En çok yükselenler</h3>
                <TrendUp size={16} weight="regular" style={{ color: AIS_UP }} />
              </div>
              <MoverList rows={gainers} loading={loading} />
            </div>
            <div className="ais-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[13.5px] font-medium text-[var(--ais-fg)]">En çok düşenler</h3>
                <TrendDown size={16} weight="regular" style={{ color: AIS_DOWN }} />
              </div>
              <MoverList rows={losers} loading={loading} />
            </div>
          </SectionCard>

          {/* tüm evren — varlık sınıfı filtreli */}
          <SectionCard label="Tüm piyasalar" className="mt-3" bodyClassName="p-0">
            <div className="flex flex-wrap gap-1.5 p-4">
              {CLASSES.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCls(c.key)}
                  className={
                    cls === c.key
                      ? "rounded-full px-3 py-1.5 text-[12px] font-medium"
                      : "rounded-full border border-[var(--ais-line)] px-3 py-1.5 text-[12px] text-[var(--ais-fg-muted)] transition hover:border-[var(--ais-line-strong)] hover:text-[var(--ais-fg)]"
                  }
                  style={cls === c.key ? { background: "var(--ais-accent-bg)", color: "var(--ais-accent)" } : undefined}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="ais-dt min-w-[640px]">
                <thead>
                  <tr>
                    <th>Varlık</th>
                    <th>Sektör</th>
                    <th className="text-right">Fiyat</th>
                    <th className="text-right">Bugün</th>
                    <th className="pl-4">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr
                      key={a.symbol}
                      onClick={() => router.push(`/dashboard/stock/${a.symbol}`)}
                      className="cursor-pointer"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <TickerBadge symbol={a.symbol} size={28} />
                          <div>
                            <p className="text-[13px] font-medium text-[var(--ais-fg)]">{a.symbol}</p>
                            <p className="text-[12px] text-[var(--ais-fg-muted)]">{a.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-[var(--ais-fg-muted)]">{a.sector}</td>
                      <td className="num text-right text-[var(--ais-fg)]">{fmtMoney(a.price, a.currency)}</td>
                      <td className="text-right"><Delta value={a.changePct} /></td>
                      <td className="pl-4"><Sparkline seed={a.symbol} up={a.changePct >= 0} width={70} /></td>
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
                        <td className="pl-4"><div className="ais-skeleton h-[18px] w-[70px]" /></td>
                      </tr>
                    ))}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-[var(--ais-fg-faint)]">Bu filtreye uyan varlık yok.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function MoverList({ rows, loading }: { rows: Q[]; loading?: boolean }) {
  if (loading && rows.length === 0) {
    return (
      <div className="space-y-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2.5">
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
        ))}
      </div>
    );
  }
  if (rows.length === 0) {
    return <EmptyState title="Veri yok." />;
  }
  return (
    <div className="space-y-0.5">
      {rows.map((m) => (
        <Link key={m.symbol} href={`/dashboard/stock/${m.symbol}`}>
          <Row>
            <TickerBadge symbol={m.symbol} size={30} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-[var(--ais-fg)]">{m.symbol}</p>
              <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{m.name}</p>
            </div>
            <Sparkline seed={m.symbol + "m"} up={m.changePct >= 0} width={60} />
            <div className="w-20 text-right">
              <p className="num text-[13px] text-[var(--ais-fg)]">{fmtMoney(m.price, m.currency)}</p>
              <Delta value={m.changePct} />
            </div>
          </Row>
        </Link>
      ))}
    </div>
  );
}
