import type { Metadata } from "next";
import BrandMark from "@/components/brand/BrandMark";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="mx-auto max-w-[720px]">
        <section className="rounded-[30px] border border-[var(--c-border-soft)] bg-[var(--c-surface-glass)] p-6 shadow-[var(--c-shadow-card)] backdrop-blur-md md:p-8">
          <BrandMark />
          <div className="mt-6 max-w-[34rem]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--c-text-muted)]">
              Account recovery
            </span>
            <h1 className="mt-4 font-serif text-[clamp(2.4rem,5vw,3.8rem)] leading-[0.94] text-[var(--c-text-strong)]">
              Forgot your password?
            </h1>
            <p className="mt-4 text-base leading-7 text-[var(--c-text-body)]">
              Enter the email on your Clarity account. We&apos;ll send a secure link to reset your
              password. The link expires after one hour.
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--c-text-muted)]">
              Not sure which email you used? Try any address you&apos;ve used with us — we&apos;ll
              still send the link if there&apos;s a matching account.
            </p>
          </div>

          <ForgotPasswordForm />
        </section>
      </div>
    </main>
  );
}
