import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    console.log('MenuScene create() called'); // Debug log
    
    // Set up overlay camera for this scene
    this.setupOverlayCamera();
    
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    console.log('Creating modal at:', centerX, centerY); // Debug log

    // Add a simple text to show the menu is working
    const menuWorkingText = this.add.text(centerX, centerY - 50, 'MENU IS WORKING!', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    menuWorkingText.setOrigin(0.5);
    menuWorkingText.setScrollFactor(0);
    menuWorkingText.setDepth(10000);

    // Try to create RexUI modal, but catch any errors
    try {
      console.log('Attempting to create RexUI modal...'); // Debug log
      console.log('this.rexUI:', this.rexUI); // Debug what rexUI contains
      console.log('this.rexUI.add:', this.rexUI.add); // Debug what add contains
      console.log('Available methods on this.rexUI.add:', Object.keys(this.rexUI.add || {})); // Debug available methods
      
      // Create a simple RexUI label-based dialog
      const dialog = this.rexUI.add.label({
        x: centerX,
        y: centerY,
        width: 300,
        height: 200,
        background: this.add.rectangle(0, 0, 300, 200, 0x2c3e50),
        text: this.add.text(0, 0, 'Start Game\n\nAre you ready to start the game?', {
          fontSize: '20px',
          color: '#ffffff',
          align: 'center'
        }),
        space: {
          left: 20,
          right: 20,
          top: 20,
          bottom: 20
        }
      })
      .setScrollFactor(0)
      .setDepth(10000)
      .layout();

      // Add buttons as separate interactive elements
      const cancelButton = this.add.text(centerX - 80, centerY + 60, 'Cancel', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#e74c3c',
        padding: { x: 10, y: 5 }
      });
      cancelButton.setOrigin(0.5);
      cancelButton.setScrollFactor(0);
      cancelButton.setDepth(10001);
      cancelButton.setInteractive();
      cancelButton.on('pointerdown', () => {
        console.log('Cancel clicked!');
        dialog.destroy();
        cancelButton.destroy();
        startButton.destroy();
        this.scene.sleep('MenuScene');
      });

      const startButton = this.add.text(centerX + 80, centerY + 60, 'Start', {
        fontSize: '20px',
        color: '#ffffff',
        backgroundColor: '#27ae60',
        padding: { x: 10, y: 5 }
      });
      startButton.setOrigin(0.5);
      startButton.setScrollFactor(0);
      startButton.setDepth(10001);
      startButton.setInteractive();
      startButton.on('pointerdown', () => {
        console.log('Start clicked!');
        dialog.destroy();
        cancelButton.destroy();
        startButton.destroy();
        
        // Start the game by calling AppScene's startGame method
        const appScene = this.scene.get('AppScene');
        if (appScene) {
          (appScene as any).startGame();
        }
        
        this.scene.sleep('MenuScene');
      });

    console.log('RexUI dialog created successfully!'); // Debug log
  } catch (error) {
    console.error('Error creating RexUI modal:', error); // Debug log
    
    // Fallback: create simple buttons
    const cancelButton = this.add.text(centerX - 80, centerY + 50, 'Cancel', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#e74c3c',
      padding: { x: 10, y: 5 }
    });
         cancelButton.setOrigin(0.5);
     cancelButton.setScrollFactor(0);
     cancelButton.setDepth(10000);
    cancelButton.setInteractive();
    cancelButton.on('pointerdown', () => {
      console.log('Cancel clicked!');
      this.scene.sleep('MenuScene');
    });

    const startButton = this.add.text(centerX + 80, centerY + 50, 'Start', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 10, y: 5 }
    });
         startButton.setOrigin(0.5);
     startButton.setScrollFactor(0);
     startButton.setDepth(10000);
    startButton.setInteractive();
         startButton.on('pointerdown', () => {
       console.log('Start clicked!');
       
       // Start the game by calling AppScene's startGame method
       const appScene = this.scene.get('AppScene');
       if (appScene) {
         (appScene as any).startGame();
       }
       
       this.scene.sleep('MenuScene');
     });
  }

    // Add menu overlay text
    const menuText = this.add.text(10, 130, 'MENU LAYER', {
      fontSize: '16px',
      color: '#ff00ff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
             menuText.setScrollFactor(0);
    menuText.setDepth(10000);
  }

  private setupOverlayCamera() {
    // Create overlay camera for this scene
    const overlayCamera = this.cameras.add(0, 0, this.cameras.main.width, this.cameras.main.height);
    overlayCamera.setName('menuOverlayCamera');
    overlayCamera.setScroll(0, 0);
    // Don't set background color - keep it transparent
    
    // Set this scene to use the overlay camera
    this.cameras.main = overlayCamera;
    
    console.log('MenuScene: Overlay camera set up');
  }
}
