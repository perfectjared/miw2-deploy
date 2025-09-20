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
  
  // Narrative window management
  private activeNarrativeWindow: Phaser.GameObjects.Container | null = null;
  private narrativeWindowQueue: Array<{
    x: number,
    y: number,
    width: number,
    height: number,
    backgroundImageKey?: string
  }> = [];

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
   * Create an animated organic black rectangle specifically for narrative text - NO SHADOWS, PURE BLACK
   */
  private createNarrativeBackground(config: WindowShapeConfig, enableAnimation: boolean = false): Phaser.GameObjects.Graphics {
    const graphics = this.scene.add.graphics();
    
    // Force pure black styling for narrative backgrounds
    const strokeWidth = 2;
    const strokeColor = 0x000000; // Black stroke
    const fillColor = 0x000000;  // Pure black fill
    const fillAlpha = 1.0;       // Fully opaque
    
    // Create polygon points WITHIN the rectangle bounds - ONLY 4 CORNER POINTS
    const polygonPoints = [];
    
    // Only use the 4 corners with jaunty randomization (no extra edge points) - ROUND TO INTEGERS FOR SHARP CORNERS
    const topLeftCorner = { 
      x: Math.round(config.x + Phaser.Math.Between(0, 5)), // Round to integer pixels
      y: Math.round(config.y + Phaser.Math.Between(0, 3))  // Round to integer pixels
    };
    const topRightCorner = { 
      x: Math.round(config.x + config.width + Phaser.Math.Between(-5, 0)), // Round to integer pixels
      y: Math.round(config.y + Phaser.Math.Between(0, 3))  // Round to integer pixels
    };
    const bottomRightCorner = { 
      x: Math.round(config.x + config.width + Phaser.Math.Between(-5, 0)), // Round to integer pixels
      y: Math.round(config.y + config.height + Phaser.Math.Between(-3, 0)) // Round to integer pixels
    };
    const bottomLeftCorner = { 
      x: Math.round(config.x + Phaser.Math.Between(0, 5)), // Round to integer pixels
      y: Math.round(config.y + config.height + Phaser.Math.Between(-3, 0)) // Round to integer pixels
    };
    
    // Add corners in clockwise order (no extra points, just the 4 corners)
    polygonPoints.push(topLeftCorner);
    polygonPoints.push(topRightCorner);
    polygonPoints.push(bottomRightCorner);
    polygonPoints.push(bottomLeftCorner);
    
    // NO DROP SHADOW for narrative backgrounds - start directly with main polygon
    graphics.lineStyle(strokeWidth, strokeColor, 1.0); // Fully opaque stroke
    graphics.fillStyle(fillColor, fillAlpha); // Pure black fill
    
    // Disable anti-aliasing for sharp corners
    graphics.setDefaultStyles({
      lineStyle: {
        width: strokeWidth,
        color: strokeColor,
        alpha: 1.0
      },
      fillStyle: {
        color: fillColor,
        alpha: fillAlpha
      }
    });
    
    graphics.beginPath();
    graphics.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonPoints.length; i++) {
      graphics.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    graphics.closePath();
    graphics.fillPath(); // Fill the polygon with black
    graphics.strokePath(); // Then stroke the black outline with sharp edges
    
    // DO NOT draw the filled rectangle on top - let the polygon be the only shape
    
    // Register for animation if enabled
    if (enableAnimation) {
      const shapeId = `animated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.registerAnimatedShape(shapeId, graphics, 'narrativeBackground', config.x, config.y, config.width, config.height);
      
      // Store the ID for cleanup
      (graphics as any).animationId = shapeId;
      
      // Add cleanup when graphics is destroyed
      graphics.on('destroy', () => {
        this.unregisterAnimatedShape(shapeId);
      });
    }
    
    // Ensure narrative backgrounds are always rendered above the transparent window
    graphics.setDepth(12); // Higher than text (11) and window (-1)
    
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
      'speechBubble',
      'storyDialog'
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
        
      case 'storyDialog':
        // Story dialogs are taller and more vertical
        const storyHeight = Math.max(height, 400); // Minimum 400px height
        const storyWidth = Math.max(width, 300);   // Minimum 300px width
        const storyDialog = this.createStoryDialogComposition(x, y, storyWidth, storyHeight);
        
        // Return a placeholder container if dialog was queued (returned null)
        if (!storyDialog) {
          console.log('Story dialog queued - creating placeholder');
          const placeholder = this.scene.add.container(x, y);
          placeholder.setSize(storyWidth, storyHeight);
          return placeholder;
        }
        
        return storyDialog;
        
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
   * Create narrative text with tight black background - reusable component
   */
  createNarrativeText(x: number, y: number, text: string, maxWidth: number, container: Phaser.GameObjects.Container): { textElement: Phaser.GameObjects.Text, background: Phaser.GameObjects.Graphics } {
    // Add subtle visual variation for more organic feel
    const rotationVariation = (Math.random() - 0.5) * 0.8; // ±0.4 degrees
    const xVariation = (Math.random() - 0.5) * 10; // ±5 pixels
    
    // Create the narrative text element with bigger font - KEEP TEXT STATIONARY AND LEFT-ALIGNED
    const narrativeTextStyle = {
      fontSize: '20px', // Bigger font for narrative text
      color: '#ffffff',
      align: 'left', // Explicitly left-aligned
      fontFamily: 'Arial', // Ensure consistent font
      padding: { x: 8, y: 6 } // Add some internal padding
    };
    
    // Create text element WITHOUT position/rotation variations (keep text still)
    const textElement = this.scene.add.text(x, y, text, narrativeTextStyle);
    textElement.setOrigin(0, 0); // Ensure left-top origin for proper left justification
    textElement.setWordWrapWidth(maxWidth);
    textElement.setAlign('left'); // Extra assurance of left alignment
    textElement.setDepth(11); // High depth for visibility
    
    // Enable smooth text rendering
    textElement.setStyle({ ...narrativeTextStyle, smoothed: true });
    if (textElement.canvas) {
      const context = textElement.canvas.getContext('2d');
      if (context) {
        context.textBaseline = 'top';
        context.imageSmoothingEnabled = true; // Enable smoothing for text
      }
    }
    
    // Get the actual text bounds for the background size
    const textBounds = textElement.getBounds();
    
    // Create an ANIMATED ORGANIC BLACK RECTANGLE like other collage elements
    // Add some padding around the text bounds
    const bgPadding = 8;
    const backgroundConfig = {
      x: textBounds.x - bgPadding,
      y: textBounds.y - bgPadding,
      width: textBounds.width + (bgPadding * 2),
      height: textBounds.height + (bgPadding * 2),
      fillColor: 0x000000, // Pure black
      fillAlpha: 1.0,
      strokeColor: 0x000000, // Black stroke too
      strokeWidth: 2
    };
    
    // Use the specialized NARRATIVE BACKGROUND method (no shadows, pure black)
    const background = this.createNarrativeBackground(backgroundConfig, true);
    // Depth is set inside createNarrativeBackground method (depth 12 - above transparent windows)
    
    // Add to container if provided
    if (container) {
      container.add(background);
      container.add(textElement);
    }
    
    return { textElement, background };
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
    
    // Determine fill color based on shape type and container state
    let fillColor = 0xffffff; // Default white
    let fillAlpha = 1.0; // Default fully opaque
    let skipShadow = false; // Flag to skip shadow for narrative backgrounds
    
    if (shapeType === 'window') {
      // Check if this window is part of a story dialog with buttons
      let parentContainer = graphics.parentContainer;
      if (parentContainer && (parentContainer as any).isComplete) {
        // This is a story dialog with buttons - use transparent grey
        fillColor = 0xcccccc; // Light grey color
        fillAlpha = 0.85; // 85% opacity (15% transparent)
      } else {
        fillColor = 0xffffff; // White for main windows
      }
    } else if (shapeType === 'button') {
      fillColor = 0xffffff; // White for buttons
    } else if (shapeType === 'narrativeBackground') {
      fillColor = 0x000000; // Pure black for narrative backgrounds
      skipShadow = true; // No shadows for narrative backgrounds
    }
    
    // Create polygon points - different approach for narrative backgrounds vs others
    const polygonPoints = [];
    const extraPointCount = Phaser.Math.Between(2, 5);
    const topEdgePoints = [];
    const rightEdgePoints = [];
    const bottomEdgePoints = [];
    const leftEdgePoints = [];
    
    if (shapeType === 'narrativeBackground') {
      // ONLY 4 CORNER POINTS for narrative backgrounds (jaunty but simple) - ROUND FOR SHARP CORNERS
      const topLeftCorner = { 
        x: Math.round(x + Phaser.Math.Between(0, 5)), // Round to integer pixels
        y: Math.round(y + Phaser.Math.Between(0, 3))  // Round to integer pixels
      };
      const topRightCorner = { 
        x: Math.round(x + width + Phaser.Math.Between(-5, 0)), // Round to integer pixels
        y: Math.round(y + Phaser.Math.Between(0, 3))  // Round to integer pixels
      };
      const bottomRightCorner = { 
        x: Math.round(x + width + Phaser.Math.Between(-5, 0)), // Round to integer pixels
        y: Math.round(y + height + Phaser.Math.Between(-3, 0)) // Round to integer pixels
      };
      const bottomLeftCorner = { 
        x: Math.round(x + Phaser.Math.Between(0, 5)), // Round to integer pixels
        y: Math.round(y + height + Phaser.Math.Between(-3, 0)) // Round to integer pixels
      };
      
      // Add corners in clockwise order (no extra points, just the 4 corners)
      polygonPoints.push(topLeftCorner);
      polygonPoints.push(topRightCorner);
      polygonPoints.push(bottomRightCorner);
      polygonPoints.push(bottomLeftCorner);
    } else {
      // ORGANIC EXTENDING POLYGONS for other collage elements (original behavior)
      const offset = 5; // Make polygon 5 pixels larger on each side
      
      // Always include corners with random movement - SAME LOGIC as original
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
      
      // Add random extra points to edges - SAME LOGIC as original
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
    
    // Draw shadow first - SKIP for narrative backgrounds
    if (!skipShadow) {
      const shadowOffset = 6;
      graphics.fillStyle(0x222222, 1.0);
      graphics.beginPath();
      graphics.moveTo(polygonPoints[0].x + shadowOffset, polygonPoints[0].y + shadowOffset);
      for (let i = 1; i < polygonPoints.length; i++) {
        graphics.lineTo(polygonPoints[i].x + shadowOffset, polygonPoints[i].y + shadowOffset);
      }
      graphics.closePath();
      graphics.fillPath();
    }
    
    // Draw main polygon border - use sharp corners for narrative backgrounds
    if (shapeType === 'narrativeBackground') {
      // Sharp corners for narrative text backgrounds
      graphics.lineStyle(strokeWidth, strokeColor, 1.0); // Fully opaque stroke
      graphics.setDefaultStyles({
        lineStyle: {
          width: strokeWidth,
          color: strokeColor,
          alpha: 1.0
        },
        fillStyle: {
          color: fillColor,
          alpha: fillAlpha
        }
      });
    } else {
      // Normal rendering for other shapes
      graphics.lineStyle(strokeWidth, strokeColor);
    }
    
    graphics.fillStyle(fillColor, fillAlpha);
    graphics.beginPath();
    graphics.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    for (let i = 1; i < polygonPoints.length; i++) {
      graphics.lineTo(polygonPoints[i].x, polygonPoints[i].y);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    
    // Draw clean rectangle on top - SKIP for narrative backgrounds (they use only the polygon)
    if (shapeType !== 'narrativeBackground') {
      graphics.fillStyle(fillColor, fillAlpha);
      graphics.fillRect(x, y, width, height);
    }
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

  /**
   * Create a Story Dialog composition - tall modal with background image and sequential text reveals
   * If another narrative window is active, this will be queued for later display
   */
  createStoryDialogComposition(x: number, y: number, width: number, height: number, backgroundImageKey: string = 'default-bg'): Phaser.GameObjects.Container | null {
    // Debug: Check if activeNarrativeWindow exists but is invalid
    if (this.activeNarrativeWindow && (!this.activeNarrativeWindow.scene || this.activeNarrativeWindow.scene !== this.scene)) {
      console.log('🔧 Clearing stale activeNarrativeWindow reference');
      this.activeNarrativeWindow = null;
    }
    
    // Check if there's already an active narrative window
    if (this.activeNarrativeWindow && this.activeNarrativeWindow.scene) {
      // Queue this request for later
      console.log('Narrative window already active, queuing new request...');
      console.log('📊 Active window:', this.activeNarrativeWindow);
      this.narrativeWindowQueue.push({ x, y, width, height, backgroundImageKey });
      return null; // Return null to indicate it was queued
    }
    
    console.log('✅ Creating new narrative window immediately');
    const container = this.scene.add.container(x, y);
    
    // Set high depth for the entire container (like R key debug windows do)
    container.setDepth(2000);
    console.log(`📦 Container created at position: ${x}, ${y} with depth 2000`);
    
    // Main story window - white background with animation
    const mainWindow = this.createCollageRect({ 
      x: 0, y: 0, width, height,
      fillColor: 0xffffff // White background
    }, true, 'window'); // Enable animation for main window
    console.log(`🏠 Main window created: ${width}x${height} at 0,0 relative to container`);
    container.add(mainWindow);
    console.log('✅ Main window added to container');
    
    // Set the main window to a higher depth so it captures pointer events properly
    mainWindow.setDepth(10);  // Changed from -1 to 10
    console.log('📦 Main window depth set to 10');
    
    // Make the main window (polygon background) interactive for clicking to advance
    mainWindow.setInteractive();
    console.log(`🖱️ Main window made interactive: ${width}x${height}`);
    
    mainWindow.on('pointerdown', () => {
      console.log('🖱️ Main window (polygon) clicked!');
      // Only advance if dialog isn't complete (buttons not yet shown)
      if (!(container as any).isComplete) {
        console.log('➡️ Advancing story dialog');
        this.advanceStoryDialog(container as any);
      } else {
        console.log('⏹️ Dialog already complete, not advancing');
      }
    });
    
    // Add hover debugging
    mainWindow.on('pointerover', () => console.log('🖱️ Mouse over polygon'));
    mainWindow.on('pointerout', () => console.log('🖱️ Mouse left polygon'));
    
    // Remove the old background placeholder
    // Instead of a single text object, we'll create individual text elements with backgrounds
    // Text display area will be created dynamically as we add each line
    
    // Story texts to reveal
    const storyTexts = [
      "The ancient door creaks open...",
      "Strange shadows dance in the flickering light.", 
      "Do you dare to enter the mysterious chamber?"
    ];
    
    // Add interactive properties for story progression
    (container as any).storyTexts = storyTexts;
    (container as any).currentTextIndex = 0;
    (container as any).textElements = []; // Array to hold individual text elements
    (container as any).textBackgrounds = []; // Array to hold text background graphics
    (container as any).containerWidth = width; // Store dimensions for calculations
    (container as any).containerHeight = height;
    (container as any).isComplete = false;
    
    // Start the first text reveal
    this.revealNextStoryText(container as any);
    
    // Add proper cleanup when container is destroyed
    container.on('destroy', () => {
      console.log('🗑️ Container destroy event triggered');
      
      // Clean up any running timers
      if ((container as any).autoAdvanceTimer) {
        (container as any).autoAdvanceTimer.remove();
        (container as any).autoAdvanceTimer = null;
      }
      
      // Clean up standalone buttons (not part of container)
      if ((container as any).storyButtons) {
        console.log('🧹 Cleaning up standalone story buttons');
        (container as any).storyButtons.forEach((button: any) => {
          if (button && button.destroy) {
            button.destroy();
          }
        });
        (container as any).storyButtons = null;
      }
      
      // Clear this as the active narrative window and process queue
      if (this.activeNarrativeWindow === container) {
        console.log('🔄 Clearing active narrative window and processing queue');
        this.activeNarrativeWindow = null;
        this.processNarrativeQueue();
      }
    });
    
    // Track this as the active narrative window
    this.activeNarrativeWindow = container;
    
    // Add an invisible interactive rectangle to handle click-to-advance
    const invisibleOverlay = this.scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0);  // Completely transparent
    invisibleOverlay.setDepth(10);  // Low depth so it doesn't interfere with text/buttons
    invisibleOverlay.setName('invisibleClickArea');
    container.add(invisibleOverlay);
    console.log(`👻 Invisible click area added: ${width}x${height}`);
    
    // Make the invisible overlay interactive for click-to-advance
    invisibleOverlay.setInteractive();
    invisibleOverlay.on('pointerup', () => {
      console.log('🎯 Invisible overlay clicked - checking if should advance story');
      // Only advance if dialog isn't complete (buttons not yet shown)
      if (!(container as any).isComplete) {
        console.log('➡️ Advancing story dialog from invisible overlay click');
        this.advanceStoryDialog(container as any);
      } else {
        console.log('⏹️ Dialog already complete, buttons should handle interactions');
      }
    });
    
    return container;
  }
  
  /**
   * Reveal the next text in the story sequence
   */
  private revealNextStoryText(container: any): void {
    // Safety check: make sure container still exists
    if (!container || !container.scene) {
      return;
    }
    
    if (container.currentTextIndex >= container.storyTexts.length) {
      this.showStoryButtons(container);
      return;
    }
    
    const currentText = container.storyTexts[container.currentTextIndex];
    const totalTexts = container.storyTexts.length;
    
    // Use stored dimensions for reliable calculations
    const containerWidth = container.containerWidth;
    const containerHeight = container.containerHeight;
    
    // Calculate vertical spacing to distribute text evenly from top to bottom
    const topMargin = 30;
    const bottomMargin = 120; // Leave space for buttons
    const availableHeight = containerHeight - topMargin - bottomMargin;
    const textSpacing = availableHeight / totalTexts;
    
    // Position this text element
    const textY = topMargin + (container.currentTextIndex * textSpacing);
    const textX = 20;
    const textWidth = containerWidth - 40; // Leave side margins
    const textHeight = Math.min(textSpacing - 10, 60); // Max height per text, with spacing
    
    console.log(`Creating text ${container.currentTextIndex}: x=${textX}, y=${textY}, w=${textWidth}, h=${textHeight}`);
    
    try {
      // Use the new narrative text creation method
      const narrativeResult = this.createNarrativeText(textX, textY, currentText, textWidth, container);
      
      // Store references for cleanup
      container.textElements.push(narrativeResult.textElement);
      container.textBackgrounds.push(narrativeResult.background);
      
    } catch (error) {
      console.warn('Could not create narrative text element:', error);
      return;
    }
    
    container.currentTextIndex++;
    
    // Auto-advance after 2 seconds (can be interrupted by clicks)
    container.autoAdvanceTimer = this.scene.time.delayedCall(2000, () => {
      this.advanceStoryDialog(container);
    });
  }
  
  /**
   * Advance the story dialog (either by click or timer)
   */
  private advanceStoryDialog(container: any): void {
    // Safety check: make sure container still exists
    if (!container || !container.scene || container.isComplete) return;
    
    // Cancel any existing timer
    if (container.autoAdvanceTimer) {
      container.autoAdvanceTimer.remove();
      container.autoAdvanceTimer = null;
    }
    
    if (container.currentTextIndex < container.storyTexts.length) {
      this.revealNextStoryText(container);
    } else {
      this.showStoryButtons(container);
    }
  }
  
  /**
   * Show Yes/No buttons after all story text is revealed
   */
  private showStoryButtons(container: any): void {
    console.log('🔘 showStoryButtons called - creating buttons');
    
    // Safety check: make sure container still exists
    if (!container || !container.scene) {
      console.log('❌ Container check failed in showStoryButtons');
      return;
    }
    
    container.isComplete = true;
    console.log('✅ Container marked as complete, creating buttons');
    
    // Hide the debug overlay when buttons appear to avoid interference
    const debugOverlay = container.getByName('debugOverlay');
    if (debugOverlay) {
      debugOverlay.setVisible(false);
      debugOverlay.setInteractive(false);  // Also disable interaction
      console.log('🔍 Debug overlay hidden AND disabled - buttons should be fully interactive now');
    } else {
      console.log('❌ Could not find debug overlay to hide');
    }
    
    // Change main window to transparent grey when buttons appear
    const mainWindow = container.getFirst(); // The main window should be the first child
    if (mainWindow) {
      // Clear and redraw the main window with transparent grey
      mainWindow.clear();
      
      // Recreate the window with new styling - transparent grey
      const windowConfig = {
        x: 0, 
        y: 0, 
        width: container.containerWidth, 
        height: container.containerHeight,
        fillColor: 0xcccccc, // Light grey color
        fillAlpha: 0.85 // 85% opacity (15% transparent)
      };
      
      // Use the same organic rectangle creation but with new color/transparency
      const graphics = mainWindow; // Reuse the existing graphics object
      const strokeWidth = 2;
      const strokeColor = 0x000000; // Black stroke
      
      // Recreate the polygon with new styling (using same logic as createCollageRect)
      const offset = 5;
      const polygonPoints = [];
      const extraPointCount = Phaser.Math.Between(2, 5);
      
      const topEdgePoints = [];
      const rightEdgePoints = [];
      const bottomEdgePoints = [];
      const leftEdgePoints = [];
      
      // Generate same organic polygon structure but with transparent grey
      topEdgePoints.push({ 
        x: windowConfig.x - offset + Phaser.Math.Between(-5, -2),
        y: windowConfig.y - offset + Phaser.Math.Between(-5, -2)
      });
      rightEdgePoints.push({ 
        x: windowConfig.x + windowConfig.width + offset + Phaser.Math.Between(2, 5),
        y: windowConfig.y - offset + Phaser.Math.Between(-5, -2)
      });
      bottomEdgePoints.push({ 
        x: windowConfig.x + windowConfig.width + offset + Phaser.Math.Between(2, 5),
        y: windowConfig.y + windowConfig.height + offset + Phaser.Math.Between(2, 5)
      });
      leftEdgePoints.push({ 
        x: windowConfig.x - offset + Phaser.Math.Between(-5, -2),
        y: windowConfig.y + windowConfig.height + offset + Phaser.Math.Between(2, 5)
      });
      
      for (let i = 0; i < extraPointCount; i++) {
        const edgeIndex = Phaser.Math.Between(0, 3);
        
        switch (edgeIndex) {
          case 0: // Top edge
            topEdgePoints.push({
              x: Phaser.Math.Between(windowConfig.x - offset + 10, windowConfig.x + windowConfig.width + offset - 10) + Phaser.Math.Between(-4, 4),
              y: windowConfig.y - offset + Phaser.Math.Between(-8, -2)
            });
            break;
          case 1: // Right edge
            rightEdgePoints.push({
              x: windowConfig.x + windowConfig.width + offset + Phaser.Math.Between(2, 8),
              y: Phaser.Math.Between(windowConfig.y - offset + 10, windowConfig.y + windowConfig.height + offset - 10) + Phaser.Math.Between(-4, 4)
            });
            break;
          case 2: // Bottom edge
            bottomEdgePoints.push({
              x: Phaser.Math.Between(windowConfig.x - offset + 10, windowConfig.x + windowConfig.width + offset - 10) + Phaser.Math.Between(-4, 4),
              y: windowConfig.y + windowConfig.height + offset + Phaser.Math.Between(2, 8)
            });
            break;
          case 3: // Left edge
            leftEdgePoints.push({
              x: windowConfig.x - offset + Phaser.Math.Between(-8, -2),
              y: Phaser.Math.Between(windowConfig.y - offset + 10, windowConfig.y + windowConfig.height + offset - 10) + Phaser.Math.Between(-4, 4)
            });
            break;
        }
      }
      
      // Sort and combine points
      topEdgePoints.sort((a, b) => a.x - b.x);
      rightEdgePoints.sort((a, b) => a.y - b.y);
      bottomEdgePoints.sort((a, b) => b.x - a.x);
      leftEdgePoints.sort((a, b) => b.y - a.y);
      
      polygonPoints.push(...topEdgePoints);
      polygonPoints.push(...rightEdgePoints);
      polygonPoints.push(...bottomEdgePoints);
      polygonPoints.push(...leftEdgePoints);
      
      // Draw shadow
      const shadowOffset = 6;
      graphics.fillStyle(0x222222, 1.0);
      graphics.beginPath();
      graphics.moveTo(polygonPoints[0].x + shadowOffset, polygonPoints[0].y + shadowOffset);
      for (let i = 1; i < polygonPoints.length; i++) {
        graphics.lineTo(polygonPoints[i].x + shadowOffset, polygonPoints[i].y + shadowOffset);
      }
      graphics.closePath();
      graphics.fillPath();
      
      // Draw main polygon with transparent grey
      graphics.lineStyle(strokeWidth, strokeColor);
      graphics.fillStyle(windowConfig.fillColor, windowConfig.fillAlpha);
      graphics.beginPath();
      graphics.moveTo(polygonPoints[0].x, polygonPoints[0].y);
      for (let i = 1; i < polygonPoints.length; i++) {
        graphics.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }
      graphics.closePath();
      graphics.fillPath();
      graphics.strokePath();
      
      // Draw the clean rectangle on top
      graphics.fillStyle(windowConfig.fillColor, windowConfig.fillAlpha);
      graphics.fillRect(windowConfig.x, windowConfig.y, windowConfig.width, windowConfig.height);
    }
    
    // Use actual rectangle dimensions instead of container bounds
    const width = container.containerWidth;
    const height = container.containerHeight;
    
    // Get container's world position for absolute button positioning
    const containerX = container.x;
    const containerY = container.y;
    
    // Create Yes, Maybe, and No buttons in bottom right, stacked vertically with proper spacing
    const buttonWidth = 80;
    const buttonHeight = 30;
    const buttonSpacing = 35; // Increased vertical spacing to prevent overlap
    const marginFromEdge = 15; // Small margin from the actual rectangle edges
    
    // Position three buttons in bottom right corner using ABSOLUTE world coordinates
    const buttonX = containerX + width - buttonWidth - marginFromEdge;
    const noButtonY = containerY + height - buttonHeight - marginFromEdge;
    const maybeButtonY = noButtonY - buttonHeight - buttonSpacing;
    const yesButtonY = maybeButtonY - buttonHeight - buttonSpacing;
    
    // Create buttons at absolute world positions with proper organic styling like R debug windows
    const yesButton = this.createCollageButton(0, 0, buttonWidth, buttonHeight);  
    const maybeButton = this.createCollageButton(0, 0, buttonWidth, buttonHeight);
    const noButton = this.createCollageButton(0, 0, buttonWidth, buttonHeight);
    
    // Position the Graphics objects at absolute world coordinates
    yesButton.setPosition(buttonX, yesButtonY);
    maybeButton.setPosition(buttonX, maybeButtonY);
    noButton.setPosition(buttonX, noButtonY);
    
    // Make buttons visible with high depth - SET DEPTH IMMEDIATELY
    yesButton.setVisible(true);
    maybeButton.setVisible(true);
    noButton.setVisible(true);
    yesButton.setDepth(5000);    // Much higher than container (depth 2000)
    maybeButton.setDepth(5000);
    noButton.setDepth(5000);
    
    // Debug logging
    console.log(`🎨 Scene name: ${this.scene.scene.key}`);
    console.log(`🎨 Yes button visible: ${yesButton.visible}, depth: ${yesButton.depth}`);
    
    console.log(`🔘 Buttons created at absolute positions: Yes(${buttonX},${yesButtonY}), Maybe(${buttonX},${maybeButtonY}), No(${buttonX},${noButtonY})`);
    
    // Add button labels at absolute positions (NOT added to container)
    const yesLabel = this.scene.add.text(buttonX + buttonWidth/2, yesButtonY + buttonHeight/2, 'Yes', { fontSize: '14px', color: '#000000' });
    yesLabel.setOrigin(0.5, 0.5);
    yesLabel.setDepth(5001);    // Higher than everything
    const maybeLabel = this.scene.add.text(buttonX + buttonWidth/2, maybeButtonY + buttonHeight/2, 'Maybe', { fontSize: '14px', color: '#000000' });
    maybeLabel.setOrigin(0.5, 0.5);
    maybeLabel.setDepth(5001);
    const noLabel = this.scene.add.text(buttonX + buttonWidth/2, noButtonY + buttonHeight/2, 'No', { fontSize: '14px', color: '#000000' });
    noLabel.setOrigin(0.5, 0.5);
    noLabel.setDepth(5001);
    
    // Store button references on container for cleanup (no debug overlays needed)
    (container as any).storyButtons = [yesButton, maybeButton, noButton, yesLabel, maybeLabel, noLabel];
    console.log('🔘 Buttons created at absolute world positions (not in container)');
    
    // Labels already have depth set to 301, buttons have depth 200
    // Make buttons interactive with explicit hit areas and global coordinates
    const yesButtonBounds = new Phaser.Geom.Rectangle(0, 0, buttonWidth, buttonHeight);
    const maybeButtonBounds = new Phaser.Geom.Rectangle(0, 0, buttonWidth, buttonHeight);
    const noButtonBounds = new Phaser.Geom.Rectangle(0, 0, buttonWidth, buttonHeight);
    
    yesButton.setInteractive(yesButtonBounds, Phaser.Geom.Rectangle.Contains);
    maybeButton.setInteractive(maybeButtonBounds, Phaser.Geom.Rectangle.Contains);
    noButton.setInteractive(noButtonBounds, Phaser.Geom.Rectangle.Contains);
    console.log('🖱️ Buttons made interactive with explicit hit areas and depths set to 200+');
    
    // Add hover events to buttons for debugging
    yesButton.on('pointerover', () => console.log('🖱️ Hovering over Yes button'));
    yesButton.on('pointerout', () => console.log('🖱️ Left Yes button'));
    maybeButton.on('pointerover', () => console.log('🖱️ Hovering over Maybe button'));
    maybeButton.on('pointerout', () => console.log('🖱️ Left Maybe button'));
    noButton.on('pointerover', () => console.log('🖱️ Hovering over No button'));
    noButton.on('pointerout', () => console.log('🖱️ Left No button'));
    
    yesButton.on('pointerdown', () => {
      console.log('User selected: Yes - destroying container...');
      // Close the dialog - this will trigger the destroy event and process the queue
      container.destroy();
    });
    
    maybeButton.on('pointerdown', () => {
      console.log('User selected: Maybe - destroying container...');
      // Close the dialog - this will trigger the destroy event and process the queue
      container.destroy();
    });
    
    noButton.on('pointerdown', () => {
      console.log('User selected: No - destroying container...');  
      // Close the dialog - this will trigger the destroy event and process the queue
      container.destroy();
    });
  }
  
  /**
   * Process the next queued narrative window if one exists
   */
  private processNarrativeQueue(): void {
    console.log(`📋 Processing queue - ${this.narrativeWindowQueue.length} items waiting`);
    if (this.narrativeWindowQueue.length > 0) {
      const nextRequest = this.narrativeWindowQueue.shift();
      if (nextRequest) {
        console.log('🎭 Processing queued narrative window...');
        // Small delay to ensure cleanup is complete
        this.scene.time.delayedCall(100, () => {
          this.createStoryDialogComposition(
            nextRequest.x, 
            nextRequest.y, 
            nextRequest.width, 
            nextRequest.height, 
            nextRequest.backgroundImageKey
          );
        });
      }
    } else {
      console.log('📋 Queue is empty - no more narrative windows to process');
    }
  }
  
  /**
   * Manually close the active narrative window and process the queue
   */
  closeActiveNarrativeWindow(): void {
    if (this.activeNarrativeWindow && this.activeNarrativeWindow.scene) {
      this.activeNarrativeWindow.destroy();
      // The destroy event will handle clearing activeNarrativeWindow and processing queue
    }
  }
  
  /**
   * Get the number of queued narrative windows
   */
  getQueuedNarrativeCount(): number {
    return this.narrativeWindowQueue.length;
  }
  
  /**
   * Clear all queued narrative windows
   */
  clearNarrativeQueue(): void {
    this.narrativeWindowQueue.length = 0;
  }
  
  /**
   * Force clear the active narrative window (for debugging)
   */
  forceResetNarrativeSystem(): void {
    console.log('🔧 Force resetting narrative system...');
    if (this.activeNarrativeWindow) {
      console.log('🗑️ Destroying active narrative window');
      this.activeNarrativeWindow.destroy();
    }
    this.activeNarrativeWindow = null;
    this.narrativeWindowQueue.length = 0;
    console.log('✅ Narrative system reset complete');
  }
}
