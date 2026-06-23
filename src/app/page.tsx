import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/site/sections/hero";
import { Stats } from "@/components/site/sections/stats";
import { HowItWorks } from "@/components/site/sections/how-it-works";
import { FeatureRow } from "@/components/site/sections/feature-row";
import { HotStocks } from "@/components/site/sections/hot-stocks";
import { FAQ } from "@/components/site/sections/faq";
import { CTA } from "@/components/site/sections/cta";
import {
  ChatCircleDots,
  Robot,
  StackSimple,
  UsersThree,
  ChartLineUp,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Stats />

        <FeatureRow
          icon={ChatCircleDots}
          eyebrow="Vela AI"
          title="An investing co-pilot that"
          titleAccent="actually understands you"
          description="Ask anything. Vela pulls live data, compares securities, explains market moves, and remembers your whole conversation — so “now add META to that” just works."
          image="/gen/ai-brain.png"
          bullets={[
            { title: "Real follow-up memory", text: "it builds on what you just discussed, never makes you repeat yourself" },
            { title: "Grounded in live data", text: "quotes, charts and news pulled in real time, never made up" },
            { title: "Explains the why", text: "every view comes with the reasoning and a clear risk note" },
          ]}
          href="/app"
        />

        <HowItWorks />

        <FeatureRow
          reverse
          icon={Robot}
          eyebrow="Automation"
          title="Set it once."
          titleAccent="It runs 24/7."
          description="Vela turns your strategy into an always-on engine — executing trades, rebalancing the moment you drift, and reinvesting automatically, even while you sleep."
          image="/gen/automation-gears.png"
          bullets={[
            { title: "Auto-rebalancing", text: "tax-smart, buys low by routing to your most underweight holdings" },
            { title: "Trading bots", text: "DCA, grid and signal strategies running on autopilot" },
            { title: "Full transparency", text: "every automated action logged in a live activity feed" },
          ]}
          href="/automation"
        />

        <FeatureRow
          icon={StackSimple}
          eyebrow="Strategy Builder"
          title="No-code strategies,"
          titleAccent="backtested before they run"
          description="Describe a strategy and Vela assembles it from modular blocks — then backtests it against years of data so you see the Sharpe, drawdown and returns before a single simulated dollar moves."
          image="/gen/strategy-blocks.png"
          bullets={[
            { title: "Visual block editor", text: "weight, filter, if/else — no code required" },
            { title: "Instant backtests", text: "equity curve, Sharpe, max drawdown in seconds" },
            { title: "Editable AI output", text: "tweak anything Vela proposes before going live" },
          ]}
          href="/product/strategy"
        />

        {/* RockFlow imza bölümü — canlı stocklist */}
        <HotStocks />

        <FeatureRow
          icon={UsersThree}
          eyebrow="Copy Trading"
          title="Never"
          titleAccent="invest alone"
          description="Browse top investors and community strategies, see their risk score and track record, and mirror them automatically into your portfolio — fully simulated, fully transparent."
          image="/gen/copy-network.png"
          bullets={[
            { title: "Proportional copy", text: "mirror an investor's exact allocation, automatically" },
            { title: "Risk-scored profiles", text: "see drawdown, returns and copiers before you follow" },
            { title: "Remixable strategies", text: "copy a community symphony and make it your own" },
          ]}
          href="/copy"
        />

        <FeatureRow
          reverse
          icon={ChartLineUp}
          eyebrow="Portfolio & Analytics"
          title="Every account,"
          titleAccent="one clear picture"
          description="A unified dashboard with a 0–1000 health score, overlap and concentration analysis, hidden-fee detection, net-worth projections and Monte-Carlo retirement modeling."
          image="/gen/phone-chat.png"
          bullets={[
            { title: "Portfolio health score", text: "risk match, risk-adjusted returns and downside protection" },
            { title: "Overlap & fee analysis", text: "find concentration risk and silent fee drag instantly" },
            { title: "Projections", text: "net-worth forecasts and Monte-Carlo retirement sims" },
          ]}
          href="/product/portfolio"
        />

        <FeatureRow
          icon={ShieldCheck}
          eyebrow="Tax Optimization"
          title="Keep more of"
          titleAccent="what you make"
          description="Vela models daily tax-loss harvesting, direct indexing and tax-aware withdrawals — the automated tax machinery normally reserved for the wealthy, built right in."
          image="/gen/tax-shield.png"
          bullets={[
            { title: "Tax-loss harvesting", text: "modeled daily to offset gains automatically" },
            { title: "Direct indexing", text: "own the index at the share level for finer tax control" },
            { title: "Tax-aware withdrawals", text: "sequence sells to minimize the tax bill" },
          ]}
          href="/product/tax"
        />

        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
