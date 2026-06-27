"use client";

import { useState, useEffect } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import {
  PageTitle,
  SectionCard,
  Card,
  Metric,
  Btn,
  IconChip,
  AIS_ACCENT,
  AIS_UP,
  AIS_DOWN,
} from "@/components/dashboard/ais-kit";
import { AreaChart, RadialGauge } from "@/components/dashboard/area-chart";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { AnimatedNumber, LiveDot } from "@/components/dashboard/animated-number";
import { fmtUsd } from "@/lib/dashboard/data";
import { useCash } from "@/lib/dashboard/use-cash";
import { cashStore, STAKE_APY, type StakePosition } from "@/lib/dashboard/cash-store";
import {
  Bank,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Lightning,
  TrendUp,
} from "@phosphor-icons/react";

/* ──────────────────────────────────────────────────────────
   High-Yield Cash — gerçek bakiye + sürekli faiz (cash-store).
   Mantık (deposit/withdraw/stake/tick/faiz) AYNEN korunur; yalnız görsel.
   ────────────────────────────────────────────────────────── */

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
  // tick() accrue + persist + listener'ları uyarır, böylece bakiye canlı artar.
  useEffect(() => {
    const id = setInterval(() => cashStore.tick(), 1000);
    return () => clearInterval(id);
  }, []);

  const annualInterest = cash.balance * (cash.apy / 100);
  const monthlyInterest = annualInterest / 12;

  // Önümüzdeki 12 ay BİLEŞİK birikimli faiz eğrisi (düz çizgi değil — kavisli).
  // Faiz, bakiyeye aylık bileşik eklenir; eğri yukarı doğru hızlanarak büyür.
  const monthlyRate = cash.apy / 100 / 12;
  const incomeCurve = Array.from({ length: 13 }, (_, i) => ({
    t: i,
    v: +(cash.balance * (Math.pow(1 + monthlyRate, i) - 1)).toFixed(2),
  }));
  // 12 ay sonunda biriken toplam faiz (eğrinin son noktası).
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
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Kazan"
            desc="Nakdin her saniye birikir, kripto stake et ve gelirini izle. Gösterilen APY oranları tahmini/örnek niteliğindedir; gerçek getiriler bağlı platforma ve piyasaya göre değişir."
          />

          {/* ── Income Hub: APY gauge + öngörülen gelir + grafik ── */}
          <SectionCard
            label="Yüksek Getirili Nakit merkezi"
            desc="Nakdiniz kilitlenme olmadan her saniye bileşik faiz kazanır."
            className="mt-10"
            action={
              <span className="flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-muted)]">
                <LiveDot color={AIS_UP} /> canlı
              </span>
            }
            bodyClassName="p-0"
          >
            {/* Üst şerit: gauge + yıllık gelir özeti */}
            <div className="grid gap-6 border-b border-[var(--ais-line)] p-6 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-10">
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
                  <p className="num mt-1 text-[28px] font-normal tracking-tight" style={{ color: AIS_UP }}>
                    +<AnimatedNumber value={annualInterest} format={(n) => fmtUsd(n)} />
                  </p>
                </div>
              </div>

              <div className="hidden lg:block">
                <p className="text-[12px] text-[var(--ais-fg-faint)]">Öngörülen yıllık gelir</p>
                <p className="num mt-1 text-[36px] font-normal leading-none tracking-tight" style={{ color: AIS_UP }}>
                  +<AnimatedNumber value={annualInterest} format={(n) => fmtUsd(n)} />
                </p>
                <p className="mt-2.5 max-w-lg text-[13px] leading-relaxed text-[var(--ais-fg-muted)]">
                  Nakdiniz %{cash.apy.toFixed(2)} APY kazanır ve her saniye bileşik olarak bakiyenize
                  eklenir — kilitlenme yok, dilediğiniz zaman çekin.
                </p>
              </div>
            </div>

            {/* Metrikler (count-up) */}
            <div className="grid grid-cols-2 gap-px bg-[var(--ais-line)] sm:grid-cols-4">
              <MiniMetric label="Bakiye" animate={cash.balance} format={(n) => fmtUsd(n)} live />
              <MiniMetric label="Faiz / ay" animate={monthlyInterest} format={(n) => fmtUsd(n)} color={AIS_UP} />
              <MiniMetric label="Bugüne kadar kazanılan" animate={cash.accruedTotal} format={(n) => fmtUsd(n)} color={AIS_UP} />
              <MiniMetric label="APY" animate={cash.apy} format={(n) => `${n.toFixed(2)}%`} color={AIS_UP} />
            </div>

            {/* Öngörülen birikimli faiz — DOLGULU alan grafiği (bileşik kavis) */}
            <div className="p-6">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[12.5px] text-[var(--ais-fg-muted)]">
                    <TrendUp size={14} weight="regular" style={{ color: AIS_UP }} />
                    Öngörülen birikimli faiz
                  </div>
                  <p className="num mt-1.5 text-[24px] font-normal tracking-tight" style={{ color: AIS_UP }}>
                    +{fmtUsd(projected12mo)}
                    <span className="ml-2 text-[13px] text-[var(--ais-fg-faint)]">12 ay sonunda</span>
                  </p>
                </div>
                <span className="text-[12px] text-[var(--ais-fg-faint)]">Önümüzdeki 12 ay · bileşik</span>
              </div>
              <ChartFrame
                title="Öngörülen birikimli faiz"
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
          </SectionCard>

          {/* ── Hesap & işlemler: iki denk kart ── */}
          <SectionCard
            label="Hesap & işlemler"
            desc="Nakdini yönet veya atıl kriptonu stake et."
            className="mt-3"
            bodyClassName="grid items-stretch gap-3 lg:grid-cols-2"
          >
            {/* High-Yield Cash */}
            <Card className="flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <IconChip icon={Bank} size={36} color={AIS_UP} />
                  <div>
                    <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Yüksek Getirili Nakit</p>
                    <p className="text-[12px] text-[var(--ais-fg-faint)]">FDIC güvenceli</p>
                  </div>
                </div>
                <span
                  className="num rounded-lg px-2 py-1 text-[11px] font-medium"
                  style={{ background: `${AIS_UP}1f`, color: AIS_UP }}
                >
                  {cash.apy.toFixed(2)}% APY
                </span>
              </div>

              <p className="num mt-5 text-[28px] font-normal tracking-tight text-[var(--ais-fg)]">
                <AnimatedNumber value={cash.balance} format={(n) => fmtUsd(n)} />
              </p>
              <p className="flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-faint)]">
                Kullanılabilir bakiye · <LiveDot color={AIS_UP} label="canlı birikir" />
              </p>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--ais-line)] px-3 py-2.5 text-[13px]">
                <span className="text-[var(--ais-fg-muted)]">Bu ayki faiz</span>
                <span className="num font-medium" style={{ color: AIS_UP }}>
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
                  className="ais-input num mt-1.5"
                />
                {err && <p className="mt-2 text-[12px]" style={{ color: AIS_DOWN }}>{err}</p>}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Btn variant="primary" onClick={handleDeposit} className="w-full">
                    Nakit yatır <ArrowUpRight size={15} weight="regular" />
                  </Btn>
                  <Btn variant="default" onClick={handleWithdraw} className="w-full">
                    Çek <ArrowDownRight size={15} weight="regular" />
                  </Btn>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-[12px] text-[var(--ais-fg-faint)]">
                  <ShieldCheck size={14} weight="regular" />
                  {fmtUsd(FDIC_LIMIT, 0)} tutarına kadar FDIC güvenceli
                </div>
              </div>
            </Card>

            {/* Kripto Staking */}
            <Card className="flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <IconChip icon={Lightning} size={36} />
                  <div>
                    <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Kripto Staking</p>
                    <p className="text-[12px] text-[var(--ais-fg-faint)]">Atıl kriptodan ödül kazanın</p>
                  </div>
                </div>
                <span
                  className="num rounded-lg px-2 py-1 text-[11px] font-medium"
                  style={{ background: `${AIS_UP}1f`, color: AIS_UP }}
                >
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
                      className={`rounded-xl border px-3 py-2.5 text-center transition ${
                        on
                          ? "border-[var(--ais-accent)]/50"
                          : "border-[var(--ais-line-strong)] hover:bg-[var(--ais-surface-2)]"
                      }`}
                      style={on ? { background: "var(--ais-accent-bg)" } : undefined}
                    >
                      <p className={`text-[13px] font-medium ${on ? "text-[var(--ais-fg)]" : "text-[var(--ais-fg-muted)]"}`}>
                        {sym}
                      </p>
                      <p className="num mt-0.5 text-[11px]" style={{ color: AIS_UP }}>
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
                  className="ais-input num mt-1.5"
                />
                {stakeErr && <p className="mt-2 text-[12px]" style={{ color: AIS_DOWN }}>{stakeErr}</p>}
                <Btn variant="primary" onClick={handleStake} className="mt-3 w-full">
                  {stakeSym} stake et <Lightning size={15} weight="regular" />
                </Btn>
              </div>

              <div className="mt-auto space-y-2 pt-5">
                {cash.stakes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--ais-line-strong)] px-3 py-4 text-center text-[12px] text-[var(--ais-fg-faint)]">
                    Henüz aktif stake yok.
                  </div>
                ) : (
                  cash.stakes.map((s) => (
                    <div
                      key={s.symbol}
                      className="flex items-center justify-between rounded-xl border border-[var(--ais-line)] px-3 py-2.5 text-[13px]"
                    >
                      <div>
                        <p className="num font-medium text-[var(--ais-fg)]">
                          {s.amount} {s.symbol}
                        </p>
                        <p className="num text-[12px]" style={{ color: AIS_UP }}>
                          +{s.rewards.toFixed(6)} {s.symbol} ödül · %{s.apy.toFixed(1)} APY
                        </p>
                      </div>
                      <Btn variant="default" size="sm" onClick={() => handleUnstake(s.symbol)}>
                        Stake&apos;i çöz
                      </Btn>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </SectionCard>

          <p className="mt-4 text-[12px] text-[var(--ais-fg-faint)]">
            Hazine ve tahvil merdivenleri mi arıyorsunuz?{" "}
            <a href="/dashboard/bonds" className="underline-offset-2 hover:underline" style={{ color: AIS_ACCENT }}>
              Tahviller &amp; Hazine&apos;yi aç →
            </a>
          </p>
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
        {live && <LiveDot color={AIS_UP} />}
      </p>
      <p
        className="num mt-2 text-[20px] font-normal tracking-tight"
        style={{ color: color ?? "var(--ais-fg)" }}
      >
        <AnimatedNumber value={animate} format={format} />
      </p>
    </div>
  );
}
