import { motionValue } from "motion/react";
import type Lenis from "lenis";
import { CHAPTERS } from "./timeline";
import { easeOutSoft } from "./motion";

/**
 * The one shared scroll progress value (0-1). The scroll engine (Lenis + one
 * GSAP ScrollTrigger over the stage) writes to it; everything else only reads it.
 */
export const progress = motionValue(0);

/** Scroll velocity in px per frame (signed), written by the scroll engine. */
export const velocity = motionValue(0);

/**
 * Smoothed, clamped velocity in -1..1 for effects (smear, breath, cloud drift).
 * Snaps to exactly 0 once scrolling stops, so every effect returns to rest.
 */
export const velocityNorm = motionValue(0);

type Engine = { lenis: Lenis | null; stage: HTMLElement | null };
export const engine: Engine = { lenis: null, stage: null };

/** Scroll so that global progress `p` is at the top of the viewport. */
export function scrollToProgress(p: number, opts: { immediate?: boolean } = {}) {
  if (typeof window === "undefined") return;
  const stage = engine.stage;
  const top = stage ? stage.getBoundingClientRect().top + window.scrollY : 0;
  const span = stage ? stage.offsetHeight - window.innerHeight : document.documentElement.scrollHeight - window.innerHeight;
  const target = top + Math.max(0, span) * p;
  if (engine.lenis) {
    engine.lenis.resize(); // limits can be stale right after a resize
    // duration grows with distance (in viewport heights), same easing as the UI
    const dist = Math.abs(target - window.scrollY) / window.innerHeight;
    const duration = Math.min(4, 0.8 + dist * 0.08);
    engine.lenis.scrollTo(target, { immediate: opts.immediate, duration, easing: easeOutSoft });
  } else {
    window.scrollTo({ top: target, behavior: opts.immediate ? "auto" : "smooth" });
  }
}

/** Jump to a chapter: progress when the stage exists, otherwise its static section. */
export function scrollToChapter(i: number) {
  if (engine.stage) return scrollToProgress(CHAPTERS[i].at);
  document.getElementById(`chapter-${CHAPTERS[i].id}`)?.scrollIntoView({ behavior: "smooth" });
}
