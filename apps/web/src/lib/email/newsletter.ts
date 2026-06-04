export type NewsletterList = "qotd-daily" | "streak-protection";

export type NewsletterEnrollResult = {
  enrolled: boolean;
  provider: "resend" | "postmark" | "stub";
  reason?: string;
};

function audienceIdForList(list: NewsletterList): string | undefined {
  switch (list) {
    case "qotd-daily":
      return process.env.RESEND_QOTD_AUDIENCE_ID;
    case "streak-protection":
      return (
        process.env.RESEND_STREAK_AUDIENCE_ID ??
        // Fall back to the qotd audience so streak emails still go through
        // Resend's deliverability infra until a dedicated audience exists.
        process.env.RESEND_QOTD_AUDIENCE_ID
      );
  }
}

export async function enrollNewsletter(input: {
  email: string;
  list: NewsletterList;
  source?: string;
}): Promise<NewsletterEnrollResult> {
  const resendKey = process.env.RESEND_API_KEY;
  const audienceId = audienceIdForList(input.list);

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
