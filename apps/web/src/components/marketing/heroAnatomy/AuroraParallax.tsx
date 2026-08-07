"use client";

import { useEffect, useRef, type ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Aurora concept A8 — cursor-responsive depth.
//
// Wraps the existing hero orb and gives its layers parallax. Deliberately
// additive: the artwork itself is untouched, so with JavaScript disabled, on
// touch devices, or under prefers-reduced-motion the hero renders exactly as it
// does today. The effect can only ever add.
//
// Depth is applied by CSS custom property rather than by transforming this
// wrapper, so the SVG's own layers move at different rates and the orb reads as
// dimensional instead of as a flat image being slid around.
// ─────────────────────────────────────────────────────────────────────────────

export default function AuroraParallax({ children, className }: { children: ReactNode; className?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    // A coarse pointer means touch: there is no hover to respond to, and
    // reacting to taps would feel like a glitch rather than depth.
    const finePointer = window.matchMedia("(pointer: fine)");

    let raf = 0;
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;
    let active = false;

    const apply = () => {
      currentX += (targetX - currentX) * 0.075;
      currentY += (targetY - currentY) * 0.075;
      host.style.setProperty("--aurora-x", currentX.toFixed(4));
      host.style.setProperty("--aurora-y", currentY.toFixed(4));
      if (Math.abs(targetX - currentX) > 0.0005 || Math.abs(targetY - currentY) > 0.0005) {
        raf = requestAnimationFrame(apply);
      } else {
        raf = 0;
      }
    };

    const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };

    const onMove = (event: PointerEvent) => {
      if (!active) return;
      // Track against the viewport, not the orb: the pointer is usually over the
      // headline on the other side of the hero, and this keeps the response
      // continuous rather than only firing when the cursor is on the artwork.
      targetX = (event.clientX / window.innerWidth) - 0.5;
      targetY = (event.clientY / window.innerHeight) - 0.5;
      schedule();
    };

    const onLeave = () => { targetX = 0; targetY = 0; schedule(); };

    const enable = () => {
      if (active || motionQuery.matches || !finePointer.matches) return;
      active = true;
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", onLeave, { passive: true });
    };

    const disable = () => {
      if (!active) return;
      active = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      targetX = 0; targetY = 0;
      schedule();
    };

    // Stop listening once the hero is scrolled away — no work for an element
    // nobody can see. The host itself is `display: contents` so it has no layout
    // box for the observer to measure; watch the SVG child, which does. Custom
    // properties still inherit from the host regardless of its display.
    const observed = host.firstElementChild ?? host;
    const observer = new IntersectionObserver(
      ([entry]) => (entry?.isIntersecting ? enable() : disable()),
      { threshold: 0.05 },
    );
    observer.observe(observed);

    const onPreferenceChange = () => (motionQuery.matches ? disable() : enable());
    motionQuery.addEventListener("change", onPreferenceChange);

    return () => {
      observer.disconnect();
      motionQuery.removeEventListener("change", onPreferenceChange);
      disable();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={hostRef} className={className} data-aurora-parallax="">
      {children}
    </div>
  );
}
