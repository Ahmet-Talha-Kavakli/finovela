"use client";

/**
 * Finovela Hisse Karşılaştırma — 2-4 sembolü yan yana metrik tablosunda kıyasla.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ais-dt dense tablo, token renkleri. TÜM metrikler CANLI gerçek
 * veriden gelir; veri gelmeyen alanlar UYDURULMAZ → "—".
 * Beyaz-sabit renk YOK — hepsi --ais-* token (açık temada okunur).
 */

import { useEffect, useRef, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { Sparkline } from "@/components/dashboard/area-chart";
import { useSparklines } from "@/lib/dashboard/use-sparklines";
import { fmtMoney } from "@/lib/dashboard/data";
import { Search, Loader2, X, Scale, Plus } from "lucide-react";

// Didit açık-tema renkleri.
const UP = "var(--ais-green)";
const DOWN = "#d93025";

const MAX = 4;

type SearchHit = { symbol: string; name: string; type: string };

type Col = {
  symbol: string;
  name: string;
  currency: string;
  price: number;
  changePct: number;
  marketCap?: number;
  volume?: number;
  high52?: number;
  low52?: number;
  loading: boolean;
};

/** Sıkıştırılmış sayı (1.2B, 845M, 3.1K). */
function fmtCompact(n: number): string {
  if (!Number.isFinite(n) || n === 0) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

function Delta({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className="num text-[12.5px] font-medium" style={{ color: up ? UP : DOWN }}>
      {up ? "+" : "−"}
      {Math.abs(value).toFixed(2)}%
    </span>
  );
}

export default function ComparePage() {
  const [cols, setCols] = useState<Col[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // debounce'lı arama (markets sayfası deseni)
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 1) {
      setHits([]); // eslint-disable-line react-hooks/set-state-in-effect
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

  function addSymbol(symbol: string, name: string) {
    const sym = symbol.toUpperCase();
    setQuery("");
    setHits([]);
    // NOT: setFocused(false) ÇAĞIRMIYORUZ — kullanıcı arka arkaya 2-4 sembol
    // ekleyebilsin diye alan "odaklı" kalır (input DOM odağı zaten korunuyor:
    // dropdown butonu onMouseDown.preventDefault). Aksi halde 2. sembolü ararken
    // dropdown bir daha açılmaz (onFocus tekrar tetiklenmez).
    if (cols.length >= MAX) return;
    if (cols.some((c) => c.symbol === sym)) return;

    // önce iskelet kolon ekle
    setCols((prev) => [
      ...prev,
      { symbol: sym, name, currency: "USD", price: 0, changePct: 0, loading: true },
    ]);

    // canlı kotasyon + profil + 52H temel veri — hepsi GERÇEK kaynaklardan.
    // Gelmeyen alanlar undefined kalır (tabloda "—"); sahte sayı ÜRETMİYORUZ.
    Promise.allSettled([
      fetch(`/api/market/quote?symbol=${sym}`).then((r) => r.json()),
      fetch(`/api/market/profile?symbol=${sym}`).then((r) => r.json()),
      fetch(`/api/market/fundamentals?symbol=${sym}`).then((r) => r.json()),
    ]).then(([qRes, pRes, fRes]) => {
      const q =
        qRes.status === "fulfilled"
          ? (qRes.value as { quote?: Partial<Col> & { high?: number; low?: number } }).quote
          : undefined;
      const prof =
        pRes.status === "fulfilled"
          ? (pRes.value as { profile?: { marketCap?: number; name?: string } }).profile
          : undefined;
      const fund =
        fRes.status === "fulfilled"
          ? (fRes.value as { fundamentals?: { fiftyTwoWeekHigh?: number | null; fiftyTwoWeekLow?: number | null } | null })
              .fundamentals
          : undefined;

      const price = q?.price && Number.isFinite(q.price) ? q.price : 0;
      const changePct = typeof q?.changePct === "number" ? q.changePct : 0;
      const marketCap = prof?.marketCap ?? q?.marketCap;
      const high52 = fund?.fiftyTwoWeekHigh && Number.isFinite(fund.fiftyTwoWeekHigh) ? fund.fiftyTwoWeekHigh : undefined;
      const low52 = fund?.fiftyTwoWeekLow && Number.isFinite(fund.fiftyTwoWeekLow) ? fund.fiftyTwoWeekLow : undefined;

      setCols((prev) =>
        prev.map((c) =>
          c.symbol === sym
            ? {
                ...c,
                name: prof?.name || c.name || sym,
                currency: q?.currency ?? "USD",
                price,
                changePct,
                marketCap: marketCap && Number.isFinite(marketCap) ? marketCap : undefined,
                volume: q?.volume && Number.isFinite(q.volume) ? q.volume : undefined,
                high52,
                low52,
                loading: false,
              }
            : c,
        ),
      );
    });
  }

  function remove(sym: string) {
    setCols((prev) => prev.filter((c) => c.symbol !== sym));
  }

  const anyLoading = cols.some((c) => c.loading);
  const ready = cols.filter((c) => !c.loading);

  // Karşılaştırılan semboller için gerçek sparkline serisi.
  const series = useSparklines(cols.map((c) => c.symbol));

  return (
    <>
      <Topbar title="Hisse Karşılaştırma" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Hisse Karşılaştırma</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              2-4 hisseyi yan yana koy; fiyat, değişim, piyasa değeri, hacim ve 52 hafta aralığını tek
              bakışta kıyasla.
            </p>
          </div>

          {/* ── Arama + eklenen sembol chip'leri ── */}
          <div className="relative mt-6">
            <div
              className="flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3"
              style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface)" }}
            >
              <Search size={18} className="shrink-0 text-[var(--ais-fg-faint)]" />
              {cols.map((c) => (
                <span
                  key={c.symbol}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-medium"
                  style={{ background: "var(--ais-accent-bg)", color: "var(--ais-accent)" }}
                >
                  {c.symbol}
                  <button
                    onClick={() => remove(c.symbol)}
                    className="grid place-items-center rounded transition hover:opacity-70"
                    style={{ color: "var(--ais-accent)" }}
                    title="Kaldır"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hits[0]) addSymbol(hits[0].symbol, hits[0].name);
                }}
                disabled={cols.length >= MAX}
                placeholder={
                  cols.length >= MAX
                    ? "En fazla 4 sembol"
                    : cols.length === 0
                      ? "Karşılaştırmak için hisse ara…"
                      : "Ekle…"
                }
                className="min-w-[140px] flex-1 bg-transparent text-[14px] text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none disabled:opacity-40"
              />
              {searching && <Loader2 size={16} className="animate-spin text-[var(--ais-fg-faint)]" />}
            </div>

            {focused && hits.length > 0 && cols.length < MAX && (
              <div
                className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border p-1 shadow-[0_16px_40px_-16px_rgba(26,26,26,0.2)]"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                {hits.map((h) => {
                  const added = cols.some((c) => c.symbol === h.symbol);
                  return (
                    <button
                      key={h.symbol}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => !added && addSymbol(h.symbol, h.name)}
                      disabled={added}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[var(--ais-surface-2)] disabled:opacity-40"
                    >
                      <TickerBadge symbol={h.symbol} size={26} />
                      <span className="text-[13px] font-medium text-[var(--ais-fg)]">{h.symbol}</span>
                      <span className="truncate text-[12.5px] text-[var(--ais-fg-muted)]">{h.name}</span>
                      <span className="ml-auto shrink-0 text-[var(--ais-fg-faint)]">
                        {added ? <span className="text-[11px]">Eklendi</span> : <Plus size={14} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Boş durum ── */}
          {cols.length === 0 ? (
            <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
              <h2 className="d-section mb-5">Karşılaştırma</h2>
              <div
                className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center"
                style={{ borderColor: "var(--ais-line-strong)" }}
              >
                <Scale size={22} style={{ color: "var(--ais-fg-faint)" }} />
                <p className="text-[14px] font-medium text-[var(--ais-fg)]">Karşılaştırmak için sembol ekle</p>
                <p className="max-w-sm text-[12.5px] text-[var(--ais-fg-muted)]">
                  Yukarıdan en az iki hisse ara ve ekle; metrikleri yan yana göster, en iyi/kötü değeri
                  otomatik vurgulayalım.
                </p>
              </div>
            </section>
          ) : (
            <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
              <div className="mb-5">
                <h2 className="d-section">Karşılaştırma</h2>
                <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                  Seçtiğin semboller yan yana; en iyi/kötü değer otomatik vurgulanır.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                <table className="ais-dt min-w-[640px]">
                  <thead>
                    <tr>
                      <th className="w-[160px]">METRİK</th>
                      {cols.map((c) => (
                        <th key={c.symbol} className="!text-right">
                          <div className="flex items-center justify-end gap-2">
                            <TickerBadge symbol={c.symbol} size={22} />
                            <span className="text-[13px] font-medium text-[var(--ais-fg)]">{c.symbol}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* İsim */}
                    <tr>
                      <td className="text-[var(--ais-fg-muted)]">Şirket</td>
                      {cols.map((c) => (
                        <td key={c.symbol} className="!text-right">
                          {c.loading ? (
                            <div className="ais-skeleton ml-auto h-[12px] w-24" />
                          ) : (
                            <span className="text-[12.5px] text-[var(--ais-fg)]">{c.name}</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Trend (sparkline) */}
                    <tr>
                      <td className="text-[var(--ais-fg-muted)]">Trend</td>
                      {cols.map((c) => (
                        <td key={c.symbol} className="!text-right">
                          {c.loading ? (
                            <div className="ais-skeleton ml-auto h-[20px] w-[80px]" />
                          ) : (
                            <div className="flex justify-end">
                              <Sparkline seed={c.symbol} up={c.changePct >= 0} width={80} height={24} data={series[c.symbol.toUpperCase()]} />
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>

                    <CompareRow
                      label="Fiyat"
                      cols={cols}
                      value={(c) => fmtMoney(c.price, c.currency)}
                      key2={(c) => c.price}
                      dir="high"
                    />
                    <CompareRow
                      label="Günlük değişim"
                      cols={cols}
                      render={(c) => <Delta value={c.changePct} />}
                      key2={(c) => c.changePct}
                      dir="high"
                    />
                    <CompareRow
                      label="Piyasa değeri"
                      cols={cols}
                      value={(c) => (c.marketCap ? `$${fmtCompact(c.marketCap)}` : "—")}
                      key2={(c) => c.marketCap}
                      dir="high"
                    />
                    <CompareRow
                      label="52H yüksek"
                      cols={cols}
                      value={(c) => (c.high52 ? fmtMoney(c.high52, c.currency) : "—")}
                      key2={(c) => c.high52}
                      dir="high"
                      neutral
                    />
                    <CompareRow
                      label="52H düşük"
                      cols={cols}
                      value={(c) => (c.low52 ? fmtMoney(c.low52, c.currency) : "—")}
                      key2={(c) => c.low52}
                      dir="high"
                      neutral
                    />
                    <CompareRow
                      label="Hacim"
                      cols={cols}
                      value={(c) => (c.volume ? fmtCompact(c.volume) : "—")}
                      key2={(c) => c.volume}
                      dir="high"
                    />
                  </tbody>
                </table>
              </div>

              {!anyLoading && ready.length === 1 && (
                <p className="mt-3 text-[12.5px] text-[var(--ais-fg-muted)]">
                  Kıyaslamak için bir sembol daha ekle.
                </p>
              )}
            </section>
          )}

          {cols.length > 0 && (
            <p className="mt-3 text-[11.5px] leading-relaxed text-[var(--ais-fg-faint)]">
              Yeşil satır içindeki en avantajlı, kırmızı en zayıf değeri gösterir. Tüm değerler
              canlı piyasa verisinden gelir; bir veri kaynaktan alınamazsa &quot;—&quot; gösterilir.
              Yatırım tavsiyesi değildir.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Satır: metrik adı + her kolon için değer; satır bazında best/worst vurgu ── */
function CompareRow({
  label,
  cols,
  value,
  render,
  key2,
  dir,
  neutral,
  hint,
}: {
  label: string;
  cols: Col[];
  value?: (c: Col) => string;
  render?: (c: Col) => React.ReactNode;
  key2: (c: Col) => number | undefined;
  dir: "high" | "low";
  /** true ise best/worst renklendirme yapılmaz (nötr referans satırı). */
  neutral?: boolean;
  hint?: string;
}) {
  const vals = cols.map((c) => (c.loading ? undefined : key2(c)));
  const valid = vals.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  let best: number | undefined;
  let worst: number | undefined;
  if (!neutral && valid.length >= 2) {
    const max = Math.max(...valid);
    const min = Math.min(...valid);
    best = dir === "high" ? max : min;
    worst = dir === "high" ? min : max;
  }

  return (
    <tr>
      <td className="text-[var(--ais-fg-muted)]">
        {label}
        {hint && <span className="ml-1.5 text-[11px] text-[var(--ais-fg-faint)]">· {hint}</span>}
      </td>
      {cols.map((c) => {
        const v = c.loading ? undefined : key2(c);
        const isBest = best !== undefined && v === best && worst !== best;
        const isWorst = worst !== undefined && v === worst && worst !== best;
        const color = isBest ? UP : isWorst ? DOWN : undefined;
        return (
          <td key={c.symbol} className="!text-right">
            {c.loading ? (
              <div className="ais-skeleton ml-auto h-[12px] w-16" />
            ) : render ? (
              render(c)
            ) : (
              <span
                className="num text-[13px]"
                style={{ color: color ?? "var(--ais-fg)", fontWeight: isBest || isWorst ? 600 : 400 }}
              >
                {value?.(c)}
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );
}
