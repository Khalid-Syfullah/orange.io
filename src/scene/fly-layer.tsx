"use client";

import { motion, useTransform } from "motion/react";
import { progress, velocityNorm } from "@/lib/progress";
import { REACTIONS } from "@/lib/reactions";
import { ripenCss } from "@/scroll/ripening";
import { STAGE_VH } from "@/lib/timeline";
import { flyAt, type FlyValues } from "@/scroll/fly";

const scratch: FlyValues = { x: 0, y: 0, scale: 1, rotate: 0, opacity: 0 };

/**
 * The hero element (the orange) persists across transitions and travels between
 * the named anchors (treeFruit, hand, center) from the script's FLY_PATH, so the
 * eye follows it while the background dissolves. A DOM layer: crisp, cheap, and
 * only visible while it has opacity.
 */
export function FlyLayer() {
  // One scratch object, read per field. (A MotionValue holding that single object
  // would never notify, since its identity does not change.)
  const read = (p: number) => flyAt(p * STAGE_VH, scratch);
  const x = useTransform(progress, (p) => `${read(p).x}vw`);
  const y = useTransform(progress, (p) => `${read(p).y}vh`);
  // scale breath with scroll speed; exactly 1x at rest
  const scale = useTransform([progress, velocityNorm], ([p, v]: number[]) => read(p).scale * (1 + REACTIONS.breath * Math.abs(v)));
  const rotate = useTransform(progress, (p) => read(p).rotate);
  const opacity = useTransform(progress, (p) => read(p).opacity);
  // the fruit it carries is the one the camera singled out: same peel colour as the 3D fruit
  const fill = useTransform(progress, (p) => ripenCss(p));
  const visibility = useTransform(progress, (p) => (read(p).opacity > 0.001 ? "visible" : "hidden"));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" data-layer="fly" aria-hidden="true">
      <motion.div className="absolute top-0 left-0 will-change-transform" style={{ x, y, scale, rotate, opacity, visibility }}>
        <svg viewBox="0 0 100 100" className="-mt-[9vmin] -ml-[9vmin] size-[18vmin] overflow-visible">
          <defs>
            <radialGradient id="fly-shade" cx="0.36" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
              <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.32" />
            </radialGradient>
            <pattern id="fly-pores" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
              <circle cx="1.1" cy="1.2" r="0.36" fill="#000" fillOpacity="0.28" />
              <circle cx="2.5" cy="2.4" r="0.22" fill="#000" fillOpacity="0.2" />
            </pattern>
            <clipPath id="fly-clip">
              <circle cx="50" cy="54" r="38" />
            </clipPath>
          </defs>
          <motion.circle cx="50" cy="54" r="38" style={{ fill }} />
          <g clipPath="url(#fly-clip)">
            <rect x="0" y="0" width="100" height="100" fill="url(#fly-pores)" />
            <rect x="0" y="0" width="100" height="100" fill="url(#fly-shade)" />
          </g>
          <path d="M34 36 C40 28 50 26 58 30" fill="none" stroke="var(--cream)" strokeOpacity="0.55" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M50 17 C50 8 58 3 68 4 C68 13 60 19 50 17Z" fill="var(--leaf)" />
          <circle cx="50" cy="17" r="2.2" fill="var(--ink)" />
        </svg>
      </motion.div>
    </div>
  );
}
