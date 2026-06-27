import type { Metadata } from "next";
import { LegalDoc, LegalSection, LegalCallout } from "@/components/site/legal-doc";

export const metadata: Metadata = {
  title: "Risk Disclaimer — Finovela",
  description:
    "Important risk disclosure. Finovela is not a broker, does not custody funds, and does not provide investment advice. Trading involves substantial risk of loss.",
};

export default function DisclaimerPage() {
  return (
    <LegalDoc
      title="Risk Disclaimer"
      updated="June 26, 2026"
      intro={
        <>
          Please read this disclaimer carefully before using Finovela. By accessing
          or using the platform you acknowledge and accept every statement below. If
          you do not agree, do not use Finovela.
        </>
      }
    >
      <LegalCallout>
        <strong>Finovela is not a broker-dealer, investment adviser, exchange, bank,
        or custodian.</strong> We never take possession of, hold, or control your
        money or assets. We do not provide personalized investment advice. Nothing on
        this platform is a recommendation, solicitation, or offer to buy or sell any
        security, cryptocurrency, derivative, or other financial instrument. All
        trading and investment decisions are made by you, at your sole discretion and
        risk.
      </LegalCallout>

      <LegalSection n={1} title="No Investment Advice">
        <p>
          The information, tools, signals, automations, AI-generated content,
          strategies, scores, and analyses provided by Finovela are for informational
          and educational purposes only. They do not constitute, and must not be
          relied upon as, financial, investment, legal, tax, or accounting advice.
          Finovela does not consider your individual financial situation, objectives,
          or needs. You should consult a licensed professional before making any
          financial decision.
        </p>
      </LegalSection>

      <LegalSection n={2} title="Non-Custodial — You Control Your Own Accounts">
        <p>
          Finovela operates on a non-custodial basis. Where you choose to connect an
          external exchange or brokerage account, you do so using credentials (such as
          API keys) issued by that third party and held under your own account. We
          strongly recommend connecting only with permissions limited to trading, and
          never with withdrawal or transfer permissions enabled.
        </p>
        <p>
          Finovela does not hold your funds, cannot withdraw your funds, and is not
          responsible for the solvency, security, availability, or conduct of any
          third-party exchange or broker you connect. Your relationship with those
          providers is governed by their own terms.
        </p>
      </LegalSection>

      <LegalSection n={3} title="Automated Trading Risk">
        <p>
          Automated and algorithmic trading carries unique and significant risks,
          including but not limited to: software errors, latency, connectivity
          failures, incorrect configuration, unexpected market conditions, slippage,
          partial fills, and the possibility that an automation executes orders you did
          not intend. Automations may continue to operate during volatile or illiquid
          markets and may amplify losses. You are solely responsible for monitoring,
          configuring, and disabling any automation, and for every order placed in
          your connected accounts.
        </p>
      </LegalSection>

      <LegalSection n={4} title="Market & Loss Risk">
        <p>
          Trading and investing in stocks, ETFs, options, futures, foreign exchange,
          and cryptocurrencies involves a substantial risk of loss and is not suitable
          for every investor. You may lose some or all of your invested capital, and
          in leveraged products you may lose more than your initial deposit.
          Cryptocurrency markets are especially volatile and may be unregulated in your
          jurisdiction.
        </p>
      </LegalSection>

      <LegalSection n={5} title="No Performance Guarantee">
        <p>
          Past performance, back-tested results, simulated performance, and
          hypothetical results are not indicative of future results. Simulated or
          "paper" results have inherent limitations and do not represent actual
          trading. No representation is made that any account will or is likely to
          achieve profits or losses similar to those shown.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Third-Party Data">
        <p>
          Market data, prices, news, fundamentals, and other content may be provided
          by third parties, may be delayed, and may contain errors or omissions.
          Finovela does not guarantee the accuracy, completeness, timeliness, or
          availability of any data and is not liable for any decision made in reliance
          on it.
        </p>
      </LegalSection>

      <LegalSection n={7} title="Your Responsibility">
        <p>
          You are responsible for determining whether any transaction, strategy, or
          product is appropriate for you in light of your financial situation, risk
          tolerance, experience, and the laws of your jurisdiction. You are responsible
          for complying with all applicable laws, including securities and tax laws,
          and for reporting and paying any taxes due.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Finovela and its operators,
          owners, employees, and affiliates shall not be liable for any direct,
          indirect, incidental, consequential, special, or punitive damages, or for any
          loss of profits, capital, data, or opportunity, arising out of or related to
          your use of the platform, any connected account, any automation, or any
          reliance on any content — even if advised of the possibility of such damages.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
