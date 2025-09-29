import { gameElements } from '../config/GameElements';

export interface PhysicsObject {
  gameObject: Phaser.GameObjects.Arc;
  setupDragInteraction(): void;
}

export class Phone implements PhysicsObject {
  public gameObject!: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createGameObject();
    this.setupPhysics();
    this.setupDragInteraction();
  }

  private createGameObject() {
    // Use GameElements config for item size
    const itemSize = gameElements.getItemSize('small');
    const radius = itemSize.width / 2; // Convert width to radius
    
    // Position phone on left side but still visible (20% of screen width)
    const gameWidth = this.scene.cameras.main.width;
    const phoneX = gameWidth * 0.2; // 20% from left edge (left side but visible)
    
    this.gameObject = this.scene.add.circle(
      phoneX, // x position - left side but visible
      250, // y position
      radius,  // radius from config
      0x00aaff // color (blue for phone)
    );
    // Set initial depth above other items
    this.gameObject.setDepth(60000);
  }

  private setupPhysics() {
    this.scene.matter.add.gameObject(this.gameObject, {
      shape: 'circle',
      restitution: 0.15,
      friction: 0.2,
      density: 0.01
    });
    if (this.gameObject.body) {
      (this.gameObject.body as any).frictionAir = 0.03;
    }
  }

  setupDragInteraction() {
    const hoverColor = 0x66aaff;
    const dragColor = 0x3388ff;
    const originalColor = 0x00aaff;
    
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let pointerBody: any = null;
    let dragConstraint: any = null;
    
    this.gameObject.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      (this.gameObject as any).isDragging = true;
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
        this.gameObject.setDepth(110000); // Above all UI elements including steering wheel
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
      const onPointerMove = (pointer: Phaser.Input.Pointer) => {
        if (isDragging && pointerBody) {
          this.scene.matter.body.setPosition(pointerBody, { x: pointer.x, y: pointer.y });
          const deltaX = pointer.x - lastPointerX;
          const deltaY = pointer.y - lastPointerY;
          velocityX = deltaX;
          velocityY = deltaY;
          lastPointerX = pointer.x;
          lastPointerY = pointer.y;
        }
      };

      const onPointerUp = () => {
        if (isDragging) {
          isDragging = false;
          (this.gameObject as any).isDragging = false;
          this.gameObject.setFillStyle(originalColor);
          (this.scene as any).isDraggingObject = false;
          if ((this.scene as any).draggingItem === this.gameObject) {
            (this.scene as any).draggingItem = null;
          }
          (this.gameObject as any)._hasFedWhileOver = false;
          // If the item still exists (not fed/destroyed), keep it in main scene at high depth for a moment
          if (this.gameObject && this.gameObject.scene) {
            const od = (this.gameObject as any)._originalDepth;
            this.gameObject.setDepth(110000); // Above all UI elements including steering wheel
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
          
          // Apply momentum to the physics body
          if (this.gameObject.body) {
            this.scene.matter.body.setVelocity(this.gameObject.body, { x: velocityX * 5, y: velocityY * 5 });
          }
        }
        
        // Remove the transient handlers
        this.scene.input.off('pointermove', onPointerMove);
        this.scene.input.off('pointerup', onPointerUp);
      };

      // Add the transient handlers
      this.scene.input.on('pointermove', onPointerMove);
      this.scene.input.on('pointerup', onPointerUp);
    });

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

    this.gameObject.setInteractive({ useHandCursor: true });
    (this.gameObject as any).originalColor = originalColor;
  }
}
