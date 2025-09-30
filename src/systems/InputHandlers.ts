/**
 * INPUT HANDLERS - USER INPUT MANAGEMENT
 * 
 * This module handles all user input including:
 * - Keyboard controls for driving and navigation
 * - Swipe gestures for view switching
 * - Drag interactions for physics objects
 * - Touch/mouse input coordination
 * - Input state management and validation
 * 
 * Key Features:
 * - Centralized input handling
 * - Input validation and conflict resolution
 * - Gesture recognition (swipe detection)
 * - Drag and drop coordination
 * - Keyboard shortcut management
 */

import Phaser from 'phaser';

// Tunable input handler constants
const INPUT_TUNABLES = {
  swipe: {
    requireInteractiveBypassNames: ['Button', 'Crank', 'Dial', 'Pet']
  }
} as const;

export interface InputHandlersConfig {
  // Swipe Parameters
  swipeMinDistance: number;
  swipeMaxTime: number;
  swipeThreshold: number;
  
  // Drag Parameters
  dragSensitivity: number;
  momentumMultiplier: number;
  
  // Keyboard Parameters
  enableKeyboardControls: boolean;
  enableSwipeControls: boolean;
}

export interface InputState {
  isDraggingObject: boolean;
  isKnobActive: boolean;
  keysConstraint: any;
  hasOpenMenu: boolean;
  currentMenuType: string | null;
}

export class InputHandlers {
  private scene: Phaser.Scene;
  private config: InputHandlersConfig;
  
  // Swipe tracking
  private swipeStartX: number = 0;
  private swipeStartY: number = 0;
  private swipeStartTime: number = 0;
  
  // Input state
  private isDraggingObject: boolean = false;
  private isKnobActive: boolean = false;
  
  // Event handlers
  private onSteeringInput?: (value: number) => void;
  private onSwipeLeft?: () => void;
  private onSwipeRight?: () => void;
  private onToggleDriving?: () => void;
  private onSwitchToFrontseat?: () => void;
  private onSwitchToBackseat?: () => void;

