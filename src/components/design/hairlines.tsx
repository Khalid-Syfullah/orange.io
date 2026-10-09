"use client";

import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";
import { progress as sharedProgress } from "@/lib/progress";
import { STAGE_VH } from "@/lib/timeline";
import { frameAt, pulseAt, type FrameValues } from "@/scroll/frame";
import { RegistrationMark } from "./registration-mark";

/** Distance from the screen edge where open lines sit, px. */
const EDGE = 12;
/** How far a part travels outward (along its data-out direction) when the frame closes, px. */
const EXIT = 56;

type Pos = { pct: number; px: number; vw: number };
const calc = (p: Pos) => `calc(${p.pct}% + ${p.px}px + ${p.vw}vw)`;
const mix = (a: Pos, b: Pos, t: number): Pos => ({
  pct: a.pct + (b.pct - a.pct) * t,
  px: a.px + (b.px - a.px) * t,
  vw: a.vw + (b.vw - a.vw) * t,
});

// Grid tokens (see --v1, --v2, --h1, --h2 in globals.css) as hero positions.
const HERO = {
  l: { pct: 5.3, px: 0, vw: 0 },
  r: { pct: 85.6, px: 0, vw: 0 },
  u: { pct: 0, px: 0, vw: 5.3 },
  d: { pct: 65.3, px: 50, vw: 0 },
};
const OPEN = {
  l: { pct: 0, px: EDGE, vw: 0 },
  r: { pct: 100, px: -EDGE, vw: 0 },
  u: { pct: 0, px: EDGE, vw: 0 },
  d: { pct: 100, px: -EDGE, vw: 0 },
};

type Side = "l" | "r" | "u" | "d";
type Out = "l" | "r" | "u" | "d" | "lu" | "ru" | "ld" | "rd";

/** Position of one line for frame values `f`; `dir` pushes it outward as the frame closes. */
function linePos(side: Side, f: FrameValues, dir: number): string {
  let p = mix(HERO[side], OPEN[side], f.o);
  if (side === "l") p = mix(p, { pct: f.lockL, px: 0, vw: 0 }, f.k);
  if (side === "r") p = mix(p, { pct: f.lockR, px: 0, vw: 0 }, f.k);
  return calc({ ...p, px: p.px + dir * f.c * EXIT });
}


function usePos(frame: MotionValue<FrameValues>, side: Side, dir: number) {
  return useTransform(frame, (f) => linePos(side, f, dir));
}

const LINE = "absolute inset-0 will-change-transform";

/**
 * Fixed hairline frame built from separate parts, each a plain element moved
 * with motion transforms: vertical lines (l, r), horizontal lines (u, d),
 * corner crosses (lu, ru, ld, rd) and a filled bar (d). Frame state per scene
 * comes from the script (FRAME); positions are scrubbed from `progress`, so the
 * whole choreography reverses. Reduced motion shows the static hero state.
 */
export function Hairlines({
  progress = sharedProgress,
  visible,
}: {
  progress?: MotionValue<number>;
  /** Optional extra 0-1 opacity for the whole frame. */
  visible?: MotionValue<number>;
}) {
  const reduce = useReducedMotion();
  const frame = useTransform(progress, (p) => (reduce ? frameAt(0) : frameAt(p * STAGE_VH)));
  const pulse = useTransform(progress, (p) => (reduce ? 1 : pulseAt(p * STAGE_VH)));
  const opacity = useTransform(frame, (f) => 1 - f.c);
  const tickOpacity = useTransform(frame, (f) => (1 - f.o) * (1 - f.c));

  const xL = usePos(frame, "l", -1);
  const xR = usePos(frame, "r", 1);
  const yU = usePos(frame, "u", -1);
  const yD = usePos(frame, "d", 1);
  // crosses exit diagonally, so they get their own offsets
  const xLu = xL;
  const xRu = xR;
  const yLu = yU;
  const yRd = yD;

  return (
    <motion.div
      aria-hidden="true"
      data-frame
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      style={visible ? { opacity: visible } : undefined}
    >
      {/* vertical lines: each part is a full-size box whose left border is the line */}
      <motion.div data-part="line" data-out="l" className={`${LINE} border-l border-hairline`} style={{ x: xL, opacity }}>
        {/* ticks on the left line, hero state only */}
        <motion.svg
          className="absolute text-foreground/40"
          style={{ left: -7, top: "5.3vw", height: "calc(65.3% + 50px - 5.3vw)", width: 7, opacity: tickOpacity }}
        >
          <defs>
            <pattern id="hairline-ticks" width="7" height="14" patternUnits="userSpaceOnUse">
              <line x1="3" y1="0.5" x2="7" y2="0.5" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="7" height="100%" fill="url(#hairline-ticks)" />
        </motion.svg>
      </motion.div>
      <motion.div data-part="line" data-out="r" className={`${LINE} border-l border-hairline`} style={{ x: xR, opacity }} />

      {/* horizontal lines */}
      <motion.div data-part="line" data-out="u" className={`${LINE} border-t border-hairline`} style={{ y: yU, opacity }} />
      <motion.div data-part="line" data-out="d" className={`${LINE} border-t border-hairline`} style={{ y: yD, opacity }} />

      {/* filled bar, rides the lower line and exits downward */}
      <motion.div data-part="bar" data-out="d" className={LINE} style={{ y: yD, opacity }}>
        <span className="absolute -top-px h-[3px] w-14 bg-foreground" style={{ left: "5.3%" }} />
      </motion.div>

      {/* corner crosses at the intersections; they travel to the corners and lock there */}
      <Cross out="lu" x={xLu} y={yLu} opacity={opacity} pulse={pulse} />
      <Cross out="ru" x={xRu} y={yLu} opacity={opacity} pulse={pulse} />
      <Cross out="ld" x={xLu} y={yRd} opacity={opacity} pulse={pulse} />
      <Cross out="rd" x={xRu} y={yRd} opacity={opacity} pulse={pulse} />
    </motion.div>
  );
}

function Cross({
  out,
  x,
  y,
  opacity,
  pulse,
}: {
  out: Out;
  x: MotionValue<string>;
  y: MotionValue<string>;
  opacity: MotionValue<number>;
  pulse: MotionValue<number>;
}) {
  return (
    <motion.div data-part="cross" data-out={out} className="absolute inset-0 will-change-transform" style={{ x, y, opacity }}>
      <motion.span className="absolute -top-[5px] -left-[5px] block" style={{ scale: pulse }}>
        <RegistrationMark className="size-2.5 text-foreground/60" />
      </motion.span>
    </motion.div>
  );
}

