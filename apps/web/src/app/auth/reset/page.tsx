import type { Metadata } from "next";
import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { getSupabaseServerUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reset password",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams?: Promise<{ auth?: string; auth_detail?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const user = await getSupabaseServerUser();
  const expired =
    params.auth === "expired" ||
    params.auth === "failed" ||
    params.auth === "missing-link" ||
    params.auth === "unavailable";

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
              Set a new password.
            </h1>
            {user ? (
              <p className="mt-4 text-base leading-7 text-[var(--c-text-body)]">
                You&apos;re signed in via your recovery link as{" "}
                <strong className="text-[var(--c-text-strong)]">{user.email}</strong>. Pick a new
                password — at least 8 characters. We&apos;ll send you back to sign in once it&apos;s
                saved.
              </p>
            ) : (
              <p className="mt-4 text-base leading-7 text-[var(--c-text-body)]">
                {expired
                  ? "Your reset link expired or could not be verified. Request a fresh link below."
                  : "Open this page from the reset link in your email. Reset links expire after one hour."}
              </p>
            )}
          </div>

          {user ? (
            <ResetPasswordForm />
          ) : (
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/auth/forgot"
                className="inline-flex w-fit items-center justify-center rounded-[14px] bg-[var(--c-sage-deep)] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[var(--c-sage-deep-hover)]"
              >
                Request a new reset link
              </Link>
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-[var(--c-text-strong)] underline decoration-[var(--c-border-strong)] underline-offset-4 hover:text-[var(--c-gold-deep)]"
              >
                Back to sign in
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
