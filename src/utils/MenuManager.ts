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
import { OverlayManager } from './OverlayManager';
import { WindowShapes } from './WindowShapes';
import { SaveManager } from './SaveManager';
import { MENU_CONFIG, UI_CONFIG } from '../config/GameConfig';
import { REGION_CONFIG } from '../config/GameConfig';

export interface MenuButton {
  text: string;
  onClick: () => void;
  style?: any;
}

export interface MenuConfig {
  title: string;
  subtitle?: string; // Optional subtitle text
  content?: string;
  buttons: MenuButton[];
  width?: number;
  height?: number;
  texts?: string[]; // For CYOA-style text advancement
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
 * - PAUSE - Prevents game from getting stuck
 * - STORY - Prevents game from getting stuck
 * 
 * MENUS WITHOUT AUTO-COMPLETION:
 * - START - Initial menu, player chooses when to start
 * - CYOA - Interactive story content that players should engage with
 * - DESTINATION - Interactive planning content that players should engage with
 * - EXIT - Interactive shop selection that players should engage with
 * - SHOP - Interactive shopping content that players should engage with
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
    TURN_KEY: 110,       // Highest priority - ignition
    START: 100,          // Start game
    TUTORIAL_INTERRUPT: 95, // Tutorial interrupt modal should preempt lower menus
    PAUSE: 90,           // Pause
    REGION_CHOICE: 80,   // Region change choice
    GAME_OVER: 75,       // Game over
    STORY: 74,           // Story content (should NOT be preempted by exit)
    EXIT: 73,            // Exit choice (should interrupt CYOA only)
    CYOA: 70,            // Choose-your-own-adventure
    DESTINATION: 65,     // Trip planning
    OBSTACLE: 60,        // Collision/obstacle
    POTHOLE: 55,         // Pothole collision (lower than obstacle)
    SHOP: 73,            // Shop (paired with exit flow)
    VIRTUAL_PET: 45,     // Pet UI
    MORAL_DECISION: 45,  // Moral decision
    PET_STORY: 40,       // Pet story overlay
    TUTORIAL: 20         // Passive tutorial overlay
  };

  // Menu Categories - Simplified cleanup rules
  private readonly MENU_CATEGORIES = {
    PERSISTENT: ['START', 'PAUSE', 'GAME_OVER', 'TURN_KEY'], // Menus that should be restored
    TEMPORARY: ['OBSTACLE', 'EXIT', 'SHOP', 'SAVE'], // Menus that can be restored but are context-dependent
    ONE_TIME: ['CYOA', 'STORY', 'MORAL_DECISION', 'REGION_CHOICE'], // Menus that should never be restored
    OVERLAY: ['TUTORIAL', 'PET_STORY'] // Non-blocking overlays
  };
  
  private scene: Phaser.Scene;
  private saveManager: SaveManager;
  private currentDialog: any = null;
  private menuStack: Array<{type: string, priority: number, config?: any}> = []; // Track menu hierarchy
  private currentDisplayedMenuType: string | null = null; // Track what menu is actually being displayed
  private queuedMenus: Array<{ type: string, payload?: any }> = [];
  private storySequenceInProgress: boolean = false;
  private isExitOrShopOpen(): boolean {
    const active = this.currentDisplayedMenuType === 'EXIT' || this.currentDisplayedMenuType === 'SHOP';
    if (active) return true;
    return this.menuStack.some(m => m.type === 'EXIT' || m.type === 'SHOP');
  }

  private enqueueMenu(menuType: string, payload?: any) {
    // Check if this menu type is already queued to prevent duplicates
    const alreadyQueued = this.queuedMenus.some(queued => queued.type === menuType);
    if (alreadyQueued) {
      console.log(`⏳ Menu '${menuType}' already queued, skipping duplicate`);
      return;
    }
    
    console.log(`⏳ Queueing menu '${menuType}' until EXIT/SHOP closes`);
    this.queuedMenus.push({ type: menuType, payload });
  }

  private processQueuedMenus() {
    // Only process if no EXIT/SHOP is open and no dialog currently displayed
    if (this.isExitOrShopOpen()) return;
    if (this.currentDialog) {
      // Try again shortly after the dialog finishes its close animation
      this.scene.time.delayedCall(60, () => this.processQueuedMenus());
      return;
    }
    
    // Don't process queued menus if a story sequence is in progress
    if (this.storySequenceInProgress) {
      console.log('⏳ Story sequence in progress - waiting for completion before processing queue');
      console.log('⏳ Current displayed menu type:', this.currentDisplayedMenuType);
      this.scene.time.delayedCall(100, () => this.processQueuedMenus());
      return;
    }
    
    if (this.queuedMenus.length === 0) return;
    const next = this.queuedMenus.shift();
    if (!next) return;
    // Defer slightly to let prior close complete
    this.scene.time.delayedCall(50, () => {
      try {
        switch (next.type) {
          case 'CYOA':
            this.showCyoaMenu(next.payload);
            break;
          case 'EXIT':
            if (next.payload) {
              if (next.payload.shopCount !== undefined) {
                this.showExitMenu(next.payload.shopCount, next.payload.exitNumber);
              } else {
                this.showExitStoresCatalog(next.payload.exitNumber);
              }
            } else {
              this.showExitMenu();
            }
            break;
          case 'TUTORIAL_INTERRUPT':
            this.showTutorialInterrupt();
            break;
          case 'STORY':
            this.showStoryMenu(next.payload);
            break;
          case 'NOVEL_STORY':
            this.showNovelStory(next.payload);
            break;
          case 'STORY_OVERLAY':
            if (next.payload && typeof next.payload.title === 'string' && typeof next.payload.content === 'string') {
              this.showStoryOverlay(next.payload.title, next.payload.content);
            }
            break;
          case 'DESTINATION':
            this.showDestinationMenu(next.payload?.includeFinalShowStep);
            break;
          case 'REGION_CHOICE':
            this.showRegionChoiceMenu(next.payload);
            break;
          case 'OBSTACLE':
            this.showObstacleMenu(next.payload.obstacleType, next.payload.damage, next.payload.exitNumber);
            break;
          case 'VIRTUAL_PET':
            this.showVirtualPetMenu(next.payload?.petSprite);
            break;
          case 'MORAL_DECISION':
            this.showMoralDecisionMenu(next.payload);
            break;
          default:
            console.log('⚠️ Unknown queued menu type:', next.type);
        }
      } catch (e) {
        console.warn('Failed to process queued menu', next, e);
      }
      // If more queued, continue processing until empty, but re-check guards
      this.scene.time.delayedCall(50, () => this.processQueuedMenus());
    });
  }
  private userDismissedMenuType: string | null = null; // Track which specific menu was dismissed by user action
  private overlayManager: OverlayManager;
  private windowShapes?: WindowShapes;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.saveManager = SaveManager.getInstance();
    this.overlayManager = new OverlayManager(scene);
    // Listen for global step events to auto-hide ephemeral overlays
    this.scene.events.on('step', this.onGlobalStep, this);
    // Listen for CYOA menu events
    this.scene.events.on('showCyoaMenu', this.showCyoaMenu, this);
    // Listen for step events for universal menu auto-completion
    this.scene.events.on('step', this.onStepEvent, this);
    // Prepare WindowShapes for collage animations even pre-game
    try {
      const gameScene = this.scene.scene.get('GameScene');
      const gsWindowShapes = gameScene && (gameScene as any).windowShapes;
      this.windowShapes = gsWindowShapes || new WindowShapes(this.scene);
    } catch {
      this.windowShapes = new WindowShapes(this.scene);
    }
    // Drive half-step animations for collage elements from GameScene only
    // GameScene emits 'halfStep' even when paused for UI animation consistency
    this.scene.events.on('halfStep', (halfStep: number) => {
      try { (this.windowShapes as any)?.onHalfStep?.(halfStep); } catch {}
      // Also advance pothole dialog timers on half-steps so they disappear even when game is paused
      try { this.tickPotholeDialogsHalfStep(); } catch {}
    });

    // Also handle always-on UI half-steps for pre-game menus (Start)
    this.scene.events.on('uiHalfStep', (uiHalfStep: number) => {
      try {
        const appScene = this.scene.scene.get('AppScene');
        const isGameStarted = !!(appScene && (appScene as any).gameStarted);
        if (isGameStarted) return; // avoid double updates once game starts
        (this.windowShapes as any)?.onHalfStep?.(uiHalfStep);
      } catch {}
    });
  }

  /**
   * Start universal menu auto-completion
   */
  private startMenuAutoComplete(menuType: string) {
    // Skip auto-completion for interactive menus that players should engage with
    if (menuType === 'START' || menuType === 'CYOA' || menuType === 'DESTINATION' || menuType === 'EXIT' || menuType === 'SHOP') {
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
      if (this.menuCountdownText && (this.menuCountdownText as any).scene && (this.menuCountdownText as any).active) {
        this.menuCountdownText.setText(`Auto-complete in: ${remainingSteps} steps`);
      } else {
        // Text no longer valid; clean up references and timer
        this.menuCountdownText = null as any;
        if (this.menuCountdownTimer) {
          try { this.menuCountdownTimer.remove(false); } catch {}
          this.menuCountdownTimer = null as any;
        }
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
        if (this.menuCountdownText && (this.menuCountdownText as any).scene && (this.menuCountdownText as any).active) {
          this.menuCountdownText.setText(`Auto-complete in: ${countdown} step-lengths`);
        } else {
          // Countdown label got destroyed; stop timer safely
          if (this.menuCountdownTimer) {
            try { this.menuCountdownTimer.remove(false); } catch {}
            this.menuCountdownTimer = null as any;
          }
          this.menuCountdownText = null as any;
          return;
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
      // Special case: allow EXIT to preempt CYOA (but NOT STORY)
      if (menuType === 'EXIT' && currentMenu.type === 'CYOA') {
        console.log(`⚠️ Forcing EXIT to preempt CYOA`);
        this.clearCurrentDialog();
        this.popSpecificMenu(currentMenu.type);
        return true;
      }
      console.log(`🚫 MenuManager: Cannot show ${menuType} menu (priority ${newPriority}) - blocked by ${currentMenu.type} menu (priority ${currentMenu.priority})`);
      console.log(`🚫 MenuManager: Current menu stack:`, this.menuStack.map(m => `${m.type}:${m.priority}`));
      return false;
    }

    // If EXIT/SHOP is open or on stack, block certain overlays to avoid uncloseable state
    if (this.isExitOrShopOpen()) {
      const queueable = ['CYOA', 'TUTORIAL_INTERRUPT', 'NOVEL_STORY', 'STORY', 'STORY_OUTCOME', 'DESTINATION'];
      if (queueable.includes(menuType)) {
        // Queue instead of blocking so it appears after EXIT/SHOP closes
        // Capture intended payload from arguments by peeking at the top of the stack if same type
        let payload: any = undefined;
        try {
          // Attempt to infer payload from most recent menu push or provided call site
          const last = this.menuStack[this.menuStack.length - 1];
          payload = last?.config;
        } catch {}
        this.enqueueMenu(menuType, payload);
        console.log(`⏳ MenuManager: Queued '${menuType}' until EXIT/SHOP closes`);
        return false;
      }
    }

    // If a new higher-priority menu wants to show, proactively clear lower ones
    if (currentMenu && currentMenu.priority < newPriority) {
      console.log(`⚠️ MenuManager: Preempting lower-priority menus for ${menuType} (priority ${newPriority})`);
      // Check if an exit/shop was being displayed or pending on stack
      const hadExitOrShop = !!(this.currentDisplayedMenuType && (this.currentDisplayedMenuType === 'EXIT' || this.currentDisplayedMenuType === 'SHOP'))
        || this.menuStack.some(m => m.type === 'EXIT' || m.type === 'SHOP');
      // Remove any menus with priority lower than the new one
      this.menuStack = this.menuStack.filter(m => m.priority >= newPriority);
      // Also clear any currently displayed dialog to avoid overlap
      try { this.clearCurrentDialog(); } catch {}
      // If we preempted an exit/shop, ensure we resume gameplay on next close to avoid stuck state
      if (hadExitOrShop) {
        (this as any)._resumeOnNextClose = true;
      }
    }
    
    console.log(`✅ MenuManager: Can show ${menuType} menu (priority ${newPriority})`);
    return true;
  }
  
  private pushMenu(menuType: string, config?: any) {
    const priority = this.MENU_PRIORITIES[menuType as keyof typeof this.MENU_PRIORITIES];
    if (priority) {
      this.menuStack.push({ type: menuType, priority, config });
      console.log(`📚 MenuManager: Pushed ${menuType} menu (priority ${priority}) to stack. Stack now:`, this.menuStack.map(m => `${m.type}:${m.priority}`));
    } else {
      console.log(`⚠️ MenuManager: No priority found for menu type: ${menuType}`);
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
      console.log(`🗑️ MenuManager: Popped ${menuType} menu from stack. Remaining stack:`, this.menuStack.map(m => `${m.type}:${m.priority}`));
      return popped;
    }
    console.log(`⚠️ MenuManager: Could not find ${menuType} menu in stack to pop. Current stack:`, this.menuStack.map(m => `${m.type}:${m.priority}`));
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

  private createWindowBackground() {
    const collageBackground = (this.currentDialog as any).collageBackground;
    const dialogWidth = (this.currentDialog as any).dialogWidth;
    const dialogHeight = (this.currentDialog as any).dialogHeight;
    
    if (!collageBackground || !dialogWidth || !dialogHeight) {
      console.error('❌ Missing references for window background creation');
      return;
    }
    
    console.log('🎨 Creating window background with x texture');
    
    // Create the scrolling background
    const backgroundSprite = this.scene.add.tileSprite(0, 0, dialogWidth, dialogHeight, 'x');
    backgroundSprite.setOrigin(0, 0);
    backgroundSprite.setDepth(-2);
    
    // Create a geometry mask using the polygon as the mask source
    const geometryMask = collageBackground.createGeometryMask();
    backgroundSprite.setMask(geometryMask);
    
    // Add to the dialog
    this.currentDialog.add(backgroundSprite);
    
    // Set up scrolling animation
    this.scene.events.on('postupdate', () => {
      if (backgroundSprite && backgroundSprite.active) {
        backgroundSprite.tilePositionX -= 0.5;
        backgroundSprite.tilePositionY += 0.3;
      }
    });
    
    // Keep references for cleanup
    (this.currentDialog as any).backgroundSprite = backgroundSprite;
    (this.currentDialog as any).geometryMask = geometryMask;
    
    console.log('✅ Window background created successfully');
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
    // Ensure transient pothole dialogs don't linger under story overlays
    this.clearAllPotholeDialogs(true);
    // If EXIT/SHOP is open, queue with payload and bail
    if (this.isExitOrShopOpen()) { this.enqueueMenu('STORY_OVERLAY', { title, content }); return; }
    // Non-blocking: don't use menu stack or overlay background
    this.clearCurrentDialog();
    
    // Use H menu styling through WindowShapes instead of custom graphics
    const gameScene = this.scene.scene.get('GameScene') as any;
    if (!gameScene || !gameScene.windowShapes) {
      console.warn('Cannot create story overlay: GameScene or WindowShapes not available');
      return;
    }
    
    // Calculate H menu style positioning - MATCH START (85% width, 90% height, centered)
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const width = Math.floor(gameWidth * 0.85);
    const height = Math.floor(gameHeight * 0.90);
    const x = Math.floor((gameWidth - width) / 2);
    const y = Math.floor((gameHeight - height) / 2);
    
    // Create story texts in H menu format
    const storyTexts = [
      title, // Title as first text
      content // Content as second text
    ];
    
    // Create continue button in H menu style
    const choices = [
      {
        text: "Continue",
        callback: () => {
          console.log("Story overlay dismissed by user");
          this.clearCurrentDialog();
        }
      }
    ];
    
    // Use the CYOA system with H menu styling for story overlays
    const storyContainer = gameScene.windowShapes.createCYOADialog(x, y, width, height, storyTexts, choices);
    
    if (storyContainer) {
      // Set proper depth for story overlays (below regular menus but above game elements)
      storyContainer.setDepth(40000);
      
      // Track as current dialog for MenuManager
      this.currentDialog = storyContainer;
      this.currentDisplayedMenuType = 'STORY';
      
      // Mark as ephemeral and set step countdown (same behavior as before)
      (this.currentDialog as any).isStory = true;
      (this.currentDialog as any).stepsRemaining = 10;
      
      console.log(`✨ Story overlay created with H menu styling: "${title}"`);
    } else {
      console.warn('Story overlay was queued (another narrative window is active)');
    }
  }

  private onGlobalStep() {
    if (this.currentDialog && (this.currentDialog as any).isStory) {
      (this.currentDialog as any).stepsRemaining -= 1;
      if ((this.currentDialog as any).stepsRemaining <= 0) {
        this.clearCurrentDialog();
      }
    }
    
    // Process frame-by-frame pothole creation countdown
    const countdown = (this as any).potholeCreationCountdown;
    if (countdown && countdown.remaining > 0) {
      const currentStep = this.getCurrentStep();
      
      // If step changed, stop creating potholes and clear countdown
      if (currentStep !== countdown.lastStep) {
        (this as any).potholeCreationCountdown = null;
      } else {
        // Create one pothole window this frame
        const menuConfig: MenuConfig = {
          title: '',
          content: 'YOU HIT A POTHOLE!!!!1',
          buttons: [],
          width: 90,
          height: 60
        };
        
        const potholeDialog = this.createIndependentPotholeDialog(menuConfig);
        if (potholeDialog) {
          (potholeDialog as any).isPothole = true;
          (potholeDialog as any).stepsRemaining = 4;
          (potholeDialog as any).isIndependent = true;
          
          // Randomize position within inner 60% of screen
          try {
            const gw = this.scene.cameras.main.width;
            const gh = this.scene.cameras.main.height;
            const rx = Phaser.Math.FloatBetween(0.2, 0.8) * gw;
            const ry = Phaser.Math.FloatBetween(0.2, 0.8) * gh;
            (potholeDialog as Phaser.GameObjects.Container).setPosition(rx, ry);
          } catch {}
          
          // Add to independent pothole dialogs list for tracking
          if (!(this as any).independentPotholeDialogs) {
            (this as any).independentPotholeDialogs = [];
          }
          (this as any).independentPotholeDialogs.push(potholeDialog);
        }
        
        // Decrement countdown
        countdown.remaining -= 1;
        if (countdown.remaining <= 0) {
          (this as any).potholeCreationCountdown = null;
        }
      }
    }
    
    // Auto-dismiss independent pothole dialogs after 4 steps
    const independentPotholeDialogs = (this as any).independentPotholeDialogs || [];
    for (let i = independentPotholeDialogs.length - 1; i >= 0; i--) {
      const dialog = independentPotholeDialogs[i];
      if (dialog && !dialog.destroyed && (dialog as any).isPothole) {
        (dialog as any).stepsRemaining -= 1;
        if ((dialog as any).stepsRemaining <= 0) {
          // Animate out and destroy
          const collageWindow = (dialog as any).collageWindow;
          if (collageWindow && collageWindow.scene) {
            this.scene.tweens.add({
              targets: collageWindow,
              scaleX: 0.01,
              scaleY: 0.01,
              duration: 160,
              ease: 'Back.easeIn',
              onComplete: () => {
                try { dialog.destroy(); } catch {}
              }
            });
          } else {
            try { dialog.destroy(); } catch {}
          }
          // Remove from tracking list
          independentPotholeDialogs.splice(i, 1);
        }
      } else if (dialog && dialog.destroyed) {
        // Clean up destroyed dialogs from tracking list
        independentPotholeDialogs.splice(i, 1);
      }
    }
    
    // Update pet menu values every step
    if (this.currentDialog && (this.currentDialog as any).isPetMenu) {
      this.updatePetMenuValues();
    }
  }

  /**
   * Advance pothole dialog timers on half-steps so they disappear even if the game is paused
   */
  private tickPotholeDialogsHalfStep() {
    const dialogs: Phaser.GameObjects.Container[] = (this as any).independentPotholeDialogs || [];
    if (!dialogs || dialogs.length === 0) return;
    for (let i = dialogs.length - 1; i >= 0; i--) {
      const d: any = dialogs[i];
      if (!d || d.destroyed || !d.isPothole) { continue; }
      // Reduce a smaller amount per half-step so roughly 4 steps total lifetime stays similar
      if (typeof d.stepsRemaining !== 'number') { d.stepsRemaining = 4; }
      d.stepsRemaining -= 0.5;
      if (d.stepsRemaining <= 0) {
        const collageWindow = d.collageWindow;
        if (collageWindow && collageWindow.scene) {
          this.scene.tweens.add({
            targets: collageWindow,
            scaleX: 0.01,
            scaleY: 0.01,
            duration: 140,
            ease: 'Back.easeIn',
            onComplete: () => { try { d.destroy(); } catch {} }
          });
        } else {
          try { d.destroy(); } catch {}
        }
        dialogs.splice(i, 1);
      }
    }
  }

  /**
   * Clear all active pothole dialogs and any pending creation countdown
   * @param animate whether to animate out windows; default true
   */
  private clearAllPotholeDialogs(animate: boolean = true) {
    // Stop any ongoing creation burst
    (this as any).potholeCreationCountdown = null;
    // Remove listener if we created one
    const listener = (this as any).potholeCreationListener;
    if (listener && typeof this.scene.events.off === 'function') {
      try { this.scene.events.off('postupdate', listener); } catch {}
      (this as any).potholeCreationListener = null;
    }
    const dialogs: Phaser.GameObjects.Container[] = (this as any).independentPotholeDialogs || [];
    for (let i = dialogs.length - 1; i >= 0; i--) {
      const d: any = dialogs[i];
      if (!d || d.destroyed || !d.isPothole) { dialogs.splice(i, 1); continue; }
      if (animate && d.collageWindow && d.collageWindow.scene) {
        this.scene.tweens.add({
          targets: d.collageWindow,
          scaleX: 0.01,
          scaleY: 0.01,
          duration: 120,
          ease: 'Back.easeIn',
          onComplete: () => { try { d.destroy(); } catch {} }
        });
      } else {
        try { d.destroy(); } catch {}
      }
      dialogs.splice(i, 1);
    }
    (this as any).independentPotholeDialogs = dialogs;
  }
  
  private updatePetMenuValues() {
    if (!this.currentDialog || !(this.currentDialog as any).isPetMenu) return;
    
    const gameScene = this.scene.scene.get('GameScene');
    if (!gameScene || !(gameScene as any).getVirtualPet) return;
    
    const petIndex = (this.currentDialog as any).petIndex;
    const pet = (gameScene as any).getVirtualPet(petIndex);
    if (!pet) return;
    
    const foodBarFill = (this.currentDialog as any).foodBarFill;
    const bathroomBarFill = (this.currentDialog as any).bathroomBarFill;
    const boredBarFill = (this.currentDialog as any).boredBarFill;
    const foodBarWidth = (this.currentDialog as any).foodBarWidth;
    
    if (foodBarFill) {
      const foodValue = pet.getFoodValue?.() || 0;
      const foodFillWidth = Math.floor(foodBarWidth * (foodValue / 10));
      foodBarFill.setDisplaySize(foodFillWidth, foodBarFill.displayHeight);
    }
    
    if (bathroomBarFill) {
      const bathroomValue = pet.getBathroomValue?.() || 0;
      const bathroomFillWidth = Math.floor(foodBarWidth * (bathroomValue / 10));
      bathroomBarFill.setDisplaySize(bathroomFillWidth, bathroomBarFill.displayHeight);
    }
    
    if (boredBarFill) {
      const boredValue = pet.getBoredValue?.() || 0;
      const boredFillWidth = Math.floor(foodBarWidth * (boredValue / 10));
      boredBarFill.setDisplaySize(boredFillWidth, boredBarFill.displayHeight);
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
    const uiHeight = 120; // Increased height for 3 meters
    let petX = Phaser.Math.Clamp(petXY.x, uiWidth / 2, cam.width - uiWidth / 2);
    let petY = petXY.y - 100; // Moved up more to accommodate taller UI
    if (petY - uiHeight / 2 < 0) petY = petXY.y + 100; // Flip below
    
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
    
    // Food meter
    const foodLabel = this.scene.add.text(0, -40, 'FOOD', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    foodLabel.setScrollFactor(0);
    
    const foodBarWidth = 100;
    const foodBarHeight = 10;
    const foodBarBG = this.scene.add.rectangle(0, -25, foodBarWidth, foodBarHeight, 0x000000, 0.6);
    foodBarBG.setStrokeStyle(1, 0xffffff, 0.8);
    foodBarBG.setScrollFactor(0);
    
    const foodValue = pet.getFoodValue?.() || 0;
    const foodFillWidth = Math.floor(foodBarWidth * (foodValue / 10));
    const foodBarFill = this.scene.add.rectangle(-foodBarWidth/2, -25, foodFillWidth, foodBarHeight - 2, 0x2ecc71, 1);
    foodBarFill.setOrigin(0, 0.5);
    foodBarFill.setScrollFactor(0);
    
    // Bathroom meter
    const bathroomLabel = this.scene.add.text(0, -5, 'BATH', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    bathroomLabel.setScrollFactor(0);
    
    const bathroomBarBG = this.scene.add.rectangle(0, 10, foodBarWidth, foodBarHeight, 0x000000, 0.6);
    bathroomBarBG.setStrokeStyle(1, 0xffffff, 0.8);
    bathroomBarBG.setScrollFactor(0);
    
    const bathroomValue = pet.getBathroomValue?.() || 0;
    const bathroomFillWidth = Math.floor(foodBarWidth * (bathroomValue / 10));
    const bathroomBarFill = this.scene.add.rectangle(-foodBarWidth/2, 10, bathroomFillWidth, foodBarHeight - 2, 0x3498db, 1);
    bathroomBarFill.setOrigin(0, 0.5);
    bathroomBarFill.setScrollFactor(0);
    
    // Bored meter
    const boredLabel = this.scene.add.text(0, 30, 'BORED', {
      fontSize: '12px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);
    boredLabel.setScrollFactor(0);
    
    const boredBarBG = this.scene.add.rectangle(0, 45, foodBarWidth, foodBarHeight, 0x000000, 0.6);
    boredBarBG.setStrokeStyle(1, 0xffffff, 0.8);
    boredBarBG.setScrollFactor(0);
    
    const boredValue = pet.getBoredValue?.() || 0;
    const boredFillWidth = Math.floor(foodBarWidth * (boredValue / 10));
    const boredBarFill = this.scene.add.rectangle(-foodBarWidth/2, 45, boredFillWidth, foodBarHeight - 2, 0x9b59b6, 1);
    boredBarFill.setOrigin(0, 0.5);
    boredBarFill.setScrollFactor(0);
    
    this.currentDialog.add([foodLabel, foodBarBG, foodBarFill, bathroomLabel, bathroomBarBG, bathroomBarFill, boredLabel, boredBarBG, boredBarFill]);
    
    // Store references for step-based updates
    (this.currentDialog as any).isPetMenu = true;
    (this.currentDialog as any).petIndex = petIndex;
    (this.currentDialog as any).foodBarFill = foodBarFill;
    (this.currentDialog as any).bathroomBarFill = bathroomBarFill;
    (this.currentDialog as any).boredBarFill = boredBarFill;
    (this.currentDialog as any).foodBarWidth = foodBarWidth;
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
    
    // NEVER restore PAUSE menus - they should not persist
    if (menuToRestore.type === 'PAUSE') {
      console.log(`MenuManager: PAUSE menu should not be restored`);
      return false;
    }
    
    // Only restore PERSISTENT menus (START, PAUSE, GAME_OVER, TURN_KEY)
    const isPersistent = this.MENU_CATEGORIES.PERSISTENT.includes(menuToRestore.type);
    
    // Also restore EXIT menus when SHOP closes (parent-child relationship)
    const isExitAfterShop = menuToRestore.type === 'EXIT' && this.userDismissedMenuType === 'SHOP';
    
    if (!isPersistent && !isExitAfterShop) {
      console.log(`MenuManager: ${menuToRestore.type} is not persistent, not restoring`);
      return false;
    }
    
    // Don't restore if user explicitly dismissed this menu type
    if (menuToRestore.type === this.userDismissedMenuType) {
      console.log(`MenuManager: User dismissed ${menuToRestore.type}, not restoring`);
      return false;
    }
    
    if (isExitAfterShop) {
      console.log(`MenuManager: Restoring ${menuToRestore.type} (parent menu after SHOP close)`);
    } else {
      console.log(`MenuManager: Restoring ${menuToRestore.type} (persistent menu)`);
    }
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
      case 'EXIT':
        // Restore EXIT menu with the same parameters it had before
        if (previousMenu.config) {
          if (previousMenu.config.shopCount !== undefined) {
            this.showExitMenu(previousMenu.config.shopCount, previousMenu.config.exitNumber);
          } else {
            this.showExitStoresCatalog(previousMenu.config.exitNumber);
          }
        } else {
          this.showExitMenu();
        }
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
        title: 'INFINITY DRIVES',
        subtitle: 'the official game that is an ad for Infinity Guise the new fake emo album by Summerbruise',
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
        title: 'INFINITY DRIVES',
        subtitle: 'the official game that is an ad for Infinity Guise the new fake emo album by Summerbruise',
        content: 'you awake in a 2007 honda odyssey\nyou remember: you took a job as a tour manager for fake emo band summerbruise\nits time to start',
        texts: ['you awake in a 2007 honda odyssey', 'you remember: you took a job as a tour manager for fake emo band summerbruise', 'its time to start'], // For CYOA-style advancement
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

    // Make START window 90% height and 85% width
    try {
      const gw = this.scene.cameras.main.width;
      const gh = this.scene.cameras.main.height;
      (menuConfig as any).width = Math.floor(gw * 0.85);
      (menuConfig as any).height = Math.floor(gh * 0.90);
    } catch {}

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
    // Pothole menus are special - they can coexist with other menus and each other
    // Don't use the normal menu stack system, create independent dialogs
    try {
      // Trigger a light screen shake when the pothole menu sequence starts
      const gameScene = this.scene.scene.get('GameScene');
      gameScene?.events.emit('potholeMenuShake');
    } catch {}
    
    // Much smaller, faster dialog with no buttons (60% of original size, 3x wider)
    const menuConfig: MenuConfig = {
      title: '',  // No title - just content
      content: 'YOU HIT A POTHOLE!!!!1',
      buttons: [],
      width: 90,   // 3x wider than 30
      height: 60   // Increased height to fit text properly
    };

    // Create multiple pothole dialogs based on speed percentage
    const speedPercentage = this.getCurrentSpeedPercentage();
    const numWindows = Math.max(3, Math.min(20, Math.floor(speedPercentage * 0.2))); // 3-20 windows based on speed
    
    // Set up frame-by-frame pothole creation countdown
    if (!(this as any).potholeCreationCountdown) {
      (this as any).potholeCreationCountdown = {
        remaining: numWindows,
        lastStep: this.getCurrentStep()
      };
    } else {
      // If there's already a countdown, add to it
      (this as any).potholeCreationCountdown.remaining += numWindows;
    }
    
    // Set up postupdate listener for frame-by-frame creation if not already set
    if (!(this as any).potholeCreationListener) {
      (this as any).potholeCreationListener = this.scene.events.on('postupdate', () => {
        this.processPotholeCreationCountdown();
      });
    }
  }

  /**
   * Get current speed percentage from GameScene
   */
  private getCurrentSpeedPercentage(): number {
    try {
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene && (gameScene as any).gameState) {
        return (gameScene as any).gameState.getState().speedPercentage || 0;
      }
    } catch {}
    return 0; // Default to 0 if can't get speed
  }

  /**
   * Get current step from GameScene
   */
  private getCurrentStep(): number {
    try {
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene && (gameScene as any).gameState) {
        return (gameScene as any).gameState.getState().step || 0;
      }
    } catch {}
    return 0; // Default to 0 if can't get step
  }

  /**
   * Process frame-by-frame pothole creation countdown
   */
  private processPotholeCreationCountdown(): void {
    const countdown = (this as any).potholeCreationCountdown;
    if (countdown && countdown.remaining > 0) {
      const currentStep = this.getCurrentStep();
      
      // If step changed, stop creating potholes and clear countdown
      if (currentStep !== countdown.lastStep) {
        (this as any).potholeCreationCountdown = null;
        return;
      }
      
      // Create one pothole window this frame
      const menuConfig: MenuConfig = {
        title: '',
        content: 'YOU HIT A POTHOLE!!!!1',
        buttons: [],
        width: 90,
        height: 60
      };
      
      const potholeDialog = this.createIndependentPotholeDialog(menuConfig);
      if (potholeDialog) {
        // Trigger a small shake for each spawned pothole window
        try { this.scene.scene.get('GameScene')?.events.emit('potholeMenuShake'); } catch {}
        (potholeDialog as any).isPothole = true;
        (potholeDialog as any).stepsRemaining = 4;
        (potholeDialog as any).isIndependent = true;
        
        // Randomize position within inner 60% of screen
        try {
          const gw = this.scene.cameras.main.width;
          const gh = this.scene.cameras.main.height;
          const rx = Phaser.Math.FloatBetween(0.2, 0.8) * gw;
          const ry = Phaser.Math.FloatBetween(0.2, 0.8) * gh;
          (potholeDialog as Phaser.GameObjects.Container).setPosition(rx, ry);
        } catch {}
        
        // Add to independent pothole dialogs list for tracking
        if (!(this as any).independentPotholeDialogs) {
          (this as any).independentPotholeDialogs = [];
        }
        (this as any).independentPotholeDialogs.push(potholeDialog);
      }
      
      // Decrement countdown
      countdown.remaining -= 1;
      if (countdown.remaining <= 0) {
        (this as any).potholeCreationCountdown = null;
      }
    }
  }

  /**
   * Create an independent pothole dialog that doesn't interfere with the main menu system
   */
  private createIndependentPotholeDialog(menuConfig: MenuConfig): Phaser.GameObjects.Container | null {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const dialogWidth = menuConfig.width || 90;
    const dialogHeight = menuConfig.height || 60;

    // Create independent container
    const potholeDialog = this.scene.add.container(gameWidth / 2, gameHeight / 2);
    potholeDialog.setScrollFactor(0);
    potholeDialog.setDepth(50000); // High depth to appear above other menus

    // Create the white window background
    const halfW = dialogWidth / 2;
    const halfH = dialogHeight / 2;
    
    try {
      const gameScene = this.scene.scene.get('GameScene');
      const windowShapes = (gameScene && (gameScene as any).windowShapes) || this.windowShapes;
      if (windowShapes && (windowShapes as any).createCollageRect) {
        // Create the white window background
        const collageBackground = (windowShapes as any).createCollageRect({
          x: -halfW,
          y: -halfH,
          width: dialogWidth,
          height: dialogHeight,
          fillColor: 0xffffff,
          fillAlpha: 1.0
        }, false, 'window');

        if (collageBackground) {
          collageBackground.setDepth(-1);
          collageBackground.setPosition(0, 0);
          potholeDialog.add(collageBackground);

          // Register for animation
          const shapeId = `pothole_window_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          try {
            (windowShapes as any).registerAnimatedShape(shapeId, collageBackground, 'window', -halfW, -halfH, dialogWidth, dialogHeight);
          } catch (error) {
            console.error('❌ Failed to register pothole window animation:', error);
          }
          (collageBackground as any).__shapeId = shapeId;

          // Opening animation
          collageBackground.setScale(0.01);
          this.scene.tweens.add({
            targets: collageBackground,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.easeOut'
          });

          // Store reference for cleanup
          (potholeDialog as any).collageWindow = collageBackground;
        }
      }
    } catch (error) {
      console.error('❌ Error creating pothole background:', error);
    }

    // Add plain black text content (no black rectangle background)
    if (menuConfig.content) {
      const padding = 6;
      const textWidth = dialogWidth - padding * 2;
      const text = String(menuConfig.content || '').trim();
      const t = this.scene.add.text(0, 0, text, {
        fontSize: '12px',
        color: '#000000',
        wordWrap: { width: textWidth, useAdvancedWrap: true },
        align: 'center'
      }).setOrigin(0.5);
      t.setPosition(0, 0); // Center inside the small pothole window
      potholeDialog.add(t);
    }

    return potholeDialog;
  }

  /**
   * Show tutorial interrupt menu
   */
  public showTutorialInterrupt() {
    // Hard guard: if EXIT/SHOP open, queue and bail
    if (this.isExitOrShopOpen()) { this.enqueueMenu('TUTORIAL_INTERRUPT'); return; }
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
    
    // Capture the button text object reference for countdown updates
    // Prefer the reference set during collage button creation; otherwise, search recursively
    let buttonText: Phaser.GameObjects.Text | undefined = (this.currentDialog as any).buttonText;
    if (!buttonText) {
      const findTextRecursive = (node: any): Phaser.GameObjects.Text | undefined => {
        if (!node || !node.list) return undefined;
        for (const child of node.list) {
          if (child instanceof Phaser.GameObjects.Text && typeof child.text === 'string' && child.text.includes('Continue')) {
            return child as Phaser.GameObjects.Text;
          }
          // Recurse into containers
          if ((child as any).list) {
            const found = findTextRecursive(child);
            if (found) return found;
          }
        }
        return undefined;
      };
      buttonText = findTextRecursive(this.currentDialog);
    }
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
    console.log(`🚪 MenuManager: showExitMenu called with shopCount=${shopCount}, exitNumber=${exitNumber}`);
    console.log(`🚪 MenuManager: Current menu stack length:`, this.menuStack.length);
    // If a virtual pet menu is open, close it immediately before showing exit
    if (this.currentDisplayedMenuType === 'VIRTUAL_PET') {
      try { this.closeCurrentDialog(); } catch {}
    }
    
    // Persist the last exit number so nested menus (e.g., Shop -> Back) can restore it
    (this as any)._lastExitNumber = exitNumber ?? (this as any)._lastExitNumber;
    
    // Queue if CYOA is open - let user finish their choice
    if (this.currentDisplayedMenuType === 'CYOA') {
      console.log('⏳ Queueing EXIT until CYOA closes');
      this.enqueueMenu('EXIT', { shopCount, exitNumber });
      return;
    }
    
    // Queue if STORY is open - let user finish reading the story
    if (this.currentDisplayedMenuType === 'STORY' || this.currentDisplayedMenuType === 'NOVEL_STORY' || this.currentDisplayedMenuType === 'STORY_OUTCOME') {
      console.log('⏳ Queueing EXIT until STORY closes');
      this.enqueueMenu('EXIT', { shopCount, exitNumber });
      return;
    }
    
    // Queue if another EXIT is open - let user finish their current exit interaction
    if (this.currentDisplayedMenuType === 'EXIT') {
      console.log('⏳ Queueing EXIT until current EXIT closes');
      this.enqueueMenu('EXIT', { shopCount, exitNumber });
      return;
    }
    
    if (!this.canShowMenu('EXIT')) {
      console.log(`🚫 MenuManager: showExitMenu blocked by canShowMenu check`);
      return;
    }
    console.log(`✅ MenuManager: showExitMenu proceeding after canShowMenu check`);
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
    this.pushMenu('EXIT', { exitNumber: exitNumForMenu, shopCount: shopCount }); // Store exit number and shop count for restoration
    
    // Generate shop names based on count
    const shopNames = this.generateShopNames(shopCount);
    
    // Create buttons for each shop with a weighted price indicator
    const buttons: MenuButton[] = shopNames.map((shopName, index) => {
      const price = this.getWeightedPrice();
      const parts = this.formatPriceParts(price);
      const btn: MenuButton = {
      text: shopName,
        onClick: () => { this.handleExitShopChoiceWithPrice(shopName, price); }
      };
      (btn as any).__priceFilled = parts.filled;
      (btn as any).__priceEmpty = parts.empty;
      return btn;
    });
    // Add a close button to allow dismissing the exit menu
    buttons.push({ text: 'Close', onClick: () => { this.closeDialog(); } });
    
    // No close button - user must choose a shop
    
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
   * Show a catalog of all possible exit store types for testing
   */
  public showExitStoresCatalog(exitNumber?: number) {
    console.log(`🚪 MenuManager: showExitStoresCatalog called with exitNumber=${exitNumber}`);
    // If a virtual pet menu is open, close it immediately before showing exit
    if (this.currentDisplayedMenuType === 'VIRTUAL_PET') {
      try { this.closeCurrentDialog(); } catch {}
    }

    // Persist/resolve exit number similar to showExitMenu
    (this as any)._lastExitNumber = exitNumber ?? (this as any)._lastExitNumber;
    
    // Queue if CYOA is open - let user finish their choice
    if (this.currentDisplayedMenuType === 'CYOA') {
      console.log('⏳ Queueing EXIT until CYOA closes');
      this.enqueueMenu('EXIT', { exitNumber });
      return;
    }
    
    // Queue if STORY is open - let user finish reading the story
    if (this.currentDisplayedMenuType === 'STORY' || this.currentDisplayedMenuType === 'NOVEL_STORY' || this.currentDisplayedMenuType === 'STORY_OUTCOME') {
      console.log('⏳ Queueing EXIT until STORY closes');
      this.enqueueMenu('EXIT', { exitNumber });
      return;
    }
    
    // Queue if another EXIT is open - let user finish their current exit interaction
    if (this.currentDisplayedMenuType === 'EXIT') {
      console.log('⏳ Queueing EXIT until current EXIT closes');
      this.enqueueMenu('EXIT', { exitNumber });
      return;
    }
    
    if (!this.canShowMenu('EXIT')) {
      console.log(`🚫 MenuManager: showExitStoresCatalog blocked by canShowMenu check`);
      return;
    }
    this.clearCurrentDialog();
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
    this.pushMenu('EXIT', { exitNumber: exitNumForMenu });

    // All known shop/store types
    const allShopTypes: string[] = [
      'regional gas station', 'gas station', 'motel', 'restaurant',
      'weed store', 'car store', 'car doctor', 'psychic'
    ];

    const buttons: MenuButton[] = allShopTypes.map((shopName) => {
      const price = this.getWeightedPrice();
      const parts = this.formatPriceParts(price);
      const btn: MenuButton = {
        text: shopName,
        onClick: () => { this.handleExitShopChoiceWithPrice(shopName, price); }
      };
      (btn as any).__priceFilled = parts.filled;
      (btn as any).__priceEmpty = parts.empty;
      return btn;
    });
    // Add a close button to allow dismissing the catalog
    buttons.push({ text: 'Close', onClick: () => { this.closeDialog(); } });

    const menuConfig: MenuConfig = {
      title: 'EXIT (All Stores)',
      content: `Choose a store to test. (${allShopTypes.length} total)`,
      buttons: buttons
    };
    this.createDialog(menuConfig, 'EXIT');
    try { (this.currentDialog as any).exitNumber = exitNumForMenu; } catch {}
  }

  /**
   * Region choice menu (stub) to satisfy MenuScene usage
   */
  public showRegionChoiceMenu(config: { currentRegion: string; connectedRegions: string[] }) {
    // If EXIT/SHOP is open, queue with payload and bail
    if (this.isExitOrShopOpen()) { 
      this.enqueueMenu('REGION_CHOICE', config); 
      return; 
    }
    
    // Queue if CYOA is open - let user finish their choice
    if (this.currentDisplayedMenuType === 'CYOA') {
      console.log('⏳ Queueing REGION_CHOICE until CYOA closes');
      this.enqueueMenu('REGION_CHOICE', config);
      return;
    }
    
    // Queue if VIRTUAL_PET is open - let user finish interacting with their pet
    if (this.currentDisplayedMenuType === 'VIRTUAL_PET') {
      console.log('⏳ Queueing REGION_CHOICE until VIRTUAL_PET closes');
      this.enqueueMenu('REGION_CHOICE', config);
      return;
    }
    
    // Queue if STORY is open - let user finish reading the story
    if (this.currentDisplayedMenuType === 'STORY' || this.currentDisplayedMenuType === 'NOVEL_STORY' || this.currentDisplayedMenuType === 'STORY_OUTCOME') {
      console.log('⏳ Queueing REGION_CHOICE until STORY closes');
      this.enqueueMenu('REGION_CHOICE', config);
      return;
    }
    
    // Queue if DESTINATION is open - let user finish their destination choice
    if (this.currentDisplayedMenuType === 'DESTINATION') {
      console.log('⏳ Queueing REGION_CHOICE until DESTINATION closes');
      this.enqueueMenu('REGION_CHOICE', config);
      return;
    }
    
    // Queue if another REGION_CHOICE is open - let user finish their current region choice
    if (this.currentDisplayedMenuType === 'REGION_CHOICE') {
      console.log('⏳ Queueing REGION_CHOICE until current REGION_CHOICE closes');
      this.enqueueMenu('REGION_CHOICE', config);
      return;
    }
    
    if (!this.canShowMenu('REGION_CHOICE')) return;
    this.clearCurrentDialog();
    this.pushMenu('REGION_CHOICE');
    const regions = config?.connectedRegions || [];
    const buttons: MenuButton[] = regions.map((regionKey) => ({
      text: regionKey,
      onClick: () => { this.closeDialog(); }
    }));
    const menuConfig: MenuConfig = {
      title: 'Choose Next Region',
      content: `Current: ${config?.currentRegion || 'unknown'}`,
      buttons
    };
    this.createDialog(menuConfig, 'REGION_CHOICE');
  }

  // Compute dynamic difficulty: region index (custom mapping) + fraction of shows completed in region
  private getCurrentDifficulty(): number {
    try {
      const gameScene = this.scene.scene.get('GameScene') as any;
      const gameState = gameScene?.gameState;
      const state = gameState?.getState?.();
      if (!state) return 1;
      const currentRegion: string = state.currentRegion || REGION_CONFIG.startingRegion;
      const showsDone: number = state.showsInCurrentRegion || 0;
      const showsPerRegion: number = (REGION_CONFIG as any).showsPerRegion || 3;
      const regionBase = this.getRegionBaseDifficulty(currentRegion);
      const progressFrac = Math.max(0, Math.min(1, showsDone / Math.max(1, showsPerRegion)));
      const difficulty = Math.min(5, regionBase + progressFrac);
      return difficulty;
    } catch {
      return 1;
    }
  }

  // Explicit mapping so that midwest=1, south=2 as per examples
  private getRegionBaseDifficulty(regionKey: string): number {
    const mapping: Record<string, number> = {
      midwest: 1,
      south: 2,
      southwest: 3,
      west: 4,
      northeast: 5
    };
    return mapping[regionKey] ?? 1;
  }

  // Weighted price helper varies with difficulty; higher difficulty -> weights approach uniform
  private getWeightedPrice(): 1 | 2 | 3 | 4 {
    const difficulty = this.getCurrentDifficulty();
    // Base weights at low difficulty
    const base = { 1: 0.20, 2: 0.50, 3: 0.25, 4: 0.05 } as Record<number, number>;
    // Uniform weights target at max difficulty
    const uniform = { 1: 0.25, 2: 0.25, 3: 0.25, 4: 0.25 } as Record<number, number>;
    // Interpolation factor from 0 (diff=1) to 1 (diff=5)
    const t = Math.max(0, Math.min(1, (difficulty - 1) / 4));
    const weights = [1, 2, 3, 4].map(k => base[k] * (1 - t) + uniform[k] * t);
    // Normalize to be safe
    const sum = weights.reduce((a, b) => a + b, 0);
    const norm = weights.map(w => (w <= 0 ? 0 : w / (sum || 1)));
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < norm.length; i++) {
      acc += norm[i];
      if (r <= acc) return (i + 1) as 1 | 2 | 3 | 4;
    }
    return 4; // Fallback
  }

  private formatPriceParts(price: number): { filled: string; empty: string } {
    const count = Math.max(1, Math.min(4, Math.floor(price)));
    const filled = '$'.repeat(count);
    const empty = '$'.repeat(4 - count);
    return { filled, empty };
  }

  /**
   * Generate shop names based on count
   */
  private generateShopNames(count: number): string[] {
    const shopTypes = [
      'regional gas station', 'gas station', 'motel', 'restaurant',
      'weed store', 'car store', 'car doctor', 'psychic'
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
    this.handleExitShopChoiceWithPrice(shopName, this.getWeightedPrice());
  }

  private handleExitShopChoiceWithPrice(shopName: string, priceTier: 1|2|3|4) {
    try { console.log('Exit menu choice:', shopName, 'priceTier', priceTier); } catch {}
    this.showShopMenu({ shopType: (shopName || '').toLowerCase(), priceTier });
    try { this.scene.events.emit('exitShopChosen', shopName); } catch {}
  }

  public showShopMenu(opts?: { shopType?: string; priceTier?: 1|2|3|4 }) {
    if (!this.canShowMenu('SHOP')) return;
    // Don't call clearCurrentDialog() here as it would resume the game prematurely
    // Instead, just clear the visual dialog without closing the menu stack
    if (this.currentDialog) {
      // Clean up overlay before destroying dialog
      if ((this.currentDialog as any).background) {
        const background = (this.currentDialog as any).background;
        if ((background as any).overlayInstance) {
          console.log('MenuManager: Cleaning up overlay instance in showShopMenu');
          (background as any).overlayInstance.destroy();
        } else {
          background.destroy();
        }
      }
      this.currentDialog.destroy();
      this.currentDialog = null;
    }
    this.pushMenu('SHOP');
    
    // Get current money from GameScene
    const gameScene = this.scene.scene.get('GameScene');
    const currentMoney = gameScene ? (gameScene as any).gameState?.getState()?.money || 0 : 0;
    
    // Resolve shop inventory based on config and price tier
    const shopsData = (this.scene.cache.json.get('shops') || {}) as any;
    const shopKey = (opts?.shopType || '').toLowerCase();
    const priceTier = opts?.priceTier || this.getWeightedPrice();
    (this as any)._lastPriceTier = priceTier;
    const shopDef = shopsData[shopKey] || {};
    let shopItems: Array<{ name: string; cost: number; effect?: any }> = [];
    if (shopDef.type === 'retail' && shopDef.items) {
      const tierItems = (shopDef.items[String(priceTier)] || []) as any[];
      const shuffled = tierItems.slice().sort(() => Math.random() - 0.5);
      shopItems = shuffled.slice(0, 3).map(it => ({ name: String(it.name), cost: Number(it.cost), effect: it.effect }));
    }

    // Service shops
    if (shopDef.type === 'service') {
      if (shopKey === 'car doctor') {
        const baseCosts: number[] = (shopDef.pricing?.base || [30,60,100,150]);
        const cost = baseCosts[Math.max(0, Math.min(baseCosts.length - 1, (priceTier as number) - 1))];
    const menuConfig: MenuConfig = {
          title: 'car doctor',
          content: `they fixed this and this and that, $${cost}`,
          buttons: [
            { text: 'pay and heal', onClick: () => this.handleServiceCharge('car doctor', cost) },
            { text: 'Back', onClick: () => { this.destroyCurrentDialogOnly(); this.showExitMenu(); } },
            { text: 'Close', onClick: () => this.closeDialog() }
          ]
        };
        this.createDialog(menuConfig, 'SHOP');
        return;
      }
      if (shopKey === 'psychic') {
        const baseCosts: number[] = (shopDef.pricing?.base || [20,35,55,80]);
        const cost = baseCosts[Math.max(0, Math.min(baseCosts.length - 1, (priceTier as number) - 1))];
        const menuConfig: MenuConfig = {
          title: 'psychic',
          content: `here's a rumor i heard`,
          buttons: [
            { text: `pay $${cost}`, onClick: () => this.handleServiceCharge('psychic', cost, true) },
            { text: 'Back', onClick: () => { this.destroyCurrentDialogOnly(); this.showExitMenu(); } },
            { text: 'Close', onClick: () => this.closeDialog() }
          ]
        };
        this.createDialog(menuConfig, 'SHOP');
        return;
      }
      if (shopKey === 'regional gas station') {
        const baseCosts: number[] = (shopDef.pricing?.base || [15,25,40,60]);
        const cost = baseCosts[Math.max(0, Math.min(baseCosts.length - 1, (priceTier as number) - 1))];
        const menuConfig: MenuConfig = {
          title: 'regional gas station',
          content: `they topped you off and wiped the windshield, $${cost}`,
          buttons: [
            { text: `pay $${cost}`, onClick: () => this.handleServiceCharge('regional gas station', cost) },
            { text: 'Back', onClick: () => { this.destroyCurrentDialogOnly(); this.showExitMenu(); } },
            { text: 'Close', onClick: () => this.closeDialog() }
          ]
        };
        this.createDialog(menuConfig, 'SHOP');
        return;
      }
    }

    const menuConfig: MenuConfig = {
      title: shopKey || 'shop',
      content: `money: $${currentMoney}`,
      buttons: shopItems.map(item => ({
        text: `${String(item.name).toLowerCase()} - $${item.cost}`,
        onClick: () => this.handleShopPurchase(item.name, item.cost),
        style: {
          fontSize: '16px',
          color: currentMoney >= item.cost ? '#ffffff' : '#666666',
          backgroundColor: currentMoney >= item.cost ? '#34495e' : '#222222',
          padding: { x: 15, y: 8 }
        }
      })).concat([
        { text: 'Back', onClick: () => { this.destroyCurrentDialogOnly(); this.showExitMenu(); }, style: { fontSize: '16px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 6 } } },
        { text: 'Close', onClick: () => this.closeDialog(), style: { fontSize: '16px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 6 } } }
      ])
    };
    
    this.createDialog(menuConfig, 'SHOP');
    
    // Shops are interactive menus - no auto-completion needed
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
    
    // Keep shop open; refresh shop UI to reflect new money
    this.refreshCurrentShopMenu();
    
    // Emit purchase event for potential game effects
    try { this.scene.events.emit('shopPurchase', { item: itemName, cost: cost }); } catch {}
  }

  private refreshCurrentShopMenu() {
    // Only refresh if we're currently showing a shop menu
    if (this.currentDisplayedMenuType !== 'SHOP' || !this.currentDialog) {
      return;
    }
    
    // Get current money from GameScene
    const gameScene = this.scene.scene.get('GameScene');
    const currentMoney = gameScene ? (gameScene as any).gameState?.getState()?.money || 0 : 0;
    
    // Get the last price tier used for this shop
    const priceTier = (this as any)._lastPriceTier || 1;
    
    // Get the shop type from the current menu stack
    const shopMenu = this.menuStack.find(m => m.type === 'SHOP');
    const shopType = shopMenu?.config?.shopType || '';
    
    // Resolve shop inventory based on config and price tier
    const shopsData = (this.scene.cache.json.get('shops') || {}) as any;
    const shopKey = shopType.toLowerCase();
    const shopDef = shopsData[shopKey] || {};
    let shopItems: Array<{ name: string; cost: number; effect?: any }> = [];
    
    if (shopDef.type === 'retail' && shopDef.items) {
      const tierItems = (shopDef.items[String(priceTier)] || []) as any[];
      const shuffled = tierItems.slice().sort(() => Math.random() - 0.5);
      shopItems = shuffled.slice(0, 3).map(it => ({ name: String(it.name), cost: Number(it.cost), effect: it.effect }));
    }
    
    // Service shops
    if (shopDef.type === 'service') {
      if (shopKey === 'car doctor') {
        const baseCosts: number[] = (shopDef.pricing?.base || [30,60,100,150]);
        const cost = baseCosts[Math.max(0, Math.min(baseCosts.length - 1, (priceTier as number) - 1))];
        
        // Update the current dialog content to reflect new money
        this.updateCurrentDialogContent(`they fixed this and this and that, $${cost}`, `Money: $${currentMoney}`);
        return;
      }
    }
    
    // For retail shops, update the content to show new money
    if (shopItems.length > 0) {
      const itemsText = shopItems.map(item => `${item.name}: $${item.cost}`).join('\n');
      this.updateCurrentDialogContent(itemsText, `Money: $${currentMoney}`);
    }
  }
  
  private updateCurrentDialogContent(content: string, title?: string) {
    if (!this.currentDialog) return;
    
    // Find and update the content text element
    const contentText = this.currentDialog.getByName('contentText') as Phaser.GameObjects.Text;
    if (contentText) {
      contentText.setText(content);
    }
    
    // Update title if provided
    if (title) {
      const titleText = this.currentDialog.getByName('titleText') as Phaser.GameObjects.Text;
      if (titleText) {
        titleText.setText(title);
      }
    }
  }

  private handleServiceCharge(serviceName: string, cost: number, sayRumor?: boolean) {
    const gameScene = this.scene.scene.get('GameScene');
    if (!gameScene) return;
    const gameState = (gameScene as any).gameState;
    if (!gameState) return;
    const state = gameState.getState();
    const currentMoney = state.money || 0;
    if (currentMoney < cost) return;
    gameState.updateState({ money: currentMoney - cost });
    if (serviceName === 'car doctor') {
      // Refill health to max (assume 10 if no cap exposed)
      gameState.updateState({ health: 10 });
    }
    if (sayRumor) {
      console.log("psychic rumor: here's a rumor i heard");
    }
    // Refresh same service menu to reflect updated money
    this.refreshCurrentShopMenu();
  }

  private destroyCurrentDialogOnly() {
    if (this.currentDialog) {
      if ((this.currentDialog as any).background) {
        const background = (this.currentDialog as any).background;
        if ((background as any).overlayInstance) {
          (background as any).overlayInstance.destroy();
        } else {
          background.destroy();
        }
      }
      this.currentDialog.destroy();
      this.currentDialog = null;
    }
  }

  public showTurnKeyMenu() {
    console.log('MenuManager: showTurnKeyMenu called');
    console.log('MenuManager: Current stack before showTurnKeyMenu:', this.menuStack.map(m => `${m.type}(${m.priority})`));
    console.log('MenuManager: Current dialog exists:', !!this.currentDialog);
    console.log('MenuManager: Current displayed menu type:', this.currentDisplayedMenuType);
    
    // Always rebuild the ignition menu when keys are in ignition and car not started
    console.log('MenuManager: Showing ignition menu');
    
    // TURN_KEY has priority 110, so it should preempt lower priority menus
    if (!this.canShowMenu('TURN_KEY')) {
      console.log('MenuManager: Cannot show TURN_KEY menu - blocked by higher priority');
      return;
    }
    
    // Clear any queued menus since ignition takes absolute priority
    if (this.queuedMenus.length > 0) {
      console.log(`MenuManager: Clearing ${this.queuedMenus.length} queued menus for ignition priority`);
      this.queuedMenus = [];
    }
    
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
    
    // Don't start auto-completion for ignition menu - it handles its own completion via slider
    // this.startMenuAutoComplete('TURN_KEY');
    
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
        if (startValue >= startMax && !carStarted) {
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
    // If EXIT/SHOP is open, queue with payload and bail
    if (this.isExitOrShopOpen()) { 
      this.enqueueMenu('OBSTACLE', { obstacleType, damage, exitNumber }); 
      return; 
    }
    
    // Queue if CYOA is open - let user finish their choice
    if (this.currentDisplayedMenuType === 'CYOA') {
      console.log('⏳ Queueing OBSTACLE until CYOA closes');
      this.enqueueMenu('OBSTACLE', { obstacleType, damage, exitNumber });
      return;
    }
    
    // Queue if VIRTUAL_PET is open - let user finish interacting with their pet
    if (this.currentDisplayedMenuType === 'VIRTUAL_PET') {
      console.log('⏳ Queueing OBSTACLE until VIRTUAL_PET closes');
      this.enqueueMenu('OBSTACLE', { obstacleType, damage, exitNumber });
      return;
    }
    
    // Queue if STORY is open - let user finish reading
    if (this.currentDisplayedMenuType === 'STORY' || this.currentDisplayedMenuType === 'NOVEL_STORY' || this.currentDisplayedMenuType === 'STORY_OUTCOME') {
      console.log('⏳ Queueing OBSTACLE until STORY closes');
      this.enqueueMenu('OBSTACLE', { obstacleType, damage, exitNumber });
      return;
    }
    
    // Queue if DESTINATION is open - let user finish planning
    if (this.currentDisplayedMenuType === 'DESTINATION') {
      console.log('⏳ Queueing OBSTACLE until DESTINATION closes');
      this.enqueueMenu('OBSTACLE', { obstacleType, damage, exitNumber });
      return;
    }
    
    // Queue if REGION_CHOICE is open - let user finish choosing
    if (this.currentDisplayedMenuType === 'REGION_CHOICE') {
      console.log('⏳ Queueing OBSTACLE until REGION_CHOICE closes');
      this.enqueueMenu('OBSTACLE', { obstacleType, damage, exitNumber });
      return;
    }
    
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
    // Hard guard: if EXIT/SHOP open, queue with payload and bail
    if (this.isExitOrShopOpen()) { this.enqueueMenu('CYOA', cyoaData); return; }
    
    // Also queue if VIRTUAL_PET is open - let user finish interacting with their pet
    if (this.currentDisplayedMenuType === 'VIRTUAL_PET') { 
      console.log('⏳ Queueing CYOA until VIRTUAL_PET closes');
      this.enqueueMenu('CYOA', cyoaData); 
      return; 
    }
    
    // Also queue if STORY is open - let user finish reading the story
    if (this.currentDisplayedMenuType === 'STORY' || this.currentDisplayedMenuType === 'NOVEL_STORY' || this.currentDisplayedMenuType === 'STORY_OUTCOME') { 
      console.log('⏳ Queueing CYOA until STORY closes');
      this.enqueueMenu('CYOA', cyoaData); 
      return; 
    }
    
    console.log(`🎭 CYOA (H-style): Creating CYOA ${cyoaData.cyoaId}`);
    console.log('MenuManager: Current menu stack before CYOA:', this.menuStack.map(m => `${m.type}(${m.priority})`));
    console.log('MenuManager: Current displayed menu type:', this.currentDisplayedMenuType);
    
    // Prevent duplicate CYOA creation
    if (this.currentDisplayedMenuType === 'CYOA') {
      console.log('🎭 CYOA already displayed, ignoring duplicate request');
      return;
    }
    
    // Also check if CYOA is already on the stack
    if (this.menuStack.some(m => m.type === 'CYOA')) {
      console.log('🎭 CYOA already on stack, ignoring duplicate request');
      return;
    }
    
    // Check if CYOA can be shown (priority check)
    if (!this.canShowMenu('CYOA')) {
      console.log('MenuManager: Cannot show CYOA menu - blocked by higher priority');
      return;
    }
    
    // Clear any existing simple dialog and ensure proper cleanup
    this.clearCurrentDialog();
    
    // Push to stack for priority management
    this.pushMenu('CYOA', cyoaData);

    // Pause game while CYOA is open
    this.pauseGame();

    // Use standard menu system instead of WindowShapes to avoid conflicts
    const menuConfig: MenuConfig = {
      title: 'CYOA',
      content: 'choose your path',
      buttons: [
        { 
          text: 'ok', 
          onClick: () => {
            this.closeDialog();
            this.resumeGame();
            this.popSpecificMenu('CYOA');
          }
        },
        { 
          text: 'no', 
          onClick: () => {
            this.closeDialog();
            this.resumeGame();
            this.popSpecificMenu('CYOA');
          }
        }
      ]
    };
    
    this.createDialog(menuConfig, 'CYOA');
  }

  public showStoryMenu(storyData: { isExitRelated: boolean, exitNumber?: number }) {
    // Ensure transient pothole dialogs don't linger under story menus
    this.clearAllPotholeDialogs(true);
    // If EXIT/SHOP is open, queue with payload and bail
    if (this.isExitOrShopOpen()) { this.enqueueMenu('STORY', storyData); return; }
    
    // Queue if CYOA is open - let user finish their choice
    if (this.currentDisplayedMenuType === 'CYOA') {
      console.log('⏳ Queueing STORY until CYOA closes');
      this.enqueueMenu('STORY', storyData);
      return;
    }
    
    // Queue if VIRTUAL_PET is open - let user finish interacting with their pet
    if (this.currentDisplayedMenuType === 'VIRTUAL_PET') {
      console.log('⏳ Queueing STORY until VIRTUAL_PET closes');
      this.enqueueMenu('STORY', storyData);
      return;
    }
    
    // Queue if another story is open - let user finish their current story
    if (this.currentDisplayedMenuType === 'STORY' || this.currentDisplayedMenuType === 'NOVEL_STORY' || this.currentDisplayedMenuType === 'STORY_OUTCOME') {
      console.log('⏳ Queueing STORY until current story closes');
      this.enqueueMenu('STORY', storyData);
      return;
    }
    
    if (!this.canShowMenu('STORY')) return;
    
    this.clearCurrentDialog();
    this.pushMenu('STORY', storyData);
    
    // Mark that a story sequence is starting
    this.storySequenceInProgress = true;
    
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

  public showNovelStory(storyData: { 
    storyline: string; 
    event: number; 
    eventData: any; 
    storylineData: any 
  }) {
    // Ensure transient pothole dialogs don't linger under story menus
    this.clearAllPotholeDialogs(true);
    // If EXIT/SHOP is open, queue with payload and bail
    if (this.isExitOrShopOpen()) { this.enqueueMenu('NOVEL_STORY', storyData); return; }
    
    // Queue if CYOA is open - let user finish their choice
    if (this.currentDisplayedMenuType === 'CYOA') {
      console.log('⏳ Queueing NOVEL_STORY until CYOA closes');
      this.enqueueMenu('NOVEL_STORY', storyData);
      return;
    }
    
    // Queue if VIRTUAL_PET is open - let user finish interacting with their pet
    if (this.currentDisplayedMenuType === 'VIRTUAL_PET') {
      console.log('⏳ Queueing NOVEL_STORY until VIRTUAL_PET closes');
      this.enqueueMenu('NOVEL_STORY', storyData);
      return;
    }
    
    // Queue if another story is open - let user finish their current story
    if (this.currentDisplayedMenuType === 'STORY' || this.currentDisplayedMenuType === 'NOVEL_STORY' || this.currentDisplayedMenuType === 'STORY_OUTCOME') {
      console.log('⏳ Queueing NOVEL_STORY until current story closes');
      this.enqueueMenu('NOVEL_STORY', storyData);
      return;
    }
    console.log('MenuManager: showNovelStory called with:', storyData);
    console.log('MenuManager: canShowMenu check:', this.canShowMenu('NOVEL_STORY'));
    if (!this.canShowMenu('NOVEL_STORY')) {
      console.log('MenuManager: Cannot show novel story menu - blocked');
      return;
    }
    
    this.clearCurrentDialog();
    this.pushMenu('NOVEL_STORY', storyData);
    
    // Mark that a story sequence is starting
    this.storySequenceInProgress = true;
    
    // Pause the game when story menu opens
    const appScene = this.scene.scene.get('AppScene');
    if (appScene) {
      (appScene as any).isPaused = true;
      console.log('MenuManager: Game paused for novel story menu');
    }
    
    // Use H menu styling through WindowShapes instead of old dialog system
    const gameScene = this.scene.scene.get('GameScene') as any;
    if (!gameScene || !gameScene.windowShapes) {
      console.warn('Cannot create novel story: GameScene or WindowShapes not available');
      return;
    }
    
    // Calculate H menu style positioning - MATCH START (85% width, 90% height, centered)
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const width = Math.floor(gameWidth * 0.85);
    const height = Math.floor(gameHeight * 0.90);
    const x = Math.floor((gameWidth - width) / 2);
    const y = Math.floor((gameHeight - height) / 2);
    
    const title = `${storyData.storyline}-${storyData.event}`;
    const content = storyData.eventData.text;
    
    // Create story texts in H menu format
    const storyTexts = [
      title, // Title as first text
      content // Story content as second text
    ];
    
    // Create choice buttons using story data
    const choices = storyData.eventData.choices.map((choice: any, index: number) => ({
      text: choice.text,
      callback: () => {
        // Add a small delay to allow the preceding menu to complete its animation
        this.scene.time.delayedCall(500, () => {
          // Show outcome first, then make choice
          this.showStoryOutcome(storyData.storylineData, choice.outcome, () => {
            // Check if we're in debug mode or real story mode
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene && (gameScene as any).storyManager) {
              const storyManager = (gameScene as any).storyManager;
              
              // If we're in debug mode, just close the dialog
              if (storyManager.isDebugStoryActive()) {
                console.log(`Debug Story: Choice made - ${choice.outcome}`);
                this.closeDialog();
              } else {
                // Real story mode - make choice in story manager
                console.log(`Real Story: Making choice - ${choice.outcome}`);
                storyManager.makeChoice(choice.outcome);
                
                // Don't close dialog here - let the outcome window callback handle story completion
                // The story completion will be triggered when the outcome window is closed
              }
            } else {
              this.closeDialog();
            }
          });
        });
      }
    }));
    
    // Use the CYOA system with H menu styling for novel stories
    const novelContainer = gameScene.windowShapes.createCYOADialog(x, y, width, height, storyTexts, choices);
    
    if (novelContainer) {
      // Set proper depth for story dialogs (below overlays but above game elements)
      novelContainer.setDepth(35000);
      
      // Track as current dialog for MenuManager
      this.currentDialog = novelContainer;
      this.currentDisplayedMenuType = 'NOVEL_STORY';
      
      console.log(`✨ Novel story dialog created with H menu styling: "${title}"`);
    } else {
      console.warn('Novel story dialog was queued (another narrative window is active)');
    }
  }

  public showStoryOutcome(storylineData: any, outcome: string, onContinue: () => void) {
    if (!this.canShowMenu('STORY_OUTCOME')) return;
    
    this.clearCurrentDialog();
    this.pushMenu('STORY_OUTCOME');
    
    // Pause game immediately when outcome window opens
    this.pauseGame();
    
    const outcomeText = storylineData.outcomes[outcome] || storylineData.outcomes['a'];
    const title = 'Outcome';
    
    // Get the game scene for WindowShapes access
    const gameScene = this.scene.scene.get('GameScene') as any;
    
    // Use WindowShapes CYOA system for H menu styling
    if (gameScene && gameScene.windowShapes) {
      // Calculate H menu style positioning - MATCH START (85% width, 90% height, centered)
      const gameWidth = this.scene.cameras.main.width;
      const gameHeight = this.scene.cameras.main.height;
      const width = Math.floor(gameWidth * 0.85);
      const height = Math.floor(gameHeight * 0.90);
      const x = Math.floor((gameWidth - width) / 2);
      const y = Math.floor((gameHeight - height) / 2);
      
      const container = gameScene.windowShapes.createCYOADialog(
        x, y, width, height,
        [title, outcomeText], // texts array
        [
          {
            text: 'Continue',
            callback: () => {
              // First destroy the WindowShapes container properly
              if (container && container.scene) {
                console.log('🗑️ Destroying story outcome WindowShapes container');
                
                // Clear the activeNarrativeWindow reference before destroying
                const gameScene = this.scene.scene.get('GameScene') as any;
                if (gameScene && gameScene.windowShapes && gameScene.windowShapes.activeNarrativeWindow === container) {
                  console.log('🔄 Clearing activeNarrativeWindow reference for story outcome');
                  gameScene.windowShapes.activeNarrativeWindow = null;
                }
                
                container.destroy();
              }
              
              // Wait for the WindowShapes container to be fully cleared before completing story
              const gameScene = this.scene.scene.get('GameScene') as any;
              if (gameScene && gameScene.windowShapes) {
                gameScene.windowShapes.waitForActiveWindowClear(() => {
                  // Complete the story after outcome window is closed and queue is processed
                  if (gameScene && gameScene.storyManager) {
                    console.log('📖 Completing story after outcome window cleared');
                    gameScene.storyManager.completeStoryAfterOutcome();
                  }
                  
                  // Resume game after outcome window is dismissed
                  this.resumeGame();
                  
                  // Mark story sequence as complete
                  this.storySequenceInProgress = false;
                  console.log('📖 Story sequence completed - processing queued menus');
                  
                  // Process any queued menus now that story sequence is complete
                  this.scene.time.delayedCall(100, () => this.processQueuedMenus());
                  
                  // Then call the original callback
                  onContinue();
                });
              } else {
                // Fallback to delay if WindowShapes not available
                this.scene.time.delayedCall(500, () => {
                  if (gameScene && gameScene.storyManager) {
                    console.log('📖 Completing story after outcome window closed (fallback)');
                    gameScene.storyManager.completeStoryAfterOutcome();
                  }
                  
                  // Resume game after outcome window is dismissed
                  this.resumeGame();
                  
                  // Mark story sequence as complete
                  this.storySequenceInProgress = false;
                  console.log('📖 Story sequence completed - processing queued menus (fallback)');
                  
                  // Process any queued menus now that story sequence is complete
                  this.scene.time.delayedCall(100, () => this.processQueuedMenus());
                  
                  onContinue();
                });
              }
            }
          }
        ]
      );
    } else {
      // Fallback to old system if WindowShapes not available
      const menuConfig: MenuConfig = {
        title: title,
        content: outcomeText,
        buttons: [
          {
            text: 'Continue',
          onClick: () => {
            // Delay story completion to ensure proper cleanup
            this.scene.time.delayedCall(500, () => {
              // Complete the story after outcome window is closed
              const gameScene = this.scene.scene.get('GameScene') as any;
              if (gameScene && gameScene.storyManager) {
                console.log('📖 Completing story after outcome window closed (fallback)');
                gameScene.storyManager.completeStoryAfterOutcome();
              }
              onContinue();
            });
          },
            style: { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
          }
        ]
      };

      this.createDialog(menuConfig, 'STORY_OUTCOME');
    }
    
    // No auto-completion for story outcome windows
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
    // If EXIT/SHOP is open, queue with payload and bail
    if (this.isExitOrShopOpen()) { 
      this.enqueueMenu('MORAL_DECISION', config); 
      return; 
    }
    
    // Queue if CYOA is open - let user finish their choice
    if (this.currentDisplayedMenuType === 'CYOA') {
      console.log('⏳ Queueing MORAL_DECISION until CYOA closes');
      this.enqueueMenu('MORAL_DECISION', config);
      return;
    }
    
    // Queue if VIRTUAL_PET is open - let user finish interacting with their pet
    if (this.currentDisplayedMenuType === 'VIRTUAL_PET') {
      console.log('⏳ Queueing MORAL_DECISION until VIRTUAL_PET closes');
      this.enqueueMenu('MORAL_DECISION', config);
      return;
    }
    
    // Queue if STORY is open - let user finish reading
    if (this.currentDisplayedMenuType === 'STORY' || this.currentDisplayedMenuType === 'NOVEL_STORY' || this.currentDisplayedMenuType === 'STORY_OUTCOME') {
      console.log('⏳ Queueing MORAL_DECISION until STORY closes');
      this.enqueueMenu('MORAL_DECISION', config);
      return;
    }
    
    // Queue if DESTINATION is open - let user finish planning
    if (this.currentDisplayedMenuType === 'DESTINATION') {
      console.log('⏳ Queueing MORAL_DECISION until DESTINATION closes');
      this.enqueueMenu('MORAL_DECISION', config);
      return;
    }
    
    // Queue if REGION_CHOICE is open - let user finish choosing
    if (this.currentDisplayedMenuType === 'REGION_CHOICE') {
      console.log('⏳ Queueing MORAL_DECISION until REGION_CHOICE closes');
      this.enqueueMenu('MORAL_DECISION', config);
      return;
    }
    
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
    console.log('MenuManager: Current menu stack before VIRTUAL_PET:', this.menuStack.map(m => `${m.type}(${m.priority})`));
    console.log('MenuManager: Current displayed menu type:', this.currentDisplayedMenuType);
    
    // If EXIT/SHOP is open, queue with payload and bail
    if (this.isExitOrShopOpen()) { 
      this.enqueueMenu('VIRTUAL_PET', { petSprite }); 
      return; 
    }
    
    // Queue if CYOA is open - let user finish their choice
    if (this.currentDisplayedMenuType === 'CYOA') {
      console.log('⏳ Queueing VIRTUAL_PET until CYOA closes');
      this.enqueueMenu('VIRTUAL_PET', { petSprite });
      return;
    }
    
    // Queue if STORY is open - let user finish reading
    if (this.currentDisplayedMenuType === 'STORY' || this.currentDisplayedMenuType === 'NOVEL_STORY' || this.currentDisplayedMenuType === 'STORY_OUTCOME') {
      console.log('⏳ Queueing VIRTUAL_PET until STORY closes');
      this.enqueueMenu('VIRTUAL_PET', { petSprite });
      return;
    }
    
    // Queue if DESTINATION is open - let user finish planning
    if (this.currentDisplayedMenuType === 'DESTINATION') {
      console.log('⏳ Queueing VIRTUAL_PET until DESTINATION closes');
      this.enqueueMenu('VIRTUAL_PET', { petSprite });
      return;
    }
    
    // Queue if REGION_CHOICE is open - let user finish choosing
    if (this.currentDisplayedMenuType === 'REGION_CHOICE') {
      console.log('⏳ Queueing VIRTUAL_PET until REGION_CHOICE closes');
      this.enqueueMenu('VIRTUAL_PET', { petSprite });
      return;
    }
    
    if (!this.canShowMenu('VIRTUAL_PET')) {
      console.log('MenuManager: Cannot show VIRTUAL_PET menu - blocked by higher priority');
      return;
    }
    
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
    // If EXIT/SHOP is open, queue with payload and bail
    if (this.isExitOrShopOpen()) { this.enqueueMenu('DESTINATION', { includeFinalShowStep }); return; }
    
    // Queue if CYOA is open - let user finish their choice
    if (this.currentDisplayedMenuType === 'CYOA') {
      console.log('⏳ Queueing DESTINATION until CYOA closes');
      this.enqueueMenu('DESTINATION', { includeFinalShowStep });
      return;
    }
    
    // Queue if VIRTUAL_PET is open - let user finish interacting with their pet
    if (this.currentDisplayedMenuType === 'VIRTUAL_PET') {
      console.log('⏳ Queueing DESTINATION until VIRTUAL_PET closes');
      this.enqueueMenu('DESTINATION', { includeFinalShowStep });
      return;
    }
    
    // Queue if STORY is open - let user finish reading the story
    if (this.currentDisplayedMenuType === 'STORY' || this.currentDisplayedMenuType === 'NOVEL_STORY' || this.currentDisplayedMenuType === 'STORY_OUTCOME') {
      console.log('⏳ Queueing DESTINATION until STORY closes');
      this.enqueueMenu('DESTINATION', { includeFinalShowStep });
      return;
    }
    
    // Queue if another DESTINATION is open - let user finish their current destination choice
    if (this.currentDisplayedMenuType === 'DESTINATION') {
      console.log('⏳ Queueing DESTINATION until current DESTINATION closes');
      this.enqueueMenu('DESTINATION', { includeFinalShowStep });
      return;
    }
    
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
        { text: 'Go', onClick: () => { /* TODO: handle go selection */ this.closeDialog(); } }
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
    
    // Calculate dialog dimensions based on config or defaults
    const dialogWidth = menuConfig.width || 300;
    const dialogHeight = menuConfig.height || 350;
    
    // Create a simple container-based dialog instead of RexUI dialog
    this.currentDialog = this.scene.add.container(gameWidth / 2, gameHeight / 2);
    this.currentDialog.setScrollFactor(0);
    this.currentDialog.setDepth(50000);
    
     // Set explicit size for the container and cache dimensions for positioning logic
     (this.currentDialog as any).setSize(dialogWidth, dialogHeight);
     (this.currentDialog as any).containerWidth = dialogWidth;
     (this.currentDialog as any).containerHeight = dialogHeight;
    
    // Track what menu type is being displayed
    this.currentDisplayedMenuType = menuType || null;
    
    // Update game state to indicate a menu is open
    const gameSceneInstance = this.scene.scene.get('GameScene');
    if (gameSceneInstance && (gameSceneInstance as any).gameState) {
      (gameSceneInstance as any).gameState.updateState({ hasOpenMenu: true });
    }
    
    // Use unified dithered overlay from WindowShapes (matches story windows)
    try {
      const gameScene = this.scene.scene.get('GameScene');
      const windowShapes = (gameScene && (gameScene as any).windowShapes) || this.windowShapes;
      if (windowShapes) this.windowShapes = windowShapes;
      if (windowShapes && (windowShapes as any).createDitheredOverlay) {
        // Allow forcing a specific pattern per menu type
        const patternMap: Record<string, string> = {
          'START': 'hypercard_diamonds',
          'IGNITION': 'hypercard_diamonds', 
          'CYOA': 'hypercard_waves',
          'EXIT': 'hypercard_waves',
          'SHOP': 'hypercard_waves',
          'STORY': 'hypercard_wood',
          'DESTINATION': 'hypercard_wood'
        };
        const requestedPattern = patternMap[menuType || ''];
        if (requestedPattern) {
          (this.currentDialog as any).__overlayPattern = requestedPattern;
        }
        (windowShapes as any).createDitheredOverlay(this.currentDialog);
        // Track for cleanup parity with old system
        (this.currentDialog as any).background = (this.currentDialog as any).ditheredOverlay || null;
        // Ensure overlay renders below dialog and does not capture input
        try {
          const overlayContainer = (this.currentDialog as any).ditheredOverlay as Phaser.GameObjects.Container | undefined;
          if (overlayContainer) {
            overlayContainer.setDepth(this.currentDialog.depth - 1);
            (overlayContainer as any).disableInteractive?.();
          }
        } catch {}
      }
    } catch {}
    
    // Collage-style dialog background (white window like story "S" windows)
    const halfW = dialogWidth / 2;
    const halfH = dialogHeight / 2;
    // Create tiled scrolling background as default for all menus
    let collageBackground: Phaser.GameObjects.Graphics | null = null;
    let tiledBackground: Phaser.GameObjects.TileSprite | null = null;
    try {
      const gameScene = this.scene.scene.get('GameScene');
      const windowShapes = (gameScene && (gameScene as any).windowShapes) || this.windowShapes;
      if (windowShapes) this.windowShapes = windowShapes;
          
          console.log('🔍 WindowShapes check:', {
            windowShapes: !!windowShapes,
            createCollageRect: !!(windowShapes && (windowShapes as any).createCollageRect),
            gameScene: !!gameScene
          });
          
          if (windowShapes && (windowShapes as any).createCollageRect) {
            console.log('🏗️ Creating collage background...');
            // Create the white window background
            collageBackground = (windowShapes as any).createCollageRect({
          x: -halfW,
          y: -halfH,
          width: dialogWidth,
          height: dialogHeight,
              fillColor: 0xffffff,
              fillAlpha: 1.0
        }, false, 'window');
            console.log('🏗️ Collage background created:', !!collageBackground);
        
        if (collageBackground) {
          collageBackground.setDepth(-1);
          collageBackground.setPosition(0, 0);
          
          // Create the background immediately - try x texture, fallback to solid color
           const xTexture = this.scene.textures.get('x');
          let textureKey = 'x';
          
           if (!xTexture || !xTexture.key) {
            // Create a simple colored texture as fallback (only if not already created)
            if (!this.scene.textures.exists('fallback')) {
              this.scene.textures.generate('fallback', {
                data: ['#00ff00'], // Green pixel for testing
                pixelWidth: 1,
                pixelHeight: 1
              });
            }
            textureKey = 'fallback';
            console.log('⚠️ Using green fallback texture instead of x.png');
          } else {
            console.log('✅ X texture is ready');
          }
          
          // Create the scrolling background
          const backgroundSprite = this.scene.add.tileSprite(0, 0, dialogWidth, dialogHeight, textureKey);
          backgroundSprite.setOrigin(0, 0);
          backgroundSprite.setDepth(-2);
          
          // Position the background sprite correctly relative to the dialog
          backgroundSprite.setPosition(-halfW, -halfH);
          
          console.log('🎨 Background sprite positioned at:', backgroundSprite.x, backgroundSprite.y);
          
          // Temporarily disable mask to test if TileSprite is visible
          // const geometryMask = collageBackground.createGeometryMask();
          // backgroundSprite.setMask(geometryMask);
          
          console.log('🎭 Mask temporarily disabled - should see green TileSprite');
          
          // Add to the dialog
          this.currentDialog.add(backgroundSprite);
          
          // Set up scrolling animation
          this.scene.events.on('postupdate', () => {
           if (backgroundSprite && backgroundSprite.active) {
              backgroundSprite.tilePositionX -= 0.5;
              backgroundSprite.tilePositionY += 0.3;
            }
          });
          
          // Keep references for cleanup
          (this.currentDialog as any).backgroundSprite = backgroundSprite;
          // (this.currentDialog as any).geometryMask = geometryMask; // Commented out since mask is disabled
          
          console.log('🎨 Window background created with texture:', textureKey);
          console.log('🔍 Dialog container info:', {
            x: this.currentDialog.x,
            y: this.currentDialog.y,
            width: this.currentDialog.width,
            height: this.currentDialog.height,
            childrenCount: this.currentDialog.list.length,
            dialogWidth: dialogWidth,
            dialogHeight: dialogHeight
          });
          
          // Add the polygon to the dialog
          this.currentDialog.add(collageBackground);
          
          // Keep reference for cleanup
          (this.currentDialog as any).collageWindow = collageBackground;
          
          // Register for animation
          const shapeId = `menu_window_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          try { 
            (windowShapes as any).registerAnimatedShape(shapeId, collageBackground, 'window', -halfW, -halfH, dialogWidth, dialogHeight); 
            console.log('🎬 Registered window animation:', shapeId);
          } catch (error) {
            console.error('❌ Failed to register window animation:', error);
          }
          (collageBackground as any).__shapeId = shapeId;

          // Opening animation
          try {
            collageBackground.setScale(0.01);
            this.scene.tweens.add({
              targets: collageBackground,
              scaleX: 1,
              scaleY: 1,
              duration: 200,
              ease: 'Back.easeOut'
            });
          } catch {}
        }
      }
    } catch (error) {
      console.error('❌ Error creating collage background:', error);
    }
    
    // Fallback simple background if collage couldn't be created
    if (!collageBackground) {
      const fallback = this.scene.add.graphics();
      fallback.fillStyle(0x333333, 0.9);
      fallback.fillRoundedRect(-halfW, -halfH, dialogWidth, dialogHeight, 10);
      fallback.lineStyle(2, 0xffffff, 1);
      fallback.strokeRoundedRect(-halfW, -halfH, dialogWidth, dialogHeight, 10);
      fallback.setDepth(-1);
      this.currentDialog.add(fallback);
    }
    
    // Title rendered using WindowShapes narrative text (black animating background)
    const titleText = `<< ${String(menuConfig.title || '')} >>`;
    if (menuConfig.title && menuConfig.title.trim()) { // Only create title if it's not empty
      try {
      const ws = (this.windowShapes || (this.scene.scene.get('GameScene') as any)?.windowShapes);
      if (ws && (ws as any).createNarrativeText) {
        // Place at top-left, much more to the left
        let nx = -halfW - 20; // Move much further left
        // Adjust title position for small dialogs to prevent clipping
        const ny = dialogHeight < 120 ? -halfH + 5 : -halfH - 12;
        let nwidth = dialogWidth - 80; // Reasonable width
        
        // Create title manually with same organic styling as other text tags
        const titleElement = this.scene.add.text(nx, ny, titleText, {
          fontSize: '20px',
          color: '#ffffff',
          align: 'left',
          fontFamily: 'Arial',
          padding: { x: 8, y: 6 },
          wordWrap: { width: nwidth, useAdvancedWrap: true }
        });
        titleElement.setOrigin(0, 0.5); // Left-anchored
        titleElement.setWordWrapWidth(nwidth);
        titleElement.setAlign('left');
        titleElement.setDepth(11);
        
        // Get text bounds for background sizing
        const textBounds = titleElement.getBounds();
        
        // Create organic background using createNarrativeBackground (same as other text tags)
        const titleBackground = (ws as any).createNarrativeBackground({
          x: textBounds.x - 8,
          y: textBounds.y - 8,
          width: textBounds.width + 16,
          height: textBounds.height + 16,
          fillColor: 0x000000,
          shapeType: 'narrativeBackground'
        }, true);
        titleBackground.setDepth(10);
        
        this.currentDialog.add(titleBackground);
        this.currentDialog.add(titleElement);
        
        // Add subtitle if provided
        if (menuConfig.subtitle) {
          // Position subtitle relative to right side (like title is to left side)
          let subtitleX = halfW - 2 - 80; // Scooch 80px to the left (moved further left)
          const subtitleY = ny + 40 + 20; // Scooch 20px down (moved lower)
          let subtitleWidth = nwidth - 20; // Slightly narrower than title
          
          // Create subtitle as single clickable element
          const subtitleText = menuConfig.subtitle;
          
          // Create subtitle text element
          const subtitleElement = this.scene.add.text(subtitleX, subtitleY, subtitleText, {
            fontSize: '12px',
            color: '#ffffff',
            align: 'right',
            fontFamily: 'Arial',
            fontStyle: 'italic',
            padding: { x: 8, y: 6 },
            wordWrap: { width: subtitleWidth, useAdvancedWrap: true }
          });
          subtitleElement.setOrigin(0.5, 0.5); // Center anchor for pulsing
          subtitleElement.setWordWrapWidth(subtitleWidth);
          subtitleElement.setAlign('right');
          subtitleElement.setDepth(10); // Lower than title (which is depth 11)
          
          // Apply same rotation as other narrative text
          const rotationVariation = (ws as any).generateUniqueRotation ? (ws as any).generateUniqueRotation() : 0;
          subtitleElement.setRotation(rotationVariation);
          
          // Create two-layer background system: stable clickable + organic visual
          const textBounds = subtitleElement.getBounds();
          const bgPadding = 8;
          const bgWidth = textBounds.width + (bgPadding * 2);
          const bgHeight = textBounds.height + (bgPadding * 2);
          
          // Layer 1: Stable clickable rectangle (invisible but interactive)
          const subtitleClickArea = this.scene.add.rectangle(
            subtitleX, subtitleY, bgWidth, bgHeight, 0x000000, 0
          );
          subtitleClickArea.setDepth(12); // Above menu text (depth 11) so it can be clicked without advancing text
          subtitleClickArea.setRotation(rotationVariation);
          subtitleClickArea.setInteractive({ useHandCursor: true });
          
          // Layer 2: Create organic background manually with correct size
          console.log('🎵 Creating subtitle background manually with size:', bgWidth, 'x', bgHeight);
          const subtitleBackground = this.scene.add.graphics();
          
          // Create organic black rectangle with the exact size we need
          subtitleBackground.fillStyle(0x000000, 1.0);
          
          // Create organic corners with slight randomization
          const cornerVariation = 3;
          const topLeft = { 
            x: -bgWidth/2 + Phaser.Math.Between(0, cornerVariation), 
            y: -bgHeight/2 + Phaser.Math.Between(0, cornerVariation) 
          };
          const topRight = { 
            x: bgWidth/2 + Phaser.Math.Between(-cornerVariation, 0), 
            y: -bgHeight/2 + Phaser.Math.Between(0, cornerVariation) 
          };
          const bottomRight = { 
            x: bgWidth/2 + Phaser.Math.Between(-cornerVariation, 0), 
            y: bgHeight/2 + Phaser.Math.Between(-cornerVariation, 0) 
          };
          const bottomLeft = { 
            x: -bgWidth/2 + Phaser.Math.Between(0, cornerVariation), 
            y: bgHeight/2 + Phaser.Math.Between(-cornerVariation, 0) 
          };
          
          // Draw organic rectangle
          subtitleBackground.beginPath();
          subtitleBackground.moveTo(topLeft.x, topLeft.y);
          subtitleBackground.lineTo(topRight.x, topRight.y);
          subtitleBackground.lineTo(bottomRight.x, bottomRight.y);
          subtitleBackground.lineTo(bottomLeft.x, bottomLeft.y);
          subtitleBackground.closePath();
          subtitleBackground.fillPath();
          
          // Position the background
          subtitleBackground.setPosition(subtitleX, subtitleY);
          
          if (subtitleBackground && subtitleBackground.setRotation) {
            subtitleBackground.setRotation(rotationVariation);
          }
          subtitleBackground.setDepth(8); // Behind the click area, lowest of all subtitle elements
          
          // Add stepped pulsing animation using existing step system
          const steps = [1.0, 1.15]; // Flip between regular size and 1.15x size (less extreme)
          let stepDirection = 1; // 1 for forward, -1 for backward
          let currentStep = 0;
          
          // Store animation state on the elements for the existing animation system to use
          (subtitleElement as any).__subtitleAnimation = {
            steps,
            currentStep,
            stepDirection,
            elements: [subtitleElement, subtitleBackground, subtitleClickArea],
            position: { x: subtitleX, y: subtitleY }
          };
          
          // Register with the existing animation system
          if (ws.registerAnimatedShape) {
            const shapeId = `subtitle_pulse_${Date.now()}`;
            ws.registerAnimatedShape(shapeId, subtitleElement as any, 'subtitle_pulse', 0, 0, 0, 0);
            
            // Store for cleanup
            (subtitleElement as any).subtitleAnimationId = shapeId;
          }
          
          // Add click handlers to the stable click area
          subtitleClickArea.on('pointerdown', (pointer: any) => {
            pointer.event.stopPropagation();
            console.log('🎵 Subtitle pointerdown');
          });
          
          subtitleClickArea.on('pointerup', (pointer: any) => {
            pointer.event.stopPropagation();
            console.log('🎵 Subtitle clicked - opening Bandcamp');
            window.open('https://summerbruise.bandcamp.com/album/infinity-guise', '_blank');
          });
          
          // Add hover effects
          subtitleClickArea.on('pointerover', () => {
            console.log('🎵 Subtitle hover');
          });
          
          subtitleClickArea.on('pointerout', () => {
            console.log('🎵 Subtitle hover out');
          });
          
          this.currentDialog.add(subtitleBackground);
          this.currentDialog.add(subtitleClickArea);
          this.currentDialog.add(subtitleElement);
          
          // Store subtitle references for cleanup
          (this.currentDialog as any).subtitleElement = subtitleElement;
          (this.currentDialog as any).subtitleBackground = subtitleBackground;
          (this.currentDialog as any).subtitleClickArea = subtitleClickArea;
        }
      } else {
        const title = this.scene.add.text(-halfW - 3, -halfH - 3, titleText, {
          fontSize: '20px', color: '#000000', fontStyle: 'bold'
        }).setOrigin(0, 0);
    this.currentDialog.add(title);
    
        // Add subtitle fallback if provided
        if (menuConfig.subtitle) {
          const subtitle = this.scene.add.text(halfW - 2, -halfH + 28, menuConfig.subtitle, {
            fontSize: '12px', color: '#000000', fontStyle: 'italic' // 60% of 20px title size, italic
          }).setOrigin(1, 0); // Right anchoring
          this.currentDialog.add(subtitle);
        }
      }
    } catch {
      const title = this.scene.add.text(-halfW - 3, -halfH - 3, titleText, {
        fontSize: '20px', color: '#000000', fontStyle: 'bold'
      }).setOrigin(0, 0);
      this.currentDialog.add(title);
      
      // Add subtitle fallback if provided
      if (menuConfig.subtitle) {
        const subtitle = this.scene.add.text(halfW - 2, -halfH + 28, menuConfig.subtitle, {
          fontSize: '12px', color: '#000000', fontStyle: 'italic' // 60% of 20px title size, italic
        }).setOrigin(1, 0); // Right anchoring
        this.currentDialog.add(subtitle);
      }
    }
    } // Close the if statement for non-empty title
    
    // Content - render with narrative text blocks (black animated backs), supporting multiple lines
    if (menuConfig.content) {
      const ws = (this.windowShapes || (this.scene.scene.get('GameScene') as any)?.windowShapes);
      
      // For START menu, use CYOA-style text advancement
      if (menuType === 'START' && (menuConfig as any).texts && Array.isArray((menuConfig as any).texts)) {
        // Set up CYOA-style text advancement for START menu
        (this.currentDialog as any).storyTexts = (menuConfig as any).texts;
        (this.currentDialog as any).currentTextIndex = 0;
        (this.currentDialog as any).containerWidth = dialogWidth;
        (this.currentDialog as any).containerHeight = dialogHeight;
        
        // Start the text sequence
        this.startTextSequence(this.currentDialog);
      } else {
        // Regular content rendering for other menus
        // Special-case: Pothole menu should render plain black text within the white window (no black rectangle)
        if (menuType === 'POTHOLE') {
          const padding = 6;
          const textWidth = dialogWidth - padding * 2;
          const text = String(menuConfig.content || '').trim();
          const t = this.scene.add.text(0, 0, text, {
            fontSize: '12px',
            color: '#000000',
            wordWrap: { width: textWidth, useAdvancedWrap: true },
            align: 'center'
          }).setOrigin(0.5);
          t.setPosition(0, 0); // Center inside the small pothole window
          this.currentDialog.add(t);
        } else {
          const lines = String(menuConfig.content || '').split('\n').map(s => s.trim()).filter(Boolean);
          const totalTexts = Math.max(1, lines.length);
          const topMargin = 40;
          const bottomMargin = 110; // space for buttons
          const availableHeight = dialogHeight - topMargin - bottomMargin;
          // Push further to extremes per request
          const leftX = -halfW + 10;
          const rightX = halfW - 10;
          const blockWidth = dialogWidth - 20;

          const getYForIndex = (idx: number): number => {
            if (totalTexts === 1) return -halfH + topMargin + availableHeight / 2;
            const spacing = availableHeight / (totalTexts - 1);
            return -halfH + topMargin + idx * spacing;
          };

          for (let i = 0; i < totalTexts; i++) {
            const text = lines[i] || lines[0];
            const y = getYForIndex(i);
            // Two-line special: first left, second right; otherwise left
            const useRight = (totalTexts === 2 && i === 1);
            const x = useRight ? (rightX - blockWidth) : leftX;
            try {
              if (ws && (ws as any).createNarrativeText) {
                (ws as any).createNarrativeText(x, y, text, blockWidth, this.currentDialog);
              } else {
                const t = this.scene.add.text(0, 0, text, {
                  fontSize: '16px', color: '#000000', wordWrap: { width: blockWidth }, align: useRight ? 'right' : 'left'
                }).setOrigin(useRight ? 1 : 0, 0.5);
                t.setPosition(useRight ? rightX : leftX, y);
                this.currentDialog.add(t);
              }
            } catch {}
          }
        }
      }
    }
    
    // Buttons (skip for START menu as it handles its own buttons)
    if (menuType !== 'START') {
    const buttonBaseY = (menuConfig.content ? (halfH - 70) : (halfH - 90));
    const buttonSpacing = 50;
    
    menuConfig.buttons.forEach((button, index) => {
      const btnY = buttonBaseY - (menuConfig.buttons.length - 1 - index) * buttonSpacing;
      const btnContainer = this.scene.add.container(0, btnY);
      btnContainer.setDepth( (this.currentDialog.depth || 0) + 2 ); // Above background within dialog
      btnContainer.setScrollFactor(0);
      this.currentDialog.add(btnContainer);
      try { (this.currentDialog as any).bringToTop?.(btnContainer); } catch {}
      
      const isCloseButton = /Close/i.test(button.text);
      const btnWidth = isCloseButton ? 120 : 160;
      const btnHeight = isCloseButton ? 30 : 34;
      const halfBtnW = btnWidth / 2;
      const halfBtnH = btnHeight / 2;
      
      let btnGraphic: Phaser.GameObjects.Graphics | null = null;
      try {
        const gameScene = this.scene.scene.get('GameScene');
        const windowShapes = (gameScene && (gameScene as any).windowShapes) || this.windowShapes;
        if (windowShapes) this.windowShapes = windowShapes;
        if (windowShapes && windowShapes.createCollageButton) {
          // Create the button graphic at drawing offsets; container centers it
          btnGraphic = windowShapes.createCollageButton(-halfBtnW, -halfBtnH, btnWidth, btnHeight);
          if (btnGraphic) {
            btnContainer.add(btnGraphic);
            // Route clicks through the container to avoid duplicate listeners/hit area confusion
            // Manually register button shape using drawing coordinates
            const btnId = `menu_btn_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
            try { (windowShapes as any).registerAnimatedShape(btnId, btnGraphic, 'button', -halfBtnW, -halfBtnH, btnWidth, btnHeight); } catch {}
            (btnGraphic as any).__shapeId = btnId;
          }
        }
      } catch {}
      
      // If this is the Close button, place it bottom-right, smaller and nearer edges
      try {
        if (isCloseButton) {
          const marginRight = 6;
          const marginBottom = 6;
          btnContainer.setPosition((halfW - marginRight - halfBtnW), (halfH - marginBottom - halfBtnH));
        }
      } catch {}

      // Label placed within the button container
      const isRegionalGas = /regional gas station/i.test(button.text);
      const isLongName = isRegionalGas || button.text.length > 16;
      const displayText = isRegionalGas ? 'regional\ngas station' : button.text;
      const label = this.scene.add.text(0, 0, displayText, {
        fontSize: isRegionalGas ? '11px' : (isLongName ? '12px' : '14px'),
        color: '#000000',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      btnContainer.add(label);
      // If price indicators are present, render filled and empty dollars at right side
      try {
        const priceFilled: string | undefined = (button as any).__priceFilled;
        const priceEmpty: string | undefined = (button as any).__priceEmpty;
        const isClose = /Close/i.test(button.text);
        if (!isClose && (priceFilled || priceEmpty)) {
          // Left-justify the label with padding
          label.setOrigin(0, 0.5);
          label.x = (-halfBtnW + 8);
          label.y = 0;

          const filledText = this.scene.add.text(0, 0, priceFilled || '', {
            fontSize: '14px', color: '#000000', fontStyle: 'bold'
          }).setOrigin(1, 0.5);
          const emptyText = this.scene.add.text(0, 0, priceEmpty || '', {
            fontSize: '14px', color: '#888888', fontStyle: 'bold'
          }).setOrigin(1, 0.5);
          // Position both flush to right padding inside button
          const rightX = (halfBtnW - 8);
          emptyText.x = rightX;
          emptyText.y = 0;
          filledText.x = rightX - emptyText.width;
          filledText.y = 0;
          btnContainer.add(filledText);
          btnContainer.add(emptyText);
        }
      } catch {}
      // If this is the tutorial interrupt menu, store a direct reference for countdown updates
      try {
        if (menuType === 'TUTORIAL_INTERRUPT' && /Continue/i.test(button.text)) {
          (this.currentDialog as any).buttonText = label;
        }
      } catch {}
      
      // Explicit invisible hit target rectangle on top (bypasses container hit quirks)
      const hitTarget = this.scene.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0);
      hitTarget.setOrigin(0.5);
      hitTarget.setScrollFactor(0);
      hitTarget.setDepth((btnContainer.depth || 1) + 1);
      btnContainer.add(hitTarget);
      hitTarget.setInteractive({ useHandCursor: true })
        .on('pointerdown', (p: any) => {
          console.log('🔴 button pointerdown (hitTarget)', { x: p.worldX, y: p.worldY, depth: hitTarget.depth });
        })
        .on('pointerup', (p: any) => {
          console.log('🟢 button pointerup (hitTarget)', { x: p.worldX, y: p.worldY, depth: hitTarget.depth });
          try { (this.scene.input as any).setDefaultCursor('default'); } catch {}
          try { button.onClick(); } catch (e) { console.warn('button onClick error', e); }
        });

      if (!btnGraphic) {
        // Fallback: add a simple rounded rect behind label inside the button container
        const fallback = this.scene.add.graphics();
        fallback.fillStyle(0x34495e, 1);
        fallback.fillRoundedRect(-halfBtnW, -halfBtnH, btnWidth, btnHeight, 6);
        fallback.lineStyle(2, 0xffffff, 1);
        fallback.strokeRoundedRect(-halfBtnW, -halfBtnH, btnWidth, btnHeight, 6);
        btnContainer.addAt(fallback, 0);
        // Ensure label readable on dark fallback
        label.setColor('#ffffff');
      }

      // Visual debug for hit rectangle (pulsing outline) - auto-destroy after 2 seconds
      try {
        const dbg = this.scene.add.graphics();
        dbg.lineStyle(1, 0xff0000, 1);
        dbg.strokeRect(-halfBtnW, -halfBtnH, btnWidth, btnHeight);
        btnContainer.addAt(dbg, 0);
        dbg.setAlpha(0.9);
        dbg.setDepth((btnContainer.depth || 1) + 1);
        this.scene.tweens.add({ targets: dbg, alpha: 0.2, yoyo: true, repeat: 5, duration: 150 });
        this.scene.time.delayedCall(2000, () => { try { dbg.destroy(); } catch {} });
      } catch {}

      // Cursor hint
      hitTarget.on('pointerover', () => { try { (this.scene.input as any).setDefaultCursor('pointer'); } catch {} });
      hitTarget.on('pointerout', () => { try { (this.scene.input as any).setDefaultCursor('default'); } catch {} });
    });
    }
    
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

  private createOverlayBackground(gameWidth: number, gameHeight: number, cutouts: Array<{x: number, y: number, width: number, height: number}>, opacity: number = 0.3) {
    const overlayId = `menu_overlay_${Date.now()}`;
    const overlay = this.overlayManager.createMenuOverlay(overlayId, cutouts, opacity);
    // Store the overlay instance for backward compatibility (though reactive cleanup handles it automatically)
    (overlay.container as any).overlayInstance = overlay;
    return overlay.container;
  }

  private clearCurrentDialog() {
    if (this.currentDialog) {
      // Closing animation for collage window (match story window collapse)
      try {
        const cw = (this.currentDialog as any).collageWindow as Phaser.GameObjects.Graphics | undefined;
        if (cw && cw.scene) {
          cw.once('destroy', () => {
            this.finishDialogCleanup();
          });
          this.scene.tweens.add({
            targets: cw,
            scaleX: 0.01,
            scaleY: 0.01,
            duration: 160,
            ease: 'Back.easeIn',
            onComplete: () => {
              try { cw.destroy(); } catch {}
            }
          });
          return; // Defer cleanup until after animation
        }
      } catch {}
      // No animated window; perform immediate cleanup
      this.finishDialogCleanup();
    }
  }

  private finishDialogCleanup() {
    if (!this.currentDialog) { 
      // Only process queued menus if we're not in the middle of creating a new dialog
      // This prevents race conditions when ignition menu is being created
      this.scene.time.delayedCall(10, () => this.processQueuedMenus()); 
      return; 
    }
    
    // Don't clean up if we're in the middle of creating a new dialog
    // This prevents cleanup from interfering with higher priority menus
    if (this.menuStack.length > 0) {
      const currentMenu = this.menuStack[this.menuStack.length - 1];
      if (currentMenu && currentMenu.type !== this.currentDisplayedMenuType) {
        console.log('MenuManager: Skipping cleanup - new menu being created:', currentMenu.type);
        return;
      }
    }

    // Unregister any animated shapes from WindowShapes to prevent leak
    try {
      const ws = (this.windowShapes || (this.scene.scene.get('GameScene') as any)?.windowShapes);
      if (ws && (ws as any).unregisterAnimatedShape) {
        // Try common animation IDs that may be attached to the dialog
        const commonIds = ['hMenuAnimationId', 'cyoaAnimationId', 'animationId'];
        commonIds.forEach(id => {
          const shapeId = (this.currentDialog as any)[id];
          if (shapeId) {
            (ws as any).unregisterAnimatedShape(shapeId);
          }
        });
        
        // Also check for __shapeId on the collage window
        const collageWindow = (this.currentDialog as any).collageWindow;
        if (collageWindow && (collageWindow as any).__shapeId) {
          (ws as any).unregisterAnimatedShape((collageWindow as any).__shapeId);
        }

        // Clean up background sprite and bitmap mask
        const backgroundSprite = (this.currentDialog as any).backgroundSprite;
        if (backgroundSprite && backgroundSprite.destroy) {
          backgroundSprite.destroy();
        }
        
        const geometryMask = (this.currentDialog as any).geometryMask;
        if (geometryMask && geometryMask.destroy) {
          geometryMask.destroy();
        }
        

        // Recursively unregister any child Graphics with animationId or cyoaAnimationId
        const unregisterFromChildren = (container: any) => {
          try {
            const children: any[] = (container && container.list) ? container.list : [];
            children.forEach((child: any) => {
              if (child && child.type === 'Graphics') {
                // Check for both animationId and cyoaAnimationId
                const animId = (child as any).animationId;
                const cyoaId = (child as any).cyoaAnimationId;
                if (animId) {
                  (ws as any).unregisterAnimatedShape(animId);
                }
                if (cyoaId) {
                  (ws as any).unregisterAnimatedShape(cyoaId);
                }
              }
              if (child && child.list && Array.isArray(child.list)) {
                unregisterFromChildren(child);
              }
            });
          } catch {}
        };
        unregisterFromChildren(this.currentDialog);
      }
    } catch {}

    // Clean up background if it exists
    if ((this.currentDialog as any).background) {
      const background = (this.currentDialog as any).background;
      if ((background as any).overlayInstance) {
        (background as any).overlayInstance.destroy();
      } else {
        background.destroy();
      }
    }
        
        // Clean up subtitle animation if it exists
        const subtitleElement = (this.currentDialog as any).subtitleElement;
        if (subtitleElement && (subtitleElement as any).pulseTween) {
          (subtitleElement as any).pulseTween.stop();
          (subtitleElement as any).pulseTween.destroy();
    }

    // Clean up ad-hoc UI parts if present
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

    // Clean up countdown text
    if ((this.currentDialog as any).countdownText) {
      (this.currentDialog as any).countdownText.destroy();
      (this.currentDialog as any).countdownText = null;
    }

    // Clean up text display callbacks
    this.textDisplayCallbacks.forEach(callback => {
      if (callback && callback.destroy) {
        callback.destroy();
      }
    });
    this.textDisplayCallbacks = [];

    // Destroy the container
    this.currentDialog.destroy();
    this.currentDialog = null;

    // Special menu handling moved to closeDialog() method

    // If we flagged that gameplay should resume after a preemption (e.g., exit cancelled by CYOA), do it now
    if ((this as any)._resumeOnNextClose) {
      (this as any)._resumeOnNextClose = false;
      try {
        const appScene = this.scene.scene.get('AppScene');
        if (appScene) { (appScene as any).isPaused = false; }
        const gameScene = this.scene.scene.get('GameScene');
        if (gameScene) { (gameScene as any).carMechanics?.resumeDriving?.(); gameScene.events.emit('gameResumed'); }
      } catch {}
    }

    // Resume game when certain menus are closed
    if (this.currentDisplayedMenuType === 'DESTINATION' || this.currentDisplayedMenuType === 'DESTINATION_STEP') {
      this.resumeGameAfterDestinationMenu(true);
    } else if (this.currentDisplayedMenuType === 'EXIT') {
      this.resumeGameAfterDestinationMenu(false);
    } else if (this.currentDisplayedMenuType === 'SHOP') {
      if (!this.shouldRestorePreviousMenu()) {
        this.resumeGameAfterDestinationMenu(false);
      }
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
      this.scene.time.delayedCall(100, () => {
        this.restorePreviousMenu();
        this.userDismissedMenuType = null;
      });
    } else {
      this.userDismissedMenuType = null;
    }

    // Notify GameScene that menu state has changed
    const gameSceneForRestore: any = this.scene.scene.get('GameScene');
    if (gameSceneForRestore && gameSceneForRestore.updateAllTutorialOverlays) {
      gameSceneForRestore.updateAllTutorialOverlays();
    }

    // Final: process any queued menus now that dialog is definitely gone
    this.processQueuedMenus();
  }

  private closeDialog() {
    console.log(`🚪 MenuManager: closeDialog() called. Current menu type: ${this.currentDisplayedMenuType}`);
    console.log(`🚪 MenuManager: Menu stack before closeDialog:`, this.menuStack.map(m => `${m.type}:${m.priority}`));
    // Capture which menu we're closing BEFORE clearing visuals (which may null the type)
    const closingType = this.currentDisplayedMenuType;
    
    // If closing a story menu, clear the story sequence flag
    if (closingType === 'STORY' || closingType === 'STORY_OUTCOME' || closingType === 'NOVEL_STORY') {
      this.storySequenceInProgress = false;
      console.log('📖 Story sequence flag cleared due to manual close');
    }

    // Stop universal menu auto-completion
    this.stopMenuAutoComplete();

    // Mark the current menu as user dismissed to prevent its restoration
    this.userDismissedMenuType = this.currentDisplayedMenuType;

    // Special handling for SHOP menus: also close the parent EXIT menu
    if (closingType === 'SHOP') {
      console.log('🛒 Closing SHOP menu - also closing parent EXIT menu');
      // Find and close the parent EXIT menu
      const exitMenuIndex = this.menuStack.findIndex(m => m.type === 'EXIT');
      if (exitMenuIndex !== -1) {
        console.log('🚪 Found parent EXIT menu, closing it as well');
        this.popSpecificMenu('EXIT');
        // Mark EXIT as user dismissed to prevent restoration
        this.userDismissedMenuType = 'EXIT';
      }
    }

    // Simple cleanup - just pop the current menu and resume game
    if (this.currentDisplayedMenuType) {
      const menuType = this.currentDisplayedMenuType;

      if (this.MENU_CATEGORIES.ONE_TIME.includes(menuType)) {
        this.clearMenusFromStack(menuType);
      } else {
        this.popSpecificMenu(menuType);
      }

      // Only resume game for non-story menus
      const storyMenuTypes = ['STORY', 'NOVEL_STORY', 'STORY_OUTCOME', 'PET_STORY'];
      if (!storyMenuTypes.includes(menuType)) {
        this.resumeGame();
      }
    }

    // Handle special menu types BEFORE clearing the dialog
    if (closingType === 'TURN_KEY') {
      this.scene.events.emit('ignitionMenuHidden');
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.emit('ignitionMenuHidden');
      }
    } else if (closingType === 'CYOA') {
      const appScene = this.scene.scene.get('AppScene');
      if (appScene) {
        (appScene as any).isPaused = false;
      }
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.emit('gameResumed');
      }
    } else if (closingType === 'NOVEL_STORY') {
      const appScene = this.scene.scene.get('AppScene');
      if (appScene) {
        (appScene as any).isPaused = false;
      }
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.emit('gameResumed');
      }
    }

    this.clearCurrentDialog();
    
    // Update currentDisplayedMenuType to reflect the new state after popping
    if (this.menuStack.length > 0) {
      const nextMenu = this.menuStack[this.menuStack.length - 1];
      this.currentDisplayedMenuType = nextMenu.type;
      console.log(`🔄 Updated currentDisplayedMenuType to: ${this.currentDisplayedMenuType}`);
    } else {
      this.currentDisplayedMenuType = null;
      console.log(`🔄 Cleared currentDisplayedMenuType (no menus on stack)`);
    }
    
    // If we previously preempted an exit/shop, resume driving to avoid stuck state
    if ((this as any)._resumeOnNextClose) {
      try {
        const gameScene = this.scene.scene.get('GameScene');
        (gameScene as any)?.resumeAfterCollision?.();
      } catch {}
      (this as any)._resumeOnNextClose = false;
    }
    // Menu already popped from stack earlier in this method
    // After any close, if no EXIT/SHOP open, process queued menus
    this.processQueuedMenus();
    console.log(`🚪 MenuManager: Menu stack after closeDialog:`, this.menuStack.map(m => `${m.type}:${m.priority}`));
  }

  public closeCurrentDialog() {
    console.log('MenuManager: closeCurrentDialog called');
    this.userDismissedMenuType = this.currentDisplayedMenuType;

    if (this.currentDisplayedMenuType) {
      this.popSpecificMenu(this.currentDisplayedMenuType);
    }

    this.clearCurrentDialog();
  }

  /**
   * Resume game after destination menu is closed
   */
  private resumeGameAfterDestinationMenu(resetAfterShow: boolean) {
    const appScene = this.scene.scene.get('AppScene');
    if (appScene) {
      (appScene as any).isPaused = false;
    }

    const gameScene = this.scene.scene.get('GameScene');
    if (gameScene) {
      if (resetAfterShow) {
        (gameScene as any).carStarted = false;
        if ((gameScene as any).gameState) {
          (gameScene as any).gameState.updateState({ carStarted: false, speedCrankPercentage: 0 });
        }
        if ((gameScene as any).carMechanics) {
          (gameScene as any).carMechanics.stopDriving();
        }
        if ((gameScene as any).removeKeysFromIgnition) {
          (gameScene as any).removeKeysFromIgnition();
        }
      } else {
        if ((gameScene as any).carStarted && (gameScene as any).carMechanics) {
          (gameScene as any).carMechanics.resumeDriving();
        }
      }
      gameScene.events.emit('gameResumed');
    }
  }

  /**
   * Create a masked window that shows images/camera views through the white background
   * @param x - X position of the window
   * @param y - Y position of the window  
   * @param width - Width of the window
   * @param height - Height of the window
   * @param contentType - Type of content to show ('image', 'camera', 'none')
   * @param contentKey - For images: the image key, for camera: camera reference
   * @returns Object containing window, mask, and content container
   */
  createMaskedMenuWindow(x: number, y: number, width: number, height: number, contentType: 'image' | 'camera' | 'none' = 'none', contentKey?: any): { window: Phaser.GameObjects.Graphics, mask: Phaser.Display.Masks.GeometryMask, contentContainer: Phaser.GameObjects.Container } {
    const ws = (this.windowShapes || (this.scene.scene.get('GameScene') as any)?.windowShapes);
    if (!ws) {
      throw new Error('WindowShapes not available');
    }

    const config = {
      x: x - width/2, // Convert center coordinates to top-left
      y: y - height/2,
      width,
      height,
      fillColor: 0xffffff,
      fillAlpha: 1.0
    };

    const result = ws.createMaskedWindow(config, undefined, true);

    // Add content based on type
    if (contentType === 'image' && contentKey) {
      ws.addImageToMaskedWindow(result.contentContainer, contentKey, 0, 0, 1);
    } else if (contentType === 'camera' && contentKey) {
      ws.addCameraViewToMaskedWindow(result.contentContainer, contentKey, 0, 0, 1);
    }

    return result;
  }

  /**
   * Create a masked window with tiled scrolling background
   * @param x - X position of the window
   * @param y - Y position of the window  
   * @param width - Width of the window
   * @param height - Height of the window
   * @param textureKey - The texture key for the tiled background
   * @param scrollSpeedX - Horizontal scroll speed (pixels per frame)
   * @param scrollSpeedY - Vertical scroll speed (pixels per frame)
   * @returns Object containing window, mask, content container, and tile sprite
   */
  createMaskedMenuWithTiledBackground(x: number, y: number, width: number, height: number, textureKey: string, scrollSpeedX: number = 0, scrollSpeedY: number = 0): { window: Phaser.GameObjects.Graphics, mask: Phaser.Display.Masks.GeometryMask, contentContainer: Phaser.GameObjects.Container, tileSprite: Phaser.GameObjects.TileSprite } {
    const ws = (this.windowShapes || (this.scene.scene.get('GameScene') as any)?.windowShapes);
    if (!ws) {
      throw new Error('WindowShapes not available');
    }

    const config = {
      x: x - width/2, // Convert center coordinates to top-left
      y: y - height/2,
      width,
      height,
      fillColor: 0xffffff,
      fillAlpha: 1.0
    };

    const result = ws.createMaskedWindow(config, undefined, true);

    // Add tiled scrolling background
    const tileSprite = ws.addTiledScrollingBackground(result.contentContainer, textureKey, 0, 0, scrollSpeedX, scrollSpeedY);
    
    // Resize the tile sprite to fill the window
    tileSprite.setDisplaySize(width, height);

    return { ...result, tileSprite };
  }

  /**
   * Example: Create a START menu with camera view showing through the white background
   * This demonstrates how to use the masking system
   */
  showMaskedStartMenu(): void {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Create masked window (same size as regular start menu)
    const maskedResult = this.createMaskedMenuWindow(
      gameWidth/2, gameHeight/2, 
      Math.floor(gameWidth * 0.85), Math.floor(gameHeight * 0.90),
      'camera', // Show camera view through the mask
      this.scene.cameras.main // Pass the main camera
    );
    
    // Add the window to the scene
    this.scene.add.existing(maskedResult.window);
    this.scene.add.existing(maskedResult.contentContainer);
    
    // You can now add text, buttons, etc. on top of the masked window
    // The white background will act as a mask, showing the camera view behind it
  }

  /**
   * Show START menu with x.png tiled scrolling background
   * Scrolls up and to the right as requested
   */
  showStartMenuWithTiledBackground(): void {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Create masked window with tiled scrolling background
    const maskedResult = this.createMaskedMenuWithTiledBackground(
      gameWidth/2, gameHeight/2, 
      Math.floor(gameWidth * 0.85), Math.floor(gameHeight * 0.90),
      'x', // Your x.png asset
      0.5, // Scroll right (positive X)
      -0.3 // Scroll up (negative Y)
    );
    
    // Add the window to the scene
    this.scene.add.existing(maskedResult.window);
    this.scene.add.existing(maskedResult.contentContainer);
    
    // Store reference for cleanup
    (this as any).currentMaskedWindow = maskedResult;
    
    console.log('🎭 Created START menu with x.png tiled scrolling background');
  }

  /**
   * Test method to show tiled scrolling background
   * Call this from console: menuManager.showTiledBackgroundTest()
   */
  showTiledBackgroundTest(): void {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Create a smaller test window
    const maskedResult = this.createMaskedMenuWithTiledBackground(
      gameWidth/2, gameHeight/2, 
      300, 200, // Smaller test window
      'x', // Your x.png asset
      0.5, // Scroll right
      -0.3 // Scroll up
    );
    
    // Add the window to the scene
    this.scene.add.existing(maskedResult.window);
    this.scene.add.existing(maskedResult.contentContainer);
    
    console.log('🎭 Test window created with x.png tiled scrolling background');
    console.log('📝 Call menuManager.hideTiledBackgroundTest() to remove it');
    
    // Store reference for cleanup
    (this as any).testMaskedWindow = maskedResult;
  }

  /**
   * Hide the test tiled background window
   */
  hideTiledBackgroundTest(): void {
    const testWindow = (this as any).testMaskedWindow;
    if (testWindow) {
      testWindow.window.destroy();
      testWindow.contentContainer.destroy();
      (this as any).testMaskedWindow = null;
      console.log('🎭 Test window removed');
    }
  }

  /**
   * Start text sequence for START menu (CYOA-style advancement)
   */
  private startTextSequence(container: any): void {
    if (!container || !container.scene) return;
    
    // Add click-to-advance functionality
    const clickArea = this.scene.add.rectangle(0, 0, container.containerWidth, container.containerHeight, 0x000000, 0);
    clickArea.setInteractive();
    clickArea.on('pointerup', () => {
      this.revealNextText(container);
    });
    container.add(clickArea);
    
    // Store reference to click area for cleanup
    (container as any).clickArea = clickArea;
    
    // Start with first text
    this.revealNextText(container);
  }

  /**
   * Reveal next text in sequence (for START menu)
   */
  private revealNextText(container: any): void {
    if (!container || !container.scene) return;
    
    if (container.currentTextIndex >= container.storyTexts.length) {
      // All text revealed, show buttons
      this.showStartButtons(container);
      return;
    }
    
    const currentText = container.storyTexts[container.currentTextIndex];
    const totalTexts = container.storyTexts.length;
    
    // Simple, consistent even distribution within sensible window bounds
    const topMargin = 130; // Space from title (moved down 20px more)
    const bottomMargin = 120; // Space for button (moved up to avoid iPhone gesture area)
    const startY = -container.containerHeight/2 + topMargin;
    const endY = container.containerHeight/2 - bottomMargin;
    const availableHeight = endY - startY;
    
    let textY;
    if (totalTexts === 1) {
      // Single text: center it
      textY = startY + availableHeight / 2;
    } else {
      // Multiple texts: simple even distribution
      const spacing = availableHeight / (totalTexts - 1);
      textY = startY + (container.currentTextIndex * spacing);
    }
    
    console.log(`📏 Positioning text ${container.currentTextIndex}: totalTexts=${totalTexts}, availableHeight=${availableHeight}, spacing=${totalTexts > 1 ? availableHeight / (totalTexts - 1) : 'N/A'}, textY=${textY}`);
    
    // Alternate between left and right sides, all center-anchored
    const isLeftSide = container.currentTextIndex % 2 === 0;
    
    // Symmetric random edge bands near both sides (anchor-aware)
    const fullWidth = container.containerWidth || (this.currentDialog as any)?.containerWidth || this.scene.cameras.main.width * 0.85;
    const sideMargin = Math.max(2, Math.floor(fullWidth * 0.02)); // ~2% margin from edges (more extreme)
    const bandWidth = Math.max(12, Math.floor(fullWidth * 0.06)); // ~6% wide band at edges
    
    // Set text width to reasonable size
    const textWidth = Math.min(fullWidth * 0.6, 220);
    
    // Random within edge bands with jitter; X represents the visual edge (left or right)
    const r = Math.random();
    const xJitter = (Math.random() - 0.5) * 4; // smaller jitter +-2px to keep near edge
    const overshoot = Math.floor(fullWidth * 0.03); // allow up to 3% off the window edge
    let textX;
    if (isLeftSide) {
      // Left band: from exact left edge inward
      const bandStart = -fullWidth / 2 + sideMargin;
      textX = bandStart + r * (bandWidth - 2);
      // Nudge outward (further left) by up to 3%
      textX -= Math.random() * overshoot;
    } else {
      // Right band: from exact right edge inward; X is the right edge because origin will be 1
      const bandEnd = fullWidth / 2 - sideMargin;
      textX = bandEnd - r * (bandWidth - 2);
      // Nudge outward (further right) by up to 3%
      textX += Math.random() * overshoot;
    }
    textX += xJitter;
    
    // Add offset for TUTORIAL and IGNITION menus to prevent text from hanging off the left
    if (this.currentDisplayedMenuType === 'TUTORIAL_INTERRUPT' || this.currentDisplayedMenuType === 'IGNITION') {
      textX += 50; // Move text 50px to the right
    }
    
    // Add offset for pothole menus to move text to the right
    if (container.isPothole) {
      textX += 50; // Move text 50px to the right
    }
    
    // Ensure text doesn't go offscreen (center-anchored, so check half-width on each side)
    // Since we use origin 0 (left) for left side and 1 (right) for right side in createNarrativeText,
    // X already references the visual edge. No half-width clamping needed, just basic bounds.
    const adjustedTextX = Math.max(-fullWidth/2 - overshoot, Math.min(fullWidth/2 + overshoot, textX));
    // Debug bounds to verify edge bands
    // console.log({ fullWidth, sideMargin, bandWidth, adjustedTextX, isLeftSide });
    
    // Create narrative text
    try {
      const ws = (this.windowShapes || (this.scene.scene.get('GameScene') as any)?.windowShapes);
      if (ws && (ws as any).createNarrativeText) {
        console.log(`📝 Creating text ${container.currentTextIndex}: "${currentText}" at (${adjustedTextX}, ${textY}), width: ${textWidth}, side: ${isLeftSide ? 'left' : 'right'}, ${isLeftSide ? 'left' : 'right'}-justified`);
        const result = (ws as any).createNarrativeText(adjustedTextX, textY, currentText, textWidth, container, isLeftSide ? 'left' : 'right');
        
        // Log text bounds for debugging
        if (result && result.textElement && result.textElement.getBounds) {
          const bounds = result.textElement.getBounds();
          console.log(`📏 Text ${container.currentTextIndex} bounds: top=${bounds.top}, bottom=${bounds.bottom}, height=${bounds.height}`);
        }
      }
    } catch {}
    
    container.currentTextIndex++;
  }

  /**
   * Show buttons after text sequence completes
   */
  private showStartButtons(container: any): void {
    if (!container || !container.scene) return;
    
    // Prevent multiple button creation
    if ((container as any).buttonsCreated) {
      console.log('🔘 Buttons already created, skipping');
      return;
    }
    (container as any).buttonsCreated = true;
    
    // Remove click area using stored reference
    const clickArea = (container as any).clickArea;
    if (clickArea && clickArea.scene) {
      clickArea.destroy();
      (container as any).clickArea = null;
    }
    
    // Create properly styled button using the same system as other menus
    const buttonY = container.containerHeight/2 - 60; // Higher up to avoid iPhone gesture area
    const buttonX = container.containerWidth/2 - 53; // Moved 3px further left (was -50)
    
    // Create button container
    const btnContainer = this.scene.add.container(buttonX, buttonY);
    btnContainer.setDepth((container.depth || 0) + 2);
    btnContainer.setScrollFactor(0);
    container.add(btnContainer);
    
    // Create the collage button graphic
    const btnWidth = 120; // Narrower (was 160)
    const btnHeight = 34;
    const halfBtnW = btnWidth / 2;
    const halfBtnH = btnHeight / 2;
    
    let btnGraphic: Phaser.GameObjects.Graphics | null = null;
    try {
      const gameScene = this.scene.scene.get('GameScene');
      const windowShapes = (gameScene && (gameScene as any).windowShapes) || this.windowShapes;
      if (windowShapes) this.windowShapes = windowShapes;
      if (windowShapes && windowShapes.createCollageButton) {
        // Create the button graphic at drawing offsets; container centers it
        btnGraphic = windowShapes.createCollageButton(-halfBtnW, -halfBtnH, btnWidth, btnHeight);
        if (btnGraphic) {
          btnContainer.add(btnGraphic);
          // Manually register button shape using drawing coordinates
          const btnId = `start_btn_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
          try { (windowShapes as any).registerAnimatedShape(btnId, btnGraphic, 'button', -halfBtnW, -halfBtnH, btnWidth, btnHeight); } catch {}
          (btnGraphic as any).__shapeId = btnId;
        }
      }
    } catch {}
    
    // Create button label
    const label = this.scene.add.text(0, 0, 'start game', {
      fontSize: '18px',
      color: '#000000',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    btnContainer.add(label);
    
    // Create invisible hit target
    const hitTarget = this.scene.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0);
    hitTarget.setOrigin(0.5);
    hitTarget.setScrollFactor(0);
    hitTarget.setDepth((btnContainer.depth || 1) + 1);
    btnContainer.add(hitTarget);
    hitTarget.setInteractive({ useHandCursor: true })
      .on('pointerup', () => {
        console.log('🟢 Start button clicked');
        this.closeDialog();
        const appScene = this.scene.scene.get('AppScene');
        if (appScene) {
          (appScene as any).startGame();
        }
      });
    
    // Fallback styling if no graphic
    if (!btnGraphic) {
      const fallback = this.scene.add.graphics();
      fallback.fillStyle(0x34495e, 1);
      fallback.fillRoundedRect(-halfBtnW, -halfBtnH, btnWidth, btnHeight, 6);
      fallback.lineStyle(2, 0xffffff, 1);
      fallback.strokeRoundedRect(-halfBtnW, -halfBtnH, btnWidth, btnHeight, 6);
      btnContainer.addAt(fallback, 0);
      label.setColor('#ffffff');
    }
    
    // Cursor hints
    hitTarget.on('pointerover', () => { try { (this.scene.input as any).setDefaultCursor('pointer'); } catch {} });
    hitTarget.on('pointerout', () => { try { (this.scene.input as any).setDefaultCursor('default'); } catch {} });
    
    console.log(`🔘 Start button created with collage styling at (${buttonX}, ${buttonY})`);
  }
}
