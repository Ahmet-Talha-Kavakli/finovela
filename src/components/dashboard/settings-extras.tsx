"use client";

/**
 * Settings ek panelleri — Tercihler + Veri & Gizlilik + Plan kullanım özeti +
 * bağlı borsa hesapları özeti. Hepsi Didit açık-tema deseninde (token renk,
 * kutusuz/border-t, Lucide). İşlevsel: localStorage + /api/state.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUsage } from "@/lib/dashboard/use-usage";
import { toast } from "@/components/dashboard/toast";
import { useConfirm } from "@/components/dashboard/confirm";
import { paperStore } from "@/lib/dashboard/paper-store";
import { CLERK_ENABLED } from "@/lib/auth";
import { useClerk } from "@clerk/nextjs";
import {
  Languages,
  Coins,
  Palette,
  Download,
  Trash2,
  Newspaper,
  Plug,
  CreditCard,
} from "lucide-react";

const ACCENT = "var(--ais-accent)";
const DOWN = "#d93025";
const PREFS_KEY = "vela.prefs.v1";

type Prefs = { lang: "tr" | "en"; currency: "USD" | "TRY"; newsDigest: boolean };
const DEFAULT_PREFS: Prefs = { lang: "tr", currency: "USD", newsDigest: true };

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* yoksay */
  }
}

/* ── Segment seçici (Didit) ── */
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className="rounded-lg border px-3.5 py-1.5 text-[12.5px] font-medium transition"
            style={{
              borderColor: on ? "var(--ais-accent)" : "var(--ais-line-strong)",
              background: on ? "var(--ais-accent-bg)" : "transparent",
              color: on ? "var(--ais-fg)" : "var(--ais-fg-muted)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition"
      style={{ background: on ? ACCENT : "var(--ais-surface-2)" }}
    >
      <span
        className={`h-5 w-5 rounded-full transition ${on ? "translate-x-5" : ""}`}
        style={{ background: on ? "#fff" : "var(--ais-fg-faint)" }}
      />
    </button>
  );
}

function PrefRow({
  icon: Icon,
  label,
  desc,
  control,
}: {
  icon: typeof Languages;
  label: string;
  desc: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-4 last:border-0" style={{ borderColor: "var(--ais-line)" }}>
      <div className="flex items-start gap-3 pr-4">
        <Icon size={18} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
        <div>
          <p className="text-[13px] font-medium text-[var(--ais-fg)]">{label}</p>
          <p className="text-[12px] text-[var(--ais-fg-muted)]">{desc}</p>
        </div>
      </div>
      {control}
    </div>
  );
}

/* ───────────────── Tercihler paneli ───────────────── */
export function PreferencesPanel() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  useEffect(() => {
    setPrefs(loadPrefs()); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  function update(patch: Partial<Prefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
  }

  return (
    <div className="rounded-xl border px-5" style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}>
      <PrefRow
        icon={Languages}
        label="Dil"
        desc="Arayüz dili (kademeli olarak tüm ekranlara yansır)."
        control={
          <Segmented
            value={prefs.lang}
            onChange={(lang) => update({ lang })}
            options={[
              { id: "tr", label: "Türkçe" },
              { id: "en", label: "English" },
            ]}
          />
        }
      />
      <PrefRow
        icon={Coins}
        label="Para birimi"
        desc="Tutarların gösterileceği varsayılan para birimi."
        control={
          <Segmented
            value={prefs.currency}
            onChange={(currency) => update({ currency })}
            options={[
              { id: "USD", label: "USD ($)" },
              { id: "TRY", label: "TRY (₺)" },
            ]}
          />
        }
      />
      <PrefRow
        icon={Newspaper}
        label="Günlük haber özeti"
        desc="Portföyünle ilgili haberlerin sabah özetini al."
        control={<Toggle on={prefs.newsDigest} onClick={() => update({ newsDigest: !prefs.newsDigest })} />}
      />
      <PrefRow
        icon={Palette}
        label="Tema"
        desc="Dashboard koyu, sayfalar açık tema kullanır. Tema seçimi yakında."
        control={
          <span className="rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: "var(--ais-surface-2)", color: "var(--ais-fg-muted)" }}>
            Otomatik
          </span>
        }
      />
    </div>
  );
}

