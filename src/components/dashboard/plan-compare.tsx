"use client";

// Billing — 3 plan karşılaştırma kartları + Paddle overlay checkout butonları.
// Mevcut planı vurgular; alt planlara "Mevcut plan", üst planlara yükselt butonu.

import { useState } from "react";
import { AIS_ACCENT } from "@/components/dashboard/ais-kit";
import { Check, Spinner, ArrowUp } from "@phosphor-icons/react";
import { startPaddleCheckout } from "@/lib/paddle-client";
import { PLANS, type PlanId } from "@/lib/plans";

const ORDER: PlanId[] = ["free", "pro", "unlimited"];

/** Plan başına gösterilecek öne çıkan özellikler (kısa). */
const HIGHLIGHTS: Record<PlanId, string[]> = {
  free: ["Günde 20 AI sohbeti", "1 hedef, 1 otomasyon", "1 bağlı hesap", "Temel teknik analiz"],
  pro: [
    "Sınırsız AI sohbeti",
    "Sınırsız hedef & otomasyon",
    "5 bağlı hesap",
    "Web araştırma & dosya yükleme",
    "Kopya işlem",
  ],
  unlimited: [
    "Pro'daki her şey",
    "En güçlü AI modeli",
    "Sınırsız bağlı hesap",
    "Derin araştırma",
    "Vergi merkezi",
  ],
};

export function PlanCompare({ currentPlan }: { currentPlan: PlanId }) {
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [err, setErr] = useState("");
  const currentIdx = ORDER.indexOf(currentPlan);

  async function upgrade(plan: PlanId) {
    if (plan === "free") return;
    setBusy(plan);
    setErr("");
    const error = await startPaddleCheckout(plan as "pro" | "unlimited");
    if (error) setErr(error);
    setBusy(null);
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border md:grid-cols-3"
        style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
      >
        {ORDER.map((id) => {
          const plan = PLANS[id];
          const isCurrent = id === currentPlan;
          const idx = ORDER.indexOf(id);
          const isDowngrade = idx < currentIdx;

          return (
            <div
              key={id}
              className="flex flex-col bg-[var(--ais-surface)] p-6"
              style={isCurrent ? { boxShadow: `inset 0 0 0 1.5px ${AIS_ACCENT}` } : undefined}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold text-[var(--ais-fg)]">{plan.name}</h3>
                {isCurrent && <span className="badge-soft badge-blue">Mevcut</span>}
              </div>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="num text-[26px] font-semibold text-[var(--ais-fg)]">
                  ${plan.priceMonthly}
                </span>
                <span className="text-[12.5px] text-[var(--ais-fg-faint)]">/ay</span>
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">
                {plan.blurb}
              </p>

              <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                {HIGHLIGHTS[id].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-[var(--ais-fg)]">
                    <Check size={15} weight="bold" style={{ color: "var(--ais-green)" }} className="mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-lg border px-4 py-2.5 text-[13px] font-medium text-[var(--ais-fg-muted)]"
                    style={{ borderColor: "var(--ais-line-strong)" }}
                  >
                    Mevcut plan
                  </button>
                ) : isDowngrade ? (
                  <p className="text-center text-[12px] text-[var(--ais-fg-faint)]">
                    Daha düşük plan — yönetimden değiştir
                  </p>
                ) : id === "free" ? (
                  <p className="text-center text-[12px] text-[var(--ais-fg-faint)]">Ücretsiz</p>
                ) : (
                  <button
                    onClick={() => upgrade(id)}
                    disabled={busy !== null}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[13px] font-medium transition disabled:opacity-50"
                    style={{ background: AIS_ACCENT, color: "#fff" }}
                  >
                    {busy === id ? (
                      <Spinner size={15} className="animate-spin" />
                    ) : (
                      <ArrowUp size={15} weight="bold" />
                    )}
                    {id === "pro" ? "Pro'ya yükselt" : "Unlimited'a geç"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {err && <p className="mt-3 text-[12px] text-[#f28b82]">{err}</p>}
    </div>
  );
}
