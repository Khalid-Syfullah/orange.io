import { motionValue } from "motion/react";

/**
 * The one shared scroll progress value (0-1). The scroll engine (Lenis + one
 * GSAP ScrollTrigger) writes to it; everything else only reads it.
 */
export const progress = motionValue(0);

/** Scroll the page so that global progress `p` is at the viewport top. */
export function scrollToProgress(p: number) {
  if (typeof window === "undefined") return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: Math.max(0, max) * p, behavior: "smooth" });
}
