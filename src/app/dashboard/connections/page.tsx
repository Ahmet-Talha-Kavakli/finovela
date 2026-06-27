"use client";

/**
 * Finovela Bağlantılar — aracı kurum / borsa / cüzdan / banka entegrasyonları.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ızgara-ayraçlı metrik şeridi, token renkleri, Lucide ikonlar.
 */

import { Topbar } from "@/components/dashboard/topbar";
import { useConfirm } from "@/components/dashboard/confirm";
import { useState } from "react";
import { AnimatedNumber } from "@/components/dashboard/animated-number";
import { ExchangeConnectModal } from "@/components/dashboard/exchange-connect-modal";
import {
  useConnections,
  CONNECTIONS,
  type ConnectionCategory,
  type ConnectionDef,
} from "@/lib/dashboard/use-connections";
import { BrandGlyph, hasBrandGlyph } from "@/components/dashboard/connection-logo";
import {
  Landmark,
  Wallet,
  LineChart,
  Bitcoin,
  Building2,
  Check,
  ShieldCheck,
  RefreshCw,
  Plus,
  Unplug,
  Database,
} from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const ACCENT = "var(--ais-accent)";

const CAT_META: Record<ConnectionCategory, { label: string; icon: typeof Landmark }> = {
  broker: { label: "Aracı Kurumlar", icon: Building2 },
  exchange: { label: "Kripto Borsaları", icon: Bitcoin },
  wallet: { label: "Cüzdanlar", icon: Wallet },
  bank: { label: "Bankalar", icon: Landmark },
  data: { label: "Veri Sağlayıcılar", icon: LineChart },
};

const ORDER: ConnectionCategory[] = ["broker", "exchange", "wallet", "bank", "data"];

/* Marka renkleri — logo gelene kadar baş-harf rozetini markaya tonla. */
const BRAND: Record<string, string> = {
  alpaca: "#ffd400",
  ibkr: "#d81222",
  midas: "#7c5cff",
  binance: "#f0b90b",
  coinbase: "#0052ff",
  metamask: "#f6851b",
  ziraat: "#e30613",
  finnhub: "#1db954",
  twelvedata: "#3b82f6",
};

/* Bağlı bir entegrasyonun mock olarak içe aktardığı varlık sayısı. */
function mockAssets(c: ConnectionDef): number {
  switch (c.category) {
    case "broker":
      return 12;
    case "exchange":
      return 7;
    case "wallet":
      return 4;
    case "bank":
      return 2;
    case "data":
      return 0;
  }
}

