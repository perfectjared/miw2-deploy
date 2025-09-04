import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
   private currentPosition: string = 'frontseat'; // 'frontseat' or 'backseat'
   private currentView: string = 'main'; // 'main' or 'overlay'
   private gameTime: number = 99; // Starting time
   private gameStarted: boolean = false; // Track if game has started
   private cameraDebugText!: Phaser.GameObjects.Text;
   private gameContentContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    // Add game overlay text (always visible on top)
    const gameText = this.add.text(10, 40, 'GAME LAYER', {
      fontSize: '16px',
      color: '#ffff00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    gameText.setScrollFactor(0);
    gameText.setDepth(10000);

    // Set up shared camera system for game scenes AFTER launching them
    this.setupSharedGameCamera();
    
    this.currentPosition = 'frontseat';
    this.currentView = 'main';

    // Set up keyboard controls for navigation (only when game is started)
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (!this.gameStarted) return; // Disable controls until game starts
      
      switch (event.code) {
        case 'ArrowRight':
          this.switchToBackseat();
          break;
        case 'ArrowLeft':
          this.switchToFrontseat();
          break;
        case 'ArrowDown':
          this.showOverlay();
          break;
        case 'ArrowUp':
          this.hideOverlay();
          break;
      }
    });

    // Set up swipe controls for camera movement
    this.setupSwipeControls();

    // Add instructions text
    const instructions = this.add.text(10, 70, 
      'Arrow Keys: Navigate seats\nDown: Show overlay\nUp: Hide overlay\nM: Menu\nS: Story\nSwipe Left/Right: Switch seats\nSwipe Up/Down: Camera\n\nGAME NOT STARTED - Click Start in Menu!', 
      {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    );
    instructions.setName('instructions');
    instructions.setScrollFactor(0);
    instructions.setDepth(10000);

    // Add camera position debug text
    this.cameraDebugText = this.add.text(10, 200, 'Camera: X=0, Y=0', {
      fontSize: '12px',
      color: '#ffff00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 2 }
    });
    this.cameraDebugText.setScrollFactor(0);
    this.cameraDebugText.setDepth(10000);
  }

     update() {
     // Update camera debug text to show container position
     if (this.cameraDebugText && this.gameContentContainer) {
       this.cameraDebugText.setText(`Container: X=${Math.round(this.gameContentContainer.x)}, Y=${Math.round(this.gameContentContainer.y)}`);
     }
   }

     private setupSharedGameCamera() {
     // Set up world bounds to accommodate both scenes side by side
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     this.physics.world.setBounds(0, 0, gameWidth * 2, gameHeight);
     
     // Set camera bounds to match world bounds
     this.cameras.main.setBounds(0, 0, gameWidth * 2, gameHeight);
     this.cameras.main.setScroll(0, 0);
     
     // Create all content in this scene
     this.createGameContent();
     
     console.log('Game camera set up with content container');
   }

     private createGameContent() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Create a container to hold all game content that we can move as one unit
     this.gameContentContainer = this.add.container(0, 0);
     
     // Create Frontseat content (left side)
     const frontseatCenterX = gameWidth / 2;
     const frontseatCenterY = gameHeight / 2;
     
     // Frontseat button
     const frontseatButton = this.add.graphics();
     frontseatButton.fillStyle(0x4444ff, 0.7);
     frontseatButton.fillRect(frontseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.2);
     frontseatButton.lineStyle(2, 0xffffff, 1);
     frontseatButton.strokeRect(frontseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.2);
     frontseatButton.setInteractive(new Phaser.Geom.Rectangle(frontseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.2), Phaser.Geom.Rectangle.Contains);
     frontseatButton.on('pointerdown', () => {
       if (this.gameStarted) {
         this.switchToBackseat();
       }
     });
     
     // Frontseat title
     const frontseatTitle = this.add.text(frontseatCenterX, frontseatCenterY - 30, 'FRONT SEAT', {
       fontSize: '36px',
       color: '#ffffff',
       fontStyle: 'bold'
     }).setOrigin(0.5);
     
     // Create Backseat content (right side)
     const backseatCenterX = gameWidth + (gameWidth / 2);
     const backseatCenterY = gameHeight / 2;
     
     // Backseat button
     const backseatButton = this.add.graphics();
     backseatButton.fillStyle(0x44ff44, 0.7);
     backseatButton.fillRect(backseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.1);
     backseatButton.lineStyle(2, 0xffffff, 1);
     backseatButton.strokeRect(backseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.1);
     backseatButton.setInteractive(new Phaser.Geom.Rectangle(backseatCenterX - (gameWidth * 0.4), 20, gameWidth * 0.8, gameHeight * 0.1), Phaser.Geom.Rectangle.Contains);
     backseatButton.on('pointerdown', () => {
       if (this.gameStarted) {
         this.switchToFrontseat();
       }
     });
     
     // Backseat title
     const backseatTitle = this.add.text(backseatCenterX, backseatCenterY - 30, 'BACK SEAT', {
       fontSize: '36px',
       color: '#ffffff',
       fontStyle: 'bold'
     }).setOrigin(0.5);
     
     
           // Create overlay content
      // Map overlay (left side, positioned below frontseat)
      const mapOverlay = this.add.text(frontseatCenterX, frontseatCenterY + 320, 'MAP OVERLAY', {
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
             // Map toggle button (small button at top of map overlay)
       const mapToggleButton = this.add.graphics();
       mapToggleButton.fillStyle(0x888888, 0.7);
       mapToggleButton.fillRect(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40);
       mapToggleButton.lineStyle(2, 0xffffff, 1);
       mapToggleButton.strokeRect(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40);
       mapToggleButton.setInteractive(new Phaser.Geom.Rectangle(frontseatCenterX - 60, frontseatCenterY + 200, 120, 40), Phaser.Geom.Rectangle.Contains);
       mapToggleButton.on('pointerdown', () => {
         if (this.gameStarted) {
           if (this.currentView === 'main') {
             this.showOverlay();
           } else {
             this.hideOverlay();
           }
         }
       });
       
       // Map toggle button text
       const mapToggleText = this.add.text(frontseatCenterX, frontseatCenterY + 220, 'LOOK DOWN', {
         fontSize: '14px',
         color: '#ffffff',
         fontStyle: 'bold'
       }).setOrigin(0.5);
       mapToggleText.setName('mapToggleText');
      
      // Inventory overlay (right side, positioned below backseat)
      const inventoryOverlay = this.add.text(backseatCenterX, backseatCenterY + 320, 'INVENTORY OVERLAY', {
        fontSize: '36px',
        color: '#ffffff',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
             // Inventory toggle button (small button at top of inventory overlay)
       const inventoryToggleButton = this.add.graphics();
       inventoryToggleButton.fillStyle(0x888888, 0.7);
       inventoryToggleButton.fillRect(backseatCenterX - 60, backseatCenterY + 200, 120, 40);
       inventoryToggleButton.lineStyle(2, 0xffffff, 1);
       inventoryToggleButton.strokeRect(backseatCenterX - 60, backseatCenterY + 200, 120, 40);
       inventoryToggleButton.setInteractive(new Phaser.Geom.Rectangle(backseatCenterX - 60, backseatCenterY + 200, 120, 40), Phaser.Geom.Rectangle.Contains);
       inventoryToggleButton.on('pointerdown', () => {
         if (this.gameStarted) {
           if (this.currentView === 'main') {
             this.showOverlay();
           } else {
             this.hideOverlay();
           }
         }
       });
       
       // Inventory toggle button text
       const inventoryToggleText = this.add.text(backseatCenterX, backseatCenterY + 220, 'LOOK DOWN', {
         fontSize: '14px',
         color: '#ffffff',
         fontStyle: 'bold'
       }).setOrigin(0.5);
       inventoryToggleText.setName('inventoryToggleText');
      
      // Add all content to the container
      this.gameContentContainer.add([frontseatButton, frontseatTitle, backseatButton, backseatTitle, mapOverlay, mapToggleButton, mapToggleText, inventoryOverlay, inventoryToggleButton, inventoryToggleText]);
   }

  private setupSwipeControls() {
    // Create custom swipe detection using Phaser's input system
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    const minSwipeDistance = 30; // Reduced from 50 to make it less strict
    const maxSwipeTime = 500; // Increased from 300ms to give more time

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.gameStarted) return; // Disable swipe until game starts
      startX = pointer.x;
      startY = pointer.y;
      startTime = Date.now();
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.gameStarted) return; // Disable swipe until game starts
      
      const endX = pointer.x;
      const endY = pointer.y;
      const endTime = Date.now();
      const deltaX = Math.abs(endX - startX);
      const deltaY = Math.abs(endY - startY);
      const deltaTime = endTime - startTime;

      // Check if it's a valid swipe
      if (deltaTime <= maxSwipeTime) {
        // Calculate swipe velocity (pixels per second)
        const velocityX = deltaX / (deltaTime / 1000);
        const velocityY = deltaY / (deltaTime / 1000);
        const averageVelocity = (velocityX + velocityY) / 2;
        
        // Clamp velocity to reasonable bounds (100-2000 px/s)
        const clampedVelocity = Math.max(100, Math.min(2000, averageVelocity));
        
        // Determine if it's a horizontal or vertical swipe
        if (deltaX > deltaY && deltaX >= minSwipeDistance) {
          // Horizontal swipe
          const swipeDirection = endX > startX ? 'right' : 'left';
          
          // Inverted direction logic: left swipe = backseat, right swipe = frontseat
          if (swipeDirection === 'left') {
            this.switchToBackseat();
          } else if (swipeDirection === 'right') {
            this.switchToFrontseat();
          }
        } else if (deltaY > deltaX && deltaY >= minSwipeDistance) {
          // Vertical swipe
          const swipeDirection = endY > startY ? 'down' : 'up';
          
          // direction logic: up swipe = show overlay, down swipe = hide overlay
          if (swipeDirection === 'up') {
            this.showOverlay(clampedVelocity);
          } else if (swipeDirection === 'down') {
            this.hideOverlay(clampedVelocity);
          }
        }
      }
    });
  }

         private switchToBackseat() {
      if (this.currentPosition === 'frontseat') {
        // Move the entire content container to the left to show backseat
        const gameWidth = this.cameras.main.width;
        this.tweens.add({
          targets: this.gameContentContainer,
          x: -gameWidth,
          y: 0, // Reset to main view
          duration: 500,
          ease: 'Power2'
        });
        this.currentPosition = 'backseat';
        this.currentView = 'main';
      }
    }

    private switchToFrontseat() {
      if (this.currentPosition === 'backseat') {
        // Move the entire content container to the right to show frontseat
        this.tweens.add({
          targets: this.gameContentContainer,
          x: 0,
          y: 0, // Reset to main view
          duration: 500,
          ease: 'Power2'
        });
        this.currentPosition = 'frontseat';
        this.currentView = 'main';
      }
    }

       private showOverlay(velocity?: number) {
      if (this.currentView === 'main') {
        // Move the entire content container down to show overlay
        const duration = velocity ? Math.max(200, Math.min(1000, 1000 / (velocity / 500))) : 500;
        this.tweens.add({
          targets: this.gameContentContainer,
          y: -320,
          duration: duration,
          ease: 'Power2'
        });
        this.currentView = 'overlay';
        this.updateToggleButtonText();
        console.log('Showing overlay - content moved down by 320px');
      }
    }

    private hideOverlay(velocity?: number) {
      if (this.currentView === 'overlay') {
        // Move the entire content container up to show main content
        const duration = velocity ? Math.max(200, Math.min(1000, 1000 / (velocity / 500))) : 500;
        this.tweens.add({
          targets: this.gameContentContainer,
          y: 0,
          duration: duration,
          ease: 'Power2'
        });
        this.currentView = 'main';
        this.updateToggleButtonText();
        console.log('Hiding overlay - content moved up to 0');
      }
    }

    private updateToggleButtonText() {
      // Find the toggle button texts and update them based on current view
      const mapToggleText = this.gameContentContainer.getByName('mapToggleText') as Phaser.GameObjects.Text;
      const inventoryToggleText = this.gameContentContainer.getByName('inventoryToggleText') as Phaser.GameObjects.Text;
      
      const buttonText = this.currentView === 'main' ? 'LOOK DOWN' : 'LOOK UP';
      
      if (mapToggleText) {
        mapToggleText.setText(buttonText);
      }
      if (inventoryToggleText) {
        inventoryToggleText.setText(buttonText);
      }
    }

  // Method to start the game (called from AppScene)
  public startGame() {
    this.gameStarted = true;
    console.log('GameScene: Game started! Controls are now enabled.');
    
    // Update instructions text
    const instructions = this.children.getByName('instructions') as Phaser.GameObjects.Text;
    if (instructions) {
      instructions.setText('Arrow Keys: Navigate seats\nDown: Show overlay\nUp: Hide overlay\nM: Menu\nS: Story\nSwipe Left/Right: Switch seats\nSwipe Up/Down: Camera\n\nGAME STARTED!');
    }
  }
}

