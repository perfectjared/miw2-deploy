/**
 * CAR MECHANICS - DRIVING SYSTEM AND VEHICLE CONTROLS
 * 
 * This module handles all car-related mechanics including:
 * - Driving mode management (start/stop/pause/resume)
 * - Speed control and acceleration
 * - Steering mechanics and car positioning
 * - Road rendering and camera movement
 * - Obstacle spawning and collision detection
 * 
 * Key Features:
 * - Realistic car physics and movement
 * - Speed-based steering sensitivity
 * - First-person camera effects
 * - Road boundary constraints
 * - Dynamic obstacle generation
 */

import Phaser from 'phaser';

export interface CarMechanicsConfig {
  // Car Parameters
  carMaxSpeed: number;
  carAcceleration: number;
  minCrankForSteering: number;
  minSpeedForSteering: number;
  steeringSensitivity: number;
  
  // Road Parameters
  skyColor: number;
  roadColor: number;
  lineColor: number;
  boundaryPadding: number;
  roadDepth: number;
  lineWidth: number;
  lineHeight: number;
  lineGap: number;
  centerLineYOffset: number;
  lineDepth: number;
  
  // Obstacle Parameters
  obstacleMinDelayMs: number;
  obstacleMaxDelayMs: number;
  potholeProbability: number;
  potholeWidth: number;
  potholeHeight: number;
  potholeMinPos: number;
  potholeMaxPos: number;
  potholeSpawnY: number;
  potholeColor: number;
  potholeSpeed: number;
  
  // Exit Parameters
  exitWidth: number;
  exitHeight: number;
  exitPosition: number;
  exitSpawnY: number;
  exitColor: number;
  exitSpeed: number;
}

export class CarMechanics {
  private scene: Phaser.Scene;
  private config: CarMechanicsConfig;
  
  // Car State
  private drivingMode: boolean = false;
  private drivingPaused: boolean = false;
  private carSpeed: number = 0;
  private carX: number = 0;
  private currentSteeringValue: number = 0;
  private shouldAutoRestartDriving: boolean = false;
  private shouldAutoResumeAfterCollision: boolean = false;
  
  // Visual Elements
  private drivingBackground!: Phaser.GameObjects.Graphics;
  private drivingCar!: Phaser.GameObjects.Rectangle;
  private roadLines: Phaser.GameObjects.Graphics[] = [];
  private obstacles: Phaser.GameObjects.Rectangle[] = [];
  
  // Timers
  private forwardMovementTimer: Phaser.Time.TimerEvent | null = null;
  private neutralReturnTimer: Phaser.Time.TimerEvent | null = null;
  private obstacleSpawnTimer: Phaser.Time.TimerEvent | null = null;
  private collisionTimer: Phaser.Time.TimerEvent | null = null;
  
  // Camera
  private cameraMaxOffset: number = 100;
  private roadViewYOffsetPercent: number = 0;

  constructor(scene: Phaser.Scene, config: CarMechanicsConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Initialize car mechanics
   */
  public initialize() {
    this.createDrivingBackground();
    this.createDrivingCar();
    this.carX = this.scene.cameras.main.width / 2;
  }

  /**
   * Start driving mode
   */
  public startDriving() {
    this.drivingMode = true;
    this.shouldAutoRestartDriving = true;
    console.log('Starting driving...');
    this.carSpeed = 0;
    this.carX = this.scene.cameras.main.width / 2;
    
    // Reset camera to center position when starting
    this.resetDrivingCamera();
    
    // Update car position
    if (this.drivingCar) {
      this.drivingCar.setX(this.carX);
    }
    
    this.startForwardMovementTimer();
    this.startNeutralReturnTimer();
    this.startObstacleSpawning();
  }

  /**
   * Check if driving mode is active
   */
  public isDriving(): boolean {
    return this.drivingMode;
  }

  /**
   * Check if driving is paused
   */
  public isDrivingPaused(): boolean {
    return this.drivingPaused;
  }

  /**
   * Stop driving mode
   */
  public stopDriving() {
    this.drivingMode = false;
    console.log('Stopping driving...');
    this.carSpeed = 0;
    
    // Reset camera to center position
    this.resetDrivingCamera();
    
    this.stopForwardMovementTimer();
    this.stopNeutralReturnTimer();
    this.stopObstacleSpawning();
  }

  /**
   * Pause driving
   */
  public pauseDriving() {
    this.drivingPaused = true;
  }

  /**
   * Resume driving
   */
  public resumeDriving() {
    this.drivingPaused = false;
    this.shouldAutoResumeAfterCollision = false;
  }

  /**
   * Handle steering input
   */
  public handleSteering(steeringValue: number) {
    this.currentSteeringValue = steeringValue;
    console.log('CarMechanics: Steering input received:', steeringValue, 'Driving mode:', this.drivingMode, 'Car speed:', this.carSpeed);
  }

  /**
   * Handle speed crank input
   */
  public handleSpeedCrank(percentage: number) {
    console.log('CarMechanics: Speed crank set to', percentage + '%');
    
    // Update car speed based on crank percentage
    // Convert percentage (0-100) to actual speed
    const maxSpeed = this.config.carMaxSpeed;
    this.carSpeed = (percentage / 100) * maxSpeed;
    
    console.log('CarMechanics: Car speed set to', this.carSpeed);
  }

  /**
   * Get current car speed
   */
  public getCarSpeed(): number {
    return this.carSpeed;
  }

  /**
   * Get current car position
   */
  public getCarX(): number {
    return this.carX;
  }

  /**
   * Update car mechanics (called from main update loop)
   */
  public update() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    this.updateForwardMovement();
    this.updateCarPosition();
    this.updateRoadLines();
    this.updateObstacles();
  }

