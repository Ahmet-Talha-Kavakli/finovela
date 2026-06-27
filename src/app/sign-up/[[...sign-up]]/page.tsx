import { SignUp } from "@clerk/nextjs";
import { VelaLogo } from "@/components/brand/logo";
import { CLERK_ENABLED } from "@/lib/auth";
import { finovelaClerkAppearance } from "@/lib/clerk-appearance";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(120%_120%_at_50%_-10%,#16306b_0%,#0c1d40_55%,#0a1838_100%)] px-6 py-16">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex justify-center text-white">
          <VelaLogo className="[&_span]:text-2xl [&_svg]:h-8 [&_svg]:w-8" />
        </Link>
        {CLERK_ENABLED ? (
          <SignUp
            appearance={finovelaClerkAppearance}
            forceRedirectUrl="/onboarding"
            signInUrl="/sign-in"
          />
        ) : (
          <div className="rounded-3xl border border-white/12 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
            <p className="text-sm text-white/70">
              Sign-up is running in demo mode. Add your Clerk keys to{" "}
              <code className="text-white">.env.local</code> to enable real accounts.
            </p>
            <Link
              href="/dashboard/onboarding"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-[#5b8cff] to-[#3b6dff] px-6 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Continue to demo onboarding
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
