"use client";

import { useState } from "react";
import { Card, AIS_UP, AIS_DOWN, AIS_WARN } from "@/components/dashboard/ais-kit";
import { paperStore } from "@/lib/dashboard/paper-store";
import { usePaper } from "@/lib/dashboard/use-portfolio";
import { fmtUsd, fmtMoney } from "@/lib/dashboard/data";
import { getUniverseEntry } from "@/lib/market/universe";
import { type OrderType, type PendingOrder, describePending } from "@/lib/dashboard/orders";
import { useConfirm } from "@/components/dashboard/confirm";
import { toast } from "@/components/dashboard/toast";
import { CheckCircle, X } from "@phosphor-icons/react";

// "OCO" gerçek bir OrderType değil; UI'da iki bacaklı (TAKE_PROFIT + STOP) emir
// kurmak için kullanılan sözde-tip. Onayda iki ayrı addPendingOrder çağrılır.
type UiOrderType = OrderType | "OCO";

const ORDER_TYPES: { key: UiOrderType; label: string }[] = [
  { key: "MARKET", label: "Piyasa" },
  { key: "LIMIT", label: "Limit" },
  { key: "STOP", label: "Stop" },
  { key: "TAKE_PROFIT", label: "Kâr al" },
  { key: "TRAILING_STOP", label: "İz süren" },
  { key: "OCO", label: "OCO" },
];

