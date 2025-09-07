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
    this.stepText = this.add.text(10, 10, 'App Layer; Step: 0', {
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
    
    // 3. Game (main game logic)
    this.scene.launch('GameScene');
    
    // 2. Menu (launch by default)
    this.scene.launch('MenuScene');
    this.scene.bringToTop('MenuScene');
    
    // Show start menu after a small delay to ensure MenuScene is ready
    this.time.delayedCall(100, () => {
      const menuScene = this.scene.get('MenuScene');
      if (menuScene) {
        menuScene.events.emit('showStartMenu');
        // Keep MenuScene on top for the start menu
        this.scene.bringToTop('MenuScene');
      }
    });
    
    // Don't bring AppScene to top initially - let MenuScene show first
    // this.scene.bringToTop('AppScene');
    
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

    // Also try a different approach - add a clickable button to test
    const testButton = this.add.text(10, 100, 'PAUSE', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#0000ff',
      padding: { x: 10, y: 5 }
    });
    testButton.setScrollFactor(0);
    testButton.setDepth(25000);
    testButton.setInteractive();
    testButton.on('pointerdown', () => {
      console.log('Pause button clicked');
      this.togglePauseMenu();
    });

    // Add save menu button next to pause button
    const saveButton = this.add.text(80, 100, 'SAVE', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 10, y: 5 }
    });
    saveButton.setScrollFactor(0);
    saveButton.setDepth(25000);
    saveButton.setInteractive();
    saveButton.on('pointerdown', () => {
      console.log('Save button clicked');
      this.showSaveMenu();
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
    
    // Emit step event to GameScene to update any dependent systems
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.emit('step', this.step);
    }
  }

  private togglePauseMenu() {
    if (!this.gameStarted) return; // Can't pause if game hasn't started
    
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
        menuScene.events.emit('showPauseMenu');
        this.scene.bringToTop('MenuScene');
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
  }

  // Method to show save menu (communicates with MenuScene)
  private showSaveMenu() {
    if (!this.gameStarted) return; // Can't save if game hasn't started
    
    const menuScene = this.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showSaveMenu');
      this.scene.bringToTop('MenuScene');
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
