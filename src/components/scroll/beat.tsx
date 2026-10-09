"use client";

import { createContext, useContext } from "react";
import { motion, useTransform } from "motion/react";
import { progress } from "@/lib/progress";
import type { BeatSide } from "@/lib/timeline";
import { SplitReveal } from "@/components/design/split-reveal";
import { Tag } from "@/components/design/tag";
import { cn } from "@/lib/utils";

const BeatCtx = createContext<{ at: number; out: number; intro: boolean }>({ at: 0, out: 1, intro: false });

const SIDE_CLASS: Record<BeatSide, string> = {
  left: "left-[8%] right-[8%] md:right-auto md:w-[min(40vw,36rem)]",
  right: "left-[8%] right-[8%] md:left-[62%] md:right-auto md:w-[min(28vw,26rem)]",
  center: "left-[8%] right-[8%] text-center md:left-1/2 md:right-auto md:w-[min(60vw,48rem)] md:-translate-x-1/2",
};

/**
 * Shows its children only while progress is inside [at, out], fading in and
 * out in both scroll directions. Beats share one screen position and replace
 * each other. Visibility (not just opacity) is toggled so hidden beats leave
 * the accessibility tree and tab order.
 */
export function Beat({
  at,
  out,
  side = "left",
  intro = false,
  className,
  children,
}: {
  at: number;
  out: number;
  side?: BeatSide;
  /** Visible from progress 0 (opening beat); only the exit is scroll-driven. */
  intro?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const e = Math.min(0.006, (out - at) * 0.2);
  const opacity = useTransform(progress, intro ? [-1, out - e, out] : [at, at + e, out - e, out], intro ? [1, 1, 0] : [0, 1, 1, 0]);
  const visibility = useTransform(opacity, (o) => (o > 0.001 ? "visible" : "hidden"));
  return (
    <BeatCtx.Provider value={{ at, out, intro }}>
      <motion.div
        data-beat
        className={cn("pointer-events-none absolute top-[48%] -translate-y-1/2", SIDE_CLASS[side], className)}
        style={{ opacity, visibility }}
      >
        {children}
      </motion.div>
    </BeatCtx.Provider>
  );
}

/** Headline that splits by character and reveals/hides with the enclosing beat. */
export function BeatLine({ text, className, as = "h2" }: { text: string; className?: string; as?: "h1" | "h2" | "h3" | "p" }) {
  const { at, out, intro } = useContext(BeatCtx);
  // the intro headline reveals on load (whileInView, once); every other line is scrubbed by scroll
  if (intro) return <SplitReveal text={text} as={as} className={className} delay={0.3} />;
  return <SplitReveal text={text} as={as} className={className} progress={progress} range={[at, out]} />;
}

/** Paragraph that fades up after the headline has begun to reveal. */
export function BeatLead({ children, className }: { children: React.ReactNode; className?: string }) {
  const { at, out, intro } = useContext(BeatCtx);
  const len = out - at;
  const t = useTransform(
    progress,
    intro ? [-1, out - len * 0.2, out - len * 0.05] : [at + len * 0.2, at + len * 0.4, out - len * 0.2, out - len * 0.05],
    intro ? [1, 1, 0] : [0, 1, 1, 0],
  );
  const y = useTransform(t, [0, 1], ["0.6em", "0em"]);
  return (
    <motion.p className={cn("text-lead mt-5 max-w-[28ch] text-foreground/80", className)} style={{ opacity: t, y }}>
      {children}
    </motion.p>
  );
}

export function BeatCard({ tag, title, children }: { tag?: string; title: string; children: React.ReactNode }) {
  const { at, out } = useContext(BeatCtx);
  const len = out - at;
  const t = useTransform(progress, [at + len * 0.15, at + len * 0.35, out - len * 0.2, out - len * 0.05], [0, 1, 1, 0]);
  return (
    <motion.div style={{ opacity: t }}>
      {tag ? <Tag className="mb-4">{tag}</Tag> : null}
      <BeatLine text={title} className="text-display-l" />
      <p className="text-body mt-4 max-w-[34ch] text-foreground/80">{children}</p>
    </motion.div>
  );
}
