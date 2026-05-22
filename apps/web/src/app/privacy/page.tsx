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
        <h1 className="mt-3 font-serif text-[2.6rem] leading-[0.95] text-dark">Chapai Solutions LLC Privacy Policy</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
          ChapAI is an educational product for CCRN and NCLEX preparation. This policy explains what we collect,
          why we collect it, how we share it, and the choices available to you.
        </p>
        <p className="mt-3 text-sm text-muted">Effective date: April 7, 2026</p>
      </section>

      <div className="mt-8 grid gap-8">
        <PrivacySection title="Information we collect">
          <p>
            We collect information you provide directly, including your name, email address, passwordless login
            details, billing contact details, subscription selections, messages you send us, and any account
            preferences you save.
          </p>
          <p>
            We also collect product-use information such as quiz starts, answer selections, score history, tutor
            prompts, plan status, device and browser metadata, IP address or approximate location derived from it,
            and session identifiers used to keep the service working.
          </p>
          <p>
            If you contact support, sign up for emails, or complete a checkout, we may collect the information needed
            to respond, authenticate you, deliver access, and verify your transaction.
          </p>
        </PrivacySection>

        <PrivacySection title="How we use information">
          <p>
            We use information to provide the service, authenticate accounts, unlock paid access, process billing,
            deliver quiz and tutor features, show billing and account status, send product and transactional email,
            maintain security, prevent abuse, and support the product.
          </p>
          <p>
            We may also use aggregated or de-identified information to improve question quality, session flow, tutor
            reliability, diagnostics, and operational performance.
          </p>
        </PrivacySection>

        <PrivacySection title="How we share information">
          <p>
            We do not sell personal information. We share information only when necessary to operate the service,
            including with vendors that process payments, host the application, store data, send email, monitor
            errors, provide analytics, or generate AI responses.
          </p>
          <p>
            Our current processors and infrastructure providers include Stripe, Supabase, Cloudflare, Sentry,
            PostHog, and our AI provider used for tutor responses when enabled. We may also use other service providers
            that help us run and secure the product.
          </p>
        </PrivacySection>

        <PrivacySection title="Educational use only">
          <p>
            ChapAI is a study product only. It is not medical advice, not a substitute for clinical judgment, and not
            a clinical documentation system. You should not submit protected health information, patient names,
            patient identifiers, chart excerpts, or other real-world patient records into the service.
          </p>
          <p>
            The product is designed for NCLEX and CCRN preparation. Any examples, tutor responses, rationales, or
            diagrams are educational in nature and should not be used as a source of truth for patient care.
          </p>
        </PrivacySection>

        <PrivacySection title="Retention and deletion">
          <p>
            We retain information only as long as reasonably necessary to operate the service, support users,
            maintain subscriptions, improve quality, meet security obligations, and comply with law.
          </p>
          <p>
            You may request access, correction, deletion, or account help by contacting{" "}
            <a className="underline decoration-[rgba(32,30,34,0.28)] underline-offset-4" href="mailto:hello@chapaisolutions.com">
              hello@chapaisolutions.com
            </a>
            .
          </p>
        </PrivacySection>

        <PrivacySection title="Cookies, analytics, and security">
          <p>
            We use cookies, local storage, and similar technologies for authentication, session continuity, billing,
            account personalization, and product analytics. We may also use error monitoring and performance tools to
            keep the site reliable.
          </p>
          <p>
            We do not knowingly collect more data than is needed to operate the service, and we take reasonable
            measures to protect the information we store.
          </p>
        </PrivacySection>

        <PrivacySection title="Your choices and contact">
          <p>
            You can stop receiving marketing email by using the unsubscribe link in the message, and you can manage
            certain account or billing settings through the app once signed in.
          </p>
          <p>
            If you have questions about this policy, contact{" "}
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
