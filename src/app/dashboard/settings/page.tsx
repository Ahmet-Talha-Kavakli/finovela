import type { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { SettingsTabs } from "@/components/dashboard/settings-tabs";
import { AiMemoryPanel } from "@/components/dashboard/ai-memory-panel";
import { SecurityPanel, NotificationPrefs } from "@/components/dashboard/security-panel";
import {
  PreferencesPanel,
  PlanUsageSummary,
  ConnectionsSummary,
  DataPrivacyPanel,
  ProfileManageButton,
} from "@/components/dashboard/settings-extras";
import { DangerZone } from "@/components/dashboard/danger-zone";
import { Sparkles } from "lucide-react";
import { getCurrentUser, requireUserId } from "@/lib/current-user";
import { getUserRow } from "@/lib/db/repo";
import { PLANS, type PlanId } from "@/lib/plans";

export const metadata: Metadata = { title: "Ayarlar — Finovela" };

// Didit açık-tema renkleri.
const ACCENT = "var(--ais-accent)";

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
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-3xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Ayarlar</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Profilini, planını, hafızanı ve güvenlik tercihlerini buradan yönet.
            </p>
          </div>

          {/* ───────── Didit tab bar ───────── */}
          <SettingsTabs
            profile={
              <div>
                <div className="mb-5">
                  <h2 className="d-section">Profil</h2>
                  <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                    Finovela hesabınla ilişkili bilgiler.
                  </p>
                </div>
                <div
                  className="flex flex-wrap items-center gap-4 rounded-xl border p-5"
                  style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
                >
                  {user.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.imageUrl} alt={user.name} className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <span
                      className="grid h-14 w-14 place-items-center rounded-full text-[18px] font-medium"
                      style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                    >
                      {initial}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[var(--ais-fg)]">{user.name}</p>
                    <p className="truncate text-[13px] text-[var(--ais-fg-muted)]">{user.email || "—"}</p>
                  </div>
                  <ProfileManageButton />
                </div>
              </div>
            }
            preferences={
              <div>
                <div className="mb-5">
                  <h2 className="d-section">Tercihler</h2>
                  <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                    Dil, para birimi ve görüntüleme tercihlerin.
                  </p>
                </div>
                <PreferencesPanel />
              </div>
            }
            memory={
              <div>
                <div className="mb-5">
                  <h2 className="d-section">Finovela&apos;nın hafızası</h2>
                  <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                    Finovela&apos;nın her sohbette seninle ilgili kalıcı olarak hatırladığı bilgiler.
                  </p>
                </div>
                <AiMemoryPanel />
              </div>
            }
            billing={
              <div>
                <div className="mb-5">
                  <h2 className="d-section">Plan ve faturalandırma</h2>
                  <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                    Mevcut planın ve yükseltme seçeneklerin.
                  </p>
                </div>
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border p-5"
                  style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                      style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                    >
                      <Sparkles size={18} />
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
                    className="shrink-0 rounded-full border px-4 py-1.5 text-[12.5px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
                    style={{ borderColor: "var(--ais-line-strong)" }}
                  >
                    {planId === "free" ? "Yükselt" : "Yönet"}
                  </Link>
                </div>
                <PlanUsageSummary />
              </div>
            }
            notifications={
              <div>
                <div className="mb-5">
                  <h2 className="d-section">Bildirimler</h2>
                  <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                    Hangi olaylarda haber almak istediğini seç.
                  </p>
                </div>
                <NotificationPrefs />
              </div>
            }
            security={
              <div>
                <div className="mb-5">
                  <h2 className="d-section">Güvenlik</h2>
                  <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                    İşlem PIN&apos;i, kurtarma kodları ve hesap güvenliği.
                  </p>
                </div>
                <SecurityPanel />
                {/* bağlı borsa hesapları özeti → connections sayfasına köprü */}
                <ConnectionsSummary />
              </div>
            }
            data={
              <div>
                <div className="mb-5">
                  <h2 className="d-section">Veri & Gizlilik</h2>
                  <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                    Verilerini dışa aktar, paper hesabını yönet ya da tüm verilerini sıfırla.
                  </p>
                </div>
                <DataPrivacyPanel />
                {/* paper hesabı sıfırlama — nakit tükenince temiz başlangıç */}
                <DangerZone />
              </div>
            }
          />
        </div>
      </div>
    </>
  );
}
