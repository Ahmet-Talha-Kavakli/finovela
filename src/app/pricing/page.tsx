import type { Metadata } from "next";
import { PageShell } from "@/components/site/page-shell";
import { PageHero, FaqList, CtaBand } from "@/components/site/page-parts";
import { GlassButton } from "@/components/ui/glass-button";
import { PlanCta } from "@/components/site/plan-cta";
import { Fragment } from "react";
import { Check, Minus, Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { PlanId } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Fiyatlandırma — Finovela",
  description:
    "Ücretsiz başla. Sınırsız Claude destekli AI, web araştırma, simülasyon ve derin analiz için Finovela Pro veya Sınırsız'a geç. Şeffaf fiyatlandırma, sürpriz yok.",
};

const TIERS: {
  name: string;
  planId: PlanId;
  price: string;
  cadence: string;
  tagline: string;
  cta: string;
  highlight: boolean;
  features: string[];
}[] = [
  {
    name: "Ücretsiz",
    planId: "free",
    price: "$0",
    cadence: "sonsuza dek",
    tagline: "AI ile araştırma ve analize başlamak için gereken temel her şey.",
    cta: "Ücretsiz başla",
    highlight: false,
    features: [
      "Finovela AI sohbet — günde 20 mesaj",
      "Finovela 1 modeli",
      "Paper trading (sanal işlem) alanı",
      "Temel teknik analiz kartları",
      "Anlık fiyatlar ve haber akışı",
      "3 fiyat alarmı",
      "1 yatırım hedefi",
    ],
  },
  {
    name: "Pro",
    planId: "pro",
    price: "$12",
    cadence: "/ay",
    tagline: "Sınırsız AI, web araştırma ve otomasyonun tamamı.",
    cta: "14 günlük denemeyi başlat",
    highlight: true,
    features: [
      "Sınırsız Finovela AI sohbet",
      "Web araştırma ve canlı kaynak gösterimi",
      "Dosya ve görsel yükleme (bilanço, grafik)",
      "Finovela 1.1 gelişmiş model",
      "Sınırsız simülasyon kuralı ve dengeleme analizi",
      "Sınırsız alarm ve hedef",
      "Strateji kopyalama (simülasyonda)",
      "Gelişmiş teknik analiz ve Finovela Skoru",
    ],
  },
  {
    name: "Sınırsız",
    planId: "unlimited",
    price: "$39",
    cadence: "/ay",
    tagline: "En üst güç: derin araştırma, en güçlü model, öncelik.",
    cta: "Sınırsız'a geç",
    highlight: false,
    features: [
      "Pro'daki her şey",
      "Finovela 1.2 — en güçlü model",
      "Derin araştırma (çok adımlı raporlar)",
      "Öncelikli yanıt ve en yüksek hız limiti",
      "Vergi merkezi — zarar mahsubu analiz asistanı",
      "Sınırsız dosya/görsel ve uzun bağlam",
      "Erken erişim özellikleri",
      "Öncelikli destek",
    ],
  },
];

/**
 * Karşılaştırma matrisi.
 * Hücre değeri: true = ✓, false = —, string = metin.
 */
type Cell = boolean | string;
const COMPARE_GROUPS: {
  group: string;
  rows: { label: string; cells: [Cell, Cell, Cell] }[];
}[] = [
  {
    group: "Yapay zeka",
    rows: [
      { label: "AI sohbet limiti", cells: ["20 / gün", "Sınırsız", "Sınırsız"] },
      { label: "Model seçimi", cells: ["Finovela 1", "Finovela 1 · 1.1", "1 · 1.1 · 1.2"] },
      { label: "Web araştırma", cells: [false, true, true] },
      { label: "Derin araştırma (raporlar)", cells: [false, false, true] },
      { label: "Dosya / görsel yükleme", cells: [false, true, true] },
    ],
  },
  {
    group: "İşlem ve portföy",
    rows: [
      { label: "Paper trading", cells: [true, true, true] },
      { label: "Teknik analiz kartları", cells: ["Temel", "Gelişmiş", "Gelişmiş"] },
      { label: "Finovela Skoru", cells: [false, true, true] },
      { label: "Simülasyon otomasyon kuralları", cells: [false, "Sınırsız", "Sınırsız"] },
      { label: "Strateji kopyalama (simülasyon)", cells: [false, true, true] },
    ],
  },
  {
    group: "Takip ve araçlar",
    rows: [
      { label: "Fiyat alarmları", cells: ["3", "Sınırsız", "Sınırsız"] },
      { label: "Yatırım hedefleri", cells: ["1", "Sınırsız", "Sınırsız"] },
      { label: "Vergi merkezi", cells: [false, false, true] },
      { label: "Öncelikli destek", cells: [false, false, true] },
    ],
  },
];

