"use client";

import { useEffect, useRef } from "react";
import styles from "./TopographyHero.module.css";

/**
 * The hero globe: a contour-mapped sphere with the Clarity mark at its centre
 * and orbit rings around it.
 *
 * Three layers rather than one flat image, because they have to move
 * independently — rotating a single raster would spin the "C" along with the
 * terrain, which reads as a logo tumbling rather than a world turning. So:
 *
 *   contours  slow continuous rotation (the globe turning)
 *   mark      fixed, never rotates
 *   orbits    slower counter-rotation, so the two do not appear locked
 *
 * Scroll adds a small extra rotation on top, driven by one custom property.
 * Everything is transform-only and stays on the compositor.
 */
export default function TopographyHero({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let last = -1;
    const apply = () => {
      frame = 0;
      const next = Math.round(window.scrollY);
      if (next === last) return;
      last = next;
      node.style.setProperty("--globe-scroll", String(next));
    };
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={`${styles.globe} ${className ?? ""}`} aria-hidden="true">
      <div className={styles.orbits} />
      <div className={styles.contours} />
      {/* Raster, not SVG: this is the original hand-drawn mark from the brand
          sheet rather than a redraw, so it stays the same artwork. */}
      <img className={styles.mark} src="/brand/globe-mark.webp" alt="" width={520} height={520} loading="eager" fetchPriority="high" decoding="async" draggable={false} />
    </div>
  );
}
