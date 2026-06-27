import type { Metadata } from "next";
import { LegalDoc, LegalSection } from "@/components/site/legal-doc";

export const metadata: Metadata = {
  title: "Contact — Finovela",
  description: "Get in touch with Finovela. Support, billing, and company information.",
};

export default function ContactPage() {
  return (
    <LegalDoc
      title="Contact Us"
      updated="June 27, 2026"
      intro={
        <p>
          We&apos;re here to help. Reach out for product support, billing questions, or anything else
          — we read every message.
        </p>
      }
    >
      <LegalSection n={1} title="Customer Support">
        <p>
          For help with the product, your account, or technical issues, email us at{" "}
          <a href="mailto:support@finovela.com" className="text-[#7aa2ff] underline">
            support@finovela.com
          </a>
          . We aim to respond within 1 business day.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Billing & Payments">
        <p>
          Payments and billing for Finovela are handled by{" "}
          <strong className="text-white">Paddle.com</strong>, our reseller and Merchant of Record.
          For invoices, receipts, refunds, or to manage your subscription, you can use the link in
          your Paddle receipt email, or contact us at{" "}
          <a href="mailto:billing@finovela.com" className="text-[#7aa2ff] underline">
            billing@finovela.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection n={3} title="Company Information">
        <p>
          <strong className="text-white">Finovela</strong>
          <br />
          Email: support@finovela.com
          <br />
          Website: finovela.com
        </p>
        <p className="text-white/45">
          Note: Replace the placeholders above with your registered legal entity name, business
          address, and tax/VAT ID before submitting to Paddle — these must match the entity on your
          Paddle account.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
