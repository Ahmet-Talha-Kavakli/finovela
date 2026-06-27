// Gelişmiş emir tipleri için yardımcılar — LIMIT, STOP-LOSS, TAKE-PROFIT,
// TRAILING-STOP ve OCO. Saf fonksiyonlar; paper-store bunları ledger'da kullanır.

export type OrderType = "MARKET" | "LIMIT" | "STOP" | "TAKE_PROFIT" | "TRAILING_STOP";
export type Side = "BUY" | "SELL";

/**
 * Bekleyen (henüz dolmamış) emir.
 * - limitPrice: LIMIT için tetik/dolum fiyatı
 * - stopPrice: STOP (stop-loss) / TAKE_PROFIT tetik fiyatı
 * - trailPct: TRAILING_STOP için yüzde mesafe (0.05 = %5)
 * - trailRef: trailing-stop'un takip ettiği uç fiyat (ratchet); doldukça güncellenir
 * - ocoGroup: aynı grup id'sine sahip emirler birbirini iptal eder (one-cancels-other)
 */
export type PendingOrder = {
  id: string;
  ts: number;
  type: OrderType;
  side: Side;
  symbol: string;
  shares: number;
  limitPrice?: number;
  stopPrice?: number;
  trailPct?: number;
  trailRef?: number;
  ocoGroup?: string;
  status: "pending" | "filled" | "cancelled";
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  MARKET: "Market",
  LIMIT: "Limit",
  STOP: "Stop loss",
  TAKE_PROFIT: "Take profit",
  TRAILING_STOP: "Trailing stop",
};

/** Trailing-stop için referans ucu güncelle (ratchet). Dolum fiyatını döndürmez, sadece ref. */
export function ratchetTrail(o: PendingOrder, price: number): number | undefined {
  if (o.type !== "TRAILING_STOP" || o.trailPct == null) return o.trailRef;
  // SELL trailing-stop (uzun pozisyonu korur): en yüksek fiyatı takip eder.
  // BUY trailing-stop (kısa pozisyonu korur / dip yakalar): en düşük fiyatı takip eder.
  if (o.side === "SELL") {
    return o.trailRef == null ? price : Math.max(o.trailRef, price);
  }
  return o.trailRef == null ? price : Math.min(o.trailRef, price);
}

/**
 * Verilen anlık fiyata göre bekleyen emir tetiklenir mi?
 * Tetiklenirse dolum fiyatını döndürür, aksi halde null.
 * Not: trailing-stop için trailRef'in güncel (ratchet'lenmiş) olduğu varsayılır.
 */
export function shouldFill(o: PendingOrder, price: number): number | null {
  switch (o.type) {
    case "MARKET":
      return price;

    case "LIMIT":
      if (o.limitPrice == null) return null;
      // BUY limit: fiyat limit'e iner ya da altına geçerse dolar.
      // SELL limit: fiyat limit'e çıkar ya da üstüne geçerse dolar.
      if (o.side === "BUY") return price <= o.limitPrice ? Math.min(price, o.limitPrice) : null;
      return price >= o.limitPrice ? Math.max(price, o.limitPrice) : null;

    case "STOP":
      // Stop-loss: SELL stop, fiyat stop'un altına düşünce piyasa emri olur.
      // BUY stop (breakout / short cover), fiyat stop'un üstüne çıkınca tetiklenir.
      if (o.stopPrice == null) return null;
      if (o.side === "SELL") return price <= o.stopPrice ? price : null;
      return price >= o.stopPrice ? price : null;

    case "TAKE_PROFIT":
      // Take-profit: SELL, fiyat hedefe çıkınca; BUY (short kapatma) fiyat hedefe inince.
      if (o.stopPrice == null) return null;
      if (o.side === "SELL") return price >= o.stopPrice ? price : null;
      return price <= o.stopPrice ? price : null;

    case "TRAILING_STOP": {
      if (o.trailPct == null || o.trailRef == null) return null;
      if (o.side === "SELL") {
        // En yüksek fiyattan %trail kadar düşerse sat.
        const trigger = o.trailRef * (1 - o.trailPct);
        return price <= trigger ? price : null;
      }
      // BUY trailing: en düşük fiyattan %trail kadar yükselirse al.
      const trigger = o.trailRef * (1 + o.trailPct);
      return price >= trigger ? price : null;
    }

    default:
      return null;
  }
}

/** İnsan-okunur özet (UI'da bekleyen emri göstermek için). */
export function describePending(o: PendingOrder): string {
  const qty = o.shares < 1 ? o.shares.toFixed(4) : `${o.shares}`;
  const base = `${o.side} ${qty} ${o.symbol}`;
  switch (o.type) {
    case "LIMIT":
      return `${base} · Limit @ $${(o.limitPrice ?? 0).toFixed(2)}`;
    case "STOP":
      return `${base} · Stop @ $${(o.stopPrice ?? 0).toFixed(2)}`;
    case "TAKE_PROFIT":
      return `${base} · Take-profit @ $${(o.stopPrice ?? 0).toFixed(2)}`;
    case "TRAILING_STOP":
      return `${base} · Trailing ${((o.trailPct ?? 0) * 100).toFixed(1)}%`;
    default:
      return base;
  }
}
