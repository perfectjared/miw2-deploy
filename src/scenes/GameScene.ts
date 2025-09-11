/**
 * GAME SCENE - REFACTORED MODULAR GAMEPLAY LOGIC
 * 
 * This is the main gameplay scene that orchestrates all game systems.
 * It has been refactored to use modular systems for better organization
 * and maintainability.
 * 
 * Key Systems:
 * - PhysicsObjects: Interactive physics entities (Trash, Item, Keys)
 * - CarMechanics: Driving system, steering, speed control
 * - TutorialSystem: Dynamic tutorial overlays and guidance
 * - GameUI: HUD elements, counters, displays
 * - InputHandlers: Keyboard, swipe, and drag interactions
 * - GameState: State management and save/load functionality
 * 
 * The scene acts as a coordinator that brings all systems together
 * and manages their interactions.
 */

import Phaser from 'phaser';
// import { NavigationUI } from '../systems/NavigationUI';
import { Trash, Item, Keys } from '../systems/PhysicsObjects';
import { CarMechanics, CarMechanicsConfig } from '../systems/CarMechanics';
import { TutorialSystem, TutorialConfig } from '../systems/TutorialSystem';
import { GameUI, GameUIConfig } from '../systems/GameUI';
import { InputHandlers, InputHandlersConfig } from '../systems/InputHandlers';
import { GameState, GameStateConfig } from '../systems/GameState';

export class GameScene extends Phaser.Scene {
  // ============================================================================
  // SYSTEM MODULES
  // ============================================================================
  
  private carMechanics!: CarMechanics;
  private tutorialSystem!: TutorialSystem;
  private gameUI!: GameUI;
  private inputHandlers!: InputHandlers;
  private gameState!: GameState;
  
  // ============================================================================
  // PHYSICS OBJECTS
  // ============================================================================
  
  private frontseatTrash!: Trash;
  private backseatItem!: Item;
  private frontseatKeys!: Keys;
  
  // ============================================================================
  // GAME STATE PROPERTIES
  // ============================================================================
  
  private gameContentContainer!: Phaser.GameObjects.Container;
  private magneticTarget!: Phaser.GameObjects.Graphics;
  private keysConstraint: any = null;
  
  // Game state flags
  private keysInIgnition: boolean = false;
  private carStarted: boolean = false;
  private steeringUsed: boolean = false;
  
  // Driving state
  private drivingMode: boolean = false;
  private shouldAutoRestartDriving: boolean = false;
  
  // UI state
  private currentPosition: string = 'frontseat';
  private storyOverlayScheduledStep: number | null = null;
  private chapter1Shown: boolean = false;
  private firstSteeringLoggedStep: number | null = null;
  
  // Tutorial update throttling
  private tutorialUpdateScheduled: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Main scene creation method - initializes all game systems
   */
  async create() {
    console.log('GameScene: Initializing modular systems...');
    
    // Navigation UI will be initialized when needed
    
    // Initialize game state
    this.initializeGameState();
    
    // Initialize all system modules
    this.initializeSystems();
    
    // Create physics objects
    this.createPhysicsObjects();
    
    // Create game content container
    this.createGameContentContainer();
    
    // Create magnetic target
    this.createMagneticTarget();
    
    // Set up physics worlds
    this.setupPhysicsWorlds();
    
    // Initialize UI
    this.gameUI.initialize();
    
    // Initialize tutorial system
    this.tutorialSystem.initialize();
    
    // Initialize car mechanics
    this.carMechanics.initialize();
    
    // Initialize input handlers
    this.inputHandlers.initialize();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('GameScene: All systems initialized successfully');
  }

  /**
   * Initialize game state
   */
  private initializeGameState() {
    const gameStateConfig: GameStateConfig = {
      // Initial Values
      initialGameTime: 99,
      initialMoney: 108,
      initialHealth: 100,
      initialPlayerSkill: 0,
      initialDifficulty: 0,
      initialMomentum: 0,
      initialPlotA: 0,
      initialPlotB: 0,
      initialPlotC: 0,
      initialKnobValue: 0,
      initialPosition: 50,
      
      // Validation
      minMoney: 0,
      maxMoney: 9999,
      minHealth: 0,
      maxHealth: 100,
      minSkill: 0,
      maxSkill: 100,
      minDifficulty: 0,
      maxDifficulty: 100,
      minMomentum: 0,
      maxMomentum: 100,
      minPlot: 0,
      maxPlot: 100,
      minKnobValue: -100,
      maxKnobValue: 100
    };
    
    this.gameState = new GameState(this, gameStateConfig);
    this.gameState.initialize();
  }

