"use client";

/**
 * Bağlantılar store'u — işlem/yönetim platformlarına bağlantı durumu.
 * Kalıcı (vela.connections.v1 → sync-engine DB'ye yansıtır). Demo: bağlantı
 * durumu tutulur; gerçek OAuth/broker akışı ileride bu duruma takılır.
 */

import { useSyncExternalStore } from "react";

export type ConnectionCategory = "broker" | "bank" | "wallet" | "data" | "exchange";

export type ConnectionDef = {
  id: string;
  name: string;
  category: ConnectionCategory;
  desc: string;
  live: boolean; // gerçek entegrasyon hazır mı (şu an hepsi demo)
};

export const CONNECTIONS: ConnectionDef[] = [
  { id: "alpaca", name: "Alpaca", category: "broker", desc: "ABD hisse & ETF — paper'dan canlıya komisyonsuz işlem.", live: false },
  { id: "ibkr", name: "Interactive Brokers", category: "broker", desc: "Global piyasalara profesyonel erişim.", live: false },
  { id: "midas", name: "Midas Menkul", category: "broker", desc: "BIST & ABD hisseleri (Türkiye).", live: false },
  { id: "binance", name: "Binance", category: "exchange", desc: "Spot kripto hesabını bağla — gerçek bakiye & otomatik işlem (testnet destekli).", live: true },
  { id: "coinbase", name: "Coinbase", category: "exchange", desc: "Kripto cüzdan & spot işlemler.", live: false },
  { id: "metamask", name: "MetaMask", category: "wallet", desc: "On-chain cüzdanını oku (salt-okunur).", live: false },
  { id: "ziraat", name: "Banka hesabı", category: "bank", desc: "Open Banking ile nakit yatır/çek (TR/EU).", live: false },
  { id: "finnhub", name: "Finnhub", category: "data", desc: "Canlı ABD piyasa verisi.", live: true },
  { id: "twelvedata", name: "TwelveData", category: "data", desc: "Forex, metal & emtia verisi.", live: true },
];

const KEY = "vela.connections.v1";

type ConnState = Record<string, { connected: boolean; since: number }>;

const SSR: ConnState = Object.freeze({});

let cache: ConnState | null = null;
const listeners = new Set<() => void>();

function load(): ConnState {
  if (cache) return cache;
  if (typeof window === "undefined") return SSR;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as ConnState) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function save(next: ConnState) {
  cache = next;
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onRehydrate = () => {
    cache = null;
    cb();
  };
  if (typeof window !== "undefined") window.addEventListener("vela:rehydrate", onRehydrate);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("vela:rehydrate", onRehydrate);
  };
}

export const connectionsStore = {
  get: load,
  toggle(id: string) {
    const s = { ...load() };
    if (s[id]?.connected) delete s[id];
    else s[id] = { connected: true, since: Date.now() };
    save(s);
  },
};

export function useConnections() {
  const state = useSyncExternalStore(subscribe, load, () => SSR);
  return {
    state,
    isConnected: (id: string) => !!state[id]?.connected,
    toggle: connectionsStore.toggle,
    connectedCount: Object.values(state).filter((c) => c.connected).length,
  };
}
