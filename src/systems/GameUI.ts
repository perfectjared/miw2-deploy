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
import { gameElements, GREYSCALE_PALETTE } from '../config/GameConfig';
import { REGION_CONFIG } from '../config/GameConfig';

// Tunable UI constants for quick tweaking
const UI_TUNABLES = {
  // Steering dial
  steering: {
    dialXPercent: 0.3,
    dialYPercent: 0.7,
    knobRadius: 80,
    svgScale: 0.2,
    svgAlpha: 0.8,
    svgDepth: 998,
    indicatorLength: 50,
    indicatorMaxAngleDeg: 60,
    angleTextOffset: 18,
    // Steering sensitivity - increased for better range
    horizontalSensitivity: 3.5, // Increased from 2.0
    verticalSensitivity: 2.5,   // Increased from 1.5
    returnToCenterSpeed: 0.02
  },
    // Speed crank
    crank: {
      xPercent: 0.7,
      yPercent: 0.6,
      svgScale: 0.1,
      svgAlpha: 0.8,
      triangleSize: 8,
      triangleOffsetY: -25
    }
} as const;

export interface GameUIConfig {
  // Text Parameters
  gameLayerText: string;
  gameLayerPositionX: number;
  gameLayerPositionY: number;
  gameLayerFontSize: string;
  gameLayerColor: number;
  gameLayerBackgroundColor: number;
  gameLayerDepth: number;
  
  // Countdown Parameters
  countdownPositionX: number;
  countdownPositionY: number;
  countdownFontSize: string;
  countdownColor: number;
  
  // Money/Health Parameters
  moneyPositionX: number;
  moneyPositionY: number;
  healthPositionX: number;
  healthPositionY: number;
  moneyHealthFontSize: string;
  moneyColor: number;
  healthColor: number;
  
  // Progress Parameters
  progressPositionX: number;
  progressPositionY: number;
  progressFontSize: string;
  progressColor: number;
  
  // Manager Values Parameters
  managerValuesFontSize: string;
  managerValuesBackgroundColor: number;
  managerValuesPadding: { x: number; y: number };
  managerValuesOpacity: number;
  managerValuesSkillColor: number;
  managerValuesDifficultyColor: number;
  managerValuesMomentumColor: number;
  managerValuesPlotAColor: number;
  managerValuesPlotBColor: number;
  managerValuesPlotCColor: number;
  managerValuesStopsColor: number;
  
  // Navigation Button Parameters
  frontseatText: string;
  frontseatPositionX: number;
  frontseatPositionY: number;
  frontseatFontSize: string;
  frontseatColor: number;
  
  backseatText: string;
  backseatPositionX: number;
  backseatPositionY: number;
  backseatFontSize: string;
  backseatColor: number;
  
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
  speedCrankTextColor: number;
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
  // Region data
  currentRegion: string;
  showsInCurrentRegion: number;
  // Monthly Listeners System
  monthlyListeners: number;
  buzz: number;
  countdownStepCounter: number;
}

export class GameUI {
  private scene: Phaser.Scene;
  private config: GameUIConfig;
  
  // UI Elements
  private gameLayerText!: Phaser.GameObjects.Text;
  private countdownText!: Phaser.GameObjects.Text;
  private minutesText!: Phaser.GameObjects.Text;
  private moneyText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private progressBarBG!: Phaser.GameObjects.Rectangle;
  private progressBarFill!: Phaser.GameObjects.Rectangle;
  private progressThresholdIndicators: Phaser.GameObjects.Graphics[] = [];
  private regionalUIFadedIn: boolean = false;
  private managerValuesText!: Phaser.GameObjects.Text;
  private frontseatButton!: Phaser.GameObjects.Graphics;
  private backseatButton!: Phaser.GameObjects.Graphics;
  private difficultyDebugText!: Phaser.GameObjects.Text;
  
  // New UI Elements
  private regionText!: Phaser.GameObjects.Text;
  private stopsCounterText!: Phaser.GameObjects.Text;
  
  // Monthly Listeners UI Elements
  private monthlyListenersText!: Phaser.GameObjects.Text;
  private buzzText!: Phaser.GameObjects.Text;
  private encumbranceText!: Phaser.GameObjects.Text;
  
  // Speed Crank Elements
  private dashBackground!: Phaser.GameObjects.Rectangle;
  private speedCrankTrack!: Phaser.GameObjects.Graphics;
  private speedCrankHandle!: Phaser.GameObjects.Graphics;
  private speedCrankValueIndicator!: Phaser.GameObjects.Graphics;
  private speedCrankArea!: Phaser.GameObjects.Rectangle;
  private speedPercentageText!: Phaser.GameObjects.Text;
  
  // Speed Meter Elements
  private speedMeterBG!: Phaser.GameObjects.Graphics;
  private speedMeterFill!: Phaser.GameObjects.Graphics;
  
    // Drag Dial
    private frontseatDragDial!: any; // RexUI drag dial
    private steeringDialIndicator!: Phaser.GameObjects.Graphics;
    private steeringAngleText!: Phaser.GameObjects.Text;
    private steeringWheelSVG!: Phaser.GameObjects.Sprite; // SVG overlay
    
