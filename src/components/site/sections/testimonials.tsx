import Link from "next/link";
import { ChatTeardropDots } from "@phosphor-icons/react/dist/ssr";
import { StaggerTestimonials } from "@/components/ui/stagger-testimonials";
import { CurveDivider } from "@/components/ui/curve-divider";

/**
 * "Real Stories from Our Community" — RockFlow: ortada başlık + CTA,
 * altta sonsuz kaydırmalı stagger testimonial kartları.
 */
const STORIES = [
  { text: "Finovela'nın otomatik işlemi etkileyici — sadece hedef fiyat ve adet belirliyorsun, gerisini kusursuz hallediyor. Yatırımı basitleştiren gerçek bir 'kur ve unut' deneyimi.", name: "Liu Max", role: "Web3 Araştırmacısı & KOL", color: "#5b8cff" },
  { text: "Finovela'nın veri analizi çarpıcı, özellikle derin portföy içgörüleri. Risk dökümü, neye sahip olduğumu gerçekten anlamamı sağlıyor.", name: "Lee", role: "Kıdemli Backend Mühendisi", color: "#2b5cf0" },
  { text: "Finovela'nın stratejik düşünmesi mükemmel. Açığa satış gibi işlemler piyasada engellendiğinde, riske göre akıllıca alternatifler öneriyor. Çok esnek.", name: "Derek Zhou", role: "Yatırım Danışmanı, HK", color: "#7fb0ff" },
  { text: "Finovela ile portföy kurup 5 yıllık veriyi geriye dönük test ettim, getiriler beklentileri fazlasıyla aştı. Strateji doğrulaması kararları çok daha güvenli kılıyor.", name: "Lynn", role: "Finans Öğrencisi @ NYU", color: "#3b6dff" },
  { text: "Finovela akıllı işlemi yeniden tanımlıyor — profesyonel, rahat ve insani. Yeni nesil 'vibe trading' deneyimi.", name: "Alex Hsu", role: "İçerik Üreticisi, Finans", color: "#3b6dff" },
  { text: "Hedeflerimi sade bir dille anlattım ve Finovela saniyeler içinde çeşitlendirilmiş bir sepet kurdu. Cebimde bir kantitatif analiz ekibi varmış gibi.", name: "Maya R.", role: "Ürün Tasarımcısı", color: "#2b5cf0" },
];

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-[#071026]">
      <CurveDivider color="#0f2148" />
      <div className="mx-auto max-w-[1400px] px-6 py-40">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-gradient">
            <ChatTeardropDots size={22} weight="fill" />
            <span className="text-base font-bold">Kullanıcı Yorumları</span>
          </div>
          <h2 className="font-display mx-auto mt-5 max-w-3xl text-[36px] font-bold leading-[1.28] text-white">
            Topluluğumuzdan Gerçek Hikâyeler
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/55">
            Finovela&apos;nın akıllı işlem özelliklerinin dünya genelinde
            yatırımcıların deneyimini nasıl dönüştürdüğünü keşfet.
          </p>
          <div className="mt-9 flex justify-center">
            <Link href="/app" className="inline-flex h-14 items-center justify-center rounded-full bg-[linear-gradient(90deg,#cfe0ff,#e6f0ff)] px-9 text-lg font-semibold text-black transition hover:brightness-105">
              Finovela ile Sohbet Et
            </Link>
          </div>
        </div>

        <div className="mt-20">
          <StaggerTestimonials items={STORIES} />
        </div>
      </div>
    </section>
  );
}
