import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { PageTitle, Section, SectionCard, AIS_ACCENT } from "@/components/dashboard/ais-kit";
import { AiMemoryPanel } from "@/components/dashboard/ai-memory-panel";
import { SecurityPanel, NotificationPrefs } from "@/components/dashboard/security-panel";
import { DangerZone } from "@/components/dashboard/danger-zone";
import { Sparkle } from "@phosphor-icons/react/dist/ssr";
import { getCurrentUser, requireUserId } from "@/lib/current-user";
import { getUserRow } from "@/lib/db/repo";
import { PLANS, type PlanId } from "@/lib/plans";

export const metadata: Metadata = { title: "Ayarlar — Finovela" };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const initial = (user.name?.[0] ?? "A").toUpperCase();
  // Gerçek plan DB'den (yoksa Free). Hardcoded "Pro · $12" yerine doğru bilgi.
  let planId: PlanId = "free";
  try {
    const uid = await requireUserId();
    if (uid) {
      const row = await getUserRow(uid);
      if (row?.plan && row.plan.toLowerCase() in PLANS) planId = row.plan.toLowerCase() as PlanId;
    }
  } catch {
    /* DB erişilemezse Free göster */
  }
  const plan = PLANS[planId];
  return (
    <>
      <Topbar title="Ayarlar" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-3xl px-8 py-10">
          <PageTitle title="Ayarlar" desc="Profilini, planını, hafızanı ve güvenlik tercihlerini buradan yönet." />

          {/* profil */}
          <SectionCard label="Profil">
            <div className="flex items-center gap-4">
              {user.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt={user.name} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span
                  className="grid h-14 w-14 place-items-center rounded-full text-[18px] font-medium"
                  style={{ background: "var(--ais-accent-bg)", color: AIS_ACCENT }}
                >
                  {initial}
                </span>
              )}
              <div>
                <p className="text-[14px] font-medium text-[var(--ais-fg)]">{user.name}</p>
                <p className="text-[13px] text-[var(--ais-fg-muted)]">{user.email || "—"}</p>
              </div>
            </div>
          </SectionCard>

          {/* AI hafızası */}
          <Section label="Finovela'nın hafızası" className="mt-10" desc="Finovela'nın her sohbette seninle ilgili kalıcı olarak hatırladığı bilgiler." />
          <AiMemoryPanel />

          {/* plan */}
          <SectionCard label="Plan ve faturalandırma" className="mt-10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{ background: "var(--ais-accent-bg)", color: AIS_ACCENT }}
                >
                  <Sparkle size={18} weight="regular" />
                </span>
                <div>
                  <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Finovela {plan.name}</p>
                  <p className="text-[12px] text-[var(--ais-fg-muted)]">
                    {plan.blurb}
                    {plan.priceMonthly > 0 ? ` · $${plan.priceMonthly}/ay` : " · Ücretsiz"}
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/billing"
                className="shrink-0 rounded-lg border border-[var(--ais-line-strong)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
              >
                {planId === "free" ? "Yükselt" : "Yönet"}
              </Link>
            </div>
          </SectionCard>

          {/* bildirimler — gerçek toggle'lar */}
          <Section label="Bildirimler" className="mt-10" />
          <NotificationPrefs />

          {/* güvenlik kiti — PIN, yedek kod, cihazlar, 2FA durumu */}
          <Section label="Güvenlik" className="mt-10" />
          <SecurityPanel />

          {/* paper hesabı sıfırlama — nakit tükenince temiz başlangıç */}
          <DangerZone />
        </div>
      </div>
    </>
  );
}
