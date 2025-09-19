/**
 * GAME ELEMENTS CONFIGURATION
 * 
 * This module provides a centralized configuration system for game elements
 * including UI positioning, virtual pet layouts, item sizes, and physics settings.
 * 
 * The configuration is loaded from GameElements.json and provides easy access
 * to positioning and sizing data for all major game elements.
 */

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Scale {
  scale: number;
}

export interface PetConfig extends Position, Scale {}

export interface ItemSizeConfig extends Size, Scale {
  description: string;
}

export interface GameElementsConfig {
  ui: {
    rearviewMirror: {
      position: Position;
      size: Size;
    };
    steeringWheel: {
      position: Position;
      scale: number;
    };
    magneticTarget: {
      position: Position;
      radius: number;
    };
  };
  virtualPets: {
    positions: PetConfig[];
  };
  itemSizes: {
    small: ItemSizeConfig;
    medium: ItemSizeConfig;
    large: ItemSizeConfig;
  };
  physics: {
    gravity: {
      baseY: number;
      maxLateralGx: number;
    };
    magnetic: {
      attractionWindowMs: number;
    };
  };
}

// Default configuration (fallback if JSON fails to load)
const DEFAULT_CONFIG: GameElementsConfig = {
  ui: {
    rearviewMirror: {
      position: { x: 0.55, y: -0.1 },
      size: { width: 0.92, height: 0.4 }
    },
    steeringWheel: {
      position: { x: 0.25, y: 0.8 },
      scale: 1.0
    },
    magneticTarget: {
      position: { x: 320, y: 550 },
      radius: 25
    }
  },
  virtualPets: {
    positions: [
      { x: 0.15, y: 0.9, scale: 0.8 },
      { x: 0.35, y: 0.85, scale: 0.8 },
      { x: 0.55, y: 0.95, scale: 0.8 },
      { x: 0.75, y: 0.87, scale: 0.8 },
      { x: 0.95, y: 0.93, scale: 0.8 }
    ]
  },
  itemSizes: {
    small: { width: 20, height: 20, scale: 1.0, description: "Keys, small items" },
    medium: { width: 30, height: 30, scale: 1.5, description: "Food, medium items" },
    large: { width: 40, height: 40, scale: 2.0, description: "Large items" }
  },
  physics: {
    gravity: {
      baseY: 0.5,
      maxLateralGx: 0.8
    },
    magnetic: {
      attractionWindowMs: 900
    }
  }
};

class GameElementsManager {
  private config: GameElementsConfig = DEFAULT_CONFIG;
  private loaded: boolean = false;

  /**
   * Load configuration from JSON file
   */
  public async loadConfig(): Promise<void> {
    try {
      const response = await fetch('/GameElements.json');
      if (response.ok) {
        this.config = await response.json();
        this.loaded = true;
        console.log('✅ Game elements config loaded successfully');
      } else {
        console.warn('⚠️ Failed to load GameElements.json, using defaults');
        this.config = DEFAULT_CONFIG;
      }
    } catch (error) {
      console.warn('⚠️ Error loading GameElements.json:', error);
      this.config = DEFAULT_CONFIG;
    }
  }

  /**
   * Get the current configuration
   */
  public getConfig(): GameElementsConfig {
    return this.config;
  }

  /**
   * Check if config has been loaded
   */
  public isLoaded(): boolean {
    return this.loaded;
  }

  // Convenience methods for common access patterns

  /**
   * Get rearview mirror configuration
   */
  public getRearviewMirror() {
    return this.config.ui.rearviewMirror;
  }

  /**
   * Get steering wheel configuration
   */
  public getSteeringWheel() {
    return this.config.ui.steeringWheel;
  }

  /**
   * Get magnetic target configuration
   */
  public getMagneticTarget() {
    return this.config.ui.magneticTarget;
  }

  /**
   * Get virtual pet positions
   */
  public getVirtualPetPositions() {
    return this.config.virtualPets.positions;
  }

  /**
   * Get item size configuration by type
   */
  public getItemSize(sizeType: 'small' | 'medium' | 'large'): ItemSizeConfig {
    return this.config.itemSizes[sizeType];
  }

  /**
   * Get physics configuration
   */
  public getPhysics() {
    return this.config.physics;
  }

  /**
   * Convert percentage position to pixel position
   */
  public toPixelPosition(position: Position, screenWidth: number, screenHeight: number): Position {
    return {
      x: position.x * screenWidth,
      y: position.y * screenHeight
    };
  }

  /**
   * Convert percentage size to pixel size
   */
  public toPixelSize(size: Size, screenWidth: number, screenHeight: number): Size {
    return {
      width: size.width * screenWidth,
      height: size.height * screenHeight
    };
  }
}

// Export singleton instance
export const gameElements = new GameElementsManager();
export type { GameElementsConfig, Position, Size, Scale, PetConfig, ItemSizeConfig };
