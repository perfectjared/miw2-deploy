import Phaser from 'phaser';

/**
 * FULL VIEWPORT BACKGROUND PHASER INSTANCE
 * 
 * Creates a separate Phaser game that fills the entire viewport
 * with a 1-bit dithered background pattern. The main game renders
 * on top of this with transparency.
 */

class ViewportBackgroundScene extends Phaser.Scene {
  private dots: Phaser.GameObjects.Container[] = [];
  private stepCounter: number = 0;

  constructor() {
    super({ key: 'ViewportBackground' });
  }

  preload() {
    // Load authentic classic MacOS dither patterns
    this.load.image('mac_very_dark', 'assets/textures/classic_mac/mac_very_dark_8x8.png');
    this.load.image('mac_dark', 'assets/textures/classic_mac/mac_dark_8x8.png');
    this.load.image('mac_medium_dark', 'assets/textures/classic_mac/mac_medium_dark_8x8.png');
    this.load.image('mac_medium', 'assets/textures/classic_mac/mac_medium_8x8.png');
    this.load.image('mac_medium_light', 'assets/textures/classic_mac/mac_medium_light_8x8.png');
    this.load.image('mac_light', 'assets/textures/classic_mac/mac_light_8x8.png');
    this.load.image('mac_very_light', 'assets/textures/classic_mac/mac_very_light_8x8.png');
    
    // Load darker background variations
    this.load.image('very_dark_bg', 'assets/textures/backgrounds/very_dark_gray_8x8.png');
    this.load.image('dark_bg', 'assets/textures/backgrounds/dark_gray_8x8.png');
    this.load.image('medium_dark_bg', 'assets/textures/backgrounds/medium_dark_gray_8x8.png');
    
    // Load proper shadow patterns (not masks)
    this.load.image('light_shadow', 'assets/textures/shadows/light_shadow_8x8.png');
    this.load.image('medium_shadow', 'assets/textures/shadows/medium_shadow_8x8.png');
    this.load.image('dark_shadow', 'assets/textures/shadows/dark_shadow_8x8.png');
    
    // Load HyperCard patterns for variety
    this.load.image('hypercard_diagonal', 'assets/textures/hypercard/diagonal_8x8.png');
    this.load.image('hypercard_cross', 'assets/textures/hypercard/cross_hatch_8x8.png');
    this.load.image('hypercard_brick', 'assets/textures/hypercard/brick_8x8.png');
    
    // Keep original textures as fallbacks
    this.load.image('white_8x8', 'assets/textures/white_8x8.png');
    this.load.image('black_8x8', 'assets/textures/black_8x8.png');
  }

  create() {
    const width = this.scale.gameSize.width;
    const height = this.scale.gameSize.height;
    
    console.log(`Creating viewport background: ${width}x${height}`);
    
    // CRITICAL: Set all textures to nearest neighbor scaling for crisp pixels
    const textureKeys = [
      'mac_very_dark', 'mac_dark', 'mac_medium_dark', 'mac_medium', 'mac_medium_light', 'mac_light', 'mac_very_light',
      'very_dark_bg', 'dark_bg', 'medium_dark_bg',
      'light_shadow', 'medium_shadow', 'dark_shadow',
      'hypercard_diagonal', 'hypercard_cross', 'hypercard_brick',
      'white_8x8', 'black_8x8'
    ];
    
    textureKeys.forEach(key => {
      const texture = this.textures.get(key);
      if (texture && texture.source && texture.source[0]) {
        texture.source[0].scaleMode = Phaser.ScaleModes.NEAREST;
        console.log(`Set ${key} to nearest neighbor scaling`);
      }
    });
    
    // Calculate scale factor and game area position
    const gameWidth = 360;
    const gameHeight = 640;
    const scaleX = width / gameWidth;
    const scaleY = height / gameHeight;
    const scaleFactor = Math.min(scaleX, scaleY);
    
    // Calculate actual game area position (centered)
    const gameAreaWidth = gameWidth * scaleFactor;
    const gameAreaHeight = gameHeight * scaleFactor;
    const gameAreaX = (width - gameAreaWidth) / 2;
    const gameAreaY = (height - gameAreaHeight) / 2;
    
    console.log(`Game area: ${gameAreaWidth}x${gameAreaHeight} at (${gameAreaX}, ${gameAreaY})`);
    console.log(`Scale factor: ${scaleFactor.toFixed(2)} (${scaleX.toFixed(2)} x ${scaleY.toFixed(2)})`);
    
    // Create different background patterns for different areas
    this.createLayeredBackground(width, height, scaleFactor, gameAreaX, gameAreaY, gameAreaWidth, gameAreaHeight);
    
    // Create polka dots on top of background
    this.createPolkaDots(width, height, scaleFactor);
  }

