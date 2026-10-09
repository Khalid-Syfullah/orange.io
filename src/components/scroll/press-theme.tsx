"use client";

import { useEffect } from "react";
import { useMotionValueEvent } from "motion/react";
import { progress } from "@/lib/progress";
import { studioPose } from "@/scroll/studio";

/**
 * Writes --press-mix (0 to 1) onto the root as the studio deepens to the press
 * tone, so the chrome's text and hairlines turn cream with it. A direct style
 * write: no React state, nothing per frame beyond the property itself.
 */
export function PressTheme() {
  const write = (p: number) => {
    const m = studioPose(p).press;
    const root = document.documentElement;
    const prev = root.style.getPropertyValue("--press-mix");
    const next = m === 0 ? "" : m.toFixed(3);
    if (prev !== next) {
      if (next) root.style.setProperty("--press-mix", next);
      else root.style.removeProperty("--press-mix");
    }
  };
  useEffect(() => {
    write(progress.get());
    return () => {
      document.documentElement.style.removeProperty("--press-mix");
    };
  }, []);
  useMotionValueEvent(progress, "change", write);
  return null;
}
