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
  minCrankForSteering: number;
  minSpeedForSteering: number;
  steeringSensitivity: number;
  maxTurn: number;
  turnResetMultiplier: number;
  centrifugal: number;
  
  // Steering Turn Gain (distance-based)
  baseTurnGain: number;
  maxTurnGain: number;
  turnGainPower: number;
  
  // Car Momentum & Stability
  turnDecayRate: number;
  centerReturnForce: number;
  lateralFriction: number;
  
  // Road Parameters
  roadColor: number;
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

  // Optional Debug Radar
  radarEnabled?: boolean;
  radarX?: number;
  radarY?: number;
  radarWidth?: number;
  radarHeight?: number;
  radarAlpha?: number;
  roadBendStrength?: number;
  lensStrength?: number; // outward bowing when not turning
  useLowRes?: boolean; // render driving view at reduced resolution and scale up
  lowResScale?: number; // e.g., 0.5 renders at half-res
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
  private turn: number = 0;
  
  // Speed Progression System
  private baseSpeed: number = 0; // Base speed from crank input
  private speedProgressionStartStep: number = 0; // When speed progression started (step-based)
  private speedProgressionDurationSteps: number = 1800; // 1800 steps to reach max progression (30 seconds at 60fps)
  private maxSpeedMultiplier: number = 1.0; // Maximum 1x speed multiplier (100%)
  // private shouldAutoRestartDriving: boolean = false; // Unused
  // private shouldAutoResumeAfterCollision: boolean = false; // Unused
  
  // Visual Elements
  private drivingContainer!: Phaser.GameObjects.Container;
  // private lowResRT?: Phaser.GameObjects.RenderTexture;
  private drivingBackground!: Phaser.GameObjects.Graphics;
  private drivingCar!: Phaser.GameObjects.Rectangle;
  private roadLines: Phaser.GameObjects.Graphics[] = [];
  private obstacles: Phaser.GameObjects.Rectangle[] = [];
  private roadLineGraphics!: Phaser.GameObjects.Graphics;
  private roadOffset: number = 0;
  private horizontalLinePhase: number = 0; // increments on countdown change
  private laneIndices: number[] = [-1.7, -0.55, 0.55, 1.7];
  private laneSpacingBottom: number = 130;
  private horizontalSpacing: number = 28;
  private getLensStrength(): number { return this.config.lensStrength ?? 60; }
  
  // Exit Preview System - simplified
  // Simple planned exit tracking - no more complex preview system
  private activeExits: Array<{
    obstacle: Phaser.GameObjects.Rectangle;
    visual: Phaser.GameObjects.Rectangle;
    exitNumber: number;
  }> = [];
  
  // Exit Planning System - clean numbered planned exits
  private plannedExits: Array<{
    number: number; // Exit number (1, 2, 3, etc.)
    previewThreshold: number; // When to spawn preview (0-100)
    exitThreshold: number; // When to spawn actual exit (0-100)
    laneIndex: number;
    exitBaseX: number; // Exit position (slightly left)
    previewBaseX: number; // Preview position (slightly right)
    width: number;
    height: number;
    previewSpawned: boolean;
    exitSpawned: boolean;
  }> = [];
  
  private currentSequenceProgress: number = 0;
  private lastPotholeSpawnStep: number = 0;
  private minPotholeSpawnDelay: number = 3; // Minimum steps between pothole spawns

  // Debug Radar
  private radarContainer?: Phaser.GameObjects.Container;
  private radarBG?: Phaser.GameObjects.Rectangle;
  private radarGrid?: Phaser.GameObjects.Grid;
  private radarGraphics?: Phaser.GameObjects.Graphics;
  private radarPlayer?: Phaser.GameObjects.Rectangle;
  
  // Timers
  private forwardMovementTimer: Phaser.Time.TimerEvent | null = null;
  private neutralReturnTimer: Phaser.Time.TimerEvent | null = null;
  private obstacleSpawnTimer: Phaser.Time.TimerEvent | null = null;
  private collisionTimer: Phaser.Time.TimerEvent | null = null;
  
  // Camera
  // private cameraMaxOffset: number = 100; // Unused
  // private roadViewYOffsetPercent: number = 0; // Unused
  private cameraAngle: number = 0;
  private currentCurve: number = 0; // -1..1 simplified curve value derived from steering
  private worldLateralOffset: number = 0; // world shift instead of moving the car
  private lastSteeringValueForVisual: number = 0;

  constructor(scene: Phaser.Scene, config: CarMechanicsConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Initialize car mechanics
   */
  public initialize() {
    // Create container to vertically compress the driving scene
    this.drivingContainer = this.scene.add.container(0, 0);
    this.drivingContainer.setDepth(this.config.roadDepth);
    // Keep container scale compact vertically; handle zoom via low-res RT scaling
    this.drivingContainer.setScale(1, 0.5);
    // Scooch the entire driving view down ~10% screen height
    this.drivingContainer.y = Math.floor(this.scene.cameras.main.height * 0.10);

    this.createDrivingBackground();
    this.createDrivingCar();
    this.carX = this.scene.cameras.main.width / 2;
    // Persistent graphics for dashed center line
    this.roadLineGraphics = this.scene.add.graphics();
    this.roadLineGraphics.setDepth(this.config.lineDepth);
    this.drivingContainer.add(this.roadLineGraphics);

    if (this.config.radarEnabled) {
      this.createRadar();
    }

    // Listen for countdown changes to animate horizontal lines
    this.scene.events.on('countdownChanged', this.onCountdownChanged, this);
    
    // Listen for step changes to update obstacle visuals
    this.scene.events.on('step', this.onStepChanged, this);
    console.log('CarMechanics: Registered step event listener');

    // Add 'E' key handler for testing exit spawning
    this.scene.input.keyboard?.on('keydown-E', () => {
      console.log('E key pressed - test exit spawning disabled');
    });
  }

  /**
   * Start driving mode
   */
  public startDriving(currentStep: number = 0) {
    this.drivingMode = true;
    // this.shouldAutoRestartDriving = true; // Removed unused property
    //console.log('Starting driving...');
    this.carSpeed = 0;
    // Do not force-reset carX to center; preserve current lateral position
    
    // Reset camera to center position when starting
    this.resetDrivingCamera();
    
    // Keep visual car fixed; do not set X here
    
    // Plan exits for this driving sequence
    console.log('🚗 Starting driving - planning exits...');
    this.planExitsForSequence();
    
    // Start automatic speed progression
    this.startAutomaticSpeedProgression(currentStep);
    
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
   * Plan exits for the current driving sequence
   */
  private planExitsForSequence() {
    // Clear previous planned exits
    this.plannedExits = [];
    this.currentSequenceProgress = 0;
    
    // Plan 2-3 exits per sequence
    const numExits = Phaser.Math.Between(2, 3);
    console.log(`Planning ${numExits} numbered exits for this driving sequence`);
    
    const gameWidth = this.scene.cameras.main.width;
    const roadWidthPx = gameWidth;
    const exitWidthPx = Math.floor(roadWidthPx * 0.30);
    const exitX = gameWidth - Math.floor(exitWidthPx / 2) - 1;
    
    // Position adjustments: exits slightly left, previews slightly right
    const exitOffsetLeft = 40; // Move exits 40px left
    const previewOffsetRight = 15; // Move previews 15px right
    
    // Generate exit thresholds with proper spacing
    const exitThresholds: number[] = [];
    for (let i = 0; i < numExits; i++) {
      let exitThreshold: number;
      let attempts = 0;
      
      do {
        // Spread exits across the sequence (30-85% range)
        exitThreshold = Phaser.Math.Between(30, 85);
        attempts++;
      } while (attempts < 10 && exitThresholds.some(t => Math.abs(t - exitThreshold) < 15));
      
      exitThresholds.push(exitThreshold);
    }
    
    // Sort thresholds to ensure proper order
    exitThresholds.sort((a, b) => a - b);
    
    // Create planned exits with proper preview spacing
    exitThresholds.forEach((exitThreshold, index) => {
      const exitNumber = index + 1; // Number exits 1, 2, 3, etc.
      
      // Preview spawns 10-30% before the exit, but not less than 1%, and not within 5 steps of another preview/exit
      let previewThreshold: number;
      let attempts = 0;
      
      do {
        const previewOffset = Phaser.Math.Between(10, 30);
        previewThreshold = Math.max(1, exitThreshold - previewOffset);
        attempts++;
      } while (attempts < 10 && (
        // Check against other exits
        exitThresholds.some(t => Math.abs(t - previewThreshold) < 5) ||
        // Check against other previews
        this.plannedExits.some(e => Math.abs(e.previewThreshold - previewThreshold) < 5)
      ));
      
      this.plannedExits.push({
        number: exitNumber,
        previewThreshold: previewThreshold,
        exitThreshold: exitThreshold,
        laneIndex: this.laneIndices[this.laneIndices.length - 1], // Rightmost lane
        exitBaseX: exitX - exitOffsetLeft, // Exit position (slightly left)
        previewBaseX: exitX + previewOffsetRight, // Preview position (slightly right)
        width: exitWidthPx,
        height: this.config.exitHeight,
        previewSpawned: false,
        exitSpawned: false
      });
    });
    
    console.log('🎯 Planned exits:', this.plannedExits.map(e => `Exit ${e.number}: Preview ${e.previewThreshold}%, Exit ${e.exitThreshold}%`));
    console.log('🎯 Total planned exits:', this.plannedExits.length);
  }

  /**
   * Update progress and spawn planned exits when thresholds are reached
   */
  public updateProgress(progress: number) {
    this.currentSequenceProgress = progress;
    
    // Debug logging for exit spawning
    if (progress % 10 === 0) { // Log every 10 progress points
      console.log(`Progress: ${progress}%, Planned exits: ${this.plannedExits.length}`);
      this.plannedExits.forEach(exit => {
        console.log(`  Exit ${exit.number}: Preview ${exit.previewThreshold}% (spawned: ${exit.previewSpawned}), Exit ${exit.exitThreshold}% (spawned: ${exit.exitSpawned})`);
      });
    }
    
    // Check if any planned exits should be spawned
    this.plannedExits.forEach(plannedExit => {
      // Spawn preview when preview threshold is reached
      if (!plannedExit.previewSpawned && progress >= plannedExit.previewThreshold) {
        console.log(`🎯 Spawning preview for Exit ${plannedExit.number} at progress ${progress}%`);
        this.spawnPlannedExitPreview(plannedExit);
        plannedExit.previewSpawned = true;
      }
      
      // Spawn actual exit when exit threshold is reached
      if (!plannedExit.exitSpawned && progress >= plannedExit.exitThreshold) {
        console.log(`🚪 Spawning Exit ${plannedExit.number} at progress ${progress}%`);
        this.spawnPlannedExit(plannedExit);
        plannedExit.exitSpawned = true;
      }
    });
  }

  /**
   * Spawn a planned exit preview when its preview threshold is reached
   */
  private spawnPlannedExitPreview(plannedExit: any) {
    console.log(`Spawning preview for Exit ${plannedExit.number} at ${plannedExit.previewThreshold}%`);
    
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const horizonY = gameHeight * 0.3;
    
    // Create preview obstacle (non-collidable but follows road movement)
    const obstacle = this.scene.add.rectangle(
      plannedExit.previewBaseX,
      horizonY + 2,
      plannedExit.width,
      plannedExit.height,
      this.config.exitColor,
      0.2 // Very transparent for preview
    );
    
    obstacle.setVisible(false); // Hide logic rectangle
    obstacle.setData('isExitPreview', true);
    obstacle.setData('exitNumber', plannedExit.number);
    
    // Create visual
    const visual = this.scene.add.rectangle(
      obstacle.x, obstacle.y, 
      obstacle.width, obstacle.height, 
      this.config.exitColor, 0.2
    );
    visual.setDepth(this.config.roadDepth + 0.5);
    
    // Add to driving container
    this.drivingContainer.add(obstacle);
    this.drivingContainer.add(visual);
    
    // Store data for road movement
    obstacle.setData('baseX', plannedExit.previewBaseX);
    obstacle.setData('laneOffset', (plannedExit.previewBaseX - gameWidth / 2) / this.laneSpacingBottom);
    obstacle.setData('baseW', plannedExit.width);
    obstacle.setData('baseH', plannedExit.height);
    obstacle.setData('visual', visual);
    obstacle.setData('laneIndex', plannedExit.laneIndex);
    
    // Add to obstacles array so it gets moved by the road system
    this.obstacles.push(obstacle);
    
    // Store for cleanup when exit spawns
    plannedExit.previewObstacle = obstacle;
    plannedExit.previewVisual = visual;
  }

  /**
   * Spawn a planned exit when its exit threshold is reached
   */
  private spawnPlannedExit(plannedExit: any) {
    console.log(`Spawning Exit ${plannedExit.number} at ${plannedExit.exitThreshold}%`);
    
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const horizonY = gameHeight * 0.3;
    
    // Remove preview if it exists
    if (plannedExit.previewObstacle) {
      // Remove from obstacles array
      const obstacleIndex = this.obstacles.indexOf(plannedExit.previewObstacle);
      if (obstacleIndex > -1) {
        this.obstacles.splice(obstacleIndex, 1);
      }
      // Destroy both obstacle and visual
      plannedExit.previewObstacle.destroy();
      plannedExit.previewVisual.destroy();
      plannedExit.previewObstacle = null;
      plannedExit.previewVisual = null;
    }
    
    // Create collidable exit
    const obstacle = this.scene.add.rectangle(
      plannedExit.exitBaseX,
      horizonY + 2,
      plannedExit.width,
      plannedExit.height,
      this.config.exitColor,
      0.8 // Opaque for actual exit
    );
    
    obstacle.setVisible(false); // Hide logic rectangle
    obstacle.setData('isExit', true);
    obstacle.setData('exitNumber', plannedExit.number);
    
    // Create visual at the same position as the obstacle
    const visual = this.scene.add.rectangle(
      plannedExit.exitBaseX, // Use the same position as obstacle
      horizonY + 2, 
      plannedExit.width, 
      plannedExit.height, 
      this.config.exitColor, 0.6
    );
    visual.setDepth(this.config.roadDepth + 0.5);
    
    // Add to driving container
    this.drivingContainer.add(obstacle);
    this.drivingContainer.add(visual);
    
    // Store data
    obstacle.setData('baseX', plannedExit.exitBaseX);
    obstacle.setData('laneOffset', (plannedExit.exitBaseX - gameWidth / 2) / this.laneSpacingBottom);
    obstacle.setData('baseW', plannedExit.width);
    obstacle.setData('baseH', plannedExit.height);
    obstacle.setData('visual', visual);
    obstacle.setData('laneIndex', plannedExit.laneIndex);
    
    // Add to obstacles array for collision detection
    this.obstacles.push(obstacle);
    
    // Track active exit
    this.activeExits.push({
      obstacle: obstacle,
      visual: visual,
      exitNumber: plannedExit.number
    });
  }

  /**
   * Get planned exits for UI display (shows exit thresholds, not preview thresholds)
   */
  public getPlannedExits() {
    return this.plannedExits.filter(exit => !exit.exitSpawned).map(exit => ({
      progressThreshold: exit.exitThreshold,
      spawned: exit.exitSpawned
    }));
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
    //console.log('Stopping driving...');
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
    // this.shouldAutoResumeAfterCollision = false; // Removed unused property
  }

  /**
   * Handle steering input
   */
  public handleSteering(steeringValue: number) {
    this.currentSteeringValue = steeringValue;
    // Debug log disabled to avoid console flooding during interaction
  }

  // (removed additive steering gating)

  /**
   * Start automatic speed progression when driving begins
   */
  private startAutomaticSpeedProgression(currentStep: number) {
    if (this.speedProgressionStartStep === 0) {
      this.speedProgressionStartStep = currentStep;
      this.baseSpeed = this.config.carMaxSpeed; // Use max speed as base
      console.log(`🚀 Starting automatic speed progression at step ${currentStep}`);
    }
  }

  /**
   * Handle step events (called from GameScene)
   */
  public onStepEvent(currentStep: number) {
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Update speed progression on step events only
    this.updateCarSpeedWithProgression(currentStep);
  }

  /**
   * Update car speed with logarithmic progression (step-based)
   */
  private updateCarSpeedWithProgression(currentStep: number) {
    if (this.baseSpeed === 0) {
      this.carSpeed = 0;
      this.speedProgressionStartStep = 0; // Reset progression timer
      return;
    }
    
    if (this.speedProgressionStartStep <= 0) {
      // No progression started yet or needs restart, start at 1% speed
      this.carSpeed = this.baseSpeed * 0.01; // Start at 1% of base speed
      this.speedProgressionStartStep = currentStep; // Start progression from current step
      return;
    }
    
    // Calculate how many steps have elapsed
    const elapsedSteps = currentStep - this.speedProgressionStartStep;
    
    // Target is 100% speed (1.0x multiplier)
    const targetMultiplier = 1.0;
    const currentMultiplier = this.carSpeed / this.baseSpeed;
    
    // Calculate distance to target (how much more we need to reach 100%)
    const distanceToTarget = targetMultiplier - currentMultiplier;
    
    // If we're very close to target, snap to it
    if (distanceToTarget < 0.01) {
      this.carSpeed = this.baseSpeed * targetMultiplier;
      return;
    }
    
    // Logarithmic approach: start with much bigger steps, decreasing as we approach target
    // Use logarithmic curve: log(distance + 1) / log(2) gives us decreasing increments
    const logFactor = Math.log(distanceToTarget + 1) / Math.log(2);
    
    // Base increment starts much higher for faster initial progression
    const baseIncrementPercent = 0.01; // 1% per step (10x faster than before)
    const incrementPercent = baseIncrementPercent * logFactor;
    
    // Calculate the actual speed increment
    const speedIncrement = this.baseSpeed * incrementPercent;
    
    // Apply the increment
    this.carSpeed += speedIncrement;
    
    // Cap at target speed
    this.carSpeed = Math.min(this.carSpeed, this.baseSpeed * targetMultiplier);
    
    // Debug logging every 60 steps (1 second at 60fps) - more frequent since progression is faster
    if (elapsedSteps > 0 && elapsedSteps % 60 === 0) {
      const currentPercent = Math.round((this.carSpeed / this.baseSpeed) * 100);
      const incrementThisStep = Math.round(incrementPercent * 100 * 100) / 100; // Show as percentage
      console.log(`🚀 Speed progression: ${currentPercent}% (+${incrementThisStep}% this step) at step ${currentStep}`);
    }
  }

  /**
   * Reset speed progression to default (called when hitting pothole)
   */
  private resetSpeedProgression() {
    console.log('🔄 Resetting speed progression due to pothole hit');
    this.carSpeed = this.baseSpeed * 0.01; // Reset to 1% speed
    // Restart progression by setting start step to current step
    // This will be updated when the next step event comes in
    this.speedProgressionStartStep = -1; // Mark as needing restart
  }

  /**
   * Get current speed multiplier (0.01 to 1.0)
   */
  public getSpeedMultiplier(): number {
    if (this.baseSpeed === 0) return 0;
    return this.carSpeed / this.baseSpeed;
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
  public update(currentStep: number = 0) {
    if (!this.drivingMode || this.drivingPaused) return;
    
    this.updateForwardMovement(currentStep);
    this.updateCarPosition();
    this.updateRoadLines();
    this.updateObstacles();
    this.updateRadar();

    // (low-res RT disabled)
  }

  /**
   * Create driving background
   */
  private createDrivingBackground() {
    this.drivingBackground = this.scene.add.graphics();
    this.drivingBackground.setDepth(this.config.roadDepth);
    this.drivingContainer.add(this.drivingBackground);
    
    // Draw initial road
    this.drawRoad();
  }

  /**
   * Create driving car visual
   */
  private createDrivingCar() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    this.drivingCar = this.scene.add.rectangle(
      gameWidth / 2,
      Math.floor(gameHeight * 0.85), // move car up on screen while staying near bottom road area
      60, // Increased width from 40 to 60 for easier collision
      60,
      0xff0000
    );
    this.drivingCar.setDepth(this.config.roadDepth + 1);
    // keep car fixed relative to screen while world scrolls
    this.drivingCar.setScrollFactor(0, 0);
    this.drivingContainer.add(this.drivingCar);
  }

  /**
   * Draw the road background
   */
  private drawRoad() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    this.drivingBackground.clear();
    
    // Draw sky
    const horizonY = gameHeight * 0.3; // moved horizon further up
    //this.drivingBackground.fillStyle(this.config.skyColor);
    //this.drivingBackground.fillRect(0, 0, gameWidth, horizonY);
    
    // Draw road
    this.drivingBackground.fillStyle(this.config.roadColor);
    this.drivingBackground.fillRect(0, horizonY, gameWidth, gameHeight - horizonY);

    // Horizon line effect
    this.drivingBackground.fillStyle(0x000000, 0.15);
    this.drivingBackground.fillRect(0, horizonY - 2, gameWidth, 2);
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
    console.log('Starting obstacle spawning timer with delay:', delay, 'ms');
    console.log('Current drivingMode:', this.drivingMode, 'drivingPaused:', this.drivingPaused);
    console.log('Current potholeProbability:', this.config.potholeProbability);
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
  private updateForwardMovement(currentStep: number = 0) {
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Speed progression is now handled in step events, not every frame
    
    // Update speed display based on current speed
    const speedPercentage = Math.round((this.carSpeed / this.config.carMaxSpeed) * 100);
    // Emit speed update event for UI
    this.scene.events.emit('speedUpdate', speedPercentage);
    
    // Advance road offset proportionally to speed for dashed-line motion (reverse direction)
    this.roadOffset -= this.carSpeed * 0.75; // motion factor for feel
  }

  /**
   * Update neutral return
   */
  private updateNeutralReturn() {
    if (!this.drivingMode || this.drivingPaused) return;
    // Do not auto-return while knob is being interacted with; rely on input stream
  }

  /**
   * Update car position based on steering
   */
  private updateCarPosition() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Only allow steering when speed is sufficient
    if (this.carSpeed < this.config.minSpeedForSteering) {
      this.currentSteeringValue = 0;
      // decay turn to neutral when nearly stopped
      this.turn = Math.abs(this.turn) < 0.01 ? 0 : Phaser.Math.Linear(this.turn, 0, this.config.turnResetMultiplier);
      // still allow car to keep its current lateral position (no forced recenter)
      // keep visual car fixed; do not move rectangle here
      return;
    }
    
    // Use steering value to update car position
    const normalizedValue = this.currentSteeringValue / 100;
    const speedMultiplier = this.carSpeed / this.config.carMaxSpeed;
    const dlt = (this.scene.game.loop.delta || 16) * 0.01;
    
    // Ease a curve value based on steering to simulate track bend
    // Opposite-to-steering road curvature for horizon bend
    const targetCurve = Phaser.Math.Clamp(-normalizedValue * 0.8, -1, 1);
    this.currentCurve = Phaser.Math.Linear(this.currentCurve, targetCurve, 0.08);
    
    // Turn accumulator with distance-based gain and momentum
    if (Math.abs(normalizedValue) > 0.001) {
      const steeringDirection = normalizedValue > 0 ? 1 : -1;
      // Make turn gain proportional to steering distance from center
      // Use inverse curve: easier to reach extremes, harder in middle
      const steeringDistance = Math.abs(normalizedValue);
      const baseTurnGain = this.config.baseTurnGain;
      const maxTurnGain = this.config.maxTurnGain;
      const turnGainPower = this.config.turnGainPower;
      
      // Use square root curve: gain increases quickly at extremes, slower in middle
      // This makes it easier to reach road edges
      const turnGain = baseTurnGain + (maxTurnGain - baseTurnGain) * Math.pow(steeringDistance, turnGainPower);
      
      // Additional boost for extreme steering to make road edges more accessible
      const extremeBoost = steeringDistance > 0.7 ? 1.5 : 1.0;
      
      this.turn += steeringDirection * dlt * turnGain * extremeBoost;
    } else {
      // Instead of forcing turn to 0, let it decay slowly for momentum
      this.turn *= (1 - this.config.turnDecayRate);
      // Only reset to 0 if it's very small to avoid floating point issues
      if (Math.abs(this.turn) < 0.001) {
        this.turn = 0;
      }
    }
    this.turn = Phaser.Math.Clamp(this.turn, -this.config.maxTurn, this.config.maxTurn);

    const dx = dlt * (speedMultiplier <= 0 ? 0 : speedMultiplier);

    // Calculate lateral movement with friction applied to velocity
    let lateralVelocity = this.turn * dx * this.config.steeringSensitivity;
    
    // Apply centrifugal effect pushing outward on curves, scaled by speed
    lateralVelocity -= this.currentCurve * dx * speedMultiplier * this.config.centrifugal;
    
    // Apply lateral friction to velocity (not position)
    lateralVelocity *= this.config.lateralFriction;
    
    // Apply the velocity to position
    this.carX += lateralVelocity;
    
    // Apply center return force (if configured)
    if (this.config.centerReturnForce > 0) {
      const centerX = this.scene.cameras.main.width / 2;
      const distanceFromCenter = centerX - this.carX;
      this.carX += distanceFromCenter * this.config.centerReturnForce * dlt;
    }
    
    // Clamp car within road bounds, symmetrically around screen center
    const gameWidthLocal = this.scene.cameras.main.width;
    const centerXLocal = gameWidthLocal / 2;
    const maxOffset = centerXLocal - this.config.boundaryPadding;
    this.carX = Phaser.Math.Clamp(this.carX, centerXLocal - maxOffset, centerXLocal + maxOffset);
    // Keep visual car fixed at screen center; do not move rectangle here
    
    // Debug log disabled to avoid console flooding during interaction
    
    // Move camera horizontally and tilt for first-person effect
    this.updateDrivingCamera();
  }

  /**
   * Update driving camera
   */
  private updateDrivingCamera() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Use world lateral offset (world moves, car stays)
    let offsetX = -this.worldLateralOffset;
    // Add slight curve sway to enhance bend sensation
    offsetX += this.currentCurve * 12;
    
    // NEW: Track car's horizontal position for camera movement
    const gameWidth = this.scene.cameras.main.width;
    const carCenterX = gameWidth / 2;
    const carOffsetFromCenter = this.drivingCar.x - carCenterX;
    
    // Apply horizontal camera tracking - camera follows car movement
    // Scale the offset to make camera movement feel natural (not too sensitive)
    const cameraTrackingFactor = 0.3; // 30% of car movement translates to camera movement
    const cameraOffsetX = carOffsetFromCenter * cameraTrackingFactor;
    
    // Keep main camera fixed; do not scroll horizontally
    const totalOffsetX = 0;
    this.scene.cameras.main.setScroll(0, 0);
    
    // Store camera angle for dash elements to use (but don't apply to main camera)
    const speedFactor = this.carSpeed / Math.max(1, this.config.carMaxSpeed);
    const targetAngle = Phaser.Math.Clamp((this.turn + this.currentCurve * 0.6) * 6 * speedFactor, -6, 6);
    this.cameraAngle = Phaser.Math.Linear(this.cameraAngle, targetAngle, 0.15);
    
    // Emit camera angle for dash elements to use
    this.scene.events.emit('cameraAngleChanged', this.cameraAngle);
    // Debug log disabled to avoid console flooding during driving
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
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const roadY = gameHeight * 0.3 + 10; // align with raised horizon
    const horizonY = gameHeight * 0.3;
    const centerX = gameWidth / 2;

    // Clear previous
    this.roadLineGraphics.clear();
    // Vertical lane lines: thinner and black
    this.roadLineGraphics.lineStyle(2, 0x000000, 1);

    // Helper to compute bezier bend offset at a normalized t (0 at horizon -> 1 bottom)
    const strength = this.config.roadBendStrength ?? 140;
    const end = this.currentCurve * strength;
    const control = end * 0.6;
    const bez = (t: number) => ((1 - t) * (1 - t) * 0) + (2 * (1 - t) * t * control) + (t * t * end);

    // Four lane lines like the overhead view
    const lensBase = this.getLensStrength();
    const lensFactorBase = 1 - Phaser.Math.Clamp(Math.abs(this.currentCurve), 0, 1);
    for (const lane of this.laneIndices) {
      let started = false;
      this.roadLineGraphics.beginPath();
      for (let y = roadY; y <= gameHeight; y += 6) {
        const t = Phaser.Math.Clamp((y - horizonY) / (gameHeight - horizonY), 0, 1);
        const lensOffset = (lane >= 0 ? 1 : -1) * lensBase * (t * t) * lensFactorBase;
        const x = centerX + bez(t) + lane * (this.laneSpacingBottom * t) + lensOffset;
        if (!started) {
          this.roadLineGraphics.moveTo(x, y);
          started = true;
        } else {
          this.roadLineGraphics.lineTo(x, y);
        }
      }
      this.roadLineGraphics.strokePath();
    }

    // Horizontal lines (grid-like), thinner, black
    this.roadLineGraphics.lineStyle(1, 0x000000, 1);
    // Perspective-spaced horizontals: denser near horizon, wider near bottom
    const totalSpan = gameHeight - horizonY;
    const linesCount = Math.max(1, Math.floor(totalSpan / this.horizontalSpacing));
    const phaseFrac = (this.horizontalLinePhase % this.horizontalSpacing) / this.horizontalSpacing; // 0..1
    for (let i = 0; i <= linesCount; i += 1) {
      const tLinear = (i + phaseFrac) / linesCount; // slide with phase
      if (tLinear > 1) continue;
      const t = Phaser.Math.Clamp(tLinear * tLinear, 0, 1); // square for perspective spacing
      const y = horizonY + totalSpan * t;
      const leftLens = -lensBase * (t * t) * lensFactorBase;
      const rightLens = lensBase * (t * t) * lensFactorBase;
      const leftX = centerX + bez(t) + this.laneIndices[0] * (this.laneSpacingBottom * t) + leftLens;
      const rightX = centerX + bez(t) + this.laneIndices[this.laneIndices.length - 1] * (this.laneSpacingBottom * t) + rightLens;
      this.roadLineGraphics.beginPath();
      this.roadLineGraphics.moveTo(leftX, y);
      this.roadLineGraphics.lineTo(rightX, y);
      this.roadLineGraphics.strokePath();
    }
  }

  /**
   * Update obstacles
   */
  private updateObstacles() {
    // Remove obstacles that are off screen (but not exits - they should persist for collision detection)
    this.obstacles.forEach(obstacle => {
      const isExit = obstacle.getData('isExit');
      const isExitPreview = obstacle.getData('isExitPreview');
      
      // Only remove non-exit obstacles when they go off screen
      if (!isExit && !isExitPreview && obstacle.y > this.scene.cameras.main.height) {
        const visualToDestroy: Phaser.GameObjects.Rectangle | undefined = obstacle.getData('visual');
        if (visualToDestroy) visualToDestroy.destroy();
        obstacle.destroy();
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
          this.obstacles.splice(index, 1);
        }
      }
    });

    // Continuous horizontal movement for obstacles (every frame)
    const gameHeight = this.scene.cameras.main.height;
    const gameWidth = this.scene.cameras.main.width;
    const horizonY = gameHeight * 0.3;
    const roadY = gameHeight * 0.3 + 10;
    const centerX = gameWidth / 2;
    const bendStrength = this.config.roadBendStrength ?? 140;
    const end = this.currentCurve * bendStrength;
    const control = end * 0.6;
    const bez = (tt: number) => ((1 - tt) * (1 - tt) * 0) + (2 * (1 - tt) * tt * control) + (tt * tt * end);

    this.obstacles.forEach(obstacle => {
      const visual: Phaser.GameObjects.Rectangle | undefined = obstacle.getData('visual');
      if (!visual) return;

      // Continuous horizontal positioning (every frame)
      const tVis = Phaser.Math.Clamp((obstacle.y - horizonY) / (gameHeight - horizonY), 0, 1);
      
      // Calculate X position with lane and lens effects
      let laneIndex: number | undefined = obstacle.getData('laneIndex');
      const worldOffset = -this.worldLateralOffset;
      if (obstacle.getData('isExit')) {
        laneIndex = this.laneIndices[this.laneIndices.length - 1];
      }
      const laneTermVis = (laneIndex ?? 0) * (this.laneSpacingBottom * tVis);
      const xProjectedVis = centerX + bez(tVis) + laneTermVis + worldOffset;
      
      // Update only horizontal position continuously
      visual.x = xProjectedVis;
      
      // Update perspective scaling continuously
      const baseW = obstacle.getData('baseW') ?? obstacle.width;
      const baseH = obstacle.getData('baseH') ?? obstacle.height;
      const widthScale = 0.2 + 0.8 * tVis;
      const heightScale = 0.4 + 0.6 * tVis;
      visual.displayWidth = baseW * widthScale;
      visual.displayHeight = baseH * heightScale;
    });

    // Screen-space collision with fixed car representation
    const carBounds = this.drivingCar.getBounds();
    this.obstacles.forEach(obstacle => {
      // Skip exit previews - they shouldn't trigger collisions
      if (obstacle.getData('isExitPreview')) {
        return;
      }
      
      const visual: Phaser.GameObjects.Rectangle | undefined = obstacle.getData('visual');
      if (visual && Phaser.Geom.Intersects.RectangleToRectangle(carBounds, visual.getBounds())) {
        const visualToDestroy: Phaser.GameObjects.Rectangle | undefined = obstacle.getData('visual');
        if (visualToDestroy) visualToDestroy.destroy();
        this.handleCollisionWithObstacle(obstacle);
      }
    });
    

    // Record last steering value used for visual horizontal updates
    this.lastSteeringValueForVisual = this.currentSteeringValue;
  }

  private handleCollisionWithObstacle(obstacle: Phaser.GameObjects.Rectangle) {
    // Collision response
    const isExit = !!obstacle.getData('isExit');
    const isPothole = !!obstacle.getData('isPothole');
    console.log('handleCollisionWithObstacle: pausing driving. isExit=', isExit, 'isPothole=', isPothole);
    this.pauseDriving();
    this.scene.events.emit('carCollision');
    if (isPothole) {
      // Reset speed progression when hitting a pothole
      this.resetSpeedProgression();
      
      // Let GameScene schedule the overlay cleanly (avoids double-show conflicts)
      this.scene.events.emit('potholeHit');
      // Auto-resume a bit later since pothole menu is ephemeral/non-blocking
      this.scene.time.delayedCall(500, () => this.resumeDriving(), [], this);
    }
    if (isExit) {
      // Show blocking exit menu with dark overlay and require button press; do NOT auto-resume here
      // Also pause the global app step/countdown just like the pause menu
      const appScene = this.scene.scene.get('AppScene');
      if (appScene) {
        (appScene as any).isPaused = true;
        const gameScene = this.scene.scene.get('GameScene');
        if (gameScene) {
          gameScene.events.emit('gamePaused');
        }
      }
      const menuScene = this.scene.scene.get('MenuScene');
      if (menuScene) {
        (menuScene as any).events.emit('showObstacleMenu', 'exit');
        this.scene.scene.bringToTop('MenuScene');
      }
    }
    obstacle.destroy();
    const index = this.obstacles.indexOf(obstacle);
    if (index > -1) {
      this.obstacles.splice(index, 1);
    }
  }

  /**
   * Spawn obstacle (only potholes now - exits are preplanned)
   */
  private spawnObstacle() {
    if (!this.drivingMode || this.drivingPaused) {
      console.log('SpawnObstacle blocked - drivingMode:', this.drivingMode, 'drivingPaused:', this.drivingPaused);
      return;
    }
    
    // Check pothole spawn timing - prevent spawning too soon after last pothole
    const currentStep = this.scene.time.now / 1000; // Convert to steps
    if (currentStep - this.lastPotholeSpawnStep < this.minPotholeSpawnDelay) {
      console.log('Pothole spawn blocked - too soon after last spawn');
      this.startObstacleSpawning(); // Reschedule
      return;
    }
    
    console.log('SpawnObstacle called - spawning pothole only');
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const horizonY = gameHeight * 0.3;
    
    // Only spawn potholes now - exits are preplanned
    const isPothole = Math.random() < this.config.potholeProbability;
    console.log('Spawning obstacle - isPothole:', isPothole, 'potholeProbability:', this.config.potholeProbability);
    
    // Only spawn potholes - skip if not a pothole
    if (!isPothole) {
      console.log('Not spawning pothole, scheduling next obstacle');
      this.startObstacleSpawning();
      return;
    }
    
    let obstacle: Phaser.GameObjects.Rectangle;
    
    // Create pothole
    // Create pothole with randomized lane and a small initial Y offset so lane separation is visible
    const widthPx = gameWidth * this.config.potholeWidth;
    const heightPx = gameHeight * this.config.potholeHeight;
    obstacle = this.scene.add.rectangle(0, 0, widthPx, heightPx, this.config.potholeColor);
    obstacle.setData('isPothole', true);

    // Choose a random lane index
    const laneIdx = Math.floor(Math.random() * this.laneIndices.length);
    const laneIndexChosen = this.laneIndices[laneIdx];

    // Place slightly below horizon so projected lane offset is noticeable
    const initialY = horizonY + Phaser.Math.Between(12, 90);
    const t0 = Phaser.Math.Clamp((initialY - horizonY) / (gameHeight - horizonY), 0, 1);

    const bendStrength = this.config.roadBendStrength ?? 140;
    const end = this.currentCurve * bendStrength;
    const control = end * 0.6;
    const bez = (tt: number) => ((1 - tt) * (1 - tt) * 0) + (2 * (1 - tt) * tt * control) + (tt * tt * end);
    const lensBase = this.getLensStrength();
    const lensFactorBase = 1 - Phaser.Math.Clamp(Math.abs(this.currentCurve), 0, 1);
    const lensOffset = (laneIndexChosen >= 0 ? 1 : -1) * lensBase * (t0 * t0) * lensFactorBase;
    const centerX = gameWidth / 2;
    const xProjected = centerX + bez(t0) + laneIndexChosen * (this.laneSpacingBottom * t0) + lensOffset;

    // Apply small horizontal jitter within projected lane
    const jitter = Phaser.Math.Between(-6, 6);
    obstacle.setPosition(xProjected + jitter, initialY);
    obstacle.setData('laneIndex', laneIndexChosen);
    
    // Update last pothole spawn time
    this.lastPotholeSpawnStep = this.scene.time.now / 1000;
    
    // Handle regular obstacles (potholes) - same as before
    obstacle.setDepth(this.config.roadDepth + 0.5);
    // Hide logic rectangle; create visible twin for render-only stepping
    obstacle.setVisible(false);
    const visual = this.scene.add.rectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height, obstacle.fillColor ?? 0xff0000);
    visual.setDepth(this.config.roadDepth + 0.5);
    // Add both to driving container so visuals are vertically compressed too
    this.drivingContainer.add(obstacle);
    this.drivingContainer.add(visual);
    // Store baseX so we can offset later relative to road/world movement
    obstacle.setData('baseX', obstacle.x);
    // Store a normalized lane offset so we can project along curved lanes
    const centerXVis = gameWidth / 2;
    const laneSpacingBottom = 130;
    obstacle.setData('laneOffset', (obstacle.x - centerXVis) / laneSpacingBottom);
    obstacle.setData('baseW', obstacle.width);
    obstacle.setData('baseH', obstacle.height);
    obstacle.setData('visual', visual);

    // Initialize laneIndex if not already set (exits or legacy)
    if (typeof obstacle.getData('laneIndex') !== 'number') {
      const laneIndexInit = this.laneIndices.reduce((prev, curr) => Math.abs(curr - (obstacle.getData('laneOffset'))) < Math.abs(prev - (obstacle.getData('laneOffset'))) ? curr : prev, this.laneIndices[0]);
      obstacle.setData('laneIndex', laneIndexInit);
    }

    // Initialize visual position/scale snapped to current phase at horizon
    const phaseOffset = (this.horizontalLinePhase % this.horizontalSpacing);
    const snappedY = horizonY + Math.max(0, Math.floor(((obstacle.y - horizonY) + phaseOffset) / this.horizontalSpacing)) * this.horizontalSpacing;
    const tVis = Phaser.Math.Clamp((snappedY - horizonY) / (gameHeight - horizonY), 0, 1);
    const bendStrengthVis = this.config.roadBendStrength ?? 140;
    const endVis = this.currentCurve * bendStrengthVis;
    const controlVis = endVis * 0.6;
    const bezVis = (tt: number) => ((1 - tt) * (1 - tt) * 0) + (2 * (1 - tt) * tt * controlVis) + (tt * tt * endVis);
    const lensBaseVis = this.getLensStrength();
    const lensFactorBaseVis = 1 - Phaser.Math.Clamp(Math.abs(this.currentCurve), 0, 1);
    const laneIndexForVis: number = Number(obstacle.getData('laneIndex')) || 0;
    const lensOffsetVis = (laneIndexForVis >= 0 ? 1 : -1) * lensBaseVis * (tVis * tVis) * lensFactorBaseVis;
    const xProjectedVis = centerXVis + bezVis(tVis) + laneIndexForVis * (this.laneSpacingBottom * tVis) + lensOffsetVis;
    visual.setPosition(xProjectedVis, snappedY);
    const baseW = obstacle.getData('baseW') ?? obstacle.width;
    const baseH = obstacle.getData('baseH') ?? obstacle.height;
    const widthScale = 0.2 + 0.8 * tVis;
    const heightScale = 0.4 + 0.6 * tVis;
    visual.displayWidth = baseW * widthScale;
    visual.displayHeight = baseH * heightScale;
    
    // Check if pothole is too close to any existing exits
    const minDistanceFromExit = 100; // Minimum distance in pixels
    const tooCloseToExit = this.obstacles.some(existingObstacle => {
      if (!existingObstacle.getData('isExit')) {
        return false; // Skip non-exits
      }
      const distance = Phaser.Math.Distance.Between(
        obstacle.x, obstacle.y,
        existingObstacle.x, existingObstacle.y
      );
      return distance < minDistanceFromExit;
    });
    
    if (tooCloseToExit) {
      console.log('Pothole too close to exit, deleting itself');
      // Clean up the obstacle and visual
      obstacle.destroy();
      visual.destroy();
      // Schedule next obstacle without adding this one
      this.startObstacleSpawning();
      return;
    }
    
    this.obstacles.push(obstacle);
    
    // Schedule next obstacle
    this.startObstacleSpawning();
  }

  /**
   * Spawn a test exit preview for debugging (triggered by 'E' key)
   */
  private spawnTestExitPreview() {
    console.log('Spawning test exit preview');
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const horizonY = gameHeight * 0.3;
    
    // Create exit preview (non-collidable) occupying right 30% of road width
    const roadWidthPx = gameWidth;
    const exitWidthPx = Math.floor(roadWidthPx * 0.30);
    const exitX = gameWidth - Math.floor(exitWidthPx / 2) - 1;
    
    // Create preview obstacle (not collidable yet)
    const obstacle = this.scene.add.rectangle(
      exitX,
      horizonY + 2,
      exitWidthPx,
      this.config.exitHeight,
      this.config.exitColor,
      0.5 // Semi-transparent to indicate it's a preview
    );
    
    // Hide the obstacle rectangle - only the visual should be visible
    obstacle.setVisible(false);
    
    // Generate bell-curved delay between 5-20 steps
    const stepsUntilActivation = this.generateBellCurvedDelay(5, 20);
    
    // Create unique IDs for preview and timer
    const previewId = `preview_${Date.now()}_${Math.random()}`;
    const timerId = `timer_${Date.now()}_${Math.random()}`;
    
    // Store original data for later conversion
    const originalData = {
      baseW: exitWidthPx,
      baseH: this.config.exitHeight,
      laneIndex: this.laneIndices[this.laneIndices.length - 1],
      laneOffset: (exitX - gameWidth / 2) / this.laneSpacingBottom,
      baseX: exitX
    };
    
    // Create independent timer (exists separately from preview)
    // this.exitTimers.push({
    //   id: timerId,
    //   stepsRemaining: stepsUntilActivation,
    //   originalData: originalData,
    //   previewId: previewId
    // });
    
    console.log('Created independent exit timer:', timerId, 'with', stepsUntilActivation, 'steps');
    
    // Create visual for preview - will be positioned properly by step-based updates
    const visual = this.scene.add.rectangle(obstacle.x, obstacle.y, obstacle.width, obstacle.height, this.config.exitColor, 0.3);
    visual.setDepth(this.config.roadDepth + 0.5);
    
    // Add to exit previews array instead of obstacles
    // this.exitPreviews.push({
    //   preview: obstacle,
    //   visual: visual,
    //   stepsUntilActivation: stepsUntilActivation,
    //   originalData: originalData,
    //   previewId: previewId
    // });
    
    // Don't add to obstacles array yet - it's not collidable
    obstacle.setData('isExitPreview', true);
    obstacle.setData('exitWidthPx', exitWidthPx);
    obstacle.setData('stepsUntilActivation', stepsUntilActivation);
    
    // Add to driving container
    this.drivingContainer.add(obstacle);
    this.drivingContainer.add(visual);
    
    // Store data for later use
    obstacle.setData('baseX', exitX);
    obstacle.setData('laneOffset', (exitX - gameWidth / 2) / this.laneSpacingBottom);
    obstacle.setData('baseW', exitWidthPx);
    obstacle.setData('baseH', this.config.exitHeight);
    obstacle.setData('visual', visual);
    obstacle.setData('laneIndex', this.laneIndices[this.laneIndices.length - 1]);
    
    // Initialize visual position
    const phaseOffset = (this.horizontalLinePhase % this.horizontalSpacing);
    const snappedY = horizonY + Math.max(0, Math.floor(((obstacle.y - horizonY) + phaseOffset) / this.horizontalSpacing)) * this.horizontalSpacing;
    const tVis = Phaser.Math.Clamp((snappedY - horizonY) / (gameHeight - horizonY), 0, 1);
    const bendStrength = this.config.roadBendStrength ?? 140;
    const end = this.currentCurve * bendStrength;
    const control = end * 0.6;
    const bez = (tt: number) => ((1 - tt) * (1 - tt) * 0) + (2 * (1 - tt) * tt * control) + (tt * tt * end);
    const lensBase = this.getLensStrength();
    const lensFactorBase = 1 - Phaser.Math.Clamp(Math.abs(this.currentCurve), 0, 1);
    const laneIndexForVis: number = this.laneIndices[this.laneIndices.length - 1];
    const lensOffset = (laneIndexForVis >= 0 ? 1 : -1) * lensBase * (tVis * tVis) * lensFactorBase;
    const xProjectedVis = gameWidth / 2 + bez(tVis) + laneIndexForVis * (this.laneSpacingBottom * tVis) + lensOffset;
    visual.setPosition(xProjectedVis, snappedY);
    const widthScale = 0.2 + 0.8 * tVis;
    const heightScale = 0.4 + 0.6 * tVis;
    visual.displayWidth = exitWidthPx * widthScale;
    visual.displayHeight = this.config.exitHeight * heightScale;
    
    console.log('Test exit preview created with', stepsUntilActivation, 'steps until activation');
    console.log('Preview starting position:', obstacle.x, obstacle.y);
    console.log('Screen height:', this.scene.cameras.main.height);
    console.log('Pothole speed:', this.config.potholeSpeed);
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

    // Destroy radar
    this.radarContainer?.destroy();
    this.radarBG = undefined;
    this.radarGrid = undefined;
    this.radarGraphics = undefined;
    this.radarPlayer = undefined;

    this.scene.events.off('countdownChanged', this.onCountdownChanged, this);
    this.scene.events.off('step', this.onStepChanged, this);
  }

  /**
   * Create a lightweight overhead debug radar similar to example TrackRadar
   */
  private createRadar() {
    const gameWidth = this.scene.cameras.main.width;
    const x = this.config.radarX ?? (gameWidth - 40);
    const y = this.config.radarY ?? 10;
    const width = this.config.radarWidth ?? 33;
    const height = this.config.radarHeight ?? 163;
    const alpha = this.config.radarAlpha ?? 0.75;

    this.radarContainer = this.scene.add.container(x, y);
    this.radarContainer.setDepth(10000);
    this.radarBG = this.scene.add.rectangle(0, 0, width, height, 0xffffff, alpha).setOrigin(0, 0);
    this.radarGrid = this.scene.add.grid(2, 2, width - 3, height - 3, (width - 3) / 3, (height - 3) / 5, 0x333333, 0.8).setOrigin(0, 0);
    this.radarGraphics = this.scene.add.graphics();
    this.radarPlayer = this.scene.add.rectangle(Math.floor(width / 2), height - 10, 3, 5, 0xffff00);
    this.radarContainer.add([this.radarBG, this.radarGrid, this.radarPlayer, this.radarGraphics]);
  }

  private onCountdownChanged(payload: any) {
    // Countdown changes no longer handle road movement - that's now step-based
    // This method is kept for potential future countdown-specific functionality
  }

  private onStepChanged(step: number) {
    console.log('Step changed to:', step);
    
    // Update road lines and obstacle visuals on every step
    const gameHeight = this.scene.cameras.main.height;
    const gameWidth = this.scene.cameras.main.width;
    const horizonY = gameHeight * 0.3;
    const roadY = gameHeight * 0.3 + 10;
    
    // Update horizontal line phase for road movement on every step
    const stepShift = 10; // pixels per step
    this.horizontalLinePhase = (this.horizontalLinePhase + stepShift) % 1000000;
    
    const phaseOffset = (this.horizontalLinePhase % this.horizontalSpacing);
    const bendStrength = this.config.roadBendStrength ?? 140;
    const centerX = gameWidth / 2;
    const end = this.currentCurve * bendStrength;
    const control = end * 0.6;
    const bez = (tt: number) => ((1 - tt) * (1 - tt) * 0) + (2 * (1 - tt) * tt * control) + (tt * tt * end);
    
    // Update regular obstacles
    this.obstacles.forEach(obstacle => {
      // Step-based movement: advance logical position (compensated for step frequency)
      obstacle.y += this.config.potholeSpeed * 60; // Multiply by 60 to match original 60fps speed
      
      const visual: Phaser.GameObjects.Rectangle | undefined = obstacle.getData('visual');
      if (!visual) return;
      
      // Step-based Y positioning: snap to horizontal line grid
      const snappedY = roadY + Math.max(0, Math.floor(((obstacle.y - roadY) + phaseOffset) / this.horizontalSpacing)) * this.horizontalSpacing;
      
      // Update only vertical position step-based (horizontal handled continuously in updateObstacles)
      visual.y = snappedY;
    });
    
    // Process exit previews
  }

  /**
   * Generate bell-curved random delay between min and max steps
   */
  private generateBellCurvedDelay(minSteps: number, maxSteps: number): number {
    // Generate two random numbers and use Box-Muller transform for bell curve
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Normalize to 0-1 range (assuming 3 standard deviations covers most cases)
    const normalized = (z0 + 3) / 6; // Shift and scale to 0-1
    const clamped = Math.max(0, Math.min(1, normalized));
    
    // Map to min-max range
    return Math.floor(minSteps + clamped * (maxSteps - minSteps));
  }



  /**
   * Spawn new collidable exit obstacle from preview data (legacy method)
   */
  private spawnExitFromPreview(previewData: any) {
    const { preview, originalData } = previewData;
    
    // Create a completely new collidable exit obstacle
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const horizonY = gameHeight * 0.3;
    
    console.log('Spawning new exit at origin position:', originalData.baseX, horizonY + 2);
    console.log('Exit dimensions:', originalData.baseW, 'x', originalData.baseH);
    console.log('Exit color:', this.config.exitColor);
    
    // Create new exit obstacle at origin (top of screen) like other obstacles
    const newExit = this.scene.add.rectangle(
      originalData.baseX, // Use original X position from when preview was created
      horizonY + 2,      // Start at horizon like other obstacles
      originalData.baseW,
      originalData.baseH,
      this.config.exitColor,
      1.0 // Fully opaque for collidable obstacle
    );
    
    console.log('Created exit rectangle:', newExit);
    console.log('Exit visible:', newExit.visible);
    console.log('Exit alpha:', newExit.alpha);
    
    // Set up the new obstacle with all necessary data
    newExit.setData('isExit', true);
    newExit.setData('exitWidthPx', originalData.baseW);
    newExit.setData('baseX', originalData.baseX);
    newExit.setData('laneOffset', originalData.laneOffset);
    newExit.setData('baseW', originalData.baseW);
    newExit.setData('baseH', originalData.baseH);
    newExit.setData('laneIndex', originalData.laneIndex);
    
    // Create visual for the new obstacle - will be positioned properly by step-based updates
    const visual = this.scene.add.rectangle(newExit.x, newExit.y, newExit.width, newExit.height, this.config.exitColor, 1.0);
    visual.setDepth(this.config.roadDepth + 0.5);
    newExit.setData('visual', visual);
    
    console.log('Created exit visual:', visual);
    console.log('Visual visible:', visual.visible);
    console.log('Visual alpha:', visual.alpha);
    console.log('Visual depth:', visual.depth);
    
    // Add to driving container
    this.drivingContainer.add(newExit);
    this.drivingContainer.add(visual);
    
    // Add to obstacles array so it becomes collidable
    this.obstacles.push(newExit);
    
    // console.log('Exit added to obstacles array. Total obstacles:', this.obstacles.length);
    console.log('Exit position after creation:', newExit.x, newExit.y);
    console.log('Exit visual position:', visual.x, visual.y);
  }

  /** Update radar each frame */
  private updateRadar() {
    if (!this.config.radarEnabled || !this.radarGraphics || !this.radarPlayer) return;
    const width = this.radarBG!.width;
    const height = this.radarBG!.height;

    // Clear previous cars/obstacles
    this.radarGraphics.clear();

    // Update player x on radar
    // Blend between actual car X and steering-based position so the radar responds even at low speeds
    const gameWidth = this.scene.cameras.main.width;
    const carNormX = Phaser.Math.Clamp(this.carX / gameWidth, 0, 1);
    const carRadarX = Phaser.Math.Clamp(2 + carNormX * (width - 4), 4, width - 3);
    // Steering mapped from -100..100 -> 0..1
    const steerNorm = Phaser.Math.Clamp((this.currentSteeringValue + 100) / 200, 0, 1);
    const steerRadarX = Phaser.Math.Clamp(2 + steerNorm * (width - 4), 4, width - 3);
    const speedFactor = Phaser.Math.Clamp(this.carSpeed / Math.max(1, this.config.carMaxSpeed), 0, 1);
    const blendedRadarX = Phaser.Math.Linear(steerRadarX, carRadarX, speedFactor);
    this.radarPlayer.setX(blendedRadarX);

    // Draw obstacles as red rectangles. Map screen y -> radar y, approximate distance
    this.obstacles.forEach(obstacle => {
      const oNormX = Phaser.Math.Clamp(obstacle.x / gameWidth, 0, 1);
      const oRadarX = Phaser.Math.Clamp(2 + oNormX * (width - 4), 4, width - 3);
      // Map from screen y (spawn around ~0.8H) to radar range [2 .. height-7]
      const gameHeight = this.scene.cameras.main.height;
      const yNorm = Phaser.Math.Clamp(obstacle.y / gameHeight, 0, 1);
      const oRadarY = Phaser.Math.Clamp(2 + yNorm * (height - 7), 2, height - 7);
      this.radarGraphics!.fillStyle(0xff0000).fillRect(oRadarX, oRadarY, 3, 5);
    });
  }
}
