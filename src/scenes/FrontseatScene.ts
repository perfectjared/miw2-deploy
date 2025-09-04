import Phaser from 'phaser';

export class FrontseatScene extends Phaser.Scene {
  private currentView: string = 'main'; // 'main' or 'overlay'
  private timeText!: Phaser.GameObjects.Text;
  private switchButton!: Phaser.GameObjects.Graphics;
  private clickText!: Phaser.GameObjects.Text;
  private gameStarted: boolean = false;

  constructor() {
    super({ key: 'FrontseatScene' });
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2; // Center within the left half
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

    // Store reference to the button
    this.switchButton = graphics;

    // Make it interactive (but disabled until game starts)
    graphics.setInteractive(new Phaser.Geom.Rectangle(spriteX - spriteWidth / 2, spriteY - spriteHeight / 2, spriteWidth, spriteHeight), Phaser.Geom.Rectangle.Contains);

    // Add click handler
    graphics.on('pointerdown', () => {
      if (!this.gameStarted) return; // Disable until game starts
      // Emit event to GameScene to switch to backseat
      this.events.emit('switchToBackseat');
    });

    // Add text to indicate it's clickable
    const clickText = this.add.text(spriteX, spriteY, 'Click to switch to backseat (GAME NOT STARTED)', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    this.clickText = clickText;
    clickText.setName('clickText');
    clickText.setOrigin(0.5);

    // Add time display below the sprite
    this.timeText = this.add.text(spriteX, spriteY + spriteHeight / 2 + 20, 'Time: 99', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    this.timeText.setOrigin(0.5);

    // FRONT SEAT CONTENT (main view)
    const frontseatTitle = this.add.text(centerX, centerY - 30, 'FRONT SEAT', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    frontseatTitle.setOrigin(0.5);

    const frontseatHint = this.add.text(centerX, gameHeight - 60, 'Right: Move to backseat | Down: View Map', {
      fontSize: '14px',
      color: '#888888'
    });
    frontseatHint.setOrigin(0.5);

    // Listen for camera movement events from GameScene
    // Note: Camera movement is now handled by GameScene, so we don't need to do anything here
    this.events.on('showOverlay', (velocity?: number) => {
      // Camera movement handled by GameScene
    });

    this.events.on('hideOverlay', (velocity?: number) => {
      // Camera movement handled by GameScene
    });

    // Listen for time updates from GameScene
    this.events.on('updateTime', (time: number) => {
      this.timeText.setText(`Time: ${time}`);
    });

    // Listen for game start event
    this.events.on('gameStarted', () => {
      this.gameStarted = true;
      console.log('FrontseatScene: Game started! Button is now enabled.');
      
      // Update the button text
      this.clickText.setText('Click to switch to backseat');
    });
  }
}

