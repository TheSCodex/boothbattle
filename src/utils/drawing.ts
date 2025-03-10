import * as poseDetection from '@tensorflow-models/pose-detection';
import { GameState } from '../game/gameState';
import { midPoint, normalizedTangent, distance } from "./geometry";
import * as Constants from "../constants";
import { ArtilleryPose } from '../types/pose';
import { GRAVITY } from '../constants';

const cloudImage = new Image();
cloudImage.src = '../../public/images/cloud.webp';
const sunImage = new Image();
sunImage.src = '../../public/images/sun.png';
const tankBlue = new Image();
tankBlue.src = '../../public/images/tank_blue.png';
const tankGreen = new Image();
tankGreen.src = '../../public/images/tank_green.png';
const tankBullet = new Image();
tankBullet.src = '../../public/images/tank_bullet.png';
const tankBulletLeft = new Image();
tankBulletLeft.src = '../../public/images/tank_bullet_inverted.png';
const tankTurret = new Image();
tankTurret.src = '../../public/images/tanks_turret.png';

// -------------------------
// Global Variable for Background Animation Time
// -------------------------
let backgroundTime = 0;

// -------------------------
// drawStatus: Draws the status canvas (video feed, overlays, keypoints, player info)
// -------------------------
export function drawStatus(
  statusCanvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  poses: poseDetection.Pose[],
  gameState: GameState
): void {
  const statusCtx = statusCanvas.getContext('2d')!;
  const player1Pose = gameState.player1pose;
  const player2Pose = gameState.player2pose;
  const player1ShotCount = gameState.player1ShotCount;
  const player2ShotCount = gameState.player2ShotCount;

  statusCtx.save();
  // Flip the video horizontally (mirror effect)
  statusCtx.scale(-1, 1);
  statusCtx.drawImage(video, -statusCanvas.width, 0, statusCanvas.width, statusCanvas.height);
  statusCtx.restore();
    
  // Draw low-opacity overlays for player zones.
  statusCtx.fillStyle = 'rgba(0, 0, 255, 0.1)'; // Blue for left
  statusCtx.fillRect(0, 0, statusCanvas.width / 2, statusCanvas.height);
  statusCtx.fillStyle = 'rgba(0, 255, 0, 0.1)'; // Green for right
  statusCtx.fillRect(statusCanvas.width / 2, 0, statusCanvas.width / 2, statusCanvas.height);
  
  // Draw keypoints for each detected pose (mirrored to match flipped video)
  poses.forEach(tfPose => {
    tfPose.keypoints.forEach(kp => {
      if (kp.score && kp.score > 0.5) {
        // Mirror the x coordinate
        const mirroredX = statusCanvas.width - kp.x;
        statusCtx.beginPath();
        statusCtx.arc(mirroredX, kp.y, 4, 0, 2 * Math.PI);
        statusCtx.fillStyle = 'black';
        statusCtx.fill();
      }
    });
  });
  
  // Display player info text (drawn in normal orientation)
  statusCtx.fillStyle = 'black';
  statusCtx.font = '16px Arial';
  statusCtx.fillText(`Player 1 (Left)`, 10, 20);
  statusCtx.fillText(`State: ${player1Pose.powerState.state}`, 10, 40);
  statusCtx.fillText(`Angle: ${Math.round((player1Pose.angle * 180) / Math.PI)}°`, 10, 60);
  statusCtx.fillText(`Power: ${player1Pose.powerState.state === 'setting' ? (player1Pose.powerState.power * 100).toFixed(0) : 0}`, 10, 80);
  statusCtx.fillText(`Shots: ${player1ShotCount}`, 10, 100);
  
  statusCtx.fillText(`Player 2 (Right)`, statusCanvas.width - 150, 20);
  statusCtx.fillText(`State: ${player2Pose.powerState.state}`, statusCanvas.width - 150, 40);
  statusCtx.fillText(`Angle: ${Math.round((player2Pose.angle * 180) / Math.PI)}°`, statusCanvas.width - 150, 60);
  statusCtx.fillText(`Power: ${player2Pose.powerState.state === 'setting' ? (player2Pose.powerState.power * 100).toFixed(0) : 0}`, statusCanvas.width - 150, 80);
  statusCtx.fillText(`Shots: ${player2ShotCount}`, statusCanvas.width - 150, 100);
}

