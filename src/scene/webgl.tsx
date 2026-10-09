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

/** Capped device pixel ratio for every layer. */
export const DPR: [number, number] = [1, 1.5];

/** Request a frame whenever `mv` changes (layers use frameloop="demand"). */
export function useInvalidateOn(mv: MotionValue<number>) {
  const invalidate = useThree((s) => s.invalidate);
  useMotionValueEvent(mv, "change", () => invalidate());
}
