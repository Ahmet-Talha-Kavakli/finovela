"use client";

import { useEffect, useState } from "react";
import { CLERK_ENABLED, DEMO_USER } from "@/lib/auth";
import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/dashboard/use-profile";

/** Saat-duyarlı karşılama selamı + ilk ad. Clerk yoksa demo (useUser çağrılmaz). */
export function Greeting({ className }: { className?: string }) {
  if (!CLERK_ENABLED) {
    return <GreetingText name={DEMO_USER.name.split(" ")[0]} className={className} />;
  }
  return <ClerkGreeting className={className} />;
}

function ClerkGreeting({ className }: { className?: string }) {
  const { user } = useUser();
  const { profile } = useProfile();
  // Öncelik: onboarding'de girilen ad → Clerk adı → kullanıcı adı → e-posta.
  const name =
    profile?.name?.trim().split(" ")[0] ||
    user?.firstName ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Yatırımcı";
  return <GreetingText name={name} className={className} />;
}

function GreetingText({ name, className }: { name: string; className?: string }) {
  // Hydration güvenli: ilk render "Tekrar hoş geldin", mount sonrası saat-duyarlı.
  const [part, setPart] = useState("Tekrar hoş geldin");
  useEffect(() => {
    const h = new Date().getHours();
    setPart(h < 6 ? "İyi geceler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar");
  }, []);
  return (
    <span className={className}>
      {part}, {name}
    </span>
  );
}