const FAQ = [
  {
    q: "Ücretsiz plan ne kadar sürüyor?",
    a: "Ücretsiz plan sonsuza dek ücretsizdir. Finovela AI ile günde 20 mesaja, paper trading (simülasyon) alanına ve temel teknik analize erişirsin. Sınırsız AI, web araştırma ve simülasyon otomasyonu için Pro'ya yükseltebilirsin.",
  },
  {
    q: "Finovela 1, 1.1 ve 1.2 arasındaki fark ne?",
    a: "Finovela 1 hızlı ve günlük sorular için idealdir. 1.1 daha derin analiz ve web araştırması yapar. 1.2 en güçlü modelimizdir; çok adımlı derin araştırma ve en karmaşık portföy kararları için Sınırsız planda sunulur.",
  },
  {
    q: "İstediğim zaman iptal edebilir miyim?",
    a: "Kesinlikle. Pro ve Sınırsız aylık esastır; dilediğin an Ücretsiz plana dönebilirsin. Portföyün, sohbet geçmişin ve ayarların olduğu gibi kalır.",
  },
  {
    q: "Pro için ücretsiz deneme var mı?",
    a: "Evet, her yeni kullanıcı 14 günlük Pro denemesi alır — sınırsız AI, web araştırma ve simülasyon otomasyonunun tamamı. Başlamak için kart gerekmez.",
  },
  {
    q: "Para iade garantisi var mı?",
    a: "Evet — ücretli planlarda 30 gün koşulsuz para iade garantisi sunuyoruz. Memnun kalmazsan ilk 30 gün içinde support@finovela.com adresine yaz, tutarın tamamı iade edilir. Soru sormuyoruz. Ayrıntı için İade Politikamıza bakabilirsin.",
  },
  {
    q: "Ödemeyi kim işliyor?",
    a: "Ödeme, faturalandırma, vergi ve iadeler online satıcımız ve Kayıtlı Satıcımız (Merchant of Record) Paddle.com tarafından güvenli şekilde yürütülür. Finovela paranı asla tutmaz; sadece yazılım erişimi için ücret alınır.",
  },
];

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-brand/15 text-brand">
        <Check size={16} weight="bold" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-grid h-7 w-7 place-items-center text-white/25">
        <Minus size={16} weight="bold" />
      </span>
    );
  }
  return <span className="text-sm font-medium text-white">{value}</span>;
}

