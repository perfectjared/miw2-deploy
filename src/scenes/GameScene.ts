import Phaser from 'phaser';
import { NavigationUI } from '../systems/NavigationUI';
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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createGameObject();
    this.setupPhysics();
    this.setupDragInteraction();
  }

  private createGameObject() {
    this.gameObject = this.scene.add.circle(
      100, // x position
      200, // y position
      20,  // radius
      0xff0000 // color (red)
    );
  }

  private setupPhysics() {
    this.scene.matter.add.gameObject(this.gameObject, {
      shape: 'circle',
      restitution: 0.3,
      friction: 0.1,
      density: 0.001
    });
  }

  public setupDragInteraction() {
    // Make the circle interactive
    this.gameObject.setInteractive();
    
    // Store original color for reference
    const originalColor = 0xffff00;
    const hoverColor = 0xffff66;
    const dragColor = 0xffff33;
    
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
      
      isDragging = false;
      this.gameObject.setFillStyle(originalColor);
      (this.scene as any).isDraggingObject = false;
      
      // Re-enable physics and apply momentum
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = false;
        // Apply velocity as momentum
        this.scene.matter.body.setVelocity(this.gameObject.body as any, { x: velocityX * 1.0, y: velocityY * 1.0 });
      }
    });
  }
}

// Item data type for backseat
class Item implements PhysicsObject {
  public gameObject!: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createGameObject();
    this.setupPhysics();
    this.setupDragInteraction();
  }

  private createGameObject() {
    this.gameObject = this.scene.add.circle(
      1200, // x position
      200,  // y position
      18,   // radius
      0x00ff00 // color (green)
    );
  }

  private setupPhysics() {
    this.scene.matter.add.gameObject(this.gameObject, {
      shape: 'circle',
      restitution: 0.3,
      friction: 0.1,
      density: 0.001
    });
  }

  public setupDragInteraction() {
    // Make the circle interactive
    this.gameObject.setInteractive();
    
    // Store original color for reference
    const originalColor = 0xffff00;
    const hoverColor = 0xffff66;
    const dragColor = 0xffff33;
    
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
      
      isDragging = false;
      this.gameObject.setFillStyle(originalColor);
      (this.scene as any).isDraggingObject = false;
      
      // Re-enable physics and apply momentum
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = false;
        // Apply velocity as momentum
        this.scene.matter.body.setVelocity(this.gameObject.body as any, { x: velocityX * 1.0, y: velocityY * 1.0 });
      }
    });
  }
}

// Keys data type for frontseat
class Keys implements PhysicsObject {
  public gameObject!: Phaser.GameObjects.Arc;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.createGameObject();
    this.setupPhysics();
    this.setupDragInteraction();
  }

  private createGameObject() {
    this.gameObject = this.scene.add.circle(
      100, // x position (further from magnetic target)
      300, // y position (lower on screen)
      15,  // radius
      0xffff00 // color (yellow)
    );
  }

  private setupPhysics() {
    this.scene.matter.add.gameObject(this.gameObject, {
      shape: 'circle',
      restitution: 0.3,
      friction: 0.1,
      density: 0.001
    });
  }

  public setupDragInteraction() {
    // Make the circle interactive
    this.gameObject.setInteractive();
    
    // Store original color for reference
    const originalColor = 0xffff00;
    const hoverColor = 0xffff66;
    const dragColor = 0xffff33;
    
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
        
        // Use consolidated key removal logic (this will handle constraint removal)
        (this.scene as any).handleKeyRemoval('drag away');
        
        // Reset magnetic target color
        if ((this.scene as any).magneticTarget) {
          const magneticConfig = {
            x: 180,
            y: 200,
            radius: 25,
            color: 0xff0000
          };
          (this.scene as any).magneticTarget.clear();
          (this.scene as any).magneticTarget.lineStyle(3, magneticConfig.color, 1);
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
      
      isDragging = false;
      (this.gameObject as any).isDragging = false; // Clear flag on game object
      this.gameObject.setFillStyle(originalColor);
      (this.scene as any).isDraggingObject = false;
      
      // Re-enable physics and apply momentum
      if (this.gameObject.body) {
        (this.gameObject.body as any).isStatic = false;
        // Apply velocity as momentum
        this.scene.matter.body.setVelocity(this.gameObject.body as any, { x: velocityX * 1.0, y: velocityY * 1.0 });
      }
    });
  }
}

export class GameScene extends Phaser.Scene {
  // ============================================================================
  // GAME PARAMETERS - Easy to modify values
  // ============================================================================
  
  // Steering Wheel Parameters
  private readonly STEERING_WHEEL_RADIUS = 80;
  private readonly STEERING_WHEEL_POSITION_X = 0.3; // 50% of screen width
  private readonly STEERING_WHEEL_POSITION_Y = 0.72; // 80% of screen height
  private readonly STEERING_WHEEL_DEPTH = 1000;
  
  // Speed Crank Parameters
  private readonly SPEED_CRANK_OFFSET_X = 120; // Offset to the right of steering wheel
  private readonly SPEED_CRANK_OFFSET_Y = -20; // Offset from steering wheel Y
  private readonly SPEED_CRANK_WIDTH = 40;
  private readonly SPEED_CRANK_HEIGHT = 150;
  private readonly SPEED_CRANK_TRACK_COLOR = 0x333333;
  private readonly SPEED_CRANK_TRACK_ALPHA = 0.8;
  private readonly SPEED_CRANK_TRACK_STROKE_COLOR = 0xffffff;
  private readonly SPEED_CRANK_TRACK_STROKE_WIDTH = 2;
  private readonly SPEED_CRANK_TRACK_CORNER_RADIUS = 5;
  private readonly SPEED_CRANK_HANDLE_COLOR = 0x00ff00;
  private readonly SPEED_CRANK_HANDLE_ALPHA = 0.9;
  private readonly SPEED_CRANK_HANDLE_STROKE_COLOR = 0xffffff;
  private readonly SPEED_CRANK_HANDLE_STROKE_WIDTH = 1;
  private readonly SPEED_CRANK_HANDLE_CORNER_RADIUS = 3;
  private readonly SPEED_CRANK_HANDLE_MARGIN = 4; // Margin from track edges
  private readonly SPEED_CRANK_HANDLE_HEIGHT = 20;
  private readonly SPEED_CRANK_INDICATOR_COLOR = 0xffffff;
  private readonly SPEED_CRANK_INDICATOR_STROKE_COLOR = 0x000000;
  private readonly SPEED_CRANK_INDICATOR_RADIUS = 3;
  private readonly SPEED_CRANK_TEXT_OFFSET_X = 10; // Offset from crank for text
  private readonly SPEED_CRANK_TEXT_FONT_SIZE = "16px";
  private readonly SPEED_CRANK_TEXT_COLOR = "#ffffff";
  private readonly SPEED_CRANK_SNAP_POSITIONS = [0, 0.4, 0.7, 1.0]; // 0%, 40%, 70%, 100%
  private readonly SPEED_CRANK_DEPTH_TRACK = 1000;
  private readonly SPEED_CRANK_DEPTH_HANDLE = 1001;
  private readonly SPEED_CRANK_DEPTH_INDICATOR = 1002;
  private readonly SPEED_CRANK_DEPTH_TEXT = 1003;
  private readonly SPEED_CRANK_DEPTH_AREA = 1004;
  
  // Button Parameters
  private readonly BUTTON_LOOK_DOWN_TEXT = "look down";
  private readonly BUTTON_LOOK_UP_TEXT = "look up";
  private readonly BUTTON_FONT_SIZE = "14px";
  private readonly BUTTON_COLOR = "#ffffff";
  private readonly BUTTON_OFFSET_Y = 220; // Offset from center Y
  
  // UI Overlay Parameters
  private readonly MAP_OVERLAY_TEXT = "MAP OVERLAY";
  private readonly MAP_OVERLAY_FONT_SIZE = "36px";
  private readonly MAP_OVERLAY_COLOR = "#ffffff";
  private readonly MAP_OVERLAY_OFFSET_Y = 320;
  private readonly INVENTORY_OVERLAY_TEXT = "INVENTORY OVERLAY";
  private readonly INVENTORY_OVERLAY_FONT_SIZE = "36px";
  private readonly INVENTORY_OVERLAY_COLOR = "#ffffff";
  private readonly INVENTORY_OVERLAY_OFFSET_Y = 320;
  
  // UI Text Parameters
  private readonly GAME_LAYER_TEXT = "(game)";
  private readonly GAME_LAYER_POSITION_X = 10;
  private readonly GAME_LAYER_POSITION_Y = 10;
  private readonly GAME_LAYER_FONT_SIZE = "16px";
  private readonly GAME_LAYER_COLOR = "#ffff00";
  private readonly GAME_LAYER_BACKGROUND_COLOR = "#000000";
  private readonly GAME_LAYER_DEPTH = 10000;
  
  // Countdown Parameters
  private readonly COUNTDOWN_POSITION_OFFSET_X = 0;
  private readonly COUNTDOWN_POSITION_OFFSET_Y = 0.1;
  private readonly COUNTDOWN_FONT_SIZE = "24px";
  private readonly COUNTDOWN_COLOR = "#ffffff";
  
  // Stats Text Parameters
  
  // Money/Health Parameters
  private readonly MONEY_POSITION_X = 0.1; // 10% of screen width
  private readonly MONEY_POSITION_Y = 0.1; // 10% of screen height
  private readonly HEALTH_POSITION_X = 0.1; // 10% of screen width
  private readonly HEALTH_POSITION_Y = 0.15; // 15% of screen height
  private readonly MONEY_HEALTH_FONT_SIZE = "16px";
  private readonly MONEY_COLOR = "#00ff00";
  private readonly HEALTH_COLOR = "#ff0000";
  
  // Physics Parameters
  private readonly PHYSICS_BUFFER_ZONE = 100;
  private readonly PHYSICS_TELEPORT_BOUNDS_MIN = 50;
  private readonly PHYSICS_TELEPORT_BOUNDS_MAX = 50;
  
  // Timing Parameters
  private readonly COOLDOWN_FRAME_TIME = 16; // ~60fps
  
  // Game State Initial Values
  private readonly INITIAL_GAME_TIME = 99;
  private readonly INITIAL_POSITION = 0;
  private readonly INITIAL_MONEY = 108;
  private readonly INITIAL_HEALTH = 100;
  private readonly INITIAL_SKILL = 0;
  private readonly INITIAL_DIFFICULTY = 0;
  private readonly INITIAL_MOMENTUM = 0;
  private readonly INITIAL_PLOT_A = 0;
  private readonly INITIAL_PLOT_B = 0;
  private readonly INITIAL_PLOT_C = 0;
  private readonly INITIAL_KNOB_VALUE = 0;
  private readonly KEYS_REMOVAL_COOLDOWN = 1000;
  
