import Image from "next/image";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export default function BrandMark({ compact = false, className = "" }: BrandMarkProps) {
  const mark = (
    <span
      className="site-mark-icon flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden"
      style={{ background: "transparent", border: "0", boxShadow: "none", borderRadius: "16px" }}
    >
      <Image
        src="/brand/clarity-c-logo.jpg"
        alt="Clarity C logo"
        width={112}
        height={112}
        priority
        className="h-full w-full rounded-[16px] object-contain"
      />
    </span>
  );

  if (compact) {
    return (
      <span className={`site-mark site-mark-compact ${className}`.trim()}>
        {mark}
      </span>
    );
  }

  return (
    <span className={`site-mark site-mark-wordmark ${className}`.trim()}>
      {mark}
      <span className="site-mark-copy">
        <strong>Clarity</strong>
        <small>Clinical Prep</small>
      </span>
    </span>
  );
}
