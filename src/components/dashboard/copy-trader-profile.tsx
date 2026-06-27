"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardTitle } from "@/components/dashboard/ui";
import { AreaChart, RadialGauge, Sparkline } from "@/components/dashboard/area-chart";
import { ChartFrame } from "@/components/dashboard/chart-frame";
import { LEADERBOARD, fmtNum, fmtUsd } from "@/lib/dashboard/data";
import { UNIVERSE, getUniverseEntry } from "@/lib/market/universe";
import { paperStore } from "@/lib/dashboard/paper-store";
import { notifStore } from "@/lib/dashboard/use-notifications";
import { useConfirm } from "@/components/dashboard/confirm";
import { ArrowDown, ArrowUp, Check, UserPlus } from "@phosphor-icons/react";
import { TickerBadge } from "@/components/dashboard/ticker-badge";

/** Deterministik hash — handle → sayı */
function hash(seed: string): number {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 1_000_000;
  return h;
}

/** AUM bandı — copier sayısı ve riskten türeyen mock yönetilen sermaye */
function aumBand(copiers: number, risk: number): string {
  const aum = copiers * (180 + risk * 40);
  if (aum >= 1_000_000) return `$${(aum / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(aum / 1000)}K`;
}

/** Trader'a göre deterministik holding seçimi + allocation */
function pickHoldings(handle: string) {
  const seed = hash(handle);
  const count = 5 + (seed % 2); // 5 veya 6
  const start = seed % UNIVERSE.length;
  const picks = [];
  for (let i = 0; i < count; i++) {
    picks.push(UNIVERSE[(start + i * 3) % UNIVERSE.length]);
  }
  // azalan ağırlıklar, toplam 100
  const raw = picks.map((_, i) => count - i + (hash(handle + i) % 3));
  const sum = raw.reduce((a, b) => a + b, 0);
  return picks.map((u, i) => ({
    symbol: u.symbol,
    name: u.name,
    pct: +((raw[i] / sum) * 100).toFixed(1),
  }));
}

/** Deterministik son işlemler */
function recentTrades(handle: string, holdings: { symbol: string }[]) {
  const seed = hash(handle);
  const days = ["2sa önce", "1g önce", "2g önce", "4g önce", "1h önce"];
  return holdings.slice(0, 5).map((h, i) => {
    const r = hash(handle + h.symbol + i);
    return {
      symbol: h.symbol,
      side: (r % 3 === 0 ? "SELL" : "BUY") as "BUY" | "SELL",
      shares: 10 + ((seed + r) % 90),
      when: days[i % days.length],
    };
  });
}

/** Trader equity eğrisi — return1y'e ölçeklenen deterministik yükseliş */
function traderCurve(handle: string, return1y: number, points = 60) {
  const seed = hash(handle);
  const end = 100 + return1y;
  const start = 100;
  const out: { t: number; v: number }[] = [];
  for (let i = 0; i < points; i++) {
    const prog = i / (points - 1);
    const wave =
      Math.sin(i * 0.6 + seed) * (return1y * 0.06) +
      Math.sin(i * 0.21 + seed) * (return1y * 0.09);
    out.push({ t: i, v: +(start + (end - start) * prog + wave).toFixed(2) });
  }
  out[out.length - 1].v = end;
  return out;
}