/** Gerçek al/sat ticket'ı — market + gelişmiş emir tipleri; paper-store'da işler. */
export function TradePanel({ symbol, price }: { symbol: string; price: number }) {
  const paper = usePaper();
  const confirm = useConfirm();
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [mode, setMode] = useState<"shares" | "dollars">("dollars");
  const [orderType, setOrderType] = useState<UiOrderType>("MARKET");
  const [amount, setAmount] = useState("500");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [trailPct, setTrailPct] = useState("5");
  // OCO: kâr-al (TAKE_PROFIT, limit benzeri) + zarar-durdur (STOP) fiyatları.
  const [ocoTakeProfit, setOcoTakeProfit] = useState("");
  const [ocoStopLoss, setOcoStopLoss] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Enstrümanın kendi para birimi (TRY/USD/…) — yalnızca gösterilen "Piyasa fiyatı" satırı için.
  // Maliyet/alım gücü paper hesabı USD bazlı olduğundan USD kalır.
  const ccy = getUniverseEntry(symbol).currency ?? "USD";

  const held = paper.holdings.find((h) => h.symbol === symbol)?.shares ?? 0;
  const num = parseFloat(amount) || 0;
  const shares = mode === "shares" ? num : price > 0 ? +(num / price).toFixed(4) : 0;
  const total = +(shares * price).toFixed(2);

  // Bu sembol için bekleyen emirler.
  const pending: PendingOrder[] = paper.pendingOrders.filter((p) => p.symbol === symbol);

  async function submit() {
    setError("");
    if (shares <= 0 || price <= 0) {
      setError("Geçerli bir tutar girin");
      return;
    }

    // Al/Sat onayı — yön, adet, sembol ve fiyat ile.
    const isBuy = side === "BUY";
    const orderLabel = ORDER_TYPES.find((t) => t.key === orderType)!.label;
    const detail =
      orderType === "MARKET"
        ? `~${fmtUsd(total)} karşılığında`
        : `(${orderLabel} emri)`;
    const ok = await confirm({
      title: isBuy ? "Alımı onayla" : "Satışı onayla",
      message: `${shares} ${symbol} hissesini ${detail} ${isBuy ? "almak" : "satmak"} üzeresin.`,
      confirmLabel: isBuy ? "Al" : "Sat",
      cancelLabel: "Vazgeç",
      tone: isBuy ? "buy" : "danger",
    });
    if (!ok) return;

    if (orderType === "MARKET") {
      const r = paperStore.placeOrder({ side, symbol, shares, price });
      if (r.ok) {
        setDone(true);
        toast.success(`${isBuy ? "Alış" : "Satış"} gerçekleşti`, `${shares} ${symbol} · sanal`);
        setTimeout(() => setDone(false), 2500);
      } else {
        setError(r.error ?? "Emir başarısız");
        toast.error("Emir başarısız", r.error ?? undefined);
      }
      return;
    }

    // OCO → iki bacak (kâr-al + zarar-durdur) aynı ocaGroup ile; biri dolunca diğeri iptal.
    if (orderType === "OCO") {
      const tpPrice = parseFloat(ocoTakeProfit) || 0;
      const slPrice = parseFloat(ocoStopLoss) || 0;
      if (tpPrice <= 0 || slPrice <= 0) {
        setError("Kâr-al ve zarar-durdur fiyatlarını girin");
        return;
      }
      const ocoGroup =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `oco_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const tpRes = paperStore.addPendingOrder({
        type: "TAKE_PROFIT",
        side,
        symbol,
        shares,
        stopPrice: tpPrice,
        ocoGroup,
      });
      const slRes = paperStore.addPendingOrder({
        type: "STOP",
        side,
        symbol,
        shares,
        stopPrice: slPrice,
        ocoGroup,
      });
      if (tpRes.ok && slRes.ok) {
        setDone(true);
        toast.success("OCO emri oluşturuldu", `${shares} ${symbol} · kâr-al + zarar-durdur`);
        setTimeout(() => setDone(false), 2500);
      } else {
        // Bir bacak başarısızsa, oluşan bacağı geri al ki yarım OCO kalmasın.
        if (tpRes.ok && tpRes.id) paperStore.cancelPending(tpRes.id);
        if (slRes.ok && slRes.id) paperStore.cancelPending(slRes.id);
        const err = tpRes.error ?? slRes.error ?? "OCO emri başarısız";
        setError(err);
        toast.error("Emir başarısız", err);
      }
      return;
    }

    // Gelişmiş emir tipleri → bekleyen emir ledger'ına ekle.
    const lp = parseFloat(limitPrice) || 0;
    const sp = parseFloat(stopPrice) || 0;
    const tp = (parseFloat(trailPct) || 0) / 100;
    const r = paperStore.addPendingOrder({
      type: orderType as OrderType,
      side,
      symbol,
      shares,
      limitPrice: orderType === "LIMIT" ? lp : undefined,
      stopPrice: orderType === "STOP" || orderType === "TAKE_PROFIT" ? sp : undefined,
      trailPct: orderType === "TRAILING_STOP" ? tp : undefined,
    });
    if (r.ok) {
      setDone(true);
      toast.success("Bekleyen emir oluşturuldu", `${orderType} · ${shares} ${symbol}`);
      setTimeout(() => setDone(false), 2500);
    } else {
      setError(r.error ?? "Emir başarısız");
      toast.error("Emir başarısız", r.error ?? undefined);
    }
  }

  const isMarket = orderType === "MARKET";
  const needsLimit = orderType === "LIMIT";
  const needsStop = orderType === "STOP" || orderType === "TAKE_PROFIT";
  const needsTrail = orderType === "TRAILING_STOP";
  const needsOco = orderType === "OCO";

  return (
    <Card>
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-full border border-[var(--ais-line)] bg-[var(--ais-surface)] p-1 text-[13px]">
        {(["BUY", "SELL"] as const).map((s) => {
          const on = side === s;
          const color = s === "BUY" ? AIS_UP : AIS_DOWN;
          return (
            <button
              key={s}
              onClick={() => setSide(s)}
              className="rounded-full py-2 font-medium transition-colors"
              style={
                on
                  ? { background: `${color}1f`, color }
                  : { color: "var(--ais-fg-muted)" }
              }
            >
              {s === "BUY" ? "Al" : "Sat"}
            </button>
          );
        })}
      </div>

      {/* emir tipi seçici */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {ORDER_TYPES.map((t) => (
          <button
            key={t.key}
            onClick={() => setOrderType(t.key)}
            className={
              orderType === t.key
                ? "rounded-full bg-[var(--ais-surface-2)] px-3 py-1.5 text-[12px] font-medium text-[var(--ais-fg)]"
                : "rounded-full px-3 py-1.5 text-[12px] text-[var(--ais-fg-muted)] hover:text-[var(--ais-fg)]"
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-3 flex gap-1 rounded-full border border-[var(--ais-line)] bg-[var(--ais-surface)] p-1 text-[12px]">
        {(["dollars", "shares"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={
              mode === m
                ? "flex-1 rounded-full bg-[var(--ais-surface-2)] py-1.5 font-medium text-[var(--ais-fg)]"
                : "flex-1 rounded-full py-1.5 text-[var(--ais-fg-muted)] hover:text-[var(--ais-fg)]"
            }
          >
            {m === "dollars" ? "Tutar ($)" : "Adet"}
          </button>
        ))}
      </div>

      <div className="flex items-center rounded-lg border border-[var(--ais-line-strong)] bg-[var(--ais-surface)] px-4 py-3">
        {mode === "dollars" && <span className="mr-1 text-[18px] text-[var(--ais-fg-faint)]">$</span>}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal"
          className="num w-full bg-transparent text-[22px] font-normal text-[var(--ais-fg)] focus:outline-none"
        />
      </div>

      {/* gelişmiş girdiler */}
      {needsLimit && (
        <PriceInput label="Limit fiyatı" value={limitPrice} onChange={setLimitPrice} placeholder={price.toFixed(2)} />
      )}
      {needsStop && (
        <PriceInput
          label={orderType === "STOP" ? "Stop fiyatı" : "Kâr al fiyatı"}
          value={stopPrice}
          onChange={setStopPrice}
          placeholder={price.toFixed(2)}
        />
      )}
      {needsTrail && (
        <PriceInput label="İz süren %" value={trailPct} onChange={setTrailPct} placeholder="5" suffix="%" />
      )}
      {needsOco && (
        <>
          <PriceInput
            label="Kâr-al fiyatı"
            value={ocoTakeProfit}
            onChange={setOcoTakeProfit}
            placeholder={(price * 1.1).toFixed(2)}
          />
          <PriceInput
            label="Zarar-durdur fiyatı"
            value={ocoStopLoss}
            onChange={setOcoStopLoss}
            placeholder={(price * 0.9).toFixed(2)}
          />
          <p className="mt-1.5 text-[11px] text-[var(--ais-fg-faint)]">
            Biri tetiklenince diğeri otomatik iptal olur.
          </p>
        </>
      )}

      <div className="mt-4 space-y-2 text-[13px]">
        <Row label="Piyasa fiyatı" value={fmtMoney(price, ccy)} />
        <Row label={mode === "dollars" ? "Tahmini adet" : "Tahmini maliyet"} value={mode === "dollars" ? `${shares}` : fmtUsd(total)} />
        <Row label="Alım gücü" value={fmtUsd(paper.cash)} />
        {side === "SELL" && <Row label="Elindeki adet" value={`${held}`} />}
      </div>

      {error && <p className="mt-3 text-[13px] font-medium" style={{ color: AIS_DOWN }}>{error}</p>}

      {done ? (
        <div
          className="mt-4 flex items-center justify-center gap-2 rounded-lg py-3 text-[13px] font-medium"
          style={{ background: `${AIS_UP}1f`, color: AIS_UP }}
        >
          <CheckCircle size={16} weight="regular" />{" "}
          {symbol} {isMarket ? (side === "BUY" ? "alındı" : "satıldı") : "için emir verildi"}
        </div>
      ) : (
        <button
          onClick={submit}
          className="mt-4 w-full rounded-lg py-3 text-[13px] font-medium transition"
          style={
            side === "BUY"
              ? { background: `${AIS_UP}1f`, color: AIS_UP }
              : { background: `${AIS_DOWN}1f`, color: AIS_DOWN }
          }
        >
          {isMarket
            ? `${symbol} ${side === "BUY" ? "Al" : "Sat"}`
            : `${ORDER_TYPES.find((t) => t.key === orderType)!.label} emri ver`}
        </button>
      )}

      {/* bu sembol için bekleyen emirler */}
      {pending.length > 0 && (
        <div className="mt-4 border-t border-[var(--ais-line)] pt-3">
          <p className="mb-2 text-[12px] text-[var(--ais-fg-faint)]">Bekleyen emirler</p>
          <div className="space-y-1.5">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-[var(--ais-line)] px-3 py-2 text-[12px]"
              >
                <span className="text-[var(--ais-fg-muted)]">{describePending(p)}</span>
                <button
                  onClick={() => paperStore.cancelPending(p.id)}
                  className="grid h-5 w-5 place-items-center rounded-full text-[var(--ais-fg-faint)] hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
                  aria-label="Emri iptal et"
                >
                  <X size={12} weight="regular" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function PriceInput({
  label,
  value,
  onChange,
  placeholder,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div className="mt-2.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[12px] text-[var(--ais-fg-faint)]">{label}</span>
      </div>
      <div className="flex items-center rounded-lg border border-[var(--ais-line-strong)] bg-[var(--ais-surface)] px-3 py-2">
        {!suffix && <span className="mr-1 text-[13px] text-[var(--ais-fg-faint)]">$</span>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          inputMode="decimal"
          placeholder={placeholder}
          className="num w-full bg-transparent text-[13px] font-medium text-[var(--ais-fg)] placeholder:text-[var(--ais-fg-faint)] focus:outline-none"
        />
        {suffix && <span className="ml-1 text-[13px] text-[var(--ais-fg-faint)]">{suffix}</span>}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--ais-fg-muted)]">{label}</span>
      <span className="num font-medium text-[var(--ais-fg)]">{value}</span>
    </div>
  );
}
