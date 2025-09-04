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
    
    // Add app overlay text (always visible on top)
    const appText = this.add.text(10, 10, 'APP LAYER (TOP)', {
      fontSize: '16px',
      color: '#00ff00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    appText.setScrollFactor(0);
    appText.setDepth(10000);

    // Add step counter
    this.stepText = this.add.text(10, 40, 'Step: 0', {
      fontSize: '16px',
      color: '#00ff00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    this.stepText.setScrollFactor(0);
    this.stepText.setDepth(10000);

    // Launch scenes in the correct layer order (bottom to top)
    // 4. Background (bottom layer)
    this.scene.launch('BackgroundScene');
    
    // 3. Game (main game logic)
    this.scene.launch('GameScene');
    
    // 2. Menu (launch by default)
    this.scene.launch('MenuScene');
    this.scene.bringToTop('MenuScene');
    
    // 1. App (ensure AppScene is always on top)
    this.scene.bringToTop('AppScene');
    
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
    testButton.setDepth(10000);
    testButton.setInteractive();
    testButton.on('pointerdown', () => {
      console.log('Pause button clicked');
      this.togglePauseMenu();
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

  private togglePauseMenu() {
    if (!this.gameStarted) return; // Can't pause if game hasn't started
    
    if (this.isPaused) {
      // Resume game
      this.isPaused = false;
      if (this.pauseDialog) {
        this.pauseDialog.background.destroy();
        this.pauseDialog.title.destroy();
        this.pauseDialog.resumeButton.destroy();
        this.pauseDialog = null;
      }
      console.log('Game resumed');
    } else {
      // Pause game
      this.isPaused = true;
      this.createPauseDialog();
      console.log('Game paused');
    }
  }

  private createPauseDialog() {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;
    
    // Create a smaller dialog (less wide)
    const dialogWidth = 300;
    const dialogHeight = 200;
    
    // Background
    const background = this.add.rectangle(centerX, centerY, dialogWidth, dialogHeight, 0x000000, 0.9);
    background.setStrokeStyle(2, 0xffffff);
    background.setScrollFactor(0);
    background.setDepth(10001);
    
    // Title
    const title = this.add.text(centerX, centerY - 60, 'PAUSED', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(10002);
    
    // Resume button
    const resumeButton = this.add.text(centerX, centerY + 20, 'Resume', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#008800',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    resumeButton.setScrollFactor(0);
    resumeButton.setDepth(10002);
    resumeButton.setInteractive();
    resumeButton.on('pointerdown', () => {
      this.togglePauseMenu(); // This will resume the game
    });
    
    // Store reference to dialog elements for cleanup
    this.pauseDialog = { background, title, resumeButton };
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
}
