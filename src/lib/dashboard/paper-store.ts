"use client";

/**
 * Vela paper-trading store — gerçek çalışan al/sat.
 * localStorage'da kalıcı; React'te useSyncExternalStore ile dinlenir.
 * Order verince pozisyon + nakit GERÇEKTEN güncellenir, portföy değişir.
 * (Demo: gerçek para yok; ama tam işlevsel paper-trade akışı.)
 */

import { HOLDINGS, CASH, type Holding } from "./data";
import { notifStore } from "./use-notifications";

// Benzersiz emir id'si — orders.length tabanlı eski yöntem (iki kod yolu aynı
// uzunlukta çakışıp duplicate React key üretiyordu) yerine monotonik sayaç + ts.
let orderSeq = 0;
function nextOrderId(symbol: string): string {
  orderSeq += 1;
  return `o_${Date.now().toString(36)}_${orderSeq}_${symbol}`;
}
import {
  type PendingOrder,
  type OrderType,
  type Side,
  shouldFill,
  ratchetTrail,
  describePending,
} from "./orders";

export type Order = {
  id: string;
  ts: number;
  side: "BUY" | "SELL";
  symbol: string;
  shares: number;
  price: number;
};

export type PaperState = {
  holdings: Holding[];
  cash: number;
  orders: Order[];
  pendingOrders: PendingOrder[];
};

const KEY = "vela.paper.v1";

function seed(): PaperState {
  return { holdings: HOLDINGS.map((h) => ({ ...h })), cash: CASH, orders: [], pendingOrders: [] };
}

// SSR snapshot — useSyncExternalStore'un getServerSnapshot'ı için DONMUŞ sabit
// referans (her çağrıda aynı obje dönmeli, yoksa "should be cached" / sonsuz döngü).
const SSR_STATE: PaperState = seed();

let state: PaperState | null = null;
const listeners = new Set<() => void>();

function load(): PaperState {
  if (state) return state;
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PaperState>;
      // Eski kayıtlarda pendingOrders olmayabilir — migrasyon.
      state = {
        holdings: parsed.holdings ?? seed().holdings,
        cash: parsed.cash ?? CASH,
        orders: parsed.orders ?? [],
        pendingOrders: parsed.pendingOrders ?? [],
      };
    } else {
      state = seed();
    }
  } catch {
    state = seed();
  }
  return state;
}

function persist() {
  if (typeof window !== "undefined" && state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }
  listeners.forEach((l) => l());
}