/* ───────────────── Plan + kullanım özeti (Plan tab'a eklenir) ───────────────── */
export function PlanUsageSummary() {
  const { used, limit, remaining, unlimited, loading } = useUsage();
  const pct = unlimited || limit <= 0 ? 100 : Math.max(0, Math.min(100, (used / limit) * 100));

  return (
    <div className="mt-3 rounded-xl border p-5" style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-[var(--ais-fg)]">Bugünkü yapay zeka kullanımı</p>
        <p className="num text-[12.5px] text-[var(--ais-fg-muted)]">
          {loading ? "…" : unlimited ? "Sınırsız" : `${used} / ${limit}`}
        </p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "var(--ais-surface-2)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${unlimited ? 100 : pct}%`,
            background: unlimited ? "var(--ais-green, #16a34a)" : pct > 80 ? "#ef4444" : pct > 50 ? "#f59e0b" : ACCENT,
          }}
        />
      </div>
      <p className="mt-2 text-[12px] text-[var(--ais-fg-muted)]">
        {unlimited
          ? "Planında günlük sohbet limiti yok."
          : loading
            ? "Kullanım yükleniyor…"
            : `Bugün ${remaining} sohbet hakkın kaldı. Limit her gün sıfırlanır.`}
      </p>
    </div>
  );
}

/* ───────────────── Bağlı hesaplar özeti (Güvenlik tab'a eklenir) ───────────────── */
export function ConnectionsSummary() {
  return (
    <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
      <div className="mb-5">
        <h2 className="d-section">Bağlı borsa hesapları</h2>
        <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
          Finovela&apos;ya bağladığın borsa/aracı kurum hesaplarını yönet.
        </p>
      </div>
      <Link
        href="/dashboard/connections"
        className="flex items-center justify-between gap-3 rounded-xl border p-5 transition hover:bg-[var(--ais-surface-2)]"
        style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
      >
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: "var(--ais-accent-bg)", color: ACCENT }}>
            <Plug size={18} />
          </span>
          <div>
            <p className="text-[13.5px] font-medium text-[var(--ais-fg)]">Bağlantıları yönet</p>
            <p className="text-[12px] text-[var(--ais-fg-muted)]">Borsa hesaplarını bağla, izinleri ve senkronizasyonu gör.</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border px-4 py-1.5 text-[12.5px] font-medium text-[var(--ais-fg)]" style={{ borderColor: "var(--ais-line-strong)" }}>
          Aç
        </span>
      </Link>
    </section>
  );
}

