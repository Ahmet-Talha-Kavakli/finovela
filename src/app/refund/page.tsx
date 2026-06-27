import type { Metadata } from "next";
import { LegalDoc, LegalSection, LegalCallout } from "@/components/site/legal-doc";

export const metadata: Metadata = {
  title: "Refund Policy — Finovela",
  description:
    "Finovela's refund and cancellation policy. 30-day money-back guarantee. Orders processed by Paddle.com, our Merchant of Record.",
};

export default function RefundPolicyPage() {
  return (
    <LegalDoc
      title="Refund & Cancellation Policy"
      updated="June 27, 2026"
      intro={
        <p>
          We want you to be completely satisfied with Finovela. This policy explains how refunds and
          cancellations work for your subscription. Our order process and payments are handled by{" "}
          <strong className="text-white">Paddle.com</strong>, our reseller and Merchant of Record.
        </p>
      }
    >
      <LegalCallout>
        <strong className="text-white">30-day money-back guarantee — no questions asked.</strong>{" "}
        If you are not satisfied with Finovela for any reason, contact us within 30 days of your
        purchase and we will issue a full refund. No conditions, no fine print.
      </LegalCallout>

      <LegalSection n={1} title="Merchant of Record">
        <p>
          Our order process is conducted by our online reseller{" "}
          <strong className="text-white">Paddle.com</strong>. Paddle.com is the Merchant of Record
          for all our orders. Paddle handles payment processing, billing, sales tax/VAT, customer
          billing inquiries, and the administration of refunds and returns on our behalf.
        </p>
        <p>
          When you purchase a subscription, your contract for the payment is with Paddle, and your
          use of the Finovela software is governed by our{" "}
          <a href="/terms" className="text-[#7aa2ff] underline">
            Terms of Service
          </a>
          . Paddle&apos;s{" "}
          <a
            href="https://www.paddle.com/legal/checkout-buyer-terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#7aa2ff] underline"
          >
            Buyer Terms
          </a>{" "}
          also apply to your transaction and are presented to you at checkout.
        </p>
      </LegalSection>

      <LegalSection n={2} title="30-Day Money-Back Guarantee">
        <p>
          Every paid Finovela plan comes with a 30-day money-back guarantee. If you request a refund
          within 30 days of your initial purchase, you will receive a full refund of the amount paid,
          for any reason. You do not need to provide a justification.
        </p>
        <p>
          Refunds are issued to your original payment method by Paddle. Depending on your bank or card
          issuer, it may take up to 14 days for the refunded amount to appear on your statement.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Statutory Withdrawal Rights">
        <p>
          In addition to our guarantee above, you may have statutory rights to withdraw from your
          purchase under your local consumer-protection law. For example, customers in the EU, EEA,
          United Kingdom, Switzerland, Turkey and certain other jurisdictions have the right to
          withdraw from a digital purchase within 14 days.
        </p>
        <p>
          Note that, for digital products, this statutory withdrawal right may be lost once you begin
          downloading, streaming, or actively using the product after giving your express consent —
          but our 30-day money-back guarantee above still applies regardless.
        </p>
      </LegalSection>

      <LegalSection n={4} title="How to Request a Refund">
        <p>You can request a refund in either of the following ways:</p>
        <p>
          • Email us at{" "}
          <a href="mailto:support@finovela.com" className="text-[#7aa2ff] underline">
            support@finovela.com
          </a>{" "}
          with your order/receipt details, or
          <br />• Use the &ldquo;Manage subscription&rdquo; link in your Paddle receipt email to
          contact Paddle&apos;s billing support directly.
        </p>
        <p>
          We aim to respond to all refund requests within 2 business days. Once approved, Paddle
          processes the refund automatically.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Cancelling Your Subscription">
        <p>
          You can cancel your subscription at any time from{" "}
          <a href="/dashboard/billing" className="text-[#7aa2ff] underline">
            Dashboard → Subscription
          </a>
          , which opens the secure Paddle billing portal. When you cancel:
        </p>
        <p>
          • Your plan remains active until the end of the current billing period — you keep access to
          everything you paid for.
          <br />• You will not be charged again.
          <br />• No further action is required; there is no cancellation fee.
        </p>
        <p>
          After cancellation, your account reverts to the Free plan. You can resubscribe at any time.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Free Plan">
        <p>
          Finovela offers a Free plan with no payment required. Because no charge is made, the refund
          terms above apply only to paid (Pro and Unlimited) subscriptions.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Questions">
        <p>
          If you have any questions about this policy, contact us at{" "}
          <a href="mailto:support@finovela.com" className="text-[#7aa2ff] underline">
            support@finovela.com
          </a>
          . Billing and payment questions can also be directed to Paddle, our Merchant of Record, via
          your receipt email.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
