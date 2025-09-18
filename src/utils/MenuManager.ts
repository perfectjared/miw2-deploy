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

export class MenuManager {
  // ============================================================================
  // MENU PARAMETERS - Using centralized configuration
  // ============================================================================
  
  // Text display callbacks for cleanup
  private textDisplayCallbacks: Phaser.Time.TimerEvent[] = [];
  
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
  
  // Menu Hierarchy System
  private readonly MENU_PRIORITIES = {
    START: 100,      // Highest priority - start menu
    PAUSE: 80,        // High priority - pause menu
    GAME_OVER: 70,    // High priority - game over menu
    OBSTACLE: 60,     // Medium priority - obstacle collision menu
    REGION_CHOICE: 55, // Medium priority - region choice menu
    SAVE: 50,         // Medium priority - save menu
    DESTINATION: 50,  // Medium priority - destination menu
    EXIT: 50,         // Medium priority - exit choice menu
    SHOP: 50,         // Medium priority - shop menu
    CYOA: 50,         // Medium priority - choose-your-own-adventure menu
    VIRTUAL_PET: 50,  // Medium priority -  menu
    MORAL_DECISION: 50, // Medium priority - moral decision menu
    PET_STORY: 40,    // Low priority - pet story UI
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
    if (!this.canShowMenu('EXIT')) return;
    this.clearCurrentDialog();
    this.pushMenu('EXIT');
    const menuConfig: MenuConfig = {
      title: 'EXIT',
      content: 'Choose a shop to visit.',
      buttons: [
        { text: 'Shop 1', onClick: () => { this.handleExitShopChoice('Shop 1'); } },
        { text: 'Shop 2', onClick: () => { this.handleExitShopChoice('Shop 2'); } },
        { text: 'Shop 3', onClick: () => { this.handleExitShopChoice('Shop 3'); } },
        { text: 'Close', onClick: () => this.closeDialog() }
      ]
    };
    this.createDialog(menuConfig, 'EXIT');
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
      content: 'swipe up to turn keys, swipe down to remove',
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

  public showObstacleMenu(obstacleType: string, damage: number) {
    if (!this.canShowMenu('OBSTACLE')) return;
    
    // Special-case: obstacle type 'exit' should show the dedicated Exit menu
    if (obstacleType === 'exit') {
      this.showExitMenu();
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

        // Add food meter to the menu
        const gameScene = this.scene.scene.get('GameScene');
        if (gameScene && (gameScene as any).virtualPet) {
          const foodMeter = (gameScene as any).virtualPet.getFoodMeterElements();
          
          // Create food meter elements for the menu
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
          
          const foodValue = (gameScene as any).virtualPet.getFoodValue?.() || 0;
          const fillWidth = Math.floor(foodBarWidth * (foodValue / 10));
          const foodBarFill = this.scene.add.rectangle(-foodBarWidth/2, 45, fillWidth, foodBarHeight - 4, 0x2ecc71, 1);
          foodBarFill.setOrigin(0, 0.5);
          foodBarFill.setScrollFactor(0);
          
          // Add food meter elements to the dialog
          (this.currentDialog as any).add([foodLabel, foodBarBG, foodBarFill]);
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
    
    console.log('MenuManager: Dialog background and title added. Dialog children count:', this.currentDialog.list.length);
    
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
    
    console.log('MenuManager: All buttons added. Dialog children count:', this.currentDialog.list.length);
    console.log('MenuManager: Dialog children:', this.currentDialog.list.map((child: any) => child.constructor.name));
    
    // Notify GameScene that a menu is now open
    const gameSceneForTutorial: any = this.scene.scene.get('GameScene');
    if (gameSceneForTutorial && gameSceneForTutorial.updateAllTutorialOverlays) {
      gameSceneForTutorial.updateAllTutorialOverlays();
    }
    
    console.log('MenuManager: After GameScene notification. Dialog children count:', this.currentDialog.list.length);
    console.log('MenuManager: Dialog children after notification:', this.currentDialog.list.map((child: any) => child.constructor.name));
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
      
      // Clean up text display callbacks
      this.textDisplayCallbacks.forEach(callback => {
        if (callback && callback.destroy) {
          callback.destroy();
        }
      });
      this.textDisplayCallbacks = [];
      
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
