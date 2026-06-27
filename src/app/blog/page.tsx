import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { PageHero, Section, CtaBand } from "@/components/site/page-parts";

export const metadata: Metadata = {
  title: "Blog — Finovela",
  description:
    "Yapay zekâ, yatırım ve servet inşası üzerine fikirler — Finovela ekibinden. Ürün haberleri, piyasa düşünceleri ve pratik rehberler.",
};

const FEATURED = {
  tag: "Ürün",
  title: "Finovela AI ile tanışın: paranızla konuşarak yatırım yapın",
  excerpt:
    "Bugün, günlük dili gerçek yatırıma dönüştüren AI yardımcısını sunuyoruz — analiz et, kur, koru ve işlemi gerçekleştir, sıfır tık.",
  date: "20 Haz 2026",
  read: "5 dk okuma",
};

const POSTS = [
  { tag: "AI", title: "Sohbet ederek yatırım her şeyi neden değiştiriyor", date: "14 Haz 2026", read: "4 dk" },
  { tag: "Rehberler", title: "Tek cümleyle çeşitlendirilmiş portföy nasıl kurulur", date: "9 Haz 2026", read: "6 dk" },
  { tag: "Piyasalar", title: "AI yatırım harcaması patlaması portföyün için ne anlama geliyor", date: "3 Haz 2026", read: "7 dk" },
  { tag: "Ürün", title: "Otomasyon, açıklanmış haliyle: kurallarınla işlem yapan ajanlar", date: "28 May 2026", read: "5 dk" },
  { tag: "Eğitim", title: "Korkmadan opsiyonlar: yeni başlayanlar için yol haritası", date: "21 May 2026", read: "8 dk" },
  { tag: "AI", title: "Finovela bir bilanço sunumunu 90 saniyede nasıl okur", date: "15 May 2026", read: "4 dk" },
];

export default function BlogPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Blog"
        image="/gen/p-blog.png"
        title="AI ve yatırım üzerine fikirler"
        subtitle="Yatırımın geleceğini inşa eden ekipten ürün haberleri, piyasa düşünceleri ve pratik rehberler."
      />

      <Section bg="#0a1838" prev="#0c1d40">
        {/* öne çıkan */}
        <Link
          href="/blog"
          className="group block overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(120deg,rgba(59,109,255,0.14),rgba(59,109,255,0.03))] p-8 transition hover:border-white/20 sm:p-12"
        >
          <span className="text-gradient text-sm font-bold">{FEATURED.tag}</span>
          <h2 className="font-display mt-4 max-w-2xl text-[clamp(26px,3.5vw,38px)] font-bold leading-tight text-white">
            {FEATURED.title}
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-white/60">
            {FEATURED.excerpt}
          </p>
          <p className="mt-6 text-sm text-white/40">
            {FEATURED.date} · {FEATURED.read}
          </p>
        </Link>

        {/* liste */}
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((p) => (
            <Link
              key={p.title}
              href="/blog"
              className="group flex flex-col rounded-3xl border border-white/8 bg-white/[0.03] p-7 transition hover:border-white/15 hover:bg-white/[0.05]"
            >
              <span className="text-gradient text-xs font-bold uppercase tracking-wide">
                {p.tag}
              </span>
              <h3 className="font-display mt-3 text-lg font-bold leading-snug text-white">
                {p.title}
              </h3>
              <p className="mt-auto pt-6 text-sm text-white/40">
                {p.date} · {p.read}
              </p>
            </Link>
          ))}
        </div>
      </Section>

      <CtaBand
        title="Daha akıllı yatırıma hazır mısın?"
        subtitle="Fikirleri ücretsiz AI yardımcınla uygulamaya dök."
        prev="#0a1838"
      />
    </PageShell>
  );
}
