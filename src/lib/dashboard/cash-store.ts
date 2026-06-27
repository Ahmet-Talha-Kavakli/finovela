"use client";

/**
 * Vela High-Yield Cash store — gerçek çalışan getiri hesabı (paper).
 * - Bağımsız bakiye: kullanıcı para yatırır/çeker (deposit/withdraw).
 * - Faiz SÜREKLİ işler: her okumada lastAccrue'dan bu yana geçen güne göre
 *   balance * apy/365 * daysElapsed kadar faiz eklenir (accrueIfNeeded).
 * - Crypto STAKING alt bölümü: BTC/ETH/SOL miktarlarını ~5-12% APY ile stake et.
 * localStorage'da kalıcı (vela.cash.v1). useSyncExternalStore ile dinlenir.
 *
 * NOT: Date.now() ASLA modül üst seviyesinde çağrılmaz — yalnız metod içinde.
 */

import { notifStore } from "./use-notifications";

export type StakePosition = {
  symbol: "BTC" | "ETH" | "SOL";
  amount: number; // stake edilen coin miktarı
  apy: number; // yüzde
  rewards: number; // birikmiş ödül (coin cinsinden)
  since: number; // ts — ödül işletimi için
};

export type CashState = {
  balance: number; // High-Yield Cash bakiyesi (USD)
  apy: number; // yıllık yüzde
  accruedTotal: number; // toplam birikmiş faiz (USD, ömür boyu)
  lastAccrue: number; // son faiz işletim ts'i
  stakes: StakePosition[];
};

const KEY = "vela.cash.v1";

// Stake edilebilir varlıklar + tipik staking APY'leri.
export const STAKE_APY: Record<StakePosition["symbol"], number> = {
  BTC: 5.0,
  ETH: 4.8,
  SOL: 7.5,
};

function seed(): CashState {
  return {
    balance: 25000,
    apy: 3.3,
    accruedTotal: 0,
    lastAccrue: 0, // 0 = henüz işletilmedi; ilk accrue'da now() ile başlatılır
    stakes: [],
  };
}

/** SSR snapshot — sunucunun render ettiğiyle birebir eşleşen sabit (donmuş) seed. */
export const CASH_SSR_SNAPSHOT: CashState = Object.freeze(seed()) as CashState;

let state: CashState | null = null;
const listeners = new Set<() => void>();

const DAY_MS = 86_400_000;

