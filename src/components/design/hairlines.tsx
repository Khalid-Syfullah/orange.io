"use client";

import { motion, type MotionValue } from "motion/react";
import { RegistrationMark } from "./registration-mark";

const POINTS = [
  { left: "var(--v1)", top: "var(--h1)" },
  { left: "var(--v2)", top: "var(--h1)" },
  { left: "var(--v1)", top: "var(--h2)" },
  { left: "var(--v2)", top: "var(--h2)" },
] as const;

/**
 * Fixed hairline frame from the grid tokens, with registration marks at the
 * intersections and tick marks on the left edge. `visible` (0-1) fades the
 * whole frame per scene.
 */
export function Hairlines({ visible }: { visible?: MotionValue<number> }) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
      style={visible ? { opacity: visible } : undefined}
    >
      <div className="hairline-y absolute inset-y-0" style={{ left: "var(--v1)" }} />
      <div className="hairline-y absolute inset-y-0" style={{ left: "var(--v2)" }} />
      <div className="hairline-x absolute inset-x-0" style={{ top: "var(--h1)" }} />
      <div className="hairline-x absolute inset-x-0" style={{ top: "var(--h2)" }} />

      {/* ticks on the left edge, between the top and lower hairlines */}
      <svg
        className="absolute text-foreground/40"
        style={{
          left: "calc(var(--v1) - 7px)",
          top: "var(--h1)",
          height: "calc(var(--h2) - var(--h1))",
          width: 7,
        }}
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="hairline-ticks" width="7" height="14" patternUnits="userSpaceOnUse">
            <line x1="3" y1="0.5" x2="7" y2="0.5" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="7" height="100%" fill="url(#hairline-ticks)" />
      </svg>

      {POINTS.map((p, i) => (
        <RegistrationMark
          key={i}
          className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 text-foreground/60"
          style={p}
        />
      ))}
    </motion.div>
  );
}
