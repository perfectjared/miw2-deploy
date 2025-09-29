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
  private blinkIntervalSteps: number = 0.5;
  
  // State Tracking
  private lastTutorialState: string = '';
  private stepCounter: number = 0;
  private pulseTimer: number = 0;
  private flashTimer: number = 0; // Add flash timer for 0.5-second intervals
  
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
    this.blinkText = this.scene.add.text(gameWidth / 2, gameHeight * 0.3, 'tutorial', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    this.blinkText.setScrollFactor(0);
    this.blinkText.setDepth(120001); // Above menu depth (120000)
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
    if (this.lastTutorialState === 'keys-and-ignition') {
      // Update mask with current positions (with pulsing)
      const cutouts = this.getKeysAndIgnitionCutouts(this.pulseTimer);
      
      const overlayInstance = (this.tutorialOverlay as any).overlayInstance;
      if (overlayInstance) {
        // Destroy old mask if it exists
        if (overlayInstance.mask) {
          overlayInstance.mask.destroy();
        }
        
        // Create new mask with updated cutouts
        const maskGraphics = this.scene.make.graphics();
        cutouts.forEach(cutout => {
          maskGraphics.fillStyle(0xffffff);
          // Draw circular cutouts instead of rectangular ones
          const centerX = cutout.x + cutout.width / 2;
          const centerY = cutout.y + cutout.height / 2;
          const radius = Math.min(cutout.width, cutout.height) / 2;
          maskGraphics.fillCircle(centerX, centerY, radius);
        });
        
        // Apply new mask
        overlayInstance.mask = this.scene.add.bitmapMask(maskGraphics);
        overlayInstance.mask.invertAlpha = true;
        overlayInstance.background.setMask(overlayInstance.mask);
      }
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
    
    // Debug logs disabled to reduce console noise
    
    // Update tutorial overlay visibility
    if (this.tutorialOverlay) {
      const shouldShow = tutorialState !== 'none';
      this.tutorialOverlay.setVisible(shouldShow);
      // Only log when tutorial state changes to prevent spam
      // Visibility debug log disabled
      try {
        // Inform parent scene so other scenes (like AppScene) can react (hide Pause/Save)
        (this.scene as any).events?.emit?.('tutorialOverlayVisible', shouldShow);
      } catch {}
    }
    
    // Update tutorial text based on state
    if (this.blinkText) {
      if (tutorialState === 'keys-and-ignition') {
        this.blinkText.setText('PUT KEY IN IGNITION');
        this.blinkText.setVisible(true); // Keep visible for alpha animation
      } else {
        this.blinkText.setVisible(false);
      }
    }
    
    // Update tutorial mask if needed (only when state changes)
    // Don't update mask if we're already in the same state and pulsing
    if (tutorialState !== 'none' && this.lastTutorialState !== tutorialState) {
      this.updateTutorialMask(tutorialState);
    }
    
    // Only log when tutorial state changes to prevent spam
    if (this.lastTutorialState !== tutorialState) {
      this.lastTutorialState = tutorialState;
    }
  }

  /**
   * Create tutorial overlay using unified OverlayManager
   */
  private createTutorialOverlay() {
    // Don't recreate if overlay already exists
    if (this.tutorialOverlay) {
      if ((window as any)?.__ENABLE_TUTORIAL_DEBUG) console.log('Tutorial overlay already exists, skipping creation');
      return;
    }
    
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Debug logs disabled
    
    // Create tutorial overlay using OverlayManager with dither pattern
    // Start with empty cutouts - they'll be updated dynamically
    const overlay = this.overlayManager.createTutorialOverlay('tutorial_overlay', []);
    
    // Debug logs disabled
    
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
    if (!this.tutorialOverlay) { return; }
    
    // Get cutouts for current tutorial state
    let cutouts: Array<{x: number, y: number, width: number, height: number}> = [];
    
    switch (tutorialState) {
      case 'keys-and-ignition':
        cutouts = this.getKeysAndIgnitionCutouts(this.pulseTimer);
        break;
      case 'steering':
        cutouts = this.getSteeringCutouts();
        break;
      case 'exit-warning':
        cutouts = this.getExitWarningCutouts();
        break;
    }
    
    // Debug logging
    // Debug logs disabled
    
    // Update existing overlay's mask instead of creating new one
    const overlayInstance = (this.tutorialOverlay as any).overlayInstance;
    if (overlayInstance) {
      // Destroy old mask if it exists
      if (overlayInstance.mask) {
        overlayInstance.mask.destroy();
      }
      
      // Create new mask with updated cutouts
      const maskGraphics = this.scene.make.graphics();
      cutouts.forEach(cutout => {
        maskGraphics.fillStyle(0xffffff);
        // Draw circular cutouts instead of rectangular ones
        const centerX = cutout.x + cutout.width / 2;
        const centerY = cutout.y + cutout.height / 2;
        const radius = Math.min(cutout.width, cutout.height) / 2;
        maskGraphics.fillCircle(centerX, centerY, radius);
      });
      
      // Apply new mask
      overlayInstance.mask = this.scene.add.bitmapMask(maskGraphics);
      overlayInstance.mask.invertAlpha = true;
      overlayInstance.background.setMask(overlayInstance.mask);
    }
    
    // console.log(`Updated tutorial mask for state: ${tutorialState} with ${cutouts.length} cutouts`);
  }
  

  /**
   * Get cutouts for keys and ignition tutorial
   */
  private getKeysAndIgnitionCutouts(timer: number = 0): Array<{x: number, y: number, width: number, height: number}> {
    const cutouts: Array<{x: number, y: number, width: number, height: number}> = [];
    
    // Calculate pulsing animation every second (alternate between normal and 30% bigger)
    const pulseScale = (timer % 2 === 0) ? 1.0 : 1.3; // Normal on even seconds, 30% bigger on odd seconds
    
    // Only log pulse debug when timer is low to avoid spam
    if ((window as any)?.__ENABLE_TUTORIAL_DEBUG && timer < 20) {
      /*console.log('💓 Pulse Debug:', {
        timer: timer,
        pulseScale: pulseScale.toFixed(1)
      });*/
    }
    
    // Keys cutout with 20% padding (convert world -> screen if needed)
    // Debug: keys presence (disabled by default)
    // if ((window as any)?.__ENABLE_TUTORIAL_DEBUG) {
    //   console.log('🔑 Checking for frontseat keys:', {
    //     frontseatKeys: !!this.frontseatKeys,
    //     gameObject: !!this.frontseatKeys?.gameObject
    //   });
    // }
    
    if (this.frontseatKeys?.gameObject) {
      // Get live position from the physics body
      const keysBody = this.frontseatKeys.gameObject.body;
      let sx = keysBody ? keysBody.position.x : this.frontseatKeys.gameObject.x;
      let sy = keysBody ? keysBody.position.y : this.frontseatKeys.gameObject.y;
      
      if ((window as any)?.__ENABLE_TUTORIAL_DEBUG) console.log('🔑 Keys live position:', { x: sx, y: sy, hasBody: !!keysBody });
      const keysHoleRadius = this.config.keysHoleRadius * 1.2 * pulseScale; // 20% larger + pulsing
      cutouts.push({
        x: sx - keysHoleRadius,
        y: sy - keysHoleRadius,
        width: keysHoleRadius * 2,
        height: keysHoleRadius * 2
      });
      
      if ((window as any)?.__ENABLE_TUTORIAL_DEBUG) console.log('🔑 Keys cutout:', {
        keysPos: { x: sx, y: sy },
        screenPos: { x: sx, y: sy },
        radius: keysHoleRadius,
        cutout: cutouts[cutouts.length - 1]
      });
    } else {
      if ((window as any)?.__ENABLE_TUTORIAL_DEBUG) console.log('🔑 No frontseat keys found for cutout');
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
    const ignitionHoleRadius = this.config.magneticTargetRadius * this.config.targetHoleMultiplier * 1.2 * pulseScale; // 20% larger + pulsing
    cutouts.push({
      x: ignitionX - ignitionHoleRadius,
      y: ignitionY - ignitionHoleRadius,
      width: ignitionHoleRadius * 2,
      height: ignitionHoleRadius * 2
    });
    
    if ((window as any)?.__ENABLE_TUTORIAL_DEBUG) console.log('🚗 Ignition cutout:', {
      ignitionPos: { x: ignitionX, y: ignitionY },
      radius: ignitionHoleRadius,
      cutout: cutouts[cutouts.length - 1]
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
      if ((window as any)?.__ENABLE_TUTORIAL_DEBUG) console.log(`🎓 TutorialSystem: Hiding tutorial overlay`);
      this.tutorialOverlay.setVisible(false);
    } else {
      if ((window as any)?.__ENABLE_TUTORIAL_DEBUG) console.log(`🎓 TutorialSystem: No tutorial overlay to hide`);
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

  /** Call on each half-step for faster text flashing (every 0.5 seconds) */
  public handleHalfStep(halfStep: number) {
    try {
      // Debug logs disabled
      
      // Update flash timer (increment by 0.5 seconds each half-step)
      this.flashTimer = halfStep * 0.5;
      
      // Debug logs disabled
    
      // Update mask if tutorial is visible (for pulsing animation)
      const overlayVisible = this.isTutorialVisible();
      if (overlayVisible && this.lastTutorialState === 'keys-and-ignition') {
        // Debug logs disabled
        this.updateTutorialMaskWithPulse();
      }
      
      if (!this.blinkText) return;
      if (!overlayVisible || !this.blinkText.text) {
        this.blinkText.setAlpha(0);
        return;
      }
      // Animate alpha between 0 and 1 every 4 steps
      const phase = Math.floor(halfStep / 4) % 2; // 0 or 1, changes every 4 half-steps (every 4 steps)
      const alpha = phase === 0 ? 0 : 1;
      this.blinkText.setAlpha(alpha);
      
        // Debug: Force text to be visible for testing
      // Debug code disabled
      
      // Debug logging for alpha animation
      // Debug logs disabled
    } catch (error) {
      console.error('💓 Error in handleHalfStep:', error);
    }
  }

  /** Call on each step to toggle blink visibility every 5 steps on/off when overlay is active */
  public handleStep(step: number) {
    try {
      // Debug logs disabled
      
      // Use the actual global step number
      this.stepCounter = step;
      
      // Update pulse timer (increment by 1 second each step)
      this.pulseTimer += 1;
      
    // Debug logs disabled
  
  // Debug: Log every 5th step to avoid spam
  // Debug logs disabled
  
  // Update mask if tutorial is visible (for pulsing animation)
  const overlayVisible = this.isTutorialVisible();
  if (overlayVisible && this.lastTutorialState === 'keys-and-ignition') {
    // Debug logs disabled
    this.updateTutorialMaskWithPulse();
  }
  
  // Text animation is now handled by handleHalfStep for true 0.5-second intervals
    } catch (error) {
      console.error('💓 Error in handleStep:', error);
    }
  }

  /**
   * Update tutorial mask with pulsing animation (called from handleStep)
   */
  private updateTutorialMaskWithPulse() {
    if (!this.tutorialOverlay) {
      return;
    }
    
    // Debug logs disabled
    
    // Get cutouts with current pulse timer for pulsing
    const cutouts = this.getKeysAndIgnitionCutouts(this.pulseTimer);
    
    // Update existing overlay's mask
    const overlayInstance = (this.tutorialOverlay as any).overlayInstance;
    // Debug logs disabled
    
    if (overlayInstance) {
      // Destroy old mask if it exists
      if (overlayInstance.mask) {
        overlayInstance.mask.destroy();
      }
      
      // Create new mask with updated cutouts
      const maskGraphics = this.scene.make.graphics();
      cutouts.forEach(cutout => {
        maskGraphics.fillStyle(0xffffff);
        // Draw circular cutouts instead of rectangular ones
        const centerX = cutout.x + cutout.width / 2;
        const centerY = cutout.y + cutout.height / 2;
        const radius = Math.min(cutout.width, cutout.height) / 2;
        maskGraphics.fillCircle(centerX, centerY, radius);
      });
      
      // Apply new mask
      overlayInstance.mask = this.scene.add.bitmapMask(maskGraphics);
      overlayInstance.mask.invertAlpha = true;
      overlayInstance.background.setMask(overlayInstance.mask);
    }
  }

  /**
   * Get current tutorial state
   */
  public getCurrentTutorialState(): string {
    return this.lastTutorialState;
  }

  /**
   * Debug method to force show tutorial overlay
   */
  public debugForceShowTutorial() {
    // Debug logs disabled
    
    if (this.tutorialOverlay) {
      // Debug logs disabled
      this.tutorialOverlay.setVisible(true);
      // Debug logs disabled
      this.updateTutorialMask('keys-and-ignition');
      if (this.blinkText) {
        this.blinkText.setText('DEBUG: Place keys in ignition');
        this.blinkText.setVisible(true);
        this.blinkText.setAlpha(1); // Set to full opacity for debug
        // Debug logs disabled
      }
      // Reset step counter to start pulsing animation
      this.stepCounter = 0;
      // Debug logs disabled
      
      // Test handleStep directly
      // Debug logs disabled
      this.handleStep(999);
    } else {
      // Debug logs disabled
    }
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
