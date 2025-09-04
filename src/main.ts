// Phaser is loaded globally via script tag
import { PreloadScene } from './scenes/PreloadScene';
import { BackgroundScene } from './scenes/BackgroundScene';
import { AppScene } from './scenes/AppScene';
import { MenuScene } from './scenes/MenuScene';
import { StoryScene } from './scenes/StoryScene';
import { GameScene } from './scenes/GameScene';
import { DrivingScene } from './scenes/DrivingScene';
//import { FrontseatScene } from './scenes/FrontseatScene';
//import { BackseatScene } from './scenes/BackseatScene';
//import { MapScene } from './scenes/MapScene';
//import { InventoryScene } from './scenes/InventoryScene';

// Debug: Check if RexUI is available
console.log('rexuiplugin available:', (window as any).rexuiplugin);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  parent: 'game',
  backgroundColor: '#facade',
  scene: [PreloadScene, BackgroundScene, AppScene, MenuScene, StoryScene, GameScene, DrivingScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 360,
    height: 640,
    min: {
      width: 180,
      height: 320
    },
    max: {
      width: 720,
      height: 1280
    }
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  plugins: {
    scene: [
      {
        key: 'rexUI',
        plugin: (window as any).rexuiplugin,
        mapping: 'rexUI'
      }
    ]
  }
};

new Phaser.Game(config);
