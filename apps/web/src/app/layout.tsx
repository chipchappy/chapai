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

const SITE_URL = "https://claritynclex.com";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? SITE_URL),
  title: {
    default: "Clarity Clinical Prep | Free NCLEX Practice Test & NGN Question Bank",
    template: "%s | Clarity Clinical Prep",
  },
  description:
    "Free NCLEX practice test with real NGN case studies, SATA, bow-tie, and matrix questions. Premium bank starts at $9.99/mo — undercuts UWorld, Kaplan, and Bootcamp.",
  keywords: [
    "free NCLEX practice test",
    "free NCLEX practice questions",
    "free NCLEX prep",
    "free NCLEX NGN questions",
    "free NCLEX case studies",
    "NCLEX-RN practice exam",
    "NGN case studies",
    "NCLEX SATA questions",
    "NCLEX bow tie questions",
    "NCLEX matrix questions",
    "NCLEX prioritization questions",
    "NCLEX delegation questions",
    "NCLEX pharmacology questions",
    "NCLEX practice questions free",
    "free nursing exam prep",
    "CCRN practice questions",
    "AI nursing tutor",
    "Next Generation NCLEX practice",
  ],
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.jpg", type: "image/jpeg" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.jpg",
    apple: [{ url: "/apple-icon.jpg", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "Clarity Clinical Prep | Free NCLEX Practice Test & NGN Bank",
    description:
      "Free NCLEX practice test, premium NGN question bank, AI tutor, and 5 readiness exams — for NCLEX-RN test-takers. From $9.99/mo.",
    type: "website",
    url: SITE_URL,
    siteName: "Clarity Clinical Prep",
    locale: "en_US",
    images: [
      { url: "/logo.png", width: 512, height: 512, alt: "Clarity Clinical Prep" },
      { url: "/brand/clarity-c-logo.jpg", width: 251, height: 242, alt: "Clarity C logo" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clarity Clinical Prep | Free NCLEX Practice Test & NGN Bank",
    description: "Free NCLEX practice test, premium NGN bank, AI tutor, and 5 readiness exams.",
    images: ["/logo.png"],
  },
  category: "education",
  applicationName: "Clarity Clinical Prep",
  creator: "Chapai Solutions LLC",
  publisher: "Chapai Solutions LLC",
};

const globalSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "Clarity Clinical Prep",
      alternateName: ["Clarity NCLEX", "ChapAI", "Chapai Solutions"],
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.png`,
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://www.tiktok.com/@claritynclex",
        "https://www.instagram.com/claritynclex",
        "https://www.youtube.com/@claritynclex",
        "https://x.com/claritynclex",
        "https://www.linkedin.com/company/chapai-solutions",
      ],
      parentOrganization: {
        "@type": "Organization",
        name: "Chapai Solutions LLC",
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@chapaisolutions.com",
        availableLanguage: ["English"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Clarity Clinical Prep",
      description:
        "Free NCLEX practice test, premium NGN question bank, AI tutor, and 5 readiness exams.",
      publisher: { "@id": `${SITE_URL}/#org` },
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/quiz?category={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE_URL}/#edu`,
      name: "Clarity Clinical Prep",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description:
        "Online nursing exam preparation platform for NCLEX-RN and CCRN candidates.",
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const env = getServerEnv();

  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} ${ibmPlexMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalSchema) }}
        />
      </head>
      <body className="font-sans text-[var(--c-text)] antialiased">
        <GoogleAnalytics measurementId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        <BrandHeader />
        {children}
        <FooterMinimal />
      </body>
    </html>
  );
}
