"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useScrollLock } from "@/lib/dashboard/use-scroll-lock";
import {
  MagnifyingGlass,
  TrendUp,
  SquaresFour,
  ChatCircleDots,
  ChartPieSlice,
  Stack,
  Cards,
  Coins,
  StackSimple,
  Robot,
  BellSimple,
  UsersThree,
  UsersFour,
  CalendarBlank,
  Gear,
  ArrowRight,
  Sparkle,
  Receipt,
  Scales,
  ChartBar,
  Funnel,
  Newspaper,
} from "@phosphor-icons/react";
import { TickerBadge } from "@/components/dashboard/ui";
import { UNIVERSE } from "@/lib/market/universe";

type SearchHit = { symbol: string; name: string; type?: string };

const PAGES = [
  { label: "Genel Bakış", href: "/dashboard", icon: SquaresFour },
  { label: "Finovela Sohbet", href: "/dashboard/chat", icon: ChatCircleDots },
  { label: "Portföy", href: "/dashboard/portfolio", icon: ChartPieSlice },
  { label: "Analizler", href: "/dashboard/analytics", icon: ChartBar },
  { label: "Piyasalar", href: "/dashboard/markets", icon: TrendUp },
  { label: "Tarama", href: "/dashboard/screener", icon: Funnel },
  { label: "Haberler", href: "/dashboard/news", icon: Newspaper },
  { label: "Akıllı Portföyler", href: "/dashboard/portfolios", icon: Stack },
  { label: "Yapay Zeka Portföyleri", href: "/dashboard/generated", icon: Sparkle },
  { label: "Opsiyonlar", href: "/dashboard/options", icon: Cards },
  { label: "Tahviller & Bonolar", href: "/dashboard/bonds", icon: Receipt },
  { label: "Kazan", href: "/dashboard/earn", icon: Coins },
  { label: "Vergi Merkezi", href: "/dashboard/tax", icon: Scales },
  { label: "Strateji", href: "/dashboard/strategy", icon: StackSimple },
  { label: "Otomasyon", href: "/dashboard/automation", icon: Robot },
  { label: "Alarmlar", href: "/dashboard/alerts", icon: BellSimple },
  { label: "Kopya İşlem", href: "/dashboard/copy", icon: UsersThree },
  { label: "Akış", href: "/dashboard/feed", icon: UsersFour },
  { label: "Araştırma", href: "/dashboard/research", icon: MagnifyingGlass },
  { label: "Bilançolar", href: "/dashboard/earnings", icon: CalendarBlank },
  { label: "Ayarlar", href: "/dashboard/settings", icon: Gear },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const router = useRouter();
  useScrollLock(open);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ⌘K / Ctrl+K aç
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setHits([]);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // canlı sembol arama (debounce) — önce evren, sonra finnhub
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const query = q.trim();
    if (!query) { setHits([]); return; }
    const local = UNIVERSE.filter(
      (u) => u.symbol.toLowerCase().includes(query.toLowerCase()) || u.name.toLowerCase().includes(query.toLowerCase()),
    ).slice(0, 5).map((u) => ({ symbol: u.symbol, name: u.name }));
    setHits(local);
    timer.current = setTimeout(() => {
      fetch(`/api/market/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d: { results?: SearchHit[] }) => {
          const remote = (d.results ?? []).slice(0, 6);
          const merged = [...local];
          for (const r of remote) if (!merged.some((m) => m.symbol === r.symbol)) merged.push(r);
          setHits(merged.slice(0, 8));
        })
        .catch(() => {});
    }, 200);
  }, [q]);

  const pageHits = q.trim()
    ? PAGES.filter((p) => p.label.toLowerCase().includes(q.toLowerCase())).slice(0, 5)
    : PAGES.slice(0, 6);

  // birleşik liste (klavye navigasyonu için)
  type Item = { kind: "stock" | "page"; symbol?: string; name?: string; label?: string; href?: string };
  const items: Item[] = [
    ...hits.map((h) => ({ kind: "stock" as const, symbol: h.symbol, name: h.name })),
    ...pageHits.map((p) => ({ kind: "page" as const, label: p.label, href: p.href })),
  ];

  const go = useCallback(
    (it: Item) => {
      setOpen(false);
      if (it.kind === "stock") router.push(`/dashboard/stock/${it.symbol}`);
      else if (it.href) router.push(it.href);
    },
    [router],
  );

  if (!open) return null;

  return (
    <div className="vela-modal-backdrop fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-md" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0f0f10] shadow-2xl shadow-black/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.08] px-4">
          <MagnifyingGlass size={18} className="text-white/40" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, items.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter" && items[active]) { e.preventDefault(); go(items[active]); }
            }}
            placeholder="Hisse, sayfa veya komut ara…"
            className="flex-1 bg-transparent py-4 text-[15px] text-white placeholder:text-white/35 focus:outline-none"
          />
          <kbd className="rounded bg-white/[0.08] px-1.5 py-0.5 text-[10px] text-white/40">ESC</kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {hits.length > 0 && (
            <Section title="Hisseler">
              {hits.map((h, i) => (
                <Row key={h.symbol} activeRow={active === i} onClick={() => go({ kind: "stock", symbol: h.symbol })}>
                  <TickerBadge symbol={h.symbol} size={28} />
                  <span className="font-semibold text-white">{h.symbol}</span>
                  <span className="truncate text-sm text-white/45">{h.name}</span>
                  <ArrowRight size={14} className="ml-auto text-white/25" />
                </Row>
              ))}
            </Section>
          )}
          <Section title="Sayfalar">
            {pageHits.map((p, i) => (
              <Row key={p.href} activeRow={active === hits.length + i} onClick={() => go({ kind: "page", href: p.href })}>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.06] text-white/70">
                  <p.icon size={15} />
                </span>
                <span className="text-white">{p.label}</span>
                <ArrowRight size={14} className="ml-auto text-white/25" />
              </Row>
            ))}
          </Section>
          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-white/35">Sonuç yok.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-1">
      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/30">{title}</p>
      {children}
    </div>
  );
}

function Row({ activeRow, onClick, children }: { activeRow: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${activeRow ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}
    >
      {children}
    </button>
  );
}
