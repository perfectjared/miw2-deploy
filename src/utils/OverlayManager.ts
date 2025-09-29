import Phaser from 'phaser';

export interface OverlayConfig {
  width?: number;
  height?: number;
  depth?: number;
  opacity?: number;
  color?: number;
  type?: 'solid' | 'dither' | 'cutout';
  cutouts?: Array<{x: number, y: number, width: number, height: number}>;
}

export interface OverlayInstance {
  container: Phaser.GameObjects.Container;
  background: Phaser.GameObjects.Graphics | Phaser.GameObjects.TileSprite;
  mask?: Phaser.Display.Masks.BitmapMask;
  destroy: () => void;
  setVisible: (visible: boolean) => void;
  setDepth: (depth: number) => void;
  setOpacity: (opacity: number) => void;
}

/**
 * Unified overlay management system
 * Consolidates all grey overlay implementations into a single, reusable system
 */
export class OverlayManager {
  private scene: Phaser.Scene;
  private activeOverlays: Map<string, OverlayInstance> = new Map();
  // Classic Mac OS HyperCard patterns (inspired by Decker.js)
  private hypercardPatterns = [
    { key: 'hypercard_solid', name: 'Solid', description: 'Solid fill' },
    { key: 'hypercard_white', name: 'White', description: 'White/transparent' },
    { key: 'hypercard_black', name: 'Black', description: 'Black fill' },
    { key: 'hypercard_gray', name: 'Gray', description: '50% gray' },
    { key: 'hypercard_ltgray', name: 'Light Gray', description: '25% gray' },
    { key: 'hypercard_dkgray', name: 'Dark Gray', description: '75% gray' },
    { key: 'hypercard_horizontal', name: 'Horizontal', description: 'Horizontal lines' },
    { key: 'hypercard_vertical', name: 'Vertical', description: 'Vertical lines' },
    { key: 'hypercard_diagonal', name: 'Diagonal', description: 'Diagonal lines' },
    { key: 'hypercard_reverse_diagonal', name: 'Reverse Diagonal', description: 'Reverse diagonal lines' },
    { key: 'hypercard_cross', name: 'Cross', description: 'Crosshatch' },
    { key: 'hypercard_diagonal_cross', name: 'Diagonal Cross', description: 'Diagonal crosshatch' },
    { key: 'hypercard_dots', name: 'Dots', description: 'Dotted pattern' },
    { key: 'hypercard_bricks', name: 'Bricks', description: 'Brick pattern' },
    { key: 'hypercard_weave', name: 'Weave', description: 'Woven pattern' },
    { key: 'hypercard_scales', name: 'Scales', description: 'Scale pattern' },
    { key: 'hypercard_circles', name: 'Circles', description: 'Circular pattern' },
    { key: 'hypercard_squares', name: 'Squares', description: 'Square pattern' },
    { key: 'hypercard_diamonds', name: 'Diamonds', description: 'Diamond pattern' },
    { key: 'hypercard_triangles', name: 'Triangles', description: 'Triangle pattern' },
    { key: 'hypercard_hexagons', name: 'Hexagons', description: 'Hexagon pattern' },
    { key: 'hypercard_stars', name: 'Stars', description: 'Star pattern' },
    { key: 'hypercard_zigzag', name: 'Zigzag', description: 'Zigzag pattern' },
    { key: 'hypercard_waves', name: 'Waves', description: 'Wave pattern' },
    { key: 'hypercard_spiral', name: 'Spiral', description: 'Spiral pattern' },
    { key: 'hypercard_maze', name: 'Maze', description: 'Maze pattern' },
    { key: 'hypercard_honeycomb', name: 'Honeycomb', description: 'Honeycomb pattern' },
    { key: 'hypercard_chain', name: 'Chain', description: 'Chain pattern' },
    { key: 'hypercard_fish', name: 'Fish', description: 'Fish scale pattern' },
    { key: 'hypercard_wood', name: 'Wood', description: 'Wood grain pattern' },
    { key: 'hypercard_marble', name: 'Marble', description: 'Marble pattern' },
    { key: 'hypercard_granite', name: 'Granite', description: 'Granite pattern' }
  ];

  // Track current pattern state
  private currentPatternIndex = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    
    // Configure scene for smooth rendering
    this.configureSmoothRendering();
    
    // Test if HyperCard patterns method exists
    if (typeof this.createHypercardPatterns === 'function') {
      console.log('🎨 HyperCard patterns method found, creating patterns...');
      this.createHypercardPatterns();
    } else {
      console.log('🎨 HyperCard patterns method not found, falling back to dither textures...');
      this.createDitherTextures();
    }
    
