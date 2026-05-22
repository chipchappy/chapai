import type { FrontpageTone } from "./frontpage-types";

type FrontpageSignalRingsProps = {
  tone?: FrontpageTone;
  className?: string;
};

const toneStyles: Record<
  FrontpageTone,
  {
    line: string;
    contour: string;
    accent: string;
    node: string;
  }
> = {
  warm: {
    line: "rgba(108, 102, 94, 0.18)",
    contour: "rgba(126, 157, 134, 0.16)",
    accent: "rgba(90, 127, 136, 0.18)",
    node: "#7E9D86",
  },
  cool: {
    line: "rgba(96, 109, 112, 0.18)",
    contour: "rgba(90, 127, 136, 0.18)",
    accent: "rgba(126, 157, 134, 0.16)",
    node: "#5A7F88",
  },
  sage: {
    line: "rgba(94, 113, 102, 0.18)",
    contour: "rgba(126, 157, 134, 0.18)",
    accent: "rgba(90, 127, 136, 0.16)",
    node: "#7E9D86",
  },
};

export default function FrontpageSignalRings({ tone = "warm", className = "" }: FrontpageSignalRingsProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={`relative aspect-square w-full max-w-[22rem] md:max-w-[30rem] ${className}`.trim()}
      aria-hidden="true"
    >
      <div
        className="absolute inset-[10%] rounded-full"
        style={{ background: "radial-gradient(circle at 54% 48%, rgba(255,255,255,0.62), rgba(255,255,255,0.18) 52%, rgba(255,255,255,0) 76%)" }}
      />
      <svg viewBox="0 0 560 560" className="absolute inset-0 h-full w-full">
        <path
          d="M180 310c0-89 57-165 136-186 21-6 43-9 66-8 56 1 109 24 147 64-17-3-34-4-50-2-55 4-105 31-143 74-38 42-60 96-60 152 0 26 5 51 14 74-66-32-110-101-110-168Z"
          fill="rgba(255,255,255,0.16)"
          stroke={styles.line}
          strokeWidth="1.4"
        />
        <path d="M205 298c0-66 42-123 100-143 46-16 100-10 141 18" fill="none" stroke={styles.line} strokeLinecap="round" strokeWidth="1.45" />
        <path d="M228 307c0-49 32-92 77-108 38-13 80-8 114 14" fill="none" stroke={styles.contour} strokeLinecap="round" strokeWidth="1.3" />
        <path d="M248 316c0-33 21-62 52-74 26-10 55-8 80 6" fill="none" stroke={styles.line} strokeLinecap="round" strokeWidth="1.15" />
        <path d="M178 319c35-18 66-45 91-81 20-29 35-60 46-95" fill="none" stroke={styles.accent} strokeLinecap="round" strokeWidth="1.55" />
        <path d="M247 188c26 19 47 43 61 72 14 29 23 61 27 95" fill="none" stroke={styles.line} strokeLinecap="round" strokeWidth="1.35" />
        <path d="M294 174c17 28 27 58 31 91 3 32 0 63-10 93" fill="none" stroke={styles.contour} strokeLinecap="round" strokeWidth="1.25" />
        <path d="M340 173c10 26 14 53 12 82-2 29-9 57-21 82" fill="none" stroke={styles.line} strokeLinecap="round" strokeWidth="1.15" />
        <path d="M228 360c28-3 56 0 84 8 27 8 52 21 74 39" fill="none" stroke={styles.accent} strokeLinecap="round" strokeWidth="1.25" />
        <circle cx="405" cy="198" r="4.2" fill={styles.node} fillOpacity="0.8" />
        <circle cx="268" cy="212" r="3.2" fill={styles.node} fillOpacity="0.38" />
        <circle cx="356" cy="398" r="3.4" fill={styles.node} fillOpacity="0.28" />
      </svg>
    </div>
  );
}
