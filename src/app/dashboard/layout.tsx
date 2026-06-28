import { Sidebar } from "@/components/dashboard/sidebar";
import { AlertEngineMount } from "@/components/dashboard/alert-engine-mount";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { ConfirmProvider } from "@/components/dashboard/confirm";
import { SyncProvider } from "@/components/dashboard/sync-provider";
import { ToastHost } from "@/components/dashboard/toast";
import { UpgradeModal } from "@/components/dashboard/upgrade-modal";
import { PlanPicker } from "@/components/dashboard/plan-picker";
import { CLERK_ENABLED } from "@/lib/auth";
import { getCurrentUser } from "@/lib/current-user";
import { upsertUser } from "@/lib/db/repo";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Kullanıcıyı DB'ye yaz (ilk girişte oluştur, sonra email/name tazele).
  // Webhook gerektirmez — Clerk açıkken her dashboard yüklemesinde idempotent çalışır.
  if (CLERK_ENABLED) {
    try {
      const u = await getCurrentUser();
      if (u.id && u.id !== "demo-user") {
        const res = await upsertUser({ id: u.id, email: u.email, name: u.name });
        // İlk kez oluşturuldu → hoş geldin maili. Hata ana akışı bozmaz.
        if (res.created && u.email) {
          const mail = welcomeEmail(u.name);
          await sendEmail({ to: u.email, subject: mail.subject, html: mail.html, text: mail.text }).catch(() => {});
        }
      }
    } catch {
      // DB erişilemezse dashboard yine açılsın (kalıcılık sonraki yüklemede dener).
    }
  }

  return (
    <ConfirmProvider>
      <div className="vela-dashboard-root min-h-screen bg-[#fefefe]">
        <SyncProvider />
        <AlertEngineMount />
        <CommandPalette />
        <Sidebar />
        <div className="vela-content lg:pl-[248px]">{children}</div>
        <ToastHost />
        <UpgradeModal />
        <PlanPicker />
      </div>
    </ConfirmProvider>
  );
}