  // Physics Parameters
  private readonly GRAVITY_X = 0;
  private readonly GRAVITY_Y = 0.8;
  private readonly MAGNETIC_SNAP_THRESHOLD = 10;
  private readonly MAGNETIC_FORCE = 0.0001;
  
  // Driving Parameters
  private readonly KNOB_MAX_ANGLE = 45;
  private readonly KNOB_RETURN_SPEED = 0.5;
  private readonly CAR_MAX_SPEED = 5;
  private readonly CAR_ACCELERATION = 0.01;
  private readonly MIN_CRANK_FOR_STEERING = 40;
  private readonly MIN_SPEED_FOR_STEERING = 0.01;
  private readonly PROGRESS_SCALE = 2;
  private readonly PROGRESS_MISALIGN_THRESHOLD = 0.1;
  private readonly PROGRESS_MISALIGN_PENALTY_SCALE = 0.1;
  
  // UI Colors and Styling
  private readonly KNOB_FILL_COLOR = 0x444444;
  private readonly KNOB_STROKE_COLOR = 0xffffff;
  private readonly KNOB_STROKE_WIDTH = 2;
  private readonly KNOB_STROKE_ALPHA = 1;
  private readonly KNOB_ACTIVE_FILL_COLOR = 0x666666;
  
  // Button Styling
  private readonly MAP_TOGGLE_FILL_COLOR = 0x4444ff;
  private readonly MAP_TOGGLE_FILL_ALPHA = 0.7;
  private readonly MAP_TOGGLE_STROKE_WIDTH = 2;
  private readonly MAP_TOGGLE_STROKE_COLOR = 0xffffff;
  private readonly MAP_TOGGLE_STROKE_ALPHA = 1;
  
  private readonly INVENTORY_TOGGLE_FILL_COLOR = 0x44ff44;
  private readonly INVENTORY_TOGGLE_FILL_ALPHA = 0.7;
  private readonly INVENTORY_TOGGLE_STROKE_WIDTH = 2;
  private readonly INVENTORY_TOGGLE_STROKE_COLOR = 0xffffff;
  private readonly INVENTORY_TOGGLE_STROKE_ALPHA = 1;
  
  // Manager Values Styling
  private readonly MANAGER_VALUES_FONT_SIZE = "12px";
  private readonly MANAGER_VALUES_BACKGROUND_COLOR = "#000000";
  private readonly MANAGER_VALUES_PADDING = { x: 4, y: 2 };
  private readonly MANAGER_VALUES_OPACITY = 0.8;
  private readonly MANAGER_VALUES_SKILL_COLOR = "#00ff00";
  private readonly MANAGER_VALUES_DIFFICULTY_COLOR = "#ff0000";
  private readonly MANAGER_VALUES_MOMENTUM_COLOR = "#0000ff";
  private readonly MANAGER_VALUES_PLOT_A_COLOR = "#ff00ff";
  private readonly MANAGER_VALUES_PLOT_B_COLOR = "#ffff00";
  private readonly MANAGER_VALUES_PLOT_C_COLOR = "#00ffff";
  
  // Navigation Parameters
  private readonly NAVIGATION_ANIMATION_DURATION = 500;
  private readonly NAVIGATION_OVERLAY_OFFSET_PERCENT = 0.3;
  
  // Physics Object Parameters (Trash, Keys, Item)
  
  // Magnetic Target Parameters
  private readonly MAGNETIC_TARGET_X = 200;
  private readonly MAGNETIC_TARGET_Y = 550;
  private readonly MAGNETIC_TARGET_RADIUS = 25;
  private readonly MAGNETIC_TARGET_COLOR = 0x00ffff;
  private readonly MAGNETIC_TARGET_VISUAL_COLOR = 0x00ffff;
  private readonly MAGNETIC_TARGET_VISUAL_ALPHA = 0.3;
  
  // UI Position Parameters
  private readonly STOPS_POSITION_OFFSET_X = 0;
  private readonly STOPS_POSITION_OFFSET_Y = 0.2;
  private readonly STOPS_FONT_SIZE = "18px";
  private readonly STOPS_COLOR = "#ffffff";
  
  private readonly PROGRESS_POSITION_OFFSET_X = 0;
  private readonly PROGRESS_POSITION_OFFSET_Y = 0.3;
  private readonly PROGRESS_FONT_SIZE = "18px";
  private readonly PROGRESS_COLOR = "#ffffff";
  
  private readonly POSITION_POSITION_OFFSET_X = 0;
  private readonly POSITION_POSITION_OFFSET_Y = 0.4;
  private readonly POSITION_FONT_SIZE = "18px";
  private readonly POSITION_COLOR = "#ffffff";
  
  private readonly SPEED_POSITION_OFFSET_X = 0;
  private readonly SPEED_POSITION_OFFSET_Y = 0.5;
  private readonly SPEED_FONT_SIZE = "18px";
  private readonly SPEED_COLOR = "#ffffff";
  
  // Driving Parameters
  private readonly STEERING_SENSITIVITY = 1.0;
  private readonly CAMERA_ENABLED = true;
  private readonly CAMERA_MAX_OFFSET = 100;
  private readonly ROAD_VIEW_Y_OFFSET_PERCENT = 0;
  private readonly SKY_COLOR = 0x87CEEB;
  private readonly ROAD_COLOR = 0x333333;
  private readonly LINE_COLOR = 0xffffff;
  private readonly BOUNDARY_PADDING = 50;
  private readonly ROAD_DEPTH = -1000;
  private readonly LINE_WIDTH = 4;
  private readonly LINE_HEIGHT = 30;
  private readonly LINE_GAP = 40;
  private readonly CENTER_LINE_Y_OFFSET = 50;
  private readonly LINE_DEPTH = -1000;
  
  // Obstacle Parameters
  private readonly POTHOLE_WIDTH = 0.1;
  private readonly POTHOLE_HEIGHT = 0.05;
  private readonly POTHOLE_MIN_POS = 0.2;
  private readonly POTHOLE_MAX_POS = 0.8;
  private readonly POTHOLE_SPAWN_Y = 0.8;
  private readonly POTHOLE_COLOR = 0x8B4513;
  private readonly POTHOLE_SPEED = 2;
  
  private readonly EXIT_WIDTH = 30;
  private readonly EXIT_HEIGHT = 60;
  private readonly EXIT_POSITION = 0.9;
  private readonly EXIT_SPAWN_Y = 0.7;
  private readonly EXIT_COLOR = 0x00ff00;
  private readonly EXIT_SPEED = 1.5;
  
  private readonly OBSTACLE_MIN_DELAY_MS = 5000;
  private readonly OBSTACLE_MAX_DELAY_MS = 12000;
  private readonly POTHOLE_PROBABILITY = 0.8;
  
  // Collision Parameters
  private readonly COLLISION_MENU_DELAY = 1000;
  
  // Seat Title Parameters
  private readonly FRONTSEAT_TEXT = "FRONT SEAT";
  private readonly FRONTSEAT_POSITION_X = 0.25;
  private readonly FRONTSEAT_POSITION_Y = 0.1;
  private readonly FRONTSEAT_FONT_SIZE = "24px";
  private readonly FRONTSEAT_COLOR = "#ffffff";
  
  private readonly BACKSEAT_TEXT = "BACK SEAT";
  private readonly BACKSEAT_POSITION_X = 0.75;
  private readonly BACKSEAT_POSITION_Y = 0.1;
  private readonly BACKSEAT_FONT_SIZE = "24px";
  private readonly BACKSEAT_COLOR = "#ffffff";
  
  // Tutorial Overlay Parameters
  private readonly TUTORIAL_OVERLAY_COLOR = 0x000000;
  private readonly TUTORIAL_OVERLAY_ALPHA = 0.5;
  private readonly TUTORIAL_OVERLAY_DEPTH = 40000; // Below menu dialogs
  private readonly TUTORIAL_MASK_COLOR = 0xffffff;
  private readonly TUTORIAL_TARGET_HOLE_MULTIPLIER = 1.2; // 20% larger than magnetic target
  private readonly TUTORIAL_KEYS_HOLE_RADIUS = 25;
  
  // Debug Border Parameters
  
  
  // ============================================================================
  // CLASS PROPERTIES
  // ============================================================================
  
  // Save system
  private saveManager!: SaveManager;
  private saveMenuShown: boolean = false;
  private saveMenuElements: any = null;
  
  // Game state
   private currentPosition: string = 'frontseat'; // 'frontseat' or 'backseat'
   private currentView: string = 'main'; // 'main' or 'overlay'
   private gameTime: number = 0; // Game time - will be initialized in create()
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
  private keysInIgnition: boolean = false; // Track if keys are actually in the ignition (separate from menu state)
  private tutorialOverlay!: Phaser.GameObjects.Container; // Single unified tutorial overlay
  private tutorialMaskGraphics!: Phaser.GameObjects.Graphics; // Graphics for mask updates
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
  private speedCrankCooldown: number = 0; // Cooldown timer for speed crank interaction
   private frontseatDragDial!: any; // RexUI drag dial
     private drivingMode: boolean = false; // Track if driving mode is active
  private shouldAutoRestartDriving: boolean = false; // Track if driving should restart on resume
  private drivingPaused: boolean = false; // Track if driving is paused (for collision menus)
  private obstacleSpawnerActive: boolean = false; // Track if obstacle spawner is already running
  
  // Event handler references for proper cleanup
  private handleWindowBlur!: () => void;
  private handleWindowFocus!: () => void;
  private handleVisibilityChange!: () => void;
  
  // Systems
  private navigationUI!: NavigationUI;
   private isKnobActive: boolean = false; // Track if knob is being interacted with
  private isDraggingObject: boolean = false; // Track if dragging a physics object
   private knobReturnTimer!: Phaser.Time.TimerEvent | null; // Timer for gradual return to center
   private currentSteeringValue: number = 0; // Current steering value for driving mode
   private drivingCar!: Phaser.GameObjects.Rectangle;
   private drivingRoad!: Phaser.GameObjects.Rectangle;
   private drivingRoadLines: Phaser.GameObjects.Rectangle[] = [];
   private carSpeed: number = 0;
   private carX: number = 0;
   // Driving camera system
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

