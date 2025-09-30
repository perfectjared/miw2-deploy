/**
 * APP SCENE - MAIN APPLICATION CONTROLLER
 * 
 * This scene acts as the central coordinator for the entire game application.
 * It manages the global game state, step counter, pause/resume functionality,
 * and coordinates between different scenes.
 * 
 * Key Responsibilities:
 * - Step counter management (tracks game progress)
 * - Game state coordination (started/paused/stopped)
 * - Keyboard input handling for global shortcuts
 * - Scene communication and event coordination
 * - Overlay camera setup for consistent UI rendering
 * 
 * The AppScene runs continuously and provides a stable foundation for
 * other scenes to communicate through events and shared state.
 */

import Phaser from 'phaser';
import { AudioManager } from '../utils/AudioManager';

export class AppScene extends Phaser.Scene {
  // Game state tracking
  private step: number = 0;
  private halfStep: number = 0;
  private uiHalfStep: number = 0; // Always-running UI half-step
  private stepText!: Phaser.GameObjects.Text;
  private gameStarted: boolean = false;
  private isPaused: boolean = false;
  // Removed old timers - now using metronome
  // Auto-pause on focus loss
  private focusOverlay?: Phaser.GameObjects.Container;
  private focusPausedWithoutMenu: boolean = false;
  // Button references
  private pauseButton?: Phaser.GameObjects.Text;
  private saveButton?: Phaser.GameObjects.Text;
  private muteButton?: Phaser.GameObjects.Text;
  // Button background references for visibility control
  private pauseButtonWhite?: Phaser.GameObjects.Rectangle;
  private pauseButtonBG?: Phaser.GameObjects.TileSprite;
  private saveButtonWhite?: Phaser.GameObjects.Rectangle;
  private saveButtonBG?: Phaser.GameObjects.TileSprite;
  // Audio management
  private audioManager: AudioManager;
  private audioInitialized: boolean = false;
  private muteButtonIcon?: Phaser.GameObjects.Image;
  private muteButtonWhite?: Phaser.GameObjects.Graphics | Phaser.GameObjects.Rectangle;
  private muteButtonBG?: Phaser.GameObjects.TileSprite;
  // Pause button icon
  private pauseButtonIcon?: Phaser.GameObjects.Image;
  // Save button icon
  private saveButtonIcon?: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'AppScene' });
    this.audioManager = AudioManager.getInstance();
    
    // Set up audio state change listener
    this.audioManager.onStateChange((state) => {
      this.updateMuteButtonIcon();
    });
  }

  create() {
    
    // Set up overlay camera for this scene
    this.setupOverlayCamera();



    // Launch scenes in the correct layer order (bottom to top)
    // JARED'S NOTE: could this be simplified?
    // 4. Background (bottom layer)
    this.scene.launch('BackgroundScene');
    
    // 3. Driving (driving background with separate camera) - TEMPORARILY DISABLED
    
    // 2. Game (main game logic with physics)
    this.scene.launch('GameScene');
    
    // 1. Menu (top layer)
    this.scene.launch('MenuScene');
    this.scene.bringToTop('MenuScene');
    
    // Ensure proper scene ordering
    this.time.delayedCall(50, () => {
      this.scene.bringToTop('MenuScene');
      this.scene.bringToTop('GameScene');
      this.scene.bringToTop('AppScene');
    });
    
    // Show start menu after a small delay to ensure MenuScene is ready
    this.time.delayedCall(100, () => {
      const menuScene = this.scene.get('MenuScene');
      if (menuScene) {
        menuScene.events.emit('showStartMenu');
        // Keep MenuScene on top for the start menu
        this.scene.bringToTop('MenuScene');
      }
    });
    
    // Bring AppScene to top after a delay to ensure buttons are above driving background
    // BUT keep MenuScene above AppScene when menus are open
    this.time.delayedCall(200, () => {
      // Only bring AppScene to top if no menus are open
      const menuScene = this.scene.get('MenuScene');
      const hasOpenMenu = menuScene && (menuScene as any).menuManager && (menuScene as any).menuManager.currentDialog;
      if (!hasOpenMenu) {
        this.scene.bringToTop('AppScene');
      }
      // Ensure MenuScene is above AppScene for dither overlays
      this.scene.bringToTop('MenuScene');
    });
    
    // Note: Story scene will be launched on demand and brought to top

    // Set up keyboard controls for overlay scenes
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      console.log('AppScene: Key pressed:', event.code); // Debug log
      this.initializeAudioOnUserInteraction(); // Initialize audio on any key press
      switch (event.code) {
        // KeyM removed - was launching MenuScene
        case 'KeyS':
          this.scene.launch('StoryScene');
          this.scene.bringToTop('StoryScene'); // Ensure story is on top
          break;
      }
    });


    // Set up comprehensive user interaction detection for audio initialization
    this.setupGlobalInteractionListeners();

    // Set up periodic audio state monitoring (backup in case callbacks miss something)
    this.time.addEvent({
      delay: 2000, // Check every 2 seconds (less frequent since we have callbacks)
      loop: true,
      callback: () => {
        this.monitorAudioState();
      }
    });

    // Delay button creation until hypercard textures are ready
    this.time.delayedCall(200, () => {
      this.createAppButtons();
    });

    try {
      const gameScene = this.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.on('tutorialOverlayVisible', (visible: boolean) => {
          // Check if tutorial is actually complete by checking game state
          const gameState = (gameScene as any).gameState;
          const tutorialPhase = gameState?.getState?.()?.tutorialPhase;
          const isTutorialComplete = tutorialPhase === 'normal';
          
          if (isTutorialComplete) {
            // Tutorial is complete, show the buttons
            this.showAppButtons();
          } else {
            // Tutorial is active, hide the buttons
            if (this.pauseButtonWhite) this.pauseButtonWhite.setVisible(false);
            if (this.pauseButtonBG) this.pauseButtonBG.setVisible(false);
            if (this.pauseButtonIcon) this.pauseButtonIcon.setVisible(false);
            
            if (this.saveButtonWhite) this.saveButtonWhite.setVisible(false);
            if (this.saveButtonBG) this.saveButtonBG.setVisible(false);
            if (this.saveButtonIcon) this.saveButtonIcon.setVisible(false);
            
            if (this.muteButtonWhite) this.muteButtonWhite.setVisible(false);
            if (this.muteButtonBG) this.muteButtonBG.setVisible(false);
            if (this.muteButtonIcon) this.muteButtonIcon.setVisible(false);
          }
        });
      }
      const menuScene = this.scene.get('MenuScene');
      if (menuScene) {
        // Disable pause/save while any menu is open
        (menuScene as any).events.on('menuOpened', () => {
          // Hide all button elements when menus are open
          if (this.pauseButtonIcon) {
            this.pauseButtonIcon.disableInteractive();
            this.pauseButtonIcon.setVisible(false);
          }
          if (this.pauseButtonWhite) this.pauseButtonWhite.setVisible(false);
          if (this.pauseButtonBG) this.pauseButtonBG.setVisible(false);
          
          if (this.saveButtonIcon) {
            this.saveButtonIcon.disableInteractive();
            this.saveButtonIcon.setVisible(false);
          }
          if (this.saveButtonWhite) this.saveButtonWhite.setVisible(false);
          if (this.saveButtonBG) this.saveButtonBG.setVisible(false);
          
          if (this.muteButtonIcon) {
            this.muteButtonIcon.disableInteractive();
            this.muteButtonIcon.setVisible(false);
          }
          if (this.muteButtonWhite) this.muteButtonWhite.setVisible(false);
          if (this.muteButtonBG) this.muteButtonBG.setVisible(false);
          
          // Ensure MenuScene is on top of AppScene when menus open
          this.scene.bringToTop('MenuScene');
        });
        (menuScene as any).events.on('menuClosed', () => {
          // Show all button elements when menus are closed
          if (this.pauseButtonIcon) {
            this.pauseButtonIcon.setInteractive();
            this.pauseButtonIcon.setVisible(true);
          }
          if (this.pauseButtonWhite) this.pauseButtonWhite.setVisible(true);
          if (this.pauseButtonBG) this.pauseButtonBG.setVisible(true);
          
          if (this.saveButtonIcon) {
            this.saveButtonIcon.setInteractive();
            this.saveButtonIcon.setVisible(true);
          }
          if (this.saveButtonWhite) this.saveButtonWhite.setVisible(true);
          if (this.saveButtonBG) this.saveButtonBG.setVisible(true);
          
          if (this.muteButtonIcon) {
            this.muteButtonIcon.setInteractive();
            this.muteButtonIcon.setVisible(true);
          }
          if (this.muteButtonWhite) this.muteButtonWhite.setVisible(true);
          if (this.muteButtonBG) this.muteButtonBG.setVisible(true);
          
          // Don't bring AppScene to top when menus are closed - let MenuScene stay on top
          // this.scene.bringToTop('AppScene');
        });
      }
      // Periodic safety sync in case a menu opened without emitting signals
      this.time.addEvent({
        delay: 300,
        loop: true,
        callback: () => {
          const ms = this.scene.get('MenuScene');
          const mm = ms ? (ms as any).menuManager : null;
          const open = !!(mm && (mm as any).currentDialog);
          if (open) {
            if (this.pauseButtonIcon && (!this.pauseButtonIcon.input || (this.pauseButtonIcon.input && this.pauseButtonIcon.input.enabled))) {
              if (this.pauseButtonIcon) this.pauseButtonIcon.disableInteractive();
              if (this.saveButtonIcon) this.saveButtonIcon.disableInteractive();
              if (this.muteButton) this.muteButton.disableInteractive();
              // Commented out fade behavior for now
              // if (this.pauseButtonIcon) this.pauseButtonIcon.setAlpha(0.5);
              // if (this.saveButtonIcon) this.saveButtonIcon.setAlpha(0.5);
              // if (this.muteButton) this.muteButton.setAlpha(0.5);
              if (this.pauseButtonIcon) this.pauseButtonIcon.setVisible(false);
              if (this.saveButtonIcon) this.saveButtonIcon.setVisible(false);
              // Keep mute button visible when menus open
              this.scene.bringToTop('MenuScene');
            }
          } else {
            if (this.pauseButtonIcon && (!this.pauseButtonIcon.input || !this.pauseButtonIcon.input.enabled)) {
              if (this.pauseButtonIcon) this.pauseButtonIcon.setInteractive();
              if (this.saveButtonIcon) this.saveButtonIcon.setInteractive();
              if (this.muteButton) this.muteButton.setInteractive();
              if (this.pauseButtonIcon) this.pauseButtonIcon.setAlpha(1);
              if (this.saveButtonIcon) this.saveButtonIcon.setAlpha(1);
              if (this.muteButton) this.muteButton.setAlpha(1);
              if (this.pauseButtonIcon) this.pauseButtonIcon.setVisible(true);
              if (this.saveButtonIcon) this.saveButtonIcon.setVisible(true);
              // Mute button stays visible (no need to restore visibility)
              // Don't bring AppScene to top - let MenuScene stay on top
            }
          }
        }
      });
    } catch {}

    // Set up metronome-based step system
    this.setupMetronomeSteps();

    // Listen for game events from other scenes
    this.events.on('gameResumed', this.onGameResumed, this);

    // Setup auto-pause on focus loss
    try {
      window.addEventListener('blur', () => {
        console.log('🔄 Window blur event detected');
        this.handleWindowFocusChange(false);
        this.checkAudioContextOnFocusLoss();
      });
      window.addEventListener('focus', () => {
        console.log('🔄 Window focus event detected');
        this.handleWindowFocusChange(true);
        this.checkAudioContextOnFocusGain();
      });
      document.addEventListener('visibilitychange', () => {
        const visible = document.visibilityState === 'visible';
        console.log(`🔄 Document visibility change: ${visible ? 'visible' : 'hidden'}`);
        this.handleWindowFocusChange(visible);
        if (visible) {
          this.checkAudioContextOnFocusGain();
        } else {
          this.checkAudioContextOnFocusLoss();
        }
      });
    } catch {}
  }

  private createAppButtons() {
    // Add pause and save buttons - positioned in top left corner, stacked vertically
    const buttonX = 10; // Left margin
    const buttonSpacing = 45; // Increased vertical spacing between buttons
    const buttonY1 = 5; // Top button (pause) - moved higher
    const buttonY2 = buttonY1 + buttonSpacing; // Bottom button (save) - more space from pause
    
    // Add MUTE button in top right corner
    const gameWidth = this.cameras.main.width;
    const muteButtonX = gameWidth - 5 - 32; // 5px right margin + button width (32px) - moved to top right corner
    const muteButtonY = 5; // Same Y as pause button
    
    // Get WindowShapes from GameScene for collage backgrounds
    const gameScene = this.scene.get('GameScene');
    const windowShapes = gameScene ? (gameScene as any).windowShapes : null;
    
    // Create pause button icon (starts with pause symbol since game is playing)
    const pauseIconSize = 24; // Match mute button icon size
    const pauseButtonPadding = 8; // Match mute button padding
    const pauseButtonWidth = pauseIconSize + pauseButtonPadding; // Match mute button sizing
    const pauseButtonHeight = pauseIconSize + pauseButtonPadding; // Match mute button sizing
    
    // Create collage background for pause button sized to icon bounds (match mute button)
    if (windowShapes && windowShapes.createCollageRect) {
      this.pauseButtonWhite = windowShapes.createCollageRect({
        x: buttonX + 1, // Minimal offset
        y: buttonY1 + 1,
        width: pauseButtonWidth,
        height: pauseButtonHeight,
        fillColor: 0xffffff
      }, false, 'button'); // Disable animation
      if (this.pauseButtonWhite) this.pauseButtonWhite.setVisible(false); // Hidden until tutorial completes
      
      // Create dither pattern sized to polygon's bounding box
      const ditherWidth = pauseButtonWidth + 20; // Much larger to ensure full polygon coverage
      const ditherHeight = pauseButtonHeight + 20;
      const ditherX = buttonX - 9; // Larger offset to center on polygon
      const ditherY = buttonY1 - 9;
      
      this.pauseButtonBG = this.add.tileSprite(ditherX, ditherY, ditherWidth, ditherHeight, 'hypercard_ltgray');
      this.pauseButtonBG.setOrigin(0, 0);
      this.pauseButtonBG.setScrollFactor(0);
      this.pauseButtonBG.setDepth(70009); // Behind polygon but above virtual pets
      this.pauseButtonBG.setVisible(false); // Hidden until tutorial completes
      
      // Create geometry mask from the polygon
      if (this.pauseButtonWhite) {
        const geometryMask = this.pauseButtonWhite.createGeometryMask();
        this.pauseButtonBG.setMask(geometryMask);
      }
    } else {
      // Fallback to rectangle if WindowShapes not available
      this.pauseButtonWhite = this.add.rectangle(buttonX + pauseButtonWidth/2, buttonY1 + pauseButtonHeight/2, pauseButtonWidth, pauseButtonHeight, 0xffffff);
      this.pauseButtonWhite.setScrollFactor(0);
      this.pauseButtonWhite.setDepth(-1000);
      this.pauseButtonWhite.setVisible(false); // Hidden until tutorial completes
      
      // Add dither pattern background using available hypercard textures
      this.pauseButtonBG = this.add.tileSprite(buttonX, buttonY1, pauseButtonWidth, pauseButtonHeight, 'hypercard_ltgray');
      this.pauseButtonBG.setOrigin(0, 0);
      this.pauseButtonBG.setScrollFactor(0);
      this.pauseButtonBG.setDepth(-1000);
      this.pauseButtonBG.setVisible(false); // Hidden until tutorial completes
    }
    this.pauseButtonIcon = this.add.image(buttonX + pauseButtonWidth/2, buttonY1 + pauseButtonHeight/2, 'pause-1010-svgrepo-com');
    this.pauseButtonIcon.setScrollFactor(0);
    this.pauseButtonIcon.setDepth(50001); // Above polygon but below story menus
    this.pauseButtonIcon.setDisplaySize(pauseIconSize, pauseIconSize);
    this.pauseButtonIcon.setVisible(false); // Hidden until tutorial completes
    this.pauseButtonIcon.setInteractive();
    
    this.pauseButtonIcon.on('pointerdown', () => {
      this.pauseButtonBG?.setTexture('hypercard_dkgray');
    });
    this.pauseButtonIcon.on('pointerup', () => {
      this.pauseButtonBG?.setTexture('hypercard_ltgray');
      this.togglePauseMenu();
    });
    this.pauseButtonIcon.on('pointerout', () => {
      this.pauseButtonBG?.setTexture('hypercard_ltgray');
    });

    // Create save button icon (same sizing as pause button)
    const saveIconSize = 24; // Match pause button icon size
    const saveButtonPadding = 8; // Match pause button padding
    const saveButtonWidth = saveIconSize + saveButtonPadding; // Match pause button sizing
    const saveButtonHeight = saveIconSize + saveButtonPadding; // Match pause button sizing
    
    // Create collage background for save button sized to icon bounds (match pause button)
    if (windowShapes && windowShapes.createCollageRect) {
      this.saveButtonWhite = windowShapes.createCollageRect({
        x: buttonX + 1, // Minimal offset
        y: buttonY2 + 1,
        width: saveButtonWidth,
        height: saveButtonHeight,
        fillColor: 0xffffff
      }, false, 'button'); // Disable animation
      if (this.saveButtonWhite) this.saveButtonWhite.setVisible(false); // Hidden until tutorial completes
      
      // Create dither pattern sized to polygon's bounding box
      const ditherWidth = saveButtonWidth + 20; // Much larger to ensure full polygon coverage
      const ditherHeight = saveButtonHeight + 20;
      const ditherX = buttonX - 9; // Larger offset to center on polygon
      const ditherY = buttonY2 - 9;
      
      this.saveButtonBG = this.add.tileSprite(ditherX, ditherY, ditherWidth, ditherHeight, 'hypercard_ltgray');
      this.saveButtonBG.setOrigin(0, 0);
      this.saveButtonBG.setScrollFactor(0);
      this.saveButtonBG.setDepth(70009); // Behind polygon but above virtual pets
      this.saveButtonBG.setVisible(false); // Hidden until tutorial completes
      
      // Create geometry mask from the polygon
      if (this.saveButtonWhite) {
        const geometryMask = this.saveButtonWhite.createGeometryMask();
        this.saveButtonBG.setMask(geometryMask);
      }
    } else {
      // Fallback to rectangle if WindowShapes not available
      this.saveButtonWhite = this.add.rectangle(buttonX + saveButtonWidth/2, buttonY2 + saveButtonHeight/2, saveButtonWidth, saveButtonHeight, 0xffffff);
      this.saveButtonWhite.setScrollFactor(0);
      this.saveButtonWhite.setDepth(-1000);
      this.saveButtonWhite.setVisible(false); // Hidden until tutorial completes
      
      // Add dither pattern background using available hypercard textures
      this.saveButtonBG = this.add.tileSprite(buttonX, buttonY2, saveButtonWidth, saveButtonHeight, 'hypercard_ltgray');
      this.saveButtonBG.setOrigin(0, 0);
      this.saveButtonBG.setScrollFactor(0);
      this.saveButtonBG.setDepth(-1000);
      this.saveButtonBG.setVisible(false); // Hidden until tutorial completes
    }
    
    // Create save button icon
    this.saveButtonIcon = this.add.image(buttonX + saveButtonWidth/2, buttonY2 + saveButtonHeight/2, 'save-svgrepo-com');
    this.saveButtonIcon.setScrollFactor(0);
    this.saveButtonIcon.setDepth(50001); // Above polygon but below story menus
    this.saveButtonIcon.setDisplaySize(saveIconSize, saveIconSize);
    this.saveButtonIcon.setVisible(false); // Hidden until tutorial completes
    this.saveButtonIcon.setInteractive();
    
    this.saveButtonIcon.on('pointerdown', () => {
      // Guard: ignore save while any menu is open
      const menuScene = this.scene.get('MenuScene');
      const menuManager = menuScene ? (menuScene as any).menuManager : null;
      const hasOpenMenu = !!(menuManager && (menuManager as any).currentDialog);
      if (hasOpenMenu) return;
      this.saveButtonBG?.setTexture('hypercard_dkgray');
    });
    this.saveButtonIcon.on('pointerup', () => {
      this.saveButtonBG?.setTexture('hypercard_ltgray');
      this.showSaveMenu();
    });
    this.saveButtonIcon.on('pointerout', () => {
      this.saveButtonBG?.setTexture('hypercard_ltgray');
    });

    // Create collage background for mute button sized to icon bounds
    const iconSize = 24; // Size for the sound icon
    const buttonPadding = 8;
    const buttonWidth = iconSize + buttonPadding;
    const buttonHeight = iconSize + buttonPadding;
    
    if (windowShapes && windowShapes.createCollageRect) {
      this.muteButtonWhite = windowShapes.createCollageRect({
        x: muteButtonX + 1, // Minimal offset
        y: muteButtonY + 1,
        width: buttonWidth,
        height: buttonHeight,
        fillColor: 0xffffff
      }, false, 'button'); // Disable animation
      if (this.muteButtonWhite) this.muteButtonWhite.setVisible(false); // Hidden until tutorial completes
      
      // Create dither pattern sized to polygon's bounding box
      const ditherWidth = buttonWidth + 20; // Much larger to ensure full polygon coverage
      const ditherHeight = buttonHeight + 20;
      const ditherX = muteButtonX - 9; // Larger offset to center on polygon
      const ditherY = muteButtonY - 9;
      
      this.muteButtonBG = this.add.tileSprite(ditherX, ditherY, ditherWidth, ditherHeight, 'hypercard_ltgray');
      this.muteButtonBG.setOrigin(0, 0);
      this.muteButtonBG.setScrollFactor(0);
      this.muteButtonBG.setDepth(15000); // Same depth as mute button polygon
      this.muteButtonBG.setVisible(false); // Hidden until tutorial completes
      
      // Create geometry mask from the polygon
      if (this.muteButtonWhite) {
        const geometryMask = this.muteButtonWhite.createGeometryMask();
        this.muteButtonBG.setMask(geometryMask);
      }
    } else {
      // Fallback to rectangle if WindowShapes not available
      this.muteButtonWhite = this.add.rectangle(muteButtonX + buttonWidth/2, muteButtonY + buttonHeight/2, buttonWidth, buttonHeight, 0xffffff);
      this.muteButtonWhite.setScrollFactor(0);
      this.muteButtonWhite.setDepth(-1000);
      this.muteButtonWhite.setVisible(false); // Hidden until tutorial completes
      
      this.muteButtonBG = this.add.tileSprite(muteButtonX, muteButtonY, buttonWidth, buttonHeight, 'hypercard_ltgray');
      this.muteButtonBG.setOrigin(0, 0);
      this.muteButtonBG.setScrollFactor(0);
      this.muteButtonBG.setDepth(-1000);
      this.muteButtonBG.setVisible(false); // Hidden until tutorial completes
    }
    if (this.muteButtonWhite) {
      this.muteButtonWhite.setScrollFactor(0);
      this.muteButtonWhite.setDepth(15000); // Below night overlay (20000) but above UI elements
      this.muteButtonWhite.setVisible(false); // Hidden until tutorial completes
    }
    
    // Create mute button icon (starts with sound-off)
    this.muteButtonIcon = this.add.image(muteButtonX + buttonWidth/2, muteButtonY + buttonHeight/2, 'sound-off');
    this.muteButtonIcon.setScrollFactor(0);
    this.muteButtonIcon.setDepth(15001); // Above polygon but below night overlay (20000)
    this.muteButtonIcon.setDisplaySize(iconSize, iconSize);
    this.muteButtonIcon.setVisible(false); // Hidden until tutorial completes
    this.muteButtonIcon.setInteractive();
    
    this.muteButtonIcon.on('pointerdown', () => {
      this.muteButtonBG?.setTexture('hypercard_dkgray');
    });
    this.muteButtonIcon.on('pointerup', () => {
      this.muteButtonBG?.setTexture('hypercard_ltgray');
      this.handleMuteButtonClick();
    });
    this.muteButtonIcon.on('pointerout', () => {
      this.muteButtonBG?.setTexture('hypercard_ltgray');
    });
  }

  private setupOverlayCamera() {
    // Create overlay camera for this scene
    const overlayCamera = this.cameras.add(0, 0, this.cameras.main.width, this.cameras.main.height);
    overlayCamera.setName('appOverlayCamera');
    overlayCamera.setScroll(0, 0);
    // Don't set background color - keep it transparent
    
    // Set this scene to use the overlay camera
    this.cameras.main = overlayCamera;

  }

  // Metronome-based step system
  private setupMetronomeSteps(): void {
    // Register step callback with audio manager
    this.audioManager.onStep((step: number) => {
      
      if (!this.gameStarted || this.isPaused) {
        return; // Don't process if game hasn't started or is paused
      }
      
      this.step = step;
      
      // Emit step event to GameScene
      const gameScene = this.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.emit('step', this.step);
      }
      // Also emit step to MenuScene for non-blocking overlays (e.g., story window)
      const menuScene = this.scene.get('MenuScene');
      if (menuScene) {
        menuScene.events.emit('step', this.step);
      }
    });

    // Register half-step callback with audio manager
    this.audioManager.onHalfStep((halfStep: number) => {
      this.halfStep = halfStep;
      this.uiHalfStep = halfStep; // UI half-step is same as game half-step
      
      // Emit half-step event to GameScene
      const gameScene = this.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.emit('halfStep', this.halfStep);
      }
    });
  }

  // Removed - now handled by metronome callbacks

  // Removed - now handled by metronome callbacks

  /**
   * Handle scene pause - stop timers to prevent accumulation
   */
  pause() {
    // Metronome handles pausing automatically
  }

  /**
   * Handle scene resume - restart timers properly
   */
  resume() {
    // Metronome handles resuming automatically
  }

  /**
   * Handle game resumed event from other scenes
   */
  private onGameResumed() {
    console.log('AppScene: Received gameResumed event');
    this.isPaused = false;
    // Update pause button icon to show pause symbol (game is now playing)
    this.updatePauseButtonIcon();
    // Metronome handles resuming automatically
  }

  public getStep(): number {
    return this.step;
  }

  public setStep(step: number): void {
    this.step = step;
  }

  private togglePauseMenu() {
    // Allow pause menu even if game hasn't started yet
    
    if (this.isPaused) {
      // Resume game
      this.isPaused = false;
      
      // Update pause button icon to show pause symbol (game is now playing)
      this.updatePauseButtonIcon();
      
      // Emit resume event to GameScene
      const gameScene = this.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.emit('gameResumed');
      }
    } else {
      // Pause game
      // Before pausing, ask MenuManager if pausing is allowed in current context
      const menuScene = this.scene.get('MenuScene');
      const menuManager = menuScene ? (menuScene as any).menuManager : null;
      const canPause = menuManager && typeof menuManager.canPauseNow === 'function' ? menuManager.canPauseNow() : false;
      if (!canPause) {
        console.log('AppScene: Pause ignored due to active pausing menu');
        return;
      }
      this.isPaused = true;
      
      // Update pause button icon to show play symbol (game is now paused)
      this.updatePauseButtonIcon();
      
      // Show pause menu via MenuScene
      if (menuScene) {
        // Add a small delay to ensure MenuScene is fully ready
        this.time.delayedCall(50, () => {
          menuScene.events.emit('showPauseMenu');
          // Bring MenuScene to top to ensure it's visible
          this.scene.bringToTop('MenuScene');
        });
      }
      
      // Emit pause event to GameScene
      const gameScene = this.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.emit('gamePaused');
      }
    }
  }

  // Handle auto-pause/resume on focus changes without spawning menus
  private handleWindowFocusChange(hasFocus: boolean) {
    console.log(`🔄 Window focus change: ${hasFocus ? 'GAINED' : 'LOST'}`);
    const menuScene = this.scene.get('MenuScene');
    const menuManager = menuScene ? (menuScene as any).menuManager : null;
    const menuOpen = !!(menuManager && (menuManager as any).currentDialog);
    const gameScene = this.scene.get('GameScene');
    const windowShapes = gameScene ? (gameScene as any).windowShapes : null;

    if (!hasFocus) {
      // Create dkgray dither overlay if not present
      if (!this.focusOverlay && windowShapes && windowShapes.overlayManager) {
        try {
          console.log('🔄 Creating focus blur overlay');
          const overlay = windowShapes.overlayManager.createDitherOverlay('focus_blur_overlay', 90000, 0.3);
          // Try to set pattern to hypercard_dkgray
          const ts = overlay.container.list?.find((o: any) => o instanceof Phaser.GameObjects.TileSprite) as Phaser.GameObjects.TileSprite | undefined;
          if (ts && this.textures.exists('hypercard_dkgray')) {
            ts.setTexture('hypercard_dkgray');
          }
          this.focusOverlay = overlay.container;
          console.log('🔄 Focus blur overlay created');
        } catch (error) {
          console.error('🔄 Error creating focus blur overlay:', error);
        }
      } else {
        console.log('🔄 Focus blur overlay already exists or windowShapes not available');
      }
      // Pause game clocks without spawning pause menu
      if (!this.isPaused) {
        this.isPaused = true;
        // Metronome handles pausing automatically
      }
      // Notify GameScene
      if (gameScene) {
        gameScene.events.emit('gamePaused');
      }
      // Track whether we should auto-resume on focus
      this.focusPausedWithoutMenu = !menuOpen;
      return;
    }

    // hasFocus === true
    // Remove overlay if present
    try {
      console.log('🔄 Removing focus blur overlay');
      if (this.focusOverlay && this.focusOverlay.scene) {
        console.log('🔄 Destroying focus overlay container');
        this.focusOverlay.destroy();
      }
      this.focusOverlay = undefined;
      
      // Also remove from OverlayManager to ensure proper cleanup
      if (windowShapes && windowShapes.overlayManager) {
        console.log('🔄 Removing focus overlay from OverlayManager');
        windowShapes.overlayManager.removeOverlay('focus_blur_overlay');
      }
      console.log('🔄 Focus blur overlay removed');
    } catch (error) {
      console.error('🔄 Error removing focus blur overlay:', error);
    }

    // If we paused due to focus loss and no menu was open, auto-resume
    if (this.focusPausedWithoutMenu) {
      console.log('🔄 Auto-resuming game after focus regained');
      this.focusPausedWithoutMenu = false;
      this.isPaused = false;
      // Update pause button icon to show pause symbol (game is now playing)
      this.updatePauseButtonIcon();
      // Metronome handles resuming automatically
      if (gameScene) {
        gameScene.events.emit('gameResumed');
        console.log('🔄 Game resumed event emitted');
      }
    } else {
      console.log('🔄 Not auto-resuming - focusPausedWithoutMenu was false');
      // Even if not auto-resuming, ensure the game is not stuck in a paused state
      // if no menu is actually open
      if (this.isPaused && !menuOpen) {
        console.log('🔄 Game was paused but no menu is open - resuming');
        this.isPaused = false;
        // Update pause button icon to show pause symbol (game is now playing)
        this.updatePauseButtonIcon();
        // Metronome handles resuming automatically
        if (gameScene) {
          gameScene.events.emit('gameResumed');
        }
      }
    }
  }


  // Method to start the game (called from MenuScene)
  public startGame() {
    this.gameStarted = true;
    // Metronome handles step timing automatically
    
    // Also start the GameScene
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      (gameScene as any).startGame();
    }
    
  }

  // Method to show save menu (communicates with MenuScene)
  private showSaveMenu() {
    // Allow save menu even if game hasn't started yet
    
    const menuScene = this.scene.get('MenuScene');
    if (menuScene) {
      // Add a small delay to ensure MenuScene is fully ready
      this.time.delayedCall(50, () => {
        menuScene.events.emit('showSaveMenu');
        // Bring MenuScene to top to ensure it's visible
        this.scene.bringToTop('MenuScene');
      });
    }
  }

  // Show pause and save buttons after tutorial completes
  public showAppButtons() {
    if (this.pauseButtonWhite) this.pauseButtonWhite.setVisible(true);
    if (this.pauseButtonBG) this.pauseButtonBG.setVisible(true);
    if (this.pauseButtonIcon) this.pauseButtonIcon.setVisible(true);
    
    if (this.saveButtonWhite) this.saveButtonWhite.setVisible(true);
    if (this.saveButtonBG) this.saveButtonBG.setVisible(true);
    if (this.saveButtonIcon) this.saveButtonIcon.setVisible(true);
    
    // Show mute button after tutorial completes
    if (this.muteButtonWhite) this.muteButtonWhite.setVisible(true);
    if (this.muteButtonBG) this.muteButtonBG.setVisible(true);
    if (this.muteButtonIcon) this.muteButtonIcon.setVisible(true);
  }

  // Method to stop step events (called from GameScene when restarting)
  public stopStepEvents() {
    this.gameStarted = false;
    this.step = 0; // Reset step counter
  }

  /**
   * Initialize audio context on first user interaction
   */
  private async initializeAudioOnUserInteraction(): Promise<void> {
    // Check if already initialized or currently initializing
    if (this.audioManager.isAudioInitialized()) {
      // Sync our local flag with AudioManager state
      this.audioInitialized = true;
      return; // Already initialized
    }

    // Check if we're already in the process of initializing
    if (this.audioInitialized) {
      return;
    }

    // Set flag immediately to prevent multiple attempts
    this.audioInitialized = true;

    try {
      await this.audioManager.initializeAudioContext();
      
      // Update mute button icon to reflect audio state
      this.updateMuteButtonIcon();
      
      // Play a test sound to verify audio is working
      await this.audioManager.playTestSound();
      
    } catch (error) {
      console.error('🎵 AppScene: Failed to initialize audio context:', error);
      this.audioInitialized = false; // Reset flag on failure
    }
  }

  /**
   * Handle mute button click
   */
  private async handleMuteButtonClick(): Promise<void> {
    const audioState = this.audioManager.getAudioState();
    
    if (audioState === 'off') {
      // Audio context is not initialized or lost, try to recover
      const recovered = await this.audioManager.attemptRecovery();
      if (recovered) {
        this.audioInitialized = true;
        this.updateMuteButtonIcon();
      } else {
      }
    } else {
      // Test: Force suspend audio context to test UI behavior
      if (this.audioManager.isAudioInitialized()) {
        const context = this.audioManager.getContext();
        if (context && (context as any).suspend) {
          await (context as any).suspend();
          this.updateMuteButtonIcon();
          return;
        }
      }
      
      // Audio is working, toggle mute state
      const newMuteState = !this.audioManager.isMuted();
      this.audioManager.setMute(newMuteState);
      this.updateMuteButtonIcon();
    }
  }

  /**
   * Update mute button icon based on audio state
   */
  private updateMuteButtonIcon(): void {
    if (!this.muteButtonIcon) return;
    
    const audioState = this.audioManager.getAudioState();
    let iconTexture: string;
    
    switch (audioState) {
      case 'off':
        iconTexture = 'sound-off';
        break;
      case 'muted':
        iconTexture = 'sound-mute';
        break;
      case 'on':
        iconTexture = 'sound-loud';
        break;
      default:
        iconTexture = 'sound-off';
    }
    
    this.muteButtonIcon.setTexture(iconTexture);
  }

  /**
   * Update pause button icon based on game state
   */
  private updatePauseButtonIcon(): void {
    if (!this.pauseButtonIcon) return;
    
    // When game is playing (not paused), show pause symbol
    // When game is paused, show play symbol
    const iconTexture = this.isPaused ? 'play-1001-svgrepo-com' : 'pause-1010-svgrepo-com';
    
    this.pauseButtonIcon.setTexture(iconTexture);
  }

  /**
   * Set up global interaction listeners for audio initialization
   */
  private setupGlobalInteractionListeners(): void {
    // Phaser input events
    this.input.on('pointerdown', () => {
      this.initializeAudioOnUserInteraction();
    });
    
    this.input.on('pointerup', () => {
      this.initializeAudioOnUserInteraction();
    });
    
    this.input.on('pointermove', () => {
      this.initializeAudioOnUserInteraction();
    });
    
    // Keyboard events
    this.input.keyboard?.on('keydown', () => {
      this.initializeAudioOnUserInteraction();
    });
    
    this.input.keyboard?.on('keyup', () => {
      this.initializeAudioOnUserInteraction();
    });

    // Global DOM events for comprehensive coverage
    try {
      // Mouse events
      document.addEventListener('mousedown', () => {
        this.initializeAudioOnUserInteraction();
      }, { once: false, passive: true });
      
      document.addEventListener('mouseup', () => {
        this.initializeAudioOnUserInteraction();
      }, { once: false, passive: true });
      
      document.addEventListener('mousemove', () => {
        this.initializeAudioOnUserInteraction();
      }, { once: false, passive: true });
      
      // Touch events
      document.addEventListener('touchstart', () => {
        this.initializeAudioOnUserInteraction();
      }, { once: false, passive: true });
      
      document.addEventListener('touchend', () => {
        this.initializeAudioOnUserInteraction();
      }, { once: false, passive: true });
      
      document.addEventListener('touchmove', () => {
        this.initializeAudioOnUserInteraction();
      }, { once: false, passive: true });
      
      // Keyboard events
      document.addEventListener('keydown', () => {
        this.initializeAudioOnUserInteraction();
      }, { once: false, passive: true });
      
      document.addEventListener('keyup', () => {
        this.initializeAudioOnUserInteraction();
      }, { once: false, passive: true });
      
      // Gamepad events (for future compatibility)
      document.addEventListener('gamepadconnected', () => {
        this.initializeAudioOnUserInteraction();
      }, { once: false, passive: true });
      
    } catch (error) {
      console.warn('🎵 AppScene: Could not set up all global listeners:', error);
    }
  }

  /**
   * Check audio context state on focus loss
   */
  private checkAudioContextOnFocusLoss(): void {
    if (!this.audioInitialized) {
      return;
    }
    
    // Check if audio context is suspended
    const context = this.audioManager.getContext();
    if (context) {
      const state = (context as any).state;
      if (state === 'suspended') {
        this.updateMuteButtonIcon();
      } else {
      }
    } else {
    }
  }

  /**
   * Check audio context state on focus gain
   */
  private checkAudioContextOnFocusGain(): void {
    if (!this.audioInitialized) {
      return;
    }
    
    // Check if audio context needs to be resumed
    const context = this.audioManager.getContext();
    if (context) {
      const state = (context as any).state;
      if (state === 'suspended') {
        this.audioManager.attemptRecovery().then((recovered) => {
          if (recovered) {
          } else {
          }
        });
      } else {
      }
    } else {
    }
  }

  /**
   * Monitor audio state and update UI accordingly
   */
  private monitorAudioState(): void {
    const audioState = this.audioManager.getAudioState();
    const currentIcon = this.muteButtonIcon?.texture.key;
    
    // Update icon if state has changed (regardless of initialization status)
    if (audioState === 'off' && currentIcon !== 'sound-off') {
      this.updateMuteButtonIcon();
    } else if (audioState === 'muted' && currentIcon !== 'sound-mute') {
      this.updateMuteButtonIcon();
    } else if (audioState === 'on' && currentIcon !== 'sound-loud') {
      this.updateMuteButtonIcon();
    }
  }

  /**
   * Get the audio manager instance
   */
  public getAudioManager(): AudioManager {
    return this.audioManager;
  }

  /**
   * Check if audio is initialized
   */
  public isAudioInitialized(): boolean {
    return this.audioInitialized;
  }
}