  /**
   * Initialize all system modules
   */
  private initializeSystems() {
    // Car Mechanics Configuration
    const carConfig: CarMechanicsConfig = {
      carMaxSpeed: 5,
      carAcceleration: 0.01,
      minCrankForSteering: .40,
      minSpeedForSteering: 0.01, // Lower threshold so steering works immediately
      steeringSensitivity: 1.0,
      maxTurn: 1.0,
      turnResetMultiplier: 0.1,
      centrifugal: 6.0,
      skyColor: 0x87CEEB,
      roadColor: 0x333333,
      lineColor: 0xffffff,
      boundaryPadding: 50,
      roadDepth: -1000,
      lineWidth: 4,
      lineHeight: 30,
      lineGap: 40,
      centerLineYOffset: 50,
      lineDepth: -1000,
      obstacleMinDelayMs: 9000,
      obstacleMaxDelayMs: 18000,
      potholeProbability: 0.8,
      potholeWidth: 0.2,
      potholeHeight: 0.05,
      potholeMinPos: 0.2,
      potholeMaxPos: 0.8,
      potholeSpawnY: 0.2,
      potholeColor: 0x8B4513,
      potholeSpeed: 1.25,
      exitWidth: 30,
      exitHeight: 60,
      exitPosition: 0.9,
      exitSpawnY: 0.1,
      exitColor: 0x00ff00,
      exitSpeed: 1.0,
      radarEnabled: true,
      radarX: this.scale.gameSize.width - 40,
      radarY: 10,
      radarWidth: 33,
      radarHeight: 163,
      radarAlpha: 0.75,
      roadBendStrength: 140
    };
    
    this.carMechanics = new CarMechanics(this, carConfig);
    
    // Tutorial System Configuration
    const tutorialConfig: TutorialConfig = {
      overlayColor: 0x000000,
      overlayAlpha: 0.7,
      overlayDepth: 20000,
      maskColor: 0xffffff,
      keysHoleRadius: 30,
      targetHoleMultiplier: 1.5,
      magneticTargetX: 200,
      magneticTargetY: 550,
      magneticTargetRadius: 25
    };
    
    this.tutorialSystem = new TutorialSystem(this, tutorialConfig);
    
    // Game UI Configuration
    const uiConfig: GameUIConfig = {
      gameLayerText: '(game)',
      gameLayerPositionX: 10,
      gameLayerPositionY: 10,
      gameLayerFontSize: '16px',
      gameLayerColor: '#ffff00',
      gameLayerBackgroundColor: '#000000',
      gameLayerDepth: 10000,
      countdownPositionOffsetX: 0,
      countdownPositionOffsetY: 0.1,
      countdownFontSize: '24px',
      countdownColor: '#ffffff',
      moneyPositionX: 0.1,
      moneyPositionY: 0.1,
      healthPositionX: 0.1,
      healthPositionY: 0.15,
      moneyHealthFontSize: '16px',
      moneyColor: '#00ff00',
      healthColor: '#ff0000',
      stopsPositionOffsetX: 0,
      stopsPositionOffsetY: 0.2,
      progressPositionOffsetX: 0,
      progressPositionOffsetY: 0.3,
      stopsFontSize: '18px',
      progressFontSize: '18px',
      stopsColor: '#ffffff',
      progressColor: '#ffffff',
      managerValuesFontSize: '12px',
      managerValuesBackgroundColor: '#000000',
      managerValuesPadding: { x: 4, y: 2 },
      managerValuesOpacity: 0.8,
      managerValuesSkillColor: '#00ff00',
      managerValuesDifficultyColor: '#ff0000',
      managerValuesMomentumColor: '#0000ff',
      managerValuesPlotAColor: '#ff00ff',
      managerValuesPlotBColor: '#ffff00',
      managerValuesPlotCColor: '#00ffff',
      frontseatText: 'FRONT SEAT',
      frontseatPositionX: 0.25,
      frontseatPositionY: 0.1,
      frontseatFontSize: '24px',
      frontseatColor: '#ffffff',
      backseatText: 'BACK SEAT',
      backseatPositionX: 0.75,
      backseatPositionY: 0.1,
      backseatFontSize: '24px',
      backseatColor: '#ffffff',
      speedCrankOffsetX: 120,
      speedCrankOffsetY: -20,
      speedCrankWidth: 40,
      speedCrankHeight: 150,
      speedCrankTrackColor: 0x333333,
      speedCrankTrackAlpha: 0.8,
      speedCrankTrackStrokeColor: 0xffffff,
      speedCrankTrackStrokeWidth: 2,
      speedCrankTrackCornerRadius: 5,
      speedCrankHandleColor: 0x00ff00,
      speedCrankHandleAlpha: 0.9,
      speedCrankHandleStrokeColor: 0xffffff,
      speedCrankHandleStrokeWidth: 1,
      speedCrankHandleCornerRadius: 3,
      speedCrankHandleMargin: 4,
      speedCrankHandleHeight: 20,
      speedCrankIndicatorColor: 0xffffff,
      speedCrankIndicatorStrokeColor: 0x000000,
      speedCrankIndicatorRadius: 3,
      speedCrankTextOffsetX: 10,
      speedCrankTextFontSize: '16px',
      speedCrankTextColor: '#ffffff',
      speedCrankSnapPositions: [0, 0.4, 0.7, 1.0],
      speedCrankDepthTrack: 1000,
      speedCrankDepthHandle: 1001,
      speedCrankDepthIndicator: 1002,
      speedCrankDepthText: 1003,
      speedCrankDepthArea: 1004
    };
    
    this.gameUI = new GameUI(this, uiConfig);
    
    // Input Handlers Configuration
    const inputConfig: InputHandlersConfig = {
      swipeMinDistance: 50,
      swipeMaxTime: 500,
      swipeThreshold: 30,
      dragSensitivity: 1.0,
      momentumMultiplier: 0.1,
      enableKeyboardControls: true,
      enableSwipeControls: true
    };
    
    this.inputHandlers = new InputHandlers(this, inputConfig);
  }

