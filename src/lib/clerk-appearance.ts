// Finovela mavi diline boyalı Clerk görünümü — /sign-in, /sign-up ve /app'te paylaşılır.
// (Tip @clerk/nextjs üzerinden türetilir; doğrudan @clerk/types'a bağımlılık yok.)
import type { ComponentProps } from "react";
import type { SignIn } from "@clerk/nextjs";

type ClerkAppearance = NonNullable<ComponentProps<typeof SignIn>["appearance"]>;

export const finovelaClerkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "#3b6dff",
    colorBackground: "rgba(255,255,255,0.03)",
    colorForeground: "#ffffff",
    colorMutedForeground: "rgba(255,255,255,0.55)",
    colorInput: "rgba(255,255,255,0.04)",
    colorInputForeground: "#ffffff",
    colorDanger: "#ff6b6b",
    borderRadius: "0.9rem",
    fontFamily: "var(--font-display), system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "w-full max-w-sm mx-auto shadow-none",
    card: "w-full bg-white/[0.04] border border-white/12 backdrop-blur-xl shadow-[0_30px_80px_rgba(43,92,240,0.25)] rounded-3xl px-7 py-8",
    header: "text-center",
    headerTitle: "text-white font-display text-2xl",
    headerSubtitle: "text-white/55",
    socialButtonsBlockButton:
      "bg-white/[0.05] border border-white/12 text-white hover:bg-white/[0.08] rounded-full h-11",
    socialButtonsBlockButtonText: "text-white font-semibold",
    dividerLine: "bg-white/10",
    dividerText: "text-white/35",
    formFieldLabel: "text-white/70",
    formFieldInput:
      "bg-white/[0.04] border border-white/12 text-white rounded-full h-11 focus:border-[#3b6dff]",
    formButtonPrimary:
      "bg-gradient-to-r from-[#5b8cff] to-[#3b6dff] hover:brightness-110 text-white font-semibold rounded-full h-11 shadow-[0_8px_24px_rgba(59,109,255,0.4)]",
    footerActionText: "text-white/45",
    footerActionLink: "text-[#7fb0ff] hover:text-white",
    identityPreviewEditButtonIcon: "text-[#7fb0ff]",
    formResendCodeLink: "text-[#7fb0ff]",
    otpCodeFieldInput: "text-white border-white/15",
    // Beyaz alt şeridi (Clerk footer + "Development mode" rozeti) kaldır —
    // koyu mavi kartla bütünleşsin.
    footer: "bg-transparent",
    footerAction: "bg-transparent",
    footerPages: "hidden",
    badge: "hidden",
  },
};
