"use client";

import { useSyncExternalStore } from "react";
import { optionsStore, type OptionPosition } from "./options-store";

// SSR ile birebir eşleşen sabit boş anlık görüntü — hydration mismatch'i önler.
// (Sunucu her zaman boş liste render eder; istemci ilk render'da da boş döner,
//  ardından store localStorage'tan dolunca güncellenir.)
const EMPTY: OptionPosition[] = [];

/** optionsStore'u React'e bağlar — canlı opsiyon pozisyon listesi. */
export function useOptions(): OptionPosition[] {
  return useSyncExternalStore(
    optionsStore.subscribe,
    () => optionsStore.get().positions,
    () => EMPTY,
  );
}
