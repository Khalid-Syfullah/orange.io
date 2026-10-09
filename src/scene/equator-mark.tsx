"use client";

import { motion, useTransform } from "motion/react";
import { RegistrationMark } from "@/components/design/registration-mark";
import { progress } from "@/lib/progress";
import { SPLIT } from "@/scroll/script";
import { studioScreen } from "@/scroll/studio";

/**
 * A single registration mark on the orange's equator (the right-hand end of its
 * horizontal diameter), announcing the cut. It scales and fades in at the end of
 * the reveal and follows the fruit's size, driven only by progress.
 */
export function EquatorMark() {
  const left = useTransform(progress, (p) => `calc(50vw + ${studioScreen(p).radiusVh}vh)`);
  // it announces the cut, then gives way as the separation line opens
  const mark = useTransform(progress, (p) => {
    const fade = Math.min(1, Math.max(0, (p - SPLIT.line[0]) / (SPLIT.split[0] - SPLIT.line[0])));
    return studioScreen(p).mark * (1 - fade);
  });
  const scale = useTransform(mark, [0, 1], [0.2, 1]);
  const visibility = useTransform(mark, (m) => (m > 0.001 ? "visible" : "hidden"));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" data-layer="equator" aria-hidden="true">
      <motion.div className="absolute top-1/2" style={{ left, opacity: mark, scale, visibility, x: "-50%", y: "-50%" }}>
        <RegistrationMark className="size-5 text-orange" />
      </motion.div>
    </div>
  );
}
