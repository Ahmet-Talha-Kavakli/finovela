import type { Metadata } from "next";
import { LegalDoc, LegalSection, LegalCallout } from "@/components/site/legal-doc";

export const metadata: Metadata = {
  title: "Terms of Service — Finovela",
  description:
    "The terms governing your use of Finovela. Finovela is a non-custodial software tool, not a broker or adviser.",
};

export default function TermsPage() {
  return (
    <LegalDoc
      title="Terms of Service"
      updated="June 26, 2026"
      intro={
        <>
          These Terms of Service (&quot;Terms&quot;) form a binding agreement between
          you and Finovela (&quot;Finovela&quot;, &quot;we&quot;, &quot;us&quot;). By
          creating an account or using the platform, you agree to these Terms and to
          our{" "}
          <a href="/privacy" className="text-[#7fb0ff] hover:text-white">Privacy Policy</a>{" "}
          and{" "}
          <a href="/disclaimer" className="text-[#7fb0ff] hover:text-white">Risk Disclaimer</a>.
        </>
      }
    >
      <LegalSection n={1} title="What Finovela Is — and Is Not">
        <p>
          Finovela is a <strong className="text-white">software and analytics platform</strong>. It
          provides portfolio tracking, data visualization, market research, alerts, educational
          content, and AI-assisted informational insights. It also offers optional automation tools
          that act only within the permissions you grant on third-party accounts you choose to
          connect. Finovela is a technology provider only.
        </p>
        <LegalCallout>
          Finovela is <strong>not</strong> a broker-dealer, investment adviser, exchange, money
          transmitter, bank, or custodian. We do <strong>not</strong> hold, transfer, or manage your
          funds or assets (Finovela is fully non-custodial). Nothing in the product is investment,
          financial, legal, or tax advice, a recommendation, a trading signal, or a guarantee of any
          outcome. All information is provided for informational and educational purposes only, and
          all decisions are made solely by you. See the{" "}
          <a href="/disclaimer" className="text-[#7fb0ff] hover:text-white">Risk Disclaimer</a>.
        </LegalCallout>
      </LegalSection>

      <LegalSection n={2} title="Eligibility">
        <p>
          You must be at least 18 years old (or the age of majority in your
          jurisdiction) and legally able to enter into contracts. You are responsible
          for ensuring that your use of Finovela, and any trading you perform, is
          lawful where you live. Finovela may be unavailable or restricted in certain
          jurisdictions.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Your Account">
        <p>
          You are responsible for safeguarding your login credentials and any API keys
          or connections you add. You must notify us promptly of any unauthorized
          access. You are responsible for all activity that occurs under your account.
          Authentication is handled by our identity provider; you agree to its security
          requirements, including any multi-factor authentication you enable.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Connected Accounts & Automations">
        <p>
          When you connect an exchange or brokerage account, you authorize Finovela to
          access it solely within the permissions you grant. You are solely responsible
          for the permissions you enable, the strategies and automations you configure,
          and every resulting order. You can pause or disconnect any connection or
          automation at any time. We strongly recommend granting trade-only access with
          withdrawal permissions disabled.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Subscriptions, Plans & Billing">
        <p>
          Some features require a paid subscription. Prices, plan limits, and features are described
          on our{" "}
          <a href="/pricing" className="text-[#7fb0ff] hover:text-white">pricing page</a>{" "}
          and at checkout, and may change with notice. Subscriptions renew automatically until
          cancelled. You may cancel at any time from your account; access continues until the end of
          the current billing period. Taxes (including VAT/sales tax) may apply based on your
          location and are calculated at checkout.
        </p>
        <p>
          We offer a{" "}
          <strong className="text-white">30-day money-back guarantee</strong> on paid plans. See our{" "}
          <a href="/refund" className="text-[#7fb0ff] hover:text-white">Refund &amp; Cancellation Policy</a>{" "}
          for full details.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Payments & Merchant of Record">
        <p>
          Our order process is conducted by our online reseller{" "}
          <strong className="text-white">Paddle.com</strong>. Paddle.com is the Merchant of Record
          for all our orders. Paddle handles payment processing, billing, sales tax/VAT collection,
          customer billing inquiries, refunds, and returns on our behalf.
        </p>
        <p>
          By completing a purchase, you also agree to Paddle&apos;s{" "}
          <a
            href="https://www.paddle.com/legal/checkout-buyer-terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7fb0ff] hover:text-white"
          >
            Buyer Terms
          </a>
          , which are presented to you at checkout. Paddle is an authorised reseller of the Finovela
          subscription; your payment contract is with Paddle, and your use of the Finovela software is
          governed by these Terms.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Acceptable Use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-6">
          <li>use the platform for any unlawful purpose or market manipulation;</li>
          <li>reverse-engineer, scrape, overload, or attempt to bypass security or rate limits;</li>
          <li>share, resell, or sublicense access without authorization;</li>
          <li>misuse the AI features to generate unlawful, harmful, or misleading content;</li>
          <li>infringe the rights of others or violate any third party&apos;s terms (including connected exchanges).</li>
        </ul>
      </LegalSection>

      <LegalSection n={8} title="Intellectual Property">
        <p>
          Finovela and all related software, designs, trademarks, and content are owned
          by us or our licensors. We grant you a limited, non-exclusive,
          non-transferable, revocable license to use the platform for its intended
          purpose. You retain ownership of content you submit, and grant us a license to
          process it to operate the service.
        </p>
      </LegalSection>

      <LegalSection n={9} title="Third-Party Services">
        <p>
          The platform integrates third-party services (exchanges, brokers, data,
          payment, and AI providers). We are not responsible for their acts, omissions,
          availability, accuracy, or terms. Your use of those services is at your own
          risk and subject to their agreements.
        </p>
      </LegalSection>

      <LegalSection n={10} title="Disclaimers">
        <p>
          The platform is provided &quot;as is&quot; and &quot;as available&quot;
          without warranties of any kind, whether express or implied, including
          merchantability, fitness for a particular purpose, non-infringement,
          accuracy, or uninterrupted or error-free operation. We do not warrant any
          financial outcome.
        </p>
      </LegalSection>

      <LegalSection n={11} title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Finovela and its operators, owners,
          employees, and affiliates will not be liable for any indirect, incidental,
          consequential, special, exemplary, or punitive damages, or for any loss of
          profits, capital, data, goodwill, or trading losses, arising from or related
          to the platform, connected accounts, or automations. Our total aggregate
          liability for any claim will not exceed the greater of the amount you paid us
          in the twelve months before the claim or USD 100.
        </p>
      </LegalSection>

      <LegalSection n={12} title="Indemnification">
        <p>
          You agree to indemnify and hold harmless Finovela and its affiliates from any
          claims, damages, losses, and expenses (including reasonable legal fees)
          arising from your use of the platform, your trading activity, your connected
          accounts, or your breach of these Terms or any law.
        </p>
      </LegalSection>

      <LegalSection n={13} title="Termination">
        <p>
          You may stop using Finovela and delete your account at any time. We may
          suspend or terminate access if you violate these Terms, create risk or legal
          exposure, or where required by law. Provisions that by their nature should
          survive termination (including disclaimers, limitation of liability, and
          indemnification) will survive.
        </p>
      </LegalSection>

      <LegalSection n={14} title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. Material changes will be
          notified through the platform or by email. Your continued use after changes
          take effect constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection n={15} title="Governing Law & Disputes">
        <p>
          These Terms are governed by the laws of the Republic of Türkiye, without
          regard to conflict-of-law rules. The courts and enforcement offices of
          İstanbul (Çağlayan) shall have exclusive jurisdiction, except where mandatory
          consumer-protection law grants you the right to bring proceedings in your
          place of residence.
        </p>
      </LegalSection>

      <LegalSection n={16} title="Contact">
        <p>
          Questions about these Terms? Contact us at{" "}
          <a href="mailto:legal@finovela.com" className="text-[#7fb0ff] hover:text-white">
            legal@finovela.com
          </a>.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
