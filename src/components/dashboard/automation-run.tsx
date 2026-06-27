"use client";

// "AI ile çalıştır" — bir otomasyon kuralını AI karar motoruna gönderir, kararı
// (al/sat/bekle + gerekçe + güven) gösterir; al/sat ise kullanıcı onayıyla bağlı
// borsada Brain güvencesi altında GERÇEK emir yürütülür.

import { useState, useEffect } from "react";
import { AIS_ACCENT, AIS_UP, AIS_DOWN, AIS_WARN } from "@/components/dashboard/ais-kit";
import { Sparkle, Spinner, X, TrendUp, TrendDown, Pause, CheckCircle, WarningCircle } from "@phosphor-icons/react";

type Decision = {
  action: "buy" | "sell" | "hold";
  symbol: string;
  sizePct: number;
  confidence: number;
  rationale: string;
};
type Ctx = { price: number; changePct: number; portfolioValueUsd: number; cashUsd: number; hasConnection: boolean };

export function AutomationRunButton({ rule, symbol }: { rule: string; symbol: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!symbol}
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: "var(--ais-accent-bg)", color: AIS_ACCENT }}
        title={symbol ? "AI ile çalıştır" : "Kuralda sembol bulunamadı"}
      >
        <Sparkle size={14} weight="fill" /> AI ile çalıştır
      </button>
      {open && symbol && <RunModal rule={rule} symbol={symbol} onClose={() => setOpen(false)} />}
    </>
  );
}

function RunModal({ rule, symbol, onClose }: { rule: string; symbol: string; onClose: () => void }) {
  const [phase, setPhase] = useState<"deciding" | "decided" | "executing" | "done" | "error">("deciding");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<string>("");

  // İlk açılışta AI kararını al.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/automation/decide", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rule, symbol }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!data.ok) {
          setError(data.error ?? "Karar üretilemedi.");
          setPhase("error");
          return;
        }
        setDecision(data.decision);
        setCtx(data.context);
        setPhase("decided");
      } catch {
        if (!cancelled) {
          setError("Ağ hatası.");
          setPhase("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rule, symbol]);

  async function execute() {
    if (!decision || decision.action === "hold") return;
    setPhase("executing");
    try {
      // sizePct → miktar: portföy değeri * % / fiyat (kaba; gerçek motorda min-notional kontrolü eklenir)
      const pv = ctx?.portfolioValueUsd ?? 0;
      const price = ctx?.price ?? 0;
      const usd = (pv * decision.sizePct) / 100;
      const qty = price > 0 ? +(usd / price).toFixed(6) : 0;
      const res = await fetch("/api/exchange/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          exchange: "binance",
          symbol: `${decision.symbol}USDT`,
          side: decision.action.toUpperCase(),
          quantity: qty,
          rationale: decision.rationale,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(`${decision.action === "buy" ? "Alış" : "Satış"} gerçekleşti: ${data.order.executedQty} ${decision.symbol}`);
        setPhase("done");
      } else if (data.blocked) {
        setError(`Brain engelledi: ${data.reason}`);
        setPhase("error");
      } else if (data.needsPin) {
        setError(`PIN gerekli: ${data.reason}`);
        setPhase("error");
      } else {
        setError(data.error ?? "Yürütülemedi.");
        setPhase("error");
      }
    } catch {
      setError("Ağ hatası.");
      setPhase("error");
    }
  }

  const actionMeta =
    decision?.action === "buy"
      ? { label: "AL", color: AIS_UP, Icon: TrendUp }
      : decision?.action === "sell"
        ? { label: "SAT", color: AIS_DOWN, Icon: TrendDown }
        : { label: "BEKLE", color: AIS_WARN, Icon: Pause };

  return (
    <div className="ais fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="vela-modal-card relative w-full max-w-md rounded-2xl border border-[var(--ais-line-strong)] bg-[var(--ais-surface)] p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-5 top-5 text-[var(--ais-fg-faint)] transition hover:text-[var(--ais-fg)]">
          <X size={18} weight="regular" />
        </button>
        <div className="flex items-center gap-2">
          <Sparkle size={20} weight="fill" style={{ color: AIS_ACCENT }} />
          <h2 className="text-[16px] font-medium text-[var(--ais-fg)]">Finovela kararı</h2>
        </div>
        <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">&ldquo;{rule}&rdquo;</p>

        {phase === "deciding" && (
          <div className="mt-6 flex items-center gap-2 text-[13px] text-[var(--ais-fg-muted)]">
            <Spinner size={16} className="animate-spin" /> Piyasa ve portföy analiz ediliyor…
          </div>
        )}

        {(phase === "decided" || phase === "executing") && decision && (
          <>
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-[var(--ais-line)] p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${actionMeta.color}1a`, color: actionMeta.color }}>
                <actionMeta.Icon size={22} weight="regular" />
              </span>
              <div className="flex-1">
                <p className="text-[15px] font-semibold" style={{ color: actionMeta.color }}>
                  {actionMeta.label} {decision.symbol}
                  {decision.action !== "hold" && <span className="ml-1 text-[13px] text-[var(--ais-fg-muted)]">· %{decision.sizePct}</span>}
                </p>
                <p className="text-[11.5px] text-[var(--ais-fg-faint)]">Güven: %{Math.round(decision.confidence * 100)}</p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[var(--ais-fg-muted)]">{decision.rationale}</p>

            {decision.action !== "hold" && !ctx?.hasConnection && (
              <p className="mt-3 flex items-start gap-1.5 text-[12px]" style={{ color: AIS_WARN }}>
                <WarningCircle size={14} className="mt-px shrink-0" />
                Yürütmek için önce bir borsa bağla (Bağlantılar).
              </p>
            )}

            <div className="mt-5 flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-lg border border-[var(--ais-line-strong)] py-2.5 text-[13px] font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)]">
                Kapat
              </button>
              {decision.action !== "hold" && ctx?.hasConnection && (
                <button
                  onClick={execute}
                  disabled={phase === "executing"}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-medium transition disabled:opacity-50"
                  style={{ background: `${actionMeta.color}1a`, color: actionMeta.color }}
                >
                  {phase === "executing" ? <Spinner size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                  Onayla & Yürüt
                </button>
              )}
            </div>
          </>
        )}

        {phase === "done" && (
          <div className="mt-6 flex flex-col items-center text-center">
            <CheckCircle size={40} weight="regular" style={{ color: AIS_UP }} />
            <p className="mt-3 text-[14px] text-[var(--ais-fg)]">{result}</p>
            <button onClick={onClose} className="mt-5 rounded-lg px-5 py-2.5 text-[13px] font-medium" style={{ background: "var(--ais-accent-bg)", color: AIS_ACCENT }}>
              Bitti
            </button>
          </div>
        )}

        {phase === "error" && (
          <div className="mt-5">
            <p className="flex items-start gap-1.5 text-[13px]" style={{ color: AIS_DOWN }}>
              <WarningCircle size={15} className="mt-px shrink-0" /> {error}
            </p>
            <button onClick={onClose} className="mt-4 w-full rounded-lg border border-[var(--ais-line-strong)] py-2.5 text-[13px] font-medium text-[var(--ais-fg-muted)] transition hover:bg-[var(--ais-surface-2)]">
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
