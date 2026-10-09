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

/**
 * Camera dolly as a uv transform (zoom about the centre, pan) plus cover-fit,
 * a velocity smear (vertical, strongest at the top and bottom edges, exactly
 * zero at rest) and a pointer sheen. Both the scene canvas and the dissolve
 * canvas use these, so the dissolve starts and ends on the scene's pixels.
 */
export const PLATE_UV = /* glsl */ `
uniform vec2 uCover;
uniform float uZoom;
uniform vec2 uPan;
uniform float uSmear;   // uv units at the screen edge, 0 at rest
uniform vec3 uSheen;    // pointer uv (xy), strength (z), 0 at rest
uniform float uAspect;

vec2 plateUv(vec2 uv) {
  vec2 q = (uv - 0.5) / uZoom + 0.5 + uPan;
  return (q - 0.5) * uCover + 0.5;
}

vec3 samplePlate(sampler2D t, vec2 screenUv) {
  vec2 uv = plateUv(screenUv);
  float off = uSmear * pow(abs(screenUv.y - 0.5) * 2.0, 2.0);
  if (off < 0.00001) return texture2D(t, uv).rgb;
  return (texture2D(t, uv + vec2(0.0, -off)).rgb + 2.0 * texture2D(t, uv).rgb + texture2D(t, uv + vec2(0.0, off)).rgb) * 0.25;
}

vec3 applySheen(vec3 c, vec2 screenUv) {
  if (uSheen.z <= 0.0) return c;
  vec2 d = (screenUv - uSheen.xy) * vec2(uAspect, 1.0);
  float f = exp(-dot(d, d) * 16.0) * uSheen.z;
  // warm white with a faint iridescent drift across the screen
  vec3 tint = 0.5 + 0.5 * cos(6.2831 * (vec3(0.0, 0.33, 0.67) + (screenUv.x + screenUv.y) * 0.6));
  vec3 hl = mix(vec3(1.0, 0.95, 0.85), tint, 0.22);
  return c + hl * f * 0.2;
}
`;

export const PLATE_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uTex;
${PLATE_UV}
void main() {
  gl_FragColor = vec4(applySheen(samplePlate(uTex, vUv), vUv), 1.0);
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
uniform float uAScreen; // 1: texture A is already a screen-space frame (a render target)
uniform float uBScreen;
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
  vec3 a = uAScreen > 0.5 ? texture2D(uTexA, vUv).rgb : samplePlate(uTexA, vUv);
  vec3 b = uBScreen > 0.5 ? texture2D(uTexB, vUv).rgb : samplePlate(uTexB, vUv);
  gl_FragColor = vec4(applySheen(t < m ? b : a, vUv), 1.0);
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
  float x = mod(aSeed.x + 1.6 - uProgress * 3.2 * aSeed.w + uVel * 0.34 * aSeed.w, 3.2) - 1.6;
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

/**
 * Depth of field: a 16-tap spiral gather whose radius follows each pixel's
 * circle of confusion (distance from the focus plane). Neighbours are weighted
 * by their own blur so a sharp subject does not bleed into the soft background.
 */
export const DOF_FRAG = /* glsl */ `
varying vec2 vUv;
uniform sampler2D uColor;
uniform sampler2D uDepth;
uniform float uNear;
uniform float uFar;
uniform float uFocus;   // view-space distance in focus
uniform float uDead;    // distance around the focus that stays sharp
uniform float uRange;   // distance over which blur reaches its maximum
uniform float uStrength;
uniform float uRadius;  // max blur radius in pixels
uniform vec2 uTexel;
uniform float uStudio;  // 0..1: the background veils toward clean cream
uniform vec3 uCream;

float linearDepth(float d) {
  float ndc = d * 2.0 - 1.0;
  return 2.0 * uNear * uFar / (uFar + uNear - ndc * (uFar - uNear));
}
float coc(vec2 uv) {
  float z = linearDepth(texture2D(uDepth, uv).x);
  return clamp((abs(z - uFocus) - uDead) / uRange, 0.0, 1.0) * uStrength;
}

void main() {
  float c = coc(vUv);
  vec3 acc = texture2D(uColor, vUv).rgb;
  float wsum = 1.0;
  if (c > 0.002) {
    for (int i = 0; i < 16; i++) {
      float a = float(i) * 2.39996;
      float r = sqrt((float(i) + 0.5) / 16.0);
      vec2 uv = vUv + vec2(cos(a), sin(a)) * r * uRadius * c * uTexel;
      float w = 0.15 + coc(uv);
      acc += texture2D(uColor, uv).rgb * w;
      wsum += w;
    }
  }
  vec3 col = acc / wsum;
  // studio: things far behind the subject (sky, ground, distant leaves) fade into cream;
  // what is near the focus plane keeps its colour
  float z = linearDepth(texture2D(uDepth, vUv).x);
  float far = smoothstep(uFocus + 0.5, uFocus + 4.0, z);
  col = mix(col, uCream, uStudio * (0.18 + 0.82 * far));
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;
