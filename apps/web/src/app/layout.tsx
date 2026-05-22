import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Newsreader } from "next/font/google";
import "@/styles/globals.css";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import BrandHeader from "@/components/marketing/BrandHeader";
import FooterMinimal from "@/components/marketing/FooterMinimal";
import { getServerEnv } from "@/lib/env";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://claritynclex.chapaisolutions.com"),
  title: {
    default: "Clarity Clinical Prep | Premium NCLEX and CCRN prep",
    template: "%s | Clarity Clinical Prep",
  },
  description:
    "Free NCLEX practice test and premium NGN question bank with original clinical scenarios, AI rationale, 5 readiness exams, and a calmer study flow. Start free, full bank $9.99/mo.",
  keywords: [
    "free NCLEX practice test",
    "free NCLEX practice questions",
    "NCLEX practice questions",
    "NGN case studies",
    "NCLEX-RN practice exam",
    "CCRN practice questions",
    "AI tutor nursing",
    "nursing exam prep",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.jpg",
    shortcut: "/icon.jpg",
    apple: "/apple-icon.jpg",
  },
  openGraph: {
    title: "Clarity Clinical Prep | Free NCLEX Practice Test & NGN Bank",
    description: "Free NCLEX practice test, premium NGN question bank, AI tutor, and 5 readiness exams — for ICU nurses and NCLEX-RN test-takers.",
    type: "website",
    url: "https://claritynclex.chapaisolutions.com",
    siteName: "Clarity Clinical Prep",
    images: [{ url: "/brand/clarity-c-logo.jpg", width: 251, height: 242, alt: "Clarity Clinical Prep" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clarity Clinical Prep | Free NCLEX Practice Test & NGN Bank",
    description: "Free NCLEX practice test, premium NGN bank, AI tutor, and 5 readiness exams.",
    images: ["/brand/clarity-c-logo.jpg"],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const env = getServerEnv();

  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans text-[var(--c-text)] antialiased">
        <GoogleAnalytics measurementId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        <BrandHeader />
        {children}
        <FooterMinimal />
      </body>
    </html>
  );
}
