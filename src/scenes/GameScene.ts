import Phaser from 'phaser';
import { KeySystem } from '../systems/KeySystem';
import { OverlaySystem } from '../systems/OverlaySystem';
import { NavigationUI } from '../systems/NavigationUI';
import { MenuBridge } from '../systems/MenuBridge';
import { SaveLoadBridge } from '../systems/SaveLoadBridge';
import { DrivingSystem } from '../systems/DrivingSystem';
import { ConfigLoader, GameConfig } from '../config/ConfigLoader';
import { SaveManager } from '../utils/SaveManager';

// Base interface for physics objects
interface PhysicsObject {
  gameObject: Phaser.GameObjects.Arc;
  setupDragInteraction(): void;
}

// Trash data type for frontseat
class Trash implements PhysicsObject {
  public gameObject!: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;
  private config: any;

  constructor(scene: Phaser.Scene, config: any) {
    this.scene = scene;
    this.config = config;
    this.createGameObject();
    this.setupPhysics();
    this.setupDragInteraction();
  }

  private createGameObject() {
    this.gameObject = this.scene.add.circle(
      this.config.x,
      this.config.y,
      this.config.radius,
      parseInt(this.config.color.replace('0x', ''), 16)
    );
  }

  private setupPhysics() {
    this.scene.matter.add.gameObject(this.gameObject, {
      shape: 'circle',
      restitution: this.config.restitution,
      friction: this.config.friction,
      density: this.config.density
    });
  }

  public setupDragInteraction() {
    // Make the circle interactive
    this.gameObject.setInteractive();
    
    // Store original color for reference
    const originalColor = parseInt(this.config.color.replace('0x', ''), 16);
    const hoverColor = parseInt(this.config.hoverColor.replace('0x', ''), 16);
    const dragColor = parseInt(this.config.dragColor.replace('0x', ''), 16);
    
    // Hover effects
    this.gameObject.on('pointerover', () => {
      this.gameObject.setFillStyle(hoverColor);
    });
    
    this.gameObject.on('pointerout', () => {
      this.gameObject.setFillStyle(originalColor);
    });
    
    // Drag functionality - manual implementation with global tracking
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    
    this.gameObject.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('Trash pointerdown - starting manual drag');
      isDragging = true;
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      this.gameObject.setFillStyle(dragColor);
      (this.scene as any).isDraggingObject = true;
      
      // Disable physics during drag
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = true;
      }
    });
    
    // Use global pointer move instead of object-specific
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      
      // Calculate velocity for momentum
      velocityX = pointer.x - lastPointerX;
      velocityY = pointer.y - lastPointerY;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      
      // Convert screen coordinates to container-relative coordinates for Trash
      const containerX = (this.scene as any).frontseatPhysicsContainer.x;
      const relativeX = pointer.x - containerX;
      this.gameObject.x = relativeX;
      this.gameObject.y = pointer.y;
    });
    
    // Use global pointer up instead of object-specific
    this.scene.input.on('pointerup', () => {
      if (!isDragging) return;
      
      console.log('Trash pointerup - ending manual drag with momentum');
      isDragging = false;
      this.gameObject.setFillStyle(originalColor);
      (this.scene as any).isDraggingObject = false;
      
      // Re-enable physics and apply momentum
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = false;
        // Apply velocity as momentum
        this.scene.matter.body.setVelocity(this.gameObject.body as any, { x: velocityX * this.config.gameState.velocityMultiplier, y: velocityY * this.config.gameState.velocityMultiplier });
      }
    });
  }
}

// Item data type for backseat
class Item implements PhysicsObject {
  public gameObject!: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;
  private config: any;

  constructor(scene: Phaser.Scene, config: any) {
    this.scene = scene;
    this.config = config;
    this.createGameObject();
    this.setupPhysics();
    this.setupDragInteraction();
  }

  private createGameObject() {
    this.gameObject = this.scene.add.circle(
      this.config.x,
      this.config.y,
      this.config.radius,
      parseInt(this.config.color.replace('0x', ''), 16)
    );
  }

  private setupPhysics() {
    this.scene.matter.add.gameObject(this.gameObject, {
      shape: 'circle',
      restitution: this.config.restitution,
      friction: this.config.friction,
      density: this.config.density
    });
  }

  public setupDragInteraction() {
    // Make the circle interactive
    this.gameObject.setInteractive();
    
    // Store original color for reference
    const originalColor = parseInt(this.config.color.replace('0x', ''), 16);
    const hoverColor = parseInt(this.config.hoverColor.replace('0x', ''), 16);
    const dragColor = parseInt(this.config.dragColor.replace('0x', ''), 16);
    
    // Hover effects
    this.gameObject.on('pointerover', () => {
      this.gameObject.setFillStyle(hoverColor);
    });
    
    this.gameObject.on('pointerout', () => {
      this.gameObject.setFillStyle(originalColor);
    });
    
    // Drag functionality - manual implementation with global tracking
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    
    this.gameObject.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('Item pointerdown - starting manual drag');
      isDragging = true;
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      this.gameObject.setFillStyle(dragColor);
      (this.scene as any).isDraggingObject = true;
      
      // Disable physics during drag
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = true;
      }
    });
    
    // Use global pointer move instead of object-specific
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      
      // Calculate velocity for momentum
      velocityX = pointer.x - lastPointerX;
      velocityY = pointer.y - lastPointerY;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      
      // Convert screen coordinates to container-relative coordinates for Item
      const containerX = (this.scene as any).backseatPhysicsContainer.x;
      const relativeX = pointer.x - containerX;
      this.gameObject.x = relativeX;
      this.gameObject.y = pointer.y;
    });
    
    // Use global pointer up instead of object-specific
    this.scene.input.on('pointerup', () => {
      if (!isDragging) return;
      
      console.log('Item pointerup - ending manual drag with momentum');
      isDragging = false;
      this.gameObject.setFillStyle(originalColor);
      (this.scene as any).isDraggingObject = false;
      
      // Re-enable physics and apply momentum
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = false;
        // Apply velocity as momentum
        this.scene.matter.body.setVelocity(this.gameObject.body as any, { x: velocityX * this.config.gameState.velocityMultiplier, y: velocityY * this.config.gameState.velocityMultiplier });
      }
    });
  }
}

// Keys data type for frontseat
class Keys implements PhysicsObject {
  public gameObject!: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;
  private config: any;

  constructor(scene: Phaser.Scene, config: any) {
    this.scene = scene;
    this.config = config;
    this.createGameObject();
    this.setupPhysics();
    this.setupDragInteraction();
  }

  private createGameObject() {
    this.gameObject = this.scene.add.circle(
      this.config.x,
      this.config.y,
      this.config.radius,
      parseInt(this.config.color.replace('0x', ''), 16)
    );
  }

  private setupPhysics() {
    this.scene.matter.add.gameObject(this.gameObject, {
      shape: 'circle',
      restitution: this.config.restitution,
      friction: this.config.friction,
      density: this.config.density
    });
  }

  public setupDragInteraction() {
    // Make the circle interactive
    this.gameObject.setInteractive();
    
    // Store original color for reference
    const originalColor = parseInt(this.config.color.replace('0x', ''), 16);
    const hoverColor = parseInt(this.config.hoverColor.replace('0x', ''), 16);
    const dragColor = parseInt(this.config.dragColor.replace('0x', ''), 16);
    
    // Hover effects
    this.gameObject.on('pointerover', () => {
      this.gameObject.setFillStyle(hoverColor);
    });
    
    this.gameObject.on('pointerout', () => {
      this.gameObject.setFillStyle(originalColor);
    });
    
    // Drag functionality - manual implementation with global tracking
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let velocityX = 0;
    let velocityY = 0;
    
    this.gameObject.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('Keys pointerdown - starting manual drag');
      isDragging = true;
      (this.gameObject as any).isDragging = true; // Set flag on game object
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      this.gameObject.setFillStyle(dragColor);
      (this.scene as any).isDraggingObject = true;
      
      // Break constraint if Keys is snapped to magnetic target
      if ((this.scene as any).keysConstraint) {
        console.log('Breaking constraint - Keys being dragged away');
        
        // Use consolidated key removal logic (this will handle constraint removal)
        (this.scene as any).handleKeyRemoval('drag away');
        
        // Reset magnetic target color
        if ((this.scene as any).magneticTarget) {
          const magneticConfig = (this.scene as any).config.physics.magneticTarget;
          (this.scene as any).magneticTarget.clear();
          (this.scene as any).magneticTarget.lineStyle(3, parseInt(magneticConfig.color.replace('0x', ''), 16), 1);
          (this.scene as any).magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
        }
        
        // Reset Keys scroll factor to horizontal only
        this.gameObject.setScrollFactor(1, 0);
        
        // Update tutorial overlay visibility
        (this.scene as any).updateTutorialOverlay();
      }
      
      // Disable physics during drag
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = true;
      }
    });
    
    // Use global pointer move instead of object-specific
    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      
      // Calculate velocity for momentum
      velocityX = pointer.x - lastPointerX;
      velocityY = pointer.y - lastPointerY;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      
      // Convert screen coordinates to container-relative coordinates for Keys
      const containerX = (this.scene as any).frontseatPhysicsContainer.x;
      const relativeX = pointer.x - containerX;
      this.gameObject.x = relativeX;
      this.gameObject.y = pointer.y;
    });
    
    // Use global pointer up instead of object-specific
    this.scene.input.on('pointerup', () => {
      if (!isDragging) return;
      
      console.log('Keys pointerup - ending manual drag with momentum');
      isDragging = false;
      (this.gameObject as any).isDragging = false; // Clear flag on game object
      this.gameObject.setFillStyle(originalColor);
      (this.scene as any).isDraggingObject = false;
      
      // Re-enable physics and apply momentum
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = false;
        // Apply velocity as momentum
        this.scene.matter.body.setVelocity(this.gameObject.body as any, { x: velocityX * this.config.gameState.velocityMultiplier, y: velocityY * this.config.gameState.velocityMultiplier });
      }
    });
  }
}

export class GameScene extends Phaser.Scene {
  // Configuration
  private config!: GameConfig
  
  // Save system
  private saveManager!: SaveManager;
  private saveMenuShown: boolean = false;
  private saveMenuElements: any = null;
  
  // Game state
   private currentPosition: string = 'frontseat'; // 'frontseat' or 'backseat'
   private currentView: string = 'main'; // 'main' or 'overlay'
   private gameTime: number = 99; // Starting time - will be updated in create()
   private gameStarted: boolean = false; // Track if game has started
   private cameraDebugText!: Phaser.GameObjects.Text;
   private gameContentContainer!: Phaser.GameObjects.Container;
   private countdownText!: Phaser.GameObjects.Text;
   private stopsText!: Phaser.GameObjects.Text;
   private progressText!: Phaser.GameObjects.Text;
   private positionText!: Phaser.GameObjects.Text;
     private moneyText!: Phaser.GameObjects.Text;
  private healthText!: Phaser.GameObjects.Text;
  private playerSkillText!: Phaser.GameObjects.Text;
  private difficultyText!: Phaser.GameObjects.Text;
  private momentumText!: Phaser.GameObjects.Text;
  private plotAText!: Phaser.GameObjects.Text;
  private plotBText!: Phaser.GameObjects.Text;
  private plotCText!: Phaser.GameObjects.Text;
   private stops: number = 0;
   private progress: number = 0;
   private position: number = 50; // Position from 0-100%, starts at center (50%) - will be updated in create()
     private money: number = 108; // Starting money: $108 - will be updated in create()
  private health: number = 10; // Car health: 1-10, starts at max (10) - will be updated in create()
  private playerSkill: number = 0; // Player skill percentage: 0-100% - will be updated in create()
  private difficulty: number = 0; // Difficulty percentage: 0-100% - will be updated in create()
  private momentum: number = 0; // Momentum percentage: 0-100% - will be updated in create()
  private plotA: number = 0; // Plot A percentage: 0-100% - will be updated in create()
  private plotB: number = 0; // Plot B percentage: 0-100% - will be updated in create()
  private plotC: number = 0; // Plot C percentage: 0-100% - will be updated in create()
  private plotAEnum: string = 'intro'; // Plot A enumeration
  private plotBEnum: string = 'intro'; // Plot B enumeration
  private plotCEnum: string = 'intro'; // Plot C enumeration
   private knobValue: number = 0; // Reactive knob value (-100 to 100), starts at neutral (0) - will be updated in create()
     private frontseatPhysicsContainer!: Phaser.GameObjects.Container;
  private backseatPhysicsContainer!: Phaser.GameObjects.Container;
  private frontseatDebugBorder!: Phaser.GameObjects.Graphics;
  private backseatDebugBorder!: Phaser.GameObjects.Graphics;
  
  // Physics object data types
  private frontseatTrash!: Trash;
  private backseatItem!: Item;
  private frontseatKeys!: Keys;
  private magneticTarget!: Phaser.GameObjects.Graphics;
  private keysConstraint!: MatterJS.Constraint | null; // Constraint for snapping Keys to target
  private keysRemovalCooldown: number = 0; // Cooldown to prevent immediate re-snapping after removal - will be updated in create()
  private carStarted: boolean = false; // Track if car has been started
  private countdownStarted: boolean = false; // Track if countdown has ever started
  private ignitionMenuShown: boolean = false; // Track if ignition menu has ever been shown
  private tutorialOverlay!: Phaser.GameObjects.Container; // Tutorial overlay with masking
  private tutorialMaskGraphics!: Phaser.GameObjects.Graphics; // Reference to mask graphics for updates
  private backseatButton!: Phaser.GameObjects.Graphics; // Reference to backseat button
  private frontseatButton!: Phaser.GameObjects.Graphics; // Reference to frontseat button
  private mapToggleButton!: Phaser.GameObjects.Graphics; // Reference to map toggle button
  private inventoryToggleButton!: Phaser.GameObjects.Graphics; // Reference to inventory toggle button
  private mapToggleText!: Phaser.GameObjects.Text; // Reference to map toggle text
  private inventoryToggleText!: Phaser.GameObjects.Text; // Reference to inventory toggle text
  private speedCrankTrack!: Phaser.GameObjects.Graphics; // Reference to speed crank track
  private speedCrankHandle!: Phaser.GameObjects.Graphics; // Reference to speed crank handle
  private speedCrankValueIndicator!: Phaser.GameObjects.Graphics; // Reference to speed crank value indicator
  private speedCrankArea!: Phaser.GameObjects.Rectangle; // Reference to speed crank interaction area
  private speedCrankPercentageText!: Phaser.GameObjects.Text; // Reference to speed crank percentage text
  private updateSpeedCrank!: () => void; // Function to update speed crank display
  private resetSpeedCrank!: () => void; // Function to reset speed crank to 0
  private currentSpeedCrankPercentage: number = 0; // Current speed crank percentage (0-100)
  private speedDisplayText!: Phaser.GameObjects.Text; // Debug display for current car speed
  private crankTutorialOverlay!: Phaser.GameObjects.Container; // Overlay container for speed crank highlighting
  private crankTutorialMaskGraphics!: Phaser.GameObjects.Graphics; // Mask graphics for crank cutout
  private ignitionTutorialOverlay!: Phaser.GameObjects.Container; // Overlay container for ignition menu highlighting
  private ignitionTutorialMaskGraphics!: Phaser.GameObjects.Graphics; // Mask graphics for ignition menu cutout
  private speedCrankCooldown: number = 0; // Cooldown timer for speed crank interaction
   private frontseatDragDial!: any; // RexUI drag dial
     private drivingMode: boolean = false; // Track if driving mode is active
  private shouldAutoRestartDriving: boolean = false; // Track if driving should restart on resume
  private drivingPaused: boolean = false; // Track if driving is paused (for collision menus)
  private obstacleSpawnerActive: boolean = false; // Track if obstacle spawner is already running
  // Systems
  private keySystem!: KeySystem;
  private overlaySystem!: OverlaySystem;
  private navigationUI!: NavigationUI;
  private menuBridge!: MenuBridge;
  private saveLoadBridge!: SaveLoadBridge;
  private drivingSystem!: DrivingSystem;
   private isKnobActive: boolean = false; // Track if knob is being interacted with
  private isDraggingObject: boolean = false; // Track if dragging a physics object
   private knobReturnTimer!: Phaser.Time.TimerEvent | null; // Timer for gradual return to center
   private currentSteeringValue: number = 0; // Current steering value for driving mode
   private drivingCar!: Phaser.GameObjects.Rectangle;
   private drivingRoad!: Phaser.GameObjects.Rectangle;
   private drivingRoadLines: Phaser.GameObjects.Rectangle[] = [];
   private carSpeed: number = 0;
   private carX: number = 0;
   private drivingBackground!: Phaser.GameObjects.Container;
     private forwardMovementTimer!: Phaser.Time.TimerEvent | null;
  private neutralReturnTimer!: Phaser.Time.TimerEvent | null;
  private gameOverDialogShown: boolean = false; // Track if game over dialog is already shown
  
