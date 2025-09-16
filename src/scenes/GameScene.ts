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
import { Trash, Item, Keys } from '../systems/PhysicsObjects';
import { CarMechanics, CarMechanicsConfig } from '../systems/CarMechanics';
import { VirtualPet } from '../systems/VirtualPet';
import { TutorialSystem, TutorialConfig } from '../systems/TutorialSystem';
import { GameUI, GameUIConfig } from '../systems/GameUI';
import { InputHandlers, InputHandlersConfig } from '../systems/InputHandlers';
import { GameState, GameStateConfig } from '../systems/GameState';
import { CAR_CONFIG, TUTORIAL_CONFIG, UI_CONFIG, GAME_STATE_CONFIG, PHYSICS_CONFIG, UI_LAYOUT, PET_CONFIG } from '../config/GameConfig';

export class GameScene extends Phaser.Scene {
  // ============================================================================
  // SYSTEM MODULES
  // ============================================================================
  
  private carMechanics!: CarMechanics;
  private tutorialSystem!: TutorialSystem;
  private gameUI!: GameUI;
  private inputHandlers!: InputHandlers;
  private gameState!: GameState;
  private virtualPets: VirtualPet[] = [];
  private petLabels: Phaser.GameObjects.Text[] = [];
  private dragOverlay?: Phaser.GameObjects.Container;
  private controlsCamera?: Phaser.Cameras.Scene2D.Camera;
  private dragOverlayCamera?: Phaser.Cameras.Scene2D.Camera;
  private feedingDebug?: Phaser.GameObjects.Graphics;
  // Cache to avoid redrawing magnetic target every frame
  private magneticVisualState: 'default' | 'near' | 'snap' = 'default';
  // Only allow ignition magnet to attract keys for a brief window after release
  private keysAttractionUntil: number = 0;
  
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
  private keySVG!: Phaser.GameObjects.Sprite; // SVG overlay for keys
  private hotdogSVG!: Phaser.GameObjects.Sprite; // SVG overlay for food item
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
  private hasShownCrankTutorial: boolean = false;
  private hasClearedCrankTutorial: boolean = false;
  private hasShownSteeringTutorial: boolean = false;
  private hasClearedSteeringTutorial: boolean = false;
  private potholeHitStep: number | null = null;
  private stopMenuOpen: boolean = false;
  // Matter tilt-gravity based on steering
  private gravityBaseY: number = 0.5;
  private gravityXCurrent: number = 0;
  private gravityXTarget: number = 0;
  
