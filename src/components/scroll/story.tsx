"use client";

import { useReducedMotion } from "motion/react";
import { Chrome } from "@/components/design/chrome";
import { Hairlines } from "@/components/design/hairlines";
import { Stage } from "./stage";
import { StaticStory } from "./static-story";
import { DevOverlay } from "./dev-overlay";

/** The home experience: tall stage normally, stacked stills under reduced motion. */
export function Story() {
  const reduce = useReducedMotion();
  return (
    <>
      <Chrome />
      {reduce ? (
        <>
          <Hairlines />
          <StaticStory />
        </>
      ) : (
        <Stage />
      )}
      <DevOverlay />
    </>
  );
}
