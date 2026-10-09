import { cubicBezier } from "motion/react";

// One easing curve everywhere. Mirrors --ease-out-soft in globals.css.
export const EASE = [0.22, 1, 0.36, 1] as const;
export const EASE_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";
export const DURATION = { fast: 0.5, base: 0.8, slow: 1.2 } as const;

/** The shared curve as a function (for Lenis, GSAP-free tweens, etc.). */
export const easeOutSoft = cubicBezier(...EASE);
