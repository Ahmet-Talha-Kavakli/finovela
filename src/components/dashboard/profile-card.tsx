"use client";

// Sohbet içi şirket profili kartı — get_company_profile tool sonucu.
// İsim/sektör + piyasa değeri/çalışan/borsa stat döşemeleri + açıklama.

type CompanyProfile = {
  symbol: string;
  name: string;
  description?: string;
  sector?: string;
  industry?: string;
  country?: string;
  exchange?: string;
  ipo?: string;
  marketCap?: number;
  shareOutstanding?: number;
  weburl?: string;
  employees?: number;
};

export type ProfileData = { profile: CompanyProfile };

// Piyasa değeri provider'larda milyon USD birimindedir (Finnhub konvansiyonu).
function fmtMarketCap(millions?: number): string {
  if (!millions || millions <= 0) return "—";
  const abs = millions;
  if (abs >= 1_000_000) return `$${(abs / 1_000_000).toFixed(2)} T`;
  if (abs >= 1_000) return `$${(abs / 1_000).toFixed(1)} Mlr`;
  return `$${abs.toFixed(0)} Mn`;
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.04] px-3 py-2.5">
      <p className="text-[11px] text-white/45">{label}</p>
      <p className="mt-1 text-[13px] font-semibold text-white tabular-nums">{value}</p>
    </div>
  );
}

export function ProfileCard({ p }: { p: ProfileData }) {
  const c = p.profile;
  return (
    <div className="max-w-md rounded-3xl border border-white/[0.1] bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/[0.06] text-sm font-bold text-white">
          {(c.symbol || c.name || "?")[0]}
        </span>
        <div className="min-w-0">
          <p className="truncate font-bold text-white">{c.name || c.symbol}</p>
          <p className="truncate text-xs text-white/45">
            {[c.sector, c.industry].filter(Boolean).join(" · ") || c.symbol}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Tile label="Piyasa değeri" value={fmtMarketCap(c.marketCap)} />
        <Tile label="Borsa" value={c.exchange || "—"} />
        <Tile label="Çalışan" value={c.employees ? c.employees.toLocaleString("en-US") : "—"} />
        <Tile label="Ülke" value={c.country || "—"} />
      </div>

      {c.description && (
        <p className="mt-3 line-clamp-3 text-[12px] leading-relaxed text-white/55">{c.description}</p>
      )}
    </div>
  );
}
