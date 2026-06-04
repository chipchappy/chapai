"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

function SunIcon() {
  return (
    <svg className="theme-toggle__sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="theme-toggle__moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    const initial =
      (document.documentElement.getAttribute("data-theme") as "light" | "dark" | null) ||
      (localStorage.getItem("clarity-theme") as "light" | "dark" | null) ||
      "light";
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("clarity-theme", next);
    } catch {
      // ignore storage failures
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={mounted ? (theme === "light" ? "Switch to dark mode" : "Switch to light mode") : "Toggle theme"}
      aria-pressed={mounted ? theme === "dark" : false}
      onClick={toggle}
    >
      <SunIcon />
      <MoonIcon />
    </button>
  );
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
          <Link href="/quiz">Study now</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <div className={styles.actions}>
          <ThemeToggle />
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
