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
  crankPercentage: number;
  hasOpenMenu: boolean;
  currentMenuType: string | null;
  steeringUsed: boolean;
}

export class TutorialSystem {
  private scene: Phaser.Scene;
  private config: TutorialConfig;
  
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

  constructor(scene: Phaser.Scene, config: TutorialConfig) {
    this.scene = scene;
    this.config = config;
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
    if (!this.tutorialOverlay || !this.tutorialMaskGraphics) {
      return;
    }
    
    // Only update if tutorial is currently showing keys-and-ignition
    if (this.lastTutorialState === 'keys-and-ignition') {
      this.createKeysAndIgnitionMask();
    }
  }

  /**
   * Update tutorial overlay based on current game state
   */
  public updateTutorialOverlay(state: TutorialState) {
    // Determine which tutorial state to show
    let tutorialState: 'none' | 'keys-and-ignition' | 'crank' | 'steering' = 'none';
    
    if (state.hasOpenMenu) {
      // Menu is open - no tutorial overlay (menu has its own overlay)
      tutorialState = 'none';
    } else if (!state.keysInIgnition) {
      // Keys not in ignition should always be highlighted unless a menu is open
      tutorialState = 'keys-and-ignition';
    } else if (state.keysInIgnition && state.crankPercentage === 0) {
      // Keys are in, crank is at 0% → always guide to crank
      tutorialState = 'crank';
    } else if (state.carStarted) {
      // Car is started - check crank percentage and steering usage
      if (state.steeringUsed) {
        tutorialState = 'none';
      } else if (state.crankPercentage < 40) {
        tutorialState = 'crank';
      } else {
        tutorialState = 'steering';
      }
    } else {
      // Keys are in ignition but car not started - ignition menu will handle overlay
      tutorialState = 'none';
    }
    
    // Update overlay visibility and mask
    if (this.tutorialOverlay) {
      const shouldShow = tutorialState !== 'none';
      this.tutorialOverlay.setVisible(shouldShow);
      try {
        // Inform parent scene so other scenes (like AppScene) can react (hide Pause/Save)
        (this.scene as any).events?.emit?.('tutorialOverlayVisible', shouldShow);
      } catch {}
      if (shouldShow) {
        // Ensure blink text is above overlay gfx
        if (this.blinkText) {
          this.blinkText.setDepth(1);
          this.blinkText.setVisible(true);
        }
        this.updateTutorialMask(tutorialState as 'keys-and-ignition' | 'crank' | 'steering');
      } else if (this.blinkText) {
        this.blinkText.setVisible(false);
      }
    }
    
    // Only log when tutorial state changes to prevent spam
    if (this.lastTutorialState !== tutorialState) {
      console.log('Tutorial overlay state changed:', tutorialState, 'keysInIgnition:', state.keysInIgnition, 'carStarted:', state.carStarted, 'crankPercentage:', state.crankPercentage, 'hasOpenMenu:', state.hasOpenMenu, 'menuType:', state.currentMenuType);
      this.lastTutorialState = tutorialState;
    }
  }

  /**
   * Create tutorial overlay
   * 
   * IMPORTANT: DO NOT DELETE THIS CODE - TUTORIAL OVERLAY SYSTEM
   * This creates the visual tutorial overlay with cutouts and guidance.
   * Currently commented out for cleaner UI, but should be preserved for future use.
   * 
   * To re-enable: Uncomment the code below and ensure tutorialOverlay is created in constructor
   */
  private createTutorialOverlay() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    console.log('Creating unified tutorial overlay with dimensions:', gameWidth, gameHeight);
    
    // Create tutorial overlay container
    this.tutorialOverlay = this.scene.add.container(0, 0);
    this.tutorialOverlay.setDepth(this.config.overlayDepth); // Above everything
    (this.tutorialOverlay as any).setScrollFactor?.(0);
    
    // Create semi-transparent black overlay covering the screen
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(this.config.overlayColor, this.config.overlayAlpha).fillRect(0, 0, gameWidth, gameHeight);
    overlay.setScrollFactor(0);
    this.tutorialOverlay.add(overlay);
    
