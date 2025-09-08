import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // Get the game dimensions
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Create a loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(centerX - 160, centerY - 25, 320, 50);

    const loadingText = this.make.text({
      x: centerX,
      y: centerY - 50,
      text: 'LOADING SCENE',
      style: {
        font: '24px monospace',
        color: '#ffffff',
        fontStyle: 'bold'
      }
    });
    loadingText.setOrigin(0.5, 0.5);

    const percentText = this.make.text({
      x: centerX,
      y: centerY - 5,
      text: '0%',
      style: {
        font: '14px monospace',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);

    const assetText = this.make.text({
      x: centerX,
      y: centerY + 50,
      text: 'Loading assets...',
      style: {
        font: '12px monospace',
        color: '#cccccc'
      }
    });
    assetText.setOrigin(0.5, 0.5);

    // Update progress bar
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(centerX - 150, centerY - 15, 300 * value, 30);
      percentText.setText(Math.floor(value * 100) + '%');
    });

    this.load.on('fileprogress', (file: any) => {
      assetText.setText('Loading asset: ' + file.key);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
    });

    // Load your assets here
    // Load the game configuration file
    this.load.json('gameConfig', 'config/game-config.json');
    
    // For now, we'll just add a small delay to simulate loading
    this.time.delayedCall(2000, () => {
      this.scene.start('AppScene');
    });
  }

  create() {
    // This method is called after preload
  }
}

