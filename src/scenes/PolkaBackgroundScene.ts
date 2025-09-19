import Phaser from 'phaser';

/**
 * PHASER POLKA DOT BACKGROUND SCENE
 * 
 * Creates pixel-perfect 1-bit dithered polka dots with precise drop shadows
 * Uses Phaser's Graphics API for exact pixel control
 */
export class PolkaBackgroundScene extends Phaser.Scene {
  private dots: Phaser.GameObjects.Graphics[] = [];
  private stepCounter: number = 0;
  private stepSize: number = 4; // Move every 4 steps
  private moveDistance: number = 2; // Pixels to move up and right
  
  constructor() {
    super({ key: 'PolkaBackground', active: false, visible: true });
  }

  create() {
    // Make this scene render behind all others
    this.scene.sendToBack();
    
    // Only create polka dots, not background (background is handled by CSS)
    this.createPolkaDots();
    console.log(`Created ${this.dots.length} polka dots in Phaser`);
  }

  /**
   * Create 1-bit dithered background pattern
   */
  private createDitheredBackground() {
    const bg = this.add.graphics();
    // Use actual screen dimensions, not game dimensions
    const width = this.scale.gameSize.width;
    const height = this.scale.gameSize.height;
    
    // Create light grey dithered pattern (25% black pixels)
    for (let x = 0; x < width; x += 2) {
      for (let y = 0; y < height; y += 2) {
        // Bayer 2x2 dithering matrix for 25% grey
        const pattern = [
          [0, 2],
          [3, 1]
        ];
        
        const threshold = 1; // 25% threshold (1 out of 4)
        const matrixX = (x / 2) % 2;
        const matrixY = (y / 2) % 2;
        
        if (pattern[matrixY][matrixX] > threshold) {
          bg.fillStyle(0x000000, 1);
          bg.fillRect(x, y, 1, 1);
        }
      }
    }
    
    bg.setDepth(-1000); // Far behind everything
  }

  /**
   * Create polka dots with dithered drop shadows
   */
  private createPolkaDots() {
    const spacing = 40; // Good spacing for 8x8 dots
    const dotSize = 8; // Exactly 8x8 pixels
    const margin = 20;
    
    // Use game area dimensions (360x640)
    const width = 360;
    const height = 640;
    
    for (let x = margin; x < width - margin; x += spacing) {
      for (let y = margin; y < height - margin; y += spacing) {
        this.createSingleDot(x, y, dotSize);
      }
    }
  }

  /**
   * Create a single 8x8 dot with 8x8 dithered drop shadow
   */
  private createSingleDot(x: number, y: number, size: number) {
    const dotContainer = this.add.graphics();
    
    // Create 8x8 dithered drop shadow first (offset by 2,2)
    this.createDitheredShadow(dotContainer, x + 2, y + 2, size);
    
    // Create solid black circle using Phaser's built-in circle function
    // Size 8 means diameter 8, so radius should be 4
    dotContainer.fillStyle(0x000000, 1);
    dotContainer.fillCircle(x, y, 4); // 4 pixel radius = 8 pixel diameter
    
    // Store original position for step-based movement
    (dotContainer as any).originalX = x;
    (dotContainer as any).originalY = y;
    (dotContainer as any).stepOffset = 0;
    
    this.dots.push(dotContainer);
    dotContainer.setDepth(-100); // Behind game content
  }

  /**
   * Create 8x8 dithered shadow using precise pixel placement
   */
  private createDitheredShadow(graphics: Phaser.GameObjects.Graphics, centerX: number, centerY: number, size: number) {
    // Create exactly 8x8 pixel shadow
    const shadowSize = 8;
    const offsetX = 2; // Shadow offset
    const offsetY = 2;
    
    // Bayer 4x4 dithering matrix for better 8x8 pattern
    const bayerMatrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5]
    ];
    
    // Create 8x8 dithered shadow (50% grey)
    for (let x = 0; x < shadowSize; x++) {
      for (let y = 0; y < shadowSize; y++) {
        const threshold = 8; // 50% threshold (8 out of 16)
        const matrixX = x % 4;
        const matrixY = y % 4;
        
        if (bayerMatrix[matrixY][matrixX] < threshold) {
          graphics.fillStyle(0x000000, 1);
          graphics.fillRect(centerX + offsetX + x - shadowSize/2, centerY + offsetY + y - shadowSize/2, 1, 1);
        }
      }
    }
  }

  /**
   * Handle step-based movement
   */
  step() {
    this.stepCounter++;
    if (this.stepCounter % this.stepSize === 0) {
      this.moveDots();
      console.log(`Step ${this.stepCounter}: Moving dots up and right`);
    }
  }

  /**
   * Move all dots instantly (no animation)
   */
  private moveDots() {
    this.dots.forEach(dot => {
      const originalX = (dot as any).originalX;
      const originalY = (dot as any).originalY;
      let stepOffset = (dot as any).stepOffset;
      
      stepOffset += this.moveDistance;
      (dot as any).stepOffset = stepOffset;
      
      // Calculate new position (up and right)
      const newX = originalX + stepOffset;
      const newY = originalY - stepOffset;
      
      // Move instantly
      dot.x = newX - originalX;
      dot.y = newY - originalY;
    });
  }

  /**
   * Clean up when scene is destroyed
   */
  shutdown() {
    this.dots.forEach(dot => dot.destroy());
    this.dots = [];
  }
}

// Export singleton reference for step control
export let polkaBackgroundScene: PolkaBackgroundScene | null = null;

export function setPolkaBackgroundScene(scene: PolkaBackgroundScene) {
  polkaBackgroundScene = scene;
}
