"use client";

import { useEffect } from "react";
import { useReducedMotion } from "motion/react";
import { REACTIONS, pointerX, pointerY, sheen, sheenX, sheenY } from "@/lib/reactions";

/** Decays the sheen toward exactly 0. Plain function (called from a rAF loop). */
function decay(dtMs: number): boolean {
  const s = sheen.get();
  if (s <= 0) return false;
  const next = s * Math.exp(-dtMs / REACTIONS.sheenDecayMs);
  sheen.set(next < 0.003 ? 0 : next);
  return next >= 0.003;
}

/**
 * Feeds pointer position (for parallax) and a decaying sheen (for the shader
 * highlight) into MotionValues. Active only with a fine hovering pointer and
 * without reduced motion; the loop runs only while the sheen is decaying and
 * stops when the tab is hidden.
 */
export function PointerReactions() {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;

    let raf = 0;
    let last = 0;
    let lastX = 0;
    let lastY = 0;

    const loop = (t: number) => {
      const dt = last ? Math.min(t - last, 64) : 16;
      last = t;
      raf = decay(dt) ? requestAnimationFrame(loop) : 0;
      if (!raf) last = 0;
    };
    const start = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      pointerX.set((e.clientX / w) * 2 - 1);
      pointerY.set((e.clientY / h) * 2 - 1);
      sheenX.set(e.clientX / w);
      sheenY.set(1 - e.clientY / h);
      // faster movement lights the sheen more; it never exceeds 1
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
      sheen.set(Math.min(1, Math.max(sheen.get(), 0.35 + dist / 50)));
      start();
    };
    const onLeave = () => {
      pointerX.set(0);
      pointerY.set(0);
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
        sheen.set(0);
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(raf);
      sheen.set(0);
      pointerX.set(0);
      pointerY.set(0);
    };
  }, [reduce]);

  return null;
}