    // Speed Crank SVG
    private speedCrankSVG!: Phaser.GameObjects.Sprite; // SVG overlay
    private speedCrankTriangle!: Phaser.GameObjects.Graphics; // Triangle indicator
    
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
    this.createDashBackground();
    this.createGameLayerText();
    this.createCountdownTimer();
    this.createProgressText(); // Updated method name
    this.createMoneyAndHealthText();
    // this.createManagerValuesText(); // Commented out debug text
    this.createNavigationButtons();
    // Speed crank removed - using automatic speed progression
    this.createSpeedDisplay();
    this.createFrontseatDragDial();
    this.createMonthlyListenersDisplay();
  }

  /**
   * Update UI with current state
   */
  public updateUI(state: GameUIState) {
    this.updateCountdown(state.gameTime, state.countdownStepCounter);
    this.updateDifficulty(state);
    this.updateMoney(state.money);
    // Health update removed - no longer needed
    this.updateProgress(state.progress); // Re-added to fix progress bar
    this.updateManagerValues(state); // This now includes stops
    this.updateRegionInfo(state.currentRegion, state.showsInCurrentRegion);
    // updateStopsCounter removed - stopsCounterText now shows sequence fraction
    this.updateMonthlyListeners(state.monthlyListeners);
    this.updateBuzz(state.buzz);
    // Encumbrance is set explicitly by GameScene via setEncumbrance
    // Speed crank removed - using automatic speed progression
  }

  private updateDifficulty(state: GameUIState) {
    if (!this.difficultyDebugText) return;
    const diff = this.computeDifficulty(state);
    this.difficultyDebugText.setText(`Diff: ${diff.toFixed(2)}`);
    // Keep visibility in sync with countdown
    try { this.difficultyDebugText.setAlpha(this.countdownText.alpha); } catch {}
  }

  private computeDifficulty(state: GameUIState): number {
    const currentRegion = state.currentRegion || REGION_CONFIG.startingRegion;
    const regionBase = this.getRegionBaseDifficulty(currentRegion);
    const showsDone = state.showsInCurrentRegion || 0;
    const showsPerRegion = (REGION_CONFIG as any).showsPerRegion || 3;
    const progressFrac = Math.max(0, Math.min(1, showsDone / Math.max(1, showsPerRegion)));
    return Math.min(5, regionBase + progressFrac);
  }

  private getRegionBaseDifficulty(regionKey: string): number {
    const mapping: Record<string, number> = {
      midwest: 1,
      south: 2,
      southwest: 3,
      west: 4,
      northeast: 5
    };
    return mapping[regionKey] ?? 1;
  }

  /**
   * Update threshold indicators based on planned exits, CYOA, and story
   */
  public updateThresholdIndicators(plannedExits: Array<{ progressThreshold: number; spawned: boolean; number?: number }>, plannedCyoa?: Array<{ progressThreshold: number; triggered: boolean; isExitRelated?: boolean; exitNumber?: number; exitTiming?: 'before' | 'after' }>, plannedStory?: { progressThreshold: number; triggered: boolean } | null) {
    
    // Clear existing indicators
    this.progressThresholdIndicators.forEach(indicator => indicator.destroy());
    this.progressThresholdIndicators = [];
    
    const barWidth = (this as any).progressBarWidth;
    const barX = (this as any).progressBarX;
    const barY = (this as any).progressBarY;
    
    if (!barWidth || !barX || !barY) {
      return;
    }
    
    // Create triangle indicators for unspawned exits (orange triangles)
    const unspawnedExits = plannedExits.filter(exit => !exit.spawned);
    
    unspawnedExits.forEach(exit => {
      const triangleX = barX + (exit.progressThreshold / 100) * barWidth;
      const triangleY = barY - 8; // Above the progress bar
      
      const triangle = this.scene.add.graphics();
      triangle.fillStyle(GREYSCALE_PALETTE.mediumGray, 0.8); // Medium grey for exits
      triangle.beginPath();
      triangle.moveTo(triangleX, triangleY);
      triangle.lineTo(triangleX - 4, triangleY + 8);
      triangle.lineTo(triangleX + 4, triangleY + 8);
      triangle.closePath();
      triangle.fillPath();
      
      triangle.setScrollFactor(0);
      triangle.setDepth(10002);
      triangle.setAlpha(0); // Start invisible for fade-in animation
      
      this.progressThresholdIndicators.push(triangle);
    });
    
    // Create triangle indicators for unspawned CYOA (light grey triangles)
    if (plannedCyoa) {
      plannedCyoa.forEach(cyoa => {
        // Show bundled CYOA indicators for testing (with different color)
        if (cyoa.isExitRelated && cyoa.exitNumber) {
          // Show bundled CYOA with different color for testing
          if (!cyoa.triggered) {
            // For 'before' events, align the marker with the associated exit's threshold for simultaneity
            let markerThreshold = cyoa.progressThreshold;
            if (cyoa.exitTiming === 'before' && cyoa.exitNumber != null) {
              const targetExit = plannedExits.find(e => e.number === cyoa.exitNumber);
              if (targetExit) markerThreshold = targetExit.progressThreshold;
            }
            const triangleX = barX + (markerThreshold / 100) * barWidth;
            const triangleY = barY - 16; // Above the exit indicators
            
            const triangle = this.scene.add.graphics();
            triangle.fillStyle(GREYSCALE_PALETTE.white, 0.8); // White for bundled CYOA
            triangle.beginPath();
            triangle.moveTo(triangleX, triangleY);
            triangle.lineTo(triangleX - 4, triangleY + 8);
            triangle.lineTo(triangleX + 4, triangleY + 8);
            triangle.closePath();
            triangle.fillPath();
            
            triangle.setScrollFactor(0);
            triangle.setDepth(10002);
            triangle.setAlpha(0); // Start invisible for fade-in animation
            // Add B/A label above the triangle
            const labelChar = (cyoa.exitTiming === 'before' || cyoa.exitTiming === 'after') ? (cyoa.exitTiming === 'before' ? 'B' : 'A') : '';
            if (labelChar) {
              const label = this.scene.add.text(triangleX, triangleY - 8, labelChar, {
              fontSize: '10px', color: '#ffffff', fontStyle: 'bold', stroke: '#000000', strokeThickness: 2
              }).setOrigin(0.5);
              label.setScrollFactor(0);
              label.setDepth(10003);
              label.setAlpha(0); // Start invisible for fade-in animation
              this.progressThresholdIndicators.push(label as any);
            }
            
            this.progressThresholdIndicators.push(triangle);
          }
          return; // Skip regular CYOA processing for bundled ones
        }
        
        if (!cyoa.triggered) {
          const triangleX = barX + (cyoa.progressThreshold / 100) * barWidth;
          const triangleY = barY - 16; // Above the exit indicators
          
          const triangle = this.scene.add.graphics();
          triangle.fillStyle(GREYSCALE_PALETTE.lightGray, 0.8); // Light grey for CYOA
          triangle.beginPath();
          triangle.moveTo(triangleX, triangleY);
          triangle.lineTo(triangleX - 4, triangleY + 8);
          triangle.lineTo(triangleX + 4, triangleY + 8);
          triangle.closePath();
          triangle.fillPath();
          
          triangle.setScrollFactor(0);
          triangle.setDepth(10002);
          triangle.setAlpha(0); // Start invisible for fade-in animation
          
          this.progressThresholdIndicators.push(triangle);
        }
      });
    }
    
    // Create triangle indicator for unspawned story (white triangle)
    if (plannedStory && !plannedStory.triggered) {
      const triangleX = barX + (plannedStory.progressThreshold / 100) * barWidth;
      const triangleY = barY - 24; // Above the CYOA indicators
      
      const triangle = this.scene.add.graphics();
      triangle.fillStyle(GREYSCALE_PALETTE.white, 0.8); // White for story - same alpha as others
      triangle.beginPath();
      triangle.moveTo(triangleX, triangleY);
      triangle.lineTo(triangleX - 4, triangleY + 8);
      triangle.lineTo(triangleX + 4, triangleY + 8);
      triangle.closePath();
      triangle.fillPath();
      
      triangle.setScrollFactor(0);
      triangle.setDepth(10002);
      triangle.setAlpha(0); // Start invisible for fade-in animation
      
      this.progressThresholdIndicators.push(triangle);
    }
    
    // Always try to fade in triangles if we have any
    if (this.progressThresholdIndicators.length > 0) {
      this.fadeInTriangles();
    }
  }

  /**
   * Create dash background
   */
  private createDashBackground() {
    const cam = this.scene.cameras.main;
    const dashWidth = Math.floor(cam.width * 0.95);
    const dashHeight = Math.floor(cam.height * 0.15);
    const dashX = Math.floor(cam.width * 0.5);
    const dashY = Math.floor(cam.height * 0.85);
    
    const dashBackground = this.scene.add.rectangle(dashX, dashY, dashWidth, dashHeight, GREYSCALE_PALETTE.white, 1.0);
    dashBackground.setStrokeStyle(2, GREYSCALE_PALETTE.black, 1);
    dashBackground.setScrollFactor(0);
    dashBackground.setDepth(15000); // Below virtual pets and menus but above game content
    
    // Store reference for camera management
    this.dashBackground = dashBackground;
  }

  /**
   * Create game layer text - removed
   */
  private createGameLayerText() {
    // Game layer text removed - no longer needed
  }

  /**
   * Create countdown timer - positioned below rearview rectangle (moved down)
   */
  private createCountdownTimer() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    const countdownX = gameWidth * this.config.countdownPositionX;
    const countdownY = gameHeight * this.config.countdownPositionY + 92; // Moved down by 92px (60px + 32px for 5% of 640px screen)
     
    this.countdownText = this.scene.add.text(countdownX, countdownY, '0', {
      fontSize: this.config.countdownFontSize,
      color: `#${this.config.countdownColor.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
     
    this.countdownText.setScrollFactor(0);
    this.countdownText.setDepth(10000);
    this.countdownText.setAlpha(0); // Start invisible for fade-in animation
    
    // Create minutes counter directly to the right of countdown
    const countdownTextWidth = this.countdownText.width || 40; // Approximate width if not available
    const minutesX = countdownX + (countdownTextWidth / 2) + 10; // 10px gap after hours text
    const minutesY = countdownY; // Same Y as countdown
    
    this.minutesText = this.scene.add.text(minutesX, minutesY, '0', {
      fontSize: '12px', // 1/3 of 36px countdown font size
      color: `#${this.config.countdownColor.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    
    this.minutesText.setScrollFactor(0);
    this.minutesText.setDepth(10000);
    this.minutesText.setAlpha(0); // Start invisible for fade-in animation

    // Debug difficulty tag under countdown
    const diffY = countdownY + 20;
    this.difficultyDebugText = this.scene.add.text(countdownX, diffY, 'Diff: -', {
      fontSize: '12px',
      color: `#${this.config.countdownColor.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
    this.difficultyDebugText.setScrollFactor(0);
    this.difficultyDebugText.setDepth(10000);
    this.difficultyDebugText.setAlpha(0);
  }

  /**
   * Create progress text and region header - moved down to make room for region info
   */
  private createProgressText() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Simple progress meter just above countdown (moved down)
    const barWidth = 160;
    const barHeight = 6;
    const gameWidth2 = this.scene.cameras.main.width;
    const gameHeight2 = this.scene.cameras.main.height;
    const countdownX = gameWidth2 * this.config.countdownPositionX;
    const countdownY = gameHeight2 * this.config.countdownPositionY;
    const barX = countdownX - barWidth / 2;
    const barY = countdownY - 16 + 72; // Moved down by 72px (40px + 32px for 5% of 640px screen)

    // Create region header above progress meter
    const regionX = barX; // Align with progress bar
    const regionY = barY - 20; // Above progress bar
    this.regionText = this.scene.add.text(regionX, regionY, 'Midwest-1', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0, 0.5); // Left-center alignment
    
    this.regionText.setScrollFactor(0);
    this.regionText.setDepth(10000);
    this.regionText.setAlpha(0); // Start invisible for fade-in animation

    // Create stops counter to the right of region text
    const stopsX = regionX + 120; // To the right of region text
    const stopsY = regionY; // Same Y as region text
    this.stopsCounterText = this.scene.add.text(stopsX, stopsY, '0/3', {
      fontSize: '14px', // Same size as region text
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0, 0.5); // Left-center alignment
    
    this.stopsCounterText.setScrollFactor(0);
    this.stopsCounterText.setDepth(10000);
    this.stopsCounterText.setAlpha(0); // Start invisible for fade-in animation
    this.progressBarBG = this.scene.add.rectangle(barX, barY, barWidth, barHeight, 0x000000, 0.4).setOrigin(0, 0.5);
    this.progressBarFill = this.scene.add.rectangle(barX, barY, 0, barHeight, 0x00ff00, 0.9).setOrigin(0, 0.5);
    this.progressBarBG.setScrollFactor(0); this.progressBarBG.setDepth(10000);
    this.progressBarBG.setAlpha(0); // Start invisible for fade-in animation
    this.progressBarFill.setScrollFactor(0); this.progressBarFill.setDepth(10001);
    this.progressBarFill.setAlpha(0); // Start invisible for fade-in animation
    
    // Stops counter moved to be next to region text above
    
    // Store progress bar dimensions for threshold indicators
    (this as any).progressBarWidth = barWidth;
    (this as any).progressBarX = barX;
    (this as any).progressBarY = barY;
  }

  /**
   * Create money and health text
   */
  private createMoneyAndHealthText() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Money text - positioned above monthly listeners
    const steeringConfig = gameElements.getSteeringWheel();
    const steeringX = gameWidth * steeringConfig.position.x;
    const moneyX = steeringX + 250; // Same X as monthly listeners (aligned with other texts)
    const moneyY = gameHeight * 0.7 - 28; // Moved down 5% (32px) from above monthly listeners
    
    this.moneyText = this.scene.add.text(moneyX, moneyY, '$0', {
      fontSize: this.config.moneyHealthFontSize,
      color: `#${GREYSCALE_PALETTE.white.toString(16).padStart(6, '0')}`, // Use white color
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(1, 0.5); // Right-justified like other texts
    
    this.moneyText.setScrollFactor(0);
    this.moneyText.setDepth(10000);
    this.moneyText.setAlpha(0); // Start invisible for fade-in animation
    
    // Health text removed - no longer needed
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
      backgroundColor: `#${this.config.managerValuesBackgroundColor.toString(16).padStart(6, '0')}`,
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
    this.frontseatButton.fillStyle(GREYSCALE_PALETTE.darkerGray, 0.75);
    this.frontseatButton.fillRoundedRect(leftX, topY - Math.floor(btnHeight / 2), btnWidth, btnHeight, 8);
    this.frontseatButton.lineStyle(2, GREYSCALE_PALETTE.white, 1);
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
    this.backseatButton.fillStyle(GREYSCALE_PALETTE.darkerGray, 0.75);
    this.backseatButton.fillRoundedRect(leftX, bottomY - Math.floor(btnHeight / 2), btnWidth, btnHeight, 8);
    this.backseatButton.lineStyle(2, GREYSCALE_PALETTE.white, 1);
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
    
    const crankX = gameWidth * UI_TUNABLES.crank.xPercent; // Right side
    const crankY = gameHeight * UI_TUNABLES.crank.yPercent; // Middle height
    
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
    // Speed crank text removed - using automatic speed progression
    
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
    
    // Create speed crank SVG overlay (deprecated 'bat' removed)
    try {
      const fallbackKey = this.scene.textures.exists('steering-wheel') ? 'steering-wheel' : (this.scene.textures.getTextureKeys?.()[0] || '');
      if (fallbackKey) {
        this.speedCrankSVG = this.scene.add.sprite(crankX, crankY, fallbackKey);
        this.speedCrankSVG.setScale(UI_TUNABLES.crank.svgScale);
        this.speedCrankSVG.setOrigin(0.5, 0.5);
        this.speedCrankSVG.setAlpha(UI_TUNABLES.crank.svgAlpha);
        this.speedCrankSVG.setDepth(this.config.speedCrankDepthHandle + 1);
      }
    } catch {}
    
    // Apply white fill and black stroke styling
    this.speedCrankSVG.setTint(GREYSCALE_PALETTE.white); // White fill

    // Create triangle indicator above the meter
    this.speedCrankTriangle = this.scene.add.graphics();
    this.speedCrankTriangle.setDepth(this.config.speedCrankDepthHandle + 2);
    this.updateSpeedCrankTriangle(0); // Initialize with 0%
    
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
    
    // Use a single move handler reference so we don't attach duplicates
    const moveHandler = (p: Phaser.Input.Pointer) => {
      // If the pointer is no longer down, force end drag to avoid sticky state
      if (!p.isDown) { isDragging = false; return; }
      if (!isDragging) return;
      const crankTop = crankY - this.config.speedCrankHeight / 2;
      const crankBottom = crankY + this.config.speedCrankHeight / 2;
      const newY = Phaser.Math.Clamp(p.y, crankTop, crankBottom);
      const percentage = ((newY - crankTop) / this.config.speedCrankHeight) * 100;
      const snappedPercentage = this.snapToNearestPosition(percentage);
      this.updateSpeedCrank(snappedPercentage);
      this.scene.events.emit('speedCrankInput', snappedPercentage);
    };
    // Attach once at setup time
    if (!(this as any)._speedCrankMoveAttached) {
      this.scene.input.on('pointermove', moveHandler);
      (this as any)._speedCrankMoveAttached = true;
      (this as any)._speedCrankMoveHandler = moveHandler;
    }
    const upHandler = () => {
      isDragging = false;
    };
    // End drag per-interaction without removing the global move listener
    this.scene.input.once('pointerup', upHandler);
    this.scene.input.once('gameout', upHandler as any);
    this.speedCrankArea.once('pointerup', upHandler);
    this.speedCrankArea.once('pointerupoutside', upHandler as any);
    this.speedCrankArea.once('pointerout', upHandler as any);
    this.speedCrankArea.once('pointercancel', upHandler as any);
    // Also end drag if the game loses focus or is hidden
    this.scene.game.events.once('hidden', upHandler as any);
    this.scene.game.events.once('blur', upHandler as any);
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
   * Create radial speed meter directly above steering wheel
   */
  private createSpeedDisplay() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Position directly above the steering wheel
    const dialX = gameWidth * UI_TUNABLES.steering.dialXPercent; // Same X as steering wheel
    const dialY = gameHeight * UI_TUNABLES.steering.dialYPercent; // Same Y as steering wheel
    const speedDisplayX = dialX + 12; // Moved 5px more to the right (was +7, now +12)
    const speedDisplayY = dialY - 42; // Moved down 8px more (was -50, now -42)
    
    // Create smaller radial speed meter
    const meterRadius = 25; // Smaller radius
    const meterThickness = 6; // Thinner
    
    // Background circle (empty)
    this.speedMeterBG = this.scene.add.graphics();
    this.speedMeterBG.lineStyle(meterThickness, GREYSCALE_PALETTE.darkGray, 0.8);
    this.speedMeterBG.strokeCircle(0, 0, meterRadius);
    this.speedMeterBG.setPosition(speedDisplayX, speedDisplayY);
    this.speedMeterBG.setScrollFactor(0);
    this.speedMeterBG.setDepth(10004);
    
    // Progress arc (filled)
    this.speedMeterFill = this.scene.add.graphics();
    this.speedMeterFill.setPosition(speedDisplayX, speedDisplayY);
    this.speedMeterFill.setScrollFactor(0);
    this.speedMeterFill.setDepth(10005);
    
    // Speed percentage text in center (smaller)
    this.speedPercentageText = this.scene.add.text(speedDisplayX, speedDisplayY, '0%', {
      fontSize: '12px', // Smaller font
      color: '#ffffff',
      fontFamily: 'Arial',
      stroke: '#000000',
      strokeThickness: 2
    });
    
    this.speedPercentageText.setOrigin(0.5, 0.5);
    this.speedPercentageText.setScrollFactor(0);
    this.speedPercentageText.setDepth(10006);
    this.speedPercentageText.setVisible(true);
  }

  /**
   * Update speed percentage display with radial meter
   */
  public updateSpeedDisplay(speedPercentage: number) {
    if (this.speedPercentageText) {
      this.speedPercentageText.setText(`${Math.round(speedPercentage)}%`);
    }
    
    if (this.speedMeterFill) {
      // Clear previous arc
      this.speedMeterFill.clear();
      
      // Draw progress arc
      const meterRadius = 25; // Smaller radius to match createSpeedDisplay
      const meterThickness = 6; // Thinner to match createSpeedDisplay
      const startAngle = -Math.PI / 2; // Start at top (12 o'clock)
      const endAngle = startAngle + (speedPercentage / 100) * 2 * Math.PI; // Progress around circle
      
      // Color based on speed (green to yellow to red)
      let color = 0x00ff00; // Green
      if (speedPercentage > 50) color = 0xffff00; // Yellow
      if (speedPercentage > 80) color = 0xff0000; // Red
      
      this.speedMeterFill.lineStyle(meterThickness, color, 0.9);
      this.speedMeterFill.arc(0, 0, meterRadius, startAngle, endAngle, false);
      this.speedMeterFill.strokePath();
    }
  }

  /**
   * Create frontseat drag dial
   */
  private createFrontseatDragDial() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Use GameElements config for steering wheel position
    const steeringConfig = gameElements.getSteeringWheel();
    const dialX = gameWidth * steeringConfig.position.x;
    const dialY = gameHeight * steeringConfig.position.y;
    
    // Create a simple custom knob using graphics
    const knobRadius = UI_TUNABLES.steering.knobRadius;
    const knob = this.scene.add.graphics();
    
    // Draw the knob
    knob.fillStyle(GREYSCALE_PALETTE.mediumDarkGray);
    knob.fillCircle(0, 0, knobRadius);
    knob.lineStyle(2, GREYSCALE_PALETTE.white, 1);
    knob.strokeCircle(0, 0, knobRadius);
    
    // Remove extraneous square; indicator line will represent value
    
    knob.setPosition(dialX, dialY);
    knob.setDepth(60000); // Above dash background and rearview mirror
    knob.setInteractive(new Phaser.Geom.Circle(0, 0, knobRadius), Phaser.Geom.Circle.Contains);
    
    // Create SVG overlay for visual appeal
    this.steeringWheelSVG = this.scene.add.sprite(dialX, dialY, 'steering-wheel');
    this.steeringWheelSVG.setScale(UI_TUNABLES.steering.svgScale * steeringConfig.scale);
    this.steeringWheelSVG.setOrigin(0.5, 0.5);
    this.steeringWheelSVG.setAlpha(UI_TUNABLES.steering.svgAlpha); // Semi-transparent overlay
    this.steeringWheelSVG.setDepth(60001); // Above the knob
    
    // Apply white fill and black stroke styling
    this.steeringWheelSVG.setTint(GREYSCALE_PALETTE.white); // White fill
    // Note: Stroke styling would need to be handled via SVG modification or post-processing
    
    // SVG will be positioned independently but follow the graphics circle
    
    // Store reference to the knob
    this.frontseatDragDial = knob;
    
    // Visual feedback overlay: an indicator line and angle text
    this.steeringDialIndicator = this.scene.add.graphics();
    this.steeringDialIndicator.setDepth(60002); // Above SVG
    this.steeringAngleText = this.scene.add.text(dialX, dialY + knobRadius + UI_TUNABLES.steering.angleTextOffset, '0%', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(60003); // Above indicator
    
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
       
       // Move both knob and SVG to front when dragging starts
       knob.setDepth(99999); // Very high depth during dragging
       if (this.steeringWheelSVG) {
         this.steeringWheelSVG.setDepth(100000); // Even higher depth for SVG
       }
       
       // Redraw knob with active color
       knob.clear();
       knob.fillStyle(GREYSCALE_PALETTE.mediumGray);
       knob.fillCircle(0, 0, knobRadius);
       knob.lineStyle(2, GREYSCALE_PALETTE.white, 1);
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
         const horizontalSteering = deltaX * UI_TUNABLES.steering.horizontalSensitivity; // Horizontal sensitivity
         const verticalSteering = deltaY * UI_TUNABLES.steering.verticalSensitivity; // Vertical sensitivity
         
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
         
        // Clamp the accumulated position to valid range - increased for better extremes
        this.currentSteeringPosition = Phaser.Math.Clamp(this.currentSteeringPosition, -150, 150);
         
        // Apply proportional sensitivity based on distance from center
        const distanceFromCenter = Math.abs(this.currentSteeringPosition);
        // More aggressive curve: starts at 0.7, reaches 1.0 at 50% distance, then increases further
        const sensitivityMultiplier = 0.7 + (distanceFromCenter / 150) * 0.3 + Math.pow(distanceFromCenter / 150, 2) * 0.3;
        const adjustedSteeringValue = this.currentSteeringPosition * sensitivityMultiplier;
        
        // Send the accumulated position directly to car mechanics
        this.scene.events.emit('steeringInput', this.currentSteeringPosition);
        this.updateSteeringIndicator(this.currentSteeringPosition); // Show raw position
         
         lastPointerX = pointer.x;
         lastPointerY = pointer.y;
       }
     };
     // Attach dial move once to avoid duplicates across scene reloads
     if (!(this as any)._dialMoveAttached) {
       this.scene.input.on('pointermove', dialMove);
       (this as any)._dialMoveAttached = true;
       (this as any)._dialMoveHandler = dialMove;
     }
     const dialUp = () => { endDrag(); };
    
    const endDrag = () => {
      if (!isDragging) return;
      isDragging = false;
      this.isDragging = false;
      
      // Restore both knob and SVG depths when dragging ends
      knob.setDepth(60000); // Back to normal depth
      if (this.steeringWheelSVG) {
        this.steeringWheelSVG.setDepth(60001); // Back to normal depth
      }
      
      // Redraw knob with original color
      knob.clear();
      knob.fillStyle(GREYSCALE_PALETTE.mediumDarkGray);
      knob.fillCircle(0, 0, knobRadius);
      knob.lineStyle(2, GREYSCALE_PALETTE.white, 1);
      knob.strokeCircle(0, 0, knobRadius);
      
      // Gradual return to center will be handled in update method
    };

    knob.on('pointerup', endDrag);
    knob.on('pointerupoutside', endDrag as any);
    knob.on('pointerout', endDrag as any);
    knob.on('pointercancel', endDrag as any);
    this.scene.input.once('pointerup', dialUp);
    this.scene.input.once('gameout', endDrag as any);
    // Also end drag if the game loses focus or is hidden
    this.scene.game.events.once('hidden', endDrag as any);
    this.scene.game.events.once('blur', endDrag as any);
  }

  /**
   * Update steering wheel gradual return to center
   */
  public update(delta: number) {
    // Only return to center if not currently being dragged
    if (!this.isDragging && this.currentSteeringPosition !== 0) {
      const returnSpeed = UI_TUNABLES.steering.returnToCenterSpeed; // Adjust to control return speed
      
      // Gradually move toward center
      if (this.currentSteeringPosition > 0) {
        this.currentSteeringPosition = Math.max(0, this.currentSteeringPosition - returnSpeed * delta);
      } else {
        this.currentSteeringPosition = Math.min(0, this.currentSteeringPosition + returnSpeed * delta);
      }
      
      // Emit steering input during return-to-center so physics forces update
      // but mark it as a return-to-center event so car mechanics can ignore it
      this.scene.events.emit('steeringInput', this.currentSteeringPosition, { isReturnToCenter: true });
      
      // Update visual indicator
      this.updateSteeringIndicator(this.currentSteeringPosition);
    }
  }

  /**
   * Update the steering indicator visual
   */
  private updateSteeringIndicator(steeringValue: number) {
    // Steering indicator line disabled - no visual line needed
    if (this.steeringDialIndicator) {
      this.steeringDialIndicator.clear(); // Clear any existing line
    }
    
    // Update angle text - show percentage from 0-100%
    if (this.steeringAngleText) {
      const pct = Math.round((steeringValue + 100) / 2);
      this.steeringAngleText.setText(`${pct}%`);
    }
    
    // Update SVG rotation to match steering position
    if (this.steeringWheelSVG) {
      const angleDeg = Phaser.Math.Clamp((steeringValue / 150) * UI_TUNABLES.steering.indicatorMaxAngleDeg, -UI_TUNABLES.steering.indicatorMaxAngleDeg, UI_TUNABLES.steering.indicatorMaxAngleDeg); // Updated to match new range
      this.steeringWheelSVG.setRotation(Phaser.Math.DegToRad(angleDeg));
    }
  }

  /**
   * Update countdown display (hours) and minutes counter
   */
  private updateCountdown(gameTime: number, countdownStepCounter: number) {
    if (this.countdownText) {
      // Countdown represents hours
      this.countdownText.setText(gameTime.toString());
    }
    
    if (this.minutesText) {
      // Minutes count down every 16 steps
      // Each hour has 60 minutes, and we count down every 16 steps
      // So we need to calculate minutes based on the current step within the hour
      const stepsPerHour = 16; // Countdown decrements every 16 steps
      const stepsPerMinute = stepsPerHour / 60; // Steps per minute
      
      // Calculate current step within the current hour (0-15)
      const currentStepInHour = countdownStepCounter || 0;
      
      // Calculate minutes remaining in current hour
      const minutesRemaining = Math.max(0, Math.floor((stepsPerHour - currentStepInHour) / stepsPerMinute));
      
      // Special case: if minutes would be 60, show '00' instead
      const displayMinutes = minutesRemaining === 60 ? '00' : minutesRemaining.toString();
      
      this.minutesText.setText(displayMinutes);
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
    // Progress text removed - only update progress bar
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
    
    // Speed crank removed - using automatic speed progression
    
    this.updateSpeedCrankHandle(percentage);
    this.updateSpeedCrankTriangle(percentage);
  }

  /**
   * Update progress meter triangle indicator position
   */
  private updateSpeedCrankTriangle(percentage: number) {
    if (!this.speedCrankTriangle) return;
    
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Position triangle above the progress meter (near countdown)
    const countdownX = gameWidth * this.config.countdownPositionX;
    const countdownY = gameHeight * this.config.countdownPositionY;
    const barWidth = 160;
    const barHeight = 6;
    const barX = countdownX - barWidth / 2;
    const barY = countdownY - 16;
    
    // Calculate triangle position based on percentage along the progress bar
    const triangleX = barX + (percentage / 100) * barWidth;
    const triangleY = barY;
    
    // Clear and redraw triangle
    this.speedCrankTriangle.clear();
    this.speedCrankTriangle.fillStyle(GREYSCALE_PALETTE.white, 1);
    this.speedCrankTriangle.lineStyle(1, GREYSCALE_PALETTE.black, 1);
    
    const triangleSize = UI_TUNABLES.crank.triangleSize;
    const triangleOffsetY = UI_TUNABLES.crank.triangleOffsetY;
    
    // Draw triangle pointing down above the progress meter
    this.speedCrankTriangle.beginPath();
    this.speedCrankTriangle.moveTo(triangleX, triangleY + triangleOffsetY);
    this.speedCrankTriangle.lineTo(triangleX - triangleSize/2, triangleY + triangleOffsetY + triangleSize);
    this.speedCrankTriangle.lineTo(triangleX + triangleSize/2, triangleY + triangleOffsetY + triangleSize);
    this.speedCrankTriangle.closePath();
    this.speedCrankTriangle.fillPath();
    this.speedCrankTriangle.strokePath();
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
    // Speed crank text removed - using automatic speed progression
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
   * Fade in regional UI elements (region, progress, countdown) after virtual pets
   */
  public fadeInRegionalUI() {
    console.log('🔺 fadeInRegionalUI called - regionalUIFadedIn:', this.regionalUIFadedIn);
    
    // Prevent multiple fade-in attempts
    if (this.regionalUIFadedIn) {
      console.log('🔺 fadeInRegionalUI: Already faded in, returning early');
      return;
    }
    
    this.regionalUIFadedIn = true;
    
    const regionalElements = [
      this.regionText,
      this.stopsCounterText,
      this.countdownText,
      this.minutesText,
      this.progressBarBG,
      this.progressBarFill,
      this.moneyText,
      this.buzzText,
      this.monthlyListenersText,
      this.encumbranceText
    ];

    regionalElements.forEach((element, index) => {
      if (element) {
        console.log(`🔺 Fading in regional element ${index} from alpha ${element.alpha} to 1`);
        this.scene.tweens.add({
          targets: element,
          alpha: 1,
          duration: 600, // 0.6 seconds fade-in
          ease: 'Cubic.easeOut',
          delay: index * 50 // Stagger each element by 50ms
        });
      }
    });

    // Fade in triangles separately since they might be created later
    console.log('🔺 fadeInRegionalUI calling fadeInTriangles');
    this.fadeInTriangles();
  }

  /**
   * Fade out regional UI elements when menus are open
   */
  public fadeOutRegionalUI() {
    console.log('🔺 fadeOutRegionalUI called');
    
    const regionalElements = [
      this.regionText,
      this.stopsCounterText,
      this.countdownText,
      this.minutesText,
      this.progressBarBG,
      this.progressBarFill,
      this.moneyText,
      this.buzzText,
      this.monthlyListenersText,
      this.encumbranceText
    ];

    regionalElements.forEach((element, index) => {
      if (element && element.alpha > 0) {
        console.log(`🔺 Fading out regional element ${index} from alpha ${element.alpha} to 0.3`);
        this.scene.tweens.add({
          targets: element,
          alpha: 0.3,
          duration: 300, // 0.3 seconds fade-out
          ease: 'Cubic.easeIn',
          delay: index * 20 // Stagger each element by 20ms
        });
      }
    });

    // Fade out triangles
    this.fadeOutTriangles();
  }

  /**
   * Fade in regional UI elements when menus are closed
   */
  public fadeInRegionalUIOnMenuClose() {
    console.log('🔺 fadeInRegionalUIOnMenuClose called');
    
    // Check if car has started (ignition is on) before fading in UI
    const gameScene = this.scene.scene.get('GameScene');
    const carStarted = gameScene ? (gameScene as any).carStarted : false;
    
    if (!carStarted) {
      console.log('🔺 Not fading in regional UI - car not started yet');
      return;
    }
    
    const regionalElements = [
      this.regionText,
      this.stopsCounterText,
      this.countdownText,
      this.minutesText,
      this.progressBarBG,
      this.progressBarFill,
      this.moneyText,
      this.buzzText,
      this.monthlyListenersText,
      this.encumbranceText
    ];

    regionalElements.forEach((element, index) => {
      if (element && element.alpha < 1) {
        console.log(`🔺 Fading in regional element ${index} from alpha ${element.alpha} to 1`);
        this.scene.tweens.add({
          targets: element,
          alpha: 1,
          duration: 400, // 0.4 seconds fade-in
          ease: 'Cubic.easeOut',
          delay: index * 30 // Stagger each element by 30ms
        });
      }
    });

    // Fade in triangles
    this.fadeInTrianglesOnMenuClose();
  }

  /**
   * Fade in progress threshold indicators (triangles)
   */
  private fadeInTriangles() {
    // Only fade in triangles that are currently invisible (alpha = 0)
    let hasInvisibleTriangles = false;
    this.progressThresholdIndicators.forEach((indicator, index) => {
      if (indicator && indicator.alpha === 0) {
        hasInvisibleTriangles = true;
        this.scene.tweens.add({
          targets: indicator,
          alpha: 1,
          duration: 600,
          ease: 'Cubic.easeOut',
          delay: index * 50, // Stagger each triangle by 50ms
        });
      }
    });
  }

  /**
   * Fade out progress threshold indicators (triangles)
   */
  private fadeOutTriangles() {
    this.progressThresholdIndicators.forEach((indicator, index) => {
      if (indicator && indicator.alpha > 0) {
        this.scene.tweens.add({
          targets: indicator,
          alpha: 0.3,
          duration: 300,
          ease: 'Cubic.easeIn',
          delay: index * 20, // Stagger each triangle by 20ms
        });
      }
    });
  }

  /**
   * Fade in progress threshold indicators (triangles) when menus are closed
   */
  private fadeInTrianglesOnMenuClose() {
    // Check if car has started (ignition is on) before fading in triangles
    const gameScene = this.scene.scene.get('GameScene');
    const carStarted = gameScene ? (gameScene as any).carStarted : false;
    
    if (!carStarted) {
      console.log('🔺 Not fading in triangles - car not started yet');
      return;
    }
    
    this.progressThresholdIndicators.forEach((indicator, index) => {
      if (indicator && indicator.alpha < 1) {
        this.scene.tweens.add({
          targets: indicator,
          alpha: 1,
          duration: 400,
          ease: 'Cubic.easeOut',
          delay: index * 30, // Stagger each triangle by 30ms
        });
      }
    });
  }

  /**
   * Public method to ensure triangles fade in (can be called from GameScene)
   */
  public ensureTrianglesFadeIn() {
    this.fadeInTriangles();
  }

  private updateRegionInfo(regionName: string, showsInRegion: number) {
    if (this.regionText) {
      const visitCount = this.getRegionVisitCount(regionName, showsInRegion);
      this.regionText.setText(`${regionName}-${visitCount}`);
    }
  }

  /**
   * Get how many times a region has been visited (for display)
   */
  private getRegionVisitCount(regionName: string, showsInRegion: number): number {
    // Get the actual visit count from GameState
    const gameScene = this.scene.scene.get('GameScene');
    if (gameScene && (gameScene as any).gameState) {
      return (gameScene as any).gameState.getRegionVisitCount(regionName);
    }
    // Fallback: For the first visit, showsInRegion starts at 0, so visit count is 1
    return showsInRegion + 1;
  }

  /**
   * Update region information display with fractional sequence count
   */
  public updateRegionInfoWithTotal(regionName: string, showsInRegion: number, totalSequences: number) {
    // Update region name + visit count
    this.updateRegionInfo(regionName, showsInRegion);
    
    // Update sequence fraction display
    this.updateSequenceFraction(showsInRegion, totalSequences);
  }

  /**
   * Create monthly listeners display (to the right of steering wheel)
   */
  private createMonthlyListenersDisplay() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Position to the right of steering wheel
    const steeringConfig = gameElements.getSteeringWheel();
    const steeringX = gameWidth * steeringConfig.position.x;
    const listenersX = steeringX + 250; // 250px to the right of steering wheel (moved further right)
    const listenersY = gameHeight * 0.75; // Moved down 5% (0.7 to 0.75)
    
    // Buzz text (closer to listeners)
    this.buzzText = this.scene.add.text(listenersX - 80, listenersY, 'BUZZ\n0', {
      fontSize: '12px', // Changed from 14px to match listeners and encumbrance
      color: `#${GREYSCALE_PALETTE.white.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      backgroundColor: `#${GREYSCALE_PALETTE.black.toString(16).padStart(6, '0')}`,
      padding: { x: 8, y: 4 },
      align: 'right' // Changed from 'center' to match listeners and encumbrance
    }).setOrigin(1, 0.5); // Right-justified (origin at right edge, center vertically)
    
    this.buzzText.setScrollFactor(0);
    this.buzzText.setDepth(10000);
    this.buzzText.setAlpha(0); // Start invisible for fade-in animation
    
    // Monthly listeners text
    this.monthlyListenersText = this.scene.add.text(listenersX, listenersY, 'LISTENERS\n2,000', {
      fontSize: '12px', // Smaller than BUZZ (14px) because of long word
      color: `#${GREYSCALE_PALETTE.white.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      backgroundColor: `#${GREYSCALE_PALETTE.black.toString(16).padStart(6, '0')}`,
      padding: { x: 8, y: 4 },
      align: 'right'
    }).setOrigin(1, 0.5); // Right-justified (origin at right edge, center vertically)
    
    this.monthlyListenersText.setScrollFactor(0);
    this.monthlyListenersText.setDepth(10000);
    this.monthlyListenersText.setAlpha(0); // Start invisible for fade-in animation
    
    // Encumbrance text (below Buzz and Listeners)
    const encumbranceY = listenersY + 40; // Below the Buzz/Listeners text
    this.encumbranceText = this.scene.add.text(listenersX, encumbranceY, 'ENCUMBRANCE\n2/10', {
      fontSize: '12px',
      color: `#${GREYSCALE_PALETTE.white.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      backgroundColor: `#${GREYSCALE_PALETTE.black.toString(16).padStart(6, '0')}`,
      padding: { x: 8, y: 4 },
      align: 'right'
    }).setOrigin(1, 0.5); // Right-justified (origin at right edge, center vertically)
    
    this.encumbranceText.setScrollFactor(0);
    this.encumbranceText.setDepth(25000); // Above dash background
    this.encumbranceText.setAlpha(0); // Start invisible for fade-in animation
  }

  /**
   * Update monthly listeners display
   */
  private updateMonthlyListeners(listeners: number) {
    if (this.monthlyListenersText) {
      // Format with commas for readability
      const formattedListeners = listeners.toLocaleString();
      this.monthlyListenersText.setText(`LISTENERS\n${formattedListeners}`);
    }
  }

  /**
   * Update buzz display
   */
  private updateBuzz(buzz: number) {
    if (this.buzzText) {
      this.buzzText.setText(`BUZZ\n${buzz}`);
      // Keep consistent white text - no color changes
    }
  }

  /**
   * Update encumbrance display
   */
  private updateEncumbrance(itemCount: number) {
    if (this.encumbranceText) {
      this.encumbranceText.setText(`ENCUMBRANCE\n${itemCount}/10`);
    }
  }

  /** Public: allow GameScene to set encumbrance count and capacity */
  public setEncumbrance(itemCount: number, capacity: number) {
    if (this.encumbranceText) {
      this.encumbranceText.setText(`ENCUMBRANCE\n${itemCount}/${capacity}`);
    }
  }

  /**
   * Update sequence fraction display (1/2, 2/3, etc.)
   */
  private updateSequenceFraction(showsInRegion: number, totalSequences: number) {
    if (this.stopsCounterText) {
      const currentSequence = showsInRegion + 1; // Shows are 0-based, display is 1-based
      this.stopsCounterText.setText(`${currentSequence}/${totalSequences}`);
    }
  }

  /**
   * Get total sequences for a region (simplified version for UI)
   * This is a simplified version - the real logic is in GameState
   */
  private getTotalSequencesForRegion(regionName: string): number {
    // For UI purposes, we'll use a simple heuristic
    // In a real implementation, this would call GameState.getSequencesForCurrentRegion()
    return 3; // Default to 3, will be updated by GameScene
  }

  /**
   * Update stops counter display
   */
  private updateStopsCounter(stops: number) {
    if (this.stopsCounterText) {
      this.stopsCounterText.setText(`${stops}/3`);
    }
  }

  /**
   * Clean up resources
   */
  public destroy() {
    // Destroy all UI elements
    const elements = [
      this.gameLayerText,
      this.countdownText,
      this.minutesText,
      this.moneyText,
      // healthText removed - no longer needed
      // progressText removed - no longer needed
      this.regionText,
      this.stopsCounterText,
      this.managerValuesText,
      this.frontseatButton,
      this.backseatButton,
      this.speedCrankTrack,
      this.speedCrankHandle,
      this.speedCrankValueIndicator,
      this.speedCrankArea,
      // Speed crank text removed - using automatic speed progression
      this.speedCrankSVG,
      this.speedCrankTriangle,
      this.frontseatDragDial,
      this.speedMeterBG,
      this.speedMeterFill
    ];
    
    elements.forEach(element => {
      if (element) {
        element.destroy();
      }
    });

    // Clean up input listeners we attached globally (if any)
    try {
      if ((this as any)._speedCrankMoveAttached && (this as any)._speedCrankMoveHandler) {
        this.scene.input.off('pointermove', (this as any)._speedCrankMoveHandler);
        (this as any)._speedCrankMoveAttached = false;
        (this as any)._speedCrankMoveHandler = undefined;
      }
      if ((this as any)._dialMoveAttached && (this as any)._dialMoveHandler) {
        this.scene.input.off('pointermove', (this as any)._dialMoveHandler);
        (this as any)._dialMoveAttached = false;
        (this as any)._dialMoveHandler = undefined;
      }
    } catch {}
  }
}
