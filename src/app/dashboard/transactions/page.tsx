"use client";

/**
 * Finovela Geçmiş İşlemler — paper-trade emirleri + AI karar defterindeki
 * gerçekleşen işlemler tek tabloda, zamana göre.
 * Veri: usePaper().orders (paper-store) + useDecisions().decisions (karar defteri).
 * Tasarım dili: Didit — açık tema, kutusuz border-t bölümler, ais-dt tablo,
 * ızgara-ayraçlı metrik şeridi, token renkleri, Lucide ikonlar.
 */

import { useMemo, useState } from "react";
import { Topbar } from "@/components/dashboard/topbar";
import { TickerBadge } from "@/components/dashboard/ui";
import { usePaper } from "@/lib/dashboard/use-portfolio";
import { useDecisions } from "@/lib/dashboard/use-decisions";
import { getUniverseEntry } from "@/lib/market/universe";
import { fmtMoney } from "@/lib/dashboard/data";
import { History, ArrowUpRight, ArrowDownRight, User, Sparkles, Bot } from "lucide-react";

const GREEN = "var(--ais-green)";
const RED = "#d93025";
const BLUE = "var(--ais-accent)";

type Source = "manual" | "ai" | "automation";

type Tx = {
  id: string;
  ts: number;
  side: "BUY" | "SELL";
  symbol: string;
  shares: number;
  price: number;
  source: Source;
};

type FilterKey = "all" | "buy" | "sell" | "ai";

// Seçili çip rengi etikete göre: alım=yeşil, satım=kırmızı, AI/tümü=mavi.
type Tone = "blue" | "green" | "red";
const TONE: Record<Tone, { fg: string; bg: string }> = {
  blue: { fg: "var(--ais-accent)", bg: "var(--ais-accent-bg)" },
  green: { fg: "var(--ais-green)", bg: "var(--ais-green-bg)" },
  red: { fg: "#d93025", bg: "rgba(217,48,37,0.10)" },
};

const FILTERS: { key: FilterKey; label: string; tone: Tone }[] = [
  { key: "all", label: "Tümü", tone: "blue" },
  { key: "buy", label: "Alımlar", tone: "green" },
  { key: "sell", label: "Satımlar", tone: "red" },
  { key: "ai", label: "AI kararları", tone: "blue" },
];

const SOURCE_META: Record<Source, { icon: typeof User; label: string; color: string }> = {
  manual: { icon: User, label: "Manuel", color: "var(--ais-fg-muted)" },
  ai: { icon: Sparkles, label: "AI", color: BLUE },
  automation: { icon: Bot, label: "Otomasyon", color: BLUE },
};

// Karar snapshot'ından işlem detayını çıkar (chat & otomasyon: { symbol, side, shares, price }).
function decisionToTx(d: {
  id: string;
  ts: number;
  snapshot?: Record<string, unknown>;
  rule?: string;
}): Tx | null {
  const snap = d.snapshot ?? {};
  const symbol = typeof snap.symbol === "string" ? snap.symbol : null;
  const side = snap.side === "BUY" || snap.side === "SELL" ? snap.side : null;
  const shares = typeof snap.shares === "number" ? snap.shares : null;
  const price = typeof snap.price === "number" ? snap.price : null;
  if (!symbol || !side || shares == null || price == null) return null;
  // Otomasyon kararlarında snapshot.rule bulunur → kaynak ayrımı.
  const source: Source = "rule" in snap || "tradeValue" in snap ? "automation" : "ai";
  return { id: `dec_${d.id}`, ts: d.ts, side, symbol, shares, price, source };
}

