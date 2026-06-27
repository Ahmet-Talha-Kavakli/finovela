"use client";

import { CLERK_ENABLED } from "@/lib/auth";
import { useUser, UserButton, SignOutButton } from "@clerk/nextjs";
import { useProfile } from "@/lib/dashboard/use-profile";
import { SignOut } from "@phosphor-icons/react";

/**
 * Sidebar kullanıcı kartı — Clerk varsa gerçek kullanıcı (avatar + ad + çıkış),
 * yoksa demo kullanıcı (Alex Morgan). Hardcoded kimliği değiştirir.
 */
export function UserChip() {
  if (!CLERK_ENABLED) {
    return (
      <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-xs font-bold text-white">
          A
        </span>
        <div className="leading-tight">
          <p className="text-sm font-medium text-white">Alex Morgan</p>
          <p className="flex items-center gap-1.5 text-[11px] text-white/45">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#fdd663" }} />
            Demo · Sanal para
          </p>
        </div>
      </div>
    );
  }
  return <ClerkChip />;
}

function ClerkChip() {
  const { user, isLoaded } = useUser();
  const { profile } = useProfile();
  // Öncelik: onboarding'de kullanıcının girdiği ad → Clerk adı → kullanıcı adı →
  // e-posta yerel kısmı → "Yatırımcı".
  const name =
    profile?.name?.trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Yatırımcı";

  return (
    <div className="flex items-center gap-3 rounded-xl px-2.5 py-2.5">
      <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium text-white">
          {isLoaded ? name : "…"}
        </p>
        <p className="flex items-center gap-1.5 text-[11px] text-white/45">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "#fdd663" }} />
          Sanal portföy
        </p>
      </div>
      <SignOutButton redirectUrl="/">
        <button
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/30 transition hover:bg-white/10 hover:text-white"
          aria-label="Çıkış yap"
          title="Çıkış yap"
        >
          <SignOut size={15} />
        </button>
      </SignOutButton>
    </div>
  );
}
