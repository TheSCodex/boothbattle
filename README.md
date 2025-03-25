
# **BoothBattle - Artillery Game with Pose Detection**  

**BoothBattle** is an artillery game where players control tanks and must adjust the angle and power of their shots to defeat opponents. What makes this demo unique is its integration with **pose detection**, allowing players to control the game using body movements.  
--
## **Game Features**  

- **Pose-Based Controls**: Using **TensorFlow.js**, the game detects player movements via a webcam. Players can fire projectiles by performing a specific gesture (e.g., raising an arm), making the control system immersive and dynamic.  

- **Physics-Based Gameplay**: Projectiles follow realistic physics, calculating trajectories and impact points, adding a layer of challenge and strategy to the game.  

- **User Interface**: The game provides real-time stats on shot distance, angles, and tank status, giving players essential information for strategic decision-making.  
--
## **Technologies Used**  

- **TensorFlow.js**: Enables **real-time pose detection**, allowing players to control the game through body gestures. TensorFlow.js provides a high-precision pose model to track human movement.  

- **TypeScript**: The game is developed in **TypeScript**, ensuring a more robust and maintainable codebase. Static typing improves code quality and error detection.  

- **Vite**: Used as the bundler, **Vite** optimizes the development workflow with live reload and fast build times. It also enhances the game's loading and execution performance.  
--
## **Project Structure**  

The project is organized into independent modules, each responsible for a specific game function, including:  

- `gameState.ts` - Manages game states (players, shots, collisions).  
- `player.ts` - Handles player logic and tank control.  
- `arrow.ts` - Manages projectile physics and behavior.  
- `poseDetection.ts` - Integrates TensorFlow.js for pose detection.  
- `drawing.ts` - Renders the graphical interface and game elements.  
- `geometry.ts` - Performs geometric calculations for projectile trajectories.  
---
## **How to Play**  

### **How to Enter Shooting Mode:**  

1. **Starting Position:**  
   - The player must stand upright in front of the webcam, arms relaxed at the sides.  

2. **Activating Shooting Mode:**  
   - **Player on the left side of the screen**: Move your **left wrist** toward your **right shoulder**. This gesture activates **shooting mode**.  
   - **Player on the right side of the screen**: Move your **right wrist** toward your **left shoulder** to activate **shooting mode** as well.  

### **Shooting Controls:**  

Once shooting mode is activated, you can adjust the shot’s direction and power as follows:  

- **Aiming**: Move your **right arm (or left arm if you're the player on the right side)** up or down to adjust the **shooting angle**.  
- **Power Adjustment**: The shot power is adjusted horizontally by moving your **wrist** closer or farther from your **shoulder** (simulating how you hold a bow). The farther the wrist is from the shoulder, the greater the shot power. If no movement is detected for 3 seconds, the projectile will be released.  

### **Game Tips:**  
- For more precise shots, ensure controlled movements and perform the shooting gesture clearly.  
- Experiment with different angles and power levels to find the best way to hit your opponent.  
- Make sure the camera is positioned far enough to capture both players’ full bodies.
---
## **Installation**  

1. Clone the repository:  
    ```bash
    git clone https://github.com/your_username/boothbattle.git
    ```  

2. Install dependencies:  
    ```bash
    cd boothbattle
    npm install
    ```  

3. Start the development server:  
    ```bash
    npm run dev
    ```  

4. Open the game in your browser by navigating to `http://localhost:5173`.  
