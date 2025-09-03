import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    // Add menu content (HUD is now handled by GameScene)
    const menuText = this.add.text(10, 130, 'Menu content goes here...', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    menuText.setScrollFactor(0);
    menuText.setDepth(1000); // Ensure it's on top
  }
}
