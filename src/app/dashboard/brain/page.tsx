"use client";

/**
 * Finovela Brain — otonom yönetici kontrol paneli (Blok 3).
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-b ayraçlı
 * bölümler, sol-açıklama / sağ-kontrol satır deseni, ais-dt dense tablo.
 * Kabuk komple Didit Settings sayfası (Account/Team/Security) deseninden alınmıştır.
 */

import { useState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { useConfirm } from "@/components/dashboard/confirm";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import {
  useBrain,
  AUTHORITY_LABELS,
  type Authority,
} from "@/lib/dashboard/use-brain";
import { useDecisions, type Decision } from "@/lib/dashboard/use-decisions";
// Didit ince-çizgi (1.5 stroke, 24 viewBox) ikon dili → Lucide.
import {
  Zap,
  ShieldCheck,
  MessageCircle,
  Power,
  Target,
  TrendingUp,
  RefreshCw,
  Bell,
  Sparkles,
  Ban,
  ChevronRight,
  Check,
  Trash2,
} from "lucide-react";

const ACCENT = "var(--ais-accent)";

const AUTH_META: Record<Authority, { icon: typeof Zap }> = {
  full: { icon: Zap },
  semi: { icon: ShieldCheck },
  advisory: { icon: MessageCircle },
};

export default function BrainPage() {
  const { settings, update, setAuthority, toggleKillSwitch } = useBrain();
  const { decisions, clear } = useDecisions();
  const confirm = useConfirm();

  const startOfDay = (() => {
    if (typeof window === "undefined") return 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  })();
  const executedToday = decisions.filter((d) => d.ts >= startOfDay && d.executed).length;

  async function onSelectAuthority(a: Authority) {
    if (settings.authority === a) return;

    if (a === "full") {
      const ok = await confirm({
        title: "Tam yetki — risk uyarısı",
        message:
          "Finovela senden onay almadan otomatik al/sat yapacak. Yatırımda para kaybı riski vardır; geçmiş getiri geleceğin garantisi değildir. Güven bütçesi sınırların geçerli kalır. Onaylıyor musun?",
        confirmLabel: "Onaylıyorum",
        cancelLabel: "Vazgeç",
        tone: "danger",
      });
      if (!ok) return;
    } else if (a === "semi") {
      const ok = await confirm({
        title: "Yarım yetki",
        message:
          "Finovela planlar ve hazırlar, ama her işlemi gerçekleştirmeden önce onayını ister. Son karar sende kalır.",
        confirmLabel: "Devam et",
        cancelLabel: "Vazgeç",
        tone: "neutral",
      });
      if (!ok) return;
    }
    setAuthority(a);
  }

  async function onToggleKill() {
    if (!settings.killSwitch) {
      const ok = await confirm({
        title: "Acil durdurma",
        message:
          "Finovela'nın TÜM otonom işlemleri anında durdurulacak. Sadece sohbet ve öneri açık kalır. Devam edilsin mi?",
        confirmLabel: "Durdur",
        cancelLabel: "Vazgeç",
        tone: "danger",
      });
      if (!ok) return;
    }
    toggleKillSwitch();
  }

  const statusText = settings.killSwitch
    ? "Durduruldu"
    : settings.authority === "advisory"
      ? "Danışman modunda"
      : settings.authority === "semi"
        ? "Onaylı modda çalışıyor"
        : "Tam otonom çalışıyor";

  const live = !settings.killSwitch;

  return (
    <>
      <Topbar title="Finovela Brain" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="d-title">Finovela Brain</h1>
                <StatusChip live={live} text={statusText} />
              </div>
              <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
                Hedeflerine göre sürekli çalışır, sınırları sen belirlersin. Aldığı her karar
                aşağıdaki defterde gerekçesiyle kayıtlı.
              </p>
            </div>
          </div>

          {/* ───────── Dürüst kapsam notu (Didit "You're connected" yeşil bandı) ───────── */}
          <div
            className="mt-6 flex items-start gap-2.5 rounded-xl px-4 py-3"
            style={{ background: "var(--ais-green-bg)" }}
          >
            <ShieldCheck size={16} className="mt-px shrink-0" style={{ color: "var(--ais-green)" }} />
            <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--ais-fg-muted)" }}>
              Brain motoru <span className="text-[var(--ais-fg)]">canlı piyasa fiyatıyla</span> sürekli
              çalışır; kuralların tetiklendiğinde <span className="text-[var(--ais-fg)]">simülasyon (paper)
              hesabında</span> gerçek işlem yürütür ve her adımı bu deftere yazar. Bağlı borsanda
              gerçek-para otonom işlem için{" "}
              <Link href="/dashboard/connections" className="font-medium underline" style={{ color: ACCENT }}>
                hesabını bağlaman
              </Link>{" "}
              ve tam yetkiyi açman gerekir.
            </p>
          </div>

          {/* ───────── Kill switch aktif uyarısı ───────── */}
          {settings.killSwitch && (
            <div
              className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "rgba(229,57,53,0.08)" }}
            >
              <Power size={17} className="shrink-0" style={{ color: "#d93025" }} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium" style={{ color: "#d93025" }}>
                  Acil durdurma aktif
                </div>
                <div className="text-[12.5px]" style={{ color: "var(--ais-fg-muted)" }}>
                  Tüm otonom işlemler durduruldu. Finovela sadece danışmanlık yapıyor.
                </div>
              </div>
              <button
                onClick={onToggleKill}
                className="shrink-0 text-[12.5px] font-medium hover:underline"
                style={{ color: "#d93025" }}
              >
                Devam ettir
              </button>
            </div>
          )}

          {/* ───────── Genel bakış — Didit "Usage" üst metrik şeridi (kutusuz, dikey ayraçlı) ───────── */}
          <div className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4"
            style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
          >
            <Stat label="Durum" value={statusText} accent={live} />
            <Stat label="Bugün uygulanan" animate={executedToday} format={(n) => `${Math.round(n)}`} sub="otonom işlem" />
            <Stat label="Günlük limit" animate={settings.maxDailyTrades} format={(n) => `${Math.round(n)}`} sub="işlem / gün" />
            <Stat label="Tek işlem tavanı" animate={settings.maxTradePct} format={(n) => `%${Math.round(n)}`} sub="portföyün" />
          </div>

          {/* ───────── Yetki seviyesi (Didit Settings satır deseni: sol açıklama / sağ kontrol) ───────── */}
          <SettingsBlock
            title="Yetki seviyesi"
            desc="Finovela'nın ne kadar bağımsız hareket edeceğini belirler. İstediğin an değiştirebilirsin."
          >
            <div className="grid gap-2.5 sm:grid-cols-3">
              {(["full", "semi", "advisory"] as const).map((a) => {
                const Icon = AUTH_META[a].icon;
                const on = settings.authority === a && live;
                return (
                  <button
                    key={a}
                    onClick={() => onSelectAuthority(a)}
                    disabled={settings.killSwitch}
                    className="relative rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      borderColor: on ? ACCENT : "var(--ais-line)",
                      background: on ? "var(--ais-accent-bg)" : "var(--ais-surface)",
                      boxShadow: on ? "0 0 0 1px var(--ais-accent)" : "none",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="grid h-8 w-8 place-items-center rounded-lg"
                        style={{
                          background: on ? "rgba(37,103,255,0.14)" : "var(--ais-surface-2)",
                          color: on ? ACCENT : "var(--ais-fg-muted)",
                        }}
                      >
                        <Icon size={16} />
                      </span>
                      {on && (
                        <span
                          className="grid h-5 w-5 place-items-center rounded-full"
                          style={{ background: ACCENT, color: "#fff" }}
                        >
                          <Check size={12} strokeWidth={2.5} />
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-[13.5px] font-medium text-[var(--ais-fg)]">
                      {AUTHORITY_LABELS[a].title}
                    </p>
                    <p className="mt-1 text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">
                      {AUTHORITY_LABELS[a].desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </SettingsBlock>

          {/* ───────── Güven bütçesi ───────── */}
          <SettingsBlock
            title="Güven bütçesi"
            desc="Tam ve yarım yetkide Finovela bu sınırları asla aşmaz — seni korumak içindir."
          >
            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
              <NumberField label="Tek işlemde portföyün en fazla" value={settings.maxTradePct} min={1} max={50} suffix="%" hint="1–50 arası" onChange={(v) => update({ maxTradePct: v })} />
              <NumberField label="Günlük en fazla otonom işlem" value={settings.maxDailyTrades} min={1} max={30} suffix="işlem" hint="1–30 arası" onChange={(v) => update({ maxDailyTrades: v })} />
              <NumberField label="Tek varlık ağırlığı en fazla" value={settings.maxPositionPct} min={5} max={100} suffix="%" hint="5–100 arası" onChange={(v) => update({ maxPositionPct: v })} />
              <NumberField label="Bu tutar üstü işlemde PIN iste" value={settings.requirePinOver} min={0} max={1000000} prefix="$" hint="Üstünde PIN sorulur" onChange={(v) => update({ requirePinOver: v })} />
            </div>
          </SettingsBlock>

          {/* ───────── Karar Defteri (Didit ais-dt tablo + empty state) ───────── */}
          <SettingsBlock
            title="Karar Defteri"
            desc="Finovela'nın yaptığı ve önerdiği her aksiyon — gerekçesiyle, denetlenebilir."
            action={
              decisions.length > 0 ? (
                <button
                  onClick={clear}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium text-[var(--ais-fg-muted)] transition hover:border-[#d93025]/30 hover:bg-[rgba(217,48,37,0.08)] hover:text-[#d93025]"
                  style={{ borderColor: "var(--ais-line-strong)" }}
                >
                  <Trash2 size={14} /> Temizle
                </button>
              ) : undefined
            }
          >
            {decisions.length === 0 ? (
              <div
                className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-16 text-center"
                style={{ borderColor: "var(--ais-line-strong)" }}
              >
                <Sparkles size={22} style={{ color: "var(--ais-fg-faint)" }} />
                <p className="text-[14px] font-medium text-[var(--ais-fg)]">Henüz kayıt yok</p>
                <p className="max-w-sm text-[12.5px] text-[var(--ais-fg-muted)]">
                  Finovela bir işlem yaptığında veya önerdiğinde, gerekçesiyle birlikte burada görünür.
                </p>
                <Link
                  href="/dashboard/chat"
                  className="pill-primary mt-2"
                >
                  <MessageCircle size={15} /> Finovela ile başla
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                <table className="ais-dt">
                  <thead>
                    <tr>
                      <th>AKSİYON</th>
                      <th>GEREKÇE</th>
                      <th className="w-28 !text-right">DURUM</th>
                      <th className="w-32 !text-right">ZAMAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decisions.map((d) => (
                      <DecisionRow key={d.id} d={d} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SettingsBlock>

          {/* ───────── Alt eylemler (Didit "Need a custom..." soft footer satırı) ───────── */}
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
            <Link
              href="/dashboard/goals"
              className="flex items-center justify-between gap-3 rounded-xl border p-4 transition hover:bg-[var(--ais-surface-2)]"
              style={{ borderColor: "var(--ais-line)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                >
                  <Target size={17} />
                </span>
                <div>
                  <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Hedeflerin pusula</p>
                  <p className="text-[12px] text-[var(--ais-fg-muted)]">Finovela ana hedefine göre karar verir.</p>
                </div>
              </div>
              <ChevronRight size={15} className="shrink-0" style={{ color: "var(--ais-fg-faint)" }} />
            </Link>

            {live && (
              <div
                className="flex items-center justify-between gap-3 rounded-xl border p-4"
                style={{ borderColor: "var(--ais-line)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-lg"
                    style={{ background: "rgba(229,57,53,0.10)", color: "#d93025" }}
                  >
                    <Power size={17} />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Acil durdurma</p>
                    <p className="text-[12px] text-[var(--ais-fg-muted)]">Tüm otonom işlemleri anında durdur.</p>
                  </div>
                </div>
                <button
                  onClick={onToggleKill}
                  className="shrink-0 rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition"
                  style={{ borderColor: "rgba(229,57,53,0.30)", color: "#d93025" }}
                >
                  Durdur
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Başlık durum chip'i (Didit "Active" yeşil pill) ── */
function StatusChip({ live, text }: { live: boolean; text: string }) {
  const color = live ? "var(--ais-green)" : "#d93025";
  const bg = live ? "var(--ais-green-bg)" : "rgba(229,57,53,0.10)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
      style={{ background: bg, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {text}
    </span>
  );
}

/* ── Üst metrik (kutusuz, ızgara ayraçlı — Didit Usage şeridi) ── */
function Stat({
  label,
  value,
  sub,
  accent,
  animate,
  format,
}: {
  label: string;
  value?: string;
  sub?: string;
  accent?: boolean;
  animate?: number;
  format?: (n: number) => string;
}) {
  return (
    <div className="bg-[var(--ais-surface)] px-5 py-4">
      <p className="text-[11.5px] text-[var(--ais-fg-faint)]">{label}</p>
      <p
        className="num mt-2 text-[19px] font-medium tracking-tight"
        style={{ color: accent ? "var(--ais-green)" : "var(--ais-fg)" }}
      >
        {typeof animate === "number" ? <AnimatedNumber value={animate} format={format} /> : value}
      </p>
      {sub && <p className="mt-0.5 text-[11.5px] text-[var(--ais-fg-muted)]">{sub}</p>}
    </div>
  );
}

/* ── Ayar bloğu — Didit Settings deseni: üst border ayraç + sol başlık/açıklama + içerik ── */
function SettingsBlock({
  title,
  desc,
  action,
  children,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="d-section">{title}</h2>
          {desc && <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">{desc}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

const KIND_META: Record<Decision["kind"], { icon: typeof TrendingUp; color: string; label: string }> = {
  trade: { icon: TrendingUp, color: "var(--ais-green)", label: "İşlem" },
  rebalance: { icon: RefreshCw, color: ACCENT, label: "Dengeleme" },
  alert: { icon: Bell, color: "var(--ais-amber)", label: "Uyarı" },
  insight: { icon: Sparkles, color: ACCENT, label: "İçgörü" },
  blocked: { icon: Ban, color: "#d93025", label: "Engellendi" },
};

function DecisionRow({ d }: { d: Decision }) {
  const meta = KIND_META[d.kind] ?? KIND_META.insight;
  const Icon = meta.icon;
  return (
    <tr>
      <td>
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
            style={{ background: "color-mix(in srgb, currentColor 12%, transparent)", color: meta.color }}
          >
            <Icon size={14} />
          </span>
          <span className="font-medium text-[var(--ais-fg)]">{d.action}</span>
        </div>
      </td>
      <td>
        <span className="text-[var(--ais-fg-muted)]">{d.rationale}</span>
      </td>
      <td className="w-28 !text-right">
        {d.executed ? (
          <span className="badge-soft badge-green">Uygulandı</span>
        ) : (
          <span className="badge-soft" style={{ background: "var(--ais-soft)", color: "var(--ais-fg-muted)" }}>
            Öneri
          </span>
        )}
      </td>
      <td className="w-32 !text-right">
        <span className="num whitespace-nowrap text-[12px] text-[var(--ais-fg-faint)]">
          {new Date(d.ts).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </td>
    </tr>
  );
}

/* ── Elle yazılabilir sayı alanı (Didit input — odakta mavi çerçeve) ── */
function NumberField({
  label,
  value,
  min,
  max,
  prefix = "",
  suffix = "",
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  prefix?: string;
  suffix?: string;
  hint?: string;
  onChange: (v: number) => void;
}) {
  // Yerel taslak: kullanıcı silip baştan yazabilsin diye string tutulur.
  // Dışarıdan değer değişirse (örn. risk profili) render sırasında senkronla —
  // useEffect+setState cascading-render önerisinden kaçınmak için kontrollü desen.
  const [draft, setDraft] = useState<string>(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }

  function commit(raw: string) {
    const n = Number(raw.replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(n)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, n));
    onChange(clamped);
    setDraft(String(clamped));
  }

  return (
    <div>
      <label className="mb-2 block text-[13px] text-[var(--ais-fg-muted)]">{label}</label>
      <div
        className="flex items-center gap-2 rounded-xl border px-3.5 transition focus-within:border-[var(--ais-accent)] focus-within:ring-2 focus-within:ring-[var(--ais-accent)]/15"
        style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface)" }}
      >
        {prefix && <span className="text-[14px] text-[var(--ais-fg-faint)]">{prefix}</span>}
        <input
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9.]/g, ""))}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="num h-11 w-full bg-transparent text-[15px] font-medium text-[var(--ais-fg)] outline-none"
        />
        {suffix && <span className="shrink-0 text-[13px] text-[var(--ais-fg-faint)]">{suffix}</span>}
      </div>
      {hint && <p className="mt-1.5 text-[11.5px] text-[var(--ais-fg-faint)]">{hint}</p>}
    </div>
  );
}
