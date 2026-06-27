"use client";

import { useAlertEngine } from "@/lib/dashboard/use-alerts";
import { useAutomationEngine } from "@/lib/dashboard/use-automation-engine";

/** Görünmez mount — alert + otomasyon motorlarını dashboard boyunca canlı tutar. */
export function AlertEngineMount() {
  useAlertEngine();
  useAutomationEngine();
  return null;
}
