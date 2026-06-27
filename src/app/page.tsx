import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Hero } from "@/components/site/sections/hero";
import { AiNative } from "@/components/site/sections/ai-native";
import { NoExpertise } from "@/components/site/sections/no-expertise";
import { UseCases } from "@/components/site/sections/use-cases";
import { AiPortfolios } from "@/components/site/sections/ai-portfolios";
import { Outsmarts } from "@/components/site/sections/outsmarts";
import { MadeNatural } from "@/components/site/sections/made-natural";
import { Testimonials } from "@/components/site/sections/testimonials";
import { FinalCta } from "@/components/site/sections/final-cta";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <AiNative />
        <NoExpertise />
        <UseCases />
        <AiPortfolios />
        <Outsmarts />
        <MadeNatural />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
