import { GRAVITY } from "../constants";

/**
 * Represents an arrow in the game.
 */
export interface Arrow {
    /** The x-coordinate of the arrow's position. */
    x: number;
    /** The y-coordinate of the arrow's position. */
    y: number;
    /** The x-component of the arrow's velocity. */
    vx: number;
    /** The y-component of the arrow's velocity. */
    vy: number;
    /** The angle of the arrow's trajectory. */
    angle: number;
    /** The shooter of the arrow ('left' or 'right'). */
    shooter: 'left' | 'right';
}

/**
 * The winner of the game, if any.
 */
let winner: 'left' | 'right' | null = null;

/**
 * Updates the positions and velocities of the arrows and checks for collisions with the tanks.
 * @param deltaTime - The time elapsed since the last update.
 * @param arrows - The array of arrows to update.
 * @param gameCanvas - The game canvas element.
 * @param leftTankPos - The position of the left tank.
 * @param rightTankPos - The position of the right tank.
 * @param tankSize - The size of the tanks.
 * @returns The winner of the game, if any.
 */
export function updateArrows(
    deltaTime: number,
    arrows: Arrow[],
    gameCanvas: HTMLCanvasElement,
    leftTankPos: { x: number, y: number },
    rightTankPos: { x: number, y: number },
    tankSize: { width: number, height: number }
): 'left' | 'right' | null {
    // Increase the gravity effect by applying a multiplier
    const gravityMultiplier = 40; // Adjust this multiplier to make the arrow fall faster

    // Iterate over the arrows in reverse order to safely splice the array
    for (let i = arrows.length - 1; i >= 0; i--) {
        const arrow = arrows[i];

        // Update the arrow's position based on its velocity
        arrow.x += arrow.vx * deltaTime;
        arrow.y += arrow.vy * deltaTime;

        // Apply gravity to the arrow's vertical velocity with increased effect
        arrow.vy += GRAVITY * gravityMultiplier * deltaTime;

        // Update the arrow's angle based on its velocity components
        arrow.angle = Math.atan2(arrow.vy, arrow.vx);

        // Remove the arrow if it goes out of the canvas bounds
        if (arrow.x < 0 || arrow.x > gameCanvas.width || arrow.y < 0 || arrow.y > gameCanvas.height) {
            arrows.splice(i, 1);
            continue;
        }

        // Check for collision with the opponent's tank
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

    // Return the winner, if any
    return winner;
}

/**
 * Checks if an arrow collides with a tank.
 * @param arrow - The arrow to check for collision.
 * @param tankPos - The position of the tank.
 * @param size - The size of the tank.
 * @returns True if the arrow collides with the tank, false otherwise.
 */
export function checkCollision(
    arrow: Arrow,
    tankPos: { x: number, y: number },
    size: { width: number, height: number }
): boolean {
    // Check if the arrow's position is within the tank's bounds
    return (
        arrow.x > tankPos.x - size.width / 2 &&
        arrow.x < tankPos.x + size.width / 2 &&
        arrow.y > tankPos.y - size.height / 2 &&
        arrow.y < tankPos.y + size.height / 2
    );
}
