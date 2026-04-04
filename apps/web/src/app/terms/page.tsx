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
        <h1 className="mt-3 font-serif text-[2.6rem] leading-[0.95] text-dark">ChapAI Terms and Conditions</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted">
          These terms govern access to ChapAI, including question-bank access, AI tutor usage, subscription plans,
          creator or tester access, and related outreach programs.
        </p>
        <p className="mt-3 text-sm text-muted">Effective date: April 2, 2026</p>
      </section>

      <div className="mt-8 grid gap-8">
        <TermsSection title="Educational product only">
          <p>
            ChapAI is an educational study product for CCRN and NCLEX preparation. It does not provide medical advice,
            clinical supervision, licensure guarantees, or patient-care instructions.
          </p>
          <p>
            Buying, testing, or using the product does not guarantee an exam result, a credential, a job outcome, or
            clinical competency.
          </p>
        </TermsSection>

        <TermsSection title="Accounts, plans, and payment">
          <p>
            Some features require a paid plan, approved creator/tester access, or other controlled entry. Prices,
            access windows, and package structure may change over time.
          </p>
          <p>
            If a payment processor is used, billing is handled through that processor. Access may be paused or removed
            for failed payments, abuse, fraud, or policy violations.
          </p>
        </TermsSection>

        <TermsSection title="Acceptable use">
          <p>
            Users may not abuse the service, scrape content, share paid access without permission, interfere with
            operations, submit harmful content, or use the product in a way that harms the platform, other users, or
            our partners.
          </p>
          <p>
            Creator, tester, reviewer, or demo keys may be revoked at any time if they are misused, redistributed, or
            used outside their intended scope.
          </p>
        </TermsSection>

        <TermsSection title="Service changes and availability">
          <p>
            We may update, pause, improve, replace, or remove features, content, plans, or integrations at any time.
            The service may occasionally be unavailable for maintenance, infrastructure changes, or third-party outages.
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
