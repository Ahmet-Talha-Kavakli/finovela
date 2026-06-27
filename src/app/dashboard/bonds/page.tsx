"use client";

import { useMemo, useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import {
  PageTitle,
  SectionCard,
  Metric,
  Btn,
  Slider,
  AIS_UP,
  AIS_DOWN,
} from "@/components/dashboard/ais-kit";
import { fmtUsd } from "@/lib/dashboard/data";
import { notifStore } from "@/lib/dashboard/use-notifications";
import {
  BONDS,
  TREASURIES,
  screenBonds,
  currentYield,
  isInvestmentGrade,
  buildLadder,
  type BondType,
  type Rating,
} from "@/lib/dashboard/fixed-income";
import { Stack } from "@phosphor-icons/react";

const TYPES: { label: string; value: BondType | "all" }[] = [
  { label: "Tümü", value: "all" },
  { label: "Kurumsal", value: "corporate" },
  { label: "Hazine", value: "treasury" },
  { label: "Belediye", value: "muni" },
];

const RATINGS: { label: string; value: Rating | "all" }[] = [
  { label: "Tüm notlar", value: "all" },
  { label: "AAA", value: "AAA" },
  { label: "AA", value: "AA" },
  { label: "A", value: "A" },
  { label: "BBB", value: "BBB" },
  { label: "BB+", value: "BB+" },
];

export default function BondsPage() {
  const [type, setType] = useState<BondType | "all">("all");
  const [rating, setRating] = useState<Rating | "all">("all");
  const [minYield, setMinYield] = useState("");

  // GERÇEK Hazine getirileri (Treasury resmi API). Gelmezse mock kalır.
  const [treasuries, setTreasuries] = useState(TREASURIES);
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/market/treasury", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || !data.ok || !Array.isArray(data.terms) || !data.terms.length) return;
        const byTerm = new Map<string, number>();
        for (const t of data.terms as { term: string; yield: number }[]) byTerm.set(t.term, t.yield);
        setTreasuries((prev) =>
          prev.map((t) => (byTerm.has(t.term) ? { ...t, yield: byTerm.get(t.term)! } : t)),
        );
      } catch {
        /* mock kalsın */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      screenBonds(BONDS, {
        type,
        rating,
        minYield: minYield ? parseFloat(minYield) : undefined,
      }),
    [type, rating, minYield],
  );

  // Ladder builder state.
  const [ladderAmt, setLadderAmt] = useState("50000");
  const [rungs, setRungs] = useState(4);
  // Referans tarihi bir kez sabitle (render sırasında Date.now() çağırma).
  const [now] = useState(() => Date.now());

  const ladder = useMemo(() => {
    const amt = parseFloat(ladderAmt);
    if (!Number.isFinite(amt) || amt <= 0) return null;
    return buildLadder(amt, rungs, undefined, now);
  }, [ladderAmt, rungs, now]);

  function handleBuildLadder() {
    if (!ladder) return;
    // NOT: Hazine için bağlı broker emri henüz yok — bu bir PLAN/önizlemedir,
    // gerçek alım değil. Bildirim de bunu dürüstçe söyler.
    notifStore.push(
      "info",
      `Hazine merdiveni planı hazır: ${ladder.rungs.length} basamak, ${fmtUsd(ladder.totalAmount)} · %${ladder.blendedYield.toFixed(2)} harmanlanmış getiri (örnek plan — gerçek alım için brokerını bağla).`,
    );
  }

  const ratingColor = (r: Rating) => (isInvestmentGrade(r) ? "var(--ais-fg)" : AIS_DOWN);

  const typeLabel = (t: BondType) =>
    ({ corporate: "Kurumsal", treasury: "Hazine", muni: "Belediye" })[t] ?? t;

  return (
    <>
      <Topbar title="Tahviller & Hazine" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Tahviller & Hazine"
            desc="ABD Hazine getirilerini izle, merdiven kur ve tahvil evrenini tara."
          />

          {/* ── Treasury yield curve ──────────────────────────── */}
          <SectionCard
            label="ABD Hazine getirileri"
            className="mt-10"
            bodyClassName="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
          >
            {treasuries.map((t) => (
              <Metric
                key={t.id}
                label={t.term.toUpperCase()}
                value={`${t.yield.toFixed(2)}%`}
                color={AIS_UP}
              />
            ))}
          </SectionCard>

          {/* ── Treasury ladder builder ───────────────────────── */}
          <SectionCard
            label="Hazine merdiveni oluşturucu"
            className="mt-3"
            desc="Sermaye, kademeli vadelere (6 ay arayla) eşit olarak dağıtılır."
          >
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="space-y-5">
                <div>
                  <label className="text-[12px] text-[var(--ais-fg-faint)]">Tutar (USD)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={ladderAmt}
                    onChange={(e) => setLadderAmt(e.target.value)}
                    className="ais-input num mt-1.5"
                  />
                </div>
                <Slider
                  label="Basamak"
                  value={rungs}
                  min={2}
                  max={6}
                  step={1}
                  onChange={(v) => setRungs(v)}
                />
                {ladder && (
                  <div className="ais-card p-4 text-[13px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--ais-fg-muted)]">Harmanlanmış getiri</span>
                      <span className="num font-medium text-[var(--ais-fg)]">
                        {ladder.blendedYield.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[var(--ais-fg-muted)]">Öngörülen faiz</span>
                      <span className="num font-medium" style={{ color: AIS_UP }}>
                        +{fmtUsd(ladder.totalProjectedInterest)}
                      </span>
                    </div>
                  </div>
                )}
                <Btn
                  variant="primary"
                  onClick={handleBuildLadder}
                  disabled={!ladder}
                  className="w-full"
                >
                  Merdiven planı oluştur <Stack size={15} weight="regular" />
                </Btn>
              </div>

              <div className="overflow-x-auto">
                <table className="ais-dt min-w-[420px]">
                  <thead>
                    <tr>
                      <th className="text-left">Basamak</th>
                      <th className="text-right">Vade</th>
                      <th className="text-right">Vade tarihi</th>
                      <th className="text-right">Tutar</th>
                      <th className="text-right">Getiri</th>
                      <th className="text-right">Faiz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ladder?.rungs.map((r) => (
                      <tr key={r.index}>
                        <td className="font-medium text-[var(--ais-fg)]">#{r.index}</td>
                        <td className="num text-right">{r.termLabel}</td>
                        <td className="num text-right text-[var(--ais-fg-muted)]">{r.maturityDate}</td>
                        <td className="num text-right">{fmtUsd(r.amount, 0)}</td>
                        <td className="num text-right">{r.yield.toFixed(2)}%</td>
                        <td className="num text-right font-medium" style={{ color: AIS_UP }}>
                          +{fmtUsd(r.projectedInterest, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>

          {/* ── Bond screener ─────────────────────────────────── */}
          <SectionCard
            label="Tahvil tarayıcı"
            className="mt-3"
            desc="ABD Hazine getirileri canlıdır; kurumsal ve belediye tahvilleri örnek bir evrendir (canlı tahvil kotasyonu değildir)."
            action={
              <span className="num text-[12.5px] text-[var(--ais-fg-faint)]">{filtered.length} tahvil</span>
            }
          >
            <div className="mb-5 flex flex-wrap items-end gap-3">
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={`rounded-lg border px-3 py-1.5 text-[12.5px] transition ${
                      type === t.value
                        ? "border-[var(--ais-accent)]/50 text-[var(--ais-accent)]"
                        : "border-[var(--ais-line-strong)] text-[var(--ais-fg-muted)] hover:text-[var(--ais-fg)]"
                    }`}
                    style={type === t.value ? { background: "var(--ais-accent-bg)" } : undefined}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-[12px] text-[var(--ais-fg-faint)]">Not</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value as Rating | "all")}
                  className="ais-input mt-1 h-8 py-0"
                >
                  {RATINGS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] text-[var(--ais-fg-faint)]">Min. getiri %</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={minYield}
                  onChange={(e) => setMinYield(e.target.value)}
                  placeholder="0"
                  className="ais-input num mt-1 h-8 w-24 py-0"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="ais-dt min-w-[720px]">
                <thead>
                  <tr>
                    <th className="text-left">İhraççı</th>
                    <th className="text-left">Tür</th>
                    <th className="text-right">Kupon</th>
                    <th className="text-right">Güncel getiri</th>
                    <th className="text-right">YTM</th>
                    <th className="text-right">Fiyat</th>
                    <th className="text-right">Not</th>
                    <th className="text-right">Vade</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id}>
                      <td className="font-medium text-[var(--ais-fg)]">{b.issuer}</td>
                      <td className="text-[var(--ais-fg-muted)]">{typeLabel(b.type)}</td>
                      <td className="num text-right">{b.coupon.toFixed(2)}%</td>
                      <td className="num text-right">{currentYield(b).toFixed(2)}%</td>
                      <td className="num text-right font-medium" style={{ color: AIS_UP }}>
                        {b.ytm.toFixed(2)}%
                      </td>
                      <td className="num text-right">{b.price.toFixed(1)}</td>
                      <td className="num text-right font-medium" style={{ color: ratingColor(b.rating) }}>
                        {b.rating}
                      </td>
                      <td className="num text-right text-[var(--ais-fg-muted)]">{b.maturity}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[var(--ais-fg-muted)]">
                        Bu filtrelere uyan tahvil yok.
                      </td>
                    </tr>
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
