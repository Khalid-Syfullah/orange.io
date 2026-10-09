"use client";

import { useEffect } from "react";
import { useMotionValueEvent } from "motion/react";
import { progress } from "@/lib/progress";
import { studioPose } from "@/scroll/studio";

const BAND = 160; // px of viewport top where the fixed chrome sits

/** How much of the chrome band an element covers, 0..1. */
function coverage(el: Element | null): number {
  if (!el) return 0;
  const r = el.getBoundingClientRect();
  return Math.min(1, Math.max(0, (Math.min(r.bottom, BAND) - Math.max(r.top, 0)) / BAND));
}

/**
 * Writes --press-mix (0 to 1) onto the root so the chrome's text and hairlines
 * follow what is under them: the deepening studio inside the stage (only while
 * the stage covers the chrome), and every dark \`--press\` panel after it.
 * A direct style write: no React state.
 */
export function PressTheme() {
  const write = () => {
    const stage = studioPose(progress.get()).press * coverage(document.querySelector("[data-stage]"));
    let panels = 0;
    document.querySelectorAll("[data-press]").forEach((el) => {
      panels = Math.max(panels, coverage(el));
    });
    const m = Math.max(stage, panels);
    // the chapter rail belongs to the stage: it fades as the stage scrolls away
    const st = document.querySelector("[data-stage]");
    const rail = st ? Math.min(1, Math.max(0, (st.getBoundingClientRect().bottom - window.innerHeight * 0.5) / (window.innerHeight * 0.4))) : 1;
    const rv = rail >= 0.999 ? "" : rail.toFixed(3);
    if (document.documentElement.style.getPropertyValue("--rail-opacity") !== rv) {
      if (rv) document.documentElement.style.setProperty("--rail-opacity", rv);
      else document.documentElement.style.removeProperty("--rail-opacity");
    }
    const root = document.documentElement;
    const next = m <= 0.001 ? "" : m.toFixed(3);
    if (root.style.getPropertyValue("--press-mix") !== next) {
      if (next) root.style.setProperty("--press-mix", next);
      else root.style.removeProperty("--press-mix");
    }
  };
  useEffect(() => {
    write();
    window.addEventListener("scroll", write, { passive: true });
    window.addEventListener("resize", write);
    return () => {
      window.removeEventListener("scroll", write);
      window.removeEventListener("resize", write);
      document.documentElement.style.removeProperty("--press-mix");
      document.documentElement.style.removeProperty("--rail-opacity");
    };
  }, []);
  useMotionValueEvent(progress, "change", write);
  return null;
}
