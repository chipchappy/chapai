import Script from "next/script";

const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{10,}$/;

export default function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  const id = measurementId?.trim();

  if (!id || !GA_MEASUREMENT_ID_PATTERN.test(id)) {
    return null;
  }

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}
