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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create a "collage-style" rectangle with organic polygon border
   * This is the main method you'll want to use for UI elements
   */
  createCollageRect(config: WindowShapeConfig): Phaser.GameObjects.Graphics {
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
    });
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
   * Create a basic Dialog composition - main window with close button
   */
  createDialogComposition(x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Main dialog window - darker grey background
    const mainWindow = this.createCollageRect({ 
      x: 0, y: 0, width, height,
      fillColor: 0xd0d0d0 // Darker grey background
    });
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
    
    // Main dialog window - darker grey background
    const mainWindow = this.createCollageRect({ 
      x: 0, y: 0, width, height,
      fillColor: 0xd0d0d0 // Darker grey background
    });
    container.add(mainWindow);
    
    // Close button in top-right - white for interaction
    const closeButton = this.createCollageButton(width - 35, 5, 25, 25);
    container.add(closeButton);
    
    // Two choice buttons at bottom - white for interaction
    const buttonWidth = (width - 30) / 2;
    const buttonY = height - 40;
    
    const cancelButton = this.createCollageButton(10, buttonY, buttonWidth, 30);
    const confirmButton = this.createCollageButton(20 + buttonWidth, buttonY, buttonWidth, 30);
    
    container.add([cancelButton, confirmButton]);
    
    return container;
  }

  /**
   * Create a Menu composition - window with vertical stack of buttons
   */
  createMenuComposition(x: number, y: number, width: number, height: number, buttonCount: number = 3): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Main menu window - darker grey background
    const mainWindow = this.createCollageRect({ 
      x: 0, y: 0, width, height,
      fillColor: 0xd0d0d0 // Darker grey background
    });
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
    
    // Main panel window - darker grey background
    const mainWindow = this.createCollageRect({ 
      x: 0, y: 0, width, height,
      fillColor: 0xd0d0d0 // Darker grey background
    });
    container.add(mainWindow);
    
    // Four corner buttons - all white for interaction
    const buttonSize = 30;
    
    // Top-left: Menu/Settings
    const menuButton = this.createCollageButton(5, 5, buttonSize, buttonSize);
    container.add(menuButton);
    
    // Top-right: Close
    const closeButton = this.createCollageButton(width - buttonSize - 5, 5, buttonSize, buttonSize);
    container.add(closeButton);
    
    // Bottom-left: Help
    const helpButton = this.createCollageButton(5, height - buttonSize - 5, buttonSize, buttonSize);
    container.add(helpButton);
    
    // Bottom-right: Action/OK
    const actionButton = this.createCollageButton(width - buttonSize - 5, height - buttonSize - 5, buttonSize, buttonSize);
    container.add(actionButton);
    
    return container;
  }

  /**
   * Create a MessageBox composition - simple window with single OK button
   */
  createMessageBoxComposition(x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    
    // Main message window - darker grey background
    const mainWindow = this.createCollageRect({ 
      x: 0, y: 0, width, height,
      fillColor: 0xd0d0d0 // Darker grey background
    });
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
    
    // No button - just the clean white bubble as requested
    
    return container;
  }
}
