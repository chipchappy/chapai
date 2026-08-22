"use client";

import { useEffect, useRef } from "react";
import styles from "./TopographyField.module.css";

/**
 * Scroll-reactive contour field for the marketing pages.
 *
 * Renders nothing interactive: a fixed, edge-to-edge stack of contour layers
 * behind all content (`main`/`header`/`footer` are already `z-index: 1`).
 *
 * Scroll drives ONE custom property on the container. Each layer multiplies it
 * by its own depth factor in CSS, so the whole effect costs a single style write
 * per frame and the transforms stay on the compositor. Writing per-layer styles
 * from JS, or animating the gradient centres, would repaint a full-viewport
 * layer every frame.
 */
export default function TopographyField() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Honour the OS setting: no scroll-linked motion at all, and no listener.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    let frame = 0;
    let last = -1;

    const apply = () => {
      frame = 0;
      const y = window.scrollY;
      // Whole pixels only. Sub-pixel churn produces no visible change but does
      // produce a style recalculation on every single scroll event.
      const next = Math.round(y);
      if (next === last) return;
      last = next;
      node.style.setProperty("--topo-y", String(next));
    };

    const onScroll = () => {
      if (frame) return;               // coalesce to one write per frame
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
    <div ref={ref} className={styles.field} aria-hidden="true">
      <div className={`${styles.layer} ${styles.layerFar}`} />
      <div className={`${styles.layer} ${styles.layerMid}`} />
      <div className={`${styles.layer} ${styles.layerNear}`} />
      <div className={styles.veil} />
    </div>
  );
}
