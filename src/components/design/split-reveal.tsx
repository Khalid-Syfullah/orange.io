"use client";

import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { EASE } from "@/lib/motion";

type Props = {
  text: string;
  className?: string;
  /** Stagger between characters in seconds (12 to 20ms). Used by the whileInView driver. */
  stagger?: number;
  delay?: number;
  /**
   * Scroll driver. When `progress` is given, the line reveals across the first
   * part of `range` and hides again across the last part, in either scroll
   * direction. `range` is the [in, out] progress window of the beat.
   */
  progress?: MotionValue<number>;
  range?: readonly [number, number];
  as?: "h1" | "h2" | "h3" | "p" | "span";
};

const REVEAL_SHARE = 0.35; // share of the range spent revealing
const HIDE_SHARE = 0.2; // share of the range spent hiding

function ScrollChar({
  ch,
  index,
  total,
  progress,
  range,
}: {
  ch: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
  range: readonly [number, number];
}) {
  const [a, b] = range;
  const len = b - a;
  const revealSpan = len * REVEAL_SHARE;
  const charSpan = revealSpan * 0.4;
  const start = a + (index / Math.max(total - 1, 1)) * (revealSpan - charSpan);
  const hideStart = b - len * HIDE_SHARE;
  const t = useTransform(progress, [start, start + charSpan, hideStart, b], [0, 1, 1, 0]);
  const y = useTransform(progress, [start, start + charSpan, hideStart, b], ["0.4em", "0em", "0em", "-0.2em"]);
  return (
    <motion.span style={{ opacity: t, y, display: "inline-block" }}>{ch}</motion.span>
  );
}

function ScrollFade({
  progress,
  range,
  className,
  text,
  Tag,
}: {
  progress: MotionValue<number>;
  range: readonly [number, number];
  className?: string;
  text: string;
  Tag: typeof motion.h2;
}) {
  const [a, b] = range;
  const e = (b - a) * 0.15;
  const opacity = useTransform(progress, [a, a + e, b - e, b], [0, 1, 1, 0]);
  return (
    <Tag className={className} style={{ opacity }}>
      {text}
    </Tag>
  );
}

/** Splits text into per-character spans that fade up 0.4em with the shared easing. */
export function SplitReveal({
  text,
  className,
  stagger = 0.016,
  delay = 0,
  progress,
  range = [0, 1],
  as = "h2",
}: Props) {
  const reduce = useReducedMotion();
  const Tag = motion[as] as typeof motion.h2;

  if (reduce) {
    return progress ? (
      <ScrollFade progress={progress} range={range} className={className} text={text} Tag={Tag} />
    ) : (
      <Tag
        className={className}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {text}
      </Tag>
    );
  }

  const words = text.split(" ");
  const total = text.replace(/ /g, "").length;
  let n = 0;

  return (
    <Tag
      className={className}
      aria-label={text}
      initial={progress ? undefined : "hidden"}
      whileInView={progress ? undefined : "show"}
      viewport={{ once: true, amount: 0.6 }}
    >
      {words.map((word, wi) => (
        <span key={wi} aria-hidden="true" style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          {Array.from(word).map((ch) => {
            const i = n++;
            return progress ? (
              <ScrollChar key={i} ch={ch} index={i} total={total} progress={progress} range={range} />
            ) : (
              <motion.span
                key={i}
                style={{ display: "inline-block" }}
                variants={{
                  hidden: { opacity: 0, y: "0.4em" },
                  show: {
                    opacity: 1,
                    y: "0em",
                    transition: { duration: 0.8, ease: EASE, delay: delay + i * stagger },
                  },
                }}
              >
                {ch}
              </motion.span>
            );
          })}
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
