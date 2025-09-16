/**
 * GAME UI - USER INTERFACE ELEMENTS AND HUD
 * 
 * This module handles all user interface elements including:
 * - HUD displays (money, health, progress, stops)
 * - Countdown timer
 * - Navigation buttons (frontseat/backseat, map/inventory)
 * - Speed crank interface
 * - Manager values display
 * - Game layer indicators
 * 
 * Key Features:
 * - Responsive UI positioning
 * - Real-time value updates
 * - Consistent styling and theming
 * - Overlay positioning (scroll factor 0)
 * - Depth management for proper layering
 */

import Phaser from 'phaser';

export interface GameUIConfig {
  // Text Parameters
  gameLayerText: string;
  gameLayerPositionX: number;
  gameLayerPositionY: number;
  gameLayerFontSize: string;
  gameLayerColor: string;
  gameLayerBackgroundColor: string;
  gameLayerDepth: number;
  
  // Countdown Parameters
  countdownPositionX: number;
  countdownPositionY: number;
  countdownFontSize: string;
  countdownColor: string;
  
  // Money/Health Parameters
  moneyPositionX: number;
  moneyPositionY: number;
  healthPositionX: number;
  healthPositionY: number;
  moneyHealthFontSize: string;
  moneyColor: string;
  healthColor: string;
  
  // Progress Parameters
  progressPositionX: number;
  progressPositionY: number;
  progressFontSize: string;
  progressColor: string;
  
  // Manager Values Parameters
  managerValuesFontSize: string;
  managerValuesBackgroundColor: string;
  managerValuesPadding: { x: number; y: number };
  managerValuesOpacity: number;
  managerValuesSkillColor: string;
  managerValuesDifficultyColor: string;
  managerValuesMomentumColor: string;
  managerValuesPlotAColor: string;
  managerValuesPlotBColor: string;
  managerValuesPlotCColor: string;
  managerValuesStopsColor: string;
  
  // Navigation Button Parameters
  frontseatText: string;
  frontseatPositionX: number;
  frontseatPositionY: number;
  frontseatFontSize: string;
  frontseatColor: string;
  
  backseatText: string;
  backseatPositionX: number;
  backseatPositionY: number;
  backseatFontSize: string;
  backseatColor: string;
  
  // Speed Crank Parameters
  speedCrankOffsetX: number;
  speedCrankOffsetY: number;
  speedCrankWidth: number;
  speedCrankHeight: number;
  speedCrankTrackColor: number;
  speedCrankTrackAlpha: number;
  speedCrankTrackStrokeColor: number;
  speedCrankTrackStrokeWidth: number;
  speedCrankTrackCornerRadius: number;
  speedCrankHandleColor: number;
  speedCrankHandleAlpha: number;
  speedCrankHandleStrokeColor: number;
  speedCrankHandleStrokeWidth: number;
  speedCrankHandleCornerRadius: number;
  speedCrankHandleMargin: number;
  speedCrankHandleHeight: number;
  speedCrankIndicatorColor: number;
  speedCrankIndicatorStrokeColor: number;
  speedCrankIndicatorRadius: number;
  speedCrankTextOffsetX: number;
  speedCrankTextFontSize: string;
  speedCrankTextColor: string;
  speedCrankSnapPositions: number[];
  speedCrankDepthTrack: number;
  speedCrankDepthHandle: number;
  speedCrankDepthIndicator: number;
  speedCrankDepthText: number;
  speedCrankDepthArea: number;
}

export interface GameUIState {
  gameTime: number;
  money: number;
  health: number;
  stops: number;
  progress: number;
  playerSkill: number;
  difficulty: number;
  momentum: number;
  plotA: number;
  plotB: number;
  plotC: number;
  plotAEnum: string;
  plotBEnum: string;
  plotCEnum: string;
  speedCrankPercentage: number;
}

export class GameUI {
  private scene: Phaser.Scene;
  private config: GameUIConfig;
  
  // UI Elements
  private gameLayerText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private progressBarBG!: Phaser.GameObjects.Rectangle;
  private progressBarFill!: Phaser.GameObjects.Rectangle;
  private managerValuesText!: Phaser.GameObjects.Text;
  private frontseatButton!: Phaser.GameObjects.Graphics;
  private backseatButton!: Phaser.GameObjects.Graphics;
  
