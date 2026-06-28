"use client";

/**
 * Finovela Tahviller & Hazine — getiri eğrisi + merdiven oluşturucu + tarayıcı.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ızgara-ayraçlı metrik şeridi, ais-dt dense tablo, token renkleri.
 * Beyaz-sabit renk YOK — hepsi --ais-* token (açık temada okunur).
 */

import { useMemo, useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/topbar";
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
import { PlanGate } from "@/components/dashboard/plan-gate";
import { Layers } from "lucide-react";

// Didit açık-tema renkleri.
const ACCENT = "var(--ais-accent)";
const UP = "var(--ais-green)";
const DOWN = "#d93025";

// Tahvil türü → seçili çip tonu (her tür farklı, hep mavi değil).
type Tone = "blue" | "green" | "teal" | "amber";
const TONE: Record<Tone, { fg: string; bg: string }> = {
  blue: { fg: "var(--ais-accent)", bg: "var(--ais-accent-bg)" },
  green: { fg: "var(--ais-green)", bg: "var(--ais-green-bg)" },
  teal: { fg: "#0f8a8a", bg: "rgba(15,138,138,0.12)" },
  amber: { fg: "var(--ais-amber)", bg: "var(--ais-amber-bg)" },
};

const TYPES: { label: string; value: BondType | "all"; tone: Tone }[] = [
  { label: "Tümü", value: "all", tone: "blue" },
  { label: "Kurumsal", value: "corporate", tone: "blue" },   // şirket tahvili → mavi
  { label: "Hazine", value: "treasury", tone: "green" },     // devlet → güvenli yeşil
  { label: "Belediye", value: "muni", tone: "teal" },        // belediye → teal
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
  const [now] = useState(() => (typeof window === "undefined" ? 0 : Date.now()));

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

  const ratingColor = (r: Rating) => (isInvestmentGrade(r) ? "var(--ais-fg)" : DOWN);

  const typeLabel = (t: BondType) =>
    ({ corporate: "Kurumsal", treasury: "Hazine", muni: "Belediye" })[t] ?? t;

  const rungsPct = ((rungs - 2) / (6 - 2)) * 100;

  return (
    <>
      <Topbar title="Tahviller & Hazine" />
      <PlanGate feature="optionsAndBonds">
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Tahviller &amp; Hazine</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              ABD Hazine getirilerini izle, merdiven kur ve tahvil evrenini tara.
            </p>
          </div>

          {/* ───────── ABD Hazine getirileri (kutusuz ızgara-ayraçlı şerit) ───────── */}
          <section className="mt-9 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">ABD Hazine getirileri</h2>
            <div
              className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-3 lg:grid-cols-6"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
            >
              {treasuries.map((t) => (
                <div key={t.id} className="bg-[var(--ais-surface)] px-5 py-4">
                  <p className="text-[11.5px] text-[var(--ais-fg-faint)]">{t.term.toUpperCase()}</p>
                  <p className="num mt-2 text-[19px] font-medium tracking-tight" style={{ color: UP }}>
                    {t.yield.toFixed(2)}%
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ───────── Hazine merdiveni oluşturucu ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5">
              <h2 className="d-section">Hazine merdiveni oluşturucu</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                Sermaye, kademeli vadelere (6 ay arayla) eşit olarak dağıtılır.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <div className="space-y-5">
                <div>
                  <label className="text-[12px] text-[var(--ais-fg-faint)]">Tutar (USD)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={ladderAmt}
                    onChange={(e) => setLadderAmt(e.target.value)}
                    className="ais-input num mt-1.5 w-full"
                  />
                </div>

                {/* Didit slider */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="text-[13px] text-[var(--ais-fg-muted)]">Basamak</span>
                    <span className="num text-[13px] font-medium text-[var(--ais-fg)]">{rungs}</span>
                  </div>
                  <div className="relative h-1 rounded-full" style={{ background: "var(--ais-line-strong)" }}>
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${rungsPct}%`, background: ACCENT }} />
                    <input
                      type="range"
                      min={2}
                      max={6}
                      step={1}
                      value={rungs}
                      onChange={(e) => setRungs(Number(e.target.value))}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    <div
                      className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full"
                      style={{ left: `calc(${rungsPct}% - 7px)`, background: ACCENT, boxShadow: "0 0 0 4px var(--ais-bg)" }}
                    />
                  </div>
                </div>

                {ladder && (
                  <div className="rounded-xl border p-4 text-[13px]" style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--ais-fg-muted)]">Harmanlanmış getiri</span>
                      <span className="num font-medium text-[var(--ais-fg)]">
                        {ladder.blendedYield.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[var(--ais-fg-muted)]">Öngörülen faiz</span>
                      <span className="num font-medium" style={{ color: UP }}>
                        +{fmtUsd(ladder.totalProjectedInterest)}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBuildLadder}
                  disabled={!ladder}
                  className="pill-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Merdiven planı oluştur <Layers size={15} />
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                <table className="ais-dt min-w-[420px]">
                  <thead>
                    <tr>
                      <th>BASAMAK</th>
                      <th className="!text-right">VADE</th>
                      <th className="!text-right">VADE TARİHİ</th>
                      <th className="!text-right">TUTAR</th>
                      <th className="!text-right">GETİRİ</th>
                      <th className="!text-right">FAİZ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ladder?.rungs.map((r) => (
                      <tr key={r.index}>
                        <td className="font-medium text-[var(--ais-fg)]">#{r.index}</td>
                        <td className="num !text-right">{r.termLabel}</td>
                        <td className="num !text-right text-[var(--ais-fg-muted)]">{r.maturityDate}</td>
                        <td className="num !text-right">{fmtUsd(r.amount, 0)}</td>
                        <td className="num !text-right">{r.yield.toFixed(2)}%</td>
                        <td className="num !text-right font-medium" style={{ color: UP }}>
                          +{fmtUsd(r.projectedInterest, 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ───────── Tahvil tarayıcı ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="d-section">Tahvil tarayıcı</h2>
                <p className="mt-1 max-w-2xl text-[12.5px] text-[var(--ais-fg-muted)]">
                  ABD Hazine getirileri canlıdır; kurumsal ve belediye tahvilleri örnek bir evrendir
                  (canlı tahvil kotasyonu değildir).
                </p>
              </div>
              <span className="num shrink-0 text-[12.5px] text-[var(--ais-fg-faint)]">{filtered.length} tahvil</span>
            </div>

            <div className="mb-5 flex flex-wrap items-end gap-3">
              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => {
                  const on = type === t.value;
                  const tc = TONE[t.tone];
                  return (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className="rounded-lg border px-3 py-1.5 text-[12.5px] transition"
                      style={{
                        borderColor: on ? "transparent" : "var(--ais-line-strong)",
                        background: on ? tc.bg : "transparent",
                        color: on ? tc.fg : "var(--ais-fg-muted)",
                      }}
                    >
                      {t.label}
                    </button>
                  );
                })}
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

            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
              <table className="ais-dt min-w-[720px]">
                <thead>
                  <tr>
                    <th>İHRAÇÇI</th>
                    <th>TÜR</th>
                    <th className="!text-right">KUPON</th>
                    <th className="!text-right">GÜNCEL GETİRİ</th>
                    <th className="!text-right">YTM</th>
                    <th className="!text-right">FİYAT</th>
                    <th className="!text-right">NOT</th>
                    <th className="!text-right">VADE</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id}>
                      <td className="font-medium text-[var(--ais-fg)]">{b.issuer}</td>
                      <td className="text-[var(--ais-fg-muted)]">{typeLabel(b.type)}</td>
                      <td className="num !text-right">{b.coupon.toFixed(2)}%</td>
                      <td className="num !text-right">{currentYield(b).toFixed(2)}%</td>
                      <td className="num !text-right font-medium" style={{ color: UP }}>
                        {b.ytm.toFixed(2)}%
                      </td>
                      <td className="num !text-right">{b.price.toFixed(1)}</td>
                      <td className="num !text-right font-medium" style={{ color: ratingColor(b.rating) }}>
                        {b.rating}
                      </td>
                      <td className="num !text-right text-[var(--ais-fg-muted)]">{b.maturity}</td>
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
          </section>
        </div>
      </div>
      </PlanGate>
    </>
  );
}
