"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValueEvent } from "motion/react";
import { progress, scrollToProgress } from "@/lib/progress";
import { SCENES, SCENE_NAMES, activeBeats, currentChapter, currentScene, vh } from "@/lib/timeline";

/** Dev-only. Keys 1-8 jump to scene starts, "h" hides/shows the panel. Updates the DOM directly. */
export function DevOverlay() {
  if (process.env.NODE_ENV === "production") return null;
  return <Overlay />;
}

function Overlay() {
  const out = useRef<HTMLPreElement>(null);
  const [hidden, setHidden] = useState(false);

  const render = (p: number) => {
    if (!out.current) return;
    const s = currentScene(p);
    out.current.textContent = [
      `progress ${p.toFixed(4)}`,
      `vh       ${vh(p).toFixed(1)}`,
      `scene    ${s}`,
      `chapter  ${currentChapter(p).name}`,
      `beats    ${activeBeats(p).map((b) => b.id).join(", ") || "(travel)"}`,
    ].join("\n");
  };
  useEffect(() => render(progress.get()), [hidden]);
  useMotionValueEvent(progress, "change", render);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "h") return setHidden((v) => !v);
      const i = Number(e.key) - 1;
      if (i >= 0 && i < SCENE_NAMES.length) scrollToProgress(SCENES[SCENE_NAMES[i]][0]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (hidden) return null;
  return (
    <div className="pointer-events-none fixed right-3 bottom-3 z-[10000] rounded-[4px] bg-ink/90 p-3 text-cream">
      <pre ref={out} className="text-meta !normal-case" />
      <p className="text-meta mt-2 !normal-case opacity-60">keys 1-8 scenes · h hide</p>
    </div>
  );
}