  /**
   * Create driving background
   */
  private createDrivingBackground() {
    this.drivingBackground = this.scene.add.graphics();
    this.drivingBackground.setDepth(this.config.roadDepth);
    
    // Draw initial road
    this.drawRoad();
  }

  /**
   * Create driving car visual
   */
  private createDrivingCar() {
    this.drivingCar = this.scene.add.rectangle(
      this.scene.cameras.main.width / 2,
      this.scene.cameras.main.height / 2,
      40,
      60,
      0xff0000
    );
    this.drivingCar.setDepth(this.config.roadDepth + 1);
  }

  /**
   * Draw the road background
   */
  private drawRoad() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    this.drivingBackground.clear();
    
    // Draw sky
    this.drivingBackground.fillStyle(this.config.skyColor);
    this.drivingBackground.fillRect(0, 0, gameWidth, gameHeight * 0.7);
    
    // Draw road
    this.drivingBackground.fillStyle(this.config.roadColor);
    this.drivingBackground.fillRect(0, gameHeight * 0.7, gameWidth, gameHeight * 0.3);
  }

  /**
   * Start forward movement timer
   */
  private startForwardMovementTimer() {
    this.stopForwardMovementTimer(); // Stop existing timer
    
    this.forwardMovementTimer = this.scene.time.addEvent({
      delay: 16, // ~60fps
      callback: this.updateForwardMovement,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Stop forward movement timer
   */
  private stopForwardMovementTimer() {
    if (this.forwardMovementTimer) {
      this.forwardMovementTimer.remove();
      this.forwardMovementTimer = null;
    }
  }

  /**
   * Start neutral return timer
   */
  private startNeutralReturnTimer() {
    this.stopNeutralReturnTimer(); // Stop existing timer
    
    this.neutralReturnTimer = this.scene.time.addEvent({
      delay: 16, // ~60fps
      callback: this.updateNeutralReturn,
      callbackScope: this,
      loop: true
    });
  }

  /**
   * Stop neutral return timer
   */
  private stopNeutralReturnTimer() {
    if (this.neutralReturnTimer) {
      this.neutralReturnTimer.remove();
      this.neutralReturnTimer = null;
    }
  }

  /**
   * Start obstacle spawning
   */
  private startObstacleSpawning() {
    this.stopObstacleSpawning(); // Stop existing timer
    
    const delay = Phaser.Math.Between(this.config.obstacleMinDelayMs, this.config.obstacleMaxDelayMs);
    this.obstacleSpawnTimer = this.scene.time.delayedCall(delay, this.spawnObstacle, [], this);
  }

  /**
   * Stop obstacle spawning
   */
  private stopObstacleSpawning() {
    if (this.obstacleSpawnTimer) {
      this.obstacleSpawnTimer.remove();
      this.obstacleSpawnTimer = null;
    }
  }

  /**
   * Update forward movement
   */
  private updateForwardMovement() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Gradually increase speed
    this.carSpeed = Math.min(this.carSpeed + this.config.carAcceleration, this.config.carMaxSpeed);
    
    // Update speed display
    const speedPercentage = Math.round((this.carSpeed / this.config.carMaxSpeed) * 100);
    // Emit speed update event for UI
    this.scene.events.emit('speedUpdate', speedPercentage);
  }

  /**
   * Update neutral return
   */
  private updateNeutralReturn() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Gradually return steering to neutral
    if (Math.abs(this.currentSteeringValue) > 1) {
      const returnSpeed = 2;
      this.currentSteeringValue = this.currentSteeringValue > 0 ? 
        Math.max(0, this.currentSteeringValue - returnSpeed) : 
        Math.min(0, this.currentSteeringValue + returnSpeed);
    }
  }

  /**
   * Update car position based on steering
   */
  private updateCarPosition() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Only allow steering when speed is sufficient
    if (this.carSpeed < this.config.minSpeedForSteering) {
      this.currentSteeringValue = 0;
      return;
    }
    
    // Use steering value to update car position
    const normalizedValue = this.currentSteeringValue / 100;
    const speedMultiplier = this.carSpeed / this.config.carMaxSpeed;
    
    // Update car position based on steering
    this.carX += normalizedValue * this.config.steeringSensitivity * speedMultiplier;
    
    // Clamp car position to road boundaries
    const gameWidth = this.scene.cameras.main.width;
    this.carX = Phaser.Math.Clamp(this.carX, this.config.boundaryPadding, gameWidth - this.config.boundaryPadding);
    
    // Update car visual position
    this.drivingCar.setX(this.carX);
    
    // Debug: Log car position changes
    if (Math.abs(normalizedValue) > 0.1) {
      console.log('CarMechanics: Car position updated to', this.carX, 'Steering:', normalizedValue, 'Speed:', this.carSpeed);
    }
    
    // Move camera horizontally for first-person effect
    this.updateDrivingCamera();
  }

  /**
   * Update driving camera
   */
  private updateDrivingCamera() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    const gameWidth = this.scene.cameras.main.width;
    const centerX = gameWidth / 2;
    const offsetX = (this.carX - centerX) * 0.3; // Camera follows car with some lag
    
    // Clamp camera offset
    const clampedOffset = Phaser.Math.Clamp(offsetX, -this.cameraMaxOffset, this.cameraMaxOffset);
    
    // Apply camera offset
    this.scene.cameras.main.setScroll(clampedOffset, 0);
  }

  /**
   * Reset driving camera to center
   */
  private resetDrivingCamera() {
    this.scene.cameras.main.setScroll(0, 0);
  }

  /**
   * Update road lines
   */
  private updateRoadLines() {
    // Clear existing lines
    this.roadLines.forEach(line => line.destroy());
    this.roadLines = [];
    
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const roadY = gameHeight * 0.7;
    
    // Draw center line
    const centerLine = this.scene.add.graphics();
    centerLine.lineStyle(this.config.lineWidth, this.config.lineColor);
    
    for (let y = roadY; y < gameHeight; y += this.config.lineGap) {
      centerLine.moveTo(gameWidth / 2, y);
      centerLine.lineTo(gameWidth / 2, y + this.config.lineHeight);
    }
    
    centerLine.stroke();
    centerLine.setDepth(this.config.lineDepth);
    this.roadLines.push(centerLine);
  }

  /**
   * Update obstacles
   */
  private updateObstacles() {
    // Move existing obstacles
    this.obstacles.forEach(obstacle => {
      obstacle.y += this.config.potholeSpeed;
      
      // Remove obstacles that are off screen
      if (obstacle.y > this.scene.cameras.main.height) {
        obstacle.destroy();
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
          this.obstacles.splice(index, 1);
        }
      }
    });
  }

  /**
   * Spawn obstacle
   */
  private spawnObstacle() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Determine obstacle type
    const isPothole = Math.random() < this.config.potholeProbability;
    
    let obstacle: Phaser.GameObjects.Rectangle;
    
    if (isPothole) {
      // Create pothole
      const x = Phaser.Math.Between(
        gameWidth * this.config.potholeMinPos,
        gameWidth * this.config.potholeMaxPos
      );
      
      obstacle = this.scene.add.rectangle(
        x,
        gameHeight * this.config.potholeSpawnY,
        gameWidth * this.config.potholeWidth,
        gameHeight * this.config.potholeHeight,
        this.config.potholeColor
      );
    } else {
      // Create exit
      obstacle = this.scene.add.rectangle(
        gameWidth * this.config.exitPosition,
        gameHeight * this.config.exitSpawnY,
        this.config.exitWidth,
        this.config.exitHeight,
        this.config.exitColor
      );
    }
    
    obstacle.setDepth(this.config.roadDepth + 0.5);
    this.obstacles.push(obstacle);
    
    // Schedule next obstacle
    this.startObstacleSpawning();
  }

  /**
   * Clean up resources
   */
  public destroy() {
    this.stopForwardMovementTimer();
    this.stopNeutralReturnTimer();
    this.stopObstacleSpawning();
    
    if (this.collisionTimer) {
      this.collisionTimer.remove();
      this.collisionTimer = null;
    }
    
    // Destroy visual elements
    if (this.drivingBackground) {
      this.drivingBackground.destroy();
    }
    if (this.drivingCar) {
      this.drivingCar.destroy();
    }
    
    this.roadLines.forEach(line => line.destroy());
    this.obstacles.forEach(obstacle => obstacle.destroy());
  }
}
