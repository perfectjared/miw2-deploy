import Phaser from 'phaser';

export class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

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
    this.events.on('showOverlay', () => {
      // Move camera down to show overlay content
      this.cameras.main.pan(centerX, centerY + 320, 500);
    });

    this.events.on('hideOverlay', () => {
      // Move camera back up to show main content
      this.cameras.main.pan(centerX, centerY, 500);
    });
  }
}
