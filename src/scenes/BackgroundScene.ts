import Phaser from 'phaser';

export class BackgroundScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BackgroundScene' });
  }

  create() {
    // Get the game dimensions
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;

    // Create a simple background pattern
    const graphics = this.add.graphics();
    
    // Create a subtle grid pattern
    graphics.lineStyle(1, 0x333333, 0.3);
    for (let x = 0; x < gameWidth; x += 40) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, gameHeight);
    }
    for (let y = 0; y < gameHeight; y += 40) {
      graphics.moveTo(0, y);
      graphics.lineTo(gameWidth, y);
    }
    graphics.stroke();
  }
}
