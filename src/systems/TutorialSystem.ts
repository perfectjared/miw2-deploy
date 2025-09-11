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
}

export class TutorialSystem {
  private scene: Phaser.Scene;
  private config: TutorialConfig;
  
  // Visual Elements
  private tutorialOverlay!: Phaser.GameObjects.Container;
  private tutorialMaskGraphics!: Phaser.GameObjects.Graphics;
  
  // State Tracking
  private lastTutorialState: string = '';
  
  // Physics Object References (set by external system)
  private frontseatKeys: any = null;

  constructor(scene: Phaser.Scene, config: TutorialConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Initialize tutorial system
   */
  public initialize() {
    this.createTutorialOverlay();
  }

  /**
   * Set reference to physics objects
   */
  public setPhysicsObjects(frontseatKeys: any) {
    this.frontseatKeys = frontseatKeys;
  }

  /**
   * Update tutorial overlay based on current game state
   */
  public updateTutorialOverlay(state: TutorialState) {
    // Tutorial overlay disabled for debugging
    if (this.tutorialOverlay) {
      this.tutorialOverlay.setVisible(false);
    }
    return;
    // Determine which tutorial state to show
    let tutorialState: 'none' | 'keys-and-ignition' | 'ignition-menu' | 'crank' = 'none';
    
    if (state.hasOpenMenu) {
      // Menu is open - show tutorial for that specific menu
      if (state.currentMenuType === 'TURN_KEY') {
        tutorialState = 'ignition-menu';
      } else {
        // For other menus (START, PAUSE, SAVE, etc.), show appropriate tutorial
        tutorialState = 'none'; // No tutorial for these menus
      }
    } else if (state.carStarted) {
      // Car is started - check crank percentage
      if (state.crankPercentage < 40) {
        // Car started but crank below 40% - show crank tutorial
        tutorialState = 'crank';
      } else {
        // Car started and crank >= 40% - normal gameplay, no tutorial
        tutorialState = 'none';
      }
    } else if (state.keysInIgnition) {
      // Keys are in ignition but car not started - show ignition menu tutorial
      tutorialState = 'ignition-menu';
    } else {
      // Keys not in ignition - show both keys and ignition
      tutorialState = 'keys-and-ignition';
    }
    
    // Update overlay visibility and mask
    if (this.tutorialOverlay) {
      this.tutorialOverlay.setVisible(tutorialState !== 'none');
      
      if (tutorialState !== 'none') {
        this.updateTutorialMask(tutorialState);
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
   */
  private createTutorialOverlay() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    console.log('Creating unified tutorial overlay with dimensions:', gameWidth, gameHeight);
    
    // Create tutorial overlay container
    this.tutorialOverlay = this.scene.add.container(0, 0);
    this.tutorialOverlay.setDepth(this.config.overlayDepth); // Above everything
    
    // Create semi-transparent black overlay covering the screen
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(this.config.overlayColor, this.config.overlayAlpha).fillRect(0, 0, gameWidth, gameHeight);
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
  private updateTutorialMask(tutorialState: 'keys-and-ignition' | 'ignition-menu' | 'crank') {
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
      case 'ignition-menu':
        this.createIgnitionMask();
        break;
      case 'crank':
        this.createCrankMask();
        break;
    }
  }
  
  /**
   * Create mask for keys and ignition tutorial
   */
  private createKeysAndIgnitionMask() {
    // Create cutouts for both keys and ignition
    this.tutorialMaskGraphics.fillStyle(this.config.maskColor);
    
    // Keys cutout with 20% padding
    if (this.frontseatKeys?.gameObject) {
      const keysPos = this.frontseatKeys.gameObject;
      const keysHoleRadius = this.config.keysHoleRadius * 1.2; // 20% larger
      this.tutorialMaskGraphics.fillCircle(keysPos.x, keysPos.y, keysHoleRadius);
    }
    
    // Ignition cutout with 20% padding
    const ignitionX = this.config.magneticTargetX;
    const ignitionY = this.config.magneticTargetY;
    const ignitionHoleRadius = this.config.magneticTargetRadius * this.config.targetHoleMultiplier * 1.2; // 20% larger
    this.tutorialMaskGraphics.fillCircle(ignitionX, ignitionY, ignitionHoleRadius);
  }
  
  /**
   * Create mask for ignition menu tutorial
   */
  private createIgnitionMask() {
    // Create circular cutout around ignition (magnetic target)
    const ignitionX = this.config.magneticTargetX;
    const ignitionY = this.config.magneticTargetY;
    const holeRadius = this.config.magneticTargetRadius * this.config.targetHoleMultiplier * 1.2; // 20% larger
    
    this.tutorialMaskGraphics.fillStyle(this.config.maskColor);
    this.tutorialMaskGraphics.fillCircle(ignitionX, ignitionY, holeRadius);
  }
  
  /**
   * Create mask for crank tutorial
   */
  private createCrankMask() {
    // Create cutout around speed crank area
    // This would need to be implemented based on the speed crank position
    // For now, we'll create a placeholder cutout
    
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Placeholder position - would need actual crank position from CarMechanics
    const crankX = gameWidth * 0.7; // Right side of screen
    const crankY = gameHeight * 0.6; // Middle height
    
    this.tutorialMaskGraphics.fillStyle(this.config.maskColor);
    this.tutorialMaskGraphics.fillCircle(crankX, crankY, 50); // Placeholder radius
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
