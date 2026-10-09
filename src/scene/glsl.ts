// Shared GLSL. Both the persistent scene canvas and the transition canvas map
// screen uv to plate uv through the same function, so the dissolve starts and
// ends on exactly the pixels the scene canvas shows.

export const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** Camera dolly as a uv transform (zoom about the centre, pan) plus cover-fit. */
export const PLATE_UV = /* glsl */ `
uniform vec2 uCover;
uniform float uZoom;
uniform vec2 uPan;
vec2 plateUv(vec2 uv) {
  vec2 q = (uv - 0.5) / uZoom + 0.5 + uPan;
  return (q - 0.5) * uCover + 0.5;
}
`;

export const PLATE_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uTex;
${PLATE_UV}
void main() {
  gl_FragColor = vec4(texture2D(uTex, plateUv(vUv)).rgb, 1.0);
  #include <colorspace_fragment>
}
`;

/**
 * Ordered-dither dissolve. A Bayer 8x8 threshold per cell of uPixelSize device
 * pixels is compared with a mix that sweeps across the screen in uDirection
 * (+1 top to bottom, -1 bottom to top) with a soft edge of scattered pixels.
 * uMix = 0 gives exactly A and uMix = 1 exactly B, because the sweep is clamped
 * to [0, 1] and thresholds lie in [0, 1).
 */
export const DITHER_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uTexA;
uniform sampler2D uTexB;
uniform float uMix;
uniform float uDirection;
uniform float uPixelSize;
${PLATE_UV}

float bayer2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

const float SOFT = 0.35;

void main() {
  vec2 cell = floor(gl_FragCoord.xy / uPixelSize);
  float t = bayer8(cell);
  float sweep = uDirection > 0.0 ? 1.0 - vUv.y : vUv.y;
  sweep = clamp(sweep + (hash(cell) - 0.5) * 0.08, 0.0, 1.0);
  float m = clamp((uMix * (1.0 + SOFT) - sweep) / SOFT, 0.0, 1.0);
  vec2 uv = plateUv(vUv);
  vec3 a = texture2D(uTexA, uv).rgb;
  vec3 b = texture2D(uTexB, uv).rgb;
  gl_FragColor = vec4(t < m ? b : a, 1.0);
  #include <colorspace_fragment>
}
`;

/** Halftone cloud: blob brightness drives dot size on a rotated screen grid. */
export const CLOUD_VERT = /* glsl */ `
attribute vec4 aSeed; // x0, y0, size, depth
uniform float uProgress;
uniform float uVel;
uniform float uAspect;
varying vec2 vUv;
varying float vDepth;
varying float vSeed;
void main() {
  vUv = uv;
  vDepth = aSeed.w;
  vSeed = aSeed.x * 12.9 + aSeed.y * 78.2;
  // deeper layers move faster; scroll drives position, velocity adds drift and stretch
  float x = mod(aSeed.x + 1.6 - uProgress * 3.2 * aSeed.w + uVel * 0.18 * aSeed.w, 3.2) - 1.6;
  float y = aSeed.y + uProgress * 0.25 * aSeed.w;
  float stretch = 1.0 + abs(uVel) * 0.5;
  vec2 p = position.xy * aSeed.z * vec2(stretch / uAspect, 1.0) + vec2(x, y);
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

export const CLOUD_FRAG = /* glsl */ `
varying vec2 vUv;
varying float vDepth;
varying float vSeed;
uniform vec3 uColor;
uniform float uDot;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

void main() {
  vec2 c = vUv - 0.5;
  float r = length(c * vec2(1.0, 1.6)) * 2.0;
  float blob = smoothstep(1.0, 0.0, r) * (0.55 + 0.45 * noise(c * 4.0 + vSeed));
  vec2 g = mat2(0.7071, -0.7071, 0.7071, 0.7071) * gl_FragCoord.xy / uDot;
  float d = length(fract(g) - 0.5);
  float radius = 0.5 * sqrt(clamp(blob, 0.0, 1.0));
  float a = (1.0 - smoothstep(radius - 0.08, radius + 0.08, d)) * 0.22 * mix(0.5, 1.0, vDepth);
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
`;
