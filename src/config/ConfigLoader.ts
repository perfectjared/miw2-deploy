import Phaser from 'phaser';

export interface GameConfig {
  // Game timing
  gameTime: {
    initial: number;
    stepInterval: number;
  };
  
  // Player stats
  playerStats: {
    initialMoney: number;
    initialHealth: number;
    initialSkill: number;
    initialDifficulty: number;
    initialMomentum: number;
    initialPlotA: number;
    initialPlotB: number;
    initialPlotC: number;
  };
  
  // Driving system
  driving: {
    carSpeed: {
      acceleration: number;
      maxSpeed: number;
    };
    steering: {
      sensitivity: number;
      returnSpeed: number;
    };
    knob: {
      maxAngle: number;
      returnSpeed: number;
    };
  };
  
  // Obstacle system
  obstacles: {
    pothole: {
      spawnInterval: number;
      speed: number;
      width: number; // percentage of screen width
      height: number; // percentage of screen height
      position: number; // percentage from left (0-1)
      spawnY: number; // percentage from top (0-1)
      color: string;
    };
    exit: {
      spawnInterval: number;
      speed: number;
      width: number; // pixels
      height: number; // pixels
      position: number; // percentage from left (0-1)
      spawnY: number; // percentage from top (0-1)
      color: string;
    };
  };
  
  // UI positioning
  ui: {
    countdown: {
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
    };
    stats: {
      fontSize: string;
      colors: {
        skill: string;
        difficulty: string;
        momentum: string;
        plotA: string;
        plotB: string;
        plotC: string;
      };
      backgroundColor: string;
      padding: { x: number; y: number };
    };
    managerValues: {
      fontSize: string;
      opacity: number;
      colors: {
        skill: string;
        difficulty: string;
        momentum: string;
        plotA: string;
        plotB: string;
        plotC: string;
      };
      backgroundColor: string;
      padding: { x: number; y: number };
    };
    money: {
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
    };
    health: {
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
    };
  };
  
  // Collision system
  collision: {
    menuDelay: number; // milliseconds
  };
  
  // Camera and navigation
  navigation: {
    animationDuration: number;
    overlayOffset: number;
  };
  
