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
  countdownPositionOffsetX: number;
  countdownPositionOffsetY: number;
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
  
  // Stops/Progress Parameters
  stopsPositionOffsetX: number;
  stopsPositionOffsetY: number;
  progressPositionOffsetX: number;
  progressPositionOffsetY: number;
  stopsFontSize: string;
  progressFontSize: string;
  stopsColor: string;
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
  private stopsText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private managerValuesText!: Phaser.GameObjects.Text;
  private frontseatButton!: Phaser.GameObjects.Graphics;
  private backseatButton!: Phaser.GameObjects.Graphics;
  private mapToggleButton!: Phaser.GameObjects.Graphics;
  private inventoryToggleButton!: Phaser.GameObjects.Graphics;
  private mapToggleText!: Phaser.GameObjects.Text;
  private inventoryToggleText!: Phaser.GameObjects.Text;
  
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
    this.createStopsAndProgressText();
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
    this.updateStops(state.stops);
    this.updateProgress(state.progress);
    this.updateManagerValues(state);
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
   * Create countdown timer
   */
  private createCountdownTimer() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    const countdownX = gameWidth / 2 + (gameWidth * this.config.countdownPositionOffsetX);
    const countdownY = (gameHeight * this.config.countdownPositionOffsetY);
     
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
   * Create stops and progress text
   */
  private createStopsAndProgressText() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Stops text
    const stopsX = gameWidth / 2 + (gameWidth * this.config.stopsPositionOffsetX);
    const stopsY = (gameHeight * this.config.stopsPositionOffsetY);
    
    this.stopsText = this.scene.add.text(stopsX, stopsY, 'Stops: 0', {
      fontSize: this.config.stopsFontSize,
      color: this.config.stopsColor,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    this.stopsText.setScrollFactor(0);
    this.stopsText.setDepth(10000);
    
    // Progress text
    const progressX = gameWidth / 2 + (gameWidth * this.config.progressPositionOffsetX);
    const progressY = (gameHeight * this.config.progressPositionOffsetY);
    
    this.progressText = this.scene.add.text(progressX, progressY, 'Progress: 0%', {
      fontSize: this.config.progressFontSize,
      color: this.config.progressColor,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    this.progressText.setScrollFactor(0);
    this.progressText.setDepth(10000);
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
    const gameHeight = this.scene.cameras.main.height;
    
    this.managerValuesText = this.scene.add.text(gameWidth - 10, 10, '', {
      fontSize: this.config.managerValuesFontSize,
      color: '#ffffff',
      backgroundColor: this.config.managerValuesBackgroundColor,
      padding: this.config.managerValuesPadding,
      alpha: this.config.managerValuesOpacity
    }).setOrigin(1, 0);
    
    this.managerValuesText.setScrollFactor(0);
    this.managerValuesText.setDepth(10000);
  }

  /**
   * Create navigation buttons
   */
  private createNavigationButtons() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Look Up / Look Down buttons (large, centered, 85% width)
    const btnWidth = Math.floor(gameWidth * 0.85);
    const btnHeight = 46;
    const pad = Math.floor(gameHeight * 0.02);
    const topY = pad + Math.floor(btnHeight / 2);
    const bottomY = gameHeight - pad - Math.floor(btnHeight / 2);
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
    
    // Add pointer interaction to the speed crank
    this.setupSpeedCrankInteraction(crankX, crankY);
  }

  /**
   * Setup speed crank pointer interaction
   */
  private setupSpeedCrankInteraction(crankX: number, crankY: number) {
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
    
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        const crankTop = crankY - this.config.speedCrankHeight / 2;
        const crankBottom = crankY + this.config.speedCrankHeight / 2;
        
        // Calculate new percentage based on current pointer position
        const newY = Phaser.Math.Clamp(pointer.y, crankTop, crankBottom);
        const percentage = ((newY - crankTop) / this.config.speedCrankHeight) * 100;
        
        // Snap to nearest snap position
        const snappedPercentage = this.snapToNearestPosition(percentage);
        this.updateSpeedCrank(snappedPercentage);
        
        // Emit event to game scene
        this.scene.events.emit('speedCrankInput', snappedPercentage);
      }
    });
    
    this.scene.input.on('pointerup', () => {
      if (isDragging) {
        isDragging = false;
      }
    });
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
    
    // Store reference to the knob
    this.frontseatDragDial = knob;
    
    // Visual feedback overlay: an indicator line and angle text
    this.steeringDialIndicator = this.scene.add.graphics();
    this.steeringDialIndicator.setDepth(999);
    this.steeringAngleText = this.scene.add.text(dialX, dialY + knobRadius + 18, '0%', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(999);
    const updateDialIndicator = (value: number) => {
      const angleDeg = Phaser.Math.Clamp((value / 100) * 60, -60, 60);
      const angleRad = Phaser.Math.DegToRad(angleDeg - 90);
      const lineLen = knobRadius + 6;
      const endX = dialX + Math.cos(angleRad) * lineLen;
      const endY = dialY + Math.sin(angleRad) * lineLen;
      this.steeringDialIndicator.clear();
      this.steeringDialIndicator.lineStyle(3, 0xffcc00, 1);
      this.steeringDialIndicator.beginPath();
      this.steeringDialIndicator.moveTo(dialX, dialY);
      this.steeringDialIndicator.lineTo(endX, endY);
      this.steeringDialIndicator.strokePath();
      if (this.steeringAngleText) {
        // Show 0..100% mapped from -100..100
        const pct = Math.round((value + 100) / 2);
        this.steeringAngleText.setText(`${pct}%`);
      }
    };
    
    // Add drag functionality (fixed version)
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let knobCenterX = dialX;
    let knobCenterY = dialY;
    
    knob.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
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
    });
    
    // Track pointer globally while dragging so it keeps responding even off the knob
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        // Map absolute pointer position relative to dial center → steering (-100..100)
        const relativeX = pointer.x - dialX;
        const steeringValue = Phaser.Math.Clamp((relativeX / knobRadius) * 100, -100, 100);
        this.scene.events.emit('steeringInput', steeringValue);
        updateDialIndicator(steeringValue);
        lastPointerX = pointer.x;
        lastPointerY = pointer.y;
      }
    });
    
    knob.on('pointerup', () => {
      if (isDragging) {
        isDragging = false;
        
        // Don't move the knob - just reset its visual state
        // Redraw knob with original color
        knob.clear();
        knob.fillStyle(0x444444);
        knob.fillCircle(0, 0, knobRadius);
        knob.lineStyle(2, 0xffffff, 1);
        knob.strokeCircle(0, 0, knobRadius);
        // No square overlay; indicator line shows current value
        
        // Reset steering
        this.scene.events.emit('steeringInput', 0);
        updateDialIndicator(0);
      }
    });
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
   * Update stops display
   */
  private updateStops(stops: number) {
    if (this.stopsText) {
      this.stopsText.setText(`Stops: ${stops}`);
    }
  }

  /**
   * Update progress display
   */
  private updateProgress(progress: number) {
    if (this.progressText) {
      this.progressText.setText(`Progress: ${Math.round(progress)}%`);
    }
  }

  /**
   * Update manager values display
   */
  private updateManagerValues(state: GameUIState) {
    if (this.managerValuesText) {
      const values = [
        `Skill: ${state.playerSkill}%`,
        `Difficulty: ${state.difficulty}%`,
        `Momentum: ${state.momentum}%`,
        `Plot A (${state.plotAEnum}): ${state.plotA}%`,
        `Plot B (${state.plotBEnum}): ${state.plotB}%`,
        `Plot C (${state.plotCEnum}): ${state.plotC}%`
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
      this.stopsText,
      this.progressText,
      this.managerValuesText,
      this.frontseatButton,
      this.backseatButton,
      this.mapToggleButton,
      this.inventoryToggleButton,
      this.mapToggleText,
      this.inventoryToggleText,
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