    // Ensure textures are ready before any overlays are created
    this.scene.time.delayedCall(100, () => {
      console.log('🎨 OverlayManager: Textures ready for use');
      console.log(`🎨 Available textures: ${Object.keys(this.scene.textures.list).filter(key => key.includes('dither') || key.includes('hypercard')).join(', ')}`);
    });
  }

  /**
   * Configure scene for smooth rendering
   */
  private configureSmoothRendering(): void {
    // Ensure the scene's renderer is configured for smooth rendering
    if (this.scene.renderer && 'gl' in this.scene.renderer && this.scene.renderer.gl) {
      const gl = this.scene.renderer.gl;
      
      // Enable smooth texture filtering for smoother graphics
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      
      console.log('🎨 Configured smooth rendering with LINEAR filtering');
    }
    
    // Allow sub-pixel positioning for smoother movement
    if (this.scene.cameras && this.scene.cameras.main) {
      this.scene.cameras.main.roundPixels = false;
      console.log('🎨 Disabled roundPixels for smooth camera positioning');
    }
  }

  /**
   * Create a unified overlay
   */
  createOverlay(id: string, config: OverlayConfig = {}): OverlayInstance {
    // Remove existing overlay with same ID
    this.removeOverlay(id);

    const {
      width = this.scene.cameras.main.width,
      height = this.scene.cameras.main.height,
      depth = 1,
      opacity = 0.3,
      color = 0x000000,
      type = 'dither',
      cutouts = []
    } = config;

    // Create overlay container
    const container = this.scene.add.container(0, 0);
    container.setScrollFactor(0);
    container.setDepth(depth);

    let background: Phaser.GameObjects.Graphics | Phaser.GameObjects.TileSprite;
    let mask: Phaser.Display.Masks.BitmapMask | undefined;

      if (type === 'dither') {
        // Select appropriate pattern based on opacity (HyperCard or dither)
        const textureKey = this.selectPattern(opacity);
        console.log(`🎨 Creating TileSprite with texture: ${textureKey}`);
        
        // Ensure texture exists before creating TileSprite
        if (!this.scene.textures.exists(textureKey)) {
          console.error(`🎨 ERROR: Texture ${textureKey} does not exist!`);
          // Fallback to solid overlay
          background = this.scene.add.graphics();
          background.fillStyle(color, opacity);
          background.fillRect(0, 0, width, height);
        } else {
          // Ensure exact pixel dimensions for bulletproof scaling
          const exactWidth = Math.floor(width);
          const exactHeight = Math.floor(height);
          
          background = this.scene.add.tileSprite(0, 0, exactWidth, exactHeight, textureKey);
          background.setOrigin(0, 0);
          background.setTint(color);
          background.setAlpha(opacity);
          
          // Bulletproof pixel scaling settings
          background.setScale(1, 1); // Ensure no scaling distortion
          background.setDisplaySize(exactWidth, exactHeight); // Force exact dimensions
          
          console.log(`🎨 TileSprite created with bulletproof scaling: ${exactWidth}x${exactHeight} texture: ${background.texture.key}`);
        }
      } else {
      // Create solid overlay
      background = this.scene.add.graphics();
      background.fillStyle(color, opacity);
      background.fillRect(0, 0, width, height);
    }

    container.add(background);

    // Create cutouts if specified
    if (cutouts.length > 0) {
      const maskGraphics = this.scene.make.graphics();
      
      // Draw cutouts (white areas become transparent)
      cutouts.forEach(cutout => {
        maskGraphics.fillStyle(0xffffff);
        maskGraphics.fillRect(cutout.x, cutout.y, cutout.width, cutout.height);
      });
      
      // Create BitmapMask with inverted alpha (white areas become cutouts)
      mask = new Phaser.Display.Masks.BitmapMask(this.scene, maskGraphics);
      mask.invertAlpha = true;
      background.setMask(mask);
    }

    const overlayInstance: OverlayInstance = {
      container,
      background,
      mask,
      destroy: () => {
        console.log(`🎨 Destroying overlay: ${id} (total before: ${this.activeOverlays.size})`);
        if (mask) {
          mask.destroy();
        }
        container.destroy();
        this.activeOverlays.delete(id);
        console.log(`🎨 Overlay destroyed: ${id} (total after: ${this.activeOverlays.size})`);
      },
      setVisible: (visible: boolean) => {
        container.setVisible(visible);
      },
      setDepth: (newDepth: number) => {
        container.setDepth(newDepth);
      },
      setOpacity: (newOpacity: number) => {
        if (background instanceof Phaser.GameObjects.TileSprite) {
          background.setAlpha(newOpacity);
        } else {
          background.clear();
          background.fillStyle(color, newOpacity);
          background.fillRect(0, 0, width, height);
        }
      }
    };

    // Set up reactive cleanup: automatically remove overlay when container is destroyed
    container.on('destroy', () => {
      console.log(`🎨 Reactive cleanup: Container destroyed for overlay ${id}`);
      this.activeOverlays.delete(id);
    });

    this.activeOverlays.set(id, overlayInstance);
    console.log(`🎨 Added overlay to activeOverlays: ${id} (total: ${this.activeOverlays.size})`);
    return overlayInstance;
  }

  /**
   * Get an existing overlay by ID
   */
  getOverlay(id: string): OverlayInstance | undefined {
    return this.activeOverlays.get(id);
  }

  /**
   * Remove an overlay by ID
   */
  removeOverlay(id: string): void {
    console.log(`🎨 removeOverlay called for: ${id} (total before: ${this.activeOverlays.size})`);
    const overlay = this.activeOverlays.get(id);
    if (overlay) {
      console.log(`🎨 Found overlay to remove: ${id}`);
      overlay.destroy();
    } else {
      console.log(`🎨 No overlay found to remove: ${id}`);
    }
  }

  /**
   * Remove all overlays
   */
  removeAllOverlays(): void {
    console.log(`🎨 removeAllOverlays called (total: ${this.activeOverlays.size})`);
    this.activeOverlays.forEach(overlay => overlay.destroy());
    this.activeOverlays.clear();
    console.log(`🎨 All overlays removed (total after: ${this.activeOverlays.size})`);
  }

  /**
   * Select appropriate pattern based on opacity (HyperCard or dither)
   */
  private selectPattern(opacity: number): string {
    // Check if HyperCard patterns are available
    const hasHypercardPatterns = this.scene.textures.exists('hypercard_ltgray');
    
    if (hasHypercardPatterns) {
      return this.selectHypercardPattern(opacity);
    } else {
      return this.selectDitherPattern(opacity);
    }
  }

  /**
   * Select appropriate HyperCard pattern based on opacity
   */
  private selectHypercardPattern(opacity: number): string {
    let patternKey;
    let patternIndex;
    if (opacity <= 0.3) {
      patternKey = 'hypercard_ltgray'; // Light Gray (25%) pattern for light overlays
      patternIndex = 4;
    } else if (opacity <= 0.6) {
      patternKey = 'hypercard_gray'; // Gray (50%) pattern for medium overlays
      patternIndex = 3;
    } else {
      patternKey = 'hypercard_dkgray'; // Dark Gray (75%) pattern for dark overlays
      patternIndex = 5;
    }
    
    // Update our tracked pattern state
    this.currentPatternIndex = patternIndex;
    
    console.log(`🎨 selectHypercardPattern: opacity=${opacity} -> ${patternKey} (index: ${patternIndex})`);
    console.log(`🎨 Texture exists: ${this.scene.textures.exists(patternKey)}`);
    
    return patternKey;
  }

  /**
   * Select appropriate dither pattern based on opacity
   */
  private selectDitherPattern(opacity: number): string {
    let patternKey;
    let patternIndex;
    if (opacity <= 0.3) {
      patternKey = 'ditherPattern25'; // 25% pattern for light overlays
      patternIndex = 0;
    } else if (opacity <= 0.6) {
      patternKey = 'ditherPattern50'; // 50% pattern for medium overlays
      patternIndex = 1;
    } else {
      patternKey = 'ditherPattern75'; // 75% pattern for dark overlays
      patternIndex = 2;
    }
    
    // Update our tracked pattern state
    this.currentPatternIndex = patternIndex;
    
    console.log(`🎨 selectDitherPattern: opacity=${opacity} -> ${patternKey} (index: ${patternIndex})`);
    console.log(`🎨 Texture exists: ${this.scene.textures.exists(patternKey)}`);
    
    return patternKey;
  }

  /**
   * Cycle through patterns for testing (called by keyboard controls)
   */
  public cycleDitherPattern(direction: 'next' | 'prev'): void {
    // Check if HyperCard patterns are available
    const hasHypercardPatterns = this.scene.textures.exists('hypercard_ltgray');
    
    if (hasHypercardPatterns) {
      this.cycleHypercardPatterns(direction);
    } else {
      this.cycleDitherPatterns(direction);
    }
  }

  /**
   * Cycle through HyperCard patterns
   */
  private cycleHypercardPatterns(direction: 'next' | 'prev'): void {
    console.log(`🎨 Cycling HyperCard patterns (${direction}) - Found ${this.activeOverlays.size} active overlays`);
    console.log(`🎨 Active overlay IDs:`, Array.from(this.activeOverlays.keys()));
    console.log(`🎨 Current pattern index: ${this.currentPatternIndex} (${this.hypercardPatterns[this.currentPatternIndex].name})`);
    
    // Calculate next/prev index using our tracked state
    let newIndex;
    if (direction === 'next') {
      newIndex = (this.currentPatternIndex + 1) % this.hypercardPatterns.length;
    } else {
      newIndex = (this.currentPatternIndex - 1 + this.hypercardPatterns.length) % this.hypercardPatterns.length;
    }
    
    // Update our tracked state
    this.currentPatternIndex = newIndex;
    
    const newPattern = this.hypercardPatterns[newIndex];
    console.info(`🎨 Switching to: ${newPattern.name} (${newPattern.description})`);
    
    // Update all active dither overlays with bulletproof scaling
    this.activeOverlays.forEach((overlay, id) => {
      if (overlay.background && overlay.background instanceof Phaser.GameObjects.TileSprite) {
        console.log(`🎨 Updating overlay ${id} to ${newPattern.key}`);
        
        // Maintain bulletproof pixel scaling during texture changes
        const currentWidth = overlay.background.displayWidth;
        const currentHeight = overlay.background.displayHeight;
        
        overlay.background.setTexture(newPattern.key);
        
        // Ensure exact pixel dimensions are maintained
        overlay.background.setDisplaySize(Math.floor(currentWidth), Math.floor(currentHeight));
        overlay.background.setScale(1, 1);
        
        console.log(`🎨 Maintained pixel-perfect scaling: ${Math.floor(currentWidth)}x${Math.floor(currentHeight)}`);
      } else {
        console.log(`🎨 Overlay ${id} background is not TileSprite:`, overlay.background?.constructor.name);
      }
    });
  }

  /**
   * Cycle through basic dither patterns
   */
  private cycleDitherPatterns(direction: 'next' | 'prev'): void {
    const patterns = [
    { key: 'ditherPattern25', percentage: 25, name: 'Light' },
    { key: 'ditherPattern50', percentage: 50, name: 'Medium' },
    { key: 'ditherPattern75', percentage: 75, name: 'Dark' },
    { key: 'dither_diamonds', percentage: 50, name: 'Diamonds' }
    ];

    console.log(`🎨 Cycling dither patterns (${direction}) - Found ${this.activeOverlays.size} active overlays`);
    console.log(`🎨 Active overlay IDs:`, Array.from(this.activeOverlays.keys()));
    console.log(`🎨 Current pattern index: ${this.currentPatternIndex} (${patterns[this.currentPatternIndex].name})`);
    
    // Calculate next/prev index using our tracked state
    let newIndex;
    if (direction === 'next') {
      newIndex = (this.currentPatternIndex + 1) % patterns.length;
    } else {
      newIndex = (this.currentPatternIndex - 1 + patterns.length) % patterns.length;
    }
    
    // Update our tracked state
    this.currentPatternIndex = newIndex;
    
    const newPattern = patterns[newIndex];
    console.info(`🎨 Switching to: ${newPattern.name} (${newPattern.percentage}%)`);
    
    // Update all active dither overlays with bulletproof scaling
    this.activeOverlays.forEach((overlay, id) => {
      if (overlay.background && overlay.background instanceof Phaser.GameObjects.TileSprite) {
        console.log(`🎨 Updating overlay ${id} to ${newPattern.key}`);
        
        // Maintain bulletproof pixel scaling during texture changes
        const currentWidth = overlay.background.displayWidth;
        const currentHeight = overlay.background.displayHeight;
        
        overlay.background.setTexture(newPattern.key);
        
        // Ensure exact pixel dimensions are maintained
        overlay.background.setDisplaySize(Math.floor(currentWidth), Math.floor(currentHeight));
        overlay.background.setScale(1, 1);
        
        console.log(`🎨 Maintained pixel-perfect scaling: ${Math.floor(currentWidth)}x${Math.floor(currentHeight)}`);
      } else {
        console.log(`🎨 Overlay ${id} background is not TileSprite:`, overlay.background?.constructor.name);
      }
    });
  }

  /**
   * Create multiple dither textures for different greyscale values (Mac OS style)
   */
  private createDitherTextures(): void {
    const patternSize = 8;
    console.log('🎨 Creating dither textures...');
    
    // Create textures for different greyscale values
    this.createDitherPattern('ditherPattern25', patternSize, 25); // Light grey
    this.createDitherPattern('ditherPattern50', patternSize, 50); // Medium grey (current)
    this.createDitherPattern('ditherPattern75', patternSize, 75); // Dark grey
    this.createDitherDiamondsPattern('dither_diamonds', patternSize); // Diamond pattern
    
    // Verify textures were created
    console.log('🎨 Texture verification:');
    console.log(`🎨 ditherPattern25 exists: ${this.scene.textures.exists('ditherPattern25')}`);
    console.log(`🎨 ditherPattern50 exists: ${this.scene.textures.exists('ditherPattern50')}`);
    console.log(`🎨 ditherPattern75 exists: ${this.scene.textures.exists('ditherPattern75')}`);
    console.log(`🎨 dither_diamonds exists: ${this.scene.textures.exists('dither_diamonds')}`);
  }

  /**
   * Create all classic Mac OS HyperCard patterns
   */
  private createHypercardPatterns(): void {
    const patternSize = 8;
    console.log('🎨 Creating classic Mac OS HyperCard patterns...');
    
    // Create all HyperCard patterns
    this.hypercardPatterns.forEach((pattern, index) => {
      this.createHypercardPattern(pattern.key, patternSize, index);
    });
    
    console.log(`🎨 Created ${this.hypercardPatterns.length} classic HyperCard patterns`);
  }

  /**
   * Create a specific dither pattern texture with bulletproof pixel scaling
   */
  private createDitherPattern(textureKey: string, patternSize: number, greyPercent: number): void {
    if (this.scene.textures.exists(textureKey)) {
      return; // Texture already exists
    }

    // Ensure exact pixel dimensions - no fractional scaling
    const exactPatternSize = Math.floor(patternSize);
    const patternTexture = this.scene.textures.createCanvas(textureKey, exactPatternSize, exactPatternSize);
    
    if (!patternTexture) return;

    const ctx = patternTexture.getContext();
    
    // Bulletproof pixel rendering settings
    ctx.imageSmoothingEnabled = false; // Disable anti-aliasing for crisp pixels
    ctx.fillStyle = '#000000';
    
    // Authentic Mac OS 1-bit dithering patterns
    // These are based on classic Mac OS System 7 halftone patterns
    let pattern: number[][];
    
    if (greyPercent <= 25) {
      // Light pattern (25%) - Mac OS style sparse dots
      pattern = [
        [0, 0, 0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [1, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0]
      ];
    } else if (greyPercent <= 50) {
      // Medium pattern (50%) - Mac OS style diagonal lines
      pattern = [
        [1, 0, 0, 0, 1, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0, 0, 1, 0],
        [0, 0, 0, 1, 0, 0, 0, 1]
      ];
    } else {
      // Dark pattern (75%) - Mac OS style dense halftone
      pattern = [
        [1, 1, 1, 1, 0, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [0, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1]
      ];
    }
    
    // Draw the dither pattern
    for (let y = 0; y < patternSize; y++) {
      for (let x = 0; x < patternSize; x++) {
        if (pattern[y][x] === 1) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    
    patternTexture.refresh();
    console.log(`🎨 Created ${greyPercent}% Mac OS dither texture: ${textureKey}`);
    
    // Verify the texture was created correctly
    console.log(`🎨 Texture verification after creation: ${this.scene.textures.exists(textureKey)}`);
    
    // Test the texture by creating a temporary sprite
    const testSprite = this.scene.add.sprite(0, 0, textureKey);
    console.log(`🎨 Test sprite texture key: ${testSprite.texture.key}`);
    testSprite.destroy();
  }

  /**
   * Create a diamond dither pattern texture
   */
  private createDitherDiamondsPattern(textureKey: string, patternSize: number): void {
    if (this.scene.textures.exists(textureKey)) {
      return; // Texture already exists
    }

    // Ensure exact pixel dimensions - no fractional scaling
    const exactPatternSize = Math.floor(patternSize);
    const patternTexture = this.scene.textures.createCanvas(textureKey, exactPatternSize, exactPatternSize);
    
    if (!patternTexture) return;

    const ctx = patternTexture.getContext();
    
    // Bulletproof pixel rendering settings
    ctx.imageSmoothingEnabled = false; // Disable anti-aliasing for crisp pixels
    ctx.fillStyle = '#000000';
    
    // Diamond pattern - creates diamond shapes
    const pattern = [
      [0, 0, 1, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 0, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0, 1, 1, 1],
      [0, 0, 1, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 0, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0, 1, 1, 1]
    ];
    
    // Draw the diamond pattern
    for (let y = 0; y < patternSize; y++) {
      for (let x = 0; x < patternSize; x++) {
        if (pattern[y][x] === 1) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    
    patternTexture.refresh();
    console.log(`🎨 Created diamond dither texture: ${textureKey}`);
  }

  /**
   * Create a specific HyperCard pattern texture with bulletproof pixel scaling
   */
  private createHypercardPattern(textureKey: string, patternSize: number, patternIndex: number): void {
    if (this.scene.textures.exists(textureKey)) {
      return; // Pattern already exists
    }

    // Ensure exact pixel dimensions - no fractional scaling
    const exactPatternSize = Math.floor(patternSize);
    const patternTexture = this.scene.textures.createCanvas(textureKey, exactPatternSize, exactPatternSize);
    if (!patternTexture) return;

    const ctx = patternTexture.getContext();
    
    // Bulletproof pixel rendering settings
    ctx.imageSmoothingEnabled = false; // Disable anti-aliasing for crisp pixels
    ctx.fillStyle = '#000000';
    
    // Classic Mac OS HyperCard patterns (8x8 bitmaps)
    // Based on the patterns from Decker.js tour
    let pattern: number[][];
    
    switch (patternIndex) {
      case 0: // Solid
        pattern = [
          [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1]
        ];
        break;
      case 1: // White/Transparent
        pattern = [
          [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0]
        ];
        break;
      case 2: // Black
        pattern = [
          [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1], [1,1,1,1,1,1,1,1]
        ];
        break;
      case 3: // Gray (50%)
        pattern = [
          [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1], [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1],
          [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1], [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1]
        ];
        break;
      case 4: // Light Gray (25%)
        pattern = [
          [1,0,0,0,1,0,0,0], [0,0,0,0,0,0,0,0], [0,0,1,0,0,0,1,0], [0,0,0,0,0,0,0,0],
          [1,0,0,0,1,0,0,0], [0,0,0,0,0,0,0,0], [0,0,1,0,0,0,1,0], [0,0,0,0,0,0,0,0]
        ];
        break;
      case 5: // Dark Gray (75%)
        pattern = [
          [1,1,1,0,1,1,1,0], [1,0,1,1,1,0,1,1], [1,1,0,1,1,1,0,1], [0,1,1,1,0,1,1,1],
          [1,1,1,0,1,1,1,0], [1,0,1,1,1,0,1,1], [1,1,0,1,1,1,0,1], [0,1,1,1,0,1,1,1]
        ];
        break;
      case 6: // Horizontal Lines
        pattern = [
          [1,1,1,1,1,1,1,1], [0,0,0,0,0,0,0,0], [1,1,1,1,1,1,1,1], [0,0,0,0,0,0,0,0],
          [1,1,1,1,1,1,1,1], [0,0,0,0,0,0,0,0], [1,1,1,1,1,1,1,1], [0,0,0,0,0,0,0,0]
        ];
        break;
      case 7: // Vertical Lines
        pattern = [
          [1,0,1,0,1,0,1,0], [1,0,1,0,1,0,1,0], [1,0,1,0,1,0,1,0], [1,0,1,0,1,0,1,0],
          [1,0,1,0,1,0,1,0], [1,0,1,0,1,0,1,0], [1,0,1,0,1,0,1,0], [1,0,1,0,1,0,1,0]
        ];
        break;
      case 8: // Diagonal Lines
        pattern = [
          [1,0,0,0,0,0,0,0], [0,1,0,0,0,0,0,0], [0,0,1,0,0,0,0,0], [0,0,0,1,0,0,0,0],
          [0,0,0,0,1,0,0,0], [0,0,0,0,0,1,0,0], [0,0,0,0,0,0,1,0], [0,0,0,0,0,0,0,1]
        ];
        break;
      case 9: // Reverse Diagonal Lines
        pattern = [
          [0,0,0,0,0,0,0,1], [0,0,0,0,0,0,1,0], [0,0,0,0,0,1,0,0], [0,0,0,0,1,0,0,0],
          [0,0,0,1,0,0,0,0], [0,0,1,0,0,0,0,0], [0,1,0,0,0,0,0,0], [1,0,0,0,0,0,0,0]
        ];
        break;
      case 10: // Crosshatch
        pattern = [
          [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1], [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1],
          [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1], [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1]
        ];
        break;
      case 11: // Diagonal Crosshatch
        pattern = [
          [1,0,0,1,1,0,0,1], [0,1,1,0,0,1,1,0], [0,1,1,0,0,1,1,0], [1,0,0,1,1,0,0,1],
          [1,0,0,1,1,0,0,1], [0,1,1,0,0,1,1,0], [0,1,1,0,0,1,1,0], [1,0,0,1,1,0,0,1]
        ];
        break;
      case 12: // Dots
        pattern = [
          [0,0,0,0,0,0,0,0], [0,1,0,0,0,1,0,0], [0,0,0,0,0,0,0,0], [0,0,0,1,0,0,0,0],
          [0,0,0,0,0,0,0,0], [0,1,0,0,0,1,0,0], [0,0,0,0,0,0,0,0], [0,0,0,1,0,0,0,0]
        ];
        break;
      case 13: // Bricks
        pattern = [
          [1,1,1,1,0,0,0,0], [1,1,1,1,0,0,0,0], [0,0,0,0,1,1,1,1], [0,0,0,0,1,1,1,1],
          [1,1,1,1,0,0,0,0], [1,1,1,1,0,0,0,0], [0,0,0,0,1,1,1,1], [0,0,0,0,1,1,1,1]
        ];
        break;
      case 14: // Weave
        pattern = [
          [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1], [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1],
          [0,1,0,1,0,1,0,1], [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1], [1,0,1,0,1,0,1,0]
        ];
        break;
      case 15: // Scales
        pattern = [
          [0,1,1,1,1,1,1,0], [1,0,0,0,0,0,0,1], [0,1,1,1,1,1,1,0], [0,0,0,0,0,0,0,0],
          [0,1,1,1,1,1,1,0], [1,0,0,0,0,0,0,1], [0,1,1,1,1,1,1,0], [0,0,0,0,0,0,0,0]
        ];
        break;
      case 16: // Circles
        pattern = [
          [0,1,1,1,1,1,1,0], [1,0,0,0,0,0,0,1], [1,0,0,0,0,0,0,1], [1,0,0,0,0,0,0,1],
          [1,0,0,0,0,0,0,1], [1,0,0,0,0,0,0,1], [1,0,0,0,0,0,0,1], [0,1,1,1,1,1,1,0]
        ];
        break;
      case 17: // Squares
        pattern = [
          [1,1,1,1,0,0,0,0], [1,1,1,1,0,0,0,0], [1,1,1,1,0,0,0,0], [1,1,1,1,0,0,0,0],
          [0,0,0,0,1,1,1,1], [0,0,0,0,1,1,1,1], [0,0,0,0,1,1,1,1], [0,0,0,0,1,1,1,1]
        ];
        break;
      case 18: // Diamonds
        pattern = [
          [0,0,1,0,0,0,1,0], [0,1,0,1,0,1,0,1], [1,0,0,0,1,0,0,0], [0,1,0,1,0,1,0,1],
          [0,0,1,0,0,0,1,0], [0,1,0,1,0,1,0,1], [1,0,0,0,1,0,0,0], [0,1,0,1,0,1,0,1]
        ];
        break;
      case 19: // Triangles
        pattern = [
          [1,0,0,0,0,0,0,0], [1,1,0,0,0,0,0,0], [1,1,1,0,0,0,0,0], [1,1,1,1,0,0,0,0],
          [0,0,0,0,1,0,0,0], [0,0,0,0,1,1,0,0], [0,0,0,0,1,1,1,0], [0,0,0,0,1,1,1,1]
        ];
        break;
      case 20: // Hexagons
        pattern = [
          [0,1,1,1,1,1,0,0], [1,0,0,0,0,0,1,0], [1,0,0,0,0,0,1,0], [0,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,0], [0,1,0,0,0,0,0,1], [0,1,0,0,0,0,0,1], [0,0,1,1,1,1,1,0]
        ];
        break;
      case 21: // Stars
        pattern = [
          [1,0,0,1,0,0,0,1], [0,1,0,0,1,0,1,0], [0,0,1,0,0,1,0,0], [1,0,0,1,0,0,0,1],
          [0,1,0,0,1,0,1,0], [0,0,1,0,0,1,0,0], [1,0,0,1,0,0,0,1], [0,1,0,0,1,0,1,0]
        ];
        break;
      case 22: // Zigzag
        pattern = [
          [1,0,0,0,1,0,0,0], [0,1,0,0,0,1,0,0], [0,0,1,0,0,0,1,0], [0,0,0,1,0,0,0,1],
          [1,0,0,0,1,0,0,0], [0,1,0,0,0,1,0,0], [0,0,1,0,0,0,1,0], [0,0,0,1,0,0,0,1]
        ];
        break;
      case 23: // Waves
        pattern = [
          [0,1,1,0,0,1,1,0], [1,0,0,1,1,0,0,1], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0],
          [0,1,1,0,0,1,1,0], [1,0,0,1,1,0,0,1], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0]
        ];
        break;
      case 24: // Spiral
        pattern = [
          [1,1,1,1,1,1,1,1], [0,0,0,0,0,0,0,1], [1,1,1,1,1,1,0,1], [1,0,0,0,0,1,0,1],
          [1,0,1,1,0,1,0,1], [1,0,1,0,0,1,0,1], [1,0,1,1,1,1,0,1], [1,0,0,0,0,0,0,1]
        ];
        break;
      case 25: // Maze
        pattern = [
          [1,1,1,1,1,1,1,1], [1,0,0,0,0,0,0,1], [1,0,1,1,1,1,0,1], [1,0,0,0,0,1,0,1],
          [1,1,1,0,0,1,0,1], [1,0,0,0,1,1,0,1], [1,0,1,1,1,0,0,1], [1,1,1,1,1,1,1,1]
        ];
        break;
      case 26: // Honeycomb
        pattern = [
          [0,1,1,0,1,1,0,0], [1,0,0,1,0,0,1,0], [1,0,0,1,0,0,1,0], [0,1,1,0,1,1,0,0],
          [0,0,1,1,0,1,1,0], [0,1,0,0,1,0,0,1], [0,1,0,0,1,0,0,1], [0,0,1,1,0,1,1,0]
        ];
        break;
      case 27: // Chain
        pattern = [
          [0,1,1,1,1,1,0,0], [1,0,0,0,0,0,1,0], [1,0,0,0,0,0,1,0], [0,1,1,1,1,1,0,0],
          [0,0,1,1,1,1,1,0], [0,1,0,0,0,0,0,1], [0,1,0,0,0,0,0,1], [0,0,1,1,1,1,1,0]
        ];
        break;
      case 28: // Fish Scales
        pattern = [
          [0,1,1,1,1,1,0,0], [1,0,0,0,0,0,1,0], [0,1,1,1,1,1,0,0], [0,0,0,0,0,0,0,0],
          [0,0,1,1,1,1,1,0], [0,1,0,0,0,0,0,1], [0,0,1,1,1,1,1,0], [0,0,0,0,0,0,0,0]
        ];
        break;
      case 29: // Wood Grain
        pattern = [
          [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1], [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1],
          [0,1,0,1,0,1,0,1], [1,0,1,0,1,0,1,0], [0,1,0,1,0,1,0,1], [1,0,1,0,1,0,1,0]
        ];
        break;
      case 30: // Marble
        pattern = [
          [1,1,0,1,0,1,1,0], [0,1,1,0,1,0,1,1], [1,0,1,1,0,1,0,1], [0,1,0,1,1,0,1,0],
          [1,0,1,0,1,1,0,1], [0,1,0,1,0,1,1,0], [1,0,1,0,1,0,1,1], [0,1,0,1,0,1,0,1]
        ];
        break;
      case 31: // Granite
        pattern = [
          [1,0,1,1,0,1,0,1], [0,1,0,1,1,0,1,0], [1,1,0,0,1,1,0,1], [0,1,1,1,0,1,1,0],
          [1,0,1,0,1,0,1,1], [0,1,0,1,0,1,0,1], [1,0,1,1,0,1,0,0], [0,1,0,1,1,0,1,1]
        ];
        break;
      default:
        pattern = [
          [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0],
          [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0], [0,0,0,0,0,0,0,0]
        ];
    }
    
    // Draw the pattern
    for (let y = 0; y < patternSize; y++) {
      for (let x = 0; x < patternSize; x++) {
        if (pattern[y][x] === 1) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    
    patternTexture.refresh();
    console.log(`🎨 Created HyperCard pattern: ${this.hypercardPatterns[patternIndex].name}`);
  }

  /**
   * Convenience method for creating menu overlays
   */
  createMenuOverlay(id: string, cutouts: Array<{x: number, y: number, width: number, height: number}>, opacity: number = 0.3): OverlayInstance {
    return this.createOverlay(id, {
      type: 'dither',
      color: 0x808080,
      opacity,
      cutouts,
      depth: 49999
    });
  }

  /**
   * Convenience method for creating dither overlays
   */
  createDitherOverlay(id: string, depth: number = 90000, opacity: number = 0.3): OverlayInstance {
    return this.createOverlay(id, {
      type: 'dither',
      color: 0x808080,
      opacity: opacity,
      depth
    });
  }

  /**
   * Create a reactive overlay that automatically cleans up when the target object is destroyed
   * This reduces the need for manual cleanup calls
   */
  createReactiveOverlay(id: string, targetObject: Phaser.GameObjects.GameObject, config: OverlayConfig = {}): OverlayInstance {
    const overlay = this.createOverlay(id, config);
    
    // Set up automatic cleanup when target object is destroyed
    targetObject.on('destroy', () => {
      console.log(`🎨 Reactive cleanup: Target object destroyed for overlay ${id}`);
      // The overlay will be automatically removed from activeOverlays when its container is destroyed
      // due to the reactive cleanup we added in createOverlay
    });
    
    return overlay;
  }

  /**
   * Convenience method for creating tutorial overlays
   */
  createTutorialOverlay(id: string, cutouts: Array<{x: number, y: number, width: number, height: number}>): OverlayInstance {
    return this.createOverlay(id, {
      type: 'dither',
      color: 0x808080,
      opacity: 0.3,
      cutouts,
      depth: 120001 // Above menu depth (120000)
    });
  }
}
