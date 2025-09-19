/**
 * MENU MANAGER - SIMPLIFIED UNIFIED MENU SYSTEM
 * 
 * This class handles all menu creation, display, and management throughout the game.
 * It provides a consistent interface for creating different types of menus with
 * proper hierarchy, styling, and user interaction handling.
 * 
 * Key Features:
 * - Simplified menu hierarchy system (prevents menu conflicts)
 * - Category-based menu management (PERSISTENT, TEMPORARY, ONE_TIME, OVERLAY)
 * - Unified overlay background system (same as tutorial overlays)
 * - Consistent styling and positioning
 * - Event-driven menu creation
 * - Save/load integration
 * - Slider controls for interactive elements
 * 
 * Menu Categories:
 * - PERSISTENT: Menus that should be restored (START, PAUSE, GAME_OVER, TURN_KEY)
 * - TEMPORARY: Menus that can be restored but are context-dependent (OBSTACLE, EXIT, SHOP, SAVE)
 * - ONE_TIME: Menus that should never be restored (CYOA, STORY, MORAL_DECISION)
 * - OVERLAY: Non-blocking overlays (TUTORIAL, PET_STORY)
 * 
 * The system uses a simplified stack-based approach with clear cleanup rules
 * and ensures only one menu is active at a time with predictable behavior.
 */

import Phaser from 'phaser';
import { SaveManager } from './SaveManager';
import { MENU_CONFIG, UI_CONFIG } from '../config/GameConfig';

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

/**
 * MenuManager - Handles all game menus with universal auto-completion system
 * 
 * AUTO-COMPLETION SYSTEM:
 * - Prevents game from getting stuck on functional menus
 * - Uses step-based counting when game is running, timer-based when paused
 * - 12-step countdown for all functional menus
 * 
 * MENUS WITH AUTO-COMPLETION:
 * - TURN_KEY (ignition) - Prevents game from getting stuck
 * - SHOP - Prevents game from getting stuck
 * - PAUSE - Prevents game from getting stuck
 * - STORY - Prevents game from getting stuck
 * 
 * MENUS WITHOUT AUTO-COMPLETION:
 * - START - Initial menu, player chooses when to start
 * - CYOA - Interactive story content that players should engage with
 * - DESTINATION - Interactive planning content that players should engage with
 * - EXIT - Interactive shop selection that players should engage with
 * 
 * MENU CATEGORIES:
 * - PERSISTENT: Can be restored (PAUSE, SAVE, LOAD)
 * - TEMPORARY: Single use, not restored (TURN_KEY, EXIT, SHOP, CYOA, STORY, DESTINATION)
 * - ONE_TIME: Cleaned up completely (GAME_OVER)
 * - OVERLAY: Ephemeral, auto-hide (tutorial overlays)
 */
export class MenuManager {
  // ============================================================================
  // MENU PARAMETERS - Using centralized configuration
  // ============================================================================
  
  // Text display callbacks for cleanup
  private textDisplayCallbacks: Phaser.Time.TimerEvent[] = []
  
  // Universal menu auto-completion tracking
  private menuAutoCompleteStepCount: number = 0
  private menuAutoCompleteTimer: Phaser.Time.TimerEvent | null = null
  private menuCountdownText: Phaser.GameObjects.Text | null = null
  private menuCountdownTimer: Phaser.Time.TimerEvent | null = null
  private currentMenuAutoCompleteType: string | null = null;
  
  // Slider Parameters
  private readonly SLIDER_WIDTH = MENU_CONFIG.sliderWidth;
  private readonly SLIDER_HEIGHT = MENU_CONFIG.sliderHeight;
  private readonly SLIDER_Y_OFFSET = MENU_CONFIG.sliderYOffset;
  private readonly SLIDER_TRACK_COLOR = MENU_CONFIG.sliderTrackColor;
  private readonly SLIDER_CORNER_RADIUS = MENU_CONFIG.sliderCornerRadius;
  private readonly SLIDER_HANDLE_WIDTH = MENU_CONFIG.sliderHandleWidth;
  private readonly SLIDER_HANDLE_HEIGHT = MENU_CONFIG.sliderHandleHeight;
  private readonly SLIDER_HANDLE_COLOR = MENU_CONFIG.sliderHandleColor;
  private readonly SLIDER_HANDLE_CORNER_RADIUS = MENU_CONFIG.sliderHandleCornerRadius;
  
  // Depths
  private readonly SLIDER_TRACK_DEPTH = MENU_CONFIG.sliderTrackDepth;
  private readonly SLIDER_HANDLE_DEPTH = MENU_CONFIG.sliderHandleDepth;
  private readonly LABELS_DEPTH = MENU_CONFIG.labelsDepth;
  private readonly METER_DEPTH = MENU_CONFIG.meterDepth;
  
  // Labels
  private readonly START_LABEL_OFFSET = MENU_CONFIG.startLabelOffset;
  private readonly TURN_KEY_LABEL_OFFSET = MENU_CONFIG.turnKeyLabelOffset;
  private readonly LABELS_FONT_SIZE = MENU_CONFIG.labelsFontSize;
  private readonly LABELS_COLOR = MENU_CONFIG.labelsColor;
  
  // Meter Parameters
  private readonly METER_WIDTH = MENU_CONFIG.meterWidth;
  private readonly METER_HEIGHT = MENU_CONFIG.meterHeight;
  private readonly METER_Y_OFFSET = MENU_CONFIG.meterYOffset;
  private readonly METER_BACKGROUND_COLOR = MENU_CONFIG.meterBackgroundColor;
  private readonly METER_CORNER_RADIUS = MENU_CONFIG.meterCornerRadius;
  private readonly METER_FILL_COLOR = MENU_CONFIG.meterFillColor;
  private readonly METER_TEXT_OFFSET = MENU_CONFIG.meterTextOffset;
  
  // Physics Parameters
  private readonly MOMENTUM_DECAY = MENU_CONFIG.momentumDecay;
  private readonly MAX_VELOCITY = MENU_CONFIG.maxVelocity;
  private readonly GRAVITY = MENU_CONFIG.gravity;
  private readonly SENSITIVITY = MENU_CONFIG.sensitivity;
  private readonly START_THRESHOLD = MENU_CONFIG.startThreshold;
  private readonly START_INCREMENT = MENU_CONFIG.startIncrement;
  
  // ============================================================================
  // CLASS PROPERTIES
  // ============================================================================
  
  // Menu Hierarchy System - Simplified
  private readonly MENU_PRIORITIES = {
    TURN_KEY: 110,    // Highest priority - turn key menu (must always show)
    START: 100,       // High priority - start menu
    PAUSE: 80,        // High priority - pause menu
    GAME_OVER: 70,    // High priority - game over menu
    OBSTACLE: 60,     // Medium priority - obstacle collision menu
    REGION_CHOICE: 55, // Medium priority - region choice menu
    SAVE: 50,         // Medium priority - save menu
    DESTINATION: 50,  // Medium priority - destination menu
    EXIT: 50,         // Medium priority - exit choice menu
    SHOP: 50,         // Medium priority - shop menu
    CYOA: 50,         // Medium priority - choose-your-own-adventure menu
    STORY: 50,        // Medium priority - story menu
    VIRTUAL_PET: 50,  // Medium priority -  menu
    MORAL_DECISION: 50, // Medium priority - moral decision menu
    PET_STORY: 40,    // Low priority - pet story UI
    TUTORIAL: 20      // Lowest priority - tutorial overlay
  };

  // Menu Categories - Simplified cleanup rules
  private readonly MENU_CATEGORIES = {
    PERSISTENT: ['START', 'PAUSE', 'GAME_OVER', 'TURN_KEY'], // Menus that should be restored
    TEMPORARY: ['OBSTACLE', 'EXIT', 'SHOP', 'SAVE'], // Menus that can be restored but are context-dependent
    ONE_TIME: ['CYOA', 'STORY', 'MORAL_DECISION'], // Menus that should never be restored
    OVERLAY: ['TUTORIAL', 'PET_STORY'] // Non-blocking overlays
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
    // Listen for CYOA menu events
    this.scene.events.on('showCyoaMenu', this.showCyoaMenu, this);
    // Listen for step events for universal menu auto-completion
    this.scene.events.on('step', this.onStepEvent, this);
  }

  /**
   * Start universal menu auto-completion
   */
  private startMenuAutoComplete(menuType: string) {
    // Skip auto-completion for interactive menus that players should engage with
    if (menuType === 'START' || menuType === 'CYOA' || menuType === 'DESTINATION' || menuType === 'EXIT') {
      return;
    }
    
    this.currentMenuAutoCompleteType = menuType;
    this.menuAutoCompleteStepCount = 0;
    
    // Check if steps are being counted (game is running)
    const appScene = this.scene.scene.get('AppScene');
    const isGameRunning = appScene && !(appScene as any).isPaused && (appScene as any).gameStarted;
    
    if (isGameRunning) {
      // Use step-based counting
      this.addMenuCountdown(menuType, 'steps');
    } else {
      // Use timer-based counting (step-lengths)
      this.startMenuCountdownTimer(menuType);
    }
  }

  /**
   * Stop universal menu auto-completion
   */
  private stopMenuAutoComplete() {
    this.currentMenuAutoCompleteType = null;
    this.menuAutoCompleteStepCount = 0;
    
    // Stop timer if running
    if (this.menuCountdownTimer) {
      this.menuCountdownTimer.destroy();
      this.menuCountdownTimer = null;
    }
    
    // Clear countdown text
    if (this.menuCountdownText) {
      this.menuCountdownText.destroy();
      this.menuCountdownText = null;
    }
  }

