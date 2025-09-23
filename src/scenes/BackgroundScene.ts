import Phaser from 'phaser';

export class BackgroundScene extends Phaser.Scene {
  private tilesprite!: Phaser.GameObjects.TileSprite;

  constructor() {
    super({ key: 'BackgroundScene' });
  }

  create() {
    // Create a scrolling tilesprite background
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    
    this.tilesprite = this.add.tileSprite(0, 0, gameWidth, gameHeight, 'x');
    this.tilesprite.setOrigin(0, 0);
    this.tilesprite.setScrollFactor(0); // Fixed to camera
    this.tilesprite.setDepth(0); // Set depth
    
    // Hide this scene from the main camera - only visible to window cameras
    this.cameras.main.setVisible(false);
    
    // Set up scrolling animation
    this.events.on('postupdate', () => {
      this.tilesprite.tilePositionX -= 0.5; // Scroll right
      this.tilesprite.tilePositionY += 0.3; // Scroll up
    });
  }
}