"use client";

/**
 * Finovela Bağlantılar — aracı kurum / borsa / cüzdan / banka entegrasyonları.
 * Tasarım dili: Didit (business.didit.me) — açık tema, kutusuz, border-t ayraçlı
 * bölümler, ızgara-ayraçlı metrik şeridi, token renkleri, Lucide ikonlar.
 * Logolar: çok-kaynaklı gerçek marka logosu (simple-icons CDN → Clearbit → rozet).
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
import { ConnectionLogo } from "@/components/dashboard/connection-logo";
import {
  Landmark,
  Wallet,
  LineChart,
  Bitcoin,
  Building2,
  ShieldCheck,
  RefreshCw,
  Plus,
  X,
  Database,
  Dot,
} from "lucide-react";

// Didit açık-tema renkleri — beyaz zeminde okunur.
const UP = "var(--ais-green)";
const ACCENT = "var(--ais-accent)";

const CAT_META: Record<
  ConnectionCategory,
  { label: string; icon: typeof Landmark; hint: string }
> = {
  broker: { label: "Aracı Kurumlar", icon: Building2, hint: "Hisse & ETF hesapları" },
  exchange: { label: "Kripto Borsaları", icon: Bitcoin, hint: "Spot kripto & bakiye" },
  wallet: { label: "Cüzdanlar", icon: Wallet, hint: "On-chain salt-okunur" },
  bank: { label: "Bankalar", icon: Landmark, hint: "Open Banking nakit" },
  data: { label: "Veri Sağlayıcılar", icon: LineChart, hint: "Canlı piyasa akışı" },
};

const ORDER: ConnectionCategory[] = ["broker", "exchange", "wallet", "bank", "data"];

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
            className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border lg:grid-cols-4"
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
            const connectedInCat = items.filter((c) => isConnected(c.id)).length;
            return (
              <section key={cat} className="mt-12 border-t pt-9" style={{ borderColor: "var(--ais-line)" }}>
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                      style={{ background: "var(--ais-surface-2)", color: "var(--ais-fg-muted)" }}
                    >
                      <Meta.icon size={16} />
                    </span>
                    <div>
                      <h2 className="d-section leading-tight">{Meta.label}</h2>
                      <p className="text-[12px] leading-tight text-[var(--ais-fg-faint)]">{Meta.hint}</p>
                    </div>
                  </div>
                  <span className="text-[12px] text-[var(--ais-fg-faint)]">
                    {connectedInCat > 0 ? (
                      <span style={{ color: UP }}>{connectedInCat} bağlı</span>
                    ) : (
                      `${items.length} platform`
                    )}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((c) => {
                    const on = isConnected(c.id);
                    const since = state[c.id]?.since;
                    return (
                      <div
                        key={c.id}
                        className="conn-card group flex flex-col gap-4 rounded-2xl border p-5"
                        style={{
                          borderColor: on ? "rgba(15,125,74,0.28)" : "var(--ais-line)",
                          background: "var(--ais-surface)",
                        }}
                      >
                        <div className="flex items-start gap-3.5">
                          <ConnectionLogo id={c.id} name={c.name} size={48} on={on} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[14.5px] font-medium text-[var(--ais-fg)]">{c.name}</p>
                              {on ? (
                                <span className="badge-soft badge-green">
                                  <span
                                    className="inline-block h-1.5 w-1.5 rounded-full"
                                    style={{ background: "currentColor" }}
                                  />
                                  Senkron
                                </span>
                              ) : c.live ? (
                                <span className="badge-soft badge-green">Canlı</span>
                              ) : (
                                <span className="badge-soft badge-amber">Demo</span>
                              )}
                            </div>
                            <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">
                              {c.desc}
                            </p>
                          </div>
                        </div>

                        {/* alt satır: durum + aksiyon */}
                        <div
                          className="mt-auto flex items-center justify-between gap-2 border-t pt-3.5"
                          style={{ borderColor: "var(--ais-line)" }}
                        >
                          {on ? (
                            <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-[var(--ais-fg-muted)]">
                              <RefreshCw size={12} className="shrink-0" style={{ color: UP }} />
                              <span className="truncate">
                                {since ? relTime(since) : "az önce"}
                                {mockAssets(c) > 0 ? ` · ${mockAssets(c)} varlık` : ""}
                              </span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11.5px] text-[var(--ais-fg-faint)]">
                              <Dot size={16} className="-mx-1.5" /> Bağlı değil
                            </span>
                          )}

                          {on ? (
                            <button
                              onClick={() => onToggle(c)}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-medium text-[var(--ais-fg-muted)] transition hover:border-[var(--ais-line-strong)] hover:bg-[var(--ais-surface-2)] hover:text-[var(--ais-fg)]"
                              style={{ borderColor: "var(--ais-line)" }}
                            >
                              <X size={12} /> Kaldır
                            </button>
                          ) : (
                            <button
                              onClick={() => onToggle(c)}
                              className="inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-white transition hover:brightness-[1.06]"
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
          <section className="mt-12 border-t pt-9" style={{ borderColor: "var(--ais-line)" }}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className="flex items-start gap-3 rounded-2xl border p-5"
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
                className="flex items-start gap-3 rounded-2xl border p-5"
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
