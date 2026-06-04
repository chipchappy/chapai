export type AnalyticsEvent =
  | "hero_primary_cta_clicked"
  | "hero_secondary_cta_clicked"
  | "signup_completed"
  | "newsletter_optin"
  | "sample_question_completed"
  | "sample_question_to_signup"
  | "daily_limit_hit"
  | "daily_limit_to_upgrade_click"
  | "qotd_email_opened"
  | "competitor_expose_email_opened"
  | "quiz_question_answered"
  | "quiz_marked_for_review"
  | "quiz_status_set"
  | "tutor_continue_drill_clicked"
  | "achievement_toast_shown"
  | "share_streak_clicked"
  | "share_streak_downloaded";

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: AnalyticsProps) => void;
    posthog?: {
      capture: (eventName: string, params?: AnalyticsProps) => void;
    };
  }
}

export function trackEvent(eventName: AnalyticsEvent, props: AnalyticsProps = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.gtag?.("event", eventName, props);
  window.posthog?.capture(eventName, props);
}
