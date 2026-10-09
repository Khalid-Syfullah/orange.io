"use client";

import { useEffect, useRef } from "react";
import { useMotionValueEvent } from "motion/react";
import { progress, scrollToProgress } from "@/lib/progress";
import { BEATS, CHAPTERS, SCENES, SCENE_NAMES, STAGE_VH, TRAVEL, type Slot } from "@/scroll/script";

const SLOTS: Slot[] = ["hero", "left-line", "right-card"];
const pct = (vh: number) => `${(vh / STAGE_VH) * 100}%`;

/** Dev-only horizontal view of the script: scenes, chapters, beats per slot, travel, playhead. */
export function ScriptTimeline() {
  const head = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const move = (p: number) => {
    if (head.current) head.current.style.left = `${p * 100}%`;
  };
  useEffect(() => move(progress.get()), []);
  useMotionValueEvent(progress, "change", move);

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = track.current?.getBoundingClientRect();
    if (!r) return;
    scrollToProgress(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
  };

  return (
    <div className="pointer-events-auto fixed bottom-3 left-3 z-[10000] w-[min(92vw,46rem)] rounded-[4px] bg-ink/90 p-3 text-cream">
      <p className="text-meta mb-2 !normal-case opacity-60">script · {STAGE_VH}vh · click to seek</p>
      <div className="relative cursor-crosshair select-none" onClick={seek} role="img" aria-label="Scroll script timeline">
        <Row label="scene">
          {SCENE_NAMES.map((n, i) => (
            <div
              key={n}
              className={`absolute inset-y-0 overflow-hidden border-r border-cream/30 px-1 text-[8px] leading-4 ${i % 2 ? "bg-cream/10" : "bg-cream/20"}`}
              style={{ left: `${SCENES[n][0] * 100}%`, width: `${(SCENES[n][1] - SCENES[n][0]) * 100}%` }}
            >
              {n}
            </div>
          ))}
        </Row>
        <Row label="chapter">
          {CHAPTERS.map((c) => (
            <div key={c.id} className="absolute inset-y-0 border-l border-orange pl-1 text-[8px] leading-4 whitespace-nowrap" style={{ left: `${c.at * 100}%` }}>
              {c.name}
            </div>
          ))}
        </Row>
        {SLOTS.map((slot) => (
          <Row key={slot} label={slot}>
            {BEATS.filter((b) => b.slot === slot).map((b) => (
              <div
                key={b.id}
                title={`${b.id} ${b.startVh}-${b.endVh}vh`}
                className="absolute inset-y-0.5 overflow-hidden rounded-[2px] bg-orange px-0.5 text-[8px] leading-3 text-ink"
                style={{ left: pct(b.startVh), width: `${((b.endVh - b.startVh) / STAGE_VH) * 100}%` }}
              >
                {b.id}
              </div>
            ))}
          </Row>
        ))}
        <Row label="travel">
          {TRAVEL.map((t) => (
            <div
              key={`${t.scene}-${t.fromVh}`}
              title={`${t.scene}: ${t.moves.join("; ")}`}
              className={`absolute inset-y-1 rounded-[2px] ${t.lengthVh >= 60 ? "bg-leaf" : "bg-cream/20"}`}
              style={{ left: pct(t.fromVh), width: pct(t.lengthVh) }}
            />
          ))}
        </Row>
        <div ref={track} className="pointer-events-none absolute inset-y-0 right-0 left-[4.5rem]">
          <div ref={head} className="absolute -top-1 -bottom-1 w-px bg-cream" style={{ left: "0%" }} />
        </div>
      </div>
    </div>
  );
}

// Rows share a 4.5rem label gutter; children are positioned in the track.
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-0.5 flex h-4 items-stretch">
      <span className="text-meta w-[4.5rem] shrink-0 text-[8px] !normal-case opacity-60">{label}</span>
      <div className="relative flex-1">{children}</div>
    </div>
  );
}
