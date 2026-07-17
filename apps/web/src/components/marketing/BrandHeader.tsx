"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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

type AuthState = { status: "loading" | "in" | "out"; email: string | null };

function useAuthState(): AuthState {
  const [auth, setAuth] = useState<AuthState>({ status: "loading", email: null });
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/status", { headers: { accept: "application/json" } });
        const json = (await res.json().catch(() => null)) as
          | { authenticated?: boolean; email?: string | null; data?: { authenticated?: boolean; email?: string | null } }
          | null;
        const data = json?.data ?? json ?? {};
        if (!active) return;
        setAuth(data.authenticated ? { status: "in", email: data.email ?? null } : { status: "out", email: null });
      } catch {
        // Fail toward the signed-out chrome so anonymous visitors still get the CTAs.
        if (active) setAuth({ status: "out", email: null });
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  return auth;
}

function AccountMenu({ email }: { email: string | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initial = (email?.trim()?.[0] ?? "•").toUpperCase();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    // Hover opens on desktop; tap toggles on touch; Escape / click-outside close.
    <div
      ref={ref}
      className={styles.account}
      data-open={open}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={styles.accountTrigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.accountAvatar} aria-hidden="true">{initial}</span>
        {email ? <span className={styles.accountEmail}>{email}</span> : null}
      </button>
      <div className={styles.accountMenu} role="menu">
        {email ? <p className={styles.accountMenuEmail}>{email}</p> : null}
        <Link role="menuitem" className={styles.accountMenuItem} href="/dashboard" onClick={() => setOpen(false)}>
          Dashboard
        </Link>
        <Link role="menuitem" className={styles.accountMenuItem} href="/account" onClick={() => setOpen(false)}>
          Account settings
        </Link>
        <a role="menuitem" className={`${styles.accountMenuItem} ${styles.accountMenuSignout}`} href="/auth/logout">
          Sign out
        </a>
      </div>
    </div>
  );
}

export default function BrandHeader() {
  const auth = useAuthState();
  return (
    <header className={styles.header} data-premium-chrome="true">
      <div className={styles.inner}>
        <Link href="/" aria-label="Clarity home">
          <BrandMark />
        </Link>
        <nav className={styles.nav} aria-label="Primary">
          <Link href="/nclex">NCLEX</Link>
          <Link href="/quiz">Study now</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/programs">For Programs</Link>
        </nav>
        <div className={styles.actions}>
          <ThemeToggle />
          {auth.status === "in" ? (
            <AccountMenu email={auth.email} />
          ) : auth.status === "out" ? (
            <>
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
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
