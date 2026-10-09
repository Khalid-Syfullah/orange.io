"use client";

import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useState } from "react";
import { EASE } from "@/lib/motion";

type Props = {
  text: string;
  className?: string;
  /** Stagger between characters, seconds (12 to 20ms). */
  stagger?: number;
  delay?: number;
  /** When given, characters are revealed by this 0-1 MotionValue instead of whileInView. */
  progress?: MotionValue<number>;
  as?: "h1" | "h2" | "h3" | "p" | "span";
};

function Char({
  ch,
  index,
  total,
  progress,
}: {
  ch: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = (index / total) * 0.7;
  const t = useTransform(progress, [start, start + 0.3], [0, 1], { clamp: true });
  const y = useTransform(t, [0, 1], ["0.4em", "0em"]);
  return (
    <motion.span style={{ opacity: t, y, display: "inline-block", whiteSpace: "pre" }}>
      {ch}
    </motion.span>
  );
}

/** Splits text into per-character spans that fade up 0.4em with the shared easing. */
export function SplitReveal({
  text,
  className,
  stagger = 0.016,
  delay = 0,
  progress,
  as = "h2",
}: Props) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const words = text.split(" ");
  let n = 0;
  const total = text.length;

  if (reduce) {
    return (
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

  return (
    <Tag
      className={className}
      aria-label={text}
      initial="hidden"
      whileInView={progress ? undefined : "show"}
      viewport={{ once: true, amount: 0.6 }}
    >
      {words.map((word, wi) => (
        <span key={wi} aria-hidden style={{ display: "inline-block", whiteSpace: "nowrap" }}>
          {Array.from(word).map((ch) => {
            const i = n++;
            return progress ? (
              <Char key={i} ch={ch} index={i} total={total} progress={progress} />
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

/** Convenience for reading a MotionValue without re-rendering per frame elsewhere. */
export function useProgressFlag(progress: MotionValue<number>, at: number) {
  const [on, setOn] = useState(false);
  useMotionValueEvent(progress, "change", (v) => {
    const next = v >= at;
    setOn((prev) => (prev === next ? prev : next));
  });
  return on;
}
