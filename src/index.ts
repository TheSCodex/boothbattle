import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl'; // Import the WebGL backend
import { setupCamera } from './utils/camera';
import { loadModel } from './models/poseDetection';
import { GameState } from './game/gameState';
import { drawGame } from './utils/drawing';
import { drawStatus } from './utils/drawing';

/**
 * Main function to initialize and run the game loop.
 *
 * This function sets up TensorFlow.js with the WebGL backend, initializes the camera,
 * loads the pose detection model, and starts the game loop.
 */
async function main() {
  await tf.ready();
  await tf.setBackend('webgl'); // Ensure WebGL backend is set for better performance

  const video = document.getElementById('video') as HTMLVideoElement;
  const gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

  await setupCamera(video); // Set up the camera feed

  const detector = await loadModel(video); // Load the pose detection model
  const gameState = new GameState(gameCanvas); // Initialize the game state

  /**
   * The game loop that continuously estimates poses, updates game state, and redraws the game.
   */
  async function gameLoop() {
    const poses = await detector.estimatePoses(video, { maxPoses: 2, flipHorizontal: false });

    gameState.updatePlayerPoses(poses, gameCanvas); // Update player poses based on detected poses
    drawStatus(gameState.statusCanvas, video, poses, gameState); // Draw the status on the status canvas

    drawGame(gameCanvas, gameState, poses); // Draw the game on the game canvas

    if (!gameState.winner) {
      requestAnimationFrame(gameLoop); // Continue the game loop if there is no winner
    }
  }

  gameLoop(); // Start the game loop
}

main(); // Execute the main function to start the application

