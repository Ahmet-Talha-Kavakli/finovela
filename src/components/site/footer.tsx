import Link from "next/link";
import { VelaLogo } from "@/components/brand/logo";
import { XLogo, InstagramLogo, LinkedinLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";

const COLUMNS = [
  {
    title: "Product",
    links: [
      ["Vela AI", "/product/ai"],
      ["Automation", "/automation"],
      ["Strategy Builder", "/product/strategy"],
      ["Copy Trading", "/copy"],
      ["Portfolio", "/product/portfolio"],
      ["Tax Optimization", "/product/tax"],
    ],
  },
  {
    title: "Markets",
    links: [
      ["Stocks", "/markets/stocks"],
      ["ETFs", "/markets/etfs"],
      ["Crypto", "/markets/crypto"],
      ["Bonds & Treasuries", "/markets/bonds"],
      ["Retirement (IRA)", "/markets/retirement"],
    ],
  },
  {
    title: "Company",
    links: [
      ["Pricing", "/pricing"],
      ["Academy", "/academy"],
      ["Security", "/security"],
      ["Blog", "/blog"],
      ["About", "/about"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["Disclosures", "/legal/disclosures"],
      ["Terms", "/legal/terms"],
      ["Privacy", "/legal/privacy"],
      ["How Vela works", "/legal/methodology"],
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-deep-violet text-white">
      <div className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <VelaLogo className="[&_span]:text-white" />
            <p className="mt-4 text-sm text-white/55">
              The all-in-one AI investing co-pilot. Chat to build a strategy,
              automate every trade, and let your portfolio run itself.
            </p>
            <div className="mt-5 flex gap-3 text-white/50">
              <Link href="#" aria-label="X" className="transition hover:text-white"><XLogo size={20} /></Link>
              <Link href="#" aria-label="Instagram" className="transition hover:text-white"><InstagramLogo size={20} /></Link>
              <Link href="#" aria-label="LinkedIn" className="transition hover:text-white"><LinkedinLogo size={20} /></Link>
              <Link href="#" aria-label="YouTube" className="transition hover:text-white"><YoutubeLogo size={20} /></Link>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link href={href} className="text-sm text-white/55 transition hover:text-white">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 space-y-4 border-t border-white/10 pt-8 text-xs leading-relaxed text-white/40">
          <p>
            Vela is an educational, paper-trading demo environment. Nothing here
            is financial advice, a recommendation, or an offer to buy or sell any
            security. Simulated performance does not reflect real trading and is
            not indicative of future results. Investing involves risk, including
            the possible loss of principal.
          </p>
          <p>© {new Date().getFullYear()} Vela. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
