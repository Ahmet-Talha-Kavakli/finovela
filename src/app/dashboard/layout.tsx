import { Sidebar } from "@/components/dashboard/sidebar";
import { AlertEngineMount } from "@/components/dashboard/alert-engine-mount";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { ConfirmProvider } from "@/components/dashboard/confirm";
import { SyncProvider } from "@/components/dashboard/sync-provider";
import { ToastHost } from "@/components/dashboard/toast";
import { UpgradeModal } from "@/components/dashboard/upgrade-modal";
import { CLERK_ENABLED } from "@/lib/auth";
import { getCurrentUser } from "@/lib/current-user";
import { upsertUser } from "@/lib/db/repo";

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
        await upsertUser({ id: u.id, email: u.email, name: u.name });
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
      </div>
    </ConfirmProvider>
  );
}
