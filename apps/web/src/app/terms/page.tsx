import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions | ChapAI",
  description: "Terms and Conditions for ChapAI, including educational-use limits, subscriptions, acceptable use, and account rules.",
  alternates: {
    canonical: "/terms",
  },
};

function TermsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-border bg-[rgba(255,252,247,0.88)] p-6 shadow-card md:p-8">
      <h2 className="font-serif text-[1.8rem] leading-[1.02] text-dark">{title}</h2>
      <div className="mt-4 space-y-4 text-[1rem] leading-7 text-muted">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="page-shell">
      <section className="rounded-[32px] border border-border bg-[rgba(251,249,243,0.9)] p-6 shadow-card md:p-8">
        <span className="section-label">Terms and conditions</span>
        <h1 className="mt-3 font-serif text-[2.6rem] leading-[0.95] text-dark">Chapai Solutions LLC Terms and Conditions</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
          These terms govern access to ChapAI, including question-bank access, AI tutor usage, subscription plans,
          creator or tester access, and related launch programs.
        </p>
        <p className="mt-3 text-sm text-muted">Effective date: April 7, 2026</p>
      </section>

      <div className="mt-8 grid gap-8">
        <TermsSection title="Educational product only">
          <p>
            ChapAI is an educational study product for CCRN and NCLEX preparation. It does not provide medical advice,
            clinical supervision, licensure guarantees, or patient-care instructions.
          </p>
          <p>
            Buying, testing, or using the product does not guarantee an exam result, credential, job outcome, or
            clinical competency. You remain responsible for independent clinical judgment and compliance with your own
            professional standards.
          </p>
        </TermsSection>

        <TermsSection title="Accounts, plans, and payment">
          <p>
            Some features require a paid plan, approved creator/tester access, or other controlled entry. Prices,
            access windows, package structure, and feature availability may change over time.
          </p>
          <p>
            Billing is handled through Stripe and access is tied to the account and entitlement state recorded on our
            systems. Access may be paused, limited, or removed for failed payments, chargebacks, abuse, fraud, policy
            violations, or suspected unauthorized sharing.
          </p>
          <p>
            Launch plans are billed as described at checkout. Fixed-term passes expire at the end of the purchased
            access window. Subscription plans renew until canceled, subject to the terms of the payment processor and
            the applicable billing cycle.
          </p>
        </TermsSection>

        <TermsSection title="Refunds, renewals, and cancellations">
          <p>
            Unless a specific plan states otherwise or applicable law requires otherwise, purchases are generally
            non-refundable after checkout has been completed and access has been granted.
          </p>
          <p>
            You can cancel a subscription through the billing flow or payment portal when available. Cancellation
            stops future renewals, but access may continue through the end of the paid period if the plan is still
            active at the time of cancellation.
          </p>
          <p>
            Failed payments, expired passes, or canceled subscriptions may cause premium access to end or downgrade.
            We may retry payments or send notices as permitted by our processors and account settings.
          </p>
        </TermsSection>

        <TermsSection title="Acceptable use">
          <p>
            Users may not abuse the service, scrape or systematically extract content, share paid access without
            permission, interfere with operations, submit unlawful or harmful content, or use the product in a way
            that harms the platform, other users, or our partners.
          </p>
          <p>
            Creator, tester, reviewer, or demo keys may be revoked at any time if they are misused, redistributed, or
            used outside their intended scope.
          </p>
        </TermsSection>

        <TermsSection title="AI tutor and content limits">
          <p>
            The AI tutor is provided for educational support only. It may rely on the question stem, answer choices,
            correct answer, rationale, concept notes, and approved references when available, but it can still be
            wrong or incomplete.
          </p>
          <p>
            You should not rely on the tutor as a substitute for professional judgment, and you should not assume
            every question will include expanded references, diagrams, or deep explanations.
          </p>
        </TermsSection>

        <TermsSection title="Intellectual property">
          <p>
            The service, site design, branding, text, software, and other materials we provide are owned by us or our
            licensors and are protected by law. We grant you a limited, non-exclusive, non-transferable, revocable
            license to use the service for your own study purposes while you comply with these terms.
          </p>
          <p>
            You may not copy, republish, resell, scrape, or create derivative products from the service content
            without our written permission.
          </p>
        </TermsSection>

        <TermsSection title="Service changes and availability">
          <p>
            We may update, pause, improve, replace, or remove features, content, plans, or integrations at any time.
            The service may occasionally be unavailable for maintenance, infrastructure changes, or third-party outages.
          </p>
          <p>
            We are not responsible for delays or failures caused by networks, hosts, payment processors, authentication
            providers, cloud infrastructure, or other third-party services.
          </p>
        </TermsSection>

        <TermsSection title="Warranty disclaimer and liability">
          <p>
            The service is provided on an as-is and as-available basis. To the fullest extent allowed by law, we
            disclaim warranties of merchantability, fitness for a particular purpose, and non-infringement.
          </p>
          <p>
            To the fullest extent allowed by law, our liability for claims related to the service will be limited to
            the amount you paid to us for the relevant paid period or access window giving rise to the claim.
          </p>
          <p>
            You agree to indemnify us for claims arising out of your misuse of the service, violation of these terms,
            or infringement of third-party rights.
          </p>
        </TermsSection>

        <TermsSection title="Disputes and governing law">
          <p>
            These terms are governed by the laws of California, without regard to conflict-of-law rules, unless
            another governing law is required for the Chapai Solutions LLC entity after formal review.
          </p>
          <p>
            Any dispute procedure, venue, class-action waiver, or arbitration provision will be enforced only to the
            extent permitted by applicable law and any later legal review.
          </p>
        </TermsSection>

        <TermsSection title="Contact">
          <p>
            For questions about these terms, account issues, or access concerns, contact{" "}
            <a className="underline decoration-[rgba(32,30,34,0.28)] underline-offset-4" href="mailto:hello@chapaisolutions.com">
              hello@chapaisolutions.com
            </a>
            .
          </p>
        </TermsSection>
      </div>
    </main>
  );
}
