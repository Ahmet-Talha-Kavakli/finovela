// Clerk yapılandırma kontrolü + güvenli auth yardımcıları.
// Clerk anahtarları YOKSA uygulama demo modunda çalışmaya devam eder
// (mevcut dashboard bozulmaz); anahtarlar girilince gerçek auth devreye girer.

// Publishable key yalnızca client'a sızan değişkendir. CLERK_ENABLED bu değere
// dayanır ki HEM sunucu HEM tarayıcı aynı sonucu versin. (Önceki sürüm
// CLERK_SECRET_KEY'i de kontrol ediyordu; o değişken client'ta undefined olduğu
// için tüm client component'lerinde CLERK_ENABLED yanlışlıkla false oluyor,
// gerçek kullanıcı yerine demo "Alex Morgan" gösteriliyordu.)
const PUB = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const CLERK_ENABLED =
  !!PUB && !PUB.includes("YOUR_") && !PUB.includes("placeholder");

/** Demo modda kullanılan sahte kullanıcı (Clerk yoksa). */
export const DEMO_USER = {
  id: "demo-user",
  name: "Alex Morgan",
  email: "alex@example.com",
  plan: "Pro",
};
