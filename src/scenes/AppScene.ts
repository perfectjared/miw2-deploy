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

export class AppScene extends Phaser.Scene {
  // Game state tracking
  private step: number = 0;
  private stepText!: Phaser.GameObjects.Text;
  private gameStarted: boolean = false;
  private isPaused: boolean = false;
  private stepTimer!: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'AppScene' });
  }

  create() {
    
    // Set up overlay camera for this scene
    this.setupOverlayCamera();


    // Add step counter (commented out for now)
    // this.stepText = this.add.text(10, 10, '(app) step 0', {
    //   fontSize: '16px',
    //   color: '#00ff00',
    //   fontStyle: 'bold',
    //   backgroundColor: '#000000',
    //   padding: { x: 8, y: 4 }
    // });
    // this.stepText.setScrollFactor(0);
    // this.stepText.setDepth(25000);

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
    this.time.delayedCall(200, () => {
      this.scene.bringToTop('AppScene');
    });
    
    // Note: Story scene will be launched on demand and brought to top

    // Set up keyboard controls for overlay scenes
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      console.log('AppScene: Key pressed:', event.code); // Debug log
      switch (event.code) {
        case 'KeyM':
          if (!this.gameStarted) {
            this.scene.launch('MenuScene');
            this.scene.bringToTop('MenuScene'); // Ensure menu is on top
          }
          break;
        case 'KeyS':
          this.scene.launch('StoryScene');
          this.scene.bringToTop('StoryScene'); // Ensure story is on top
          break;
      }
    });


    // Add pause button - positioned above driving view
    // JARED'S NOTE: make these two buttons share the same style
    const pauseButton = this.add.text(10, 100, 'PAUSE', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#0000ff',
      padding: { x: 10, y: 5 }
    });
    pauseButton.setScrollFactor(0);
    pauseButton.setDepth(5000);
    pauseButton.setInteractive({ useHandCursor: true });
    pauseButton.on('pointerdown', () => {
      pauseButton.setStyle({ backgroundColor: '#ff0000' });
      this.togglePauseMenu();
    });
    pauseButton.on('pointerup', () => {
      pauseButton.setStyle({ backgroundColor: '#0000ff' });
    });

    const saveButton = this.add.text(80, 100, 'SAVE', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 10, y: 5 }
    });
    saveButton.setScrollFactor(0);
    saveButton.setDepth(5000);
    saveButton.setInteractive({ useHandCursor: true });
    saveButton.on('pointerdown', () => {
      saveButton.setStyle({ backgroundColor: '#ff0000' });
      this.showSaveMenu();
    });
    saveButton.on('pointerup', () => {
      saveButton.setStyle({ backgroundColor: '#27ae60' });
    });

    try {
      const gameScene = this.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.on('tutorialOverlayVisible', (visible: boolean) => {
          pauseButton.setVisible(!visible);
          saveButton.setVisible(!visible);
        });
      }
    } catch {}

    // Start the step timer (every 1000ms = 1 second) - but only when game is started
    this.stepTimer = this.time.addEvent({
      delay: 1000,
      callback: this.incrementStep,
      callbackScope: this,
      loop: true,
      paused: true // Start paused, will be unpaused when game starts
    });

    // Listen for game events from other scenes
    this.events.on('gameResumed', this.onGameResumed, this);
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

  private incrementStep() {
    if (!this.gameStarted || this.isPaused) return; // Don't increment if game hasn't started or is paused
    
    this.step++;
    // this.stepText.setText(`Step: ${this.step}`);
    
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
  }

  /**
   * Handle scene pause - stop timers to prevent accumulation
   */
  pause() {
    //console.log('AppScene: Scene paused by Phaser');
    // Pause the step timer to prevent accumulation
    if (this.stepTimer) {
      this.stepTimer.paused = true;
    }
  }

  /**
   * Handle scene resume - restart timers properly
   */
  resume() {
    //console.log('AppScene: Scene resumed by Phaser');
    // Resume the step timer if game is started and not manually paused
    if (this.gameStarted && !this.isPaused && this.stepTimer) {
      this.stepTimer.paused = false;
    }
  }

  /**
   * Handle game resumed event from other scenes
   */
  private onGameResumed() {
    console.log('AppScene: Received gameResumed event - resuming step timer');
    this.isPaused = false;
    if (this.stepTimer) {
      this.stepTimer.paused = false;
      console.log('AppScene: Step timer unpaused');
    }
  }

  public getStep(): number {
    return this.step;
  }

  public setStep(step: number): void {
    this.step = step;
    // this.stepText.setText(`Step: ${this.step}`);
  }

  private togglePauseMenu() {
    //console.log('togglePauseMenu called - gameStarted:', this.gameStarted, 'isPaused:', this.isPaused);
    // Allow pause menu even if game hasn't started yet
    
    if (this.isPaused) {
      // Resume game
      this.isPaused = false;
      //console.log('Game resumed');
      
      // Emit resume event to GameScene
      const gameScene = this.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.emit('gameResumed');
      }
    } else {
      // Pause game
      this.isPaused = true;
      //console.log('Game paused');
      
      // Show pause menu via MenuScene
    const menuScene = this.scene.get('MenuScene');
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


  // Method to start the game (called from MenuScene)
  public startGame() {
    this.gameStarted = true;
    // Resume the step timer
    if (this.stepTimer) {
      this.stepTimer.paused = false;
    }
    
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

  // Method to stop step events (called from GameScene when restarting)
  public stopStepEvents() {
    this.gameStarted = false;
    this.step = 0; // Reset step counter
    // this.stepText.setText('App Layer; Step: 0'); // Reset display
  }
}
