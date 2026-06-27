import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/site/navbar";
import { VelaMark } from "@/components/brand/logo";
import { AppStoreBadge, GooglePlayBadge } from "@/components/site/store-badges";
import { Sparkle, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { CLERK_ENABLED } from "@/lib/auth";
import { AppSignUp } from "@/components/site/app-signup";

export const metadata: Metadata = {
  title: "Get started — Finovela",
  description:
    "Create your free Finovela account and start investing with AI in minutes.",
};

export default function AppPage() {
  // Clerk açıksa kayıt akışı gerçek (/sign-up → Google/Apple/email); değilse demo onboarding.
  const signUpHref = CLERK_ENABLED ? "/sign-up" : "/dashboard/onboarding";
  return (
    <>
      <Navbar />
      <main className="relative flex min-h-screen items-center overflow-hidden bg-[radial-gradient(120%_120%_at_50%_-10%,#16306b_0%,#0c1d40_55%,#0a1838_100%)] px-6 pt-32 pb-20">
        <div className="mx-auto grid w-full max-w-[1100px] items-start gap-16 lg:grid-cols-2">
          {/* sol — sadece sinematik video (sağ formla ÜSTTEN aynı hizada başlar) */}
          <div className="flex flex-col">
            <div className="relative mx-auto w-full max-w-[360px]">
              <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle,rgba(59,109,255,0.45),transparent_70%)] blur-3xl" />
              <div className="overflow-hidden rounded-3xl border border-white/12 bg-[#0a1838] shadow-[0_30px_70px_rgba(43,92,240,0.4)]">
                <video
                  src="/gen/app-video.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="aspect-[9/16] h-full w-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* sağ — kayıt akışı. Clerk açıksa GERÇEK Clerk <SignUp>; demo modda sahte kart. */}
          <div className="flex flex-col">
            {CLERK_ENABLED ? (
              <>
                <AppSignUp />
                <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-white/40">
                  <ShieldCheck size={14} weight="fill" className="text-brand" />
                  Bank-grade security. Cancel anytime.
                </p>
                <div className="mt-6 border-t border-white/10 pt-6">
                  <p className="text-center text-xs text-white/40">Already have the app?</p>
                  <div className="mt-3 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                    <AppStoreBadge />
                    <GooglePlayBadge />
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-3xl border border-white/12 bg-white/[0.04] p-8 backdrop-blur-xl sm:p-10">
                <div className="flex items-center gap-2.5">
                  <VelaMark className="h-7 w-7" />
                  <span className="font-display text-xl font-bold text-white">
                    Create your account
                  </span>
                </div>
                <div className="mt-7 space-y-3">
                  <Link href={signUpHref} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#c0d3ff,#e6f0ff)] text-[15px] font-semibold text-black transition hover:brightness-105">
                    <Sparkle size={17} weight="fill" />
                    Continue to demo onboarding
                  </Link>
                </div>
                <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-white/40">
                  <ShieldCheck size={14} weight="fill" className="text-brand" />
                  Bank-grade security. Cancel anytime.
                </p>
                <div className="mt-7 border-t border-white/10 pt-6">
                  <p className="text-center text-xs text-white/40">Already have the app?</p>
                  <div className="mt-3 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                    <AppStoreBadge />
                    <GooglePlayBadge />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
