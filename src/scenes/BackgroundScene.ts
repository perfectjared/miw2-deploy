/**
 * BACKGROUND SCENE - VISUAL BACKGROUND LAYER
 * 
 * This scene provides a simple visual background for the game. It creates
 * a subtle grid pattern that gives the game a structured, organized feel.
 * 
 * Key Features:
 * - Grid pattern background for visual structure
 * - Lightweight rendering (minimal performance impact)
 * - Consistent visual foundation for other scenes
 * 
 * The background is rendered once and remains static, providing a
 * stable visual foundation for the interactive elements in other scenes.
 */

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
