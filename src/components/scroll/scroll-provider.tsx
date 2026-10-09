"use client";

import { useEffect } from "react";
import { useReducedMotion } from "motion/react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { engine, velocity } from "@/lib/progress";

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

    const lenis = new Lenis({ autoRaf: false });
    engine.lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => {
      lenis.raf(time * 1000);
      if (velocity.get() !== lenis.velocity) velocity.set(lenis.velocity);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Orientation changes resize late on mobile; refresh once things settle.
    const onOrientation = () => window.setTimeout(() => ScrollTrigger.refresh(), 250);
    window.addEventListener("orientationchange", onOrientation);

    return () => {
      window.removeEventListener("orientationchange", onOrientation);
      gsap.ticker.remove(tick);
      lenis.destroy();
      engine.lenis = null;
      velocity.set(0);
    };
  }, [reduce]);

  return <>{children}</>;
}
