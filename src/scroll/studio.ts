import { FLY_ANCHORS, STUDIO as S } from "./script";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);
const win = (p: number, w: readonly [number, number]) => smooth(clamp01((p - w[0]) / (w[1] - w[0])));

/**
 * Orange radius (world units) and the studio camera. The camera distance is solved so that
 * at the start the 3D orange is exactly the size of the fly orange (anchor `center`, whose
 * svg circle spans 13.68vh at scale 1). A sphere of radius R at distance D fills
 * R / sqrt(D^2 - R^2) / tan(fov / 2) of the half-height.
 */
export const ORANGE_RADIUS = 0.3;
const CAMERA_FOV = 30;
const TAN_HALF = Math.tan((CAMERA_FOV * Math.PI) / 360);
const START_HALF_FRACTION = (FLY_ANCHORS.center.scale * 13.68) / 100; // diameter / viewH == radius / half-height
const CAMERA_Z0 = ORANGE_RADIUS * Math.sqrt(1 + 1 / (START_HALF_FRACTION * TAN_HALF) ** 2);
export const STUDIO_FOV = CAMERA_FOV;

export type StudioPose = {
  visible: boolean;
  /** Vertical offset in world units (a small damped settle). */
  y: number;
  /** Rotation about the vertical axis, linked to scroll; and a slight tilt. */
  rotY: number;
  rotX: number;
  scale: number;
  cameraZ: number;
};

/** Studio orange pose at progress `p`. Pure: scrolling back rotates and shrinks it back. */
export function studioPose(p: number, out: StudioPose = { visible: false, y: 0, rotY: 0, rotX: 0, scale: 1, cameraZ: CAMERA_Z0 }): StudioPose {
  out.visible = p >= S.start;
  // settle: a small, quickly damped dip and return, so it starts and ends exactly at the centre
  const t = clamp01((p - S.settle[0]) / (S.settle[1] - S.settle[0]));
  out.y = 0.045 * Math.exp(-4 * t) * Math.sin(3.4 * t) * (t > 0 && t < 1 ? 1 : 0);
  const r = win(p, S.rotate);
  out.rotY = 3.4 * r;
  out.rotX = 0.16 * Math.sin(Math.PI * r);
  out.scale = 1 + 0.12 * win(p, S.grow);
  // a slow push-in on the product shot over the whole scene
  out.cameraZ = CAMERA_Z0 - 0.25 * win(p, [S.start, S.grow[1]]);
  return out;
}

/** Radius of the orange on screen, in vh, and the registration mark's 0..1 reveal. */
export function studioScreen(p: number): { radiusVh: number; mark: number } {
  const pose = studioPose(p);
  const R = ORANGE_RADIUS * pose.scale;
  const half = R / Math.sqrt(pose.cameraZ * pose.cameraZ - R * R) / TAN_HALF; // fraction of the half-height
  return { radiusVh: 50 * half, mark: win(p, S.mark) };
}
