"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { REACTIONS, pointerX, pointerY } from "@/lib/reactions";
import { cn } from "@/lib/utils";

/**
 * Shifts its children by at most `parallaxPx * depth` against the pointer.
 * Different layers get different depths. The pointer values are 0 on touch
 * devices and under reduced motion, so the layer then sits still.
 */
export function PointerLayer({
  depth,
  className,
  children,
}: {
  depth: number;
  className?: string;
  children: React.ReactNode;
}) {
  const sx = useSpring(pointerX, { stiffness: 90, damping: 22, mass: 0.6 });
  const sy = useSpring(pointerY, { stiffness: 90, damping: 22, mass: 0.6 });
  const max = REACTIONS.parallaxPx * depth;
  const x = useTransform(sx, (v) => -Math.max(-1, Math.min(1, v)) * max);
  const y = useTransform(sy, (v) => -Math.max(-1, Math.min(1, v)) * max);
  return (
    <motion.div className={cn("absolute inset-0", className)} style={{ x, y }}>
      {children}
    </motion.div>
  );
}
