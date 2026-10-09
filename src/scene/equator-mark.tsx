"use client";

import { motion, useTransform } from "motion/react";
import { RegistrationMark } from "@/components/design/registration-mark";
import { progress } from "@/lib/progress";
import { studioScreen } from "@/scroll/studio";

/**
 * A single registration mark on the orange's equator (the right-hand end of its
 * horizontal diameter), announcing the cut. It scales and fades in at the end of
 * the reveal and follows the fruit's size, driven only by progress.
 */
export function EquatorMark() {
  const left = useTransform(progress, (p) => `calc(50vw + ${studioScreen(p).radiusVh}vh)`);
  const mark = useTransform(progress, (p) => studioScreen(p).mark);
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