  /**
   * Handle step-based movement for polka dots
   */
  step() {
    this.stepCounter++;
    if (this.stepCounter % 4 === 0) {
      this.moveDots();
      console.log(`Viewport step ${this.stepCounter}: Moving dots up and right`);
    }
  }

  /**
   * Move all dots instantly (no animation) - up and to the right with pixel-perfect movement
   */
  private moveDots() {
    this.dots.forEach(dot => {
      const originalX = (dot as any).originalX;
      const originalY = (dot as any).originalY;
      const pixelScale = (dot as any).pixelScale || 1;
      let stepOffset = (dot as any).stepOffset;
      
      // PIXEL-PERFECT movement: step size is multiple of pixel scale
      const stepSize = 2 * pixelScale; // Scale the step size appropriately
      stepOffset += stepSize;
      (dot as any).stepOffset = stepOffset;
      
      // Update position with pixel-aligned coordinates
      dot.x = Math.round(originalX + stepOffset); // Move right (pixel-aligned)
      dot.y = Math.round(originalY - stepOffset); // Move up (pixel-aligned)
    });
  }

  private createPolkaDots(width: number, height: number, scaleFactor: number) {
    // PIXEL-PERFECT SCALING for polka dots
    const pixelScale = Math.max(1, Math.round(scaleFactor));
    
    const baseSpacing = 80;
    const baseDotSize = 16; 
    const baseMargin = 40;
    
    // Scale all measurements to pixel boundaries
    const spacing = baseSpacing * pixelScale;
    const dotSize = baseDotSize * pixelScale;
    const margin = baseMargin * pixelScale;
    
    console.log(`Creating PIXEL-PERFECT dithered polka dots: ${pixelScale}x scale, ${dotSize}px dots, ${spacing}px spacing`);
    
    // Different dither patterns for variety in the dots
    const dotPatterns = ['mac_light', 'mac_medium_light', 'mac_very_light'];
    
    // PIXEL-ALIGNED grid positions
    for (let x = margin; x <= width - margin; x += spacing) {
      for (let y = margin; y <= height - margin; y += spacing) {
        // Ensure positions are pixel-aligned
        const pixelX = Math.round(x);
        const pixelY = Math.round(y);
        this.createSingleDitheredDot(pixelX, pixelY, dotSize, pixelScale, dotPatterns);
      }
    }
    
    console.log(`Created ${this.dots.length} pixel-perfect dithered polka dots`);
  }

  private createSingleDitheredDot(x: number, y: number, size: number, pixelScale: number, dotPatterns: string[]) {
    // Create a container to hold both dot and shadow together
    const dotContainer = this.add.container(x, y);
    
    // PIXEL-PERFECT shadow offset
    const shadowOffset = 3 * pixelScale; // Integer multiple
    const shadow = this.add.image(shadowOffset, shadowOffset, 'dark_shadow');
    shadow.setDisplaySize(size * 0.8, size * 0.8);
    shadow.setAlpha(0.5);
    dotContainer.add(shadow);
    
    // Choose a random light dither pattern for this "dot"
    const patternKey = dotPatterns[Math.floor(Math.random() * dotPatterns.length)];
    
    // Create dithered square "dot" with exact pixel scaling
    const dot = this.add.image(0, 0, patternKey);
    dot.setDisplaySize(size, size);
    dot.setAlpha(0.9);
    dotContainer.add(dot);
    
    // Store original position for step-based movement (pixel-aligned)
    (dotContainer as any).originalX = x;
    (dotContainer as any).originalY = y;
    (dotContainer as any).stepOffset = 0;
    (dotContainer as any).pixelScale = pixelScale; // Store for step calculations
    
    this.dots.push(dotContainer);
    dotContainer.setDepth(10);
  }