  /**
   * Create physics objects
   */
  private createPhysicsObjects() {
    this.frontseatTrash = new Trash(this);
    this.backseatItem = new Item(this);
    this.frontseatKeys = new Keys(this);
    
    // Set references for tutorial system
    this.tutorialSystem.setPhysicsObjects(this.frontseatKeys);
    this.tutorialSystem.setGameUI(this.gameUI);
  }

  /**
   * Create game content container
   */
  private createGameContentContainer() {
    this.gameContentContainer = this.add.container(0, 0);
    this.gameContentContainer.setName('gameContentContainer');
    
    // Add physics objects to container
    this.gameContentContainer.add(this.frontseatTrash.gameObject);
    this.gameContentContainer.add(this.backseatItem.gameObject);
    this.gameContentContainer.add(this.frontseatKeys.gameObject);
  }

  /**
   * Create magnetic target
   */
  private createMagneticTarget() {
    const magneticConfig = {
      x: 200,
      y: 550,
      radius: 25,
      color: 0xff0000
    };
    
    // Create the magnetic target circle (outline only)
    this.magneticTarget = this.add.graphics();
    // Start with gray color to indicate inactive state
    this.magneticTarget.lineStyle(3, 0x666666, 1);
    this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
    
    // Create a separate invisible Matter.js body for collision detection
    const magneticBody = this.matter.add.circle(magneticConfig.x, magneticConfig.y, magneticConfig.radius, {
      isStatic: true,
      isSensor: true,  // No collision - Keys can pass through
      render: { visible: false } // Invisible body
    });
    
    // Store reference to the body for collision detection
    (this.magneticTarget as any).magneticBody = magneticBody;
    
    // Set scroll factor to move with camera
    this.magneticTarget.setScrollFactor(1, 1);
    
    // Set depth to be visible but not interfere with UI
    this.magneticTarget.setDepth(999);
    
    // Add to game content container so it moves with camera
    this.gameContentContainer.add(this.magneticTarget);
  }

