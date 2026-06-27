"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, TrendingUp, CalendarCheck, CheckCircle2, Info } from "lucide-react";
import { useNotifications, notifStore, type Notif } from "@/lib/dashboard/use-notifications";

/** Bildirim merkezi — zil + okunmamış nokta + açılır panel. Canlı notif store'a bağlı. Didit açık-tema. */

const kindIcon = {
  alert: TrendingUp,
  order: CheckCircle2,
  earnings: CalendarCheck,
  info: Info,
} as const;

const kindColor = {
  alert: "var(--ais-green)",
  order: "var(--ais-green)",
  earnings: "var(--ais-accent)",
  info: "var(--ais-accent)",
} as const;

function relTime(ts: number): string {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  return `${Math.floor(s / 86400)} gün önce`;
}

export function Notifications() {
  const notifs = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-10 w-10 place-items-center rounded-full border text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
        style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
        aria-label="Bildirimler"
      >
        <Bell size={18} fill={open ? "currentColor" : "none"} />
        {unread > 0 && (
          <span
            className="absolute right-2 top-2 h-2 w-2 rounded-full ring-2"
            style={{ background: "var(--ais-green)", "--tw-ring-color": "var(--ais-bg)" } as React.CSSProperties}
          />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border shadow-[0_24px_60px_-20px_rgba(0,0,0,0.25)]"
          style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
        >
          <div
            className="flex items-center justify-between border-b px-4 py-3"
            style={{ borderColor: "var(--ais-line)" }}
          >
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--ais-fg-muted)]">
              Bildirimler
            </h3>
            {unread > 0 && (
              <button
                onClick={() => notifStore.markAllRead()}
                className="text-xs font-medium text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--ais-fg-faint)]">Bildirim yok.</p>
            ) : (
              notifs.map((n: Notif) => {
                const Icon = kindIcon[n.kind];
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 transition hover:bg-[var(--ais-surface-2)] ${n.read ? "opacity-60" : ""}`}
                  >
                    <span
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full"
                      style={{ background: "var(--ais-surface-2)", color: kindColor[n.kind] }}
                    >
                      <Icon size={16} strokeWidth={2.25} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--ais-fg)]">{n.text}</p>
                      {n.ts > 0 && (
                        <p className="mt-0.5 text-xs text-[var(--ais-fg-faint)]">{relTime(n.ts)}</p>
                      )}
                    </div>
                    {!n.read && (
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: "var(--ais-green)" }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div
            className="border-t px-4 py-2.5 text-center"
            style={{ borderColor: "var(--ais-line)" }}
          >
            <Link
              href="/dashboard/alerts"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-[var(--ais-fg-muted)] transition hover:text-[var(--ais-fg)]"
            >
              Tüm alarmları gör
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