  // Tutorial update throttling
  private tutorialUpdateScheduled: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Main scene creation method - initializes all game systems
   */
  async create() {
    try {
      console.log('🎯 === GAMESCENE CREATE CALLED ===');
      console.log('GameScene: Initializing modular systems...');
      // Favor topmost hit-test only to reduce pointerover processing cost
      this.input.topOnly = true;
      
      // Navigation UI will be initialized when needed
      
      // Initialize game state
      console.log('🎯 About to initialize game state');
      this.initializeGameState();
      console.log('🎯 Game state initialized');
      
      // Initialize all system modules
      console.log('🎯 About to initialize systems');
      this.initializeSystems();
      console.log('🎯 Systems initialized');
    } catch (error) {
      console.error('🎯 ERROR in GameScene.create():', error);
    }
    
    // Create physics objects
    this.createPhysicsObjects();
    
    // Create game content container
    this.createGameContentContainer();
    
    // Create magnetic target
    this.createMagneticTarget();
    
    // Set up physics worlds
    this.setupPhysicsWorlds();
    
    // Initialize UI
    try {
      console.log('🎯 About to call gameUI.initialize()');
      console.log('🎯 GameUI object exists:', !!this.gameUI);
      this.gameUI.initialize();
      console.log('🎯 GameUI.initialize() completed successfully');
    } catch (error) {
      const err = error as any;
      console.error('🎯 ERROR calling gameUI.initialize():', err);
      try { console.error('🎯 Error stack:', err?.stack); } catch {}
    }
    
    // Initialize tutorial system
    this.tutorialSystem.initialize();
    
    // Initialize car mechanics
    this.carMechanics.initialize();
    
    // Initialize input handlers
    this.inputHandlers.initialize();

    // Add keyboard shortcut to open Destination menu (key 'M')
    try {
      const keyM = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.M, true, false);
      keyM?.on('down', () => {
        const menuScene = this.scene.get('MenuScene');
        if (menuScene) {
          menuScene.events.emit('showDestinationMenu', true);
          this.scene.bringToTop('MenuScene');
        }
      });
      const keyC = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.C, true, false);
      keyC?.on('down', () => {
        const menuScene = this.scene.get('MenuScene');
        if (menuScene) {
          menuScene.events.emit('showCYOA', {
            imageKey: undefined,
            text: 'You approach a fork in the road.',
            optionA: 'Take the left path',
            optionB: 'Take the right path',
            followA: 'The left path was serene and quiet.',
            followB: 'The right path was lively and bustling.'
          });
          this.scene.bringToTop('MenuScene');
        }
      });
      const keyP = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P, true, false);
      keyP?.on('down', () => {
        const menuScene = this.scene.get('MenuScene');
        if (menuScene) {
          menuScene.events.emit('showPetStoryUI', 'Pet says: "Hello there!"');
        }
      });

      // Add keyboard shortcuts for virtual pets 1-5 using keydown-ONE..FIVE for reliability
      const openPetStoryByIndex = (index: number) => {
        const menuScene = this.scene.get('MenuScene');
        if (menuScene) {
          menuScene.events.emit('showPetStoryUI', { petIndex: index });
          this.scene.bringToTop('MenuScene');
        }
      };
      this.input.keyboard?.on('keydown-ONE', () => openPetStoryByIndex(0));
      this.input.keyboard?.on('keydown-TWO', () => openPetStoryByIndex(1));
      this.input.keyboard?.on('keydown-THREE', () => openPetStoryByIndex(2));
      this.input.keyboard?.on('keydown-FOUR', () => openPetStoryByIndex(3));
      this.input.keyboard?.on('keydown-FIVE', () => openPetStoryByIndex(4));

      // Add keyboard shortcut for moral decision menu (key 'D')
      const keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D, true, false);
      keyD?.on('down', () => {
        const menuScene = this.scene.get('MenuScene');
        if (menuScene) {
          menuScene.events.emit('showMoralDecision', {
            petIndex: 0, // Use first pet for now
            text: 'You witness a stranger drop their wallet. What do you do?',
            optionA: 'Return it immediately',
            optionB: 'Keep it for yourself',
            followA: 'You feel good about doing the right thing.',
            followB: 'You feel guilty about your choice.'
          });
          this.scene.bringToTop('MenuScene');
        }
      });
    } catch {}

    // Initialize five virtual pets within a single rectangle container (rearview)
    const rearviewContainer = this.add.container(0, 0);
    rearviewContainer.setName('rearviewContainer');
    rearviewContainer.setScrollFactor(0);
    rearviewContainer.setDepth(70000);
    
    // Create the shared rectangle background (rearview) using UI_LAYOUT
    const cam = this.cameras.main;
    const rectWidth = Math.floor(cam.width * UI_LAYOUT.rearviewWidth);
    const rectHeight = Math.floor(cam.height * UI_LAYOUT.rearviewHeight);
    const rectX = Math.floor(cam.width * UI_LAYOUT.rearviewX);
    const rectY = Math.floor(cam.height * UI_LAYOUT.rearviewY);
    
    const rearviewRect = this.add.rectangle(rectX, rectY, rectWidth, rectHeight, UI_LAYOUT.rearviewBackgroundColor, UI_LAYOUT.rearviewBackgroundAlpha);
    rearviewRect.setStrokeStyle(2, UI_LAYOUT.rearviewStrokeColor, 1);
    rearviewRect.setScrollFactor(0);
    rearviewContainer.add(rearviewRect);
    
    // Create five virtual pets within the shared rectangle
    for (let i = 0; i < 5; i++) {
      // Random height within the rectangle (between 20% and 80% of rectangle height)
      const randomHeightPercent = 0.2 + (Math.random() * 0.6); // 0.2 to 0.8
      const randomYOffset = Math.floor((randomHeightPercent - 0.5) * rectHeight);
      
      const pet = new VirtualPet(this, { 
        depth: 70001 + i, 
        xPercent: 0.2 + (i * 0.15), // Spread across the rectangle
        yOffset: 8 + randomYOffset, // Random height within rectangle
        petColor: PET_CONFIG.petColor, // Use centralized pet color
        width: 0, // Don't create individual rectangles
        height: 0
      });
      pet.initialize();
      this.virtualPets.push(pet);
      
      // Add visible numeric label above each pet's circle
      const petSprite = pet.getPetSprite?.();
      const anchor = pet.getFeedAnchor?.();
      if (petSprite && anchor) {
        const label = this.add.text(petSprite.x, petSprite.y - (anchor.r + 20), `${i + 1}`, {
          fontSize: '16px',
          color: '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 2
        }).setOrigin(0.5);
        label.setScrollFactor(0);
        label.setDepth(70050 + i); // ensure above pet circle in depth
        this.petLabels[i] = label;
      }
    }

    // Create a second HUD camera for car controls (ignition/crank/wheel) to keep them upright
    const controlObjs = (this.gameUI as any).getControlObjects?.() as Phaser.GameObjects.GameObject[] | undefined;
    const tutObjsInit = (this.tutorialSystem as any).getOverlayObjects?.() as Phaser.GameObjects.GameObject[] | undefined;
    if (controlObjs && controlObjs.length > 0) {
      // Exclude control objects from main camera
      this.cameras.main.ignore(controlObjs);
      // Create controls camera and ignore everything except control objects
      this.controlsCamera = this.cameras.add(0, 0, this.cameras.main.width, this.cameras.main.height);
      this.controlsCamera.setScroll(0, 0);
      this.controlsCamera.setName('controlsCamera');
      const allObjects = (this.children.list || []) as Phaser.GameObjects.GameObject[];
      // Allow both control objects and tutorial overlay objects to render on controls camera
      const allowed = new Set<Phaser.GameObjects.GameObject>([
        ...controlObjs,
        ...(tutObjsInit || [])
      ]);
      const toIgnoreForControls = allObjects.filter(obj => !allowed.has(obj));
      if (toIgnoreForControls.length > 0) this.controlsCamera.ignore(toIgnoreForControls);
    }
    // Ensure tutorial overlay renders above controls: add it to controls camera allowlist
    // Ensure tutorial overlay renders above controls
    try {
      const tutObjs = (this.tutorialSystem as any).getOverlayObjects?.() as Phaser.GameObjects.GameObject[] | undefined;
      if (tutObjs && tutObjs.length && this.controlsCamera) {
        // controlsCamera currently ignores everything except controlObjs; here we ensure it DOES NOT ignore tutorial overlay
        const currentIgnores = (this.controlsCamera as any).ignoreList as Phaser.GameObjects.GameObject[] | undefined;
        if (currentIgnores) {
          const newIgnores = currentIgnores.filter(obj => !tutObjs.includes(obj));
          (this.controlsCamera as any).ignore(newIgnores);
        }
      }
    } catch {}

    // Create a dedicated overlay container for dragged items (always above HUD/pet)
    this.dragOverlay = this.add.container(0, 0);
    this.dragOverlay.setDepth(60001);
    this.dragOverlay.setScrollFactor(0);
    // Ensure drag overlay renders above the pet HUD via a dedicated camera
    // Exclude drag overlay from main camera to avoid double draw
    this.cameras.main.ignore(this.dragOverlay);
    // Simplify: let HUD (and controls) render dragOverlay; disable overlay camera
    // Ensure HUD/controls DO NOT ignore dragOverlay (main still ignores to avoid tilt)
    // If an overlay camera exists, hide/disable it to avoid double rendering
    try {
      if (this.dragOverlayCamera) {
        this.dragOverlayCamera.setVisible(false);
        const allForDrag = (this.children.list || []) as Phaser.GameObjects.GameObject[];
        this.dragOverlayCamera.ignore(allForDrag);
      }
    } catch {}

    // Debug overlay graphics for feeding overlap (renders in drag overlay camera)
    this.feedingDebug = this.add.graphics();
    this.feedingDebug.setScrollFactor(0);
    this.dragOverlay.add(this.feedingDebug);

    // Global pointer hover feedback for Tamagotchi (camera-agnostic)
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const pet = this.getVirtualPet?.();
      if (!pet) return;
      const dragging = (this as any).isDraggingObject === true;
      if (!dragging) {
        pet.setHover?.(false);
        return;
      }
      const over = pet.isPointerOver?.(pointer.x, pointer.y) ?? false;
      pet.setHover?.(over);
      if (over) {
        // Dwell-to-eat with continuous particles + bite burst when threshold reached
        const item: any = (this as any).draggingItem;
        if (item) {
          const now = this.time.now;
          const dwellMs = 1400; // required hover duration per bite (doubled)
          if (!item._overSince) item._overSince = now;
          const elapsed = now - item._overSince;
          const lastFeedAt = item._lastFeedTime ?? 0;

          // Shared particle look (base) so dwell matches burst styling
          const baseParticle = {
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            lifespan: 600
          } as any;
          // Dwell parameters: continuous emission using the same look
          const dwellParticle = {
            ...baseParticle,
            alpha: { start: 1, end: 0.2 },
            quantity: 2,
            frequency: 100
          } as any;

          // Ensure continuous dwell emitter exists and follows the item while over the pet
          if (!item._dwellEmitter) {
            try {
              const emitter: any = this.add.particles(item.x, item.y, 'x', dwellParticle);
              try { if (this.dragOverlay) this.dragOverlay.add(emitter); } catch {}
              try { emitter.setScrollFactor?.(0); emitter.setDepth?.(60050); } catch {}
              item._dwellEmitter = emitter;
            } catch {}
          }
          try { item._dwellEmitter?.setPosition?.(item.x, item.y); } catch {}

          if (elapsed >= dwellMs && (now - lastFeedAt) >= dwellMs) {
            item._lastFeedTime = now;
            item._overSince = now; // re-arm for next dwell cycle
            item._feedCount = (item._feedCount ?? 0) + 1;
            pet.setFood?.(10);
            // shrink item by 20%
            const s = item.scaleX ?? 1;
            item.setScale(Math.max(0.1, s * 0.8));

            // One-off particle burst on successful bite, placed at pointer position in dragOverlay local space
            try {
              const lp = this.dragOverlay?.getLocalPoint ? this.dragOverlay.getLocalPoint(pointer.x, pointer.y, (this as any).dragOverlayCamera) : { x: pointer.x, y: pointer.y };
              const burst: any = this.add.particles(lp.x, lp.y, 'x', { ...baseParticle, quantity: 0, frequency: -1 });
              try { if (this.dragOverlay) this.dragOverlay.add(burst); } catch {}
              try { burst.setScrollFactor?.(0); burst.setDepth?.(60060); } catch {}
              burst.explode?.(14, lp.x, lp.y);
              this.time.delayedCall(700, () => burst.destroy?.());
            } catch {}

            // If eaten 3 times, destroy immediately (even while held)
            if (item._feedCount >= 3) {
              if (item && item.scene) {
                try { item.disableInteractive?.(); } catch {}
                (this as any).isDraggingObject = false;
                (this as any).draggingItem = null;
                // Clean up dwell emitter before destruction
                try { item._dwellEmitter?.stop?.(); item._dwellEmitter?.destroy?.(); item._dwellEmitter = null; } catch {}
                this.time.delayedCall(0, () => { if (item && item.scene) item.destroy(); });
              }
            }
          }
        }
      } else {
        const item: any = (this as any).draggingItem;
        if (item) {
          item._overSince = undefined;
          // Stop and destroy dwell emitter when leaving pet hover
          try {
            item._dwellEmitter?.stop?.();
            item._dwellEmitter?.destroy?.();
            item._dwellEmitter = null;
          } catch {}
        }
      }
    });
    this.input.on('pointerout', () => {
      const pet = this.getVirtualPet?.();
      pet?.setHover?.(false);
    });
    
    // Clean up particles when pointer is released
    this.input.on('pointerup', () => {
      const item: any = (this as any).draggingItem;
      if (item) {
        // Stop and destroy dwell emitter when releasing item
        try {
          item._dwellEmitter?.stop?.();
          item._dwellEmitter?.destroy?.();
          item._dwellEmitter = null;
        } catch {}
        
        // Reset hover state
        item._overSince = undefined;
        const pet = this.getVirtualPet?.();
        pet?.setHover?.(false);
      }
    });
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('GameScene: All systems initialized successfully');
  }

  /**
   * Initialize game state
   */
  private initializeGameState() {
    // Game State Configuration - using centralized config with overrides
    const gameStateConfig: GameStateConfig = {
      ...GAME_STATE_CONFIG,
      // Override specific values for this scene
      initialMoney: 108,
      initialPosition: 50,
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
    // Car Mechanics Configuration - using centralized config
    const carConfig: CarMechanicsConfig = {
      ...CAR_CONFIG,
      radarX: this.scale.gameSize.width - 40 // Dynamic value
    };
    
    this.carMechanics = new CarMechanics(this, carConfig);
    
    // Tutorial System Configuration - using centralized config
    const tutorialConfig: TutorialConfig = TUTORIAL_CONFIG;
    this.tutorialSystem = new TutorialSystem(this, tutorialConfig);
    
    // Game UI Configuration - using centralized config
    const uiConfig: GameUIConfig = {
      ...UI_CONFIG,
      speedCrankSnapPositions: [...UI_CONFIG.speedCrankSnapPositions] // Convert readonly to mutable
    };
    this.gameUI = new GameUI(this, uiConfig);
    console.log('🎯 GameUI created in GameScene');
    
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
    
    // Create key SVG overlay that will follow the key's position
    this.keySVG = this.add.sprite(200, 300, 'key-white'); // Start at key's initial position
    this.keySVG.setScale(0.08); // Scaled to match key physics object (radius 15)
    this.keySVG.setOrigin(0.5, 0.5);
    this.keySVG.setAlpha(0.8); // Semi-transparent overlay
    this.keySVG.setDepth(1001); // Above the key circle
    
    // Debug: Log key SVG creation
    console.log('🗝️ === KEY SVG CREATION DEBUG ===');
    console.log('🗝️ Key SVG position:', this.keySVG.x, this.keySVG.y);
    console.log('🗝️ Key SVG origin:', this.keySVG.originX, this.keySVG.originY);
    console.log('🗝️ Key SVG scale:', this.keySVG.scaleX, this.keySVG.scaleY);
    console.log('🗝️ Key SVG visible:', this.keySVG.visible);
    console.log('🗝️ Key SVG angle:', this.keySVG.angle);
    console.log('🗝️ ===============================');
    
    // Create hot-dog SVG overlay that will follow the food item's position (red Trash object)
    this.hotdogSVG = this.add.sprite(100, 200, 'hot-dog'); // Start at red food item's initial position
    // Scale SVG to match the physics object size (radius 60, so scale accordingly)
    this.hotdogSVG.setScale(0.1); // Scaled to match smaller physics object (radius 40)
    this.hotdogSVG.setOrigin(0.5, 0.5);
    this.hotdogSVG.setAlpha(0.8); // Semi-transparent overlay
    this.hotdogSVG.setDepth(1001); // Above the food item circle
    
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
    // Use centralized magnetic configuration
    const magneticConfig = {
      x: PHYSICS_CONFIG.magneticTargetX,
      y: PHYSICS_CONFIG.magneticTargetY,
      radius: PHYSICS_CONFIG.magneticTargetRadius,
      color: PHYSICS_CONFIG.magneticTargetColor,
      inactiveColor: PHYSICS_CONFIG.magneticTargetInactiveColor
    };
    
    // Create the magnetic target circle (outline only)
    this.magneticTarget = this.add.graphics();
    // Start with gray color to indicate inactive state
    this.magneticTarget.lineStyle(3, magneticConfig.inactiveColor, 1);
    this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
    
    // Create a separate invisible Matter.js body for collision detection
    const magneticBody = this.matter.add.circle(magneticConfig.x, magneticConfig.y, magneticConfig.radius, {
      isStatic: true,
      isSensor: true,  // No collision - Keys can pass through
      render: { visible: false } // Invisible body
    });
    
    // Store reference to the body for collision detection
    (this.magneticTarget as any).magneticBody = magneticBody;
    
    // Note: keyhole SVG is now created in GameUI dash container
    
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
    // Set up Matter.js physics with gravity using centralized config
    this.matter.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
    
    // Add an extra wall at the bottom to avoid iOS Safari bottom URL bar
    this.createRaisedFloor();
    
    // Enable gravity for physics objects using centralized config
    this.matter.world.setGravity(PHYSICS_CONFIG.gravityX, PHYSICS_CONFIG.gravityY);
  }

  /**
   * Create a raised floor to avoid iOS Safari bottom URL bar
   */
  private createRaisedFloor() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const raisedFloorHeight = gameHeight * 0.90; // 90% of screen height (even lower floor)
    const wallThickness = 20;
    
    // Create a horizontal wall at the raised floor position
    const raisedFloor = this.matter.add.rectangle(gameWidth/2, raisedFloorHeight, gameWidth, wallThickness, {
      isStatic: true
    });
    
    // Add a visual indicator
    const floorVisual = this.add.rectangle(gameWidth/2, raisedFloorHeight, gameWidth, 4, 0x333333);
    floorVisual.setDepth(999);
    floorVisual.setAlpha(0.8);
    
    console.log(`Created raised floor at height: ${raisedFloorHeight}, screen height: ${gameHeight}`);
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
    
    // Listen for pothole hits from CarMechanics and schedule a story overlay
    this.events.on('potholeHit', () => {
      const currentStep = this.gameState.getState().step || 0;
      this.potholeHitStep = currentStep + 3;
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
    this.events.on('cameraAngleChanged', this.onCameraAngleChanged, this);
    
    // Handle window blur (game loses focus) - show pause menu
    this.game.events.on('hidden', () => {
      // Only show pause menu if game is running and no menu is already open
      const state = this.gameState.getState();
      if (state.gameStarted && !state.hasOpenMenu) {
        this.scene.get('MenuScene').events.emit('showPauseMenu');
      }
    });
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
    
   //console.log('updateTutorialSystem called:', tutorialState);
    // Track tutorial state transitions for crank/steering
    const prevCrankShown = this.hasShownCrankTutorial;
    const prevSteeringShown = this.hasShownSteeringTutorial;
    this.tutorialSystem.updateTutorialOverlay(tutorialState);
    const currentTutorial = this.tutorialSystem.getCurrentTutorialState();
    if (currentTutorial === 'crank') {
      this.hasShownCrankTutorial = true;
      this.hasClearedCrankTutorial = false;
    } else if (prevCrankShown && currentTutorial !== 'crank') {
      this.hasClearedCrankTutorial = true;
    }
    if (currentTutorial === 'steering') {
      this.hasShownSteeringTutorial = true;
      this.hasClearedSteeringTutorial = false;
    } else if (prevSteeringShown && currentTutorial !== 'steering') {
      this.hasClearedSteeringTutorial = true;
    }
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
    
    // Update game UI (steering wheel gradual return to center)
    if (this.gameUI) {
      this.gameUI.update(16); // Use 16ms as typical delta time
    }
    
    // HUD camera remains unrotated; no per-frame virtual pet counter-rotation needed
    this.applyMagneticAttraction();
    // Smoothly apply lateral gravity based on steering
    this.gravityXCurrent = Phaser.Math.Linear(this.gravityXCurrent, this.gravityXTarget, 0.1);
    this.matter.world.setGravity(this.gravityXCurrent, this.gravityBaseY);

    // Keep pet labels pinned to pet positions and correct order/depth
    for (let i = 0; i < this.virtualPets.length; i++) {
      const pet = this.virtualPets[i];
      const label = this.petLabels[i];
      if (!pet || !label) continue;
      const anchor = pet.getFeedAnchor?.();
      const sprite = pet.getPetSprite?.();
      if (anchor && sprite) {
        label.setPosition(sprite.x, sprite.y - (anchor.r + 20));
        label.setDepth(70050 + i);
        label.setText(String(i + 1));
        label.setVisible(true);
      }
    }
    
    // Update key SVG position and rotation to follow the key's physics body
    if (this.keySVG && this.frontseatKeys && this.frontseatKeys.gameObject) {
      // Convert physics object position to world coordinates
      const worldPos = this.gameContentContainer.getWorldTransformMatrix().transformPoint(
        this.frontseatKeys.gameObject.x, 
        this.frontseatKeys.gameObject.y
      );
      this.keySVG.setPosition(worldPos.x, worldPos.y);
      // Store physics rotation for later combination with camera angle
      (this.keySVG as any).physicsRotation = this.frontseatKeys.gameObject.rotation;
    }
    
    // Keyhole SVG is now positioned independently and doesn't need updates
    
    // Update hot-dog SVG position and rotation to follow the food item's physics body (red Trash object)
    if (this.hotdogSVG && this.frontseatTrash && this.frontseatTrash.gameObject) {
      // Convert physics object position to world coordinates (same as key SVG)
      const worldPos = this.gameContentContainer.getWorldTransformMatrix().transformPoint(
        this.frontseatTrash.gameObject.x, 
        this.frontseatTrash.gameObject.y
      );
      this.hotdogSVG.setPosition(worldPos.x, worldPos.y);
      this.hotdogSVG.setRotation(this.frontseatTrash.gameObject.rotation);
    }

    // Small: open a short attraction window when keys were just released from drag
    const keyGO: any = this.frontseatKeys?.gameObject;
    if (keyGO && keyGO._justReleasedAt && Date.now() - keyGO._justReleasedAt < 50) {
      this.keysAttractionUntil = Date.now() + 900; // ~0.9s window
      keyGO._justReleasedAt = undefined;
    }

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
    
    // Use centralized magnetic configuration
    const magneticConfig = {
      x: PHYSICS_CONFIG.magneticTargetX,
      y: PHYSICS_CONFIG.magneticTargetY,
      radius: PHYSICS_CONFIG.magneticTargetRadius,
      color: PHYSICS_CONFIG.magneticTargetColor,
      magneticRange: PHYSICS_CONFIG.magneticRadius,
      magneticStrength: PHYSICS_CONFIG.magneticStrength,
      snapThreshold: PHYSICS_CONFIG.magneticSnapThreshold,
      constraintStiffness: PHYSICS_CONFIG.magneticConstraintStiffness,
      constraintDamping: PHYSICS_CONFIG.magneticConstraintDamping
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
    const attractionWindowActive = Date.now() <= this.keysAttractionUntil;

    // Always reflect visual highlight regardless of dragging (but avoid redundant redraws)
    let nextState: 'default' | 'near' | 'snap' = 'default';
    if (distance <= magneticConfig.snapThreshold) nextState = 'snap';
    else if (distance <= magneticConfig.magneticRange) nextState = 'near';
    if (nextState !== this.magneticVisualState) {
      this.magneticVisualState = nextState;
      this.magneticTarget.clear();
      if (nextState === 'snap') this.magneticTarget.lineStyle(5, 0x00ff00, 1);
      else if (nextState === 'near') this.magneticTarget.lineStyle(3, 0xffff00, 1);
      else this.magneticTarget.lineStyle(3, magneticConfig.color, 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
    }
    
    // Snap threshold - when Keys gets close enough, create a constraint (only when not dragging)
    if (attractionWindowActive && !isDraggingKeys && distance <= magneticConfig.snapThreshold && !this.keysConstraint) {
      // Create constraint to snap Keys to the center of magnetic target
      this.keysConstraint = this.matter.add.constraint(keysBody as any, magneticBody as any, 0, 0.1, {
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        stiffness: magneticConfig.constraintStiffness,
        damping: magneticConfig.constraintDamping
      });
      
      // Track that keys are now in the ignition
      this.keysInIgnition = true;
      this.gameState.updateState({ keysInIgnition: true });
      console.log('Keys snapped to ignition');
      
      // Disable physics body for the key when it's constrained & prevent collisions
      if (this.frontseatKeys.gameObject.body) {
        const keyBody = this.frontseatKeys.gameObject.body as any;
        keyBody.isStatic = true;
        // Store originals for restoration later
        keyBody._originalCollisionFilter = {
          group: keyBody.collisionFilter?.group ?? 0,
          category: keyBody.collisionFilter?.category ?? 0x0001,
          mask: keyBody.collisionFilter?.mask ?? 0xFFFF
        };
        keyBody._originalIsSensor = !!keyBody.isSensor;
        // Easiest way: make it a sensor and mask out collisions
        keyBody.isSensor = true;
        keyBody.collisionFilter = {
          group: -1,        // negative group avoids collisions
          category: 0x0001,
          mask: 0x0000      // collide with nothing
        };
        // console.log('Key collision disabled while constrained');
      }
      
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
      
      // Re-enable physics body for the key when constraint is removed
      if (this.frontseatKeys.gameObject.body) {
        (this.frontseatKeys.gameObject.body as any).isStatic = false;
        console.log('Key physics re-enabled (dynamic)');
      }
      
      // Restore original collision filter for the key
      if (this.frontseatKeys.gameObject.body) {
        const keyBody = this.frontseatKeys.gameObject.body as any;
        if (keyBody.originalCollisionFilter) {
          keyBody.collisionFilter = keyBody.originalCollisionFilter;
          delete keyBody.originalCollisionFilter; // Clean up
          console.log('Key collision filtering restored - normal collisions enabled');
        }
      }
      
      // Reset Keys scroll factor to horizontal only
      this.frontseatKeys.gameObject.setScrollFactor(1, 0);
      
      // Visual highlight handled above
      
      // Snap speed crank to 0% when keys leave ignition
      this.resetCrankToZero();
      
      // Update tutorial overlay after a small delay (debounced)
      this.scheduleTutorialUpdate(50);
      
    } else if (attractionWindowActive && !isDraggingKeys && distance <= magneticConfig.magneticRange && distance > magneticConfig.snapThreshold && !this.keysConstraint) {
      // Apply magnetic attraction when close but not snapped (only when not dragging)
      const attractionForce = magneticConfig.magneticStrength * (1 - distance / magneticConfig.magneticRange);
      if (distance > 0) {
        const forceX = (dx / distance) * attractionForce;
        const forceY = (dy / distance) * attractionForce;
        this.matter.body.applyForce(keysBody as any, keysPos, { x: forceX, y: forceY });
      }
      // Visual highlight handled above
      
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
    
    // Do not show story overlay here; it is gated and scheduled in onStepEvent

    this.scheduleTutorialUpdate(0);

    // Ensure look buttons appear once car is started
    if ((this as any).gameUI && (this as any).gameUI['frontseatButton']) {
      const ui: any = this.gameUI as any;
      ui.frontseatButton?.setVisible(true);
      ui.backseatButton?.setVisible(true);
      (ui as any).lookUpLabel?.setVisible(true);
      (ui as any).lookDownLabel?.setVisible(true);
    }
  }

  /**
   * Handle remove keys event
   */
  private onRemoveKeys() {
    console.log('Remove Keys clicked!');
    this.removeKeysFromIgnition();
  }

  /**
   * Handle camera angle changes - rotate ignition elements
   */
  private onCameraAngleChanged(angle: number) {
    // Debug log disabled to avoid console flooding during driving
    
    // Rotate key SVG (combine physics rotation with camera angle)
    if (this.keySVG) {
      const physicsRotation = (this.keySVG as any).physicsRotation || 0;
      const combinedAngle = physicsRotation + angle;
      this.keySVG.setAngle(combinedAngle);
    }
    
    // Keep magnetic target and rearview rectangle upright (no rotation)
    // These elements should stay fixed relative to the screen, not rotate with camera
    // if (this.magneticTarget) {
    //   this.magneticTarget.setAngle(angle);
    // }
    
    // Keep rearview mirror container upright (no rotation)
    // const rearviewContainer = this.children.getByName('rearviewContainer');
    // if (rearviewContainer) {
    //   (rearviewContainer as any).setAngle(angle);
    // }
  }

  /**
   * Handle ignition menu shown event
   */
  private onIgnitionMenuShown() {
    console.log('Ignition menu shown');
    // Disable underlying gameplay input while menu is open
    this.input.enabled = false;
  }

  /**
   * Handle ignition menu hidden event
   */
  private onIgnitionMenuHidden() {
    console.log('Ignition menu hidden');
    // Re-enable gameplay input when menu closes
    this.input.enabled = true;
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
      
      // Re-enable physics body for the key when constraint is removed
      if (this.frontseatKeys.gameObject.body) {
        (this.frontseatKeys.gameObject.body as any).isStatic = false;
        console.log('Key physics re-enabled (manual removal - dynamic)');
      }
      
      // Restore original collision filter for the key
      if (this.frontseatKeys.gameObject.body) {
        const keyBody = this.frontseatKeys.gameObject.body as any;
        if (keyBody.originalCollisionFilter) {
          keyBody.collisionFilter = keyBody.originalCollisionFilter;
          delete keyBody.originalCollisionFilter; // Clean up
          console.log('Key collision filtering restored (manual removal) - normal collisions enabled');
        }
      }
      
      // Reset target color
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(3, 0xff0000, 1);
      this.magneticTarget.strokeCircle(200, 520, 25);
      
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
      this.magneticTarget.strokeCircle(200, 520, 25);
      console.log('Magnetic target activated - keys can now be attracted');
    }
  }

  /**
   * Load game from save
   */
  public loadGame(steps: number) {
    this.gameState.loadGame(steps);
  }

  /** Expose the virtual pet to systems (for interactions like feeding) */
  public getVirtualPet(index?: number): VirtualPet | undefined {
    if (index !== undefined) {
      return this.virtualPets[index] || undefined;
    }
    return this.virtualPets[0]; // Default to first pet for backward compatibility
  }

  /** Draw feeding debug rectangles in screen space */
  public showFeedingDebug(petRect: Phaser.Geom.Rectangle, itemRect: Phaser.Geom.Rectangle) {
    if (!this.feedingDebug) return;
    this.feedingDebug.clear();
    this.feedingDebug.lineStyle(2, 0xff0000, 0.9).strokeRect(petRect.x, petRect.y, petRect.width, petRect.height);
    this.feedingDebug.lineStyle(2, 0x00ff00, 0.9).strokeRect(itemRect.x, itemRect.y, itemRect.width, itemRect.height);
  }

  public clearFeedingDebug() {
    this.feedingDebug?.clear();
  }

  /** Resume gameplay after a non-blocking collision menu (e.g., pothole) */
  public resumeAfterCollision(): void {
    // Resume driving and unpause app if it was paused
    this.carMechanics.resumeDriving();
    const appScene = this.scene.get('AppScene');
    if (appScene) {
      (appScene as any).isPaused = false;
    }
    this.events.emit('gameResumed');
  }

  /** Handle taking an exit from the blocking exit menu */
  public takeExit(): void {
    // Placeholder: for now just resume gameplay; hook narrative/transition here later
    const appScene = this.scene.get('AppScene');
    if (appScene) {
      (appScene as any).isPaused = false;
    }
    this.events.emit('gameResumed');
    this.carMechanics.resumeDriving();
    console.log('GameScene: Exit taken');
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
    // Drive tutorial blink text every step
    if ((this.tutorialSystem as any).handleStep) {
      (this.tutorialSystem as any).handleStep(step);
    }
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

    // Increment progress by 1 per step while driving (independent of countdown)
    if (state.gameStarted && this.carStarted && this.carMechanics.isDriving()) {
      const cur = this.gameState.getState().progress || 0;
      const next = cur + 1;
      this.gameState.updateState({ progress: next });
      if (next >= 100 && !this.stopMenuOpen) {
        this.stopMenuOpen = true;
        const newStops = (this.gameState.getState().stops || 0) + 1;
        // Reset progress and countdown
        this.gameState.updateState({ stops: newStops, progress: 0, gameTime: 99 });
        const appScene = this.scene.get('AppScene');
        if (appScene) {
          (appScene as any).isPaused = true;
          this.events.emit('gamePaused');
        }
        const menuScene = this.scene.get('MenuScene');
        if (menuScene) {
          menuScene.events.emit('showObstacleMenu', 'exit');
          this.scene.bringToTop('MenuScene');
        }
      }
    }

    // Schedule story overlay only after car started AND crank >= 40 AND steering occurred
    const stateNow = this.gameState.getState();
    if (!this.chapter1Shown && this.storyOverlayScheduledStep === null && this.firstSteeringLoggedStep !== null && this.carStarted && stateNow.speedCrankPercentage >= 40 && this.hasShownCrankTutorial && this.hasClearedCrankTutorial && this.hasShownSteeringTutorial && this.hasClearedSteeringTutorial) {
      this.storyOverlayScheduledStep = step + 5;
      // Reveal look buttons when gating conditions are satisfied (same trigger as countdown)
      const ui: any = this.gameUI as any;
      ui?.frontseatButton?.setVisible(true);
      ui?.backseatButton?.setVisible(true);
      ui?.lookUpLabel?.setVisible(true);
      ui?.lookDownLabel?.setVisible(true);
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

    // Show pothole overlay 3 steps after hit (cancel if any real menu is open)
    if (this.potholeHitStep !== null && step >= this.potholeHitStep) {
      const curState = this.gameState.getState();
      if (curState.hasOpenMenu) {
        // Prevent pending pothole overlays while a real menu is up
        this.potholeHitStep = null;
      } else {
      const menuScene = this.scene.get('MenuScene');
      if (menuScene) {
        menuScene.events.emit('showStoryOverlay', 'Pothole!', 'Ouch. You hit a pothole.');
        // Fallback direct call if event not wired
        const mm: any = (menuScene as any).menuManager;
        if (mm?.showStoryOverlay) {
          mm.showStoryOverlay('Pothole!', 'Ouch. You hit a pothole.');
        }
        // Ensure MenuScene is on top so the overlay is visible
        this.scene.bringToTop('MenuScene');
      }
      this.potholeHitStep = null;
      }
    }
  }

  private onGamePaused() {
    this.carMechanics.pauseDriving();
  }

  private onGameResumed() {
    this.carMechanics.resumeDriving();
    this.stopMenuOpen = false;
  }

  private onSpeedUpdate(_speed: number) {
    // Don't update speedCrankPercentage automatically - it should only be controlled by user input
    // The car's automatic acceleration should not affect the speed crank UI
    //console.log('Car speed updated to:', speed + '%', 'but speed crank remains at:', this.gameUI.getSpeedCrankPercentage() + '%');
  }

  private onSteeringInput(value: number) {
    // Debug log disabled to avoid console flooding during interaction
    
    // Mark steering as used if there's any steering input
    if (Math.abs(value) > 0.1) {
      this.steeringUsed = true;
      this.scheduleTutorialUpdate(0);
      // Log first steering step; story overlay scheduling will be handled in onStepEvent
      if (this.firstSteeringLoggedStep === null) {
        this.firstSteeringLoggedStep = this.gameState.getState().step || 0;
      }
    }
    // Apply lateral gravity from steering ONLY when crank >= 40%
    const crankPct = this.gameState.getState().speedCrankPercentage ?? 0;
    if (crankPct >= 40) {
      // Map dial value (-100..100) to lateral gravity (-gx..gx)
      const maxGx = 0.8; // tune lateral gravity strength
      this.gravityXTarget = (Phaser.Math.Clamp(value, -100, 100) / 100) * maxGx;
    } else {
      // Below threshold: no lateral gravity influence from steering
      this.gravityXTarget = 0;
    }
    
    this.carMechanics.handleSteering(value);
  }

  private onSpeedCrankInput(percentage: number) {
    // Avoid spamming console on high-frequency pointer moves (causes DevTools slowdown)
    // console.log('Speed crank input:', percentage);
    this.gameState.updateState({ speedCrankPercentage: percentage });
    
    // Update car mechanics with new speed
    this.carMechanics.handleSpeedCrank(percentage);
    // If crank falls below threshold, immediately stop lateral gravity effects
    if (percentage < 40) {
      this.gravityXTarget = 0;
    }
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
