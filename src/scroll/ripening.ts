import { RIPENING as R, RIPE_COLORS } from "./script";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const win = (p: number, w: readonly [number, number]) => smooth(clamp01((p - w[0]) / (w[1] - w[0])));

// ---- OKLab (Bjorn Ottosson), so mixes keep their lightness and hue plausible
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const fromLin = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
type Lab = [number, number, number];

function hexToLab(hex: string): Lab {
  const n = parseInt(hex.slice(1), 16);
  const r = toLin(((n >> 16) & 255) / 255);
  const g = toLin(((n >> 8) & 255) / 255);
  const b = toLin((n & 255) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

function labToRgb([L, a, b]: Lab): [number, number, number] {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return lin.map((c) => clamp01(fromLin(clamp01(c)))) as [number, number, number];
}

const GREEN = hexToLab(RIPE_COLORS.green);
const MID = hexToLab(RIPE_COLORS.mid);
const RIPE = hexToLab(RIPE_COLORS.ripe);
const lab: Lab = [0, 0, 0];

/**
 * Peel colour (sRGB, 0..1) at progress `p`: green until the toYellow window,
 * green to yellow-orange through it, then yellow-orange to fully ripe in the
 * ripe window. Mixed in OKLab. `out` avoids allocation.
 */
export function ripenRgb(p: number, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
  const t1 = win(p, R.toYellow);
  const t2 = win(p, R.ripe);
  for (let i = 0; i < 3; i++) {
    const a = GREEN[i] + (MID[i] - GREEN[i]) * t1;
    lab[i] = a + (RIPE[i] - a) * t2;
  }
  const rgb = labToRgb(lab);
  out[0] = rgb[0];
  out[1] = rgb[1];
  out[2] = rgb[2];
  return out;
}

export function ripenCss(p: number): string {
  const [r, g, b] = ripenRgb(p);
  return `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`;
}

/** Fruit size multiplier on top of its stem-and-bud size: the oranges grow in the size window. */
export function ripenGrowth(p: number): number {
  return 1 + 0.7 * win(p, R.size);
}

/** Depth of field strength 0..1: builds as the camera singles out a fruit, then holds. */
export function dofStrength(p: number): number {
  return win(p, [R.toYellow[0], R.focus[1]]);
}

/** Camera focus move 0..1 across the whole scene (medium shot to close-up). */
export function focusMove(p: number): number {
  return win(p, [R.size[0], R.focus[1]]);
}