  /**
   * Step event handler for universal menu auto-completion
   */
  private onStepEvent(step: number) {
    // Only track steps when a menu with auto-completion is open
    if (this.currentMenuAutoCompleteType && this.currentMenuAutoCompleteType !== 'START') {
      this.menuAutoCompleteStepCount++;
      const remainingSteps = 12 - this.menuAutoCompleteStepCount;
      
      // Update countdown text
      if (this.menuCountdownText) {
        this.menuCountdownText.setText(`Auto-complete in: ${remainingSteps} steps`);
      }
      
      // Auto-complete after 12 steps
      if (this.menuAutoCompleteStepCount >= 12) {
        this.autoCompleteCurrentMenu();
      }
    }
  }

  /**
   * Start timer-based countdown for menus
   */
  private startMenuCountdownTimer(menuType: string) {
    let countdown = 12; // Start with 12 step-lengths (12 seconds)
    
    // Add countdown text
    this.addMenuCountdown(menuType, 'step-lengths');
    
    // Create timer that updates every step-length (1000ms = 1 second)
    this.menuCountdownTimer = this.scene.time.addEvent({
      delay: 1000, // 1 step-length = 1000ms
      callback: () => {
        countdown--;
        
        // Update countdown text
        if (this.menuCountdownText) {
          this.menuCountdownText.setText(`Auto-complete in: ${countdown} step-lengths`);
        }
        
        // Auto-complete when countdown reaches 0
        if (countdown <= 0) {
          this.autoCompleteCurrentMenu();
        }
      },
      loop: true,
      repeat: 11 // Repeat 11 times (12 total step-lengths)
    });
  }

  /**
   * Add countdown text to current menu
   */
  private addMenuCountdown(menuType: string, unit: 'steps' | 'step-lengths') {
    // Add a small delay to ensure the dialog is fully created and positioned
    this.scene.time.delayedCall(100, () => {
      const gameWidth = this.scene.cameras.main.width;
      const gameHeight = this.scene.cameras.main.height;
      const centerX = gameWidth / 2;
      const centerY = gameHeight / 2;
      
      // Create countdown text positioned above the menu content
      this.menuCountdownText = this.scene.add.text(centerX, centerY - 100, `Auto-complete in: 12 ${unit}`, {
        fontSize: '16px',
        color: '#ff6b6b',
        fontStyle: 'bold',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
      });
      this.menuCountdownText.setOrigin(0.5);
      this.menuCountdownText.setScrollFactor(0);
      this.menuCountdownText.setDepth(1000); // High depth to appear above other elements
      
      // Store reference for cleanup
      if (this.currentDialog) {
        (this.currentDialog as any).countdownText = this.menuCountdownText;
      }
    });
  }

  /**
   * Auto-complete the current menu
   */
  private autoCompleteCurrentMenu() {
    if (!this.currentMenuAutoCompleteType) {
      return;
    }
    
    // Store the menu type before stopping auto-completion tracking
    const menuType = this.currentMenuAutoCompleteType;
    
    // Stop auto-completion tracking
    this.stopMenuAutoComplete();
    
    // Handle different menu types using the stored menu type
    switch (menuType) {
      case 'TURN_KEY':
        // For ignition menu, add delay before closing and emitting turnKey event (matches manual completion)
        this.scene.time.delayedCall(500, () => {
          this.closeDialog();
          const gameScene = this.scene.scene.get('GameScene');
          if (gameScene) {
            gameScene.events.emit('turnKey');
          }
        });
        break;
      case 'CYOA':
        // For CYOA menus, just close and resume
        this.closeDialog();
        break;
      case 'EXIT':
      case 'SHOP':
        // For exit/shop menus, close and resume
        this.closeDialog();
        break;
      case 'PAUSE':
        // For pause menu, resume game
        this.closeDialog();
        break;
      default:
        // For other menus, just close
        this.closeDialog();
        break;
    }
  }

  /**
   * Menu Hierarchy Management Methods
   */
  private canShowMenu(menuType: string): boolean {
    const newPriority = this.MENU_PRIORITIES[menuType as keyof typeof this.MENU_PRIORITIES];
    if (!newPriority) return true;
    
    // Check if there's a higher priority menu already showing
    const currentMenu = this.menuStack[this.menuStack.length - 1];
    
    if (currentMenu && currentMenu.priority > newPriority) {
      return false;
    }
    return true;
  }
  
  private pushMenu(menuType: string, config?: any) {
    const priority = this.MENU_PRIORITIES[menuType as keyof typeof this.MENU_PRIORITIES];
    if (priority) {
      this.menuStack.push({ type: menuType, priority, config });
    }
  }
  
  private popMenu(): {type: string, priority: number, config?: any} | null {
    const popped = this.menuStack.pop();
    return popped || null;
  }
  
  private popSpecificMenu(menuType: string): {type: string, priority: number, config?: any} | null {
    // Find and remove the specific menu type from the stack
    const index = this.menuStack.findIndex(menu => menu.type === menuType);
    if (index !== -1) {
      const popped = this.menuStack.splice(index, 1)[0];
      return popped;
    }
    return null;
  }

  // Simplified cleanup methods
  private clearMenusFromStack(menuType: string) {
    const initialLength = this.menuStack.length;
    this.menuStack = this.menuStack.filter(menu => menu.type !== menuType);
    const removedCount = initialLength - this.menuStack.length;
    if (removedCount > 0) {
      console.log(`MenuManager: Cleared ${removedCount} ${menuType} menu(s) from stack. Stack now:`, this.menuStack.map(m => `${m.type}(${m.priority})`));
    }
  }
  
  private resumeGame() {
    const appScene = this.scene.scene.get('AppScene');
    const gameScene = this.scene.scene.get('GameScene');
    
    if (appScene) {
      (appScene as any).isPaused = false;
      console.log('MenuManager: Game resumed');
    }
    
    if (gameScene && (gameScene as any).carStarted && (gameScene as any).carMechanics) {
      (gameScene as any).carMechanics.resumeDriving();
      console.log('MenuManager: Resumed CarMechanics driving');
    }
    
    if (gameScene) {
      gameScene.events.emit('gameResumed');
    }
  }

  private pauseGame() {
    const appScene = this.scene.scene.get('AppScene');
    const gameScene = this.scene.scene.get('GameScene');
    
    if (appScene) {
      (appScene as any).isPaused = true;
      console.log('MenuManager: Game paused');
    }
    
    if (gameScene && (gameScene as any).carStarted && (gameScene as any).carMechanics) {
      (gameScene as any).carMechanics.pauseDriving();
      console.log('MenuManager: Paused CarMechanics driving');
    }
    
    if (gameScene) {
      gameScene.events.emit('gamePaused');
    }
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
    
    // Create instant text display with brief pause
    const contentText = this.scene.add.text(0, 0, '', {
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: 260 },
      align: 'center'
    }).setOrigin(0.5);
    
    this.currentDialog.add([titleText, contentText]);
    
    // Show all text at once after brief pause
    const textCallback = this.scene.time.delayedCall(UI_CONFIG.textDisplayDelayMs, () => {
      // Safety check: ensure text object still exists and is valid
      if (contentText && contentText.scene && !contentText.scene.scene.isActive('GameScene')) {
        return; // Scene is no longer active
      }
      if (contentText && contentText.setText) {
        contentText.setText(content);
      }
    });
    this.textDisplayCallbacks.push(textCallback);

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
  
