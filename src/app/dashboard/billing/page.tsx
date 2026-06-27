/**
 * Finovela Abonelik & Faturalandırma — mevcut plan + 3 plan karşılaştırma + limit tablosu.
 * Ödeme: Paddle (overlay checkout). Plan verileri TEK KAYNAK olan plans.ts'ten okunur.
 * Tasarım dili: Didit (business.didit.me) — açık tema (.ais ais-light), kutusuz,
 * border-t ayraçlı bölümler, ızgara-ayraçlı şeritler, token renkleri, Lucide ikon.
 * Sunucu bileşeni (RSC).
 */

import type { Metadata } from "next";
import { Topbar } from "@/components/dashboard/topbar";
import { requireUserId } from "@/lib/current-user";
import { getUserRow } from "@/lib/db/repo";
import { PLANS, normalizePlan, type PlanId } from "@/lib/plans";
import { BillingActions } from "@/components/dashboard/billing-actions";
import { PlanCompare } from "@/components/dashboard/plan-compare";
import { Sparkles } from "lucide-react";

export const metadata: Metadata = { title: "Abonelik — Finovela" };

const ACCENT = "var(--ais-accent)";
const UP = "var(--ais-green)";

const fmtLimit = (v: number | "unlimited") => (v === "unlimited" ? "Sınırsız" : String(v));
const fmtBool = (v: boolean) => (v ? "Var" : "—");

const STATUS_TR: Record<string, string> = {
  active: "Aktif",
  trialing: "Deneme sürümü",
  past_due: "Ödeme gecikti",
  canceled: "İptal edildi",
  paused: "Duraklatıldı",
};

// Karşılaştırma tablosu satırları (plans.ts limits → kullanıcı dostu).
const ROWS: { label: string; get: (p: PlanId) => string }[] = [
  { label: "Günlük AI sohbet", get: (p) => fmtLimit(PLANS[p].limits.aiChatsPerDay) },
  { label: "Fiyat alarmı", get: (p) => fmtLimit(PLANS[p].limits.priceAlerts) },
  { label: "Hedef", get: (p) => fmtLimit(PLANS[p].limits.goals) },
  { label: "Otomasyon", get: (p) => fmtLimit(PLANS[p].limits.automations) },
  { label: "Bağlı hesap", get: (p) => fmtLimit(PLANS[p].limits.connectedAccounts) },
  { label: "Web araştırma", get: (p) => fmtBool(PLANS[p].limits.webResearch) },
  { label: "Dosya yükleme", get: (p) => fmtBool(PLANS[p].limits.fileUpload) },
  { label: "En güçlü model", get: (p) => fmtBool(PLANS[p].limits.bestModel) },
  { label: "Kopya işlem", get: (p) => fmtBool(PLANS[p].limits.copyTrading) },
  { label: "Vergi merkezi", get: (p) => fmtBool(PLANS[p].limits.taxCenter) },
];

const PLAN_IDS: PlanId[] = ["free", "pro", "unlimited"];

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

          {/* ───────── Plan karşılaştırma (3 kart) ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Planını seç</h2>
            <PlanCompare currentPlan={planId} />
          </section>

          {/* ───────── Limit karşılaştırma tablosu ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-5">Plan limitleri</h2>
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
              <table className="ais-dt w-full text-left">
                <thead>
                  <tr>
                    <th className="px-5 py-3 text-[11.5px] font-medium text-[var(--ais-fg-faint)]">
                      Özellik
                    </th>
                    {PLAN_IDS.map((id) => (
                      <th
                        key={id}
                        className="px-5 py-3 text-[12px] font-medium"
                        style={{ color: id === planId ? ACCENT : "var(--ais-fg-muted)" }}
                      >
                        {PLANS[id].name}
                        {id === planId && <span className="ml-1.5 badge-soft badge-blue">Mevcut</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((r) => (
                    <tr key={r.label} className="border-t" style={{ borderColor: "var(--ais-line)" }}>
                      <td className="px-5 py-3 text-[13px] text-[var(--ais-fg-muted)]">{r.label}</td>
                      {PLAN_IDS.map((id) => {
                        const v = r.get(id);
                        return (
                          <td
                            key={id}
                            className="num px-5 py-3 text-[13px] font-medium"
                            style={{ color: v === "Var" ? UP : v === "—" ? "var(--ais-fg-faint)" : "var(--ais-fg)" }}
                          >
                            {v}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[12px] leading-relaxed text-[var(--ais-fg-faint)]">
              Ödemeler Paddle üzerinden güvenle alınır. Abonelik, kart ve fatura yönetimi için
              yukarıdaki “Aboneliği yönet” bağlantısını kullan.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
