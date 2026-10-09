"use client";

import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { mulberry32 } from "./rng";

/**
 * Orange peel: fine pores, mottled colour variation and soft imperfections. The
 * same canvas drives colour (multiplied with the ripening tint) and bump, so
 * the pores catch the light instead of reading as a smooth plastic ball.
 */
export function peelTexture(repeat: [number, number] = [2, 1]) {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e9e9e9";
  g.fillRect(0, 0, size, size);
  const rnd = mulberry32(21);
  // soft mottling
  for (let i = 0; i < 70; i++) {
    const r = 10 + rnd() * 34;
    const x = rnd() * size;
    const y = rnd() * size;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const dark = rnd() > 0.5;
    grad.addColorStop(0, dark ? "rgba(150,150,150,0.28)" : "rgba(255,255,255,0.32)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // pores: many tiny dark pits, a few larger blemishes
  for (let i = 0; i < 2600; i++) {
    const r = 0.5 + rnd() * 1.1;
    g.fillStyle = `rgba(70,70,70,${0.25 + rnd() * 0.35})`;
    g.beginPath();
    g.arc(rnd() * size, rnd() * size, r, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 14; i++) {
    g.fillStyle = "rgba(90,90,90,0.22)";
    g.beginPath();
    g.arc(rnd() * size, rnd() * size, 2 + rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  return t;
}