function relTime(since: number): string {
  const diff = Date.now() - since;
  const m = Math.round(diff / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.round(h / 24)} gün önce`;
}

function ConnLogo({ c, on }: { c: ConnectionDef; on: boolean }) {
  const color = BRAND[c.id] ?? ACCENT;
  const brand = hasBrandGlyph(c.id);
  return (
    <span
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[15px] font-semibold transition"
      style={{
        background: on ? `${color}1f` : "var(--ais-surface-2)",
        color: on ? color : "var(--ais-fg-muted)",
        boxShadow: `inset 0 0 0 1px ${on ? `${color}40` : "var(--ais-line)"}`,
      }}
    >
      {brand ? (
        <span style={{ opacity: on ? 1 : 0.85 }}>
          <BrandGlyph id={c.id} size={22} color={color} />
        </span>
      ) : (
        c.name[0]
      )}
    </span>
  );
}

// Gerçek API-anahtarı akışı gerektiren borsalar (modal ile bağlanır).
const REAL_EXCHANGES = new Set(["binance"]);

export default function ConnectionsPage() {
  const { state, isConnected, toggle, connectedCount } = useConnections();
  const confirm = useConfirm();
  // Gerçek borsa bağlama modalı (binance vb.)
  const [connectModal, setConnectModal] = useState<ConnectionDef | null>(null);

  const activeCats = new Set(
    CONNECTIONS.filter((c) => isConnected(c.id)).map((c) => c.category),
  ).size;
  const importedAssets = CONNECTIONS.filter((c) => isConnected(c.id)).reduce(
    (sum, c) => sum + mockAssets(c),
    0,
  );
  const liveFeeds = CONNECTIONS.filter((c) => c.live && isConnected(c.id)).length;

  async function onToggle(c: ConnectionDef) {
    if (isConnected(c.id)) {
      const ok = await confirm({
        title: "Bağlantıyı kaldır",
        message: `${c.name} bağlantısı kaldırılacak.`,
        confirmLabel: "Kaldır",
        cancelLabel: "Vazgeç",
        tone: "danger",
      });
      if (ok) {
        // Gerçek borsada sunucudaki şifreli anahtarları da sil.
        if (REAL_EXCHANGES.has(c.id)) {
          await fetch(`/api/exchange/connect?exchange=${c.id}`, { method: "DELETE" }).catch(() => {});
        }
        toggle(c.id);
      }
      return;
    }
    // Gerçek borsa: API-anahtarı modalı aç (doğrula + şifreli kaydet).
    if (REAL_EXCHANGES.has(c.id)) {
      setConnectModal(c);
      return;
    }
    if (!c.live) {
      const ok = await confirm({
        title: `${c.name} bağlan`,
        message:
          "Bu entegrasyon şu an demo modunda — gerçek hesabın bağlanmaz, sadece akış simüle edilir. Gerçek bağlantı yakında. Demo bağlantısı kurulsun mu?",
        confirmLabel: "Demo bağla",
        cancelLabel: "Vazgeç",
        tone: "neutral",
      });
      if (ok) toggle(c.id);
      return;
    }
    toggle(c.id);
  }

  return (
    <>
      <Topbar title="Bağlantılar" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Bağlantılar</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Finovela&apos;yı aracı kurumlarına, borsalara, cüzdanlara ve bankana bağla — varlıklarını
              tek yerden gör ve yönet. Bağlantılar uçtan uca şifreli; yalnızca verdiğin yetki kadar
              erişim verirsin.
            </p>
          </div>

          {/* ───────── Özet (kutusuz ızgara-ayraçlı şerit) ───────── */}
          <div
            className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4"
            style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
          >
            <Stat
              label="Aktif bağlantı"
              animate={connectedCount}
              format={(n) => `${Math.round(n)}`}
              sub={`${CONNECTIONS.length} entegrasyondan`}
              color={connectedCount > 0 ? UP : undefined}
            />
            <Stat
              label="Kapsanan kategori"
              animate={activeCats}
              format={(n) => `${Math.round(n)}`}
              sub={`${ORDER.length} kategoriden`}
            />
            <Stat
              label="İçe aktarılan varlık"
              animate={importedAssets}
              format={(n) => `${Math.round(n)}`}
              sub="senkronize pozisyon"
            />
            <Stat
              label="Canlı veri akışı"
              animate={liveFeeds}
              format={(n) => `${Math.round(n)}`}
              sub="gerçek zamanlı kaynak"
              color={ACCENT}
            />
          </div>

          {/* ───────── Kategoriler ───────── */}
          {ORDER.map((cat) => {
            const items = CONNECTIONS.filter((c) => c.category === cat);
            if (!items.length) return null;
            const Meta = CAT_META[cat];
            const liveInCat = items.filter((c) => isConnected(c.id)).length;
            return (
              <section key={cat} className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
                <div className="mb-5 flex items-end justify-between gap-3">
                  <h2 className="d-section">{Meta.label}</h2>
                  <span className="flex items-center gap-2 text-[12px] text-[var(--ais-fg-faint)]">
                    {liveInCat > 0 && (
                      <span className="text-[var(--ais-fg-muted)]">
                        {liveInCat}/{items.length} bağlı
                      </span>
                    )}
                    <Meta.icon size={16} />
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((c) => {
                    const on = isConnected(c.id);
                    const since = state[c.id]?.since;
                    return (
                      <div
                        key={c.id}
                        className="flex flex-col gap-3 rounded-xl border p-4 transition"
                        style={{
                          borderColor: on ? "rgba(37,103,255,0.3)" : "var(--ais-line)",
                          background: "var(--ais-surface)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <ConnLogo c={c} on={on} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[14px] font-medium text-[var(--ais-fg)]">{c.name}</p>
                              {on ? (
                                <span className="badge-soft badge-green">Bağlı</span>
                              ) : c.live ? (
                                <span className="badge-soft badge-green">Canlı</span>
                              ) : (
                                <span className="badge-soft badge-amber">Demo</span>
                              )}
                            </div>
                            <p className="mt-1 text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">
                              {c.desc}
                            </p>
                          </div>
                        </div>

                        {/* alt satır: durum + aksiyon */}
                        <div
                          className="mt-auto flex items-center justify-between gap-2 border-t pt-3"
                          style={{ borderColor: "var(--ais-line)" }}
                        >
                          {on ? (
                            <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-[var(--ais-fg-muted)]">
                              <RefreshCw size={12} className="shrink-0" style={{ color: UP }} />
                              <span className="truncate">
                                Senkron · {since ? relTime(since) : "az önce"}
                                {mockAssets(c) > 0 ? ` · ${mockAssets(c)} varlık` : ""}
                              </span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--ais-fg-faint)]">
                              <Unplug size={12} /> Bağlı değil
                            </span>
                          )}

                          {on ? (
                            <button
                              onClick={() => onToggle(c)}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium text-[var(--ais-fg)] transition hover:bg-[var(--ais-surface-2)]"
                              style={{ borderColor: "var(--ais-line-strong)" }}
                            >
                              <Check size={12} /> Kaldır
                            </button>
                          ) : (
                            <button
                              onClick={() => onToggle(c)}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium text-white transition hover:brightness-[1.06]"
                              style={{ background: ACCENT }}
                            >
                              <Plus size={12} /> Bağla
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* ───────── Güvenlik notu ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className="flex items-start gap-3 rounded-xl border p-5"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{ background: "var(--ais-green-bg)", color: UP }}
                >
                  <ShieldCheck size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--ais-fg)]">Token tabanlı, sıfır parola</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">
                    Finovela kimlik bilgilerini asla saklamaz; bağlantılar token tabanlıdır ve istediğin
                    an tek tıkla kaldırılır.
                  </p>
                </div>
              </div>
              <div
                className="flex items-start gap-3 rounded-xl border p-5"
                style={{ borderColor: "var(--ais-line)", background: "var(--ais-surface)" }}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{ background: "var(--ais-accent-bg)", color: ACCENT }}
                >
                  <Database size={18} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--ais-fg)]">Yetki kadar erişim</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">
                    Tam yetkili işlemler için ayrıca{" "}
                    <span className="text-[var(--ais-fg)]">Finovela Brain</span> güven bütçesi geçerlidir —
                    sınırları sen belirlersin.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Gerçek borsa bağlama modalı (API key doğrulama + şifreli kayıt) */}
      {connectModal && (
        <ExchangeConnectModal
          exchange={connectModal.id}
          exchangeName={connectModal.name}
          onClose={() => setConnectModal(null)}
          onConnected={() => {
            // Sunucuda doğrulandı + kaydedildi → yerel bağlantı durumunu da işaretle.
            if (!isConnected(connectModal.id)) toggle(connectModal.id);
            setConnectModal(null);
          }}
        />
      )}
    </>
  );
}

/* ── Üst metrik (kutusuz ızgara şeridi — Didit Usage) ── */
function Stat({
  label,
  animate,
  format,
  sub,
  color,
}: {
  label: string;
  animate: number;
  format: (n: number) => string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[var(--ais-surface)] px-5 py-4">
      <p className="text-[11.5px] text-[var(--ais-fg-faint)]">{label}</p>
      <p className="num mt-2 text-[19px] font-medium tracking-tight" style={{ color: color ?? "var(--ais-fg)" }}>
        <AnimatedNumber value={animate} format={format} />
      </p>
      {sub && <p className="mt-0.5 text-[12px] text-[var(--ais-fg-muted)]">{sub}</p>}
    </div>
  );
}
