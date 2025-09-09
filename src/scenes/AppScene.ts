import Phaser from 'phaser';

export class AppScene extends Phaser.Scene {
  private step: number = 0;
  private stepText!: Phaser.GameObjects.Text;
  private gameStarted: boolean = false;
  private isPaused: boolean = false;
  private pauseDialog: any = null;

  constructor() {
    super({ key: 'AppScene' });
  }

  create() {
    console.log('AppScene create() called'); // Debug log
    
    // Set up overlay camera for this scene
    this.setupOverlayCamera();


    // Add step counter
    this.stepText = this.add.text(10, 10, '(app) step 0', {
      fontSize: '16px',
      color: '#00ff00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.stepText.setScrollFactor(0);
    this.stepText.setDepth(25000);

    // Launch scenes in the correct layer order (bottom to top)
    // 4. Background (bottom layer)
    this.scene.launch('BackgroundScene');
    
    // 3. Driving (driving background with separate camera) - TEMPORARILY DISABLED
    // this.scene.launch('DrivingScene');
    
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
            console.log('AppScene: Launching MenuScene...'); // Debug log
            this.scene.launch('MenuScene');
            this.scene.bringToTop('MenuScene'); // Ensure menu is on top
          }
          break;
        case 'KeyS':
          console.log('AppScene: Launching StoryScene...'); // Debug log
          this.scene.launch('StoryScene');
          this.scene.bringToTop('StoryScene'); // Ensure story is on top
          break;
      }
    });

    // Note: Pause and save buttons are now created in GameScene for proper layering

    // Add pause button - positioned above driving view
    const pauseButton = this.add.text(10, 100, 'PAUSE', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#0000ff',
      padding: { x: 10, y: 5 }
    });
    pauseButton.setScrollFactor(0);
    pauseButton.setDepth(30000); // High depth but not extreme
    pauseButton.setInteractive({ useHandCursor: true });
    pauseButton.on('pointerdown', () => {
      pauseButton.setStyle({ backgroundColor: '#ff0000' }); // Visual feedback
      this.togglePauseMenu();
    });
    
    pauseButton.on('pointerup', () => {
      pauseButton.setStyle({ backgroundColor: '#0000ff' }); // Reset color
    });

    // Add save menu button next to pause button
    const saveButton = this.add.text(80, 100, 'SAVE', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 10, y: 5 }
    });
    saveButton.setScrollFactor(0);
    saveButton.setDepth(30000); // High depth but not extreme
    saveButton.setInteractive({ useHandCursor: true });
    saveButton.on('pointerdown', () => {
      saveButton.setStyle({ backgroundColor: '#ff0000' }); // Visual feedback
      this.showSaveMenu();
    });
    
    saveButton.on('pointerup', () => {
      saveButton.setStyle({ backgroundColor: '#27ae60' }); // Reset color
    });

    // Start the step timer (every 1000ms = 1 second) - but only when game is started
    this.time.addEvent({
      delay: 1000,
      callback: this.incrementStep,
      callbackScope: this,
      loop: true,
      paused: true // Start paused, will be unpaused when game starts
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
    
    console.log('AppScene: Overlay camera set up');
  }

  private incrementStep() {
    if (!this.gameStarted || this.isPaused) return; // Don't increment if game hasn't started or is paused
    
    this.step++;
    this.stepText.setText(`Step: ${this.step}`);
    
    // Emit step event to GameScene
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.emit('step', this.step);
    }
  }

  public getStep(): number {
    return this.step;
  }

  public setStep(step: number): void {
    this.step = step;
    this.stepText.setText(`Step: ${this.step}`);
    console.log(`Step counter set to: ${this.step}`);
  }

  private togglePauseMenu() {
    console.log('togglePauseMenu called - gameStarted:', this.gameStarted, 'isPaused:', this.isPaused);
    // Allow pause menu even if game hasn't started yet
    
    if (this.isPaused) {
      // Resume game
      this.isPaused = false;
      console.log('Game resumed');
      
      // Emit resume event to GameScene
      const gameScene = this.scene.get('GameScene');
      if (gameScene) {
        gameScene.events.emit('gameResumed');
      }
    } else {
      // Pause game
      this.isPaused = true;
      console.log('Game paused');
      
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
    this.time.addEvent({
      delay: 1000,
      callback: this.incrementStep,
      callbackScope: this,
      loop: true
    });
    console.log('Game started! Step counter is now running.');
    
    // Also start the GameScene
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      (gameScene as any).startGame();
    }
    
    // Don't bring AppScene to top - let MenuScene be visible
    // this.scene.bringToTop('AppScene');
  }

  // Method to show save menu (communicates with MenuScene)
  private showSaveMenu() {
    console.log('showSaveMenu called - gameStarted:', this.gameStarted);
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
    this.stepText.setText('App Layer; Step: 0'); // Reset display
    console.log('Step events stopped and reset');
  }
}
