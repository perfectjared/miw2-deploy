import Phaser from 'phaser';

export class BackseatScene extends Phaser.Scene {
  private currentView: string = 'main'; // 'main' or 'overlay'
  private switchButton!: Phaser.GameObjects.Graphics;
  private clickText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private gameStarted: boolean = false;

  constructor() {
    super({ key: 'BackseatScene' });
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth + (gameWidth / 2); // Center within the right half
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

    // Store reference to the button
    this.switchButton = graphics;

    // Make it interactive (but disabled until game starts)
    graphics.setInteractive(new Phaser.Geom.Rectangle(spriteX - spriteWidth / 2, spriteY - spriteHeight / 2, spriteWidth, spriteHeight), Phaser.Geom.Rectangle.Contains);

    // Add click handler
    graphics.on('pointerdown', () => {
      if (!this.gameStarted) return; // Disable until game starts
      // Emit event to GameScene to switch to frontseat
      this.events.emit('switchToFrontseat');
    });

    // Add text to indicate it's clickable
    const clickText = this.add.text(spriteX, spriteY, 'Click to switch to frontseat (GAME NOT STARTED)', {
      fontSize: '14px', // Smaller font since button is smaller
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
      console.log('BackseatScene: Game started! Button is now enabled.');
      
      // Update the button text
      this.clickText.setText('Click to switch to frontseat');
    });
  }
}
