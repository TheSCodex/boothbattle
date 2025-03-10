import * as poseDetection from '@tensorflow-models/pose-detection';
import { ArtilleryPose, atEase } from '../types/pose';
import { SMOOTHING_FACTOR } from '../constants';
import { distance, findKeyPoint, normalizedDistance } from '../utils/geometry';

/**
 * Detects the artillery pose based on the given pose detection data.
 * @param tfPose - The pose detection data.
 * @param currentArtilleryPose - The current artillery pose.
 * @param side - The side of the player ('left' or 'right').
 * @returns The updated artillery pose.
 */
export function detectArtilleryPose(
  tfPose: poseDetection.Pose,
  currentArtilleryPose: ArtilleryPose,
  side: 'left' | 'right'
): ArtilleryPose {
  const CONFIDENCE_THRESHOLD = 0.6;

  // Helper: returns the new keypoint if its confidence is high enough,
  // otherwise falls back to the previously stored value.
  function getSafeKeypoint(newKp: poseDetection.Keypoint | undefined, lastKp: poseDetection.Keypoint | undefined): poseDetection.Keypoint | undefined {
    if (newKp && newKp.score !== undefined && newKp.score > CONFIDENCE_THRESHOLD) {
      return newKp;
    }
    return lastKp;
  }

  // Retrieve safe keypoints based on the player's side.
  let safeActiveShoulder: poseDetection.Keypoint | undefined;
  let safeActiveWrist: poseDetection.Keypoint | undefined;
  let safePowerWrist: poseDetection.Keypoint | undefined;
  let safeOtherShoulder: poseDetection.Keypoint | undefined;

  if (side === 'right') {
    safeActiveShoulder = getSafeKeypoint(findKeyPoint(tfPose.keypoints, 'left_shoulder'), currentArtilleryPose.keypoints['activeShoulder']);
    safeActiveWrist    = getSafeKeypoint(findKeyPoint(tfPose.keypoints, 'left_wrist'), currentArtilleryPose.keypoints['activeWrist']);
    safePowerWrist     = getSafeKeypoint(findKeyPoint(tfPose.keypoints, 'right_wrist'), currentArtilleryPose.keypoints['powerWrist']);
    safeOtherShoulder  = getSafeKeypoint(findKeyPoint(tfPose.keypoints, 'right_shoulder'), currentArtilleryPose.keypoints['otherShoulder']);
  } else {
    safeActiveShoulder = getSafeKeypoint(findKeyPoint(tfPose.keypoints, 'right_shoulder'), currentArtilleryPose.keypoints['activeShoulder']);
    safeActiveWrist    = getSafeKeypoint(findKeyPoint(tfPose.keypoints, 'right_wrist'), currentArtilleryPose.keypoints['activeWrist']);
    safePowerWrist     = getSafeKeypoint(findKeyPoint(tfPose.keypoints, 'left_wrist'), currentArtilleryPose.keypoints['powerWrist']);
    safeOtherShoulder  = getSafeKeypoint(findKeyPoint(tfPose.keypoints, 'left_shoulder'), currentArtilleryPose.keypoints['otherShoulder']);
  }

  // If any required keypoint is missing, retain the current pose.
  if (!safeActiveShoulder || !safeActiveWrist || !safePowerWrist || !safeOtherShoulder) {
    return currentArtilleryPose;
  }

  // Save the updated safe keypoints for use in future frames.
  const updatedKeypoints = {
    activeShoulder: safeActiveShoulder,
    activeWrist: safeActiveWrist,
    powerWrist: safePowerWrist,
    otherShoulder: safeOtherShoulder,
  };

  // Calculate the angle using the safe keypoints.
  const angle = Math.atan2(
    safeActiveWrist.y - safeActiveShoulder.y,
    safeActiveWrist.x - safeActiveShoulder.x
  );
  const smoothedAngle = SMOOTHING_FACTOR * angle + (1 - SMOOTHING_FACTOR) * currentArtilleryPose.angle;

  // Calculate power based on normalized distance.
  const shoulderWidth = distance(safeActiveShoulder, safeOtherShoulder);
  const rawPower = normalizedDistance(safePowerWrist, safeActiveShoulder, shoulderWidth);
  let smoothedPower = rawPower;
  if (currentArtilleryPose.powerState.state === 'setting') {
    smoothedPower = currentArtilleryPose.powerState.power + SMOOTHING_FACTOR * (rawPower - currentArtilleryPose.powerState.power);
  }

  // Update the artillery pose based on the current state.
  switch (currentArtilleryPose.powerState.state) {
    case 'at-ease': {
      if (smoothedPower < 0.1) {
        return new ArtilleryPose(smoothedAngle, {
          state: 'setting',
          power: smoothedPower,
          holdPower: smoothedPower,
          holdTimestamp: Date.now(),
        }, updatedKeypoints);
      }
      break;
    }
    case 'setting': {
      if (smoothedPower - currentArtilleryPose.powerState.holdPower > 0.1) {
        return new ArtilleryPose(smoothedAngle, {
          state: 'setting',
          power: smoothedPower,
          holdPower: smoothedPower,
          holdTimestamp: Date.now(),
        }, updatedKeypoints);
      } else if (Date.now() - currentArtilleryPose.powerState.holdTimestamp < 3000) {
        return new ArtilleryPose(smoothedAngle, {
          state: 'setting',
          power: smoothedPower,
          holdPower: currentArtilleryPose.powerState.holdPower,
          holdTimestamp: currentArtilleryPose.powerState.holdTimestamp,
        }, updatedKeypoints);
      } else {
        return new ArtilleryPose(smoothedAngle, { state: 'firing', power: smoothedPower }, updatedKeypoints);
      }
    }
  }

  // By default, return an 'at-ease' pose.
  return new ArtilleryPose(smoothedAngle, atEase, updatedKeypoints);
}
