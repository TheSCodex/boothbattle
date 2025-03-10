import * as poseDetection from "@tensorflow-models/pose-detection";

/**
 * Calculates the midpoint between two keypoints.
 *
 * @param p1 - The first keypoint.
 * @param p2 - The second keypoint.
 * @returns An object representing the midpoint with x and y coordinates.
 */
export function midPoint(p1: poseDetection.Keypoint, p2: poseDetection.Keypoint) {
  // The midpoint is calculated by averaging the x and y coordinates of the two points.
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

/**
 * Calculates the Euclidean distance between two keypoints.
 *
 * @param p1 - The first keypoint.
 * @param p2 - The second keypoint.
 * @returns The distance between the two keypoints.
 */
export function distance(p1: poseDetection.Keypoint, p2: poseDetection.Keypoint) {
  // The Euclidean distance formula is used: sqrt((x2 - x1)^2 + (y2 - y1)^2).
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Calculates the normalized distance between two keypoints relative to a maximum distance.
 *
 * @param p1 - The first keypoint.
 * @param p2 - The second keypoint.
 * @param maxDist - The maximum distance used for normalization.
 * @returns The normalized distance as a value between 0 and 1.
 */
export function normalizedDistance(p1: poseDetection.Keypoint, p2: poseDetection.Keypoint, maxDist: number) {
  // Normalized distance is the distance divided by the maximum distance.
  return distance(p1, p2) / maxDist;
}

/**
 * Finds a keypoint by name in an array of keypoints.
 *
 * @param keypoints - The array of keypoints to search.
 * @param name - The name of the keypoint to find.
 * @returns The keypoint with the specified name, or undefined if not found.
 */
export function findKeyPoint(keypoints: poseDetection.Keypoint[], name: string) {
  // Uses the Array.prototype.find() method to locate the keypoint by name.
  return keypoints.find(kp => kp.name === name);
}

/**
 * Calculates the normalized tangent vector between two keypoints.
 *
 * @param p1 - The first keypoint.
 * @param p2 - The second keypoint.
 * @returns An object representing the normalized tangent vector with x and y components.
 */
export function normalizedTangent(p1: poseDetection.Keypoint, p2: poseDetection.Keypoint) {
  // Calculate the differences in x and y coordinates.
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;

  const length = Math.sqrt(dx ** 2 + dy ** 2);
  return {
    x: dy / length,
    y: -dx / length,
  };
}
