"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, TrendUp, CalendarCheck, CheckCircle, Info } from "@phosphor-icons/react";
import { useNotifications, notifStore, type Notif } from "@/lib/dashboard/use-notifications";

/** Bildirim merkezi — zil + okunmamış nokta + açılır panel. Canlı notif store'a bağlı. */

const kindIcon = {
  alert: TrendUp,
  order: CheckCircle,
  earnings: CalendarCheck,
  info: Info,
} as const;

const kindColor = {
  alert: "#3ecf8e",
  order: "#3ecf8e",
  earnings: "#fafafa",
  info: "#fafafa",
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
        className="relative grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] text-white/60 transition hover:text-white"
        aria-label="Bildirimler"
      >
        <Bell size={18} weight={open ? "fill" : "regular"} />
        {unread > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#3ecf8e] ring-2 ring-[#0a0a0a]" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f10] shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-white/45">
              Bildirimler
            </h3>
            {unread > 0 && (
              <button
                onClick={() => notifStore.markAllRead()}
                className="text-xs font-medium text-white/45 transition hover:text-white"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-white/35">Bildirim yok.</p>
            ) : (
              notifs.map((n: Notif) => {
                const Icon = kindIcon[n.kind];
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 transition hover:bg-white/[0.03] ${n.read ? "opacity-60" : ""}`}
                  >
                    <span
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.06]"
                      style={{ color: kindColor[n.kind] }}
                    >
                      <Icon size={16} weight="bold" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white">{n.text}</p>
                      {n.ts > 0 && <p className="mt-0.5 text-xs text-white/40">{relTime(n.ts)}</p>}
                    </div>
                    {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#3ecf8e]" />}
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-white/[0.08] px-4 py-2.5 text-center">
            <Link
              href="/dashboard/alerts"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-white/45 transition hover:text-white"
            >
              Tüm alarmları gör
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
