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
import { useCopy, copyStore } from "@/lib/dashboard/use-copy";
import { ArrowDown, ArrowUp, Check, UserPlus } from "lucide-react";
import { TickerBadge } from "@/components/dashboard/ticker-badge";

/** Didit açık-tema SVG/inline grafik renkleri (CSS-var değil — <stop>/canvas). */
const G_UP = "#1f9d57";
const G_DOWN = "#d93025";

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

  const copy = useCopy();
  const [amount, setAmount] = useState("1000");
  const [stopLoss, setStopLoss] = useState("15");
  const [copyState, setCopyState] = useState<"idle" | "copying" | "done" | "error">("idle");
  const [copyMsg, setCopyMsg] = useState("");
  const confirm = useConfirm();

  // Kalıcı durum (localStorage) — render içinde Date.now() yok, sadece türetilmiş değer.
  const following = trader ? copy.following.includes(trader.handle) : false;
  const isCopying = trader ? copy.copying.some((c) => c.handle === trader.handle) : false;

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
          <h2 className="font-display text-lg font-bold text-[var(--ais-fg)]">Yatırımcı bulunamadı</h2>
          <p className="mt-2 text-sm text-[var(--ais-fg-muted)]">
            Bu kullanıcı adına sahip bir yatırımcı bulamadık.
          </p>
          <Link
            href="/dashboard/copy"
            className="mt-5 inline-flex rounded-full border border-[var(--ais-line-strong)] px-4 py-2 text-sm font-semibold text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
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
        // Kalıcı kopyalama durumunu kaydet (Date.now() event handler'da — render değil).
        copyStore.startCopy({
          handle: trader.handle,
          name: trader.name,
          amount: usd,
          stopLoss: Number(stopLoss) || 0,
          startedAt: Date.now(),
        });
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
        <span className="grid h-16 w-16 place-items-center rounded-full border border-[var(--ais-line-strong)] bg-[var(--ais-surface-2)] text-xl font-bold text-[var(--ais-fg)]">
          {trader.name[0]}
        </span>
        <div className="mr-auto">
          <h1 className="font-display text-2xl font-bold text-[var(--ais-fg)]">{trader.name}</h1>
          <p className="text-sm text-[var(--ais-fg-muted)]">
            {trader.handle} · {trader.style}
          </p>
        </div>
        <button
          onClick={() => copyStore.toggleFollow(trader.handle)}
          className="flex items-center gap-2 rounded-full border border-[var(--ais-line-strong)] px-4 py-2.5 text-sm font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
        >
          {following ? <Check size={16} strokeWidth={2.25} /> : <UserPlus size={16} />}
          {following ? "Takip ediliyor" : "Takip et"}
        </button>
        <a
          href="#copy-settings"
          className="rounded-full bg-[var(--ais-accent)] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-105"
        >
          Yatırımcıyı kopyala
        </a>
      </div>

      {/* aktif kopyalama rozeti + durdur */}
      {isCopying && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--ais-line)] bg-[var(--ais-surface)] px-4 py-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--ais-green)" }}>
            <Check size={15} strokeWidth={2.25} /> Bu yatırımcı kopyalanıyor
          </span>
          <button
            onClick={() => copyStore.stopCopy(trader.handle)}
            className="rounded-full border border-[var(--ais-line-strong)] px-4 py-2 text-sm font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
          >
            Kopyalamayı durdur
          </button>
        </div>
      )}

      {/* stat row */}
      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <div>
              <p className="text-xs text-[var(--ais-fg-muted)]">1Y getiri</p>
              <p className="mt-1 font-display text-2xl font-bold tabular-nums" style={{ color: "var(--ais-green)" }}>
                +{trader.return1y}%
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--ais-fg-muted)]">Kazanma oranı</p>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--ais-fg)] tabular-nums">{trader.win}%</p>
            </div>
            <div>
              <p className="text-xs text-[var(--ais-fg-muted)]">Kopyalayan</p>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--ais-fg)] tabular-nums">{fmtNum(trader.copiers)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--ais-fg-muted)]">AUM</p>
              <p className="mt-1 font-display text-2xl font-bold text-[var(--ais-fg)] tabular-nums">{data.aum}</p>
            </div>
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-[var(--ais-line)] pt-5">
            <div>
              <p className="text-xs text-[var(--ais-fg-muted)]">Tarz</p>
              <p className="mt-1 text-sm font-medium text-[var(--ais-fg)]">{trader.style}</p>
            </div>
            <Sparkline seed={trader.handle} up width={120} height={40} />
          </div>
        </Card>

        <Card className="grid place-items-center lg:col-span-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--ais-fg-muted)]">Risk skoru</p>
          <RadialGauge
            value={trader.risk * 10}
            size={132}
            label={`${trader.risk}`}
            sublabel="/ 10"
            tone="white"
          />
          <p className="text-xs text-[var(--ais-fg-faint)]">
            {trader.risk <= 3 ? "Temkinli" : trader.risk <= 6 ? "Dengeli" : "Agresif"}
          </p>
        </Card>
      </div>

      {/* performance */}
      <Card>
        <CardTitle action={<span className="text-sm font-semibold tabular-nums" style={{ color: "var(--ais-green)" }}>+{trader.return1y}%</span>}>
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
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-[var(--ais-surface-2)]"
                >
                  <TickerBadge symbol={h.symbol} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="shrink-0 font-semibold text-[var(--ais-fg)]">{h.symbol}</span>
                        <span className="truncate text-xs text-[var(--ais-fg-muted)]">{h.name}</span>
                      </span>
                      <span className="shrink-0 font-medium text-[var(--ais-fg)] tabular-nums">{h.pct}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--ais-surface-2)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(h.pct / maxPct) * 100}%`,
                          background: "linear-gradient(90deg, var(--ais-accent), var(--ais-accent-bg))",
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
              const col = buy ? G_UP : G_DOWN;
              return (
                <div
                  key={`${t.symbol}-${i}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-[var(--ais-surface-2)]"
                >
                  <span className="relative shrink-0">
                    <TickerBadge symbol={t.symbol} size={34} />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full ring-2 ring-[var(--ais-surface)]"
                      style={{ background: col, color: "#fff" }}
                    >
                      {buy ? <ArrowUp size={9} strokeWidth={2.75} /> : <ArrowDown size={9} strokeWidth={2.75} />}
                    </span>
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--ais-fg)]">
                      <span style={{ color: col }}>{buy ? "Al" : "Sat"}</span> {t.symbol}
                    </p>
                    <p className="text-xs text-[var(--ais-fg-muted)] tabular-nums">{t.shares} adet</p>
                  </div>
                  <span className="text-xs text-[var(--ais-fg-muted)] tabular-nums">{t.when}</span>
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
            <label className="text-xs text-[var(--ais-fg-muted)]">Ayrılacak tutar</label>
            <div className="mt-1.5 flex items-center rounded-xl border border-[var(--ais-line)] bg-[var(--ais-surface-2)] px-3 focus-within:border-[var(--ais-accent)]">
              <span className="text-sm text-[var(--ais-fg-muted)]">$</span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                className="w-full bg-transparent px-2 py-2.5 text-sm font-medium text-[var(--ais-fg)] tabular-nums outline-none placeholder:text-[var(--ais-fg-faint)]"
                placeholder="1000"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--ais-fg-muted)]">Kopya stop-loss</label>
            <div className="mt-1.5 flex items-center rounded-xl border border-[var(--ais-line)] bg-[var(--ais-surface-2)] px-3 focus-within:border-[var(--ais-accent)]">
              <input
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value.replace(/[^0-9]/g, ""))}
                inputMode="numeric"
                className="w-full bg-transparent px-2 py-2.5 text-sm font-medium text-[var(--ais-fg)] tabular-nums outline-none placeholder:text-[var(--ais-fg-faint)]"
                placeholder="15"
              />
              <span className="text-sm text-[var(--ais-fg-muted)]">%</span>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ais-line)] pt-5">
          <p className="text-xs text-[var(--ais-fg-muted)]">
            {trader.name} kullanıcısının yaptığı her işlemi, ayırdığınız tutara göre ölçeklenerek otomatik yansıtır.
          </p>
          {copyState === "done" || isCopying ? (
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
                style={{ background: "var(--ais-green-bg)", color: "var(--ais-green)" }}
              >
                <Check size={15} strokeWidth={2.25} /> Kopyalanıyor
              </span>
              <button
                onClick={() => copyStore.stopCopy(trader.handle)}
                className="rounded-full border border-[var(--ais-line-strong)] px-5 py-2.5 text-sm font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
              >
                Kopyalamayı durdur
              </button>
            </div>
          ) : (
            <button
              onClick={startCopy}
              disabled={copyState === "copying"}
              className="rounded-full bg-[var(--ais-accent)] px-6 py-2.5 text-sm font-bold text-white transition hover:brightness-105 disabled:opacity-50"
            >
              {copyState === "copying" ? "Kopyalanıyor…" : `${fmtUsd(Number(amount) || 0, 0)} ile kopyalamaya başla`}
            </button>
          )}
        </div>
        {copyMsg && (
          <p className="mt-3 text-xs" style={{ color: copyState === "error" ? G_DOWN : "var(--ais-green)" }}>
            {copyMsg}
          </p>
        )}
        <p className="mt-4 text-xs text-[var(--ais-fg-faint)]">
          Geçmiş performans gelecekteki sonuçları garanti etmez. Demo işlem.
        </p>
      </Card>
    </div>
  );
}