  /**
   * Set up physics worlds
   */
     private setupPhysicsWorlds() {
    // Set up Matter.js physics with gravity
    this.matter.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
    
    // Enable gravity for physics objects
    this.matter.world.setGravity(0, 0.5);
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners() {
    // Game state events
    this.gameState.setEventCallbacks({
      onStateChange: (state) => {
        this.gameUI.updateUI(state);
        // Auto-snap crank to 0 when keys are out of ignition
        if (!state.keysInIgnition && state.speedCrankPercentage !== 0) {
          this.carMechanics.handleSpeedCrank(0);
          this.gameUI.updateSpeedCrank(0);
          // Reflect in state once to keep consistency
          this.gameState.updateState({ speedCrankPercentage: 0 });
        }
        this.scheduleTutorialUpdate(0);
      },
      onSaveComplete: (success) => {
        console.log('Save completed:', success);
      },
      onLoadComplete: (success, state) => {
        console.log('Load completed:', success);
        if (success && state) {
          this.gameUI.updateUI(state);
        }
      }
    });
    
    // Input handler events
    this.inputHandlers.setEventCallbacks({
      onSteeringInput: (value) => {
        this.carMechanics.handleSteering(value);
      },
      onSwipeLeft: () => {
        this.switchToBackseat();
      },
      onSwipeRight: () => {
        this.switchToFrontseat();
      },
      onToggleDriving: () => {
        this.toggleDrivingMode();
      }
    });
    
    // Scene events
    this.events.on('step', this.onStepEvent, this);
    this.events.on('gamePaused', this.onGamePaused, this);
    this.events.on('gameResumed', this.onGameResumed, this);
    this.events.on('turnKey', this.onTurnKey, this);
    this.events.on('removeKeys', this.onRemoveKeys, this);
    this.events.on('ignitionMenuShown', this.onIgnitionMenuShown, this);
    this.events.on('ignitionMenuHidden', this.onIgnitionMenuHidden, this);
    this.events.on('speedUpdate', this.onSpeedUpdate, this);
    this.events.on('steeringInput', this.onSteeringInput, this);
    this.events.on('speedCrankInput', this.onSpeedCrankInput, this);
  }

  /**
   * Update tutorial system based on current state
   */
  private updateTutorialSystem() {
    // Check if any menu is currently open
    const menuScene = this.scene.get('MenuScene');
    const hasOpenMenu = menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDialog;
    const currentMenuType = hasOpenMenu ? (menuScene as any).menuManager.currentDisplayedMenuType : null;
    
    const tutorialState = {
      keysInIgnition: this.keysInIgnition,
      carStarted: this.carStarted,
      crankPercentage: this.gameUI.getSpeedCrankPercentage(),
      hasOpenMenu: !!hasOpenMenu,
      currentMenuType: currentMenuType,
      steeringUsed: this.steeringUsed
    };
    
    console.log('updateTutorialSystem called:', tutorialState);
    this.tutorialSystem.updateTutorialOverlay(tutorialState);
  }

  /**
   * Schedule a tutorial update with simple debouncing to avoid floods/loops
   */
  private scheduleTutorialUpdate(delayMs: number = 0) {
    if (this.tutorialUpdateScheduled) return;
    this.tutorialUpdateScheduled = true;
    this.time.delayedCall(delayMs, () => {
      this.tutorialUpdateScheduled = false;
      this.updateTutorialSystem();
    });
  }

  /**
   * Reset speed crank to 0% across state, UI, and mechanics
   */
  public resetCrankToZero() {
    this.gameState.updateState({ speedCrankPercentage: 0 });
    if (this.gameUI?.updateSpeedCrank) {
      this.gameUI.updateSpeedCrank(0);
    }
    if (this.carMechanics?.handleSpeedCrank) {
      this.carMechanics.handleSpeedCrank(0);
    }
  }

  /**
   * Scene pause handler
   */
  pause() {
    console.log('GameScene: Scene paused by Phaser');
    this.carMechanics.pauseDriving();
    this.inputHandlers.resetInputState();
  }

  /**
   * Scene resume handler
   */
  resume() {
    console.log('GameScene: Scene resumed by Phaser');
    if (this.shouldAutoRestartDriving && this.drivingMode) {
      this.carMechanics.resumeDriving();
    }
  }

  /**
   * Main update loop
   */
  update() {
    // Update all systems
    this.carMechanics.update();
    this.applyMagneticAttraction();

    // Fast tutorial updates while keys are out (no menu)
    const menuScene = this.scene.get('MenuScene');
    const hasOpenMenu = !!(menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDialog);
    if (!hasOpenMenu && !this.keysInIgnition) {
      // Recompute state and update immediately
      this.tutorialSystem.updateTutorialOverlay({
        keysInIgnition: this.keysInIgnition,
        carStarted: this.carStarted,
        crankPercentage: this.gameUI.getSpeedCrankPercentage(),
        hasOpenMenu: false,
        currentMenuType: null,
        steeringUsed: this.steeringUsed
      } as any);
      // Keep mask aligned to moving keys each frame
      if ((this.tutorialSystem as any).updateTutorialMaskRealTime) {
        (this.tutorialSystem as any).updateTutorialMaskRealTime();
      }
    }
    this.inputHandlers.setInputState({
      isDraggingObject: false, // TODO: Get from physics objects
      isKnobActive: false, // TODO: Get from UI
      keysConstraint: this.keysConstraint,
      hasOpenMenu: false, // TODO: Get from menu system
      currentMenuType: null
    });
  }

  /**
   * Apply magnetic attraction to keys
   */
  private applyMagneticAttraction() {
    // Only apply magnetic attraction after game has started
    if (!this.gameState.isGameStarted()) {
          return;
    }
    
    if (!this.frontseatKeys || !this.frontseatKeys.gameObject || !this.frontseatKeys.gameObject.body) {
        return;
      }
    if (!this.magneticTarget || !(this.magneticTarget as any).magneticBody) {
      return;
    }
    
    const magneticConfig = {
      x: 200,
      y: 550,
      radius: 25,
      color: 0xff0000,
      magneticRange: 50,
      magneticStrength: 0.005,
      snapThreshold: 15
    };
    
    const keysBody = this.frontseatKeys.gameObject.body;
    const magneticBody = (this.magneticTarget as any).magneticBody;
    
    // Get positions using Phaser Matter API
    const keysPos = { x: keysBody.position.x, y: keysBody.position.y };
    const targetPos = { x: magneticBody.position.x, y: magneticBody.position.y };
    
    // Calculate distance
    const dx = targetPos.x - keysPos.x;
    const dy = targetPos.y - keysPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const isDraggingKeys = !!(this.frontseatKeys.gameObject as any).isDragging;
    
    // Snap threshold - when Keys gets close enough, create a constraint (only when not dragging)
    if (!isDraggingKeys && distance <= magneticConfig.snapThreshold && !this.keysConstraint) {
      // Create constraint to snap Keys to the center of magnetic target
      this.keysConstraint = this.matter.add.constraint(keysBody as any, magneticBody as any, 0, 0.1, {
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        stiffness: 1,
        damping: 0.1
      });
      
      // Track that keys are now in the ignition
      this.keysInIgnition = true;
      this.gameState.updateState({ keysInIgnition: true });
      console.log('Keys snapped to ignition');
      
      // Update tutorial overlay (debounced)
      this.scheduleTutorialUpdate(0);
      
      // Show turn key menu only if car hasn't been started yet AND key is in ignition
      if (!this.carStarted && this.keysConstraint) {
        this.showTurnKeyMenu();
      }
      
      // Make Keys move vertically with camera when snapped
      this.frontseatKeys.gameObject.setScrollFactor(1, 1);
      
      // Visual feedback: make target glow bright when snapped
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(5, 0x00ff00, 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
      
    } else if (distance > magneticConfig.magneticRange && this.keysConstraint) {
      // Remove constraint if Keys is dragged too far away
      this.matter.world.removeConstraint(this.keysConstraint);
      this.keysConstraint = null;
      
      // Reset keys in ignition state
      this.keysInIgnition = false;
      this.gameState.updateState({ keysInIgnition: false });
      
      // Reset Keys scroll factor to horizontal only
      this.frontseatKeys.gameObject.setScrollFactor(1, 0);
      
      // Reset target color
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(3, magneticConfig.color, 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
      
      // Snap speed crank to 0% when keys leave ignition
      this.resetCrankToZero();
      
      // Update tutorial overlay after a small delay (debounced)
      this.scheduleTutorialUpdate(50);
      
    } else if (!isDraggingKeys && distance <= magneticConfig.magneticRange && distance > magneticConfig.snapThreshold && !this.keysConstraint) {
      // Apply magnetic attraction when close but not snapped (only when not dragging)
      const attractionForce = magneticConfig.magneticStrength * (1 - distance / magneticConfig.magneticRange);
      if (distance > 0) {
        const forceX = (dx / distance) * attractionForce;
        const forceY = (dy / distance) * attractionForce;
        this.matter.body.applyForce(keysBody as any, keysPos, { x: forceX, y: forceY });
      }
      // Visual feedback: make target glow when Keys is close
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(3, 0xffff00, 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
      
    } else if (distance > magneticConfig.magneticRange) {
      // Reset target color when far away
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(3, magneticConfig.color, 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
    }
  }

  /**
   * Show turn key menu
   */
  public showTurnKeyMenu() {
     const menuScene = this.scene.get('MenuScene');
     if (menuScene) {
      menuScene.events.emit('showTurnKeyMenu');
       this.scene.bringToTop('MenuScene');
     }
  }

  /**
   * Close current menu
   */
  public closeCurrentMenu() {
    const menuScene = this.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('closeCurrentMenu');
    }
  }

  /**
   * Handle turn key event
   */
  private onTurnKey() {
    console.log('Turn Key clicked! Car is now started.');
    this.carStarted = true;
    this.gameState.updateState({ carStarted: true });
    
    // Start driving mode when car is started
    if (!this.carMechanics.isDriving()) {
      this.carMechanics.startDriving();
      console.log('Driving mode started with car ignition');
    }
    
    // Show a non-blocking story overlay that autohides after 10 steps
    const menuScene = this.scene.get('MenuScene');
    if (menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.showStoryOverlay) {
      (menuScene as any).menuManager.showStoryOverlay('Chapter 1', 'Welcome! This story overlay will fade after 10 steps.');
    }

    this.scheduleTutorialUpdate(0);
  }

  /**
   * Handle remove keys event
   */
  private onRemoveKeys() {
    console.log('Remove Keys clicked!');
    this.removeKeysFromIgnition();
  }

  /**
   * Handle ignition menu shown event
   */
  private onIgnitionMenuShown() {
    console.log('Ignition menu shown');
  }

  /**
   * Handle ignition menu hidden event
   */
  private onIgnitionMenuHidden() {
    console.log('Ignition menu hidden');
  }

  /**
   * Remove keys from ignition
   */
  private removeKeysFromIgnition() {
    if (this.keysConstraint) {
      this.matter.world.removeConstraint(this.keysConstraint);
      this.keysConstraint = null;
      
      // Reset keys in ignition state
      this.keysInIgnition = false;
      this.gameState.updateState({ keysInIgnition: false });
      
      // Reset Keys scroll factor to horizontal only
      this.frontseatKeys.gameObject.setScrollFactor(1, 0);
      
      // Reset target color
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(3, 0xff0000, 1);
      this.magneticTarget.strokeCircle(200, 550, 25);
      
      // Snap speed crank to 0% when keys are removed
      this.resetCrankToZero();
      
      // Close the turn key menu first
      this.closeCurrentMenu();
      
      // Update tutorial overlay after a small delay to ensure menu is closed (debounced)
      this.scheduleTutorialUpdate(100);
    }
  }

  /**
   * Start the game
   */
  public startGame() {
    this.gameState.startGame();
    // Don't set carStarted = true here - car is not started yet
    this.scheduleTutorialUpdate(0);
    
    // Activate magnetic target when game starts
    this.activateMagneticTarget();
  }

  /**
   * Activate magnetic target (change color to red)
   */
  private activateMagneticTarget() {
    if (this.magneticTarget) {
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(3, 0xff0000, 1);
      this.magneticTarget.strokeCircle(200, 550, 25);
      console.log('Magnetic target activated - keys can now be attracted');
    }
  }

  /**
   * Load game from save
   */
  public loadGame(steps: number) {
    this.gameState.loadGame(steps);
  }

  /**
   * Toggle driving mode
   */
  private toggleDrivingMode() {
    if (this.drivingMode) {
      this.carMechanics.stopDriving();
      this.drivingMode = false;
    } else {
      this.carMechanics.startDriving();
      this.drivingMode = true;
    }
  }

  /**
   * Switch to frontseat view
   */
  private switchToFrontseat() {
    if (this.currentPosition === 'backseat') {
      this.currentPosition = 'frontseat';
      this.gameState.updateState({ currentPosition: 'frontseat' });
      
      // Animate container movement
      this.tweens.add({
        targets: this.gameContentContainer,
        x: 0,
        y: 0,
        duration: 500,
        ease: 'Power2'
      });
    }
  }

  /**
   * Switch to backseat view
   */
  private switchToBackseat() {
    // Backseat switching disabled - keeping button but no functionality
    console.log('Backseat switching disabled - staying in frontseat view');
      return;
    }
    
  /**
   * Event handlers
   */
  private onStepEvent(step: number) {
    this.gameState.updateState({ step });
    // Step-based countdown: only when game and car have both started
    const state = this.gameState.getState();
    if (state.gameStarted && this.carStarted && state.gameTime > 0) {
      const newTime = state.gameTime - 1;
      this.gameState.updateState({ gameTime: newTime });
      // Notify systems (e.g., driving scene) that countdown changed
      this.events.emit('countdownChanged', {
        time: newTime,
        keysInIgnition: state.keysInIgnition,
        speedCrankPercentage: state.speedCrankPercentage
      });
    }

    // Schedule story overlay only after car started AND crank >= 40 AND steering occurred
    const stateNow = this.gameState.getState();
    if (!this.chapter1Shown && this.storyOverlayScheduledStep === null && this.firstSteeringLoggedStep !== null && this.carStarted && stateNow.speedCrankPercentage >= 40) {
      this.storyOverlayScheduledStep = step + 5;
    }

    // Show Chapter 1 story overlay once scheduled and step reached
    if (!this.chapter1Shown && this.storyOverlayScheduledStep !== null && step >= this.storyOverlayScheduledStep) {
      const menuScene = this.scene.get('MenuScene');
      if (menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.showStoryOverlay) {
        (menuScene as any).menuManager.showStoryOverlay('Chapter 1', 'Welcome! This story overlay will fade after 10 steps.');
      }
      this.chapter1Shown = true;
      this.storyOverlayScheduledStep = null;
      // Hide steering tutorial overlay when story appears
      this.steeringUsed = true;
      this.scheduleTutorialUpdate(0);
    }
  }

  private onGamePaused() {
    this.carMechanics.pauseDriving();
  }

  private onGameResumed() {
    this.carMechanics.resumeDriving();
  }

  private onSpeedUpdate(speed: number) {
    // Don't update speedCrankPercentage automatically - it should only be controlled by user input
    // The car's automatic acceleration should not affect the speed crank UI
    //console.log('Car speed updated to:', speed + '%', 'but speed crank remains at:', this.gameUI.getSpeedCrankPercentage() + '%');
  }

  private onSteeringInput(value: number) {
    console.log('GameScene: Steering input received:', value, 'Car started:', this.carStarted, 'Driving mode:', this.carMechanics.isDriving());
    
    // Mark steering as used if there's any steering input
    if (Math.abs(value) > 0.1) {
      this.steeringUsed = true;
      this.scheduleTutorialUpdate(0);
      // Log first steering step; story overlay scheduling will be handled in onStepEvent
      if (this.firstSteeringLoggedStep === null) {
        this.firstSteeringLoggedStep = this.gameState.getState().step || 0;
      }
    }
    
    this.carMechanics.handleSteering(value);
  }

  private onSpeedCrankInput(percentage: number) {
    console.log('Speed crank input:', percentage);
    this.gameState.updateState({ speedCrankPercentage: percentage });
    
    // Update car mechanics with new speed
    this.carMechanics.handleSpeedCrank(percentage);
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Clean up all systems
    this.carMechanics.destroy();
    this.tutorialSystem.destroy();
    this.gameUI.destroy();
    this.inputHandlers.destroy();
    
    // Remove event listeners
    this.events.off('step', this.onStepEvent, this);
    this.events.off('gamePaused', this.onGamePaused, this);
    this.events.off('gameResumed', this.onGameResumed, this);
    this.events.off('turnKey', this.onTurnKey, this);
    this.events.off('removeKeys', this.onRemoveKeys, this);
    this.events.off('ignitionMenuShown', this.onIgnitionMenuShown, this);
    this.events.off('ignitionMenuHidden', this.onIgnitionMenuHidden, this);
    this.events.off('speedUpdate', this.onSpeedUpdate, this);
    this.events.off('steeringInput', this.onSteeringInput, this);
    this.events.off('speedCrankInput', this.onSpeedCrankInput, this);
  }
}
