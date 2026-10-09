"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";
import { EASE } from "@/lib/motion";
import { progress as sharedProgress, scrollToChapter } from "@/lib/progress";
import { CHAPTERS, chapterIndex } from "@/lib/timeline";
import { railSegments } from "@/scroll/segments";
import { cn } from "@/lib/utils";
import { SplitReveal } from "./split-reveal";

const SEGMENTS = railSegments();
const GAP = 3; // px between segments, marks the boundary

/** Active chapter index. State changes only when the chapter changes, never per frame. */
export function useActiveChapter(progress: MotionValue<number> = sharedProgress) {
  const [active, setActive] = useState(() => chapterIndex(progress.get()));
  useMotionValueEvent(progress, "change", (v) => setActive(chapterIndex(v)));
  return active;
}

function Segment({
  a,
  b,
  kind,
  progress,
  path,
}: {
  a: number;
  b: number;
  kind: string;
  progress: MotionValue<number>;
  path: string;
}) {
  const offset = useTransform(progress, [a, b], [1, 0], { clamp: true });
  return (
    <>
      <path d={path} pathLength={1} data-a={a} data-b={b} data-kind={kind} stroke="currentColor" strokeOpacity={0.25} strokeWidth={1} fill="none" />
      <motion.path
        d={path}
        pathLength={1}
        data-a={a}
        data-b={b}
        data-kind={kind}
        stroke="currentColor"
        strokeWidth={kind === "beat" ? 2 : 1.5}
        fill="none"
        style={{ strokeDasharray: 1, strokeDashoffset: offset }}
      />
    </>
  );
}

/**
 * Segmented progress line. Segment lengths are proportional to scroll span, so
 * it is a map of the story: long runs for travel, short ticks at beat changes.
 * Fills with stroke-dashoffset from the MotionValue (no React state per frame).
 */
export function SegmentedLine({
  progress = sharedProgress,
  orientation = "vertical",
  className,
}: {
  progress?: MotionValue<number>;
  orientation?: "vertical" | "horizontal";
  className?: string;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [len, setLen] = useState(300);
  const vertical = orientation === "vertical";

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setLen((vertical ? el.clientHeight : el.clientWidth) || 300);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [vertical]);

  return (
    <svg ref={ref} aria-hidden="true" className={cn("overflow-visible text-foreground", vertical ? "h-full w-1.5" : "h-1.5 w-full", className)}>
      {SEGMENTS.map((s, i) => {
        const start = i === 0 ? 0 : s.a * len + GAP / 2;
        const end = i === SEGMENTS.length - 1 ? len : s.b * len - GAP / 2;
        const path = vertical ? `M3 ${start} L3 ${end}` : `M${start} 3 L${end} 3`;
        return <Segment key={s.a} a={s.a} b={s.b} kind={s.kind} progress={progress} path={path} />;
      })}
    </svg>
  );
}

function SwapLabel({ text, className }: { text: string; className?: string }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={text} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="inline-block">
        <SplitReveal as="span" text={text} className={cn("text-label whitespace-nowrap", className)} />
      </motion.span>
    </AnimatePresence>
  );
}

/**
 * Desktop rail: segmented line with a chapter entry at each anchor. The active
 * entry shows a leading rule and the label; the others show tick marks only.
 */
export function ChapterRail({
  progress = sharedProgress,
  onSelect = scrollToChapter,
  className,
  height = 300,
}: {
  progress?: MotionValue<number>;
  onSelect?: (index: number) => void;
  className?: string;
  height?: number | string;
}) {
  const active = useActiveChapter(progress);
  return (
    <nav aria-label="Chapters" className={cn("pointer-events-auto relative w-60", className)} style={{ height }}>
      <SegmentedLine progress={progress} className="absolute top-0 left-0" />
      {CHAPTERS.map((c, i) => (
        <a
          key={c.id}
          href={`#${c.id}`}
          data-at={c.at}
          aria-label={c.label}
          aria-current={i === active ? "step" : undefined}
          onClick={(e) => {
            e.preventDefault();
            onSelect(i);
          }}
          className="group absolute left-0 flex h-6 w-8 -translate-y-1/2 items-center rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ top: `${c.at * 100}%` }}
        >
          <span
            aria-hidden="true"
            className={cn(
              "ml-[3px] h-px transition-[width,background-color] duration-500 ease-out-soft group-hover:w-3",
              i === active ? "w-3 bg-orange" : "w-2 bg-foreground/50",
            )}
          />
        </a>
      ))}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-9 flex -translate-y-1/2 items-center gap-3"
        initial={false}
        animate={{ top: `${CHAPTERS[active].at * 100}%` }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <span className="h-px w-5 bg-foreground/60" />
        <SwapLabel text={CHAPTERS[active].label} />
      </motion.div>
    </nav>
  );
}

/** Mobile: compact top indicator with the same segmented line and the chapter label. */
export function MobileRail({
  progress = sharedProgress,
  className,
}: {
  progress?: MotionValue<number>;
  className?: string;
}) {
  const active = useActiveChapter(progress);
  return (
    <div className={cn("pointer-events-none flex items-center gap-3", className)}>
      <span aria-live="polite" className="shrink-0">
        <span className="sr-only">{CHAPTERS[active].label}</span>
        <span aria-hidden="true">
          <SwapLabel text={CHAPTERS[active].label} className="text-[0.625rem]" />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <SegmentedLine progress={progress} orientation="horizontal" />
      </div>
    </div>
  );
}
