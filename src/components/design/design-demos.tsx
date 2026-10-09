"use client";

import { useState } from "react";
import { Chrome } from "./chrome";
import { Hairlines } from "./hairlines";
import { HoverRoll } from "./hover-roll";
import { SplitReveal } from "./split-reveal";
import { Button } from "@/components/ui/button";
import { progress } from "@/lib/progress";
import { CHAPTERS } from "@/lib/timeline";

/** Dev-only scrubber that drives the shared progress MotionValue. */
export function ProgressScrubber() {
  const [value, setValue] = useState(0);
  return (
    <div className="grid gap-6">
      <label className="text-meta grid gap-2">
        Shared progress: {value.toFixed(2)}
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={value}
          onChange={(e) => {
            const v = Number(e.target.value);
            setValue(v);
            progress.set(v);
          }}
          className="w-full max-w-md accent-orange"
        />
      </label>
      <div className="flex flex-wrap gap-3">
        {CHAPTERS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="text-label rounded-[4px] border border-hairline px-3 py-2 outline-none hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => {
              setValue(c.range[0]);
              progress.set(c.range[0]);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="min-h-[3.5rem]">
        <SplitReveal
          as="p"
          className="text-display-l"
          text="Scroll-driven line"
          progress={progress}
          range={[0.3, 0.7]}
        />
        <p className="text-meta mt-2 text-foreground/60">Reveals from 0.30, hides again by 0.70, both directions.</p>
      </div>
    </div>
  );
}

export function ButtonDemos() {
  return (
    <div className="flex flex-wrap items-center gap-6">
      <Button variant="pill">Say hello</Button>
      <Button variant="orange">Apply</Button>
      <div className="panel-press rounded-[4px] p-4">
        <Button variant="pill-light">Say hello</Button>
      </div>
    </div>
  );
}

export function HoverRollDemo() {
  return (
    <div className="flex flex-wrap gap-10">
      <HoverRoll text="Hover this line" className="text-title" />
      <a href="#" className="group text-label outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <HoverRoll text="Parent-triggered link" />
      </a>
    </div>
  );
}

export function LiveChrome() {
  return (
    <>
      <Hairlines />
      <Chrome />
    </>
  );
}
