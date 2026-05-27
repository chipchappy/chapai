"use client";

import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";
import { trackEvent } from "@/lib/analytics";
import styles from "./BrandHeader.module.css";

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

export default function BrandHeader() {
  return (
    <header className={styles.header} data-premium-chrome="true">
      <div className={styles.inner}>
        <Link href="/" aria-label="Clarity home">
          <BrandMark />
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          <Link href="/nclex">NCLEX</Link>
          <Link href="/ccrn">CCRN</Link>
          <Link href="/free">Free practice</Link>
          <Link href="/tools/nclex-countdown">Tools</Link>
          <Link href="/quiz">Practice</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <div className={styles.actions}>
          <Link className={styles.ghost} href="/auth/login">
            Sign in
          </Link>
          <Link
            className={styles.primary}
            href="/auth/signup"
            onClick={(event) => {
              trackEvent("hero_primary_cta_clicked", { surface: "header" });
              const href = withCurrentUtm("/auth/signup", new URLSearchParams(window.location.search));
              if (href !== "/auth/signup") {
                event.preventDefault();
                window.location.assign(href);
              }
            }}
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
