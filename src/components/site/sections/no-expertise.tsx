import Link from "next/link";
import { cn } from "@/lib/utils";
import { CurveDivider } from "@/components/ui/curve-divider";
import {
  ChatCircleDots,
  Globe,
  ImageSquare,
  ChartLine,
} from "@phosphor-icons/react/dist/ssr";

/**
 * "Your Words, Vela's Actions — No Expertise Required" — RockFlow yapısı:
 * ortada başlık + CTA, altında 4'lü (2x2) line-art ikon + başlık + alt-başlık + açıklama.
 */
const ITEMS = [
  {
    icon: ChatCircleDots,
    title: "Sohbetle Her Şeyi Yap",
    accent: "Claude Destekli Uzman Sohbet",
    text: "Hisse analizinden portföy kurmaya, opsiyon stratejisinden risksiz işleme kadar — Finovela'ya günlük dille söyle, yetkin bir analist gibi akıl yürütüp harekete geçsin.",
  },
  {
    icon: Globe,
    title: "Webden Canlı Araştırma",
    accent: "Güncel Haberi ve Piyasayı Webde Tarar, Kaynak Gösterir",
    text: "Finovela soruyu yanıtlarken interneti canlı tarar; en taze haberi, bilançoyu ve piyasa hareketini çeker ve her iddianın altına kaynağını koyar — tahmin değil, doğrulanabilir bilgi.",
  },
  {
    icon: ImageSquare,
    title: "Grafik ve Dosya Yükle",
    accent: "Ekran Görüntünü, Grafiğini ya da PDF'ini Analiz Ettir",
    text: "Bir grafik, ekran görüntüsü ya da bilanço PDF'i yükle; Finovela görseli okur, formasyonu ve sayıları yorumlar ve ne yapman gerektiğini sade dille söyler.",
  },
  {
    icon: ChartLine,
    title: "Sohbette Canlı Analiz Kartları",
    accent: "Teknik Analiz, Finovela Skoru ve What-If Senaryoları",
    text: "RSI, MACD, Bollinger; Finovela Skoru, duyarlılık, haber akışı ve senaryo simülasyonu — hepsi sohbetin içinde görsel kartlar olarak önüne gelir. Hedeflerini kur, modelini (Finovela 1 / 1.1 / 1.2) seç ve risksiz, sanal işlemle dene.",
  },
];

export function NoExpertise() {
  return (
    <section className="relative overflow-hidden bg-[#071026]">
      <CurveDivider color="#0a1838" />
      <div className="mx-auto max-w-[1100px] px-6 py-40 text-center">
        <h2 className="font-display text-[42px] font-bold leading-[1.3] text-white">
          Sen Söyle, Finovela Yapsın
          <br />
          Uzmanlık Gerekmez
        </h2>
        <div className="mt-9 flex justify-center">
          <Link
            href="/app"
            className="inline-flex h-14 items-center justify-center rounded-full bg-[linear-gradient(90deg,#cfe0ff_0%,#e6f0ff_100%)] px-9 text-lg font-semibold text-black shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] transition hover:brightness-105"
          >
            Finovela ile Sohbet Et
          </Link>
        </div>

        {/* 2x2 grid, dikey + yatay ince ayraç çizgili (RockFlow birebir) */}
        <div className="mt-20 grid grid-cols-1 text-left sm:grid-cols-2">
          {ITEMS.map((it, i) => (
            <div
              key={it.title}
              className={cn(
                "px-0 py-12 sm:px-12",
                // dikey ayraç: sağ sütun solunda
                i % 2 === 1 && "sm:border-l sm:border-white/10",
                // yatay ayraç: alt satır üstünde
                i >= 2 && "sm:border-t sm:border-white/10",
              )}
            >
              <it.icon size={60} weight="thin" className="text-white/85" />
              <h3 className="font-display mt-7 text-[28.8px] font-bold leading-[1.25] text-white">
                {it.title}
              </h3>
              <p className="mt-4 text-base font-semibold text-gradient">
                {it.accent}
              </p>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/55">
                {it.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
