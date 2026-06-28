"use client";

/**
 * UpgradeModal — ARTIK uyumluluk kabuğu (deprecated UI yok).
 *
 * Eskiden bağımsız bir açık-tema yükseltme penceresiydi; tek bir yükseltme akışı
 * olması için (kullanıcı isteği) tüm yükseltme çağrıları PlanPicker'a yönlendirildi.
 * Çift modal sistemi olmasın diye burada UI render EDİLMEZ:
 *  - openUpgrade(...) → openPlanPicker(...) (eski çağrılar çalışmaya devam eder)
 *  - eski "vela:open-upgrade" event'i → "vela:open-plan-picker"e köprülenir
 *
 * Yeni kod doğrudan @/components/dashboard/plan-picker → openPlanPicker kullanmalı.
 */

import { useEffect } from "react";
import { openPlanPicker } from "@/components/dashboard/plan-picker";

type Reason = "limit" | "feature";
type OpenDetail = { reason?: Reason; feature?: string; title?: string; desc?: string };

/** Geriye dönük uyumluluk: artık PlanPicker'ı açar. */
export function openUpgrade(detail?: OpenDetail) {
  openPlanPicker(detail);
}

export function UpgradeModal() {
  // Eski "vela:open-upgrade" event'ini yeni plan-picker event'ine köprüle.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<OpenDetail>).detail ?? {};
      openPlanPicker(d);
    };
    window.addEventListener("vela:open-upgrade", onOpen);
    return () => window.removeEventListener("vela:open-upgrade", onOpen);
  }, []);

  return null;
}