export default function TransactionsPage() {
  const paper = usePaper();
  const { decisions } = useDecisions();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [now] = useState(() => Date.now());

  // Paper emirleri + AI/otomasyon kararlarını birleştir, ts'e yakın AL/SAT
  // eşleşmelerinde paper emrini AI/otomasyon olarak etiketle (çift sayma önle).
  const txs = useMemo<Tx[]>(() => {
    const aiTxs = decisions
      .filter((d) => d.kind === "trade" && d.executed)
      .map(decisionToTx)
      .filter((t): t is Tx => t != null);

    const matched = new Set<string>();
    const base: Tx[] = paper.orders.map((o) => {
      // ±5 sn içinde aynı sembol/yön/adet → AI/otomasyon kaynağı olarak işaretle.
      const hit = aiTxs.find(
        (a) =>
          !matched.has(a.id) &&
          a.symbol === o.symbol &&
          a.side === o.side &&
          Math.abs(a.shares - o.shares) < 1e-4 &&
          Math.abs(a.ts - o.ts) < 5000,
      );
      const source: Source = hit ? hit.source : "manual";
      if (hit) matched.add(hit.id);
      return { id: o.id, ts: o.ts, side: o.side, symbol: o.symbol, shares: o.shares, price: o.price, source };
    });

    // Paper emrine eşleşmeyen AI kararları (örn. harici borsada yürütülmüş) ekle.
    const orphanAi = aiTxs.filter((a) => !matched.has(a.id));

    return [...base, ...orphanAi].sort((a, b) => b.ts - a.ts);
  }, [paper.orders, decisions]);

  const filtered = txs.filter((t) => {
    if (filter === "buy") return t.side === "BUY";
    if (filter === "sell") return t.side === "SELL";
    if (filter === "ai") return t.source === "ai" || t.source === "automation";
    return true;
  });

  // ───────── Metrikler ─────────
  const metrics = useMemo(() => {
    const buyVol = txs.filter((t) => t.side === "BUY").reduce((s, t) => s + t.shares * t.price, 0);
    const sellVol = txs.filter((t) => t.side === "SELL").reduce((s, t) => s + t.shares * t.price, 0);
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const thisMonth = txs.filter((t) => t.ts >= monthStart.getTime()).length;
    return { count: txs.length, buyVol, sellVol, thisMonth };
  }, [txs, now]);

  return (
    <>
      <Topbar title="Geçmiş İşlemler" />
      <div className="ais ais-light min-h-[calc(100vh-64px)]">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* ───────── Başlık ───────── */}
          <div>
            <h1 className="d-title">Geçmiş İşlemler</h1>
            <p className="d-subtitle mt-2 max-w-2xl leading-relaxed">
              Manuel emirler, Finovela AI kararları ve otomasyon — tüm gerçekleşen işlemler tek defterde.
            </p>
          </div>

          {/* ───────── Metrik şeridi (kutusuz ızgara-ayraçlı) ───────── */}
          <div
            className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border lg:grid-cols-4"
            style={{ borderColor: "var(--ais-line)", background: "var(--ais-line)" }}
          >
            <Metric label="Toplam işlem" value={String(metrics.count)} />
            <Metric label="Toplam alım hacmi" value={fmtMoney(metrics.buyVol, "USD")} tone={GREEN} />
            <Metric label="Toplam satım hacmi" value={fmtMoney(metrics.sellVol, "USD")} tone={RED} />
            <Metric label="Bu ay" value={String(metrics.thisMonth)} />
          </div>

          {/* ───────── İşlemler tablosu ───────── */}
          <section className="mt-10 border-t pt-8" style={{ borderColor: "var(--ais-line)" }}>
            <h2 className="d-section mb-4">İşlem geçmişi</h2>

            {/* filtre çipleri */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              {FILTERS.map((f) => {
                const on = filter === f.key;
                const t = TONE[f.tone];
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
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div
                className="grid place-items-center rounded-xl border border-dashed px-6 py-16 text-center"
                style={{ borderColor: "var(--ais-line-strong)" }}
              >
                <History size={28} className="text-[var(--ais-fg-faint)]" />
                <p className="mt-3 text-[14px] font-medium text-[var(--ais-fg)]">
                  {txs.length === 0 ? "Henüz işlem yok" : "Bu filtreye uyan işlem yok"}
                </p>
                <p className="mt-1 text-[12.5px] text-[var(--ais-fg-muted)]">
                  Yaptığın al/sat emirleri ve AI kararları burada listelenecek.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--ais-line)" }}>
                <table className="ais-dt min-w-[720px]">
                  <thead>
                    <tr>
                      <th>TARİH</th>
                      <th>İŞLEM</th>
                      <th>VARLIK</th>
                      <th className="!text-right">ADET</th>
                      <th className="!text-right">FİYAT</th>
                      <th className="!text-right">TUTAR</th>
                      <th>KAYNAK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => {
                      const u = getUniverseEntry(t.symbol);
                      const cur = u.currency ?? "USD";
                      const buy = t.side === "BUY";
                      const src = SOURCE_META[t.source];
                      const SrcIcon = src.icon;
                      return (
                        <tr key={t.id}>
                          <td className="num whitespace-nowrap text-[var(--ais-fg-muted)]">
                            {new Date(t.ts).toLocaleDateString("tr-TR", {
                              day: "2-digit",
                              month: "short",
                              year: "2-digit",
                            })}
                            <span className="ml-1.5 text-[11.5px] text-[var(--ais-fg-faint)]">
                              {new Date(t.ts).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </td>
                          <td>
                            <span
                              className="badge-soft"
                              style={{
                                background: buy ? "var(--ais-green-bg)" : "rgba(217,48,37,0.10)",
                                color: buy ? GREEN : RED,
                              }}
                            >
                              {buy ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                              {buy ? "AL" : "SAT"}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-3">
                              <TickerBadge symbol={t.symbol} size={26} />
                              <div className="min-w-0">
                                <p className="text-[13px] font-medium text-[var(--ais-fg)]">{t.symbol}</p>
                                <p className="truncate text-[12px] text-[var(--ais-fg-muted)]">{u.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="num !text-right">
                            {t.shares < 1 ? t.shares.toFixed(4) : t.shares}
                          </td>
                          <td className="num !text-right">{fmtMoney(t.price, cur)}</td>
                          <td className="num !text-right font-medium">{fmtMoney(t.shares * t.price, cur)}</td>
                          <td>
                            <span
                              className="inline-flex items-center gap-1.5 text-[12.5px]"
                              style={{ color: src.color }}
                            >
                              <SrcIcon size={14} />
                              {src.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

/* ── Kutusuz metrik hücresi (ızgara-ayraçlı şerit) ── */
function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-[var(--ais-surface)] px-5 py-4">
      <p className="text-[11.5px] text-[var(--ais-fg-faint)]">{label}</p>
      <p
        className="num mt-1.5 text-[19px] font-medium tracking-tight"
        style={{ color: tone ?? "var(--ais-fg)" }}
      >
        {value}
      </p>
    </div>
  );
}
