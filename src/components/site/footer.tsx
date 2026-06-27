import Link from "next/link";
import { VelaLogo } from "@/components/brand/logo";
import { BrandIcon } from "@/components/ui/brand-icon";

/**
 * Footer — RockFlow yapısı: logo + Company / Support / Social / Download sütunları,
 * app-store rozetleri, en altta yasal disclaimer satırları.
 */
const PRODUCT = [
  ["AI Sohbet", "/product/ai"],
  ["Portföy", "/product/portfolio"],
  ["Strateji Kurucu", "/product/strategy"],
  ["Otomasyon", "/automation"],
  ["Kopya Yatırım", "/copy"],
  ["Vergi Merkezi", "/product/tax"],
];
const MARKETS = [
  ["Piyasalar", "/markets"],
  ["Hisse Listeleri", "/markets/stocks"],
  ["Araştırma", "/research"],
];
const RESOURCES = [
  ["Blog", "/blog"],
  ["Akademi", "/academy"],
  ["Destek", "/support"],
  ["Fiyatlandırma", "/pricing"],
];
const LEGAL = [
  ["Kullanım Şartları", "/terms"],
  ["Gizlilik", "/privacy"],
  ["İade Politikası", "/refund"],
  ["Risk Bildirimi", "/disclaimer"],
  ["İletişim", "/contact"],
  ["KVKK", "/kvkk"],
  ["Çerezler", "/cookies"],
];

export function Footer() {
  return (
    <footer className="bg-[#071026] text-white">
      <div className="mx-auto max-w-[1400px] px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1fr_1fr_1fr]">
          {/* logo */}
          <div className="max-w-xs">
            <VelaLogo className="[&_span]:text-2xl [&_svg]:h-9 [&_svg]:w-9" />
          </div>

          {/* Ürün */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white">Ürün</h4>
            <ul className="mt-5 space-y-3">
              {PRODUCT.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white/55 transition hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Piyasalar */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white">Piyasalar</h4>
            <ul className="mt-5 space-y-3">
              {MARKETS.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white/55 transition hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kaynaklar */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white">Kaynaklar</h4>
            <ul className="mt-5 space-y-3">
              {RESOURCES.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white/55 transition hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white">Yasal</h4>
            <ul className="mt-5 space-y-3">
              {LEGAL.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-white/55 transition hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white">Sosyal</h4>
            <div className="mt-5 flex flex-wrap gap-3">
              {(
                [
                  ["x", "https://x.com/finovela"],
                  ["instagram", "https://instagram.com/finovela"],
                  ["facebook", "https://facebook.com/finovela"],
                  ["linkedin", "https://linkedin.com/company/finovela"],
                  ["youtube", "https://youtube.com/@finovela"],
                ] as const
              ).map(([n, url]) => (
                <a
                  key={n}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={n}
                  className="grid h-10 w-10 place-items-center rounded-full bg-[#3b6dff] text-white transition hover:bg-[#2b5cf0]"
                >
                  <BrandIcon name={n} size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Download */}
          <div>
            <h4 className="font-display text-lg font-semibold text-white">İndir</h4>
            <div className="mt-5 flex flex-col gap-3">
              <Link href="/download" className="flex h-12 w-[160px] items-center gap-3 rounded-xl bg-black px-4 ring-1 ring-white/15 transition hover:bg-black/80">
                <svg viewBox="0 0 512 512" className="h-6 w-6 shrink-0" aria-hidden>
                  {/* sol mavi segment (gövde) */}
                  <path fill="#00A0FF" d="M48 44c-5 5-8 13-8 23v378c0 10 3 18 8 23l1 1 212-212v-2L49 43l-1 1z" />
                  {/* sağ-uç sarı segment */}
                  <path fill="#FFC900" d="M331 327l-71-71v-2l71-71 2 1 84 48c24 14 24 36 0 50l-84 48-2-1z" />
                  {/* alt yeşil segment */}
                  <path fill="#00DE6E" d="M333 326l-73-73L49 466c8 9 21 10 36 1l248-141z" />
                  {/* üst kırmızı segment */}
                  <path fill="#FF3D44" d="M333 186L85 45C70 36 57 37 49 46l211 211 73-71z" />
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[9px] text-white/60">İNDİR</span>
                  <span className="block text-sm font-semibold text-white">Google Play</span>
                </span>
              </Link>
              <Link href="/download" className="flex h-12 w-[160px] items-center gap-3 rounded-xl bg-black px-4 ring-1 ring-white/15 transition hover:bg-black/80">
                <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 fill-white" aria-hidden>
                  <path d="M17.05 12.04c-.03-2.5 2.04-3.7 2.13-3.76-1.16-1.7-2.97-1.93-3.61-1.96-1.54-.15-3 .9-3.78.9-.78 0-1.98-.88-3.25-.86-1.67.03-3.21.97-4.07 2.46-1.73 3-.44 7.46 1.25 9.9.82 1.2 1.8 2.53 3.08 2.48 1.24-.05 1.71-.8 3.2-.8 1.5 0 1.92.8 3.23.77 1.33-.02 2.18-1.21 3-2.41.94-1.38 1.33-2.72 1.35-2.79-.03-.01-2.6-1-2.62-3.96zM14.6 4.7c.69-.83 1.15-2 1.02-3.16-.99.04-2.19.66-2.9 1.49-.64.73-1.2 1.9-1.05 3.02 1.1.09 2.23-.56 2.93-1.35z"/>
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[9px] text-white/60">İndir</span>
                  <span className="block text-sm font-semibold text-white">App Store</span>
                </span>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 space-y-3 border-t border-white/10 pt-8 text-xs leading-relaxed text-white/40">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>© {new Date().getFullYear()} Finovela. Tüm hakları saklıdır.</p>
            <span className="hidden h-3 w-px bg-white/15 sm:inline-block" />
            {LEGAL.map(([label, href]) => (
              <Link key={label} href={href} className="transition hover:text-white/70">
                {label}
              </Link>
            ))}
          </div>
          <p>
            Finovela bir aracı kurum, yatırım danışmanı, borsa veya saklama kuruluşu
            <strong className="text-white/55"> değildir</strong> ve paranızı tutmaz.
            İşlemler, yetki verdiğiniz kendi borsa/aracı kurum hesaplarınızda
            gerçekleşir. Buradaki hiçbir içerik yatırım tavsiyesi, öneri ya da alım-satım
            teklifi niteliği taşımaz. Geçmiş ve simüle edilmiş performans gelecekteki
            sonuçların göstergesi değildir. Yatırım ve otomatik işlem, anaparanın
            tamamen kaybı dahil önemli riskler içerir. Ayrıntı için{" "}
            <Link href="/disclaimer" className="underline transition hover:text-white/70">
              Risk Bildirimi
            </Link>{" "}
            metnimizi inceleyiniz.
          </p>
          <p className="mt-3 text-white/35">
            Siparişleriniz, online satıcımız ve Kayıtlı Satıcısı (Merchant of Record){" "}
            <strong className="text-white/50">Paddle.com</strong> tarafından işlenir; ödeme,
            faturalandırma, vergi ve iadeler Paddle üzerinden yürütülür.
          </p>
        </div>
      </div>
    </footer>
  );
}
