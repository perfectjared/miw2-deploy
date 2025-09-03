import Phaser from 'phaser';

export class BackseatScene extends Phaser.Scene {
  private currentView: string = 'main'; // 'main' or 'overlay'

  constructor() {
    super({ key: 'BackseatScene' });
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Create a large clickable sprite at the top (80% width, 10% height)
    const spriteWidth = gameWidth * 0.8;
    const spriteHeight = gameHeight * 0.1; // 10% height instead of 20%
    const spriteX = centerX;
    const spriteY = spriteHeight / 2; // Position at top of screen

    // Create a graphics object as the sprite (temporary placeholder)
    const graphics = this.add.graphics();
    graphics.fillStyle(0x44ff44, 0.7); // Green with transparency (different color from frontseat)
    graphics.fillRect(spriteX - spriteWidth / 2, spriteY - spriteHeight / 2, spriteWidth, spriteHeight);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRect(spriteX - spriteWidth / 2, spriteY - spriteHeight / 2, spriteWidth, spriteHeight);

    // Make it interactive
    graphics.setInteractive(new Phaser.Geom.Rectangle(spriteX - spriteWidth / 2, spriteY - spriteHeight / 2, spriteWidth, spriteHeight), Phaser.Geom.Rectangle.Contains);

    // Add click handler
    graphics.on('pointerdown', () => {
      // Emit event to GameScene to switch to frontseat
      this.events.emit('switchToFrontseat');
    });

    // Add text to indicate it's clickable
    const clickText = this.add.text(spriteX, spriteY, 'Click to switch to frontseat', {
      fontSize: '14px', // Smaller font since button is smaller
      color: '#ffffff',
      fontStyle: 'bold'
    });
    clickText.setOrigin(0.5);

    // BACK SEAT CONTENT (main view)
    const backseatTitle = this.add.text(centerX, centerY - 30, 'BACK SEAT', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    backseatTitle.setOrigin(0.5);

    const backseatSubtitle = this.add.text(centerX, centerY + 20, 'Passenger position', {
      fontSize: '18px',
      color: '#cccccc'
    });
    backseatSubtitle.setOrigin(0.5);

    const backseatHint = this.add.text(centerX, gameHeight - 60, 'Left: Move to frontseat | Down: View Inventory', {
      fontSize: '14px',
      color: '#888888'
    });
    backseatHint.setOrigin(0.5);

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