function load(): CashState {
  if (state) return state;
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<CashState>;
      const s = seed();
      state = {
        balance: p.balance ?? s.balance,
        apy: p.apy ?? s.apy,
        accruedTotal: p.accruedTotal ?? s.accruedTotal,
        lastAccrue: p.lastAccrue ?? s.lastAccrue,
        stakes: p.stakes ?? s.stakes,
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

/**
 * Geçen süreye göre faizi + staking ödüllerini işle.
 * İlk çağrıda lastAccrue=0 ise referansı şimdiye sabitler (faiz patlamasını önler).
 * Döndürür: değişiklik oldu mu (persist gereksin mi).
 */
function accrueIfNeeded(s: CashState, now: number): boolean {
  let changed = false;

  // Faiz referansını ilk kez başlat.
  if (!s.lastAccrue) {
    s.lastAccrue = now;
    changed = true;
  }

  const elapsedMs = now - s.lastAccrue;
  if (elapsedMs > 0 && s.balance > 0) {
    const days = elapsedMs / DAY_MS;
    const interest = s.balance * (s.apy / 100 / 365) * days;
    if (interest > 0) {
      s.balance = +(s.balance + interest).toFixed(6);
      s.accruedTotal = +(s.accruedTotal + interest).toFixed(6);
      s.lastAccrue = now;
      changed = true;
    }
  } else if (elapsedMs > 0) {
    // bakiye yoksa sadece zaman damgasını ilerlet
    s.lastAccrue = now;
    changed = true;
  }

  // Staking ödülleri (coin cinsinden, sürekli).
  for (const st of s.stakes) {
    if (!st.since) {
      st.since = now;
      changed = true;
      continue;
    }
    const days = (now - st.since) / DAY_MS;
    if (days > 0 && st.amount > 0) {
      const reward = st.amount * (st.apy / 100 / 365) * days;
      if (reward > 0) {
        st.rewards = +(st.rewards + reward).toFixed(8);
        st.since = now;
        changed = true;
      }
    }
  }

  return changed;
}

export const cashStore = {
  /**
   * SAF okuma — render sırasında çağrılır (useSyncExternalStore snapshot).
   * Accrue/persist/notify YAPMAZ; aksi halde "render sırasında setState" hatası
   * ve sonsuz döngü olur. Faiz işletme için tick() kullanılır.
   */
  get(): CashState {
    return load();
  },

  /** Faizi işle + persist + dinleyicileri uyar. Timer ve aksiyonlardan çağrılır. */
  tick() {
    if (typeof window === "undefined") return;
    const s = load();
    if (accrueIfNeeded(s, Date.now())) persist();
  },

  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  /** High-Yield Cash hesabına para yatır. */
  deposit(amt: number): { ok: boolean; error?: string } {
    if (!Number.isFinite(amt) || amt <= 0) return { ok: false, error: "Enter a valid amount" };
    const s = load();
    accrueIfNeeded(s, Date.now());
    s.balance = +(s.balance + amt).toFixed(6);
    persist();
    notifStore.push("info", `Moved $${amt.toLocaleString("en-US", { maximumFractionDigits: 2 })} into High-Yield Cash`);
    return { ok: true };
  },

  /** High-Yield Cash hesabından para çek. */
  withdraw(amt: number): { ok: boolean; error?: string } {
    if (!Number.isFinite(amt) || amt <= 0) return { ok: false, error: "Enter a valid amount" };
    const s = load();
    accrueIfNeeded(s, Date.now());
    if (amt > s.balance) return { ok: false, error: "Insufficient cash balance" };
    s.balance = +(s.balance - amt).toFixed(6);
    persist();
    notifStore.push("info", `Withdrew $${amt.toLocaleString("en-US", { maximumFractionDigits: 2 })} from High-Yield Cash`);
    return { ok: true };
  },

  setApy(apy: number) {
    const s = load();
    accrueIfNeeded(s, Date.now());
    s.apy = apy;
    persist();
  },

  /** Bir coin'i stake et (miktar ekle). */
  stake(symbol: StakePosition["symbol"], amount: number): { ok: boolean; error?: string } {
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter a valid amount" };
    const s = load();
    accrueIfNeeded(s, Date.now());
    const now = Date.now();
    const existing = s.stakes.find((x) => x.symbol === symbol);
    if (existing) {
      existing.amount = +(existing.amount + amount).toFixed(8);
    } else {
      s.stakes.push({ symbol, amount, apy: STAKE_APY[symbol], rewards: 0, since: now });
    }
    persist();
    notifStore.push("info", `Staked ${amount} ${symbol} at ${STAKE_APY[symbol].toFixed(1)}% APY`);
    return { ok: true };
  },

  /** Stake çöz (miktar azalt). Tamamı çözülürse pozisyon kaldırılır. */
  unstake(symbol: StakePosition["symbol"], amount: number): { ok: boolean; error?: string } {
    if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "Enter a valid amount" };
    const s = load();
    accrueIfNeeded(s, Date.now());
    const existing = s.stakes.find((x) => x.symbol === symbol);
    if (!existing || existing.amount < amount) return { ok: false, error: "Not enough staked" };
    existing.amount = +(existing.amount - amount).toFixed(8);
    if (existing.amount <= 0.00000001) {
      s.stakes = s.stakes.filter((x) => x.symbol !== symbol);
    }
    persist();
    notifStore.push("info", `Unstaked ${amount} ${symbol}`);
    return { ok: true };
  },

  reset() {
    state = seed();
    persist();
  },
};
