
// TODOS:
// - ⁠Apply a filter that will only update the key points if the confidence level is over a certain value
// - ⁠⁠Use “skeletons” in the game instead of boxes
// - ⁠⁠Indicate more clearly the power, angle and status (at-ease, setting, shooting) in the game’s canvas
// - ⁠⁠If possible make the movements smoother (that’s not actually a requirement)

// ============================================================
// Imports & TensorFlow Setup
// ============================================================
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// ============================================================
// Type Definitions & ArtilleryPose Class
// ============================================================
type AtEase = { state: 'at-ease' };
type Setting = { state: 'setting'; power: number; holdPower: number; holdTimestamp: number };
type Firing = { state: 'firing'; power: number };
type PowerState = AtEase | Setting | Firing;
const atEase: AtEase = { state: 'at-ease' };

class ArtilleryPose {
  angle: number;
  powerState: PowerState;
  constructor(angle: number, powerState: PowerState) {
    this.angle = angle;
    this.powerState = powerState;
  }
  static atEase() {
    return new ArtilleryPose(0, atEase);
  }
}

// ============================================================
// Global Game Variables
// ============================================================
interface Arrow {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  shooter: 'left' | 'right';
}

let player1Pose = ArtilleryPose.atEase();  // Left player (facing right)
let player2Pose = ArtilleryPose.atEase();  // Right player (facing left)
let player1ShotCount = 0;
let player2ShotCount = 0;
let arrows: Arrow[] = [];
let winner: 'left' | 'right' | null = null; // null means no winner yet

// ============================================================
// DOM Elements & Canvas Setup
// ============================================================
const video = document.getElementById('video') as HTMLVideoElement;

const statusCanvas = document.getElementById('statusCanvas') as HTMLCanvasElement;
const gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const statusCtx = statusCanvas.getContext('2d')!;
const gameCtx = gameCanvas.getContext('2d')!;

// Fixed positions for the tank characters.
const tankSize = { width: 40, height: 20 };
const leftTankPos = { x: 100, y: gameCanvas.height * 0.8 };
const rightTankPos = { x: gameCanvas.width - 100, y: gameCanvas.height * 0.8 };

// ============================================================
// Helper Functions: Geometry & Smoothing
// ============================================================
function midPoint(p1: poseDetection.Keypoint, p2: poseDetection.Keypoint) { // I won't need this anymore
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function distance(p1: poseDetection.Keypoint, p2: poseDetection.Keypoint) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function normalizedDistance(p1: poseDetection.Keypoint, p2: poseDetection.Keypoint, maxDist: number) {
  return distance(p1, p2) / maxDist;
}

function findKeyPoint(keypoints: poseDetection.Keypoint[], name: string) {
  return keypoints.find(kp => kp.name === name);
}

// ============================================================
// Pose Detection with Smoothing & Corrected Keypoints
// ============================================================
// For the flipped view we define:
//   • Left player: uses left_shoulder & left_wrist for aiming, and measures power from right_wrist (distance from left_shoulder).
//   • Right player: uses right_shoulder & right_wrist for aiming, and measures power from left_wrist (distance from right_shoulder).
function detectArtilleryPose(
  tfPose: poseDetection.Pose,
  currentPose: ArtilleryPose,
  side: 'left' | 'right'
): ArtilleryPose {
  let activeShoulder: poseDetection.Keypoint | undefined;
  let activeWrist: poseDetection.Keypoint | undefined;
  let powerWrist: poseDetection.Keypoint | undefined;
  let otherShoulder: poseDetection.Keypoint | undefined;

  if (side === 'left') {
    activeShoulder = findKeyPoint(tfPose.keypoints, 'left_shoulder');
    activeWrist = findKeyPoint(tfPose.keypoints, 'left_wrist');
    powerWrist = findKeyPoint(tfPose.keypoints, 'right_wrist');
    otherShoulder = findKeyPoint(tfPose.keypoints, 'right_shoulder');
  } else {
    activeShoulder = findKeyPoint(tfPose.keypoints, 'right_shoulder');
    activeWrist = findKeyPoint(tfPose.keypoints, 'right_wrist');
    powerWrist = findKeyPoint(tfPose.keypoints, 'left_wrist');
    otherShoulder = findKeyPoint(tfPose.keypoints, 'left_shoulder');
  }

  if (!activeShoulder || !activeWrist || !powerWrist || !otherShoulder) {
    return currentPose;
  }

  const rawAngle = Math.atan2(
    activeWrist.y - activeShoulder.y,
    activeWrist.x - activeShoulder.x
  );
  const smoothingFactor = 0.2;
  const smoothedAngle = currentPose.angle + smoothingFactor * (rawAngle - currentPose.angle);

  const shoulderWidth = distance(activeShoulder, otherShoulder);
  const rawPower = normalizedDistance(powerWrist, activeShoulder, shoulderWidth);
  let smoothedPower = rawPower;
  if (currentPose.powerState.state === 'setting') {
    smoothedPower = currentPose.powerState.power + smoothingFactor * (rawPower - currentPose.powerState.power);
  }

  switch (currentPose.powerState.state) {
    case 'at-ease': {
      if (smoothedPower < 0.1) {
        return new ArtilleryPose(smoothedAngle, {
          state: 'setting',
          power: smoothedPower,
          holdPower: smoothedPower,
          holdTimestamp: Date.now(),
        });
      }
      break;
    }
    case 'setting': {
      if (smoothedPower - currentPose.powerState.holdPower > 0.1) {
        return new ArtilleryPose(smoothedAngle, {
          state: 'setting',
          power: smoothedPower,
          holdPower: smoothedPower,
          holdTimestamp: Date.now(),
        });
      } else if (Date.now() - currentPose.powerState.holdTimestamp < 3000) {
        return new ArtilleryPose(smoothedAngle, {
          state: 'setting',
          power: smoothedPower,
          holdPower: currentPose.powerState.holdPower,
          holdTimestamp: currentPose.powerState.holdTimestamp,
        });
      } else {
        return new ArtilleryPose(smoothedAngle, { state: 'firing', power: smoothedPower });
      }
    }
  }
  return new ArtilleryPose(smoothedAngle, atEase);
}

// ============================================================
// Camera & Model Setup
// ============================================================
async function setupCamera(): Promise<HTMLVideoElement> {
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
      video.play();
      resolve(video);
    };
  });
}

