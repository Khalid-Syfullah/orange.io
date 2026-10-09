"use client";

import { motion, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import { progress } from "@/lib/progress";
import { BRAND, type BeatDef } from "@/scroll/script";
import { BeatLine } from "./beat";

function Fade({ at, className, children, interactive }: { at: number; className?: string; children: React.ReactNode; interactive?: boolean }) {
  const t = useTransform(progress, [at, at + 0.004], [0, 1]);
  const y = useTransform(t, [0, 1], ["0.7em", "0em"]);
  const visibility = useTransform(t, (v) => (v > 0.001 ? "visible" : "hidden"));
  return (
    <motion.div className={className} style={{ opacity: t, y, visibility, pointerEvents: interactive ? "auto" : "none" }}>
      {children}
    </motion.div>
  );
}

/**
 * The brand reveal inside a centred Beat: the mark and the Orange.io headline
 * begin at BRAND.logo, the tagline fades in at BRAND.tagline, the supporting
 * line and the call to action follow. All copy comes from the BEATS entry.
 * The composition then holds, and normal page content continues below.
 */
export function BrandBeat({ beat }: { beat: BeatDef }) {
  const mark = useTransform(progress, [BRAND.logo - 0.004, BRAND.logo + 0.01], [0, 1]);
  const markScale = useTransform(mark, [0, 1], [0.6, 1]);
  return (
    <div className="grid justify-items-center gap-5 text-center">
      <motion.svg aria-hidden="true" viewBox="0 0 20 20" className="size-9" style={{ opacity: mark, scale: markScale }}>
        <circle cx="10" cy="11" r="7" fill="var(--orange)" />
        <path d="M10 4C10 2 11.5 1 13.5 1C13.5 3 12 4.2 10 4Z" fill="var(--leaf)" />
      </motion.svg>
      <BeatLine text={beat.title} as="h2" className="text-display-xl" hold />
      <Fade at={BRAND.tagline} className="text-lead">
        {beat.tagline}
      </Fade>
      <Fade at={BRAND.support} className="text-body max-w-[34ch] text-foreground/70">
        {beat.lead}
      </Fade>
      {beat.cta ? (
        <Fade at={BRAND.cta} interactive className="pt-2">
          <Button variant="pill-light" render={<a href={beat.cta.href} />} nativeButton={false}>
            {beat.cta.label}
          </Button>
        </Fade>
      ) : null}
    </div>
  );
}