/* ───────────────── Veri & Gizlilik paneli ───────────────── */
export function DataPrivacyPanel() {
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  async function resetAll() {
    const ok = await confirm({
      title: "Tüm verilerimi sil",
      message:
        "Portföy, hedefler, hafıza ve tüm yerel tercihlerin kalıcı olarak silinecek ve başlangıç durumuna dönecek. Bu işlem geri alınamaz.",
      confirmLabel: "Verileri sil",
      cancelLabel: "Vazgeç",
      tone: "danger",
    });
    if (!ok) return;
    try {
      // Yerel vela.* anahtarlarını temizle.
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("vela.")) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      // Paper hesabını başlangıca döndür.
      try {
        paperStore.reset();
      } catch {
        /* yoksay */
      }
      toast.success("Veriler sıfırlandı", "Tüm yerel verilerin silindi. Sayfa yenileniyor…");
      setTimeout(() => window.location.reload(), 900);
    } catch {
      toast.error("Sıfırlama başarısız", "Veriler silinirken bir sorun oldu.");
    }
  }

  async function exportData() {
    setBusy(true);
    try {
      // localStorage'taki tüm vela.* anahtarları + sunucudaki state blob'u topla.
      const local: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith("vela.")) continue;
        try {
          local[k] = JSON.parse(localStorage.getItem(k) ?? "null");
        } catch {
          local[k] = localStorage.getItem(k);
        }
      }
      let server: unknown = null;
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (res.ok) {
          const j = await res.json();
          server = j?.blob ?? null;
        }
      } catch {
        /* sunucu erişilemezse sadece local export */
      }
      const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), local, server }, null, 2)],
        { type: "application/json" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finovela-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Veriler indirildi", "Tüm Finovela verilerin JSON olarak kaydedildi.");
    } catch {
      toast.error("İndirme başarısız", "Verilerin dışa aktarılırken bir sorun oldu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Export */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5"
        style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
      >
        <div className="flex items-start gap-3 pr-4">
          <Download size={18} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
          <div>
            <p className="text-[13px] font-medium text-[var(--ais-fg)]">Verilerimi indir</p>
            <p className="text-[12px] text-[var(--ais-fg-muted)]">
              Profil, portföy, hedefler, hafıza ve tercihlerin tek bir JSON dosyasında.
            </p>
          </div>
        </div>
        <button
          onClick={exportData}
          disabled={busy}
          className="shrink-0 rounded-lg px-4 py-2 text-[12.5px] font-medium text-white transition disabled:opacity-50"
          style={{ background: ACCENT }}
        >
          {busy ? "Hazırlanıyor…" : "JSON indir"}
        </button>
      </div>

      {/* Delete / reset */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5"
        style={{ borderColor: "rgba(217,48,37,0.30)", background: "var(--ais-surface)" }}
      >
        <div className="flex items-start gap-3 pr-4">
          <Trash2 size={18} className="mt-0.5 shrink-0" style={{ color: DOWN }} />
          <div>
            <p className="text-[13px] font-medium text-[var(--ais-fg)]">Tüm verilerimi sil / hesabı sıfırla</p>
            <p className="text-[12px] text-[var(--ais-fg-muted)]">
              Portföy, hedefler, hafıza ve yerel tercihlerin başlangıç durumuna döner. Bu işlem geri alınamaz.
            </p>
          </div>
        </div>
        <button
          onClick={resetAll}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border px-4 py-2 text-[12.5px] font-medium transition"
          style={{ borderColor: "rgba(217,48,37,0.30)", color: DOWN }}
        >
          <Trash2 size={14} />
          Verileri sıfırla
        </button>
      </div>

      {CLERK_ENABLED && <ManageAccountDataRow />}
    </div>
  );
}

/** Profil tab'ında Clerk hesap düzenleme linki (ad/e-posta/avatar). */
export function ProfileManageButton() {
  if (!CLERK_ENABLED) {
    return (
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
        style={{ background: "var(--ais-surface-2)", color: "var(--ais-fg-muted)" }}
      >
        Demo hesap
      </span>
    );
  }
  return <ClerkProfileManage />;
}

function ClerkProfileManage() {
  const clerk = useClerk();
  return (
    <button
      onClick={() => clerk.openUserProfile()}
      className="shrink-0 rounded-lg border px-4 py-2 text-[12.5px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
      style={{ borderColor: "var(--ais-line-strong)" }}
    >
      Hesabı düzenle
    </button>
  );
}

function ManageAccountDataRow() {
  const clerk = useClerk();
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5"
      style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
    >
      <div className="flex items-start gap-3 pr-4">
        <CreditCard size={18} className="mt-0.5 shrink-0" style={{ color: ACCENT }} />
        <div>
          <p className="text-[13px] font-medium text-[var(--ais-fg)]">Hesabı yönet / sil</p>
          <p className="text-[12px] text-[var(--ais-fg-muted)]">
            Hesabını kalıcı olarak silmek veya kişisel bilgilerini düzenlemek için hesap ekranını aç.
          </p>
        </div>
      </div>
      <button
        onClick={() => clerk.openUserProfile()}
        className="shrink-0 rounded-lg border px-4 py-2 text-[12.5px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
        style={{ borderColor: "var(--ais-line-strong)" }}
      >
        Hesabı aç
      </button>
    </div>
  );
}
