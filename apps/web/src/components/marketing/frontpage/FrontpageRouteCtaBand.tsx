import Link from "next/link";
import type { FrontpageRouteCtaBandProps, FrontpageTone } from "./frontpage-types";

const toneStyles: Record<
  FrontpageTone,
  {
    shell: string;
    label: string;
    title: string;
    body: string;
    note: string;
    primary: string;
    secondary: string;
  }
> = {
  warm: {
    shell: "border-[rgba(24,34,36,0.08)] bg-[rgba(255,255,255,0.84)]",
    label: "text-[#6c6a66]",
    title: "text-[#1E2328]",
    body: "text-[#5a5b59]",
    note: "text-[#6f716e]",
    primary: "bg-[#232a2d] text-white shadow-[0_12px_24px_rgba(35,42,45,0.14)] hover:bg-[#374145]",
    secondary:
      "border-[rgba(24,34,36,0.12)] bg-[rgba(255,255,255,0.88)] text-[#2C3338] hover:border-[rgba(24,34,36,0.24)] hover:bg-white",
  },
  cool: {
    shell: "border-[rgba(24,34,36,0.08)] bg-[rgba(255,255,255,0.84)]",
    label: "text-[#6c6a66]",
    title: "text-[#1E2328]",
    body: "text-[#5a5b59]",
    note: "text-[#6f716e]",
    primary: "bg-[#232a2d] text-white shadow-[0_12px_24px_rgba(35,42,45,0.14)] hover:bg-[#374145]",
    secondary:
      "border-[rgba(24,34,36,0.12)] bg-[rgba(255,255,255,0.88)] text-[#2C3338] hover:border-[rgba(24,34,36,0.24)] hover:bg-white",
  },
  sage: {
    shell: "border-[rgba(24,34,36,0.08)] bg-[rgba(255,255,255,0.84)]",
    label: "text-[#6c6a66]",
    title: "text-[#1E2328]",
    body: "text-[#5a5b59]",
    note: "text-[#6f716e]",
    primary: "bg-[#232a2d] text-white shadow-[0_12px_24px_rgba(35,42,45,0.14)] hover:bg-[#374145]",
    secondary:
      "border-[rgba(24,34,36,0.12)] bg-[rgba(255,255,255,0.88)] text-[#2C3338] hover:border-[rgba(24,34,36,0.24)] hover:bg-white",
  },
};

export default function FrontpageRouteCtaBand({
  label,
  title,
  body,
  primaryAction,
  secondaryAction,
  note,
  tone = "warm",
  className = "",
}: FrontpageRouteCtaBandProps) {
  const styles = toneStyles[tone];

  return (
    <section className={className.trim()}>
      <div
        className={`mx-auto max-w-[1180px] rounded-[20px] border px-6 py-7 md:px-8 md:py-9 ${styles.shell}`.trim()}
      >
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div className="max-w-[29rem]">
            <span className={`font-sans text-[11px] font-semibold uppercase tracking-[0.28em] ${styles.label}`}>
              {label}
            </span>
            <h2 className={`mt-4 text-[clamp(2.2rem,4vw,3.7rem)] leading-[0.98] tracking-[-0.05em] ${styles.title}`}>
              {title}
            </h2>
            <p className={`mt-5 font-sans text-base leading-8 ${styles.body}`}>{body}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Link
              href={primaryAction.href}
              className={`inline-flex items-center justify-center rounded-[14px] px-5 py-3 font-sans text-sm font-semibold transition duration-200 ${styles.primary}`.trim()}
            >
              {primaryAction.label}
            </Link>
            {secondaryAction ? (
              <Link
                href={secondaryAction.href}
                className={`inline-flex items-center justify-center rounded-[14px] border px-5 py-3 font-sans text-sm font-semibold transition duration-200 ${styles.secondary}`.trim()}
              >
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        </div>

        {note ? (
          <div className={`mt-6 border-t border-[rgba(74,85,89,0.08)] pt-5 font-sans text-xs tracking-[0.16em] ${styles.note}`}>
            {note}
          </div>
        ) : null}
      </div>
    </section>
  );
}
