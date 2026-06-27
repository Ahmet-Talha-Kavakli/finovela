"use client";

/**
 * Finovela Kazan — yüksek getirili nakit (canlı bileşik faiz) + kripto staking.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ızgara-ayraçlı metrik şeridi, token renkleri, Lucide ikonlar.
 * İşlevsellik (deposit/withdraw/stake/tick/faiz) AYNEN korunur; yalnız görsel.
 */

import { useState, useEffect } from "react";
import { AreaChart, RadialGauge } from "@/components/dashboard/area-chart";
import { Topbar } from "@/components/dashboard/topbar";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { AnimatedNumber, LiveDot } from "@/components/dashboard/animated-number";
import { fmtUsd } from "@/lib/dashboard/data";
import { useCash } from "@/lib/dashboard/use-cash";
import { cashStore, STAKE_APY, type StakePosition } from "@/lib/dashboard/cash-store";
import {
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Zap,
  TrendingUp,
} from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const DOWN = "#d93025";
const ACCENT = "var(--ais-accent)";

const FDIC_LIMIT = 5_000_000;
const STAKE_SYMBOLS: StakePosition["symbol"][] = ["BTC", "ETH", "SOL"];
const MONTHS = ["Şu an", "1a", "2a", "3a", "4a", "5a", "6a", "7a", "8a", "9a", "10a", "11a", "12a"];

