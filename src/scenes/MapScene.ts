import Phaser from 'phaser';

export class MapScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MapScene' });
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // MAP OVERLAY CONTENT (positioned 50% down the screen)
    const mapTitle = this.add.text(centerX, centerY + 320, 'MAP OVERLAY', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    mapTitle.setOrigin(0.5);

    const mapSubtitle = this.add.text(centerX, centerY + 370, 'Navigation system', {
      fontSize: '18px',
      color: '#cccccc'
    });
    mapSubtitle.setOrigin(0.5);

    const mapHint = this.add.text(centerX, centerY + 580, 'Up: Return to main view', {
      fontSize: '14px',
      color: '#888888'
    });
    mapHint.setOrigin(0.5);

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