  /**
   * Main scene creation method - initializes all game systems and UI
   */
  // ===== SCENE LIFECYCLE =====
  async create() {
    // Initialize systems
    this.navigationUI = new NavigationUI(this);
    
    // DrivingScene is no longer used - driving visualization is in GameScene
    
    // Load configuration from cache (loaded by PreloadScene)
    // Initialize save manager
    this.saveManager = SaveManager.getInstance();
    
    // Initialize game state with parameters
    this.gameTime = this.INITIAL_GAME_TIME;
    this.position = this.INITIAL_POSITION;
    this.money = this.INITIAL_MONEY;
    this.health = this.INITIAL_HEALTH;
    this.playerSkill = this.INITIAL_SKILL;
    this.difficulty = this.INITIAL_DIFFICULTY;
    this.momentum = this.INITIAL_MOMENTUM;
    this.plotA = this.INITIAL_PLOT_A;
    this.plotB = this.INITIAL_PLOT_B;
    this.plotC = this.INITIAL_PLOT_C;
    this.knobValue = this.INITIAL_KNOB_VALUE;
    this.keysRemovalCooldown = this.KEYS_REMOVAL_COOLDOWN;
    
    // DrivingScene communication removed - everything is in GameScene now
    
    // Add game overlay text (always visible on top)
    const gameText = this.add.text(this.GAME_LAYER_POSITION_X, this.GAME_LAYER_POSITION_Y, this.GAME_LAYER_TEXT, {
      fontSize: this.GAME_LAYER_FONT_SIZE,
      color: this.GAME_LAYER_COLOR,
      fontStyle: 'bold',
      backgroundColor: this.GAME_LAYER_BACKGROUND_COLOR,
      padding: { x: 4, y: 2 }
    });
    gameText.setScrollFactor(0);
    gameText.setDepth(this.GAME_LAYER_DEPTH);

    // Set up shared camera system for game scenes AFTER launching them
    this.setupSharedGameCamera();
    
    // Set up physics worlds
    this.setupPhysicsWorlds();
    
    // Create tutorial overlay AFTER physics objects are created (so it can find Keys object)
    this.createTutorialOverlay();
    
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
    this.events.on('ignitionMenuShown', () => this.onIgnitionMenuShown(), this);
    this.events.on('ignitionMenuHidden', () => this.onIgnitionMenuHidden(), this);

    // Set up automatic pause when window loses focus
    this.setupAutoPause();

    // Set up swipe controls for camera movement
    this.setupSwipeControls();
    
    // Setup keyboard controls for driving
    this.setupKeyboardControls();
  }

  /**
   * Scene pause handler - called when Phaser pauses the scene
   */
  pause() {
    console.log('GameScene: Scene paused by Phaser');
    // Stop any running timers to prevent issues
    this.stopKnobReturnTimer();
    this.stopNeutralReturnTimer();
    this.stopForwardMovementTimer();
    
    // Clear collision timer
    if (this.collisionTimer) {
      this.collisionTimer.remove();
      this.collisionTimer = null;
    }
  }

  /**
   * Scene resume handler - called when Phaser resumes the scene
   */
  resume() {
    console.log('GameScene: Scene resumed by Phaser');
    // Scene is automatically resumed by Phaser
    // No need to manually restart timers unless needed
  }

  /**
   * Main update loop - handles physics, input, and game state updates
   */
  // ===== SCENE UPDATE LOOP =====
     update() {
    // Update loop - no config guard needed since we removed config system
     
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
      // Only update mask if we're in keys-and-ignition state
      const menuScene = this.scene.get('MenuScene');
      const hasOpenMenu = menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDialog;
      
      if (!hasOpenMenu && !this.keysInIgnition) {
        this.updateTutorialMask('keys-and-ignition');
      }
    }
    
    // Frame-by-frame updates
    this.updatePosition();
    
