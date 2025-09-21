/**
 * TUTORIAL SYSTEM - DYNAMIC TUTORIAL OVERLAYS AND GUIDANCE
 * 
 * This module handles the tutorial system that guides players through
 * the game mechanics with visual overlays and cutouts. It provides
 * contextual help based on the current game state.
 * 
 * Key Features:
 * - Dynamic tutorial state management
 * - Visual overlay with cutouts to highlight interactive elements
 * - Context-sensitive guidance based on game progress
 * - Smooth transitions between tutorial states
 * - Prevents tutorial spam with state change detection
 * 
 * Tutorial States:
 * - keys-and-ignition: Highlights keys and ignition when starting
 * - ignition-menu: Highlights ignition when menu is open
 * - crank: Highlights speed crank when car is started but not moving
 * - none: No tutorial overlay
 */

import Phaser from 'phaser';
import { gameElements } from '../config/GameConfig';
import { OverlayManager } from '../utils/OverlayManager';

export interface TutorialConfig {
  // Overlay Parameters
  overlayColor: number;
  overlayAlpha: number;
  overlayDepth: number;
  
  // Mask Parameters
  maskColor: number;
  keysHoleRadius: number;
  targetHoleMultiplier: number;
  
  // Target Parameters
  magneticTargetX: number;
  magneticTargetY: number;
  magneticTargetRadius: number;
}

export interface TutorialState {
  keysInIgnition: boolean;
  carStarted: boolean;
  hasOpenMenu: boolean;
  currentMenuType: string | null;
  steeringUsed: boolean;
  inExitCollisionPath: boolean; // Player is positioned to collide with an exit
}

export class TutorialSystem {
  private scene: Phaser.Scene;
  private config: TutorialConfig;
  private overlayManager: OverlayManager;
  
  // Visual Elements
  private tutorialOverlay!: Phaser.GameObjects.Container;
  private tutorialMaskGraphics!: Phaser.GameObjects.Graphics;
  private blinkText?: Phaser.GameObjects.Text;
  private blinkIntervalSteps: number = 2;
  
  // State Tracking
  private lastTutorialState: string = '';
  
  // Physics Object References (set by external system)
  private frontseatKeys: any = null;
  private gameUI: any = null;

  constructor(scene: Phaser.Scene, config: TutorialConfig, overlayManager?: OverlayManager) {
    this.scene = scene;
    this.config = config;
    this.overlayManager = overlayManager || new OverlayManager(scene);
  }

