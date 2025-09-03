import Phaser from 'phaser';

export class FrontseatScene extends Phaser.Scene {
  private currentView: string = 'main'; // 'main' or 'overlay'

  constructor() {
    super({ key: 'FrontseatScene' });
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Create a large clickable sprite at the top (80% width, 20% height)
    const spriteWidth = gameWidth * 0.8;
    const spriteHeight = gameHeight * 0.2;
    const spriteX = centerX;
    const spriteY = spriteHeight / 2; // Position at top of screen

    // Create a graphics object as the sprite (temporary placeholder)
    const graphics = this.add.graphics();
    graphics.fillStyle(0x4444ff, 0.7); // Blue with transparency
    graphics.fillRect(spriteX - spriteWidth / 2, spriteY - spriteHeight / 2, spriteWidth, spriteHeight);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRect(spriteX - spriteWidth / 2, spriteY - spriteHeight / 2, spriteWidth, spriteHeight);

    // Make it interactive
    graphics.setInteractive(new Phaser.Geom.Rectangle(spriteX - spriteWidth / 2, spriteY - spriteHeight / 2, spriteWidth, spriteHeight), Phaser.Geom.Rectangle.Contains);

    // Add click handler
    graphics.on('pointerdown', () => {
      // Emit event to GameScene to switch to backseat
      this.events.emit('switchToBackseat');
    });

    // Add text to indicate it's clickable
    const clickText = this.add.text(spriteX, spriteY, 'Click to switch to backseat', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    clickText.setOrigin(0.5);

    // FRONT SEAT CONTENT (main view)
    const frontseatTitle = this.add.text(centerX, centerY - 30, 'FRONT SEAT', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    frontseatTitle.setOrigin(0.5);

    const frontseatSubtitle = this.add.text(centerX, centerY + 20, 'Driver position', {
      fontSize: '18px',
      color: '#cccccc'
    });
    frontseatSubtitle.setOrigin(0.5);

    const frontseatHint = this.add.text(centerX, gameHeight - 60, 'Right: Move to backseat | Down: View Map', {
      fontSize: '14px',
      color: '#888888'
    });
    frontseatHint.setOrigin(0.5);

    // Listen for camera movement events from GameScene
    this.events.on('showOverlay', (velocity?: number) => {
      // Move camera down to show overlay content (affects both main and overlay)
      const duration = velocity ? (320 / velocity) * 1000 : 500; // Calculate duration based on velocity
      this.cameras.main.pan(centerX, centerY + 320, duration);
    });

    this.events.on('hideOverlay', (velocity?: number) => {
      // Move camera back up to show main content (affects both main and overlay)
      const duration = velocity ? (320 / velocity) * 1000 : 500; // Calculate duration based on velocity
      this.cameras.main.pan(centerX, centerY, duration);
    });
  }
}

