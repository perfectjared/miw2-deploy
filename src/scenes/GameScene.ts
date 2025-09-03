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

    // Add instructions text
    const instructions = this.add.text(10, 70, 
      'Arrow Keys: Navigate seats\nDown: Show overlay\nUp: Hide overlay\nM: Menu\nS: Story', 
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

  private showOverlay() {
    if (this.currentView === 'main') {
      // Get the current active scene and tell it to show overlay
      const currentScene = this.currentPosition === 'frontseat' ? 'FrontseatScene' : 'BackseatScene';
      const scene = this.scene.get(currentScene);
      scene.events.emit('showOverlay');
      
      // Also emit to the overlay scene
      const overlayScene = this.currentPosition === 'frontseat' ? 'MapScene' : 'InventoryScene';
      const overlay = this.scene.get(overlayScene);
      overlay.events.emit('showOverlay');
      
      this.currentView = 'overlay';
    }
  }

  private hideOverlay() {
    if (this.currentView === 'overlay') {
      // Get the current active scene and tell it to hide overlay
      const currentScene = this.currentPosition === 'frontseat' ? 'FrontseatScene' : 'BackseatScene';
      const scene = this.scene.get(currentScene);
      scene.events.emit('hideOverlay');
      
      // Also emit to the overlay scene
      const overlayScene = this.currentPosition === 'frontseat' ? 'MapScene' : 'InventoryScene';
      const overlay = this.scene.get(overlayScene);
      overlay.events.emit('hideOverlay');
      
      this.currentView = 'main';
    }
  }
}

