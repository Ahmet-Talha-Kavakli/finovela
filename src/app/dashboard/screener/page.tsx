"use client";

/**
 * Finovela Hisse Tarama — kriter çubuğu + filtreli ais-dt sonuç tablosu.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, chip filtreler, token renkleri. Beyaz-sabit renk YOK.
 */

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { fmtMoney } from "@/lib/dashboard/data";
import { UNIVERSE } from "@/lib/market/universe";
import { categoryTone, TONE } from "@/components/dashboard/ais-kit";
import {
  applyScreener,
  capTierOf,
  sectorsOf,
  DEFAULT_CRITERIA,
  FILTERS,
  PRESETS,
  type ScreenerCriteria,
  type ScreenerRow,
  type AssetClass,
  type ChangeMode,
  type CapTier,
  type SortKey,
} from "@/lib/dashboard/screener";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const DOWN = "#d93025";

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

export default function ScreenerPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ScreenerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [criteria, setCriteria] = useState<ScreenerCriteria>(DEFAULT_CRITERIA);

  // Tüm evren için canlı kotasyonları bir kez çek.
  useEffect(() => {
    const symbols = UNIVERSE.map((u) => u.symbol).join(",");
    fetch(`/api/market/quote?symbols=${symbols}`)
      .then((r) => r.json())
      .then(
        (d: {
          quotes?: { symbol: string; price: number; changePct: number }[];
        }) => {
          const map = new Map((d.quotes ?? []).map((q) => [q.symbol, q]));
          setRows(
            UNIVERSE.map((u) => {
              const q = map.get(u.symbol);
              return {
                symbol: u.symbol,
                name: u.name,
                sector: u.sector,
                type: u.type,
                currency: u.currency ?? "USD",
                price: q?.price ?? u.basePrice,
                changePct: q?.changePct ?? 0,
                marketCap: u.marketCap,
                capTier: capTierOf(u.marketCap),
              };
            }),
          );
        },
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sectors = useMemo(() => sectorsOf(rows), [rows]);
  const results = useMemo(
    () => applyScreener(rows, criteria),
    [rows, criteria],
  );

  function patch(p: Partial<ScreenerCriteria>) {
    setCriteria((c) => ({ ...c, ...p }));
  }

  const activePreset = PRESETS.find(
    (p) => JSON.stringify(p.criteria) === JSON.stringify(criteria),
  )?.key;

  return (
    <>
      <Topbar title="Hisse Tarama" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Hisse Tarama</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Kriterlerini belirle, evreni filtrele; Finovela uygun enstrümanları listeler.
            </p>
          </div>

          {/* ───────── Hazır şablonlar ───────── */}
          <div className="mt-6 flex flex-wrap items-center gap-1.5">
            {PRESETS.map((p) => {
              const on = activePreset === p.key;
              // Şablon tonu: orange→kripto turuncusu, diğerleri ortak TONE haritası.
              const t =
                p.tone === "orange"
                  ? { fg: "#f7931a", bg: "rgba(247,147,26,0.12)" }
                  : TONE[p.tone ?? "blue"];
              return (
                <button
                  key={p.key}
                  onClick={() => setCriteria(p.criteria)}
                  className="rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition"
                  style={{
                    borderColor: on ? "transparent" : "var(--ais-line)",
                    background: on ? t.bg : "transparent",
                    color: on ? t.fg : "var(--ais-fg-muted)",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
            <button
              onClick={() => setCriteria(DEFAULT_CRITERIA)}
              className="ml-auto text-[12px] text-[var(--ais-fg-faint)] transition hover:text-[var(--ais-fg)]"
            >
              Filtreleri sıfırla
            </button>
          </div>

          {/* ───────── Filtreler ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Filtreler</h2>

            {/* varlık sınıfı çipleri */}
            <div className="mb-5 flex flex-wrap gap-1.5">
              {FILTERS.assetClasses.map((c) => {
                const on = criteria.assetClass === c.key;
                const t = categoryTone(c.key);
                return (
                  <button
                    key={c.key}
                    onClick={() => patch({ assetClass: c.key as AssetClass })}
                    className="rounded-full border px-3 py-1.5 text-[12px] font-medium transition"
                    style={{
                      borderColor: on ? "transparent" : "var(--ais-line)",
                      background: on ? t.bg : "transparent",
                      color: on ? t.fg : "var(--ais-fg-muted)",
                    }}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            {/* dropdown / aralık satırı */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Sektör">
                <select
                  value={criteria.sector}
                  onChange={(e) => patch({ sector: e.target.value })}
                  className={selectCls}
                >
                  <option value="all">Tüm sektörler</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Günlük değişim">
                <select
                  value={criteria.changeMode}
                  onChange={(e) =>
                    patch({ changeMode: e.target.value as ChangeMode })
                  }
                  className={selectCls}
                >
                  {FILTERS.changeModes.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Piyasa değeri">
                <select
                  value={criteria.capTier}
                  onChange={(e) =>
                    patch({ capTier: e.target.value as CapTier | "all" })
                  }
                  className={selectCls}
                >
                  {FILTERS.capTiers.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Sıralama">
                <select
                  value={criteria.sort}
                  onChange={(e) => patch({ sort: e.target.value as SortKey })}
                  className={selectCls}
                >
                  {FILTERS.sorts.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Min fiyat">
                <input
                  type="number"
                  inputMode="decimal"
                  value={criteria.minPrice ?? ""}
                  onChange={(e) =>
                    patch({
                      minPrice: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="0"
                  className="ais-input"
                />
              </Field>
              <Field label="Max fiyat">
                <input
                  type="number"
                  inputMode="decimal"
                  value={criteria.maxPrice ?? ""}
                  onChange={(e) =>
                    patch({
                      maxPrice: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="∞"
                  className="ais-input"
                />
              </Field>
            </div>
          </section>

          {/* ───────── Sonuçlar ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="d-section">Sonuçlar</h2>
              <span className="num text-[12px] text-[var(--ais-fg-faint)]">
                {loading ? "Yükleniyor…" : `${results.length} sonuç`}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
              <table className="ais-dt min-w-[640px]">
                <thead>
                  <tr>
                    <th>VARLIK</th>
                    <th>SEKTÖR</th>
                    <th className="!text-right">FİYAT</th>
                    <th className="!text-right">BUGÜN</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((a) => (
                    <tr
                      key={a.symbol}
                      onClick={() => router.push(`/dashboard/stock/${a.symbol}`)}
                      className="cursor-pointer"
                    >
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
                      <td className="num !text-right font-medium">
                        {fmtMoney(a.price, a.currency)}
                      </td>
                      <td className="!text-right">
                        <Delta value={a.changePct} />
                      </td>
                    </tr>
                  ))}
                  {!loading && results.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-[var(--ais-fg-faint)]"
                      >
                        Bu kriterlere uyan enstrüman bulunamadı. Filtreleri
                        gevşetmeyi deneyin.
                      </td>
                    </tr>
                  )}
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
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

const selectCls = "ais-input [&>option]:bg-[var(--ais-surface)]";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] text-[var(--ais-fg-faint)]">{label}</span>
      {children}
    </label>
  );
}
