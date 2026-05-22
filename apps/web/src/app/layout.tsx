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
    url: "https://claritynclex.chapaisolutions.com",
    siteName: "Clarity Clinical Prep",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clarity Clinical Prep | Premium NCLEX and CCRN prep",
    description: "Original questions, AI tutor, and a cleaner clinical study system.",
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
