import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { Section, SectionHeading } from "@/components/site/page-parts";
import { AIBeam } from "@/components/site/ai-beam";
import {
  Plugs,
  ChartLineUp,
  MagnifyingGlass,
  Brain,
  ShieldCheck,
  Lightning,
  ArrowRight,
} from "@phosphor-icons/react/dist/ssr";

export const metadata: Metadata = {
  title: "Finovela MCP — Tüm yapay zekâlar Finovela'ya bağlanır",
  description:
    "Finovela MCP sunucusuyla Claude, ChatGPT, Gemini ve diğer yapay zekâ istemcileri Finovela'nın canlı piyasa-zekâsı araçlarına bağlanır: fiyat, teknik analiz, duyarlılık, what-if. Yatırım tavsiyesi değildir.",
};

const TOOLS = [
  { icon: ChartLineUp, name: "get_quote", desc: "Hisse, kripto, BIST, forex, emtia için canlı fiyat." },
  { icon: MagnifyingGlass, name: "search_symbols", desc: "İsme/sembole göre yatırım aracı arama." },
  { icon: Brain, name: "get_technicals", desc: "RSI, MACD, Bollinger, hareketli ortalama snapshot'ı." },
  { icon: ChartLineUp, name: "get_sentiment", desc: "Haber/analist duyarlılığı + fiyat hedefi." },
  { icon: Lightning, name: "whatif_simulation", desc: "Monte Carlo senaryo: iyimser/baz/kötümser." },
  { icon: ShieldCheck, name: "get_company_profile", desc: "Sektör, piyasa değeri, şirket profili." },
];

export default function McpPage() {
  return (
    <PageShell>
      {/* Hero — bağlantı ışını */}
      <section className="relative overflow-hidden bg-[radial-gradient(120%_120%_at_50%_-10%,#16306b_0%,#0c1d40_55%,#0a1838_100%)]">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 pb-24 pt-44 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <span className="text-gradient text-base font-bold">Finovela MCP</span>
            <h1 className="font-display mt-5 text-[clamp(34px,5vw,56px)] font-bold leading-[1.1] text-white">
              Tüm yapay zekâlar Finovela&apos;ya bağlanır
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/60 lg:mx-0">
              Model Context Protocol (MCP) sunucumuzla Claude, ChatGPT, Gemini ve diğer
              istemciler Finovela&apos;nın canlı piyasa-zekâsını doğrudan kullanır — fiyat,
              teknik analiz, duyarlılık, what-if. Tek bir uçtan, güvenli.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <a
                href="#kurulum"
                className="inline-flex items-center gap-2 rounded-full bg-[#2b5cf0] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Nasıl bağlanır <ArrowRight size={16} weight="bold" />
              </a>
              <a
                href="https://finovela.com/api/mcp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.06]"
              >
                Uç noktayı gör
              </a>
            </div>
          </div>
          <AIBeam />
        </div>
      </section>

      {/* Araçlar */}
      <Section bg="#0a1838">
        <SectionHeading
          eyebrow="Araçlar"
          title="MCP üzerinden gelen yetenekler"
          subtitle="Her araç gerçek piyasa verisine bağlı. Hiçbir çıktı yatırım tavsiyesi değildir."
        />
        <div className="mx-auto mt-14 grid max-w-[1000px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <div key={t.name} className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#2b5cf0]/15 text-[#7fb0ff]">
                <t.icon size={22} weight="regular" />
              </span>
              <p className="font-display mt-4 text-[15px] font-bold text-white">
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px]">{t.name}</code>
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-white/55">{t.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Kurulum */}
      <Section bg="#071026" prev="#0a1838">
        <div id="kurulum" className="-mt-24 pt-24" />
        <SectionHeading
          eyebrow="Kurulum"
          title="Saniyeler içinde bağlan"
          subtitle="Streamable HTTP transport — modern MCP istemcileriyle uyumlu."
        />
        <div className="mx-auto mt-12 max-w-2xl space-y-5">
          {[
            { n: 1, t: "Uç noktayı al", d: "MCP istemcine (Claude Desktop, vb.) remote MCP sunucusu olarak şu adresi ekle:" },
            { n: 2, t: "İstemcide tanımla", d: "İstemcinin MCP yapılandırmasına Finovela sunucusunu ekle; araçlar otomatik listelenir." },
            { n: 3, t: "Kullan", d: "Artık yapay zekâna 'NVDA teknik durumu' ya da '10.000$ 5 yılda ne olur' diye sor — Finovela araçları yanıtı besler." },
          ].map((s) => (
            <div key={s.n} className="flex gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2b5cf0] text-base font-bold text-white">
                {s.n}
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-white">{s.t}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-white/60">{s.d}</p>
                {s.n === 1 && (
                  <code className="mt-3 block rounded-xl border border-white/[0.08] bg-[#0a1838] px-4 py-3 text-[13px] text-[#7fb0ff]">
                    https://finovela.com/api/mcp
                  </code>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-9 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2b5cf0]/15 text-[#7fb0ff]">
            <Plugs size={24} weight="regular" />
          </span>
          <h3 className="font-display text-xl font-bold text-white">Finovela&apos;yı da dene</h3>
          <p className="max-w-sm text-[14px] leading-relaxed text-white/60">
            MCP geliştiriciler için; çoğu kullanıcı için Finovela Sohbet hazır. Ücretsiz başla.
          </p>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-full bg-[#2b5cf0] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Ücretsiz başla <ArrowRight size={16} weight="bold" />
          </Link>
        </div>
      </Section>
    </PageShell>
  );
}
