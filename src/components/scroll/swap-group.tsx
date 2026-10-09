"use client";

import { createContext, useContext } from "react";
import { motion, useTransform, type MotionValue } from "motion/react";
import { progress as sharedProgress } from "@/lib/progress";
import { cn } from "@/lib/utils";

type Ctx = { progress: MotionValue<number>; at: number; out: number };
const SwapCtx = createContext<Ctx>({ progress: sharedProgress, at: 0, out: 1 });
export const useSwap = () => useContext(SwapCtx);

/**
 * A group that swaps in place. Scrubbed by any progress MotionValue, so it
 * reverses cleanly: it enters from below as `at` is reached, and exits upward
 * as `out` is reached, while the next group enters from below. It is hidden
 * (not just transparent) outside its range, so it leaves the tab order.
 */
export function SwapGroup({
  at,
  out,
  progress = sharedProgress,
  className,
  children,
  ...rest
}: {
  at: number;
  out: number;
  progress?: MotionValue<number>;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<"div">, "style" | "children" | "className">) {
  const e = Math.min(0.012, (out - at) * 0.18);
  const opacity = useTransform(progress, [at, at + e, out - e, out], [0, 1, 1, 0]);
  const y = useTransform(progress, [at, at + e, out - e, out], [48, 0, 0, -48]);
  const visibility = useTransform(opacity, (o) => (o > 0.001 ? "visible" : "hidden"));
  return (
    <SwapCtx.Provider value={{ progress, at, out }}>
      <motion.div className={className} style={{ opacity, y, visibility }} {...(rest as object)}>
        {children}
      </motion.div>
    </SwapCtx.Provider>
  );
}

/** Fade-up for a paragraph inside a swap group, between two fractions of the group's range. */
export function SwapFade({ from, to, className, children }: { from: number; to: number; className?: string; children: React.ReactNode }) {
  const { progress, at, out } = useSwap();
  const len = out - at;
  const t = useTransform(progress, [at + len * from, at + len * to, out - len * 0.1, out], [0, 1, 1, 0]);
  const y = useTransform(t, [0, 1], ["0.8em", "0em"]);
  return (
    <motion.div className={cn(className)} style={{ opacity: t, y }}>
      {children}
    </motion.div>
  );
}

export { SwapCtx };
