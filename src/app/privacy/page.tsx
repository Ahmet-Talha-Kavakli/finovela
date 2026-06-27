import type { Metadata } from "next";
import { LegalDoc, LegalSection } from "@/components/site/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy — Finovela",
  description:
    "How Finovela collects, uses, and protects your data. We never hold your funds and never sell your personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      updated="June 26, 2026"
      intro={
        <>
          This Privacy Policy explains what data Finovela collects, how we use it, and
          the choices you have. We respect your privacy, we never sell your personal
          data, and we never take custody of your funds. Turkish users should also read
          our{" "}
          <a href="/kvkk" className="text-[#7fb0ff] hover:text-white">KVKK Aydınlatma Metni</a>.
        </>
      }
    >
      <LegalSection n={1} title="Who We Are">
        <p>
          Finovela operates this platform and is the data controller for the personal
          data described here. You can reach us at{" "}
          <a href="mailto:privacy@finovela.com" className="text-[#7fb0ff] hover:text-white">
            privacy@finovela.com
          </a>.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Data We Collect">
        <ul className="list-disc space-y-1.5 pl-6">
          <li><strong>Account data:</strong> name, email, and authentication details, handled by our identity provider (Clerk).</li>
          <li><strong>Profile data:</strong> the risk profile, goals, and preferences you provide during onboarding.</li>
          <li><strong>Usage data:</strong> portfolios, watchlists, alerts, chats, automations, and settings you create in the app.</li>
          <li><strong>Connection metadata:</strong> which exchanges/brokers you connect and the scope of access you grant. API keys are stored encrypted and used only to perform the actions you configure.</li>
          <li><strong>Technical data:</strong> device, browser, IP address, and log data needed for security and to operate the service.</li>
          <li><strong>Payment data:</strong> processed by our payment provider; we do not store full card numbers.</li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="How We Use Your Data">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>to provide, maintain, and improve the platform and its features;</li>
          <li>to authenticate you and keep your account and connections secure;</li>
          <li>to power AI features (your prompts and relevant context are sent to our AI provider to generate responses);</li>
          <li>to process subscriptions, credits, and payments;</li>
          <li>to communicate service, security, and (with consent) marketing messages;</li>
          <li>to comply with legal obligations and prevent fraud or abuse.</li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Legal Bases (GDPR/KVKK)">
        <p>
          Where applicable, we process data to perform our contract with you, based on
          your consent (e.g. marketing), to comply with legal obligations, and for our
          legitimate interests in operating and securing the service. You may withdraw
          consent at any time.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Service Providers We Share With">
        <p>We share data only with providers that help us run the service, under contract, including:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>authentication (Clerk);</li>
          <li>hosting and database infrastructure;</li>
          <li>AI providers (e.g. Anthropic) to generate responses;</li>
          <li>market-data and news providers;</li>
          <li>payment processors;</li>
          <li>the exchanges/brokers you choose to connect.</li>
        </ul>
        <p>We do not sell your personal data to anyone.</p>
      </LegalSection>

      <LegalSection n={6} title="API Keys & Connected Accounts">
        <p>
          Credentials for connected accounts are encrypted at rest and used solely to
          execute the actions you configure. We recommend granting trade-only access
          with withdrawals disabled. You can revoke a connection at any time, which
          removes our stored access for that account.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Data Retention">
        <p>
          We keep your data while your account is active and as needed to provide the
          service. When you delete your account, we delete or anonymize your personal
          data, except where we must retain certain records to meet legal, accounting,
          or security obligations.
        </p>
      </LegalSection>

      <LegalSection n={8} title="International Transfers">
        <p>
          Our providers may process data in countries other than yours. Where required,
          we rely on appropriate safeguards (such as standard contractual clauses) for
          these transfers.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Your Rights">
        <p>
          Depending on your jurisdiction, you may have the right to access, correct,
          delete, export, or restrict processing of your data, and to object to
          processing or withdraw consent. You can manage your profile in-app, delete
          your account from settings, or contact{" "}
          <a href="mailto:privacy@finovela.com" className="text-[#7fb0ff] hover:text-white">
            privacy@finovela.com
          </a>{" "}
          to exercise any right.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Security">
        <p>
          We use industry-standard measures including encryption, access controls, and
          rate limiting. No system is perfectly secure; please use a strong password
          and enable multi-factor authentication.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Children">
        <p>Finovela is not intended for anyone under 18, and we do not knowingly collect data from children.</p>
      </LegalSection>

      <LegalSection n={12} title="Changes & Contact">
        <p>
          We may update this policy and will notify you of material changes. Questions?
          Contact{" "}
          <a href="mailto:privacy@finovela.com" className="text-[#7fb0ff] hover:text-white">
            privacy@finovela.com
          </a>. See also our{" "}
          <a href="/cookies" className="text-[#7fb0ff] hover:text-white">Cookie Policy</a>.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
