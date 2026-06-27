"use client";

import { Topbar } from "@/components/dashboard/topbar";
import {
  PageTitle,
  SectionCard,
  Btn,
  Pill,
  IconChip,
  Metric,
  AIS_UP,
  AIS_WARN,
  AIS_ACCENT,
} from "@/components/dashboard/ais-kit";
import { useConfirm } from "@/components/dashboard/confirm";
import { useState } from "react";
import { ExchangeConnectModal } from "@/components/dashboard/exchange-connect-modal";
import {
  useConnections,
  CONNECTIONS,
  type ConnectionCategory,
  type ConnectionDef,
} from "@/lib/dashboard/use-connections";
import { BrandGlyph, hasBrandGlyph } from "@/components/dashboard/connection-logo";
import {
  Bank,
  Wallet,
  ChartLine,
  CurrencyBtc,
  Buildings,
  Check,
  ShieldCheck,
  ArrowsClockwise,
  Plus,
  Plugs,
  Database,
} from "@phosphor-icons/react";

const CAT_META: Record<ConnectionCategory, { label: string; icon: typeof Bank }> = {
  broker: { label: "Aracı Kurumlar", icon: Buildings },
  exchange: { label: "Kripto Borsaları", icon: CurrencyBtc },
  wallet: { label: "Cüzdanlar", icon: Wallet },
  bank: { label: "Bankalar", icon: Bank },
  data: { label: "Veri Sağlayıcılar", icon: ChartLine },
};

const ORDER: ConnectionCategory[] = ["broker", "exchange", "wallet", "bank", "data"];

/* Marka renkleri — logo gelene kadar baş-harf rozetini markaya tonla. Başka bir
   agent gerçek logoları eklediğinde bu rozet temiz bir fallback olarak kalır. */
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

/* Bağlı bir entegrasyonun mock olarak içe aktardığı varlık sayısı (kategoriye
   göre makul bir aralık) — yalnız görsel zenginlik; gerçek veri değil. */
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
  const color = BRAND[c.id] ?? "#8ab4f8";
  const brand = hasBrandGlyph(c.id);
  return (
    <span
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[15px] font-semibold transition"
      style={{
        background: on ? `${color}26` : "rgba(255,255,255,0.04)",
        color: on ? color : "var(--ais-fg-muted)",
        boxShadow: `inset 0 0 0 1px ${on ? `${color}40` : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {brand ? (
        // Gerçek marka logosu — marka renginde (bağlı değilken hafif soluk).
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
      <div className="ais min-h-[calc(100vh-64px)]">
        <div className="max-w-7xl px-8 py-10">
          <PageTitle
            title="Bağlantılar"
            desc="Finovela'yı aracı kurumlarına, borsalara, cüzdanlara ve bankana bağla — varlıklarını tek yerden gör ve yönet. Bağlantılar uçtan uca şifreli; Finovela'ya yalnızca verdiğin yetki kadar erişim verirsin."
          />

          {/* ───────── Özet ───────── */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric
              label="Aktif bağlantı"
              animate={connectedCount}
              format={(n) => `${Math.round(n)}`}
              sub={`${CONNECTIONS.length} entegrasyondan`}
              color={connectedCount > 0 ? AIS_UP : undefined}
            />
            <Metric
              label="Kapsanan kategori"
              animate={activeCats}
              format={(n) => `${Math.round(n)}`}
              sub={`${ORDER.length} kategoriden`}
            />
            <Metric
              label="İçe aktarılan varlık"
              animate={importedAssets}
              format={(n) => `${Math.round(n)}`}
              sub="senkronize pozisyon"
            />
            <Metric
              label="Canlı veri akışı"
              animate={CONNECTIONS.filter((c) => c.live && isConnected(c.id)).length}
              format={(n) => `${Math.round(n)}`}
              sub="gerçek zamanlı kaynak"
              color={AIS_ACCENT}
            />
          </div>

          {/* ───────── Kategoriler ───────── */}
          {ORDER.map((cat, i) => {
            const items = CONNECTIONS.filter((c) => c.category === cat);
            if (!items.length) return null;
            const Meta = CAT_META[cat];
            const liveInCat = items.filter((c) => isConnected(c.id)).length;
            return (
              <SectionCard
                key={cat}
                label={Meta.label}
                className={i === 0 ? "mt-3" : "mt-3"}
                bodyClassName="grid gap-3 sm:grid-cols-2"
                action={
                  <span className="flex items-center gap-2 text-[12px] text-[var(--ais-fg-faint)]">
                    {liveInCat > 0 && (
                      <span className="text-[var(--ais-fg-muted)]">
                        {liveInCat}/{items.length} bağlı
                      </span>
                    )}
                    <Meta.icon size={16} weight="regular" />
                  </span>
                }
              >
                {items.map((c) => {
                  const on = isConnected(c.id);
                  const since = state[c.id]?.since;
                  return (
                    <div
                      key={c.id}
                      className={`ais-card ais-card-hover flex flex-col gap-3 p-4 ${
                        on ? "!border-[var(--ais-accent)]/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <ConnLogo c={c} on={on} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[14px] font-medium text-[var(--ais-fg)]">{c.name}</p>
                            {on ? (
                              <Pill color={AIS_UP} dot>
                                Bağlı
                              </Pill>
                            ) : c.live ? (
                              <Pill color={AIS_UP}>Canlı</Pill>
                            ) : (
                              <Pill color={AIS_WARN}>Demo</Pill>
                            )}
                          </div>
                          <p className="mt-1 text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">
                            {c.desc}
                          </p>
                        </div>
                      </div>

                      {/* alt satır: durum + aksiyon */}
                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--ais-line)] pt-3">
                        {on ? (
                          <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-[var(--ais-fg-muted)]">
                            <ArrowsClockwise
                              size={12}
                              weight="regular"
                              className="shrink-0"
                              style={{ color: AIS_UP }}
                            />
                            <span className="truncate">
                              Senkron · {since ? relTime(since) : "az önce"}
                              {mockAssets(c) > 0 ? ` · ${mockAssets(c)} varlık` : ""}
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--ais-fg-faint)]">
                            <Plugs size={12} weight="regular" /> Bağlı değil
                          </span>
                        )}

                        {on ? (
                          <Btn variant="default" size="sm" onClick={() => onToggle(c)}>
                            <Check size={12} weight="regular" /> Kaldır
                          </Btn>
                        ) : (
                          <Btn variant="primary" size="sm" onClick={() => onToggle(c)}>
                            <Plus size={12} weight="regular" /> Bağla
                          </Btn>
                        )}
                      </div>
                    </div>
                  );
                })}
              </SectionCard>
            );
          })}

          {/* ───────── Güvenlik notu ───────── */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="ais-card flex items-start gap-3 p-5">
              <IconChip icon={ShieldCheck} color={AIS_UP} size={38} />
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-[var(--ais-fg)]">Token tabanlı, sıfır parola</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[var(--ais-fg-muted)]">
                  Finovela kimlik bilgilerini asla saklamaz; bağlantılar token tabanlıdır ve istediğin an
                  tek tıkla kaldırılır.
                </p>
              </div>
            </div>
            <div className="ais-card flex items-start gap-3 p-5">
              <IconChip icon={Database} color={AIS_ACCENT} size={38} />
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
