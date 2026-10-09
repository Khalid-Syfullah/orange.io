"use client";

import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import { useEffect, useMemo } from "react";
import { SCENE_NAMES, type SceneName } from "@/scroll/script";

// Placeholder "plates": still frames standing in for scene renders until the
// real scenes exist. Two designs alternate by scene; each is labelled.
const W = 1280;
const H = 800;
const cache = new Map<SceneName, HTMLCanvasElement>();

const PALETTE = { orange: "#ff7800", cream: "#f7f3ea", ink: "#181818", leaf: "#476b35", apricot: "#ffd9a8", clay: "#e9dcc6" };

function draw(scene: SceneName, index: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const warm = index % 2 === 0;
  g.fillStyle = warm ? PALETTE.apricot : PALETTE.clay;
  g.fillRect(0, 0, W, H);

  // soft sun / hill so the plate has big readable shapes to dolly into
  g.fillStyle = warm ? PALETTE.orange : PALETTE.leaf;
  g.globalAlpha = 0.16;
  g.beginPath();
  if (warm) g.arc(W * 0.68, H * 0.42, H * 0.3, 0, Math.PI * 2);
  else g.ellipse(W * 0.4, H * 0.95, W * 0.55, H * 0.4, 0, 0, Math.PI * 2);
  g.fill();
  g.globalAlpha = 1;

  // halftone dot field, dots shrink toward the top
  g.fillStyle = PALETTE.ink;
  for (let y = 0; y < H; y += 16) {
    for (let x = 0; x < W; x += 16) {
      const r = 0.2 + 2.2 * Math.pow(y / H, 1.6);
      g.beginPath();
      g.arc(x + ((y / 16) % 2) * 8, y, r, 0, Math.PI * 2);
      g.fill();
    }
  }

  // reference grid + centre cross: makes zoom and dissolve easy to judge
  g.strokeStyle = PALETTE.ink;
  g.globalAlpha = 0.25;
  g.lineWidth = 1;
  for (let i = 1; i < 10; i++) {
    g.beginPath(); g.moveTo((W * i) / 10, 0); g.lineTo((W * i) / 10, H); g.stroke();
    g.beginPath(); g.moveTo(0, (H * i) / 10); g.lineTo(W, (H * i) / 10); g.stroke();
  }
  g.globalAlpha = 0.8;
  g.beginPath(); g.moveTo(W / 2 - 24, H / 2); g.lineTo(W / 2 + 24, H / 2); g.moveTo(W / 2, H / 2 - 24); g.lineTo(W / 2, H / 2 + 24); g.stroke();
  g.globalAlpha = 1;

  // label
  g.fillStyle = PALETTE.ink;
  g.textAlign = "center";
  g.font = "13px ui-monospace, Menlo, monospace";
  g.fillText(`PLACEHOLDER PLATE ${warm ? "A" : "B"}`, W / 2, H / 2 - 70);
  g.font = "300 84px ui-serif, Georgia, serif";
  g.fillText(scene, W / 2, H / 2 + 20);
  g.font = "13px ui-monospace, Menlo, monospace";
  g.fillText(`scene ${index + 1} of ${SCENE_NAMES.length}`, W / 2, H / 2 + 60);
  return c;
}

/** Shared 2D source canvases (one per scene). WebGL textures must be made per context. */
export function plateCanvas(scene: SceneName): HTMLCanvasElement {
  let c = cache.get(scene);
  if (!c) {
    c = draw(scene, SCENE_NAMES.indexOf(scene));
    cache.set(scene, c);
  }
  return c;
}

export const PLATE_ASPECT = W / H;

/** One CanvasTexture per scene for the current WebGL context; disposed on unmount. */
export function usePlateTextures(): Record<SceneName, CanvasTexture> {
  const textures = useMemo(() => {
    const out = {} as Record<SceneName, CanvasTexture>;
    for (const n of SCENE_NAMES) {
      const t = new CanvasTexture(plateCanvas(n));
      t.colorSpace = SRGBColorSpace;
      t.generateMipmaps = false;
      t.minFilter = LinearFilter;
      t.magFilter = LinearFilter;
      out[n] = t;
    }
    return out;
  }, []);
  useEffect(() => () => Object.values(textures).forEach((t) => t.dispose()), [textures]);
  return textures;
}
