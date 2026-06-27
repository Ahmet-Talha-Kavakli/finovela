"use client";

import { SignUp } from "@clerk/nextjs";
import { finovelaClerkAppearance } from "@/lib/clerk-appearance";

/**
 * /app sağ kolonundaki GERÇEK kayıt akışı. Clerk'in gömülü <SignUp> bileşenini
 * Finovela mavi diline boyar — Google/Apple/email ile gerçek hesap açma.
 * (Demo modda /app eski sahte kartı gösterir; bu bileşen sadece Clerk açıkken.)
 */
export function AppSignUp() {
  return (
    <SignUp
      routing="hash"
      signInUrl="/sign-in"
      forceRedirectUrl="/onboarding"
      appearance={{
        ...finovelaClerkAppearance,
        elements: { ...finovelaClerkAppearance.elements, footer: "hidden" },
      }}
    />
  );
}
