"use client";

import { useEffect, useRef } from "react";
import { useMotionValueEvent } from "motion/react";
import { progress } from "@/lib/progress";
import { currentScene, sceneProgress } from "@/lib/timeline";

/** Labelled placeholder for the WebGL scene layer. Writes to the DOM directly, no React state. */
export function ScenePlaceholder() {
  const label = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  const update = (p: number) => {
    const s = currentScene(p);
    if (label.current && label.current.textContent !== s) label.current.textContent = s;
    if (bar.current) bar.current.style.transform = `scaleX(${sceneProgress(s, p)})`;
  };
  useEffect(() => update(progress.get()), []);
  useMotionValueEvent(progress, "change", update);

  return (
    <div className="absolute inset-0 grid place-items-center bg-apricot/40 text-foreground/50" data-layer="scene">
      <div className="text-center">
        <p className="text-meta">WebGL scene placeholder</p>
        <p className="text-display-l mt-2">
          <span ref={label}>opening</span>
        </p>
        <span className="mx-auto mt-4 block h-px w-48 bg-foreground/20">
          <span ref={bar} className="block h-px origin-left bg-orange" style={{ transform: "scaleX(0)" }} />
        </span>
      </div>
    </div>
  );
}
