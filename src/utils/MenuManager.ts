/**
 * MENU MANAGER - UNIFIED MENU SYSTEM
 * 
 * This class handles all menu creation, display, and management throughout the game.
 * It provides a consistent interface for creating different types of menus with
 * proper hierarchy, styling, and user interaction handling.
 * 
 * Key Features:
 * - Menu hierarchy system (prevents menu conflicts)
 * - Unified overlay background system (same as tutorial overlays)
 * - Consistent styling and positioning
 * - Event-driven menu creation
 * - Save/load integration
 * - Slider controls for interactive elements
 * 
 * Menu Types:
 * - Start Menu: Game initialization and resume options
 * - Pause Menu: Game pause/resume controls
 * - Save Menu: Save game functionality
 * - Turn Key Menu: Car ignition with slider control
 * - Obstacle Menus: Pothole and exit interactions
 * - Game Over Menu: End game state
 * 
 * The system uses a stack-based approach to manage menu priority and
 * ensures only one menu is active at a time with proper cleanup.
 */

import Phaser from 'phaser';
import { SaveManager } from './SaveManager';

export interface MenuButton {
  text: string;
  onClick: () => void;
  style?: any;
}

export interface MenuConfig {
  title: string;
  content?: string;
  buttons: MenuButton[];
  width?: number;
  height?: number;
}

export class MenuManager {
  // ============================================================================
  // MENU PARAMETERS - Easy to modify values
  // ============================================================================
  
  // Slider Parameters
  private readonly SLIDER_WIDTH = 200;
  private readonly SLIDER_HEIGHT = 20;
  private readonly SLIDER_Y_OFFSET = 50;
  private readonly SLIDER_TRACK_COLOR = 0x333333;
  private readonly SLIDER_CORNER_RADIUS = 10;
  private readonly SLIDER_HANDLE_WIDTH = 20;
  private readonly SLIDER_HANDLE_HEIGHT = 20;
  private readonly SLIDER_HANDLE_COLOR = 0x666666;
  private readonly SLIDER_HANDLE_CORNER_RADIUS = 10;
  
  // Depths
  private readonly SLIDER_TRACK_DEPTH = 1000;
  private readonly SLIDER_HANDLE_DEPTH = 1001;
  private readonly LABELS_DEPTH = 1002;
  private readonly METER_DEPTH = 1003;
  
  // Labels
  private readonly START_LABEL_OFFSET = 30;
  private readonly TURN_KEY_LABEL_OFFSET = -30;
  private readonly LABELS_FONT_SIZE = "16px";
  private readonly LABELS_COLOR = "#ffffff";
  
  // Meter Parameters
  private readonly METER_WIDTH = 150;
  private readonly METER_HEIGHT = 10;
  private readonly METER_Y_OFFSET = 80;
  private readonly METER_BACKGROUND_COLOR = 0x222222;
  private readonly METER_CORNER_RADIUS = 5;
  private readonly METER_FILL_COLOR = 0x00ff00;
  private readonly METER_TEXT_OFFSET = 20;
  
  // Physics Parameters
  private readonly MOMENTUM_DECAY = 0.95;
  private readonly MAX_VELOCITY = 15;
  private readonly GRAVITY = 0.3;
  private readonly SENSITIVITY = 0.5;
  private readonly START_THRESHOLD = 0.9;
  private readonly START_INCREMENT = 0.5;
  
  // ============================================================================
  // CLASS PROPERTIES
  // ============================================================================
  
  // Menu Hierarchy System
  private readonly MENU_PRIORITIES = {
    START: 100,      // Highest priority - start menu
    PAUSE: 80,        // High priority - pause menu
    GAME_OVER: 70,    // High priority - game over menu
    OBSTACLE: 60,     // Medium priority - obstacle collision menu
    SAVE: 50,         // Medium priority - save menu
    TURN_KEY: 30      // Lowest priority - ignition menu
  };
  
