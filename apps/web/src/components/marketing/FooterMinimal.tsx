import Link from "next/link";
import BrandMark from "@/components/brand/BrandMark";

function IconWrap({ children, label, href }: { children: React.ReactNode; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="clarity-footer__social"
    >
      {children}
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function TiktokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 3v10.5a2.5 2.5 0 1 1-2.5-2.5V8.4a6.4 6.4 0 1 0 6.4 6.4V8.6a6.5 6.5 0 0 0 3.1.8V6.3a4.3 4.3 0 0 1-3.5-2A4.3 4.3 0 0 1 16.4 3z" />
    </svg>
  );
}

function YoutubeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a2.4 2.4 0 0 0-1.7-1.7C18.5 5 12 5 12 5s-6.5 0-7.9.5A2.4 2.4 0 0 0 2.4 7.2 25 25 0 0 0 2 12a25 25 0 0 0 .4 4.8 2.4 2.4 0 0 0 1.7 1.7C5.5 19 12 19 12 19s6.5 0 7.9-.5a2.4 2.4 0 0 0 1.7-1.7A25 25 0 0 0 22 12a25 25 0 0 0-.4-4.8zM10 15V9l5 3z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.797l-4.92-6.49L4.6 22H2l7.04-8.04L2 2h6.97l4.45 6.02zm-1.19 18h1.65L7.06 4H5.32z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 .02 5 2.5 2.5 0 0 1-.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.02-3-1.82-3-1.82 0-2.1 1.42-2.1 2.9V21h-4z" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-3.65 19.31c-.09-.78-.17-1.97.04-2.82.18-.74 1.18-4.72 1.18-4.72s-.3-.6-.3-1.5c0-1.4.81-2.45 1.82-2.45.86 0 1.27.65 1.27 1.42 0 .87-.55 2.16-.83 3.36-.24 1 .5 1.82 1.5 1.82 1.8 0 3.18-1.9 3.18-4.63 0-2.42-1.74-4.12-4.22-4.12-2.88 0-4.57 2.16-4.57 4.39 0 .87.33 1.8.75 2.31a.3.3 0 0 1 .07.29c-.08.32-.25 1-.28 1.14-.04.18-.15.22-.33.13-1.24-.58-2.02-2.4-2.02-3.86 0-3.14 2.28-6.03 6.58-6.03 3.46 0 6.14 2.46 6.14 5.75 0 3.43-2.16 6.2-5.17 6.2-1.01 0-1.96-.53-2.28-1.15l-.62 2.36c-.23.86-.83 1.94-1.24 2.6A10 10 0 1 0 12 2z" />
    </svg>
  );
}

export default function FooterMinimal() {
  const year = new Date().getFullYear();

  return (
    <footer className="clarity-footer" data-premium-chrome="true">
      <div className="clarity-footer__inner">
        <div>
          <BrandMark />
          <p className="clarity-footer__brand-blurb">
            Premium NCLEX-RN and CCRN prep that costs less than a Sunday coffee. Built by nurses who refused to pay $500 for question banks.
          </p>
          <div className="clarity-footer__socials">
            <IconWrap label="Instagram" href="https://www.instagram.com/claritynclex"><InstagramIcon /></IconWrap>
            <IconWrap label="TikTok" href="https://www.tiktok.com/@claritynclex"><TiktokIcon /></IconWrap>
            <IconWrap label="YouTube" href="https://www.youtube.com/@claritynclex"><YoutubeIcon /></IconWrap>
            <IconWrap label="X" href="https://x.com/claritynclex"><XIcon /></IconWrap>
            <IconWrap label="LinkedIn" href="https://www.linkedin.com/company/chapai-solutions"><LinkedinIcon /></IconWrap>
            <IconWrap label="Pinterest" href="https://www.pinterest.com/claritynclex"><PinterestIcon /></IconWrap>
          </div>
        </div>

        <nav className="clarity-footer__column" aria-label="Practice">
          <div className="clarity-footer__column-title">Practice</div>
          <ul>
            <li><Link href="/quiz">Question runner</Link></li>
            <li><Link href="/free">Free questions</Link></li>
            <li><Link href="/free/nclex-case-studies">Case studies</Link></li>
            <li><Link href="/free/nclex-ngn-questions">NGN questions</Link></li>
            <li><Link href="/free/nclex-practice-exam">Practice exam</Link></li>
          </ul>
        </nav>

        <nav className="clarity-footer__column" aria-label="Tools">
          <div className="clarity-footer__column-title">Tools</div>
          <ul>
            <li><Link href="/tools/nclex-countdown">NCLEX countdown</Link></li>
            <li><Link href="/tools/nclex-readiness-calculator">Readiness calculator</Link></li>
            <li><Link href="/tools/dosage-calculator">Dosage calculator</Link></li>
            <li><Link href="/nclex-lab-values">Lab values</Link></li>
            <li><Link href="/nclex-glossary">Glossary</Link></li>
            <li><Link href="/nclex-requirements">State requirements</Link></li>
          </ul>
        </nav>

        <nav className="clarity-footer__column" aria-label="Company">
          <div className="clarity-footer__column-title">Company</div>
          <ul>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/auth/login">Sign in</Link></li>
            <li><Link href="/auth/signup">Start free</Link></li>
            <li><Link href="/account/settings">Settings</Link></li>
            <li><a href="mailto:support@chapaisolutions.com">Contact</a></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
        </nav>

        <nav className="clarity-footer__column" aria-label="Legal">
          <div className="clarity-footer__column-title">Legal</div>
          <ul>
            <li><Link href="/privacy">Privacy</Link></li>
            <li><Link href="/terms">Terms</Link></li>
          </ul>
        </nav>
      </div>

      <div className="clarity-footer__bottom">
        <span>&copy; {year} Chapai Solutions LLC · Clarity Clinical Prep</span>
        <span>Independent NCLEX-RN&reg; &amp; CCRN&reg; prep · Not affiliated with NCSBN or AACN</span>
      </div>

      <p className="clarity-footer__legal">
        NCLEX&reg;, NCLEX-RN&reg;, and NCLEX-PN&reg; are registered trademarks of the National Council of State Boards of Nursing, Inc. (NCSBN&reg;). CCRN&reg; is a registered trademark of the American Association of Critical-Care Nurses (AACN). Clarity Clinical Prep is an independent study tool and is not affiliated with, endorsed by, sponsored by, or otherwise connected to NCSBN or AACN. All practice questions are original works created by our team and are not actual exam questions or official exam content. These marks are referenced solely to describe the exams this product helps users prepare for.
      </p>
    </footer>
  );
}
