import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  private currentPosition: string = 'frontseat'; // 'frontseat' or 'backseat'
  private currentView: string = 'main'; // 'main' or 'overlay'

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
    gameText.setDepth(1000);

    // Launch frontseat scene first
    this.scene.launch('FrontseatScene');
    this.scene.launch('MapScene'); // Launch map overlay for frontseat
    this.currentPosition = 'frontseat';
    this.currentView = 'main';

    // Listen for scene switching events from FrontseatScene
    const frontseatScene = this.scene.get('FrontseatScene');
    frontseatScene.events.on('switchToBackseat', () => {
      this.switchToBackseat();
    });

    // Listen for scene switching events from BackseatScene
    const backseatScene = this.scene.get('BackseatScene');
    backseatScene.events.on('switchToFrontseat', () => {
      this.switchToFrontseat();
    });

    // Set up keyboard controls for navigation
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
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
      'Arrow Keys: Navigate seats\nDown: Show overlay\nUp: Hide overlay\nM: Menu\nS: Story\nSwipe Left/Right: Switch seats\nSwipe Up/Down: Camera', 
      {
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    );
    instructions.setScrollFactor(0);
    instructions.setDepth(1000);
  }

  private setupSwipeControls() {
    // Create custom swipe detection using Phaser's input system
    let startX = 0;
    let startY = 0;
    let startTime = 0;
    const minSwipeDistance = 30; // Reduced from 50 to make it less strict
    const maxSwipeTime = 500; // Increased from 300ms to give more time

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      startX = pointer.x;
      startY = pointer.y;
      startTime = Date.now();
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
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
          
          // Inverted direction logic: up swipe = show overlay, down swipe = hide overlay
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
      this.scene.sleep('FrontseatScene');
      this.scene.sleep('MapScene'); // Sleep the map overlay
      this.scene.launch('BackseatScene');
      this.scene.launch('InventoryScene'); // Launch the inventory overlay
      this.currentPosition = 'backseat';
      this.currentView = 'main';
    }
  }

  private switchToFrontseat() {
    if (this.currentPosition === 'backseat') {
      this.scene.sleep('BackseatScene');
      this.scene.sleep('InventoryScene'); // Sleep the inventory overlay
      this.scene.launch('FrontseatScene');
      this.scene.launch('MapScene'); // Launch the map overlay
      this.currentPosition = 'frontseat';
      this.currentView = 'main';
    }
  }

  private showOverlay(velocity?: number) {
    if (this.currentView === 'main') {
      // Get the current active scene and tell it to show overlay
      const currentScene = this.currentPosition === 'frontseat' ? 'FrontseatScene' : 'BackseatScene';
      const scene = this.scene.get(currentScene);
      scene.events.emit('showOverlay', velocity);
      
      // Also emit to the overlay scene
      const overlayScene = this.currentPosition === 'frontseat' ? 'MapScene' : 'InventoryScene';
      const overlay = this.scene.get(overlayScene);
      overlay.events.emit('showOverlay', velocity);
      
      this.currentView = 'overlay';
    }
  }

  private hideOverlay(velocity?: number) {
    if (this.currentView === 'overlay') {
      // Get the current active scene and tell it to hide overlay
      const currentScene = this.currentPosition === 'frontseat' ? 'FrontseatScene' : 'BackseatScene';
      const scene = this.scene.get(currentScene);
      scene.events.emit('hideOverlay', velocity);
      
      // Also emit to the overlay scene
      const overlayScene = this.currentPosition === 'frontseat' ? 'MapScene' : 'InventoryScene';
      const overlay = this.scene.get(overlayScene);
      overlay.events.emit('hideOverlay', velocity);
      
      this.currentView = 'main';
    }
  }
}

