import { PageShell } from "@/components/site/page-shell";

/**
 * Yasal/politika sayfaları için ortak iskelet — Navbar + başlık + okunaklı metin
 * gövdesi + Footer. İçerik yapısı: numaralı bölümler (LegalSection) + paragraflar.
 * Global ürün olduğu için metinler İngilizce; KVKK sayfası Türkçedir (Türk yasası).
 */
export function LegalDoc({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <PageShell>
      <div className="bg-[radial-gradient(120%_120%_at_50%_-10%,#16306b_0%,#0c1d40_55%,#0a1838_100%)] px-6 pt-36 pb-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="font-display text-[clamp(30px,4vw,46px)] font-bold leading-tight text-white">
            {title}
          </h1>
          <p className="mt-3 text-sm text-white/45">Last updated: {updated}</p>
          {intro && (
            <div className="mt-6 text-[15px] leading-relaxed text-white/70">{intro}</div>
          )}
        </div>
      </div>
      <div className="bg-[#0a1838] px-6 pb-24">
        <div className="mx-auto max-w-3xl space-y-10 text-[15px] leading-relaxed text-white/70">
          {children}
        </div>
      </div>
    </PageShell>
  );
}

export function LegalSection({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-32" id={`s${n}`}>
      <h2 className="font-display text-xl font-bold text-white">
        {n}. {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

/** Vurgulu uyarı kutusu (risk/sorumluluk reddi için). */
export function LegalCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#ff6b6b]/30 bg-[#ff6b6b]/[0.06] p-5 text-[14px] leading-relaxed text-white/80">
      {children}
    </div>
  );
}
