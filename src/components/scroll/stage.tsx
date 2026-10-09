"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hairlines } from "@/components/design/hairlines";
import { BEATS, STAGE_VH } from "@/lib/timeline";
import { engine, progress, scrollToProgress } from "@/lib/progress";
import { Beat, BeatCard, BeatLead, BeatLine } from "./beat";
import { PointerLayer } from "./pointer-layer";
import { PressTheme } from "./press-theme";
import { PointerReactions } from "./pointer-reactions";
import { SceneCanvas } from "@/scene/scene-canvas";
import { SceneTransition } from "@/scene/scene-transition";
import { FlyLayer } from "@/scene/fly-layer";
import { EquatorMark } from "@/scene/equator-mark";
import { ParallaxLayer } from "@/scene/parallax-layer";
import { WebGLBoundary } from "@/scene/webgl";

/**
 * One very tall native-scrolling stage. Inside, a sticky full-viewport stack:
 * scene canvas, transition canvas, fly canvas, hairlines, DOM text. One
 * ScrollTrigger over the stage writes normalized progress to the shared value.
 */
export function Stage() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    engine.stage = el;
    // Resize / orientation change keep (or clamp) the scroll position in px,
    // which changes the progress. Anchor on the last stable progress and
    // restore it once ScrollTrigger has refreshed for the new size.
    let anchor = 0;
    let resizing = false;
    let timer = 0;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        if (resizing) return;
        anchor = self.progress;
        progress.set(self.progress);
      },
    });
    anchor = st.progress;
    progress.set(st.progress);

    const finish = () => {
      window.clearTimeout(timer);
      if (!resizing) return;
      resizing = false;
      if (Math.abs(st.progress - anchor) > 0.0005) scrollToProgress(anchor, { immediate: true });
      progress.set(anchor);
    };
    const onResize = () => {
      resizing = true;
      window.clearTimeout(timer);
      timer = window.setTimeout(finish, 900); // fallback if no refresh arrives
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    ScrollTrigger.addEventListener("refresh", finish);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      ScrollTrigger.removeEventListener("refresh", finish);
      st.kill();
      engine.stage = null;
      progress.set(0);
    };
  }, []);

  return (
    <section ref={ref} data-stage className="relative" style={{ height: `${STAGE_VH}svh` }}>
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <PointerReactions />
        <PressTheme />
        {/* layers shift up to 6px x depth against the pointer; scene and dissolve share one shift */}
        <PointerLayer depth={0.4} className="-inset-2">
          <WebGLBoundary>
            <SceneCanvas />
            <SceneTransition />
          </WebGLBoundary>
        </PointerLayer>
        <PointerLayer depth={1}>
          <FlyLayer />
        </PointerLayer>
        <PointerLayer depth={0.7} className="-inset-2">
          <WebGLBoundary>
            <ParallaxLayer />
          </WebGLBoundary>
        </PointerLayer>
        <PointerLayer depth={1}>
          <EquatorMark />
        </PointerLayer>
        <Hairlines />
        <PointerLayer depth={0.2}>
        <div data-layer="text" className="absolute inset-0">
          {BEATS.map((b) => (
            <Beat key={b.id} at={b.at} out={b.out} side={b.side} intro={b.intro}>
              {b.kind === "card" ? (
                <BeatCard tag={b.tag} title={b.title}>
                  {b.lead}
                </BeatCard>
              ) : (
                <>
                  <BeatLine text={b.title} as={b.id === "hero" ? "h1" : "h2"} className={b.id === "hero" ? "text-display-xl" : "text-display-l"} />
                  <BeatLead>{b.lead}</BeatLead>
                </>
              )}
            </Beat>
          ))}
        </div>
        </PointerLayer>
      </div>
    </section>
  );
}
