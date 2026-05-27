"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";
import styles from "./CtaButtons.module.css";

function withCurrentUtm(path: string, searchParams: URLSearchParams) {
  const next = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("utm_") || key === "gclid" || key === "fbclid") {
      next.set(key, value);
    }
  }
  const suffix = next.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export default function CtaButtons({ surface = "hero" }: { surface?: string }) {
  return (
    <div className={styles.wrap}>
      <Link
        className={styles.primary}
        href="/auth/signup"
        onClick={(event) => {
          trackEvent("hero_primary_cta_clicked", { surface });
          const href = withCurrentUtm("/auth/signup", new URLSearchParams(window.location.search));
          if (href !== "/auth/signup") {
            event.preventDefault();
            window.location.assign(href);
          }
        }}
      >
        Start free&nbsp;<span aria-hidden="true">&rarr;</span>
      </Link>
      <Link
        className={styles.secondary}
        href="/quiz/sample"
        onClick={() => trackEvent("hero_secondary_cta_clicked", { surface })}
      >
        Try a sample question
      </Link>
    </div>
  );
}
