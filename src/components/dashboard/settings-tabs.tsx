"use client";

import { useState } from "react";
import { User, Brain, CreditCard, Bell, ShieldCheck, type LucideIcon } from "lucide-react";

/**
 * Didit Settings tab bar — üstte ikon+metin sekmeler, altı çizili aktif.
 * Her sekme bir içerik slotu render eder (server'da hazırlanan bölümler).
 * Tasarım dili: Didit açık tema (business.didit.me Account/Team/Security deseni).
 */

type TabId = "profile" | "memory" | "billing" | "notifications" | "security";

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "profile", label: "Profil", icon: User },
  { id: "memory", label: "Hafıza", icon: Brain },
  { id: "billing", label: "Plan", icon: CreditCard },
  { id: "notifications", label: "Bildirimler", icon: Bell },
  { id: "security", label: "Güvenlik", icon: ShieldCheck },
];

export function SettingsTabs({
  profile,
  memory,
  billing,
  notifications,
  security,
}: {
  profile: React.ReactNode;
  memory: React.ReactNode;
  billing: React.ReactNode;
  notifications: React.ReactNode;
  security: React.ReactNode;
}) {
  const [active, setActive] = useState<TabId>("profile");
  const content: Record<TabId, React.ReactNode> = {
    profile,
    memory,
    billing,
    notifications,
    security,
  };

  return (
    <div className="mt-8">
      {/* Tab bar — altı çizili aktif (Didit) */}
      <div className="flex gap-1 overflow-x-auto border-b" style={{ borderColor: "var(--ais-line)" }}>
        {TABS.map((t) => {
          const on = active === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="relative flex shrink-0 items-center gap-1.5 px-3.5 pb-3 pt-1 text-[13px] font-medium transition-colors"
              style={{ color: on ? "var(--ais-fg)" : "var(--ais-fg-muted)" }}
            >
              <Icon size={15} style={{ color: on ? "var(--ais-accent)" : "var(--ais-fg-faint)" }} />
              {t.label}
              {on && (
                <span
                  className="absolute inset-x-0 -bottom-px h-[2px] rounded-full"
                  style={{ background: "var(--ais-accent)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Aktif sekme içeriği */}
      <div className="pt-8">{content[active]}</div>
    </div>
  );
}
