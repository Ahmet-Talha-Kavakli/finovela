"use client";

/**
 * Finovela Bildirimler — tam sayfa bildirim merkezi.
 * Veri: notifStore (localStorage `vela.notifs.v1`) — topbar widget'ı ile aynı kaynak.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, temiz satır listesi, token renkleri, Lucide ikonlar.
 */

import { useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { useNotifications, notifStore, type Notif } from "@/lib/dashboard/use-notifications";
import { Bell, ArrowLeftRight, Calendar, Info, CheckCheck, Trash2, BellOff } from "lucide-react";

const GREEN = "var(--ais-green)";
const RED = "#d93025";
const AMBER = "var(--ais-amber)";
const BLUE = "var(--ais-accent)";

type FilterKey = "all" | "unread" | Notif["kind"];

// Seçili çip rengi türe göre (KIND_META ile uyumlu): alarm=amber, işlem=yeşil, bilanço/bilgi/genel=mavi.
type Tone = "blue" | "green" | "amber";
const TONE: Record<Tone, { fg: string; bg: string }> = {
  blue: { fg: "var(--ais-accent)", bg: "var(--ais-accent-bg)" },
  green: { fg: "var(--ais-green)", bg: "var(--ais-green-bg)" },
  amber: { fg: "var(--ais-amber)", bg: "var(--ais-amber-bg)" },
};

const FILTERS: { key: FilterKey; label: string; tone: Tone }[] = [
  { key: "all", label: "Tümü", tone: "blue" },
  { key: "unread", label: "Okunmamış", tone: "blue" },
  { key: "alert", label: "Alarm", tone: "amber" },
  { key: "order", label: "İşlem", tone: "green" },
  { key: "earnings", label: "Bilanço", tone: "blue" },
  { key: "info", label: "Bilgi", tone: "blue" },
];

// Bildirim türü → ikon + renk (görev şartnamesi).
const KIND_META: Record<
  Notif["kind"],
  { icon: typeof Bell; color: string; label: string }
> = {
  alert: { icon: Bell, color: AMBER, label: "Alarm" },
  order: { icon: ArrowLeftRight, color: GREEN, label: "İşlem" },
  earnings: { icon: Calendar, color: BLUE, label: "Bilanço" },
  info: { icon: Info, color: "var(--ais-fg-muted)", label: "Bilgi" },
};

function relTime(ts: number, now: number): string {
  if (!ts) return "";
  const s = Math.floor((now - ts) / 1000);
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  if (s < 604800) return `${Math.floor(s / 86400)} gün önce`;
  return new Date(ts).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

// "İşlem" bildirimlerini al/sat'a göre renklendir (yeşil/kırmızı) — şartname.
function orderTone(text: string): string {
  if (/sat[ıi]ş|sell/i.test(text)) return RED;
  return GREEN;
}

export default function NotificationsPage() {
  const notifs = useNotifications();
  const [filter, setFilter] = useState<FilterKey>("all");
  // render içinde Date.now() yok — lazy init ile sabit referans zaman.
  const [now] = useState(() => Date.now());

  const unreadCount = notifs.filter((n) => !n.read).length;

  const filtered = notifs.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.kind === filter;
  });

  return (
    <>
      <Topbar title="Bildirimler" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-3xl px-8 py-10">
          {/* ───────── Başlık + aksiyonlar ───────── */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="d-title">Bildirimler</h1>
              <p className="d-subtitle mt-2">
                {notifs.length === 0
                  ? "Henüz bildirim yok."
                  : unreadCount > 0
                    ? `${unreadCount} okunmamış · toplam ${notifs.length} bildirim`
                    : `Tümü okundu · ${notifs.length} bildirim`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => notifStore.markAllRead()}
                disabled={unreadCount === 0}
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: "var(--ais-line-strong)", color: "var(--ais-fg-muted)" }}
              >
                <CheckCheck size={15} />
                Tümünü okundu işaretle
              </button>
              <button
                onClick={() => notifStore.clear()}
                disabled={notifs.length === 0}
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: "var(--ais-line-strong)", color: RED }}
              >
                <Trash2 size={15} />
                Temizle
              </button>
            </div>
          </div>

          {/* ───────── Filtre çipleri ───────── */}
          <div className="mt-6 flex flex-wrap gap-1.5">
            {FILTERS.map((f) => {
              const on = filter === f.key;
              const t = TONE[f.tone];
              const count =
                f.key === "all"
                  ? notifs.length
                  : f.key === "unread"
                    ? unreadCount
                    : notifs.filter((n) => n.kind === f.key).length;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="rounded-full border px-3 py-1.5 text-[12px] font-medium transition"
                  style={{
                    borderColor: on ? "transparent" : "var(--ais-line)",
                    background: on ? t.bg : "transparent",
                    color: on ? t.fg : "var(--ais-fg-muted)",
                  }}
                >
                  {f.label}
                  {count > 0 && <span className="ml-1.5 opacity-60">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* ───────── Liste ───────── */}
          <section className="mt-8 border-t pt-2" style={{ borderColor: "var(--ais-line)" }}>
            {filtered.length === 0 ? (
              <div
                className="mt-6 grid place-items-center rounded-xl border border-dashed px-6 py-16 text-center"
                style={{ borderColor: "var(--ais-line-strong)" }}
              >
                <BellOff size={28} className="text-[var(--ais-fg-faint)]" />
                <p className="mt-3 text-[14px] font-medium text-[var(--ais-fg)]">
                  {notifs.length === 0 ? "Henüz bildirim yok" : "Bu filtreye uyan bildirim yok"}
                </p>
                <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                  İşlemler, alarmlar ve bilançolar burada görünecek.
                </p>
              </div>
            ) : (
              <ul>
                {filtered.map((n) => {
                  const meta = KIND_META[n.kind];
                  const Icon = meta.icon;
                  const color = n.kind === "order" ? orderTone(n.text) : meta.color;
                  return (
                    <li
                      key={n.id}
                      className="flex items-start gap-3.5 border-b py-4 transition last:border-b-0"
                      style={{ borderColor: "var(--ais-line)" }}
                    >
                      <span
                        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full"
                        style={{ background: "var(--ais-surface-2)", color }}
                      >
                        <Icon size={17} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="badge-soft"
                            style={{
                              background: "var(--ais-surface-2)",
                              color: "var(--ais-fg-faint)",
                            }}
                          >
                            {meta.label}
                          </span>
                          {!n.read && (
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ background: BLUE }}
                              title="Okunmadı"
                            />
                          )}
                        </div>
                        <p
                          className={`mt-1.5 text-[13.5px] leading-relaxed ${n.read ? "text-[var(--ais-fg-muted)]" : "text-[var(--ais-fg)]"}`}
                        >
                          {n.text}
                        </p>
                      </div>
                      {n.ts > 0 && (
                        <span className="num mt-0.5 shrink-0 text-[12px] text-[var(--ais-fg-faint)]">
                          {relTime(n.ts, now)}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