  // Physics system
  physics: {
    gravity: {
      x: number;
      y: number;
    };
    frontseatCircle: {
      radius: number;
      x: number;
      y: number;
      restitution: number;
      friction: number;
      density: number;
      color: string;
      hoverColor: string;
      dragColor: string;
    };
  };
}

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: GameConfig | null = null;
  private loadingPromise: Promise<GameConfig> | null = null;

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public async loadConfig(scene: Phaser.Scene): Promise<GameConfig> {
    if (this.config) {
      return this.config;
    }

    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this.loadConfigFromFile(scene);
    this.config = await this.loadingPromise;
    return this.config;
  }

  private async loadConfigFromFile(scene: Phaser.Scene): Promise<GameConfig> {
    return new Promise((resolve, reject) => {
      scene.load.json('gameConfig', 'config/game-config.json');
      scene.load.once('complete', () => {
        try {
          const configData = scene.cache.json.get('gameConfig');
          const config: GameConfig = this.validateAndTransformConfig(configData);
          console.log('Configuration loaded successfully:', config);
          resolve(config);
        } catch (error) {
          console.error('Error loading configuration:', error);
          reject(error);
        }
      });
      scene.load.once('loaderror', (file: any) => {
        console.error('Failed to load config file:', file.key);
        reject(new Error(`Failed to load config file: ${file.key}`));
      });
      scene.load.start();
    });
  }

  private validateAndTransformConfig(data: any): GameConfig {
    // Provide default values and validate the configuration
    const config: GameConfig = {
      gameTime: {
        initial: data.gameTime?.initial ?? 99,
        stepInterval: data.gameTime?.stepInterval ?? 1000,
      },
      playerStats: {
        initialMoney: data.playerStats?.initialMoney ?? 108,
        initialHealth: data.playerStats?.initialHealth ?? 10,
        initialSkill: data.playerStats?.initialSkill ?? 0,
        initialDifficulty: data.playerStats?.initialDifficulty ?? 0,
        initialMomentum: data.playerStats?.initialMomentum ?? 0,
        initialPlotA: data.playerStats?.initialPlotA ?? 0,
        initialPlotB: data.playerStats?.initialPlotB ?? 0,
        initialPlotC: data.playerStats?.initialPlotC ?? 0,
      },
      driving: {
        carSpeed: {
          acceleration: data.driving?.carSpeed?.acceleration ?? 0.1,
          maxSpeed: data.driving?.carSpeed?.maxSpeed ?? 5,
        },
        steering: {
          sensitivity: data.driving?.steering?.sensitivity ?? 2.0,
          returnSpeed: data.driving?.steering?.returnSpeed ?? 2,
        },
        knob: {
          maxAngle: data.driving?.knob?.maxAngle ?? 45,
          returnSpeed: data.driving?.knob?.returnSpeed ?? 3,
        },
      },
      obstacles: {
        pothole: {
          spawnInterval: data.obstacles?.pothole?.spawnInterval ?? 6000,
          speed: data.obstacles?.pothole?.speed ?? 1,
          width: data.obstacles?.pothole?.width ?? 0.15,
          height: data.obstacles?.pothole?.height ?? 0.02,
          position: data.obstacles?.pothole?.position ?? 0.75,
          spawnY: data.obstacles?.pothole?.spawnY ?? 0.8,
          color: data.obstacles?.pothole?.color ?? '0x8B4513',
        },
        exit: {
          spawnInterval: data.obstacles?.exit?.spawnInterval ?? 12000,
          speed: data.obstacles?.exit?.speed ?? 0.5,
          width: data.obstacles?.exit?.width ?? 30,
          height: data.obstacles?.exit?.height ?? 40,
          position: data.obstacles?.exit?.position ?? 0.75,
          spawnY: data.obstacles?.exit?.spawnY ?? 0.8,
          color: data.obstacles?.exit?.color ?? '0x00ff00',
        },
      },
      ui: {
        countdown: {
          fontSize: data.ui?.countdown?.fontSize ?? '36px',
          color: data.ui?.countdown?.color ?? '#ffffff',
          backgroundColor: data.ui?.countdown?.backgroundColor ?? '#000000',
          padding: data.ui?.countdown?.padding ?? { x: 10, y: 5 },
        },
        stats: {
          fontSize: data.ui?.stats?.fontSize ?? '18px',
          colors: {
            skill: data.ui?.stats?.colors?.skill ?? '#00ffff',
            difficulty: data.ui?.stats?.colors?.difficulty ?? '#ff00ff',
            momentum: data.ui?.stats?.colors?.momentum ?? '#ffff00',
            plotA: data.ui?.stats?.colors?.plotA ?? '#ff8800',
            plotB: data.ui?.stats?.colors?.plotB ?? '#8800ff',
            plotC: data.ui?.stats?.colors?.plotC ?? '#00ff88',
          },
          backgroundColor: data.ui?.stats?.backgroundColor ?? '#000000',
          padding: data.ui?.stats?.padding ?? { x: 6, y: 3 },
        },
        managerValues: {
          fontSize: data.ui?.managerValues?.fontSize ?? '14px',
          opacity: data.ui?.managerValues?.opacity ?? 0.5,
          colors: {
            skill: data.ui?.managerValues?.colors?.skill ?? '#00ffff',
            difficulty: data.ui?.managerValues?.colors?.difficulty ?? '#ff00ff',
            momentum: data.ui?.managerValues?.colors?.momentum ?? '#ffff00',
            plotA: data.ui?.managerValues?.colors?.plotA ?? '#ff8800',
            plotB: data.ui?.managerValues?.colors?.plotB ?? '#8800ff',
            plotC: data.ui?.managerValues?.colors?.plotC ?? '#00ff88',
          },
          backgroundColor: data.ui?.managerValues?.backgroundColor ?? '#000000',
          padding: data.ui?.managerValues?.padding ?? { x: 4, y: 2 },
        },
        money: {
          fontSize: data.ui?.money?.fontSize ?? '24px',
          color: data.ui?.money?.color ?? '#00ff00',
          backgroundColor: data.ui?.money?.backgroundColor ?? '#000000',
          padding: data.ui?.money?.padding ?? { x: 8, y: 4 },
        },
        health: {
          fontSize: data.ui?.health?.fontSize ?? '24px',
          color: data.ui?.health?.color ?? '#ff6600',
          backgroundColor: data.ui?.health?.backgroundColor ?? '#000000',
          padding: data.ui?.health?.padding ?? { x: 8, y: 4 },
        },
      },
      collision: {
        menuDelay: data.collision?.menuDelay ?? 1000,
      },
      navigation: {
        animationDuration: data.navigation?.animationDuration ?? 500,
        overlayOffset: data.navigation?.overlayOffset ?? 320,
      },
      physics: {
        gravity: {
          x: data.physics?.gravity?.x ?? 0,
          y: data.physics?.gravity?.y ?? 0.5,
        },
        frontseatCircle: {
          radius: data.physics?.frontseatCircle?.radius ?? 25,
          x: data.physics?.frontseatCircle?.x ?? 180,
          y: data.physics?.frontseatCircle?.y ?? 100,
          restitution: data.physics?.frontseatCircle?.restitution ?? 0.8,
          friction: data.physics?.frontseatCircle?.friction ?? 0.1,
          density: data.physics?.frontseatCircle?.density ?? 0.001,
          color: data.physics?.frontseatCircle?.color ?? '0xff6b6b',
          hoverColor: data.physics?.frontseatCircle?.hoverColor ?? '0xff9999',
          dragColor: data.physics?.frontseatCircle?.dragColor ?? '0xff3333',
        },
      },
    };

    return config;
  }

  public getConfig(): GameConfig {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call loadConfig() first.');
    }
    return this.config;
  }

  public reloadConfig(scene: Phaser.Scene): Promise<GameConfig> {
    this.config = null;
    this.loadingPromise = null;
    return this.loadConfig(scene);
  }
}
