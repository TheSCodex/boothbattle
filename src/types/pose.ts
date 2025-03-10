import * as poseDetection from '@tensorflow-models/pose-detection';
/**
 * Represents the 'at-ease' state of the artillery pose.
 */
export type AtEase = { state: 'at-ease' };

/**
 * Represents the 'setting' state of the artillery pose.
 */
export type Setting = {
  state: 'setting';
  power: number;
  holdPower: number;
  holdTimestamp: number;
};

/**
 * Represents the 'firing' state of the artillery pose.
 */
export type Firing = { state: 'firing'; power: number };

/**
 * Represents the power state of the artillery pose, which can be 'at-ease', 'setting', or 'firing'.
 */
export type PowerState = AtEase | Setting | Firing;

/**
 * Constant representing the 'at-ease' state.
 */
export const atEase: AtEase = { state: 'at-ease' } as const;

/**
 * Represents the artillery pose with an angle, a power state, and the last known keypoints.
 */
export class ArtilleryPose {
  /** The angle of the artillery pose. */
  angle: number;
  /** The power state of the artillery pose. */
  powerState: PowerState;
  /** The last reliable keypoints used for pose calculations. */
  keypoints: { [key: string]: poseDetection.Keypoint };

  /**
   * Initializes a new instance of the ArtilleryPose class.
   * @param angle - The angle of the artillery pose.
   * @param powerState - The power state of the artillery pose.
   * @param keypoints - The last reliable keypoints.
   */
  constructor(angle: number, powerState: PowerState, keypoints: { [key: string]: poseDetection.Keypoint } = {}) {
    this.angle = angle;
    this.powerState = powerState;
    this.keypoints = keypoints;
  }

  /**
   * Creates an artillery pose in the 'at-ease' state.
   * @returns A new ArtilleryPose instance in the 'at-ease' state.
   */
  static atEase() {
    return new ArtilleryPose(0, atEase, {});
  }
}
