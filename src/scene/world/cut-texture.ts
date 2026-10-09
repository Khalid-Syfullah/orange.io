"use client";

import { CanvasTexture, SRGBColorSpace } from "three";
import { mulberry32 } from "./rng";

const SIZE = 1024;
const C = SIZE / 2;
const R = SIZE * 0.49; // the rim in texture space (matches buildCutFace's 0.49)
const SEGMENTS = 10;

/**
 * The orange's cross-section as a polar map: a thin rind, a white pith band, ten
 * juicy segments separated by pale membranes, and a pith core. Each segment is
 * packed with elongated juice vesicles (a highlight on each) so it reads as
 * translucent pulp and not as a flat colour. One canvas serves as colour and bump.
 */
export function cutTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const g = c.getContext("2d")!;
  const rnd = mulberry32(31);

  g.fillStyle = "#f4ead4";
  g.fillRect(0, 0, SIZE, SIZE);

  // rind (outer), pith band, then flesh
  g.fillStyle = "#e8780c";
  g.beginPath();
  g.arc(C, C, R, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#f7f0e0";
  g.beginPath();
  g.arc(C, C, R * 0.965, 0, Math.PI * 2);
  g.fill();
  const flesh = R * 0.885;
  g.fillStyle = "#ffa21f";
  g.beginPath();
  g.arc(C, C, flesh, 0, Math.PI * 2);
  g.fill();

  // segments: wedge fills with a gentle radial gradient, then vesicles
  const gap = 0.035; // membrane half-width in radians at the rim
  for (let s = 0; s < SEGMENTS; s++) {
    const a0 = (s / SEGMENTS) * Math.PI * 2 + gap;
    const a1 = ((s + 1) / SEGMENTS) * Math.PI * 2 - gap;
    const grad = g.createRadialGradient(C, C, R * 0.1, C, C, flesh);
    grad.addColorStop(0, "#ff8a12");
    grad.addColorStop(0.6, "#ff9a1a");
    grad.addColorStop(1, "#ffb42e");
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(C + Math.cos((a0 + a1) / 2) * R * 0.12, C + Math.sin((a0 + a1) / 2) * R * 0.12);
    g.arc(C, C, flesh * 0.98, a0, a1);
    g.closePath();
    g.fill();

    // vesicles: small elongated drops pointing toward the centre
    const mid = (a0 + a1) / 2;
    for (let i = 0; i < 520; i++) {
      const a = a0 + (a1 - a0) * (0.04 + rnd() * 0.92);
      const rr = R * 0.14 + rnd() * (flesh * 0.94 - R * 0.14);
      // keep inside the wedge (it narrows toward the centre)
      const maxHalf = (a1 - a0) / 2;
      if (Math.abs(a - mid) > maxHalf * (0.35 + 0.65 * (rr / flesh))) continue;
      const x = C + Math.cos(a) * rr;
      const y = C + Math.sin(a) * rr;
      const len = 7 + rnd() * 9;
      const wid = 3 + rnd() * 3;
      g.save();
      g.translate(x, y);
      g.rotate(a);
      const tone = rnd();
      g.fillStyle = tone > 0.5 ? "rgba(255,196,80,0.55)" : "rgba(255,120,10,0.5)";
      g.beginPath();
      g.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,246,214,0.55)"; // wet highlight
      g.beginPath();
      g.ellipse(-len * 0.25, -wid * 0.3, len * 0.35, wid * 0.28, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }

  // membranes: pale radial walls
  g.strokeStyle = "rgba(255,244,214,0.9)";
  g.lineCap = "round";
  for (let s = 0; s < SEGMENTS; s++) {
    const a = (s / SEGMENTS) * Math.PI * 2;
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(C + Math.cos(a) * R * 0.1, C + Math.sin(a) * R * 0.1);
    g.lineTo(C + Math.cos(a) * flesh, C + Math.sin(a) * flesh);
    g.stroke();
  }

  // core: pith star with a few fibres
  const core = g.createRadialGradient(C, C, 0, C, C, R * 0.14);
  core.addColorStop(0, "#fffaf0");
  core.addColorStop(1, "rgba(255,240,205,0)");
  g.fillStyle = core;
  g.beginPath();
  g.arc(C, C, R * 0.15, 0, Math.PI * 2);
  g.fill();

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
