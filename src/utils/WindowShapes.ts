/**
 * WINDOW SHAPES UTILITY
 * 
 * Creates arbitrary shapes for menu window boundaries using Phaser graphics.
 * Provides a flexible system for drawing bordered windows with black strokes.
 * 
 * Features:
 * - Rectangle windows with customizable borders
 * - Rounded corner rectangles
 * - Arbitrary polygon shapes
 * - Consistent styling and stroke properties
 */

import Phaser from 'phaser';

export interface WindowShapeConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth?: number;
  strokeColor?: number;
  fillColor?: number;
  fillAlpha?: number;
  cornerRadius?: number;
}

export interface PolygonWindowConfig {
  points: { x: number; y: number }[];
  strokeWidth?: number;
  strokeColor?: number;
  fillColor?: number;
  fillAlpha?: number;
}

export class WindowShapes {
  private scene: Phaser.Scene;
  private activeShapes: Map<string, { graphics: Phaser.GameObjects.Graphics, config: WindowShapeConfig }> = new Map();
  // Shape animation tracking
  private activeSpeechBubbles = new Map<string, { graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number }>();
  private activeAnimatedShapes = new Map<string, { graphics: Phaser.GameObjects.Graphics, shapeType: string, x: number, y: number, width: number, height: number }>();
  private activeSteeringWheels = new Map<string, { graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, currentRotation: number }>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create a "collage-style" rectangle with organic polygon border
   * This is the main method you'll want to use for UI elements
   */
  createCollageRect(config: WindowShapeConfig, enableAnimation: boolean = false, shapeType: string = 'rectangle'): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    
    // Set default values - now defaults to darker grey for backgrounds
    const strokeWidth = config.strokeWidth || 2;
    const strokeColor = config.strokeColor || 0x000000; // Black
    const fillColor = config.fillColor || 0xd0d0d0; // Darker grey default
    const fillAlpha = config.fillAlpha !== undefined ? config.fillAlpha : 1.0; // Fully opaque by default
    
    // Create polygon points with extra random points along edges
    const offset = 5; // Make polygon 5 pixels larger on each side
    const polygonPoints = [];
    
    // Add random extra points (1.5 to 2.3 times original = 6-9 total points)
    const extraPointCount = Phaser.Math.Between(2, 5);
    
    // Create arrays for points along each edge
    const topEdgePoints = [];
    const rightEdgePoints = [];
    const bottomEdgePoints = [];
    const leftEdgePoints = [];
    
    // Always include corners with random movement (ensuring they stay outside rectangle)
    topEdgePoints.push({ 
      x: config.x - offset + Phaser.Math.Between(-5, -2), // Move further left from rectangle
      y: config.y - offset + Phaser.Math.Between(-5, -2)  // Move further up from rectangle
    }); // Top-left corner
    rightEdgePoints.push({ 
      x: config.x + config.width + offset + Phaser.Math.Between(2, 5), // Move further right from rectangle
      y: config.y - offset + Phaser.Math.Between(-5, -2)  // Move further up from rectangle
    }); // Top-right corner
    bottomEdgePoints.push({ 
      x: config.x + config.width + offset + Phaser.Math.Between(2, 5), // Move further right from rectangle
      y: config.y + config.height + offset + Phaser.Math.Between(2, 5) // Move further down from rectangle
    }); // Bottom-right corner
    leftEdgePoints.push({ 
      x: config.x - offset + Phaser.Math.Between(-5, -2), // Move further left from rectangle
      y: config.y + config.height + offset + Phaser.Math.Between(2, 5) // Move further down from rectangle
    }); // Bottom-left corner
    
    // Add random extra points to edges
    for (let i = 0; i < extraPointCount; i++) {
      const edgeIndex = Phaser.Math.Between(0, 3);
      
      switch (edgeIndex) {
        case 0: // Top edge - ensure points stay above rectangle
          topEdgePoints.push({
            x: Phaser.Math.Between(config.x - offset + 10, config.x + config.width + offset - 10) + Phaser.Math.Between(-4, 4),
            y: config.y - offset + Phaser.Math.Between(-8, -2) // Always above rectangle
          });
          break;
        case 1: // Right edge - ensure points stay right of rectangle
          rightEdgePoints.push({
            x: config.x + config.width + offset + Phaser.Math.Between(2, 8), // Always right of rectangle
            y: Phaser.Math.Between(config.y - offset + 10, config.y + config.height + offset - 10) + Phaser.Math.Between(-4, 4)
          });
          break;
        case 2: // Bottom edge - ensure points stay below rectangle
          bottomEdgePoints.push({
            x: Phaser.Math.Between(config.x - offset + 10, config.x + config.width + offset - 10) + Phaser.Math.Between(-4, 4),
            y: config.y + config.height + offset + Phaser.Math.Between(2, 8) // Always below rectangle
          });
          break;
        case 3: // Left edge - ensure points stay left of rectangle
          leftEdgePoints.push({
            x: config.x - offset + Phaser.Math.Between(-8, -2), // Always left of rectangle
            y: Phaser.Math.Between(config.y - offset + 10, config.y + config.height + offset - 10) + Phaser.Math.Between(-4, 4)
          });
          break;
      }
    }
    
