/**
 * PHYSICS OBJECTS - INTERACTIVE PHYSICS ENTITIES
 * 
 * This module contains all the interactive physics objects in the game:
 * - Trash: Frontseat physics object (red circle)
 * - Item: Backseat physics object (green circle) 
 * - Keys: Ignition physics object (blue circle)
 * 
 * Each object implements drag interactions, physics properties,
 * and visual feedback for user interactions.
 * 
 * Key Features:
 * - Matter.js physics integration
 * - Drag and drop interactions
 * - Visual feedback (hover, drag states)
 * - Momentum-based movement
 * - Magnetic attraction system
 */

import Phaser from 'phaser';

// Base interface for physics objects
export interface PhysicsObject {
  gameObject: Phaser.GameObjects.Arc;
  setupDragInteraction(): void;
}

// Trash data type for frontseat
export class Trash implements PhysicsObject {
  public gameObject!: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createGameObject();
    this.setupPhysics();
    this.setupDragInteraction();
  }

  private createGameObject() {
    this.gameObject = this.scene.add.circle(
      100, // x position
      200, // y position
      20,  // radius
      0xff0000 // color (red)
    );
  }

  private setupPhysics() {
    this.scene.matter.add.gameObject(this.gameObject, {
      shape: 'circle',
      restitution: 0.3,
      friction: 0.1,
      density: 0.001
    });
  }

  setupDragInteraction() {
    const hoverColor = 0xff6666;
    const dragColor = 0xff3333;
    const originalColor = 0xff0000;
    
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    
    this.gameObject.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      this.gameObject.setFillStyle(dragColor);
      (this.scene as any).isDraggingObject = true;
      
      // Disable physics during drag
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = true;
      }
    });

    // Use global pointer move instead of object-specific
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        // Calculate velocity for momentum
        velocityX = pointer.x - lastPointerX;
        velocityY = pointer.y - lastPointerY;
        lastPointerX = pointer.x;
        lastPointerY = pointer.y;
        
        // Convert screen coordinates to container-relative coordinates for Trash
        this.gameObject.x = pointer.x;
        this.gameObject.y = pointer.y;
      }
    });

    // Use global pointer up instead of object-specific
    this.scene.input.on('pointerup', () => {
      if (isDragging) {
        isDragging = false;
        this.gameObject.setFillStyle(originalColor);
        (this.scene as any).isDraggingObject = false;
        
        // Re-enable physics and apply momentum
        if (this.gameObject.body) {
          (this.gameObject.body as any).isStatic = false;
          // Apply velocity as momentum
          this.scene.matter.body.setVelocity(this.gameObject.body as any, { x: velocityX * 0.1, y: velocityY * 0.1 });
        }
      }
    });

    // Hover effects
    this.gameObject.on('pointerover', () => {
      if (!isDragging) {
        this.gameObject.setFillStyle(hoverColor);
      }
    });

    this.gameObject.on('pointerout', () => {
      if (!isDragging) {
        this.gameObject.setFillStyle(originalColor);
      }
    });

    // Make the circle interactive
    this.gameObject.setInteractive({ useHandCursor: true });
    
    // Store original color for reference
    (this.gameObject as any).originalColor = originalColor;
  }
}

// Item data type for backseat
export class Item implements PhysicsObject {
  public gameObject!: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createGameObject();
    this.setupPhysics();
    this.setupDragInteraction();
  }

  private createGameObject() {
    this.gameObject = this.scene.add.circle(
      1200, // x position
      200,  // y position
      18,   // radius
      0x00ff00 // color (green)
    );
  }

  private setupPhysics() {
    this.scene.matter.add.gameObject(this.gameObject, {
      shape: 'circle',
      restitution: 0.3,
      friction: 0.1,
      density: 0.001
    });
  }

  setupDragInteraction() {
    const hoverColor = 0x66ff66;
    const dragColor = 0x33ff33;
    const originalColor = 0x00ff00;
    
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    
    this.gameObject.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      this.gameObject.setFillStyle(dragColor);
      (this.scene as any).isDraggingObject = true;
      
      // Disable physics during drag
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = true;
      }
    });

    // Use global pointer move instead of object-specific
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        // Calculate velocity for momentum
        velocityX = pointer.x - lastPointerX;
        velocityY = pointer.y - lastPointerY;
        lastPointerX = pointer.x;
        lastPointerY = pointer.y;
        
        // Convert screen coordinates to container-relative coordinates for Item
        this.gameObject.x = pointer.x;
        this.gameObject.y = pointer.y;
      }
    });

    // Use global pointer up instead of object-specific
    this.scene.input.on('pointerup', () => {
      if (isDragging) {
        isDragging = false;
        this.gameObject.setFillStyle(originalColor);
        (this.scene as any).isDraggingObject = false;
        
        // Re-enable physics and apply momentum
        if (this.gameObject.body) {
          (this.gameObject.body as any).isStatic = false;
          // Apply velocity as momentum
          this.scene.matter.body.setVelocity(this.gameObject.body as any, { x: velocityX * 0.1, y: velocityY * 0.1 });
        }
      }
    });

    // Hover effects
    this.gameObject.on('pointerover', () => {
      if (!isDragging) {
        this.gameObject.setFillStyle(hoverColor);
      }
    });

    this.gameObject.on('pointerout', () => {
      if (!isDragging) {
        this.gameObject.setFillStyle(originalColor);
      }
    });

    // Make the circle interactive
    this.gameObject.setInteractive({ useHandCursor: true });
    
    // Store original color for reference
    (this.gameObject as any).originalColor = originalColor;
  }
}

