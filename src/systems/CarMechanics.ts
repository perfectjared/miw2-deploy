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

    // (low-res RT disabled)
  }

  /**
   * Start driving mode
   */
  public startDriving() {
    this.drivingMode = true;
    // this.shouldAutoRestartDriving = true; // Removed unused property
    //console.log('Starting driving...');
    this.carSpeed = 0;
    // Do not force-reset carX to center; preserve current lateral position
    
    // Reset camera to center position when starting
    this.resetDrivingCamera();
    
    // Keep visual car fixed; do not set X here
    
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
   * Handle speed crank input
   */
  public handleSpeedCrank(percentage: number) {
    //console.log('CarMechanics: Speed crank set to', percentage + '%');
    
    // Update car speed based on crank percentage
    // Convert percentage (0-100) to actual speed
    const maxSpeed = this.config.carMaxSpeed;
    this.carSpeed = (percentage / 100) * maxSpeed;
    
    //console.log('CarMechanics: Car speed set to', this.carSpeed);
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
    // Car speed is driven by the speed crank; do not auto-accelerate here.
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
    // Move existing obstacles
    this.obstacles.forEach(obstacle => {
      // Advance logical position continuously
      obstacle.y += this.config.potholeSpeed;
      // Apply lateral offset so obstacles follow road/world movement
      const gameWidth = this.scene.cameras.main.width;
      const gameHeight = this.scene.cameras.main.height;
      const horizonY = gameHeight * 0.3;
      const t = Phaser.Math.Clamp((obstacle.y - horizonY) / (gameHeight - horizonY), 0, 1);
      const bendStrength = this.config.roadBendStrength ?? 140;
      const centerX = gameWidth / 2;
      const end = this.currentCurve * bendStrength;
      const control = end * 0.6;
      const bez = (tt: number) => ((1 - tt) * (1 - tt) * 0) + (2 * (1 - tt) * tt * control) + (tt * tt * end);
      const laneSpacingBottom = this.laneSpacingBottom;
      // Ensure obstacle has a laneIndex; if not, derive nearest lane from baseX once
      let laneIndex: number | undefined = obstacle.getData('laneIndex');
      if (typeof laneIndex !== 'number') {
        const baseX = obstacle.getData('baseX') ?? obstacle.x;
        const approx = (baseX - centerX) / laneSpacingBottom;
        // Snap to nearest from allowed lane indices
        laneIndex = this.laneIndices.reduce((prev, curr) => Math.abs(curr - approx) < Math.abs(prev - approx) ? curr : prev, this.laneIndices[0]);
        obstacle.setData('laneIndex', laneIndex);
      }
      // Do not apply world lateral offset so obstacles don't move with steering
      const worldOffset = 0;
      let laneTerm = laneIndex * (laneSpacingBottom * t);
      if (obstacle.getData('isExit')) {
        // Project exit along the far-right lane, not by initial laneIndex
        laneTerm = this.laneIndices[this.laneIndices.length - 1] * (laneSpacingBottom * t);
      }
      obstacle.x = centerX + bez(t) + laneTerm + worldOffset;

      // Update visual rectangle X only when steering (dial) changes
      const visual: Phaser.GameObjects.Rectangle | undefined = obstacle.getData('visual');
      // Always keep visual twin lane-locked; don't drift with steering
      if (visual) {
        const gameWidth2 = this.scene.cameras.main.width;
        const centerX2 = gameWidth2 / 2;
        const tVisConst = Phaser.Math.Clamp(((obstacle.getData('visualY') ?? obstacle.y) - horizonY) / (gameHeight - horizonY), 0, 1);
        // Use same bezier, lane term and lens as road lines
        const laneIndexConst: number = obstacle.getData('isExit') ? this.laneIndices[this.laneIndices.length - 1] : (Number(obstacle.getData('laneIndex')) || 0);
        const lensBaseConst = this.getLensStrength();
        const lensFactorConst = 1 - Phaser.Math.Clamp(Math.abs(this.currentCurve), 0, 1);
        const lensOffsetConst = (laneIndexConst >= 0 ? 1 : -1) * lensBaseConst * (tVisConst * tVisConst) * lensFactorConst;
        const xProjectedVisConst = centerX2 + bez(tVisConst) + laneIndexConst * (laneSpacingBottom * tVisConst) + lensOffsetConst;
        visual.setX(xProjectedVisConst);
      }
      
      // Remove obstacles that are off screen
      if (obstacle.y > this.scene.cameras.main.height) {
        const visualToDestroy: Phaser.GameObjects.Rectangle | undefined = obstacle.getData('visual');
        if (visualToDestroy) visualToDestroy.destroy();
        obstacle.destroy();
        const index = this.obstacles.indexOf(obstacle);
        if (index > -1) {
          this.obstacles.splice(index, 1);
        }
      }

      // Screen-space collision with fixed car representation
      const carBounds = this.drivingCar.getBounds();
      // Use visual size/width, but logical Y (visual Y steps only on countdown)
      const visualTwin: Phaser.GameObjects.Rectangle | undefined = obstacle.getData('visual');
      let obsBounds: Phaser.Geom.Rectangle;
      if (visualTwin) {
        const halfW = visualTwin.displayWidth / 2;
        const halfH = visualTwin.displayHeight / 2;
        obsBounds = new Phaser.Geom.Rectangle(
          visualTwin.x - halfW,
          obstacle.y - halfH,
          visualTwin.displayWidth,
          visualTwin.displayHeight
        );
      } else {
        obsBounds = obstacle.getBounds();
      }
      const nearLogged = obstacle.getData('nearLogged');
      if (!nearLogged && Math.abs(obstacle.y - this.drivingCar.y) < 80) {
        // One-time near log to verify approach (disabled to avoid console spam)
        // console.log('Pothole near car: carX=', this.drivingCar.x, 'obsX=', obstacle.x, 'carY=', this.drivingCar.y, 'obsY=', obstacle.y);
        obstacle.setData('nearLogged', true);
      }
      // Only allow collision once the obstacle's bottom reaches the car's top
      // Use the visual rectangle's bounds entirely so collision matches what the player sees
      // const isExit = !!obstacle.getData('isExit'); // Unused
      const isPothole = !!obstacle.getData('isPothole');
      const visualBounds = visualTwin ? visualTwin.getBounds() : obsBounds;
      // Shrink bounds to make collisions less wide, especially for potholes
      const tightBounds = Phaser.Geom.Rectangle.Clone(visualBounds);
      const shrinkW = isPothole ? 12 : 4; // narrower pothole collision
      const shrinkH = isPothole ? 6 : 2;
      Phaser.Geom.Rectangle.Inflate(tightBounds, -shrinkW, -shrinkH);
      if (this.drivingCar && Phaser.Geom.Intersects.RectangleToRectangle(carBounds, tightBounds)) {
        // Debug log disabled to avoid console flooding during collisions
        // console.log('COLLISION: car vs obstacle', {
        //   carX: this.drivingCar.x,
        //   carY: this.drivingCar.y,
        //   obsX: obstacle.x,
        //   obsY: obstacle.y,
        //   usingVisualBounds: !!visualTwin,
        //   isPothole: !!obstacle.getData('isPothole')
        // });
        // Destroy obstacle on collision
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
      // Also emit exitHit for story overlay timing
      this.scene.events.emit('exitHit');
    }
    obstacle.destroy();
    const index = this.obstacles.indexOf(obstacle);
    if (index > -1) {
      this.obstacles.splice(index, 1);
    }
  }

  /**
   * Spawn obstacle
   */
  private spawnObstacle() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const horizonY = gameHeight * 0.3;
    
    // Determine obstacle type
    const isPothole = Math.random() < this.config.potholeProbability;
    
    let obstacle: Phaser.GameObjects.Rectangle;
    
    if (isPothole) {
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
    } else {
      // Create exit occupying right 30% of road width
      const roadWidthPx = gameWidth; // using full width road representation
      const exitWidthPx = Math.floor(roadWidthPx * 0.30);
      const exitX = gameWidth - Math.floor(exitWidthPx / 2) - 1;
      obstacle = this.scene.add.rectangle(
        exitX,
        horizonY + 2,
        exitWidthPx,
        this.config.exitHeight,
        this.config.exitColor
      );
      obstacle.setData('isExit', true);
      obstacle.setData('exitWidthPx', exitWidthPx);
    }
    
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
    const centerX = gameWidth / 2;
    const laneSpacingBottom = 130;
    obstacle.setData('laneOffset', (obstacle.x - centerX) / laneSpacingBottom);
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
    const bendStrength = this.config.roadBendStrength ?? 140;
    const end = this.currentCurve * bendStrength;
    const control = end * 0.6;
    const bez = (tt: number) => ((1 - tt) * (1 - tt) * 0) + (2 * (1 - tt) * tt * control) + (tt * tt * end);
    const lensBase = this.getLensStrength();
    const lensFactorBase = 1 - Phaser.Math.Clamp(Math.abs(this.currentCurve), 0, 1);
    const laneIndexForVis: number = Number(obstacle.getData('laneIndex')) || 0;
    const lensOffset = (laneIndexForVis >= 0 ? 1 : -1) * lensBase * (tVis * tVis) * lensFactorBase;
    const xProjectedVis = centerX + bez(tVis) + laneIndexForVis * (this.laneSpacingBottom * tVis) + lensOffset;
    visual.setPosition(xProjectedVis, snappedY);
    const baseW = obstacle.getData('baseW') ?? obstacle.width;
    const baseH = obstacle.getData('baseH') ?? obstacle.height;
    const widthScale = 0.2 + 0.8 * tVis;
    const heightScale = 0.4 + 0.6 * tVis;
    visual.displayWidth = baseW * widthScale;
    visual.displayHeight = baseH * heightScale;
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

    // Destroy radar
    this.radarContainer?.destroy();
    this.radarBG = undefined;
    this.radarGrid = undefined;
    this.radarGraphics = undefined;
    this.radarPlayer = undefined;

    this.scene.events.off('countdownChanged', this.onCountdownChanged, this);
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
    const keysInIgnition = !!payload?.keysInIgnition;
    const crank = Number(payload?.speedCrankPercentage ?? 0);
    // Only shift when car is effectively on
    if (keysInIgnition && crank >= 40) {
      // Increase shift amount per step for a more dramatic change
      const stepShift = 10; // pixels per countdown step
      this.horizontalLinePhase = (this.horizontalLinePhase + stepShift) % 1000000;
      // Also step obstacle visuals: compute snapped Y and projected X for the visual-only rect
      const gameHeight = this.scene.cameras.main.height;
      const gameWidth = this.scene.cameras.main.width;
      const horizonY = gameHeight * 0.3;
      const roadY = gameHeight * 0.3 + 10;
      const phaseOffset = (this.horizontalLinePhase % this.horizontalSpacing);
      const bendStrength = this.config.roadBendStrength ?? 140;
      const centerX = gameWidth / 2;
      const end = this.currentCurve * bendStrength;
      const control = end * 0.6;
      const bez = (tt: number) => ((1 - tt) * (1 - tt) * 0) + (2 * (1 - tt) * tt * control) + (tt * tt * end);
      this.obstacles.forEach(obstacle => {
        const visual: Phaser.GameObjects.Rectangle | undefined = obstacle.getData('visual');
        if (!visual) return;
        const snappedY = roadY + Math.max(0, Math.floor(((obstacle.y - roadY) + phaseOffset) / this.horizontalSpacing)) * this.horizontalSpacing;
        const tVis = Phaser.Math.Clamp((snappedY - horizonY) / (gameHeight - horizonY), 0, 1);
        let laneIndex: number | undefined = obstacle.getData('laneIndex');
        const worldOffset = -this.worldLateralOffset;
        if (obstacle.getData('isExit')) {
          laneIndex = this.laneIndices[this.laneIndices.length - 1];
        }
        const laneTermVis = (laneIndex ?? 0) * (this.laneSpacingBottom * tVis);
        const xProjectedVis = centerX + bez(tVis) + laneTermVis + worldOffset;
        visual.setPosition(xProjectedVis, snappedY);
        // Perspective taper for visual only
        const baseW = obstacle.getData('baseW') ?? obstacle.width;
        const baseH = obstacle.getData('baseH') ?? obstacle.height;
        const widthScale = 0.2 + 0.8 * tVis;
        const heightScale = 0.4 + 0.6 * tVis;
        visual.displayWidth = baseW * widthScale;
        visual.displayHeight = baseH * heightScale;
      });
    }
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
