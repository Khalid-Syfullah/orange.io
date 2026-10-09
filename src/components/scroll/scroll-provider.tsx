"use client";

import { useEffect } from "react";
import { useReducedMotion } from "motion/react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { engine, velocity, velocityNorm } from "@/lib/progress";
import { REACTIONS } from "@/lib/reactions";

/** Smooths and clamps raw velocity into velocityNorm; exactly 0 at rest. Plain function. */
function stepVelocity(raw: number, deltaMs: number) {
  const target = Math.max(-1, Math.min(1, raw / REACTIONS.velocityRef));
  const cur = velocityNorm.get();
  if (target === 0 && cur === 0) return;
  let next = cur + (target - cur) * Math.min(1, (deltaMs / 1000) * 8);
  if (Math.abs(next) < 0.001 && Math.abs(target) < 0.001) next = 0;
  if (next !== cur) velocityNorm.set(next);
}

/**
 * Starts Lenis, drives it from the GSAP ticker and keeps ScrollTrigger in sync.
 * Native scrolling is preserved (Lenis only smooths it). Writes velocity; the
 * stage writes progress. No React state is touched per frame.
 */
export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ autoRaf: false, syncTouch: false }) // smooth on wheel only; touch keeps native momentum;
    engine.lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number, deltaMs: number) => {
      lenis.raf(time * 1000);
      if (velocity.get() !== lenis.velocity) velocity.set(lenis.velocity);
      stepVelocity(lenis.velocity, deltaMs);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // A hidden tab pauses the ticker; drop any stale velocity so effects rest on return.
    const onVisibility = () => {
      if (document.hidden) {
        velocity.set(0);
        velocityNorm.set(0);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Orientation changes resize late on mobile; refresh once things settle.
    const onOrientation = () => window.setTimeout(() => ScrollTrigger.refresh(), 250);
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      window.removeEventListener("orientationchange", onOrientation);
      document.removeEventListener("visibilitychange", onVisibility);
      gsap.ticker.remove(tick);
      lenis.destroy();
      engine.lenis = null;
      velocity.set(0);
      velocityNorm.set(0);
    };
  }, [reduce]);

  return <>{children}</>;
}
