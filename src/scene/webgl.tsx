"use client";

import { Component, type ReactNode } from "react";
import { useMotionValueEvent, type MotionValue } from "motion/react";
import { useThree } from "@react-three/fiber";

/** Renders nothing if WebGL is unavailable or a layer throws; the DOM layers still work. */
export class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.warn("WebGL layer disabled:", error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Capped device pixel ratio for every layer; lower on small screens. */
export const DPR: [number, number] =
  typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches ? [1, 1.15] : [1, 1.5];

/**
 * Request a frame whenever `mv` changes (layers use frameloop="demand"). An
 * optional `when` guard skips the request while the layer has nothing to draw.
 */
export function useInvalidateOn(mv: MotionValue<number>, when?: () => boolean) {
  const invalidate = useThree((s) => s.invalidate);
  useMotionValueEvent(mv, "change", () => {
    if (!when || when()) invalidate();
  });
}