  // Obstacle system
  private obstacles: Phaser.GameObjects.Rectangle[] = [];
  private obstacleTypes = {
    POTHOLE: 'pothole',
    EXIT: 'exit'
  };
  private collisionTimer: Phaser.Time.TimerEvent | null = null;
  private pendingCollisionType: string | null = null;
  private shouldAutoResumeAfterCollision: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  async create() {
    // Initialize systems
    this.keySystem = new KeySystem(this);
    this.overlaySystem = new OverlaySystem(this);
    this.navigationUI = new NavigationUI(this);
    this.menuBridge = new MenuBridge(this);
    this.saveLoadBridge = new SaveLoadBridge(this);
    this.drivingSystem = new DrivingSystem(this);
    
    // DrivingScene is no longer used - driving visualization is in GameScene
    
    // Load configuration from cache (loaded by PreloadScene)
    const configLoader = ConfigLoader.getInstance();
    this.config = configLoader.getConfigFromCache(this);
    
    // Initialize save manager
    this.saveManager = SaveManager.getInstance();
    
    // Initialize game state with config values
    this.gameTime = this.config.gameTime.initial;
    this.position = this.config.playerStats.initialPosition;
    this.money = this.config.playerStats.initialMoney;
    this.health = this.config.playerStats.initialHealth;
    this.playerSkill = this.config.playerStats.initialSkill;
    this.difficulty = this.config.playerStats.initialDifficulty;
    this.momentum = this.config.playerStats.initialMomentum;
    this.plotA = this.config.playerStats.initialPlotA;
    this.plotB = this.config.playerStats.initialPlotB;
    this.plotC = this.config.playerStats.initialPlotC;
    this.knobValue = this.config.gameState.initialKnobValue;
    this.keysRemovalCooldown = this.config.gameState.keysRemovalCooldown;
    
    // DrivingScene communication removed - everything is in GameScene now
    
    // Add game overlay text (always visible on top)
    const gameLayerConfig = this.config.ui.gameLayer;
    const gameText = this.add.text(gameLayerConfig.position.x, gameLayerConfig.position.y, gameLayerConfig.text, {
      fontSize: gameLayerConfig.fontSize,
      color: gameLayerConfig.color,
      fontStyle: 'bold',
      backgroundColor: gameLayerConfig.backgroundColor,
      padding: { x: gameLayerConfig.padding.x, y: gameLayerConfig.padding.y }
    });
    gameText.setScrollFactor(0);
    gameText.setDepth(gameLayerConfig.depth);

    // Set up shared camera system for game scenes AFTER launching them
    this.setupSharedGameCamera();
    
    // Set up physics worlds
    this.setupPhysicsWorlds();
    
    this.currentPosition = 'frontseat';
    this.currentView = 'main';
    
    // Initialize constraint as null
    this.keysConstraint = null;

    // Set up keyboard controls for navigation (only when game is started)
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!this.gameStarted) return; // Disable controls until game starts
      