export const paperStore = {
  get(): PaperState {
    return load();
  },
  /** SSR snapshot — donmuş sabit referans (hydration / getServerSnapshot için). */
  getServerState(): PaperState {
    return SSR_STATE;
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  /** Order'ı uygula — pozisyon + nakit güncelle. Hata mesajı döndürür (varsa). */
  placeOrder(o: Omit<Order, "id" | "ts">): { ok: boolean; error?: string } {
    const s = load();
    const cost = o.shares * o.price;
    if (o.side === "BUY") {
      // küçük yuvarlama payı (0.01) — fiyat dalgalanması/ondalık nedeniyle kıl payı
      // aşımlarda işlemi bloklamamak için.
      if (cost > s.cash + 0.01)
        return {
          ok: false,
          error: `Yetersiz nakit — gereken $${cost.toFixed(2)}, mevcut $${s.cash.toFixed(2)}`,
        };
      s.cash = +(s.cash - cost).toFixed(2);
      const h = s.holdings.find((x) => x.symbol === o.symbol);
      if (h) {
        const total = h.shares + o.shares;
        h.avgCost = +((h.avgCost * h.shares + cost) / total).toFixed(4);
        h.shares = +total.toFixed(6);
      } else {
        s.holdings.push({ symbol: o.symbol, shares: o.shares, avgCost: o.price });
      }
    } else {
      const h = s.holdings.find((x) => x.symbol === o.symbol);
      if (!h || h.shares < o.shares) return { ok: false, error: "Yetersiz hisse adedi" };
      h.shares = +(h.shares - o.shares).toFixed(6);
      s.cash = +(s.cash + cost).toFixed(2);
      if (h.shares <= 0.0000001) s.holdings = s.holdings.filter((x) => x.symbol !== o.symbol);
    }
    s.orders.unshift({
      ...o,
      id: nextOrderId(o.symbol),
      ts: Date.now(),
    });
    notifStore.push(
      "order",
      `Emir gerçekleşti: ${o.side === "BUY" ? "Alış" : "Satış"} ${o.shares < 1 ? o.shares.toFixed(4) : o.shares} ${o.symbol} @ $${o.price.toFixed(2)}`,
    );
    persist();
    return { ok: true };
  },

  /** Bekleyen (gelişmiş) emir ekle — limit/stop/take-profit/trailing/OCO. */
  addPendingOrder(o: {
    type: OrderType;
    side: Side;
    symbol: string;
    shares: number;
    limitPrice?: number;
    stopPrice?: number;
    trailPct?: number;
    ocoGroup?: string;
  }): { ok: boolean; error?: string; id?: string } {
    const s = load();
    if (o.shares <= 0) return { ok: false, error: "Enter a valid quantity" };
    if (o.type === "LIMIT" && o.limitPrice == null) return { ok: false, error: "Limit price required" };
    if ((o.type === "STOP" || o.type === "TAKE_PROFIT") && o.stopPrice == null)
      return { ok: false, error: "Stop price required" };
    if (o.type === "TRAILING_STOP" && (o.trailPct == null || o.trailPct <= 0))
      return { ok: false, error: "Trail % required" };

    const id = `p${Date.now()}_${s.pendingOrders.length}`;
    const po: PendingOrder = {
      id,
      ts: Date.now(),
      type: o.type,
      side: o.side,
      symbol: o.symbol,
      shares: o.shares,
      limitPrice: o.limitPrice,
      stopPrice: o.stopPrice,
      trailPct: o.trailPct,
      // trailing-stop referansı evaluate sırasında ilk fiyatla başlatılır.
      trailRef: undefined,
      ocoGroup: o.ocoGroup,
      status: "pending",
    };
    s.pendingOrders.unshift(po);
    notifStore.push("order", `Bekleyen emir: ${describePending(po)}`);
    persist();
    return { ok: true, id };
  },

  /** Bekleyen emri iptal et. */
  cancelPending(id: string): { ok: boolean } {
    const s = load();
    const before = s.pendingOrders.length;
    s.pendingOrders = s.pendingOrders.filter((p) => p.id !== id);
    if (s.pendingOrders.length !== before) persist();
    return { ok: s.pendingOrders.length !== before };
  },

  /**
   * Anlık fiyatlara göre bekleyen emirleri değerlendir:
   * - dolum koşulu sağlanırsa placeOrder ile gerçek emre çevir
   * - trailing-stop için referans ucu güncelle (ratchet)
   * - OCO: bir bacak dolunca aynı gruptaki diğerleri iptal olur
   * Döndürür: dolan emir id'leri.
   */
  evaluatePending(priceBySymbol: Record<string, number>): string[] {
    const s = load();
    if (s.pendingOrders.length === 0) return [];
    const filled: string[] = [];
    const cancelledByOco = new Set<string>();
    let changed = false;

    for (const po of s.pendingOrders) {
      if (po.status !== "pending") continue;
      if (cancelledByOco.has(po.id)) continue;
      const price = priceBySymbol[po.symbol];
      if (price == null) continue;

      // trailing-stop ucu güncelle.
      if (po.type === "TRAILING_STOP") {
        const next = ratchetTrail(po, price);
        if (next !== po.trailRef) {
          po.trailRef = next;
          changed = true;
        }
      }

      const fillPrice = shouldFill(po, price);
      if (fillPrice == null) continue;

      const r = placeOrderInternal(s, { side: po.side, symbol: po.symbol, shares: po.shares, price: +fillPrice.toFixed(2) });
      if (r.ok) {
        po.status = "filled";
        filled.push(po.id);
        changed = true;
        // OCO kardeşlerini iptal et.
        if (po.ocoGroup) {
          for (const sib of s.pendingOrders) {
            if (sib.id !== po.id && sib.status === "pending" && sib.ocoGroup === po.ocoGroup) {
              sib.status = "cancelled";
              cancelledByOco.add(sib.id);
              changed = true;
            }
          }
        }
      }
      // r.ok false ise (örn. yetersiz hisse/nakit) emir beklemede kalır.
    }

    if (changed) {
      // Dolan/iptal olanları ledger'dan ayıkla (sadece pending kalsın).
      s.pendingOrders = s.pendingOrders.filter((p) => p.status === "pending");
      persist();
    }
    return filled;
  },

  reset() {
    state = seed();
    persist();
  },
};

/**
 * Dahili order uygulayıcı — placeOrder ile aynı mantık ama bildirim + persist YOK.
 * evaluatePending toplu çalıştığında tek persist atmak için kullanılır.
 */
function placeOrderInternal(
  s: PaperState,
  o: Omit<Order, "id" | "ts">,
): { ok: boolean; error?: string } {
  const cost = o.shares * o.price;
  if (o.side === "BUY") {
    if (cost > s.cash + 0.01)
      return {
        ok: false,
        error: `Yetersiz nakit — gereken $${cost.toFixed(2)}, mevcut $${s.cash.toFixed(2)}`,
      };
    s.cash = +(s.cash - cost).toFixed(2);
    const h = s.holdings.find((x) => x.symbol === o.symbol);
    if (h) {
      const total = h.shares + o.shares;
      h.avgCost = +((h.avgCost * h.shares + cost) / total).toFixed(4);
      h.shares = +total.toFixed(6);
    } else {
      s.holdings.push({ symbol: o.symbol, shares: o.shares, avgCost: o.price });
    }
  } else {
    const h = s.holdings.find((x) => x.symbol === o.symbol);
    if (!h || h.shares < o.shares) return { ok: false, error: "Yetersiz hisse adedi" };
    h.shares = +(h.shares - o.shares).toFixed(6);
    s.cash = +(s.cash + cost).toFixed(2);
    if (h.shares <= 0.0000001) s.holdings = s.holdings.filter((x) => x.symbol !== o.symbol);
  }
  s.orders.unshift({ ...o, id: nextOrderId(o.symbol), ts: Date.now() });
  notifStore.push(
    "order",
    `Emir gerçekleşti: ${o.side === "BUY" ? "Alış" : "Satış"} ${o.shares < 1 ? o.shares.toFixed(4) : o.shares} ${o.symbol} @ $${o.price.toFixed(2)}`,
  );
  return { ok: true };
}