    // Update speed crank cooldown
    if (this.speedCrankCooldown > 0) {
      this.speedCrankCooldown -= this.COOLDOWN_FRAME_TIME; // Using parameter timing
      if (this.speedCrankCooldown <= 0) {
        this.speedCrankCooldown = 0;
      }
    }
   }

  private checkPhysicsObjectBoundaries() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const bufferZone = this.PHYSICS_BUFFER_ZONE; // Buffer zone before teleporting
    
    // Check frontseat Trash object
    if (this.frontseatTrash && this.frontseatTrash.gameObject && this.frontseatTrash.gameObject.body) {
      const trashX = this.frontseatTrash.gameObject.x;
      const trashY = this.frontseatTrash.gameObject.y;
      
      // Only teleport if trash is significantly outside frontseat bounds (with buffer)
      if (trashX < -bufferZone || trashX > gameWidth + bufferZone || 
          trashY < -bufferZone || trashY > gameHeight + bufferZone) {
        
        // Teleport back to center of frontseat area using parameter bounds
        const newX = Math.max(this.PHYSICS_TELEPORT_BOUNDS_MIN, Math.min(gameWidth - this.PHYSICS_TELEPORT_BOUNDS_MAX, trashX));
        const newY = Math.max(this.PHYSICS_TELEPORT_BOUNDS_MIN, Math.min(gameHeight - this.PHYSICS_TELEPORT_BOUNDS_MAX, trashY));
        
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
        
        // Teleport back to center of frontseat area using parameter bounds
        const newX = Math.max(this.PHYSICS_TELEPORT_BOUNDS_MIN, Math.min(gameWidth - this.PHYSICS_TELEPORT_BOUNDS_MAX, keysX));
        const newY = Math.max(this.PHYSICS_TELEPORT_BOUNDS_MIN, Math.min(gameHeight - this.PHYSICS_TELEPORT_BOUNDS_MAX, keysY));
        
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
        
        // Teleport back to center of backseat area using parameter bounds
        const newX = Math.max(gameWidth + this.PHYSICS_TELEPORT_BOUNDS_MIN, Math.min(gameWidth * 2 - this.PHYSICS_TELEPORT_BOUNDS_MAX, itemX));
        const newY = Math.max(this.PHYSICS_TELEPORT_BOUNDS_MIN, Math.min(gameHeight - this.PHYSICS_TELEPORT_BOUNDS_MAX, itemY));
        
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
      const mapOverlay = this.add.text(frontseatCenterX, frontseatCenterY + this.MAP_OVERLAY_OFFSET_Y, this.MAP_OVERLAY_TEXT, {
        fontSize: this.MAP_OVERLAY_FONT_SIZE,
        color: this.MAP_OVERLAY_COLOR,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      mapOverlay.setScrollFactor(0);
      
             // Map toggle button (small button at top of map overlay)
       const mapToggleButton = this.add.graphics();
      this.mapToggleButton = mapToggleButton; // Store reference
       mapToggleButton.fillStyle(this.MAP_TOGGLE_FILL_COLOR, this.MAP_TOGGLE_FILL_ALPHA);
       mapToggleButton.fillRect(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40);
       mapToggleButton.lineStyle(this.MAP_TOGGLE_STROKE_WIDTH, this.MAP_TOGGLE_STROKE_COLOR, this.MAP_TOGGLE_STROKE_ALPHA);
       mapToggleButton.strokeRect(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40);
       mapToggleButton.setScrollFactor(0);
       mapToggleButton.setInteractive(new Phaser.Geom.Rectangle(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40), Phaser.Geom.Rectangle.Contains);
       mapToggleButton.on('pointerdown', () => {
         if (this.gameStarted) {
           // Don't allow overlay if keys are not in ignition
           if (!this.keysConstraint) {
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
      const mapToggleText = this.add.text(frontseatCenterX, frontseatCenterY + this.BUTTON_OFFSET_Y, this.BUTTON_LOOK_DOWN_TEXT, {
        fontSize: this.BUTTON_FONT_SIZE,
        color: this.BUTTON_COLOR,
         fontStyle: 'bold'
       }).setOrigin(0.5);
      mapToggleText.setScrollFactor(0);
      this.mapToggleText = mapToggleText; // Store reference
       mapToggleText.setName('mapToggleText');
      
      // Inventory overlay (right side, positioned below backseat)
      const inventoryOverlay = this.add.text(backseatCenterX, backseatCenterY + this.INVENTORY_OVERLAY_OFFSET_Y, this.INVENTORY_OVERLAY_TEXT, {
        fontSize: this.INVENTORY_OVERLAY_FONT_SIZE,
        color: this.INVENTORY_OVERLAY_COLOR,
        fontStyle: 'bold'
      }).setOrigin(0.5);
      inventoryOverlay.setScrollFactor(0);
      
             // Inventory toggle button (small button at top of inventory overlay)
       const inventoryToggleButton = this.add.graphics();
      this.inventoryToggleButton = inventoryToggleButton; // Store reference
       inventoryToggleButton.fillStyle(this.INVENTORY_TOGGLE_FILL_COLOR, this.INVENTORY_TOGGLE_FILL_ALPHA);
       inventoryToggleButton.fillRect(backseatCenterX - 60, backseatCenterY + 200, 120, 40);
       inventoryToggleButton.lineStyle(this.INVENTORY_TOGGLE_STROKE_WIDTH, this.INVENTORY_TOGGLE_STROKE_COLOR, this.INVENTORY_TOGGLE_STROKE_ALPHA);
       inventoryToggleButton.strokeRect(backseatCenterX - 60, backseatCenterY + 200, 120, 40);
       inventoryToggleButton.setScrollFactor(0);
       inventoryToggleButton.setInteractive(new Phaser.Geom.Rectangle(backseatCenterX - 60, backseatCenterY + 200, 120, 40), Phaser.Geom.Rectangle.Contains);
       inventoryToggleButton.on('pointerdown', () => {
         if (this.gameStarted) {
           // Don't allow overlay if keys are not in ignition
           if (!this.keysConstraint) {
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
      const inventoryToggleText = this.add.text(backseatCenterX, backseatCenterY + this.BUTTON_OFFSET_Y, this.BUTTON_LOOK_DOWN_TEXT, {
        fontSize: this.BUTTON_FONT_SIZE,
        color: this.BUTTON_COLOR,
         fontStyle: 'bold'
       }).setOrigin(0.5);
       inventoryToggleText.setScrollFactor(0);
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
    
    // Setup driving camera system
    // this.setupDrivingCamera(); // Moved to DrivingScene
    
    // Create crank tutorial overlay (for speed crank highlighting)
   }

   // Event-based communication removed - now using direct method calls

  // ===== UI CREATION =====
   private createCountdownTimer() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
    // Position countdown text using parameters
    const countdownX = gameWidth / 2 + (gameWidth * this.COUNTDOWN_POSITION_OFFSET_X);
    const countdownY = (gameHeight * this.COUNTDOWN_POSITION_OFFSET_Y);
     
         this.countdownText = this.add.text(countdownX, countdownY, this.gameTime.toString(), {
      fontSize: this.COUNTDOWN_FONT_SIZE,
      color: this.COUNTDOWN_COLOR,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 }
    }).setOrigin(0.5);
     
     // Make countdown text an overlay that doesn't move with camera
     this.countdownText.setScrollFactor(0);
    this.countdownText.setDepth(10000);
   }

   private createFrontseatDragDial() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
    // Position the drag dial using parameters
    const dialX = gameWidth * this.STEERING_WHEEL_POSITION_X;
    const dialY = gameHeight * this.STEERING_WHEEL_POSITION_Y;
     
     // Create a simple custom knob using graphics
    const knobRadius = this.STEERING_WHEEL_RADIUS;
     const knob = this.add.graphics();
     
     // Draw the knob
     knob.fillStyle(this.KNOB_FILL_COLOR);
     knob.fillCircle(0, 0, knobRadius);
     knob.lineStyle(this.KNOB_STROKE_WIDTH, this.KNOB_STROKE_COLOR, this.KNOB_STROKE_ALPHA);
     knob.strokeCircle(0, 0, knobRadius);
     
     // Add a pointer to show the value
     knob.fillStyle(this.KNOB_ACTIVE_FILL_COLOR);
     knob.fillRect(-3, -knobRadius + 10, 6, 20);
     
     knob.setPosition(dialX, dialY);
     knob.setInteractive(new Phaser.Geom.Circle(0, 0, knobRadius), Phaser.Geom.Circle.Contains);
     
     // Store reference to the knob
     this.frontseatDragDial = knob;
     
     // Add drag functionality
     knob.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
       this.isKnobActive = true;
       this.stopKnobReturnTimer();
     });
     
     knob.on('pointerup', () => {
       this.isKnobActive = false;
       this.startKnobReturnTimer();
     });
     
     knob.on('pointerout', () => {
       // Reset knob when mouse leaves the knob area
       this.isKnobActive = false;
       this.startKnobReturnTimer();
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
      const maxAngle = this.KNOB_MAX_ANGLE;
      this.knobValue = (knobValue / 180) * 100;
      this.knobValue = Phaser.Math.Clamp(this.knobValue, -maxAngle, maxAngle);
       
       // Update knob visual
       this.updateKnobVisual();
       
       // Send steering input to driving system
       this.handleSteeringInput(this.knobValue);
     });
     
     // Add the knob to the game content container so it moves with the content
     this.gameContentContainer.add(knob);
     knob.setDepth(this.STEERING_WHEEL_DEPTH); // Ensure it's on top
     
     // Don't disable initially - we'll control it through event handlers
     
     
     // Create the speed crank to the right of the steering wheel
     this.createSpeedCrank(dialX, dialY, gameWidth, gameHeight);
   }

   private createSpeedCrank(dialX: number, dialY: number, gameWidth: number, gameHeight: number) {
     // Position the speed crank to the right of the steering wheel
     const crankX = dialX + this.SPEED_CRANK_OFFSET_X;
     const crankY = dialY + this.SPEED_CRANK_OFFSET_Y;
     const crankWidth = this.SPEED_CRANK_WIDTH;
     const crankHeight = this.SPEED_CRANK_HEIGHT;
     
     // Create crank track (background) - styled like RexUI
     const crankTrack = this.add.graphics();
     crankTrack.fillStyle(this.SPEED_CRANK_TRACK_COLOR, this.SPEED_CRANK_TRACK_ALPHA);
     crankTrack.fillRoundedRect(crankX - crankWidth/2, crankY - crankHeight/2, crankWidth, crankHeight, this.SPEED_CRANK_TRACK_CORNER_RADIUS);
     crankTrack.lineStyle(this.SPEED_CRANK_TRACK_STROKE_WIDTH, this.SPEED_CRANK_TRACK_STROKE_COLOR, 1);
     crankTrack.strokeRoundedRect(crankX - crankWidth/2, crankY - crankHeight/2, crankWidth, crankHeight, this.SPEED_CRANK_TRACK_CORNER_RADIUS);
     
     // Create crank handle - styled like RexUI with visible value indicator
     const handleWidth = crankWidth - this.SPEED_CRANK_HANDLE_MARGIN;
     const handleHeight = this.SPEED_CRANK_HANDLE_HEIGHT;
     const crankHandle = this.add.graphics();
     
     // Create visible value indicator on the handle
     const valueIndicator = this.add.graphics();
     
     // Function to redraw handle at current position
     const redrawHandle = (y: number) => {
       crankHandle.clear();
       crankHandle.fillStyle(this.SPEED_CRANK_HANDLE_COLOR, this.SPEED_CRANK_HANDLE_ALPHA);
       crankHandle.fillRoundedRect(crankX - handleWidth/2, y - handleHeight/2, handleWidth, handleHeight, this.SPEED_CRANK_HANDLE_CORNER_RADIUS);
       crankHandle.lineStyle(this.SPEED_CRANK_HANDLE_STROKE_WIDTH, this.SPEED_CRANK_HANDLE_STROKE_COLOR, 1);
       crankHandle.strokeRoundedRect(crankX - handleWidth/2, y - handleHeight/2, handleWidth, handleHeight, this.SPEED_CRANK_HANDLE_CORNER_RADIUS);
       
       valueIndicator.clear();
       valueIndicator.fillStyle(this.SPEED_CRANK_INDICATOR_COLOR, 1);
       valueIndicator.fillCircle(crankX, y, this.SPEED_CRANK_INDICATOR_RADIUS);
       valueIndicator.lineStyle(1, this.SPEED_CRANK_INDICATOR_STROKE_COLOR, 1);
       valueIndicator.strokeCircle(crankX, y, this.SPEED_CRANK_INDICATOR_RADIUS);
     };
     
     // Create percentage text
     this.speedCrankPercentageText = this.add.text(crankX + crankWidth/2 + this.SPEED_CRANK_TEXT_OFFSET_X, crankY, '50%', {
       fontSize: this.SPEED_CRANK_TEXT_FONT_SIZE,
       color: this.SPEED_CRANK_TEXT_COLOR,
       fontStyle: 'bold'
     }).setOrigin(0, 0.5);
     
     // Add to game content container
     this.gameContentContainer.add([crankTrack, crankHandle, valueIndicator, this.speedCrankPercentageText]);
     crankTrack.setDepth(this.SPEED_CRANK_DEPTH_TRACK);
     crankHandle.setDepth(this.SPEED_CRANK_DEPTH_HANDLE);
     valueIndicator.setDepth(this.SPEED_CRANK_DEPTH_INDICATOR);
     this.speedCrankPercentageText.setDepth(this.SPEED_CRANK_DEPTH_TEXT);
     
     // Make crank interactive
     const crankArea = this.add.rectangle(crankX, crankY, crankWidth, crankHeight, 0x000000, 0);
     crankArea.setInteractive();
     this.gameContentContainer.add(crankArea);
     crankArea.setDepth(this.SPEED_CRANK_DEPTH_AREA);
     
     // Store references for later use
     this.speedCrankTrack = crankTrack;
     this.speedCrankHandle = crankHandle;
     this.speedCrankValueIndicator = valueIndicator;
     this.speedCrankArea = crankArea;
     
     // Add interaction logic with snapping
     let isDragging = false;
     let currentProgress = 0; // Start at 0 (bottom)
     
     // Define snap positions: 0%, 40%, 70%, 100%
     const snapPositions = this.SPEED_CRANK_SNAP_POSITIONS;
     
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
      
      // Update crank tutorial overlay visibility
      this.updateTutorialOverlay();
      
      // Update navigation button visibility based on crank position
      this.updateNavigationButtonVisibility();
    };
     
     crankArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
       // Only allow interaction if car is started
       if (!this.carStarted) {
         return;
       }
       
       // Check cooldown
       if (this.speedCrankCooldown > 0) {
         return;
       }
       
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
         
         // Start cooldown after snapping
         this.speedCrankCooldown = 600; // 0.6 seconds in milliseconds
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
     
   }

   // Method to get current speed crank percentage
   private getSpeedCrankPercentage(): number {
     // This will be set by the speed crank interaction logic
     return this.currentSpeedCrankPercentage || 0;
   }

   private createStopsAndProgressText() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Position stops text using parameters
     const stopsX = gameWidth / 2 + (gameWidth * this.STOPS_POSITION_OFFSET_X);
     const stopsY = gameHeight * this.STOPS_POSITION_OFFSET_Y;
     
     this.stopsText = this.add.text(stopsX, stopsY, `Stops: ${this.stops}`, {
       fontSize: this.STOPS_FONT_SIZE,
       color: this.STOPS_COLOR,
       fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 4, y: 2 }
     }).setOrigin(0.5);
     this.stopsText.setScrollFactor(0);
     
     // Position progress text using parameters
     const progressX = gameWidth / 2 + (gameWidth * this.PROGRESS_POSITION_OFFSET_X);
     const progressY = gameHeight * this.PROGRESS_POSITION_OFFSET_Y;
     
     this.progressText = this.add.text(progressX, progressY, `Progress: ${this.progress.toFixed(1)}%`, {
       fontSize: this.PROGRESS_FONT_SIZE,
       color: this.PROGRESS_COLOR,
       fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 4, y: 2 }
     }).setOrigin(0.5);
     this.progressText.setScrollFactor(0);
     
     // Position text using parameters
     const positionX = gameWidth / 2 + (gameWidth * this.POSITION_POSITION_OFFSET_X);
     const positionY = gameHeight * this.POSITION_POSITION_OFFSET_Y;
     
     this.positionText = this.add.text(positionX, positionY, `Position: ${this.position.toFixed(1)}`, {
       fontSize: this.POSITION_FONT_SIZE,
       color: this.POSITION_COLOR,
       fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 4, y: 2 }
     }).setOrigin(0.5);
     this.positionText.setScrollFactor(0);
     
     // Create speed display text using parameters
     const speedX = gameWidth / 2 + (gameWidth * this.SPEED_POSITION_OFFSET_X);
     const speedY = gameHeight * this.SPEED_POSITION_OFFSET_Y;
     
     this.speedDisplayText = this.add.text(speedX, speedY, `Speed: ${this.carSpeed.toFixed(1)}`, {
       fontSize: this.SPEED_FONT_SIZE,
       color: this.SPEED_COLOR,
       fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 4, y: 2 }
     }).setOrigin(0.5);
     this.speedDisplayText.setScrollFactor(0);
     
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
     
     // Position money text using parameters
     const moneyX = gameWidth * this.MONEY_POSITION_X;
     const moneyY = gameHeight * this.MONEY_POSITION_Y;
     
         this.moneyText = this.add.text(moneyX, moneyY, `$${this.money}`, {
       fontSize: this.MONEY_HEALTH_FONT_SIZE,
       color: this.MONEY_COLOR,
      fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 4, y: 2 }
    }).setOrigin(0, 0.5);
    
     // Position health text using parameters
     const healthX = gameWidth * this.HEALTH_POSITION_X;
     const healthY = gameHeight * this.HEALTH_POSITION_Y;
     
     this.healthText = this.add.text(healthX, healthY, `Health: ${this.health}%`, {
       fontSize: this.MONEY_HEALTH_FONT_SIZE,
       color: this.HEALTH_COLOR,
      fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 4, y: 2 }
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
      fontSize: this.MANAGER_VALUES_FONT_SIZE,
      color: this.MANAGER_VALUES_SKILL_COLOR,
      fontStyle: 'bold',
      backgroundColor: this.MANAGER_VALUES_BACKGROUND_COLOR,
      padding: this.MANAGER_VALUES_PADDING
    }).setOrigin(1, 0);
    
    // Difficulty text (below skill)
    this.difficultyText = this.add.text(statsX, statsY + 25, `Difficulty: ${this.difficulty}%`, {
      fontSize: this.MANAGER_VALUES_FONT_SIZE,
      color: this.MANAGER_VALUES_DIFFICULTY_COLOR,
      fontStyle: 'bold',
      backgroundColor: this.MANAGER_VALUES_BACKGROUND_COLOR,
      padding: this.MANAGER_VALUES_PADDING
    }).setOrigin(1, 0);
    
    // Momentum text (below difficulty)
    this.momentumText = this.add.text(statsX, statsY + 50, `Momentum: ${this.momentum}%`, {
      fontSize: this.MANAGER_VALUES_FONT_SIZE,
      color: this.MANAGER_VALUES_MOMENTUM_COLOR,
      fontStyle: 'bold',
      backgroundColor: this.MANAGER_VALUES_BACKGROUND_COLOR,
      padding: this.MANAGER_VALUES_PADDING
    }).setOrigin(1, 0);
    
    // Plot A text (below momentum)
    this.plotAText = this.add.text(statsX, statsY + 75, `Plot A (${this.plotAEnum}): ${this.plotA}%`, {
      fontSize: this.MANAGER_VALUES_FONT_SIZE,
      color: this.MANAGER_VALUES_PLOT_A_COLOR,
      fontStyle: 'bold',
      backgroundColor: this.MANAGER_VALUES_BACKGROUND_COLOR,
      padding: this.MANAGER_VALUES_PADDING
    }).setOrigin(1, 0);
    
    // Plot B text (below plot A)
    this.plotBText = this.add.text(statsX, statsY + 100, `Plot B (${this.plotBEnum}): ${this.plotB}%`, {
      fontSize: this.MANAGER_VALUES_FONT_SIZE,
      color: this.MANAGER_VALUES_PLOT_B_COLOR,
      fontStyle: 'bold',
      backgroundColor: this.MANAGER_VALUES_BACKGROUND_COLOR,
      padding: this.MANAGER_VALUES_PADDING
    }).setOrigin(1, 0);
    
    // Plot C text (below plot B)
    this.plotCText = this.add.text(statsX, statsY + 125, `Plot C (${this.plotCEnum}): ${this.plotC}%`, {
      fontSize: this.MANAGER_VALUES_FONT_SIZE,
      color: this.MANAGER_VALUES_PLOT_C_COLOR,
      fontStyle: 'bold',
      backgroundColor: this.MANAGER_VALUES_BACKGROUND_COLOR,
      padding: this.MANAGER_VALUES_PADDING
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
    this.playerSkillText.setAlpha(this.MANAGER_VALUES_OPACITY);
    this.difficultyText.setAlpha(this.MANAGER_VALUES_OPACITY);
    this.momentumText.setAlpha(this.MANAGER_VALUES_OPACITY);
    this.plotAText.setAlpha(this.MANAGER_VALUES_OPACITY);
    this.plotBText.setAlpha(this.MANAGER_VALUES_OPACITY);
    this.plotCText.setAlpha(this.MANAGER_VALUES_OPACITY);
  }

  private createMagneticTarget() {
    const magneticConfig = {
      x: this.MAGNETIC_TARGET_X,
      y: this.MAGNETIC_TARGET_Y,
      radius: this.MAGNETIC_TARGET_RADIUS,
      color: this.MAGNETIC_TARGET_COLOR
    };
    
    // Create the magnetic target circle (outline only)
    this.magneticTarget = this.add.graphics();
    this.magneticTarget.lineStyle(3, magneticConfig.color, 1);
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
    
  }

   /**
   * Handles steering input for driving mode
   * @param steeringValue - The steering input value (-1 to 1)
   */
   private handleSteeringInput(steeringValue: number) {
     // Convert steering wheel value (-100 to 100) to steering direction
     // Negative values = turn left, positive values = turn right
     const normalizedValue = steeringValue / 100; // Convert to -1 to 1 range
     
     
     // Only process steering if car is started and in driving mode
     if (this.drivingMode && this.carStarted) {
       // Handle steering input directly in GameScene
       this.handleDrivingSteeringInput(steeringValue);
       return;
     }
     
     // If car is not started or not in driving mode, ignore steering input
     this.resetSteeringValue('car not started or not in driving mode');
     return;
   }

  // ===== PHYSICS SETUP =====
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
    
    // Set physics containers to not move with camera at all
    // This ensures physics objects stay fixed on screen during driving
    this.frontseatPhysicsContainer.setScrollFactor(0, 0); // x=0 (no horizontal scroll), y=0 (no vertical scroll)
    this.backseatPhysicsContainer.setScrollFactor(0, 0); // x=0 (no horizontal scroll), y=0 (no vertical scroll)
    
    // Set up the main Matter.js world bounds to accommodate both containers
    this.matter.world.setBounds(0, 0, gameWidth * 2, gameHeight);
    
    // Set gravity from config
    this.matter.world.setGravity(this.GRAVITY_X, this.GRAVITY_Y);
    
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
     
  }

  private addFrontseatTrash() {
    // Create Trash object
    this.frontseatTrash = new Trash(this);
    
    // Add to frontseat physics container so it moves naturally with the container
    this.frontseatPhysicsContainer.add(this.frontseatTrash.gameObject);
    
    // Set the scroll factor to move horizontally with physics containers but stay vertically fixed
    this.frontseatTrash.gameObject.setScrollFactor(1, 0);
    
    // Set depth to be visible but not interfere with UI
    this.frontseatTrash.gameObject.setDepth(1000);
    
  }

  private addBackseatItem() {
    // Create Item object
    this.backseatItem = new Item(this);
    
    // Add to backseat physics container so it moves naturally with the container
    this.backseatPhysicsContainer.add(this.backseatItem.gameObject);
    
    // Set the scroll factor to move horizontally with physics containers but stay vertically fixed
    this.backseatItem.gameObject.setScrollFactor(1, 0);
    
    // Set depth to be visible but not interfere with UI
    this.backseatItem.gameObject.setDepth(1000);
    
  }

  private addFrontseatKeys() {
    // Create Keys object
    this.frontseatKeys = new Keys(this);
    
    console.log('Keys created at position:', this.frontseatKeys.gameObject.x, this.frontseatKeys.gameObject.y);
    
    // Add to frontseat physics container so it moves naturally with the container
    this.frontseatPhysicsContainer.add(this.frontseatKeys.gameObject);
    
    // Set the scroll factor to move horizontally with physics containers but stay vertically fixed
    this.frontseatKeys.gameObject.setScrollFactor(1, 0);
    
    // Set depth to be visible but not interfere with UI, and in front of magnetic target
    this.frontseatKeys.gameObject.setDepth(2000);
    
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
    
  }

  private toggleDebugBorders() {
    if (this.frontseatDebugBorder && this.backseatDebugBorder) {
      const visible = this.frontseatDebugBorder.visible;
      this.frontseatDebugBorder.setVisible(!visible);
      this.backseatDebugBorder.setVisible(!visible);
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

  // ===== INPUT HANDLING =====
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
          return;
        }
      }
      
      // Check if a menu dialog is currently open
      const menuScene = this.scene.get('MenuScene');
      if (menuScene && menuScene.scene.isActive()) {
        // Check if MenuManager has a current dialog
        const menuManager = (menuScene as any).menuManager;
        if (menuManager && menuManager.currentDialog) {
          return;
        }
      }
      
      // Only start swipe tracking if we're not clicking on interactive objects
      startX = pointer.x;
      startY = pointer.y;
      startTime = Date.now();
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
          return;
        }
      }
      
      // Check if a menu dialog is currently open
      const menuScene = this.scene.get('MenuScene');
      if (menuScene && menuScene.scene.isActive()) {
        // Check if MenuManager has a current dialog
        const menuManager = (menuScene as any).menuManager;
        if (menuManager && menuManager.currentDialog) {
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
      this.toggleDrivingMode();
    });
    
  }

  private setupAutoPause() {
    // DISABLED: Let Phaser handle pause/resume automatically
    // The built-in pauseOnBlur and pauseOnMinimize should handle this
    console.log('Auto-pause system disabled - using Phaser built-in pause handling');
    
    // Store references to event handlers for proper cleanup (even though disabled)
    this.handleWindowBlur = () => {
      console.log('Window blur detected (disabled)');
    };

    this.handleWindowFocus = () => {
      console.log('Window focus detected (disabled)');
    };

    this.handleVisibilityChange = () => {
      console.log('Visibility change detected (disabled)');
    };
    
    // Don't add event listeners - let Phaser handle it
  }

  // DISABLED: These methods are no longer needed with Phaser's built-in pause handling
  /*
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
  */

         private switchToBackseat() {
      // Don't allow switching to backseat if keys are not in ignition
      if (!this.keysConstraint) {
        return;
      }
      
      if (this.currentPosition === 'frontseat') {
        // Move the entire content container to the left to show backseat
        const gameWidth = this.cameras.main.width;
        this.tweens.add({
          targets: this.gameContentContainer,
          x: -gameWidth,
          y: 0, // Reset to main view
          duration: this.NAVIGATION_ANIMATION_DURATION,
          ease: 'Power2'
        });
        
        // Also move the driving background with the same animation
        if (this.drivingBackground) {
          this.tweens.add({
            targets: this.drivingBackground,
            x: -gameWidth,
            y: 0, // Reset to main view
            duration: this.NAVIGATION_ANIMATION_DURATION,
            ease: 'Power2'
          });
        }
        
        // Move physics containers horizontally (not vertically)
        this.tweens.add({
          targets: [this.frontseatPhysicsContainer, this.backseatPhysicsContainer, this.frontseatDebugBorder, this.backseatDebugBorder],
          x: -gameWidth, // Move both containers left
          duration: this.NAVIGATION_ANIMATION_DURATION,
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
          duration: this.NAVIGATION_ANIMATION_DURATION,
          ease: 'Power2'
        });
       
       // Also move the driving background with the same animation
       if (this.drivingBackground) {
         this.tweens.add({
           targets: this.drivingBackground,
           x: 0,
           y: 0, // Reset to main view
           duration: this.NAVIGATION_ANIMATION_DURATION,
           ease: 'Power2'
         });
       }
       
       // Move physics containers horizontally (not vertically)
       this.tweens.add({
         targets: [this.frontseatPhysicsContainer, this.backseatPhysicsContainer, this.frontseatDebugBorder, this.backseatDebugBorder],
         x: 0, // Move both containers back to original position
         duration: this.NAVIGATION_ANIMATION_DURATION,
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
        const overlayOffset = gameHeight * this.NAVIGATION_OVERLAY_OFFSET_PERCENT;
        const duration = velocity ? Math.max(200, Math.min(1000, 1000 / (velocity / 500))) : this.NAVIGATION_ANIMATION_DURATION;
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
      }
    }

    private hideOverlay(velocity?: number) {
      if (this.currentView === 'overlay') {
        // Move the entire content container up to show main content
        const duration = velocity ? Math.max(200, Math.min(1000, 1000 / (velocity / 500))) : this.NAVIGATION_ANIMATION_DURATION;
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
      }
    }

    private updateToggleButtonText() {
      // Find the toggle button texts and update them based on current view
      const mapToggleText = this.gameContentContainer.getByName('mapToggleText') as Phaser.GameObjects.Text;
      const inventoryToggleText = this.gameContentContainer.getByName('inventoryToggleText') as Phaser.GameObjects.Text;
      
      const buttonText = this.currentView === 'main' ? 
        this.BUTTON_LOOK_DOWN_TEXT : 
        this.BUTTON_LOOK_UP_TEXT;
      
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
    if (!this.frontseatKeys || !this.frontseatKeys.gameObject || !this.frontseatKeys.gameObject.body) {
      console.log('Magnetic attraction: Keys object not ready');
      return;
    }
    if (!this.magneticTarget || !(this.magneticTarget as any).magneticBody) {
      console.log('Magnetic attraction: Magnetic target not ready');
      return;
    }
    
    // Debug: Log that magnetic attraction is being called (only occasionally to avoid spam)
    if (Math.random() < 0.01) { // Only log 1% of the time
      console.log('Magnetic attraction: Running - Keys at', this.frontseatKeys.gameObject.x, this.frontseatKeys.gameObject.y);
    }
    
    // Don't apply magnetic attraction if we're in cooldown after removing keys
    if (this.keysRemovalCooldown > 0) {
      this.keysRemovalCooldown -= this.COOLDOWN_FRAME_TIME; // Decrease cooldown using parameter timing
      return;
    }
    
    // Don't apply magnetic attraction if key is being actively dragged
    if ((this.frontseatKeys.gameObject as any).isDragging) {
      return;
    }
    
    const magneticConfig = {
      x: this.MAGNETIC_TARGET_X,
      y: this.MAGNETIC_TARGET_Y,
      radius: this.MAGNETIC_TARGET_RADIUS,
      color: this.MAGNETIC_TARGET_COLOR,
      magneticRange: 150,
      magneticStrength: this.MAGNETIC_FORCE
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
    
    // Debug: Log distance calculation occasionally
    if (Math.random() < 0.01) { // Only log 1% of the time
      console.log('Magnetic attraction: Distance =', distance.toFixed(1), 'Keys at', keysPos.x.toFixed(1), keysPos.y.toFixed(1), 'Target at', targetPos.x.toFixed(1), targetPos.y.toFixed(1));
    }
    
    // Snap threshold - when Keys gets close enough, create a constraint
    const snapThreshold = this.MAGNETIC_SNAP_THRESHOLD; // Distance at which Keys snaps to center
    
    if (distance <= snapThreshold && !this.keysConstraint) {
      // Create constraint to snap Keys to the center of magnetic target
      this.keysConstraint = this.matter.add.constraint(keysBody as any, magneticBody as any, 0, 0.1, {
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        stiffness: 1,
        damping: 0.1
      });
      
      // Track that keys are now in the ignition
      this.keysInIgnition = true;
      console.log('Keys snapped to ignition - keysInIgnition set to:', this.keysInIgnition);
      
      // Update tutorial overlay based on keys being in ignition
      this.updateTutorialOverlay();
      
      // Show turn key menu only if car hasn't been started yet AND key is in ignition
      if (!this.carStarted && this.keysConstraint) {
        this.showTurnKeyMenu();
        
        // If the menu was blocked by hierarchy, check if we should show it when hierarchy allows
        this.checkPendingIgnitionMenu();
      }
      
      // Make Keys move vertically with camera when snapped
      this.frontseatKeys.gameObject.setScrollFactor(1, 1);
      
      // Visual feedback: make target glow bright when snapped using config
      this.magneticTarget.clear();
      const magneticVisualConfig = {
        color: this.MAGNETIC_TARGET_VISUAL_COLOR,
        alpha: this.MAGNETIC_TARGET_VISUAL_ALPHA,
        snappedLineWidth: 5,
        snappedColor: this.MAGNETIC_TARGET_VISUAL_COLOR,
        closeLineWidth: 3,
        closeColor: this.MAGNETIC_TARGET_VISUAL_COLOR
      };
      this.magneticTarget.lineStyle(magneticVisualConfig.snappedLineWidth, magneticVisualConfig.snappedColor, 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
      
      // Update tutorial overlay visibility
      this.updateTutorialOverlay();
      
    } else if (distance > magneticConfig.magneticRange && this.keysConstraint) {
      // Remove constraint if Keys is dragged too far away
      
      // Use consolidated key removal logic (this will handle constraint removal)
      this.handleKeyRemoval('magnetic range exceeded');
      
      // Reset Keys scroll factor to horizontal only
      this.frontseatKeys.gameObject.setScrollFactor(1, 0);
      
      // Reset target color
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(3, magneticConfig.color, 1);
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
      const magneticVisualConfig = {
        color: this.MAGNETIC_TARGET_VISUAL_COLOR,
        alpha: this.MAGNETIC_TARGET_VISUAL_ALPHA,
        snappedLineWidth: 5,
        snappedColor: this.MAGNETIC_TARGET_VISUAL_COLOR,
        closeLineWidth: 3,
        closeColor: this.MAGNETIC_TARGET_VISUAL_COLOR
      };
      this.magneticTarget.lineStyle(magneticVisualConfig.closeLineWidth, magneticVisualConfig.closeColor, 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
      
    } else if (distance > magneticConfig.magneticRange) {
      // Reset target color when Keys is far away
      this.magneticTarget.clear();
      this.magneticTarget.lineStyle(3, magneticConfig.color, 1);
      this.magneticTarget.strokeCircle(magneticConfig.x, magneticConfig.y, magneticConfig.radius);
    }
  }

  private updatePosition() {
    // Only update position if driving mode is active and not paused
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Only allow position changes when speed crank is at 40% or higher
    const crankPercentage = this.getSpeedCrankPercentage();
    if (crankPercentage < 40) {
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
     
    const knobRadius = this.STEERING_WHEEL_RADIUS;
     
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
    const returnSpeed = this.KNOB_RETURN_SPEED;
     
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
   }

   private stopCountdownTimer() {
     // Reset the game over dialog flag
     this.gameOverDialogShown = false;
   }


     private updateCountdown() {
     // Check if scene is still active before proceeding
     if (!this.scene.isActive()) {
       return;
     }
     
     // Only count down if countdown has been started
     if (!this.countdownStarted) {
       return;
     }
     
     if (this.gameTime > 0) {
       this.gameTime--;
       if (this.countdownText) {
         this.countdownText.setText(this.gameTime.toString());
       } else {
       }
     } else {
       // Timer finished - Game Over!
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
     
   }

   // Public method to trigger a countdown step
   public stepCountdown() {
     this.updateCountdown();
     
     // Add progress based on car speed (not just driving mode)
     if (this.drivingMode && this.carSpeed > 0) {
       // Calculate progress increment based on car speed
       const speedCrankPercentage = this.getSpeedCrankPercentage();
       const maxSpeed = this.CAR_MAX_SPEED;
       const speedRatio = this.carSpeed / maxSpeed; // Current speed as ratio of max speed
       const crankRatio = speedCrankPercentage / 100; // Crank position as ratio
       
       // Base progress increment (from parameters)
       const progressScale = this.PROGRESS_SCALE;
       let progressIncrement = speedRatio * progressScale; // Scale factor for progress speed
       
       // If crank is misaligned with actual speed, slow down progress significantly
       const speedDifference = Math.abs(speedRatio - crankRatio);
       const misalignThreshold = this.PROGRESS_MISALIGN_THRESHOLD;
       const misalignPenaltyScale = this.PROGRESS_MISALIGN_PENALTY_SCALE;
       if (speedDifference > misalignThreshold) { // More than threshold difference
         progressIncrement *= misalignPenaltyScale; // Very slow progress when misaligned
       }
       
       this.updateProgress(this.progress + progressIncrement);
     }
   }

     private onStepEvent(stepNumber: number) {
    this.stepCountdown();
    
    // Check if we should auto-resume driving after collision
    if (this.shouldAutoResumeAfterCollision && !this.drivingMode) {
      this.startDriving();
    }
  }

   private onGamePaused() {
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

  /**
   * Resets all game state variables to their default values
   */
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
    
  }

  // ===== SAVE SYSTEM =====

  public loadGame(steps: number) {
    console.log(`Loading game from step ${steps}`);
    this.loadSteps(steps);
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
      this.stopDriving();
    } else {
      this.startDriving();
    }
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
    const maxSpeed = this.CAR_MAX_SPEED;
    const currentSpeedRatio = this.carSpeed / maxSpeed; // Current speed as ratio
    
    console.log('Forward movement update - crank:', speedCrankPercentage + '%', 'multiplier:', speedMultiplier, 'current speed:', this.carSpeed);
    
    // Only move if speed crank is above 0%
    if (speedCrankPercentage > 0) {
      // Calculate target speed based on crank percentage
      const targetSpeed = maxSpeed * speedMultiplier;
      
      // Use much more gradual speed changes
      const baseAcceleration = this.CAR_ACCELERATION * 0.3; // Much slower base acceleration
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
      const stopDecelerationRate = this.CAR_ACCELERATION * 0.5; // Moderate deceleration to stop
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
    const minCrank = this.MIN_CRANK_FOR_STEERING;
    if (crankPercentage < minCrank) {
      // Reset steering value to prevent any position changes
      this.currentSteeringValue = 0;
      return; // Don't update car position when crank is below 40%
    }
    
    // Don't update position if car is not moving (with small tolerance for floating point)
    const minSpeed = this.MIN_SPEED_FOR_STEERING;
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
    const steeringSensitivity = this.STEERING_SENSITIVITY;
    
    // Make steering proportional to car speed - faster car = more steering effect
    const speedMultiplier = this.carSpeed / this.CAR_MAX_SPEED;
    
     
     // Update car position based on steering (multiplied by speed)
     const oldCarX = this.carX;
     this.carX += normalizedValue * steeringSensitivity * speedMultiplier;
     
     // Clamp car position to road boundaries
     const gameWidth = this.cameras.main.width;
     this.carX = Phaser.Math.Clamp(this.carX, 50, gameWidth - 50);
     
     // Update car visual position
     this.drivingCar.setX(this.carX);
     
     // Move camera horizontally for first-person effect
     this.updateDrivingCamera();
   }



  /**
   * Start driving mode
   */
  public startDriving() {
    this.drivingMode = true;
    this.shouldAutoRestartDriving = true;
    console.log('Starting driving...');
    this.carSpeed = 0;
    this.carX = this.cameras.main.width / 2;
    
    // Reset camera to center position when starting
    this.resetDrivingCamera();
    
    // Update car position in GameScene
    if (this.drivingCar) {
      this.drivingCar.setX(this.carX);
    }
    
    this.startForwardMovementTimer();
    this.startNeutralReturnTimer();
    this.startObstacleSpawning();
  }

  /**
   * Stop driving mode
   */
  public stopDriving() {
    this.drivingMode = false;
    console.log('Stopping driving...');
    this.carSpeed = 0;
    
    // Reset camera to center position
    this.resetDrivingCamera();
    
    this.stopForwardMovementTimer();
    this.stopNeutralReturnTimer();
    this.stopObstacleSpawning();
  }

  /**
   * Pause driving
   */
  public pauseDriving() {
    this.drivingPaused = true;
  }

  /**
   * Resume driving
   */
  public resumeDriving() {
    this.drivingPaused = false;
    this.shouldAutoResumeAfterCollision = false;
  }

  /**
   * Show pause menu
   */
  public showPauseMenu() {
    const menuScene = this.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showPauseMenu');
      this.scene.bringToTop('MenuScene');
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
   * Show save menu
   */
  public showSaveMenu() {
    const menuScene = this.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showSaveMenu');
      this.scene.bringToTop('MenuScene');
    }
  }

  /**
   * Show game over menu
   */
  public showGameOverMenu() {
    const menuScene = this.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showGameOverMenu');
      this.scene.bringToTop('MenuScene');
    }
  }

  /**
   * Show obstacle menu
   */
  public showObstacleMenu(obstacleType: string) {
    const menuScene = this.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showObstacleMenu', obstacleType);
      this.scene.bringToTop('MenuScene');
    }
  }

  /**
   * Load steps from save
   */
  public loadSteps(steps: number) {
    const appScene = this.scene.get('AppScene');
    if (appScene) {
      (appScene as any).setStep(steps);
    }
  }

  private updateDrivingCamera() {
    if (!this.drivingMode || this.drivingPaused) return;
    
    // Check if camera movement is enabled
    const cameraEnabled = this.CAMERA_ENABLED;
    if (!cameraEnabled) return;
    
    // Calculate camera offset based on car position
    const gameWidth = this.cameras.main.width;
    const centerX = gameWidth / 2;
    let cameraOffset = this.carX - centerX;
    
    // Apply maximum offset limit to prevent excessive camera movement
    const maxOffset = this.CAMERA_MAX_OFFSET;
    cameraOffset = Phaser.Math.Clamp(cameraOffset, -maxOffset, maxOffset);
    
    // Move driving background objects directly instead of moving camera
    if (this.drivingBackground) {
      this.drivingBackground.setX(-cameraOffset);
    }
  }

  private resetDrivingCamera() {
    // Reset driving background position to center
    if (this.drivingBackground) {
      this.drivingBackground.setX(0);
    }
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
    
    const viewYOffsetPercent = this.ROAD_VIEW_Y_OFFSET_PERCENT;
    if (viewYOffsetPercent !== 0) {
      this.drivingBackground.setY(gameHeight * viewYOffsetPercent);
      console.log('Set driving background Y offset to:', this.drivingBackground.y);
    }
    this.drivingBackground.setDepth(-1000); // Very low depth to ensure it's behind everything
    
    // IMPORTANT: Make sure the driving background can move horizontally with driving camera
    this.drivingBackground.setScrollFactor(1, 0); // Move horizontally with camera
     
         // Create sky
    const skyColor = this.SKY_COLOR;
    const roadColor = this.ROAD_COLOR;
    const lineColor = this.LINE_COLOR;
    const boundaryPadding = this.BOUNDARY_PADDING;
    const sky = this.add.rectangle(0, 0, gameWidth, gameHeight / 2, skyColor);
    sky.setOrigin(0);
    sky.setDepth(-1000); // Ensure sky is behind everything
    this.drivingBackground.add(sky);
     
         // Create road
    this.drivingRoad = this.add.rectangle(0, gameHeight / 2, gameWidth, gameHeight / 2, roadColor);
    this.drivingRoad.setOrigin(0);
    this.drivingRoad.setDepth(this.ROAD_DEPTH); // Ensure road is behind everything
    this.drivingBackground.add(this.drivingRoad);
     
     // Create road lines - proper center lines like a real road
     const lineWidth = this.LINE_WIDTH;
     const lineHeight = this.LINE_HEIGHT;
     const lineGap = this.LINE_GAP;
     const centerLineY = gameHeight / 2 + this.CENTER_LINE_Y_OFFSET;
     
         // Create center line segments
    for (let y = centerLineY; y < gameHeight; y += lineGap + lineHeight) {
      const line = this.add.rectangle(gameWidth / 2, y, lineWidth, lineHeight, lineColor);
      line.setDepth(this.LINE_DEPTH); // Ensure road lines are behind everything
      this.drivingRoadLines.push(line);
      this.drivingBackground.add(line);
    }
     
     // Create the car
     this.createDrivingCar();
     
     // Add driving background to the scene (not gameContentContainer) so it moves with camera independently
     this.add.existing(this.drivingBackground);
     
   }

   private createDrivingCar() {
    // Guard against multiple initialization
    if (this.drivingCar) {
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
    this.drivingCar.setX(this.carX);
    this.carSpeed = 0;
  }

  private createTutorialOverlay() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    console.log('Creating unified tutorial overlay with dimensions:', gameWidth, gameHeight);
    
    // Create tutorial overlay container
    this.tutorialOverlay = this.add.container(0, 0);
    this.tutorialOverlay.setDepth(this.TUTORIAL_OVERLAY_DEPTH); // Above everything
    
    // Create semi-transparent black overlay covering the screen
    const overlay = this.add.graphics();
    overlay.fillStyle(this.TUTORIAL_OVERLAY_COLOR, this.TUTORIAL_OVERLAY_ALPHA).fillRect(0, 0, gameWidth, gameHeight);
    this.tutorialOverlay.add(overlay);
    
    // Create mask graphics for cutouts
    this.tutorialMaskGraphics = this.make.graphics();
    
    // Create BitmapMask with inverted alpha (white areas become cutouts)
    const mask = new Phaser.Display.Masks.BitmapMask(this, this.tutorialMaskGraphics);
    mask.invertAlpha = true; // This makes white areas transparent (cutouts)
    
    // Apply the mask to the overlay
    overlay.setMask(mask);
    
    // Initially hide the tutorial overlay - it will be shown when conditions are met
    this.tutorialOverlay.setVisible(false);
  }

  private updateTutorialOverlay() {
    // Determine which tutorial state to show
    let tutorialState: 'none' | 'keys-and-ignition' | 'ignition-menu' | 'crank' = 'none';
    
    // Check if any menu is currently open
    const menuScene = this.scene.get('MenuScene');
    const hasOpenMenu = menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDialog;
    const currentMenuType = hasOpenMenu ? (menuScene as any).menuManager.currentDisplayedMenuType : null;
    
    if (hasOpenMenu) {
      // Menu is open - show tutorial for that specific menu
      if (currentMenuType === 'TURN_KEY') {
        tutorialState = 'ignition-menu';
      } else {
        // For other menus (START, PAUSE, SAVE, etc.), show appropriate tutorial
        tutorialState = 'none'; // No tutorial for these menus
      }
    } else if (this.carStarted) {
      // Car is started - check crank percentage
      if (this.currentSpeedCrankPercentage < 40) {
        // Car started but crank below 40% - show crank tutorial
        tutorialState = 'crank';
      } else {
        // Car started and crank >= 40% - normal gameplay, no tutorial
        tutorialState = 'none';
      }
    } else if (this.keysInIgnition) {
      // Keys are in ignition but car not started - show ignition menu tutorial
      tutorialState = 'ignition-menu';
    } else {
      // Keys not in ignition - show both keys and ignition
      tutorialState = 'keys-and-ignition';
    }
    
    // Update overlay visibility and mask
    if (this.tutorialOverlay) {
      this.tutorialOverlay.setVisible(tutorialState !== 'none');
      
      if (tutorialState !== 'none') {
        this.updateTutorialMask(tutorialState);
      }
    }
    
    console.log('Tutorial overlay state:', tutorialState, 'keysInIgnition:', this.keysInIgnition, 'carStarted:', this.carStarted, 'crankPercentage:', this.currentSpeedCrankPercentage, 'hasOpenMenu:', hasOpenMenu, 'menuType:', currentMenuType);
  }

  private updateTutorialMask(tutorialState: 'keys-and-ignition' | 'ignition-menu' | 'crank') {
    if (!this.tutorialOverlay || !this.tutorialMaskGraphics) {
      console.log('Cannot update mask - overlay or mask graphics not found');
      return;
    }
    
    // Clear previous mask
    this.tutorialMaskGraphics.clear();
    
    switch (tutorialState) {
      case 'keys-and-ignition':
        this.createKeysAndIgnitionMask();
        break;
      case 'ignition-menu':
        this.createIgnitionMask();
        break;
      case 'crank':
        this.createCrankMask();
        break;
    }
  }
  
  private createKeysAndIgnitionMask() {
    // Create cutouts for both keys and ignition
    this.tutorialMaskGraphics.fillStyle(this.TUTORIAL_MASK_COLOR);
    
    // Keys cutout with 20% padding
    if (this.frontseatKeys?.gameObject) {
      const keysPos = this.frontseatKeys.gameObject;
      const keysHoleRadius = this.TUTORIAL_KEYS_HOLE_RADIUS * 1.2; // 20% larger
      this.tutorialMaskGraphics.fillCircle(keysPos.x, keysPos.y, keysHoleRadius);
    }
    
    // Ignition cutout with 20% padding
    const ignitionX = this.MAGNETIC_TARGET_X;
    const ignitionY = this.MAGNETIC_TARGET_Y;
    const ignitionHoleRadius = this.MAGNETIC_TARGET_RADIUS * this.TUTORIAL_TARGET_HOLE_MULTIPLIER * 1.2; // 20% larger
    this.tutorialMaskGraphics.fillCircle(ignitionX, ignitionY, ignitionHoleRadius);
  }
  
  private createIgnitionMask() {
    // Create circular cutout around ignition (magnetic target)
    const ignitionX = this.MAGNETIC_TARGET_X;
    const ignitionY = this.MAGNETIC_TARGET_Y;
    const holeRadius = this.MAGNETIC_TARGET_RADIUS * this.TUTORIAL_TARGET_HOLE_MULTIPLIER * 1.2; // 20% larger
    
    this.tutorialMaskGraphics.fillStyle(this.TUTORIAL_MASK_COLOR);
    this.tutorialMaskGraphics.fillCircle(ignitionX, ignitionY, holeRadius);
  }
  
  private onIgnitionMenuShown() {
    this.ignitionMenuShown = true;
    this.updateTutorialOverlay();
  }
  
  private onIgnitionMenuHidden() {
    this.ignitionMenuShown = false;
    this.updateTutorialOverlay();
  }
  
  private createCrankMask() {
    // Create rectangular cutout around speed crank area using actual position
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    const dialX = gameWidth * this.STEERING_WHEEL_POSITION_X;
    const dialY = gameHeight * this.STEERING_WHEEL_POSITION_Y;
    const crankX = dialX + this.SPEED_CRANK_OFFSET_X;
    const crankY = dialY + this.SPEED_CRANK_OFFSET_Y;
    
    const width = this.SPEED_CRANK_WIDTH * 1.2; // 20% larger
    const height = this.SPEED_CRANK_HEIGHT * 1.2; // 20% larger
    
    this.tutorialMaskGraphics.fillStyle(this.TUTORIAL_MASK_COLOR);
    this.tutorialMaskGraphics.fillRect(crankX - width/2, crankY - height/2, width, height);
  }



  private handleDrivingSteeringInput(steeringValue: number) {
     // Only allow steering when speed crank is at 40% or higher
     const crankPercentage = this.getSpeedCrankPercentage();
     if (crankPercentage < 40) {
       this.resetSteeringValue('crank below 40%');
       return;
     }
     
     // Also check car speed
     if (this.carSpeed < 0.01) {
       this.resetSteeringValue('car speed too low');
       return;
     }
     
     // Only store steering value if all conditions are met
     console.log('Steering enabled - storing value:', steeringValue, 'speed:', this.carSpeed, 'crank:', crankPercentage);
     this.currentSteeringValue = steeringValue;
     console.log('Current steering value set to:', this.currentSteeringValue);
     
     // Convert steering wheel value (-100 to 100) to steering direction
     const normalizedValue = steeringValue / 100; // Convert to -1 to 1 range
     
     
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
      // Pothole: configured width/height percentages, random X between min/max, slow speed
      const width = gameWidth * this.POTHOLE_WIDTH;
      const height = gameHeight * this.POTHOLE_HEIGHT;
      const minPos = this.POTHOLE_MIN_POS;
      const maxPos = this.POTHOLE_MAX_POS;
      const spawnPos = Phaser.Math.FloatBetween(minPos, maxPos);
      console.log('Pothole spawn range:', minPos, maxPos, 'chosen:', spawnPos);
      const x = gameWidth * spawnPos; // Random horizontal between min/max
      const y = gameHeight * this.POTHOLE_SPAWN_Y; // Spawn lower on screen
      
      obstacle = this.add.rectangle(x, y, width, height, this.POTHOLE_COLOR);
      obstacle.setOrigin(0.5, 0);
      
      // Add obstacle properties
      (obstacle as any).type = type;
      (obstacle as any).speed = this.POTHOLE_SPEED;
      (obstacle as any).isBad = true;
      
    } else if (type === this.obstacleTypes.EXIT) {
      // Exit: configured size, always on right side, very slow speed
      const width = this.EXIT_WIDTH;
      const height = this.EXIT_HEIGHT;
      const x = gameWidth * this.EXIT_POSITION; // Right side of road
      const y = gameHeight * this.EXIT_SPAWN_Y; // Spawn lower on screen
      
      obstacle = this.add.rectangle(x, y, width, height, this.EXIT_COLOR);
      obstacle.setOrigin(0.5, 0);
      
      // Add obstacle properties
      (obstacle as any).type = type;
      (obstacle as any).speed = this.EXIT_SPEED;
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
    const minCrankForObstacleMovement = this.MIN_CRANK_FOR_STEERING;
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
      const minDelay = this.OBSTACLE_MIN_DELAY_MS;
      const maxDelay = this.OBSTACLE_MAX_DELAY_MS;
      const potholeProb = this.POTHOLE_PROBABILITY;
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
      delay: this.COLLISION_MENU_DELAY,
      callback: () => {
        this.showObstacleMenuInternal(this.pendingCollisionType!);
        this.pendingCollisionType = null;
        this.collisionTimer = null;
      },
      callbackScope: this
    });
  }

  private showObstacleMenuInternal(obstacleType: string) {
    // Pause driving when showing menu (don't stop completely)
    this.pauseDriving();
    
    console.log(`Showing ${obstacleType} menu`);
    
    // Show obstacle menu via MenuScene
    this.showObstacleMenu(obstacleType);
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
    this.updateTutorialOverlay();
  }

  private checkPendingIgnitionMenu() {
    // Check if there's a higher priority menu that might be blocking the ignition menu
    const menuScene = this.scene.get('MenuScene');
    if (menuScene && (menuScene as any).menuManager) {
      const menuManager = (menuScene as any).menuManager;
      const currentMenuType = menuManager.getCurrentMenuType ? menuManager.getCurrentMenuType() : null;
      
      if (currentMenuType && currentMenuType !== 'TURN_KEY') {
        console.log(`Ignition menu blocked by ${currentMenuType} - will show when ${currentMenuType} closes`);
        // The menu hierarchy system will handle restoration when the higher priority menu closes
      }
    }
  }

  /**
   * Handles the complete key removal process
   */
  public handleKeyRemoval(reason: string = 'unknown') {
    console.log(`Keys removed from ignition - reason: ${reason}`);

    // Remove the constraint to release the keys
    if (this.keysConstraint) {
      this.matter.world.remove(this.keysConstraint);
      this.keysConstraint = null;
      
      // Track that keys are no longer in the ignition
      this.keysInIgnition = false;
      console.log('Keys removed from ignition - keysInIgnition set to:', this.keysInIgnition);
      
      // Update tutorial overlay based on keys being removed from ignition
      this.updateTutorialOverlay();

      // Reset all car-related state
      this.resetCarState();

      // Set cooldown to prevent immediate re-snapping
      this.keysRemovalCooldown = 1000; // 1 second cooldown

      // Reset keys scroll factor
      if (this.frontseatKeys && this.frontseatKeys.gameObject) {
        this.frontseatKeys.gameObject.setScrollFactor(1, 0);
      }

      // Reset magnetic target color - redraw with green stroke
      if (this.magneticTarget) {
        this.magneticTarget.clear();
        this.magneticTarget.lineStyle(2, 0x00ff00);
        this.magneticTarget.strokeCircle(0, 0, 20);
      }

      // Return camera to front seat
      this.switchToFrontseat();

      // Hide navigation buttons until car is started again
      this.updateNavigationButtonVisibility();

      // Close the turn key menu since keys are no longer in ignition
      const menuScene = this.scene.get('MenuScene');
      if (menuScene) {
        console.log('GameScene: Emitting closeCurrentMenu event to MenuScene');
        menuScene.events.emit('closeCurrentMenu');
      } else {
        console.log('GameScene: MenuScene not found when trying to emit closeCurrentMenu');
      }
    }
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
    frontseatButton.setScrollFactor(0);
    frontseatButton.setInteractive(new Phaser.Geom.Rectangle(frontseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.2), Phaser.Geom.Rectangle.Contains);
    frontseatButton.on('pointerup', () => {
      if (this.gameStarted) {
        // Don't allow switching to backseat if keys are not in ignition
        if (!this.keysConstraint) {
          return;
        }
        this.switchToBackseat();
      }
    });
    
    // Frontseat title using config
    const frontseatConfig = {
      text: this.FRONTSEAT_TEXT,
      position: { x: this.FRONTSEAT_POSITION_X, y: this.FRONTSEAT_POSITION_Y },
      fontSize: this.FRONTSEAT_FONT_SIZE,
      color: this.FRONTSEAT_COLOR,
      depth: 1000
    };
    const frontseatTitleX = gameWidth * frontseatConfig.position.x;
    const frontseatTitleY = gameHeight * frontseatConfig.position.y;
    
    const frontseatTitle = this.add.text(frontseatTitleX, frontseatTitleY, frontseatConfig.text, {
      fontSize: frontseatConfig.fontSize,
      color: frontseatConfig.color,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    frontseatTitle.setDepth(frontseatConfig.depth);
    frontseatTitle.setScrollFactor(0);
    
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
    backseatButton.setScrollFactor(0);
    backseatButton.setInteractive(new Phaser.Geom.Rectangle(backseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.1), Phaser.Geom.Rectangle.Contains);
    backseatButton.on('pointerdown', () => {
      if (this.gameStarted) {
        this.switchToFrontseat();
      }
    });
    
    // Backseat title using config
    const backseatConfig = {
      text: this.BACKSEAT_TEXT,
      position: { x: this.BACKSEAT_POSITION_X, y: this.BACKSEAT_POSITION_Y },
      fontSize: this.BACKSEAT_FONT_SIZE,
      color: this.BACKSEAT_COLOR,
      depth: 1000
    };
    const backseatTitleX = gameWidth * backseatConfig.position.x;
    const backseatTitleY = gameHeight * backseatConfig.position.y;
    
    const backseatTitle = this.add.text(backseatTitleX, backseatTitleY, backseatConfig.text, {
      fontSize: backseatConfig.fontSize,
      color: backseatConfig.color,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    backseatTitle.setDepth(backseatConfig.depth);
    backseatTitle.setScrollFactor(0);
    
    // Add all elements to the container
    this.gameContentContainer.add([frontseatButton, frontseatTitle, backseatButton, backseatTitle]);
  }

  private onRemoveKeys() {
    this.handleKeyRemoval('menu button');
  }

  private updateNavigationButtonVisibility() { this.navigationUI.updateVisibility(); }

  public resumeAfterCollision(): void {
    // Resume driving after an obstacle/collision menu
    this.resumeDriving();
  }

  public takeExit(): void {
    // Pause driving and handle exit flow
    this.pauseDriving();
    // If there is a dedicated exit menu, show it; otherwise reuse obstacle menu path
    this.showObstacleMenuInternal(this.obstacleTypes.EXIT);
  }

  /**
   * Stop timers when scene is paused/stopped
   */
  shutdown() {
    console.log('GameScene: Shutting down - stopping timers');
    
    // Stop all timers when scene is paused
    this.stopKnobReturnTimer();
    this.stopNeutralReturnTimer();
    this.stopForwardMovementTimer();
    
    // Clear collision timer
    if (this.collisionTimer) {
      this.collisionTimer.remove();
      this.collisionTimer = null;
    }
  }

  /**
   * Clean up all timers and event listeners when scene is destroyed
   */
  destroy() {
    console.log('GameScene: Cleaning up timers and event listeners');
    
    // Stop all timers
    this.stopKnobReturnTimer();
    this.stopNeutralReturnTimer();
    this.stopForwardMovementTimer();
    
    // Clear collision timer
    if (this.collisionTimer) {
      this.collisionTimer.remove();
      this.collisionTimer = null;
    }
    
    // Remove window event listeners
    if (this.handleWindowBlur) {
      window.removeEventListener('blur', this.handleWindowBlur);
    }
    if (this.handleWindowFocus) {
      window.removeEventListener('focus', this.handleWindowFocus);
    }
    if (this.handleVisibilityChange) {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    
    // Remove scene event listeners
    this.events.off('step', this.onStepEvent, this);
    this.events.off('gamePaused', this.onGamePaused, this);
    this.events.off('gameResumed', this.onGameResumed, this);
    this.events.off('turnKey', this.onTurnKey, this);
    this.events.off('removeKeys', this.onRemoveKeys, this);
    this.events.off('ignitionMenuShown', () => this.onIgnitionMenuShown(), this);
    this.events.off('ignitionMenuHidden', () => this.onIgnitionMenuHidden(), this);
  }
}


