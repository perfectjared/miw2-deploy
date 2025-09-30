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
import { Phone } from '../systems/Phone';
import { CarMechanics, CarMechanicsConfig } from '../systems/CarMechanics';
import { VirtualPet } from '../systems/VirtualPet';
import { TutorialSystem, TutorialConfig } from '../systems/TutorialSystem';
import { GameUI, GameUIConfig } from '../systems/GameUI';
import { InputHandlers, InputHandlersConfig } from '../systems/InputHandlers';
import { GameState, GameStateConfig } from '../systems/GameState';
import { WindowShapes } from '../utils/WindowShapes';
import { StoryManager } from '../systems/StoryManager';
import { CAR_CONFIG, TUTORIAL_CONFIG, UI_CONFIG, GAME_STATE_CONFIG, PHYSICS_CONFIG, UI_LAYOUT, PET_CONFIG, REGION_CONFIG, gameElements } from '../config/GameConfig';

// Tunable scene constants (for quick tweaking)
const SCENE_TUNABLES = {
  gravity: {
    baseY: 0.5,
    maxLateralGx: 0.8
  },
  tutorial: {
    scheduleDelayMs: 50
  },
  magnetic: {
    attractionWindowMs: 900
  },
  performance: {
    uiUpdateDeltaMs: 16
  }
} as const;

export class GameScene extends Phaser.Scene {
  // ============================================================================
  // SYSTEM MODULES
  // ============================================================================
  
  private carMechanics!: CarMechanics
  private lastPlannedData: string = ''; // Track planned events to avoid unnecessary updates;
  private tutorialSystem!: TutorialSystem;
  private gameUI!: GameUI;
  private inputHandlers!: InputHandlers;
  private gameState!: GameState;
  private windowShapes!: WindowShapes;
  private storyManager!: StoryManager;
  private virtualPets: VirtualPet[] = [];
  private petLabels: Phaser.GameObjects.Text[] = [];
  private rearviewRect?: Phaser.GameObjects.Rectangle;
  private dragOverlay?: Phaser.GameObjects.Container;
  private controlsCamera?: Phaser.Cameras.Scene2D.Camera;
  private itemsCamera?: Phaser.Cameras.Scene2D.Camera;
  private dragOverlayCamera?: Phaser.Cameras.Scene2D.Camera;
  private feedingDebug?: Phaser.GameObjects.Graphics;
  // Additional hot-dog overlays tied to spawned food physics bodies
  private hotdogOverlays: Array<{ body: Phaser.GameObjects.Arc, sprite: Phaser.GameObjects.Sprite }> = [];
  // Debug item spawn menu
  private debugItemMenu?: Phaser.GameObjects.Container;
  private debugMenuVisible: boolean = false;
  // Item typing
  private static readonly ITEM_TYPES = {
    Food:       { color: 0xff5555, effect: { hunger: +3 } },
    Phone:      { color: 0x00aaff, effect: { focus: -1 } },
    Weed:       { color: 0x33cc66, effect: { chill: +2 } },
    Drink:      { color: 0xaa55ff, effect: { energy: +2 } },
    Decoration: { color: 0xff69b4, effect: { spectacle: +5 } }
  } as const;
  // Cache to avoid redrawing magnetic target every frame
  private magneticVisualState: 'default' | 'near' | 'snap' = 'default';
  // Only allow ignition magnet to attract keys for a brief window after release
  private keysAttractionUntil: number = 0;
  private lastMagneticAttractionLog: number = 0; // For throttled debugging
  
  // Physics object safety system
  private physicsSafetyTimer?: Phaser.Time.TimerEvent;
  
  // Debug variables
  private debugWindows: Phaser.GameObjects.Container[] = [];
  
  // ============================================================================
  // PHYSICS OBJECTS
  // ============================================================================
  
  private frontseatTrash!: Trash;
  private backseatItem!: Item;
  private frontseatKeys!: Keys;
  private frontseatPhone!: Phone;
  
  // ============================================================================
  // GAME STATE PROPERTIES
  // ============================================================================
  
  private gameContentContainer!: Phaser.GameObjects.Container;
  private magneticTarget!: Phaser.GameObjects.Graphics;
  private keySVG!: Phaser.GameObjects.Sprite; // SVG overlay for keys
  private hotdogSVG!: Phaser.GameObjects.Sprite; // SVG overlay for food item
  private phoneSVG!: Phaser.GameObjects.Sprite; // SVG overlay for phone
  private itemSVG!: Phaser.GameObjects.Sprite; // SVG overlay for green item
  private nightTimeOverlay?: Phaser.GameObjects.Rectangle; // Night time visual overlay
  private nightModeEnabled: boolean = false;
  private keysConstraint: any = null;
  private readonly encumbranceCapacity: number = 10;
  
  // Game state flags
  private keysInIgnition: boolean = false;
  private carStarted: boolean = false;
  private steeringUsed: boolean = false;
  private firstCarStart: boolean = true; // Track if this is the first time car starts
  private rearviewAnimationCompleted: boolean = false; // Track if rearview mirror animation has completed
  
  // Driving state
  private drivingMode: boolean = false;
  // Direct steering system (no delay, no interpolation)
  private shouldAutoRestartDriving: boolean = false;
  private exitDetectionLogCounter: number = 0;
  
  // UI state
  private currentPosition: string = 'frontseat';
  private storyOverlayScheduledStep: number | null = null;
  private chapter1Shown: boolean = false;
  private firstSteeringLoggedStep: number | null = null;
  private hasShownCrankTutorial: boolean = false;
  private hasClearedCrankTutorial: boolean = false;
  private hasShownSteeringTutorial: boolean = false;
  private hasClearedSteeringTutorial: boolean = false;
  private stopMenuOpen: boolean = false;
  private countdownStepCounter: number = 0; // Track steps for countdown timing
  private tutorialInterruptStep: number | null = null; // Track when tutorial interrupt should end
  private tutorialInterruptCompleted: boolean = false; // Track if tutorial interrupt has been completed
  // Matter tilt-gravity based on steering
  private gravityBaseY: number = SCENE_TUNABLES.gravity.baseY;
  private gravityXCurrent: number = 0;
  private gravityXTarget: number = 0;
  
  // Tutorial update throttling
  private tutorialUpdateScheduled: boolean = false;
  private tutorialUpdateCounter: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  /**
   * Main scene creation method - initializes all game systems
   */
  async create() {
    try {
      // Load game elements configuration first
      await gameElements.loadConfig();
      
      // Favor topmost hit-test only to reduce pointerover processing cost
      this.input.topOnly = true;
      
      // Debug key for spawning potholes
      this.input.keyboard?.on('keydown-P', () => {
        if (this.carMechanics && this.carMechanics.isDriving()) {
          this.carMechanics.spawnDebugPothole();
        }
      });
      
      // Navigation UI will be initialized when needed
      
      // Initialize game state
      this.initializeGameState();
      
      // Initialize all system modules
      this.initializeSystems();
    } catch (error) {
      console.error('ERROR in GameScene.create():', error);
    }
    
    // Create physics objects
    this.createPhysicsObjects();
    
    // Initialize physics safety system
    this.initializePhysicsSafetySystem();
    
    // Dev button removed
    // Add debug drop button for spawning a hot-dog item from the ceiling
    this.addDebugDropButton();
    this.createDebugItemMenu();
    
    // Create game content container
    this.createGameContentContainer();
    
    // Create magnetic target
    this.createMagneticTarget();
    
    // Set up physics worlds
    this.setupPhysicsWorlds();
    
    // Initialize UI
    try {
      this.gameUI.initialize();
    } catch (error) {
      const err = error as any;
      console.error('ERROR calling gameUI.initialize():', err);
    }
    
    // Initialize tutorial system
    this.tutorialSystem.initialize();
    
    // Initialize car mechanics
    this.carMechanics.initialize();
    
    // Initialize input handlers
    this.inputHandlers.initialize();

    // Listen for shop purchases to spawn a new falling hot-dog item
    try {
      const menuScene = this.scene.get('MenuScene');
      menuScene?.events.on('shopPurchase', (payload: any) => {
        try { console.log('GameScene: shopPurchase received -> spawning hot-dog', payload); } catch {}
        const itemName = String(payload?.item || '').toLowerCase();
        // Map common item names to our item types
        let type: keyof typeof GameScene.ITEM_TYPES = 'Food';
        if (itemName.includes('phone')) {
          console.log('Cannot purchase phone - you already have one');
          return; // Don't spawn phones
        }
        else if (itemName.includes('weed') || itemName.includes('pre-roll') || itemName.includes('edibles')) type = 'Weed';
        else if (itemName.includes('drink') || itemName.includes('soda') || itemName.includes('coffee') || itemName.includes('energy')) type = 'Drink';
        else if (itemName.includes('decoration') || itemName.includes('banner') || itemName.includes('lights') || itemName.includes('pyro')) type = 'Decoration';
        else if (itemName.includes('meal') || itemName.includes('food') || itemName.includes('sandwich') || itemName.includes('feast') || itemName.includes('snack')) type = 'Food';
        this.spawnHotDogFromTop(type);
      });
    } catch {}

    // Initialize encumbrance UI from current items
    try { this.updateEncumbranceUI(); } catch {}

    // Rebind keys: 'd' opens Destination; 'm' opens Moral Decision
    try {
      // 'm' -> Moral decision menu (test payload) - REMOVED due to conflict

      // 'd' -> Destination menu
      const keyD = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D, true, false);
      keyD?.on('down', () => {
        const menuScene = this.scene.get('MenuScene');
        if (menuScene) {
          (menuScene as any).events.emit('showDestinationMenu', true);
          this.scene.bringToTop('MenuScene');
        }
      });
      // REMOVED: Debug keyboard shortcut for old showCYOA event (was causing double-triggering)
      // P -> Set progress to 99% (was Shift+P)
      const keyP = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.P, true, false);
      keyP?.on('down', () => {
        console.log('Debug: Setting progress to 99%');
        this.gameState.updateState({ progress: 99 });
      });