async function loadModel() {
  // Ensure video metadata is loaded.
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;
  const detectorConfig: poseDetection.PosenetModelConfig = {
    architecture: 'MobileNetV1',
    outputStride: 16,
    inputResolution: { width, height },
    multiplier: 0.75
  };
  return await poseDetection.createDetector(poseDetection.SupportedModels.PoseNet, detectorConfig);
}

// ============================================================
// Game Scene Update Functions
// ============================================================
function updateArrows(deltaTime: number) {
  const gravity = 980; // pixels per second squared
  for (let i = arrows.length - 1; i >= 0; i--) {
    const arrow = arrows[i];
    arrow.x += arrow.vx * deltaTime;
    arrow.y += arrow.vy * deltaTime;
    arrow.vy += gravity * deltaTime;
    arrow.angle = Math.atan2(arrow.vy, arrow.vx);

    if (arrow.x < 0 || arrow.x > gameCanvas.width || arrow.y < 0 || arrow.y > gameCanvas.height) {
      arrows.splice(i, 1);
    }

    if (arrow.shooter === 'left') {
      if (checkCollision(arrow, rightTankPos, tankSize)) {
        winner = 'left';
      }
    } else {
      if (checkCollision(arrow, leftTankPos, tankSize)) {
        winner = 'right';
      }
    }
  }
}

function checkCollision(arrow: Arrow, tankPos: { x: number, y: number }, size: { width: number, height: number }) {
  return (arrow.x > tankPos.x - size.width/2 &&
          arrow.x < tankPos.x + size.width/2 &&
          arrow.y > tankPos.y - size.height/2 &&
          arrow.y < tankPos.y + size.height/2);
}

// ============================================================
// Drawing Functions: Status Canvas & Game Canvas
// ============================================================

// Flip drawing of video, overlays, keypoints, tanks, and arrows,
// then draw text in the normal orientation.
function drawStatus(poses: poseDetection.Pose[]) {
  statusCtx.clearRect(0, 0, statusCanvas.width, statusCanvas.height);
  statusCtx.save();
  statusCtx.translate(statusCanvas.width, 0);
  statusCtx.scale(-1, 1);
  statusCtx.drawImage(video, 0, 0, statusCanvas.width, statusCanvas.height);
  statusCtx.fillStyle = 'rgba(0, 0, 255, 0.1)';
  statusCtx.fillRect(0, 0, statusCanvas.width/2, statusCanvas.height);
  statusCtx.fillStyle = 'rgba(0, 255, 0, 0.1)';
  statusCtx.fillRect(statusCanvas.width/2, 0, statusCanvas.width/2, statusCanvas.height);
  poses.forEach(tfPose => {
    tfPose.keypoints.forEach(kp => {
      if (kp.score && kp.score > 0.5) {
        statusCtx.beginPath();
        statusCtx.arc(kp.x, kp.y, 4, 0, 2*Math.PI);
        statusCtx.fillStyle = 'black';
        statusCtx.fill();
      }
    });
  });
  statusCtx.restore();

  statusCtx.fillStyle = 'black';
  statusCtx.font = '16px Arial';
  statusCtx.fillText(`Player 1 (Left)`, 10, 20);
  statusCtx.fillText(`State: ${player1Pose.powerState.state}`, 10, 40);
  statusCtx.fillText(`Angle: ${Math.round((player1Pose.angle*180)/Math.PI)}°`, 10, 60);
  statusCtx.fillText(`Power: ${player1Pose.powerState.state === 'setting' ? (player1Pose.powerState.power*100).toFixed(0) : 0}`, 10, 80);
  statusCtx.fillText(`Shots: ${player1ShotCount}`, 10, 100);

  statusCtx.fillText(`Player 2 (Right)`, statusCanvas.width - 150, 20);
  statusCtx.fillText(`State: ${player2Pose.powerState.state}`, statusCanvas.width - 150, 40);
  statusCtx.fillText(`Angle: ${Math.round((player2Pose.angle*180)/Math.PI)}°`, statusCanvas.width - 150, 60);
  statusCtx.fillText(`Power: ${player2Pose.powerState.state === 'setting' ? (player2Pose.powerState.power*100).toFixed(0) : 0}`, statusCanvas.width - 150, 80);
  statusCtx.fillText(`Shots: ${player2ShotCount}`, statusCanvas.width - 150, 100);
}

