/**
 * Finovela Abonelik & Faturalandırma — plan + kullanım sınırları.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ızgara-ayraçlı sınır şeridi, token renkleri.
 * Sunucu bileşeni (RSC) — lucide-react/dist/esm/icons doğrudan SSR'da çalışır.
 */

import type { Metadata } from "next";
import { Topbar } from "@/components/dashboard/topbar";
import { requireUserId } from "@/lib/current-user";
import { getUserRow } from "@/lib/db/repo";
import { PLANS, normalizePlan, type PlanId } from "@/lib/plans";
import { BillingActions } from "@/components/dashboard/billing-actions";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Abonelik — Finovela" };

const ACCENT = "var(--ais-accent)";
const UP = "var(--ais-green)";

const fmtLimit = (v: number | "unlimited") => (v === "unlimited" ? "Sınırsız" : String(v));

export default async function BillingPage() {
  let planId: PlanId = "free";
  let subStatus: string | null = null;
  try {
    const uid = await requireUserId();
    if (uid) {
      const row = await getUserRow(uid);
      planId = normalizePlan(row?.plan);
      subStatus = row?.subStatus ?? null;
    }
  } catch {
    /* Free göster */
  }
  const plan = PLANS[planId];

  const STATUS_TR: Record<string, string> = {
    active: "Aktif",
    trialing: "Deneme sürümü",
    past_due: "Ödeme gecikti",
    canceled: "İptal edildi",
  };

  const limits: { label: string; value: string }[] = [
    { label: "Günlük AI sohbet", value: fmtLimit(plan.limits.aiChatsPerDay) },
    { label: "Fiyat alarmı", value: fmtLimit(plan.limits.priceAlerts) },
    { label: "Hedef", value: fmtLimit(plan.limits.goals) },
    { label: "Otomasyon", value: fmtLimit(plan.limits.automations) },
    { label: "Bağlı hesap", value: fmtLimit(plan.limits.connectedAccounts) },
    { label: "En güçlü model", value: plan.limits.bestModel ? "Var" : "—" },
    { label: "Web araştırma", value: plan.limits.webResearch ? "Var" : "—" },
    { label: "Kopya işlem", value: plan.limits.copyTrading ? "Var" : "—" },
    { label: "Vergi merkezi", value: plan.limits.taxCenter ? "Var" : "—" },
  ];

  return (
    <>
      <Topbar title="Abonelik" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Abonelik &amp; Faturalandırma</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Planını, kullanım sınırlarını ve ödemeni buradan yönet.
            </p>
          </div>

          {/* ───────── Mevcut plan ───────── */}
          <section className="mt-9 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Mevcut plan</h2>
            <div
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-6"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
                  style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                >
                  <Sparkles size={20} />
                </span>
                <div>
                  <p className="flex items-center gap-2 text-[15px] font-medium text-[var(--ais-fg)]">
                    Finovela {plan.name}
                    {subStatus && (
                      <span className="badge-soft badge-green">{STATUS_TR[subStatus] ?? subStatus}</span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--ais-fg-muted)]">
                    {plan.blurb}
                    {plan.priceMonthly > 0 ? ` · $${plan.priceMonthly}/ay` : " · Ücretsiz"}
                  </p>
                </div>
              </div>
              <BillingActions planId={planId} />
            </div>
          </section>

          {/* ───────── Plan sınırların (kutusuz ızgara-ayraçlı şerit) ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Plan sınırların</h2>
            <div
              className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border sm:grid-cols-3"
              style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
            >
              {limits.map((l) => (
                <div key={l.label} className="bg-[var(--ais-surface)] px-5 py-4">
                  <p className="text-[11.5px] text-[var(--ais-fg-faint)]">{l.label}</p>
                  <p
                    className="num mt-1.5 text-[15px] font-medium"
                    style={{ color: l.value === "Var" ? UP : "var(--ais-fg)" }}
                  >
                    {l.value}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
