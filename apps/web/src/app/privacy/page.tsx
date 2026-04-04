import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | ChapAI",
  description: "Privacy Policy for ChapAI, including how quiz, tutor, billing, and email-signup data are handled.",
  alternates: {
    canonical: "/privacy",
  },
};

function PrivacySection({
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

export default function PrivacyPage() {
  return (
    <main className="page-shell">
      <section className="rounded-[32px] border border-border bg-[rgba(251,249,243,0.9)] p-6 shadow-card md:p-8">
        <span className="section-label">Privacy policy</span>
        <h1 className="mt-3 font-serif text-[2.6rem] leading-[0.95] text-dark">ChapAI Privacy Policy</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
          ChapAI is an educational product for CCRN and NCLEX preparation. This page explains what information we
          collect, how we use it, and how to contact us if you want data deleted or updated.
        </p>
        <p className="mt-3 text-sm text-muted">Effective date: April 2, 2026</p>
      </section>

      <div className="mt-8 grid gap-8">
        <PrivacySection title="What we collect">
          <p>
            We may collect account information, contact information, quiz and tutor usage, plan or checkout events,
            email signups, and support or outreach replies.
          </p>
          <p>
            We also store product-usage information such as question attempts, selected answers, tutor prompts, and
            study-flow actions so the product can deliver progress tracking, explanations, and better study guidance.
          </p>
        </PrivacySection>

        <PrivacySection title="How we use information">
          <p>
            We use information to run the product, deliver question-bank access, process billing, send the daily
            question or approved marketing emails, improve question quality, support users, and reduce abuse.
          </p>
          <p>
            We may also use aggregated, non-identifying product signals to improve the tutor, review flow, diagrams,
            rationale quality, and conversion surfaces.
          </p>
        </PrivacySection>

        <PrivacySection title="Third-party processors">
          <p>
            ChapAI may rely on third-party providers for payment processing, AI responses, remote operator control,
            outbound email, analytics, hosting, or social-platform integrations. These may include Stripe, Anthropic,
            Telegram, Resend, X, Meta, Cloudflare, and other similar infrastructure providers used to operate the
            product.
          </p>
          <p>
            We do not sell personal information. We only use processors that help us run, improve, support, or grow
            the product.
          </p>
        </PrivacySection>

        <PrivacySection title="Educational use only">
          <p>
            ChapAI is a study product. It is not medical advice, not a substitute for clinical judgment, and not a
            HIPAA-covered clinical documentation system. Users should not submit protected health information or
            real-world patient records into the tutor or quiz system.
          </p>
        </PrivacySection>

        <PrivacySection title="Retention, deletion, and contact">
          <p>
            We retain information only as long as reasonably necessary to operate the service, support users, maintain
            subscriptions, improve quality, and comply with legal obligations.
          </p>
          <p>
            To request deletion, correction, or account help, contact{" "}
            <a className="underline decoration-[rgba(32,30,34,0.28)] underline-offset-4" href="mailto:hello@chapaisolutions.com">
              hello@chapaisolutions.com
            </a>
            .
          </p>
        </PrivacySection>
      </div>
    </main>
  );
}
