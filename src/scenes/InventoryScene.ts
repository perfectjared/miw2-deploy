import Phaser from 'phaser';

export class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth + (gameWidth / 2); // Center within the right half (with BackseatScene)
    const centerY = gameHeight;

    // INVENTORY OVERLAY CONTENT (positioned 50% down the screen)
    const inventoryTitle = this.add.text(centerX, centerY + 320, 'INVENTORY OVERLAY', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    inventoryTitle.setOrigin(0.5);

    const inventorySubtitle = this.add.text(centerX, centerY + 370, 'Item management', {
      fontSize: '18px',
      color: '#cccccc'
    });
    inventoryTitle.setOrigin(0.5);

    const inventoryHint = this.add.text(centerX, centerY + 580, 'Up: Return to main view', {
      fontSize: '14px',
      color: '#888888'
    });
    inventoryHint.setOrigin(0.5);

    // Listen for camera movement events from GameScene
    // Note: Camera movement is now handled by GameScene, so we don't need to do anything here
    this.events.on('showOverlay', (velocity?: number) => {
      // Camera movement handled by GameScene
    });

    this.events.on('hideOverlay', (velocity?: number) => {
      // Camera movement handled by GameScene
    });
  }
}