  // Speed Crank Elements
  private speedCrankTrack!: Phaser.GameObjects.Graphics;
  private speedCrankHandle!: Phaser.GameObjects.Graphics;
  private speedCrankValueIndicator!: Phaser.GameObjects.Graphics;
  private speedCrankArea!: Phaser.GameObjects.Rectangle;
  private speedCrankPercentageText!: Phaser.GameObjects.Text;
  
    // Drag Dial
    private frontseatDragDial!: any; // RexUI drag dial
    private steeringDialIndicator!: Phaser.GameObjects.Graphics;
    private steeringAngleText!: Phaser.GameObjects.Text;
    private steeringWheelSVG!: Phaser.GameObjects.Sprite; // SVG overlay
    
    // Speed Crank SVG
    private speedCrankSVG!: Phaser.GameObjects.Sprite; // SVG overlay
    
    // Key SVG
    // private keySVG!: Phaser.GameObjects.Sprite; // SVG overlay - moved to GameScene
    
    // Keyhole SVG
    // private keyholeSVG!: Phaser.GameObjects.Sprite; // SVG overlay - moved to GameScene
    
    // Steering wheel state
    private currentSteeringPosition: number = 0; // Current position (-100 to 100)
    private isDragging: boolean = false;
  
  // State
  private currentSpeedCrankPercentage: number = 0;
  private lookUpActive: boolean = false;
  private lookUpOriginalY: number = 0;
  private lookUpLabel!: Phaser.GameObjects.Text;
  private lookDownActive: boolean = false;
  private lookDownOriginalY: number = 0;
  private lookDownLabel!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, config: GameUIConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Initialize all UI elements
   */
  public initialize() {
    this.createGameLayerText();
    this.createCountdownTimer();
    this.createProgressText(); // Updated method name
    this.createMoneyAndHealthText();
    this.createManagerValuesText();
    this.createNavigationButtons();
    this.createSpeedCrank();
    this.createFrontseatDragDial();
  }

  /**
   * Update UI with current state
   */
  public updateUI(state: GameUIState) {
    this.updateCountdown(state.gameTime);
    this.updateMoney(state.money);
    this.updateHealth(state.health);
    this.updateProgress(state.progress);
    this.updateManagerValues(state); // This now includes stops
    this.updateSpeedCrank(state.speedCrankPercentage);
  }

  /**
   * Create game layer text
   */
  private createGameLayerText() {
    this.gameLayerText = this.scene.add.text(
      this.config.gameLayerPositionX,
      this.config.gameLayerPositionY,
      this.config.gameLayerText,
      {
        fontSize: this.config.gameLayerFontSize,
        color: this.config.gameLayerColor,
        fontStyle: 'bold',
        backgroundColor: this.config.gameLayerBackgroundColor,
        padding: { x: 4, y: 2 }
      }
    );
    this.gameLayerText.setScrollFactor(0);
    this.gameLayerText.setDepth(this.config.gameLayerDepth);
  }

  /**
   * Create countdown timer - positioned below rearview rectangle
   */
  private createCountdownTimer() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    const countdownX = gameWidth * this.config.countdownPositionX;
    const countdownY = gameHeight * this.config.countdownPositionY;
     
    this.countdownText = this.scene.add.text(countdownX, countdownY, '0', {
      fontSize: this.config.countdownFontSize,
      color: this.config.countdownColor,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
     
    this.countdownText.setScrollFactor(0);
    this.countdownText.setDepth(10000);
  }

  /**
   * Create progress text - bottom left corner (with money)
   */
  private createProgressText() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    const progressX = gameWidth * this.config.progressPositionX;
    const progressY = gameHeight * this.config.progressPositionY;
    
    this.progressText = this.scene.add.text(progressX, progressY, '0%', {
      fontSize: this.config.progressFontSize,
      color: this.config.progressColor,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0, 1); // Left-bottom alignment
    
    this.progressText.setScrollFactor(0);
    this.progressText.setDepth(10000);

    // Simple progress meter just above countdown
    const barWidth = 160;
    const barHeight = 6;
    const gameWidth2 = this.scene.cameras.main.width;
    const gameHeight2 = this.scene.cameras.main.height;
    const countdownX = gameWidth2 * this.config.countdownPositionX;
    const countdownY = gameHeight2 * this.config.countdownPositionY;
    const barX = countdownX - barWidth / 2;
    const barY = countdownY - 16;
    this.progressBarBG = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0x000000, 0.4).setOrigin(0, 0.5);
    this.progressBarFill = this.scene.add.rectangle(barX, barY, 0, barHeight, 0x00ff00, 0.9).setOrigin(0, 0.5);
    this.progressBarBG.setScrollFactor(0); this.progressBarBG.setDepth(10000);
    this.progressBarFill.setScrollFactor(0); this.progressBarFill.setDepth(10001);
  }

