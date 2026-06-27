import Image from "next/image";
import { GlassButton } from "@/components/ui/glass-button";
import { ChatCircleDots } from "@phosphor-icons/react/dist/ssr";

export function CTA() {
  return (
    <section className="bg-lilac-fade px-5 pb-24 pt-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-deep-violet">
        {/* roket görseli — sağda, akan */}
        <div className="pointer-events-none absolute -right-10 bottom-0 top-0 hidden w-1/2 md:block">
          <Image
            src="/gen/cta-rocket.png"
            alt=""
            fill
            className="object-contain object-right opacity-90"
          />
        </div>
        <div className="pointer-events-none absolute left-[20%] top-[20%] h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_30px_10px_rgba(255,255,255,0.7)]" />

        <div className="relative px-8 py-20 sm:py-24 md:max-w-xl md:px-14">
          <h2 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            Ready to research with a{" "}
            <span className="text-gradient">genius</span> in your pocket?
          </h2>
          <p className="mt-5 text-lg text-white/65">
            Join the investors letting Finovela handle the heavy research. Start free,
            build a strategy by chatting, and test it risk-free in simulation.
          </p>
          <div className="mt-8">
            <GlassButton size="xl" tone="brand" href="/app">
              <ChatCircleDots size={20} weight="fill" />
              Chat with Finovela — free
            </GlassButton>
          </div>
        </div>
      </div>
    </section>
  );
}
