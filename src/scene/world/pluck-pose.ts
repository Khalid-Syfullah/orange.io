import { Vector3 } from "three";
import { pull, toCamera } from "@/scroll/pluck";

/** Unit vector from the fruit toward the hand (right, below, in front). */
export const APPROACH = new Vector3(0.75, -0.45, 0.5).normalize();
/** Direction the fruit is pulled when it comes away from the branch (down, outward, toward the camera). */
export const PULL_DIR = new Vector3(0.35, -0.55, 0.6).normalize();
/** Where the fingers point on an open hand, before it is made perpendicular to the palm normal. */
export const FINGER_HINT = new Vector3(-0.55, 0.83, 0.1).normalize();

const Z = new Vector3(0, 0, 1);
const PULL_DIST = 0.16;
const CAMERA_DIST = 0.3;

/** How far the held fruit has moved from where it hangs, in tree-local space. Pure function of progress. */
export function fruitDisplacement(p: number, out: Vector3): Vector3 {
  return out.copy(PULL_DIR).multiplyScalar(PULL_DIST * pull(p)).addScaledVector(Z, CAMERA_DIST * toCamera(p));
}
