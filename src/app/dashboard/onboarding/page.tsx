import { redirect } from "next/navigation";

// Onboarding artık tam-ekran sinematik /onboarding rotasında (dashboard
// layout'u/sidebar olmadan). Eski bağlantılar kırılmasın diye yönlendirilir.
export default function DashboardOnboardingRedirect() {
  redirect("/onboarding");
}
