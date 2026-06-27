"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Delta, TickerBadge } from "@/components/dashboard/ui";
import { GlassCard, SectionLabel } from "@/components/dashboard/cinematic";
import { Sparkline } from "@/components/dashboard/area-chart";
import { useWatchlist } from "@/lib/dashboard/use-watchlist";
import { getUniverseEntry } from "@/lib/market/universe";
import { fmtMoney } from "@/lib/dashboard/data";
import { X } from "@phosphor-icons/react";

/** Canlı + düzenlenebilir watchlist kartı (Overview'da kullanılır). */
export function WatchlistCard() {
  const { list, remove } = useWatchlist();
  const [quotes, setQuotes] = useState<Record<string, { price: number; changePct: number }>>({});
  const key = list.join(",");

  useEffect(() => {
    if (!key) return;
    fetch(`/api/market/quote?symbols=${key}`)
      .then((r) => r.json())
      .then((d: { quotes?: { symbol: string; price: number; changePct: number }[] }) => {
        if (!d.quotes) return;
        const m: Record<string, { price: number; changePct: number }> = {};
        for (const q of d.quotes) m[q.symbol] = { price: q.price, changePct: q.changePct };
        setQuotes(m);
      })
      .catch(() => {});
  }, [key]);

  return (
    <GlassCard hover className="h-full">
      <SectionLabel
        action={
          <Link href="/dashboard/markets" className="flex items-center gap-1 text-xs font-medium text-white/45 transition hover:text-white">
            Piyasalar
          </Link>
        }
      >
        İzleme Listesi
      </SectionLabel>
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/40">
          Henüz sembol yok. Herhangi bir hisse sayfasından ekleyebilirsin.
        </p>
      ) : (
        <div className="space-y-1">
          {list.map((sym) => {
            const u = getUniverseEntry(sym);
            const q = quotes[sym];
            const price = q?.price ?? u.basePrice;
            const chg = q?.changePct ?? 0;
            return (
              <div key={sym} className="vela-row group flex items-center gap-3 rounded-2xl px-2 py-2.5">
                <Link href={`/dashboard/stock/${sym}`} className="flex flex-1 items-center gap-3">
                  <TickerBadge symbol={sym} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{sym}</p>
                    <p className="truncate text-xs text-white/45">{u.name}</p>
                  </div>
                  <Sparkline seed={sym + "x"} up={chg >= 0} width={64} />
                  <div className="w-20 text-right">
                    <p className="font-medium text-white tabular-nums">{fmtMoney(price, u.currency ?? "USD")}</p>
                    <Delta value={chg} className="text-xs" />
                  </div>
                </Link>
                <button
                  onClick={() => remove(sym)}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white/25 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                  aria-label={`${sym} kaldır`}
                >
                  <X size={13} weight="bold" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
}