export default function PricingPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Fiyatlandırma"
        image="/gen/p-pricing.png"
        title={
          <>
            Basit fiyatlandırma.
            <br />
            Ciddi analiz gücü.
          </>
        }
        subtitle="Ücretsiz başla ve Claude destekli Finovela ile araştırmaya giriş yap. Sınırsız AI, web araştırma, simülasyon ve derin analiz istediğinde yükselt."
      />

      {/* fiyat kartları */}
      <section className="relative overflow-hidden bg-[#0a1838]">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-6 pb-32 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-3xl p-8 ${
                t.highlight
                  ? "border-2 border-brand bg-[linear-gradient(180deg,rgba(59,109,255,0.16),rgba(59,109,255,0.03))] shadow-[0_0_60px_rgba(59,109,255,0.3)]"
                  : "border border-white/10 bg-white/[0.03]"
              }`}
            >
              {t.highlight && (
                <span className="absolute -top-3 left-8 inline-flex items-center gap-1 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
                  <Sparkle size={13} weight="fill" /> En popüler
                </span>
              )}
              <h3 className="font-display text-2xl font-bold text-white">
                {t.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {t.tagline}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl font-bold text-white">
                  {t.price}
                </span>
                <span className="text-sm text-white/50">{t.cadence}</span>
              </div>
              <PlanCta planId={t.planId} label={t.cta} highlight={t.highlight} />
              <ul className="mt-8 space-y-3">
                {t.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-white/75"
                  >
                    <Check
                      size={17}
                      weight="bold"
                      className="mt-0.5 shrink-0 text-brand"
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* karşılaştırma tablosu — yüksek kalite matris */}
      <section className="relative overflow-hidden bg-[#071026]">
        <div className="mx-auto max-w-[1080px] px-6 py-28">
          <h2 className="font-display text-center text-[clamp(28px,4vw,40px)] font-bold text-white">
            Planları karşılaştır
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-base text-white/55">
            Her özelliğin hangi planda olduğunu tek bakışta gör.
          </p>

          <div className="mt-12 overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02]">
            <table className="w-full min-w-[640px] border-collapse text-left">
              {/* sütun başlıkları — sticky */}
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#0a1838]">
                  <th className="px-6 py-5 text-sm font-semibold text-white/70">
                    Özellik
                  </th>
                  <th className="px-6 py-5 text-center">
                    <span className="font-display block text-base font-bold text-white">
                      Ücretsiz
                    </span>
                    <span className="mt-0.5 block text-xs text-white/45">
                      $0
                    </span>
                  </th>
                  <th className="relative px-6 py-5 text-center">
                    <span className="absolute inset-x-2 inset-y-0 -z-0 rounded-t-2xl bg-[linear-gradient(180deg,rgba(59,109,255,0.18),transparent)]" />
                    <span className="relative">
                      <span className="font-display block text-base font-bold text-brand">
                        Pro
                      </span>
                      <span className="mt-0.5 block text-xs text-white/45">
                        $12/ay
                      </span>
                    </span>
                  </th>
                  <th className="px-6 py-5 text-center">
                    <span className="font-display block text-base font-bold text-white">
                      Sınırsız
                    </span>
                    <span className="mt-0.5 block text-xs text-white/45">
                      $39/ay
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_GROUPS.map((g) => (
                  <Fragment key={g.group}>
                    {/* grup başlığı */}
                    <tr>
                      <td
                        colSpan={4}
                        className="border-t border-white/8 bg-white/[0.03] px-6 py-3 text-xs font-bold uppercase tracking-wide text-brand-strong"
                      >
                        {g.group}
                      </td>
                    </tr>
                    {g.rows.map((row) => (
                      <tr
                        key={row.label}
                        className="border-t border-white/6 transition hover:bg-white/[0.03]"
                      >
                        <td className="px-6 py-4 text-sm text-white/75">
                          {row.label}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <CellValue value={row.cells[0]} />
                        </td>
                        {/* Pro sütunu vurgulu */}
                        <td className="bg-brand/[0.06] px-6 py-4 text-center">
                          <CellValue value={row.cells[1]} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <CellValue value={row.cells[2]} />
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
                {/* CTA satırı */}
                <tr className="border-t border-white/10">
                  <td className="px-6 py-6" />
                  <td className="px-6 py-6 text-center">
                    <GlassButton href="/app" tone="glass" size="sm">
                      Başla
                    </GlassButton>
                  </td>
                  <td className="bg-brand/[0.06] px-6 py-6 text-center">
                    <GlassButton href="/app" tone="solid" size="sm">
                      Pro&apos;yu dene
                    </GlassButton>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <GlassButton href="/app" tone="glass" size="sm">
                      Sınırsız&apos;a geç
                    </GlassButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SSS */}
      <section className="relative overflow-hidden bg-[#0a1838]">
        <div className="mx-auto max-w-[1000px] px-6 py-28">
          <h2 className="font-display text-center text-[clamp(28px,4vw,40px)] font-bold text-white">
            Fiyatlandırma SSS
          </h2>
          <FaqList items={FAQ} />
        </div>
      </section>

      <CtaBand
        title="Bugün AI ile araştırmaya başla"
        subtitle="Sonsuza dek ücretsiz başla. Claude destekli araştırma ve analiz yardımcın bir mesaj uzağında."
      />
    </PageShell>
  );
}
