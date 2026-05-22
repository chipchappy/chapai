import type { Metadata } from "next";
import BrandMark from "@/components/brand/BrandMark";
import AuthMagicLinkForm from "@/components/auth/AuthMagicLinkForm";

export const metadata: Metadata = {
  title: "Sign in",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string; auth?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const nextPath = params.next?.startsWith("/") ? params.next : "/account/billing";
  const authState = params.auth;
  const authMessages: Record<string, string> = {
    unavailable: "Sign-in is temporarily unavailable. Give it a minute, then request a fresh link.",
    "missing-link": "That sign-in link is incomplete. Request a fresh link below.",
    expired: "That sign-in link expired. Request a fresh link below to continue.",
    failed: "We could not complete sign-in from that link. Request a fresh link below.",
  };
  const authMessage = authState ? authMessages[authState] ?? authMessages.failed : null;

  return (
    <main className="min-h-screen bg-bg px-4 py-10 md:py-14">
      <div className="mx-auto max-w-[720px]">
        <section className="rounded-[30px] border border-[rgba(74,85,89,0.08)] bg-[rgba(255,252,247,0.95)] p-6 shadow-card md:p-8">
          <BrandMark />
          <div className="mt-6 max-w-[34rem]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">Account access</span>
            <h1 className="mt-4 font-serif text-[clamp(2.8rem,5vw,4.4rem)] leading-[0.94] text-dark">
              Sign in to continue.
            </h1>
            <p className="mt-4 text-base leading-7 text-muted">
              Launch week auth uses a secure sign-in link. Use the same email you want tied to checkout, billing
              status, quiz history, and tutor usage.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Continuing creates or resumes your hosted ChapAI account under Chapai Solutions LLC.
            </p>
            {authMessage ? (
              <div className="mt-5 rounded-[18px] border border-[rgba(74,85,89,0.1)] bg-[rgba(255,255,255,0.78)] px-4 py-3 text-sm leading-6 text-dark">
                {authMessage}
              </div>
            ) : null}
          </div>

          <AuthMagicLinkForm nextPath={nextPath} />
        </section>
      </div>
    </main>
  );
}
