import Phaser from 'phaser';

export class AppScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AppScene' });
  }

  create() {
    // Add app overlay text (always visible on top)
    const appText = this.add.text(10, 10, 'APP LAYER (TOP)', {
      fontSize: '16px',
      color: '#00ff00',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    appText.setScrollFactor(0);
    appText.setDepth(2000);

    // Launch background scene (bottom layer)
    this.scene.launch('BackgroundScene');
    
    // Launch game scene (main game logic)
    this.scene.launch('GameScene');

    // Set up keyboard controls for overlay scenes
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyM':
          this.scene.launch('MenuScene');
          break;
        case 'KeyS':
          this.scene.launch('StoryScene');
          break;
      }
    });
  }
}
