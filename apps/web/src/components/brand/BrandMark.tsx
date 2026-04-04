import Image from "next/image";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export default function BrandMark({ compact = false, className = "" }: BrandMarkProps) {
  const mark = (
    <span
      className="site-mark-icon flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden"
      style={{ background: "transparent", border: "0", boxShadow: "none", borderRadius: "18px" }}
    >
      <Image
        src="/brand/clarity-c-logo.jpg"
        alt="Clarity C logo"
        width={88}
        height={88}
        className="h-full w-full rounded-[18px] object-contain"
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