// -------------------------
// calculateTrajectory: Computes trajectory points for a given initial state.
// -------------------------
export function calculateTrajectory(
  x: number,
  y: number,
  vx: number,
  vy: number,
  steps: number,
  deltaTime: number
) {
  const points = [];
  for (let i = 0; i < steps; i++) {
    x += vx * deltaTime;
    y += vy * deltaTime;
    vy += GRAVITY * deltaTime;
    points.push({ x, y });
  }
  return points;
}

// -------------------------
// drawAnimatedBackground: Draws a dynamic background with animated sky, clouds, a spinning sun, water waves, wind, and textured ground.
// -------------------------
function drawAnimatedBackground(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, deltaTime: number): void {
  backgroundTime += deltaTime;

  // --- Sky: Gradient for textured sky ---
  const skyHeight = canvas.height * 0.75;
  const skyGradient = ctx.createLinearGradient(0, 0, 0, skyHeight);
  skyGradient.addColorStop(0, "#87CEEB"); // Light blue
  skyGradient.addColorStop(1, "#7EC0EE"); // Slightly darker blue
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, skyHeight);

  // --- Moving Clouds ---
  for (let i = 0; i < 3; i++) {
    const cloudX = ((backgroundTime * 20 + i * 200) % (canvas.width + 100)) - 100;
    const cloudY = 50 + (i % 2) * 30;
    if (cloudImage.complete) {
      ctx.drawImage(cloudImage, cloudX, cloudY, 100, 50);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath();
      ctx.ellipse(cloudX + 50, cloudY + 25, 50, 25, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  // --- Spinning Sun ---
  const sunX = canvas.width - 100 + Math.sin(backgroundTime / 5) * 20;
  const sunY = 80 + Math.cos(backgroundTime / 5) * 10;
  const sunRotation = backgroundTime * 0.1; // Slow spin
  ctx.save();
  ctx.translate(sunX + 40, sunY + 40);
  ctx.rotate(sunRotation);
  if (sunImage.complete) {
    ctx.drawImage(sunImage, -40, -40, 80, 80);
  } else {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.restore();

  // --- Water: Gradient with sine-wave for waves ---
  const waterY = canvas.height * 0.75;
  const waterGradient = ctx.createLinearGradient(0, waterY, 0, canvas.height);
  waterGradient.addColorStop(0, "#1E90FF"); // DodgerBlue
  waterGradient.addColorStop(1, "#104E8B"); // Darker blue
  ctx.fillStyle = waterGradient;
  ctx.fillRect(0, waterY, canvas.width, canvas.height - waterY);

  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x <= canvas.width; x += 10) {
    const y = waterY + 10 * Math.sin((x / canvas.width * 4 * Math.PI) + backgroundTime);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // --- Ground: Raised a bit higher (start at 82% height) ---
  const groundY = canvas.height * 0.82;
  const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
  groundGradient.addColorStop(0, "#3B5323");
  groundGradient.addColorStop(1, "#2E8B57");
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  // --- Wind Representation ---
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    const startX = ((backgroundTime * 30 + i * 150) % canvas.width);
    const startY = 200 + (i % 2) * 30;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + 30, startY - 10);
    ctx.stroke();
  }
}

// -------------------------
// drawPlayerIndicators: Draws power bar, turret (rotated), and status text above each tank.
// -------------------------
function drawPlayerIndicators(ctx: CanvasRenderingContext2D, tankPos: { x: number, y: number }, playerPose: ArtilleryPose, isLeftPlayer: boolean): void {
  // Draw vertical power bar.
  const barWidth = 10;
  const barHeight = 50;
  const barX = isLeftPlayer ? tankPos.x - 60 : tankPos.x + 50;
  const barY = tankPos.y - barHeight;
  ctx.strokeStyle = 'black';
  ctx.strokeRect(barX, barY, barWidth, barHeight);
  let power = 0;
  if (playerPose.powerState.state === 'setting' || playerPose.powerState.state === 'firing') {
    power = playerPose.powerState.power;
  }
  const filledHeight = Math.min(power * barHeight, barHeight);
  ctx.fillStyle = 'orange';
  ctx.fillRect(barX, barY + (barHeight - filledHeight), barWidth, filledHeight);

  // Draw turret indicator.
  const turretWidth = 40;
  const turretHeight = 10;
  const turretOffsetY = -16;
  const turretOffsetX = isLeftPlayer ? 20 : -20;
  ctx.save();
  ctx.translate(tankPos.x + turretOffsetX, tankPos.y + turretOffsetY);
  if (!isLeftPlayer) {
    ctx.scale(-1, 1);
  }
  ctx.rotate(-playerPose.angle);
  ctx.drawImage(tankTurret, -turretWidth / 2, -turretHeight / 2, turretWidth, turretHeight);
  ctx.restore();

  // Display status text.
  let statusText = '';
  switch (playerPose.powerState.state) {
    case 'at-ease':
      statusText = 'At Ease';
      break;
    case 'setting':
      statusText = 'Aiming';
      break;
    case 'firing':
      statusText = 'Shooting';
      break;
    default:
      statusText = '';
  }
  ctx.fillStyle = 'black';
  ctx.font = '14px Arial';
  ctx.fillText(statusText, tankPos.x - 20, tankPos.y - 60);
}

// -------------------------
// drawGame: Draws the entire game scene on the game canvas.
// -------------------------
export function drawGame(
  gameCanvas: HTMLCanvasElement,
  gameState: GameState,
  poses: poseDetection.Pose[]
): void {
  const gameCtx = gameCanvas.getContext('2d')!;
  const tankSize = { width: 80, height: 40 };
  const leftTankPos = { x: 100, y: gameCanvas.height * 0.8 };
  const rightTankPos = { x: gameCanvas.width - 100, y: gameCanvas.height * 0.8 };

  gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  // Draw the animated background.
  drawAnimatedBackground(gameCtx, gameCanvas, 1 / 60);

  // Draw Tanks.
  gameCtx.drawImage(tankBlue, leftTankPos.x - tankSize.width / 2, leftTankPos.y - tankSize.height / 2, tankSize.width, tankSize.height);
  gameCtx.save();
  gameCtx.translate(rightTankPos.x, rightTankPos.y);
  gameCtx.scale(-1, 1);
  gameCtx.drawImage(tankGreen, -tankSize.width / 2, -tankSize.height / 2, tankSize.width, tankSize.height);
  gameCtx.restore();

  // Draw Arrows (Projectiles).
  gameState.arrows.forEach((arrow) => {
    gameCtx.save();
    gameCtx.translate(arrow.x, arrow.y);
    gameCtx.rotate(arrow.angle);
    if (arrow.shooter === "left") {
      gameCtx.drawImage(tankBullet, -10, -5, 20, 10);
    } else {
      gameCtx.drawImage(tankBulletLeft, -10, -5, 20, 10);
    }
    gameCtx.restore();
  });

  if (gameState.player1pose.powerState.state === 'setting') {
    const trajectoryPoints = calculateTrajectory(
        leftTankPos.x + tankSize.width / 2,
        leftTankPos.y,
        -Math.cos(gameState.player1pose.angle) * gameState.player1pose.powerState.power * 300,
        Math.sin(gameState.player1pose.angle) * gameState.player1pose.powerState.power * 300,
        5, // Number of steps
        0.1 // Time step
    );
    gameCtx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    gameCtx.beginPath();
    trajectoryPoints.forEach((point, index) => {
      if (index === 0) {
        gameCtx.moveTo(point.x, point.y);
      } else {
        gameCtx.lineTo(point.x, point.y);
      }
    });
    gameCtx.stroke();
  }

  // Draw trajectory preview for player 2
  if (gameState.player2pose.powerState.state === 'setting') {
    const trajectoryPoints = calculateTrajectory(
        rightTankPos.x - tankSize.width / 2,
        rightTankPos.y,
        -Math.cos(gameState.player2pose.angle) * gameState.player2pose.powerState.power * 300,
        Math.sin(gameState.player2pose.angle) * gameState.player2pose.powerState.power * 300,
        5, // Number of steps
        0.1 // Time step
    );
    gameCtx.strokeStyle = 'rgba(255, 0, 0, 1)';
    gameCtx.beginPath();
    trajectoryPoints.forEach((point, index) => {
      if (index === 0) {
        gameCtx.moveTo(point.x, point.y);
      } else {
        gameCtx.lineTo(point.x, point.y);
      }
    });
    gameCtx.stroke();
  }

  // Draw In-Game Indicators for each player.
  drawPlayerIndicators(gameCtx, leftTankPos, gameState.player1pose, true);
  drawPlayerIndicators(gameCtx, rightTankPos, gameState.player2pose, false);

  // Draw Skeletons for each player.
  const hipwidth = gameCanvas.height * 0.05;
  const leftSkeletonPose = poses.find(pose => {
    const avgX = pose.keypoints.reduce((sum, kp) => sum + kp.x, 0) / pose.keypoints.length;
    return avgX > gameState.statusCanvas.width / 2;
  });
  const rightSkeletonPose = poses.find(pose => {
    const avgX = pose.keypoints.reduce((sum, kp) => sum + kp.x, 0) / pose.keypoints.length;
    return avgX <= gameState.statusCanvas.width / 2;
  });
  if (leftSkeletonPose) {
    drawSkeleton(gameCtx, leftSkeletonPose.keypoints, hipwidth, leftTankPos.x, leftTankPos.y - tankSize.height / 2, true);
  }
  if (rightSkeletonPose) {
    drawSkeleton(gameCtx, rightSkeletonPose.keypoints, hipwidth, rightTankPos.x, rightTankPos.y - tankSize.height / 2, false);
  }

  // Draw Winner Message.
  if (gameState.winner) {
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    gameCtx.fillStyle = 'white';
    gameCtx.font = '40px Arial';
    gameCtx.textAlign = 'center';
    gameCtx.fillText(`${gameState.winner === 'left' ? 'Left' : 'Right'} Player Wins!`, gameCanvas.width / 2, gameCanvas.height / 2);
  }
}

// -------------------------
// drawSkeleton: Draws the upper-body skeleton based on keypoints.
// -------------------------
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  keypoints: poseDetection.Keypoint[],
  hipWidth: number,
  baseX: number,
  baseY: number,
  isPlayer1: boolean
): void {
  const leftHip = keypoints[Constants.LEFT_HIP];
  const rightHip = keypoints[Constants.RIGHT_HIP];
  
  if (!leftHip.score || !rightHip.score || leftHip.score < 0.5 || rightHip.score < 0.5) {
    return;
  }
  
  const detectedHipWidth = distance(leftHip, rightHip);
  const scale = hipWidth / detectedHipWidth;
  const hipMidpoint = midPoint(leftHip, rightHip);

  function project(keypoint: poseDetection.Keypoint) {
    return {
      x: baseX + (hipMidpoint.x - keypoint.x) * scale,
      y: baseY + (keypoint.y - hipMidpoint.y) * scale,
    };
  }

  function drawLine(from: poseDetection.Keypoint, to: poseDetection.Keypoint) {
    if (from.score && to.score && from.score > 0.5 && to.score > 0.5) {
      const fromProjected = project(from);
      const toProjected = project(to);
      ctx.beginPath();
      ctx.moveTo(fromProjected.x, fromProjected.y);
      ctx.lineTo(toProjected.x, toProjected.y);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = isPlayer1 ? "blue" : "green";
  ctx.lineWidth = 4;
  drawLine(keypoints[Constants.LEFT_SHOULDER], keypoints[Constants.LEFT_ELBOW]);
  drawLine(keypoints[Constants.LEFT_ELBOW], keypoints[Constants.LEFT_WRIST]);
  drawLine(keypoints[Constants.RIGHT_SHOULDER], keypoints[Constants.RIGHT_ELBOW]);
  drawLine(keypoints[Constants.RIGHT_ELBOW], keypoints[Constants.RIGHT_WRIST]);
  drawLine(keypoints[Constants.LEFT_SHOULDER], keypoints[Constants.RIGHT_SHOULDER]);
  drawLine(keypoints[Constants.LEFT_SHOULDER], keypoints[Constants.LEFT_HIP]);
  drawLine(keypoints[Constants.RIGHT_SHOULDER], keypoints[Constants.RIGHT_HIP]);
  drawLine(keypoints[Constants.LEFT_HIP], keypoints[Constants.RIGHT_HIP]);

  const shoulderMidpoint = project(midPoint(keypoints[Constants.LEFT_SHOULDER], keypoints[Constants.RIGHT_SHOULDER]));
  ctx.strokeStyle = "red";
  ctx.beginPath();
  ctx.arc(shoulderMidpoint.x, shoulderMidpoint.y, 5, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.strokeStyle = isPlayer1 ? "blue" : "green";
  const tangentVector = normalizedTangent(keypoints[Constants.LEFT_SHOULDER], keypoints[Constants.RIGHT_SHOULDER]);
  const headCenter = {
    x: shoulderMidpoint.x + tangentVector.x * 15,
    y: shoulderMidpoint.y - tangentVector.y * 15,
  };
  ctx.beginPath();
  ctx.arc(headCenter.x, headCenter.y, 10, 0, 2 * Math.PI);
  ctx.stroke();
}