export default function EarnPage() {
  const cash = useCash();
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const [stakeSym, setStakeSym] = useState<StakePosition["symbol"]>("ETH");
  const [stakeAmt, setStakeAmt] = useState("");
  const [stakeErr, setStakeErr] = useState<string | null>(null);

  // Faiz "her saniye birikir" — sayfa açıkken her 1sn cashStore.tick() çağır.
  useEffect(() => {
    const id = setInterval(() => cashStore.tick(), 1000);
    return () => clearInterval(id);
  }, []);

  const annualInterest = cash.balance * (cash.apy / 100);
  const monthlyInterest = annualInterest / 12;

  // Önümüzdeki 12 ay BİLEŞİK birikimli faiz eğrisi (düz çizgi değil — kavisli).
  const monthlyRate = cash.apy / 100 / 12;
  const incomeCurve = Array.from({ length: 13 }, (_, i) => ({
    t: i,
    v: +(cash.balance * (Math.pow(1 + monthlyRate, i) - 1)).toFixed(2),
  }));
  const projected12mo = incomeCurve[incomeCurve.length - 1].v;

  // APY gauge — APY'yi 0-100 ölçeğine taşı (görsel doluluk).
  const gaugeVal = Math.min(100, cash.apy * 14);

  function handleDeposit() {
    setErr(null);
    const n = parseFloat(amount);
    const r = cashStore.deposit(n);
    if (!r.ok) return setErr(r.error ?? "İşlem başarısız");
    setAmount("");
  }

  function handleWithdraw() {
    setErr(null);
    const n = parseFloat(amount);
    const r = cashStore.withdraw(n);
    if (!r.ok) return setErr(r.error ?? "İşlem başarısız");
    setAmount("");
  }

  function handleStake() {
    setStakeErr(null);
    const n = parseFloat(stakeAmt);
    const r = cashStore.stake(stakeSym, n);
    if (!r.ok) return setStakeErr(r.error ?? "İşlem başarısız");
    setStakeAmt("");
  }

  function handleUnstake(symbol: StakePosition["symbol"]) {
    const pos = cash.stakes.find((s) => s.symbol === symbol);
    if (!pos) return;
    cashStore.unstake(symbol, pos.amount);
  }

  return (
    <>
      <Topbar title="Kazan" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Kazan</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Nakdin her saniye birikir, kripto stake et ve gelirini izle. Gösterilen APY oranları
              tahmini/örnek niteliğindedir; gerçek getiriler bağlı platforma ve piyasaya göre değişir.
            </p>
          </div>

          {/* ── Yüksek Getirili Nakit merkezi ── */}
          <section className="mt-9 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="d-section">Yüksek Getirili Nakit merkezi</h2>
                <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                  Nakdiniz kilitlenme olmadan her saniye bileşik faiz kazanır.
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-muted)]">
                <LiveDot color={UP} /> canlı
              </span>
            </div>

            <div
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
            >
              {/* Üst şerit: gauge + yıllık gelir özeti */}
              <div
                className="grid gap-6 border-b p-6 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-10"
                style={{ borderColor: "var(--ais-line)" }}
              >
                <div className="flex items-center gap-6">
                  <RadialGauge
                    value={gaugeVal}
                    size={132}
                    label={`${cash.apy.toFixed(2)}%`}
                    sublabel="Nakit APY"
                    tone="up"
                  />
                  <div className="lg:hidden">
                    <p className="text-[12px] text-[var(--ais-fg-faint)]">Öngörülen yıllık gelir</p>
                    <p className="num mt-1 text-[28px] font-medium tracking-tight" style={{ color: UP }}>
                      +<AnimatedNumber value={annualInterest} format={(n) => fmtUsd(n)} />
                    </p>
                  </div>
                </div>

                <div className="hidden lg:block">
                  <p className="text-[12px] text-[var(--ais-fg-faint)]">Öngörülen yıllık gelir</p>
                  <p className="num mt-1 text-[36px] font-medium leading-none tracking-tight" style={{ color: UP }}>
                    +<AnimatedNumber value={annualInterest} format={(n) => fmtUsd(n)} />
                  </p>
                  <p className="mt-2.5 max-w-lg text-[13px] leading-relaxed text-[var(--ais-fg-muted)]">
                    Nakdiniz %{cash.apy.toFixed(2)} APY kazanır ve her saniye bileşik olarak bakiyenize
                    eklenir — kilitlenme yok, dilediğiniz zaman çekin.
                  </p>
                </div>
              </div>

              {/* Metrikler (count-up) */}
              <div className="grid grid-cols-2 gap-px sm:grid-cols-4" style={{ background: "var(--ais-line)" }}>
                <MiniMetric label="Bakiye" animate={cash.balance} format={(n) => fmtUsd(n)} live />
                <MiniMetric label="Faiz / ay" animate={monthlyInterest} format={(n) => fmtUsd(n)} color={UP} />
                <MiniMetric label="Bugüne kadar kazanılan" animate={cash.accruedTotal} format={(n) => fmtUsd(n)} color={UP} />
                <MiniMetric label="APY" animate={cash.apy} format={(n) => `${n.toFixed(2)}%`} color={UP} />
              </div>

              {/* Öngörülen birikimli faiz — DOLGULU alan grafiği (bileşik kavis) */}
              <div className="p-6">
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[12.5px] text-[var(--ais-fg-muted)]">
                      <TrendingUp size={14} style={{ color: UP }} />
                      Öngörülen birikimli faiz
                    </div>
                    <p className="num mt-1.5 text-[24px] font-medium tracking-tight" style={{ color: UP }}>
                      +{fmtUsd(projected12mo)}
                      <span className="ml-2 text-[13px] text-[var(--ais-fg-faint)]">12 ay sonunda</span>
                    </p>
                  </div>
                  <span className="text-[12px] text-[var(--ais-fg-faint)]">Önümüzdeki 12 ay · bileşik</span>
                </div>
                <ChartFrame
                  title="Öngörülen birikimli faiz"
                  light
                  render={(big) => (
                    <div style={{ height: big ? 440 : 220 }}>
                      <AreaChart data={incomeCurve} positive />
                    </div>
                  )}
                />
                <div className="mt-2 flex justify-between text-[10.5px] text-[var(--ais-fg-faint)]">
                  {MONTHS.filter((_, i) => i % 2 === 0).map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Hesap & işlemler: iki denk kart ── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="mb-5">
              <h2 className="d-section">Hesap &amp; işlemler</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                Nakdini yönet veya atıl kriptonu stake et.
              </p>
            </div>

            <div className="grid items-stretch gap-3 lg:grid-cols-2">
              {/* High-Yield Cash */}
              <div
                className="flex flex-col rounded-xl border p-5"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                      style={{ background: "var(--ais-green-bg)", color: UP }}
                    >
                      <Landmark size={18} />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Yüksek Getirili Nakit</p>
                      <p className="text-[12px] text-[var(--ais-fg-faint)]">FDIC güvenceli</p>
                    </div>
                  </div>
                  <span
                    className="num badge-soft badge-green"
                  >
                    {cash.apy.toFixed(2)}% APY
                  </span>
                </div>

                <p className="num mt-5 text-[28px] font-medium tracking-tight text-[var(--ais-fg)]">
                  <AnimatedNumber value={cash.balance} format={(n) => fmtUsd(n)} />
                </p>
                <p className="flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-faint)]">
                  Kullanılabilir bakiye · <LiveDot color={UP} label="canlı birikir" />
                </p>

                <div
                  className="mt-4 flex items-center justify-between rounded-xl border px-3 py-2.5 text-[13px]"
                  style={{ borderColor: "var(--ais-line)" }}
                >
                  <span className="text-[var(--ais-fg-muted)]">Bu ayki faiz</span>
                  <span className="num font-medium" style={{ color: UP }}>
                    +<AnimatedNumber value={monthlyInterest} format={(n) => fmtUsd(n)} />
                  </span>
                </div>

                {/* Move cash in / withdraw — kartın altına sabitlenir */}
                <div className="mt-auto pt-5">
                  <label className="text-[12px] text-[var(--ais-fg-faint)]">Tutar (USD)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1,000"
                    className="ais-input num mt-1.5 w-full"
                  />
                  {err && <p className="mt-2 text-[12px]" style={{ color: DOWN }}>{err}</p>}
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      onClick={handleDeposit}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium text-white transition hover:brightness-[1.06]"
                      style={{ background: ACCENT }}
                    >
                      Nakit yatır <ArrowUpRight size={15} />
                    </button>
                    <button
                      onClick={handleWithdraw}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border px-4 py-2.5 text-[13px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
                      style={{ borderColor: "var(--ais-line-strong)" }}
                    >
                      Çek <ArrowDownRight size={15} />
                    </button>
                  </div>
                  <div className="mt-4 flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-faint)]">
                    <ShieldCheck size={14} />
                    {fmtUsd(FDIC_LIMIT, 0)} tutarına kadar FDIC güvenceli
                  </div>
                </div>
              </div>

              {/* Kripto Staking */}
              <div
                className="flex flex-col rounded-xl border p-5"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                      style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                    >
                      <Zap size={18} />
                    </span>
                    <div>
                      <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Kripto Staking</p>
                      <p className="text-[12px] text-[var(--ais-fg-faint)]">Atıl kriptodan ödül kazanın</p>
                    </div>
                  </div>
                  <span className="num badge-soft badge-green">
                    %{STAKE_APY[stakeSym].toFixed(1)} APY
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {STAKE_SYMBOLS.map((sym) => {
                    const on = stakeSym === sym;
                    return (
                      <button
                        key={sym}
                        onClick={() => setStakeSym(sym)}
                        className="rounded-xl border px-3 py-2.5 text-center transition"
                        style={{
                          borderColor: on ? "rgba(37,103,255,0.5)" : "var(--ais-line-strong)",
                          background: on ? "var(--ais-accent-bg)" : "transparent",
                        }}
                      >
                        <p
                          className="text-[13px] font-medium"
                          style={{ color: on ? "var(--ais-fg)" : "var(--ais-fg-muted)" }}
                        >
                          {sym}
                        </p>
                        <p className="num mt-0.5 text-[11px]" style={{ color: UP }}>
                          {STAKE_APY[sym].toFixed(1)}%
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <label className="text-[12px] text-[var(--ais-fg-faint)]">Tutar ({stakeSym})</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={stakeAmt}
                    onChange={(e) => setStakeAmt(e.target.value)}
                    placeholder="0.5"
                    className="ais-input num mt-1.5 w-full"
                  />
                  {stakeErr && <p className="mt-2 text-[12px]" style={{ color: DOWN }}>{stakeErr}</p>}
                  <button
                    onClick={handleStake}
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium text-white transition hover:brightness-[1.06]"
                    style={{ background: ACCENT }}
                  >
                    {stakeSym} stake et <Zap size={15} />
                  </button>
                </div>

                <div className="mt-auto space-y-2 pt-5">
                  {cash.stakes.length === 0 ? (
                    <div
                      className="rounded-xl border border-dashed px-3 py-4 text-center text-[12px] text-[var(--ais-fg-faint)]"
                      style={{ borderColor: "var(--ais-line-strong)" }}
                    >
                      Henüz aktif stake yok.
                    </div>
                  ) : (
                    cash.stakes.map((s) => (
                      <div
                        key={s.symbol}
                        className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-[13px]"
                        style={{ borderColor: "var(--ais-line)" }}
                      >
                        <div>
                          <p className="num font-medium text-[var(--ais-fg)]">
                            {s.amount} {s.symbol}
                          </p>
                          <p className="num text-[12px]" style={{ color: UP }}>
                            +{s.rewards.toFixed(6)} {s.symbol} ödül · %{s.apy.toFixed(1)} APY
                          </p>
                        </div>
                        <button
                          onClick={() => handleUnstake(s.symbol)}
                          className="inline-flex items-center rounded-full border px-3 py-1.5 text-[12px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
                          style={{ borderColor: "var(--ais-line-strong)" }}
                        >
                          Stake&apos;i çöz
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <p className="mt-4 text-[12px] text-[var(--ais-fg-faint)]">
              Hazine ve tahvil merdivenleri mi arıyorsunuz?{" "}
              <a href="/dashboard/bonds" className="underline-offset-2 hover:underline" style={{ color: ACCENT }}>
                Tahviller &amp; Hazine&apos;yi aç →
              </a>
            </p>
          </section>
        </div>
      </div>
    </>
  );
}

/* ── Hub içi metrik — bölünmüş şerit (gap-px ayraçlı) için. ── */
function MiniMetric({
  label,
  animate,
  format,
  color,
  live,
}: {
  label: string;
  animate: number;
  format: (n: number) => string;
  color?: string;
  live?: boolean;
}) {
  return (
    <div className="bg-[var(--ais-surface)] px-5 py-4">
      <p className="flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-faint)]">
        {label}
        {live && <LiveDot color={UP} />}
      </p>
      <p className="num mt-2 text-[20px] font-medium tracking-tight" style={{ color: color ?? "var(--ais-fg)" }}>
        <AnimatedNumber value={animate} format={format} />
      </p>
    </div>
  );
}