  /**
   * Initialize tutorial system
   */
  public initialize() {
    this.createTutorialOverlay();
    // Create blink text (hidden by default)
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    this.blinkText = this.scene.add.text(gameWidth / 2, gameHeight / 2, 'tutorial', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    this.blinkText.setScrollFactor(0);
    this.blinkText.setDepth(10000);
    try { (this.blinkText as any).setStroke?.(); } catch {}
    try { (this.blinkText as any).setShadow?.(2, 2, '#000000', 6, true, true); } catch {}
    this.blinkText.setVisible(false);
    this.tutorialOverlay.add(this.blinkText);
  }

  /**
   * Set reference to physics objects
   */
  public setPhysicsObjects(frontseatKeys: any) {
    this.frontseatKeys = frontseatKeys;
  }

  /**
   * Set GameUI reference for tutorial system
   */
  public setGameUI(gameUI: any) {
    this.gameUI = gameUI;
  }

  /**
   * Update tutorial mask in real-time (for drag operations)
   */
  public updateTutorialMaskRealTime() {
    if (!this.tutorialOverlay) {
      return;
    }
    
    // Only update if tutorial is currently showing keys-and-ignition
    // But don't recreate the overlay - just update the mask if needed
    if (this.lastTutorialState === 'keys-and-ignition') {
      // Check if we need to update the mask (e.g., if cutouts changed)
      // For now, just return without doing anything to prevent constant recreation
      return;
    }
  }

  /**
   * Update tutorial overlay based on current game state
   */
  public updateTutorialOverlay(state: TutorialState) {
    // Determine tutorial state based on game state
    let tutorialState: 'none' | 'keys-and-ignition' | 'steering' | 'exit-warning' = 'none';
    
    // Show keys-and-ignition tutorial when keys are not in ignition and car is not started
    if (!state.keysInIgnition && !state.carStarted) {
      tutorialState = 'keys-and-ignition';
    }
    
    // Update tutorial overlay visibility
    if (this.tutorialOverlay) {
      this.tutorialOverlay.setVisible(tutorialState !== 'none');
      try {
        // Inform parent scene so other scenes (like AppScene) can react (hide Pause/Save)
        (this.scene as any).events?.emit?.('tutorialOverlayVisible', tutorialState !== 'none');
      } catch {}
    }
    
    // Update tutorial text based on state
    if (this.blinkText) {
      if (tutorialState === 'keys-and-ignition') {
        this.blinkText.setText('Place keys in ignition');
        this.blinkText.setVisible(true);
      } else {
        this.blinkText.setVisible(false);
      }
    }
    
    // Update tutorial mask if needed
    if (tutorialState !== 'none') {
      this.updateTutorialMask(tutorialState);
    }
    
    // Only log when tutorial state changes to prevent spam
    if (this.lastTutorialState !== tutorialState) {
      console.log('Tutorial state:', tutorialState);
      this.lastTutorialState = tutorialState;
    }
  }

  /**
   * Create tutorial overlay using unified OverlayManager
   */
  private createTutorialOverlay() {
    // Don't recreate if overlay already exists
    if (this.tutorialOverlay) {
      console.log('Tutorial overlay already exists, skipping creation');
      return;
    }
    
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    console.log('Creating unified tutorial overlay with dimensions:', gameWidth, gameHeight);
    
    // Create tutorial overlay using OverlayManager with dither pattern
    // Start with empty cutouts - they'll be updated dynamically
    const overlay = this.overlayManager.createTutorialOverlay('tutorial_overlay', []);
    
    // Store references for compatibility with existing code
    this.tutorialOverlay = overlay.container;
    this.tutorialMaskGraphics = this.scene.make.graphics();
    
    // Store overlay reference for dynamic mask updates
    (this.tutorialOverlay as any).overlayInstance = overlay;
    
    // Initially hide the tutorial overlay - it will be shown when conditions are met
    this.tutorialOverlay.setVisible(false);
  }

  /**
   * Update tutorial mask based on current state
   */
  private updateTutorialMask(tutorialState: 'keys-and-ignition' | 'steering' | 'exit-warning') {
    if (!this.tutorialOverlay) {
      console.log('Cannot update mask - overlay not found');
      return;
    }
    
    // Get cutouts for current tutorial state
    let cutouts: Array<{x: number, y: number, width: number, height: number}> = [];
    
    switch (tutorialState) {
      case 'keys-and-ignition':
        cutouts = this.getKeysAndIgnitionCutouts();
        break;
      case 'steering':
        cutouts = this.getSteeringCutouts();
        break;
      case 'exit-warning':
        cutouts = this.getExitWarningCutouts();
        break;
    }
    
    // Update existing overlay's mask instead of creating new one
    const overlayInstance = (this.tutorialOverlay as any).overlayInstance;
    if (overlayInstance && overlayInstance.mask) {
      // Destroy old mask
      overlayInstance.mask.destroy();
      
      // Create new mask with updated cutouts
      const maskGraphics = this.scene.make.graphics();
      cutouts.forEach(cutout => {
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(cutout.x, cutout.y, cutout.width, cutout.height);
      });
      
      // Apply new mask
      overlayInstance.mask = this.scene.add.bitmapMask(maskGraphics);
      overlayInstance.container.mask = overlayInstance.mask;
    }
    
    // console.log(`Updated tutorial mask for state: ${tutorialState} with ${cutouts.length} cutouts`);
  }
  
  /**
   * Get cutouts for keys and ignition tutorial
   */
  private getKeysAndIgnitionCutouts(): Array<{x: number, y: number, width: number, height: number}> {
    const cutouts: Array<{x: number, y: number, width: number, height: number}> = [];
    
    // Keys cutout with 20% padding (convert world -> screen if needed)
    if (this.frontseatKeys?.gameObject) {
      const keysPos = this.frontseatKeys.gameObject;
      let sx = keysPos.x;
      let sy = keysPos.y;
      try {
        const gc: any = (this.scene as any).gameContentContainer;
        if (gc && gc.getWorldTransformMatrix) {
          const m = gc.getWorldTransformMatrix();
          const p = m.transformPoint(keysPos.x, keysPos.y);
          sx = p.x; sy = p.y;
        }
      } catch {}
      const keysHoleRadius = this.config.keysHoleRadius * 1.2; // 20% larger
      cutouts.push({
        x: sx - keysHoleRadius,
        y: sy - keysHoleRadius,
        width: keysHoleRadius * 2,
        height: keysHoleRadius * 2
      });
    }
    
    // Ignition cutout with 20% padding (use actual magnetic target position from GameElements)
    let ignitionX = 200; // Default fallback
    let ignitionY = 550; // Default fallback
    try {
      // Get the actual magnetic target position from GameElements config
      const magneticTargetConfig = gameElements.getMagneticTarget();
      ignitionX = magneticTargetConfig.position.x;
      ignitionY = magneticTargetConfig.position.y;
      
      // Also try to get the live magnetic body position as backup
      const mt: any = (this.scene as any).magneticTarget;
      const magneticBody: any = mt && (mt as any).magneticBody;
      if (magneticBody && magneticBody.position) {
        // Matter body position is already in world/screen coordinates
        ignitionX = magneticBody.position.x;
        ignitionY = magneticBody.position.y;
      }
    } catch {}
    const ignitionHoleRadius = this.config.magneticTargetRadius * this.config.targetHoleMultiplier * 1.2; // 20% larger
    cutouts.push({
      x: ignitionX - ignitionHoleRadius,
      y: ignitionY - ignitionHoleRadius,
      width: ignitionHoleRadius * 2,
      height: ignitionHoleRadius * 2
    });
    
    return cutouts;
  }

  // Speed crank mask method removed - using automatic speed progression

  /**
   * Get cutouts for steering tutorial
   */
  private getSteeringCutouts(): Array<{x: number, y: number, width: number, height: number}> {
    const cutouts: Array<{x: number, y: number, width: number, height: number}> = [];
    
    // Get steering dial position (left side of screen)
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Use GameElements config for steering wheel position
    const steeringConfig = gameElements.getSteeringWheel();
    const steeringX = gameWidth * steeringConfig.position.x;
    const steeringY = gameHeight * steeringConfig.position.y;
    const radius = 80 + 16; // knobRadius + padding
    
    cutouts.push({
      x: steeringX - radius,
      y: steeringY - radius,
      width: radius * 2,
      height: radius * 2
    });
    
    return cutouts;
  }

  /**
   * Show tutorial overlay
   */
  public showTutorial() {
    if (this.tutorialOverlay) {
      this.tutorialOverlay.setVisible(true);
    }
  }

  /**
   * Hide tutorial overlay
   */
  public hideTutorial() {
    if (this.tutorialOverlay) {
      this.tutorialOverlay.setVisible(false);
    }
  }

  /**
   * Check if tutorial is currently visible
   */
  public isTutorialVisible(): boolean {
    return this.tutorialOverlay ? this.tutorialOverlay.visible : false;
  }

  /** Expose overlay objects so cameras can render them above controls */
  public getOverlayObjects(): Phaser.GameObjects.GameObject[] {
    const objs: Phaser.GameObjects.GameObject[] = [];
    if (this.tutorialOverlay) objs.push(this.tutorialOverlay);
    return objs;
  }

  /** Set the blinking tutorial text content */
  public setBlinkText(text: string) {
    if (!this.blinkText) return;
    this.blinkText.setText(text || '');
  }

  /** Call on each step to toggle blink visibility every 5 steps on/off when overlay is active */
  public handleStep(step: number) {
    if (!this.blinkText) return;
    const overlayVisible = this.isTutorialVisible();
    if (!overlayVisible || !this.blinkText.text) {
      this.blinkText.setVisible(false);
      return;
    }
    // Toggle visibility every 5 steps: visible on steps 0,1,2,3,4, hidden on 5,6,7,8,9, etc.
    const phase = Math.floor(step / this.blinkIntervalSteps) % 2; // 0 or 1
    this.blinkText.setVisible(phase === 0);
  }

  /**
   * Get current tutorial state
   */
  public getCurrentTutorialState(): string {
    return this.lastTutorialState;
  }

  /**
   * Get cutouts for exit warning tutorial
   */
  private getExitWarningCutouts(): Array<{x: number, y: number, width: number, height: number}> {
    // For exit warnings, we don't need cutouts - just show the warning text
    // Return empty array to show full dither overlay
    return [];
  }

  /**
   * Clean up resources
   */
  public destroy() {
    if (this.tutorialOverlay) {
      this.tutorialOverlay.destroy();
    }
    if (this.tutorialMaskGraphics) {
      this.tutorialMaskGraphics.destroy();
    }
  }
}
