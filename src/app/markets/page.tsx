import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { PageHero, Section, SectionHeading, CtaBand } from "@/components/site/page-parts";
import { TrendUp, TrendDown, Fire } from "@phosphor-icons/react/dist/ssr";
import { TickerBadge } from "@/components/dashboard/ticker-badge";

export const metadata: Metadata = {
  title: "Piyasalar — Finovela",
  description:
    "Anlık fiyatlar, en çok hareket edenler ve AI tarafından açıklanan piyasa hareketleri. Finovela'ya bir şeyin neden hareket ettiğini sor ve yanıtı bir işleme dönüştür.",
};

const INDICES = [
  ["S&P 500", "5.842,31", "+%0,62", true],
  ["Nasdaq 100", "20.914,77", "+%0,94", true],
  ["Dow Jones", "43.210,08", "-%0,11", false],
  ["Russell 2000", "2.318,44", "+%0,38", true],
];

const GAINERS = [
  ["NVDA", "Nvidia", "$184.22", "+%6,8"],
  ["PLTR", "Palantir", "$92.10", "+%5,1"],
  ["COIN", "Coinbase", "$310.55", "+%4,7"],
  ["AMD", "Adv. Micro", "$168.93", "+%3,9"],
];

const LOSERS = [
  ["INTC", "Intel", "$21.04", "-%4,2"],
  ["PFE", "Pfizer", "$26.81", "-%3,1"],
  ["NKE", "Nike", "$74.55", "-%2,6"],
  ["DIS", "Disney", "$98.12", "-%1,9"],
];

const TRENDING = [
  ["TSLA", "Tesla", "Bilanço beklentiyi aştı — beklenti yükseltildi"],
  ["AAPL", "Apple", "Yeni AI özellikleri duyuruldu"],
  ["BTC", "Bitcoin", "ETF girişleri rekor kırdı"],
  ["MSFT", "Microsoft", "Bulut büyümesi hızlanıyor"],
];

function Row({
  sym,
  name,
  price,
  chg,
  up,
}: {
  sym: string;
  name: string;
  price?: string;
  chg: string;
  up: boolean;
}) {
  return (
    <Link
      href="/app"
      className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-white/15"
    >
      <div className="flex items-center gap-3">
        <TickerBadge symbol={sym} size={32} />
        <div>
          <p className="font-semibold text-white">{sym}</p>
          <p className="text-xs text-white/45">{name}</p>
        </div>
      </div>
      <div className="text-right">
        {price && <p className="text-sm text-white/70">{price}</p>}
        <p
          className="text-sm font-semibold"
          style={{ color: up ? "#34d399" : "#f87171" }}
        >
          {chg}
        </p>
      </div>
    </Link>
  );
}

export default function MarketsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Piyasalar"
        image="/gen/p-markets.png"
        title="Piyasa, açıklanmış haliyle"
        subtitle="Anlık fiyatlar ve hareket edenler — ve sana nedenini söyleyen bir AI. Neler olduğunu ve ne yapman gerektiğini Finovela'ya sormak için herhangi birine dokun."
      />

      {/* endeksler */}
      <section className="relative overflow-hidden bg-[#0a1838]">
        <div className="mx-auto max-w-[1100px] px-6 pb-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INDICES.map(([name, val, chg, up]) => (
              <div
                key={name as string}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-5"
              >
                <p className="text-sm text-white/55">{name}</p>
                <p className="font-display mt-1 text-2xl font-bold text-white">
                  {val}
                </p>
                <p
                  className="mt-1 text-sm font-semibold"
                  style={{ color: (up as boolean) ? "#34d399" : "#f87171" }}
                >
                  {chg}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Section bg="#071026" prev="#0a1838">
        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <h3 className="font-display flex items-center gap-2 text-xl font-bold text-white">
              <TrendUp size={22} weight="fill" className="text-[#34d399]" />
              En çok yükselenler
            </h3>
            <div className="mt-5 space-y-3">
              {GAINERS.map(([s, n, p, c]) => (
                <Row key={s} sym={s} name={n} price={p} chg={c} up />
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-display flex items-center gap-2 text-xl font-bold text-white">
              <TrendDown size={22} weight="fill" className="text-[#f87171]" />
              En çok düşenler
            </h3>
            <div className="mt-5 space-y-3">
              {LOSERS.map(([s, n, p, c]) => (
                <Row key={s} sym={s} name={n} price={p} chg={c} up={false} />
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-display flex items-center gap-2 text-xl font-bold text-white">
              <Fire size={22} weight="fill" className="text-brand" />
              Gündemde
            </h3>
            <div className="mt-5 space-y-3">
              {TRENDING.map(([s, n, why]) => (
                <Link
                  key={s}
                  href="/app"
                  className="block rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 transition hover:border-white/15"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <TickerBadge symbol={s} size={28} />
                      <p className="font-semibold text-white">{s}</p>
                    </div>
                    <p className="text-xs text-white/45">{n}</p>
                  </div>
                  <p className="mt-1 text-xs text-brand">{why}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-white/35">
          Gösterilen fiyatlar temsilîdir. Canlı piyasa verisi Finovela
          uygulamasında mevcuttur.
        </p>
      </Section>

      <CtaBand
        title="Piyasaya her şeyi sor"
        subtitle="“Nvidia bugün neden yükseldi?” Finovela'da hem yanıt var hem de işlem."
        prev="#071026"
      />
    </PageShell>
  );
}
