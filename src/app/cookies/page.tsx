import type { Metadata } from "next";
import { LegalDoc, LegalSection } from "@/components/site/legal-doc";

export const metadata: Metadata = {
  title: "Cookie Policy — Finovela",
  description: "How Finovela uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <LegalDoc
      title="Cookie Policy"
      updated="June 26, 2026"
      intro={
        <>
          This policy explains how Finovela uses cookies and similar technologies. For
          more on how we handle data, see our{" "}
          <a href="/privacy" className="text-[#7fb0ff] hover:text-white">Privacy Policy</a>.
        </>
      }
    >
      <LegalSection n={1} title="What Cookies Are">
        <p>
          Cookies are small text files stored on your device. We also use similar
          technologies such as local storage to remember your session and preferences.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Cookies We Use">
        <ul className="list-disc space-y-1.5 pl-6">
          <li><strong>Strictly necessary:</strong> required to sign you in, keep you authenticated, and secure the platform. These cannot be disabled.</li>
          <li><strong>Functional:</strong> remember your settings and preferences (e.g. sidebar state, theme) so the app works the way you left it.</li>
          <li><strong>Analytics (if enabled):</strong> help us understand usage to improve the product. Used in aggregate.</li>
        </ul>
        <p>
          We do not use cookies to sell your data or to build advertising profiles
          across other websites.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Third-Party Cookies">
        <p>
          Some providers we rely on (such as our authentication and payment providers)
          may set their own cookies to deliver their services securely.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Managing Cookies">
        <p>
          You can control or delete cookies through your browser settings. Blocking
          strictly necessary cookies may prevent you from signing in or using core
          features.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Contact">
        <p>
          Questions? Contact{" "}
          <a href="mailto:privacy@finovela.com" className="text-[#7fb0ff] hover:text-white">
            privacy@finovela.com
          </a>.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
