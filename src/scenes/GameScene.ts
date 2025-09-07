import Phaser from 'phaser';
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
        this.scene.matter.body.setVelocity(this.gameObject.body, { x: velocityX * 0.5, y: velocityY * 0.5 });
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
        this.scene.matter.body.setVelocity(this.gameObject.body, { x: velocityX * 0.5, y: velocityY * 0.5 });
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
      dragStartX = pointer.x;
      dragStartY = pointer.y;
      lastPointerX = pointer.x;
      lastPointerY = pointer.y;
      this.gameObject.setFillStyle(dragColor);
      (this.scene as any).isDraggingObject = true;
      
      // Break constraint if Keys is snapped to magnetic target
      if ((this.scene as any).keysConstraint) {
        console.log('Breaking constraint - Keys being dragged away');
        (this.scene as any).matter.world.remove((this.scene as any).keysConstraint);
        (this.scene as any).keysConstraint = null;
        
        // Reset magnetic target color
        if ((this.scene as any).magneticTarget) {
          const magneticConfig = (this.scene as any).config.physics.magneticTarget;
          (this.scene as any).magneticTarget.setFillStyle(parseInt(magneticConfig.color.replace('0x', ''), 16));
        }
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
      this.gameObject.setFillStyle(originalColor);
      (this.scene as any).isDraggingObject = false;
      
      // Re-enable physics and apply momentum
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = false;
        // Apply velocity as momentum
        this.scene.matter.body.setVelocity(this.gameObject.body, { x: velocityX * 0.5, y: velocityY * 0.5 });
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
   private gameTime: number = 99; // Starting time
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
   private position: number = 50; // Position from 0-100%, starts at center (50%)
     private money: number = 108; // Starting money: $108
  private health: number = 10; // Car health: 1-10, starts at max (10)
  private playerSkill: number = 0; // Player skill percentage: 0-100%
  private difficulty: number = 0; // Difficulty percentage: 0-100%
  private momentum: number = 0; // Momentum percentage: 0-100%
  private plotA: number = 0; // Plot A percentage: 0-100%
  private plotB: number = 0; // Plot B percentage: 0-100%
  private plotC: number = 0; // Plot C percentage: 0-100%
  private plotAEnum: string = 'intro'; // Plot A enumeration
  private plotBEnum: string = 'intro'; // Plot B enumeration
  private plotCEnum: string = 'intro'; // Plot C enumeration
   private knobValue: number = 0; // Reactive knob value (-100 to 100), starts at neutral (0)
     private frontseatPhysicsContainer!: Phaser.GameObjects.Container;
  private backseatPhysicsContainer!: Phaser.GameObjects.Container;
  private frontseatDebugBorder!: Phaser.GameObjects.Graphics;
  private backseatDebugBorder!: Phaser.GameObjects.Graphics;
  
  // Physics object data types
  private frontseatTrash!: Trash;
  private backseatItem!: Item;
  private frontseatKeys!: Keys;
  private magneticTarget!: Phaser.GameObjects.Arc;
  private keysConstraint!: Matter.Constraint | null; // Constraint for snapping Keys to target
   private frontseatDragDial!: any; // RexUI drag dial
     private drivingMode: boolean = false; // Track if driving mode is active
  private shouldAutoRestartDriving: boolean = false; // Track if driving should restart on resume
  private drivingPaused: boolean = false; // Track if driving is paused (for collision menus)
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
    // Load configuration first
    const configLoader = ConfigLoader.getInstance();
    this.config = await configLoader.loadConfig(this);
    
    // Initialize save manager
    this.saveManager = SaveManager.getInstance();
    
    // Initialize game state with config values
    this.gameTime = this.config.gameTime.initial;
    this.money = this.config.playerStats.initialMoney;
    this.health = this.config.playerStats.initialHealth;
    this.playerSkill = this.config.playerStats.initialSkill;
    this.difficulty = this.config.playerStats.initialDifficulty;
    this.momentum = this.config.playerStats.initialMomentum;
    this.plotA = this.config.playerStats.initialPlotA;
    this.plotB = this.config.playerStats.initialPlotB;
    this.plotC = this.config.playerStats.initialPlotC;
    
    // Add game overlay text (always visible on top)
    const gameText = this.add.text(10, 40, 'GAME LAYER', {
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    gameText.setScrollFactor(0);
    gameText.setDepth(10000);

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
    
    // Frame-by-frame updates
    this.updatePosition();
   }

  private checkPhysicsObjectBoundaries() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const bufferZone = 100; // Buffer zone before teleporting
    
    // Check frontseat Trash object
    if (this.frontseatTrash && this.frontseatTrash.gameObject && this.frontseatTrash.gameObject.body) {
      const trashX = this.frontseatTrash.gameObject.x;
      const trashY = this.frontseatTrash.gameObject.y;
      
      // Only teleport if trash is significantly outside frontseat bounds (with buffer)
      if (trashX < -bufferZone || trashX > gameWidth + bufferZone || 
          trashY < -bufferZone || trashY > gameHeight + bufferZone) {
        console.log(`Trash significantly escaped frontseat bounds at (${trashX}, ${trashY}), teleporting back`);
        
        // Teleport back to center of frontseat area
        const newX = Math.max(50, Math.min(gameWidth - 50, trashX));
        const newY = Math.max(50, Math.min(gameHeight - 50, trashY));
        
        this.frontseatTrash.gameObject.x = newX;
        this.frontseatTrash.gameObject.y = newY;
        
        // Update physics body position
        this.matter.body.setPosition(this.frontseatTrash.gameObject.body, { x: newX, y: newY });
        
        // Stop any velocity to prevent immediate re-escape
        this.matter.body.setVelocity(this.frontseatTrash.gameObject.body, { x: 0, y: 0 });
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
        
        // Teleport back to center of frontseat area
        const newX = Math.max(50, Math.min(gameWidth - 50, keysX));
        const newY = Math.max(50, Math.min(gameHeight - 50, keysY));
        
        this.frontseatKeys.gameObject.x = newX;
        this.frontseatKeys.gameObject.y = newY;
        
        // Update physics body position
        this.matter.body.setPosition(this.frontseatKeys.gameObject.body, { x: newX, y: newY });
        
        // Stop any velocity to prevent immediate re-escape
        this.matter.body.setVelocity(this.frontseatKeys.gameObject.body, { x: 0, y: 0 });
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
        
        // Teleport back to center of backseat area
        const newX = Math.max(gameWidth + 50, Math.min(gameWidth * 2 - 50, itemX));
        const newY = Math.max(50, Math.min(gameHeight - 50, itemY));
        
        this.backseatItem.gameObject.x = newX;
        this.backseatItem.gameObject.y = newY;
        
        // Update physics body position
        this.matter.body.setPosition(this.backseatItem.gameObject.body, { x: newX, y: newY });
        
        // Stop any velocity to prevent immediate re-escape
        this.matter.body.setVelocity(this.backseatItem.gameObject.body, { x: 0, y: 0 });
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
     
     console.log('Game camera set up with content container');
   }

     private createGameContent() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Create a container to hold all game content that we can move as one unit
     this.gameContentContainer = this.add.container(0, 0);
     
     // Create Frontseat content (left side)
     const frontseatCenterX = gameWidth / 2;
     const frontseatCenterY = gameHeight / 2;
     
     // Frontseat button
     const frontseatButton = this.add.graphics();
     frontseatButton.fillStyle(0x4444ff, 0.7);
     frontseatButton.fillRect(frontseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.2);
     frontseatButton.lineStyle(2, 0xffffff, 1);
     frontseatButton.strokeRect(frontseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.2);
     frontseatButton.setInteractive(new Phaser.Geom.Rectangle(frontseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.2), Phaser.Geom.Rectangle.Contains);
     frontseatButton.on('pointerup', () => {
       if (this.gameStarted) {
         this.switchToBackseat();
       }
     });
     
     // Frontseat title
     const frontseatTitle = this.add.text(frontseatCenterX, frontseatCenterY - 30, 'FRONT SEAT', {
       fontSize: '36px',
       color: '#ffffff',
       fontStyle: 'bold'
     }).setOrigin(0.5);
     
     // Create Backseat content (right side)
     const backseatCenterX = gameWidth + (gameWidth / 2);
     const backseatCenterY = gameHeight / 2;
     
     // Backseat button
     const backseatButton = this.add.graphics();
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
     
     // Backseat title
     const backseatTitle = this.add.text(backseatCenterX, backseatCenterY - 30, 'BACK SEAT', {
       fontSize: '36px',
       color: '#ffffff',
       fontStyle: 'bold'
     }).setOrigin(0.5);
     
     
           // Create overlay content
      // Map overlay (left side, positioned below frontseat)
      const mapOverlay = this.add.text(frontseatCenterX, frontseatCenterY + 320, 'MAP OVERLAY', {
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
             // Map toggle button (small button at top of map overlay)
       const mapToggleButton = this.add.graphics();
       mapToggleButton.fillStyle(0x888888, 0.7);
       mapToggleButton.fillRect(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40);
       mapToggleButton.lineStyle(2, 0xffffff, 1);
       mapToggleButton.strokeRect(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40);
       mapToggleButton.setInteractive(new Phaser.Geom.Rectangle(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40), Phaser.Geom.Rectangle.Contains);
       mapToggleButton.on('pointerdown', () => {
         if (this.gameStarted) {
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
       mapToggleText.setName('mapToggleText');
      
      // Inventory overlay (right side, positioned below backseat)
      const inventoryOverlay = this.add.text(backseatCenterX, backseatCenterY + 320, 'INVENTORY OVERLAY', {
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
             // Inventory toggle button (small button at top of inventory overlay)
       const inventoryToggleButton = this.add.graphics();
       inventoryToggleButton.fillStyle(0x888888, 0.7);
       inventoryToggleButton.fillRect(backseatCenterX - 60, backseatCenterY + 200, 120, 40);
       inventoryToggleButton.lineStyle(2, 0xffffff, 1);
       inventoryToggleButton.strokeRect(backseatCenterX - 60, backseatCenterY + 200, 120, 40);
       inventoryToggleButton.setInteractive(new Phaser.Geom.Rectangle(backseatCenterX - 60, backseatCenterY + 200, 120, 40), Phaser.Geom.Rectangle.Contains);
       inventoryToggleButton.on('pointerdown', () => {
         if (this.gameStarted) {
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
       inventoryToggleText.setName('inventoryToggleText');
      
      // Add all content to the container
      this.gameContentContainer.add([frontseatButton, frontseatTitle, backseatButton, backseatTitle, mapOverlay, mapToggleButton, mapToggleText, inventoryOverlay, inventoryToggleButton, inventoryToggleText]);
      
           // Create countdown timer text
     this.createCountdownTimer();
     
     // Create stops and progress text
     this.createStopsAndProgressText();
     
    // Create drag dial in front seat area
    this.createFrontseatDragDial();
    
    // Create driving background (always visible behind game content)
    this.createDrivingBackground();
   }

   private createCountdownTimer() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Position countdown text at center, 15% of screen height below frontseat button
     const countdownX = gameWidth / 2;
     const countdownY = (gameHeight * 0.2) + (gameHeight * 0.08); // 20% (button) + 15% below
     
         this.countdownText = this.add.text(countdownX, countdownY, this.gameTime.toString(), {
      fontSize: this.config.ui.countdown.fontSize,
      color: this.config.ui.countdown.color,
      fontStyle: 'bold',
      backgroundColor: this.config.ui.countdown.backgroundColor,
      padding: this.config.ui.countdown.padding
    }).setOrigin(0.5);
     
     // Make countdown text an overlay that doesn't move with camera
     this.countdownText.setScrollFactor(0);
     this.countdownText.setDepth(10000); // High depth to ensure it's always on top
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
     knob.fillStyle(0x666666);
     knob.fillCircle(0, 0, knobRadius);
     knob.lineStyle(3, 0xffffff, 1);
     knob.strokeCircle(0, 0, knobRadius);
     
     // Add a pointer to show the value
     knob.fillStyle(0x00ff00);
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
     });
     
     // Add the knob to the game content container so it moves with the content
     this.gameContentContainer.add(knob);
     knob.setDepth(1000); // Ensure it's on top
     
     // Don't disable initially - we'll control it through event handlers
     
     console.log('Front seat steering wheel created at position:', dialX, dialY);
   }

   private createStopsAndProgressText() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Position stops text below countdown timer
     const stopsX = gameWidth / 2;
     const stopsY = (gameHeight * 0.2) + (gameHeight * 0.16); // Below countdown timer
     
     this.stopsText = this.add.text(stopsX, stopsY, 'Stops: 0', {
       fontSize: '24px',
       color: '#ffffff',
       fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 8, y: 4 }
     }).setOrigin(0.5);
     
     // Position progress text below stops
     const progressX = gameWidth / 2;
     const progressY = (gameHeight * 0.2) + (gameHeight * 0.24); // Below stops
     
     this.progressText = this.add.text(progressX, progressY, 'Progress: 0%', {
       fontSize: '24px',
       color: '#ffffff',
       fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 8, y: 4 }
     }).setOrigin(0.5);
     
     // Position text below progress
     const positionX = gameWidth / 2;
     const positionY = (gameHeight * 0.2) + (gameHeight * 0.32); // Below progress
     
     this.positionText = this.add.text(positionX, positionY, 'Position: 50%', {
       fontSize: '24px',
       color: '#ffffff',
       fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 8, y: 4 }
     }).setOrigin(0.5);
     
     // Add all texts to the container so they move with the content
     this.gameContentContainer.add([this.stopsText, this.progressText, this.positionText]);
     
     // Set depth to ensure they're on top
     this.stopsText.setDepth(1000);
     this.progressText.setDepth(1000);
     this.positionText.setDepth(1000);
     
         // Create player values text in bottom left (visible to player)
    this.createMoneyAndHealthText();
    
    // Create manager values text in top right (hidden/internal values for game management)
    this.createManagerValuesText();
   }

   private createMoneyAndHealthText() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Position money text in bottom left
     const moneyX = 20;
     const moneyY = gameHeight - 40;
     
         this.moneyText = this.add.text(moneyX, moneyY, `$${this.money}`, {
      fontSize: this.config.ui.money.fontSize,
      color: this.config.ui.money.color,
      fontStyle: 'bold',
      backgroundColor: this.config.ui.money.backgroundColor,
      padding: this.config.ui.money.padding
    }).setOrigin(0, 0.5);
    
    // Position health text next to money
    const healthX = moneyX + 120;
    const healthY = moneyY;
    
    this.healthText = this.add.text(healthX, healthY, `Health: ${this.health * 10}%`, {
      fontSize: this.config.ui.health.fontSize,
      color: this.config.ui.health.color,
      fontStyle: 'bold',
      backgroundColor: this.config.ui.health.backgroundColor,
      padding: this.config.ui.health.padding
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
    
    // Create the magnetic target circle
    this.magneticTarget = this.add.circle(
      magneticConfig.x,
      magneticConfig.y,
      magneticConfig.radius,
      parseInt(magneticConfig.color.replace('0x', ''), 16)
    );
    
    // Make it a static sensor body (no collision, no gravity, doesn't move)
    this.matter.add.gameObject(this.magneticTarget, {
      shape: 'circle',
      isStatic: true,
      isSensor: true,  // No collision - Keys can pass through
      render: { visible: true }
    });
    
    // Add to frontseat physics container so it moves with camera
    this.frontseatPhysicsContainer.add(this.magneticTarget);
    
    // Set scroll factor to move horizontally with physics containers but stay vertically fixed
    this.magneticTarget.setScrollFactor(1, 0);
    
    // Set depth to be visible but not interfere with UI, behind Keys
    this.magneticTarget.setDepth(999);
    
    console.log('Magnetic target created at position:', magneticConfig.x, magneticConfig.y);
  }

   private handleSteeringInput(steeringValue: number) {
     // Convert steering wheel value (-100 to 100) to steering direction
     // Negative values = turn left, positive values = turn right
     const normalizedValue = steeringValue / 100; // Convert to -1 to 1 range
     
     console.log('Steering input:', normalizedValue);
     
     // If in driving mode, handle driving steering
     if (this.drivingMode) {
       this.handleDrivingSteeringInput(steeringValue);
       return;
     }
     
     // Here you can add steering logic for your game
     // For example:
     // - Move the car left/right based on steering value
     // - Adjust camera angle
     // - Update physics simulation
     
     // For now, we'll just log the steering input
     if (normalizedValue < -0.1) {
       console.log('Steering LEFT:', Math.abs(normalizedValue));
     } else if (normalizedValue > 0.1) {
       console.log('Steering RIGHT:', normalizedValue);
     } else {
       console.log('Steering CENTER');
     }
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
    
    // Don't add to physics container - keep Keys separate for proper depth ordering
    // Instead, manually sync position with container movement in update loop
    
    // Set the scroll factor to move horizontally with physics containers but stay vertically fixed
    this.frontseatKeys.gameObject.setScrollFactor(1, 0);
    
    // Set depth to be visible but not interfere with UI, and in front of magnetic target
    this.frontseatKeys.gameObject.setDepth(1001);
    
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

    // ===== SWIPE CONTROLS =====
  private setupSwipeControls() {
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Don't start swipe tracking if knob is being used or dragging an object
      if (this.isKnobActive || this.isDraggingObject) return;
      
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
      
      // Only start swipe tracking if we're not clicking on interactive objects
      startX = pointer.x;
      startY = pointer.y;
      startTime = Date.now();
      console.log('Swipe tracking started');
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.gameStarted || this.isKnobActive || this.isDraggingObject) return;
      
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
    const appScene = this.scene.get('AppScene');
    if (appScene && appScene.scene.isActive()) {
      // Call the togglePauseMenu method if not already paused
      if (!(appScene as any).isPaused) {
        (appScene as any).togglePauseMenu();
      }
    }
  }

  private triggerAppSceneResume() {
    // Get the AppScene and trigger its resume method
    const appScene = this.scene.get('AppScene');
    if (appScene && appScene.scene.isActive()) {
      // Call the togglePauseMenu method if currently paused
      if ((appScene as any).isPaused) {
        (appScene as any).togglePauseMenu();
      }
    }
  }

         private switchToBackseat() {
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
      this.healthText.setText(`Health: ${this.health * 10}%`);
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

  private applyMagneticAttraction() {
    if (!this.frontseatKeys || !this.frontseatKeys.gameObject || !this.frontseatKeys.gameObject.body) return;
    if (!this.magneticTarget || !this.magneticTarget.body) return;
    
    const magneticConfig = this.config.physics.magneticTarget;
    const keysBody = this.frontseatKeys.gameObject.body;
    const targetBody = this.magneticTarget.body;
    
    // Get positions using Phaser Matter API
    const keysPos = { x: keysBody.position.x, y: keysBody.position.y };
    const targetPos = { x: targetBody.position.x, y: targetBody.position.y };
    
    // Calculate distance
    const dx = targetPos.x - keysPos.x;
    const dy = targetPos.y - keysPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Snap threshold - when Keys gets close enough, create a constraint
    const snapThreshold = 20; // Distance at which Keys snaps to center
    
    if (distance <= snapThreshold && !this.keysConstraint) {
      // Create constraint to snap Keys to the center of magnetic target
      console.log('Keys snapped to magnetic target!');
      this.keysConstraint = this.matter.add.constraint(keysBody, targetBody, 0, 0.1, {
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        stiffness: 1,
        damping: 0.1
      });
      
      // Visual feedback: make target glow bright when snapped
      this.magneticTarget.setFillStyle(parseInt('0x88ff88', 16)); // Very bright green
      
    } else if (distance > magneticConfig.magneticRange && this.keysConstraint) {
      // Remove constraint if Keys is dragged too far away
      console.log('Keys released from magnetic target');
      this.matter.world.remove(this.keysConstraint);
      this.keysConstraint = null;
      
      // Reset target color
      this.magneticTarget.setFillStyle(parseInt(magneticConfig.color.replace('0x', ''), 16));
      
    } else if (distance <= magneticConfig.magneticRange && distance > snapThreshold && !this.keysConstraint) {
      // Apply magnetic attraction when close but not snapped
      const attractionForce = magneticConfig.magneticStrength * (1 - distance / magneticConfig.magneticRange);
      
      // Apply force towards target
      const forceX = (dx / distance) * attractionForce;
      const forceY = (dy / distance) * attractionForce;
      
      // Apply the force to the Keys object using Phaser Matter API
      this.matter.body.applyForce(keysBody, keysPos, { x: forceX, y: forceY });
      
      // Visual feedback: make target glow when Keys is close
      this.magneticTarget.setFillStyle(parseInt('0x44ff44', 16)); // Brighter green
      
    } else if (distance > magneticConfig.magneticRange) {
      // Reset target color when Keys is far away
      this.magneticTarget.setFillStyle(parseInt(magneticConfig.color.replace('0x', ''), 16));
    }
  }

  private updatePosition() {
    // Only update position if driving mode is active and not paused
    if (!this.drivingMode || this.drivingPaused) return;
     
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
     
     // Add progress if driving mode is active
     if (this.drivingMode) {
       this.updateProgress(this.progress + 1);
       console.log(`Progress increased to ${this.progress}% while driving`);
     }
   }

     private onStepEvent(stepNumber: number) {
    console.log(`GameScene received step event: ${stepNumber}`);
    this.stepCountdown();
    
    // Check if we should auto-resume driving after collision
    if (this.shouldAutoResumeAfterCollision && !this.drivingMode) {
      console.log('Auto-resuming driving after collision...');
      this.startDriving();
    }
  }

   private onGamePaused() {
     console.log('GameScene: Game paused - stopping driving visualization');
     if (this.drivingMode) {
       this.stopDriving();
       // Note: shouldAutoRestartDriving flag remains true
     }
   }

   private onGameResumed() {
     console.log('GameScene: Game resumed');
     // Auto-restart driving if it was active before pause
     if (this.shouldAutoRestartDriving && !this.drivingMode) {
       this.startDriving();
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
       this.progressText.setText(`Progress: ${this.progress}%`);
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

   // ===== SAVE SYSTEM =====
   public showSaveMenu() {
     // Show save menu via MenuScene
     const menuScene = this.scene.get('MenuScene');
     if (menuScene) {
       menuScene.events.emit('showSaveMenu');
       this.scene.bringToTop('MenuScene');
     }
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
       this.stopDriving();
     } else {
       this.startDriving();
     }
   }

   private startDriving() {
     this.drivingMode = true;
     this.shouldAutoRestartDriving = true; // Set flag to auto-restart on resume
     console.log('Starting driving...');
     
     // Reset car state
     this.carSpeed = 0;
     this.carX = this.cameras.main.width / 2;
     if (this.drivingCar) {
       this.drivingCar.setX(this.carX);
     }
     
     // Start forward movement timer
     this.startForwardMovementTimer();
     
         // Start neutral return timer
    this.startNeutralReturnTimer();
    
    // Start obstacle spawning
    this.startObstacleSpawning();
    
    // Update button text
    this.updateDrivingButtonText();
   }

   private stopDriving() {
     this.drivingMode = false;
     console.log('Stopping driving...');
     
     // Stop car movement
     this.carSpeed = 0;
     
     // Stop forward movement timer
     this.stopForwardMovementTimer();
     
         // Stop neutral return timer
    this.stopNeutralReturnTimer();
    
    // Stop obstacle spawning and clear obstacles
    this.stopObstacleSpawning();
    
    // Update button text
    this.updateDrivingButtonText();
     }

  private pauseDriving() {
    console.log('Pausing driving...');
    
    // Set paused flag
    this.drivingPaused = true;
    
    // Keep driving mode active but paused
    // Don't update button text - we're just pausing
  }

  private resumeDriving() {
    console.log('Resuming driving...');
    
    // Clear paused flag
    this.drivingPaused = false;
    
    // Reset auto-resume flag
    this.shouldAutoResumeAfterCollision = false;
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
     // Create a timer that updates forward movement every frame
     this.forwardMovementTimer = this.time.addEvent({
       delay: 16, // ~60 FPS
       callback: this.updateForwardMovement,
       callbackScope: this,
       loop: true
     });
   }

   private stopForwardMovementTimer() {
     if (this.forwardMovementTimer) {
       this.forwardMovementTimer.remove();
       this.forwardMovementTimer = null;
     }
   }

     private updateForwardMovement() {
    if (!this.drivingMode || this.drivingPaused) return;
     
         // Gradually increase car speed
    this.carSpeed = Math.min(this.carSpeed + this.config.driving.carSpeed.acceleration, this.config.driving.carSpeed.maxSpeed);
     
         // Move road lines to create forward motion effect
    this.updateRoadLines();
    
    // Update obstacles
    this.updateObstacles();
    
    // Update car position based on current steering value
    this.updateCarPosition();
   }

     private updateCarPosition() {
    if (!this.drivingMode || !this.drivingCar || this.drivingPaused) return;
     
         // Use the current steering value to update car position
    const normalizedValue = this.currentSteeringValue / 100;
    const steeringSensitivity = this.config.driving.steering.sensitivity;
     
     // Update car position based on steering
     this.carX += normalizedValue * steeringSensitivity;
     
     // Clamp car position to road boundaries
     const gameWidth = this.cameras.main.width;
     this.carX = Phaser.Math.Clamp(this.carX, 50, gameWidth - 50);
     
     // Update car visual position
     this.drivingCar.setX(this.carX);
   }

   private createDrivingBackground() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Create driving container that will move with the camera but stay behind UI
     this.drivingBackground = this.add.container(0, 0);
     this.drivingBackground.setDepth(-1000); // Behind UI elements but above other content
     
         // Create sky
    const sky = this.add.rectangle(0, 0, gameWidth, gameHeight / 2, 0x87CEEB);
    sky.setOrigin(0);
    sky.setDepth(-1000); // Ensure sky is behind UI
    this.drivingBackground.add(sky);
     
         // Create road
    this.drivingRoad = this.add.rectangle(0, gameHeight / 2, gameWidth, gameHeight / 2, 0x333333);
    this.drivingRoad.setOrigin(0);
    this.drivingRoad.setDepth(-1000); // Ensure road is behind UI
    this.drivingBackground.add(this.drivingRoad);
     
     // Create road lines - proper center lines like a real road
     const lineWidth = 4;
     const lineHeight = 30;
     const lineGap = 40;
     const centerLineY = gameHeight / 2 + 50;
     
         // Create center line segments
    for (let y = centerLineY; y < gameHeight; y += lineGap + lineHeight) {
      const line = this.add.rectangle(gameWidth / 2, y, lineWidth, lineHeight, 0xffffff);
      line.setDepth(-1000); // Ensure road lines are behind UI
      this.drivingRoadLines.push(line);
      this.drivingBackground.add(line);
    }
     
     // Create the car
     this.createDrivingCar();
     
     // Add driving background to the scene (not gameContentContainer) so it moves with camera independently
     this.add.existing(this.drivingBackground);
     
     console.log('Driving background created as separate container');
   }

   private createDrivingCar() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
         // Create car (simple rectangle for now)
    this.drivingCar = this.add.rectangle(gameWidth / 2, gameHeight - 80, 40, 20, 0xff0000);
    this.drivingCar.setOrigin(0.5);
    this.drivingCar.setDepth(-1000); // Ensure car is behind UI
    this.drivingBackground.add(this.drivingCar);
     
     // Initialize car position
     this.carX = gameWidth / 2;
     this.carSpeed = 0;
   }

   private handleDrivingSteeringInput(steeringValue: number) {
     // Store the current steering value for continuous updates
     this.currentSteeringValue = steeringValue;
     
     // Convert steering wheel value (-100 to 100) to steering direction
     const normalizedValue = steeringValue / 100; // Convert to -1 to 1 range
     
     console.log('Driving steering input:', normalizedValue);
     
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


  // ===== OBSTACLE SYSTEM =====
  private createObstacle(type: string) {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    let obstacle: Phaser.GameObjects.Rectangle;
    
    if (type === this.obstacleTypes.POTHOLE) {
      // Pothole: configured width/height percentages, always on right side, slow speed
      const width = gameWidth * this.config.obstacles.pothole.width;
      const height = gameHeight * this.config.obstacles.pothole.height;
      const x = gameWidth * this.config.obstacles.pothole.position; // Right side of road
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
    
    this.obstacles.forEach((obstacle, index) => {
      const speed = (obstacle as any).speed || 1;
      obstacle.y += speed;
      
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
    // Create obstacle spawning timers
    // Potholes at configured interval
    this.time.addEvent({
      delay: this.config.obstacles.pothole.spawnInterval,
      callback: () => {
        if (this.drivingMode && !this.drivingPaused) {
          this.createObstacle(this.obstacleTypes.POTHOLE);
        }
      },
      callbackScope: this,
      loop: true
    });
    
    // Exits at configured interval
    this.time.addEvent({
      delay: this.config.obstacles.exit.spawnInterval,
      callback: () => {
        if (this.drivingMode && !this.drivingPaused) {
          this.createObstacle(this.obstacleTypes.EXIT);
        }
      },
      callbackScope: this,
      loop: true
    });
  }

  private stopObstacleSpawning() {
    // Stop spawning new obstacles but keep existing ones on screen
    this.time.removeAllEvents();
    
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
    const menuScene = this.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showObstacleMenu', obstacleType);
      this.scene.bringToTop('MenuScene');
    }
  }
}