  private createDitheredShadowGraphics(graphics: Phaser.GameObjects.Graphics, offsetX: number, offsetY: number, size: number, scaleFactor: number) {
    const radius = size / 2;
    
    // Create a circular dithered shadow using the classic Mac pattern
    // We'll sample from our shadow texture and draw it procedurally for perfect circles
    const pixelSize = Math.max(1, Math.round(scaleFactor * 0.5)); // Smaller pixels for smoother shadows
    
    // Classic Mac dither threshold (simplified for performance)
    const ditherPattern = [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21]
    ];
    
    // Shadow should be DARKER than background - use black for shadow pixels
    graphics.fillStyle(0x000000, 0.7); // Black shadow with some transparency
    
    // Draw dithered shadow pattern within circle
    for (let dx = -radius; dx <= radius; dx += pixelSize) {
      for (let dy = -radius; dy <= radius; dy += pixelSize) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= radius) {
          // Get dither threshold for this position
          const patternX = Math.abs(Math.floor((offsetX + dx) / pixelSize)) % 8;
          const patternY = Math.abs(Math.floor((offsetY + dy) / pixelSize)) % 8;
          const threshold = ditherPattern[patternY][patternX];
          
          // Shadow density based on distance from edge (softer at edges)
          const edgeDistance = radius - distance;
          const shadowDensity = Math.min(1, edgeDistance / (radius * 0.3));
          
          // Make shadows darker by using a lower threshold (more black pixels)
          const adjustedThreshold = threshold * (0.4 + shadowDensity * 0.3); // Much darker shadows
          
          // Draw shadow pixel if below threshold (more pixels = darker shadow)
          if (adjustedThreshold < 45) { // Increased threshold for darker shadows
            graphics.fillRect(offsetX + dx - pixelSize/2, offsetY + dy - pixelSize/2, pixelSize, pixelSize);
          }
        }
      }
    }
  }

  private createLayeredBackground(width: number, height: number, scaleFactor: number, gameAreaX: number, gameAreaY: number, gameAreaWidth: number, gameAreaHeight: number) {
    const baseTextureSize = 8;
    
    // PIXEL-PERFECT SCALING: Round to nearest integer and ensure power-of-2 scaling
    let pixelScale = Math.max(1, Math.round(scaleFactor));
    if (pixelScale > 4) pixelScale = Math.floor(pixelScale / 2) * 2; // Keep even numbers for large scales
    const scaledTextureSize = baseTextureSize * pixelScale;
    
    // Choose MORE INTERESTING and DARKER patterns - pure black backgrounds
    let outerDitherKey = 'mac_dark';
    let gameDitherKey = 'mac_medium_dark';
    
    if (pixelScale <= 2) {
      outerDitherKey = 'mac_very_dark';
      gameDitherKey = 'mac_dark';
    } else if (pixelScale >= 4) {
      outerDitherKey = 'mac_medium_dark';
      gameDitherKey = 'mac_medium';
    }
    
    console.log(`Creating PIXEL-PERFECT background: scale=${pixelScale}x, tile=${scaledTextureSize}px, patterns: outer=${outerDitherKey}, game=${gameDitherKey}`);
    
    // PIXEL-PERFECT TILING: Use exact texture size multiples
    const tileSize = scaledTextureSize; // Use exact scaled texture size
    
    // LAYER 1: PURE BLACK background with pixel-perfect tiling
    const bgTilesX = Math.ceil(width / tileSize);
    const bgTilesY = Math.ceil(height / tileSize);
    
    // First, fill entire background with pure black
    const blackBg = this.add.rectangle(width/2, height/2, width, height, 0x000000);
    blackBg.setDepth(-3000);
    
    for (let tx = 0; tx < bgTilesX; tx++) {
      for (let ty = 0; ty < bgTilesY; ty++) {
        // PIXEL-ALIGNED positions
        const x = tx * tileSize;
        const y = ty * tileSize;
        
        const bgTile = this.add.image(x, y, outerDitherKey);
        bgTile.setOrigin(0, 0);
        bgTile.setDisplaySize(tileSize, tileSize);
        bgTile.setDepth(-2500);
        bgTile.setAlpha(1.0);
      }
    }
    
    // LAYER 2: Game area base - pixel-aligned
    const gameRect = this.add.rectangle(
      Math.round(gameAreaX + gameAreaWidth/2), 
      Math.round(gameAreaY + gameAreaHeight/2), 
      Math.round(gameAreaWidth), 
      Math.round(gameAreaHeight), 
      0x000000
    );
    gameRect.setDepth(-2000);
    gameRect.setAlpha(1.0);
    
    // LAYER 3: Game area dithering - pixel-perfect alignment
    const gameStartX = Math.floor(gameAreaX / tileSize) * tileSize;
    const gameStartY = Math.floor(gameAreaY / tileSize) * tileSize;
    const gameEndX = Math.ceil((gameAreaX + gameAreaWidth) / tileSize) * tileSize;
    const gameEndY = Math.ceil((gameAreaY + gameAreaHeight) / tileSize) * tileSize;
    
    for (let x = gameStartX; x < gameEndX; x += tileSize) {
      for (let y = gameStartY; y < gameEndY; y += tileSize) {
        // Only render tiles that overlap with the game area
        if (x < gameAreaX + gameAreaWidth && y < gameAreaY + gameAreaHeight &&
            x + tileSize > gameAreaX && y + tileSize > gameAreaY) {
          
          const gameDitherTile = this.add.image(x, y, gameDitherKey);
          gameDitherTile.setOrigin(0, 0);
          gameDitherTile.setDisplaySize(tileSize, tileSize);
          gameDitherTile.setDepth(-1500);
          gameDitherTile.setAlpha(1.0);
        }
      }
    }
    
    const totalTiles = (bgTilesX * bgTilesY) + Math.ceil((gameEndX - gameStartX) / tileSize) * Math.ceil((gameEndY - gameStartY) / tileSize);
    
    console.log(`Pixel-perfect background: ${totalTiles} tiles at ${pixelScale}x scale`);
  }
}

// Export singleton reference for step control
export let viewportBackgroundScene: ViewportBackgroundScene | null = null;

// Create the viewport background Phaser instance
const createViewportBackground = () => {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'viewport-background',
    backgroundColor: '#ffffff',
    
    // CRITICAL: Enable pixel art mode for crisp scaling
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    
    scene: [ViewportBackgroundScene],
    scale: {
      mode: Phaser.Scale.NONE, // Don't scale, use exact pixel dimensions
      width: window.innerWidth,
      height: window.innerHeight
    }
  };

  const game = new Phaser.Game(config);
  
  // Store reference to scene for step control
  game.events.once('ready', () => {
    viewportBackgroundScene = game.scene.getScene('ViewportBackground') as ViewportBackgroundScene;
  });

  return game;
};

// Handle window resize for viewport background
const handleViewportResize = (game: Phaser.Game) => {
  window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    game.scale.resize(newWidth, newHeight);
    
    // Recreate the background scene with new dimensions
    const scene = game.scene.getScene('ViewportBackground') as ViewportBackgroundScene;
    if (scene) {
      scene.scene.restart();
    }
  });
};

export { createViewportBackground, handleViewportResize };