  constructor(scene: Phaser.Scene, config: InputHandlersConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Initialize input handlers
   */
  public initialize() {
    if (this.config.enableKeyboardControls) {
      this.setupKeyboardControls();
    }
    
    if (this.config.enableSwipeControls) {
      this.setupSwipeControls();
    }
  }

  /**
   * Set input state
   */
  public setInputState(state: InputState) {
    this.isDraggingObject = state.isDraggingObject;
    this.isKnobActive = state.isKnobActive;
  }

  /**
   * Set event callbacks
   */
  public setEventCallbacks(callbacks: {
    onSteeringInput?: (value: number) => void;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onToggleDriving?: () => void;
    onSwitchToFrontseat?: () => void;
    onSwitchToBackseat?: () => void;
  }) {
    this.onSteeringInput = callbacks.onSteeringInput;
    this.onSwipeLeft = callbacks.onSwipeLeft;
    this.onSwipeRight = callbacks.onSwipeRight;
    this.onToggleDriving = callbacks.onToggleDriving;
    this.onSwitchToFrontseat = callbacks.onSwitchToFrontseat;
    this.onSwitchToBackseat = callbacks.onSwitchToBackseat;
  }

  /**
   * Setup keyboard controls
   */
  private setupKeyboardControls() {
    // Space bar to toggle driving mode
    this.scene.input.keyboard?.on('keydown-SPACE', () => {
      if (this.onToggleDriving) {
        this.onToggleDriving();
      }
    });
    
    // Arrow keys for steering (when driving)
    this.scene.input.keyboard?.on('keydown-LEFT', () => {
      if (this.onSteeringInput) {
        this.onSteeringInput(-50);
      }
    });
    
    this.scene.input.keyboard?.on('keydown-RIGHT', () => {
      if (this.onSteeringInput) {
        this.onSteeringInput(50);
      }
    });
    
    // Release arrow keys
    this.scene.input.keyboard?.on('keyup-LEFT', () => {
      if (this.onSteeringInput) {
        this.onSteeringInput(0);
      }
    });
    
    this.scene.input.keyboard?.on('keyup-RIGHT', () => {
      if (this.onSteeringInput) {
        this.onSteeringInput(0);
      }
    });
    
    // Number keys removed - now used for pet menus
  }

  /**
   * Setup swipe controls
   */
  private setupSwipeControls() {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Don't start swipe tracking if knob is being used or dragging an object
      if (this.isKnobActive || this.isDraggingObject) return;
      
      // Check if clicking on interactive objects FIRST
      const hitObjects = this.scene.input.hitTestPointer(pointer);
      if (hitObjects.length > 0) {
        // Check if any hit object is interactive
        const hasInteractiveObject = hitObjects.some(obj => 
          obj.input?.enabled || 
          obj.body || // Matter.js objects have a body
          INPUT_TUNABLES.swipe.requireInteractiveBypassNames.some(key => obj.name?.includes(key))
        );
        if (hasInteractiveObject) {
          return;
        }
      }
      
      // Check if a menu dialog is currently open
      const menuScene = this.scene.scene.get('MenuScene');
      if (menuScene && menuScene.scene.isActive()) {
        const menuManager = (menuScene as any).menuManager;
        if (menuManager && menuManager.currentDialog) {
          return;
        }
      }
      
      // Only start swipe tracking if we're not clicking on interactive objects
      this.swipeStartX = pointer.x;
      this.swipeStartY = pointer.y;
      this.swipeStartTime = Date.now();
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.swipeStartTime === 0) return;
      
      const endX = pointer.x;
      const endY = pointer.y;
      const endTime = Date.now();
      
      const deltaX = endX - this.swipeStartX;
      const deltaY = endY - this.swipeStartY;
      const deltaTime = endTime - this.swipeStartTime;
      
      // Check if this qualifies as a swipe
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      
      if (distance >= this.config.swipeMinDistance && 
          deltaTime <= this.config.swipeMaxTime && 
          isHorizontalSwipe) {
        
        // Determine swipe direction
        if (deltaX > this.config.swipeThreshold) {
          // Swipe right
          if (this.onSwipeRight) {
            this.onSwipeRight();
          }
        } else if (deltaX < -this.config.swipeThreshold) {
          // Swipe left
          if (this.onSwipeLeft) {
            this.onSwipeLeft();
          }
        }
      }
      
      // Reset swipe tracking
      this.swipeStartTime = 0;
    });
  }

  /**
   * Handle drag start for physics objects
   */
  public handleDragStart(object: Phaser.GameObjects.GameObject, _pointer: Phaser.Input.Pointer) {
    this.isDraggingObject = true;
    
    // Disable physics during drag
    if ((object as any).body) {
      (object as any).body.isStatic = true;
    }
    
    // Set drag flag on object
    (object as any).isDragging = true;
  }

  /**
   * Handle drag move for physics objects
   */
  public handleDragMove(object: Phaser.GameObjects.GameObject, pointer: Phaser.Input.Pointer, lastPointerX: number, lastPointerY: number) {
    if (!this.isDraggingObject) return;
    
    // Calculate velocity for momentum
    const velocityX = pointer.x - lastPointerX;
    const velocityY = pointer.y - lastPointerY;
    
    // Update object position
    (object as any).x = pointer.x;
    (object as any).y = pointer.y;
    
    return { velocityX, velocityY };
  }

  /**
   * Handle drag end for physics objects
   */
  public handleDragEnd(object: Phaser.GameObjects.GameObject, velocityX: number, velocityY: number) {
    this.isDraggingObject = false;
    
    // Clear drag flag on object
    (object as any).isDragging = false;
    
    // Re-enable physics and apply momentum
    if ((object as any).body) {
      (object as any).body.isStatic = false;
      // Apply velocity as momentum
      this.scene.matter.body.setVelocity((object as any).body, { 
        x: velocityX * this.config.momentumMultiplier, 
        y: velocityY * this.config.momentumMultiplier 
      });
    }
  }

  /**
   * Handle knob interaction start
   */
  public handleKnobStart() {
    this.isKnobActive = true;
  }

  /**
   * Handle knob interaction end
   */
  public handleKnobEnd() {
    this.isKnobActive = false;
  }

  /**
   * Check if input is currently blocked
   */
  public isInputBlocked(): boolean {
    return this.isDraggingObject || this.isKnobActive;
  }

  /**
   * Check if swipe is currently being tracked
   */
  public isSwipeTracking(): boolean {
    return this.swipeStartTime > 0;
  }

  /**
   * Get current drag state
   */
  public isDragging(): boolean {
    return this.isDraggingObject;
  }

  /**
   * Get current knob state
   */
  public getKnobActive(): boolean {
    return this.isKnobActive;
  }

  /**
   * Reset input state
   */
  public resetInputState() {
    this.isDraggingObject = false;
    this.isKnobActive = false;
    this.swipeStartTime = 0;
  }

  /**
   * Clean up input handlers
   */
  public destroy() {
    // Remove keyboard event listeners
    this.scene.input.keyboard?.off('keydown-SPACE');
    this.scene.input.keyboard?.off('keydown-LEFT');
    this.scene.input.keyboard?.off('keydown-RIGHT');
    this.scene.input.keyboard?.off('keyup-LEFT');
    this.scene.input.keyboard?.off('keyup-RIGHT');
    this.scene.input.keyboard?.off('keydown-ONE');
    this.scene.input.keyboard?.off('keydown-TWO');
    this.scene.input.keyboard?.off('keydown-THREE');
    this.scene.input.keyboard?.off('keydown-FOUR');
    
    // Remove pointer event listeners
    this.scene.input.off('pointerdown');
    this.scene.input.off('pointerup');
    
    // Reset state
    this.resetInputState();
  }
}
