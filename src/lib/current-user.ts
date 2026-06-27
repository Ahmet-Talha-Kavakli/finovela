// Sunucu tarafı geçerli kullanıcı — Clerk varsa gerçek kullanıcı, yoksa demo.
// Server component'lerde / API route'larda kullanılır.

import { CLERK_ENABLED, DEMO_USER } from "./auth";

export type VelaUser = {
  id: string;
  name: string;
  email: string;
  plan: string;
  imageUrl?: string;
};

export async function getCurrentUser(): Promise<VelaUser> {
  if (!CLERK_ENABLED) return DEMO_USER;
  try {
    const { currentUser } = await import("@clerk/nextjs/server");
    const u = await currentUser();
    if (!u) return DEMO_USER;
    const name =
      [u.firstName, u.lastName].filter(Boolean).join(" ") ||
      u.username ||
      u.emailAddresses[0]?.emailAddress?.split("@")[0] ||
      "Investor";
    return {
      id: u.id,
      name,
      email: u.emailAddresses[0]?.emailAddress ?? "",
      plan: "Pro",
      imageUrl: u.imageUrl,
    };
  } catch {
    return DEMO_USER;
  }
}

/** Sadece userId — gevşek sürüm. Kritik OLMAYAN/demo gösterim için. */
export async function getUserId(): Promise<string> {
  if (!CLERK_ENABLED) return DEMO_USER.id;
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    return userId ?? DEMO_USER.id;
  } catch {
    return DEMO_USER.id;
  }
}

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Katı userId — KALICI veri rotaları (state, decisions) için.
 * - Clerk açıksa: gerçek Clerk userId; oturum yoksa null (route 401 dönsün).
 * - Clerk kapalı + geliştirme: demo-user'a düşer (yerel akış bozulmasın).
 * - Clerk kapalı + ÜRETİM: null döner (sessizce açılmaz).
 * İstemciden gelen kimlik ASLA kullanılmaz — yalnızca sunucudaki oturum.
 */
export async function requireUserId(): Promise<string | null> {
  if (!CLERK_ENABLED) {
    // Üretimde Clerk yapılandırılmamışsa kalıcı veriyi açma.
    return IS_PROD ? null : DEMO_USER.id;
  }
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}
