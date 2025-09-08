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
      tuning?: {
        baseAccelScale: number;
        decelScale: number;
        stopDecelScale: number;
      };
    };
    steering: {
      sensitivity: number;
      returnSpeed: number;
      minCrankPercentForSteering?: number;
      minSpeedForSteering?: number;
    };
    knob: {
      maxAngle: number;
      returnSpeed: number;
    };
    roadVisual?: {
      lineWidth: number;
      lineHeight: number;
      lineGap: number;
      centerLineYOffset: number;
      backgroundDepth: number;
      roadDepth: number;
      lineDepth: number;
      roadColor: string;
      lineColor: string;
      skyColor: string;
      boundaryPadding: number;
      viewYOffsetPercent?: number;
    };
    progress?: {
      scale: number;
      misalignThreshold: number;
      misalignPenaltyScale: number;
    };
  };
  
  // Obstacle system
  obstacles: {
    pothole: {
      spawnInterval: number;
      speed: number;
      width: number; // percentage of screen width
      height: number; // percentage of screen height
      minPos: number; // min percentage from left (0-1)
      maxPos: number; // max percentage from left (0-1)
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
    spawner?: {
      minDelayMs: number;
      maxDelayMs: number;
      potholeProbability: number; // 0-1
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
  
  // Menu system
  menus: {
    background: {
      color: string;
      alpha: number;
    };
    depths: {
      background: number;
      content: number;
    };
    styles: {
      layerText: {
        fontSize: string;
        color: string;
        fontStyle: string;
        backgroundColor: string;
        padding: { x: number; y: number };
      };
      title: {
        fontSize: string;
        color: string;
        fontStyle: string;
      };
      button: {
        fontSize: string;
        color: string;
        fontStyle: string;
        backgroundColor: string;
        padding: { x: number; y: number };
      };
      buttonHover: {
        backgroundColor: string;
      };
      bodyText: {
        fontSize: string;
        color: string;
        align: string;
      };
      infoText: {
        fontSize: string;
        color: string;
        align: string;
      };
    };
    positions: {
      layerText: { x: number; y: number };
      titleOffset: { x: number; y: number };
      buttonSpacing: number;
      buttonStartOffset: number;
    };
  };
  
  // Tutorial overlays
  overlays: {
    tutorial: {
      alpha: number;
      depth: number;
      crank: {
        cutoutPadding: number;
        cornerRadius: number;
      };
      ignition: {
        depth: number;
        cutoutScale: number;
        cornerRadius: number;
      };
    };
  };
  
  // Camera and navigation
  navigation: {
    animationDuration: number;
    overlayOffsetPercent: number;
    minCrankPercentForNavButtons?: number;
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
        backseatCircle: {
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
        frontseatKeys: {
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
        magneticTarget: {
          radius: number;
          x: number;
          y: number;
          color: string;
          magneticStrength: number;
          magneticRange: number;
          snapThreshold: number;
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
          tuning: {
            baseAccelScale: data.driving?.carSpeed?.tuning?.baseAccelScale ?? 0.3,
            decelScale: data.driving?.carSpeed?.tuning?.decelScale ?? 1.5,
            stopDecelScale: data.driving?.carSpeed?.tuning?.stopDecelScale ?? 0.5,
          },
        },
        steering: {
          sensitivity: data.driving?.steering?.sensitivity ?? 2.0,
          returnSpeed: data.driving?.steering?.returnSpeed ?? 2,
          minCrankPercentForSteering: data.driving?.steering?.minCrankPercentForSteering ?? 40,
          minSpeedForSteering: data.driving?.steering?.minSpeedForSteering ?? 0.01,
        },
        knob: {
          maxAngle: data.driving?.knob?.maxAngle ?? 45,
          returnSpeed: data.driving?.knob?.returnSpeed ?? 3,
        },
        roadVisual: {
          lineWidth: data.driving?.roadVisual?.lineWidth ?? 4,
          lineHeight: data.driving?.roadVisual?.lineHeight ?? 30,
          lineGap: data.driving?.roadVisual?.lineGap ?? 40,
          centerLineYOffset: data.driving?.roadVisual?.centerLineYOffset ?? 50,
          backgroundDepth: data.driving?.roadVisual?.backgroundDepth ?? -10000,
          roadDepth: data.driving?.roadVisual?.roadDepth ?? -10000,
          lineDepth: data.driving?.roadVisual?.lineDepth ?? -10000,
          roadColor: data.driving?.roadVisual?.roadColor ?? '0x333333',
          lineColor: data.driving?.roadVisual?.lineColor ?? '0xffffff',
          skyColor: data.driving?.roadVisual?.skyColor ?? '0x87CEEB',
          boundaryPadding: data.driving?.roadVisual?.boundaryPadding ?? 50,
          viewYOffsetPercent: data.driving?.roadVisual?.viewYOffsetPercent ?? 0,
        },
        progress: {
          scale: data.driving?.progress?.scale ?? 2,
          misalignThreshold: data.driving?.progress?.misalignThreshold ?? 0.1,
          misalignPenaltyScale: data.driving?.progress?.misalignPenaltyScale ?? 0.1,
        },
      },
      obstacles: {
        pothole: {
          spawnInterval: data.obstacles?.pothole?.spawnInterval ?? 6000,
          speed: data.obstacles?.pothole?.speed ?? 1,
          width: data.obstacles?.pothole?.width ?? 0.15,
          height: data.obstacles?.pothole?.height ?? 0.02,
          minPos: data.obstacles?.pothole?.minPos ?? 0.55,
          maxPos: data.obstacles?.pothole?.maxPos ?? 0.9,
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
        spawner: {
          minDelayMs: data.obstacles?.spawner?.minDelayMs ?? 5000,
          maxDelayMs: data.obstacles?.spawner?.maxDelayMs ?? 12000,
          potholeProbability: data.obstacles?.spawner?.potholeProbability ?? 0.8,
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
      menus: {
        background: {
          color: data.menus?.background?.color ?? '0x000000',
          alpha: data.menus?.background?.alpha ?? 0.8,
        },
        depths: {
          background: data.menus?.depths?.background ?? 20000,
          content: data.menus?.depths?.content ?? 20001,
        },
        styles: {
          layerText: {
            fontSize: data.menus?.styles?.layerText?.fontSize ?? '16px',
            color: data.menus?.styles?.layerText?.color ?? '#ff00ff',
            fontStyle: data.menus?.styles?.layerText?.fontStyle ?? 'bold',
            backgroundColor: data.menus?.styles?.layerText?.backgroundColor ?? '#000000',
            padding: {
              x: data.menus?.styles?.layerText?.padding?.x ?? 8,
              y: data.menus?.styles?.layerText?.padding?.y ?? 4,
            },
          },
          title: {
            fontSize: data.menus?.styles?.title?.fontSize ?? '24px',
            color: data.menus?.styles?.title?.color ?? '#ffffff',
            fontStyle: data.menus?.styles?.title?.fontStyle ?? 'bold',
          },
          button: {
            fontSize: data.menus?.styles?.button?.fontSize ?? '18px',
            color: data.menus?.styles?.button?.color ?? '#ffffff',
            fontStyle: data.menus?.styles?.button?.fontStyle ?? 'bold',
            backgroundColor: data.menus?.styles?.button?.backgroundColor ?? '#333333',
            padding: {
              x: data.menus?.styles?.button?.padding?.x ?? 20,
              y: data.menus?.styles?.button?.padding?.y ?? 10,
            },
          },
          buttonHover: {
            backgroundColor: data.menus?.styles?.buttonHover?.backgroundColor ?? '#555555',
          },
          bodyText: {
            fontSize: data.menus?.styles?.bodyText?.fontSize ?? '16px',
            color: data.menus?.styles?.bodyText?.color ?? '#ffffff',
            align: data.menus?.styles?.bodyText?.align ?? 'center',
          },
          infoText: {
            fontSize: data.menus?.styles?.infoText?.fontSize ?? '14px',
            color: data.menus?.styles?.infoText?.color ?? '#cccccc',
            align: data.menus?.styles?.infoText?.align ?? 'center',
          },
        },
        positions: {
          layerText: {
            x: data.menus?.positions?.layerText?.x ?? 10,
            y: data.menus?.positions?.layerText?.y ?? 190,
          },
          titleOffset: {
            x: data.menus?.positions?.titleOffset?.x ?? 0,
            y: data.menus?.positions?.titleOffset?.y ?? -60,
          },
          buttonSpacing: data.menus?.positions?.buttonSpacing ?? 60,
          buttonStartOffset: data.menus?.positions?.buttonStartOffset ?? 20,
        },
      },
      overlays: {
        tutorial: {
          alpha: data.overlays?.tutorial?.alpha ?? 0.5,
          depth: data.overlays?.tutorial?.depth ?? 50000,
          crank: {
            cutoutPadding: data.overlays?.tutorial?.crank?.cutoutPadding ?? 10,
            cornerRadius: data.overlays?.tutorial?.crank?.cornerRadius ?? 8,
          },
          ignition: {
            depth: data.overlays?.tutorial?.ignition?.depth ?? 1000,
            cutoutScale: data.overlays?.tutorial?.ignition?.cutoutScale ?? 1.2,
            cornerRadius: data.overlays?.tutorial?.ignition?.cornerRadius ?? 12,
          },
        },
      },
      navigation: {
        animationDuration: data.navigation?.animationDuration ?? 500,
        overlayOffsetPercent: data.navigation?.overlayOffsetPercent ?? 0.33,
        minCrankPercentForNavButtons: data.navigation?.minCrankPercentForNavButtons ?? 40,
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
        backseatCircle: {
          radius: data.physics?.backseatCircle?.radius ?? 20,
          x: data.physics?.backseatCircle?.x ?? 200,
          y: data.physics?.backseatCircle?.y ?? 120,
          restitution: data.physics?.backseatCircle?.restitution ?? 0.6,
          friction: data.physics?.backseatCircle?.friction ?? 0.2,
          density: data.physics?.backseatCircle?.density ?? 0.002,
          color: data.physics?.backseatCircle?.color ?? '0x6b6bff',
          hoverColor: data.physics?.backseatCircle?.hoverColor ?? '0x9999ff',
          dragColor: data.physics?.backseatCircle?.dragColor ?? '0x3333ff',
        },
        frontseatKeys: {
          radius: data.physics?.frontseatKeys?.radius ?? 18,
          x: data.physics?.frontseatKeys?.x ?? 150,
          y: data.physics?.frontseatKeys?.y ?? 200,
          restitution: data.physics?.frontseatKeys?.restitution ?? 0.7,
          friction: data.physics?.frontseatKeys?.friction ?? 0.2,
          density: data.physics?.frontseatKeys?.density ?? 0.001,
          color: data.physics?.frontseatKeys?.color ?? '0xff8800',
          hoverColor: data.physics?.frontseatKeys?.hoverColor ?? '0xffaa44',
          dragColor: data.physics?.frontseatKeys?.dragColor ?? '0xff6600',
        },
        magneticTarget: {
          radius: data.physics?.magneticTarget?.radius ?? 25,
          x: data.physics?.magneticTarget?.x ?? 400,
          y: data.physics?.magneticTarget?.y ?? 300,
          color: data.physics?.magneticTarget?.color ?? '0x00ff00',
          magneticStrength: data.physics?.magneticTarget?.magneticStrength ?? 0.01,
          magneticRange: data.physics?.magneticTarget?.magneticRange ?? 100,
          snapThreshold: data.physics?.magneticTarget?.snapThreshold ?? 20,
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