  /**
   * Create money and health text
   */
  private createMoneyAndHealthText() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Money text
    const moneyX = gameWidth * this.config.moneyPositionX;
    const moneyY = gameHeight * this.config.moneyPositionY;
    
    this.moneyText = this.scene.add.text(moneyX, moneyY, '$0', {
      fontSize: this.config.moneyHealthFontSize,
      color: this.config.moneyColor,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    });
    
    this.moneyText.setScrollFactor(0);
    this.moneyText.setDepth(10000);
    
    // Health text
    const healthX = gameWidth * this.config.healthPositionX;
    const healthY = gameHeight * this.config.healthPositionY;
    
    this.healthText = this.scene.add.text(healthX, healthY, 'Health: 10/10', {
      fontSize: this.config.moneyHealthFontSize,
      color: this.config.healthColor,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    });
    
    this.healthText.setScrollFactor(0);
    this.healthText.setDepth(10000);
  }

  /**
   * Create manager values text
   */
  private createManagerValuesText() {
    const gameWidth = this.scene.cameras.main.width;
    // const gameHeight = this.scene.cameras.main.height; // Unused
    
    this.managerValuesText = this.scene.add.text(gameWidth - 10, 10, '', {
      fontSize: this.config.managerValuesFontSize,
      color: '#ffffff',
      backgroundColor: this.config.managerValuesBackgroundColor,
      padding: this.config.managerValuesPadding
    }).setOrigin(1, 0);
    
    this.managerValuesText.setScrollFactor(0);
    this.managerValuesText.setDepth(10000);
    this.managerValuesText.setAlpha(this.config.managerValuesOpacity);
  }

  /**
   * Create navigation buttons
   */
  private createNavigationButtons() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Temporarily disabled LOOK UP / LOOK DOWN buttons per request
    if (true) {
      return;
    }

    // Look Up / Look Down buttons (large, centered, 85% width)
    const btnWidth = Math.floor(gameWidth * 0.85);
    const btnHeight = 46;
    const topY = Math.floor(btnHeight / 2);
    const bottomY = gameHeight - Math.floor(btnHeight / 2);
    const leftX = Math.floor((gameWidth - btnWidth) / 2);

    // Look Up
    this.frontseatButton = this.scene.add.graphics();
    this.frontseatButton.fillStyle(0x202020, 0.75);
    this.frontseatButton.fillRoundedRect(leftX, topY - Math.floor(btnHeight / 2), btnWidth, btnHeight, 8);
    this.frontseatButton.lineStyle(2, 0xffffff, 1);
    this.frontseatButton.strokeRoundedRect(leftX, topY - Math.floor(btnHeight / 2), btnWidth, btnHeight, 8);
    this.frontseatButton.setScrollFactor(0);
    this.frontseatButton.setDepth(10000);
    this.frontseatButton.setInteractive(new Phaser.Geom.Rectangle(leftX, topY - Math.floor(btnHeight / 2), btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains);
    this.frontseatButton.on('pointerdown', () => {
      const cam = this.scene.cameras.main;
      const delta = cam.height * 0.3;
      if (!this.lookUpActive) {
        // Store original Y and move up
        this.lookUpOriginalY = cam.scrollY;
        const targetY = this.lookUpOriginalY - delta;
        this.scene.tweens.add({ targets: cam, scrollY: targetY, duration: 200, ease: 'Sine.easeOut' });
        if (this.lookUpLabel) this.lookUpLabel.setText('LOOK DOWN');
        this.lookUpActive = true;
      } else {
        // Return to original Y
        this.scene.tweens.add({
          targets: cam,
          scrollY: this.lookUpOriginalY,
          duration: 200,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.lookUpActive = false;
            if (this.lookUpLabel) this.lookUpLabel.setText('LOOK UP');
          }
        });
      }
    });
    this.lookUpLabel = this.scene.add.text(gameWidth / 2, topY, 'LOOK UP', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10001);

    // Look Down
    this.backseatButton = this.scene.add.graphics();
    this.backseatButton.fillStyle(0x202020, 0.75);
    this.backseatButton.fillRoundedRect(leftX, bottomY - Math.floor(btnHeight / 2), btnWidth, btnHeight, 8);
    this.backseatButton.lineStyle(2, 0xffffff, 1);
    this.backseatButton.strokeRoundedRect(leftX, bottomY - Math.floor(btnHeight / 2), btnWidth, btnHeight, 8);
    this.backseatButton.setScrollFactor(0);
    this.backseatButton.setDepth(10000);
    this.backseatButton.setInteractive(new Phaser.Geom.Rectangle(leftX, bottomY - Math.floor(btnHeight / 2), btnWidth, btnHeight), Phaser.Geom.Rectangle.Contains);
    this.backseatButton.on('pointerdown', () => {
      const cam = this.scene.cameras.main;
      const delta = cam.height * 0.3;
      if (!this.lookDownActive) {
        // Store original Y and move down
        this.lookDownOriginalY = cam.scrollY;
        const targetY = this.lookDownOriginalY + delta;
        this.scene.tweens.add({ targets: cam, scrollY: targetY, duration: 200, ease: 'Sine.easeOut' });
        if (this.lookDownLabel) this.lookDownLabel.setText('LOOK UP');
        this.lookDownActive = true;
      } else {
        // Return to original Y
        this.scene.tweens.add({
          targets: cam,
          scrollY: this.lookDownOriginalY,
          duration: 200,
          ease: 'Sine.easeOut',
          onComplete: () => {
            this.lookDownActive = false;
            if (this.lookDownLabel) this.lookDownLabel.setText('LOOK DOWN');
          }
        });
      }
    });
    this.lookDownLabel = this.scene.add.text(gameWidth / 2, bottomY, 'LOOK DOWN', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10001);

    // Hide both buttons initially if car is not started
    const carStartedNow = !!(this.scene as any).carStarted;
    this.frontseatButton.setVisible(carStartedNow);
    this.backseatButton.setVisible(carStartedNow);
    if (this.lookUpLabel) this.lookUpLabel.setVisible(carStartedNow);
    if (this.lookDownLabel) this.lookDownLabel.setVisible(carStartedNow);
  }

  /**
   * Create speed crank interface
   */
  private createSpeedCrank() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    const crankX = gameWidth * 0.7; // Right side
    const crankY = gameHeight * 0.6; // Middle height
    
    // Create track
    this.speedCrankTrack = this.scene.add.graphics();
    this.speedCrankTrack.fillStyle(this.config.speedCrankTrackColor, this.config.speedCrankTrackAlpha);
    this.speedCrankTrack.fillRoundedRect(
      crankX - this.config.speedCrankWidth / 2,
      crankY - this.config.speedCrankHeight / 2,
      this.config.speedCrankWidth,
      this.config.speedCrankHeight,
      this.config.speedCrankTrackCornerRadius
    );
    this.speedCrankTrack.lineStyle(
      this.config.speedCrankTrackStrokeWidth,
      this.config.speedCrankTrackStrokeColor,
      1
    );
    this.speedCrankTrack.strokeRoundedRect(
      crankX - this.config.speedCrankWidth / 2,
      crankY - this.config.speedCrankHeight / 2,
      this.config.speedCrankWidth,
      this.config.speedCrankHeight,
      this.config.speedCrankTrackCornerRadius
    );
    this.speedCrankTrack.setDepth(this.config.speedCrankDepthTrack);
    
    // Create handle
    this.speedCrankHandle = this.scene.add.graphics();
    this.updateSpeedCrankHandle(0);
    this.speedCrankHandle.setDepth(this.config.speedCrankDepthHandle);
    
    // Create percentage text
    this.speedCrankPercentageText = this.scene.add.text(
      crankX + this.config.speedCrankTextOffsetX,
      crankY,
      '0%',
      {
        fontSize: this.config.speedCrankTextFontSize,
        color: this.config.speedCrankTextColor,
        fontStyle: 'bold'
      }
    ).setOrigin(0, 0.5);
    this.speedCrankPercentageText.setDepth(this.config.speedCrankDepthText);
    
    // Create invisible interaction area for the entire crank
    this.speedCrankArea = this.scene.add.rectangle(
      crankX,
      crankY,
      this.config.speedCrankWidth + 20, // Make it slightly larger for easier interaction
      this.config.speedCrankHeight + 20,
      0x000000,
      0 // Invisible
    );
    this.speedCrankArea.setDepth(this.config.speedCrankDepthArea);
    this.speedCrankArea.setInteractive();
    
    // Create speed crank SVG overlay
    this.speedCrankSVG = this.scene.add.sprite(crankX, crankY, 'bat');
    this.speedCrankSVG.setScale(0.1); // Much smaller scale to fit the crank area
    this.speedCrankSVG.setOrigin(0.5, 0.5);
    this.speedCrankSVG.setAlpha(0.8); // Semi-transparent overlay
    this.speedCrankSVG.setDepth(this.config.speedCrankDepthHandle + 1); // Just above the handle
    
    // Add pointer interaction to the speed crank
    this.setupSpeedCrankInteraction(crankX, crankY);
  }

  /**
   * Setup speed crank pointer interaction
   */
  private setupSpeedCrankInteraction(_crankX: number, crankY: number) {
    let isDragging = false;
    
    this.speedCrankArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      
      // Calculate percentage based on click position
      const crankTop = crankY - this.config.speedCrankHeight / 2;
      const crankBottom = crankY + this.config.speedCrankHeight / 2;
      const clickY = Phaser.Math.Clamp(pointer.y, crankTop, crankBottom);
      const percentage = ((clickY - crankTop) / this.config.speedCrankHeight) * 100;
      
      // Snap to nearest snap position
      const snappedPercentage = this.snapToNearestPosition(percentage);
      this.updateSpeedCrank(snappedPercentage);
      
      // Emit event to game scene
      this.scene.events.emit('speedCrankInput', snappedPercentage);
    });
    
    const moveHandler = (p: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      const crankTop = crankY - this.config.speedCrankHeight / 2;
      const crankBottom = crankY + this.config.speedCrankHeight / 2;
      const newY = Phaser.Math.Clamp(p.y, crankTop, crankBottom);
      const percentage = ((newY - crankTop) / this.config.speedCrankHeight) * 100;
      const snappedPercentage = this.snapToNearestPosition(percentage);
      this.updateSpeedCrank(snappedPercentage);
      this.scene.events.emit('speedCrankInput', snappedPercentage);
    };
    const upHandler = () => { isDragging = false; this.scene.input.off('pointermove', moveHandler as any, undefined, false as any); };
    this.scene.input.on('pointermove', moveHandler);
    this.scene.input.once('pointerup', upHandler);
  }

  /**
   * Snap percentage to nearest snap position
   */
  private snapToNearestPosition(percentage: number): number {
    const snapPositions = this.config.speedCrankSnapPositions || [0, 0.4, 0.7, 1.0];
    // Convert snap positions from decimal (0-1) to percentage (0-100)
    const snapPercentages = snapPositions.map(pos => pos * 100);
    
    let closestSnap = snapPercentages[0];
    let minDistance = Math.abs(percentage - closestSnap);
    
    for (const snap of snapPercentages) {
      const distance = Math.abs(percentage - snap);
      if (distance < minDistance) {
        minDistance = distance;
        closestSnap = snap;
      }
    }
    
    return closestSnap;
  }

  /**
   * Create frontseat drag dial
   */
  private createFrontseatDragDial() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    const dialX = gameWidth * 0.3; // Left side
    const dialY = gameHeight * 0.7; // Bottom area
    
    // Create a simple custom knob using graphics
    const knobRadius = 80;
    const knob = this.scene.add.graphics();
    
    // Draw the knob
    knob.fillStyle(0x444444);
    knob.fillCircle(0, 0, knobRadius);
    knob.lineStyle(2, 0xffffff, 1);
    knob.strokeCircle(0, 0, knobRadius);
    
    // Remove extraneous square; indicator line will represent value
    
    knob.setPosition(dialX, dialY);
    knob.setInteractive(new Phaser.Geom.Circle(0, 0, knobRadius), Phaser.Geom.Circle.Contains);
    
    // Create SVG overlay for visual appeal
    this.steeringWheelSVG = this.scene.add.sprite(dialX, dialY, 'steering-wheel');
    this.steeringWheelSVG.setScale(0.2); // 2x bigger: was 0.1, now 0.2
    this.steeringWheelSVG.setOrigin(0.5, 0.5);
    this.steeringWheelSVG.setAlpha(0.8); // Semi-transparent overlay
    this.steeringWheelSVG.setDepth(998); // Just above the circle
    
    // SVG will be positioned independently but follow the graphics circle
    
    // Store reference to the knob
    this.frontseatDragDial = knob;
    
    // Visual feedback overlay: an indicator line and angle text
    this.steeringDialIndicator = this.scene.add.graphics();
    this.steeringDialIndicator.setDepth(999);
    this.steeringAngleText = this.scene.add.text(dialX, dialY + knobRadius + 18, '0%', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(999);
    
    // Add drag functionality (fixed version)
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    // let knobCenterX = dialX; // Unused
    // let knobCenterY = dialY; // Unused
    
     knob.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
       this.isDragging = true;
       isDragging = true;
       lastPointerX = pointer.x;
       lastPointerY = pointer.y;
       
       // Redraw knob with active color
       knob.clear();
       knob.fillStyle(0x666666);
       knob.fillCircle(0, 0, knobRadius);
       knob.lineStyle(2, 0xffffff, 1);
       knob.strokeCircle(0, 0, knobRadius);
       // No square overlay; indicator line shows current value

       // (removed steering active gating)
     });
    
     // Track pointer globally while dragging so it keeps responding even off the knob
     const dialMove = (pointer: Phaser.Input.Pointer) => {
       if (isDragging) {
         // Calculate delta movement from last position
         const deltaX = pointer.x - lastPointerX;
         const deltaY = pointer.y - lastPointerY;
         
         // Calculate steering rotation based on both horizontal and vertical movement
         const horizontalSteering = deltaX * 2.0; // Horizontal sensitivity
         const verticalSteering = deltaY * 1.5; // Vertical sensitivity
         
         // Determine which side of the dial we're on for vertical movement
         const relativeX = pointer.x - dialX;
         
         // Vertical movement directions:
         // Up on right side (positive X) = clockwise (positive steering)
         // Down on right side (positive X) = counterclockwise (negative steering)
         // Up on left side (negative X) = counterclockwise (negative steering)
         // Down on left side (negative X) = clockwise (positive steering)
         const verticalMultiplier = relativeX > 0 ? 1 : -1;
         
         // Combine horizontal and vertical steering
         const totalSteeringDelta = horizontalSteering + (verticalSteering * verticalMultiplier);
         
         // Accumulate steering position based on combined motion
         this.currentSteeringPosition += totalSteeringDelta;
         
         // Clamp the accumulated position to valid range
         this.currentSteeringPosition = Phaser.Math.Clamp(this.currentSteeringPosition, -100, 100);
         
         // Apply proportional sensitivity based on distance from center
         const distanceFromCenter = Math.abs(this.currentSteeringPosition);
         // More aggressive curve: starts at 0.5, reaches 1.0 at 50% distance, then increases further
         const sensitivityMultiplier = 0.5 + (distanceFromCenter / 100) * 0.5 + Math.pow(distanceFromCenter / 100, 2) * 0.5;
         const adjustedSteeringValue = this.currentSteeringPosition * sensitivityMultiplier;
         
         this.scene.events.emit('steeringInput', adjustedSteeringValue);
         this.updateSteeringIndicator(this.currentSteeringPosition); // Show raw position
         
         lastPointerX = pointer.x;
         lastPointerY = pointer.y;
       }
     };
     const dialUp = () => { endDrag(); this.scene.input.off('pointermove', dialMove as any, undefined, false as any); };
     this.scene.input.on('pointermove', dialMove);
    
    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      this.isDragging = false;
      
      // Redraw knob with original color
      knob.clear();
      knob.fillStyle(0x444444);
      knob.fillCircle(0, 0, knobRadius);
      knob.lineStyle(2, 0xffffff, 1);
      knob.strokeCircle(0, 0, knobRadius);
      
      // Gradual return to center will be handled in update method
    };

    knob.on('pointerup', endDrag);
    knob.on('pointerupoutside', endDrag as any);
    this.scene.input.once('pointerup', dialUp);
    this.scene.input.once('gameout', endDrag as any);
  }

  /**
   * Update steering wheel gradual return to center
   */
  public update(delta: number) {
    // Only return to center if not currently being dragged
    if (!this.isDragging && this.currentSteeringPosition !== 0) {
      const returnSpeed = 0.02; // Adjust this value to control return speed (0.01 = slow, 0.05 = fast)
      
      // Gradually move toward center
      if (this.currentSteeringPosition > 0) {
        this.currentSteeringPosition = Math.max(0, this.currentSteeringPosition - returnSpeed * delta);
      } else {
        this.currentSteeringPosition = Math.min(0, this.currentSteeringPosition + returnSpeed * delta);
      }
      
      // During return-to-center, don't emit any steering input
      // This allows the car to maintain its current position while wheel returns visually
      // The car mechanics system will use its existing turn value and let it decay naturally
      
      // Update visual indicator
      this.updateSteeringIndicator(this.currentSteeringPosition);
    }
  }

  /**
   * Update the steering indicator visual
   */
  private updateSteeringIndicator(steeringValue: number) {
    if (this.steeringDialIndicator) {
      const angleDeg = Phaser.Math.Clamp((steeringValue / 100) * 60, -60, 60);
      const angleRad = Phaser.Math.DegToRad(angleDeg - 90); // Match original calculation
      const gameWidth = this.scene.cameras.main.width;
      const gameHeight = this.scene.cameras.main.height;
      const dialX = gameWidth * 0.3;
      const dialY = gameHeight * 0.7;
      const lineLen = 50;
      const endX = dialX + Math.cos(angleRad) * lineLen;
      const endY = dialY + Math.sin(angleRad) * lineLen;
      
      this.steeringDialIndicator.clear();
      this.steeringDialIndicator.lineStyle(3, 0xffcc00, 1);
      this.steeringDialIndicator.beginPath();
      this.steeringDialIndicator.moveTo(dialX, dialY);
      this.steeringDialIndicator.lineTo(endX, endY);
      this.steeringDialIndicator.strokePath();
    }
    
    // Update angle text - show percentage from 0-100%
    if (this.steeringAngleText) {
      const pct = Math.round((steeringValue + 100) / 2);
      this.steeringAngleText.setText(`${pct}%`);
    }
    
    // Update SVG rotation to match steering position
    if (this.steeringWheelSVG) {
      const angleDeg = Phaser.Math.Clamp((steeringValue / 100) * 60, -60, 60);
      this.steeringWheelSVG.setRotation(Phaser.Math.DegToRad(angleDeg));
    }
  }

  /**
   * Update countdown display
   */
  private updateCountdown(gameTime: number) {
    if (this.countdownText) {
      this.countdownText.setText(gameTime.toString());
    }
  }

  /**
   * Update money display
   */
  private updateMoney(money: number) {
    if (this.moneyText) {
      this.moneyText.setText(`$${money}`);
    }
  }

  /**
   * Update health display
   */
  private updateHealth(health: number) {
    if (this.healthText) {
      this.healthText.setText(`Health: ${Math.round(health * 10)}%`);
    }
  }


  /**
   * Update progress display
   */
  private updateProgress(progress: number) {
    if (this.progressText) {
      this.progressText.setText(`${Math.round(progress)}%`); // Removed "Progress:" label
    }
    if (this.progressBarFill && this.progressBarBG) {
      const pct = Phaser.Math.Clamp(progress, 0, 100) / 100;
      this.progressBarFill.width = this.progressBarBG.width * pct;
    }
  }

  /**
   * Update manager values display (now includes stops)
   */
  private updateManagerValues(state: GameUIState) {
    if (this.managerValuesText) {
      const values = [
        `Skill: ${state.playerSkill}%`,
        `Difficulty: ${state.difficulty}%`,
        `Momentum: ${state.momentum}%`,
        `Plot A (${state.plotAEnum}): ${state.plotA}%`,
        `Plot B (${state.plotBEnum}): ${state.plotB}%`,
        `Plot C (${state.plotCEnum}): ${state.plotC}%`,
        `Stops: ${state.stops}` // Added stops to manager values
      ].join('\n');
      
      this.managerValuesText.setText(values);
    }
  }

  /**
   * Update speed crank display
   */
  public updateSpeedCrank(percentage: number) {
    this.currentSpeedCrankPercentage = percentage;
    
    if (this.speedCrankPercentageText) {
      this.speedCrankPercentageText.setText(`${Math.round(percentage)}%`);
    }
    
    this.updateSpeedCrankHandle(percentage);
  }

  /**
   * Update speed crank handle position
   */
  private updateSpeedCrankHandle(percentage: number) {
    if (!this.speedCrankHandle) return;
    
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    const crankX = gameWidth * 0.7;
    const crankY = gameHeight * 0.6;
    
    // Calculate handle position based on percentage
    const handleY = crankY - this.config.speedCrankHeight / 2 + 
                   (this.config.speedCrankHeight * percentage / 100);
    
    this.speedCrankHandle.clear();
    this.speedCrankHandle.fillStyle(this.config.speedCrankHandleColor, this.config.speedCrankHandleAlpha);
    this.speedCrankHandle.fillRoundedRect(
      crankX - this.config.speedCrankHandleHeight / 2,
      handleY - this.config.speedCrankHandleHeight / 2,
      this.config.speedCrankHandleHeight,
      this.config.speedCrankHandleHeight,
      this.config.speedCrankHandleCornerRadius
    );
    this.speedCrankHandle.lineStyle(
      this.config.speedCrankHandleStrokeWidth,
      this.config.speedCrankHandleStrokeColor,
      1
    );
    this.speedCrankHandle.strokeRoundedRect(
      crankX - this.config.speedCrankHandleHeight / 2,
      handleY - this.config.speedCrankHandleHeight / 2,
      this.config.speedCrankHandleHeight,
      this.config.speedCrankHandleHeight,
      this.config.speedCrankHandleCornerRadius
    );
  }

  /**
   * Get current speed crank percentage
   */
  public getSpeedCrankPercentage(): number {
    return this.currentSpeedCrankPercentage;
  }

  /**
   * Get speed crank position for tutorial system
   */
  public getSpeedCrankPosition(): { x: number; y: number; width: number; height: number } {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    const crankX = gameWidth * 0.7; // Right side
    const crankY = gameHeight * 0.6; // Middle height
    
    return {
      x: crankX,
      y: crankY,
      width: this.config.speedCrankWidth,
      height: this.config.speedCrankHeight
    };
  }

  /** Return UI control objects that should render on a non-rotating HUD camera */
  public getControlObjects(): Phaser.GameObjects.GameObject[] {
    const objs: Phaser.GameObjects.GameObject[] = [];
    if (this.speedCrankTrack) objs.push(this.speedCrankTrack);
    if (this.speedCrankHandle) objs.push(this.speedCrankHandle);
    if (this.speedCrankSVG) objs.push(this.speedCrankSVG);
    if (this.speedCrankPercentageText) objs.push(this.speedCrankPercentageText);
    if (this.speedCrankArea) objs.push(this.speedCrankArea);
    if (this.frontseatDragDial) objs.push(this.frontseatDragDial);
    if (this.steeringWheelSVG) objs.push(this.steeringWheelSVG);
    if (this.steeringDialIndicator) objs.push(this.steeringDialIndicator);
    if (this.steeringAngleText) objs.push(this.steeringAngleText);
    // Optional labels/buttons if enabled later
    if (this.lookUpLabel) objs.push(this.lookUpLabel);
    if (this.lookDownLabel) objs.push(this.lookDownLabel);
    if (this.frontseatButton) objs.push(this.frontseatButton);
    if (this.backseatButton) objs.push(this.backseatButton);
    
    // Add SVGs from GameScene
    // const gameScene = this.scene.scene.get('GameScene') as any; // Unused
    // Note: keyholeSVG is now positioned independently, not in dash container
    // Note: keySVG is now a child of the physics object, so it moves with the world, not the dash
    
    return objs;
  }

  /**
   * Clean up resources
   */
  public destroy() {
    // Destroy all UI elements
    const elements = [
      this.gameLayerText,
      this.countdownText,
      this.moneyText,
      this.healthText,
      this.progressText,
      this.managerValuesText,
      this.frontseatButton,
      this.backseatButton,
      this.speedCrankTrack,
      this.speedCrankHandle,
      this.speedCrankValueIndicator,
      this.speedCrankArea,
      this.speedCrankPercentageText,
      this.frontseatDragDial
    ];
    
    elements.forEach(element => {
      if (element) {
        element.destroy();
      }
    });
  }
}