  // PET STORY UI -----------------------------------------------------------
  public showPetStoryUI(content: string) {
    // Non-blocking: don't use menu stack or overlay background
    this.clearCurrentDialog();
    
    // Get  position to position the UI above it
    const gameScene = this.scene.scene.get('GameScene');
    if (!gameScene || !(gameScene as any).virtualPet) return;
    
    // Use pet's screen-space XY for accurate placement
    const petXY = (gameScene as any).virtualPet.getPetScreenXY?.();
    if (!petXY) return;
    // Clamp on-screen and flip below if too close to top
    const cam = this.scene.cameras.main;
    const marginX = 90;
    const marginY = 50;
    let desiredX = Phaser.Math.Clamp(petXY.x, marginX, cam.width - marginX);
    let desiredYAbove = petXY.y - 80;
    let desiredY = desiredYAbove < marginY ? petXY.y + 90 : desiredYAbove;
    desiredY = Phaser.Math.Clamp(desiredY, marginY, cam.height - marginY);
    const petX = desiredX;
    const petY = desiredY;
    
    // Ensure MenuScene is rendering on top (matches story menu behavior)
    try { this.scene.scene.bringToTop('MenuScene'); } catch {}

    // Create dialog at pet position instead of screen center
    this.currentDialog = this.scene.add.container(petX, petY);
    this.currentDialog.setScrollFactor(0);
    // Place above tutorials and pet; similar to story overlay but higher to guarantee visibility
    this.currentDialog.setDepth(50010);
    this.currentDisplayedMenuType = 'PET_STORY';

    // Small window background (like story overlay but smaller)
    const dialogBackground = this.scene.add.graphics();
    dialogBackground.fillStyle(0x1e1e1e, 0.9);
    dialogBackground.fillRoundedRect(-80, -40, 160, 80, 8);
    dialogBackground.lineStyle(2, 0xffffff, 1);
    dialogBackground.strokeRoundedRect(-80, -40, 160, 80, 8);
    dialogBackground.setScrollFactor(0);
    this.currentDialog.add(dialogBackground);

    // Food meter inside the pet story UI
    const petFoodValue = (gameScene as any).virtualPet.getFoodValue?.() || 0;
    const meterWidth = 120;
    const meterHeight = 12;
    const meterY = 0;
    const meterBG = this.scene.add.rectangle(0, meterY, meterWidth, meterHeight, 0x000000, 0.65);
    meterBG.setStrokeStyle(1, 0xffffff, 0.9);
    meterBG.setScrollFactor(0);
    const fillWidth = Math.floor(meterWidth * (petFoodValue / 10));
    const meterFill = this.scene.add.rectangle(-meterWidth / 2, meterY, fillWidth, meterHeight - 3, 0x2ecc71, 1).setOrigin(0, 0.5);
    meterFill.setScrollFactor(0);
    const label = this.scene.add.text(0, -18, 'FOOD', { fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    label.setScrollFactor(0);
    this.currentDialog.add([label, meterBG, meterFill]);

    // Auto-hide after 3 steps
    (this.currentDialog as any).stepsRemaining = 3;
    (this.currentDialog as any).isStory = true; // mark as ephemeral so onGlobalStep removes it
    
    console.log('Pet story UI created at position:', petX, petY, 'petXY:', petXY, 'with depth:', this.currentDialog.depth);
  }

  // PET STORY UI for a specific pet index -----------------------------------
  public showPetStoryUIForPet(petIndex: number) {
    // Non-blocking: don't use menu stack or overlay background
    this.clearCurrentDialog();
    
    // Get  position to position the UI above it
    const gameScene = this.scene.scene.get('GameScene');
    if (!gameScene || !(gameScene as any).getVirtualPet) return;
    const pet = (gameScene as any).getVirtualPet(petIndex);
    if (!pet) return;
    
    const petXY = pet.getPetScreenXY?.();
    if (!petXY) return;
    const cam = this.scene.cameras.main;
    const uiWidth = 160;
    const uiHeight = 80;
    let petX = Phaser.Math.Clamp(petXY.x, uiWidth / 2, cam.width - uiWidth / 2);
    let petY = petXY.y - 80; // Default above
    if (petY - uiHeight / 2 < 0) petY = petXY.y + 80; // Flip below
    
    try { this.scene.scene.bringToTop('MenuScene'); } catch {}
    
    this.currentDialog = this.scene.add.container(petX, petY);
    this.currentDialog.setScrollFactor(0);
    this.currentDialog.setDepth(50010);
    this.currentDisplayedMenuType = 'PET_STORY';
    
    const dialogBackground = this.scene.add.graphics();
    dialogBackground.fillStyle(0x1e1e1e, 0.9);
    dialogBackground.fillRoundedRect(-uiWidth / 2, -uiHeight / 2, uiWidth, uiHeight, 8);
    dialogBackground.lineStyle(2, 0xffffff, 1);
    dialogBackground.strokeRoundedRect(-uiWidth / 2, -uiHeight / 2, uiWidth, uiHeight, 8);
    dialogBackground.setScrollFactor(0);
    this.currentDialog.add(dialogBackground);
    
    const foodLabel = this.scene.add.text(0, -20, 'FOOD', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    foodLabel.setScrollFactor(0);
    
    const foodBarWidth = 100;
    const foodBarHeight = 12;
    const foodBarBG = this.scene.add.rectangle(0, 5, foodBarWidth, foodBarHeight, 0x000000, 0.6);
    foodBarBG.setStrokeStyle(1, 0xffffff, 0.8);
    foodBarBG.setScrollFactor(0);
    
    const foodValue = pet.getFoodValue?.() || 0;
    const fillWidth = Math.floor(foodBarWidth * (foodValue / 10));
    const foodBarFill = this.scene.add.rectangle(-foodBarWidth/2, 5, fillWidth, foodBarHeight - 2, 0x2ecc71, 1);
    foodBarFill.setOrigin(0, 0.5);
    foodBarFill.setScrollFactor(0);
    
    this.currentDialog.add([foodLabel, foodBarBG, foodBarFill]);
    
    (this.currentDialog as any).stepsRemaining = 3;
    (this.currentDialog as any).isStory = true;
  }
  
  public getCurrentMenuType(): string | null {
    const current = this.menuStack[this.menuStack.length - 1];
    return current ? current.type : null;
  }
  
  // Debug helper to see current stack state
  public getStackState(): string {
    if (this.menuStack.length === 0) return 'Empty stack';
    return this.menuStack.map(m => `${m.type}(${m.priority})`).join(' → ');
  }
  
  private shouldRestorePreviousMenu(): boolean {
    // Basic checks
    if (this.menuStack.length === 0 || this.currentDialog) return false;
    
    const menuToRestore = this.menuStack[this.menuStack.length - 1];
    
    // NEVER restore CYOA menus - they are one-time events
    if (menuToRestore.type === 'CYOA') {
      console.log(`MenuManager: CYOA is one-time event, not restoring`);
      return false;
    }
    
    // Only restore PERSISTENT menus (START, PAUSE, GAME_OVER, TURN_KEY)
    const isPersistent = this.MENU_CATEGORIES.PERSISTENT.includes(menuToRestore.type);
    
    if (!isPersistent) {
      console.log(`MenuManager: ${menuToRestore.type} is not persistent, not restoring`);
      return false;
    }
    
    // Don't restore if user explicitly dismissed this menu type
    if (menuToRestore.type === this.userDismissedMenuType) {
      console.log(`MenuManager: User dismissed ${menuToRestore.type}, not restoring`);
      return false;
    }
    
    console.log(`MenuManager: Restoring ${menuToRestore.type} (persistent menu)`);
    return true;
  }
  
  private restorePreviousMenu() {
    if (this.menuStack.length === 0) return;
    
    const previousMenu = this.menuStack[this.menuStack.length - 1];
    console.log(`MenuManager: Restoring previous menu: ${previousMenu.type}`);
    
    // Pop the menu from stack first
    this.popMenu();
    
    // Restore based on menu type - simplified approach
    switch (previousMenu.type) {
      case 'START':
        this.showStartMenu();
        break;
      case 'PAUSE':
        this.showPauseMenu();
        break;
      case 'TURN_KEY':
        // Check if keys are still in ignition before restoring
        const gameScene = this.scene.scene.get('GameScene');
        if (gameScene && (gameScene as any).keysInIgnition) {
          this.showTurnKeyMenu();
        } else {
          console.log('MenuManager: Not restoring ignition menu - keys not in ignition');
        }
        break;
      case 'SAVE':
        this.showSaveMenu();
        break;
      case 'OBSTACLE':
        if (previousMenu.config) {
          this.showObstacleMenu(previousMenu.config.type, previousMenu.config.damage);
        }
        break;
      case 'GAME_OVER':
        this.showGameOverMenu();
        break;
      default:
        console.log(`MenuManager: No restoration logic for ${previousMenu.type}`);
        break;
    }
  }

  public showStartMenu() {
    if (!this.canShowMenu('START')) {
      return;
    }
    
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
        content: 'click start to start',
        buttons: [
          {
            text: 'start',
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
    
    // Start universal auto-completion
    this.startMenuAutoComplete('PAUSE');
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

  /**
   * Show tutorial interrupt menu
   */
  public showTutorialInterrupt() {
    if (!this.canShowMenu('TUTORIAL_INTERRUPT')) return;
    this.clearCurrentDialog();
    this.pushMenu('TUTORIAL_INTERRUPT');
    
    // Create countdown button
    let countdown = 8;
    
    const menuConfig: MenuConfig = {
      title: 'TUTORIAL',
      content: 'You have to take care of these little guys.',
      buttons: [
        {
          text: `Continue (${countdown})`,
          onClick: () => {
            // Menu will auto-close after 8 steps, but allow manual close too
            console.log('🎓 Tutorial interrupt manually closed');
            this.closeDialog();
            
            // Emit event to GameScene to trigger rearview mirror reveal
            console.log('🎓 Emitting tutorialInterruptClosed event (manual)');
            // Emit through the scene to ensure it reaches GameScene
            this.scene.scene.get('GameScene')?.events.emit('tutorialInterruptClosed');
          },
          style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#27ae60', padding: { x: 10, y: 5 } }
        }
      ]
    };
    
    this.createDialog(menuConfig, 'TUTORIAL_INTERRUPT');
    
    // Store countdown state for step-based updates
    (this.currentDialog as any).tutorialCountdown = countdown;
    
    // Find the button text object and store reference
    const buttonText = this.currentDialog.list.find((child: any) => 
      child instanceof Phaser.GameObjects.Text && child.text.includes('Continue')
    ) as Phaser.GameObjects.Text;
    
    if (buttonText) {
      (this.currentDialog as any).buttonText = buttonText;
      console.log('🎓 Tutorial interrupt: Button text found and stored');
    } else {
      console.warn('🎓 Tutorial interrupt: Could not find button text object');
    }
  }

  /**
   * Update tutorial interrupt countdown (called from GameScene on each step)
   */
  public updateTutorialInterruptCountdown() {
    if (!this.currentDialog || this.currentDisplayedMenuType !== 'TUTORIAL_INTERRUPT') {
      return;
    }

    const countdown = (this.currentDialog as any).tutorialCountdown;
    const buttonText = (this.currentDialog as any).buttonText;

    console.log(`🎓 Tutorial interrupt countdown update: current=${countdown}`);

    if (countdown !== undefined && countdown > 0) {
      // Decrement countdown
      (this.currentDialog as any).tutorialCountdown = countdown - 1;
      const newCountdown = countdown - 1;
      
      // Update button text with new countdown value
      if (buttonText) {
        const newText = newCountdown > 0 ? `Continue (${newCountdown})` : 'Continue';
        buttonText.setText(newText);
        console.log(`🎓 Tutorial interrupt countdown: ${newCountdown}`);
      }
      
      // Auto-close menu when countdown reaches 0
      if (newCountdown <= 0) {
        console.log('🎓 Tutorial interrupt countdown reached 0 - auto-closing menu');
        this.closeDialog();
        
        // Emit event to GameScene to trigger rearview mirror reveal
        console.log('🎓 Emitting tutorialInterruptClosed event');
        // Emit through the scene to ensure it reaches GameScene
        this.scene.scene.get('GameScene')?.events.emit('tutorialInterruptClosed');
      }
    }
  }

  public showExitMenu(shopCount: number = 3, exitNumber?: number) {
    // Persist the last exit number so nested menus (e.g., Shop -> Back) can restore it
    (this as any)._lastExitNumber = exitNumber ?? (this as any)._lastExitNumber;
    if (!this.canShowMenu('EXIT')) return;
    this.clearCurrentDialog();
    // Determine the exit number for this menu instance with robust fallbacks
    let exitNumForMenu = exitNumber ?? (this as any)._lastExitNumber;
    if (exitNumForMenu == null) {
      for (let i = this.menuStack.length - 1; i >= 0; i--) {
        const m = this.menuStack[i];
        if (m.type === 'EXIT' && m.config && m.config.exitNumber != null) {
          exitNumForMenu = m.config.exitNumber;
          break;
        }
      }
    }
    // Final fallback: if first driving sequence, default to Exit 1
    if (exitNumForMenu == null) {
      try {
        const gameScene = this.scene.scene.get('GameScene') as any;
        const isFirstSequence = gameScene?.gameState?.getState()?.showsInCurrentRegion === 0;
        if (isFirstSequence) exitNumForMenu = 1;
      } catch {}
    }
    // Push menu with whichever exit number we resolved (may still be undefined in worst case)
    this.pushMenu('EXIT', { exitNumber: exitNumForMenu }); // Store exit number for CYOA triggering
    
    // Generate shop names based on count
    const shopNames = this.generateShopNames(shopCount);
    
    // Create buttons for each shop
    const buttons: MenuButton[] = shopNames.map((shopName, index) => ({
      text: shopName,
      onClick: () => { 
        this.handleExitShopChoice(shopName); 
      }
    }));
    
    // Add close button
    buttons.push({ 
      text: 'Close', 
      onClick: () => {
        // Resolve exit number from multiple sources for robustness
        const persistedExitNumber = (this as any)._lastExitNumber;
        const stackExitNumber = this.menuStack[this.menuStack.length - 1]?.config?.exitNumber;
        const dialogExitNumber = (this.currentDialog as any)?.exitNumber;
        let finalExitNumber = dialogExitNumber ?? exitNumForMenu ?? persistedExitNumber ?? stackExitNumber;
        if (finalExitNumber == null) {
          // Final fallback: if first sequence, assume Exit 1
          try {
            const gameScene = this.scene.scene.get('GameScene') as any;
            const isFirstSequence = gameScene?.gameState?.getState()?.showsInCurrentRegion === 0;
            if (isFirstSequence) finalExitNumber = 1;
          } catch {}
        }
        // Debug line intentionally minimized
        
        // Exit menu closed - no more exit-related CYOAs to trigger
        
        this.closeDialog();
      }
    });
    
    const menuConfig: MenuConfig = {
      title: 'EXIT',
      content: `Choose a shop to visit. (${shopCount} shops available)`,
      buttons: buttons
    };
    this.createDialog(menuConfig, 'EXIT');
    // Attach exit number to the dialog instance as a definitive source
    try { (this.currentDialog as any).exitNumber = exitNumForMenu; console.log('showExitMenu: attached dialog exitNumber=', exitNumForMenu); } catch {}
    
    // Exit menus are exempt from auto-completion (interactive content)
  }

  /**
   * Generate shop names based on count
   */
  private generateShopNames(count: number): string[] {
    const shopTypes = [
      'Gas Station', 'Convenience Store', 'Rest Stop', 'Truck Stop',
      'Roadside Diner', 'Motel Shop', 'Service Center', 'Market',
      'General Store', 'Trading Post', 'Outpost', 'Depot'
    ];
    
    const names: string[] = [];
    const usedNames = new Set<string>();
    
    for (let i = 0; i < count; i++) {
      let name: string;
      let attempts = 0;
      
      do {
        name = shopTypes[Math.floor(Math.random() * shopTypes.length)];
        attempts++;
      } while (usedNames.has(name) && attempts < 20);
      
      usedNames.add(name);
      names.push(name);
    }
    
    return names;
  }

  private handleExitShopChoice(shopName: string) {
    // Placeholder: simply close the dialog and resume game. Hook narrative/transition later.
    try { console.log('Exit menu choice:', shopName); } catch {}
    
    // Open shop menu instead of closing
    this.showShopMenu();
    // Optionally emit an event for GameScene to react to
    try { this.scene.events.emit('exitShopChosen', shopName); } catch {}
  }

  public showShopMenu() {
    if (!this.canShowMenu('SHOP')) return;
    this.clearCurrentDialog();
    this.pushMenu('SHOP');
    
    // Get current money from GameScene
    const gameScene = this.scene.scene.get('GameScene');
    const currentMoney = gameScene ? (gameScene as any).gameState?.getState()?.money || 0 : 0;
    
    // Shop items with costs
    const shopItems = [
      { name: 'Health Pack', cost: 25 },
      { name: 'Speed Boost', cost: 50 },
      { name: 'Lucky Charm', cost: 100 }
    ];
    
    const menuConfig: MenuConfig = {
      title: 'SHOP',
      content: `Money: $${currentMoney}`,
      buttons: shopItems.map(item => ({
        text: `${item.name} - $${item.cost}`,
        onClick: () => this.handleShopPurchase(item.name, item.cost),
        style: {
          fontSize: '16px',
          color: currentMoney >= item.cost ? '#ffffff' : '#666666',
          backgroundColor: currentMoney >= item.cost ? '#34495e' : '#222222',
          padding: { x: 15, y: 8 }
        }
      })).concat([
        {
          text: 'Back',
          onClick: () => {
            this.closeDialog();
            this.showExitMenu();
          },
          style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        },
        {
          text: 'Close',
          onClick: () => this.closeDialog(),
          style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        }
      ])
    };
    
    this.createDialog(menuConfig, 'SHOP');
    
    // Start universal auto-completion
    this.startMenuAutoComplete('SHOP');
  }

  private handleShopPurchase(itemName: string, cost: number) {
    const gameScene = this.scene.scene.get('GameScene');
    if (!gameScene) return;
    
    const gameState = (gameScene as any).gameState;
    if (!gameState) return;
    
    const currentState = gameState.getState();
    const currentMoney = currentState.money || 0;
    
    // Check if player has enough money
    if (currentMoney < cost) {
      console.log(`Cannot afford ${itemName} - need $${cost}, have $${currentMoney}`);
      return;
    }
    
    // Deduct cost and update state
    const newMoney = currentMoney - cost;
    gameState.updateState({ money: newMoney });
    
    console.log(`Purchased ${itemName} for $${cost}. Remaining money: $${newMoney}`);
    
    // Close shop menu
    this.closeDialog();
    
    // Emit purchase event for potential game effects
    try { this.scene.events.emit('shopPurchase', { item: itemName, cost: cost }); } catch {}
  }

  public showTurnKeyMenu() {
    console.log('MenuManager: showTurnKeyMenu called');
    console.log('MenuManager: Current stack before showTurnKeyMenu:', this.menuStack.map(m => `${m.type}(${m.priority})`));
    console.log('MenuManager: Current dialog exists:', !!this.currentDialog);
    console.log('MenuManager: Current displayed menu type:', this.currentDisplayedMenuType);
    
    // Always rebuild the ignition menu when keys are in ignition and car not started
    console.log('MenuManager: Showing ignition menu');
    this.clearCurrentDialog();
    this.pushMenu('TURN_KEY');
    console.log('MenuManager: Pushed TURN_KEY to stack. Stack now:', this.menuStack.map(m => `${m.type}(${m.priority})`));
    
    const menuConfig: MenuConfig = {
      title: 'IGNITION',
      content: 'swipe up to turn keys, swipe down to remove',
      buttons: [] // No buttons - swipe down to remove keys
    };

    this.createDialog(menuConfig, 'TURN_KEY');
    
    // Add drag dial after creating the dialog
    this.addTurnKeyDial();
    
    // Start universal auto-completion
    this.startMenuAutoComplete('TURN_KEY');
    
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
    const startMax = 20; // Maximum start value to trigger ignition
    let carStarted = false; // Track if car has been started
    
    // Create pointer down handler (works anywhere on screen)
    const pointerDownHandler = (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      lastPointerY = pointer.y;
      lastPointerX = pointer.x;
      lastUpdateTime = Date.now();
      velocity = 0; // Reset velocity when starting new drag
    };
    
    // Create pointer move handler
    const pointerMoveHandler = (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      
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
          // Swipe down detected - remove keys (works even after car has started)
          this.closeDialog();
          const gameScene = this.scene.scene.get('GameScene');
          if (gameScene) {
            gameScene.events.emit('removeKeys');
          }
          return;
        }
        
        // Don't allow slider movement if car has started (but still allow swipe down)
        if (carStarted) return;
        
        // Apply sensitivity multiplier for easier movement
        velocity = newVelocity * sensitivity;
        
        // Clamp velocity to reasonable limits
        velocity = Phaser.Math.Clamp(velocity, -maxVelocity, maxVelocity);
        
        // Update progress based on velocity - but reset momentum system during drag
        currentProgress += velocity;
        // Reset velocity to prevent momentum interference
        velocity = 0;
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
      // Reset velocity to prevent momentum from continuing after drag ends
      velocity = 0;
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
        // Only apply gravity when not dragging - this prevents interference with user input
        if (!isDragging) {
          // Apply gravity - slider constantly falls down
          velocity -= gravity;
          
          if (Math.abs(velocity) > 0.001) {
            // Continue momentum when not dragging
            currentProgress += velocity;
            currentProgress = Phaser.Math.Clamp(currentProgress, 0, 1);
            
            // Apply momentum decay
            velocity *= momentumDecay;
            
            updateSlider();
          } else {
            // Apply gravity even when velocity is small
            currentProgress += velocity;
            currentProgress = Phaser.Math.Clamp(currentProgress, 0, 1);
            updateSlider();
          }
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
          console.log('Manual completion: Scheduling turnKey event in 500ms');
          this.scene.time.delayedCall(500, () => {
            console.log('Manual completion: Executing delayed turnKey event');
            this.closeDialog();
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              console.log('Manual completion: Emitting turnKey event to GameScene');
              gameScene.events.emit('turnKey');
            } else {
              console.error('Manual completion: GameScene not found for turnKey event');
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
    
    // Add transient listeners for this dialog only
    this.scene.input.on('pointerdown', pointerDownHandler);
    const moveWrapper = (p: Phaser.Input.Pointer) => pointerMoveHandler(p);
    const upWrapper = () => pointerUpHandler();
    this.scene.input.on('pointermove', moveWrapper);
    this.scene.input.on('pointerup', upWrapper); // Use 'on' instead of 'once' to allow multiple drags
    
    // Store handlers for cleanup
    (this.currentDialog as any).pointerDownHandler = pointerDownHandler;
    (this.currentDialog as any).pointerMoveHandler = moveWrapper;
    (this.currentDialog as any).pointerUpHandler = upWrapper;
    // While dialog open, disable gameplay input to reduce competing hit-tests
    const gameScene = this.scene.scene.get('GameScene') as any;
    if (gameScene && gameScene.input) {
      gameScene.input.enabled = true; // ensure enabled before toggling
      gameScene.input.enabled = false;
      (this.currentDialog as any).__restoreInput = () => { try { gameScene.input.enabled = true; } catch {} };
    }
    (this.currentDialog as any).momentumTimer = momentumTimer;
    
    // Store references for cleanup
    (this.currentDialog as any).turnKeyDial = { sliderTrack, handle };
    (this.currentDialog as any).dialLabel = { startLabel, turnKeyLabel };
    (this.currentDialog as any).startMeter = { meterBackground, meterFill, meterText };
  }

  public showObstacleMenu(obstacleType: string, damage: number, exitNumber?: number) {
    if (!this.canShowMenu('OBSTACLE')) return;
    
    // Special-case: obstacle type 'exit' should show the dedicated Exit menu
    if (obstacleType === 'exit') {
      console.log(`🎭 showObstacleMenu(exit): incoming exitNumber=`, exitNumber, `_lastExitNumber=`, (this as any)._lastExitNumber);
      
      // Resolve exit number with fallbacks: event param -> persisted -> bundled CYOA exit
      let resolvedExitNumber = exitNumber ?? (this as any)._lastExitNumber;
      console.log(`🎭 showObstacleMenu(exit): after ?? operator, resolvedExitNumber=`, resolvedExitNumber);
      
      if (resolvedExitNumber == null) {
        try {
          const gameScene = this.scene.scene.get('GameScene') as any;
          const cm = gameScene?.carMechanics;
          const planned = cm?.getPlannedCyoa?.();
          if (Array.isArray(planned)) {
            const bundled = planned.find((c: any) => c.isExitRelated && c.exitNumber != null);
            if (bundled) resolvedExitNumber = bundled.exitNumber;
          }
        } catch {}
      }
      console.log(`🎭 showObstacleMenu(exit): after fallback logic, resolvedExitNumber=`, resolvedExitNumber);
      
      // Persist exit number immediately so downstream menus can access it reliably
      (this as any)._lastExitNumber = resolvedExitNumber ?? (this as any)._lastExitNumber;
      console.log(`🎭 showObstacleMenu(exit): resolved exitNumber=`, resolvedExitNumber, `updated _lastExitNumber=`, (this as any)._lastExitNumber);
      console.log(`🎭 showObstacleMenu(exit): calling showExitMenu with damage=`, damage, `exitNumber=`, resolvedExitNumber);
      this.showExitMenu(damage, resolvedExitNumber);
      return;
    }
    
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

  public showCyoaMenu(cyoaData: { cyoaId: number, isExitRelated: boolean, exitNumber?: number, exitTiming?: 'before' | 'after' }) {
    // SIMPLIFIED: CYOA menus are completely independent and immediate
    console.log(`🎭 SIMPLE CYOA: Creating regular CYOA ${cyoaData.cyoaId}`);
    
    // Clear any existing dialog immediately
    this.clearCurrentDialog();
    
    // CRITICAL: Clear the entire menu stack to prevent restoration issues
    this.menuStack = [];
    console.log(`🎭 SIMPLE CYOA: Cleared entire menu stack to prevent restoration conflicts`);
    
    // Simple CYOA description
    const cyoaDescription = 'Something happened!';
    
    const menuConfig: MenuConfig = {
      title: 'CYOA',
      content: cyoaDescription,
      buttons: [
        {
          text: 'OK',
          onClick: () => {
            console.log(`🎭 SIMPLE CYOA: User clicked OK on regular CYOA ${cyoaData.cyoaId}`);
            this.clearCurrentDialog();
            this.resumeGame();
          },
          style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        },
        {
          text: 'No',
          onClick: () => {
            console.log(`🎭 SIMPLE CYOA: User clicked No on regular CYOA ${cyoaData.cyoaId}`);
            this.clearCurrentDialog();
            this.resumeGame();
          },
          style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#666666', padding: { x: 10, y: 5 } }
        }
      ]
    };

    // Create dialog directly without complex menu management
    this.createDialog(menuConfig, 'CYOA');
    
    // CYOA menus are exempt from auto-completion (interactive content)
    
    // Pause game immediately
    this.pauseGame();
  }

  public showStoryMenu(storyData: { isExitRelated: boolean, exitNumber?: number }) {
    if (!this.canShowMenu('STORY')) return;
    
    this.clearCurrentDialog();
    this.pushMenu('STORY', storyData);
    
    // Pause the game when story menu opens
    const appScene = this.scene.scene.get('AppScene');
    if (appScene) {
      (appScene as any).isPaused = true;
      console.log('MenuManager: Game paused for story menu');
    }
    
    const storyDescription = storyData.isExitRelated 
      ? `A story unfolds near Exit ${storyData.exitNumber}...`
      : 'A story unfolds on the road...';
    
    const menuConfig: MenuConfig = {
      title: 'STORY',
      content: storyDescription,
      buttons: [
        {
          text: 'Continue',
          onClick: () => {
            this.closeDialog();
            // Resume driving after story
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              (gameScene as any).resumeAfterCyoa();
            }
          },
          style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
        }
      ]
    };

    this.createDialog(menuConfig, 'STORY');
    
    // Start universal auto-completion
    this.startMenuAutoComplete('STORY');
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

  public showCYOAMenu(config?: { imageKey?: string; text?: string; optionA?: string; optionB?: string; followA?: string; followB?: string; }) {
    if (!this.canShowMenu('CYOA')) return;
    this.clearCurrentDialog();
    this.pushMenu('CYOA');
    const menuConfig: MenuConfig = {
      title: 'CYOA',
      content: config?.text || 'Choose your path.',
      buttons: [
        { text: config?.optionA || 'Option A', onClick: () => {} },
        { text: config?.optionB || 'Option B', onClick: () => {} }
      ]
    };
    this.createDialog(menuConfig, 'CYOA');

    // Image area (optional)
    if (config?.imageKey) {
      try {
        const img = this.scene.add.image(0, -110, config.imageKey);
        img.setOrigin(0.5);
        img.setScrollFactor(0);
        const scale = Math.min(280 / (img.width || 280), 120 / (img.height || 120));
        img.setScale(scale);
        (this.currentDialog as any).add(img);
      } catch {}
    } else {
      // Placeholder graphic area
      const ph = this.scene.add.graphics();
      ph.lineStyle(1, 0xffffff, 0.5);
      ph.strokeRoundedRect(-140, -170, 280, 100, 6);
      (this.currentDialog as any).add(ph);
    }

    // Hook buttons to follow-up dialogs
    const btnTexts = (this.currentDialog.list.filter((o: any) => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[])
      .filter(t => t.text === (config?.optionA || 'Option A') || t.text === (config?.optionB || 'Option B'));
    btnTexts.forEach((btn) => {
      btn.removeAllListeners('pointerdown');
      btn.on('pointerdown', () => {
        const followText = btn.text === (config?.optionA || 'Option A') ? (config?.followA || 'You chose A') : (config?.followB || 'You chose B');
        this.clearCurrentDialog();
        const followConfig: MenuConfig = {
          title: 'Result',
          content: followText,
          buttons: [ { text: 'Close', onClick: () => this.closeDialog() } ]
        };
        this.createDialog(followConfig, 'CYOA');
      });
    });
  }

  public showMoralDecisionMenu(config?: { petIndex?: number; text?: string; optionA?: string; optionB?: string; followA?: string; followB?: string; }) {
    if (!this.canShowMenu('MORAL_DECISION')) return;
    this.clearCurrentDialog();
    this.pushMenu('MORAL_DECISION');
    
    const menuConfig: MenuConfig = {
      title: 'MORAL DECISION',
      content: config?.text || 'What would you do?',
      buttons: [
        { text: config?.optionA || 'Option A', onClick: () => {} },
        { text: config?.optionB || 'Option B', onClick: () => {} }
      ]
    };
    this.createDialog(menuConfig, 'MORAL_DECISION');

    // Add tamagotchi representation
    try {
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene) {
        const petIndex = config?.petIndex ?? 0;
        const pet = (gameScene as any).getVirtualPet?.(petIndex);
        if (pet) {
          // Create a copy of the pet sprite
          const petCopy = this.scene.add.ellipse(0, -110, 60, 60, 0xffcc66, 1);
          petCopy.setStrokeStyle(2, 0x000000, 1);
          petCopy.setScrollFactor(0);
          (this.currentDialog as any).add(petCopy);
          
          // Add simple idle animation to the copy
          this.scene.tweens.add({
            targets: petCopy,
            y: petCopy.y - 3,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });

          // Add pet number label
          const label = this.scene.add.text(0, -140, `Pet ${petIndex + 1}`, {
            fontSize: '14px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
          }).setOrigin(0.5);
          label.setScrollFactor(0);
          (this.currentDialog as any).add(label);
        }
      }
    } catch {}

    // Hook buttons to follow-up dialogs
    const btnTexts = (this.currentDialog.list.filter((o: any) => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[])
      .filter(t => t.text === (config?.optionA || 'Option A') || t.text === (config?.optionB || 'Option B'));
    btnTexts.forEach((btn) => {
      btn.removeAllListeners('pointerdown');
      btn.on('pointerdown', () => {
        const followText = btn.text === (config?.optionA || 'Option A') ? (config?.followA || 'You chose A') : (config?.followB || 'You chose B');
        this.clearCurrentDialog();
        const followConfig: MenuConfig = {
          title: 'Result',
          content: followText,
          buttons: [ { text: 'Close', onClick: () => this.closeDialog() } ]
        };
        this.createDialog(followConfig, 'MORAL_DECISION');
      });
    });
  }

  public showVirtualPetMenu(petSprite?: Phaser.GameObjects.Ellipse) {
    console.log('MenuManager: showVirtualPetMenu called with petSprite:', petSprite);
    if (!this.canShowMenu('VIRTUAL_PET')) return;
    this.clearCurrentDialog();
    this.pushMenu('VIRTUAL_PET');
    
    // Pause the game
    this.scene.events.emit('gamePaused');
    
    const menuConfig: MenuConfig = {
      title: 'band member',
      content: 'doing fine',
      buttons: [
        { 
          text: 'Close', 
          onClick: () => {
            this.closeDialog();
            // Resume the game
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              gameScene.events.emit('gameResumed');
            }
          }
        }
      ]
    };
    this.createDialog(menuConfig, 'VIRTUAL_PET');

    // Add a copy of the  sprite in the menu, plus its digit label
    if (petSprite) {
      try {
        // Create a copy of the pet sprite
        const petCopy = this.scene.add.ellipse(0, -50, petSprite.width, petSprite.height, petSprite.fillColor, petSprite.fillAlpha);
        petCopy.setStrokeStyle(petSprite.lineWidth, petSprite.strokeColor, petSprite.strokeAlpha);
        petCopy.setScrollFactor(0);
        (this.currentDialog as any).add(petCopy);
        // Try to infer pet index from GameScene's virtualPets by position matching
        let digitText = '';
        try {
          const gameScene = this.scene.scene.get('GameScene');
          const pets = (gameScene as any)?.virtualPets as any[];
          if (pets && pets.length) {
            const idx = pets.findIndex(p => p?.getPetSprite?.() === petSprite);
            if (idx >= 0) digitText = String(idx + 1);
          }
        } catch {}
        if (digitText) {
          const label = this.scene.add.text(0, -50, digitText, {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 2
          }).setOrigin(0.5);
          label.setScrollFactor(0);
          (this.currentDialog as any).add(label);
        }
        
        // Bobbing animation removed - pet copy stays in fixed position

        // Add food/bathroom/bored meters to the menu
        const gameScene = this.scene.scene.get('GameScene');
        if (gameScene) {
          // Derive the specific pet from the clicked sprite
          let pet: any = undefined;
          try {
            const pets = (gameScene as any)?.virtualPets as any[];
            if (pets && pets.length) {
              pet = pets.find(p => p?.getPetSprite?.() === petSprite);
            }
            if (!pet && (gameScene as any).getVirtualPet) {
              pet = (gameScene as any).getVirtualPet(0);
            }
          } catch {}
          if (!pet) return;
          const foodMeter = pet.getFoodMeterElements();
          const bathMeter = pet.getBathroomMeterElements?.();
          const boredMeter = pet.getBoredMeterElements?.();
          
          // Create identical meter elements for the menu
          const foodLabel = this.scene.add.text(0, 20, 'FOOD', {
            fontSize: '16px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
          }).setOrigin(0.5);
          foodLabel.setScrollFactor(0);
          
          const foodBarWidth = 120;
          const foodBarHeight = 15;
          const foodBarBG = this.scene.add.rectangle(0, 45, foodBarWidth, foodBarHeight, 0x000000, 0.6);
          foodBarBG.setStrokeStyle(2, 0xffffff, 0.8);
          foodBarBG.setScrollFactor(0);
          
          const foodValue = pet.getFoodValue?.() || 0;
          const fillWidth = Math.floor(foodBarWidth * (foodValue / 10));
          const foodBarFill = this.scene.add.rectangle(-foodBarWidth/2, 45, fillWidth, foodBarHeight - 4, 0x2ecc71, 1);
          foodBarFill.setOrigin(0, 0.5);
          foodBarFill.setScrollFactor(0);
          
          // Bathroom meter
          const bathLabel = this.scene.add.text(0, 70, 'BATH', {
            fontSize: '16px', color: '#ffffff', fontStyle: 'bold', align: 'center'
          }).setOrigin(0.5);
          bathLabel.setScrollFactor(0);
          const bathBG = this.scene.add.rectangle(0, 95, foodBarWidth, foodBarHeight, 0x000000, 0.6);
          bathBG.setStrokeStyle(2, 0xffffff, 0.8);
          bathBG.setScrollFactor(0);
          const bathVal = Phaser.Math.Clamp(pet?.['bathroomValue'] ?? 0, 0, 10);
          const bathFill = this.scene.add.rectangle(-foodBarWidth/2, 95, Math.floor(foodBarWidth * (bathVal / 10)), foodBarHeight - 4, 0x3498db, 1).setOrigin(0, 0.5);
          bathFill.setScrollFactor(0);

          // Bored meter
          const boredLabel = this.scene.add.text(0, 120, 'BORED', {
            fontSize: '16px', color: '#ffffff', fontStyle: 'bold', align: 'center'
          }).setOrigin(0.5);
          boredLabel.setScrollFactor(0);
          const boredBG = this.scene.add.rectangle(0, 145, foodBarWidth, foodBarHeight, 0x000000, 0.6);
          boredBG.setStrokeStyle(2, 0xffffff, 0.8);
          boredBG.setScrollFactor(0);
          const boredVal = Phaser.Math.Clamp(pet?.['boredValue'] ?? 0, 0, 10);
          const boredFill = this.scene.add.rectangle(-foodBarWidth/2, 145, Math.floor(foodBarWidth * (boredVal / 10)), foodBarHeight - 4, 0x9b59b6, 1).setOrigin(0, 0.5);
          boredFill.setScrollFactor(0);

          // Add all meters to the dialog
          (this.currentDialog as any).add([foodLabel, foodBarBG, foodBarFill, bathLabel, bathBG, bathFill, boredLabel, boredBG, boredFill]);
        }
      } catch (error) {
        console.log('Could not create pet copy in menu:', error);
      }
    }
  }

  public showDestinationMenu(includeFinalShowStep: boolean = false) {
    if (!this.canShowMenu('DESTINATION')) return;
    this.clearCurrentDialog();
    this.pushMenu('DESTINATION');
    const menuConfig: MenuConfig = {
      title: 'DESTINATION',
      content: 'Choose a destination or assign custom spots.',
      buttons: [
        { text: 'Shop 1', onClick: () => {} },
        { text: 'Shop 2', onClick: () => {} },
        { text: 'Shop 3', onClick: () => {} },
        { text: 'Go', onClick: () => { /* TODO: handle go selection */ this.closeDialog(); } },
        { text: 'Close', onClick: () => this.closeDialog() }
      ]
    };
    this.createDialog(menuConfig, 'DESTINATION');

    // Add five draggable circles that snap onto buttons
    const circles: Phaser.GameObjects.Arc[] = [];
    const circleLabels: Phaser.GameObjects.Text[] = [];
    for (let i = 0; i < 5; i++) {
      const c = this.scene.add.circle(-110 + i * 55, 120, 12, 0xffcc33);
      c.setInteractive({ draggable: true });
      c.setScrollFactor(0);
      this.currentDialog.add(c);
      circles.push(c);
      // Add number labels centered on each circle
      const label = this.scene.add.text(c.x, c.y, String(i + 1), { fontSize: '12px', color: '#000000', fontStyle: 'bold' });
      label.setOrigin(0.5);
      label.setScrollFactor(0);
      this.currentDialog.add(label);
      circleLabels.push(label);
    }

    // Collect button texts to snap onto
    const buttons = (this.currentDialog.list.filter((o: any) => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[])
      .filter(t => /Shop\s+[1-3]/i.test(t.text));

    // Assignment state for stacking: button -> circles[]; circle -> button
    const assignments: Map<Phaser.GameObjects.Text, Phaser.GameObjects.Arc[]> = new Map();
    buttons.forEach((b: Phaser.GameObjects.Text) => assignments.set(b, []));
    const circleToButton: Map<Phaser.GameObjects.Arc, Phaser.GameObjects.Text | null> = new Map();

    const getButtonWidth = (btn: any): number => (btn.displayWidth ? btn.displayWidth : (btn.width || 80)) as number;
    const getCircleRadius = (circle: any): number => (circle.radius ? circle.radius : 12) as number;

    const layoutForButton = (btn: Phaser.GameObjects.Text) => {
      const list = assignments.get(btn) || [];
      if (list.length === 0) return;
      const bWidth = getButtonWidth(btn as any);
      const radius = getCircleRadius(list[0] as any);
      const gap = 12;
      const spacing = radius * 2 + gap;
      const baseX = (btn as any).x + (bWidth / 2) + radius + gap;
      const baseY = (btn as any).y;
      list.forEach((circle, index) => {
        circle.x = baseX + index * spacing;
        circle.y = baseY;
        const idx = circles.indexOf(circle);
        const lbl = circleLabels[idx];
        if (lbl) { lbl.x = circle.x; lbl.y = circle.y; }
      });
    };

    const removeFromButton = (circle: Phaser.GameObjects.Arc, btn: Phaser.GameObjects.Text | null | undefined) => {
      if (!btn) return;
      const list = assignments.get(btn);
      if (!list) return;
      const i = list.indexOf(circle);
      if (i >= 0) list.splice(i, 1);
      layoutForButton(btn);
    };

    const snapToNearestButton = (circle: Phaser.GameObjects.Arc) => {
      let bestBtn: Phaser.GameObjects.Text | null = null;
      let bestDist = Number.POSITIVE_INFINITY;
      buttons.forEach((btn: Phaser.GameObjects.Text) => {
        // Compare in currentDialog local space directly (btn.x/btn.y are local)
        const dx = circle.x - (btn as any).x;
        const dy = circle.y - (btn as any).y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) { bestDist = d2; bestBtn = btn; }
      });
      const prevBtn = circleToButton.get(circle) || null;
      if (bestBtn) {
        if (prevBtn !== bestBtn) {
          removeFromButton(circle, prevBtn);
          const list = assignments.get(bestBtn) as Phaser.GameObjects.Arc[];
          // Avoid duplicates
          if (list.indexOf(circle) === -1) list.push(circle);
          circleToButton.set(circle, bestBtn);
        }
        // Layout both affected buttons
        if (prevBtn && prevBtn !== bestBtn) layoutForButton(prevBtn);
        layoutForButton(bestBtn);
      } else if (prevBtn) {
        removeFromButton(circle, prevBtn);
        circleToButton.set(circle, null);
      }
    };

    circles.forEach((c, idx) => {
      c.on('drag', (pointer: Phaser.Input.Pointer) => {
        // Convert pointer to currentDialog local space
        const lp = (this.currentDialog as any).getLocalPoint
          ? (this.currentDialog as Phaser.GameObjects.Container).getLocalPoint(pointer.x, pointer.y)
          : { x: pointer.x - this.currentDialog.x, y: pointer.y - this.currentDialog.y };
        c.x = lp.x;
        c.y = lp.y;
        const lbl = circleLabels[idx];
        if (lbl) { lbl.x = c.x; lbl.y = c.y; }
      });
      c.on('dragend', () => snapToNearestButton(c));
    });

    // Override Go button to play a sequence of simple dialogs for assigned destinations
    const goBtn = (this.currentDialog.list.filter((o: any) => o instanceof Phaser.GameObjects.Text) as Phaser.GameObjects.Text[])
      .find(t => t.text === 'Go');
    if (goBtn) {
      goBtn.removeAllListeners('pointerdown');
      goBtn.on('pointerdown', () => {
        // Gather destinations with at least one assignment, in button order
        const steps = buttons
          .filter(btn => (assignments.get(btn) || []).length > 0)
          .map(btn => ({ title: btn.text, circles: (assignments.get(btn) || []) }));
        if (includeFinalShowStep) {
          steps.push({ title: 'show', circles: [] as any });
        }
        const showStep = (index: number) => {
          if (index >= steps.length) {
            this.clearCurrentDialog();
            return;
          }
          // Clear current and show next simple dialog with a single continue button
          this.clearCurrentDialog();
          const step = steps[index];
          const stepConfig: MenuConfig = {
            title: step.title,
            content: 'Proceed to next destination.',
            buttons: [
              {
                text: index < steps.length - 1 ? 'Continue' : 'Done',
                onClick: () => {
                  // Advance to next step
                  this.clearCurrentDialog();
                  showStep(index + 1);
                }
              }
            ]
          };
          this.createDialog(stepConfig, 'DESTINATION_STEP');
          // Draw assigned circle labels on this step dialog
          const gameWidth = this.scene.cameras.main.width;
          const gameHeight = this.scene.cameras.main.height;
          const container = this.currentDialog as Phaser.GameObjects.Container;
          // Position the badges under the title
          const startY = -40;
          const startX = -120;
          const spacing = 36;
          step.circles.forEach((circle: Phaser.GameObjects.Arc, i: number) => {
            const badge = this.scene.add.circle(startX + i * spacing, startY, 12, 0xffcc33);
            const idx = circles.indexOf(circle);
            const labelText = idx >= 0 ? String(idx + 1) : '?';
            const t = this.scene.add.text(badge.x, badge.y, labelText, { fontSize: '12px', color: '#000000', fontStyle: 'bold' }).setOrigin(0.5);
            container.add(badge);
            container.add(t);
          });
        };
        showStep(0);
      });
    }
    
    // Destination menus are exempt from auto-completion (interactive content)
  }

  private createDialog(menuConfig: MenuConfig, menuType?: string) {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Create a simple container-based dialog instead of RexUI dialog
    this.currentDialog = this.scene.add.container(gameWidth / 2, gameHeight / 2);
    this.currentDialog.setScrollFactor(0);
    this.currentDialog.setDepth(50000);
    
    // Track what menu type is being displayed
    this.currentDisplayedMenuType = menuType || null;
    
    // Update game state to indicate a menu is open
    const gameSceneInstance = this.scene.scene.get('GameScene');
    if (gameSceneInstance && (gameSceneInstance as any).gameState) {
      (gameSceneInstance as any).gameState.updateState({ hasOpenMenu: true });
    }
    
    // Background - use unified overlay system
    // For story-type overlay, skip grey background; otherwise use default overlay
    let background: Phaser.GameObjects.Container | null = null;
    if (menuType !== 'STORY' && menuType !== 'PET_STORY') {
      background = this.createOverlayBackground(gameWidth, gameHeight, [
        { x: gameWidth / 2 - 150, y: gameHeight / 2 - 175, width: 300, height: 350 }
      ]);
    }
    
    // Store reference for cleanup
    (this.currentDialog as any).background = background;
    
    console.log('MenuManager: Menu background created with cutout for dialog area');
    
    // Dialog background (visible background for the dialog itself)
    const dialogBackground = this.scene.add.graphics();
    if (menuType === 'STORY' || menuType === 'PET_STORY') {
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
    
    // Content - instant display with brief pause
    if (menuConfig.content) {
      const contentText = this.scene.add.text(0, -20, '', {
        fontSize: '16px',
        color: '#ffffff',
        wordWrap: { width: 250 },
        align: 'center'
      }).setOrigin(0.5);
      
      this.currentDialog.add(contentText);
      
      // Show all text at once after brief pause
      const textCallback = this.scene.time.delayedCall(UI_CONFIG.textDisplayDelayMs, () => {
        // Safety check: ensure text object still exists and is valid
        if (contentText && contentText.scene && !contentText.scene.scene.isActive('GameScene')) {
          return; // Scene is no longer active
        }
        if (contentText && contentText.setText) {
          contentText.setText(menuConfig.content || '');
        }
      });
      this.textDisplayCallbacks.push(textCallback);
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
    
    // Notify GameScene that a menu is now open
    const gameSceneForTutorial: any = this.scene.scene.get('GameScene');
    if (gameSceneForTutorial && gameSceneForTutorial.updateAllTutorialOverlays) {
      gameSceneForTutorial.updateAllTutorialOverlays();
    }
  }

  private createActionButtons(buttons: MenuButton[]) {
    return buttons.map((button: MenuButton) => {
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
  }

  private createOverlayBackground(gameWidth: number, gameHeight: number, cutouts: Array<{x: number, y: number, width: number, height: number}>) {
    // Create overlay container
    const overlay = this.scene.add.container(0, 0);
    overlay.setScrollFactor(0);
    overlay.setDepth(49999);
    
    // Create semi-transparent black background covering the screen (same as tutorial overlay)
    const background = this.scene.add.graphics();
    background.fillStyle(0x000000, 0.3); // Black, 30% opacity (reduced from 70%)
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
      
      // Clean up text display callbacks
      this.textDisplayCallbacks.forEach(callback => {
        if (callback && callback.destroy) {
          callback.destroy();
        }
      });
      this.textDisplayCallbacks = [];
      
      this.currentDialog.destroy();
      this.currentDialog = null;
      
      // Handle special menu types
      if (this.currentDisplayedMenuType === 'TURN_KEY') {
        console.log('MenuManager: Emitting ignitionMenuHidden event');
        this.scene.events.emit('ignitionMenuHidden');
        
        // Also emit on GameScene
        const gameScene = this.scene.scene.get('GameScene');
        if (gameScene) {
          console.log('MenuManager: Emitting ignitionMenuHidden event on GameScene');
          gameScene.events.emit('ignitionMenuHidden');
        }
      } else if (this.currentDisplayedMenuType === 'CYOA') {
        console.log('MenuManager: CYOA menu closed - resuming game');
        // Resume AppScene step counting
        const appScene = this.scene.scene.get('AppScene');
        if (appScene) {
          (appScene as any).isPaused = false;
        }
        
        // Emit gameResumed event
        const gameScene = this.scene.scene.get('GameScene');
        if (gameScene) {
          gameScene.events.emit('gameResumed');
          console.log('MenuManager: Emitted gameResumed event for CYOA menu close');
        }
      }
      // Restore input if we disabled it for this dialog
      if ((this.currentDialog as any)?.__restoreInput) {
        try { (this.currentDialog as any).__restoreInput(); } catch {}
      }
      
      // Resume game when certain menus are closed
      if (this.currentDisplayedMenuType === 'DESTINATION' || this.currentDisplayedMenuType === 'DESTINATION_STEP') {
        console.log('MenuManager: Resuming game after show/destination menu closed');
        this.resumeGameAfterDestinationMenu(true); // reset car and remove keys after shows only
      } else if (this.currentDisplayedMenuType === 'EXIT' || this.currentDisplayedMenuType === 'SHOP') {
        console.log('MenuManager: Resuming game after exit/shop menu closed');
        this.resumeGameAfterDestinationMenu(false); // do NOT reset car/keys after exits
        
        // Exit CYOA triggering moved to Close button - no automatic triggering
      }
      
      // Clear the displayed menu type
      this.currentDisplayedMenuType = null;
      
      // Update game state to indicate no menu is open
      const gameSceneInstance2 = this.scene.scene.get('GameScene');
      if (gameSceneInstance2 && (gameSceneInstance2 as any).gameState) {
        (gameSceneInstance2 as any).gameState.updateState({ hasOpenMenu: false });
      }
      
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
      const gameSceneForRestore: any = this.scene.scene.get('GameScene');
      if (gameSceneForRestore && gameSceneForRestore.updateAllTutorialOverlays) {
        gameSceneForRestore.updateAllTutorialOverlays();
      }
    }
  }

  /**
   * Show region choice menu (OutRun-style left/right selection)
   */
  public showRegionChoiceMenu(config: { currentRegion: string; connectedRegions: string[] }) {
    if (!this.canShowMenu('REGION_CHOICE')) return;
    this.clearCurrentDialog();
    this.pushMenu('REGION_CHOICE');
    
    const { currentRegion, connectedRegions } = config;
    
    // Import REGION_CONFIG to get region display names
    const REGION_CONFIG = (this.scene as any).scene?.get('GameScene')?.registry?.get('REGION_CONFIG') || {};
    
    // Create OutRun-style region choice UI
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height * 0.6;
    
    // Create background overlay
    const overlay = this.scene.add.rectangle(centerX, centerY, 400, 200, 0x000000, 0.8);
    overlay.setScrollFactor(0);
    overlay.setDepth(50000);
    this.currentDialog = this.scene.add.container(0, 0);
    this.currentDialog.add(overlay);
    
    // Add title
    const title = this.scene.add.text(centerX, centerY - 60, 'Choose Your Next Region', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    title.setScrollFactor(0);
    this.currentDialog.add(title);
    
    // Add current region info
    const currentRegionText = this.scene.add.text(centerX, centerY - 20, `Current: ${currentRegion}`, {
      fontSize: '16px',
      color: '#cccccc'
    }).setOrigin(0.5);
    currentRegionText.setScrollFactor(0);
    this.currentDialog.add(currentRegionText);
    
    // Add instruction text
    const instructionText = this.scene.add.text(centerX, centerY + 20, 'Steer left or right to choose', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    instructionText.setScrollFactor(0);
    this.currentDialog.add(instructionText);
    
    // Add region choice buttons (left and right)
    const leftRegion = connectedRegions[0];
    const rightRegion = connectedRegions[1];
    
    if (leftRegion) {
      const leftButton = this.scene.add.rectangle(centerX - 120, centerY + 50, 100, 40, 0x333333, 0.9);
      leftButton.setStrokeStyle(2, 0xffffff, 1);
      leftButton.setScrollFactor(0);
      leftButton.setInteractive();
      this.currentDialog.add(leftButton);
      
      const leftText = this.scene.add.text(centerX - 120, centerY + 50, leftRegion, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      leftText.setScrollFactor(0);
      this.currentDialog.add(leftText);
      
      leftButton.on('pointerdown', () => {
        this.selectRegion(leftRegion);
      });
    }
    
    if (rightRegion) {
      const rightButton = this.scene.add.rectangle(centerX + 120, centerY + 50, 100, 40, 0x333333, 0.9);
      rightButton.setStrokeStyle(2, 0xffffff, 1);
      rightButton.setScrollFactor(0);
      rightButton.setInteractive();
      this.currentDialog.add(rightButton);
      
      const rightText = this.scene.add.text(centerX + 120, centerY + 50, rightRegion, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      rightText.setScrollFactor(0);
      this.currentDialog.add(rightText);
      
      rightButton.on('pointerdown', () => {
        this.selectRegion(rightRegion);
      });
    }
    
    // Set up keyboard controls for region selection
    const leftKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT, true, false);
    const rightKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT, true, false);
    
    if (leftKey && leftRegion) {
      leftKey.on('down', () => {
        this.selectRegion(leftRegion);
      });
    }
    
    if (rightKey && rightRegion) {
      rightKey.on('down', () => {
        this.selectRegion(rightRegion);
      });
    }
    
    // Store keys for cleanup
    (this.currentDialog as any).leftKey = leftKey;
    (this.currentDialog as any).rightKey = rightKey;
    
    console.log(`Region choice menu shown: ${leftRegion} (left) or ${rightRegion} (right)`);
  }
  
  /**
   * Handle region selection
   */
  private selectRegion(regionId: string) {
    console.log(`MenuManager: Region selected: ${regionId}`);
    
    // Notify GameScene of region selection
    const gameScene = this.scene.scene.get('GameScene');
    if (gameScene && (gameScene as any).selectRegion) {
      (gameScene as any).selectRegion(regionId);
    }
    
    // Close the menu
    this.closeDialog();
  }

  private closeDialog() {
    // Stop universal menu auto-completion
    this.stopMenuAutoComplete();
    
    // Mark the current menu as user dismissed to prevent its restoration
    this.userDismissedMenuType = this.currentDisplayedMenuType;
    
    // Simple cleanup - just pop the current menu and resume game
    if (this.currentDisplayedMenuType) {
      const menuType = this.currentDisplayedMenuType;
      
      if (this.MENU_CATEGORIES.ONE_TIME.includes(menuType)) {
        // One-time menus: Clean up all instances from stack
        this.clearMenusFromStack(menuType);
      } else {
        // All other menus: Just pop this instance
        this.popSpecificMenu(menuType);
      }
      
      // Always resume game when closing any menu
      this.resumeGame();
    }
    
    this.clearCurrentDialog();
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

  /**
   * Resume game after destination menu is closed
   */
  private resumeGameAfterDestinationMenu(resetAfterShow: boolean) {
    // Resume AppScene step counting
    const appScene = this.scene.scene.get('AppScene');
    if (appScene) {
      (appScene as any).isPaused = false;
      console.log('MenuManager: Resumed AppScene step counting');
    }
    
    // Optionally reset car state after shows only
    const gameScene = this.scene.scene.get('GameScene');
    if (gameScene) {
      if (resetAfterShow) {
        // Reset car started state
        (gameScene as any).carStarted = false;
        if ((gameScene as any).gameState) {
          (gameScene as any).gameState.updateState({ carStarted: false, speedCrankPercentage: 0 });
        }
        // Stop driving mode
        if ((gameScene as any).carMechanics) {
          (gameScene as any).carMechanics.stopDriving();
          console.log('MenuManager: Stopped CarMechanics driving - car reset (show)');
        }
        // Remove keys from ignition constraint (same as manual removal)
        if ((gameScene as any).removeKeysFromIgnition) {
          console.log('MenuManager: Removing keys from ignition constraint (show)');
          (gameScene as any).removeKeysFromIgnition();
        }
      } else {
        // After exits/shops: just resume driving if it was active; do not reset keys/car
        if ((gameScene as any).carStarted && (gameScene as any).carMechanics) {
          (gameScene as any).carMechanics.resumeDriving();
          console.log('MenuManager: Resumed CarMechanics driving (exit/shop)');
        }
      }
      // Emit game resumed event
      gameScene.events.emit('gameResumed');
    }
  }
}
