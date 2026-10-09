"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useMotionValueEvent } from "motion/react";
import { engine, progress, scrollToProgress } from "@/lib/progress";
import { CHAPTERS, adjacentBeat, beatLandingProgress, chapterIndex } from "@/lib/timeline";

const KEY = "orange.scroll";

type Saved = { p: number; after: number };
const read = (): Saved | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
};

/** A hash that names the chapter we were already in is our own state (replaceState), not a deep link. */
const isOwnHash = (saved: Saved | null) => !!saved && location.hash === "#" + CHAPTERS[chapterIndex(saved.p)].id;

/** px scrolled beyond the end of the stage (0 while inside it). */
function pxAfterStage() {
  const st = engine.stage;
  if (!st) return 0;
  return Math.max(0, window.scrollY - (st.offsetTop + st.offsetHeight - window.innerHeight));
}

/**
 * Real-browsing behaviour for the stage: scroll restoration (same progress, applied before
 * paint so the hero never flashes), chapter deep links (/#harvest) with a hash that follows
 * the active chapter through replaceState, J / K to jump between beats, and a guard that
 * stops painting the stage while it is offscreen. Native keys (space, page up/down, home,
 * end, arrows) are left alone.
 */
export function StageBehaviours() {
  // read once, before anything resets progress; start saving only after the restore has run
  const initial = useRef<Saved | null>(null);
  const ready = useRef(false);

  // restore before paint: the stage state matches the position, no flash of the opening
  useLayoutEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    initial.current = read(); // layout effects run before the stage resets progress
    const saved = initial.current;
    if (saved && (!location.hash || isOwnHash(saved))) progress.set(Math.min(1, Math.max(0, saved.p)));
  }, []);

  useEffect(() => {
    const go = (hash: string, immediate: boolean) => {
      const i = CHAPTERS.findIndex((c) => "#" + c.id === hash);
      if (i >= 0) {
        scrollToProgress(CHAPTERS[i].at, { immediate });
        return true;
      }
      return false;
    };
    // after layout (ScrollTrigger has measured the stage): hash wins, otherwise saved position
    const t = window.setTimeout(() => {
      const saved = initial.current;
      const finish = () => window.setTimeout(() => void (ready.current = true), 400);
      if (location.hash && !isOwnHash(saved)) {
        if (!go(location.hash, true)) ready.current = true; // a normal anchor: the browser handles it
        else finish();
        return;
      }
      if (!saved) {
        ready.current = true;
        return;
      }
      finish();
      if (saved.p >= 1 && saved.after > 0) window.scrollTo({ top: (engine.stage?.offsetTop ?? 0) + (engine.stage?.offsetHeight ?? 0) - window.innerHeight + saved.after });
      else scrollToProgress(saved.p, { immediate: true });
    }, 120);
    const onHash = () => void go(location.hash, false);
    window.addEventListener("hashchange", onHash);

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const dir = e.key === "j" || e.key === "J" ? 1 : e.key === "k" || e.key === "K" ? -1 : 0;
      if (!dir) return;
      const b = adjacentBeat(progress.get(), dir);
      if (b) {
        e.preventDefault();
        scrollToProgress(beatLandingProgress(b));
      }
    };
    window.addEventListener("keydown", onKey);

    // stop painting the stage while it is offscreen; resume cleanly
    const st = engine.stage;
    const layer = st?.querySelector<HTMLElement>(".sticky");
    const io =
      st && layer
        ? new IntersectionObserver(([entry]) => {
            layer.style.visibility = entry.isIntersecting ? "" : "hidden";
          })
        : null;
    if (st && io) io.observe(st);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("keydown", onKey);
      io?.disconnect();
    };
  }, []);

  // save the position, and keep the hash on the active chapter (replaceState: no history spam)
  useMotionValueEvent(progress, "change", (p) => {
    if (!ready.current) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ p, after: pxAfterStage() } satisfies Saved));
    } catch {}
    const stageVisible = engine.stage ? engine.stage.getBoundingClientRect().bottom > window.innerHeight * 0.5 : false;
    if (stageVisible && p < 0.9995) {
      const id = "#" + CHAPTERS[chapterIndex(p)].id;
      if (location.hash !== id) history.replaceState(null, "", id);
    }
  });
  return null;
}

