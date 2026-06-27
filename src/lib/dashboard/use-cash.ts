"use client";

import { useSyncExternalStore } from "react";
import { cashStore, CASH_SSR_SNAPSHOT, type CashState } from "./cash-store";

/**
 * High-Yield Cash store'unu React'e bağlar.
 * Faiz sürekli işlediği için ~30sn'de bir tetikleyip canlı birikim gösterir.
 */
export function useCash(): CashState {
  const get = () => cashStore.get();
  // SSR snapshot, sunucunun render ettiğiyle BİREBİR aynı sabit olmalı
  // (localStorage okumaz, accrue tetiklemez) → hydration mismatch önlenir.
  const getServer = () => CASH_SSR_SNAPSHOT;

  const subscribe = (cb: () => void) => {
    const unsub = cashStore.subscribe(cb);
    // Mount'ta bir kez + periyodik faiz işle (render dışında, güvenli).
    cashStore.tick();
    const id = setInterval(() => cashStore.tick(), 30_000);
    return () => {
      unsub();
      clearInterval(id);
    };
  };

  return useSyncExternalStore(subscribe, get, getServer);
}
