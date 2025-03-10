import * as poseDetection from '@tensorflow-models/pose-detection';
import { ArtilleryPose, Firing } from '../types/pose';
import { detectArtilleryPose } from './player';
import { findKeyPoint } from '../utils/geometry';
import { Arrow, updateArrows } from '../game/arrow';

/**
 * Represents the state of the game, including player poses, arrows, and winner status.
 */
export class GameState {
  /** The pose of player 1. */
  player1pose: ArtilleryPose;
  /** The last launch details of player 1. */
  player1LastLaunch: (ArtilleryPose & { powerState: Firing }) | null;
  /** The pose of player 2. */
  player2pose: ArtilleryPose;
  /** The last launch details of player 2. */
  player2LastLaunch: (ArtilleryPose & { powerState: Firing }) | null;
  /** The array of arrows in the game. */
  arrows: Arrow[] = [];
  /** The winner of the game, if any. */
  winner: string | null = null;
  /** The position of the left tank. */
  leftTankPos: { x: number; y: number };
  /** The position of the right tank. */
  rightTankPos: { x: number; y: number };
  /** The size of the tanks. */
  tankSize = { width: 40, height: 20 };
  /** The shot count of player 1. */
  player1ShotCount: number = 0;
  /** The shot count of player 2. */
  player2ShotCount: number = 0;
  /** The canvas element for displaying game status. */
  statusCanvas = document.getElementById('statusCanvas') as HTMLCanvasElement;

  /**
   * Initializes the game state with the given game canvas.
   * @param gameCanvas - The game canvas element.
   */
  constructor(gameCanvas: HTMLCanvasElement) {
    this.player1pose = ArtilleryPose.atEase();
    this.player1LastLaunch = null;
    this.player2pose = ArtilleryPose.atEase();
    this.player2LastLaunch = null;

    // Calculate tank positions relative to the canvas width.
    // Left tank is positioned at 10% of the canvas width.
    // Right tank is positioned at 90% of the canvas width.
    this.leftTankPos = { x: gameCanvas.width * 0.1, y: gameCanvas.height * 0.8 };
    this.rightTankPos = { x: gameCanvas.width * 0.9, y: gameCanvas.height * 0.8 };
  }

  /**
   * Sorts the poses based on their average x-coordinate.
   * @param poses - The array of poses to sort.
   * @returns The sorted array of poses.
   */
  sortPoses(poses: poseDetection.Pose[]): poseDetection.Pose[] {
    return [...poses].sort((a, b) => {
      const getAverageX = (pose: poseDetection.Pose): number => {
        const leftShoulder = findKeyPoint(pose.keypoints, 'left_shoulder');
        const rightShoulder = findKeyPoint(pose.keypoints, 'right_shoulder');

        if (leftShoulder && rightShoulder && leftShoulder.score && rightShoulder.score) {
          if (leftShoulder.score > 0.5 && rightShoulder.score > 0.5) {
            return (leftShoulder.x + rightShoulder.x) / 2;
          }
        }

        return pose.keypoints.reduce((sum, kp) => sum + kp.x, 0) / pose.keypoints.length;
      };

      return getAverageX(a) - getAverageX(b);
    });
  }

  /**
   * Updates the player poses and arrows based on the detected poses.
   * @param sortedPoses - The sorted array of detected poses.
   * @param gameCanvas - The game canvas element.
   */
  async updatePlayerPoses(sortedPoses: poseDetection.Pose[], gameCanvas: HTMLCanvasElement): Promise<void> {
    sortedPoses.forEach((tfPose) => {
      // Calculate the average x-coordinate of the keypoints in the pose.
      const avgX = tfPose.keypoints.reduce((sum, kp) => sum + kp.x, 0) / tfPose.keypoints.length;
    
      // Determine which player the pose belongs to based on the average x-coordinate.
      // Note: we use the statusCanvas width (which is kept unchanged) to decide.
      if (avgX > this.statusCanvas.width / 2) {
        // Player 1 pose detection and firing.
        this.player1pose = detectArtilleryPose(tfPose, this.player1pose, 'left');
    
        if (this.player1pose.powerState.state === 'firing') {
          this.player1LastLaunch = this.player1pose as ArtilleryPose & { powerState: Firing };
          this.player1pose = ArtilleryPose.atEase();
          this.player1ShotCount++;
    
          // Launch arrow from the right edge of the left tank's box.
          this.arrows.push({
            x: this.leftTankPos.x + this.tankSize.width / 2,
            y: this.leftTankPos.y,
            vx: -Math.cos(this.player1LastLaunch.angle) * this.player1LastLaunch.powerState.power * 800,
            vy: Math.sin(this.player1LastLaunch.angle) * this.player1LastLaunch.powerState.power * 800,
            angle: this.player1LastLaunch.angle,
            shooter: 'left'
          });
        }
      } else {
        // Player 2 pose detection and firing.
        this.player2pose = detectArtilleryPose(tfPose, this.player2pose, 'right');
    
        if (this.player2pose.powerState.state === 'firing') {
          this.player2LastLaunch = this.player2pose as ArtilleryPose & { powerState: Firing };
          this.player2pose = ArtilleryPose.atEase();
          this.player2ShotCount++;
    
          // Launch arrow from the left edge of the right tank's box.
          this.arrows.push({
            x: this.rightTankPos.x - this.tankSize.width / 2,
            y: this.rightTankPos.y,
            vx: -Math.cos(this.player2LastLaunch.angle) * this.player2LastLaunch.powerState.power * 800,
            vy: Math.sin(this.player2LastLaunch.angle) * this.player2LastLaunch.powerState.power * 800,
            angle: this.player2LastLaunch.angle,
            shooter: 'right'
          });
        }
      }
    });
    
    // Update the arrows and check for a winner.
    const winner = updateArrows(1 / 60, this.arrows, gameCanvas, this.leftTankPos, this.rightTankPos, this.tankSize);
    
    // Check if a winner has been determined.
    if (winner) {
      this.winner = winner;
      console.log(`${this.winner} wins!`);
    }
  }
}