    // Create mask graphics for cutouts
    this.tutorialMaskGraphics = this.scene.make.graphics();
    
    // Create BitmapMask with inverted alpha (white areas become cutouts)
    const mask = new Phaser.Display.Masks.BitmapMask(this.scene, this.tutorialMaskGraphics);
    mask.invertAlpha = true; // This makes white areas transparent (cutouts)
    
    // Apply the mask to the overlay
    overlay.setMask(mask);
    
    // Initially hide the tutorial overlay - it will be shown when conditions are met
    this.tutorialOverlay.setVisible(false);
  }

  /**
   * Update tutorial mask based on current state
   */
  private updateTutorialMask(tutorialState: 'keys-and-ignition' | 'crank' | 'steering') {
    if (!this.tutorialOverlay || !this.tutorialMaskGraphics) {
      console.log('Cannot update mask - overlay or mask graphics not found');
      return;
    }
    
    // Clear previous mask
    this.tutorialMaskGraphics.clear();
    
    switch (tutorialState) {
      case 'keys-and-ignition':
        this.createKeysAndIgnitionMask();
        break;
      case 'crank':
        this.createCrankMask();
        break;
      case 'steering':
        this.createSteeringMask();
        break;
    }
  }
  
  /**
   * Create mask for keys and ignition tutorial
   */
  private createKeysAndIgnitionMask() {
    // Create cutouts for both keys and ignition
    this.tutorialMaskGraphics.fillStyle(this.config.maskColor);
    
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
      this.tutorialMaskGraphics.fillCircle(sx, sy, keysHoleRadius);
    }
    
    // Ignition cutout with 20% padding (prefer live magnetic body position in world/screen space)
    let ignitionX = this.config.magneticTargetX;
    let ignitionY = this.config.magneticTargetY;
    try {
      const mt: any = (this.scene as any).magneticTarget;
      const magneticBody: any = mt && (mt as any).magneticBody;
      if (magneticBody && magneticBody.position) {
        // Matter body position is already in world/screen coordinates
        ignitionX = magneticBody.position.x;
        ignitionY = magneticBody.position.y;
      }
    } catch {}
    const ignitionHoleRadius = this.config.magneticTargetRadius * this.config.targetHoleMultiplier * 1.2; // 20% larger
    this.tutorialMaskGraphics.fillCircle(ignitionX, ignitionY, ignitionHoleRadius);
  }

  /**
   * Create mask for crank tutorial
   */
  private createCrankMask() {
    // Create cutout around speed crank area
    this.tutorialMaskGraphics.fillStyle(this.config.maskColor);
    
    // Get speed crank position from GameUI (if available)
    if (this.gameUI) {
      const crankPos = this.gameUI.getSpeedCrankPosition();
      const crankRadius = Math.max(crankPos.width, crankPos.height) / 2 + 20; // Add padding
      this.tutorialMaskGraphics.fillCircle(crankPos.x, crankPos.y, crankRadius);
    } else {
      // Fallback to calculated position
      const gameWidth = this.scene.cameras.main.width;
      const gameHeight = this.scene.cameras.main.height;
      const crankX = gameWidth * 0.7;
      const crankY = gameHeight * 0.6;
      this.tutorialMaskGraphics.fillCircle(crankX, crankY, 50);
    }
  }

  /**
   * Create mask for steering tutorial
   */
  private createSteeringMask() {
    // Create cutout around steering dial area
    this.tutorialMaskGraphics.fillStyle(this.config.maskColor);
    
    // Get steering dial position (left side of screen)
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Match GameUI dial placement (x: 0.3, y: 0.7) and knob radius (~80) with padding
    const steeringX = gameWidth * 0.3;
    const steeringY = gameHeight * 0.7;
    const radius = 80 + 16; // knobRadius + padding
    this.tutorialMaskGraphics.fillCircle(steeringX, steeringY, radius);
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