    // Sort points along each edge to maintain proper order
    topEdgePoints.sort((a, b) => a.x - b.x); // Left to right
    rightEdgePoints.sort((a, b) => a.y - b.y); // Top to bottom
    bottomEdgePoints.sort((a, b) => b.x - a.x); // Right to left
    leftEdgePoints.sort((a, b) => b.y - a.y); // Bottom to top
    
    // Combine all points in clockwise order
    polygonPoints.push(...topEdgePoints);
    polygonPoints.push(...rightEdgePoints);
    polygonPoints.push(...bottomEdgePoints);
    polygonPoints.push(...leftEdgePoints);
    
    // First, draw the drop shadow (offset down and to the right)
    const shadowOffset = 6; // Increased offset for more visibility
    graphics.fillStyle(0x222222, 1.0); // Darker shadow for better contrast
    graphics.beginPath();
    graphics.moveTo(polygonPoints[0].x + shadowOffset, polygonPoints[0].y + shadowOffset);
    for (let i = 1; i < polygonPoints.length; i++) {
      graphics.lineTo(polygonPoints[i].x + shadowOffset, polygonPoints[i].y + shadowOffset);
    }
    graphics.closePath();
    graphics.fillPath(); // Fill the shadow
    
    // Then draw the main polygon border
    graphics.lineStyle(strokeWidth, strokeColor);
    graphics.fillStyle(fillColor, fillAlpha); // Set fill style for polygon
    graphics.beginPath();
    graphics.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonPoints.length; i++) {
      graphics.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    graphics.closePath();
    graphics.fillPath(); // Fill the polygon with white
    graphics.strokePath(); // Then stroke the black outline
    
    // Then draw the filled rectangle on top (NO STROKE, only fill) - use EXACT same fill settings
    graphics.fillStyle(fillColor, fillAlpha); // Explicitly set the same fill style
    graphics.fillRect(config.x, config.y, config.width, config.height);
    
    // Register for animation if enabled
    if (enableAnimation) {
      const shapeId = `animated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.registerAnimatedShape(shapeId, graphics, shapeType, config.x, config.y, config.width, config.height);
      
      // Store the ID for cleanup
      (graphics as any).animationId = shapeId;
      
      // Add cleanup when graphics is destroyed
      graphics.on('destroy', () => {
        this.unregisterAnimatedShape(shapeId);
      });
    }
    
    return graphics;
  }

  /**
   * Create a speech bubble shape with organic jagged borders and a tail (flipped upside down)
   */
  createCollageSpeechBubble(x: number, y: number, width: number, height: number): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    
    // Set styling
    const strokeWidth = 2;
    const strokeColor = 0x000000; // Black
    const fillColor = 0xffffff; // White fill as requested
    const fillAlpha = 1.0;
    
    // Create simplified speech bubble shape with fewer, more jagged points (FLIPPED UPSIDE DOWN)
    const bubblePoints = [];
    
    // Start from bottom edge (was top) - 3-4 points
    bubblePoints.push({ x: x + 20 + Phaser.Math.Between(-5, 5), y: y + height + Phaser.Math.Between(-3, 3) });
    bubblePoints.push({ x: x + width * 0.5 + Phaser.Math.Between(-8, 8), y: y + height + Phaser.Math.Between(2, 5) });
    bubblePoints.push({ x: x + width - 20 + Phaser.Math.Between(-5, 5), y: y + height + Phaser.Math.Between(-3, 3) });
    
    // Right edge - 2-3 points  
    bubblePoints.push({ x: x + width + Phaser.Math.Between(-3, 3), y: y + height * 0.7 + Phaser.Math.Between(-8, 8) });
    bubblePoints.push({ x: x + width + Phaser.Math.Between(-5, 2), y: y + height * 0.3 + Phaser.Math.Between(-8, 8) });
    
    // Top-right to tail connection (tail now points up)
    bubblePoints.push({ x: x + width * 0.8 + Phaser.Math.Between(-5, 5), y: y + Phaser.Math.Between(-3, 3) });
    
    // Speech bubble tail pointing UP (flipped from down)
    bubblePoints.push({ x: x + width * 0.7 + Phaser.Math.Between(-8, 8), y: y - 15 + Phaser.Math.Between(-5, 5) });
    bubblePoints.push({ x: x + width * 0.6 + Phaser.Math.Between(-5, 5), y: y - 25 + Phaser.Math.Between(-7, -3) });
    bubblePoints.push({ x: x + width * 0.65 + Phaser.Math.Between(-8, 8), y: y + Phaser.Math.Between(-2, 2) });
    
    // Top edge (was bottom) - left side
    bubblePoints.push({ x: x + width * 0.3 + Phaser.Math.Between(-5, 5), y: y + Phaser.Math.Between(-3, 3) });
    bubblePoints.push({ x: x + 20 + Phaser.Math.Between(-5, 5), y: y + Phaser.Math.Between(-3, 3) });
    
    // Left edge - 2-3 points
    bubblePoints.push({ x: x + Phaser.Math.Between(-3, 3), y: y + height * 0.3 + Phaser.Math.Between(-8, 8) });
    bubblePoints.push({ x: x + Phaser.Math.Between(-5, 2), y: y + height * 0.7 + Phaser.Math.Between(-8, 8) });
    
    // Back to bottom (was top)
    bubblePoints.push({ x: x + Phaser.Math.Between(-3, 3), y: y + height - 20 + Phaser.Math.Between(-5, 5) });
    
    // Draw shadow first
    const shadowOffset = 6;
    graphics.fillStyle(0x222222, 1.0);
    graphics.beginPath();
    graphics.moveTo(bubblePoints[0].x + shadowOffset, bubblePoints[0].y + shadowOffset);
    for (let i = 1; i < bubblePoints.length; i++) {
      graphics.lineTo(bubblePoints[i].x + shadowOffset, bubblePoints[i].y + shadowOffset);
    }
    graphics.closePath();
    graphics.fillPath();
    
    // Draw main speech bubble
    graphics.lineStyle(strokeWidth, strokeColor);
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.beginPath();
    graphics.moveTo(bubblePoints[0].x, bubblePoints[0].y);
    for (let i = 1; i < bubblePoints.length; i++) {
      graphics.lineTo(bubblePoints[i].x, bubblePoints[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    
    return graphics;
  }

  /**
   * Generate a random window composition for testing
   */
  createRandomTestWindow(): Phaser.GameObjects.Container {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Random position and size
    const width = Phaser.Math.Between(200, 350);
    const height = Phaser.Math.Between(150, 250);
    const x = Phaser.Math.Between(50, gameWidth - width - 50);
    const y = Phaser.Math.Between(50, gameHeight - height - 50);
    
    // Pick a random composition type based on RexUI patterns
    const compositions = [
      'dialog',
      'confirmDialog', 
      'menu',
      'panel',
      'messageBox',
      'speechBubble'
    ];
    
    const randomComposition = Phaser.Utils.Array.GetRandom(compositions);
    
    switch (randomComposition) {
      case 'dialog':
        return this.createDialogComposition(x, y, width, height);
        
      case 'confirmDialog':
        return this.createConfirmDialogComposition(x, y, width, height);
        
      case 'menu':
        const buttonCount = Phaser.Math.Between(2, 5);
        const menuHeight = Math.max(height, 120 + buttonCount * 45); // Ensure enough height for buttons
        return this.createMenuComposition(x, y, width, menuHeight);
        
      case 'panel':
        return this.createPanelComposition(x, y, width, height);
        
      case 'messageBox':
        return this.createMessageBoxComposition(x, y, width, height);
      
      case 'speechBubble':
        return this.createSpeechBubbleComposition(x, y, width, height);
        
      default:
        return this.createDialogComposition(x, y, width, height);
    }
  }

  /**
   * Create a collage button - white fill for interactive elements
   */
  createCollageButton(x: number, y: number, width: number = 80, height: number = 30): Phaser.GameObjects.Graphics {
    return this.createCollageRect({ 
      x, y, width, height, 
      fillColor: 0xffffff // White for buttons
    }, true, 'button'); // Enable animation for buttons too!
  }

  /**
   * Create a collage panel - darker grey fill for background panels
   */
  createCollagePanel(x: number, y: number, width: number, height: number): Phaser.GameObjects.Graphics {
    return this.createCollageRect({ 
      x, y, width, height, 
      fillColor: 0xd0d0d0 // Darker grey for panels
    });
  }

  /**
   * Create a collage dialog with title bar - darker grey background
   */
  createCollageDialog(x: number, y: number, width: number, height: number, titleBarHeight: number = 24): Phaser.GameObjects.Graphics {
    const graphics = this.createCollageRect({ 
      x, y, width, height,
      fillColor: 0xd0d0d0 // Darker grey for dialog backgrounds
    });
    
    // Add title bar separator (thin line)
    graphics.lineStyle(1, 0x000000);
    graphics.lineBetween(x, y + titleBarHeight, x + width, y + titleBarHeight);
    
    return graphics;
  }

  /**
   * Regenerate the polygon shape of an existing collage rect (for beat animations)
   * Keeps the same rectangle size, just changes the organic border
   */
  regeneratePolygonShape(graphics: Phaser.GameObjects.Graphics, config: WindowShapeConfig): void {
    // Clear the existing graphics
    graphics.clear();
    
    // Set default values
    const strokeWidth = config.strokeWidth || 2;
    const strokeColor = config.strokeColor || 0x000000; // Black
    const fillColor = config.fillColor || 0xd0d0d0; // Darker grey default
    const fillAlpha = config.fillAlpha !== undefined ? config.fillAlpha : 1.0; // Fully opaque by default
    
    // Create NEW polygon points with different random values
    const offset = 5;
    const polygonPoints = [];
    const extraPointCount = Phaser.Math.Between(2, 5);
    
    // Create arrays for points along each edge
    const topEdgePoints = [];
    const rightEdgePoints = [];
    const bottomEdgePoints = [];
    const leftEdgePoints = [];
    
    // Always include corners with NEW random movement
    topEdgePoints.push({ 
      x: config.x - offset + Phaser.Math.Between(-5, -2),
      y: config.y - offset + Phaser.Math.Between(-5, -2)
    });
    rightEdgePoints.push({ 
      x: config.x + config.width + offset + Phaser.Math.Between(2, 5),
      y: config.y - offset + Phaser.Math.Between(-5, -2)
    });
    bottomEdgePoints.push({ 
      x: config.x + config.width + offset + Phaser.Math.Between(2, 5),
      y: config.y + config.height + offset + Phaser.Math.Between(2, 5)
    });
    leftEdgePoints.push({ 
      x: config.x - offset + Phaser.Math.Between(-5, -2),
      y: config.y + config.height + offset + Phaser.Math.Between(2, 5)
    });
    
    // Add NEW random extra points to edges
    for (let i = 0; i < extraPointCount; i++) {
      const edgeIndex = Phaser.Math.Between(0, 3);
      
      switch (edgeIndex) {
        case 0: // Top edge
          topEdgePoints.push({
            x: Phaser.Math.Between(config.x - offset + 10, config.x + config.width + offset - 10) + Phaser.Math.Between(-4, 4),
            y: config.y - offset + Phaser.Math.Between(-8, -2)
          });
          break;
        case 1: // Right edge
          rightEdgePoints.push({
            x: config.x + config.width + offset + Phaser.Math.Between(2, 8),
            y: Phaser.Math.Between(config.y - offset + 10, config.y + config.height + offset - 10) + Phaser.Math.Between(-4, 4)
          });
          break;
        case 2: // Bottom edge
          bottomEdgePoints.push({
            x: Phaser.Math.Between(config.x - offset + 10, config.x + config.width + offset - 10) + Phaser.Math.Between(-4, 4),
            y: config.y + config.height + offset + Phaser.Math.Between(2, 8)
          });
          break;
        case 3: // Left edge
          leftEdgePoints.push({
            x: config.x - offset + Phaser.Math.Between(-8, -2),
            y: Phaser.Math.Between(config.y - offset + 10, config.y + config.height + offset - 10) + Phaser.Math.Between(-4, 4)
          });
          break;
      }
    }
    
    // Sort points along each edge to maintain proper order
    topEdgePoints.sort((a, b) => a.x - b.x);
    rightEdgePoints.sort((a, b) => a.y - b.y);
    bottomEdgePoints.sort((a, b) => b.x - a.x);
    leftEdgePoints.sort((a, b) => b.y - a.y);
    
    // Combine all points in clockwise order
    polygonPoints.push(...topEdgePoints);
    polygonPoints.push(...rightEdgePoints);
    polygonPoints.push(...bottomEdgePoints);
    polygonPoints.push(...leftEdgePoints);
    
    // Draw shadow
    const shadowOffset = 6;
    graphics.fillStyle(0x222222, 1.0); // Darker shadow for better contrast
    graphics.beginPath();
    graphics.moveTo(polygonPoints[0].x + shadowOffset, polygonPoints[0].y + shadowOffset);
    for (let i = 1; i < polygonPoints.length; i++) {
      graphics.lineTo(polygonPoints[i].x + shadowOffset, polygonPoints[i].y + shadowOffset);
    }
    graphics.closePath();
    graphics.fillPath();
    
    // Draw main polygon
    graphics.lineStyle(strokeWidth, strokeColor);
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.beginPath();
    graphics.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonPoints.length; i++) {
      graphics.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    
    // Draw rectangle (same size as before)
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.fillRect(config.x, config.y, config.width, config.height);
  }

  /**
   * Register a shape to be animated on beats
   */
  registerShape(id: string, graphics: Phaser.GameObjects.Graphics, config: WindowShapeConfig): void {
    this.activeShapes.set(id, { graphics, config });
  }

  /**
   * Unregister a shape from beat animations
   */
  unregisterShape(id: string): void {
    this.activeShapes.delete(id);
  }

  /**
   * Call this from your game's fourth beat handler to update all registered shapes
   */
  onFourthBeat(): void {
    this.activeShapes.forEach(({ graphics, config }) => {
      this.regeneratePolygonShape(graphics, config);
    });
  }

  /**
   * Get count of actively tracked shapes
   */
  getActiveShapeCount(): number {
    return this.activeShapes.size;
  }

  /**
   * Register a speech bubble to be animated on every step
   */
  registerSpeechBubble(id: string, graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
    this.activeSpeechBubbles.set(id, { graphics, x, y, width, height });
  }

  /**
   * Unregister a speech bubble from step animations
   */
  unregisterSpeechBubble(id: string): void {
    this.activeSpeechBubbles.delete(id);
  }

  /**
   * Call this from your game's step handler to update all registered speech bubbles
   */
  onStep(): void {
    this.activeSpeechBubbles.forEach(({ graphics, x, y, width, height }) => {
      this.regenerateSpeechBubbleShape(graphics, x, y, width, height);
    });
  }

  /**
   * Call this from your game's half-step handler to update all registered shapes
   */
  onHalfStep(halfStep: number): void {
    // Update speech bubbles on half-steps (more frequent for lively animation)
    this.activeSpeechBubbles.forEach(({ graphics, x, y, width, height }) => {
      this.regenerateSpeechBubbleShape(graphics, x, y, width, height);
    });
    
    // Update other animated shapes on half-steps too
    this.activeAnimatedShapes.forEach(({ graphics, shapeType, x, y, width, height }) => {
      if (graphics && graphics.scene) {
        this.regenerateShapeWithSubtleAnimation(graphics, shapeType, x, y, width, height);
      }
    });
    
    // Update steering wheels on half-steps for organic movement
    this.activeSteeringWheels.forEach(({ graphics, x, y, radius, currentRotation }) => {
      if (graphics && graphics.scene) {
        this.regenerateSteeringWheel(graphics, x, y, radius, currentRotation);
      }
    });
  }

  /**
   * Register an animated shape for ongoing updates
   */
  private registerAnimatedShape(shapeId: string, graphics: Phaser.GameObjects.Graphics, shapeType: string, x: number, y: number, width: number, height: number): void {
    this.activeAnimatedShapes.set(shapeId, { graphics, shapeType, x, y, width, height });
  }

  /**
   * Unregister an animated shape to stop updates
   */
  private unregisterAnimatedShape(shapeId: string): void {
    this.activeAnimatedShapes.delete(shapeId);
  }

  /**
   * Regenerate the speech bubble shape with new random points (for step animations)
   * Keeps the same overall dimensions, just changes the jagged points
   */
  private regenerateSpeechBubbleShape(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number): void {
    // Clear the existing graphics
    graphics.clear();
    
    // Set styling
    const strokeWidth = 2;
    const strokeColor = 0x000000; // Black
    const fillColor = 0xffffff; // White fill
    const fillAlpha = 1.0;
    
    // Create NEW simplified speech bubble shape with different random values
    const bubblePoints = [];
    
    // Start from bottom edge (was top) - 3-4 points with NEW random values
    bubblePoints.push({ x: x + 20 + Phaser.Math.Between(-5, 5), y: y + height + Phaser.Math.Between(-3, 3) });
    bubblePoints.push({ x: x + width * 0.5 + Phaser.Math.Between(-8, 8), y: y + height + Phaser.Math.Between(2, 5) });
    bubblePoints.push({ x: x + width - 20 + Phaser.Math.Between(-5, 5), y: y + height + Phaser.Math.Between(-3, 3) });
    
    // Right edge - 2-3 points with NEW random values 
    bubblePoints.push({ x: x + width + Phaser.Math.Between(-3, 3), y: y + height * 0.7 + Phaser.Math.Between(-8, 8) });
    bubblePoints.push({ x: x + width + Phaser.Math.Between(-5, 2), y: y + height * 0.3 + Phaser.Math.Between(-8, 8) });
    
    // Top-right to tail connection (tail now points up) with NEW random values
    bubblePoints.push({ x: x + width * 0.8 + Phaser.Math.Between(-5, 5), y: y + Phaser.Math.Between(-3, 3) });
    
    // Speech bubble tail pointing UP (flipped from down) with NEW random values
    bubblePoints.push({ x: x + width * 0.7 + Phaser.Math.Between(-8, 8), y: y - 15 + Phaser.Math.Between(-5, 5) });
    bubblePoints.push({ x: x + width * 0.6 + Phaser.Math.Between(-5, 5), y: y - 25 + Phaser.Math.Between(-7, -3) });
    bubblePoints.push({ x: x + width * 0.65 + Phaser.Math.Between(-8, 8), y: y + Phaser.Math.Between(-2, 2) });
    
    // Top edge (was bottom) - left side with NEW random values
    bubblePoints.push({ x: x + width * 0.3 + Phaser.Math.Between(-5, 5), y: y + Phaser.Math.Between(-3, 3) });
    bubblePoints.push({ x: x + 20 + Phaser.Math.Between(-5, 5), y: y + Phaser.Math.Between(-3, 3) });
    
    // Left edge - 2-3 points with NEW random values
    bubblePoints.push({ x: x + Phaser.Math.Between(-3, 3), y: y + height * 0.3 + Phaser.Math.Between(-8, 8) });
    bubblePoints.push({ x: x + Phaser.Math.Between(-5, 2), y: y + height * 0.7 + Phaser.Math.Between(-8, 8) });
    
    // Back to bottom (was top) with NEW random values
    bubblePoints.push({ x: x + Phaser.Math.Between(-3, 3), y: y + height - 20 + Phaser.Math.Between(-5, 5) });
    
    // Draw shadow first
    const shadowOffset = 6;
    graphics.fillStyle(0x222222, 1.0);
    graphics.beginPath();
    graphics.moveTo(bubblePoints[0].x + shadowOffset, bubblePoints[0].y + shadowOffset);
    for (let i = 1; i < bubblePoints.length; i++) {
      graphics.lineTo(bubblePoints[i].x + shadowOffset, bubblePoints[i].y + shadowOffset);
    }
    graphics.closePath();
    graphics.fillPath();
    
    // Draw main speech bubble
    graphics.lineStyle(strokeWidth, strokeColor);
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.beginPath();
    graphics.moveTo(bubblePoints[0].x, bubblePoints[0].y);
    for (let i = 1; i < bubblePoints.length; i++) {
      graphics.lineTo(bubblePoints[i].x, bubblePoints[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
  }

  /**
   * Regenerate shapes with subtle organic animation - EXACTLY like createCollageRect
   */
  private regenerateShapeWithSubtleAnimation(graphics: Phaser.GameObjects.Graphics, shapeType: string, x: number, y: number, width: number, height: number): void {
    graphics.clear();
    
    // Use the EXACT same approach as createCollageRect but with fresh random values
    const strokeWidth = 2;
    const strokeColor = 0x000000; // Black
    
    // Determine fill color based on shape type
    let fillColor = 0xffffff; // Default white
    if (shapeType === 'window') {
      fillColor = 0xd0d0d0; // Darker grey for main windows
    } else if (shapeType === 'button') {
      fillColor = 0xffffff; // White for buttons
    }
    const fillAlpha = 1.0;
    
    // Create polygon points with extra random points along edges - SAME LOGIC
    const offset = 5; // Make polygon 5 pixels larger on each side
    const polygonPoints = [];
    
    // Add random extra points (same range as original)
    const extraPointCount = Phaser.Math.Between(2, 5);
    
    // Create arrays for points along each edge - SAME STRUCTURE
    const topEdgePoints = [];
    const rightEdgePoints = [];
    const bottomEdgePoints = [];
    const leftEdgePoints = [];
    
    // Always include corners with random movement - SAME LOGIC
    topEdgePoints.push({ 
      x: x - offset + Phaser.Math.Between(-5, -2),
      y: y - offset + Phaser.Math.Between(-5, -2)
    }); // Top-left corner
    rightEdgePoints.push({ 
      x: x + width + offset + Phaser.Math.Between(2, 5),
      y: y - offset + Phaser.Math.Between(-5, -2)
    }); // Top-right corner
    bottomEdgePoints.push({ 
      x: x + width + offset + Phaser.Math.Between(2, 5),
      y: y + height + offset + Phaser.Math.Between(2, 5)
    }); // Bottom-right corner
    leftEdgePoints.push({ 
      x: x - offset + Phaser.Math.Between(-5, -2),
      y: y + height + offset + Phaser.Math.Between(2, 5)
    }); // Bottom-left corner
    
    // Add random extra points to edges - SAME LOGIC
    for (let i = 0; i < extraPointCount; i++) {
      const edgeIndex = Phaser.Math.Between(0, 3);
      
      switch (edgeIndex) {
        case 0: // Top edge
          topEdgePoints.push({
            x: Phaser.Math.Between(x - offset + 10, x + width + offset - 10) + Phaser.Math.Between(-4, 4),
            y: y - offset + Phaser.Math.Between(-8, -2)
          });
          break;
        case 1: // Right edge
          rightEdgePoints.push({
            x: x + width + offset + Phaser.Math.Between(2, 8),
            y: Phaser.Math.Between(y - offset + 10, y + height + offset - 10) + Phaser.Math.Between(-4, 4)
          });
          break;
        case 2: // Bottom edge
          bottomEdgePoints.push({
            x: Phaser.Math.Between(x - offset + 10, x + width + offset - 10) + Phaser.Math.Between(-4, 4),
            y: y + height + offset + Phaser.Math.Between(2, 8)
          });
          break;
        case 3: // Left edge
          leftEdgePoints.push({
            x: x - offset + Phaser.Math.Between(-8, -2),
            y: Phaser.Math.Between(y - offset + 10, y + height + offset - 10) + Phaser.Math.Between(-4, 4)
          });
          break;
      }
    }
    
    // Sort points along each edge - SAME SORTING
    topEdgePoints.sort((a, b) => a.x - b.x);
    rightEdgePoints.sort((a, b) => a.y - b.y);
    bottomEdgePoints.sort((a, b) => b.x - a.x);
    leftEdgePoints.sort((a, b) => b.y - a.y);
    
    // Combine all points in clockwise order - SAME ORDER
    polygonPoints.push(...topEdgePoints);
    polygonPoints.push(...rightEdgePoints);
    polygonPoints.push(...bottomEdgePoints);
    polygonPoints.push(...leftEdgePoints);
    
    // Draw shadow first - SAME SHADOW
    const shadowOffset = 6;
    graphics.fillStyle(0x222222, 1.0);
    graphics.beginPath();
    graphics.moveTo(polygonPoints[0].x + shadowOffset, polygonPoints[0].y + shadowOffset);
    for (let i = 1; i < polygonPoints.length; i++) {
      graphics.lineTo(polygonPoints[i].x + shadowOffset, polygonPoints[i].y + shadowOffset);
    }
    graphics.closePath();
    graphics.fillPath();
    
    // Draw main polygon border - SAME BORDER
    graphics.lineStyle(strokeWidth, strokeColor);
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.beginPath();
    graphics.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonPoints.length; i++) {
      graphics.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    
    // Draw clean rectangle on top - SAME RECTANGLE
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.fillRect(x, y, width, height);
  }

  /**
   * Get count of actively tracked speech bubbles
   */
  getActiveSpeechBubbleCount(): number {
    return this.activeSpeechBubbles.size;
  }

  /**
   * Create an animated steering wheel with organic, jagged edges
   */
  createAnimatedSteeringWheel(x: number, y: number, radius: number): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    
    // Register this steering wheel for half-step animation
    const wheelId = `steeringwheel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.registerSteeringWheel(wheelId, graphics, x, y, radius, 0);
    
    // Store the ID for cleanup
    (graphics as any).wheelId = wheelId;
    
    // Add cleanup when graphics is destroyed
    graphics.on('destroy', () => {
      this.unregisterSteeringWheel(wheelId);
    });
    
    // Draw initial steering wheel
    this.regenerateSteeringWheel(graphics, x, y, radius, 0);
    
    return graphics;
  }

  /**
   * Register a steering wheel for half-step animations
   */
  registerSteeringWheel(id: string, graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, rotation: number): void {
    this.activeSteeringWheels.set(id, { graphics, x, y, radius, currentRotation: rotation });
  }

  /**
   * Unregister a steering wheel from animations
   */
  unregisterSteeringWheel(id: string): void {
    this.activeSteeringWheels.delete(id);
  }

  /**
   * Update the rotation of a specific steering wheel
   */
  updateSteeringWheelRotation(graphics: Phaser.GameObjects.Graphics, rotation: number): void {
    // Find the steering wheel by graphics object
    for (const [id, wheelData] of this.activeSteeringWheels) {
      if (wheelData.graphics === graphics) {
        wheelData.currentRotation = rotation;
        // Regenerate immediately with new rotation
        this.regenerateSteeringWheel(graphics, wheelData.x, wheelData.y, wheelData.radius, rotation);
        break;
      }
    }
  }

  /**
   * Regenerate steering wheel with simplified SVG geometry
   */
  private regenerateSteeringWheel(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, rotation: number): void {
    graphics.clear();
    
    const strokeWidth = 3;
    const strokeColor = 0x000000; // Black
    const fillColor = 0xffffff; // White
    const fillAlpha = 1.0;
    
    // Create simplified points from the original SVG geometry
    // The SVG has complex paths - we'll extract key structural points and connect with straight lines
    const simplifiedPoints = this.createSimplifiedSteeringWheelGeometry(x, y, radius, rotation);
    
    // Draw shadow first
    const shadowOffset = 2;
    graphics.fillStyle(0x222222, 0.3);
    this.drawPolygonFromPoints(graphics, simplifiedPoints, shadowOffset, shadowOffset);
    
    // Draw main shape
    graphics.lineStyle(strokeWidth, strokeColor);
    graphics.fillStyle(fillColor, fillAlpha);
    this.drawPolygonFromPoints(graphics, simplifiedPoints, 0, 0);
    graphics.fillPath();
    graphics.strokePath();
  }

  /**
   * Create simplified steering wheel geometry by extracting key points from SVG and removing detail
   */
  private createSimplifiedSteeringWheelGeometry(x: number, y: number, radius: number, rotation: number): Array<{x: number, y: number}> {
    const variation = 0.3; // Organic variation
    
    // Simplified key points extracted from the steering wheel SVG structure
    // Removing complex curves and keeping only essential shape-defining points
    const basePoints = [
      // Top section - simplified from the complex curved grip
      { angle: -Math.PI/2 - 0.6, r: radius * 0.9 },     // top left outer
      { angle: -Math.PI/2 - 0.3, r: radius * 0.7 },     // top left inner  
      { angle: -Math.PI/2, r: radius * 0.65 },          // top center
      { angle: -Math.PI/2 + 0.3, r: radius * 0.7 },     // top right inner
      { angle: -Math.PI/2 + 0.6, r: radius * 0.9 },     // top right outer
      
      // Right section - simplified from grip handle
      { angle: 0.2, r: radius },                        // right outer
      { angle: 0.6, r: radius * 0.8 },                  // right grip point
      { angle: 1.0, r: radius * 0.6 },                  // right inner
      
      // Bottom section - simplified arc
      { angle: Math.PI/2 - 0.2, r: radius * 0.5 },      // bottom right
      { angle: Math.PI/2, r: radius * 0.45 },           // bottom center  
      { angle: Math.PI/2 + 0.2, r: radius * 0.5 },      // bottom left
      
      // Left section - simplified from grip handle
      { angle: Math.PI - 1.0, r: radius * 0.6 },        // left inner
      { angle: Math.PI - 0.6, r: radius * 0.8 },        // left grip point
      { angle: Math.PI - 0.2, r: radius },              // left outer
      
      // Back to top - completing the shape
      { angle: -Math.PI + 0.4, r: radius * 0.95 },      // left top connection
    ];
    
    // Convert to actual coordinates with rotation and organic variation
    return basePoints.map(point => {
      const actualRadius = point.r + Phaser.Math.Between(-variation, variation);
      const actualAngle = point.angle + rotation;
      
      return {
        x: x + Math.cos(actualAngle) * actualRadius,
        y: y + Math.sin(actualAngle) * actualRadius
      };
    });
  }

  /**
   * Draw polygon from points with optional offset
   */
  private drawPolygonFromPoints(graphics: Phaser.GameObjects.Graphics, points: Array<{x: number, y: number}>, offsetX: number, offsetY: number): void {
    if (points.length === 0) return;
    
    graphics.beginPath();
    graphics.moveTo(points[0].x + offsetX, points[0].y + offsetY);
    
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x + offsetX, points[i].y + offsetY);
    }
    
    graphics.closePath();
  }

  /**
   * Create a basic Dialog composition - main window with close button
   */
  createDialogComposition(x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Main dialog window - darker grey background with animation
    const mainWindow = this.createCollageRect({ 
      x: 0, y: 0, width, height,
      fillColor: 0xd0d0d0 // Darker grey background
    }, true, 'window'); // Enable animation for main window
    container.add(mainWindow);
    
    // Close button (X) in top-right corner - white for interaction
    const closeButton = this.createCollageButton(width - 35, 5, 25, 25);
    container.add(closeButton);
    
    return container;
  }

  /**
   * Create a ConfirmDialog composition - window with two choice buttons at bottom
   */
  createConfirmDialogComposition(x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Main dialog window - darker grey background with animation
    const mainWindow = this.createCollageRect({ 
      x: 0, y: 0, width, height,
      fillColor: 0xd0d0d0 // Darker grey background
    }, true, 'window'); // Enable animation for main window
    container.add(mainWindow);
    
    // Close button in top-right - white for interaction
    const closeButton = this.createCollageButton(width - 35, 5, 25, 25);
    container.add(closeButton);
    
    // Two choice buttons at bottom - white for interaction
    const buttonWidth = (width - 30) / 2;
    const buttonY = height - 40;
    
    const leftButton = this.createCollageButton(10, buttonY, buttonWidth, 30);
    const rightButton = this.createCollageButton(width - buttonWidth - 10, buttonY, buttonWidth, 30);
    
    container.add(leftButton);
    container.add(rightButton);
    
    return container;
  }

  /**
   * Create a Menu composition - window with vertical stack of buttons
   */
  createMenuComposition(x: number, y: number, width: number, height: number, buttonCount: number = 3): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Main menu window - darker grey background with animation
    const mainWindow = this.createCollageRect({ 
      x: 0, y: 0, width, height,
      fillColor: 0xd0d0d0 // Darker grey background
    }, true, 'window'); // Enable animation for main window
    container.add(mainWindow);
    
    // Close button in top-left - white for interaction
    const closeButton = this.createCollageButton(5, 5, 25, 25);
    container.add(closeButton);
    
    // Vertical stack of menu buttons - white for interaction
    const buttonHeight = 35;
    const buttonSpacing = 10;
    const startY = 40; // Below close button
    const buttonWidth = width - 20;
    
    for (let i = 0; i < buttonCount; i++) {
      const buttonY = startY + i * (buttonHeight + buttonSpacing);
      const menuButton = this.createCollageButton(10, buttonY, buttonWidth, buttonHeight);
      container.add(menuButton);
    }
    
    return container;
  }

  /**
   * Create a Panel composition - window with action buttons in corners
   */
  createPanelComposition(x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Main panel window - darker grey background with animation
    const mainWindow = this.createCollageRect({ 
      x: 0, y: 0, width, height,
      fillColor: 0xd0d0d0 // Darker grey background
    }, true, 'window'); // Enable animation for main window
    container.add(mainWindow);
    
    // Four corner buttons - white for interaction
    const buttonSize = 30;
    const offset = 5;
    
    // Top-left
    const topLeftButton = this.createCollageButton(offset, offset, buttonSize, buttonSize);
    container.add(topLeftButton);
    
    // Top-right
    const topRightButton = this.createCollageButton(width - buttonSize - offset, offset, buttonSize, buttonSize);
    container.add(topRightButton);
    
    // Bottom-left
    const bottomLeftButton = this.createCollageButton(offset, height - buttonSize - offset, buttonSize, buttonSize);
    container.add(bottomLeftButton);
    
    // Bottom-right
    const bottomRightButton = this.createCollageButton(width - buttonSize - offset, height - buttonSize - offset, buttonSize, buttonSize);
    container.add(bottomRightButton);
    
    return container;
  }

  /**
   * Create a MessageBox composition - simple window with single OK button
   */
  createMessageBoxComposition(x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Main message window - darker grey background with animation
    const mainWindow = this.createCollageRect({ 
      x: 0, y: 0, width, height,
      fillColor: 0xd0d0d0 // Darker grey background
    }, true, 'window'); // Enable animation for main window
    container.add(mainWindow);
    
    // Single OK button centered at bottom - white for interaction
    const buttonWidth = 80;
    const okButton = this.createCollageButton((width - buttonWidth) / 2, height - 40, buttonWidth, 30);
    container.add(okButton);
    
    return container;
  }

  /**
   * Create a Speech Bubble composition - jagged speech bubble shape with organic borders (flipped upside down, no button)
   */
  createSpeechBubbleComposition(x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Create the main bubble body (adjust height since tail is now at top)
    const bubbleHeight = height - 40; // Leave space for the tail at top
    const mainBubble = this.createCollageSpeechBubble(0, 40, width, bubbleHeight); // Start 40px down to leave space for upward tail
    container.add(mainBubble);
    
    // Register this speech bubble for half-step-based point regeneration
    const speechBubbleId = `speechbubble_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.registerSpeechBubble(speechBubbleId, mainBubble, 0, 40, width, bubbleHeight);
    
    // Store the ID on the container for later cleanup if needed
    (container as any).speechBubbleId = speechBubbleId;
    
    // Add cleanup when container is destroyed
    container.on('destroy', () => {
      this.unregisterSpeechBubble(speechBubbleId);
    });
    
    // No button - just the clean white bubble as requested
    
    return container;
  }
}