      switch (event.code) {
        case 'ArrowRight':
          this.switchToBackseat();
          break;
        case 'ArrowLeft':
          this.switchToFrontseat();
          break;
        case 'ArrowDown':
          this.showOverlay();
          break;
        case 'ArrowUp':
          this.hideOverlay();
          break;
        case 'KeyD':
          this.toggleDebugBorders();
          break;
        case 'KeyF':
          this.showSaveMenu();
          break;
      }
    });

    // Listen for step events from AppScene
    this.events.on('step', this.onStepEvent, this);
    
    // Listen for pause/resume events from AppScene
    this.events.on('gamePaused', this.onGamePaused, this);
    this.events.on('gameResumed', this.onGameResumed, this);
    
    // Listen for turn key menu events
    this.events.on('turnKey', this.onTurnKey, this);
    this.events.on('removeKeys', this.onRemoveKeys, this);
    this.events.on('ignitionMenuShown', () => this.overlaySystem.onIgnitionMenuShown(), this);
    this.events.on('ignitionMenuHidden', () => this.overlaySystem.onIgnitionMenuHidden(), this);

    // Set up automatic pause when window loses focus
    this.setupAutoPause();

    // Set up swipe controls for camera movement
    this.setupSwipeControls();
    
    // Setup keyboard controls for driving
    this.setupKeyboardControls();
  }

     update() {
     // Update camera debug text to show container position
     if (this.cameraDebugText && this.gameContentContainer) {
       this.cameraDebugText.setText(`Container: X=${Math.round(this.gameContentContainer.x)}, Y=${Math.round(this.gameContentContainer.y)}`);
     }
     
    // Check physics object boundaries periodically
    this.checkPhysicsObjectBoundaries();
    
    // Apply magnetic attraction between Keys and magnetic target
    this.applyMagneticAttraction();
    
    // Update tutorial overlay visibility
    this.updateTutorialOverlay();
    
    // Update tutorial mask to follow keys movement
    if (this.tutorialOverlay && this.tutorialOverlay.visible && this.frontseatKeys?.gameObject) {
      console.log('Calling updateTutorialMask');
      this.updateTutorialMask();
    }
    
    // Frame-by-frame updates
    this.updatePosition();
    
    // Update speed crank cooldown
    if (this.speedCrankCooldown > 0) {
      this.speedCrankCooldown -= this.config.visual.timing.cooldownFrameTime; // Using config timing
      if (this.speedCrankCooldown <= 0) {
        this.speedCrankCooldown = 0;
        console.log('Speed crank cooldown ended');
      }
    }
   }

  private checkPhysicsObjectBoundaries() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const bufferZone = this.config.visual.physics.bufferZone; // Buffer zone before teleporting
    
    // Check frontseat Trash object
    if (this.frontseatTrash && this.frontseatTrash.gameObject && this.frontseatTrash.gameObject.body) {
      const trashX = this.frontseatTrash.gameObject.x;
      const trashY = this.frontseatTrash.gameObject.y;
      
      // Only teleport if trash is significantly outside frontseat bounds (with buffer)
      if (trashX < -bufferZone || trashX > gameWidth + bufferZone || 
          trashY < -bufferZone || trashY > gameHeight + bufferZone) {
        console.log(`Trash significantly escaped frontseat bounds at (${trashX}, ${trashY}), teleporting back`);
        
        // Teleport back to center of frontseat area using config bounds
        const teleportBounds = this.config.visual.physics.teleportBounds;
        const newX = Math.max(teleportBounds.min, Math.min(gameWidth - teleportBounds.max, trashX));
        const newY = Math.max(teleportBounds.min, Math.min(gameHeight - teleportBounds.max, trashY));
        
        this.frontseatTrash.gameObject.x = newX;
        this.frontseatTrash.gameObject.y = newY;
        
        // Update physics body position
        this.matter.body.setPosition(this.frontseatTrash.gameObject.body as any, { x: newX, y: newY });
        
        // Stop any velocity to prevent immediate re-escape
        this.matter.body.setVelocity(this.frontseatTrash.gameObject.body as any, { x: 0, y: 0 });
      }
    }
    
    // Check frontseat Keys object
    if (this.frontseatKeys && this.frontseatKeys.gameObject && this.frontseatKeys.gameObject.body) {
      const keysX = this.frontseatKeys.gameObject.x;
      const keysY = this.frontseatKeys.gameObject.y;
      
      // If keys is outside frontseat bounds (0 to gameWidth), teleport it back
      if (keysX < -bufferZone || keysX > gameWidth + bufferZone || 
          keysY < -bufferZone || keysY > gameHeight + bufferZone) {
        console.log(`Keys significantly escaped frontseat bounds at (${keysX}, ${keysY}), teleporting back`);
        
        // Teleport back to center of frontseat area using config bounds
        const teleportBounds = this.config.visual.physics.teleportBounds;
        const newX = Math.max(teleportBounds.min, Math.min(gameWidth - teleportBounds.max, keysX));
        const newY = Math.max(teleportBounds.min, Math.min(gameHeight - teleportBounds.max, keysY));
        
        this.frontseatKeys.gameObject.x = newX;
        this.frontseatKeys.gameObject.y = newY;
        
        // Update physics body position
        this.matter.body.setPosition(this.frontseatKeys.gameObject.body as any, { x: newX, y: newY });
        
        // Stop any velocity to prevent immediate re-escape
        this.matter.body.setVelocity(this.frontseatKeys.gameObject.body as any, { x: 0, y: 0 });
      }
    }
    
    // Check backseat Item object
    if (this.backseatItem && this.backseatItem.gameObject && this.backseatItem.gameObject.body) {
      const itemX = this.backseatItem.gameObject.x;
      const itemY = this.backseatItem.gameObject.y;
      
      // Only teleport if item is significantly outside backseat bounds (with buffer)
      if (itemX < gameWidth - bufferZone || itemX > gameWidth * 2 + bufferZone || 
          itemY < -bufferZone || itemY > gameHeight + bufferZone) {
        console.log(`Item significantly escaped backseat bounds at (${itemX}, ${itemY}), teleporting back`);
        
        // Teleport back to center of backseat area using config bounds
        const teleportBounds = this.config.visual.physics.teleportBounds;
        const newX = Math.max(gameWidth + teleportBounds.min, Math.min(gameWidth * 2 - teleportBounds.max, itemX));
        const newY = Math.max(teleportBounds.min, Math.min(gameHeight - teleportBounds.max, itemY));
        
        this.backseatItem.gameObject.x = newX;
        this.backseatItem.gameObject.y = newY;
        
        // Update physics body position
        this.matter.body.setPosition(this.backseatItem.gameObject.body as any, { x: newX, y: newY });
        
        // Stop any velocity to prevent immediate re-escape
        this.matter.body.setVelocity(this.backseatItem.gameObject.body as any, { x: 0, y: 0 });
      }
     }
   }

     private setupSharedGameCamera() {
     // Set up world bounds to accommodate both scenes side by side
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Set camera bounds to match world bounds
     this.cameras.main.setBounds(0, 0, gameWidth * 2, gameHeight);
     this.cameras.main.setScroll(0, 0);
     
     // Create all content in this scene
     this.createGameContent();
    
    // Initialize navigation button visibility (hidden until car starts)
    this.navigationUI.updateVisibility();
     
     console.log('Game camera set up with content container');
   }

     private createGameContent() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Create a container to hold all game content that we can move as one unit
     this.gameContentContainer = this.add.container(0, 0);
     
     // Create navigation buttons
     this.createNavigationButtons(gameWidth, gameHeight);
     
     // Get center positions for other elements
     const frontseatCenterX = gameWidth / 2;
     const frontseatCenterY = gameHeight / 2;
     const backseatCenterX = gameWidth + (gameWidth / 2);
     const backseatCenterY = gameHeight / 2;
     
     
           // Create overlay content
      // Map overlay (left side, positioned below frontseat)
      const mapOverlay = this.add.text(frontseatCenterX, frontseatCenterY + 320, 'MAP OVERLAY', {
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
             // Map toggle button (small button at top of map overlay)
       const mapToggleButton = this.add.graphics();
      this.mapToggleButton = mapToggleButton; // Store reference
       mapToggleButton.fillStyle(parseInt(this.config.gameScene.ui.mapToggleButton.fillColor.replace('0x', ''), 16), this.config.gameScene.ui.mapToggleButton.fillAlpha);
       mapToggleButton.fillRect(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40);
       mapToggleButton.lineStyle(this.config.gameScene.ui.mapToggleButton.strokeWidth, parseInt(this.config.gameScene.ui.mapToggleButton.strokeColor.replace('0x', ''), 16), this.config.gameScene.ui.mapToggleButton.strokeAlpha);
       mapToggleButton.strokeRect(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40);
       mapToggleButton.setInteractive(new Phaser.Geom.Rectangle(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40), Phaser.Geom.Rectangle.Contains);
       mapToggleButton.on('pointerdown', () => {
         if (this.gameStarted) {
           // Don't allow overlay if keys are not in ignition
           if (!this.keysConstraint) {
             console.log('Cannot access overlay - keys not in ignition!');
             return;
           }
           if (this.currentView === 'main') {
             this.showOverlay();
           } else {
             this.hideOverlay();
           }
         }
       });
       
       // Map toggle button text
       const mapToggleText = this.add.text(frontseatCenterX, frontseatCenterY + 220, 'LOOK DOWN', {
         fontSize: '14px',
         color: '#ffffff',
         fontStyle: 'bold'
       }).setOrigin(0.5);
      this.mapToggleText = mapToggleText; // Store reference
       mapToggleText.setName('mapToggleText');
      
      // Inventory overlay (right side, positioned below backseat)
      const inventoryOverlay = this.add.text(backseatCenterX, backseatCenterY + 320, 'INVENTORY OVERLAY', {
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
             // Inventory toggle button (small button at top of inventory overlay)
       const inventoryToggleButton = this.add.graphics();
      this.inventoryToggleButton = inventoryToggleButton; // Store reference
       inventoryToggleButton.fillStyle(parseInt(this.config.gameScene.ui.inventoryToggleButton.fillColor.replace('0x', ''), 16), this.config.gameScene.ui.inventoryToggleButton.fillAlpha);
       inventoryToggleButton.fillRect(backseatCenterX - 60, backseatCenterY + 200, 120, 40);
       inventoryToggleButton.lineStyle(this.config.gameScene.ui.inventoryToggleButton.strokeWidth, parseInt(this.config.gameScene.ui.inventoryToggleButton.strokeColor.replace('0x', ''), 16), this.config.gameScene.ui.inventoryToggleButton.strokeAlpha);
       inventoryToggleButton.strokeRect(backseatCenterX - 60, backseatCenterY + 200, 120, 40);
       inventoryToggleButton.setInteractive(new Phaser.Geom.Rectangle(backseatCenterX - 60, backseatCenterY + 200, 120, 40), Phaser.Geom.Rectangle.Contains);
       inventoryToggleButton.on('pointerdown', () => {
         if (this.gameStarted) {
           // Don't allow overlay if keys are not in ignition
           if (!this.keysConstraint) {
             console.log('Cannot access overlay - keys not in ignition!');
             return;
           }
           if (this.currentView === 'main') {
             this.showOverlay();
           } else {
             this.hideOverlay();
           }
         }
       });
       
       // Inventory toggle button text
       const inventoryToggleText = this.add.text(backseatCenterX, backseatCenterY + 220, 'LOOK DOWN', {
         fontSize: '14px',
         color: '#ffffff',
         fontStyle: 'bold'
       }).setOrigin(0.5);
      this.inventoryToggleText = inventoryToggleText; // Store reference
       inventoryToggleText.setName('inventoryToggleText');
      
      // Add all content to the container
      this.gameContentContainer.add([mapOverlay, mapToggleButton, mapToggleText, inventoryOverlay, inventoryToggleButton, inventoryToggleText]);
      
           // Create countdown timer text
     this.createCountdownTimer();
     
     // Create stops and progress text
     this.createStopsAndProgressText();
     
    // Create drag dial in front seat area
    this.createFrontseatDragDial();
    
    // Create driving background (always visible behind game content)
    // Create driving background (at very low depth to be behind UI)
    this.createDrivingBackground();
    
    // Create tutorial overlay (transparent black with masked areas to guide player)
    this.createTutorialOverlay();
    
    // Create crank tutorial overlay (for speed crank highlighting)
    this.createCrankTutorialOverlay();
    
    // Create ignition tutorial overlay (for ignition menu highlighting)
    this.createIgnitionTutorialOverlay();
   }

   // Event-based communication removed - now using direct method calls

  private createCountdownTimer() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Position countdown text using config
    const countdownConfig = this.config.ui.countdown;
    const countdownX = gameWidth / 2 + (gameWidth * countdownConfig.positionOffset.x);
    const countdownY = (gameHeight * countdownConfig.positionOffset.y);
    
    this.countdownText = this.add.text(countdownX, countdownY, this.gameTime.toString(), {
      fontSize: countdownConfig.fontSize,
      color: countdownConfig.color,
      fontStyle: 'bold',
      backgroundColor: countdownConfig.backgroundColor,
      padding: { x: countdownConfig.padding.x, y: countdownConfig.padding.y }
    }).setOrigin(0.5);
    
    // Make countdown text an overlay that doesn't move with camera
    this.countdownText.setScrollFactor(0);
    this.countdownText.setDepth(countdownConfig.depth);
  }

   private createFrontseatDragDial() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Position the drag dial in the front seat area
     const dialX = gameWidth / 2;
     const dialY = gameHeight * 0.6; // Position it below the countdown timer
     
     // Create a simple custom knob using graphics
     const knobRadius = 60;
     const knob = this.add.graphics();
     
     // Draw the knob
     knob.fillStyle(parseInt(this.config.gameScene.ui.knob.fillColor.replace('0x', ''), 16));
     knob.fillCircle(0, 0, knobRadius);
     knob.lineStyle(this.config.gameScene.ui.knob.strokeWidth, parseInt(this.config.gameScene.ui.knob.strokeColor.replace('0x', ''), 16), this.config.gameScene.ui.knob.strokeAlpha);
     knob.strokeCircle(0, 0, knobRadius);
     
     // Add a pointer to show the value
     knob.fillStyle(parseInt(this.config.gameScene.ui.knob.activeFillColor.replace('0x', ''), 16));
     knob.fillRect(-3, -knobRadius + 10, 6, 20);
     
     knob.setPosition(dialX, dialY);
     knob.setInteractive(new Phaser.Geom.Circle(0, 0, knobRadius), Phaser.Geom.Circle.Contains);
     
     // Store reference to the knob
     this.frontseatDragDial = knob;
     
     // Add drag functionality
     knob.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
       this.isKnobActive = true;
       this.stopKnobReturnTimer();
       console.log('Knob interaction started - swipe disabled');
     });
     
     knob.on('pointerup', () => {
       this.isKnobActive = false;
       this.startKnobReturnTimer();
       console.log('Knob interaction ended - swipe enabled');
     });
     
     knob.on('pointerout', () => {
       // Reset knob when mouse leaves the knob area
       this.isKnobActive = false;
       this.startKnobReturnTimer();
       console.log('Knob interaction ended (pointer out) - swipe enabled');
     });
     
     knob.on('pointermove', (pointer: Phaser.Input.Pointer) => {
       if (!this.isKnobActive) return;
       
       // Calculate angle from center to pointer
       const dx = pointer.x - dialX;
       const dy = pointer.y - dialY;
       const angle = Math.atan2(dy, dx);
       
       // Convert angle to knob value (-100 to 100)
       // Right = 0°, Up = 90°, Left = 180°, Down = 270°
       let knobValue = (angle * 180 / Math.PI) + 90; // Adjust so right is 0
       if (knobValue > 180) knobValue -= 360; // Wrap around
       
             // Map to configured range
      const maxAngle = this.config.driving.knob.maxAngle;
      this.knobValue = (knobValue / 180) * 100;
      this.knobValue = Phaser.Math.Clamp(this.knobValue, -maxAngle, maxAngle);
       
       // Update knob visual
       this.updateKnobVisual();
       
       // Send steering input to driving system
       this.handleSteeringInput(this.knobValue);
     });
     
     // Add the knob to the game content container so it moves with the content
     this.gameContentContainer.add(knob);
     knob.setDepth(1000); // Ensure it's on top
     
     // Don't disable initially - we'll control it through event handlers
     
     console.log('Front seat steering wheel created at position:', dialX, dialY);
     
     // Create the speed crank to the right of the steering wheel
     this.createSpeedCrank(dialX, dialY, gameWidth, gameHeight);
   }

   private createSpeedCrank(dialX: number, dialY: number, gameWidth: number, gameHeight: number) {
     // Position the speed crank to the right of the steering wheel
     const crankX = dialX + 120; // Offset to the right
     const crankY = dialY;
     const crankWidth = 40;
     const crankHeight = 200;
     
     // Create crank track (background) - styled like RexUI
     const crankTrack = this.add.graphics();
     crankTrack.fillStyle(0x333333, 0.8);
     crankTrack.fillRoundedRect(crankX - crankWidth/2, crankY - crankHeight/2, crankWidth, crankHeight, 5);
     crankTrack.lineStyle(2, 0xffffff, 1);
     crankTrack.strokeRoundedRect(crankX - crankWidth/2, crankY - crankHeight/2, crankWidth, crankHeight, 5);
     
     // Create crank handle - styled like RexUI with visible value indicator
     const handleWidth = crankWidth - 4;
     const handleHeight = 20;
     const crankHandle = this.add.graphics();
     
     // Create visible value indicator on the handle
     const valueIndicator = this.add.graphics();
     
     // Function to redraw handle at current position
     const redrawHandle = (y: number) => {
       crankHandle.clear();
       crankHandle.fillStyle(0x00ff00, 0.9);
       crankHandle.fillRoundedRect(crankX - handleWidth/2, y - handleHeight/2, handleWidth, handleHeight, 3);
       crankHandle.lineStyle(1, 0xffffff, 1);
       crankHandle.strokeRoundedRect(crankX - handleWidth/2, y - handleHeight/2, handleWidth, handleHeight, 3);
       
       valueIndicator.clear();
       valueIndicator.fillStyle(0xffffff, 1);
       valueIndicator.fillCircle(crankX, y, 3);
       valueIndicator.lineStyle(1, 0x000000, 1);
       valueIndicator.strokeCircle(crankX, y, 3);
     };
     
     // Create percentage text
     this.speedCrankPercentageText = this.add.text(crankX + crankWidth/2 + 10, crankY, '50%', {
       fontSize: '16px',
       color: '#ffffff',
       fontStyle: 'bold'
     }).setOrigin(0, 0.5);
     
     // Add to game content container
     this.gameContentContainer.add([crankTrack, crankHandle, valueIndicator, this.speedCrankPercentageText]);
     crankTrack.setDepth(1000);
     crankHandle.setDepth(1001);
     valueIndicator.setDepth(1002);
     this.speedCrankPercentageText.setDepth(1003);
     
     // Make crank interactive
     const crankArea = this.add.rectangle(crankX, crankY, crankWidth, crankHeight, 0x000000, 0);
     crankArea.setInteractive();
     this.gameContentContainer.add(crankArea);
     crankArea.setDepth(1004);
     
     // Store references for later use
     this.speedCrankTrack = crankTrack;
     this.speedCrankHandle = crankHandle;
     this.speedCrankValueIndicator = valueIndicator;
     this.speedCrankArea = crankArea;
     
     // Add interaction logic with snapping
     let isDragging = false;
     let currentProgress = 0; // Start at 0 (bottom)
     
     // Define snap positions: 0%, 40%, 70%, 100%
     const snapPositions = [0, 0.4, 0.7, 1.0];
     
     // Function to find closest snap position
     const findClosestSnap = (progress: number) => {
       let closest = snapPositions[0];
       let minDistance = Math.abs(progress - closest);
       
       for (let i = 1; i < snapPositions.length; i++) {
         const distance = Math.abs(progress - snapPositions[i]);
         if (distance < minDistance) {
           minDistance = distance;
           closest = snapPositions[i];
         }
       }
       
       return closest;
     };
     
    const updateCrank = () => {
      const handleY = crankY - crankHeight/2 + (currentProgress * crankHeight);
      redrawHandle(handleY);
      
      // Update percentage text and store current percentage
      const percentage = Math.round(currentProgress * 100);
      this.speedCrankPercentageText.setText(`${percentage}%`);
      this.currentSpeedCrankPercentage = percentage; // Store for driving system
      console.log('Speed crank value:', percentage);
      
      // Update crank tutorial overlay visibility
      this.updateCrankTutorialOverlay();
      
      // Update navigation button visibility based on crank position
      this.updateNavigationButtonVisibility();
    };
     
     crankArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
       // Only allow interaction if car is started
       if (!this.carStarted) {
         console.log('Speed crank disabled - car not started');
         return;
       }
       
       // Check cooldown
       if (this.speedCrankCooldown > 0) {
         console.log('Speed crank on cooldown:', this.speedCrankCooldown);
         return;
       }
       
       console.log('Speed crank pointer down - car started:', this.carStarted);
       isDragging = true;
       const localY = pointer.y - (crankY - crankHeight/2);
       currentProgress = Phaser.Math.Clamp(localY / crankHeight, 0, 1);
       updateCrank();
     });
     
     this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
       if (!isDragging || !this.carStarted) return;
       
       const localY = pointer.y - (crankY - crankHeight/2);
       currentProgress = Phaser.Math.Clamp(localY / crankHeight, 0, 1);
       updateCrank();
     });
     
     this.input.on('pointerup', () => {
       if (isDragging) {
         // Snap to closest position when releasing
         currentProgress = findClosestSnap(currentProgress);
         updateCrank();
         console.log('Snapped to:', Math.round(currentProgress * 100) + '%');
         
         // Start cooldown after snapping
         this.speedCrankCooldown = 600; // 0.6 seconds in milliseconds
         console.log('Speed crank cooldown started:', this.speedCrankCooldown);
       }
       isDragging = false;
     });
     
     // Store the update function for external use
     this.updateSpeedCrank = () => {
       updateCrank();
     };
     
     // Store the reset function for external use
     this.resetSpeedCrank = () => {
       currentProgress = 0;
       this.currentSpeedCrankPercentage = 0; // Reset stored percentage
       updateCrank();
     };
     
     // Initialize crank position
     updateCrank();
     
     console.log('Speed crank created at position:', crankX, crankY);
   }

   // Method to get current speed crank percentage
   private getSpeedCrankPercentage(): number {
     // This will be set by the speed crank interaction logic
     //console.log('Getting speed crank percentage:', this.currentSpeedCrankPercentage);
     return this.currentSpeedCrankPercentage || 0;
   }

   private createStopsAndProgressText() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Position stops text using config
     const stopsConfig = this.config.ui.stops;
     const stopsX = gameWidth / 2 + (gameWidth * stopsConfig.positionOffset.x);
     const stopsY = gameHeight * stopsConfig.positionOffset.y;
     
     this.stopsText = this.add.text(stopsX, stopsY, stopsConfig.text.replace('{value}', '0'), {
       fontSize: stopsConfig.fontSize,
       color: stopsConfig.color,
       fontStyle: 'bold',
       backgroundColor: stopsConfig.backgroundColor,
       padding: { x: stopsConfig.padding.x, y: stopsConfig.padding.y }
     }).setOrigin(0.5);
     
     // Position progress text using config
     const progressConfig = this.config.ui.progress;
     const progressX = gameWidth / 2 + (gameWidth * progressConfig.positionOffset.x);
     const progressY = gameHeight * progressConfig.positionOffset.y;
     
     this.progressText = this.add.text(progressX, progressY, progressConfig.text.replace('{value}', '0'), {
       fontSize: progressConfig.fontSize,
       color: progressConfig.color,
       fontStyle: 'bold',
       backgroundColor: progressConfig.backgroundColor,
       padding: { x: progressConfig.padding.x, y: progressConfig.padding.y }
     }).setOrigin(0.5);
     
     // Position text using config
     const positionConfig = this.config.ui.position;
     const positionX = gameWidth / 2 + (gameWidth * positionConfig.positionOffset.x);
     const positionY = gameHeight * positionConfig.positionOffset.y;
     
     this.positionText = this.add.text(positionX, positionY, positionConfig.text.replace('{value}', '50'), {
       fontSize: positionConfig.fontSize,
       color: positionConfig.color,
       fontStyle: 'bold',
       backgroundColor: positionConfig.backgroundColor,
       padding: { x: positionConfig.padding.x, y: positionConfig.padding.y }
     }).setOrigin(0.5);
     
     // Create speed display text using config
     const speedConfig = this.config.ui.speed;
     const speedX = gameWidth / 2 + (gameWidth * speedConfig.positionOffset.x);
     const speedY = gameHeight * speedConfig.positionOffset.y;
     
     this.speedDisplayText = this.add.text(speedX, speedY, speedConfig.text.replace('{value}', '0'), {
       fontSize: speedConfig.fontSize,
       color: speedConfig.color,
       fontStyle: 'bold',
       backgroundColor: speedConfig.backgroundColor,
       padding: { x: speedConfig.padding.x, y: speedConfig.padding.y }
     }).setOrigin(0.5);
     
     // Add all texts to the container so they move with the content
     this.gameContentContainer.add([this.stopsText, this.progressText, this.positionText, this.speedDisplayText]);
     
     // Set depth to ensure they're on top
     this.stopsText.setDepth(1000);
     this.progressText.setDepth(1000);
     this.positionText.setDepth(1000);
     this.speedDisplayText.setDepth(1000);
     
         // Create player values text in bottom left (visible to player)
    this.createMoneyAndHealthText();
    
    // Create manager values text in top right (hidden/internal values for game management)
    this.createManagerValuesText();
   }

   private createMoneyAndHealthText() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Position money text using config
     const moneyConfig = this.config.ui.money;
     const moneyX = typeof moneyConfig.position.x === 'number' ? moneyConfig.position.x : gameWidth * moneyConfig.position.x;
     const moneyY = typeof moneyConfig.position.y === 'number' ? moneyConfig.position.y : gameHeight * moneyConfig.position.y;
     
     this.moneyText = this.add.text(moneyX, moneyY, moneyConfig.text.replace('{value}', this.money.toString()), {
       fontSize: moneyConfig.fontSize,
       color: moneyConfig.color,
       fontStyle: 'bold',
       backgroundColor: moneyConfig.backgroundColor,
       padding: { x: moneyConfig.padding.x, y: moneyConfig.padding.y }
     }).setOrigin(0, 0.5);
     
     // Position health text using config
     const healthConfig = this.config.ui.health;
     const healthX = typeof healthConfig.position.x === 'number' ? healthConfig.position.x : gameWidth * healthConfig.position.x;
     const healthY = typeof healthConfig.position.y === 'number' ? healthConfig.position.y : gameHeight * healthConfig.position.y;
     
     this.healthText = this.add.text(healthX, healthY, healthConfig.text.replace('{value}', (this.health * 10).toString()), {
       fontSize: healthConfig.fontSize,
       color: healthConfig.color,
       fontStyle: 'bold',
       backgroundColor: healthConfig.backgroundColor,
       padding: { x: healthConfig.padding.x, y: healthConfig.padding.y }
     }).setOrigin(0, 0.5);
     
     // Make money and health texts overlays that don't move with camera
     this.moneyText.setScrollFactor(0);
     this.healthText.setScrollFactor(0);
     
         // Set high depth to ensure they're always on top
    this.moneyText.setDepth(10000);
    this.healthText.setDepth(10000);
  }

  private createManagerValuesText() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Manager values are internal game state values used for game logic
    // These include: Skill, Difficulty, Momentum, Plot A/B/C
    // They are displayed with smaller font and half opacity to indicate they're "hidden"
    // Player values (Money, Health, Countdown) are displayed prominently for the player
    
    // Position manager values text in top right corner
    const statsX = gameWidth - 20;
    const statsY = 60;
    
    // Player Skill text
    this.playerSkillText = this.add.text(statsX, statsY, `Skill: ${this.playerSkill}%`, {
      fontSize: this.config.ui.managerValues.fontSize,
      color: this.config.ui.managerValues.colors.skill,
      fontStyle: 'bold',
      backgroundColor: this.config.ui.managerValues.backgroundColor,
      padding: this.config.ui.managerValues.padding
    }).setOrigin(1, 0);
    
    // Difficulty text (below skill)
    this.difficultyText = this.add.text(statsX, statsY + 25, `Difficulty: ${this.difficulty}%`, {
      fontSize: this.config.ui.managerValues.fontSize,
      color: this.config.ui.managerValues.colors.difficulty,
      fontStyle: 'bold',
      backgroundColor: this.config.ui.managerValues.backgroundColor,
      padding: this.config.ui.managerValues.padding
    }).setOrigin(1, 0);
    
    // Momentum text (below difficulty)
    this.momentumText = this.add.text(statsX, statsY + 50, `Momentum: ${this.momentum}%`, {
      fontSize: this.config.ui.managerValues.fontSize,
      color: this.config.ui.managerValues.colors.momentum,
      fontStyle: 'bold',
      backgroundColor: this.config.ui.managerValues.backgroundColor,
      padding: this.config.ui.managerValues.padding
    }).setOrigin(1, 0);
    
    // Plot A text (below momentum)
    this.plotAText = this.add.text(statsX, statsY + 75, `Plot A (${this.plotAEnum}): ${this.plotA}%`, {
      fontSize: this.config.ui.managerValues.fontSize,
      color: this.config.ui.managerValues.colors.plotA,
      fontStyle: 'bold',
      backgroundColor: this.config.ui.managerValues.backgroundColor,
      padding: this.config.ui.managerValues.padding
    }).setOrigin(1, 0);
    
    // Plot B text (below plot A)
    this.plotBText = this.add.text(statsX, statsY + 100, `Plot B (${this.plotBEnum}): ${this.plotB}%`, {
      fontSize: this.config.ui.managerValues.fontSize,
      color: this.config.ui.managerValues.colors.plotB,
      fontStyle: 'bold',
      backgroundColor: this.config.ui.managerValues.backgroundColor,
      padding: this.config.ui.managerValues.padding
    }).setOrigin(1, 0);
    
    // Plot C text (below plot B)
    this.plotCText = this.add.text(statsX, statsY + 125, `Plot C (${this.plotCEnum}): ${this.plotC}%`, {
      fontSize: this.config.ui.managerValues.fontSize,
      color: this.config.ui.managerValues.colors.plotC,
      fontStyle: 'bold',
      backgroundColor: this.config.ui.managerValues.backgroundColor,
      padding: this.config.ui.managerValues.padding
    }).setOrigin(1, 0);
    
    // Make manager values texts overlays that don't move with camera
    this.playerSkillText.setScrollFactor(0);
    this.difficultyText.setScrollFactor(0);
    this.momentumText.setScrollFactor(0);
    this.plotAText.setScrollFactor(0);
    this.plotBText.setScrollFactor(0);
    this.plotCText.setScrollFactor(0);
    
    // Set high depth to ensure they're always on top
    this.playerSkillText.setDepth(10000);
    this.difficultyText.setDepth(10000);
    this.momentumText.setDepth(10000);
    this.plotAText.setDepth(10000);
    this.plotBText.setDepth(10000);
    this.plotCText.setDepth(10000);
    
    // Set half opacity for manager values
    this.playerSkillText.setAlpha(this.config.ui.managerValues.opacity);
    this.difficultyText.setAlpha(this.config.ui.managerValues.opacity);
    this.momentumText.setAlpha(this.config.ui.managerValues.opacity);
    this.plotAText.setAlpha(this.config.ui.managerValues.opacity);
    this.plotBText.setAlpha(this.config.ui.managerValues.opacity);
    this.plotCText.setAlpha(this.config.ui.managerValues.opacity);
  }

  private createMagneticTarget() {
    const magneticConfig = this.config.physics.magneticTarget;
    
    // Create the magnetic target circle (outline only)
    this.magneticTarget = this.add.graphics();
    this.magneticTarget.lineStyle(3, parseInt(magneticConfig.color.replace('0x', ''), 16), 1);
    this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
    
    // Create a separate invisible Matter.js body for collision detection
    const magneticBody = this.matter.add.circle(magneticConfig.x, magneticConfig.y, magneticConfig.radius, {
      isStatic: true,
      isSensor: true,  // No collision - Keys can pass through
      render: { visible: false } // Invisible body
    });
    
    // Store reference to the body for collision detection
    (this.magneticTarget as any).magneticBody = magneticBody;
    
    // Don't add to physics container - manage position manually for proper depth
    // Set scroll factor to move with camera (both horizontally and vertically)
    this.magneticTarget.setScrollFactor(1, 1);
    
    // Set depth to be visible but not interfere with UI, behind Keys
    this.magneticTarget.setDepth(999);
    
    // Add to game content container so it moves with camera
    this.gameContentContainer.add(this.magneticTarget);
    
    console.log('Magnetic target created at position:', magneticConfig.x, magneticConfig.y);
  }

   private handleSteeringInput(steeringValue: number) {
     // Convert steering wheel value (-100 to 100) to steering direction
     // Negative values = turn left, positive values = turn right
     const normalizedValue = steeringValue / 100; // Convert to -1 to 1 range
     
     console.log('Steering input:', normalizedValue, 'carStarted:', this.carStarted, 'drivingMode:', this.drivingMode);
     
     // Only process steering if car is started and in driving mode
     if (this.drivingMode && this.carStarted) {
       // Handle steering input directly in GameScene
       this.handleDrivingSteeringInput(steeringValue);
       return;
     }
     
     // If car is not started or not in driving mode, ignore steering input
     console.log('Steering input ignored - car not started or not in driving mode');
     this.resetSteeringValue('car not started or not in driving mode');
     return;
   }

     private setupPhysicsWorlds() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Ensure Matter.js is properly initialized
    if (!this.matter || !this.matter.world) {
      console.error('Matter.js physics system not initialized');
      return;
    }
    
    // Create frontseat physics container (left side)
    this.frontseatPhysicsContainer = this.add.container(0, 0);
    
    // Create backseat physics container (right side)
    this.backseatPhysicsContainer = this.add.container(gameWidth, 0);
    
    // Set physics containers to not move vertically with camera (only horizontally)
    // This ensures they stay fixed vertically but can move horizontally when switching seats
    this.frontseatPhysicsContainer.setScrollFactor(1, 0); // x=1 (normal horizontal scroll), y=0 (no vertical scroll)
    this.backseatPhysicsContainer.setScrollFactor(1, 0); // x=1 (normal horizontal scroll), y=0 (no vertical scroll)
    
    // Set up the main Matter.js world bounds to accommodate both containers
    this.matter.world.setBounds(0, 0, gameWidth * 2, gameHeight);
    
    // Set gravity from config
    this.matter.world.setGravity(this.config.physics.gravity.x, this.config.physics.gravity.y);
    
    // Create invisible walls for natural bouncing
    this.createInvisibleWalls();
    
    // Add a test physics body to demonstrate the physics worlds
    this.addTestPhysicsBodies();
    
    // Add Trash object to frontseat physics world
    this.addFrontseatTrash();
    
    // Add Item object to backseat physics world
    this.addBackseatItem();
    
    // Add Keys object to frontseat physics world
    this.addFrontseatKeys();
    
    // Create debug borders for physics worlds
    this.createDebugBorders();
    
    // Create magnetic target (after physics containers are created)
    this.createMagneticTarget();
    
    console.log('Physics containers created - Frontseat:', this.frontseatPhysicsContainer, 'Backseat:', this.backseatPhysicsContainer);
  }

  private createInvisibleWalls() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Create invisible walls for natural bouncing
    // Left wall (left edge of screen)
    this.matter.add.rectangle(-10, gameHeight / 2, 20, gameHeight, {
      isStatic: true,
      render: { visible: false }
    });
    
    // Right wall (right edge of screen)
    this.matter.add.rectangle(gameWidth * 2 + 10, gameHeight / 2, 20, gameHeight, {
      isStatic: true,
      render: { visible: false }
    });
    
    // Center wall (separates frontseat and backseat)
    this.matter.add.rectangle(gameWidth, gameHeight / 2, 20, gameHeight, {
      isStatic: true,
      render: { visible: false }
    });
    
    // Top wall (top edge of screen)
    this.matter.add.rectangle(gameWidth, -10, gameWidth * 2, 20, {
      isStatic: true,
      render: { visible: false }
    });
    
    // Bottom wall (bottom edge of screen)
    this.matter.add.rectangle(gameWidth, gameHeight + 10, gameWidth * 2, 20, {
      isStatic: true,
      render: { visible: false }
    });
    
    console.log('Invisible walls created for natural bouncing');
  }

   private addTestPhysicsBodies() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Ensure Matter.js is properly initialized
     if (!this.matter || !this.matter.add) {
       console.error('Matter.js physics system not initialized for adding bodies');
       return;
     }
     
     // Add a test circle to frontseat physics world
     const frontseatCircle = this.matter.add.circle(gameWidth / 4, gameHeight / 2, 30, {
       restitution: 0.8,
       friction: 0.1
     });
     
     // Add a test rectangle to backseat physics world
     const backseatRect = this.matter.add.rectangle(gameWidth + (gameWidth / 4), gameHeight / 2, 60, 60, {
       restitution: 0.6,
       friction: 0.2
     });
     
         console.log('Test physics bodies added - Frontseat circle:', frontseatCircle, 'Backseat rectangle:', backseatRect);
  }

  private addFrontseatTrash() {
    const trashConfig = this.config.physics.frontseatCircle;
    
    // Create Trash object
    this.frontseatTrash = new Trash(this, trashConfig);
    
    // Add to frontseat physics container so it moves naturally with the container
    this.frontseatPhysicsContainer.add(this.frontseatTrash.gameObject);
    
    // Set the scroll factor to move horizontally with physics containers but stay vertically fixed
    this.frontseatTrash.gameObject.setScrollFactor(1, 0);
    
    // Set depth to be visible but not interfere with UI
    this.frontseatTrash.gameObject.setDepth(1000);
    
    console.log('Frontseat Trash added:', this.frontseatTrash);
  }

  private addBackseatItem() {
    const itemConfig = this.config.physics.backseatCircle;
    
    // Create Item object
    this.backseatItem = new Item(this, itemConfig);
    
    // Add to backseat physics container so it moves naturally with the container
    this.backseatPhysicsContainer.add(this.backseatItem.gameObject);
    
    // Set the scroll factor to move horizontally with physics containers but stay vertically fixed
    this.backseatItem.gameObject.setScrollFactor(1, 0);
    
    // Set depth to be visible but not interfere with UI
    this.backseatItem.gameObject.setDepth(1000);
    
    console.log('Backseat Item added:', this.backseatItem);
  }

  private addFrontseatKeys() {
    const keysConfig = this.config.physics.frontseatKeys;
    
    // Create Keys object
    this.frontseatKeys = new Keys(this, keysConfig);
    
    // Don't add to physics container - manage position manually for proper depth
    // Set the scroll factor to move horizontally with physics containers but stay vertically fixed
    this.frontseatKeys.gameObject.setScrollFactor(1, 0);
    
    // Set depth to be visible but not interfere with UI, and in front of magnetic target
    this.frontseatKeys.gameObject.setDepth(2000);
    
    // Add to game content container so it moves with camera
    this.gameContentContainer.add(this.frontseatKeys.gameObject);
    
    console.log('Frontseat Keys added:', this.frontseatKeys);
  }



  private createDebugBorders() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Create red debug border for frontseat physics world
    this.frontseatDebugBorder = this.add.graphics();
    this.frontseatDebugBorder.lineStyle(3, 0xff0000, 1); // Red border, 3px thick
    this.frontseatDebugBorder.strokeRect(0, 0, gameWidth, gameHeight);
    this.frontseatDebugBorder.setScrollFactor(1, 0); // Same scroll factor as physics container
    
    // Create green debug border for backseat physics world
    this.backseatDebugBorder = this.add.graphics();
    this.backseatDebugBorder.lineStyle(3, 0x00ff00, 1); // Green border, 3px thick
    this.backseatDebugBorder.strokeRect(gameWidth, 0, gameWidth, gameHeight);
    this.backseatDebugBorder.setScrollFactor(1, 0); // Same scroll factor as physics container
    
    // Set high depth to ensure borders are visible
    this.frontseatDebugBorder.setDepth(5000);
    this.backseatDebugBorder.setDepth(5000);
    
    console.log('Debug borders created - Red (frontseat), Green (backseat)');
  }

  private toggleDebugBorders() {
    if (this.frontseatDebugBorder && this.backseatDebugBorder) {
      const visible = this.frontseatDebugBorder.visible;
      this.frontseatDebugBorder.setVisible(!visible);
      this.backseatDebugBorder.setVisible(!visible);
      console.log(`Debug borders ${!visible ? 'shown' : 'hidden'}`);
    }
  }

    // ===== SCENE ACCESS HELPERS =====
  /**
   * Gets the AppScene instance
   */
  private getAppScene(): any {
    return this.scene.get('AppScene');
  }

  /**
   * Gets the MenuScene instance
   */
  private getMenuScene(): any {
    return this.scene.get('MenuScene');
  }

  // ===== INPUT CONTROLS =====
  private setupSwipeControls() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Don't start swipe tracking if knob is being used or dragging an object
      if (this.isKnobActive || this.isDraggingObject) return;
      
      // Don't allow swiping if Keys is not snapped to magnetic target
      if (!this.keysConstraint) return;
      
      // Check if clicking on interactive objects FIRST
      const hitObjects = this.input.hitTestPointer(pointer);
      if (hitObjects.length > 0) {
        // Check if any hit object is interactive (Matter.js sprites, knob, etc.)
        const hasInteractiveObject = hitObjects.some(obj => 
          obj.input?.enabled || 
          obj.body || // Matter.js objects have a body
          obj === this.frontseatDragDial ||
          obj === this.frontseatTrash?.gameObject ||
          obj === this.backseatItem?.gameObject ||
          obj === this.frontseatKeys?.gameObject ||
          obj === this.magneticTarget
        );
        if (hasInteractiveObject) {
          console.log('Swipe detection blocked by interactive object - not starting swipe tracking');
          return;
        }
      }
      
      // Check if a menu dialog is currently open
      const menuScene = this.scene.get('MenuScene');
      if (menuScene && menuScene.scene.isActive()) {
        // Check if MenuManager has a current dialog
        const menuManager = (menuScene as any).menuManager;
        if (menuManager && menuManager.currentDialog) {
          console.log('Swipe detection blocked - menu dialog is open');
          return;
        }
      }
      
      // Only start swipe tracking if we're not clicking on interactive objects
      startX = pointer.x;
      startY = pointer.y;
      startTime = Date.now();
      console.log('Swipe tracking started');
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.gameStarted || this.isKnobActive || this.isDraggingObject) return;
      
      // Don't process swipe if Keys is not snapped to magnetic target
      if (!this.keysConstraint) return;
      
      // Don't process swipe if clicking on an interactive object
      const hitObjects = this.input.hitTestPointer(pointer);
      if (hitObjects.length > 0) {
        const hasInteractiveObject = hitObjects.some(obj => 
          obj.input?.enabled || 
          obj.body || // Matter.js objects have a body
          obj === this.frontseatDragDial ||
          obj === this.frontseatTrash?.gameObject ||
          obj === this.backseatItem?.gameObject ||
          obj === this.frontseatKeys?.gameObject ||
          obj === this.magneticTarget
        );
        if (hasInteractiveObject) {
          console.log('Swipe detection blocked by interactive object on pointerup');
          return;
        }
      }
      
      // Check if a menu dialog is currently open
      const menuScene = this.scene.get('MenuScene');
      if (menuScene && menuScene.scene.isActive()) {
        // Check if MenuManager has a current dialog
        const menuManager = (menuScene as any).menuManager;
        if (menuManager && menuManager.currentDialog) {
          console.log('Swipe detection blocked on pointerup - menu dialog is open');
          return;
        }
      }
      
      const endX = pointer.x;
      const endY = pointer.y;
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (duration > 500) return; // Ignore long presses
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance < 50) return; // Ignore small movements
      
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      
      if (isHorizontal) {
        if (deltaX > 0) {
            this.switchToFrontseat();
        } else {
          this.switchToBackseat();
        }
      } else {
        if (deltaY > 0) {
          this.hideOverlay();
        } else {
          this.showOverlay();
        }
      }
    });
  }

  private setupKeyboardControls() {
    // Add keyboard controls for driving
    this.input.keyboard?.on('keydown-SPACE', () => {
      console.log('Space pressed - toggling driving mode...');
      this.toggleDrivingMode();
    });
    
    console.log('Keyboard controls setup - Press SPACE to toggle driving mode');
  }

  private setupAutoPause() {
    // Listen for window blur/focus events
    window.addEventListener('blur', () => {
      // Only auto-pause if the game has been started
      if (this.gameStarted) {
        console.log('GameScene: Window lost focus - auto-pausing game');
        this.triggerAppScenePause();
      }
    });

    window.addEventListener('focus', () => {
      // Only auto-resume if the game was started and we're not already paused
      if (this.gameStarted) {
        console.log('GameScene: Window regained focus - auto-resuming game');
        this.triggerAppSceneResume();
      }
    });
  }

  private triggerAppScenePause() {
    // Get the AppScene and trigger its pause method
    const appScene = this.getAppScene();
    if (appScene && appScene.scene.isActive()) {
      // Call the togglePauseMenu method if not already paused
      if (!(appScene as any).isPaused) {
        (appScene as any).togglePauseMenu();
      }
    }
  }

  private triggerAppSceneResume() {
    // Get the AppScene and trigger its resume method
    const appScene = this.getAppScene();
    if (appScene && appScene.scene.isActive()) {
      // Call the togglePauseMenu method if currently paused
      if ((appScene as any).isPaused) {
        (appScene as any).togglePauseMenu();
      }
    }
  }

         private switchToBackseat() {
      // Don't allow switching to backseat if keys are not in ignition
      if (!this.keysConstraint) {
        console.log('Cannot switch to backseat - keys not in ignition!');
        return;
      }
      
      if (this.currentPosition === 'frontseat') {
        // Move the entire content container to the left to show backseat
        const gameWidth = this.cameras.main.width;
        this.tweens.add({
          targets: this.gameContentContainer,
          x: -gameWidth,
          y: 0, // Reset to main view
          duration: this.config.navigation.animationDuration,
          ease: 'Power2'
        });
        
        // Also move the driving background with the same animation
        if (this.drivingBackground) {
          this.tweens.add({
            targets: this.drivingBackground,
            x: -gameWidth,
            y: 0, // Reset to main view
            duration: this.config.navigation.animationDuration,
            ease: 'Power2'
          });
        }
        
        // Move physics containers horizontally (not vertically)
        this.tweens.add({
          targets: [this.frontseatPhysicsContainer, this.backseatPhysicsContainer, this.frontseatDebugBorder, this.backseatDebugBorder],
          x: -gameWidth, // Move both containers left
          duration: this.config.navigation.animationDuration,
          ease: 'Power2'
        });
        
        this.currentPosition = 'backseat';
        this.currentView = 'main';
        
        // Update tutorial overlay visibility
        this.updateTutorialOverlay();
      }
    }

    private switchToFrontseat() {
      if (this.currentPosition === 'backseat') {
        // Move the entire content container to the right to show frontseat
        this.tweens.add({
          targets: this.gameContentContainer,
          x: 0,
          y: 0, // Reset to main view
          duration: this.config.navigation.animationDuration,
          ease: 'Power2'
        });
       
       // Also move the driving background with the same animation
       if (this.drivingBackground) {
         this.tweens.add({
           targets: this.drivingBackground,
           x: 0,
           y: 0, // Reset to main view
           duration: this.config.navigation.animationDuration,
           ease: 'Power2'
         });
       }
       
       // Move physics containers horizontally (not vertically)
       this.tweens.add({
         targets: [this.frontseatPhysicsContainer, this.backseatPhysicsContainer, this.frontseatDebugBorder, this.backseatDebugBorder],
         x: 0, // Move both containers back to original position
         duration: this.config.navigation.animationDuration,
         ease: 'Power2'
       });
       
        this.currentPosition = 'frontseat';
        this.currentView = 'main';
      }
    }

       private showOverlay(velocity?: number) {
      if (this.currentView === 'main') {
        // Move the entire content container down to show overlay
        const gameHeight = this.cameras.main.height;
        const overlayOffset = gameHeight * this.config.navigation.overlayOffsetPercent;
        const duration = velocity ? Math.max(200, Math.min(1000, 1000 / (velocity / 500))) : this.config.navigation.animationDuration;
        this.tweens.add({
          targets: this.gameContentContainer,
          y: -overlayOffset,
          duration: duration,
          ease: 'Power2'
        });
       
       // Also move the driving background with the same animation
       if (this.drivingBackground) {
         this.tweens.add({
           targets: this.drivingBackground,
           y: -overlayOffset,
           duration: duration,
           ease: 'Power2'
         });
       }
       
       // Physics containers should NOT move with overlays - they stay in place
       
        this.currentView = 'overlay';
        this.updateToggleButtonText();
       console.log(`Showing overlay - content and driving background moved down by ${overlayOffset}px (33% of screen)`);
      }
    }

    private hideOverlay(velocity?: number) {
      if (this.currentView === 'overlay') {
        // Move the entire content container up to show main content
        const duration = velocity ? Math.max(200, Math.min(1000, 1000 / (velocity / 500))) : this.config.navigation.animationDuration;
        this.tweens.add({
          targets: this.gameContentContainer,
          y: 0,
          duration: duration,
          ease: 'Power2'
        });
       
       // Also move the driving background back with the same animation
       if (this.drivingBackground) {
         this.tweens.add({
           targets: this.drivingBackground,
           y: 0,
           duration: duration,
           ease: 'Power2'
         });
       }
       
       // Physics containers should NOT move with overlays - they stay in place
       
        this.currentView = 'main';
        this.updateToggleButtonText();
       console.log('Hiding overlay - content and driving background moved up to 0');
      }
    }

    private updateToggleButtonText() {
      // Find the toggle button texts and update them based on current view
      const mapToggleText = this.gameContentContainer.getByName('mapToggleText') as Phaser.GameObjects.Text;
      const inventoryToggleText = this.gameContentContainer.getByName('inventoryToggleText') as Phaser.GameObjects.Text;
      
      const buttonText = this.currentView === 'main' ? 'LOOK DOWN' : 'LOOK UP';
      
      if (mapToggleText) {
        mapToggleText.setText(buttonText);
      }
      if (inventoryToggleText) {
        inventoryToggleText.setText(buttonText);
      }
    }

      private updateMoney(amount: number) {
     this.money = amount;
     if (this.moneyText) {
       this.moneyText.setText(`$${this.money}`);
     }
   }

     private updateHealth(health: number) {
    this.health = Phaser.Math.Clamp(health, 1, 10); // Clamp between 1-10
    if (this.healthText) {
      this.healthText.setText(`Health: ${Math.round(this.health * 10)}%`);
    }
  }

  private updatePlayerSkill(skill: number) {
    this.playerSkill = Phaser.Math.Clamp(skill, 0, 100); // Clamp between 0-100%
    if (this.playerSkillText) {
      this.playerSkillText.setText(`Skill: ${this.playerSkill}%`);
    }
  }

  private updateDifficulty(difficulty: number) {
    this.difficulty = Phaser.Math.Clamp(difficulty, 0, 100); // Clamp between 0-100%
    if (this.difficultyText) {
      this.difficultyText.setText(`Difficulty: ${this.difficulty}%`);
    }
  }

  private updateMomentum(momentum: number) {
    this.momentum = Phaser.Math.Clamp(momentum, 0, 100); // Clamp between 0-100%
    if (this.momentumText) {
      this.momentumText.setText(`Momentum: ${this.momentum}%`);
    }
  }

  private updatePlotA(plotA: number, plotAEnum?: string) {
    this.plotA = Phaser.Math.Clamp(plotA, 0, 100);
    if (plotAEnum) this.plotAEnum = plotAEnum;
    if (this.plotAText) {
      this.plotAText.setText(`Plot A (${this.plotAEnum}): ${this.plotA}%`);
    }
  }

  private updatePlotB(plotB: number, plotBEnum?: string) {
    this.plotB = Phaser.Math.Clamp(plotB, 0, 100);
    if (plotBEnum) this.plotBEnum = plotBEnum;
    if (this.plotBText) {
      this.plotBText.setText(`Plot B (${this.plotBEnum}): ${this.plotB}%`);
    }
  }

  private updatePlotC(plotC: number, plotCEnum?: string) {
    this.plotC = Phaser.Math.Clamp(plotC, 0, 100);
    if (plotCEnum) this.plotCEnum = plotCEnum;
    if (this.plotCText) {
      this.plotCText.setText(`Plot C (${this.plotCEnum}): ${this.plotC}%`);
    }
  }

  private syncPhysicsObjectPositions() {
    // This method is not needed - objects are now in gameContentContainer
    // which moves with the camera automatically
  }

  private applyMagneticAttraction() {
    if (!this.frontseatKeys || !this.frontseatKeys.gameObject || !this.frontseatKeys.gameObject.body) return;
    if (!this.magneticTarget || !(this.magneticTarget as any).magneticBody) return;
    
    // Don't apply magnetic attraction if we're in cooldown after removing keys
    if (this.keysRemovalCooldown > 0) {
      this.keysRemovalCooldown -= this.config.visual.timing.cooldownFrameTime; // Decrease cooldown using config timing
      return;
    }
    
    // Don't apply magnetic attraction if key is being actively dragged
    if ((this.frontseatKeys.gameObject as any).isDragging) {
      return;
    }
    
    const magneticConfig = this.config.physics.magneticTarget;
    const keysBody = this.frontseatKeys.gameObject.body;
    const magneticBody = (this.magneticTarget as any).magneticBody;
    
    // Get positions using Phaser Matter API
    const keysPos = { x: keysBody.position.x, y: keysBody.position.y };
    const targetPos = { x: magneticBody.position.x, y: magneticBody.position.y };
    
    // Calculate distance
    const dx = targetPos.x - keysPos.x;
    const dy = targetPos.y - keysPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Snap threshold - when Keys gets close enough, create a constraint
    const snapThreshold = this.config.physics.magneticTarget.snapThreshold; // Distance at which Keys snaps to center
    
    if (distance <= snapThreshold && !this.keysConstraint) {
      // Create constraint to snap Keys to the center of magnetic target
      console.log('Keys snapped to magnetic target!');
      this.keysConstraint = this.matter.add.constraint(keysBody, magneticBody as any, 0, 0.1, {
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        stiffness: 1,
        damping: 0.1
      });
      
      // Show turn key menu only if car hasn't been started yet AND key is in ignition
      if (!this.carStarted && this.keysConstraint) {
        this.menuBridge.showTurnKeyMenu();
      }
      
      // Make Keys move vertically with camera when snapped
      this.frontseatKeys.gameObject.setScrollFactor(1, 1);
      
      // Visual feedback: make target glow bright when snapped using config
      this.magneticTarget.clear();
      const magneticVisualConfig = this.config.visual.physics.magneticTarget;
      this.magneticTarget.lineStyle(magneticVisualConfig.snappedLineWidth, parseInt(magneticVisualConfig.snappedColor.replace('0x', ''), 16), 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
      
      // Update tutorial overlay visibility
      this.updateTutorialOverlay();
      
    } else if (distance > magneticConfig.magneticRange && this.keysConstraint) {
      // Remove constraint if Keys is dragged too far away
      console.log('Keys released from magnetic target');
      
      // Use consolidated key removal logic (this will handle constraint removal)
      this.handleKeyRemoval('magnetic range exceeded');
      
      // Reset Keys scroll factor to horizontal only
      this.frontseatKeys.gameObject.setScrollFactor(1, 0);
      
      // Reset target color
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(3, parseInt(magneticConfig.color.replace('0x', ''), 16), 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
      
      // Update tutorial overlay visibility
      this.updateTutorialOverlay();
      
    } else if (distance <= magneticConfig.magneticRange && distance > snapThreshold && !this.keysConstraint) {
      // Apply magnetic attraction when close but not snapped
      const attractionForce = magneticConfig.magneticStrength * (1 - distance / magneticConfig.magneticRange);
      
      // Apply force towards target
      const forceX = (dx / distance) * attractionForce;
      const forceY = (dy / distance) * attractionForce;
      
      // Apply the force to the Keys object using Phaser Matter API
      this.matter.body.applyForce(keysBody as any, keysPos, { x: forceX, y: forceY });
      
      // Visual feedback: make target glow when Keys is close using config
      this.magneticTarget.clear();
      const magneticVisualConfig = this.config.visual.physics.magneticTarget;
      this.magneticTarget.lineStyle(magneticVisualConfig.closeLineWidth, parseInt(magneticVisualConfig.closeColor.replace('0x', ''), 16), 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
      
    } else if (distance > magneticConfig.magneticRange) {
      // Reset target color when Keys is far away
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(3, parseInt(magneticConfig.color.replace('0x', ''), 16), 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
    }
  }

  private updatePosition() {
    // Only update position if driving mode is active and not paused
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Only allow position changes when speed crank is at 40% or higher
    const crankPercentage = this.getSpeedCrankPercentage();
    if (crankPercentage < 40) {
      console.log('Position update blocked - crank below 40%:', crankPercentage);
      return; // Don't update position when crank is below 40%
    }
     
     // Update position based on reactive knobValue (-100 to 100)
     const changeRate = this.knobValue / 100; // -1 to 1
     
     // Apply change rate to position (frame by frame) - increased speed
     const speed = 2.0; // Increased speed multiplier
     this.position += changeRate * speed;
     
     // Clamp position to 0-100%
     this.position = Phaser.Math.Clamp(this.position, 0, 100);
     
     // Update position text
     if (this.positionText) {
       this.positionText.setText(`Position: ${Math.round(this.position)}%`);
     }
     
     // Update road position for OutRun-style effect
     this.updateRoadPosition();
   }

   private startKnobReturnTimer() {
     this.stopKnobReturnTimer(); // Stop any existing timer
     this.knobReturnTimer = this.time.addEvent({
       delay: 16, // Update every 16ms (60fps) for smooth return
       callback: this.updateKnobReturn,
       callbackScope: this,
       loop: true
     });
   }

   private stopKnobReturnTimer() {
     if (this.knobReturnTimer) {
       this.knobReturnTimer.remove();
       this.knobReturnTimer = null;
     }
   }

   private updateKnobVisual() {
     if (!this.frontseatDragDial) return;
     
     // Clear the knob graphics
     this.frontseatDragDial.clear();
     
     const knobRadius = 60;
     
     // Draw the knob base
     this.frontseatDragDial.fillStyle(0x666666);
     this.frontseatDragDial.fillCircle(0, 0, knobRadius);
     this.frontseatDragDial.lineStyle(3, 0xffffff, 1);
     this.frontseatDragDial.strokeCircle(0, 0, knobRadius);
     
     // Draw the pointer rotated based on knobValue
     const angle = (this.knobValue / 100) * Math.PI; // Convert to radians
     const pointerLength = 20;
     const pointerX = Math.cos(angle) * pointerLength;
     const pointerY = Math.sin(angle) * pointerLength;
     
     this.frontseatDragDial.fillStyle(0x00ff00);
     this.frontseatDragDial.fillRect(-3, -knobRadius + 10, 6, pointerLength);
     
     // Rotate the pointer
     this.frontseatDragDial.setRotation(angle);
   }

     private updateRoadPosition() {
    if (!this.drivingBackground || !this.drivingMode || this.drivingPaused) return;
     
     // Instead of moving the entire background, move the car within the view
     // Calculate car position based on position (0-100% maps to car bounds)
     const gameWidth = this.cameras.main.width;
     const carBounds = 150; // How far left/right the car can move
     const carX = (this.position / 100) * (gameWidth - 100) + 50; // Map 0-100% to car bounds
     
     // Update car position
     if (this.drivingCar) {
       this.drivingCar.setX(carX);
     }
   }

   private updateKnobReturn() {
     if (this.isKnobActive) return;
     
         // Gradually return knobValue to neutral (0)
    const returnSpeed = this.config.driving.knob.returnSpeed;
     
     if (Math.abs(this.knobValue) > 1) {
       // Move toward neutral
       this.knobValue = this.knobValue > 0 ? 
         Math.max(0, this.knobValue - returnSpeed) : 
         Math.min(0, this.knobValue + returnSpeed);
     } else {
       // Close enough to neutral, set to 0 and stop timer
       this.knobValue = 0;
       this.stopKnobReturnTimer();
     }
     
     // Update the knob visual to match the reactive value
     this.updateKnobVisual();
   }


  // Method to start the game (called from AppScene)
  public startGame() {
    this.gameStarted = true;
    console.log('GameScene: Game started! Controls are now enabled.');
    
    // Hide navigation buttons initially (car not started yet)
    this.updateNavigationButtonVisibility();
    
    // Update tutorial overlay visibility now that game has started
    this.updateTutorialOverlay();
    
    // Start the countdown timer
    this.startCountdownTimer();
    
    // Update instructions text
    const instructions = this.children.getByName('instructions') as Phaser.GameObjects.Text;
    if (instructions) {
      instructions.setText('Arrow Keys: Navigate seats\nDown: Show overlay\nUp: Hide overlay\nM: Menu\nS: Story\nSwipe Left/Right: Switch seats\nSwipe Up/Down: Camera\n\nGAME STARTED!');
    }
  }

     private startCountdownTimer() {
     // Don't create an automatic timer - countdown will be step-based
     console.log('Countdown timer ready for step-based updates');
   }

   private stopCountdownTimer() {
     // Reset the game over dialog flag
     this.gameOverDialogShown = false;
     console.log('Countdown timer stopped');
   }

   private resetGameState() {
     // Reset all game state variables to their defaults
     this.gameTime = 10; // Reset to starting time
     this.gameStarted = false;
     this.position = 50; // Reset to center
     this.knobValue = 0; // Reset knob to neutral
     this.money = 108; // Reset money
     this.health = 10; // Reset health to max
     this.stops = 0; // Reset stops
     this.progress = 0; // Reset progress
     this.drivingMode = false; // Reset driving mode
     this.isKnobActive = false; // Reset knob state
     this.currentSteeringValue = 0; // Reset steering
     this.carSpeed = 0; // Reset car speed
     this.carX = 0; // Reset car position
     this.gameOverDialogShown = false; // Reset dialog flag
     
     console.log('Game state reset to defaults');
   }

     private updateCountdown() {
     // Check if scene is still active before proceeding
     if (!this.scene.isActive()) {
       console.log('Scene is no longer active, skipping countdown update');
       return;
     }
     
     // Only count down if countdown has been started
     if (!this.countdownStarted) {
       return;
     }
     
     if (this.gameTime > 0) {
       this.gameTime--;
       console.log(`Countdown step: ${this.gameTime}, countdownText exists: ${!!this.countdownText}`);
       if (this.countdownText) {
         this.countdownText.setText(this.gameTime.toString());
         console.log(`Updated countdown text to: ${this.gameTime}`);
       } else {
         console.log('countdownText is null or undefined');
       }
     } else {
       // Timer finished - Game Over!
       console.log('Countdown finished! Game Over!');
       this.showGameOverDialog();
     }
   }

   private showGameOverDialog() {
     // Prevent multiple dialogs from being created
     if (this.gameOverDialogShown) return;
     this.gameOverDialogShown = true;
     
     // Show game over menu via MenuScene
     const menuScene = this.scene.get('MenuScene');
     if (menuScene) {
       menuScene.events.emit('showGameOverMenu');
       this.scene.bringToTop('MenuScene');
     }
     
     console.log('Game Over dialog shown');
   }

   // Public method to trigger a countdown step
   public stepCountdown() {
     this.updateCountdown();
     
     // Add progress based on car speed (not just driving mode)
     if (this.drivingMode && this.carSpeed > 0) {
       // Calculate progress increment based on car speed
       const speedCrankPercentage = this.getSpeedCrankPercentage();
       const maxSpeed = this.config.driving.carSpeed.maxSpeed;
       const speedRatio = this.carSpeed / maxSpeed; // Current speed as ratio of max speed
       const crankRatio = speedCrankPercentage / 100; // Crank position as ratio
       
       // Base progress increment (from config)
       const progressScale = this.config.driving.progress?.scale ?? 2;
       let progressIncrement = speedRatio * progressScale; // Scale factor for progress speed
       
       // If crank is misaligned with actual speed, slow down progress significantly
       const speedDifference = Math.abs(speedRatio - crankRatio);
       const misalignThreshold = this.config.driving.progress?.misalignThreshold ?? 0.1;
       const misalignPenaltyScale = this.config.driving.progress?.misalignPenaltyScale ?? 0.1;
       if (speedDifference > misalignThreshold) { // More than threshold difference
         progressIncrement *= misalignPenaltyScale; // Very slow progress when misaligned
         console.log(`Progress slowed due to crank misalignment - speed: ${Math.round(speedRatio * 100)}%, crank: ${speedCrankPercentage}%`);
       }
       
       this.updateProgress(this.progress + progressIncrement);
       console.log(`Progress increased by ${progressIncrement.toFixed(2)} to ${this.progress.toFixed(1)}% (speed: ${Math.round(speedRatio * 100)}%)`);
     }
   }

     private onStepEvent(stepNumber: number) {
    console.log(`GameScene received step event: ${stepNumber}`);
    this.stepCountdown();
    
    // Check if we should auto-resume driving after collision
    if (this.shouldAutoResumeAfterCollision && !this.drivingMode) {
      console.log('Auto-resuming driving after collision...');
      this.drivingSystem.startDriving();
    }
  }

   private onGamePaused() {
     console.log('GameScene: Game paused - stopping driving visualization');
     if (this.drivingMode) {
       this.drivingSystem.stopDriving();
       // Note: shouldAutoRestartDriving flag remains true
     }
   }

   private onGameResumed() {
     console.log('GameScene: Game resumed');
     // Auto-restart driving if it was active before pause
     if (this.shouldAutoRestartDriving && !this.drivingMode) {
       this.drivingSystem.startDriving();
       console.log('Auto-restarted driving after resume');
     }
   }

   private updateStops(increment: number = 1) {
     this.stops += increment;
     if (this.stopsText) {
       this.stopsText.setText(`Stops: ${this.stops}`);
     }
   }

   private updateProgress(newProgress: number) {
     this.progress = Math.max(0, Math.min(100, newProgress));
     if (this.progressText) {
       this.progressText.setText(`Progress: ${Math.round(this.progress)}%`);
     }
   }

     private keepPhysicsContainersInPlace() {
    // Ensure physics containers stay at their original positions relative to current seat
    // Frontseat container should stay at (0, 0) when in frontseat, (-gameWidth, 0) when in backseat
    // Backseat container should stay at (gameWidth, 0) when in frontseat, (0, 0) when in backseat
    const gameWidth = this.cameras.main.width;
    
    if (this.frontseatPhysicsContainer && this.backseatPhysicsContainer) {
      if (this.currentPosition === 'frontseat') {
        // In frontseat view: frontseat at (0,0), backseat at (gameWidth,0)
        this.frontseatPhysicsContainer.setPosition(0, 0);
        this.backseatPhysicsContainer.setPosition(gameWidth, 0);
        // Position debug borders
        if (this.frontseatDebugBorder) this.frontseatDebugBorder.setPosition(0, 0);
        if (this.backseatDebugBorder) this.backseatDebugBorder.setPosition(gameWidth, 0);
        // Note: gravity circle maintains its current position - not repositioned
      } else {
        // In backseat view: frontseat at (-gameWidth,0), backseat at (0,0)
        this.frontseatPhysicsContainer.setPosition(-gameWidth, 0);
        this.backseatPhysicsContainer.setPosition(0, 0);
        // Position debug borders
        if (this.frontseatDebugBorder) this.frontseatDebugBorder.setPosition(-gameWidth, 0);
        if (this.backseatDebugBorder) this.backseatDebugBorder.setPosition(0, 0);
        // Note: gravity circle maintains its current position - not repositioned
      }
    }
  }

   public getDragDialValue(): number {
     return this.frontseatDragDial ? this.frontseatDragDial.value : 0;
   }

   // ===== GAME STATE MANAGEMENT =====
  private resetGameState() {
    // Reset all game state variables to their defaults
    this.gameTime = 10; // Reset to starting time
    this.knobValue = 0; // Reset knob to neutral
    this.money = 108; // Reset money
    this.health = 10; // Reset health to max
    this.stops = 0; // Reset stops
    this.progress = 0; // Reset progress
    this.drivingMode = false; // Reset driving mode
    this.isKnobActive = false; // Reset knob state
    this.currentSteeringValue = 0; // Reset steering
    this.carSpeed = 0; // Reset car speed
    this.carX = 0; // Reset car position
    this.gameOverDialogShown = false; // Reset dialog flag
    
    console.log('Game state reset to defaults');
  }

  // ===== SAVE SYSTEM =====
  public showSaveMenu() { this.menuBridge.showSaveMenu(); }

  public loadGame(steps: number) {
    console.log(`Loading game from step ${steps}`);
    this.saveLoadBridge.loadSteps(steps);
    if (!this.gameStarted) { this.startGame(); }
    // TODO: Implement proper game state restoration based on steps
    // This would involve restoring:
    // - Game time
    // - Player position
    // - Money, health, etc.
    // - Car state
    // - Current view/position
    
    console.log('Game loaded successfully');
  }

   public setDragDialValue(value: number): void {
     if (this.frontseatDragDial) {
       this.frontseatDragDial.setValue(value);
     }
   }

   public getSteeringValue(): number {
     return this.frontseatDragDial ? this.frontseatDragDial.value : 0;
   }

   public setSteeringValue(value: number): void {
     if (this.frontseatDragDial) {
       this.frontseatDragDial.setValue(value);
     }
   }

   public getDrivingSteeringValue(): number {
     return this.currentSteeringValue;
   }

  private toggleDrivingMode() {
    if (this.drivingMode) {
      this.drivingSystem.stopDriving();
    } else {
      this.drivingSystem.startDriving();
    }
  }

  private startDriving() {
    this.drivingSystem.startDriving();
  }

  private stopDriving() {
    this.drivingSystem.stopDriving();
  }

  private pauseDriving() {
    this.drivingSystem.pauseDriving();
  }

  private resumeDriving() {
    this.drivingSystem.resumeDriving();
  }

  private startNeutralReturnTimer() {
     // Create a timer that gradually returns knob to neutral position
     this.neutralReturnTimer = this.time.addEvent({
       delay: 50, // Update every 50ms for smooth return
       callback: this.updateNeutralReturn,
       callbackScope: this,
       loop: true
     });
   }

   private stopNeutralReturnTimer() {
     if (this.neutralReturnTimer) {
       this.neutralReturnTimer.remove();
       this.neutralReturnTimer = null;
     }
   }

     private updateNeutralReturn() {
    if (!this.drivingMode || !this.frontseatDragDial || this.isKnobActive || this.drivingPaused) return;
     
     // Gradually return to neutral position (0)
     const currentValue = this.frontseatDragDial.value;
     if (Math.abs(currentValue) > 1) {
       const returnSpeed = 2; // Speed of return (higher = faster)
       const newValue = currentValue > 0 ? 
         Math.max(0, currentValue - returnSpeed) : 
         Math.min(0, currentValue + returnSpeed);
       
       this.frontseatDragDial.setValue(newValue);
       this.currentSteeringValue = newValue;
     }
   }

   private startForwardMovementTimer() {
     // Guard against multiple timers
     if (this.forwardMovementTimer) {
       console.log('Forward movement timer already exists, skipping');
       return;
     }
     
     // Create a timer that updates forward movement every frame
     this.forwardMovementTimer = this.time.addEvent({
       delay: 16, // ~60 FPS
       callback: this.updateForwardMovement,
       callbackScope: this,
       loop: true
     });
     console.log('Forward movement timer started');
   }

   private stopForwardMovementTimer() {
     if (this.forwardMovementTimer) {
       this.forwardMovementTimer.remove();
       this.forwardMovementTimer = null;
     }
   }

     private updateForwardMovement() {
    if (!this.drivingMode || this.drivingPaused) return;
     
         // Get speed crank percentage (0-100) and convert to speed multiplier
    const speedCrankPercentage = this.getSpeedCrankPercentage();
    const speedMultiplier = speedCrankPercentage / 100; // Convert to 0-1 range
    const maxSpeed = this.config.driving.carSpeed.maxSpeed;
    const currentSpeedRatio = this.carSpeed / maxSpeed; // Current speed as ratio
    
    console.log('Forward movement update - crank:', speedCrankPercentage + '%', 'multiplier:', speedMultiplier, 'current speed:', this.carSpeed);
    
    // Only move if speed crank is above 0%
    if (speedCrankPercentage > 0) {
      // Calculate target speed based on crank percentage
      const targetSpeed = maxSpeed * speedMultiplier;
      
      // Use much more gradual speed changes
      const baseAcceleration = this.config.driving.carSpeed.acceleration * 0.3; // Much slower base acceleration
      const speedDifference = Math.abs(targetSpeed - this.carSpeed);
      
      if (this.carSpeed < targetSpeed) {
        // Gradual acceleration towards target
        const accelerationRate = baseAcceleration * (1 + speedDifference / maxSpeed); // Slightly faster when far from target
        this.carSpeed = Math.min(this.carSpeed + accelerationRate, targetSpeed);
        console.log('Gradual acceleration to target speed:', targetSpeed.toFixed(2), 'current:', this.carSpeed.toFixed(2), 'rate:', accelerationRate.toFixed(3));
      } else if (this.carSpeed > targetSpeed) {
        // Gradual deceleration towards target
        const decelerationRate = baseAcceleration * 1.5; // Slightly faster deceleration than acceleration
        this.carSpeed = Math.max(this.carSpeed - decelerationRate, targetSpeed);
        console.log('Gradual deceleration to target speed:', targetSpeed.toFixed(2), 'current:', this.carSpeed.toFixed(2), 'rate:', decelerationRate.toFixed(3));
      }
    } else {
      // If crank is at 0%, gradually slow down to complete stop
      const stopDecelerationRate = this.config.driving.carSpeed.acceleration * 0.5; // Moderate deceleration to stop
      this.carSpeed = Math.max(this.carSpeed - stopDecelerationRate, 0);
      console.log('Gradual stop deceleration, current speed:', this.carSpeed.toFixed(2), 'rate:', stopDecelerationRate.toFixed(3));
    }
    
    // Speed update handled directly in GameScene - no external communication needed
     
         // Move road lines to create forward motion effect
    this.updateRoadLines();
    
    // Update obstacles
    this.updateObstacles();
    
    // Update car position based on current steering value
    this.updateCarPosition();
    
    // Update speed display for debugging
    if (this.speedDisplayText) {
      const speedPercentage = Math.round((this.carSpeed / maxSpeed) * 100);
      this.speedDisplayText.setText(`Speed: ${speedPercentage}%`);
    }
   }

     private updateCarPosition() {
    if (!this.drivingMode || !this.drivingCar || this.drivingPaused) return;
    
    // Only allow steering when speed crank is at configured threshold or higher
    const crankPercentage = this.getSpeedCrankPercentage();
    const minCrank = this.config.driving.steering.minCrankPercentForSteering ?? 40;
    if (crankPercentage < minCrank) {
      // Reset steering value to prevent any position changes
      this.currentSteeringValue = 0;
      return; // Don't update car position when crank is below 40%
    }
    
    // Don't update position if car is not moving (with small tolerance for floating point)
    const minSpeed = this.config.driving.steering.minSpeedForSteering ?? 0.01;
    if (this.carSpeed < minSpeed) {
      // Reset steering value to prevent any position changes
      this.currentSteeringValue = 0;
      return; // No steering when car is essentially stationary
    }
    
    // Additional check: ensure car is actually started
    if (!this.carStarted) {
      // Reset steering value to prevent any position changes
      this.currentSteeringValue = 0;
      return;
    }
     
         // Use the current steering value to update car position
    const normalizedValue = this.currentSteeringValue / 100;
    const steeringSensitivity = this.config.driving.steering.sensitivity;
    
    // Make steering proportional to car speed - faster car = more steering effect
    const speedMultiplier = this.carSpeed / this.config.driving.carSpeed.maxSpeed;
    
    console.log('Car position update - steeringValue:', this.currentSteeringValue, 'normalized:', normalizedValue, 'sensitivity:', steeringSensitivity, 'speedMultiplier:', speedMultiplier);
     
     // Update car position based on steering (multiplied by speed)
     const oldCarX = this.carX;
     this.carX += normalizedValue * steeringSensitivity * speedMultiplier;
     console.log('Car X change - old:', oldCarX, 'new:', this.carX, 'change:', (this.carX - oldCarX));
     
     // Clamp car position to road boundaries
     const gameWidth = this.cameras.main.width;
     this.carX = Phaser.Math.Clamp(this.carX, 50, gameWidth - 50);
     
     // Update car visual position
     this.drivingCar.setX(this.carX);
     
     // Move camera horizontally for first-person effect
     this.updateDrivingCamera();
   }

  private updateDrivingCamera() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Check if camera movement is enabled
    const cameraEnabled = this.config.driving?.camera?.enabled ?? true;
    if (!cameraEnabled) return;
    
    // Calculate camera offset based on car position
    const gameWidth = this.cameras.main.width;
    const centerX = gameWidth / 2;
    let cameraOffset = this.carX - centerX;
    
    // Apply maximum offset limit to prevent excessive camera movement
    const maxOffset = this.config.driving?.camera?.maxOffset ?? 100;
    cameraOffset = Phaser.Math.Clamp(cameraOffset, -maxOffset, maxOffset);
    
    // Move individual driving elements directly (opposite direction for first-person effect)
    const targetX = -cameraOffset;
    
    // Move sky
    if (this.drivingBackground && this.drivingBackground.list[0]) {
      this.drivingBackground.list[0].setX(targetX);
    }
    
    // Move road
    if (this.drivingRoad) {
      this.drivingRoad.setX(targetX);
    }
    
    // Move road lines
    this.drivingRoadLines.forEach(line => {
      line.setX(targetX);
    });
    
    console.log(`Driving camera: carX=${this.carX.toFixed(2)}, offset=${cameraOffset.toFixed(2)}, targetX=${targetX.toFixed(2)}`);
  }

  private resetDrivingCamera() {
    // Reset individual driving elements to center position
    if (this.drivingBackground && this.drivingBackground.list[0]) {
      this.drivingBackground.list[0].setX(0);
    }
    
    if (this.drivingRoad) {
      this.drivingRoad.setX(0);
    }
    
    this.drivingRoadLines.forEach(line => {
      line.setX(0);
    });
    
    console.log('Driving elements reset to center');
  }

  // Driving visualization methods - restored with low depths
  private createDrivingBackground() {
    // Guard against multiple initialization
    if (this.drivingBackground) {
      console.log('Driving background already exists, skipping creation');
      return;
    }
    
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Create driving container that will move with the camera but stay behind UI
    this.drivingBackground = this.add.container(0, 0);
    console.log('Created driving background container at position:', this.drivingBackground.x, this.drivingBackground.y);
    
    const viewYOffsetPercent = this.config.driving.roadVisual?.viewYOffsetPercent ?? 0;
    if (viewYOffsetPercent !== 0) {
      this.drivingBackground.setY(gameHeight * viewYOffsetPercent);
      console.log('Set driving background Y offset to:', this.drivingBackground.y);
    }
    this.drivingBackground.setDepth(-1000); // Very low depth to ensure it's behind everything
    
    // IMPORTANT: Make sure the driving background can move horizontally
    this.drivingBackground.setScrollFactor(0, 0); // No scroll factor - manual positioning only
    
    // Create sky
    const skyColor = parseInt((this.config.driving.roadVisual?.skyColor ?? '0x87CEEB').replace('0x',''), 16);
    const roadColor = parseInt((this.config.driving.roadVisual?.roadColor ?? '0x333333').replace('0x',''), 16);
    const lineColor = parseInt((this.config.driving.roadVisual?.lineColor ?? '0xffffff').replace('0x',''), 16);
    const boundaryPadding = this.config.driving.roadVisual?.boundaryPadding ?? 50;
    const sky = this.add.rectangle(0, 0, gameWidth, gameHeight / 2, skyColor);
    sky.setOrigin(0);
    sky.setDepth(-1000); // Ensure sky is behind everything
    this.drivingBackground.add(sky);
    
    // Create road
    this.drivingRoad = this.add.rectangle(0, gameHeight / 2, gameWidth, gameHeight / 2, roadColor);
    this.drivingRoad.setOrigin(0);
    this.drivingRoad.setDepth(this.config.driving.roadVisual?.roadDepth ?? -1000); // Ensure road is behind everything
    this.drivingBackground.add(this.drivingRoad);
    
    // Create road lines - proper center lines like a real road
    const lineWidth = this.config.driving.roadVisual?.lineWidth ?? 4;
    const lineHeight = this.config.driving.roadVisual?.lineHeight ?? 30;
    const lineGap = this.config.driving.roadVisual?.lineGap ?? 40;
    const centerLineY = gameHeight / 2 + (this.config.driving.roadVisual?.centerLineYOffset ?? 50);
    
    // Create center line segments
    for (let y = centerLineY; y < gameHeight; y += lineGap + lineHeight) {
      const line = this.add.rectangle(gameWidth / 2, y, lineWidth, lineHeight, lineColor);
      line.setDepth(this.config.driving.roadVisual?.lineDepth ?? -1000); // Ensure road lines are behind everything
      this.drivingRoadLines.push(line);
      this.drivingBackground.add(line);
    }
    
    // Create the car
    this.createDrivingCar();
    
    // Add driving background to the scene (not gameContentContainer) so it moves with camera independently
    this.add.existing(this.drivingBackground);
    
    console.log('Driving background created as separate container with depth -1000');
  }

  private createDrivingCar() {
    // Guard against multiple initialization
    if (this.drivingCar) {
      console.log('Driving car already exists, skipping creation');
      return;
    }
    
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    // Create car (simple rectangle for now)
    this.drivingCar = this.add.rectangle(gameWidth / 2, gameHeight - 80, 40, 20, 0xff0000);
    this.drivingCar.setOrigin(0.5);
    this.drivingCar.setDepth(-1000); // Ensure car is behind everything
    this.drivingBackground.add(this.drivingCar);
    
    // Initialize car position
    this.carX = gameWidth / 2;
    this.carSpeed = 0;
  }

  private createTutorialOverlay() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const magneticConfig = this.config.physics.magneticTarget;
    
    console.log('Creating tutorial overlay with dimensions:', gameWidth, gameHeight);
    
    // Create tutorial overlay container
    this.tutorialOverlay = this.add.container(0, 0);
    this.tutorialOverlay.setDepth(50000); // Above everything
    
    // Create 20% transparent black overlay covering the screen
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.5).fillRect(0, 0, gameWidth, gameHeight);
    this.tutorialOverlay.add(overlay);
    
    // Create circular mask for cutout
    const maskGraphics = this.make.graphics();
    
    // Store reference to mask graphics for updates
    this.tutorialMaskGraphics = maskGraphics;
    
    // Fill the mask with white (this will be the cutout area)
    maskGraphics.fillStyle(0xffffff);
    
    // Position the first cutout at the magnetic target location
    const targetX = magneticConfig.x;
    const targetY = magneticConfig.y;
    const targetHoleRadius = magneticConfig.radius * 1.2; // 20% larger than magnetic target
    
    maskGraphics.beginPath();
    maskGraphics.arc(targetX, targetY, targetHoleRadius, 0, Math.PI * 2);
    maskGraphics.closePath();
    maskGraphics.fill();
    
    // Position the second cutout at the keys location
    const keysX = this.frontseatKeys?.gameObject?.x || magneticConfig.x;
    const keysY = this.frontseatKeys?.gameObject?.y || magneticConfig.y;
    const keysHoleRadius = 25; // Fixed size for keys cutout
    
    maskGraphics.beginPath();
    maskGraphics.arc(keysX, keysY, keysHoleRadius, 0, Math.PI * 2);
    maskGraphics.closePath();
    maskGraphics.fill();
    
    // Create BitmapMask with inverted alpha (white areas become cutouts)
    const mask = new Phaser.Display.Masks.BitmapMask(this, maskGraphics);
    mask.invertAlpha = true; // This makes white areas transparent (cutouts)
    
    // Apply the mask to the overlay
    overlay.setMask(mask);
    
    // Initially hide the tutorial overlay - it will be shown when conditions are met
    this.tutorialOverlay.setVisible(false);
    
    //console.log('Transparent overlay with circular cutout created, initially hidden');
  }

  private updateTutorialOverlay() {
    if (!this.tutorialOverlay) {
      //console.log('Tutorial overlay not found');
      return;
    }
    
    // Show simple grey overlay when keys are not snapped to magnetic target
    const shouldShowTutorial = !this.keysConstraint;
    
    //console.log('Keys constraint:', this.keysConstraint);
    //console.log('Should show tutorial:', shouldShowTutorial);
    
    this.tutorialOverlay.setVisible(shouldShowTutorial);
    
    //console.log('Tutorial overlay visibility:', shouldShowTutorial ? 'shown' : 'hidden');
  }

  private updateTutorialMask() {
    if (!this.tutorialOverlay || !this.frontseatKeys?.gameObject) {
      console.log('Cannot update mask - overlay or keys not found');
      return;
    }
    
    if (!this.tutorialMaskGraphics) {
      //console.log('Tutorial mask graphics not found');
      return;
    }
    
    const magneticConfig = this.config.physics.magneticTarget;
    
    //console.log('Updating tutorial mask with keys at:', this.frontseatKeys.gameObject.x, this.frontseatKeys.gameObject.y);
    
    // Clear and redraw the mask with updated positions
    this.tutorialMaskGraphics.clear();
    
    // Fill the mask with white (this will be the cutout area)
    this.tutorialMaskGraphics.fillStyle(0xffffff);
    
    // Position the first cutout at the magnetic target location
    const targetX = magneticConfig.x;
    const targetY = magneticConfig.y;
    const targetHoleRadius = magneticConfig.radius * 1.2; // 20% larger than magnetic target
    
    this.tutorialMaskGraphics.beginPath();
    this.tutorialMaskGraphics.arc(targetX, targetY, targetHoleRadius, 0, Math.PI * 2);
    this.tutorialMaskGraphics.closePath();
    this.tutorialMaskGraphics.fill();
    
    // Position the second cutout at the keys location
    const keysX = this.frontseatKeys.gameObject.x;
    const keysY = this.frontseatKeys.gameObject.y;
    const keysHoleRadius = 25; // Fixed size for keys cutout
    
    this.tutorialMaskGraphics.beginPath();
    this.tutorialMaskGraphics.arc(keysX, keysY, keysHoleRadius, 0, Math.PI * 2);
    this.tutorialMaskGraphics.closePath();
    this.tutorialMaskGraphics.fill();
    
    //console.log('Mask updated with two cutouts');
  }

  private createCrankTutorialOverlay() { this.overlaySystem.createCrankTutorialOverlay(); }

  private updateCrankTutorialOverlay() { this.overlaySystem.updateCrankTutorialOverlay(); }

  private updateCrankTutorialMask() { this.overlaySystem.updateCrankTutorialMask(); }

  private createIgnitionTutorialOverlay() { this.overlaySystem.createIgnitionTutorialOverlay(); }

  private updateIgnitionTutorialOverlay() { this.overlaySystem.updateIgnitionTutorialOverlay(); }

  private updateIgnitionTutorialMask() { this.overlaySystem.updateIgnitionTutorialMask(); }


  private handleDrivingSteeringInput(steeringValue: number) {
     // Only allow steering when speed crank is at 40% or higher
     const crankPercentage = this.getSpeedCrankPercentage();
     if (crankPercentage < 40) {
       console.log('Steering disabled - speed crank below 40%:', crankPercentage, 'carStarted:', this.carStarted);
       this.resetSteeringValue('crank below 40%');
       return;
     }
     
     // Also check car speed
     if (this.carSpeed < 0.01) {
       console.log('Steering disabled - car speed too low:', this.carSpeed, 'crank:', crankPercentage);
       this.resetSteeringValue('car speed too low');
       return;
     }
     
     // Only store steering value if all conditions are met
     console.log('Steering enabled - storing value:', steeringValue, 'speed:', this.carSpeed, 'crank:', crankPercentage);
     this.currentSteeringValue = steeringValue;
     console.log('Current steering value set to:', this.currentSteeringValue);
     
     // Convert steering wheel value (-100 to 100) to steering direction
     const normalizedValue = steeringValue / 100; // Convert to -1 to 1 range
     
     //console.log('Driving steering input:', normalizedValue);
     
     if (normalizedValue < -0.1) {
       console.log('Driving LEFT:', Math.abs(normalizedValue));
     } else if (normalizedValue > 0.1) {
       console.log('Driving RIGHT:', normalizedValue);
     } else {
       console.log('Driving CENTER');
     }
   }

   private updateRoadLines() {
     // Move road lines down to create forward motion effect
     this.drivingRoadLines.forEach((line) => {
       line.y += this.carSpeed;
       
       // Reset line position when it goes off screen
       if (line.y > this.cameras.main.height) {
         line.y = this.cameras.main.height / 2 + 50;
       }
     });
   }


  // ===== DRIVING SYSTEM =====
  private startDriving() {
    this.drivingSystem.startDriving();
  }

  private stopDriving() {
    this.drivingSystem.stopDriving();
  }

  // ===== OBSTACLE SYSTEM =====
  private createObstacle(type: string) {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    let obstacle: Phaser.GameObjects.Rectangle;
    
    if (type === this.obstacleTypes.POTHOLE) {
      // Pothole: configured width/height percentages, random X between min/max, slow speed
      const width = gameWidth * this.config.obstacles.pothole.width;
      const height = gameHeight * this.config.obstacles.pothole.height;
      const minPos = this.config.obstacles.pothole.minPos;
      const maxPos = this.config.obstacles.pothole.maxPos;
      const spawnPos = Phaser.Math.FloatBetween(minPos, maxPos);
      console.log('Pothole spawn range:', minPos, maxPos, 'chosen:', spawnPos);
      const x = gameWidth * spawnPos; // Random horizontal between min/max
      const y = gameHeight * this.config.obstacles.pothole.spawnY; // Spawn lower on screen
      
      obstacle = this.add.rectangle(x, y, width, height, parseInt(this.config.obstacles.pothole.color));
      obstacle.setOrigin(0.5, 0);
      
      // Add obstacle properties
      (obstacle as any).type = type;
      (obstacle as any).speed = this.config.obstacles.pothole.speed;
      (obstacle as any).isBad = true;
      
    } else if (type === this.obstacleTypes.EXIT) {
      // Exit: configured size, always on right side, very slow speed
      const width = this.config.obstacles.exit.width;
      const height = this.config.obstacles.exit.height;
      const x = gameWidth * this.config.obstacles.exit.position; // Right side of road
      const y = gameHeight * this.config.obstacles.exit.spawnY; // Spawn lower on screen
      
      obstacle = this.add.rectangle(x, y, width, height, parseInt(this.config.obstacles.exit.color));
      obstacle.setOrigin(0.5, 0);
      
      // Add obstacle properties
      (obstacle as any).type = type;
      (obstacle as any).speed = this.config.obstacles.exit.speed;
      (obstacle as any).isBad = false;
      
    } else {
      return; // Unknown obstacle type
    }
    
    // Add to driving background and obstacles array
    this.drivingBackground.add(obstacle);
    this.obstacles.push(obstacle);
    
    // Make obstacles persist during camera movement (don't move with camera)
    obstacle.setScrollFactor(0);
    
    console.log(`Created ${type} obstacle at x:${obstacle.x}, y:${obstacle.y}`);
  }

  private updateObstacles() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Only move obstacles if player is driving (crank 40%+)
    const minCrankForObstacleMovement = this.config.driving?.steering?.minCrankPercentForSteering ?? 40;
    if (this.currentSpeedCrankPercentage < minCrankForObstacleMovement) {
      return;
    }
    
    this.obstacles.forEach((obstacle, index) => {
      const baseSpeed = (obstacle as any).speed || 1;
      // Scale obstacle speed by car speed (0 speed = 0 obstacle movement)
      const scaledSpeed = baseSpeed * (this.carSpeed || 0);
      obstacle.y += scaledSpeed;
      
      // Check for collision with car
      if (this.checkCollisionWithCar(obstacle)) {
        this.handleObstacleCollision(obstacle);
        obstacle.destroy();
        this.obstacles.splice(index, 1);
        return;
      }
      
      // Remove obstacles that have moved off screen
      if (obstacle.y > this.cameras.main.height) {
        obstacle.destroy();
        this.obstacles.splice(index, 1);
      }
    });
  }

  private startObstacleSpawning() {
    // Guard against multiple spawners
    if (this.obstacleSpawnerActive) {
      console.log('Obstacle spawner already active, skipping');
      return;
    }
    
    this.obstacleSpawnerActive = true;
    console.log('Starting obstacle spawner');
    
    // Single spawner that randomly chooses obstacle type and delay
    const spawnNext = () => {
      if (!this.drivingMode || this.drivingPaused) {
        // Try again soon when driving resumes
        this.time.delayedCall(500, spawnNext, undefined, this);
        return;
      }
      const minDelay = this.config.obstacles.spawner?.minDelayMs ?? 5000;
      const maxDelay = this.config.obstacles.spawner?.maxDelayMs ?? 12000;
      const potholeProb = this.config.obstacles.spawner?.potholeProbability ?? 0.8;
      const isPothole = Math.random() < potholeProb;
      const type = isPothole ? this.obstacleTypes.POTHOLE : this.obstacleTypes.EXIT;
      this.createObstacle(type);
      const nextDelay = Phaser.Math.Between(minDelay, maxDelay);
      this.time.delayedCall(nextDelay, spawnNext, undefined, this);
    };
    spawnNext();
  }

  private stopObstacleSpawning() {
    // Stop spawning new obstacles but keep existing ones on screen
    this.time.removeAllEvents();
    this.obstacleSpawnerActive = false;
    
    console.log('Obstacle spawning stopped - existing obstacles remain on screen');
  }

  // ===== COLLISION DETECTION =====
  private checkCollisionWithCar(obstacle: Phaser.GameObjects.Rectangle): boolean {
    if (!this.drivingCar) return false;
    
    // Get car bounds
    const carBounds = this.drivingCar.getBounds();
    
    // Get obstacle bounds
    const obstacleBounds = obstacle.getBounds();
    
    // Check if bounds overlap
    return Phaser.Geom.Rectangle.Overlaps(carBounds, obstacleBounds);
  }

  private handleObstacleCollision(obstacle: Phaser.GameObjects.Rectangle) {
    const obstacleType = (obstacle as any).type;
    console.log(`Car collided with ${obstacleType}!`);
    
    // Cancel any existing collision timer
    if (this.collisionTimer) {
      this.collisionTimer.remove();
      this.collisionTimer = null;
    }
    
    // Set pending collision type and auto-resume flag
    this.pendingCollisionType = obstacleType;
    this.shouldAutoResumeAfterCollision = true;
    
    // Start configured delay timer before showing menu
    this.collisionTimer = this.time.addEvent({
      delay: this.config.collision.menuDelay,
      callback: () => {
        this.showObstacleMenu(this.pendingCollisionType!);
        this.pendingCollisionType = null;
        this.collisionTimer = null;
      },
      callbackScope: this
    });
  }

  private showObstacleMenu(obstacleType: string) {
    // Pause driving when showing menu (don't stop completely)
    this.pauseDriving();
    
    console.log(`Showing ${obstacleType} menu`);
    
    // Show obstacle menu via MenuScene
    this.menuBridge.showObstacleMenu(obstacleType);
  }

  private onTurnKey() {
    console.log('Turn Key clicked! Car is now started.');
    this.carStarted = true;
    
    // Start countdown timer if it hasn't started yet
    if (!this.countdownStarted) {
      this.countdownStarted = true;
      console.log('Countdown timer started!');
    }
    
    // Start driving mode when car is started
    if (!this.drivingMode) {
      this.startDriving();
      console.log('Driving mode started with car ignition');
    }
    
    this.updateNavigationButtonVisibility();
    
    // Update crank tutorial overlay when car starts
    this.overlaySystem.updateCrankTutorialOverlay();
  }

  private onIgnitionMenuShown() {
    console.log('Ignition menu shown - updating overlay');
    this.ignitionMenuShown = true;
    console.log('ignitionMenuShown set to:', this.ignitionMenuShown);
    this.overlaySystem.updateIgnitionTutorialOverlay();
  }

  private onIgnitionMenuHidden() {
    console.log('Ignition menu hidden - updating overlay');
    this.ignitionMenuShown = false;
    console.log('ignitionMenuShown set to:', this.ignitionMenuShown);
    this.updateIgnitionTutorialOverlay();
  }

  // ===== KEY MANAGEMENT SYSTEM =====
  /**
   * Handles the complete key removal process - consolidates all key removal logic
   */
  private handleKeyRemoval(reason: string = 'unknown') {
    // Delegate to KeySystem (behavior unchanged)
    this.keySystem.handleKeyRemoval(reason);
  }

  /**
   * Resets all car-related state when keys are removed
   */
  private resetCarState() {
    // Reset car started state
    this.carStarted = false;
    
    // Stop driving mode
    if (this.drivingMode) {
      this.stopDriving();
      console.log('Driving mode stopped due to key removal');
    }
    
    // Reset speed crank to 0
    if (this.resetSpeedCrank) {
      this.resetSpeedCrank();
    }
    
    // Reset steering value
    this.resetSteeringValue('key removal');
  }

  /**
   * Resets steering value and logs the reason
   */
  private resetSteeringValue(reason: string) {
    this.currentSteeringValue = 0;
    console.log(`Steering reset due to ${reason}`);
  }

  /**
   * Creates navigation buttons (frontseat/backseat) and their titles
   */
  private createNavigationButtons(gameWidth: number, gameHeight: number) {
    // Create Frontseat content (left side)
    const frontseatCenterX = gameWidth / 2;
    const frontseatCenterY = gameHeight / 2;
    
    // Frontseat button
    const frontseatButton = this.add.graphics();
    this.frontseatButton = frontseatButton; // Store reference
    frontseatButton.fillStyle(0x4444ff, 0.7);
    frontseatButton.fillRect(frontseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.2);
    frontseatButton.lineStyle(2, 0xffffff, 1);
    frontseatButton.strokeRect(frontseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.2);
    frontseatButton.setInteractive(new Phaser.Geom.Rectangle(frontseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.2), Phaser.Geom.Rectangle.Contains);
    frontseatButton.on('pointerup', () => {
      if (this.gameStarted) {
        // Don't allow switching to backseat if keys are not in ignition
        if (!this.keysConstraint) {
          console.log('Cannot switch to backseat - keys not in ignition!');
          return;
        }
        this.switchToBackseat();
      }
    });
    
    // Frontseat title using config
    const frontseatConfig = this.config.visual.seatTitles.frontseat;
    const frontseatTitleX = gameWidth * frontseatConfig.position.x;
    const frontseatTitleY = gameHeight * frontseatConfig.position.y + frontseatConfig.position.offsetY;
    
    const frontseatTitle = this.add.text(frontseatTitleX, frontseatTitleY, frontseatConfig.text, {
      fontSize: frontseatConfig.fontSize,
      color: frontseatConfig.color,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    frontseatTitle.setDepth(frontseatConfig.depth);
    
    // Create Backseat content (right side)
    const backseatCenterX = gameWidth + (gameWidth / 2);
    const backseatCenterY = gameHeight / 2;
    
    // Backseat button
    const backseatButton = this.add.graphics();
    this.backseatButton = backseatButton; // Store reference
    backseatButton.fillStyle(0x44ff44, 0.7);
    backseatButton.fillRect(backseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.1);
    backseatButton.lineStyle(2, 0xffffff, 1);
    backseatButton.strokeRect(backseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.1);
    backseatButton.setInteractive(new Phaser.Geom.Rectangle(backseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.1), Phaser.Geom.Rectangle.Contains);
    backseatButton.on('pointerdown', () => {
      if (this.gameStarted) {
        this.switchToFrontseat();
      }
    });
    
    // Backseat title using config
    const backseatConfig = this.config.visual.seatTitles.backseat;
    const backseatTitleX = gameWidth * backseatConfig.position.x;
    const backseatTitleY = gameHeight * backseatConfig.position.y + backseatConfig.position.offsetY;
    
    const backseatTitle = this.add.text(backseatTitleX, backseatTitleY, backseatConfig.text, {
      fontSize: backseatConfig.fontSize,
      color: backseatConfig.color,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    backseatTitle.setDepth(backseatConfig.depth);
    
    // Add all elements to the container
    this.gameContentContainer.add([frontseatButton, frontseatTitle, backseatButton, backseatTitle]);
  }

  private onRemoveKeys() {
    this.handleKeyRemoval('menu button');
  }

  private updateNavigationButtonVisibility() { this.navigationUI.updateVisibility(); }

  public resumeAfterCollision(): void {
    // Resume driving after an obstacle/collision menu
    this.drivingSystem.resumeDriving();
  }

  public takeExit(): void {
    // Pause driving and handle exit flow
    this.pauseDriving();
    // If there is a dedicated exit menu, show it; otherwise reuse obstacle menu path
    this.showObstacleMenu(this.obstacleTypes.EXIT);
  }
}

