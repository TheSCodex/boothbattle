/**
 * Sets up the camera and attaches the video stream to the provided HTMLVideoElement.
 *
 * @param video - The HTMLVideoElement to which the video stream will be attached.
 * @returns A Promise that resolves with the HTMLVideoElement once the video metadata is loaded and the video is playing.
 */
export async function setupCamera(video: HTMLVideoElement): Promise<HTMLVideoElement> {
  // Request a 640x480 video stream.
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      // Ensure the video element has dimensions.
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        video.width = 640;
        video.height = 480;
      }
      // Apply the mirror effect by flipping horizontally.
      video.style.transform = 'scaleX(-1)';
      video.play();
      resolve(video);
    };
  });
}
