import * as poseDetection from '@tensorflow-models/pose-detection';

/**
 * Loads the pose detection model with the specified configuration.
 * @param video - The video element from which to detect poses.
 * @returns The loaded pose detection model.
 */
export async function loadModel(video: HTMLVideoElement): Promise<poseDetection.PoseDetector> {
  // Ensure video metadata is loaded.
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  // Configure the pose detection model.
  const detectorConfig: poseDetection.PosenetModelConfig = {
    architecture: 'MobileNetV1', // The architecture of the model.
    outputStride: 16, // The output stride of the model.
    inputResolution: { width, height }, // The input resolution of the model.
    multiplier: 0.75 // The multiplier for the model.
  };

  // Create and return the pose detection model with the specified configuration.
  return await poseDetection.createDetector(poseDetection.SupportedModels.PoseNet, detectorConfig);
}