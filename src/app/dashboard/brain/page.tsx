"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Topbar } from "@/components/dashboard/topbar";
import { useConfirm } from "@/components/dashboard/confirm";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { SectionCard } from "@/components/dashboard/ais-kit";
import {
  useBrain,
  AUTHORITY_LABELS,
  type Authority,
} from "@/lib/dashboard/use-brain";
import { useDecisions, type Decision } from "@/lib/dashboard/use-decisions";
import {
  Lightning,
  ShieldCheck,
  ChatCircleDots,
  Power,
  Target,
  TrendUp,
  ArrowsClockwise,
  BellSimple,
  Sparkle,
  Prohibit,
  CaretRight,
  WarningCircle,
} from "@phosphor-icons/react";

// Tema değişkeninden — açık/koyu temada doğru kontrast (sabit açık mavi değil).
const ACCENT = "var(--ais-accent)";

const AUTH_META: Record<Authority, { icon: typeof Lightning }> = {
  full: { icon: Lightning },
  semi: { icon: ShieldCheck },
  advisory: { icon: ChatCircleDots },
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
    // Aynı seçili ise işlem yok.
    if (settings.authority === a) return;

    if (a === "full") {
      // Tam yetki — para kaybı riski olan otonom işlem. Net onay iste.
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
      // Yarım yetki — daha hafif bilgi.
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
    // "advisory" için uyarı yok.

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

  return (
    <>
      <Topbar title="Finovela Brain" />
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <h1 className="text-[22px] font-normal tracking-tight text-[var(--ais-fg)]">Finovela Brain</h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[var(--ais-fg-muted)]">
            Hedeflerine göre sürekli çalışır, sen sınırları belirlersin; her kararı aşağıdaki defterde
            gerekçesiyle kayıtlı.
          </p>

          {/* Dürüst kapsam: motor canlı fiyatla çalışır ve simülasyon hesabında işlem yapar.
              Bağlı gerçek borsada otonom işlem ayrı bir adım (Bağlantılar + tam yetki). */}
          <div
            className="mt-5 flex items-start gap-2.5 rounded-xl border p-3.5"
            style={{ borderColor: "var(--ais-line-strong)", background: "var(--ais-surface)" }}
          >
            <ShieldCheck size={17} weight="fill" className="mt-px shrink-0" style={{ color: ACCENT }} />
            <p className="text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">
              Brain motoru <span className="text-[var(--ais-fg)]">canlı piyasa fiyatıyla</span> sürekli çalışır;
              kuralların ve limitlerin tetiklendiğinde <span className="text-[var(--ais-fg)]">simülasyon (paper) hesabında</span>{" "}
              gerçek işlem yürütür ve her adımı bu deftere yazar. Bağlı borsanda gerçek-para otonom işlem için{" "}
              <Link href="/dashboard/connections" className="underline hover:text-[var(--ais-fg)]">
                hesabını bağlaman
              </Link>{" "}
              ve tam yetkiyi açman gerekir.
            </p>
          </div>

          {/* Kill switch uyarısı */}
          {settings.killSwitch && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#f28b82]/25 bg-[#f28b82]/[0.08] px-4 py-3">
              <Power size={18} weight="bold" className="shrink-0 text-[#f28b82]" />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-[#f28b82]">Acil durdurma aktif</div>
                <div className="text-[12.5px] text-[var(--ais-fg-muted)]">
                  Tüm otonom işlemler durduruldu. Finovela sadece danışmanlık yapıyor.
                </div>
              </div>
              <button
                onClick={onToggleKill}
                className="shrink-0 text-[12.5px] font-medium text-[#f28b82] hover:underline"
              >
                Devam ettir
              </button>
            </div>
          )}

          {/* ───────── Genel bakış (KPI) ───────── */}
          <SectionCard label="Genel bakış" className="mt-10" bodyClassName="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Durum" value={statusText} accent={!settings.killSwitch} />
            <Metric label="Bugün uygulanan" animate={executedToday} format={(n) => `${Math.round(n)}`} sub="otonom işlem" />
            <Metric label="Günlük limit" animate={settings.maxDailyTrades} format={(n) => `${Math.round(n)}`} sub="işlem / gün" />
            <Metric label="Tek işlem tavanı" animate={settings.maxTradePct} format={(n) => `%${Math.round(n)}`} sub="portföyün" />
          </SectionCard>

          {/* ───────── Yetki seviyesi ───────── */}
          <SectionCard
            label="Yetki seviyesi"
            desc="Finovela'nın ne kadar bağımsız hareket edeceğini sen belirlersin."
            className="mt-3"
            bodyClassName="grid gap-3 sm:grid-cols-3"
          >
            {(["full", "semi", "advisory"] as const).map((a) => {
              const Icon = AUTH_META[a].icon;
              const on = settings.authority === a && !settings.killSwitch;
              return (
                <button
                  key={a}
                  onClick={() => onSelectAuthority(a)}
                  disabled={settings.killSwitch}
                  className={`ais-card ais-card-hover relative p-5 text-left disabled:opacity-40 ${
                    on ? "!border-[var(--ais-accent)]/50" : ""
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-lg ${
                      on ? "text-[var(--ais-accent)]" : "text-[var(--ais-fg-muted)]"
                    }`}
                    style={{ background: on ? "var(--ais-accent-bg)" : "var(--ais-surface-2)" }}
                  >
                    <Icon size={18} weight="regular" />
                  </span>
                  <p className="mt-3 text-[14px] font-medium text-[var(--ais-fg)]">{AUTHORITY_LABELS[a].title}</p>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">
                    {AUTHORITY_LABELS[a].desc}
                  </p>
                  {on && (
                    <span className="absolute right-4 top-4 h-2 w-2 rounded-full" style={{ background: ACCENT }} />
                  )}
                </button>
              );
            })}
          </SectionCard>

          {/* ───────── Güven bütçesi ───────── */}
          <SectionCard
            label="Güven bütçesi"
            desc="Tam/yarım yetkide Finovela bu sınırları asla aşmaz."
            className="mt-3"
          >
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-[#fdd663]/20 bg-[#fdd663]/[0.06] px-4 py-3">
              <WarningCircle size={16} weight="regular" className="mt-px shrink-0 text-[#fdd663]" />
              <p className="text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">
                Yatırım risk içerir; para kaybı yaşanabilir. Bu sınırlar seni korumak içindir —
                Finovela onları asla aşmaz.
              </p>
            </div>
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <NumberField label="Tek işlemde portföyün en fazla" value={settings.maxTradePct} min={1} max={50} suffix="%" hint="1–50 arası" onChange={(v) => update({ maxTradePct: v })} />
              <NumberField label="Günlük en fazla otonom işlem" value={settings.maxDailyTrades} min={1} max={30} suffix="işlem" hint="1–30 arası" onChange={(v) => update({ maxDailyTrades: v })} />
              <NumberField label="Tek varlık ağırlığı en fazla" value={settings.maxPositionPct} min={5} max={100} suffix="%" hint="5–100 arası" onChange={(v) => update({ maxPositionPct: v })} />
              <NumberField label="Bu tutar üstü işlemde PIN iste" value={settings.requirePinOver} min={0} max={1000000} prefix="$" hint="Üstünde PIN sorulur" onChange={(v) => update({ requirePinOver: v })} />
            </div>
          </SectionCard>

          {/* ───────── Karar Defteri ───────── */}
          <SectionCard
            label="Karar Defteri"
            desc="Finovela'nın yaptığı ve önerdiği her aksiyon — gerekçesiyle."
            className="mt-3"
            bodyClassName="p-0"
            action={
              decisions.length > 0 ? (
                <button onClick={clear} className="text-[12.5px] text-[var(--ais-fg-faint)] hover:text-[var(--ais-fg)]">
                  Temizle
                </button>
              ) : undefined
            }
          >
            {decisions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <Sparkle size={22} className="text-[var(--ais-fg-faint)]" />
                <p className="max-w-sm text-[13px] text-[var(--ais-fg-muted)]">
                  Henüz kayıt yok. Finovela bir işlem yaptığında veya önerdiğinde burada görünür.
                </p>
                <Link
                  href="/dashboard/chat"
                  className="mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium"
                  style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                >
                  <ChatCircleDots size={14} weight="regular" /> Finovela ile başla
                </Link>
              </div>
            ) : (
              <div className="p-2">
                {decisions.map((d) => (
                  <DecisionRow key={d.id} d={d} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* ───────── Alt eylemler ───────── */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {!settings.killSwitch && (
              <div className="ais-card flex items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#f28b82]/12 text-[#f28b82]">
                    <Power size={18} weight="regular" />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Acil durdurma</p>
                    <p className="text-[12px] text-[var(--ais-fg-muted)]">Tüm otonom işlemleri durdur.</p>
                  </div>
                </div>
                <button
                  onClick={onToggleKill}
                  className="shrink-0 rounded-lg border border-[#f28b82]/30 px-3 py-1.5 text-[12.5px] font-medium text-[#f28b82] transition hover:bg-[#f28b82]/10"
                >
                  Durdur
                </button>
              </div>
            )}

            <Link href="/dashboard/goals" className="ais-card ais-card-hover flex items-center justify-between gap-3 p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg text-[var(--ais-accent)]" style={{ background: "var(--ais-accent-bg)" }}>
                  <Target size={18} weight="regular" />
                </span>
                <div>
                  <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Hedeflerin pusula</p>
                  <p className="text-[12px] text-[var(--ais-fg-muted)]">Finovela ana hedefine göre karar verir.</p>
                </div>
              </div>
              <CaretRight size={14} className="shrink-0 text-[var(--ais-fg-faint)]" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Bölüm başlığı (AI Studio "Overview" stili) ── */
function Section({
  label,
  desc,
  action,
  className = "",
}: {
  label: string;
  desc?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex items-end justify-between gap-3 ${className}`}>
      <div>
        <h2 className="text-[15px] font-medium text-[var(--ais-fg)]">{label}</h2>
        {desc && <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── KPI metriği (borderless-ish mat kart) ── */
function Metric({
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
  /** Sayısal değer verilirse count-up animasyonu uygulanır. */
  animate?: number;
  format?: (n: number) => string;
}) {
  return (
    <div className="ais-card p-4">
      <p className="text-[12px] text-[var(--ais-fg-faint)]">{label}</p>
      <p
        className="num mt-2 text-[20px] font-normal tracking-tight"
        style={{ color: accent ? ACCENT : "var(--ais-fg)" }}
      >
        {typeof animate === "number" ? (
          <AnimatedNumber value={animate} format={format} />
        ) : (
          value
        )}
      </p>
      {sub && <p className="mt-1 text-[12px] text-[var(--ais-fg-muted)]">{sub}</p>}
    </div>
  );
}

const KIND_META: Record<Decision["kind"], { icon: typeof TrendUp; color: string }> = {
  trade: { icon: TrendUp, color: "#81c995" },
  rebalance: { icon: ArrowsClockwise, color: ACCENT },
  alert: { icon: BellSimple, color: "#fdd663" },
  insight: { icon: Sparkle, color: ACCENT },
  blocked: { icon: Prohibit, color: "#f28b82" },
};

function DecisionRow({ d }: { d: Decision }) {
  const meta = KIND_META[d.kind] ?? KIND_META.insight;
  const Icon = meta.icon;
  return (
    <div className="ais-row flex gap-3 px-3 py-3">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{ background: `${meta.color}1f`, color: meta.color }}
      >
        <Icon size={15} weight="regular" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-[var(--ais-fg)]">{d.action}</p>
          {!d.executed && (
            <span className="rounded-full border border-[var(--ais-line-strong)] px-2 py-0.5 text-[10.5px] text-[var(--ais-fg-muted)]">
              Öneri
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--ais-fg-muted)]">{d.rationale}</p>
        <p className="num mt-1 text-[11px] text-[var(--ais-fg-faint)]">
          {new Date(d.ts).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          {d.authority ? ` · ${d.authority}` : ""}
        </p>
      </div>
    </div>
  );
}

/* Elle yazılabilir sayı alanı — slider yerine. Yazarken serbest, odak çıkınca
   min/max aralığına sıkıştırır (kullanıcı geçersiz değer kaydedemez). */
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
  const [draft, setDraft] = useState<string>(String(value));
  // Dışarıdan değer değişirse (örn. risk profili) taslağı senkronla.
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

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
      <div className="flex items-center gap-2 rounded-xl border border-[var(--ais-line-strong)] bg-[var(--ais-surface)] px-3.5 transition focus-within:border-[var(--ais-accent)] focus-within:ring-2 focus-within:ring-[var(--ais-accent)]/15">
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
