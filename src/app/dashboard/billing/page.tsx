import type { Metadata } from "next";
import { Topbar } from "@/components/dashboard/topbar";
import { PageTitle, SectionCard, AIS_ACCENT, AIS_UP } from "@/components/dashboard/ais-kit";
import { requireUserId } from "@/lib/current-user";
import { getUserRow } from "@/lib/db/repo";
import { PLANS, normalizePlan, type PlanId } from "@/lib/plans";
import { BillingActions } from "@/components/dashboard/billing-actions";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = { title: "Abonelik — Finovela" };

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

  return (
    <>
      <Topbar title="Abonelik" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-3xl px-8 py-10">
          <PageTitle title="Abonelik & Faturalandırma" desc="Planını, kullanım sınırlarını ve ödemeni buradan yönet." />

          {/* mevcut plan */}
          <SectionCard label="Mevcut plan" className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: "var(--ais-accent-bg)", color: AIS_ACCENT }}>
                  <Sparkle size={20} weight="regular" />
                </span>
                <div>
                  <p className="flex items-center gap-2 text-[15px] font-medium text-[var(--ais-fg)]">
                    Finovela {plan.name}
                    {subStatus && (
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${AIS_UP}1a`, color: AIS_UP }}>
                        {STATUS_TR[subStatus] ?? subStatus}
                      </span>
                    )}
                  </p>
                  <p className="text-[12.5px] text-[var(--ais-fg-muted)]">
                    {plan.blurb}{plan.priceMonthly > 0 ? ` · $${plan.priceMonthly}/ay` : " · Ücretsiz"}
                  </p>
                </div>
              </div>
              <BillingActions planId={planId} />
            </div>
          </SectionCard>

          {/* kullanım sınırları */}
          <SectionCard label="Plan sınırların" className="mt-3">
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <Limit label="Günlük AI sohbet" value={fmtLimit(plan.limits.aiChatsPerDay)} />
              <Limit label="Fiyat alarmı" value={fmtLimit(plan.limits.priceAlerts)} />
              <Limit label="Hedef" value={fmtLimit(plan.limits.goals)} />
              <Limit label="Otomasyon" value={fmtLimit(plan.limits.automations)} />
              <Limit label="Bağlı hesap" value={fmtLimit(plan.limits.connectedAccounts)} />
              <Limit label="En güçlü model" value={plan.limits.bestModel ? "Var" : "—"} />
              <Limit label="Web araştırma" value={plan.limits.webResearch ? "Var" : "—"} />
              <Limit label="Kopya işlem" value={plan.limits.copyTrading ? "Var" : "—"} />
              <Limit label="Vergi merkezi" value={plan.limits.taxCenter ? "Var" : "—"} />
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

function Limit({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-[var(--ais-fg-faint)]">{label}</p>
      <p className="text-[14px] font-medium text-[var(--ais-fg)]">{value}</p>
    </div>
  );
}
