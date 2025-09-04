import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
   private currentPosition: string = 'frontseat'; // 'frontseat' or 'backseat'
   private currentView: string = 'main'; // 'main' or 'overlay'
   private gameTime: number = 99; // Starting time
   private gameStarted: boolean = false; // Track if game has started
   private cameraDebugText!: Phaser.GameObjects.Text;
   private gameContentContainer!: Phaser.GameObjects.Container;
   private countdownText!: Phaser.GameObjects.Text;
   private stopsText!: Phaser.GameObjects.Text;
   private progressText!: Phaser.GameObjects.Text;
   private positionText!: Phaser.GameObjects.Text;
   private stops: number = 0;
   private progress: number = 0;
   private position: number = 50; // Position from 0-100%, starts at center (50%)
   private knobValue: number = 0; // Reactive knob value (-100 to 100), starts at neutral (0)
   private frontseatPhysicsContainer!: Phaser.GameObjects.Container;
   private backseatPhysicsContainer!: Phaser.GameObjects.Container;
   private frontseatDragDial!: any; // RexUI drag dial
   private drivingMode: boolean = false; // Track if driving mode is active
   private shouldAutoRestartDriving: boolean = false; // Track if driving should restart on resume
   private isKnobActive: boolean = false; // Track if knob is being interacted with
   private knobReturnTimer!: Phaser.Time.TimerEvent | null; // Timer for gradual return to center
   private currentSteeringValue: number = 0; // Current steering value for driving mode
   private drivingCar!: Phaser.GameObjects.Rectangle;
   private drivingRoad!: Phaser.GameObjects.Rectangle;
   private drivingRoadLines: Phaser.GameObjects.Rectangle[] = [];
   private carSpeed: number = 0;
   private carX: number = 0;
   private drivingBackground!: Phaser.GameObjects.Container;
   private forwardMovementTimer!: Phaser.Time.TimerEvent | null;
   private neutralReturnTimer!: Phaser.Time.TimerEvent | null;

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
    
    // Set up physics worlds
    this.setupPhysicsWorlds();
    
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

    // Listen for step events from AppScene
    this.events.on('step', this.onStepEvent, this);
    
    // Listen for pause/resume events from AppScene
    this.events.on('gamePaused', this.onGamePaused, this);
    this.events.on('gameResumed', this.onGameResumed, this);

    // Set up swipe controls for camera movement
    this.setupSwipeControls();
  }

     update() {
     // Update camera debug text to show container position
     if (this.cameraDebugText && this.gameContentContainer) {
       this.cameraDebugText.setText(`Container: X=${Math.round(this.gameContentContainer.x)}, Y=${Math.round(this.gameContentContainer.y)}`);
     }
     
     // Frame-by-frame updates
     this.updatePosition();
   }

     private setupSharedGameCamera() {
     // Set up world bounds to accommodate both scenes side by side
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
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
     frontseatButton.on('pointerup', () => {
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
      
           // Create countdown timer text
     this.createCountdownTimer();
     
     // Create stops and progress text
     this.createStopsAndProgressText();
     
     // Create drag dial in front seat area
     this.createFrontseatDragDial();
     
     // Create driving game button
     this.createDrivingGameButton();
     
     // Create driving background (always visible behind game content)
     this.createDrivingBackground();
   }

   private createCountdownTimer() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Position countdown text at center, 15% of screen height below frontseat button
     const countdownX = gameWidth / 2;
     const countdownY = (gameHeight * 0.2) + (gameHeight * 0.08); // 20% (button) + 15% below
     
     this.countdownText = this.add.text(countdownX, countdownY, '99', {
       fontSize: '36px',
       color: '#ffffff',
       fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 10, y: 5 }
     }).setOrigin(0.5);
     
     // Add countdown text to the container so it moves with the content
     this.gameContentContainer.add(this.countdownText);
     this.countdownText.setDepth(1000); // Ensure it's on top
   }

   private createFrontseatDragDial() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Position the drag dial in the front seat area
     const dialX = gameWidth / 2;
     const dialY = gameHeight * 0.6; // Position it below the countdown timer
     
     // Create a simple custom knob using graphics
     const knobRadius = 60;
     const knob = this.add.graphics();
     
     // Draw the knob
     knob.fillStyle(0x666666);
     knob.fillCircle(0, 0, knobRadius);
     knob.lineStyle(3, 0xffffff, 1);
     knob.strokeCircle(0, 0, knobRadius);
     
     // Add a pointer to show the value
     knob.fillStyle(0x00ff00);
     knob.fillRect(-3, -knobRadius + 10, 6, 20);
     
     knob.setPosition(dialX, dialY);
     knob.setInteractive(new Phaser.Geom.Circle(0, 0, knobRadius), Phaser.Geom.Circle.Contains);
     
     // Store reference to the knob
     this.frontseatDragDial = knob;
     
     // Add drag functionality
     knob.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
       this.isKnobActive = true;
       this.stopKnobReturnTimer();
       console.log('Knob interaction started - swipe disabled');
     });
     
     knob.on('pointerup', () => {
       this.isKnobActive = false;
       this.startKnobReturnTimer();
       console.log('Knob interaction ended - swipe enabled');
     });
     
     knob.on('pointermove', (pointer: Phaser.Input.Pointer) => {
       if (!this.isKnobActive) return;
       
       // Calculate angle from center to pointer
       const dx = pointer.x - dialX;
       const dy = pointer.y - dialY;
       const angle = Math.atan2(dy, dx);
       
       // Convert angle to knob value (-100 to 100)
       // Right = 0°, Up = 90°, Left = 180°, Down = 270°
       let knobValue = (angle * 180 / Math.PI) + 90; // Adjust so right is 0
       if (knobValue > 180) knobValue -= 360; // Wrap around
       
       // Map to -100 to 100 range
       this.knobValue = (knobValue / 180) * 100;
       this.knobValue = Phaser.Math.Clamp(this.knobValue, -100, 100);
       
       // Update knob visual
       this.updateKnobVisual();
     });
     
     // Add the knob to the game content container so it moves with the content
     this.gameContentContainer.add(knob);
     knob.setDepth(1000); // Ensure it's on top
     
     // Don't disable initially - we'll control it through event handlers
     
     console.log('Front seat steering wheel created at position:', dialX, dialY);
   }

   private createStopsAndProgressText() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Position stops text below countdown timer
     const stopsX = gameWidth / 2;
     const stopsY = (gameHeight * 0.2) + (gameHeight * 0.16); // Below countdown timer
     
     this.stopsText = this.add.text(stopsX, stopsY, 'Stops: 0', {
       fontSize: '24px',
       color: '#ffffff',
       fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 8, y: 4 }
     }).setOrigin(0.5);
     
     // Position progress text below stops
     const progressX = gameWidth / 2;
     const progressY = (gameHeight * 0.2) + (gameHeight * 0.24); // Below stops
     
     this.progressText = this.add.text(progressX, progressY, 'Progress: 0%', {
       fontSize: '24px',
       color: '#ffffff',
       fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 8, y: 4 }
     }).setOrigin(0.5);
     
     // Position text below progress
     const positionX = gameWidth / 2;
     const positionY = (gameHeight * 0.2) + (gameHeight * 0.32); // Below progress
     
     this.positionText = this.add.text(positionX, positionY, 'Position: 50%', {
       fontSize: '24px',
       color: '#ffffff',
       fontStyle: 'bold',
       backgroundColor: '#000000',
       padding: { x: 8, y: 4 }
     }).setOrigin(0.5);
     
     // Add all texts to the container so they move with the content
     this.gameContentContainer.add([this.stopsText, this.progressText, this.positionText]);
     
     // Set depth to ensure they're on top
     this.stopsText.setDepth(1000);
     this.progressText.setDepth(1000);
     this.positionText.setDepth(1000);
   }

   private createDrivingGameButton() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Position the driving game button in the front seat area
     const buttonX = gameWidth / 2;
     const buttonY = gameHeight * 0.75; // Position it below the steering wheel
     
     // Create the driving game button
     const drivingButton = this.add.graphics();
     drivingButton.fillStyle(0xff6600, 0.8);
     drivingButton.fillRect(buttonX - 80, buttonY - 25, 160, 50);
     drivingButton.lineStyle(3, 0xffffff, 1);
     drivingButton.strokeRect(buttonX - 80, buttonY - 25, 160, 50);
     drivingButton.setInteractive(new Phaser.Geom.Rectangle(buttonX - 80, buttonY - 25, 160, 50), Phaser.Geom.Rectangle.Contains);
     
     // Add button text
     const buttonText = this.add.text(buttonX, buttonY, 'START DRIVING', {
       fontSize: '18px',
       color: '#ffffff',
       fontStyle: 'bold'
     }).setOrigin(0.5);
     buttonText.setName('drivingButtonText');
     
     // Add click handler
     drivingButton.on('pointerdown', () => {
       console.log('Toggling driving mode...');
       this.toggleDrivingMode();
     });
     
     // Add both elements to the game content container
     this.gameContentContainer.add([drivingButton, buttonText]);
     
     // Set depth to ensure they're on top
     drivingButton.setDepth(1000);
     buttonText.setDepth(1000);
     
     console.log('Driving game button created at position:', buttonX, buttonY);
   }

   private handleSteeringInput(steeringValue: number) {
     // Convert steering wheel value (-100 to 100) to steering direction
     // Negative values = turn left, positive values = turn right
     const normalizedValue = steeringValue / 100; // Convert to -1 to 1 range
     
     console.log('Steering input:', normalizedValue);
     
     // If in driving mode, handle driving steering
     if (this.drivingMode) {
       this.handleDrivingSteeringInput(steeringValue);
       return;
     }
     
     // Here you can add steering logic for your game
     // For example:
     // - Move the car left/right based on steering value
     // - Adjust camera angle
     // - Update physics simulation
     
     // For now, we'll just log the steering input
     if (normalizedValue < -0.1) {
       console.log('Steering LEFT:', Math.abs(normalizedValue));
     } else if (normalizedValue > 0.1) {
       console.log('Steering RIGHT:', normalizedValue);
     } else {
       console.log('Steering CENTER');
     }
   }

   private setupPhysicsWorlds() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Ensure Matter.js is properly initialized
     if (!this.matter || !this.matter.world) {
       console.error('Matter.js physics system not initialized');
       return;
     }
     
     // Create frontseat physics container (left side)
     this.frontseatPhysicsContainer = this.add.container(0, 0);
     
     // Create backseat physics container (right side)
     this.backseatPhysicsContainer = this.add.container(gameWidth, 0);
     
     // Set up the main Matter.js world bounds to accommodate both containers
     this.matter.world.setBounds(0, 0, gameWidth * 2, gameHeight);
     
     // Add a test physics body to demonstrate the physics worlds
     this.addTestPhysicsBodies();
     
     console.log('Physics containers created - Frontseat:', this.frontseatPhysicsContainer, 'Backseat:', this.backseatPhysicsContainer);
   }

   private addTestPhysicsBodies() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Ensure Matter.js is properly initialized
     if (!this.matter || !this.matter.add) {
       console.error('Matter.js physics system not initialized for adding bodies');
       return;
     }
     
     // Add a test circle to frontseat physics world
     const frontseatCircle = this.matter.add.circle(gameWidth / 4, gameHeight / 2, 30, {
       restitution: 0.8,
       friction: 0.1
     });
     
     // Add a test rectangle to backseat physics world
     const backseatRect = this.matter.add.rectangle(gameWidth + (gameWidth / 4), gameHeight / 2, 60, 60, {
       restitution: 0.6,
       friction: 0.2
     });
     
     console.log('Test physics bodies added - Frontseat circle:', frontseatCircle, 'Backseat rectangle:', backseatRect);
   }

  private setupSwipeControls() {
    // Create custom swipe detection using Phaser's input system
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    const minSwipeDistance = 30; // Reduced from 50 to make it less strict
    const maxSwipeTime = 500; // Increased from 300ms to give more time

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.gameStarted || this.isKnobActive) return; // Disable swipe until game starts or when knob is active
      startX = pointer.x;
      startY = pointer.y;
      startTime = Date.now();
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.gameStarted || this.isKnobActive) return; // Disable swipe until game starts or when knob is active
      
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
        
        // Also move the driving background with the same animation
        if (this.drivingBackground) {
          this.tweens.add({
            targets: this.drivingBackground,
            x: -gameWidth,
            y: 0, // Reset to main view
            duration: 500,
            ease: 'Power2'
          });
        }
        
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
       
       // Also move the driving background with the same animation
       if (this.drivingBackground) {
         this.tweens.add({
           targets: this.drivingBackground,
           x: 0,
           y: 0, // Reset to main view
           duration: 500,
           ease: 'Power2'
         });
       }
       
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
       
       // Also move the driving background with the same animation
       if (this.drivingBackground) {
         this.tweens.add({
           targets: this.drivingBackground,
           y: -320,
           duration: duration,
           ease: 'Power2'
         });
       }
       
       // Keep physics containers in place - they don't move with the overlay
       this.keepPhysicsContainersInPlace();
       
       this.currentView = 'overlay';
       this.updateToggleButtonText();
       console.log('Showing overlay - content and driving background moved down by 320px');
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
       
       // Also move the driving background back with the same animation
       if (this.drivingBackground) {
         this.tweens.add({
           targets: this.drivingBackground,
           y: 0,
           duration: duration,
           ease: 'Power2'
         });
       }
       
       // Keep physics containers in place - they don't move with the overlay
       this.keepPhysicsContainersInPlace();
       
       this.currentView = 'main';
       this.updateToggleButtonText();
       console.log('Hiding overlay - content and driving background moved up to 0');
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

      private updatePosition() {
     // Only update position if driving mode is active
     if (!this.drivingMode) return;
     
     // Update position based on reactive knobValue (-100 to 100)
     const changeRate = this.knobValue / 100; // -1 to 1
     
     // Apply change rate to position (frame by frame) - increased speed
     const speed = 2.0; // Increased speed multiplier
     this.position += changeRate * speed;
     
     // Clamp position to 0-100%
     this.position = Phaser.Math.Clamp(this.position, 0, 100);
     
     // Update position text
     if (this.positionText) {
       this.positionText.setText(`Position: ${Math.round(this.position)}%`);
     }
     
     // Update road position for OutRun-style effect
     this.updateRoadPosition();
   }

   private startKnobReturnTimer() {
     this.stopKnobReturnTimer(); // Stop any existing timer
     this.knobReturnTimer = this.time.addEvent({
       delay: 16, // Update every 16ms (60fps) for smooth return
       callback: this.updateKnobReturn,
       callbackScope: this,
       loop: true
     });
   }

   private stopKnobReturnTimer() {
     if (this.knobReturnTimer) {
       this.knobReturnTimer.remove();
       this.knobReturnTimer = null;
     }
   }

   private updateKnobVisual() {
     if (!this.frontseatDragDial) return;
     
     // Clear the knob graphics
     this.frontseatDragDial.clear();
     
     const knobRadius = 60;
     
     // Draw the knob base
     this.frontseatDragDial.fillStyle(0x666666);
     this.frontseatDragDial.fillCircle(0, 0, knobRadius);
     this.frontseatDragDial.lineStyle(3, 0xffffff, 1);
     this.frontseatDragDial.strokeCircle(0, 0, knobRadius);
     
     // Draw the pointer rotated based on knobValue
     const angle = (this.knobValue / 100) * Math.PI; // Convert to radians
     const pointerLength = 20;
     const pointerX = Math.cos(angle) * pointerLength;
     const pointerY = Math.sin(angle) * pointerLength;
     
     this.frontseatDragDial.fillStyle(0x00ff00);
     this.frontseatDragDial.fillRect(-3, -knobRadius + 10, 6, pointerLength);
     
     // Rotate the pointer
     this.frontseatDragDial.setRotation(angle);
   }

   private updateRoadPosition() {
     if (!this.drivingBackground || !this.drivingMode) return;
     
     // Calculate road offset based on position (0-100% maps to -200 to 200 pixels)
     const maxOffset = 200;
     const roadOffset = ((this.position - 50) / 50) * maxOffset; // Center at 50%
     
     // Move the entire driving background horizontally
     this.drivingBackground.setX(roadOffset);
     
     // Update car position to stay centered on screen
     if (this.drivingCar) {
       const gameWidth = this.cameras.main.width;
       this.drivingCar.setX(gameWidth / 2);
     }
   }

   private updateKnobReturn() {
     if (this.isKnobActive) return;
     
     // Gradually return knobValue to neutral (0)
     const returnSpeed = 3; // Speed of return
     
     if (Math.abs(this.knobValue) > 1) {
       // Move toward neutral
       this.knobValue = this.knobValue > 0 ? 
         Math.max(0, this.knobValue - returnSpeed) : 
         Math.min(0, this.knobValue + returnSpeed);
     } else {
       // Close enough to neutral, set to 0 and stop timer
       this.knobValue = 0;
       this.stopKnobReturnTimer();
     }
     
     // Update the knob visual to match the reactive value
     this.updateKnobVisual();
   }

   private updateRoadPosition() {
     if (!this.drivingBackground || !this.drivingMode) return;
     
     // Calculate road offset based on position (0-100% maps to -200 to 200 pixels)
     const maxOffset = 200;
     const roadOffset = ((this.position - 50) / 50) * maxOffset; // Center at 50%
     
     // Move the entire driving background horizontally
     this.drivingBackground.setX(roadOffset);
     
     // Update car position to stay centered on screen
     if (this.drivingCar) {
       const gameWidth = this.cameras.main.width;
       this.drivingCar.setX(gameWidth / 2);
     }
   }

   private updateKnobVisual() {
     if (!this.frontseatDragDial) return;
     
     // Clear the knob graphics
     this.frontseatDragDial.clear();
     
     const knobRadius = 60;
     
     // Draw the knob base
     this.frontseatDragDial.fillStyle(0x666666);
     this.frontseatDragDial.fillCircle(0, 0, knobRadius);
     this.frontseatDragDial.lineStyle(3, 0xffffff, 1);
     this.frontseatDragDial.strokeCircle(0, 0, knobRadius);
     
     // Draw the pointer rotated based on knobValue
     const angle = (this.knobValue / 100) * Math.PI; // Convert to radians
     
     this.frontseatDragDial.fillStyle(0x00ff00);
     this.frontseatDragDial.fillRect(-3, -knobRadius + 10, 6, 20);
     
     // Rotate the pointer
     this.frontseatDragDial.setRotation(angle);
   }

   // Method to start the game (called from AppScene)
  public startGame() {
    this.gameStarted = true;
    console.log('GameScene: Game started! Controls are now enabled.');
    
    // Start the countdown timer
    this.startCountdownTimer();
    
    // Update instructions text
    const instructions = this.children.getByName('instructions') as Phaser.GameObjects.Text;
    if (instructions) {
      instructions.setText('Arrow Keys: Navigate seats\nDown: Show overlay\nUp: Hide overlay\nM: Menu\nS: Story\nSwipe Left/Right: Switch seats\nSwipe Up/Down: Camera\n\nGAME STARTED!');
    }
  }

     private startCountdownTimer() {
     // Don't create an automatic timer - countdown will be step-based
     console.log('Countdown timer ready for step-based updates');
   }

     private updateCountdown() {
     if (this.gameTime > 0) {
       this.gameTime--;
       console.log(`Countdown step: ${this.gameTime}, countdownText exists: ${!!this.countdownText}`);
       if (this.countdownText) {
         this.countdownText.setText(this.gameTime.toString());
         console.log(`Updated countdown text to: ${this.gameTime}`);
       } else {
         console.log('countdownText is null or undefined');
       }
     } else {
       // Timer finished
       console.log('Countdown finished!');
     }
   }

   // Public method to trigger a countdown step
   public stepCountdown() {
     this.updateCountdown();
   }

   private onStepEvent(stepNumber: number) {
     console.log(`GameScene received step event: ${stepNumber}`);
     this.stepCountdown();
     
     // Add progress if driving mode is active
     if (this.drivingMode) {
       this.updateProgress(this.progress + 1);
       console.log(`Progress increased to ${this.progress}% while driving`);
     }
   }

   private onGamePaused() {
     console.log('GameScene: Game paused - stopping driving visualization');
     if (this.drivingMode) {
       this.stopDriving();
       // Note: shouldAutoRestartDriving flag remains true
     }
   }

   private onGameResumed() {
     console.log('GameScene: Game resumed');
     // Auto-restart driving if it was active before pause
     if (this.shouldAutoRestartDriving && !this.drivingMode) {
       this.startDriving();
       console.log('Auto-restarted driving after resume');
     }
   }

   private updateStops(increment: number = 1) {
     this.stops += increment;
     if (this.stopsText) {
       this.stopsText.setText(`Stops: ${this.stops}`);
     }
   }

   private updateProgress(newProgress: number) {
     this.progress = Math.max(0, Math.min(100, newProgress));
     if (this.progressText) {
       this.progressText.setText(`Progress: ${this.progress}%`);
          }
   }

   private keepPhysicsContainersInPlace() {
     // Ensure physics containers stay at their original positions
     // Frontseat container should stay at (0, 0)
     // Backseat container should stay at (gameWidth, 0)
     const gameWidth = this.cameras.main.width;
     
     if (this.frontseatPhysicsContainer) {
       this.frontseatPhysicsContainer.setPosition(0, 0);
     }
     if (this.backseatPhysicsContainer) {
       this.backseatPhysicsContainer.setPosition(gameWidth, 0);
     }
   }

   public getDragDialValue(): number {
     return this.frontseatDragDial ? this.frontseatDragDial.value : 0;
   }

   public setDragDialValue(value: number): void {
     if (this.frontseatDragDial) {
       this.frontseatDragDial.setValue(value);
     }
   }

   public getSteeringValue(): number {
     return this.frontseatDragDial ? this.frontseatDragDial.value : 0;
   }

   public setSteeringValue(value: number): void {
     if (this.frontseatDragDial) {
       this.frontseatDragDial.setValue(value);
     }
   }

   public getDrivingSteeringValue(): number {
     return this.currentSteeringValue;
   }

   private toggleDrivingMode() {
     if (this.drivingMode) {
       this.stopDriving();
     } else {
       this.startDriving();
     }
   }

   private startDriving() {
     this.drivingMode = true;
     this.shouldAutoRestartDriving = true; // Set flag to auto-restart on resume
     console.log('Starting driving...');
     
     // Reset car state
     this.carSpeed = 0;
     this.carX = this.cameras.main.width / 2;
     if (this.drivingCar) {
       this.drivingCar.setX(this.carX);
     }
     
     // Start forward movement timer
     this.startForwardMovementTimer();
     
     // Start neutral return timer
     this.startNeutralReturnTimer();
     
     // Update button text
     this.updateDrivingButtonText();
   }

   private stopDriving() {
     this.drivingMode = false;
     console.log('Stopping driving...');
     
     // Stop car movement
     this.carSpeed = 0;
     
     // Stop forward movement timer
     this.stopForwardMovementTimer();
     
     // Stop neutral return timer
     this.stopNeutralReturnTimer();
     
     // Update button text
     this.updateDrivingButtonText();
   }

   private startNeutralReturnTimer() {
     // Create a timer that gradually returns knob to neutral position
     this.neutralReturnTimer = this.time.addEvent({
       delay: 50, // Update every 50ms for smooth return
       callback: this.updateNeutralReturn,
       callbackScope: this,
       loop: true
     });
   }

   private stopNeutralReturnTimer() {
     if (this.neutralReturnTimer) {
       this.neutralReturnTimer.remove();
       this.neutralReturnTimer = null;
     }
   }

   private updateNeutralReturn() {
     if (!this.drivingMode || !this.frontseatDragDial || this.isKnobActive) return;
     
     // Gradually return to neutral position (0)
     const currentValue = this.frontseatDragDial.value;
     if (Math.abs(currentValue) > 1) {
       const returnSpeed = 2; // Speed of return (higher = faster)
       const newValue = currentValue > 0 ? 
         Math.max(0, currentValue - returnSpeed) : 
         Math.min(0, currentValue + returnSpeed);
       
       this.frontseatDragDial.setValue(newValue);
       this.currentSteeringValue = newValue;
     }
   }

   private startForwardMovementTimer() {
     // Create a timer that updates forward movement every frame
     this.forwardMovementTimer = this.time.addEvent({
       delay: 16, // ~60 FPS
       callback: this.updateForwardMovement,
       callbackScope: this,
       loop: true
     });
   }

   private stopForwardMovementTimer() {
     if (this.forwardMovementTimer) {
       this.forwardMovementTimer.remove();
       this.forwardMovementTimer = null;
     }
   }

   private updateForwardMovement() {
     if (!this.drivingMode) return;
     
     // Gradually increase car speed
     this.carSpeed = Math.min(this.carSpeed + 0.1, 5); // Gradually accelerate to max speed
     
     // Move road lines to create forward motion effect
     this.updateRoadLines();
     
     // Update car position based on current steering value
     this.updateCarPosition();
   }

   private updateCarPosition() {
     if (!this.drivingMode || !this.drivingCar) return;
     
     // Use the current steering value to update car position
     const normalizedValue = this.currentSteeringValue / 100;
     const steeringSensitivity = 2; // Reduced sensitivity for smoother movement
     
     // Update car position based on steering
     this.carX += normalizedValue * steeringSensitivity;
     
     // Clamp car position to road boundaries
     const gameWidth = this.cameras.main.width;
     this.carX = Phaser.Math.Clamp(this.carX, 50, gameWidth - 50);
     
     // Update car visual position
     this.drivingCar.setX(this.carX);
   }

   private createDrivingBackground() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Create driving container that will move with the camera but stay behind UI
     this.drivingBackground = this.add.container(0, 0);
     this.drivingBackground.setDepth(-1000); // Behind UI elements but above other content
     
     // Create sky
     const sky = this.add.rectangle(0, 0, gameWidth, gameHeight / 2, 0x87CEEB);
     sky.setOrigin(0);
     this.drivingBackground.add(sky);
     
     // Create road
     this.drivingRoad = this.add.rectangle(0, gameHeight / 2, gameWidth, gameHeight / 2, 0x333333);
     this.drivingRoad.setOrigin(0);
     this.drivingBackground.add(this.drivingRoad);
     
     // Create road lines
     const lineWidth = 8;
     const lineHeight = 40;
     const lineGap = 80;
     
     for (let x = gameWidth / 2 - lineWidth / 2; x < gameWidth; x += lineGap) {
       const line = this.add.rectangle(x, gameHeight / 2 + 50, lineWidth, lineHeight, 0xffffff);
       this.drivingRoadLines.push(line);
       this.drivingBackground.add(line);
     }
     
     // Create the car
     this.createDrivingCar();
     
     // Add driving background to the scene (not gameContentContainer) so it moves with camera independently
     this.add.existing(this.drivingBackground);
     
     console.log('Driving background created as separate container');
   }

   private createDrivingCar() {
     const gameWidth = this.cameras.main.width;
     const gameHeight = this.cameras.main.height;
     
     // Create car (simple rectangle for now)
     this.drivingCar = this.add.rectangle(gameWidth / 2, gameHeight - 80, 40, 20, 0xff0000);
     this.drivingCar.setOrigin(0.5);
     this.drivingBackground.add(this.drivingCar);
     
     // Initialize car position
     this.carX = gameWidth / 2;
     this.carSpeed = 0;
   }

   private handleDrivingSteeringInput(steeringValue: number) {
     // Store the current steering value for continuous updates
     this.currentSteeringValue = steeringValue;
     
     // Convert steering wheel value (-100 to 100) to steering direction
     const normalizedValue = steeringValue / 100; // Convert to -1 to 1 range
     
     console.log('Driving steering input:', normalizedValue);
     
     if (normalizedValue < -0.1) {
       console.log('Driving LEFT:', Math.abs(normalizedValue));
     } else if (normalizedValue > 0.1) {
       console.log('Driving RIGHT:', normalizedValue);
     } else {
       console.log('Driving CENTER');
     }
   }

   private updateRoadLines() {
     // Move road lines down to create forward motion effect
     this.drivingRoadLines.forEach((line) => {
       line.y += this.carSpeed;
       
       // Reset line position when it goes off screen
       if (line.y > this.cameras.main.height) {
         line.y = this.cameras.main.height / 2 + 50;
       }
     });
   }

   private updateDrivingButtonText() {
     // Find the driving button text and update it
     const drivingButtonText = this.gameContentContainer.getByName('drivingButtonText') as Phaser.GameObjects.Text;
     if (drivingButtonText) {
       const buttonText = this.drivingMode ? 'STOP DRIVING' : 'START DRIVING';
       drivingButtonText.setText(buttonText);
     }
   }
}

