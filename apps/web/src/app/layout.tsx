import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Instrument_Serif, Inter, Newsreader, Outfit } from "next/font/google";
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

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Fraunces kept as a fallback layer (already loaded) but the primary
// display face is now Instrument Serif — sleek, wavy letterforms with
// almost-italic flow even at the upright weight. Reads as modern graphic
// design + premium editorial in one face.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: ["400"],
  style: ["normal", "italic"],
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
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
    <html lang="en" className={`${inter.variable} ${newsreader.variable} ${ibmPlexMono.variable} ${outfit.variable} ${fraunces.variable} ${instrumentSerif.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('clarity-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`,
          }}
        />
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
