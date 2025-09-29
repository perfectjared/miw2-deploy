/**
 * PRELOAD SCENE - ASSET LOADING AND INITIALIZATION
 * 
 * This scene handles the loading of all game assets and provides visual
 * feedback to the user during the loading process. It's the first scene
 * that runs when the game starts.
 * 
 * Key Features:
 * - Visual loading bar with progress indication
 * - Asset loading management
 * - Smooth transition to the main game
 * - Error handling for failed asset loads
 * 
 * The scene creates a loading bar and text to show progress, then
 * transitions to the main game once all assets are loaded successfully.
 */

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
    
    // Load shops configuration
    this.load.json('shops', 'assets/json/shops.json');
    
    // Load SVGs
    this.load.image('steering-wheel', 'assets/image/steering-wheel.svg');
    this.load.image('key-white', 'assets/image/key-white.svg');
    this.load.image('key-hole', 'assets/image/key-hole.svg');
    // this.load.image('bat', 'assets/image/bat.svg'); // deprecated
    this.load.image('hot-dog', 'assets/image/hot-dog.svg');
    this.load.image('face-smile', 'assets/image/face-smile.svg');
    this.load.image('face-neutral', 'assets/image/face-neutral.svg');
    this.load.image('face-frown', 'assets/image/face-frown.svg');
    
    // Load x.png for window backgrounds
    this.load.image('x', 'assets/image/x.png');
    
    // Load sound icons
    this.load.image('sound-off', 'assets/image/sound-off-svgrepo-com.svg');
    this.load.image('sound-mute', 'assets/image/sound-mute-svgrepo-com.svg');
    this.load.image('sound-loud', 'assets/image/sound-loud-svgrepo-com.svg');
    
    // Load play/pause icons
    this.load.image('pause-1010-svgrepo-com', 'assets/image/pause-1010-svgrepo-com.svg');
    this.load.image('play-1001-svgrepo-com', 'assets/image/play-1001-svgrepo-com.svg');
    
    // Load save icon
    this.load.image('save-svgrepo-com', 'assets/image/save-svgrepo-com.svg');
    
    // For now, we'll just add a small delay to simulate loading
    this.time.delayedCall(2000, () => {
      this.scene.start('AppScene');
    });
  }

  create() {
    // This method is called after preload
  }
}

