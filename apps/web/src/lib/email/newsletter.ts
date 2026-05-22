type NewsletterList = "qotd-daily";

export type NewsletterEnrollResult = {
  enrolled: boolean;
  provider: "resend" | "postmark" | "stub";
  reason?: string;
};

export async function enrollNewsletter(input: {
  email: string;
  list: NewsletterList;
  source?: string;
}): Promise<NewsletterEnrollResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_QOTD_AUDIENCE_ID;

  if (resendKey && audienceId) {
    const response = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        unsubscribed: false,
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (response.ok || response.status === 409) {
      return { enrolled: true, provider: "resend" };
    }

    return { enrolled: false, provider: "resend", reason: `resend_${response.status}` };
  }

  return { enrolled: false, provider: "stub", reason: "newsletter_provider_not_configured" };
}