      // Debug: Add 'R' key to generate random window shapes for testing
      const keyR = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R, true, false);
      keyR?.on('down', () => {
        this.createDebugWindow();
      });

      // S -> Toggle debug story system
      const keyS = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.S, true, false);
      keyS?.on('down', () => {
        console.log('🎭 Toggling debug story system');
        if (this.storyManager) {
          this.storyManager.toggleDebugStory();
        }
      });

      // Debug: Add 'U' key to force show tutorial overlay
      const keyU = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.U, true, false);
      keyU?.on('down', () => {
        console.log('Debug: Forcing tutorial overlay to show');
        this.tutorialSystem.debugForceShowTutorial();
      });

      // Debug: Add 'K' key to test handleStep directly
      const keyK = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.K, true, false);
      keyK?.on('down', () => {
        console.log('Debug: Testing handleStep directly');
        try {
          this.tutorialSystem.handleStep(999);
          console.log('Debug: handleStep test successful');
        } catch (error) {
          console.error('Debug: handleStep test failed:', error);
        }
      });

      // T -> Generate speech bubble (talk)
      const keyT = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.T, true, false);
      keyT?.on('down', () => {
        this.createDebugSpeechBubble();
      });
      
      // Debug: Add 'X' key to reset narrative system (force clear)
      const keyX = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.X, true, false);
      keyX?.on('down', () => {
        console.log('🔧 Force resetting narrative system...');
        this.windowShapes.forceResetNarrativeSystem();
      });

      // Debug: Add '[' and ']' keys to cycle through dither patterns
      const keyLeftBracket = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.OPEN_BRACKET, true, false);
      keyLeftBracket?.on('down', () => {
        console.log('🎨 Cycling to previous dither pattern...');
        this.windowShapes.overlayManager.cycleDitherPattern('prev');
      });

      const keyRightBracket = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.CLOSED_BRACKET, true, false);
      keyRightBracket?.on('down', () => {
        console.log('🎨 Cycling to next dither pattern...');
        this.windowShapes.overlayManager.cycleDitherPattern('next');
      });

      // Debug: Add 'E' key to open exit stores catalog for testing
      const keyE = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E, true, false);
      keyE?.on('down', () => {
        console.log('🚪 Debug: Opening Exit Stores Catalog');
        // Pause driving similar to normal exit
        if (this.carMechanics) {
          this.carMechanics.pauseDriving();
        }
        const menuScene = this.scene.get('MenuScene');
        if (menuScene) {
          (menuScene as any).events.emit('showExitStoresCatalog');
          this.scene.bringToTop('MenuScene');
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

      // (Moral decision now handled via Shift+D above)

      // Debug: Add 'C' key to trigger a CYOA menu for testing
      const keyC = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.C, true, false);
      keyC?.on('down', () => {
        const menuScene = this.scene.get('MenuScene');
        if (menuScene) {
          (menuScene as any).events.emit('showCyoaMenu', { cyoaId: 1, isExitRelated: false });
          this.scene.bringToTop('MenuScene');
        }
      });
    } catch {}

    // Create rearview mirror background (simple sprite like dash, but with slide animation)
    const cam = this.cameras.main;
    const rearviewConfig = gameElements.getRearviewMirror();
    const rectWidth = Math.floor(cam.width * rearviewConfig.size.width);
    const rectHeight = Math.floor(cam.height * rearviewConfig.size.height);
    const rectX = Math.floor(cam.width * rearviewConfig.position.x);
    const rectY = Math.floor(cam.height * rearviewConfig.position.y);
    
    const rearviewRect = this.add.rectangle(rectX, rectY, rectWidth, rectHeight, UI_LAYOUT.rearviewBackgroundColor, UI_LAYOUT.rearviewBackgroundAlpha);
    rearviewRect.setStrokeStyle(2, UI_LAYOUT.rearviewStrokeColor, 1);
    rearviewRect.setScrollFactor(0);
    rearviewRect.setDepth(15000); // Same depth as dash background
    
    // Start rearview mirror off-screen (above the visible area)
    const offScreenY = -cam.height; // Position above the screen
    rearviewRect.setPosition(rectX, offScreenY);
    
    // Store reference for animation
    this.rearviewRect = rearviewRect;
    
    console.log('🔍 Rearview rectangle created at:', rectX, offScreenY, 'size:', rectWidth, 'x', rectHeight);
    
    // Get virtual pet positions from GameElements config
    const petPositions = gameElements.getVirtualPetPositions();
    
    // Create five virtual pets with manual positioning
    for (let i = 0; i < 5; i++) {
      const position = petPositions[i];
      
      // Convert percentage to pixel offset from rectangle center
      const xOffset = Math.floor((position.x - 0.5) * rectWidth);
      const yOffset = Math.floor((position.y - 0.5) * rectHeight);
      
      // Position pets at their final screen coordinates (where they'll be when container is at y=0)
      const petX = rectX + xOffset;
      const petY = rectY + yOffset + 20; // Move pets down 20px to be lower visually
      
      const pet = new VirtualPet(this, { 
        depth: 70001 + i, 
        xPercent: petX / cam.width, // Convert to screen percentage for VirtualPet
        yOffset: petY, // Use absolute Y position at final location
        petColor: PET_CONFIG.petColor, // Use centralized pet color
        width: 0, // Don't create individual rectangles
        height: 0,
        scale: position.scale || 0.8, // Use scale from config, default to 0.8
        petIndex: i // Pass the pet index for special initialization
      });
      pet.initialize();
      
      // Initially make pets transparent since rearview container is off-screen
      const petContainer = pet.getRoot?.();
      if (petContainer) {
        petContainer.setAlpha(0); // Start transparent instead of invisible
        petContainer.setVisible(true); // Ensure container is visible
        console.log('🔍 Pet', i, 'initial container state:', {
          visible: petContainer.visible,
          alpha: petContainer.alpha,
          x: petContainer.x,
          y: petContainer.y,
          depth: petContainer.depth
        });
        // Position pets at their final screen coordinates (not off-screen)
        // They'll fade in when the rearview animation completes
      }
      
      this.virtualPets.push(pet);
      
      // Add pet container directly to scene with its own depth (not to rearview container)
      // This ensures pets render above the rearview background
      if (petContainer) {
        console.log('🔍 Pet container created for pet', i, 'at position:', petContainer.x, petContainer.y);
        // Add directly to scene with proper depth
        petContainer.setDepth(70001 + i); // Above rearview mirror
        console.log('🔍 Pet container added to scene with depth:', petContainer.depth);
      }
      
      // Add name label above each pet's circle (initially hidden)
      const petSprite = pet.getPetSprite?.();
      const anchor = pet.getFeedAnchor?.();
      if (petSprite && anchor && petContainer) {
        // Get band member name for this pet
        const bandMember = pet.getBandMember?.();
        const petName = bandMember?.name?.toLowerCase() || `pet ${i + 1}`;
        const nameText = `<<${petName}>>`;
        
        // Position labels relative to the pet container (not absolute screen coordinates)
        const labelX = 0; // Relative to container center
        const labelY = anchor.r + 20; // Below the pet
        
        // Create animated collage-style background
        const textMetrics = this.add.text(0, 0, nameText, {
          fontSize: '12px',
          fontStyle: 'bold'
        });
        const textWidth = textMetrics.width + 16; // Add more padding for collage style
        const textHeight = textMetrics.height + 8; // Add more padding for collage style
        textMetrics.destroy(); // Remove temporary text
        
        const background = this.windowShapes.createCollageRect({
          x: -textWidth / 2, // Center horizontally relative to container
          y: -textHeight / 2, // Center vertically relative to container
          width: textWidth,
          height: textHeight
        }, true, 'narrativeBackground'); // Use narrativeBackground for pure black, no shadows
        background.setScrollFactor(0);
        background.setDepth(70049 + i); // Behind text
        
        // Create name label
        const label = this.add.text(labelX, labelY, nameText, {
          fontSize: '12px',
          color: '#ffffff',
          fontStyle: 'bold'
        }).setOrigin(0.5);
        label.setScrollFactor(0);
        label.setDepth(70050 + i); // Above background
        
        // Initially hide both background and text
        background.setAlpha(0);
        label.setAlpha(0);
        
        // Add labels to the pet container so they move with the pet
        petContainer.add(background);
        petContainer.add(label);
        
        this.petLabels[i] = label;
        (this.petLabels as any)[`bg_${i}`] = background; // Store background reference
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
      
      // Include dash background in controls camera
      const dashBackground = (this.gameUI as any).dashBackground;
      
      // Allow both control objects, tutorial overlay objects, and dash background to render on controls camera
      // Virtual pets will be rendered on the main camera instead
      const allowed = new Set<Phaser.GameObjects.GameObject>([
        ...controlObjs,
        ...(tutObjsInit || []),
        ...(dashBackground ? [dashBackground] : [])
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

    // Create items camera - renders items above steering wheel/virtual pets but below UI
    this.itemsCamera = this.cameras.add(0, 0, this.cameras.main.width, this.cameras.main.height);
    this.itemsCamera.setScroll(0, 0);
    this.itemsCamera.setName('itemsCamera');
    // Ensure items camera depth ordering is correct relative to others
    try { this.itemsCamera?.setName('itemsCamera'); } catch {}
    
    // Items camera should render everything EXCEPT steering wheel/virtual pets
    // This ensures items render above those elements while maintaining input handling
    const allObjects = (this.children.list || []) as Phaser.GameObjects.GameObject[];
    
    // Get control objects (steering wheel, etc.) to ignore on items camera
    const controlObjsForItems = (this.gameUI as any).getControlObjects?.() as Phaser.GameObjects.GameObject[] | undefined;
    // Virtual pets should be rendered on the main camera, not ignored by items camera
    const dashBackground = (this.gameUI as any).dashBackground;
    
    const objectsToIgnoreOnItemsCamera = [
      ...(controlObjsForItems || []),
      ...(dashBackground ? [dashBackground] : [])
    ];
    
    if (objectsToIgnoreOnItemsCamera.length > 0) {
      this.itemsCamera.ignore(objectsToIgnoreOnItemsCamera);
    }

    // Create a dedicated overlay container for dragged items (always above HUD/pet)
    this.dragOverlay = this.add.container(0, 0);
    this.dragOverlay.setDepth(110001);
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
    
    // WindowShapes Configuration (needed for shared OverlayManager)
    this.windowShapes = new WindowShapes(this);
    
    // Story Manager Configuration
    this.storyManager = new StoryManager(this);
    this.storyManager.initialize();
    
    // Tutorial System Configuration - using centralized config and shared OverlayManager
    const tutorialConfig: TutorialConfig = TUTORIAL_CONFIG;
    this.tutorialSystem = new TutorialSystem(this, tutorialConfig, this.windowShapes.overlayManager);
    
    // Game UI Configuration - using centralized config
    const uiConfig: GameUIConfig = {
      ...UI_CONFIG,
      speedCrankSnapPositions: [...UI_CONFIG.speedCrankSnapPositions] // Convert readonly to mutable
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
    this.frontseatPhone = new Phone(this);
    
    // Create key SVG overlay that will follow the key's position
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const keysX = gameWidth * 0.8; // Match the keys position (80% from left edge)
    this.keySVG = this.add.sprite(keysX, 300, 'key-white'); // Start at key's initial position (right side)
    this.keySVG.setScale(0.08); // Scaled to match key physics object (radius 15)
    this.keySVG.setOrigin(0.5, 0.5);
    this.keySVG.setAlpha(0.8); // Semi-transparent overlay
    this.keySVG.setDepth(60001); // Above steering wheel (60000)
    
    // Apply white fill and black stroke styling
    this.keySVG.setTint(0xffffff); // White fill
    
    // Create hot-dog SVG overlay that will follow the food item's position (red Trash object)
    this.hotdogSVG = this.add.sprite(100, 200, 'hot-dog');
    this.hotdogSVG.setScale(0.1);
    this.hotdogSVG.setOrigin(0.5, 0.5);
    this.hotdogSVG.setAlpha(0.8);
    this.hotdogSVG.setDepth(60001);
    this.hotdogSVG.setTint(0xffffff);
    // Track the initial overlay
    // Initialize with keys and phone (phone doesn't count toward encumbrance)
    this.hotdogOverlays.push({ body: this.frontseatTrash.gameObject, sprite: this.hotdogSVG });
    
    // Create phone SVG overlay that will follow the phone's position
    const phoneX = gameWidth * 0.2; // Match the phone position (20% from left edge)
    this.phoneSVG = this.add.sprite(phoneX, 250, 'x'); // Use x.png as default sprite
    this.phoneSVG.setScale(0.1); // Scaled to match phone physics object (same as hot dog)
    this.phoneSVG.setOrigin(0.5, 0.5);
    this.phoneSVG.setAlpha(0.8);
    this.phoneSVG.setDepth(60001);
    this.phoneSVG.setTint(0x00aaff); // Blue tint to match phone color
    
    // Create green item SVG overlay that will follow the green item's position
    this.itemSVG = this.add.sprite(150, 320, 'x'); // Use x.png as default sprite
    this.itemSVG.setScale(0.1); // Scaled to match item physics object (same as hot dog)
    this.itemSVG.setOrigin(0.5, 0.5);
    this.itemSVG.setAlpha(0.8);
    this.itemSVG.setDepth(60001);
    this.itemSVG.setTint(0x00ff00); // Green tint to match item color
    
    // Set references for tutorial system
    this.tutorialSystem.setPhysicsObjects(this.frontseatKeys);
    this.tutorialSystem.setGameUI(this.gameUI);
  }

  /**
   * Initialize physics safety system to prevent items from falling out of world
   */
  private initializePhysicsSafetySystem() {
    // Start safety check timer - runs every 1000ms (1 second)
    this.physicsSafetyTimer = this.time.addEvent({
      delay: 1000,
      callback: this.checkPhysicsObjectSafety,
      callbackScope: this,
      loop: true
    });
    
    console.log('🛡️ Physics safety system initialized - checking every 1 second');
  }

  /** Debug: Add keyboard shortcuts for debugging */
  private addDebugDropButton() {
    // N key removed - was spawning hot-dog items
    
    // Keyboard shortcut: press 'I' to toggle debug item menu
    try {
      this.input.keyboard?.on('keydown-I', () => {
        try { console.log('Debug: I key pressed -> toggle debug menu'); } catch {}
        this.toggleDebugMenu();
      });
    } catch {}
    
    // RIGHT key removed - was advancing sequence
    // S key for animated SVG removed - conflicts with story dialog
  }

  private createDebugItemMenu() {
    try {
      // Create container for debug menu
      this.debugItemMenu = this.add.container(0, 0);
      this.debugItemMenu.setScrollFactor(0);
      this.debugItemMenu.setDepth(10010);
      this.debugItemMenu.setVisible(false);

      // Background
      const bg = this.add.rectangle(0, 0, 200, 300, 0x000000, 0.8);
      bg.setOrigin(0, 0);
      bg.setScrollFactor(0);
      this.debugItemMenu.add(bg);

      // Title
      const title = this.add.text(10, 10, 'DEBUG ITEMS', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold'
      });
      title.setScrollFactor(0);
      this.debugItemMenu.add(title);

      // Create buttons for each item type
      const types = Object.keys(GameScene.ITEM_TYPES) as Array<keyof typeof GameScene.ITEM_TYPES>;
      types.forEach((type, index) => {
        const color = (GameScene.ITEM_TYPES as any)[type].color;
        const btn = this.add.text(10, 40 + (index * 30), `${type}`, {
          fontSize: '14px',
          color: '#ffffff',
          backgroundColor: `#${color.toString(16).padStart(6, '0')}`,
          padding: { x: 8, y: 4 }
        });
        btn.setScrollFactor(0);
        btn.setInteractive({ useHandCursor: true } as any);
        btn.on('pointerdown', () => {
          try { console.log(`Debug: Spawning ${type}`); } catch {}
          this.spawnHotDogFromTop(type);
        });
        this.debugItemMenu?.add(btn);
      });

      // Close button
      const closeBtn = this.add.text(10, 40 + (types.length * 30) + 10, 'CLOSE', {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#666666',
        padding: { x: 8, y: 4 }
      });
      closeBtn.setScrollFactor(0);
      closeBtn.setInteractive({ useHandCursor: true } as any);
      closeBtn.on('pointerdown', () => {
        this.toggleDebugMenu();
      });
      this.debugItemMenu.add(closeBtn);

      // Position menu
      this.debugItemMenu.setPosition(10, 10);

    } catch {}
  }

  private toggleDebugMenu() {
    if (!this.debugItemMenu) return;
    
    this.debugMenuVisible = !this.debugMenuVisible;
    this.debugItemMenu.setVisible(this.debugMenuVisible);
    
    try { console.log(`Debug menu ${this.debugMenuVisible ? 'opened' : 'closed'}`); } catch {}
  }

  /** Spawn a new hot-dog item at the top that falls under Matter gravity */
  private spawnHotDogFromTop(itemType: keyof typeof GameScene.ITEM_TYPES = 'Food') {
    try { console.log('GameScene: spawnHotDogFromTop called'); } catch {}
    // Create a new physics circle matching the existing frontseatTrash size
    const itemSize = gameElements.getItemSize('medium');
    const radius = Math.floor(itemSize.width / 2);
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const extendedTop = -Math.floor(gameHeight * 0.2);
    const spawnX = Phaser.Math.Between(radius + 10, gameWidth - radius - 10);
    const spawnY = extendedTop - radius - 10; // Spawn within extended world above top

    // Create a new circle graphics like Trash uses, color by type
    const color = (GameScene.ITEM_TYPES as any)[itemType]?.color ?? 0xff0000;
    const circle = this.add.circle(spawnX, spawnY, radius, color);
    circle.setDepth(60000);
    // Ensure it is part of the same container/items camera as other items
    try { this.gameContentContainer.add(circle); } catch {}
    // Enable matter physics
    this.matter.add.gameObject(circle, {
      shape: { type: 'circle', radius },
      label: 'food',
      isSensor: false
    } as any);
    // Make it fall faster: reduce air drag and increase density (mass)
    (circle.body as MatterJS.BodyType).frictionAir = 0 as any;
    this.matter.body.setDensity(circle.body as any, 0.03);
    (circle.body as MatterJS.BodyType).restitution = 0.4 as any; // a bit bouncy
    // Give a tiny downward nudge so it immediately starts moving
    this.matter.body.applyForce(circle.body as any, { x: circle.x, y: circle.y }, { x: 0, y: 0.0008 });

    // Add drag interaction similar to existing items (minimal)
    circle.setInteractive({ useHandCursor: true } as any);
    this.input.setDraggable(circle);
    circle.on('dragstart', () => { (circle as any).isDragging = true; });
    circle.on('drag', (_p: any, x: number, y: number) => { circle.setPosition(x, y); });
    circle.on('dragend', () => { (circle as any).isDragging = false; });

    // Attach an SVG overlay for the hot-dog that follows this body
    const sprite = this.add.sprite(circle.x, circle.y, 'hot-dog');
    sprite.setScale(0.1);
    sprite.setOrigin(0.5, 0.5);
    sprite.setAlpha(0.8);
    sprite.setDepth(60001);
    sprite.setTint(0xffffff);
    // Do NOT add sprite to gameContentContainer. Overlays live at root and are positioned in world space.
    // Make sure it's not ignored by the items camera (controls camera ignores only controls)
    try {
      const controlObjsForItems = (this.gameUI as any).getControlObjects?.() as Phaser.GameObjects.GameObject[] | undefined;
      // Virtual pets should be rendered on the main camera, not ignored by items camera
      const objectsToIgnoreOnItemsCamera = [ ...(controlObjsForItems || []) ];
      if (objectsToIgnoreOnItemsCamera && this.itemsCamera) {
        // Ensure new objects are NOT in ignore list
        this.itemsCamera.ignore(objectsToIgnoreOnItemsCamera);
      }
    } catch {}

    // Ensure high render order
    try { this.children.bringToTop(sprite); } catch {}
    this.hotdogOverlays.push({ body: circle, sprite });
    try { console.log('GameScene: spawned hot-dog item at', { x: circle.x, y: circle.y }, 'total overlays:', this.hotdogOverlays.length); } catch {}
    // Update encumbrance display after spawning
    this.updateEncumbranceUI();
  }

  /** Compute current encumbrance count (keys + hotdogs, phone doesn't count) */
  public getEncumbranceCount(): number {
    const keysCount = this.frontseatKeys ? 1 : 0;
    const hotdogs = this.hotdogOverlays ? this.hotdogOverlays.length : 0;
    // Phone doesn't count toward encumbrance
    return keysCount + hotdogs;
  }

  /** Encumbrance capacity */
  public getEncumbranceCapacity(): number { return this.encumbranceCapacity; }

  /** Push current encumbrance to UI */
  private updateEncumbranceUI() {
    try { (this.gameUI as any)?.setEncumbrance?.(this.getEncumbranceCount(), this.getEncumbranceCapacity()); } catch {}
  }

  /**
   * Check if physics objects have fallen out of bounds and respawn them
   */
  private checkPhysicsObjectSafety() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Define safety bounds (with some padding)
    const safetyBounds = {
      left: -100,
      right: gameWidth + 100,
      top: -100,
      bottom: gameHeight + 100
    };
    
    // Check each physics object
    const physicsObjects = [
      { name: 'frontseatTrash', obj: this.frontseatTrash },
      { name: 'backseatItem', obj: this.backseatItem },
      { name: 'frontseatKeys', obj: this.frontseatKeys }
    ];
    
    physicsObjects.forEach(({ name, obj }) => {
      if (!obj || !obj.gameObject || !obj.gameObject.body) {
        return;
      }
      
      const body = obj.gameObject.body as any;
      const x = body.position.x;
      const y = body.position.y;
      
      // Check if object is out of bounds
      const isOutOfBounds = x < safetyBounds.left || 
                           x > safetyBounds.right || 
                           y < safetyBounds.top || 
                           y > safetyBounds.bottom;
      
      if (isOutOfBounds) {
        console.log(`🚨 ${name} fell out of bounds at (${x.toFixed(1)}, ${y.toFixed(1)}) - respawning`);
        this.respawnPhysicsObject(name, obj);
      }
    });
  }

  /**
   * Respawn a physics object to a safe position
   */
  private respawnPhysicsObject(objectName: string, obj: any) {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Define specific respawn positions for each object type
    let respawnX: number;
    let respawnY: number;
    
    switch (objectName) {
      case 'frontseatTrash':
        respawnX = 100; // Left side
        respawnY = 200;
        break;
      case 'backseatItem':
        respawnX = 230; // Backseat area
        respawnY = 320;
        break;
      case 'frontseatKeys':
        respawnX = gameWidth * 0.8; // Right side
        respawnY = 200;
        break;
      default:
        // Fallback: random position
        respawnX = Phaser.Math.Between(50, gameWidth - 50);
        respawnY = gameHeight * 0.5;
    }
    
    // Reset physics body position
    if (obj.gameObject && obj.gameObject.body) {
      const body = obj.gameObject.body as any;
      
      // Stop any existing velocity
      body.velocity = { x: 0, y: 0 };
      body.angularVelocity = 0;
      
      // Set new position
      body.position = { x: respawnX, y: respawnY };
      
      // Update visual position
      obj.gameObject.setPosition(respawnX, respawnY);
      
      console.log(`✅ ${objectName} respawned at (${respawnX}, ${respawnY})`);
    }
  }

  /**
   * Handle region selection from menu
   */
  public selectRegion(regionId: string) {
    console.log(`Region selected: ${regionId}`);
    
    // Change region in game state
    this.gameState.changeRegion(regionId);
    
    // Reset driving state and restart driving
    this.stopMenuOpen = false;
    this.carStarted = true; // Ensure car is started
    this.gameState.updateState({ 
      carStarted: true,
      progress: 0  // Reset progress to 0 for new driving sequence
    });
    
    // Restart driving mechanics
    const currentStep = this.gameState.getState().step || 0;
    this.carMechanics.startDriving(currentStep);
    
    // Resume game
    const appScene = this.scene.get('AppScene');
    if (appScene) {
      (appScene as any).isPaused = false;
      this.events.emit('gameResumed');
    }
    
    // Check if night mode should be enabled for this region's final sequence
    if (this.gameState.isFinalSequenceForRegion()) {
      this.enableNightTimeMode();
    } else {
      this.disableNightTimeMode();
    }
    
    console.log(`✅ Region changed to ${regionId} - driving restarted with progress reset to 0`);
  }

  /**
   * Enable night time mode for final driving sequence
   */
  private enableNightTimeMode() {
    if (this.nightModeEnabled) return; // Already enabled, skip
    
    this.nightModeEnabled = true;
    
    // Check if any menu is currently open - suppress logs during menus
    const menuScene = this.scene.get('MenuScene');
    const hasOpenMenu = menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDialog;
    
    if (!hasOpenMenu) {
      console.log('🌙 Enabling night time mode');
    }
    
    // Add night time visual effects - create overlay instead of tinting container
    if (!this.nightTimeOverlay) {
      this.nightTimeOverlay = this.add.rectangle(
        this.cameras.main.width / 2, 
        this.cameras.main.height / 2, 
        this.cameras.main.width, 
        this.cameras.main.height, 
        0x000000, 
        0.3
      );
      this.nightTimeOverlay.setScrollFactor(0);
      this.nightTimeOverlay.setDepth(20000); // Above driving but below UI
    }
    this.nightTimeOverlay.setVisible(true);
    
    // Update sky color to darker
    if (this.carMechanics) {
      this.carMechanics.setNightTimeMode(true);
    }
  }

  /**
   * Disable night time mode
   */
  private disableNightTimeMode() {
    if (!this.nightModeEnabled) return; // Already disabled, skip
    
    this.nightModeEnabled = false;
    
    // Check if any menu is currently open - suppress logs during menus
    const menuScene = this.scene.get('MenuScene');
    const hasOpenMenu = menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDialog;
    
    if (!hasOpenMenu) {
      console.log('☀️ Disabling night time mode');
    }
    
    // Remove night time visual effects
    if (this.nightTimeOverlay) {
      this.nightTimeOverlay.setVisible(false);
    }
    
    // Update sky color to normal
    if (this.carMechanics) {
      this.carMechanics.setNightTimeMode(false);
    }
  }

  /**
   * Advance to next sequence (same as dev button functionality)
   */
  private advanceToNextSequence() {
    const totalSequences = this.gameState.getSequencesForCurrentRegion();
    const currentSequence = this.gameState.getState().showsInCurrentRegion;
    const nextSequence = Math.min(currentSequence + 1, totalSequences - 1);
    
    this.gameState.updateState({ showsInCurrentRegion: nextSequence });
    console.log(`🔧 RIGHT: Advanced sequence to ${nextSequence + 1}/${totalSequences}`);
  }

  /**
   * Spawn an animated SVG for testing
   */
  private spawnAnimatedSVG() {
    if (!this.windowShapes) {
      console.warn('WindowShapes not available for SVG animation');
      return;
    }

    // Random position on screen
    const x = Phaser.Math.Between(50, 310);
    const y = Phaser.Math.Between(100, 500);
    
    // Random colors
    const colors = [0xff6b35, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3];
    const fillColor = colors[Phaser.Math.Between(0, colors.length - 1)];
    
    // Create animated SVG
    const animatedSVG = this.windowShapes.createTestAnimatedSVG(x, y);
    animatedSVG.setDepth(1000); // Above other objects
    
    // Add to game content container
    if (this.gameContentContainer) {
      this.gameContentContainer.add(animatedSVG);
    }
    
    console.log(`🎨 Spawned animated SVG at (${x}, ${y}) with color 0x${fillColor.toString(16)}`);
  }

  /**
   * Generate a countdown value using bell curve probability (6-12)
   * Bell curve centered around 9, with 6 and 12 being least likely
   */
  private generateCountdownValue(): number {
    // Generate two random numbers and use Box-Muller transform for bell curve
    const u1 = Math.random();
    const u2 = Math.random();
    
    // Box-Muller transform to get normal distribution
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Scale and shift to get values roughly in range 6-12
    // Mean = 9, Standard deviation = 1.5
    const normalValue = z0 * 1.5 + 9;
    
    // Clamp to range 6-12 and round
    const clampedValue = Math.max(6, Math.min(12, Math.round(normalValue)));
    
    console.log(`🎲 Generated countdown value: ${clampedValue} (from normal distribution)`);
    return clampedValue;
  }

  /**
   * Create game content container
   */
  private createGameContentContainer() {
    this.gameContentContainer = this.add.container(0, 0);
    this.gameContentContainer.setName('gameContentContainer');
    // No depth needed - items will be rendered by dedicated items camera
    
    // Create dash box early so it can be added to camera allow lists
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const boxWidth = gameWidth * 1.2; // 20% wider than game width
    const boxHeight = gameHeight * 0.4; // 40% of game height
    const boxX = gameWidth / 2; // Horizontally centered
    const boxY = gameHeight - (boxHeight / 2); // Against bottom of game
    
    // REMOVED - all approaches caused steering wheel visibility issues
    // Will try modifying background scene instead
    
    // Add physics objects to container
    this.gameContentContainer.add(this.frontseatTrash.gameObject);
    this.gameContentContainer.add(this.backseatItem.gameObject);
    this.gameContentContainer.add(this.frontseatKeys.gameObject);
    this.gameContentContainer.add(this.frontseatPhone.gameObject);
  }

  /**
   * Create magnetic target
   */
  private createMagneticTarget() {
    // Use GameElements config for magnetic target position
    const magneticTargetConfig = gameElements.getMagneticTarget();
    const magneticConfig = {
      x: magneticTargetConfig.position.x,
      y: magneticTargetConfig.position.y,
      radius: magneticTargetConfig.radius,
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
    this.magneticTarget.setDepth(10001); // Above most UI elements but below speed display
    
    // Add to game content container so it moves with camera
    this.gameContentContainer.add(this.magneticTarget);
  }

  /**
   * Set up physics worlds
   */
     private setupPhysicsWorlds() {
    // Set up Matter.js physics with gravity using centralized config
    // Extend world 20% above the top so items can spawn offscreen and fall in
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const extendedTop = -Math.floor(gameHeight * 0.2);
    this.matter.world.setBounds(0, extendedTop, gameWidth, gameHeight - extendedTop + 10);
    
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
    const raisedFloorHeight = gameHeight * 0.90 + 10; // 90% of screen height + 10px lower
    const wallThickness = 20;
    
    // Create a horizontal wall at the raised floor position
    const raisedFloor = this.matter.add.rectangle(gameWidth/2, raisedFloorHeight, gameWidth, wallThickness, {
      isStatic: true
    });
    
    // Add a visual indicator
    const floorVisual = this.add.rectangle(gameWidth/2, raisedFloorHeight, gameWidth, 4, 0x333333);
    floorVisual.setDepth(999);
    floorVisual.setAlpha(0.8);
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners() {
    // Game state events
    this.gameState.setEventCallbacks({
      onStateChange: (state) => {
        this.gameUI.updateUI(state);
        
        // Update region info with total sequences
        const totalSequences = this.gameState.getSequencesForCurrentRegion();
        this.gameUI.updateRegionInfoWithTotal(state.currentRegion, state.showsInCurrentRegion, totalSequences);
        
        // Check if this is the final sequence for night time
        if (this.gameState.isFinalSequenceForRegion()) {
          this.enableNightTimeMode();
        } else {
          this.disableNightTimeMode();
        }
        
        // Update threshold indicators based on planned exits, CYOA, and story
        // Only update if the planned events have actually changed
        const plannedExits = this.carMechanics.getPlannedExits();
        const plannedCyoa = this.carMechanics.getPlannedCyoa();
        const plannedStory = this.carMechanics.getPlannedStory();
        
        // Check if planned events have changed since last update
        const currentPlannedData = JSON.stringify({ plannedExits, plannedCyoa, plannedStory });
        if (this.lastPlannedData !== currentPlannedData) {
          this.lastPlannedData = currentPlannedData;
          this.gameUI.updateThresholdIndicators(plannedExits, plannedCyoa, plannedStory);
        }
        // Auto-snap crank to 0 when keys are out of ignition
        // Speed crank removed - no need to reset
        this.scheduleTutorialUpdate(0);
      },
      onSaveComplete: (success) => {
        // Save completed
      },
      onLoadComplete: (success, state) => {
        if (success && state) {
          this.gameUI.updateUI(state);
        }
      }
    });
    
    // Input handler events
    this.inputHandlers.setEventCallbacks({
      onSteeringInput: (value) => {
        this.onSteeringInput(value);
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
    
    // Listen for pothole hits from CarMechanics and show windows immediately
    this.events.on('potholeHit', () => {
      // Show pothole windows immediately instead of waiting for next step
      const menuScene = this.scene.get('MenuScene');
      if (menuScene) {
        menuScene.events.emit('showPotholeMenu');
        // Fallback direct call if event not wired
        const mm: any = (menuScene as any).menuManager;
        if (mm?.showPotholeMenu) {
          mm.showPotholeMenu();
        }
        // Ensure MenuScene is on top so the overlay is visible
        this.scene.bringToTop('MenuScene');
      }
      
      // Apply large bump effect and screen shake for pothole collision
      this.applyLargeBumpEffectToAllMatterObjects();
      this.applyScreenShake(0.02, 250); // Strong-but-brief shake (intensity 0-1)
    });

    // Listen for pothole menu shake events from MenuManager
    this.events.on('potholeMenuShake', () => {
      this.applyScreenShake(0.01, 180); // Lighter shake for menu pop
    });

    // Scene events
    this.events.on('step', this.onStepEvent, this);
    this.events.on('halfStep', this.onHalfStepEvent, this);
    this.events.on('gamePaused', this.onGamePaused, this);
    this.events.on('gameResumed', this.onGameResumed, this);
    this.events.on('turnKey', this.onTurnKey, this);
    this.events.on('removeKeys', this.onRemoveKeys, this);
    this.events.on('ignitionMenuShown', this.onIgnitionMenuShown, this);
    this.events.on('ignitionMenuHidden', this.onIgnitionMenuHidden, this);
    this.events.on('tutorialInterruptClosed', this.onTutorialInterruptClosed, this);
    this.events.on('speedUpdate', this.onSpeedUpdate, this);
    this.events.on('steeringInput', this.onSteeringInput, this);
    // Speed crank removed - using automatic speed progression
    this.events.on('cameraAngleChanged', this.onCameraAngleChanged, this);
    
    // Story events
    this.events.on('storyCompleted', this.onStoryCompleted, this);
    
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
      // Speed crank removed - using automatic speed progression
      hasOpenMenu: !!hasOpenMenu,
      currentMenuType: currentMenuType,
      steeringUsed: this.steeringUsed,
      inExitCollisionPath: this.isPlayerInExitCollisionPath()
    };
    
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

    // Treat tutorial overlays as blocking menus for interruption gating,
    try {
      const menuScene = this.scene.get('MenuScene');
      const realMenuOpen = !!(menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDialog);
      const tutorialOpen = !!currentTutorial && currentTutorial !== 'none';
      if (!realMenuOpen) {
        this.gameState.updateState({ hasOpenMenu: tutorialOpen });
      }
    } catch {}
  }

  /**
   * Schedule a tutorial update with simple debouncing to avoid floods/loops
   */
  private scheduleTutorialUpdate(delayMs: number = 0) {
    if (this.tutorialUpdateScheduled) {
      return;
    }
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
    // Speed crank removed - using automatic speed progression
  }

  /**
   * Scene pause handler
   */
  pause() {
    this.carMechanics.pauseDriving();
    this.inputHandlers.resetInputState();
  }

  /**
   * Scene resume handler
   */
  resume() {
    if (this.shouldAutoRestartDriving && this.drivingMode) {
      this.carMechanics.resumeDriving();
    }
  }

  /**
   * Main update loop
   */
  update() {
    // Safety check: ensure gameState is initialized
    if (!this.gameState) {
      return;
    }
    
    // Update all systems
    const currentStep = this.gameState.getState().step || 0;
    
    // Safety check: ensure carMechanics is initialized
    if (this.carMechanics) {
      this.carMechanics.update(currentStep);
    }
    
    // Update game UI (steering wheel gradual return to center)
    if (this.gameUI) {
      this.gameUI.update(SCENE_TUNABLES.performance.uiUpdateDeltaMs); // Typical delta time
    }
    
    // Update virtual pets so they can sync visuals to Matter bodies (sway)
    for (let i = 0; i < this.virtualPets.length; i++) {
      const pet = this.virtualPets[i];
      if (pet && (pet as any).update) {
        try { (pet as any).update(); } catch {}
      }
    }
    
    // HUD camera remains unrotated; no per-frame virtual pet counter-rotation needed
    if (this.frontseatKeys && this.frontseatTrash && this.backseatItem) {
      this.applyMagneticAttraction();
    }
    // Smoothly apply lateral gravity based on steering
    this.gravityXCurrent = Phaser.Math.Linear(this.gravityXCurrent, this.gravityXTarget, 0.1);
    this.matter.world.setGravity(this.gravityXCurrent, this.gravityBaseY);

    // Keep pet labels pinned to pet positions and correct order/depth
    for (let i = 0; i < this.virtualPets.length; i++) {
      const pet = this.virtualPets[i];
      const label = this.petLabels[i];
      const background = (this.petLabels as any)[`bg_${i}`];
      if (!pet || !label) continue;
      const anchor = pet.getFeedAnchor?.();
      const sprite = pet.getPetSprite?.();
      if (anchor && sprite) {
        const labelY = sprite.y + (anchor.r + 20);
        label.setPosition(sprite.x, labelY);
        if (background) {
          // Background needs to be positioned at the same coordinates as the text
          background.setPosition(sprite.x, labelY);
        }
        label.setDepth(70050 + i);
        if (background) {
          background.setDepth(70049 + i);
        }
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
      
      // Update SVG depth to match physics object depth during drag
      const isDragging = (this.frontseatKeys.gameObject as any).isDragging;
      if (isDragging) {
        this.keySVG.setDepth(110001); // Above the physics object (110000)
      } else {
        this.keySVG.setDepth(60001); // Above steering wheel (60000)
      }
    }
    
    // Update phone SVG position to follow the phone's physics body
    if (this.phoneSVG && this.frontseatPhone && this.frontseatPhone.gameObject) {
      // Convert physics object position to world coordinates
      const worldPos = this.gameContentContainer.getWorldTransformMatrix().transformPoint(
        this.frontseatPhone.gameObject.x, 
        this.frontseatPhone.gameObject.y
      );
      this.phoneSVG.setPosition(worldPos.x, worldPos.y);
      
      // Update SVG depth to match physics object depth during drag
      const isDragging = (this.frontseatPhone.gameObject as any).isDragging;
      if (isDragging) {
        this.phoneSVG.setDepth(110001); // Above the physics object (110000)
      } else {
        this.phoneSVG.setDepth(60001); // Above steering wheel (60000)
      }
    }
    
    // Update green item SVG position to follow the green item's physics body
    if (this.itemSVG && this.backseatItem && this.backseatItem.gameObject) {
      // Convert physics object position to world coordinates
      const worldPos = this.gameContentContainer.getWorldTransformMatrix().transformPoint(
        this.backseatItem.gameObject.x, 
        this.backseatItem.gameObject.y
      );
      this.itemSVG.setPosition(worldPos.x, worldPos.y);
      
      // Update SVG depth to match physics object depth during drag
      const isDragging = (this.backseatItem.gameObject as any).isDragging;
      if (isDragging) {
        this.itemSVG.setDepth(110001); // Above the physics object (110000)
      } else {
        this.itemSVG.setDepth(60001); // Above steering wheel (60000)
      }
    }
    
    // Keyhole SVG is now positioned independently and doesn't need updates
    
    // Update all hot-dog overlays to follow their respective physics bodies
    if (this.hotdogOverlays && this.hotdogOverlays.length > 0) {
      for (const overlay of this.hotdogOverlays) {
        if (!overlay.body || !overlay.sprite) continue;
        const worldPos = this.gameContentContainer.getWorldTransformMatrix().transformPoint(
          overlay.body.x,
          overlay.body.y
        );
        overlay.sprite.setPosition(worldPos.x, worldPos.y);
        overlay.sprite.setRotation(overlay.body.rotation);
        const isDragging = (overlay.body as any).isDragging;
        overlay.sprite.setDepth(isDragging ? 110001 : 60001);
      }
    }

    // Small: open a short attraction window when keys were just released from drag
    const keyGO: any = this.frontseatKeys?.gameObject;
    if (keyGO && keyGO._justReleasedAt && Date.now() - keyGO._justReleasedAt < 50) {
      this.keysAttractionUntil = Date.now() + SCENE_TUNABLES.magnetic.attractionWindowMs;
      keyGO._justReleasedAt = undefined;
    }

    // Fast tutorial updates while keys are out (no menu) - throttled to reduce spam
    const menuScene = this.scene.get('MenuScene');
    const hasOpenMenu = !!(menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDialog);
    if (!hasOpenMenu && !this.keysInIgnition) {
      // Throttle tutorial updates to every 5 frames to reduce console spam
      if (!this.tutorialUpdateCounter) this.tutorialUpdateCounter = 0;
      this.tutorialUpdateCounter++;
      
      if (this.tutorialUpdateCounter % 5 === 0) {
        // Recompute state and update immediately
        this.tutorialSystem.updateTutorialOverlay({
          keysInIgnition: this.keysInIgnition,
          carStarted: this.carStarted,
          // Speed crank removed - using automatic speed progression
          hasOpenMenu: false,
          currentMenuType: null,
          steeringUsed: this.steeringUsed
        } as any);
      }
      
      // Keep mask aligned to moving keys each frame
      if ((this.tutorialSystem as any).updateTutorialMaskRealTime) {
        (this.tutorialSystem as any).updateTutorialMaskRealTime();
      }
    }
    // Safety check: ensure inputHandlers is initialized
    if (this.inputHandlers) {
      this.inputHandlers.setInputState({
        isDraggingObject: false, // TODO: Get from physics objects
        isKnobActive: false, // TODO: Get from UI
        keysConstraint: this.keysConstraint,
        hasOpenMenu: false, // TODO: Get from menu system
        currentMenuType: null
      });
    }
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
    
    // Use GameElements config for magnetic target position
    const magneticTargetConfig = gameElements.getMagneticTarget();
    const magneticConfig = {
      x: magneticTargetConfig.position.x,
      y: magneticTargetConfig.position.y,
      radius: magneticTargetConfig.radius,
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
    
    // Check if keys are constrained (attached to ignition)
    const keysAreConstrained = !!this.keysConstraint;
    
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
      
      console.log('🔑 Keys constraint created successfully:', !!this.keysConstraint);
      
      // Track that keys are now in the ignition
      this.keysInIgnition = true;
      this.gameState.updateState({ keysInIgnition: true });
      console.log('Keys snapped to ignition');
      
      // Immediately pause game and show ignition menu
      const appScene = this.scene.get('AppScene');
      if (appScene) {
        (appScene as any).isPaused = true;
        this.events.emit('gamePaused');
      }
      
      // Emit showTurnKeyMenu event and bring MenuScene to top
      this.events.emit('showTurnKeyMenu');
      const menuScene = this.scene.get('MenuScene');
      if (menuScene) {
        menuScene.scene.bringToTop();
      }
      
      console.log('✅ Turn key menu event emitted and MenuScene brought to top');
      
      // Advance tutorial if we're in keys_placement phase
      if (this.gameState.getTutorialPhase() === 'keys_placement') {
        this.gameState.advanceTutorial();
      }
      
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
      }
      
    // Update tutorial overlay (debounced)
    this.scheduleTutorialUpdate(0);
    
    // If in tutorial, start the initial driving phase
    if (this.gameState.isInTutorial()) {
      // Tutorial: Car started, beginning initial driving phase
    }
      
      // Show turn key menu only if car hasn't been started yet AND key is in ignition
      console.log('Checking ignition menu conditions - carStarted:', this.carStarted, 'keysConstraint:', !!this.keysConstraint, 'keysInIgnition:', this.keysInIgnition);
      if (!this.carStarted && this.keysConstraint) {
        console.log('✅ Showing turn key menu - conditions met');
        this.showTurnKeyMenu();
      } else {
        console.log('❌ Not showing turn key menu - conditions not met');
        if (this.carStarted) console.log('  - Reason: car already started');
        if (!this.keysConstraint) console.log('  - Reason: no keys constraint');
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
      
      // Turn car off when constraint is removed
      this.turnOffCar();
      
      // Fully restore key physics to normal interactive state
      this.restoreKeyPhysics();
      
      // Reset Keys scroll factor to horizontal only
      this.frontseatKeys.gameObject.setScrollFactor(1, 0);
      
      // Visual highlight handled above
      
      // Snap speed crank to 0% when keys leave ignition
      this.resetCrankToZero();
      
      // Update tutorial overlay after a small delay (debounced)
      this.scheduleTutorialUpdate(SCENE_TUNABLES.tutorial.scheduleDelayMs);
      
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
    console.log('showTurnKeyMenu() called - emitting showTurnKeyMenu event');
    const menuScene = this.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showTurnKeyMenu');
      this.scene.bringToTop('MenuScene');
      console.log('✅ Turn key menu event emitted and MenuScene brought to top');
    } else {
      console.log('❌ MenuScene not found!');
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
    console.log('GameScene: onTurnKey called - carStarted:', this.carStarted);
    
    // Prevent multiple calls - if car is already started, ignore
    if (this.carStarted) {
      console.log('Turn Key ignored: car already started');
      return;
    }

    console.log('GameScene: Starting car - setting carStarted to true');
    // Car is now started
    this.carStarted = true;
    this.gameState.updateState({ carStarted: true });
    
    // Start driving mode when car is started
    if (!this.carMechanics.isDriving()) {
      const currentStep = this.gameState.getState().step || 0;
      console.log('GameScene: Starting driving mechanics at step:', currentStep);
      this.carMechanics.startDriving(currentStep);
      console.log('GameScene: Driving mechanics started');
      
      // Update threshold indicators after driving mechanics are started
      const plannedExits = this.carMechanics.getPlannedExits();
      const plannedCyoa = this.carMechanics.getPlannedCyoa();
      const plannedStory = this.carMechanics.getPlannedStory();
      console.log('🔺 GameScene: Updating threshold indicators after startDriving');
      this.gameUI.updateThresholdIndicators(plannedExits, plannedCyoa, plannedStory);
      
      // Driving mode started with car ignition
    } else {
      console.log('GameScene: CarMechanics was already driving');
      // CarMechanics was already driving
    }
    
    // Animate rearview mirror sliding down on first car start
    if (this.firstCarStart) {
      this.firstCarStart = false;
      
      // Don't animate rearview mirror during tutorial - it will be revealed after interrupt
      if (!this.gameState.isInTutorial()) {
        const rearviewContainer = this.children.getByName('rearviewContainer') as Phaser.GameObjects.Container;
        if (rearviewContainer) {
          // Animate sliding down to correct position (y = 0)
          this.tweens.add({
            targets: rearviewContainer,
            y: 0,
            duration: 1800, // 1.8 seconds for slower, more elegant slide
            ease: 'Cubic.easeOut', // Smoother ease-out curve
            delay: 500, // Small delay after car starts
            onComplete: () => {
              // Fade in the virtual pets smoothly when rearview container reaches final position
              this.virtualPets.forEach((pet, index) => {
                const petContainer = pet.getRoot?.();
                if (petContainer) {
                this.tweens.add({
                  targets: petContainer,
                  alpha: 1,
                  duration: 800, // 0.8 seconds fade-in
                  ease: 'Cubic.easeOut',
                  delay: index * 100, // Stagger each pet by 100ms for elegant appearance
                  onComplete: () => {
                    // Fade in pet name label after pet appears
                    const label = this.petLabels[index];
                    const background = (this.petLabels as any)[`bg_${index}`];
                    if (label) {
                      this.tweens.add({
                        targets: [label, background],
                        alpha: 1,
                        duration: 400,
                        ease: 'Cubic.easeOut'
                      });
                    }
                    
                    // Fade in regional UI after the last pet finishes fading in
                    if (index === this.virtualPets.length - 1) {
                      this.gameUI.fadeInRegionalUI();
                    }
                  }
                });
                }
              });
            }
          });
        }
      } else {
        // Tutorial mode: Skipping rearview mirror animation - will be revealed after interrupt
      }
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
    
    // Rotate phone SVG (combine physics rotation with camera angle)
    if (this.phoneSVG && this.frontseatPhone && this.frontseatPhone.gameObject) {
      const physicsRotation = this.frontseatPhone.gameObject.rotation || 0;
      const combinedAngle = physicsRotation + angle;
      this.phoneSVG.setAngle(combinedAngle);
    }
    
    // Rotate green item SVG (combine physics rotation with camera angle)
    if (this.itemSVG && this.backseatItem && this.backseatItem.gameObject) {
      const physicsRotation = this.backseatItem.gameObject.rotation || 0;
      const combinedAngle = physicsRotation + angle;
      this.itemSVG.setAngle(combinedAngle);
    }
    
    // Keep magnetic target and rearview rectangle upright (no rotation)
    // These elements should stay fixed relative to the screen, not rotate with camera
    
    // Keep rearview mirror container fixed (no rotation with camera)
    // The rearview mirror should stay upright and not move with physics
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
    
    // Resume game when ignition menu is closed
    const appScene = this.scene.get('AppScene');
    if (appScene) {
      (appScene as any).isPaused = false;
    }
    
    // Emit game resumed event to resume driving
    this.events.emit('gameResumed');
    console.log('Game resumed after ignition menu closed');
  }

  /**
   * Remove keys from ignition
   */
  public removeKeysFromIgnition() {
    // Remove constraint if present
    if (this.keysConstraint) {
      this.matter.world.removeConstraint(this.keysConstraint);
      this.keysConstraint = null;
    }

    // Reset keys in ignition state
    this.keysInIgnition = false;
    this.gameState.updateState({ keysInIgnition: false });

    // Turn car off regardless of whether a constraint existed
    this.turnOffCar();

    // Fully restore key physics to normal interactive state
    this.restoreKeyPhysics();
    
    // Reset target color
    // Use GameElements config for magnetic target position
    const magneticTargetConfig = gameElements.getMagneticTarget();
    this.magneticTarget.clear();
    this.magneticTarget.lineStyle(3, 0xff0000, 1);
    this.magneticTarget.strokeCircle(magneticTargetConfig.position.x, magneticTargetConfig.position.y, magneticTargetConfig.radius);
    
    // Snap speed crank to 0% when keys are removed
    this.resetCrankToZero();
    
    // Close the turn key menu first
    this.closeCurrentMenu();
    
    // Update tutorial overlay after a small delay to ensure menu is closed (debounced)
    this.scheduleTutorialUpdate(100);
  }

  /**
   * Restore key physics after leaving ignition: re-enable dynamics, reset velocities,
   * restore collision filters/sensor, clamp position into the screen, and ensure gravity.
   */
  private restoreKeyPhysics() {
    const keyGO: any = this.frontseatKeys?.gameObject;
    if (!keyGO || !keyGO.body) return;
    const keyBody: any = keyGO.body;

    // Make dynamic and ensure sensor flag reset
    keyBody.isStatic = false;
    if (typeof keyBody._originalIsSensor === 'boolean') {
      keyBody.isSensor = keyBody._originalIsSensor;
      delete keyBody._originalIsSensor;
    } else {
      keyBody.isSensor = false;
    }

    // Restore original collision filter if stored
    if (keyBody._originalCollisionFilter) {
      keyBody.collisionFilter = keyBody._originalCollisionFilter;
      delete keyBody._originalCollisionFilter;
    } else {
      // Default permissive filter
      keyBody.collisionFilter = { group: 0, category: 0x0001, mask: 0xFFFF };
    }

    // Zero out any residual velocity and angular velocity
    try {
      this.matter.body.setVelocity(keyBody, { x: 0, y: 0 });
      this.matter.body.setAngularVelocity(keyBody, 0);
    } catch {}

    // Clamp position into the visible screen to avoid falling off-screen
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const radius = 15;
    const clampedX = Phaser.Math.Clamp(keyGO.x, radius, w - radius);
    const clampedY = Phaser.Math.Clamp(keyGO.y, radius, h * 0.9 - radius); // above raised floor
    try {
      this.matter.body.setPosition(keyBody, { x: clampedX, y: clampedY });
    } catch {
      keyGO.setPosition(clampedX, clampedY);
    }

    // Ensure it uses world gravity again
    keyGO.setIgnoreGravity?.(false);
    // Ensure scroll factor is horizontal only (like before insertion)
    keyGO.setScrollFactor(1, 0);
  }

  /**
   * Start the game
   */
  public startGame() {
    // Generate initial countdown value with bell curve distribution
    const initialCountdown = this.generateCountdownValue();
    this.gameState.updateState({ gameTime: initialCountdown });
    
    this.gameState.startGame();
    this.gameState.startTutorial(); // Start tutorial sequence
    this.carMechanics.enableTutorialMode(); // Enable tutorial mode
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
      // Use GameElements config for magnetic target position
      const magneticTargetConfig = gameElements.getMagneticTarget();
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(3, 0xff0000, 1);
      this.magneticTarget.strokeCircle(magneticTargetConfig.position.x, magneticTargetConfig.position.y, magneticTargetConfig.radius);
    // Magnetic target activated - keys can now be attracted
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

  /** Resume gameplay after CYOA (Choose Your Own Adventure) menu */
  public resumeAfterCyoa(): void {
    // Resume driving and unpause app if it was paused
    this.carMechanics.resumeDriving();
    const appScene = this.scene.get('AppScene');
    if (appScene) {
      (appScene as any).isPaused = false;
    }
    this.events.emit('gameResumed');
    console.log('GameScene: Resumed after CYOA');
  }

  /**
   * Toggle driving mode
   */
  private toggleDrivingMode() {
    if (this.drivingMode) {
      this.carMechanics.stopDriving();
      this.drivingMode = false;
    } else {
      // Do not allow driving to start unless the car is started (ignition on)
      if (!this.carStarted) {
        console.log('toggleDrivingMode ignored: car is not started');
        return;
      }
      const currentStep = this.gameState.getState().step || 0;
      this.carMechanics.startDriving(currentStep);
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
   * Apply screen shake effect to all cameras except UI/menu cameras
   */
  private applyScreenShake(intensity: number = 10, duration: number = 200) {
    // Get all cameras in the scene
    const cameras = this.cameras.cameras;
    
    cameras.forEach((camera: Phaser.Cameras.Scene2D.Camera) => {
      // Skip UI and menu cameras (they should stay stable)
      const cameraName = (camera as any).name || '';
      if (cameraName.includes('UI') || cameraName.includes('Menu') || cameraName.includes('HUD')) {
        return; // Skip UI/menu cameras
      }
      
      // Apply screen shake to game cameras (duration first, then intensity)
      camera.shake(duration, intensity);
      // Applied screen shake to camera
    });
  }

  /**
   * Apply large bump effect to all matter physics objects (for pothole collisions)
   */
  private applyLargeBumpEffectToAllMatterObjects() {
    const matterWorld = this.matter.world;
    if (!matterWorld) return;
    
    // Get all bodies in the matter world
    const allBodies = matterWorld.getAllBodies();
    
    // Found total bodies in matter world
    
    // Apply large upward bump force to each body (reduced overall strength)
    allBodies.forEach((body: any, index: number) => {
      // Skip static bodies (like anchors) but NOT sensors
      if (body.isStatic) {
        // Skipping static body
        return;
      }
      
      // Check if this is a virtual pet body (they have constraints that resist movement)
      const isVirtualPet = body.label && body.label.includes('Circle Body') && 
                           body.collisionFilter && body.collisionFilter.group === -2;
      
      // Apply much stronger force for pothole collision
      const bumpForce = isVirtualPet ? 
        { x: 0, y: -0.10 } : // Further reduced vertical force for virtual pets
        { x: 0, y: -0.06 }; // Further reduced force for other objects
      
      // Applying bump to body
      
      (this.matter as any).body.applyForce(body, body.position, bumpForce);
      
      // Add minimal random horizontal variation
      const randomX = (Math.random() - 0.5) * (isVirtualPet ? 0.04 : 0.02);
      const randomForce = { x: randomX, y: bumpForce.y };
      (this.matter as any).body.applyForce(body, body.position, randomForce);
      
      // Apply vertical damping specifically to virtual pets to reduce bounce
      if (isVirtualPet) {
        const currentVelocity = (this.matter as any).body.getVelocity(body);
        const dampedVelocity = {
          x: currentVelocity.x,
          y: currentVelocity.y * 0.3 // Stronger vertical damping (70% reduction)
        };
        (this.matter as any).body.setVelocity(body, dampedVelocity);
      }
    });
    
    // Applied LARGE bump effect to matter physics objects (pothole collision)
  }

  /**
   * Apply small bump effect to all matter physics objects (every step)
   */
  private applySmallBumpEffectToAllMatterObjects() {
    const matterWorld = this.matter.world;
    if (!matterWorld) return;
    
    // Get all bodies in the matter world
    const allBodies = matterWorld.getAllBodies();
    
    // Apply very small upward bump force to each body (reduced further)
    allBodies.forEach((body: any, index: number) => {
      // Skip static bodies (like anchors) but NOT sensors
      if (body.isStatic) {
        return;
      }
      
      // Check if this is a virtual pet body (they have constraints that resist movement)
      const isVirtualPet = body.label && body.label.includes('Circle Body') && 
                           body.collisionFilter && body.collisionFilter.group === -2;
      
      // Apply very small force for subtle step-by-step movement
      const bumpForce = isVirtualPet ? 
        { x: 0, y: -0.006 } : // Very small force for virtual pets
        { x: 0, y: -0.002 }; // Tinier force for other objects
      
      (this.matter as any).body.applyForce(body, body.position, bumpForce);
      
      // Add tiny random horizontal variation (reduced)
      const randomX = (Math.random() - 0.5) * (isVirtualPet ? 0.006 : 0.003);
      const randomForce = { x: randomX, y: bumpForce.y };
      (this.matter as any).body.applyForce(body, body.position, randomForce);
      
      // Apply strong vertical damping specifically to virtual pets to minimize movement
      if (isVirtualPet) {
        const currentVelocity = (this.matter as any).body.getVelocity(body);
        const dampedVelocity = {
          x: currentVelocity.x,
          y: currentVelocity.y * 0.05 // Very strong vertical damping (95% reduction)
        };
        (this.matter as any).body.setVelocity(body, dampedVelocity);
      }
    });
  }

  /**
   * Apply bump effect to all matter physics objects
   */
  private applyBumpEffectToAllMatterObjects() {
    const matterWorld = this.matter.world;
    if (!matterWorld) return;
    
    // Get all bodies in the matter world
    const allBodies = matterWorld.getAllBodies();
    
    // Apply upward bump force to each body (reduced)
    allBodies.forEach((body: any, index: number) => {
      // Skip static bodies (like anchors) but NOT sensors
      if (body.isStatic) {
        return;
      }
      
      // Check if this is a virtual pet body (they have constraints that resist movement)
      const isVirtualPet = body.label && body.label.includes('Circle Body') && 
                           body.collisionFilter && body.collisionFilter.group === -2;
      
      // Apply stronger force to virtual pets since they're constrained
      const bumpForce = isVirtualPet ? 
        { x: 0, y: -0.08 } : // Reduced vertical force for virtual pets
        { x: 0, y: -0.02 }; // Reduced force for other objects
      
      (this.matter as any).body.applyForce(body, body.position, bumpForce);
      
      // Add slight random horizontal variation (reduced)
      const randomX = (Math.random() - 0.5) * (isVirtualPet ? 0.04 : 0.01);
      const randomForce = { x: randomX, y: bumpForce.y };
      (this.matter as any).body.applyForce(body, body.position, randomForce);
      
      // Apply vertical damping specifically to virtual pets to reduce bounce
      if (isVirtualPet) {
        const currentVelocity = (this.matter as any).body.getVelocity(body);
        const dampedVelocity = {
          x: currentVelocity.x,
          y: currentVelocity.y * 0.15 // Very strong vertical damping (85% reduction)
        };
        (this.matter as any).body.setVelocity(body, dampedVelocity);
      }
    });
    
    // Applied bump effect to matter physics objects
  }

  /**
   * Handle tutorial sequence steps
   */
  private handleTutorialStep(step: number) {
    const tutorialPhase = this.gameState.getTutorialPhase();
    const tutorialStep = this.gameState.getTutorialStep();
    
    // Tutorial step processing
    
    switch (tutorialPhase) {
      case 'keys_placement':
        // Wait for keys to be placed in ignition
        // Tutorial system will show keys-and-ignition overlay
        break;
        
      case 'initial_driving':
        // Show countdown after 4 steps
        if (tutorialStep >= 4) {
          this.gameState.advanceTutorial();
          this.showTutorialCountdown();
        } else {
          this.gameState.advanceTutorial(); // Increment tutorial step
        }
        break;
        
      case 'countdown':
        // Show interrupt after countdown
        this.gameState.advanceTutorial();
        this.showTutorialInterrupt();
        break;
        
      case 'interrupt':
        // Don't advance tutorial phase here - it will be advanced when interrupt menu closes
        // Just continue with interrupt handling
        break;
        
      default:
        console.warn('Unknown tutorial phase:', tutorialPhase);
    }
  }
  
  /**
   * Show tutorial countdown
   */
  private showTutorialCountdown() {
    // Show countdown UI
  }
  
  /**
   * Show tutorial interrupt (virtual pet care)
   */
  private showTutorialInterrupt() {
    // Show interrupt menu
    const menuScene = this.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showTutorialInterrupt');
      this.scene.bringToTop('MenuScene');
    } else {
      console.error('ERROR: MenuScene not found!');
    }
    
    // Schedule menu to disappear after 2 steps
    this.tutorialInterruptStep = this.gameState.getState().step + 2;
  }
  
  /**
   * Handle tutorial interrupt closed event
   */
  private onTutorialInterruptClosed() {
    console.log('🔍 onTutorialInterruptClosed called');
    // Tutorial interrupt closed - revealing rearview mirror
    
    // Mark tutorial interrupt as completed
    this.tutorialInterruptCompleted = true;
    
    // Advance tutorial phase to normal
    this.gameState.advanceTutorial();
    
    // Ensure car is in driving mode before disabling tutorial mode
    if (!this.carMechanics.isDriving()) {
      const currentStep = this.gameState.getState().step || 0;
      this.carMechanics.startDriving(currentStep);
    }
    
    // Disable tutorial mode so progress can start
    this.carMechanics.disableTutorialMode();
    
    // Wait a moment for menu to fully close, then reveal rearview mirror
    this.time.delayedCall(200, () => {
      console.log('🔍 Delayed call executing - calling revealRearviewMirror');
      this.revealRearviewMirror();
      // Also ensure triangles fade in after rearview mirror is revealed
      this.gameUI.ensureTrianglesFadeIn();
    });
    
    // Clear the interrupt step
    this.tutorialInterruptStep = null;
  }

  /**
   * Reveal rearview mirror with animation
   */
  private revealRearviewMirror() {
    // Reveal rearview mirror by moving it down
    console.log('🔍 revealRearviewMirror called - rearviewRect found:', !!this.rearviewRect);
    if (this.rearviewRect) {
      console.log('🔍 rearviewRect position before animation:', this.rearviewRect.x, this.rearviewRect.y);
      const cam = this.cameras.main;
      const targetY = Math.floor(cam.height * gameElements.getRearviewMirror().position.y);
      
      console.log('🔍 Starting rearview animation - targetY:', targetY, 'currentY:', this.rearviewRect.y);
      console.log('🔍 Camera height:', cam.height, 'Rearview config y:', gameElements.getRearviewMirror().position.y);
      
      // Animate rearview mirror sliding down
      this.tweens.add({
        targets: this.rearviewRect,
        y: targetY,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
          console.log('🔍 Rearview animation completed - final position:', this.rearviewRect?.x, this.rearviewRect?.y);
          // Rearview mirror revealed
          this.rearviewAnimationCompleted = true;
          
          // Fade in the virtual pets smoothly when rearview reaches final position
          this.virtualPets.forEach((pet, index) => {
            const petContainer = pet.getRoot?.();
            if (petContainer) {
              console.log('🔍 Fading in pet', index, 'at position:', petContainer.x, petContainer.y);
              
              console.log('🔍 Pet', index, 'alpha before fade-in:', petContainer.alpha);
              console.log('🔍 Pet', index, 'container properties:', {
                visible: petContainer.visible,
                alpha: petContainer.alpha,
                x: petContainer.x,
                y: petContainer.y,
                depth: petContainer.depth,
                childrenCount: petContainer.list.length
              });
              this.tweens.add({
                targets: petContainer,
                alpha: 1,
                duration: 800, // 0.8 seconds fade-in
                ease: 'Cubic.easeOut',
                delay: index * 100, // Stagger each pet by 100ms for elegant appearance
                onComplete: () => {
                  console.log('🔍 Pet', index, 'fade-in completed, alpha:', petContainer.alpha);
                  
                  // Fade in pet name label after pet appears
                  const label = this.petLabels[index];
                  const background = (this.petLabels as any)[`bg_${index}`];
                  if (label && background) {
                    console.log('🔍 Fading in label for pet', index);
                    
                    this.tweens.add({
                      targets: [label, background],
                      alpha: 1,
                      duration: 400,
                      ease: 'Cubic.easeOut'
                    });
                  }
                  
                  // Fade in regional UI after the last pet finishes fading in
                  if (index === this.virtualPets.length - 1) {
                    console.log('🔍 All pets faded in, fading in regional UI');
                    this.gameUI.fadeInRegionalUI();
                  }
                }
              });
            }
          });
        }
      });
    } else {
      console.error('ERROR: Rearview rectangle not found!');
    }
  }

  /**
   * End tutorial sequence and start normal game
   */
  private endTutorialSequence() {
    console.log('🎓 Ending tutorial sequence - tutorial mode will be disabled when interrupt closes');
    // Don't disable tutorial mode here - it will be disabled when interrupt menu closes
    // TODO: Hide tutorial UI elements
  }

  /**
   * Fade out UI elements when menus are open
   */
  private fadeOutUIElements() {
    console.log('🔍 Fading out UI elements due to open menu');
    
    // Fade out virtual pets
    this.virtualPets.forEach((pet, index) => {
      const petContainer = pet.getRoot?.();
      if (petContainer && petContainer.alpha > 0) {
        this.tweens.add({
          targets: petContainer,
          alpha: 0.3,
          duration: 300,
          ease: 'Cubic.easeIn',
          delay: index * 20
        });
      }
    });
    
    // Fade out pet labels and backgrounds
    this.petLabels.forEach((label, index) => {
      const background = (this.petLabels as any)[`bg_${index}`];
      if (label && label.alpha > 0) {
        this.tweens.add({
          targets: [label, background],
          alpha: 0.3,
          duration: 300,
          ease: 'Cubic.easeIn',
          delay: index * 20
        });
      }
    });
    
    // Fade out regional UI
    this.gameUI.fadeOutRegionalUI();
  }

  /**
   * Fade in UI elements when menus are closed
   */
  private fadeInUIElements() {
    console.log('🔍 Fading in UI elements due to closed menu');
    
    // Only fade in pets if car has started AND tutorial interrupt has been completed AND rearview animation has completed
    if (this.carStarted && this.tutorialInterruptCompleted && this.rearviewAnimationCompleted) {
      // Fade in virtual pets
      this.virtualPets.forEach((pet, index) => {
        const petContainer = pet.getRoot?.();
        if (petContainer && petContainer.alpha < 1) {
          this.tweens.add({
            targets: petContainer,
            alpha: 1,
            duration: 400,
            ease: 'Cubic.easeOut',
            delay: index * 30
          });
        }
      });
      
      // Fade in pet labels and backgrounds
      this.petLabels.forEach((label, index) => {
        const background = (this.petLabels as any)[`bg_${index}`];
        if (label && label.alpha < 1) {
          this.tweens.add({
            targets: [label, background],
            alpha: 1,
            duration: 400,
            ease: 'Cubic.easeOut',
            delay: index * 30
          });
        }
      });
    }
    
    // Fade in regional UI
    this.gameUI.fadeInRegionalUIOnMenuClose();
  }

  /**
   * Update tutorial overlays based on menu state
   */
  public updateAllTutorialOverlays() {
    const menuScene = this.scene.get('MenuScene');
    const hasOpenMenu = !!(menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDialog);
    
    console.log(`🎓 updateAllTutorialOverlays: hasOpenMenu=${hasOpenMenu}`);
    
    if (hasOpenMenu) {
      // Hide tutorial overlay when any menu is open
      console.log(`🎓 Hiding tutorial overlay due to open menu`);
      this.tutorialSystem.hideTutorial();
      
      // Fade out UI elements when menus are open
      // this.fadeOutUIElements(); // Commented out for now
    } else {
      // Show tutorial overlay when no menus are open (if tutorial is active)
      const tutorialState = this.tutorialSystem.getCurrentTutorialState();
      console.log(`🎓 No menu open, tutorial state: ${tutorialState}`);
      if (tutorialState && tutorialState !== 'none') {
        console.log(`🎓 Showing tutorial overlay`);
        this.tutorialSystem.updateTutorialOverlay({
          keysInIgnition: this.keysInIgnition,
          carStarted: this.carStarted,
          hasOpenMenu: false,
          currentMenuType: null,
          steeringUsed: this.steeringUsed,
          inExitCollisionPath: false
        });
      }
      
      // Fade in UI elements when menus are closed
      // this.fadeInUIElements(); // Commented out for now
    }
  }

  /**
   * Event handlers
   */
  private onStepEvent(step: number) {
    this.gameState.updateState({ step });
    
    // Drive tutorial blink text every step (moved here to work in tutorial mode too)
    try {
      this.tutorialSystem.handleStep(step);
    } catch (error) {
      console.error('🎮 GameScene: Error calling handleStep:', error);
    }
    
    // Handle tutorial sequence
    if (this.gameState.isInTutorial()) {
      this.handleTutorialStep(step);
      
      // Update tutorial interrupt countdown if menu is open
      const menuScene = this.scene.get('MenuScene');
      if (menuScene && (menuScene as any).menuManager) {
        (menuScene as any).menuManager.updateTutorialInterruptCountdown();
      }
      
      return;
    }
    
    // Authoritative car-on guard
    const stateAtStep = this.gameState.getState();
    const carOn = !!(stateAtStep.carStarted && this.carStarted);
    
    // Check if there's an active menu that should pause game effects
    const menuScene = this.scene.get('MenuScene');
    const hasActiveMenu = menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDisplayedMenuType;
    const shouldPauseEffects = hasActiveMenu && ['EXIT', 'SHOP', 'STORY_OUTCOME'].includes((menuScene as any).menuManager.currentDisplayedMenuType);
    
    // Update car mechanics speed progression on step events
    if (carOn && this.carMechanics && this.carMechanics.onStepEvent) {
      this.carMechanics.onStepEvent(step);
    }
    
    // Apply small bump effect to all matter physics objects every step
    if (carOn && !shouldPauseEffects) {
      this.applySmallBumpEffectToAllMatterObjects();
    }
    
    // Apply larger bump effect to all matter physics objects every fourth step
    if (step % 4 === 0 && carOn && !shouldPauseEffects) {
      this.applyBumpEffectToAllMatterObjects();
    }
    
    
    // Step-based countdown: only when game and car have both started, and every sixteenth step
    const state = this.gameState.getState();
    if (state.gameStarted && carOn && state.gameTime > 0) {
      this.countdownStepCounter++;
      // Update countdownStepCounter in state every step
      this.gameState.updateState({ countdownStepCounter: this.countdownStepCounter });
      
      // Only decrement countdown every sixteenth step (changed from every eighth)
      if (this.countdownStepCounter >= 16) {
        this.countdownStepCounter = 0; // Reset counter
        const newTime = state.gameTime - 1;
        this.gameState.updateState({ gameTime: newTime, countdownStepCounter: this.countdownStepCounter });
        // Notify systems (e.g., driving scene) that countdown changed
        this.events.emit('countdownChanged', {
          time: newTime,
          keysInIgnition: state.keysInIgnition,
          // Speed crank removed - using automatic speed progression
        });
        
        // Update monthly listeners based on buzz
        this.gameState.updateListenersOnCountdown();
      }
    }

    // Increment progress by speed multiplier per step while driving (scales with speed)
    if (state.gameStarted && carOn && this.carMechanics.isDriving()) {
      // Check if there's an active menu that should pause progress updates
      const menuScene = this.scene.get('MenuScene');
      const hasActiveMenu = menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDisplayedMenuType;
      const shouldPauseProgress = hasActiveMenu && ['EXIT', 'SHOP', 'STORY_OUTCOME'].includes((menuScene as any).menuManager.currentDisplayedMenuType);
      
      let next = this.gameState.getState().progress || 0; // Default to current progress
      
      if (!shouldPauseProgress) {
        const cur = this.gameState.getState().progress || 0;
        const speedMultiplier = this.carMechanics.getSpeedMultiplier();
        const speedPercentage = speedMultiplier * 100; // Convert to percentage for gravity
        
        // Update gravity based on speed percentage
        this.carMechanics.updateGravityBasedOnSpeed(speedPercentage);
        
        const progressIncrement = Math.max(0.3, speedMultiplier * 2); // Minimum 0.3 progress per step, 2x multiplier for faster progress
        next = cur + progressIncrement;
        this.gameState.updateState({ progress: next });
        
        // Debug logging every 10 steps to show speed-progress relationship
        if (state.step && state.step % 10 === 0) {
          const speedPercent = Math.round(speedMultiplier * 100);
          // Speed progress calculation
        }
        
        // Update car mechanics with progress for exit planning
        this.carMechanics.updateProgress(next);
      } else {
        console.log('🎮 Progress update paused due to active menu:', (menuScene as any).menuManager.currentDisplayedMenuType);
      }
      
      if (next >= 100 && !this.stopMenuOpen) {
        this.stopMenuOpen = true;
        const newStops = (this.gameState.getState().stops || 0) + 1;
        
        // Increment shows in current region
        this.gameState.incrementShowsInCurrentRegion();
        
        // Check if player should choose next region (after 3 shows)
        if (this.gameState.shouldChooseNextRegion()) {
          // Show region choice menu instead of destination menu
          const menuScene = this.scene.get('MenuScene');
          if (menuScene) {
            menuScene.events.emit('showRegionChoiceMenu', {
              currentRegion: this.gameState.getCurrentRegion(),
              connectedRegions: REGION_CONFIG.connections[this.gameState.getCurrentRegion() as keyof typeof REGION_CONFIG.connections]
            });
            this.scene.bringToTop('MenuScene');
          }
        } else {
        // Show regular destination menu
        const menuScene = this.scene.get('MenuScene');
        if (menuScene) {
          console.log('Showing destination menu - pausing game');
          menuScene.events.emit('showDestinationMenu', true);
          this.scene.bringToTop('MenuScene');
        }
      }
      
      // Reset progress and countdown with bell curve distribution
      const newCountdownValue = this.generateCountdownValue();
      this.gameState.updateState({ stops: newStops, progress: 0, gameTime: newCountdownValue, countdownStepCounter: 0 });
      this.countdownStepCounter = 0; // Reset countdown step counter
      const appScene = this.scene.get('AppScene');
      if (appScene) {
        console.log('Setting app paused and emitting gamePaused');
        (appScene as any).isPaused = true;
        this.events.emit('gamePaused');
      }
      }
    }

    // Schedule story overlay only after car started AND crank >= 40 AND steering occurred
    const stateNow = this.gameState.getState();
    if (!stateNow.hasOpenMenu && !this.chapter1Shown && this.storyOverlayScheduledStep === null && this.firstSteeringLoggedStep !== null && this.carStarted && this.hasShownCrankTutorial && this.hasClearedCrankTutorial && this.hasShownSteeringTutorial && this.hasClearedSteeringTutorial) {
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
      // Skip/cancel if a higher-level menu is currently open
      const stateCheck = this.gameState.getState();
      if (stateCheck.hasOpenMenu) {
        this.storyOverlayScheduledStep = null;
        return;
      }
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

    // Pothole windows are now shown immediately on collision, no step-based scheduling needed

    // Exit overlay removed - we now have the exit menu that opens immediately
  }

  /**
   * Handle half-step events for UI animations (every 0.5 seconds)
   */
  private onHalfStepEvent(halfStep: number) {
    // Update all registered shapes for animated appearance on half-steps
    if (this.windowShapes) {
      this.windowShapes.onHalfStep(halfStep);
    }
    
    // Update tutorial text flashing on half-steps for faster animation
    if (this.tutorialSystem) {
      this.tutorialSystem.handleHalfStep(halfStep);
    }
  }

  private onGamePaused() {
    console.log('🔄 GameScene: Game paused - calling pauseDriving()');
    this.carMechanics.pauseDriving();
    console.log('🔄 GameScene: Driving paused:', this.carMechanics.isDrivingPaused());
  }

  private onGameResumed() {
    console.log('🔄 GameScene: Game resumed - calling resumeDriving()');
    
    // Check if we need to restart driving for a new segment
    const gameState = this.gameState.getState();
    const isNewSegment = gameState.progress === 0 && gameState.carStarted;
    
    if (isNewSegment) {
      console.log('🔄 Starting new driving segment - calling startDriving()');
      const currentStep = gameState.step || 0;
      this.carMechanics.startDriving(currentStep);
    } else {
      console.log('🔄 Resuming existing driving segment - calling resumeDriving()');
      this.carMechanics.resumeDriving();
    }
    
    this.stopMenuOpen = false;
    console.log('🔄 GameScene: Driving resumed:', !this.carMechanics.isDrivingPaused());
  }

  private onSpeedUpdate(speed: number) {
    // Update the speed display in the UI
    if (this.gameUI && typeof this.gameUI.updateSpeedDisplay === 'function') {
      this.gameUI.updateSpeedDisplay(speed);
    }
  }

  private onSteeringInput(value: number, options?: { isReturnToCenter?: boolean }) {
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
    
    // If car is not started, ignore steering effects and reset gravity target
    if (!this.carStarted) {
      this.gravityXTarget = 0;
      return;
    }
    
    // Apply lateral gravity from steering to affect Matter.js world
    const maxGx = SCENE_TUNABLES.gravity.maxLateralGx; // tune lateral gravity strength
    this.gravityXTarget = -(Phaser.Math.Clamp(value, -150, 150) / 150) * maxGx; // Updated to match new range
    
    // Send steering directly to car mechanics for immediate response
    if (!options?.isReturnToCenter) {
      this.carMechanics.handleSteering(value);
    }
  }

  private onStoryCompleted(storyData: { storyline: string; outcome: string; choices: string[] }) {
    console.log(`📖 Story completed: ${storyData.storyline} with outcome: ${storyData.outcome}`);
    
    // Check if there are still narrative windows in the queue OR an active window before resuming
    const queuedCount = this.windowShapes.getQueuedNarrativeCount();
    const hasActiveWindow = this.windowShapes.hasActiveNarrativeWindow();
    
    if (queuedCount > 0 || hasActiveWindow) {
      console.log(`📖 Story completed but ${queuedCount} narrative windows in queue and active window: ${hasActiveWindow} - waiting for all to clear`);
      // Set up a listener to resume when everything is clear
      this.setupStoryQueueCompletionListener();
      return;
    }
    
    // Check if there's a pending destination menu to show
    if (this.carMechanics.hasPendingDestinationMenu()) {
      console.log(`📖 Story completed, now showing pending destination menu`);
      this.carMechanics.showPendingDestinationMenu();
    } else {
      // Resume driving after story completion
      this.resumeAfterCyoa();
    }
  }
  
  private setupStoryQueueCompletionListener(): void {
    // Check queue and active window every 100ms until everything is clear
    const checkQueue = () => {
      const queuedCount = this.windowShapes.getQueuedNarrativeCount();
      const hasActiveWindow = this.windowShapes.hasActiveNarrativeWindow();
      
      if (queuedCount === 0 && !hasActiveWindow) {
        console.log(`📖 Narrative queue and active window are now clear - resuming story completion`);
        // Queue is empty and no active window, now proceed with normal story completion
        if (this.carMechanics.hasPendingDestinationMenu()) {
          console.log(`📖 Story completed, now showing pending destination menu`);
          this.carMechanics.showPendingDestinationMenu();
        } else {
          this.resumeAfterCyoa();
        }
      } else {
        // Still have windows in queue or active window, check again in 100ms
        console.log(`📖 Still waiting: ${queuedCount} queued, active window: ${hasActiveWindow}`);
        this.time.delayedCall(100, checkQueue);
      }
    };
    
    // Start checking after a short delay
    this.time.delayedCall(100, checkQueue);
  }

  // Speed crank input handler removed - using automatic speed progression

  /**
   * Check if player is positioned to collide with any exit on screen
   */
  public isPlayerInExitCollisionPath(): boolean {
    // Only log every 30 calls to reduce spam
    if (!this.exitDetectionLogCounter) this.exitDetectionLogCounter = 0;
    this.exitDetectionLogCounter++;
    
    if (!this.carMechanics) {
      return false;
    }
    
    // Get all obstacles that are exits
    const obstacles = (this.carMechanics as any).obstacles || [];
    
    const exits = obstacles.filter((obstacle: any) => {
      const isExit = obstacle.getData('isExit');
      const isPreview = obstacle.getData('isExitPreview');
      return isExit && !isPreview;
    });
    
    if (exits.length === 0) {
      return false;
    }
    
    // Check if any exit is close enough to the car's position
    const carBounds = (this.carMechanics as any).drivingCar?.getBounds();
    if (!carBounds) {
      return false;
    }
    
    // Check if car is approaching any exit from the right
    const inPath = exits.some((exit: any) => {
      const visual = exit.getData('visual');
      if (!visual) {
        return false;
      }
      
      const exitBounds = visual.getBounds();
      
      // Check if exit is on screen vertically (below horizon)
      const exitOnScreenVertically = exitBounds.bottom > this.cameras.main.height * 0.3; // Assuming horizon at 30%
      
      // Check if exit has moved below the car (car is above the exit)
      const carBottom = carBounds.bottom;
      const exitTop = exitBounds.top;
      const exitBelowCar = exitTop > carBottom;
      
      // Check if car is in the rightmost area based on internal car position
      // Use internal carX position for collision detection since visual car is always centered
      const carX = (this.carMechanics as any).carX; // Internal car position
      const screenWidth = this.cameras.main.width;
      const rightmostThreshold = screenWidth * 0.8; // Car needs to be in rightmost 20% of screen
      
      const carInRightmostArea = carX >= rightmostThreshold;
      
      // Position detection logging removed to reduce console spam
      
      // Also check if car is horizontally aligned with the exit
      // Use internal car position for alignment since visual car is always centered
      const carWidth = carBounds.width;
      const carLeftEdge = carX - (carWidth / 2); // Calculate left edge from internal position
      const carRightEdge = carX + (carWidth / 2); // Calculate right edge from internal position
      const exitLeftEdge = exitBounds.left;
      const exitRightEdge = exitBounds.right;
      
      // Car is aligned if there's any horizontal overlap with the exit
      const horizontallyAligned = carLeftEdge < exitRightEdge && carRightEdge > exitLeftEdge;
      
      
      // Exit warning should only show if exit is on screen, car is in rightmost lane, AND horizontally aligned
      return exitOnScreenVertically && carInRightmostArea && horizontallyAligned;
    });
    
    // Only log when we actually find exits and are in collision path
    if (exits.length > 0 && inPath) {
      // Exit collision path detected
    }
    return inPath;
  }

  destroy() {
    // Clean up physics safety timer
    if (this.physicsSafetyTimer) {
      this.physicsSafetyTimer.destroy();
      this.physicsSafetyTimer = undefined;
    }
    
    // Clean up all systems
    this.carMechanics.destroy();
    this.tutorialSystem.destroy();
    this.gameUI.destroy();
    this.inputHandlers.destroy();
    
    // Remove event listeners
    this.events.off('step', this.onStepEvent, this);
    this.events.off('halfStep', this.onHalfStepEvent, this);
    this.events.off('gamePaused', this.onGamePaused, this);
    this.events.off('gameResumed', this.onGameResumed, this);
    this.events.off('turnKey', this.onTurnKey, this);
    this.events.off('removeKeys', this.onRemoveKeys, this);
    this.events.off('ignitionMenuShown', this.onIgnitionMenuShown, this);
    this.events.off('ignitionMenuHidden', this.onIgnitionMenuHidden, this);
    this.events.off('speedUpdate', this.onSpeedUpdate, this);
    this.events.off('steeringInput', this.onSteeringInput, this);
    // Speed crank event removed - using automatic speed progression
  }

  /**
   * Turn the car off: flip flags, stop driving, zero gravity target
   */
  private turnOffCar() {
    if (!this.carStarted) return;
    console.log('Turning off car - carStarted was:', this.carStarted);
    this.carStarted = false;
    this.gameState.updateState({ carStarted: false });
    try { 
      this.carMechanics.stopDriving(); 
    } catch (e) {
      console.log('Error calling stopDriving:', e);
    }
    this.gravityXTarget = 0;
    console.log('Car turned off - carStarted is now:', this.carStarted);
  }

  /**
   * DEBUG: Create a random window shape for testing
   */
  private createDebugWindow() {
    // Clear previous debug windows
    this.debugWindows.forEach(window => window.destroy());
    this.debugWindows = [];

    // Create a new random window shape
    const newWindow = this.windowShapes.createRandomTestWindow();
    this.debugWindows.push(newWindow);

    // Set high depth so it appears on top
    newWindow.setDepth(2000);

    // Auto-remove after 3 seconds
    this.time.delayedCall(3000, () => {
      if (newWindow && !newWindow.scene) return; // Already destroyed
      newWindow.destroy();
      const index = this.debugWindows.indexOf(newWindow);
      if (index > -1) {
        this.debugWindows.splice(index, 1);
      }
    });

    console.log('Debug window created! Press R again to generate a new one.');
  }

  /**
   * Create a debug speech bubble using H menu styling for consistency
   */
  private createDebugSpeechBubble() {
    // Clear previous debug windows
    this.debugWindows.forEach(window => window.destroy());
    this.debugWindows = [];

    // The story system now uses showNovelStory through StoryManager
    // No need for duplicate showStoryOverlay call here
    console.log('✨ Story overlay system delegated to StoryManager');
  }

  /**
   * Create a debug story dialog window for testing 'H' key
   */
  private createDebugStoryDialog() {
    // Clear previous debug windows
    this.debugWindows.forEach(window => window.destroy());
    this.debugWindows = [];

    // Create a new story dialog composition
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Story dialogs: match START menu dimensions (85% width, 90% height)
    const width = Math.floor(gameWidth * 0.85);   // 85% of game width
    const height = Math.floor(gameHeight * 0.90);  // 90% of game height
    const x = Math.floor((gameWidth - width) / 2);   // Center horizontally
    const y = Math.floor((gameHeight - height) / 2); // Center vertically
    
    const newWindow = this.windowShapes.createStoryDialogComposition(x, y, width, height);
    
    // Only proceed if window was created (not queued)
    if (newWindow) {
      this.debugWindows.push(newWindow);

      // Set high depth so it appears on top
      newWindow.setDepth(2000);

      // Auto-remove after 10 seconds (longer for story dialogs)
      this.time.delayedCall(10000, () => {
        if (newWindow && !newWindow.scene) return; // Already destroyed
        newWindow.destroy();
        const index = this.debugWindows.indexOf(newWindow);
        if (index > -1) {
          this.debugWindows.splice(index, 1);
        }
      });

      console.log('Debug story dialog created! Click to advance the story, or press H again to generate a new one.');
    } else {
      console.log('Story dialog was queued because another narrative window is active.');
    }
  }
  
  /**
   * Create a story dialog that respects the queue system
   */
  private createStoryDialogWithQueue() {
    // Calculate story dialog dimensions
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Story dialogs use 95% width and 80% height, centered
    const width = Math.floor(gameWidth * 0.95);   // 95% of game width
    const height = Math.floor(gameHeight * 0.80);  // 80% of game height
    const x = Math.floor((gameWidth - width) / 2);   // Center horizontally
    const y = Math.floor((gameHeight - height) / 2); // Center vertically
    
    // Use the queue-aware method from WindowShapes
    const newWindow = this.windowShapes.createStoryDialogComposition(x, y, width, height);
    
    if (newWindow) {
      // Set very high depth so it appears above all other UI elements
      newWindow.setDepth(120000);  // Above pets (70001+), items (60001), and physics objects (60000)
      console.log('Story dialog created and displayed immediately');
    } else {
      console.log('Story dialog queued (another dialog is active)');
      console.log(`Queue length: ${this.windowShapes.getQueuedNarrativeCount()}`);
    }
  }

  /**
   * Create a CYOA (Choose Your Own Adventure) dialog with H menu styling
   * This demonstrates the new abstraction system that preserves H menu aesthetics
   */
  private createCYOADialog() {
    // Calculate dialog dimensions (same as story dialog)
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    const width = Math.floor(gameWidth * 0.95);
    const height = Math.floor(gameHeight * 0.80);
    const x = Math.floor((gameWidth - width) / 2);
    const y = Math.floor((gameHeight - height) / 2);
    
    // Sample CYOA content
    const storyTexts = [
      "You stand before an ancient crossroads...",
      "Three paths stretch out before you, each shrouded in mystery.",
      "Which path will you choose?"
    ];
    
    const choices = [
      {
        text: "Left Path",
        callback: () => {
          console.log("Player chose the Left Path - leads to the forest!");
          // Could trigger different story branches here
        }
      },
      {
        text: "Center Path", 
        callback: () => {
          console.log("Player chose the Center Path - leads to the mountain!");
        }
      },
      {
        text: "Right Path",
        callback: () => {
          console.log("Player chose the Right Path - leads to the sea!");
        }
      }
    ];
    
    // Create CYOA dialog using H menu styling
    const cyoaWindow = this.windowShapes.createCYOADialog(x, y, width, height, storyTexts, choices);
    
    if (cyoaWindow) {
      cyoaWindow.setDepth(5000);
      console.log('✅ CYOA dialog created with H menu styling');
    } else {
      console.log('CYOA dialog was queued (another narrative is active)');
    }
  }

  /**
   * Debug method to trigger the next scheduled exit menu
   */
  private triggerNextExitMenu() {
    console.log('🚪 Debug: Triggering next exit menu for testing');
    
    // Pause driving like a normal exit collision would
    if (this.carMechanics) {
      console.log('🚪 Debug: Pausing driving for exit menu test');
      this.carMechanics.pauseDriving();
    }
    
    // Get the MenuScene to emit the showObstacleMenu event
    const menuScene = this.scene.get('MenuScene');
    if (menuScene) {
      // Use a default shop count and exit number for testing
      const shopCount = 3;
      const exitNumber = 1; // Default to exit 1 for testing
      
      console.log(`🚪 Debug: Emitting showObstacleMenu event with shopCount=${shopCount}, exitNumber=${exitNumber}`);
      (menuScene as any).events.emit('showObstacleMenu', 'exit', shopCount, exitNumber);
      this.scene.bringToTop('MenuScene');
    } else {
      console.warn('🚪 Debug: MenuScene not found - cannot trigger exit menu');
    }
  }
}
