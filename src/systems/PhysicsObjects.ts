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
      40,  // radius (2/3 of previous: was 60, now 40)
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
    let pointerBody: any = null;
    let dragConstraint: any = null;
    
    this.gameObject.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      this.gameObject.setFillStyle(dragColor);
      (this.scene as any).isDraggingObject = true;
      // Track currently dragged item globally for GameScene hover logic
      (this.scene as any).draggingItem = this.gameObject;
      (this.gameObject as any)._hasFedWhileOver = false;
      // Move to drag overlay container if present, else raise depth
      const gameScene = this.scene.scene.get('GameScene');
      (this.gameObject as any)._originalDepth = this.gameObject.depth;
      (this.gameObject as any)._originalParent = (this.gameObject as any).parentContainer || null;
      if (gameScene && (gameScene as any).dragOverlay) {
        const parent: any = (this.gameObject as any).parentContainer;
        if (parent) parent.remove(this.gameObject);
        (gameScene as any).dragOverlay.add(this.gameObject);
      } else {
        this.gameObject.setDepth(60001);
        this.scene.children.bringToTop(this.gameObject);
      }
      
      // Springy drag: create a static pointer body and a soft constraint to the object
      if (this.gameObject.body && !pointerBody) {
        pointerBody = this.scene.matter.add.circle(pointer.x, pointer.y, 1, {
          isStatic: true,
          isSensor: true,
          collisionFilter: { group: 0, category: 0x0001, mask: 0x0000 }
        });
        // Short, stiff spring for tighter follow
        dragConstraint = this.scene.matter.add.constraint(pointerBody, this.gameObject.body as any, 0, 0.02, { damping: 0.15 });
      }

      // Register transient move/up handlers for this drag only
      const moveHandler = (p: Phaser.Input.Pointer) => {
        if (!isDragging) return;
        velocityX = p.x - lastPointerX;
        velocityY = p.y - lastPointerY;
        lastPointerX = p.x;
        lastPointerY = p.y;
        if (pointerBody) this.scene.matter.body.setPosition(pointerBody, { x: p.x, y: p.y });
      };
      const upHandler = () => {
        if (!isDragging) return;
        isDragging = false;
        this.gameObject.setFillStyle(originalColor);
        (this.scene as any).isDraggingObject = false;
        if (!this.gameObject.scene) { cleanup(); return; }
        const originalParent: any = (this.gameObject as any)._originalParent;
        if (originalParent) {
          const overlayParent: any = (this.gameObject as any).parentContainer;
          if (overlayParent) overlayParent.remove(this.gameObject);
          originalParent.add(this.gameObject);
          (this.gameObject as any)._originalParent = null;
        }
        const od = (this.gameObject as any)._originalDepth;
        if (typeof od === 'number') this.gameObject.setDepth(od);
        if (dragConstraint) {
          this.scene.matter.world.removeConstraint(dragConstraint);
          dragConstraint = null;
        }
        if (pointerBody) {
          this.scene.matter.world.remove(pointerBody);
          pointerBody = null;
        }
        if (this.gameObject.body) {
          this.scene.matter.body.setVelocity(this.gameObject.body as any, { x: velocityX * 0.1, y: velocityY * 0.1 });
        }
        cleanup();
      };
      const cleanup = () => {
        this.scene.input.off('pointermove', moveHandler as any, undefined, false as any);
        this.scene.input.off('pointerup', upHandler as any, undefined, false as any);
      };
      this.scene.input.on('pointermove', moveHandler);
      this.scene.input.once('pointerup', upHandler);
    });

    // Hover effects (throttled to reduce cost when console is open)
    let lastHoverSet = 0;
    const hoverInterval = 100; // ms
    this.gameObject.on('pointerover', () => {
      const now = Date.now();
      if (now - lastHoverSet > hoverInterval && !isDragging) {
        this.gameObject.setFillStyle(hoverColor);
        lastHoverSet = now;
      }
    });

    this.gameObject.on('pointerout', () => {
      const now = Date.now();
      if (now - lastHoverSet > hoverInterval && !isDragging) {
        this.gameObject.setFillStyle(originalColor);
        lastHoverSet = now;
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
  private feedingTimer?: Phaser.Time.TimerEvent;

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
      const gameScene = this.scene.scene.get('GameScene');
      (this.gameObject as any)._originalDepth = this.gameObject.depth;
      (this.gameObject as any)._originalParent = (this.gameObject as any).parentContainer || null;
      if (gameScene && (gameScene as any).dragOverlay) {
        const parent: any = (this.gameObject as any).parentContainer;
        if (parent) parent.remove(this.gameObject);
        (gameScene as any).dragOverlay.add(this.gameObject);
      } else {
        this.gameObject.setDepth(60001);
        this.scene.children.bringToTop(this.gameObject);
      }
      
      // Springy drag: create a static pointer body and a soft constraint to the object
      if (this.gameObject.body && !pointerBody) {
        pointerBody = this.scene.matter.add.circle(pointer.x, pointer.y, 1, {
          isStatic: true,
          isSensor: true,
          collisionFilter: { group: 0, category: 0x0001, mask: 0x0000 }
        });
        // Short, stiffer spring to follow pointer closely
        dragConstraint = this.scene.matter.add.constraint(pointerBody, this.gameObject.body as any, 0, 0.02, { damping: 0.15 });
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
        
        // Move pointer body; constraint pulls the item for a springy effect
        if (pointerBody) this.scene.matter.body.setPosition(pointerBody, { x: pointer.x, y: pointer.y });

        // Feeding interaction handled at GameScene level via pointer hover.
        const gameScene = this.scene.scene.get('GameScene');
        const pet = gameScene && (gameScene as any).getVirtualPet?.();
        if (pet) {
          // Use screen-space bounds for pet (HUD camera) and item (drag overlay camera)
          const pb = pet.getScreenBounds?.();
          if (pb) {
            const ib = this.gameObject.getBounds();
            // Inflate pet bounds generously to account for camera differences
            Phaser.Geom.Rectangle.Inflate(pb, 24, 24);
            const hitRect = Phaser.Geom.Intersects.RectangleToRectangle(ib, pb);
            // Also check circle-to-rectangle using item center/radius
            const radius: number = (this.gameObject as any).radius ?? (this.gameObject.displayWidth / 2);
            const circ = new Phaser.Geom.Circle(this.gameObject.x, this.gameObject.y, radius);
            const hitCirc = Phaser.Geom.Intersects.CircleToRectangle(circ, pb);
            // Draw debug outlines and hover
            // Force debug outline visible every move so it's persistent
            (pet as any).setDebugBoundsVisible?.(true);
            const pointerX = pointer.x;
            const pointerY = pointer.y;
            const overByPointer = pet.isPointerOver?.(pointerX, pointerY) ?? false;
            pet.setHover?.(overByPointer);
            // Do not feed/destroy here; GameScene pointermove handles one-shot feeding
          }
        }
      }
    });

    // Use global pointer up instead of object-specific
    this.scene.input.on('pointerup', () => {
      if (isDragging) {
        isDragging = false;
        if (this.gameObject && this.gameObject.scene) {
          this.gameObject.setFillStyle(originalColor);
        }
        (this.scene as any).isDraggingObject = false;
        if ((this.scene as any).draggingItem === this.gameObject) {
          (this.scene as any).draggingItem = null;
        }
        (this.gameObject as any)._hasFedWhileOver = false;
        // If the item still exists (not fed/destroyed), keep it in main scene at high depth for a moment
        if (this.gameObject && this.gameObject.scene) {
          const od = (this.gameObject as any)._originalDepth;
          this.gameObject.setDepth(60001);
          // Restore original depth after short delay
          this.scene.time.delayedCall(100, () => {
            if (this.gameObject && this.gameObject.scene) {
              if (typeof od === 'number') this.gameObject.setDepth(od);
            }
          });
          // Restore parent
          const originalParent: any = (this.gameObject as any)._originalParent;
          if (originalParent) {
            const overlayParent: any = (this.gameObject as any).parentContainer;
            if (overlayParent) overlayParent.remove(this.gameObject);
            originalParent.add(this.gameObject);
            (this.gameObject as any)._originalParent = null;
          }
        }
        
        // Cleanup springy drag helpers and apply momentum to object body
        if (dragConstraint) {
          this.scene.matter.world.removeConstraint(dragConstraint);
          dragConstraint = null;
        }
        if (pointerBody) {
          this.scene.matter.world.remove(pointerBody);
          pointerBody = null;
        }
        if (this.gameObject && this.gameObject.scene && this.gameObject.body) {
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
    let pointerBody: any = null;
    let dragConstraint: any = null;
    
    this.gameObject.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      (this.gameObject as any).isDragging = true; // Set flag on game object
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      this.gameObject.setFillStyle(dragColor);
      (this.scene as any).isDraggingObject = true;
      const gameScene = this.scene.scene.get('GameScene');
      (this.gameObject as any)._originalDepth = this.gameObject.depth;
      (this.gameObject as any)._originalParent = (this.gameObject as any).parentContainer || null;
      if (gameScene && (gameScene as any).dragOverlay) {
        const parent: any = (this.gameObject as any).parentContainer;
        if (parent) parent.remove(this.gameObject);
        (gameScene as any).dragOverlay.add(this.gameObject);
      } else {
        this.gameObject.setDepth(60001);
        this.scene.children.bringToTop(this.gameObject);
      }
      
      // Break constraint if Keys is snapped to magnetic target
      if ((this.scene as any).keysConstraint) {
        this.scene.matter.world.removeConstraint((this.scene as any).keysConstraint);
        (this.scene as any).keysConstraint = null;
        // Restore key physics & collisions
        if (this.gameObject.body) {
          const keyBody = this.gameObject.body as any;
          keyBody.isStatic = false;
          if (keyBody._originalCollisionFilter) {
            keyBody.collisionFilter = { ...keyBody._originalCollisionFilter };
          } else {
            keyBody.collisionFilter = { group: 0, category: 0x0001, mask: 0xFFFF };
          }
          keyBody.isSensor = !!keyBody._originalIsSensor;
        }
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
      
      // Springy drag: create a static pointer body and a soft constraint to the object
      if (this.gameObject.body && !pointerBody) {
        pointerBody = this.scene.matter.add.circle(pointer.x, pointer.y, 1, {
          isStatic: true,
          isSensor: true,
          collisionFilter: { group: 0, category: 0x0001, mask: 0x0000 }
        });
        // Match food/trash behavior: short, stiffer spring for tighter follow
        dragConstraint = this.scene.matter.add.constraint(pointerBody, this.gameObject.body as any, 0, 0.02, { damping: 0.15 });
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
        
        // Move pointer body; constraint pulls the item for a springy effect
        if (pointerBody) this.scene.matter.body.setPosition(pointerBody, { x: pointer.x, y: pointer.y });
        
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
        // Mark release time for attraction window
        (this.gameObject as any)._justReleasedAt = Date.now();
        this.gameObject.setFillStyle(originalColor);
        (this.scene as any).isDraggingObject = false;
        const originalParent: any = (this.gameObject as any)._originalParent;
        if (originalParent) {
          const overlayParent: any = (this.gameObject as any).parentContainer;
          if (overlayParent) overlayParent.remove(this.gameObject);
          originalParent.add(this.gameObject);
          (this.gameObject as any)._originalParent = null;
        } else {
          const od = (this.gameObject as any)._originalDepth;
          if (typeof od === 'number') this.gameObject.setDepth(od);
        }
        
        // Cleanup springy drag helpers and apply momentum to object body
        if (dragConstraint) {
          this.scene.matter.world.removeConstraint(dragConstraint);
          dragConstraint = null;
        }
        if (pointerBody) {
          this.scene.matter.world.remove(pointerBody);
          pointerBody = null;
        }
        if (this.gameObject.body) {
          (this.gameObject.body as any).isStatic = false;
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
