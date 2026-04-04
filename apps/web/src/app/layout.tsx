import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import "@/styles/globals.css";
import BrandMark from "@/components/brand/BrandMark";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://clarityccrn.chapaisolutions.com"),
  title: {
    default: "Clarity Clinical Prep | Premium NCLEX and CCRN prep",
    template: "%s | Clarity Clinical Prep",
  },
  description:
    "Premium NCLEX and CCRN preparation with original clinical scenarios, AI rationale, cleaner design, and a calmer medical-tech study flow.",
  keywords: [
    "CCRN practice questions",
    "NCLEX practice questions",
    "CCRN study tool",
    "NCLEX study tool",
    "AI tutor nursing",
    "critical care exam prep",
    "nursing exam prep",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Clarity Clinical Prep | Premium NCLEX and CCRN prep",
    description: "Original questions, AI tutor, and a cleaner clinical study system for ICU nurses and NCLEX test-takers.",
    type: "website",
    url: "/",
    siteName: "Clarity Clinical Prep",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clarity Clinical Prep | Premium NCLEX and CCRN prep",
    description: "Original questions, AI tutor, and a cleaner clinical study system.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-bg font-sans text-dark antialiased">
        <nav className="site-nav-wrap">
          <div className="mx-auto flex h-20 max-w-7xl items-center gap-5 rounded-full border border-[rgba(74,85,89,0.08)] bg-[rgba(255,251,245,0.9)] px-5 shadow-[0_14px_40px_rgba(52,48,41,0.06)] backdrop-blur md:px-7">
            <Link href="/" className="shrink-0">
              <BrandMark />
            </Link>
            <div className="hidden flex-1 items-center justify-center gap-5 font-sans text-sm font-medium text-[#61676B] md:flex">
              <a href="/">Home</a>
              <a href="/nclex">NCLEX</a>
              <a href="/ccrn">CCRN</a>
              <a href="/quiz">Practice</a>
              <a href="/upgrade">Plans</a>
            </div>
            <div className="ml-auto flex items-center gap-3 md:gap-5">
              <a
                href="/demo-access"
                className="hidden items-center justify-center rounded-full border border-[rgba(74,85,89,0.14)] bg-transparent px-4 py-2.5 font-sans text-sm font-semibold text-[#4A5559] transition hover:border-[rgba(74,85,89,0.3)] md:inline-flex"
              >
                Enter Key
              </a>
              <a
                href="/upgrade"
                className="inline-flex items-center justify-center rounded-full bg-[#4A5559] px-5 py-3 font-sans text-sm font-semibold text-white transition hover:bg-[#3B4549]"
              >
                Get Access
              </a>
            </div>
          </div>
        </nav>
        {children}
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="site-footer-brand">
              <BrandMark />
              <p>Original nursing exam products with a calmer clinical surface.</p>
            </div>
            <div className="site-footer-links">
              <a href="/ccrn">CCRN</a>
              <a href="/nclex">NCLEX</a>
              <a href="/upgrade">Plans</a>
              <a href="/quiz">Practice</a>
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