export function CopyTraderProfile({ handle }: { handle: string }) {
  const trader = useMemo(
    () => LEADERBOARD.find((t) => t.handle.replace("@", "") === handle),
    [handle],
  );

  const [following, setFollowing] = useState(false);
  const [amount, setAmount] = useState("1000");
  const [stopLoss, setStopLoss] = useState("15");
  const [copyState, setCopyState] = useState<"idle" | "copying" | "done" | "error">("idle");
  const [copyMsg, setCopyMsg] = useState("");
  const confirm = useConfirm();

  const data = useMemo(() => {
    if (!trader) return null;
    const holdings = pickHoldings(trader.handle);
    return {
      holdings,
      trades: recentTrades(trader.handle, holdings),
      curve: traderCurve(trader.handle, trader.return1y),
      aum: aumBand(trader.copiers, trader.risk),
    };
  }, [trader]);

  if (!trader || !data) {
    return (
      <div className="p-6">
        <Card>
          <h2 className="font-display text-lg font-bold text-white">Yatırımcı bulunamadı</h2>
          <p className="mt-2 text-sm text-white/45">
            Bu kullanıcı adına sahip bir yatırımcı bulamadık.
          </p>
          <Link
            href="/dashboard/copy"
            className="mt-5 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
          >
            Lider tablosuna dön
          </Link>
        </Card>
      </div>
    );
  }

  async function startCopy() {
    if (!trader || !data) return;
    const usd = Number(amount) || 0;
    if (usd <= 0) { setCopyState("error"); setCopyMsg("Geçerli bir tutar gir"); return; }
    const ok = await confirm({
      title: "Kopyalamayı onayla",
      message: `${trader.name} (${trader.handle}) yatırımcısını ${fmtUsd(usd, 0)} ile kopyalamaya başlayacaksın. Onun varlıkları portföyüne yansıtılacak.`,
      confirmLabel: "Kopyalamaya başla",
      cancelLabel: "Vazgeç",
      tone: "buy",
    });
    if (!ok) return;
    setCopyState("copying");
    try {
      const symbols = data.holdings.map((h) => h.symbol).join(",");
      const res = await fetch(`/api/market/quote?symbols=${symbols}`);
      const json = (await res.json()) as { quotes?: { symbol: string; price: number }[] };
      const priceBy = new Map((json.quotes ?? []).map((q) => [q.symbol, q.price]));
      let placed = 0;
      for (const h of data.holdings) {
        const price = priceBy.get(h.symbol) ?? getUniverseEntry(h.symbol).basePrice;
        const legUsd = (usd * h.pct) / 100;
        const shares = +(legUsd / price).toFixed(4);
        if (shares <= 0) continue;
        const r = paperStore.placeOrder({ side: "BUY", symbol: h.symbol, shares, price });
        if (r.ok) placed++;
      }
      if (placed > 0) {
        notifStore.push("order", `${trader.name} kopyalanmaya başlandı — ${fmtUsd(usd, 0)} ile ${placed} pozisyon yansıtıldı`);
        setCopyState("done");
        setCopyMsg(`${trader.name} kopyalanıyor — ${placed} pozisyon portföyüne eklendi.`);
      } else {
        setCopyState("error");
        setCopyMsg("Yetersiz nakit — daha düşük bir tutar dene.");
      }
    } catch {
      setCopyState("error");
      setCopyMsg("Bir şeyler ters gitti, tekrar dene.");
    }
  }

  return (
    <div className="space-y-5 p-6">
      {/* header */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-xl font-bold text-white">
          {trader.name[0]}
        </span>
        <div className="mr-auto">
          <h1 className="font-display text-2xl font-bold text-white">{trader.name}</h1>
          <p className="text-sm text-white/45">
            {trader.handle} · {trader.style}
          </p>
        </div>
        <button
          onClick={() => setFollowing((f) => !f)}
          className="flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.06]"
        >
          {following ? <Check size={16} weight="bold" /> : <UserPlus size={16} />}
          {following ? "Takip ediliyor" : "Takip et"}
        </button>
        <a
          href="#copy-settings"
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:brightness-105"
        >
          Yatırımcıyı kopyala
        </a>
      </div>

      {/* stat row */}
      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <div>
              <p className="text-xs text-white/45">1Y getiri</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums" style={{ color: "#3ecf8e" }}>
                +{trader.return1y}%
              </p>
            </div>
            <div>
              <p className="text-xs text-white/45">Kazanma oranı</p>
              <p className="mt-1 font-display text-2xl font-bold text-white tabular-nums">{trader.win}%</p>
            </div>
            <div>
              <p className="text-xs text-white/45">Kopyalayan</p>
              <p className="mt-1 font-display text-2xl font-bold text-white tabular-nums">{fmtNum(trader.copiers)}</p>
            </div>
            <div>
              <p className="text-xs text-white/45">AUM</p>
              <p className="mt-1 font-display text-2xl font-bold text-white tabular-nums">{data.aum}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-5">
            <div>
              <p className="text-xs text-white/45">Tarz</p>
              <p className="mt-1 text-sm font-medium text-white">{trader.style}</p>
            </div>
            <Sparkline seed={trader.handle} up width={120} height={40} />
          </div>
        </Card>

        <Card className="grid place-items-center lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.08em] text-white/45">Risk skoru</p>
          <RadialGauge
            value={trader.risk * 10}
            size={132}
            label={`${trader.risk}`}
            sublabel="/ 10"
            tone="white"
          />
          <p className="text-xs text-white/40">
            {trader.risk <= 3 ? "Temkinli" : trader.risk <= 6 ? "Dengeli" : "Agresif"}
          </p>
        </Card>
      </div>

      {/* performance */}
      <Card>
        <CardTitle action={<span className="text-sm font-semibold tabular-nums" style={{ color: "#3ecf8e" }}>+{trader.return1y}%</span>}>
          Performans · 1Y
        </CardTitle>
        <ChartFrame
          title="Performans · 1Y"
          render={(big) => (
            <div style={{ height: big ? 440 : 240 }}>
              <AreaChart data={data.curve} height={big ? 440 : 240} positive />
            </div>
          )}
        />
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* holdings */}
        <Card>
          <CardTitle>En büyük varlıklar</CardTitle>
          <div className="space-y-1.5">
            {(() => {
              const maxPct = Math.max(...data.holdings.map((h) => h.pct), 1);
              return data.holdings.map((h) => (
                <Link
                  key={h.symbol}
                  href={`/dashboard/stock/${h.symbol}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.05]"
                >
                  <TickerBadge symbol={h.symbol} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="shrink-0 font-semibold text-white">{h.symbol}</span>
                        <span className="truncate text-xs text-white/40">{h.name}</span>
                      </span>
                      <span className="shrink-0 font-medium text-white tabular-nums">{h.pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(h.pct / maxPct) * 100}%`,
                          background: "linear-gradient(90deg, #8ab4f8, rgba(138,180,248,0.4))",
                        }}
                      />
                    </div>
                  </div>
                </Link>
              ));
            })()}
          </div>
        </Card>

        {/* recent trades */}
        <Card>
          <CardTitle>Son işlemler</CardTitle>
          <div className="space-y-1">
            {data.trades.map((t, i) => {
              const buy = t.side === "BUY";
              const col = buy ? "#3ecf8e" : "#ff5c5c";
              return (
                <div
                  key={`${t.symbol}-${i}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-white/[0.05]"
                >
                  <span className="relative shrink-0">
                    <TickerBadge symbol={t.symbol} size={34} />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full ring-2 ring-[#0c0c0e]"
                      style={{ background: col, color: "#06120c" }}
                    >
                      {buy ? <ArrowUp size={9} weight="bold" /> : <ArrowDown size={9} weight="bold" />}
                    </span>
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">
                      <span style={{ color: col }}>{buy ? "Al" : "Sat"}</span> {t.symbol}
                    </p>
                    <p className="text-xs text-white/40 tabular-nums">{t.shares} adet</p>
                  </div>
                  <span className="text-xs text-white/40 tabular-nums">{t.when}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* copy settings */}
      <Card>
        <span id="copy-settings" className="block -translate-y-24" aria-hidden />
        <CardTitle>Kopyalama ayarları</CardTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="text-xs text-white/45">Ayrılacak tutar</label>
            <div className="mt-1.5 flex items-center rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 focus-within:border-white/25">
              <span className="text-sm text-white/40">$</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                className="w-full bg-transparent px-2 py-2.5 text-sm font-medium text-white tabular-nums outline-none placeholder:text-white/30"
                placeholder="1000"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/45">Kopya stop-loss</label>
            <div className="mt-1.5 flex items-center rounded-xl border border-white/[0.1] bg-white/[0.03] px-3 focus-within:border-white/25">
              <input
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                className="w-full bg-transparent px-2 py-2.5 text-sm font-medium text-white tabular-nums outline-none placeholder:text-white/30"
                placeholder="15"
              />
              <span className="text-sm text-white/40">%</span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] pt-5">
          <p className="text-xs text-white/40">
            {trader.name} kullanıcısının yaptığı her işlemi, ayırdığınız tutara göre ölçeklenerek otomatik yansıtır.
          </p>
          {copyState === "done" ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#3ecf8e]/15 px-5 py-2.5 text-sm font-semibold text-[#3ecf8e]">
              <Check size={15} weight="bold" /> Kopyalanıyor
            </span>
          ) : (
            <button
              onClick={startCopy}
              disabled={copyState === "copying"}
              className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:brightness-105 disabled:opacity-50"
            >
              {copyState === "copying" ? "Kopyalanıyor…" : `${fmtUsd(Number(amount) || 0, 0)} ile kopyalamaya başla`}
            </button>
          )}
        </div>
        {copyMsg && (
          <p className="mt-3 text-xs" style={{ color: copyState === "error" ? "#ff5c5c" : "#3ecf8e" }}>
            {copyMsg}
          </p>
        )}
        <p className="mt-4 text-xs text-white/30">
          Geçmiş performans gelecekteki sonuçları garanti etmez. Demo işlem.
        </p>
      </Card>
    </div>
  );
}