function drawGame() {
  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  gameCtx.save();
  gameCtx.translate(gameCanvas.width, 0);
  gameCtx.scale(-1, 1);
  gameCtx.fillStyle = '#87CEEB';
  gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
  gameCtx.fillStyle = '#3CB371';
  gameCtx.fillRect(0, gameCanvas.height * 0.75, gameCanvas.width, gameCanvas.height * 0.25);
  gameCtx.fillStyle = 'blue';
  gameCtx.fillRect(leftTankPos.x - tankSize.width/2, leftTankPos.y - tankSize.height/2, tankSize.width, tankSize.height);
  gameCtx.fillStyle = 'red';
  gameCtx.fillRect(rightTankPos.x - tankSize.width/2, rightTankPos.y - tankSize.height/2, tankSize.width, tankSize.height);
  arrows.forEach(arrow => {
    gameCtx.save();
    gameCtx.translate(arrow.x, arrow.y);
    gameCtx.rotate(arrow.angle);
    gameCtx.beginPath();
    gameCtx.moveTo(0, 0);
    gameCtx.lineTo(-20, 0);
    gameCtx.strokeStyle = 'black';
    gameCtx.lineWidth = 2;
    gameCtx.stroke();
    gameCtx.beginPath();
    gameCtx.moveTo(0, 0);
    gameCtx.lineTo(-5, -5);
    gameCtx.lineTo(-5, 5);
    gameCtx.closePath();
    gameCtx.fillStyle = 'black';
    gameCtx.fill();
    gameCtx.restore();
  });
  gameCtx.restore();

  if (winner) {
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    gameCtx.fillStyle = 'white';
    gameCtx.font = '40px Arial';
    gameCtx.textAlign = 'center';
    gameCtx.fillText(`Player ${winner==='left'?'1':'2'} Wins!`, gameCanvas.width/2, gameCanvas.height/2);
  }
}

// ============================================================
// Main Pose & Game Loop
// ============================================================
async function gameLoop(detector: poseDetection.PoseDetector) {
  const poses = await detector.estimatePoses(video, { maxPoses: 2, flipHorizontal: false });
  
  const cleanPoses = // maxPoses: 2 for 2 players
  drawStatus(poses);
  poses.forEach(tfPose => {
    const avgX = tfPose.keypoints.reduce((sum, kp) => sum + kp.x, 0) / tfPose.keypoints.length;
    if (avgX < statusCanvas.width/2) {
      player1Pose = detectArtilleryPose(tfPose, player1Pose, 'left');
      if (player1Pose.powerState.state === 'firing') {
        player1ShotCount++;
        const arrowSpeed = 800 * player1Pose.powerState.power; 
        arrows.push({
          x: leftTankPos.x,
          y: leftTankPos.y,
          vx: arrowSpeed * Math.cos(player1Pose.angle),
          vy: arrowSpeed * Math.sin(player1Pose.angle),
          angle: player1Pose.angle,
          shooter: 'left'
        });
        player1Pose = ArtilleryPose.atEase();
      }
    } else {
      player2Pose = detectArtilleryPose(tfPose, player2Pose, 'right');
      if (player2Pose.powerState.state === 'firing') {
        player2ShotCount++;
        const arrowSpeed = 800 * player2Pose.powerState.power;
        arrows.push({
          x: rightTankPos.x,
          y: rightTankPos.y,
          vx: arrowSpeed * Math.cos(player2Pose.angle),
          vy: arrowSpeed * Math.sin(player2Pose.angle),
          angle: player2Pose.angle,
          shooter: 'right'
        });
        player2Pose = ArtilleryPose.atEase();
      }
    }
  });
  updateArrows(1/60);
  drawGame();
  if (!winner) {
    requestAnimationFrame(() => gameLoop(detector));
  }
}

// ============================================================
// Main Entry Point
// ============================================================
async function main() {
  await tf.ready();
  await tf.setBackend('webgl');
  await setupCamera();
  const detector = await loadModel();
  gameLoop(detector);
}

main();
