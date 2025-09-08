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
    initialPosition: number;
  };
  
  // Game state
  gameState: {
    initialKnobValue: number;
    keysRemovalCooldown: number;
    momentumMultiplier: number;
    velocityMultiplier: number;
  };
  
  // UI configuration
  ui: {
    gameLayer: {
      text: string;
      position: { x: number; y: number };
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
      depth: number;
    };
    countdown: {
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
      depth: number;
      positionOffset: { x: number; y: number };
    };
    stops: {
      text: string;
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
      depth: number;
      positionOffset: { x: number; y: number };
    };
    progress: {
      text: string;
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
      depth: number;
      positionOffset: { x: number; y: number };
    };
    position: {
      text: string;
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
      depth: number;
      positionOffset: { x: number; y: number };
    };
    speed: {
      text: string;
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
      depth: number;
      positionOffset: { x: number; y: number };
    };
    money: {
      text: string;
      position: { x: number; y: number };
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
      depth: number;
    };
    health: {
      text: string;
      position: { x: number; y: number };
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
      depth: number;
    };
    managerValues: {
      position: { x: number; y: number };
      fontSize: string;
      color: string;
      backgroundColor: string;
      padding: { x: number; y: number };
      depth: number;
      labels: {
        skill: string;
        difficulty: string;
        momentum: string;
        plotA: string;
        plotB: string;
        plotC: string;
      };
      colors: {
        skill: string;
        difficulty: string;
        momentum: string;
        plotA: string;
        plotB: string;
        plotC: string;
      };
    };
  };
  
  // Visual configuration
  visual: {
    steeringWheel: {
      radius: number;
      position: { x: number; y: number };
      depth: number;
      pointer: {
        width: number;
        height: number;
        offset: number;
        color: string;
      };
    };
    speedCrank: {
      position: { x: number; y: number; offsetX: number };
      size: { width: number; height: number };
      handle: { width: number; height: number };
      text: {
        text: string;
        fontSize: string;
        color: string;
        offset: { x: number; y: number };
      };
      depths: { track: number; handle: number; indicator: number; text: number; area: number };
      snapPositions: number[];
    };
    overlays: {
      map: {
        text: string;
        position: { x: number; y: number; offsetY: number };
        fontSize: string;
        color: string;
        depth: number;
      };
      inventory: {
        text: string;
        position: { x: number; y: number; offsetY: number };
        fontSize: string;
        color: string;
        depth: number;
      };
      buttons: {
        size: { width: number; height: number };
        position: { offsetY: number };
        text: {
          lookDown: string;
          lookUp: string;
          fontSize: string;
          color: string;
        };
        depths: { button: number; text: number };
      };
    };
    seatTitles: {
      frontseat: {
        text: string;
        position: { x: number; y: number; offsetY: number };
        fontSize: string;
        color: string;
        depth: number;
      };
      backseat: {
        text: string;
        position: { x: number; y: number; offsetY: number };
        fontSize: string;
        color: string;
        depth: number;
      };
    };
    physics: {
      bufferZone: number;
      teleportBounds: { min: number; max: number };
      magneticTarget: {
        snappedColor: string;
        closeColor: string;
        snappedLineWidth: number;
        closeLineWidth: number;
      };
    };
    timing: {
      frameRate: number;
      cooldownFrameTime: number;
      knobReturnSpeed: number;
    };
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
  
  // Menu manager configuration
  menuManager: {
    slider: {
      width: number;
      height: number;
      yOffset: number;
      trackColor: string;
      handleWidth: number;
      handleHeight: number;
      handleColor: string;
      cornerRadius: number;
      handleCornerRadius: number;
    };
    labels: {
      startLabelOffset: number;
      turnKeyLabelOffset: number;
      fontSize: string;
      color: string;
    };
    meter: {
      width: number;
      height: number;
      yOffset: number;
      backgroundColor: string;
      fillColor: string;
      cornerRadius: number;
      textOffset: number;
    };
    depths: {
      sliderTrack: number;
      sliderHandle: number;
      labels: number;
      meter: number;
    };
    physics: {
      momentumDecay: number;
      maxVelocity: number;
      gravity: number;
      sensitivity: number;
      startThreshold: number;
      startIncrement: number;
    };
    buttonStyles: {
      resume: { backgroundColor: string; color: string };
      startFresh: { backgroundColor: string; color: string };
      startGame: { backgroundColor: string; color: string };
      restart: { backgroundColor: string; color: string };
      save: { backgroundColor: string; color: string };
      load: { backgroundColor: string; color: string };
      clear: { backgroundColor: string; color: string };
      back: { backgroundColor: string; color: string };
    };
  };
  
  // Game scene UI configuration
  gameScene: {
    ui: {
      mapToggleButton: {
        fillColor: string;
        fillAlpha: number;
        strokeColor: string;
        strokeWidth: number;
        strokeAlpha: number;
      };
      inventoryToggleButton: {
        fillColor: string;
        fillAlpha: number;
        strokeColor: string;
        strokeWidth: number;
        strokeAlpha: number;
      };
      knob: {
        fillColor: string;
        strokeColor: string;
        strokeWidth: number;
        strokeAlpha: number;
        activeFillColor: string;
      };
      speedCrank: {
        trackColor: string;
        trackAlpha: number;
        trackStrokeColor: string;
        trackStrokeWidth: number;
        trackStrokeAlpha: number;
        handleColor: string;
        handleAlpha: number;
        handleStrokeColor: string;
        handleStrokeWidth: number;
        handleStrokeAlpha: number;
        valueIndicatorColor: string;
        valueIndicatorAlpha: number;
        valueIndicatorStrokeColor: string;
        valueIndicatorStrokeWidth: number;
        valueIndicatorStrokeAlpha: number;
        interactionAreaAlpha: number;
      };
      debugBorders: {
        frontseatColor: string;
        frontseatWidth: number;
        frontseatAlpha: number;
        backseatColor: string;
        backseatWidth: number;
        backseatAlpha: number;
      };
      magneticTarget: {
        activeColor: string;
        activeWidth: number;
        activeAlpha: number;
        inactiveColor: string;
        inactiveWidth: number;
        inactiveAlpha: number;
      };
      dragDial: {
        fillColor: string;
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

  getConfigFromCache(scene: Phaser.Scene): GameConfig {
    if (this.config) {
      return this.config;
    }
    
    // Get config from Phaser cache (loaded by PreloadScene)
    const configData = scene.cache.json.get('gameConfig');
    if (!configData) {
      throw new Error('Game configuration not found in cache. Make sure PreloadScene loads the config file.');
    }
    
    this.config = this.validateAndTransformConfig(configData);
    console.log('Configuration loaded from cache:', this.config);
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
        initialPosition: data.playerStats?.initialPosition ?? 50,
      },
      gameState: {
        initialKnobValue: data.gameState?.initialKnobValue ?? 0,
        keysRemovalCooldown: data.gameState?.keysRemovalCooldown ?? 0,
        momentumMultiplier: data.gameState?.momentumMultiplier ?? 0.5,
        velocityMultiplier: data.gameState?.velocityMultiplier ?? 0.5,
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
        gameLayer: {
          text: data.ui?.gameLayer?.text ?? 'GAME LAYER',
          position: {
            x: data.ui?.gameLayer?.position?.x ?? 10,
            y: data.ui?.gameLayer?.position?.y ?? 40,
          },
          fontSize: data.ui?.gameLayer?.fontSize ?? '16px',
          color: data.ui?.gameLayer?.color ?? '#ffff00',
          backgroundColor: data.ui?.gameLayer?.backgroundColor ?? '#000000',
          padding: {
            x: data.ui?.gameLayer?.padding?.x ?? 8,
            y: data.ui?.gameLayer?.padding?.y ?? 4,
          },
          depth: data.ui?.gameLayer?.depth ?? 10000,
        },
        countdown: {
          fontSize: data.ui?.countdown?.fontSize ?? '48px',
          color: data.ui?.countdown?.color ?? '#ffffff',
          backgroundColor: data.ui?.countdown?.backgroundColor ?? '#000000',
          padding: {
            x: data.ui?.countdown?.padding?.x ?? 16,
            y: data.ui?.countdown?.padding?.y ?? 8,
          },
          depth: data.ui?.countdown?.depth ?? 10000,
          positionOffset: {
            x: data.ui?.countdown?.positionOffset?.x ?? 0,
            y: data.ui?.countdown?.positionOffset?.y ?? 0.28,
          },
        },
        stops: {
          text: data.ui?.stops?.text ?? 'Stops: {value}',
          fontSize: data.ui?.stops?.fontSize ?? '24px',
          color: data.ui?.stops?.color ?? '#ffffff',
          backgroundColor: data.ui?.stops?.backgroundColor ?? '#000000',
          padding: {
            x: data.ui?.stops?.padding?.x ?? 8,
            y: data.ui?.stops?.padding?.y ?? 4,
          },
          depth: data.ui?.stops?.depth ?? 10000,
          positionOffset: {
            x: data.ui?.stops?.positionOffset?.x ?? 0,
            y: data.ui?.stops?.positionOffset?.y ?? 0.35,
          },
        },
        progress: {
          text: data.ui?.progress?.text ?? 'Progress: {value}%',
          fontSize: data.ui?.progress?.fontSize ?? '24px',
          color: data.ui?.progress?.color ?? '#ffffff',
          backgroundColor: data.ui?.progress?.backgroundColor ?? '#000000',
          padding: {
            x: data.ui?.progress?.padding?.x ?? 8,
            y: data.ui?.progress?.padding?.y ?? 4,
          },
          depth: data.ui?.progress?.depth ?? 10000,
          positionOffset: {
            x: data.ui?.progress?.positionOffset?.x ?? 0,
            y: data.ui?.progress?.positionOffset?.y ?? 0.42,
          },
        },
        position: {
          text: data.ui?.position?.text ?? 'Position: {value}%',
          fontSize: data.ui?.position?.fontSize ?? '24px',
          color: data.ui?.position?.color ?? '#ffffff',
          backgroundColor: data.ui?.position?.backgroundColor ?? '#000000',
          padding: {
            x: data.ui?.position?.padding?.x ?? 8,
            y: data.ui?.position?.padding?.y ?? 4,
          },
          depth: data.ui?.position?.depth ?? 10000,
          positionOffset: {
            x: data.ui?.position?.positionOffset?.x ?? 0,
            y: data.ui?.position?.positionOffset?.y ?? 0.49,
          },
        },
        speed: {
          text: data.ui?.speed?.text ?? 'Speed: {value}%',
          fontSize: data.ui?.speed?.fontSize ?? '20px',
          color: data.ui?.speed?.color ?? '#00ff00',
          backgroundColor: data.ui?.speed?.backgroundColor ?? '#000000',
          padding: {
            x: data.ui?.speed?.padding?.x ?? 8,
            y: data.ui?.speed?.padding?.y ?? 4,
          },
          depth: data.ui?.speed?.depth ?? 10000,
          positionOffset: {
            x: data.ui?.speed?.positionOffset?.x ?? 0,
            y: data.ui?.speed?.positionOffset?.y ?? 0.56,
          },
        },
        money: {
          text: data.ui?.money?.text ?? 'Money: ${value}',
          position: {
            x: data.ui?.money?.position?.x ?? 20,
            y: data.ui?.money?.position?.y ?? 0.9,
          },
          fontSize: data.ui?.money?.fontSize ?? '18px',
          color: data.ui?.money?.color ?? '#ffffff',
          backgroundColor: data.ui?.money?.backgroundColor ?? '#000000',
          padding: {
            x: data.ui?.money?.padding?.x ?? 8,
            y: data.ui?.money?.padding?.y ?? 4,
          },
          depth: data.ui?.money?.depth ?? 10000,
        },
        health: {
          text: data.ui?.health?.text ?? 'Health: {value}',
          position: {
            x: data.ui?.health?.position?.x ?? 20,
            y: data.ui?.health?.position?.y ?? 0.95,
          },
          fontSize: data.ui?.health?.fontSize ?? '18px',
          color: data.ui?.health?.color ?? '#ffffff',
          backgroundColor: data.ui?.health?.backgroundColor ?? '#000000',
          padding: {
            x: data.ui?.health?.padding?.x ?? 8,
            y: data.ui?.health?.padding?.y ?? 4,
          },
          depth: data.ui?.health?.depth ?? 10000,
        },
        managerValues: {
          position: {
            x: data.ui?.managerValues?.position?.x ?? 0.95,
            y: data.ui?.managerValues?.position?.y ?? 0.9,
          },
          fontSize: data.ui?.managerValues?.fontSize ?? '14px',
          color: data.ui?.managerValues?.color ?? '#ffffff',
          backgroundColor: data.ui?.managerValues?.backgroundColor ?? '#000000',
          padding: {
            x: data.ui?.managerValues?.padding?.x ?? 8,
            y: data.ui?.managerValues?.padding?.y ?? 4,
          },
          depth: data.ui?.managerValues?.depth ?? 10000,
          labels: {
            skill: data.ui?.managerValues?.labels?.skill ?? 'Skill: {value}%',
            difficulty: data.ui?.managerValues?.labels?.difficulty ?? 'Difficulty: {value}%',
            momentum: data.ui?.managerValues?.labels?.momentum ?? 'Momentum: {value}%',
            plotA: data.ui?.managerValues?.labels?.plotA ?? 'Plot A: {value}%',
            plotB: data.ui?.managerValues?.labels?.plotB ?? 'Plot B: {value}%',
            plotC: data.ui?.managerValues?.labels?.plotC ?? 'Plot C: {value}%',
          },
          colors: {
            skill: data.ui?.managerValues?.colors?.skill ?? '#00ffff',
            difficulty: data.ui?.managerValues?.colors?.difficulty ?? '#ff00ff',
            momentum: data.ui?.managerValues?.colors?.momentum ?? '#ffff00',
            plotA: data.ui?.managerValues?.colors?.plotA ?? '#ff8800',
            plotB: data.ui?.managerValues?.colors?.plotB ?? '#8800ff',
            plotC: data.ui?.managerValues?.colors?.plotC ?? '#00ff88',
          },
        },
      },
      visual: {
        steeringWheel: {
          radius: data.visual?.steeringWheel?.radius ?? 60,
          position: {
            x: data.visual?.steeringWheel?.position?.x ?? 0.5,
            y: data.visual?.steeringWheel?.position?.y ?? 0.3,
          },
          depth: data.visual?.steeringWheel?.depth ?? 1000,
          pointer: {
            width: data.visual?.steeringWheel?.pointer?.width ?? 6,
            height: data.visual?.steeringWheel?.pointer?.height ?? 20,
            offset: data.visual?.steeringWheel?.pointer?.offset ?? 10,
            color: data.visual?.steeringWheel?.pointer?.color ?? '#ffffff',
          },
        },
        speedCrank: {
          position: {
            x: data.visual?.speedCrank?.position?.x ?? 0.5,
            y: data.visual?.speedCrank?.position?.y ?? 0.3,
            offsetX: data.visual?.speedCrank?.position?.offsetX ?? 120,
          },
          size: {
            width: data.visual?.speedCrank?.size?.width ?? 40,
            height: data.visual?.speedCrank?.size?.height ?? 200,
          },
          handle: {
            width: data.visual?.speedCrank?.handle?.width ?? 36,
            height: data.visual?.speedCrank?.handle?.height ?? 20,
          },
          text: {
            text: data.visual?.speedCrank?.text?.text ?? '{value}%',
            fontSize: data.visual?.speedCrank?.text?.fontSize ?? '16px',
            color: data.visual?.speedCrank?.text?.color ?? '#ffffff',
            offset: {
              x: data.visual?.speedCrank?.text?.offset?.x ?? 10,
              y: data.visual?.speedCrank?.text?.offset?.y ?? 0,
            },
          },
          depths: {
            track: data.visual?.speedCrank?.depths?.track ?? 1000,
            handle: data.visual?.speedCrank?.depths?.handle ?? 1001,
            indicator: data.visual?.speedCrank?.depths?.indicator ?? 1002,
            text: data.visual?.speedCrank?.depths?.text ?? 1003,
            area: data.visual?.speedCrank?.depths?.area ?? 1004,
          },
          snapPositions: data.visual?.speedCrank?.snapPositions ?? [0, 0.4, 0.7, 1.0],
        },
        overlays: {
          map: {
            text: data.visual?.overlays?.map?.text ?? 'MAP OVERLAY',
            position: {
              x: data.visual?.overlays?.map?.position?.x ?? 0.25,
              y: data.visual?.overlays?.map?.position?.y ?? 0.5,
              offsetY: data.visual?.overlays?.map?.position?.offsetY ?? 320,
            },
            fontSize: data.visual?.overlays?.map?.fontSize ?? '36px',
            color: data.visual?.overlays?.map?.color ?? '#ffffff',
            depth: data.visual?.overlays?.map?.depth ?? 1000,
          },
          inventory: {
            text: data.visual?.overlays?.inventory?.text ?? 'INVENTORY OVERLAY',
            position: {
              x: data.visual?.overlays?.inventory?.position?.x ?? 0.75,
              y: data.visual?.overlays?.inventory?.position?.y ?? 0.5,
              offsetY: data.visual?.overlays?.inventory?.position?.offsetY ?? 320,
            },
            fontSize: data.visual?.overlays?.inventory?.fontSize ?? '36px',
            color: data.visual?.overlays?.inventory?.color ?? '#ffffff',
            depth: data.visual?.overlays?.inventory?.depth ?? 1000,
          },
          buttons: {
            size: {
              width: data.visual?.overlays?.buttons?.size?.width ?? 120,
              height: data.visual?.overlays?.buttons?.size?.height ?? 40,
            },
            position: {
              offsetY: data.visual?.overlays?.buttons?.position?.offsetY ?? 200,
            },
            text: {
              lookDown: data.visual?.overlays?.buttons?.text?.lookDown ?? 'LOOK DOWN',
              lookUp: data.visual?.overlays?.buttons?.text?.lookUp ?? 'LOOK UP',
              fontSize: data.visual?.overlays?.buttons?.text?.fontSize ?? '14px',
              color: data.visual?.overlays?.buttons?.text?.color ?? '#ffffff',
            },
            depths: {
              button: data.visual?.overlays?.buttons?.depths?.button ?? 1000,
              text: data.visual?.overlays?.buttons?.depths?.text ?? 1001,
            },
          },
        },
        seatTitles: {
          frontseat: {
            text: data.visual?.seatTitles?.frontseat?.text ?? 'FRONT SEAT',
            position: {
              x: data.visual?.seatTitles?.frontseat?.position?.x ?? 0.25,
              y: data.visual?.seatTitles?.frontseat?.position?.y ?? 0.5,
              offsetY: data.visual?.seatTitles?.frontseat?.position?.offsetY ?? -30,
            },
            fontSize: data.visual?.seatTitles?.frontseat?.fontSize ?? '36px',
            color: data.visual?.seatTitles?.frontseat?.color ?? '#ffffff',
            depth: data.visual?.seatTitles?.frontseat?.depth ?? 1000,
          },
          backseat: {
            text: data.visual?.seatTitles?.backseat?.text ?? 'BACK SEAT',
            position: {
              x: data.visual?.seatTitles?.backseat?.position?.x ?? 0.75,
              y: data.visual?.seatTitles?.backseat?.position?.y ?? 0.5,
              offsetY: data.visual?.seatTitles?.backseat?.position?.offsetY ?? -30,
            },
            fontSize: data.visual?.seatTitles?.backseat?.fontSize ?? '36px',
            color: data.visual?.seatTitles?.backseat?.color ?? '#ffffff',
            depth: data.visual?.seatTitles?.backseat?.depth ?? 1000,
          },
        },
        physics: {
          bufferZone: data.visual?.physics?.bufferZone ?? 100,
          teleportBounds: {
            min: data.visual?.physics?.teleportBounds?.min ?? 50,
            max: data.visual?.physics?.teleportBounds?.max ?? 50,
          },
          magneticTarget: {
            snappedColor: data.visual?.physics?.magneticTarget?.snappedColor ?? '0x88ff88',
            closeColor: data.visual?.physics?.magneticTarget?.closeColor ?? '0x44ff44',
            snappedLineWidth: data.visual?.physics?.magneticTarget?.snappedLineWidth ?? 5,
            closeLineWidth: data.visual?.physics?.magneticTarget?.closeLineWidth ?? 4,
          },
        },
        timing: {
          frameRate: data.visual?.timing?.frameRate ?? 60,
          cooldownFrameTime: data.visual?.timing?.cooldownFrameTime ?? 16,
          knobReturnSpeed: data.visual?.timing?.knobReturnSpeed ?? 3,
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
      menuManager: {
        slider: {
          width: data.menuManager?.slider?.width ?? 20,
          height: data.menuManager?.slider?.height ?? 200,
          yOffset: data.menuManager?.slider?.yOffset ?? -20,
          trackColor: data.menuManager?.slider?.trackColor ?? '0x333333',
          handleWidth: data.menuManager?.slider?.handleWidth ?? 30,
          handleHeight: data.menuManager?.slider?.handleHeight ?? 20,
          handleColor: data.menuManager?.slider?.handleColor ?? '0xf39c12',
          cornerRadius: data.menuManager?.slider?.cornerRadius ?? 10,
          handleCornerRadius: data.menuManager?.slider?.handleCornerRadius ?? 5,
        },
        labels: {
          startLabelOffset: data.menuManager?.labels?.startLabelOffset ?? 30,
          turnKeyLabelOffset: data.menuManager?.labels?.turnKeyLabelOffset ?? -30,
          fontSize: data.menuManager?.labels?.fontSize ?? '18px',
          color: data.menuManager?.labels?.color ?? '#ffffff',
        },
        meter: {
          width: data.menuManager?.meter?.width ?? 120,
          height: data.menuManager?.meter?.height ?? 20,
          yOffset: data.menuManager?.meter?.yOffset ?? 60,
          backgroundColor: data.menuManager?.meter?.backgroundColor ?? '0x333333',
          fillColor: data.menuManager?.meter?.fillColor ?? '0x00ff00',
          cornerRadius: data.menuManager?.meter?.cornerRadius ?? 5,
          textOffset: data.menuManager?.meter?.textOffset ?? 25,
        },
        depths: {
          sliderTrack: data.menuManager?.depths?.sliderTrack ?? 50001,
          sliderHandle: data.menuManager?.depths?.sliderHandle ?? 50001,
          labels: data.menuManager?.depths?.labels ?? 50001,
          meter: data.menuManager?.depths?.meter ?? 50001,
        },
        physics: {
          momentumDecay: data.menuManager?.physics?.momentumDecay ?? 0.9,
          maxVelocity: data.menuManager?.physics?.maxVelocity ?? 0.1,
          gravity: data.menuManager?.physics?.gravity ?? 0.0015,
          sensitivity: data.menuManager?.physics?.sensitivity ?? 7.2,
          startThreshold: data.menuManager?.physics?.startThreshold ?? 0.8,
          startIncrement: data.menuManager?.physics?.startIncrement ?? 1.2,
        },
        buttonStyles: {
          resume: {
            backgroundColor: data.menuManager?.buttonStyles?.resume?.backgroundColor ?? '#27ae60',
            color: data.menuManager?.buttonStyles?.resume?.color ?? '#ffffff',
          },
          startFresh: {
            backgroundColor: data.menuManager?.buttonStyles?.startFresh?.backgroundColor ?? '#e74c3c',
            color: data.menuManager?.buttonStyles?.startFresh?.color ?? '#ffffff',
          },
          startGame: {
            backgroundColor: data.menuManager?.buttonStyles?.startGame?.backgroundColor ?? '#27ae60',
            color: data.menuManager?.buttonStyles?.startGame?.color ?? '#ffffff',
          },
          restart: {
            backgroundColor: data.menuManager?.buttonStyles?.restart?.backgroundColor ?? '#e74c3c',
            color: data.menuManager?.buttonStyles?.restart?.color ?? '#ffffff',
          },
          save: {
            backgroundColor: data.menuManager?.buttonStyles?.save?.backgroundColor ?? '#3498db',
            color: data.menuManager?.buttonStyles?.save?.color ?? '#ffffff',
          },
          load: {
            backgroundColor: data.menuManager?.buttonStyles?.load?.backgroundColor ?? '#f39c12',
            color: data.menuManager?.buttonStyles?.load?.color ?? '#ffffff',
          },
          clear: {
            backgroundColor: data.menuManager?.buttonStyles?.clear?.backgroundColor ?? '#e74c3c',
            color: data.menuManager?.buttonStyles?.clear?.color ?? '#ffffff',
          },
          back: {
            backgroundColor: data.menuManager?.buttonStyles?.back?.backgroundColor ?? '#95a5a6',
            color: data.menuManager?.buttonStyles?.back?.color ?? '#ffffff',
          },
        },
      },
      gameScene: {
        ui: {
          mapToggleButton: {
            fillColor: data.gameScene?.ui?.mapToggleButton?.fillColor ?? '0x888888',
            fillAlpha: data.gameScene?.ui?.mapToggleButton?.fillAlpha ?? 0.7,
            strokeColor: data.gameScene?.ui?.mapToggleButton?.strokeColor ?? '0xffffff',
            strokeWidth: data.gameScene?.ui?.mapToggleButton?.strokeWidth ?? 2,
            strokeAlpha: data.gameScene?.ui?.mapToggleButton?.strokeAlpha ?? 1,
          },
          inventoryToggleButton: {
            fillColor: data.gameScene?.ui?.inventoryToggleButton?.fillColor ?? '0x888888',
            fillAlpha: data.gameScene?.ui?.inventoryToggleButton?.fillAlpha ?? 0.7,
            strokeColor: data.gameScene?.ui?.inventoryToggleButton?.strokeColor ?? '0xffffff',
            strokeWidth: data.gameScene?.ui?.inventoryToggleButton?.strokeWidth ?? 2,
            strokeAlpha: data.gameScene?.ui?.inventoryToggleButton?.strokeAlpha ?? 1,
          },
          knob: {
            fillColor: data.gameScene?.ui?.knob?.fillColor ?? '0x666666',
            strokeColor: data.gameScene?.ui?.knob?.strokeColor ?? '0xffffff',
            strokeWidth: data.gameScene?.ui?.knob?.strokeWidth ?? 3,
            strokeAlpha: data.gameScene?.ui?.knob?.strokeAlpha ?? 1,
            activeFillColor: data.gameScene?.ui?.knob?.activeFillColor ?? '0x00ff00',
          },
          speedCrank: {
            trackColor: data.gameScene?.ui?.speedCrank?.trackColor ?? '0x333333',
            trackAlpha: data.gameScene?.ui?.speedCrank?.trackAlpha ?? 0.8,
            trackStrokeColor: data.gameScene?.ui?.speedCrank?.trackStrokeColor ?? '0xffffff',
            trackStrokeWidth: data.gameScene?.ui?.speedCrank?.trackStrokeWidth ?? 2,
            trackStrokeAlpha: data.gameScene?.ui?.speedCrank?.trackStrokeAlpha ?? 1,
            handleColor: data.gameScene?.ui?.speedCrank?.handleColor ?? '0x00ff00',
            handleAlpha: data.gameScene?.ui?.speedCrank?.handleAlpha ?? 0.9,
            handleStrokeColor: data.gameScene?.ui?.speedCrank?.handleStrokeColor ?? '0xffffff',
            handleStrokeWidth: data.gameScene?.ui?.speedCrank?.handleStrokeWidth ?? 1,
            handleStrokeAlpha: data.gameScene?.ui?.speedCrank?.handleStrokeAlpha ?? 1,
            valueIndicatorColor: data.gameScene?.ui?.speedCrank?.valueIndicatorColor ?? '0xffffff',
            valueIndicatorAlpha: data.gameScene?.ui?.speedCrank?.valueIndicatorAlpha ?? 1,
            valueIndicatorStrokeColor: data.gameScene?.ui?.speedCrank?.valueIndicatorStrokeColor ?? '0x000000',
            valueIndicatorStrokeWidth: data.gameScene?.ui?.speedCrank?.valueIndicatorStrokeWidth ?? 1,
            valueIndicatorStrokeAlpha: data.gameScene?.ui?.speedCrank?.valueIndicatorStrokeAlpha ?? 1,
            interactionAreaAlpha: data.gameScene?.ui?.speedCrank?.interactionAreaAlpha ?? 0,
          },
          debugBorders: {
            frontseatColor: data.gameScene?.ui?.debugBorders?.frontseatColor ?? '0xff0000',
            frontseatWidth: data.gameScene?.ui?.debugBorders?.frontseatWidth ?? 3,
            frontseatAlpha: data.gameScene?.ui?.debugBorders?.frontseatAlpha ?? 1,
            backseatColor: data.gameScene?.ui?.debugBorders?.backseatColor ?? '0x00ff00',
            backseatWidth: data.gameScene?.ui?.debugBorders?.backseatWidth ?? 3,
            backseatAlpha: data.gameScene?.ui?.debugBorders?.backseatAlpha ?? 1,
          },
          magneticTarget: {
            activeColor: data.gameScene?.ui?.magneticTarget?.activeColor ?? '0x88ff88',
            activeWidth: data.gameScene?.ui?.magneticTarget?.activeWidth ?? 5,
            activeAlpha: data.gameScene?.ui?.magneticTarget?.activeAlpha ?? 1,
            inactiveColor: data.gameScene?.ui?.magneticTarget?.inactiveColor ?? '0x44ff44',
            inactiveWidth: data.gameScene?.ui?.magneticTarget?.inactiveWidth ?? 4,
            inactiveAlpha: data.gameScene?.ui?.magneticTarget?.inactiveAlpha ?? 1,
          },
          dragDial: {
            fillColor: data.gameScene?.ui?.dragDial?.fillColor ?? '0x666666',
          },
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