  private scene: Phaser.Scene;
  private saveManager: SaveManager;
  private currentDialog: any = null;
  private menuStack: Array<{type: string, priority: number, config?: any}> = []; // Track menu hierarchy
  private currentDisplayedMenuType: string | null = null; // Track what menu is actually being displayed
  private userDismissedMenuType: string | null = null; // Track which specific menu was dismissed by user action

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.saveManager = SaveManager.getInstance();
    // Listen for global step events to auto-hide ephemeral overlays
    this.scene.events.on('step', this.onGlobalStep, this);
  }

  /**
   * Menu Hierarchy Management Methods
   */
  private canShowMenu(menuType: string): boolean {
    const newPriority = this.MENU_PRIORITIES[menuType as keyof typeof this.MENU_PRIORITIES];
    if (!newPriority) return true;
    
    // Check if there's a higher priority menu already showing
    const currentMenu = this.menuStack[this.menuStack.length - 1];
    console.log(`MenuManager: canShowMenu(${menuType}) - newPriority: ${newPriority}, currentMenu:`, currentMenu ? `${currentMenu.type}(${currentMenu.priority})` : 'none');
    
    if (currentMenu && currentMenu.priority > newPriority) {
      console.log(`MenuManager: Cannot show ${menuType} (priority ${newPriority}) - higher priority menu ${currentMenu.type} (priority ${currentMenu.priority}) is active`);
      return false;
    }
    
    console.log(`MenuManager: Can show ${menuType} (priority ${newPriority})`);
    return true;
  }
  
  private pushMenu(menuType: string, config?: any) {
    const priority = this.MENU_PRIORITIES[menuType as keyof typeof this.MENU_PRIORITIES];
    if (priority) {
      this.menuStack.push({ type: menuType, priority, config });
      console.log(`MenuManager: Pushed ${menuType} to stack (priority ${priority}). Stack:`, this.menuStack.map(m => `${m.type}(${m.priority})`));
    }
  }
  
  private popMenu(): {type: string, priority: number, config?: any} | null {
    const popped = this.menuStack.pop();
    console.log(`MenuManager: Popped ${popped?.type} from stack. Remaining:`, this.menuStack.map(m => `${m.type}(${m.priority})`));
    return popped || null;
  }
  
  private popSpecificMenu(menuType: string): {type: string, priority: number, config?: any} | null {
    // Find and remove the specific menu type from the stack
    const index = this.menuStack.findIndex(menu => menu.type === menuType);
    if (index !== -1) {
      const popped = this.menuStack.splice(index, 1)[0];
      console.log(`MenuManager: Popped specific ${popped.type} from stack. Remaining:`, this.menuStack.map(m => `${m.type}(${m.priority})`));
      return popped;
    }
    console.log(`MenuManager: Could not find ${menuType} in stack to pop`);
    return null;
  }

  // STORY OVERLAY -----------------------------------------------------------
  public showStoryOverlay(title: string, content: string) {
    // Non-blocking: don't use menu stack or overlay background
    this.clearCurrentDialog();
    // Create a lightweight dialog without blocking input
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    this.currentDialog = this.scene.add.container(gameWidth / 2, gameHeight / 2);
    this.currentDialog.setScrollFactor(0);
    this.currentDialog.setDepth(40000); // below regular menus
    this.currentDisplayedMenuType = 'STORY';

    const dialogBackground = this.scene.add.graphics();
    // Window background (no screen overlay)
    dialogBackground.fillStyle(0x1e1e1e, 0.9);
    dialogBackground.fillRoundedRect(-150, -125, 300, 250, 10);
    dialogBackground.lineStyle(2, 0xffffff, 1);
    dialogBackground.strokeRoundedRect(-150, -125, 300, 250, 10);
    this.currentDialog.add(dialogBackground);

    const titleText = this.scene.add.text(0, -70, title, { fontSize: '22px', color: '#ffffff', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);
    const contentText = this.scene.add.text(0, 0, content, { fontSize: '16px', color: '#ffffff', wordWrap: { width: 260 }, align: 'center' }).setOrigin(0.5);
    this.currentDialog.add([titleText, contentText]);

    // Mark as ephemeral and set step countdown
    (this.currentDialog as any).isStory = true;
    (this.currentDialog as any).stepsRemaining = 10;
  }

  private onGlobalStep() {
    if (this.currentDialog && (this.currentDialog as any).isStory) {
      (this.currentDialog as any).stepsRemaining -= 1;
      if ((this.currentDialog as any).stepsRemaining <= 0) {
        this.clearCurrentDialog();
      }
    }
  }
  
  public getCurrentMenuType(): string | null {
    const current = this.menuStack[this.menuStack.length - 1];
    return current ? current.type : null;
  }
  
  private shouldRestorePreviousMenu(): boolean {
    // Only restore if there's a menu in the stack, no current dialog, and the menu being restored wasn't user-dismissed
    if (this.menuStack.length === 0 || this.currentDialog) return false;
    
    const menuToRestore = this.menuStack[this.menuStack.length - 1];
    const shouldRestore = menuToRestore.type !== this.userDismissedMenuType;
    
    console.log('MenuManager: shouldRestorePreviousMenu - stack length:', this.menuStack.length, 'currentDialog:', !!this.currentDialog, 'menuToRestore:', menuToRestore.type, 'userDismissed:', this.userDismissedMenuType, 'shouldRestore:', shouldRestore);
    if (this.menuStack.length > 0) {
      console.log('MenuManager: Stack contents:', this.menuStack.map(m => `${m.type}(${m.priority})`));
    }
    return shouldRestore;
  }
  
  private restorePreviousMenu() {
    if (this.menuStack.length === 0) return;
    
    const previousMenu = this.menuStack[this.menuStack.length - 1];
    console.log(`MenuManager: Restoring previous menu: ${previousMenu.type}`);
    
    switch (previousMenu.type) {
      case 'START':
        this.popMenu();
        this.showStartMenu();
        break;
      case 'PAUSE':
        this.popMenu();
        this.showPauseMenu();
        break;
      case 'TURN_KEY':
        // Check if keys are still in ignition before restoring ignition menu
        const gameScene = this.scene.scene.get('GameScene');
        console.log('MenuManager: Attempting to restore TURN_KEY menu, keysInIgnition:', gameScene ? (gameScene as any).keysInIgnition : 'no gameScene');
        if (gameScene && (gameScene as any).keysInIgnition) {
          // Pop the menu from stack first, then show it
          console.log('MenuManager: Popping TURN_KEY from stack and showing it');
          this.popMenu();
          this.showTurnKeyMenu();
        } else {
          console.log('MenuManager: Not restoring ignition menu - keys not in ignition');
          this.popMenu(); // Remove from stack since it shouldn't be restored
        }
        break;
      case 'SAVE':
        this.popMenu();
        this.showSaveMenu();
        break;
      case 'OBSTACLE':
        if (previousMenu.config) {
          this.popMenu();
          this.showObstacleMenu(previousMenu.config.type, previousMenu.config.damage);
        }
        break;
      case 'GAME_OVER':
        this.popMenu();
        this.showGameOverMenu();
        break;
    }
  }

  public showStartMenu() {
    console.log('=== MenuManager: showStartMenu called ===');
    if (!this.canShowMenu('START')) {
      console.log('MenuManager: canShowMenu(START) returned false, returning early');
      return;
    }
    console.log('MenuManager: canShowMenu(START) returned true, proceeding');
    
    this.clearCurrentDialog();
    this.pushMenu('START');
    
    // Check if there's existing save data
    const saveData = this.saveManager.load();
    const hasExistingSave = saveData && saveData.steps > 0;
    
    let menuConfig: MenuConfig;
    
    if (hasExistingSave) {
      // Show resume menu for existing save
      const saveDate = new Date(saveData.timestamp).toLocaleString();
      menuConfig = {
        title: 'RESUME GAME',
        content: `Welcome back! You have a saved game with ${saveData.steps} steps.\nSaved: ${saveDate}`,
        buttons: [
          {
            text: 'Resume Game',
            onClick: () => {
              this.closeDialog();
              const appScene = this.scene.scene.get('AppScene');
              const gameScene = this.scene.scene.get('GameScene');
              if (appScene) {
                (appScene as any).startGame();
              }
              if (gameScene && saveData) {
                (gameScene as any).loadGame(saveData.steps);
              }
            },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
          },
          {
            text: 'Start Fresh',
            onClick: () => {
              // Clear existing save and start fresh
              this.saveManager.clearSave();
              this.closeDialog();
              const appScene = this.scene.scene.get('AppScene');
              if (appScene) {
                (appScene as any).startGame();
              }
            },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
          }
        ]
      };
    } else {
      // Show new game menu for first time
      menuConfig = {
        title: 'START GAME',
        content: 'Welcome to the game! Click Start to begin your adventure.',
        buttons: [
          {
            text: 'Start Game',
            onClick: () => {
              this.closeDialog();
              const appScene = this.scene.scene.get('AppScene');
              if (appScene) {
                (appScene as any).startGame();
              }
            },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
          }
        ]
      };
    }

    console.log('MenuManager: About to call createDialog with menuType: START');
    this.createDialog(menuConfig, 'START');
  }

  public showPauseMenu() {
    if (!this.canShowMenu('PAUSE')) return;
    
    this.clearCurrentDialog();
    this.pushMenu('PAUSE');
    
    const menuConfig: MenuConfig = {
      title: 'PAUSE MENU',
      content: 'Game is paused. Choose an option:',
      buttons: [
        {
          text: 'Resume',
          onClick: () => {
            this.closeDialog();
            const appScene = this.scene.scene.get('AppScene');
            if (appScene) {
              // Don't call togglePauseMenu() - just resume directly
              (appScene as any).isPaused = false;
              console.log('Game resumed from pause menu');
              
              // Emit resume event to GameScene
              const gameScene = this.scene.scene.get('GameScene');
              if (gameScene) {
                gameScene.events.emit('gameResumed');
              }
            }
          },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        },
        {
          text: 'Restart',
          onClick: () => {
            this.closeDialog();
            window.location.reload();
          },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        }
      ]
    };

    this.createDialog(menuConfig, 'PAUSE');
  }

  public showSaveMenu() {
    if (!this.canShowMenu('SAVE')) return;
    
    this.clearCurrentDialog();
    this.pushMenu('SAVE');
    
    const saveData = this.saveManager.load();
    const hasSaveData = saveData && saveData.steps > 0;
    
    const menuConfig: MenuConfig = {
      title: 'SAVE MENU',
      content: hasSaveData 
        ? `Current save: ${saveData.steps} steps (${saveData.timestamp})`
        : 'No save data found',
      buttons: [
        {
          text: 'Save Game',
          onClick: () => {
            const appScene = this.scene.scene.get('AppScene');
            if (appScene) {
              const steps = (appScene as any).getStep();
              this.saveManager.save(steps);
              this.closeDialog();
            }
          },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        },
        {
          text: 'Load Game',
          onClick: () => {
            const saveData = this.saveManager.load();
            if (saveData && saveData.steps > 0) {
              const gameScene = this.scene.scene.get('GameScene');
              if (gameScene) {
                (gameScene as any).loadGame(saveData.steps);
              }
            }
            this.closeDialog();
          },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        },
        {
          text: 'Clear Save',
          onClick: () => {
            this.saveManager.clearSave();
            this.closeDialog();
          },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        },
        {
          text: 'Close',
          onClick: () => {
            this.closeDialog();
          },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        }
      ]
    };

    this.createDialog(menuConfig, 'SAVE');
  }

  public showPotholeMenu() {
    this.clearCurrentDialog();
    
    const menuConfig: MenuConfig = {
      title: 'POTHOLE!',
      content: 'You hit a pothole! Your car took some damage. Take a moment to recover.',
      buttons: [
        {
          text: 'Continue',
          onClick: () => {
            this.closeDialog();
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              (gameScene as any).resumeAfterCollision();
            }
          },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        }
      ]
    };

    this.createDialog(menuConfig);
  }

  public showExitMenu() {
    this.clearCurrentDialog();
    
    const menuConfig: MenuConfig = {
      title: 'EXIT FOUND!',
      content: 'You found an exit! This could lead to new opportunities.',
      buttons: [
        {
          text: 'Take Exit',
          onClick: () => {
            this.closeDialog();
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              (gameScene as any).takeExit();
            }
          },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        },
        {
          text: 'Continue Driving',
          onClick: () => {
            this.closeDialog();
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              (gameScene as any).resumeAfterCollision();
            }
          },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        }
      ]
    };

    this.createDialog(menuConfig);
  }

  public showTurnKeyMenu() {
    console.log('MenuManager: showTurnKeyMenu called');
    console.log('MenuManager: Current stack before showTurnKeyMenu:', this.menuStack.map(m => `${m.type}(${m.priority})`));
    console.log('MenuManager: Current dialog exists:', !!this.currentDialog);
    console.log('MenuManager: Current displayed menu type:', this.currentDisplayedMenuType);
    
    if (!this.canShowMenu('TURN_KEY')) {
      console.log('MenuManager: Ignition menu blocked by higher priority menu - will show when hierarchy allows');
      // Still push to stack so it can be restored when the blocking menu closes
      this.pushMenu('TURN_KEY');
      console.log('MenuManager: Pushed TURN_KEY to stack. Stack now:', this.menuStack.map(m => `${m.type}(${m.priority})`));
      return; // Don't show the menu, but the tutorial overlay will still be controlled by keysInIgnition
    }
    
    console.log('MenuManager: Showing ignition menu');
    this.clearCurrentDialog();
    this.pushMenu('TURN_KEY');
    console.log('MenuManager: Pushed TURN_KEY to stack. Stack now:', this.menuStack.map(m => `${m.type}(${m.priority})`));
    
    const menuConfig: MenuConfig = {
      title: 'IGNITION',
      content: 'Keys are in the ignition! Turn the dial to start the car. Swipe down to remove keys.',
      buttons: [] // No buttons - swipe down to remove keys
    };

    this.createDialog(menuConfig, 'TURN_KEY');
    
    // Add drag dial after creating the dialog
    this.addTurnKeyDial();
    
    // Emit event to notify GameScene that ignition menu is shown
    console.log('MenuManager: Emitting ignitionMenuShown event');
    this.scene.events.emit('ignitionMenuShown');
    
    // Also emit on GameScene
    const gameScene = this.scene.scene.get('GameScene');
    if (gameScene) {
      console.log('MenuManager: Emitting ignitionMenuShown event on GameScene');
      gameScene.events.emit('ignitionMenuShown');
    }
  }

  private addTurnKeyDial() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;
    
    // Create vertical slider
    const sliderWidth = this.SLIDER_WIDTH;
    const sliderHeight = this.SLIDER_HEIGHT;
    const sliderX = centerX;
    const sliderY = centerY + this.SLIDER_Y_OFFSET;
    
    // Create slider track (background)
    const sliderTrack = this.scene.add.graphics();
    sliderTrack.fillStyle(this.SLIDER_TRACK_COLOR);
    sliderTrack.fillRoundedRect(sliderX - sliderWidth/2, sliderY - sliderHeight/2, sliderWidth, sliderHeight, this.SLIDER_CORNER_RADIUS);
    sliderTrack.setScrollFactor(0);
    sliderTrack.setDepth(this.SLIDER_TRACK_DEPTH);
    
    // Create slider handle
    const handleWidth = this.SLIDER_HANDLE_WIDTH;
    const handleHeight = this.SLIDER_HANDLE_HEIGHT;
    const handle = this.scene.add.graphics();
    handle.fillStyle(this.SLIDER_HANDLE_COLOR);
    handle.fillRoundedRect(sliderX - handleWidth/2, sliderY + sliderHeight/2 - handleHeight, handleWidth, handleHeight, this.SLIDER_HANDLE_CORNER_RADIUS);
    handle.setScrollFactor(0);
    handle.setDepth(this.SLIDER_HANDLE_DEPTH);
    
    // Add text labels
    const startLabel = this.scene.add.text(centerX, centerY + sliderHeight/2 + this.START_LABEL_OFFSET, 'START', {
      fontSize: this.LABELS_FONT_SIZE,
      color: this.LABELS_COLOR,
      fontStyle: 'bold'
    });
    startLabel.setOrigin(0.5);
    startLabel.setScrollFactor(0);
    startLabel.setDepth(this.LABELS_DEPTH);
    
    const turnKeyLabel = this.scene.add.text(centerX, centerY - sliderHeight/2 + this.TURN_KEY_LABEL_OFFSET, 'Turn Key', {
      fontSize: this.LABELS_FONT_SIZE,
      color: this.LABELS_COLOR,
      fontStyle: 'bold'
    });
    turnKeyLabel.setOrigin(0.5);
    turnKeyLabel.setScrollFactor(0);
    turnKeyLabel.setDepth(this.LABELS_DEPTH);
    
    // Add start value meter
    const meterWidth = this.METER_WIDTH;
    const meterHeight = this.METER_HEIGHT;
    const meterX = centerX;
    const meterY = centerY + sliderHeight/2 + this.METER_Y_OFFSET;
    
    // Meter background
    const meterBackground = this.scene.add.graphics();
    meterBackground.fillStyle(this.METER_BACKGROUND_COLOR);
    meterBackground.fillRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, meterWidth, meterHeight, this.METER_CORNER_RADIUS);
    meterBackground.setScrollFactor(0);
    meterBackground.setDepth(this.METER_DEPTH);
    
    // Meter fill
    const meterFill = this.scene.add.graphics();
    meterFill.fillStyle(this.METER_FILL_COLOR); // Green when accumulating
    meterFill.setScrollFactor(0);
    meterFill.setDepth(this.METER_DEPTH);
    
    // Meter text
    const meterText = this.scene.add.text(centerX, meterY + this.METER_TEXT_OFFSET, 'START: 0%', {
      fontSize: this.LABELS_FONT_SIZE,
      color: this.LABELS_COLOR,
      fontStyle: 'bold'
    });
    meterText.setOrigin(0.5);
    meterText.setScrollFactor(0);
    meterText.setDepth(this.METER_DEPTH);
    
    // Track slider state
    let isDragging = false;
    let currentProgress = 0; // 0 = bottom, 1 = top
    const maxProgress = 1.0; // 100% to start the car (must reach the very top)
    let lastPointerY = 0;
    let lastPointerX = 0;
    let lastUpdateTime = 0;
    let velocity = 0;
    const momentumDecay = this.MOMENTUM_DECAY; // How quickly momentum fades
    const maxVelocity = this.MAX_VELOCITY; // Increased maximum velocity per frame
    const gravity = this.GRAVITY; // How much the slider falls each frame
    const sensitivity = this.SENSITIVITY; // How sensitive the slider is to mouse movement (higher = more sensitive)
    
    // Start value system
    let startValue = 0; // 0-100, accumulates when slider > 90%
    const startThreshold = this.START_THRESHOLD; // 90% slider position to start accumulating
    const startIncrement = this.START_INCREMENT; // How much to add per frame when over threshold
    //.4 is slow, .8 is medium, 1.2 is fast
    const startMax = 100; // Maximum start value to trigger ignition
    let carStarted = false; // Track if car has been started
    
    // Create pointer down handler (works anywhere on screen)
    const pointerDownHandler = (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      lastPointerY = pointer.y;
      lastPointerX = pointer.x;
      lastUpdateTime = Date.now();
      velocity = 0;
    };
    
    // Create pointer move handler
    const pointerMoveHandler = (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      
      // Don't allow slider movement if car has started
      if (carStarted) return;
      
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTime;
      
      if (deltaTime > 0) {
        // Calculate velocity based on pointer movement
        const deltaY = lastPointerY - pointer.y; // Inverted: up movement is positive
        const newVelocity = deltaY / sliderHeight; // Normalize to slider height
        
        // Check for swipe down gesture (much more restrictive)
        const deltaX = pointer.x - lastPointerX;
        const swipeThreshold = 100; // Much larger threshold
        const verticalDominance = Math.abs(deltaY) > Math.abs(deltaX) * 2; // Must be primarily vertical
        
        if (deltaY > swipeThreshold && verticalDominance && Math.abs(deltaY) > 150) {
          // Swipe down detected - remove keys (much harder to trigger)
          console.log('Swipe down detected - removing keys');
          this.closeDialog();
          const gameScene = this.scene.scene.get('GameScene');
          if (gameScene) {
            gameScene.events.emit('removeKeys');
          }
          return;
        }
        
        // Apply sensitivity multiplier for easier movement
        velocity = newVelocity * sensitivity;
        
        // Clamp velocity to reasonable limits
        velocity = Phaser.Math.Clamp(velocity, -maxVelocity, maxVelocity);
        
        // Update progress based on velocity
        currentProgress += velocity;
        currentProgress = Phaser.Math.Clamp(currentProgress, 0, 1);
        
        updateSlider();
      }
      
      lastPointerY = pointer.y;
      lastPointerX = pointer.x;
      lastUpdateTime = currentTime;
    };
    
    // Create pointer up handler
    const pointerUpHandler = () => {
      isDragging = false;
    };
    
    // Update slider visual
    const updateSlider = () => {
      const handleY = sliderY + sliderHeight/2 - (currentProgress * sliderHeight) - handleHeight/2;
      
      handle.clear();
      handle.fillStyle(this.SLIDER_HANDLE_COLOR);
      handle.fillRoundedRect(sliderX - handleWidth/2, handleY, handleWidth, handleHeight, this.SLIDER_HANDLE_CORNER_RADIUS);
    };
    
    // Update meter visual
    const updateMeter = () => {
      const fillWidth = (startValue / startMax) * meterWidth;
      meterFill.clear();
      meterFill.fillStyle(this.METER_FILL_COLOR);
      meterFill.fillRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, fillWidth, meterHeight, this.METER_CORNER_RADIUS);
      
      meterText.setText(`START: ${Math.floor(startValue)}%`);
    };
    
    // Add momentum update loop
    const momentumUpdate = () => {
      // Don't apply gravity or movement if car has started
      if (!carStarted) {
        // Apply gravity - slider constantly falls down
        velocity -= gravity;
        
        if (!isDragging && Math.abs(velocity) > 0.001) {
          // Continue momentum when not dragging
          currentProgress += velocity;
          currentProgress = Phaser.Math.Clamp(currentProgress, 0, 1);
          
          // Apply momentum decay
          velocity *= momentumDecay;
          
          updateSlider();
        } else if (!isDragging) {
          // Apply gravity even when not dragging
          currentProgress += velocity;
          currentProgress = Phaser.Math.Clamp(currentProgress, 0, 1);
          updateSlider();
        }
      } else {
        // Car has started - keep slider at the top
        currentProgress = 1.0;
        updateSlider();
      }
      
      // Check if slider is over 90% to accumulate start value
      if (currentProgress >= startThreshold) {
        startValue += startIncrement;
        startValue = Math.min(startValue, startMax);
        updateMeter();
        
        // Check if start value reached maximum to start the car
        if (startValue >= startMax) {
          console.log('Car started!');
          carStarted = true; // Mark car as started
          // Add delay before closing menu
          this.scene.time.delayedCall(500, () => {
            this.closeDialog();
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              gameScene.events.emit('turnKey');
            }
          });
        }
      } else {
        // Decrease start value when slider is below threshold
        if (startValue > 0) {
          startValue -= startIncrement * 2; // Decrease faster than it increases
          startValue = Math.max(startValue, 0);
          updateMeter();
        }
      }
    };
    
    // Start momentum update loop
    const momentumTimer = this.scene.time.addEvent({
      delay: 16, // ~60fps
      callback: momentumUpdate,
      loop: true
    });
    
    // Add event listeners (global - works anywhere on screen)
    this.scene.input.on('pointerdown', pointerDownHandler);
    this.scene.input.on('pointermove', pointerMoveHandler);
    this.scene.input.on('pointerup', pointerUpHandler);
    
    // Store handlers for cleanup
    (this.currentDialog as any).pointerDownHandler = pointerDownHandler;
    (this.currentDialog as any).pointerMoveHandler = pointerMoveHandler;
    (this.currentDialog as any).pointerUpHandler = pointerUpHandler;
    (this.currentDialog as any).momentumTimer = momentumTimer;
    
    // Store references for cleanup
    (this.currentDialog as any).turnKeyDial = { sliderTrack, handle };
    (this.currentDialog as any).dialLabel = { startLabel, turnKeyLabel };
    (this.currentDialog as any).startMeter = { meterBackground, meterFill, meterText };
  }

  public showObstacleMenu(obstacleType: string, damage: number) {
    if (!this.canShowMenu('OBSTACLE')) return;
    
    this.clearCurrentDialog();
    this.pushMenu('OBSTACLE', { type: obstacleType, damage });
    
    const menuConfig: MenuConfig = {
      title: 'COLLISION!',
      content: `You hit a ${obstacleType}! Damage: ${damage}%`,
      buttons: [
        {
          text: 'Continue',
          onClick: () => {
            this.closeDialog();
            // Resume driving after collision
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              (gameScene as any).resumeAfterCollision();
            }
          },
          style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        }
      ]
    };

    this.createDialog(menuConfig, 'OBSTACLE');
  }

  public showGameOverMenu() {
    if (!this.canShowMenu('GAME_OVER')) return;
    
    this.clearCurrentDialog();
    this.pushMenu('GAME_OVER');
    
    const menuConfig: MenuConfig = {
      title: 'GAME OVER',
      content: 'Time\'s up! You lost. Better luck next time!',
      buttons: [
        {
          text: 'Restart Game',
          onClick: () => {
            this.closeDialog();
            window.location.reload();
          },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        }
      ]
    };

    this.createDialog(menuConfig, 'GAME_OVER');
  }

  private createDialog(menuConfig: MenuConfig, menuType?: string) {
    console.log('=== MenuManager: createDialog called for menuType:', menuType, '===');
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Create a simple container-based dialog instead of RexUI dialog
    this.currentDialog = this.scene.add.container(gameWidth / 2, gameHeight / 2);
    this.currentDialog.setScrollFactor(0);
    this.currentDialog.setDepth(50000);
    
    // Track what menu type is being displayed
    this.currentDisplayedMenuType = menuType || null;
    
    // Background - use unified overlay system
    // For story-type overlay, skip grey background; otherwise use default overlay
    let background: Phaser.GameObjects.Container | null = null;
    if (menuType !== 'STORY') {
      background = this.createOverlayBackground(gameWidth, gameHeight, [
        { x: gameWidth / 2 - 150, y: gameHeight / 2 - 175, width: 300, height: 350 }
      ]);
    }
    
    // Store reference for cleanup
    (this.currentDialog as any).background = background;
    
    console.log('MenuManager: Menu background created with cutout for dialog area');
    
    // Dialog background (visible background for the dialog itself)
    const dialogBackground = this.scene.add.graphics();
    if (menuType === 'STORY') {
      // No grey background; draw only border for story overlay
      dialogBackground.lineStyle(2, 0xffffff, 1);
      dialogBackground.strokeRoundedRect(-150, -175, 300, 350, 10);
    } else {
      dialogBackground.fillStyle(0x333333, 0.9);
      dialogBackground.fillRoundedRect(-150, -175, 300, 350, 10);
      dialogBackground.lineStyle(2, 0xffffff, 1);
      dialogBackground.strokeRoundedRect(-150, -175, 300, 350, 10);
    }
    dialogBackground.setDepth(-1); // Behind other dialog content
    this.currentDialog.add(dialogBackground);
    
    // Title
    const title = this.scene.add.text(0, -80, menuConfig.title, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.currentDialog.add(title);
    
    console.log('MenuManager: Dialog background and title added. Dialog children count:', this.currentDialog.list.length);
    
    // Content
    if (menuConfig.content) {
      const content = this.scene.add.text(0, -20, menuConfig.content, {
        fontSize: '16px',
        color: '#ffffff',
        wordWrap: { width: 250 },
        align: 'center'
      });
      content.setOrigin(0.5);
      this.currentDialog.add(content);
    }
    
    // Buttons
    const buttonY = menuConfig.content ? 20 : 0;
    const buttonSpacing = 50;
    
    menuConfig.buttons.forEach((button, index) => {
      const buttonText = this.scene.add.text(0, buttonY + (index * buttonSpacing), button.text, {
        fontSize: '18px',
        color: button.style?.color || '#ffffff',
        backgroundColor: button.style?.backgroundColor || '#34495e',
        padding: { x: 15, y: 8 }
      });
      buttonText.setOrigin(0.5);
      buttonText.setInteractive();
      
      buttonText.on('pointerdown', () => {
        button.onClick();
      });
      
      buttonText.on('pointerover', () => {
        this.scene.tweens.add({
          targets: buttonText,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100
        });
      });
      
      buttonText.on('pointerout', () => {
        this.scene.tweens.add({
          targets: buttonText,
          scaleX: 1,
          scaleY: 1,
          duration: 100
        });
      });
      
      this.currentDialog.add(buttonText);
    });
    
    console.log('MenuManager: All buttons added. Dialog children count:', this.currentDialog.list.length);
    console.log('MenuManager: Dialog children:', this.currentDialog.list.map(child => child.constructor.name));
    
    // Notify GameScene that a menu is now open
    const gameScene = this.scene.scene.get('GameScene');
    if (gameScene && gameScene.updateAllTutorialOverlays) {
      gameScene.updateAllTutorialOverlays();
    }
    
    console.log('MenuManager: After GameScene notification. Dialog children count:', this.currentDialog.list.length);
    console.log('MenuManager: Dialog children after notification:', this.currentDialog.list.map(child => child.constructor.name));
  }

  private createActionButtons(buttons: MenuButton[]) {
    return buttons.map(button => {
      const buttonText = this.scene.add.text(0, 0, button.text, {
        fontSize: '18px',
        color: button.style?.color || '#ffffff',
        backgroundColor: button.style?.backgroundColor || '#34495e',
        padding: { x: 15, y: 8 }
      });
      
      buttonText.setInteractive()
        .on('pointerdown', () => {
          button.onClick();
        })
        .on('pointerover', () => {
          this.scene.tweens.add({
            targets: buttonText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100
          });
        })
        .on('pointerout', () => {
          this.scene.tweens.add({
            targets: buttonText,
            scaleX: 1,
            scaleY: 1,
            duration: 100
          });
        });
      
      return buttonText;
    });
    
    console.log('MenuManager: createDialog completed. Final dialog children count:', this.currentDialog.list.length);
    console.log('MenuManager: Dialog depth:', this.currentDialog.depth);
    console.log('MenuManager: Dialog visible:', this.currentDialog.visible);
  }

  private createOverlayBackground(gameWidth: number, gameHeight: number, cutouts: Array<{x: number, y: number, width: number, height: number}>) {
    // Create overlay container
    const overlay = this.scene.add.container(0, 0);
    overlay.setScrollFactor(0);
    overlay.setDepth(49999);
    
    // Create semi-transparent black background covering the screen (same as tutorial overlay)
    const background = this.scene.add.graphics();
    background.fillStyle(0x000000, 0.7); // Black, 70% opacity
    background.fillRect(0, 0, gameWidth, gameHeight);
    overlay.add(background);
    
    // Create mask graphics for cutouts
    const maskGraphics = this.scene.make.graphics();
    
    // Draw cutouts (white areas become transparent)
    cutouts.forEach(cutout => {
      maskGraphics.fillStyle(0xffffff);
      maskGraphics.fillRect(cutout.x, cutout.y, cutout.width, cutout.height);
    });
    
    // Create BitmapMask with inverted alpha (white areas become cutouts)
    const mask = new Phaser.Display.Masks.BitmapMask(this.scene, maskGraphics);
    mask.invertAlpha = true;
    background.setMask(mask);
    
    return overlay;
  }

  private clearCurrentDialog() {
    if (this.currentDialog) {
      // Clean up background if it exists
      if ((this.currentDialog as any).background) {
        (this.currentDialog as any).background.destroy();
      }
      
      // Clean up turn key slider if it exists
      if ((this.currentDialog as any).turnKeyDial) {
        const slider = (this.currentDialog as any).turnKeyDial;
        if (slider.sliderTrack) slider.sliderTrack.destroy();
        if (slider.handle) slider.handle.destroy();
      }
      if ((this.currentDialog as any).dialLabel) {
        const labels = (this.currentDialog as any).dialLabel;
        if (labels.startLabel) labels.startLabel.destroy();
        if (labels.turnKeyLabel) labels.turnKeyLabel.destroy();
      }
      if ((this.currentDialog as any).startMeter) {
        const meter = (this.currentDialog as any).startMeter;
        if (meter.meterBackground) meter.meterBackground.destroy();
        if (meter.meterFill) meter.meterFill.destroy();
        if (meter.meterText) meter.meterText.destroy();
      }
      
      // Clean up event listeners
      if ((this.currentDialog as any).pointerDownHandler) {
        this.scene.input.off('pointerdown', (this.currentDialog as any).pointerDownHandler);
      }
      if ((this.currentDialog as any).pointerMoveHandler) {
        this.scene.input.off('pointermove', (this.currentDialog as any).pointerMoveHandler);
      }
      if ((this.currentDialog as any).pointerUpHandler) {
        this.scene.input.off('pointerup', (this.currentDialog as any).pointerUpHandler);
      }
      
      // Clean up momentum timer
      if ((this.currentDialog as any).momentumTimer) {
        (this.currentDialog as any).momentumTimer.destroy();
      }
      
      this.currentDialog.destroy();
      this.currentDialog = null;
      
      // Only emit ignitionMenuHidden if the current menu was actually an ignition menu
      if (this.currentDisplayedMenuType === 'TURN_KEY') {
        console.log('MenuManager: Emitting ignitionMenuHidden event');
        this.scene.events.emit('ignitionMenuHidden');
        
        // Also emit on GameScene
        const gameScene = this.scene.scene.get('GameScene');
        if (gameScene) {
          console.log('MenuManager: Emitting ignitionMenuHidden event on GameScene');
          gameScene.events.emit('ignitionMenuHidden');
        }
      }
      
      // Clear the displayed menu type
      this.currentDisplayedMenuType = null;
      
      // Check if we should restore a previous menu
      if (this.shouldRestorePreviousMenu()) {
        // Add a small delay to ensure cleanup is complete
        this.scene.time.delayedCall(100, () => {
          this.restorePreviousMenu();
          // Reset the user dismissed flag after restoration is complete
          this.userDismissedMenuType = null;
        });
      } else {
        // Reset the user dismissed flag if no restoration is needed
        this.userDismissedMenuType = null;
      }
      
      // Notify GameScene that menu state has changed
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene && gameScene.updateAllTutorialOverlays) {
        gameScene.updateAllTutorialOverlays();
      }
    }
  }

  private closeDialog() {
    // Mark the current menu as user dismissed to prevent its restoration
    this.userDismissedMenuType = this.currentDisplayedMenuType;
    
    // Pop the current displayed menu from the stack (not necessarily the top)
    if (this.currentDisplayedMenuType) {
      this.popSpecificMenu(this.currentDisplayedMenuType);
    }
    
    this.clearCurrentDialog();
    // Don't reset the flag immediately - let clearCurrentDialog handle it after restoration
  }

  public closeCurrentDialog() {
    console.log('MenuManager: closeCurrentDialog called');
    // Mark the current menu as user dismissed to prevent its restoration
    this.userDismissedMenuType = this.currentDisplayedMenuType;
    
    // Pop the current displayed menu from the stack (not necessarily the top)
    if (this.currentDisplayedMenuType) {
      this.popSpecificMenu(this.currentDisplayedMenuType);
    }
    
    this.clearCurrentDialog();
    // Don't reset the flag immediately - let clearCurrentDialog handle it after restoration
  }
}
