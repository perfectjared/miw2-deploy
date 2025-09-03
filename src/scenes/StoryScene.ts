import Phaser from 'phaser';

export class StoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StoryScene' });
  }

  create() {
    // Add story content (HUD is now handled by GameScene)
    const storyText = this.add.text(10, 70, 'Story content goes here...', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
  }
}
