import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageShell } from "@/components/site/page-shell";
import { PageHero, Section, SectionHeading, CtaBand } from "@/components/site/page-parts";
import {
  Robot,
  Lightning,
  Leaf,
  Bank,
  CurrencyBtc,
  Pill,
  RocketLaunch,
  ChartLineUp,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Hisse Listeleri — Finovela",
  description:
    "Her tema için özenle seçilmiş, AI tarafından oluşturulan izleme listeleri — yapay zekâ, temiz enerji, kripto, temettü ve daha fazlası. Birine dokunarak tüm sepete yatırım yap.",
};

const LISTS: {
  icon: React.ComponentType<{ size?: number; weight?: "duotone"; className?: string }>;
  name: string;
  count: number;
  perf: string;
  desc: string;
  image?: string;
}[] = [
  { icon: Robot, name: "Yapay Zekâ ve Yarı İletkenler", count: 24, perf: "+%31", desc: "Yapay zekâ patlamasına güç veren şirketler.", image: "/gen/card-stocks-ai.png" },
  { icon: Leaf, name: "Temiz Enerji", count: 18, perf: "+%12", desc: "Güneş, rüzgâr, depolama ve elektrikli araçlar.", image: "/gen/card-stocks-enerji.png" },
  { icon: CurrencyBtc, name: "Kripto Maruziyeti", count: 15, perf: "+%44", desc: "Dijital varlıklara bağlı hisseler ve ETF'ler." },
  { icon: Bank, name: "Temettü Aristokratları", count: 30, perf: "+%8", desc: "On yıllardır artan temettüler.", image: "/gen/card-stocks-temettu.png" },
  { icon: Pill, name: "Sağlıkta Yenilikçiler", count: 21, perf: "+%15", desc: "Biyoteknoloji ve medikal teknoloji liderleri.", image: "/gen/card-stocks-saglik.png" },
  { icon: RocketLaunch, name: "Uzay Ekonomisi", count: 12, perf: "+%19", desc: "Fırlatma, uydular ve savunma." },
  { icon: Lightning, name: "Yüksek Momentum", count: 20, perf: "+%27", desc: "En güçlü trendler, haftalık yenilenir.", image: "/gen/card-stocks-buyume.png" },
  { icon: ChartLineUp, name: "Muhteşem Yedili", count: 7, perf: "+%22", desc: "Piyasayı hareket ettiren dev şirketler.", image: "/gen/card-stocks-yari.png" },
];

export default function StocklistsPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Hisse Listeleri"
        image="/gen/p-stocklists.png"
        title="Sembollere değil, fikirlere yatır"
        subtitle="Her tema için özenle seçilmiş, AI tarafından oluşturulan sepetler. İncele, takip et ya da tüm listeye tek dokunuşla yatırım yap — Finovela güncel tutar."
      />

      <Section bg="#0a1838" prev="#0c1d40">
        <SectionHeading
          eyebrow="Seçilmiş listeler"
          title="İzlemeye değer temalar"
          subtitle="Her liste Finovela'nın modelleri tarafından taranır ve bakımı yapılır — piyasa hareket ettikçe güncellenir."
        />
        <div className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {LISTS.map((l) => (
            <Link
              key={l.name}
              href="/app"
              className="group rounded-3xl border border-white/8 bg-white/[0.03] p-6 transition hover:border-white/15 hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between">
                {l.image ? (
                  <Image
                    src={l.image}
                    alt=""
                    width={128}
                    height={128}
                    className="-ml-1 h-28 w-28 object-contain"
                  />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand/15 text-brand">
                    <l.icon size={22} weight="duotone" />
                  </span>
                )}
                <span className="rounded-full bg-[#34d399]/15 px-2.5 py-1 text-xs font-semibold text-[#6ee7b7]">
                  {l.perf} 1y (yıl)
                </span>
              </div>
              <h3 className="font-display mt-5 text-lg font-bold text-white">
                {l.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">
                {l.desc}
              </p>
              <p className="mt-4 text-xs text-white/40">{l.count} varlık</p>
            </Link>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-white/35">
          Performans rakamları temsilîdir. Geçmiş performans gelecekteki
          sonuçları garanti etmez.
        </p>
      </Section>

      <CtaBand
        title="Bir sonraki büyük fikrini bul"
        subtitle="Tüm listeleri ücretsiz incele — tüm bir temaya tek dokunuşla yatırım yap."
        prev="#0a1838"
      />
    </PageShell>
  );
}