// Keys data type for frontseat
export class Keys implements PhysicsObject {
  public gameObject!: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createGameObject();
    this.setupPhysics();
    this.setupDragInteraction();
  }

  private createGameObject() {
    this.gameObject = this.scene.add.circle(
      200, // x position
      300, // y position
      15,  // radius
      0x0000ff // color (blue)
    );
  }

  private setupPhysics() {
    this.scene.matter.add.gameObject(this.gameObject, {
      shape: 'circle',
      restitution: 0.3,
      friction: 0.1,
      density: 0.001
    });
  }

  setupDragInteraction() {
    const hoverColor = 0x6666ff;
    const dragColor = 0x3333ff;
    const originalColor = 0x0000ff;
    
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    
    this.gameObject.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      (this.gameObject as any).isDragging = true; // Set flag on game object
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      this.gameObject.setFillStyle(dragColor);
      (this.scene as any).isDraggingObject = true;
      
      // Break constraint if Keys is snapped to magnetic target
      if ((this.scene as any).keysConstraint) {
        this.scene.matter.world.removeConstraint((this.scene as any).keysConstraint);
        (this.scene as any).keysConstraint = null;
        // Reflect state change immediately so tutorial can react
        (this.scene as any).keysInIgnition = false;
        if ((this.scene as any).gameState?.updateState) {
          (this.scene as any).gameState.updateState({ keysInIgnition: false });
        }
        // Close ignition menu if it was open
        if ((this.scene as any).closeCurrentMenu) {
          (this.scene as any).closeCurrentMenu();
        }
        // Request a debounced tutorial update if available
        if ((this.scene as any).scheduleTutorialUpdate) {
          (this.scene as any).scheduleTutorialUpdate(50);
        } else if ((this.scene as any).updateTutorialSystem) {
          (this.scene as any).time?.delayedCall(50, () => (this.scene as any).updateTutorialSystem());
        }
      }
      
      // Disable physics during drag
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = true;
      }
    });

    // Use global pointer move instead of object-specific
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isDragging) {
        // Calculate velocity for momentum
        velocityX = pointer.x - lastPointerX;
        velocityY = pointer.y - lastPointerY;
        lastPointerX = pointer.x;
        lastPointerY = pointer.y;
        
        // Convert screen coordinates to container-relative coordinates for Keys
        this.gameObject.x = pointer.x;
        this.gameObject.y = pointer.y;
        
        // Update tutorial mask in real-time
        const gameScene = this.scene.scene.get('GameScene');
        if (gameScene && (gameScene as any).tutorialSystem) {
          (gameScene as any).tutorialSystem.updateTutorialMaskRealTime();
        }
      }
    });

    // Use global pointer up instead of object-specific
    this.scene.input.on('pointerup', () => {
      if (isDragging) {
        isDragging = false;
        (this.gameObject as any).isDragging = false; // Clear flag
        this.gameObject.setFillStyle(originalColor);
        (this.scene as any).isDraggingObject = false;
        
        // Re-enable physics and apply momentum
        if (this.gameObject.body) {
          (this.gameObject.body as any).isStatic = false;
          // Apply velocity as momentum
          this.scene.matter.body.setVelocity(this.gameObject.body as any, { x: velocityX * 0.1, y: velocityY * 0.1 });
        }
      }
    });

    // Hover effects
    this.gameObject.on('pointerover', () => {
      if (!isDragging) {
        this.gameObject.setFillStyle(hoverColor);
      }
    });

    this.gameObject.on('pointerout', () => {
      if (!isDragging) {
        this.gameObject.setFillStyle(originalColor);
      }
    });

    // Make the circle interactive
    this.gameObject.setInteractive({ useHandCursor: true });
    
    // Store original color for reference
    (this.gameObject as any).originalColor = originalColor;
  }
}
